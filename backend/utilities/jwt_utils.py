import os
from datetime import datetime, timedelta, timezone

import jwt
from jwt import ExpiredSignatureError, InvalidTokenError

from models.customer import AuthenticatedIdentity


JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


def _get_secret_key() -> str:
    if not JWT_SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY is not configured.")
    return JWT_SECRET_KEY


def create_access_token(
    identity: AuthenticatedIdentity,
    expires_delta: timedelta | None = None,
) -> str:
    expires_at = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return jwt.encode(
        {
            "sub": identity.id,
            "username": identity.username,
            "role": identity.role,
            "exp": expires_at,
        },
        _get_secret_key(),
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        _get_secret_key(),
        algorithms=[JWT_ALGORITHM],
        options={"require": ["exp", "sub"]},
    )


__all__ = [
    "ExpiredSignatureError",
    "InvalidTokenError",
    "create_access_token",
    "decode_access_token",
]
