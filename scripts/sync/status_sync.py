#!/usr/bin/env python3
"""
Lead Status Synchronization from Zoho to Supabase

This module syncs lead statuses from Zoho CRM to Supabase, using the
reconciliation report to determine which leads to update.

Features:
- Dry-run mode to preview changes
- Dev/prod targeting
- Automatic lead_events logging
- zoho_id storage in custom_fields

Usage:
    # Dry-run sync (show what would change)
    python scripts/sync/status_sync.py --dry-run --target dev

    # Actual sync to dev tables
    python scripts/sync/status_sync.py --target dev

    # Sync to production (after validation)
    python scripts/sync/status_sync.py --target prod
"""

import argparse
import json
import os
import sys
from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from pathlib import Path

import requests
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from scripts.sync.reconcile import (
    ZohoLead,
    SupabaseLead,
    MatchResult,
    generate_reconciliation_report,
    load_zoho_leads,
    load_supabase_leads,
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
)


# Valid statuses in our system (14 canonical statuses)
VALID_STATUSES = {
    # Follow-up
    'not_contacted', 'no_answer',
    # Warm
    'contacted', 'message_sent',
    # Hot
    'meeting_set', 'pending_agreement',
    # Signed (active customers)
    'signed', 'under_review', 'report_submitted', 'missing_document', 'completed',
    # Lost
    'not_relevant', 'closed_elsewhere',
    # Future
    'future_interest',
}


@dataclass
class StatusUpdate:
    """A pending status update."""
    supabase_id: str
    lead_name: str
    old_status: str
    new_status: str
    zoho_id: str
    zoho_notes: Optional[str]  # Notes/call logs from Zoho
    match_type: str
    match_confidence: float


@dataclass
class SyncResult:
    """Result of a sync operation."""
    success: bool
    updates_attempted: int
    updates_succeeded: int
    updates_failed: int
    errors: list[str]


def get_pending_updates(matches: list[MatchResult], include_notes_only: bool = False) -> list[StatusUpdate]:
    """
    Get list of updates to perform.

    Includes matches where:
    1. A Supabase match was found
    2. The status differs OR (include_notes_only and has zoho_notes)
    3. The Zoho status is valid
    """
    updates: list[StatusUpdate] = []

    for match in matches:
        # Skip unmatched leads
        if not match.supabase_id:
            continue

        # Include if status differs OR if we have notes to sync
        has_notes = bool(match.zoho_notes and match.zoho_notes.strip())
        should_include = match.status_differs or (include_notes_only and has_notes)

        if not should_include:
            continue

        # Validate status
        new_status = match.zoho_status
        if new_status not in VALID_STATUSES:
            print(f"  [WARN] Unknown status '{new_status}' for lead {match.zoho_name}, skipping")
            continue

        updates.append(StatusUpdate(
            supabase_id=match.supabase_id,
            lead_name=match.zoho_name,
            old_status=match.supabase_status or 'unknown',
            new_status=new_status,
            zoho_id=match.zoho_id,
            zoho_notes=match.zoho_notes,
            match_type=match.match_type,
            match_confidence=match.match_confidence,
        ))

    return updates


def print_pending_updates(updates: list[StatusUpdate]) -> None:
    """Print a summary of pending updates."""
    print("\n" + "=" * 60)
    print("PENDING UPDATES")
    print("=" * 60)

    if not updates:
        print("No updates needed - all statuses are in sync!")
        return

    # Count status changes vs notes-only
    status_changes = sum(1 for u in updates if u.old_status != u.new_status)
    with_notes = sum(1 for u in updates if u.zoho_notes)

    print(f"Total updates: {len(updates)}")
    print(f"  - Status changes: {status_changes}")
    print(f"  - With notes: {with_notes}")
    print("-" * 60)

    for i, update in enumerate(updates, 1):
        status_change = "→" if update.old_status != update.new_status else "="
        has_notes = "📝" if update.zoho_notes else ""
        print(f"{i}. {update.lead_name} {has_notes}")
        print(f"   Status: {update.old_status} {status_change} {update.new_status}")
        if update.zoho_notes:
            # Show first 60 chars of notes
            notes_preview = update.zoho_notes[:60].replace('\n', ' ')
            if len(update.zoho_notes) > 60:
                notes_preview += "..."
            print(f"   Notes: {notes_preview}")
        print()

    print("=" * 60)


