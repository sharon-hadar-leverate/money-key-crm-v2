#!/usr/bin/env python3
"""
Supabase Local DR Backup Script

Exports all Supabase tables to CSV files organized by timestamp.
READ-ONLY operations - no DROP, DELETE, or TRUNCATE.

Usage:
    python scripts/dr_backup.py                    # Backup all tables
    python scripts/dr_backup.py --dev-only         # Backup only dev_* tables
    python scripts/dr_backup.py --prod-only        # Backup only production tables
    python scripts/dr_backup.py --tables dev_leads,dev_playbooks  # Specific tables
    python scripts/dr_backup.py --dev-only --upload  # Backup and upload to Google Drive
    python scripts/dr_backup.py --upload --gdrive-folder-id "FOLDER_ID"  # Custom folder
"""

import argparse
import csv
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

import requests
from dotenv import load_dotenv


# ============================================
# Configuration
# ============================================

CRM_DIR = Path(__file__).parent.parent
load_dotenv(CRM_DIR / ".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Directory for backups
DRS_DIR = CRM_DIR / "drs"

# Google Drive configuration
DEFAULT_GDRIVE_FOLDER_ID = os.getenv("GDRIVE_BACKUP_FOLDER_ID", "")


# ============================================
# Supabase API Functions
# ============================================

def get_headers() -> dict:
    """Get headers for Supabase REST API calls."""
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }


def list_tables() -> list[str]:
    """
    List all tables in the public schema using Supabase's PostgREST introspection.

    Returns:
        List of table names
    """
    # Query information_schema to get table names
    # Using the RPC endpoint to run a function, or direct SQL via PostgREST
    # Since we can't run raw SQL via PostgREST, we'll query the tables we know exist
    # and also try to discover others via the root endpoint

    # Known tables from migrations
    known_tables = [
        # Dev tables (from migrations)
        "dev_leads",
        "dev_lead_events",
        "dev_lead_notes",
        "dev_user_profiles",
        "dev_playbooks",
        # Production tables
        "leads",
        "lead_events",
        "lead_notes",
        "user_profiles",
        "playbooks",
    ]

    # Verify which tables actually exist by attempting to query them
    existing_tables = []
    headers = get_headers()

    for table in known_tables:
        try:
            url = f"{SUPABASE_URL}/rest/v1/{table}"
            params = {"select": "count", "limit": 0}
            response = requests.head(url, headers=headers, params=params, timeout=10)
            if response.status_code == 200:
                existing_tables.append(table)
        except Exception:
            pass

    return existing_tables


