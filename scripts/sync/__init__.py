"""
Zoho <-> Supabase Lead Reconciliation & Status Sync Module

This module provides tools for:
1. Phone number normalization (Israeli format)
2. Lead reconciliation between Zoho CRM and Supabase
3. Status synchronization from Zoho to Supabase

Usage:
    # Generate reconciliation report (no changes)
    python -m scripts.sync.reconcile --report-only

    # Dry-run sync (show what would change)
    python -m scripts.sync.status_sync --dry-run --target dev

    # Actual sync to dev tables
    python -m scripts.sync.status_sync --target dev

    # Sync to production (after validation)
    python -m scripts.sync.status_sync --target prod
"""

from .phone_normalize import normalize_phone, phones_match, extract_phone_variants

__all__ = [
    'normalize_phone',
    'phones_match',
    'extract_phone_variants',
]
