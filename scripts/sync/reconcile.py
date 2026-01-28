#!/usr/bin/env python3
"""
Lead Reconciliation Report Generator

Matches leads between Zoho CRM and Supabase to identify:
1. Matched leads (phone/email match)
2. Unmatched Zoho leads (exist in Zoho but not Supabase)
3. Unmatched Supabase leads (exist in Supabase but not Zoho)
4. Status differences (shows current vs. would-be status)

Usage:
    python scripts/sync/reconcile.py --report-only
    python scripts/sync/reconcile.py --report-only --output report.json
"""

import argparse
import json
import os
import sys
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional
from difflib import SequenceMatcher
from pathlib import Path

import requests
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from scripts.sync.phone_normalize import normalize_phone, phones_match


# ============================================
# Configuration
# ============================================

# Load crm_pointo .env.local for Supabase
CRM_DIR = Path(__file__).parent.parent.parent
load_dotenv(CRM_DIR / ".env.local")

# Load marketing-roi .env for Zoho
# eettract MARKETING_ROI_ENV_PATH from .env.local
MARKETING_ROI_ENV = Path(os.getenv("MARKETING_ROI_ENV_PATH", ""))
if MARKETING_ROI_ENV.exists():
    load_dotenv(MARKETING_ROI_ENV)

# Supabase config
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Zoho config
ZOHO_CLIENT_ID = os.getenv("ZOHO_CLIENT_ID", "")
ZOHO_CLIENT_SECRET = os.getenv("ZOHO_CLIENT_SECRET", "")
ZOHO_REFRESH_TOKEN = os.getenv("ZOHO_REFRESH_TOKEN", "")
ZOHO_REGION = os.getenv("ZOHO_REGION", "us")

# Zoho regional endpoints
ZOHO_REGIONS = {
    "us": "https://www.zohoapis.com",
    "eu": "https://www.zohoapis.eu",
    "in": "https://www.zohoapis.in",
    "au": "https://www.zohoapis.com.au",
}

ZOHO_AUTH_REGIONS = {
    "us": "https://accounts.zoho.com",
    "eu": "https://accounts.zoho.eu",
    "in": "https://accounts.zoho.in",
    "au": "https://accounts.zoho.com.au",
}

# Status mapping from Zoho Hebrew to English
# Note: חדש, לקוח, אבוד are mapped to their replacements
STATUS_MAP = {
    # Standard statuses
    "חתם על הסכם התקשרות": "signed",
    "נקבעה שיחה": "meeting_set",
    "אין מענה": "no_answer",
    "לא רלוונטי": "not_relevant",
    "נשלחה הודעה": "message_sent",
    "טרם יצרנו קשר": "not_contacted",
    "סגר במקום אחר": "closed_elsewhere",
    "מעוניין בעתיד": "future_interest",
    "בהמתנה להסכם": "pending_agreement",
    "נוצר קשר": "contacted",
    # Mapped statuses (these Zoho statuses map to different CRM statuses)
    "חדש": "not_contacted",        # חדש → טרם יצרנו קשר
    "לקוח": "signed",              # לקוח → חתם על הסכם התקשרות
    "אבוד": "not_relevant",        # אבוד → לא רלוונטי
    # Alternative spellings / URL-encoded versions
    "לפני תיקשרות": "not_contacted",
    "לפני_תיקשרות": "not_contacted",
    "רלוונטי לשנה הבאה": "future_interest",
    "רלוונטי_לשנה_הבאה": "future_interest",
    "נשלח הסכם התקשרות": "pending_agreement",
    "נשלח_הסכם_התקשרות": "pending_agreement",
    "סגר עם גורם אחר": "closed_elsewhere",
    "סגר_עם_גורם_אחר": "closed_elsewhere",
}


@dataclass
class ZohoLead:
    """Lead record from Zoho CRM."""
    id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    status: str
    status_raw: str
    created_at: str
    description: Optional[str] = None  # Notes/call logs from Zoho
    normalized_phone: Optional[str] = None

    def __post_init__(self):
        self.normalized_phone = normalize_phone(self.phone)


@dataclass
class SupabaseLead:
    """Lead record from Supabase."""
    id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    status: str
    created_at: str
    custom_fields: Optional[dict] = None
    normalized_phone: Optional[str] = None

    def __post_init__(self):
        self.normalized_phone = normalize_phone(self.phone)


