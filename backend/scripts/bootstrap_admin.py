"""Explicit, environment-driven one-time admin bootstrap for local class-project setup."""

import os

from dependencies import auth_service


def main() -> None:
    password = os.getenv("ADMIN_BOOTSTRAP_PASSWORD")
    if not password:
        raise RuntimeError("ADMIN_BOOTSTRAP_PASSWORD is not configured.")

    admin = auth_service.bootstrap_admin(
        password=password,
        name=os.getenv("ADMIN_BOOTSTRAP_NAME", "Administrator"),
    )
    if admin is None:
        print("Admin account already exists; no changes made.")
    else:
        print(f"Created admin account: {admin.username}")


if __name__ == "__main__":
    main()
