"""Provision an administrator account from the server.

Administrator accounts cannot be created through public sign-up. Run this
script on the server (or locally) to create a new admin, or to promote an
existing account.

Usage (from the ``backend`` directory):
    python create_admin.py --username admin --email admin@example.com
    python create_admin.py --username musa_farms --promote

Omit --password to be prompted securely.
"""

import argparse
import getpass
import sys

from sqlmodel import Session, select

from app.core.database import engine, init_db
from app.core.security import hash_password
from app.models import User, UserRole


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create or promote an administrator.")
    parser.add_argument("--username", required=True, help="Admin username")
    parser.add_argument("--email", help="Email (required when creating a new account)")
    parser.add_argument("--full-name", default="Platform Administrator")
    parser.add_argument("--password", help="Password (prompted if omitted)")
    parser.add_argument(
        "--promote",
        action="store_true",
        help="Promote an existing account instead of creating a new one",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    init_db()

    username = args.username.strip().lower()

    with Session(engine) as session:
        existing = session.exec(select(User).where(User.username == username)).first()

        if existing is not None:
            if not args.promote:
                print(f"User '{username}' already exists. Re-run with --promote to make them an admin.")
                return 1
            existing.role = UserRole.admin
            session.add(existing)
            session.commit()
            print(f"Promoted '{username}' to administrator.")
            return 0

        if not args.promote and not args.email:
            print("--email is required when creating a new administrator.")
            return 1

        password = args.password or getpass.getpass("Password: ")
        if len(password) < 6:
            print("Password must be at least 6 characters.")
            return 1
        confirm = args.password or getpass.getpass("Confirm password: ")
        if password != confirm:
            print("Passwords do not match.")
            return 1

        admin = User(
            full_name=args.full_name.strip(),
            username=username,
            email=args.email.lower(),
            hashed_password=hash_password(password),
            role=UserRole.admin,
        )
        session.add(admin)
        session.commit()
        print(f"Created administrator '{username}'.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
