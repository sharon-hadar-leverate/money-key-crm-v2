# DR Backup Workflow

Disaster Recovery backup process for Money Key CRM data.

## Overview

The DR backup script exports all Supabase tables to CSV files and optionally uploads them to Google Drive for off-site storage.

## Quick Start

```bash
# Local backup only (dev tables)
python3 scripts/dr_backup.py --dev-only

# Local backup + Google Drive upload
python3 scripts/dr_backup.py --dev-only --upload

# Production backup + upload
python3 scripts/dr_backup.py --prod-only --upload
```

## Prerequisites

### One-time Setup: Google Drive Authentication

```bash
gcloud auth application-default login \
  --scopes="https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/cloud-platform"
```

### Required Python Packages

```bash
pip install google-auth google-api-python-client python-dotenv requests
```

## CLI Options

| Flag | Description |
|------|-------------|
| `--dev-only` | Only backup `dev_*` tables |
| `--prod-only` | Only backup production tables (non-dev) |
| `--tables TABLE1,TABLE2` | Backup specific tables |
| `--upload` | Upload backup to Google Drive |
| `--gdrive-folder-id ID` | Custom Google Drive folder (default: shared DR folder) |

## Backup Structure

### Local Storage

```
drs/
└── YYYYMMDD_HHMMSS/
    ├── dev_leads.csv
    ├── dev_lead_events.csv
    ├── dev_lead_notes.csv
    ├── dev_user_profiles.csv
    ├── dev_playbooks.csv
    └── _backup_summary.txt
```

### Google Drive Storage

Backups are uploaded to: [DR Backup Folder](https://drive.google.com/drive/folders/1C45Zon8iedyJffEd4iLGwhEjZN3-wXVc)

Each backup creates a timestamped subfolder with all CSV files.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | Required |
| `GDRIVE_BACKUP_FOLDER_ID` | Google Drive folder ID | `1C45Zon8iedyJffEd4iLGwhEjZN3-wXVc` |

## Recommended Schedule

| Frequency | Command | Purpose |
|-----------|---------|---------|
| Daily | `--dev-only --upload` | Dev data protection |
| Weekly | `--prod-only --upload` | Full production backup |
| Before migrations | `--upload` | Pre-change snapshot |

## Verification

After running a backup:

1. Check local `drs/{timestamp}/` folder exists
2. Open `_backup_summary.txt` to verify row counts
3. If uploaded, check Google Drive folder for new subfolder
4. Open a CSV in Google Drive to verify content integrity

## Troubleshooting

### Authentication Error

```
Failed to authenticate with Google Drive
```

**Solution:** Re-run gcloud authentication:
```bash
gcloud auth application-default login \
  --scopes="https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/cloud-platform"
```

### Missing Dependencies

```
Google Drive dependencies not installed
```

**Solution:**
```bash
pip install google-auth google-api-python-client
```

### Supabase Connection Error

```
Supabase credentials not configured
```

**Solution:** Ensure `.env.local` contains valid Supabase credentials.