def apply_updates_dry_run(updates: list[StatusUpdate]) -> SyncResult:
    """
    Simulate applying updates (dry run).
    """
    print("\n[DRY RUN] The following updates would be applied:")
    print("-" * 40)

    for update in updates:
        print(f"  UPDATE: {update.lead_name}")
        if update.old_status != update.new_status:
            print(f"    Status: {update.old_status} -> {update.new_status}")
        print(f"    Add zoho_id to custom_fields: {update.zoho_id}")
        if update.zoho_notes:
            print(f"    Add zoho_notes: {update.zoho_notes[:50]}...")
        print()

    return SyncResult(
        success=True,
        updates_attempted=len(updates),
        updates_succeeded=len(updates),
        updates_failed=0,
        errors=[],
    )


def apply_single_update(update: StatusUpdate, target: str) -> tuple[bool, str]:
    """
    Apply a single status update to Supabase.

    Returns:
        Tuple of (success, error_message)
    """
    table = "dev_leads" if target == "dev" else "leads"
    events_table = "dev_lead_events" if target == "dev" else "lead_events"

    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    try:
        # Step 1: Get current custom_fields
        get_url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{update.supabase_id}&select=custom_fields"
        get_response = requests.get(get_url, headers=headers, timeout=30)

        if get_response.status_code != 200:
            return False, f"Failed to fetch lead: {get_response.text}"

        data = get_response.json()
        if not data:
            return False, "Lead not found"

        current_custom_fields = data[0].get("custom_fields") or {}

        # Step 2: Update lead with new status, zoho_id, and notes
        updated_custom_fields = {**current_custom_fields, "zoho_id": update.zoho_id}
        if update.zoho_notes:
            updated_custom_fields["zoho_notes"] = update.zoho_notes

        update_url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{update.supabase_id}"
        update_data = {
            "status": update.new_status,
            "custom_fields": updated_custom_fields,
            "updated_at": datetime.now().isoformat(),
        }

        update_response = requests.patch(update_url, headers=headers, json=update_data, timeout=30)

        if update_response.status_code not in [200, 204]:
            return False, f"Failed to update lead: {update_response.text}"

        # Step 3: Insert lead_event for audit trail
        event_url = f"{SUPABASE_URL}/rest/v1/{events_table}"
        event_data = {
            "lead_id": update.supabase_id,
            "event_type": "status_changed",
            "field_name": "status",
            "old_value": update.old_status,
            "new_value": update.new_status,
            "user_email": "sync@zoho-reconciliation",
            "metadata": {
                "source": "zoho_sync",
                "zoho_id": update.zoho_id,
                "match_type": update.match_type,
                "match_confidence": update.match_confidence,
            },
        }

        event_response = requests.post(event_url, headers=headers, json=event_data, timeout=30)

        if event_response.status_code not in [200, 201, 204]:
            # Log warning but don't fail the update
            print(f"    [WARN] Failed to create event: {event_response.text}")

        return True, ""

    except Exception as e:
        return False, str(e)


def apply_updates(updates: list[StatusUpdate], target: str) -> SyncResult:
    """
    Apply status updates to Supabase.
    """
    print(f"\n[SYNC] Applying {len(updates)} updates to {target}...")

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return SyncResult(
            success=False,
            updates_attempted=len(updates),
            updates_succeeded=0,
            updates_failed=len(updates),
            errors=["Supabase credentials not configured"],
        )

    errors: list[str] = []
    succeeded = 0
    failed = 0

    for i, update in enumerate(updates, 1):
        success, error_msg = apply_single_update(update, target)

        if success:
            succeeded += 1
            print(f"  [{i}/{len(updates)}] OK: {update.lead_name} ({update.old_status} -> {update.new_status})")
        else:
            failed += 1
            error = f"Failed to update {update.lead_name}: {error_msg}"
            errors.append(error)
            print(f"  [{i}/{len(updates)}] FAIL: {error}")

    return SyncResult(
        success=failed == 0,
        updates_attempted=len(updates),
        updates_succeeded=succeeded,
        updates_failed=failed,
        errors=errors,
    )


