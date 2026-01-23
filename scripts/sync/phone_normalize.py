"""
Phone number normalization utility for Israeli phone numbers.

This module normalizes phone numbers to a consistent 10-digit format (05XXXXXXXX)
to enable accurate matching between Zoho CRM and Supabase.
"""

import re
from typing import Optional


def normalize_phone(phone: Optional[str]) -> Optional[str]:
    """
    Normalize an Israeli phone number to 10-digit format (05XXXXXXXX).

    Handles various formats:
    - +972-50-123-4567 -> 0501234567
    - 972501234567 -> 0501234567
    - 050-123-4567 -> 0501234567
    - 0501234567 -> 0501234567
    - 501234567 -> 0501234567

    Args:
        phone: Phone number string in any format

    Returns:
        Normalized 10-digit phone string, or None if invalid
    """
    if not phone:
        return None

    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)

    if not digits:
        return None

    # Handle international format (972...)
    if digits.startswith('972'):
        digits = '0' + digits[3:]

    # Handle missing leading zero for mobile (5XXXXXXXX)
    if len(digits) == 9 and digits.startswith('5'):
        digits = '0' + digits

    # Validate Israeli mobile format (05X-XXX-XXXX)
    if len(digits) == 10 and digits.startswith('05'):
        return digits

    # Validate Israeli landline format (0X-XXX-XXXX)
    if len(digits) == 9 and digits.startswith('0'):
        return digits

    # Also accept 10-digit landlines (02, 03, 04, 08, 09)
    if len(digits) == 10 and digits.startswith('0'):
        return digits

    # Return original digits if we can't normalize (might still match)
    return digits if len(digits) >= 7 else None


def phones_match(phone1: Optional[str], phone2: Optional[str]) -> bool:
    """
    Check if two phone numbers match after normalization.

    Args:
        phone1: First phone number
        phone2: Second phone number

    Returns:
        True if phones match, False otherwise
    """
    norm1 = normalize_phone(phone1)
    norm2 = normalize_phone(phone2)

    if norm1 is None or norm2 is None:
        return False

    return norm1 == norm2


def extract_phone_variants(phone: Optional[str]) -> list[str]:
    """
    Generate phone number variants for flexible matching.

    This helps match phone numbers that might be stored slightly differently.

    Args:
        phone: Phone number string

    Returns:
        List of possible phone formats for matching
    """
    if not phone:
        return []

    normalized = normalize_phone(phone)
    if not normalized:
        return []

    variants = [normalized]

    # Add international format
    if normalized.startswith('0'):
        intl = '972' + normalized[1:]
        variants.append(intl)
        variants.append('+' + intl)

    # Add format with dashes
    if len(normalized) == 10:
        # 050-123-4567
        with_dashes = f"{normalized[:3]}-{normalized[3:6]}-{normalized[6:]}"
        variants.append(with_dashes)

    return variants


# Test cases for validation
if __name__ == '__main__':
    test_cases = [
        ('+972-50-123-4567', '0501234567'),
        ('972501234567', '0501234567'),
        ('050-123-4567', '0501234567'),
        ('0501234567', '0501234567'),
        ('501234567', '0501234567'),
        ('050 123 4567', '0501234567'),
        ('+972501234567', '0501234567'),
        ('', None),
        (None, None),
        ('abc', None),
        ('123', None),
    ]

    print("Phone Normalization Tests:")
    print("-" * 50)

    all_passed = True
    for input_phone, expected in test_cases:
        result = normalize_phone(input_phone)
        status = "PASS" if result == expected else "FAIL"
        if status == "FAIL":
            all_passed = False
        print(f"{status}: normalize_phone({input_phone!r}) = {result!r} (expected {expected!r})")

    print("-" * 50)
    print(f"All tests passed: {all_passed}")
