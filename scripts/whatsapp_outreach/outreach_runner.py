#!/usr/bin/env python3
"""
WhatsApp No-Answer Re-engagement Automation

Sends a 2-message sequence to leads stuck in 'no_answer' status.
Day 1: Initial outreach message
Day 2: Follow-up (if no reply detected)
After Day 2 with no reply: Move to 'constant_no_answer'

Runs daily at 10:00 AM IST via GitHub Actions.

Usage:
    uv run outreach_runner.py              # Production run
    uv run outreach_runner.py --dry-run    # Preview without sending
"""

import argparse
import logging
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

import httpx
from dotenv import load_dotenv
from supabase import create_client, Client

# ============================================
# Configuration
# ============================================

CRM_DIR = Path(__file__).parent.parent.parent
load_dotenv(CRM_DIR / ".env.local")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", os.environ.get("SUPABASE_URL", ""))
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SUPABASE_SERVICE_KEY", ""))

GREEN_API_ID = os.environ.get("GREEN_API_ID_INSTANCE", "")
GREEN_API_TOKEN = os.environ.get("GREEN_API_TOKEN", "")
GREEN_API_BASE = f"https://api.green-api.com/waInstance{GREEN_API_ID}"

WHATSAPP_GROUP_ID = "120363421984042234@g.us"

# Tables (use dev_ prefix in dev mode)
BYPASS_AUTH = os.environ.get("BYPASS_AUTH", "").lower() == "true"
LEADS_TABLE = "dev_leads" if BYPASS_AUTH else "leads"
OUTREACH_TABLE = "whatsapp_outreach"

# Message templates
DAY_1_MESSAGE = "היי 👋 ניסינו ליצור איתך קשר בנוגע להחזר מס שאתה עשוי להיות זכאי לו. נשמח לעזור! אפשר להשיב להודעה הזו ונחזור אליך בהקדם."
DAY_2_MESSAGE = "שלום, רצינו לוודא שקיבלת את ההודעה שלנו. אם יש לך שאלות לגבי החזרי מס, אנחנו כאן בשבילך. פשוט השב להודעה הזו 🙏"

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("outreach")


# ============================================
# Phone normalization (inline from phone_normalize.py)
# ============================================

def normalize_phone(phone: Optional[str]) -> Optional[str]:
    """Normalize Israeli phone to 10-digit format (05XXXXXXXX)."""
    if not phone:
        return None
    digits = re.sub(r"\D", "", phone)
    if not digits:
        return None
    if digits.startswith("972"):
        digits = "0" + digits[3:]
    if len(digits) == 9 and digits.startswith("5"):
        digits = "0" + digits
    if len(digits) == 10 and digits.startswith("05"):
        return digits
    if len(digits) >= 9 and digits.startswith("0"):
        return digits
    return digits if len(digits) >= 7 else None


def phone_to_whatsapp(phone: Optional[str]) -> Optional[str]:
    """Convert normalized phone to WhatsApp chat ID format (972XXXXXXXXX@c.us)."""
    normalized = normalize_phone(phone)
    if not normalized:
        return None
    # Remove leading 0, add 972 prefix
    digits = normalized.lstrip("0")
    return f"972{digits}@c.us"


# ============================================
# Green API functions (inline, minimal)
# ============================================

_http = httpx.Client(timeout=30)


def _green_url(method: str) -> str:
    return f"{GREEN_API_BASE}/{method}/{GREEN_API_TOKEN}"