def fetch_table_data(table_name: str) -> tuple[list[dict], int]:
    """
    Fetch all data from a table.

    Args:
        table_name: Name of the table to fetch

    Returns:
        Tuple of (list of row dicts, total count)
    """
    headers = get_headers()
    headers["Prefer"] = "count=exact"  # Get total count in response

    all_rows = []
    offset = 0
    limit = 1000  # Fetch in batches
    total_count = 0

    while True:
        url = f"{SUPABASE_URL}/rest/v1/{table_name}"
        params = {
            "select": "*",
            "offset": offset,
            "limit": limit,
        }

        response = requests.get(url, headers=headers, params=params, timeout=60)

        if response.status_code != 200:
            print(f"  [ERROR] Failed to fetch {table_name}: {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            break

        # Get total count from Content-Range header
        content_range = response.headers.get("Content-Range", "")
        if content_range and "/" in content_range:
            total_count = int(content_range.split("/")[1])

        rows = response.json()
        if not rows:
            break

        all_rows.extend(rows)

        if len(rows) < limit:
            break

        offset += limit
        print(f"    Fetched {len(all_rows)}/{total_count} rows...")

    return all_rows, total_count


def export_to_csv(data: list[dict], output_path: Path) -> int:
    """
    Export data to CSV file.

    Args:
        data: List of row dictionaries
        output_path: Path to output CSV file

    Returns:
        Number of rows written
    """
    if not data:
        # Create empty file with header comment
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("# Empty table - no data\n")
        return 0

    # Get all unique keys across all rows (some rows may have different columns)
    all_keys = set()
    for row in data:
        all_keys.update(row.keys())

    # Sort keys for consistent ordering, with common fields first
    priority_keys = ["id", "name", "email", "phone", "status", "created_at", "updated_at"]
    fieldnames = [k for k in priority_keys if k in all_keys]
    fieldnames.extend(sorted(k for k in all_keys if k not in priority_keys))

    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(data)

    return len(data)


# ============================================
# Backup Functions
# ============================================

def run_backup(
    dev_only: bool = False,
    prod_only: bool = False,
    specific_tables: Optional[list[str]] = None
) -> dict:
    """
    Run the backup process.

    Args:
        dev_only: Only backup dev_* tables
        prod_only: Only backup production tables (non-dev)
        specific_tables: List of specific table names to backup

    Returns:
        Summary dict with backup results
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise Exception("Supabase credentials not configured. Check .env.local file.")

    # Create timestamp directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = DRS_DIR / timestamp
    backup_dir.mkdir(parents=True, exist_ok=True)

    print(f"\nBackup directory: {backup_dir}")
    print("-" * 60)

    # Get tables to backup
    if specific_tables:
        tables = specific_tables
        print(f"Backing up specific tables: {', '.join(tables)}")
    else:
        print("Discovering tables...")
        tables = list_tables()

        if dev_only:
            tables = [t for t in tables if t.startswith("dev_")]
            print(f"Filtering to dev tables only: {len(tables)} tables")
        elif prod_only:
            tables = [t for t in tables if not t.startswith("dev_")]
            print(f"Filtering to production tables only: {len(tables)} tables")

    print(f"\nTables to backup: {', '.join(tables)}")
    print("-" * 60)

    # Backup each table
    results = {
        "timestamp": timestamp,
        "backup_dir": str(backup_dir),
        "tables": {},
        "success_count": 0,
        "error_count": 0,
        "total_rows": 0,
    }

    for table in tables:
        print(f"\n[{table}]")
        try:
            # Fetch data
            print(f"  Fetching data...")
            data, count = fetch_table_data(table)

            # Export to CSV
            output_path = backup_dir / f"{table}.csv"
            rows_written = export_to_csv(data, output_path)

            print(f"  Exported {rows_written} rows to {output_path.name}")

            results["tables"][table] = {
                "status": "success",
                "rows": rows_written,
                "file": str(output_path),
            }
            results["success_count"] += 1
            results["total_rows"] += rows_written

        except Exception as e:
            print(f"  [ERROR] {e}")
            results["tables"][table] = {
                "status": "error",
                "error": str(e),
            }
            results["error_count"] += 1

    # Write summary file
    summary_path = backup_dir / "_backup_summary.txt"
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write(f"Backup Summary\n")
        f.write(f"=" * 60 + "\n")
        f.write(f"Timestamp: {timestamp}\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n")
        f.write(f"\n")
        f.write(f"Tables backed up: {results['success_count']}\n")
        f.write(f"Errors: {results['error_count']}\n")
        f.write(f"Total rows: {results['total_rows']}\n")
        f.write(f"\n")
        f.write(f"Table Details:\n")
        f.write(f"-" * 40 + "\n")
        for table, info in results["tables"].items():
            if info["status"] == "success":
                f.write(f"  {table}: {info['rows']} rows\n")
            else:
                f.write(f"  {table}: ERROR - {info.get('error', 'Unknown')}\n")

    return results


def print_summary(results: dict) -> None:
    """Print a summary of the backup results."""
    print("\n" + "=" * 60)
    print("BACKUP COMPLETE")
    print("=" * 60)
    print(f"Directory: {results['backup_dir']}")
    print(f"Tables backed up: {results['success_count']}")
    print(f"Errors: {results['error_count']}")
    print(f"Total rows: {results['total_rows']}")
    print()

    if results['error_count'] > 0:
        print("ERRORS:")
        for table, info in results["tables"].items():
            if info["status"] == "error":
                print(f"  {table}: {info.get('error', 'Unknown')}")
        print()

    print("FILES CREATED:")
    for table, info in results["tables"].items():
        if info["status"] == "success":
            print(f"  {table}.csv ({info['rows']} rows)")


# ============================================
# Google Drive Upload Functions
# ============================================

def get_drive_service():
    """
    Authenticate with Google Drive using OAuth2.

    On first run, opens a browser for authentication.
    Token is cached for subsequent runs.

    Returns:
        Google Drive API service object
    """
    try:
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build
        import json
    except ImportError:
        raise ImportError(
            "Google Drive dependencies not installed. Run:\n"
            "  pip install google-auth google-api-python-client google-auth-oauthlib"
        )

    SCOPES = ["https://www.googleapis.com/auth/drive.file"]

    # Token storage path
    token_path = CRM_DIR / ".gdrive_token.json"

    # Client secrets path (check multiple locations)
    client_secrets_paths = [
        CRM_DIR / "client_secret.json",
    ]

    client_secrets_path = None
    for path in client_secrets_paths:
        if path.exists():
            client_secrets_path = path
            break

    credentials = None

    # Load existing token if available
    if token_path.exists():
        try:
            credentials = Credentials.from_authorized_user_file(str(token_path), SCOPES)
        except Exception:
            pass

    # Refresh or get new credentials
    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            try:
                credentials.refresh(Request())
            except Exception:
                credentials = None

        if not credentials:
            if not client_secrets_path:
                raise Exception(
                    "Google OAuth client secrets not found.\n"
                    "Please place client_secret.json in the project root,\n"
                    "or download from Google Cloud Console."
                )

            flow = InstalledAppFlow.from_client_secrets_file(
                str(client_secrets_path), SCOPES
            )
            credentials = flow.run_local_server(port=0)

        # Save token for next time
        with open(token_path, "w") as f:
            f.write(credentials.to_json())

    service = build("drive", "v3", credentials=credentials)
    return service


def get_or_create_folder(service, folder_name: str, parent_id: str) -> str:
    """
    Get or create a folder in Google Drive.

    Args:
        service: Google Drive API service
        folder_name: Name of the folder to create
        parent_id: ID of the parent folder

    Returns:
        Folder ID
    """
    # Check if folder already exists
    query = (
        f"name='{folder_name}' and "
        f"'{parent_id}' in parents and "
        f"mimeType='application/vnd.google-apps.folder' and "
        f"trashed=false"
    )
    results = service.files().list(
        q=query,
        spaces="drive",
        fields="files(id, name)"
    ).execute()

    files = results.get("files", [])
    if files:
        return files[0]["id"]

    # Create new folder
    file_metadata = {
        "name": folder_name,
        "mimeType": "application/vnd.google-apps.folder",
        "parents": [parent_id]
    }
    folder = service.files().create(
        body=file_metadata,
        fields="id"
    ).execute()

    return folder.get("id")


def upload_file(service, file_path: Path, folder_id: str) -> dict:
    """
    Upload a single file to Google Drive.

    Args:
        service: Google Drive API service
        file_path: Path to the file to upload
        folder_id: ID of the destination folder

    Returns:
        Dict with file info (id, name, webViewLink)
    """
    from googleapiclient.http import MediaFileUpload

    file_metadata = {
        "name": file_path.name,
        "parents": [folder_id]
    }

    # Determine MIME type
    mime_type = "text/csv" if file_path.suffix == ".csv" else "text/plain"

    media = MediaFileUpload(
        str(file_path),
        mimetype=mime_type,
        resumable=True
    )

    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields="id, name, webViewLink"
    ).execute()

    return file


def upload_backup_to_gdrive(backup_dir: Path, parent_folder_id: str) -> dict:
    """
    Upload entire backup directory to Google Drive.

    Args:
        backup_dir: Path to the backup directory
        parent_folder_id: ID of the parent Google Drive folder

    Returns:
        Dict with upload results
    """
    print("\n" + "=" * 60)
    print("UPLOADING TO GOOGLE DRIVE")
    print("=" * 60)

    # Get Drive service
    print("Authenticating with Google Drive...")
    service = get_drive_service()

    # Create subfolder with timestamp name
    folder_name = backup_dir.name
    print(f"Creating folder: {folder_name}")
    folder_id = get_or_create_folder(service, folder_name, parent_folder_id)

    # Upload all files
    uploaded_files = []
    failed_files = []

    files_to_upload = list(backup_dir.glob("*"))
    total_files = len(files_to_upload)

    for i, file_path in enumerate(files_to_upload, 1):
        if file_path.is_file():
            try:
                print(f"  [{i}/{total_files}] Uploading {file_path.name}...")
                file_info = upload_file(service, file_path, folder_id)
                uploaded_files.append({
                    "name": file_path.name,
                    "id": file_info.get("id"),
                    "link": file_info.get("webViewLink")
                })
            except Exception as e:
                print(f"    [ERROR] Failed to upload {file_path.name}: {e}")
                failed_files.append({
                    "name": file_path.name,
                    "error": str(e)
                })

    # Get folder link
    folder_link = f"https://drive.google.com/drive/folders/{folder_id}"

    results = {
        "folder_id": folder_id,
        "folder_link": folder_link,
        "uploaded_count": len(uploaded_files),
        "failed_count": len(failed_files),
        "uploaded_files": uploaded_files,
        "failed_files": failed_files
    }

    return results


def print_upload_summary(upload_results: dict) -> None:
    """Print a summary of the Google Drive upload."""
    print("\n" + "-" * 60)
    print("GOOGLE DRIVE UPLOAD COMPLETE")
    print("-" * 60)
    print(f"Folder: {upload_results['folder_link']}")
    print(f"Files uploaded: {upload_results['uploaded_count']}")
    if upload_results['failed_count'] > 0:
        print(f"Failed: {upload_results['failed_count']}")
        for f in upload_results['failed_files']:
            print(f"  - {f['name']}: {f['error']}")


# ============================================
# Main
# ============================================

def main():
    parser = argparse.ArgumentParser(
        description="Backup Supabase tables to CSV files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/dr_backup.py                    # Backup all tables
  python scripts/dr_backup.py --dev-only         # Backup only dev_* tables
  python scripts/dr_backup.py --prod-only        # Backup only production tables
  python scripts/dr_backup.py --tables dev_leads,dev_playbooks
  python scripts/dr_backup.py --dev-only --upload  # Backup and upload to Google Drive
  python scripts/dr_backup.py --upload --gdrive-folder-id "FOLDER_ID"  # Custom folder
        """
    )
    parser.add_argument(
        "--dev-only",
        action="store_true",
        help="Only backup dev_* tables"
    )
    parser.add_argument(
        "--prod-only",
        action="store_true",
        help="Only backup production tables (non-dev)"
    )
    parser.add_argument(
        "--tables",
        type=str,
        help="Comma-separated list of specific tables to backup"
    )
    parser.add_argument(
        "--upload",
        action="store_true",
        help="Upload backup to Google Drive after local export"
    )
    parser.add_argument(
        "--gdrive-folder-id",
        type=str,
        default=DEFAULT_GDRIVE_FOLDER_ID,
        help="Google Drive folder ID for upload (set GDRIVE_BACKUP_FOLDER_ID env var or pass via CLI)"
    )

    args = parser.parse_args()

    if args.dev_only and args.prod_only:
        print("Error: Cannot specify both --dev-only and --prod-only")
        sys.exit(1)

    if args.upload and not args.gdrive_folder_id:
        print("Error: --upload requires GDRIVE_BACKUP_FOLDER_ID env var or --gdrive-folder-id")
        sys.exit(1)

    specific_tables = None
    if args.tables:
        specific_tables = [t.strip() for t in args.tables.split(",")]

    print("=" * 60)
    print("SUPABASE DR BACKUP")
    print("=" * 60)

    try:
        results = run_backup(
            dev_only=args.dev_only,
            prod_only=args.prod_only,
            specific_tables=specific_tables
        )
        print_summary(results)

        # Upload to Google Drive if requested
        if args.upload:
            backup_dir = Path(results["backup_dir"])
            try:
                upload_results = upload_backup_to_gdrive(
                    backup_dir,
                    args.gdrive_folder_id
                )
                print_upload_summary(upload_results)

                if upload_results["failed_count"] > 0:
                    print("\n[WARNING] Some files failed to upload")
            except Exception as e:
                print(f"\n[ERROR] Google Drive upload failed: {e}")
                sys.exit(1)

        if results["error_count"] > 0:
            sys.exit(1)

    except Exception as e:
        print(f"\n[FATAL ERROR] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
