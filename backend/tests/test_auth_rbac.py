import pytest
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token

def test_password_hashing_and_verification():
    pw = "SuperSecureBihar2026!"
    hashed = get_password_hash(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_generation_and_payload():
    token = create_access_token(subject="dm_supaul", role="DISTRICT_OFFICIAL", district="Supaul")
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "dm_supaul"
    assert payload["role"] == "DISTRICT_OFFICIAL"
    assert payload["district"] == "Supaul"
