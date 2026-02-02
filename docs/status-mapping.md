# Lead Status Mapping

## Source of Truth

**Zoho CRM is the single source of truth for lead statuses.**

All status synchronization flows from Zoho to Supabase. The CRM application displays and allows status changes, but the canonical status values are defined by Zoho.

## Canonical Status List (14 statuses)

| # | English Key | Hebrew | Pipeline Stage |
|---|-------------|--------|----------------|
| 1 | `not_contacted` | טרם יצרנו קשר | follow_up |
| 2 | `no_answer` | אין מענה | follow_up |
| 3 | `message_sent` | נשלחה הודעה | warm |
| 4 | `meeting_set` | נקבעה שיחה | warm |
| 5 | `pending_agreement` | בהמתנה להסכם | warm |
| 6 | `signed` | חתם על הסכם התקשרות | signed |
| 7 | `under_review` | בבדיקה | signed |
| 8 | `report_submitted` | הוגש דוח | signed |
| 9 | `missing_document` | חסר מסמך | signed |
| 10 | `waiting_for_payment` | ממתין להגבייה | signed |
| 11 | `payment_completed` | גבייה הושלמה | signed |
| 12 | `not_relevant` | לא רלוונטי | exit |
| 13 | `closed_elsewhere` | סגר במקום אחר | exit |
| 14 | `future_interest` | מעוניין בעתיד | future |

## Removed Statuses (February 2026)

These statuses were removed and migrated:

| Old Status | Hebrew | Migrated To | Reason |
|------------|--------|-------------|--------|
| `contacted` | נוצר קשר | `message_sent` | Too vague, merged into message_sent |
| `completed` | הושלם | `waiting_for_payment` | Replaced by payment workflow |
| `paying_customer` | לקוח משלם | `payment_completed` | Simplified payment flow |

## Pipeline Stages

```typescript
PIPELINE_STAGES = {
  follow_up: ['not_contacted', 'no_answer'],
  warm: ['message_sent', 'meeting_set', 'pending_agreement'],
  signed: ['signed', 'under_review', 'report_submitted', 'missing_document', 'waiting_for_payment', 'payment_completed'],
  exit: ['not_relevant', 'closed_elsewhere'],
  future: ['future_interest'],
}
```

## Status Flow

Leads typically progress through the pipeline as follows:

```
follow_up -> warm -> signed -> (operational sub-stages) -> payment workflow
                 \-> exit (negative: not_relevant, closed_elsewhere)
                 \-> future
```

### Payment Workflow

After a lead completes the customer process, they enter the payment workflow:

```
signed -> under_review -> report_submitted -> waiting_for_payment -> payment_completed
              \-> missing_document -> (back to review)
```

### Signed Sub-stages (Active Customers)

After a lead signs (`signed`), they can move through operational sub-stages:

```
signed -> under_review -> report_submitted -> waiting_for_payment -> payment_completed
              \-> missing_document -> (back to review)
```

## Synchronization

### Zoho to Supabase Sync

Run the sync script to update Supabase statuses from Zoho:

```bash
# Dry-run (preview changes)
python3 scripts/sync/status_sync.py --dry-run --target prod --days 90

# Actual sync
python3 scripts/sync/status_sync.py --target prod --days 90 --sync-notes --force
```

### Reconciliation Report

Generate a reconciliation report to identify status differences:

```bash
python3 scripts/sync/reconcile.py --report-only --target prod --days 90
```

## Hebrew to English Mapping (reconcile.py)

The `STATUS_MAP` in `scripts/sync/reconcile.py` handles Hebrew to English conversion:

| Hebrew | English |
|--------|---------|
| טרם יצרנו קשר | not_contacted |
| אין מענה | no_answer |
| נשלחה הודעה | message_sent |
| נקבעה שיחה | meeting_set |
| בהמתנה להסכם | pending_agreement |
| חתם על הסכם התקשרות | signed |
| ממתין להגבייה | waiting_for_payment |
| גבייה הושלמה | payment_completed |
| לא רלוונטי | not_relevant |
| סגר במקום אחר | closed_elsewhere |
| מעוניין בעתיד | future_interest |

### Mapped Statuses (Zoho -> CRM)

| Hebrew (Zoho) | Maps To |
|---------------|---------|
| חדש | not_contacted |
| לקוח | signed |
| אבוד | not_relevant |
| נוצר קשר | message_sent |
| הושלם | waiting_for_payment |
| לקוח משלם | payment_completed |
| לפני תיקשרות | not_contacted |
| רלוונטי לשנה הבאה | future_interest |
| נשלח הסכם התקשרות | pending_agreement |
| סגר עם גורם אחר | closed_elsewhere |

## Related Files

- `types/leads.ts` - TypeScript type definitions and STATUS_CONFIG
- `lib/status-utils.ts` - Status utility functions (auto-generates from leads.ts)
- `lib/status-flow.ts` - Status flow configuration for quick actions
- `scripts/sync/reconcile.py` - Reconciliation report generator
- `scripts/sync/status_sync.py` - Zoho to Supabase sync script
