# Lead Status Mapping

## Source of Truth

**Zoho CRM is the single source of truth for lead statuses.**

All status synchronization flows from Zoho to Supabase. The CRM application displays and allows status changes, but the canonical status values are defined by Zoho.

## Canonical Status List (14 statuses)

| # | English Key | Hebrew | Pipeline Stage |
|---|-------------|--------|----------------|
| 1 | `not_contacted` | טרם יצרנו קשר | follow_up |
| 2 | `no_answer` | אין מענה | follow_up |
| 3 | `contacted` | נוצר קשר | warm |
| 4 | `message_sent` | נשלחה הודעה | warm |
| 5 | `meeting_set` | נקבעה שיחה | hot |
| 6 | `pending_agreement` | בהמתנה להסכם | hot |
| 7 | `signed` | חתם על הסכם התקשרות | signed |
| 8 | `under_review` | בבדיקה | signed |
| 9 | `report_submitted` | הוגש דוח | signed |
| 10 | `missing_document` | חסר מסמך | signed |
| 11 | `completed` | הושלם | signed |
| 12 | `not_relevant` | לא רלוונטי | lost |
| 13 | `closed_elsewhere` | סגר במקום אחר | lost |
| 14 | `future_interest` | מעוניין בעתיד | future |

## Removed Statuses (migrated)

These statuses were removed and data was migrated:

| Old Status | Hebrew | Migrated To |
|------------|--------|-------------|
| `new` | חדש | `not_contacted` |
| `customer` | לקוח | `signed` |
| `lost` | אבוד | `not_relevant` |

## Pipeline Stages

```typescript
PIPELINE_STAGES = {
  follow_up: ['not_contacted', 'no_answer'],
  warm: ['contacted', 'message_sent'],
  hot: ['meeting_set', 'pending_agreement'],
  signed: ['signed', 'under_review', 'report_submitted', 'missing_document', 'completed'],
  lost: ['not_relevant', 'closed_elsewhere'],
  future: ['future_interest'],
}
```

## Status Flow

Leads typically progress through the pipeline as follows:

```
follow_up -> warm -> hot -> signed -> (operational sub-stages)
                       \-> lost
                       \-> future
```

### Signed Sub-stages (Active Customers)

After a lead signs (`signed`), they can move through operational sub-stages:

```
signed -> under_review -> report_submitted -> completed
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
| נוצר קשר | contacted |
| נשלחה הודעה | message_sent |
| נקבעה שיחה | meeting_set |
| בהמתנה להסכם | pending_agreement |
| חתם על הסכם התקשרות | signed |
| לא רלוונטי | not_relevant |
| סגר במקום אחר | closed_elsewhere |
| מעוניין בעתיד | future_interest |

### Mapped Statuses (Zoho -> CRM)

| Hebrew (Zoho) | Maps To |
|---------------|---------|
| חדש | not_contacted |
| לקוח | signed |
| אבוד | not_relevant |
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
- `scripts/sync/migrate_statuses.py` - One-time migration script