@dataclass
class MatchResult:
    """Result of matching a Zoho lead to Supabase."""
    zoho_id: str
    zoho_name: str
    zoho_status: str
    zoho_phone: Optional[str]
    zoho_email: Optional[str]
    zoho_notes: Optional[str]  # Description/notes from Zoho
    supabase_id: Optional[str]
    supabase_name: Optional[str]
    supabase_status: Optional[str]
    match_type: str  # 'phone', 'email', 'name', 'none'
    match_confidence: float  # 0.0 to 1.0
    status_differs: bool


@dataclass
class ReconciliationReport:
    """Full reconciliation report."""
    generated_at: str
    zoho_lead_count: int
    supabase_lead_count: int
    matched_count: int
    unmatched_zoho_count: int
    unmatched_supabase_count: int
    status_diff_count: int
    matches: list[MatchResult]
    unmatched_zoho: list[dict]
    unmatched_supabase: list[dict]


# ============================================
# Zoho CRM Data Loader
# ============================================

_zoho_access_token: Optional[str] = None
_zoho_api_url: Optional[str] = None


def get_zoho_access_token() -> tuple[str, str]:
    """Get a valid Zoho access token, refreshing if needed."""
    global _zoho_access_token, _zoho_api_url

    if _zoho_access_token and _zoho_api_url:
        return _zoho_access_token, _zoho_api_url

    if not ZOHO_CLIENT_ID or not ZOHO_CLIENT_SECRET or not ZOHO_REFRESH_TOKEN:
        raise Exception("Zoho credentials not configured. Check .env file.")

    # Try configured region first, then others
    regions_to_try = [ZOHO_REGION] if ZOHO_REGION else ["us", "eu", "in", "au"]

    for region in regions_to_try:
        auth_url = ZOHO_AUTH_REGIONS.get(region, ZOHO_AUTH_REGIONS["us"])
        api_url = ZOHO_REGIONS.get(region, ZOHO_REGIONS["us"])

        try:
            token_url = f"{auth_url}/oauth/v2/token"
            token_params = {
                "refresh_token": ZOHO_REFRESH_TOKEN,
                "client_id": ZOHO_CLIENT_ID,
                "client_secret": ZOHO_CLIENT_SECRET,
                "grant_type": "refresh_token"
            }
            response = requests.post(token_url, data=token_params, timeout=30)
            data = response.json()

            if "error" in data:
                print(f"  [WARN] Region {region} auth failed: {data.get('error')}")
                continue

            access_token = data.get("access_token")
            if access_token:
                _zoho_access_token = access_token
                _zoho_api_url = api_url
                print(f"  [OK] Authenticated with Zoho ({region} region)")
                return access_token, api_url

        except Exception as e:
            print(f"  [WARN] Region {region} failed: {e}")
            continue

    raise Exception("Failed to authenticate with Zoho CRM. Check credentials.")


def fetch_zoho_leads_page(page: int = 1, per_page: int = 200) -> dict:
    """Fetch a page of leads from Zoho CRM."""
    access_token, api_url = get_zoho_access_token()

    url = f"{api_url}/crm/v6/Leads"
    headers = {"Authorization": f"Zoho-oauthtoken {access_token}"}
    params = {
        # Include Mobile field as Zoho often stores phone there
        # Include Description for notes/call logs
        "fields": "First_Name,Last_Name,Email,Phone,Mobile,Lead_Source,Lead_Status,Created_Time,utm_source,Description",
        "page": page,
        "per_page": per_page,
        "sort_by": "Created_Time",
        "sort_order": "desc",
    }

    response = requests.get(url, headers=headers, params=params, timeout=30)
    return response.json()


def normalize_zoho_status(status_raw: str) -> str:
    """Normalize a Zoho status (Hebrew) to English key."""
    if not status_raw:
        return "new"
    return STATUS_MAP.get(status_raw.strip(), status_raw.strip().lower().replace(" ", "_"))