def save_sync_log(updates: list[StatusUpdate], result: SyncResult, output_path: str) -> None:
    """Save sync operation log to a JSON file."""
    log = {
        'timestamp': datetime.now().isoformat(),
        'result': {
            'success': result.success,
            'updates_attempted': result.updates_attempted,
            'updates_succeeded': result.updates_succeeded,
            'updates_failed': result.updates_failed,
            'errors': result.errors,
        },
        'updates': [
            {
                'supabase_id': u.supabase_id,
                'lead_name': u.lead_name,
                'old_status': u.old_status,
                'new_status': u.new_status,
                'zoho_id': u.zoho_id,
                'match_type': u.match_type,
                'match_confidence': u.match_confidence,
            }
            for u in updates
        ],
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(log, f, ensure_ascii=False, indent=2)

    print(f"\nSync log saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description='Sync lead statuses and notes from Zoho to Supabase')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without applying')
    parser.add_argument('--target', choices=['dev', 'prod'], default='dev', help='Target environment')
    parser.add_argument('--output', '-o', type=str, help='Output JSON log file')
    parser.add_argument('--force', action='store_true', help='Skip confirmation prompt')
    parser.add_argument('--days', type=int, default=30, help='Days back to fetch from Zoho')
    parser.add_argument('--sync-notes', action='store_true', help='Also sync notes for leads without status changes')

    args = parser.parse_args()

    print("=" * 60)
    print("ZOHO -> SUPABASE SYNC" + (" (with notes)" if args.sync_notes else ""))
    print("=" * 60)

    # Load data
    print("\nLoading Zoho leads...")
    try:
        zoho_leads = load_zoho_leads(days_back=args.days)
    except Exception as e:
        print(f"[ERROR] Failed to load Zoho leads: {e}")
        return

    print(f"\nLoading Supabase leads (target={args.target})...")
    try:
        supabase_leads = load_supabase_leads(args.target)
    except Exception as e:
        print(f"[ERROR] Failed to load Supabase leads: {e}")
        return

    if not zoho_leads:
        print("\n[ERROR] No Zoho leads loaded.")
        return

    if not supabase_leads:
        print("\n[ERROR] No Supabase leads loaded.")
        return

    # Generate reconciliation report
    print("\nGenerating reconciliation report...")
    report = generate_reconciliation_report(zoho_leads, supabase_leads)

    # Get pending updates
    updates = get_pending_updates(report.matches, include_notes_only=args.sync_notes)

    # Print summary
    print_pending_updates(updates)

    if not updates:
        print("\nNo updates needed!")
        return

    # Dry run or actual sync
    if args.dry_run:
        result = apply_updates_dry_run(updates)
        print("\n[DRY RUN COMPLETE] No changes were made.")
    else:
        # Confirmation prompt
        if not args.force:
            print(f"\nAbout to apply {len(updates)} status updates to {args.target.upper()}.")
            confirm = input("Are you sure you want to proceed? (yes/no): ")
            if confirm.lower() != 'yes':
                print("Aborted.")
                return

        result = apply_updates(updates, args.target)

        # Print results
        print("\n" + "=" * 60)
        print("SYNC RESULTS")
        print("=" * 60)
        print(f"Success: {result.success}")
        print(f"Updates attempted: {result.updates_attempted}")
        print(f"Updates succeeded: {result.updates_succeeded}")
        print(f"Updates failed: {result.updates_failed}")

        if result.errors:
            print("\nErrors:")
            for error in result.errors:
                print(f"  - {error}")

    # Save log if requested
    if args.output:
        save_sync_log(updates, result, args.output)


if __name__ == '__main__':
    main()