def check_whatsapp(phone: str) -> bool:
    """Check if a phone number is registered on WhatsApp."""
    normalized = normalize_phone(phone)
    if not normalized:
        return False
    phone_number = int("972" + normalized.lstrip("0"))
    try:
        resp = _http.post(
            _green_url("checkWhatsapp"),
            json={"phoneNumber": phone_number},
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("existsWhatsapp", False)
    except Exception as e:
        log.warning(f"check_whatsapp failed for {phone}: {e}")
        return False


def send_message(phone: str, text: str) -> bool:
    """Send a WhatsApp message to a phone number."""
    chat_id = phone_to_whatsapp(phone)
    if not chat_id:
        log.warning(f"Cannot build chat ID for phone: {phone}")
        return False
    try:
        resp = _http.post(
            _green_url("sendMessage"),
            json={"chatId": chat_id, "message": text},
        )
        resp.raise_for_status()
        return True
    except Exception as e:
        log.error(f"send_message failed for {phone}: {e}")
        return False


def send_group_message(group_id: str, text: str) -> bool:
    """Send a message to a WhatsApp group."""
    try:
        resp = _http.post(
            _green_url("sendMessage"),
            json={"chatId": group_id, "message": text},
        )
        resp.raise_for_status()
        return True
    except Exception as e:
        log.error(f"send_group_message failed: {e}")
        return False


def get_chat_history(phone: str, count: int = 10) -> list[dict]:
    """Get chat history with a phone number. Returns list of messages."""
    chat_id = phone_to_whatsapp(phone)
    if not chat_id:
        return []
    try:
        resp = _http.post(
            _green_url("getChatHistory"),
            json={"chatId": chat_id, "count": count},
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        log.warning(f"get_chat_history failed for {phone}: {e}")
        return []


def has_incoming_reply_since(phone: str, since: datetime) -> bool:
    """Check if there's an incoming message from the lead since a given time."""
    messages = get_chat_history(phone, count=20)
    for msg in messages:
        # Green API incoming messages have type "incoming"
        if msg.get("type") != "incoming":
            continue
        msg_time = msg.get("timestamp")
        if msg_time:
            msg_dt = datetime.fromtimestamp(msg_time, tz=timezone.utc)
            if msg_dt >= since:
                return True
    return False


# ============================================
# Supabase helpers
# ============================================

def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
        sys.exit(1)
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def get_eligible_leads(sb: Client) -> list[dict[str, Any]]:
    """Get leads in no_answer status created in the last 30 days."""
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    result = (
        sb.table(LEADS_TABLE)
        .select("id, name, phone, status, created_at")
        .eq("status", "no_answer")
        .gte("created_at", thirty_days_ago)
        .is_("deleted_at", "null")
        .execute()
    )
    return result.data or []


def get_outreach_history(sb: Client, lead_ids: list[str]) -> dict[str, list[dict]]:
    """Get outreach history for given leads, grouped by lead_id."""
    if not lead_ids:
        return {}
    result = (
        sb.table(OUTREACH_TABLE)
        .select("*")
        .in_("lead_id", lead_ids)
        .order("message_number")
        .execute()
    )
    history: dict[str, list[dict]] = {}
    for row in result.data or []:
        lid = row["lead_id"]
        history.setdefault(lid, []).append(row)
    return history


def insert_outreach(sb: Client, lead_id: str, message_number: int, message_text: str) -> None:
    """Insert a new outreach record."""
    sb.table(OUTREACH_TABLE).insert({
        "lead_id": lead_id,
        "message_number": message_number,
        "message_text": message_text,
    }).execute()


def mark_replied(sb: Client, outreach_id: str) -> None:
    """Mark an outreach record as replied."""
    sb.table(OUTREACH_TABLE).update({
        "replied": True,
        "replied_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", outreach_id).execute()


def update_lead_status(sb: Client, lead_id: str, new_status: str) -> None:
    """Update lead status in the CRM."""
    sb.table(LEADS_TABLE).update({
        "status": new_status,
    }).eq("id", lead_id).execute()


def get_current_lead_status(sb: Client, lead_id: str) -> Optional[str]:
    """Re-fetch lead status to ensure it hasn't changed."""
    result = (
        sb.table(LEADS_TABLE)
        .select("status")
        .eq("id", lead_id)
        .single()
        .execute()
    )
    return result.data.get("status") if result.data else None


# ============================================
# Main outreach logic
# ============================================

def run_outreach(dry_run: bool = False) -> dict[str, int]:
    """Execute the daily outreach run. Returns summary counters."""
    sb = get_supabase()

    counters = {
        "day1_sent": 0,
        "day2_sent": 0,
        "replies_detected": 0,
        "moved_to_constant": 0,
        "skipped_no_whatsapp": 0,
        "skipped_status_changed": 0,
    }

    # 1. Get eligible leads
    leads = get_eligible_leads(sb)
    log.info(f"Found {len(leads)} eligible leads in no_answer status")

    if not leads:
        return counters

    # 2. Get outreach history
    lead_ids = [lead["id"] for lead in leads]
    history = get_outreach_history(sb, lead_ids)

    # 3. Process each lead
    for lead in leads:
        lead_id = lead["id"]
        phone = lead.get("phone")
        name = lead.get("name", "Unknown")
        lead_history = history.get(lead_id, [])
        messages_sent = len(lead_history)

        if not phone:
            log.info(f"Skipping {name} — no phone number")
            continue

        log.info(f"Processing {name} ({phone}) — {messages_sent} messages sent")

        if messages_sent == 0:
            # --- Day 1: First contact ---
            if not dry_run:
                if not check_whatsapp(phone):
                    log.info(f"  → {name} not on WhatsApp, skipping")
                    counters["skipped_no_whatsapp"] += 1
                    continue
                if send_message(phone, DAY_1_MESSAGE):
                    insert_outreach(sb, lead_id, 1, DAY_1_MESSAGE)
                    log.info(f"  → Day 1 message sent to {name}")
                    counters["day1_sent"] += 1
                else:
                    log.warning(f"  → Failed to send Day 1 to {name}")
            else:
                log.info(f"  [DRY RUN] Would send Day 1 message to {name}")
                counters["day1_sent"] += 1

        elif messages_sent == 1:
            # --- Day 2: Follow-up ---
            day1_record = lead_history[0]
            day1_sent_at = datetime.fromisoformat(day1_record["sent_at"])

            # Must wait at least 24h since Day 1
            if datetime.now(timezone.utc) - day1_sent_at < timedelta(hours=23):
                log.info(f"  → Too early for Day 2 ({name}), waiting for 24h since Day 1")
                continue

            # Double-check: is lead still no_answer?
            current_status = get_current_lead_status(sb, lead_id)
            if current_status != "no_answer":
                log.info(f"  → {name} status changed to {current_status}, skipping")
                counters["skipped_status_changed"] += 1
                continue

            # Check for reply via Green API chat history
            if not dry_run and has_incoming_reply_since(phone, day1_sent_at):
                log.info(f"  → Reply detected from {name}! Updating to message_sent")
                update_lead_status(sb, lead_id, "message_sent")
                mark_replied(sb, day1_record["id"])
                counters["replies_detected"] += 1
                continue

            # Send Day 2
            if not dry_run:
                if send_message(phone, DAY_2_MESSAGE):
                    insert_outreach(sb, lead_id, 2, DAY_2_MESSAGE)
                    log.info(f"  → Day 2 message sent to {name}")
                    counters["day2_sent"] += 1
                else:
                    log.warning(f"  → Failed to send Day 2 to {name}")
            else:
                log.info(f"  [DRY RUN] Would send Day 2 message to {name}")
                counters["day2_sent"] += 1

        elif messages_sent >= 2:
            # --- Post Day 2: Final check ---
            day2_record = lead_history[1]
            day2_sent_at = datetime.fromisoformat(day2_record["sent_at"])

            # Must wait at least 24h since Day 2 for final verdict
            if datetime.now(timezone.utc) - day2_sent_at < timedelta(hours=23):
                log.info(f"  → Too early for final check ({name}), waiting for 24h since Day 2")
                continue

            # Re-check status
            current_status = get_current_lead_status(sb, lead_id)
            if current_status != "no_answer":
                log.info(f"  → {name} status changed to {current_status}, skipping")
                counters["skipped_status_changed"] += 1
                continue

            # Final reply check
            if not dry_run and has_incoming_reply_since(phone, day2_sent_at):
                log.info(f"  → Late reply from {name}! Updating to message_sent")
                update_lead_status(sb, lead_id, "message_sent")
                mark_replied(sb, day2_record["id"])
                counters["replies_detected"] += 1
                continue

            # No reply after 2 messages → constant_no_answer
            if not dry_run:
                update_lead_status(sb, lead_id, "constant_no_answer")
                log.info(f"  → {name} moved to constant_no_answer")
            else:
                log.info(f"  [DRY RUN] Would move {name} to constant_no_answer")
            counters["moved_to_constant"] += 1

    return counters


def send_summary(counters: dict[str, int], dry_run: bool = False) -> None:
    """Send summary to WhatsApp group."""
    summary = (
        f"📊 WhatsApp Outreach Summary:\n"
        f"- Day 1 sent: {counters['day1_sent']}\n"
        f"- Day 2 sent: {counters['day2_sent']}\n"
        f"- Replies detected: {counters['replies_detected']}\n"
        f"- Moved to אין מענה קבוע: {counters['moved_to_constant']}"
    )

    if counters.get("skipped_no_whatsapp"):
        summary += f"\n- Skipped (no WhatsApp): {counters['skipped_no_whatsapp']}"
    if counters.get("skipped_status_changed"):
        summary += f"\n- Skipped (status changed): {counters['skipped_status_changed']}"

    log.info(f"Summary:\n{summary}")

    if not dry_run:
        send_group_message(WHATSAPP_GROUP_ID, summary)
    else:
        log.info("[DRY RUN] Would send summary to WhatsApp group")


# ============================================
# Entry point
# ============================================

def main():
    parser = argparse.ArgumentParser(description="WhatsApp no-answer outreach automation")
    parser.add_argument("--dry-run", action="store_true", help="Preview actions without sending messages")
    args = parser.parse_args()

    if args.dry_run:
        log.info("=== DRY RUN MODE ===")

    if not GREEN_API_ID or not GREEN_API_TOKEN:
        log.error("Missing GREEN_API_ID_INSTANCE or GREEN_API_TOKEN")
        sys.exit(1)

    counters = run_outreach(dry_run=args.dry_run)
    send_summary(counters, dry_run=args.dry_run)

    log.info("Done.")


if __name__ == "__main__":
    main()