def load_zoho_leads(days_back: int = 30) -> list[ZohoLead]:
    """
    Load leads from Zoho CRM.

    Args:
        days_back: Number of days back to fetch leads

    Returns:
        List of ZohoLead objects
    """
    from datetime import timedelta

    print(f"  Fetching Zoho leads (last {days_back} days)...")

    cutoff_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days_back)

    all_leads = []
    page = 1
    max_pages = 50  # Safety limit

    while page <= max_pages:
        try:
            response = fetch_zoho_leads_page(page=page)

            if "data" not in response:
                if "code" in response:
                    print(f"  [ERROR] Zoho API error: {response.get('message', response.get('code'))}")
                break

            leads = response["data"]
            if not leads:
                break

            for lead in leads:
                created_str = lead.get("Created_Time", "")
                try:
                    # Parse Zoho datetime format
                    created = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
                    if created.replace(tzinfo=None) < cutoff_date:
                        # Leads are sorted desc, so we can stop when we're past the cutoff
                        print(f"  Reached cutoff date, stopping at page {page}")
                        break
                except Exception:
                    pass

                first_name = lead.get("First_Name", "") or ""
                last_name = lead.get("Last_Name", "") or ""
                name = f"{first_name} {last_name}".strip() or "Unknown"

                status_raw = lead.get("Lead_Status", "") or ""
                status = normalize_zoho_status(status_raw)

                # Try Phone first, fall back to Mobile
                phone = lead.get("Phone") or lead.get("Mobile")

                all_leads.append(ZohoLead(
                    id=lead.get("id", ""),
                    name=name,
                    email=lead.get("Email"),
                    phone=phone,
                    status=status,
                    status_raw=status_raw,
                    created_at=created_str,
                    description=lead.get("Description"),
                ))

            # Check if there's more data
            info = response.get("info", {})
            if not info.get("more_records"):
                break

            page += 1
            print(f"  Fetched page {page - 1}, total: {len(all_leads)} leads")

        except Exception as e:
            print(f"  [ERROR] Fetching page {page}: {e}")
            break

    print(f"  Total Zoho leads loaded: {len(all_leads)}")
    return all_leads


# ============================================
# Supabase Data Loader
# ============================================

