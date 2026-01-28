#!/usr/bin/env python3
"""
Status Migration Script

Migrates leads from deprecated statuses to their replacements:
- new → not_contacted
- customer → signed
- lost → not_relevant
"""

import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

# Load environment
CRM_DIR = Path(__file__).parent.parent.parent
load_dotenv(CRM_DIR / ".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

MIGRATIONS = [
    ("new", "not_contacted"),
    ("customer", "signed"),
    ("lost", "not_relevant"),
]

def migrate_status(old_status: str, new_status: str) -> int:
    """Migrate leads from old_status to new_status."""
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    # Get leads with old status
    get_url = f"{SUPABASE_URL}/rest/v1/leads?status=eq.{old_status}&deleted_at=is.null&select=id,name"
    response = requests.get(get_url, headers=headers, timeout=30)

    if response.status_code != 200:
        print(f"  Error fetching leads: {response.text}")
        return 0

    leads = response.json()
    if not leads:
        print(f"  No leads with status '{old_status}'")
        return 0

    print(f"  Found {len(leads)} leads to migrate")

    # Update each lead
    success = 0
    for lead in leads:
        update_url = f"{SUPABASE_URL}/rest/v1/leads?id=eq.{lead['id']}"
        update_response = requests.patch(
            update_url,
            headers={**headers, "Prefer": "return=minimal"},
            json={"status": new_status},
            timeout=30
        )
        if update_response.status_code in [200, 204]:
            success += 1
            print(f"    ✓ {lead['name']}")
        else:
            print(f"    ✗ {lead['name']}: {update_response.text}")

    return success

def main():
    print("=" * 50)
    print("STATUS MIGRATION")
    print("=" * 50)

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Error: Supabase credentials not found")
        sys.exit(1)

    total = 0
    for old_status, new_status in MIGRATIONS:
        print(f"\n{old_status} → {new_status}")
        count = migrate_status(old_status, new_status)
        total += count

    print(f"\n{'=' * 50}")
    print(f"Migration complete: {total} leads updated")
    print("=" * 50)

if __name__ == "__main__":
    main()