def load_supabase_leads(target: str = 'dev') -> list[SupabaseLead]:
    """
    Load leads from Supabase.

    Args:
        target: 'dev' for dev_leads table, 'prod' for leads table

    Returns:
        List of SupabaseLead objects
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise Exception("Supabase credentials not configured. Check .env.local file.")

    table = "dev_leads" if target == "dev" else "leads"
    print(f"  Fetching from Supabase table: {table}...")

    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    params = {
        "select": "id,name,email,phone,status,created_at,custom_fields",
        "deleted_at": "is.null",
        "order": "created_at.desc",
    }

    response = requests.get(url, headers=headers, params=params, timeout=30)

    if response.status_code != 200:
        print(f"  [ERROR] Supabase error: {response.status_code} - {response.text}")
        return []

    data = response.json()

    leads = []
    for row in data:
        leads.append(SupabaseLead(
            id=row.get("id", ""),
            name=row.get("name", ""),
            email=row.get("email"),
            phone=row.get("phone"),
            status=row.get("status", "new"),
            created_at=row.get("created_at", ""),
            custom_fields=row.get("custom_fields"),
        ))

    print(f"  Total Supabase leads loaded: {len(leads)}")
    return leads


# ============================================
# Matching Logic
# ============================================

def fuzzy_name_match(name1: Optional[str], name2: Optional[str], threshold: float = 0.85) -> tuple[bool, float]:
    """
    Check if two names match using fuzzy matching.
    """
    if not name1 or not name2:
        return False, 0.0

    n1 = ' '.join(name1.lower().split())
    n2 = ' '.join(name2.lower().split())

    ratio = SequenceMatcher(None, n1, n2).ratio()
    return ratio >= threshold, ratio


def find_supabase_match(
    zoho_lead: ZohoLead,
    supabase_leads: list[SupabaseLead],
    matched_supabase_ids: set[str]
) -> tuple[Optional[SupabaseLead], str, float]:
    """
    Find matching Supabase lead for a Zoho lead.

    Matching priority:
    1. Phone (normalized) - highest confidence
    2. Email (case-insensitive) - medium confidence
    3. Name (fuzzy match) - lower confidence
    """
    # 1. Try phone match (highest priority)
    if zoho_lead.normalized_phone:
        for sb_lead in supabase_leads:
            if sb_lead.id in matched_supabase_ids:
                continue
            if sb_lead.normalized_phone and sb_lead.normalized_phone == zoho_lead.normalized_phone:
                return sb_lead, 'phone', 1.0

    # 2. Try email match (secondary)
    if zoho_lead.email:
        zoho_email_lower = zoho_lead.email.lower().strip()
        for sb_lead in supabase_leads:
            if sb_lead.id in matched_supabase_ids:
                continue
            if sb_lead.email and sb_lead.email.lower().strip() == zoho_email_lower:
                return sb_lead, 'email', 0.9

    # 3. Try name match (fuzzy, lowest priority)
    best_name_match: Optional[tuple[SupabaseLead, float]] = None
    for sb_lead in supabase_leads:
        if sb_lead.id in matched_supabase_ids:
            continue
        is_match, score = fuzzy_name_match(zoho_lead.name, sb_lead.name, threshold=0.85)
        if is_match:
            if best_name_match is None or score > best_name_match[1]:
                best_name_match = (sb_lead, score)

    if best_name_match:
        return best_name_match[0], 'name', best_name_match[1] * 0.7

    return None, 'none', 0.0


def generate_reconciliation_report(
    zoho_leads: list[ZohoLead],
    supabase_leads: list[SupabaseLead]
) -> ReconciliationReport:
    """
    Generate a reconciliation report matching Zoho and Supabase leads.
    """
    matches: list[MatchResult] = []
    matched_supabase_ids: set[str] = set()

    print("\n  Matching leads...")
    for i, zoho_lead in enumerate(zoho_leads):
        sb_match, match_type, confidence = find_supabase_match(
            zoho_lead, supabase_leads, matched_supabase_ids
        )

        if sb_match:
            matched_supabase_ids.add(sb_match.id)
            status_differs = zoho_lead.status != sb_match.status

            matches.append(MatchResult(
                zoho_id=zoho_lead.id,
                zoho_name=zoho_lead.name,
                zoho_status=zoho_lead.status,
                zoho_phone=zoho_lead.phone,
                zoho_email=zoho_lead.email,
                zoho_notes=zoho_lead.description,
                supabase_id=sb_match.id,
                supabase_name=sb_match.name,
                supabase_status=sb_match.status,
                match_type=match_type,
                match_confidence=confidence,
                status_differs=status_differs,
            ))
        else:
            matches.append(MatchResult(
                zoho_id=zoho_lead.id,
                zoho_name=zoho_lead.name,
                zoho_status=zoho_lead.status,
                zoho_phone=zoho_lead.phone,
                zoho_email=zoho_lead.email,
                zoho_notes=zoho_lead.description,
                supabase_id=None,
                supabase_name=None,
                supabase_status=None,
                match_type='none',
                match_confidence=0.0,
                status_differs=False,
            ))

        if (i + 1) % 50 == 0:
            print(f"    Processed {i + 1}/{len(zoho_leads)} Zoho leads...")

    # Find unmatched Supabase leads
    unmatched_supabase = [
        {'id': sb.id, 'name': sb.name, 'phone': sb.phone, 'email': sb.email, 'status': sb.status}
        for sb in supabase_leads
        if sb.id not in matched_supabase_ids
    ]

    # Find unmatched Zoho leads
    unmatched_zoho = [
        {'id': m.zoho_id, 'name': m.zoho_name, 'phone': m.zoho_phone, 'email': m.zoho_email, 'status': m.zoho_status}
        for m in matches
        if m.match_type == 'none'
    ]

    status_diff_count = sum(1 for m in matches if m.status_differs)

    return ReconciliationReport(
        generated_at=datetime.now().isoformat(),
        zoho_lead_count=len(zoho_leads),
        supabase_lead_count=len(supabase_leads),
        matched_count=len([m for m in matches if m.supabase_id]),
        unmatched_zoho_count=len(unmatched_zoho),
        unmatched_supabase_count=len(unmatched_supabase),
        status_diff_count=status_diff_count,
        matches=matches,
        unmatched_zoho=unmatched_zoho,
        unmatched_supabase=unmatched_supabase,
    )


# ============================================
# Output Functions
# ============================================

def print_report(report: ReconciliationReport) -> None:
    """Print a human-readable summary of the reconciliation report."""
    print("\n" + "=" * 60)
    print("LEAD RECONCILIATION REPORT")
    print("=" * 60)
    print(f"Generated: {report.generated_at}")
    print()

    print("SUMMARY")
    print("-" * 40)
    print(f"Zoho leads:           {report.zoho_lead_count}")
    print(f"Supabase leads:       {report.supabase_lead_count}")
    print(f"Matched:              {report.matched_count}")
    print(f"Unmatched (Zoho):     {report.unmatched_zoho_count}")
    print(f"Unmatched (Supabase): {report.unmatched_supabase_count}")
    print(f"Status differences:   {report.status_diff_count}")
    print()

    if report.zoho_lead_count > 0:
        match_rate = (report.matched_count / report.zoho_lead_count) * 100
        print(f"Match rate: {match_rate:.1f}%")
    print()

    # Match type breakdown
    match_types = {}
    for m in report.matches:
        if m.supabase_id:
            match_types[m.match_type] = match_types.get(m.match_type, 0) + 1

    if match_types:
        print("MATCH TYPE BREAKDOWN")
        print("-" * 40)
        for mtype, count in sorted(match_types.items(), key=lambda x: -x[1]):
            print(f"  {mtype}: {count}")
        print()

    # Show matches with status differences
    if report.status_diff_count > 0:
        print("STATUS DIFFERENCES (will be updated)")
        print("-" * 40)
        for m in report.matches[:20]:  # Show first 20
            if m.status_differs:
                print(f"  {m.zoho_name}")
                print(f"    Zoho status:     {m.zoho_status}")
                print(f"    Supabase status: {m.supabase_status}")
                print(f"    Match type:      {m.match_type} ({m.match_confidence:.0%})")
                print()
        if report.status_diff_count > 20:
            print(f"  ... and {report.status_diff_count - 20} more")
        print()

    # Show unmatched Zoho leads
    if report.unmatched_zoho:
        print("UNMATCHED ZOHO LEADS (in Zoho but not Supabase)")
        print("-" * 40)
        for lead in report.unmatched_zoho[:10]:
            print(f"  {lead['name']} | {lead['phone']} | {lead['status']}")
        if len(report.unmatched_zoho) > 10:
            print(f"  ... and {len(report.unmatched_zoho) - 10} more")
        print()

    # Show unmatched Supabase leads
    if report.unmatched_supabase:
        print("UNMATCHED SUPABASE LEADS (in Supabase but not Zoho)")
        print("-" * 40)
        for lead in report.unmatched_supabase[:10]:
            print(f"  {lead['name']} | {lead['phone']} | {lead['status']}")
        if len(report.unmatched_supabase) > 10:
            print(f"  ... and {len(report.unmatched_supabase) - 10} more")
        print()

    print("=" * 60)


def save_report(report: ReconciliationReport, output_path: str) -> None:
    """Save the reconciliation report to a JSON file."""
    report_dict = {
        'generated_at': report.generated_at,
        'summary': {
            'zoho_lead_count': report.zoho_lead_count,
            'supabase_lead_count': report.supabase_lead_count,
            'matched_count': report.matched_count,
            'unmatched_zoho_count': report.unmatched_zoho_count,
            'unmatched_supabase_count': report.unmatched_supabase_count,
            'status_diff_count': report.status_diff_count,
        },
        'matches': [asdict(m) for m in report.matches],
        'unmatched_zoho': report.unmatched_zoho,
        'unmatched_supabase': report.unmatched_supabase,
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(report_dict, f, ensure_ascii=False, indent=2)

    print(f"\nReport saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description='Generate lead reconciliation report')
    parser.add_argument('--report-only', action='store_true', help='Only generate report, no changes')
    parser.add_argument('--output', '-o', type=str, help='Output JSON file path')
    parser.add_argument('--target', choices=['dev', 'prod'], default='dev', help='Target Supabase table')
    parser.add_argument('--days', type=int, default=30, help='Days back to fetch from Zoho')

    args = parser.parse_args()

    print("=" * 60)
    print("LEAD RECONCILIATION")
    print("=" * 60)

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
        print("\n[WARNING] No Zoho leads loaded.")
        return

    if not supabase_leads:
        print("\n[WARNING] No Supabase leads loaded.")

    print("\nGenerating reconciliation report...")
    report = generate_reconciliation_report(zoho_leads, supabase_leads)

    print_report(report)

    if args.output:
        save_report(report, args.output)


if __name__ == '__main__':
    main()
