# pyright: reportUnknownMemberType=false
# pyright: reportMissingTypeStubs=false
# pyright: reportAttributeAccessIssue=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
# pyright: reportMissingParameterType=false
# pyright: reportUnknownLambdaType=false
# pyright: reportUnusedExpression=false

import os
import sys
from typing import Any, Dict, List, Optional

# Ensure UTF-8 output on Windows terminal
if sys.stdout is not None:
    reconfig_stdout = getattr(sys.stdout, "reconfigure", None)
    if callable(reconfig_stdout):
        try:
            reconfig_stdout(encoding="utf-8", errors="replace")
        except Exception:
            pass

if sys.stderr is not None:
    reconfig_stderr = getattr(sys.stderr, "reconfigure", None)
    if callable(reconfig_stderr):
        try:
            reconfig_stderr(encoding="utf-8", errors="replace")
        except Exception:
            pass

# Ensure backend directory is in sys.path
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(script_dir, ".env"))
load_dotenv()

from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError, SQLAlchemyError

# Initialize password hasher
try:
    from services.auth_service import hash_password
except Exception:
    from passlib.context import CryptContext  # type: ignore
    _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    def hash_password(password: str) -> str:
        return str(_pwd_context.hash(password))


def get_db_engine():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL .env file mein nahi mila! Kripya .env file check karein.")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    return create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=300,
    )


def execute_query(conn: Any, query_str: str, params: Optional[Dict[str, Any]] = None) -> Any:
    """Executes a SQL query with parameter binding."""
    return conn.execute(text(query_str), params or {})


def fetch_all_users(conn: Any) -> List[Dict[str, Any]]:
    """Fetches all users from the users table with fallback for older schemas."""
    try:
        rows = execute_query(conn, "SELECT id, name, email, role, status FROM users ORDER BY id").mappings().all()
    except Exception:
        rows = execute_query(conn, "SELECT id, name, email, role, 'active' AS status FROM users ORDER BY id").mappings().all()
    return [dict(r) for r in rows]


def find_user(conn: Any, identifier: str) -> Optional[Dict[str, Any]]:
    """Finds a single user by either ID (number) or case-insensitive Email."""
    ident = identifier.strip()
    if not ident:
        return None

    if ident.isdigit():
        query = "SELECT id, name, email, role, status FROM users WHERE id = :val"
        params: Dict[str, Any] = {"val": int(ident)}
    else:
        query = "SELECT id, name, email, role, status FROM users WHERE LOWER(email) = LOWER(:val)"
        params: Dict[str, Any] = {"val": ident}

    try:
        row = execute_query(conn, query, params).mappings().first()
    except Exception:
        fallback_query = query.replace("status", "'active' AS status")
        row = execute_query(conn, fallback_query, params).mappings().first()

    return dict(row) if row else None


def display_users(rows: List[Dict[str, Any]]) -> None:
    """Prints a formatted table of existing users."""
    print("\n" + "=" * 78)
    print(f"{'ID':<6} | {'Name':<22} | {'Email':<26} | {'Role':<10} | {'Status':<10}")
    print("-" * 78)
    for r in rows:
        status_val = str(r.get("status") or "active")
        name_val = str(r.get("name") or "")[:22]
        email_val = str(r.get("email") or "")[:26]
        role_val = str(r.get("role") or "")[:10]
        id_val = str(r.get("id", "-"))
        print(f"{id_val:<6} | {name_val:<22} | {email_val:<26} | {role_val:<10} | {status_val:<10}")
    print("=" * 78 + "\n")


def prompt_non_empty(prompt_text: str, is_lower: bool = False) -> str:
    """Helper to prompt user until a non-empty string is provided."""
    val = input(prompt_text).strip()
    while not val:
        val = input("[WARN] Yeh field khali nahi ho sakta. Dubara daalein: ").strip()
    return val.lower() if is_lower else val


def save_user(conn: Any, name: str, email: str, password: str, role: str) -> None:
    """Inserts a new user record with active status and hashed password."""
    hashed = hash_password(password)
    try:
        execute_query(
            conn,
            """
            INSERT INTO users (name, email, password_hash, role, status)
            VALUES (:name, :email, :password_hash, :role, 'active')
            """,
            {"name": name, "email": email, "password_hash": hashed, "role": role},
        )
    except Exception:
        execute_query(
            conn,
            """
            INSERT INTO users (name, email, password_hash, role)
            VALUES (:name, :email, :password_hash, :role)
            """,
            {"name": name, "email": email, "password_hash": hashed, "role": role},
        )


def update_user(
    conn: Any,
    user_id: int,
    password: Optional[str] = None,
    role: Optional[str] = None,
    status: str = "active",
) -> None:
    """Updates user password, role, and/or status safely."""
    updates: List[str] = []
    params: Dict[str, Any] = {"id": user_id}

    if password:
        updates.append("password_hash = :password_hash")
        params["password_hash"] = hash_password(password)

    if role:
        updates.append("role = :role")
        params["role"] = role

    if status:
        updates.append("status = :status")
        params["status"] = status

    if not updates:
        return

    sql = f"UPDATE users SET {', '.join(updates)} WHERE id = :id"
    try:
        execute_query(conn, sql, params)
    except Exception:
        updates_no_status = [u for u in updates if not u.startswith("status")]
        if updates_no_status:
            sql_fallback = f"UPDATE users SET {', '.join(updates_no_status)} WHERE id = :id"
            execute_query(conn, sql_fallback, params)


def create_new_account(conn: Any, default_role: str = "admin") -> None:
    """Interactive flow to create a new user account (Admin, Teacher, or Counselor)."""
    print(f"\n--- Naya Account Banayein ---")
    name = prompt_non_empty("User ka Naam: ")
    email = prompt_non_empty("User ka Email: ", is_lower=True)

    existing = find_user(conn, email)
    if existing:
        print(f"\n[WARN] Yeh email pehle se registered hai (ID: {existing['id']}, Name: {existing['name']}, Role: {existing['role']}).")
        choice = input("Kya aap is user ka password reset aur role update karna chahte hain? (y/n): ").strip().lower()
        if choice in ("y", "yes"):
            reset_user_password(conn, target_user=existing)
        return

    print("\nRole chunein:")
    print("  1. admin      (Super Admin / Full Access)")
    print("  2. teacher    (Teacher / Trainer / Dashboard Access)")
    print("  3. counselor  (HR / Counselor / Leads Access)")
    role_choice = input(f"Role select karein (1/2/3, default: {default_role}): ").strip()

    role_map = {"1": "admin", "2": "teacher", "3": "counselor"}
    role = role_map.get(role_choice, default_role)

    password = prompt_non_empty(f"{name} ke liye Password daalein: ")

    save_user(conn, name, email, password, role)

    print(f"\n[SUCCESS] Naya account safalta-purvak ban gaya!")
    print(f"   Name  : {name}")
    print(f"   Email : {email}")
    print(f"   Role  : {role}")
    print(f"   Status: active")
    print(f"\nAb is email/password se login karein.")


def reset_user_password(conn: Any, target_user: Optional[Dict[str, Any]] = None) -> None:
    """Interactive flow to reset password and activate user."""
    if not target_user:
        target_input = prompt_non_empty("\nKiska password reset karna hai? (User ID ya Email daalein): ")
        target_user = find_user(conn, target_input)
        if not target_user:
            print(f"[ERROR] User '{target_input}' nahi mila. Kripya sahi ID ya Email daalein.")
            return

    new_password = prompt_non_empty(f"\n'{target_user['name']}' ({target_user['email']}) ke liye Naya Password daalein: ")

    curr_role = str(target_user.get("role") or "admin")
    print(f"\nCurrent Role: {curr_role}")
    print("Role badalna chahte hain?")
    print("  1. Keep current role")
    print("  2. admin (Super Admin)")
    print("  3. teacher (Teacher/Trainer)")
    print("  4. counselor (HR/Counselor)")
    r_choice = input("Option chunein (1/2/3/4, default: 1): ").strip()

    role_map = {"2": "admin", "3": "teacher", "4": "counselor"}
    new_role = role_map.get(r_choice, curr_role)

    user_id_int = int(target_user["id"])
    update_user(conn, user_id=user_id_int, password=new_password, role=new_role, status="active")

    print(f"\n[SUCCESS] Password reset ho gaya aur account activate kar diya gaya!")
    print(f"   User  : {target_user['name']}")
    print(f"   Email : {target_user['email']}")
    print(f"   Role  : {new_role}")
    print(f"   Status: active")
    print("\nAb is account se login karein.")


def change_user_role(conn: Any) -> None:
    """Interactive flow to change a user's role and activate account."""
    target_input = prompt_non_empty("\nKiska Role badalna hai? (User ID ya Email daalein): ")
    user = find_user(conn, target_input)
    if not user:
        print(f"[ERROR] User '{target_input}' nahi mila.")
        return

    print(f"\nUser: {user['name']} ({user['email']}) | Current Role: {user['role']}")
    print("Naya Role chunein:")
    print("  1. admin      (Super Admin)")
    print("  2. teacher    (Teacher / Trainer)")
    print("  3. counselor  (HR / Counselor)")
    choice = input("Select karein (1/2/3): ").strip()

    role_map = {"1": "admin", "2": "teacher", "3": "counselor"}
    new_role = role_map.get(choice)

    if not new_role:
        print("[ERROR] Invalid role selection.")
        return

    user_id_int = int(user["id"])
    update_user(conn, user_id=user_id_int, role=new_role, status="active")
    print(f"\n[SUCCESS] User '{user['name']}' ({user['email']}) ka role '{new_role}' aur status 'active' set kar diya gaya hai.")


def main() -> None:
    # Help flag
    if len(sys.argv) == 2 and sys.argv[1].lower() in ("-h", "--help", "help"):
        print("\nUsage:")
        print("  1. Interactive Mode : python reset_admin.py")
        print("  2. Direct CLI Mode  : python reset_admin.py <email_or_id> <password> [role]")
        print("\nRoles: admin | teacher | counselor\n")
        return

    # Handle direct CLI arguments: python reset_admin.py <email_or_id> <password> [role]
    if len(sys.argv) >= 3:
        identifier = sys.argv[1].strip()
        password = sys.argv[2].strip()
        role = sys.argv[3].strip().lower() if len(sys.argv) > 3 else None

        print("=" * 60)
        print("       Morph Academy -- User & Staff Management (CLI)")
        print("=" * 60)
        try:
            engine = get_db_engine()
            with engine.begin() as conn:
                user = find_user(conn, identifier)
                if user:
                    new_role = role or str(user.get("role") or "admin")
                    user_id_int = int(user["id"])
                    update_user(conn, user_id=user_id_int, password=password, role=new_role, status="active")
                    print(f"\n[SUCCESS] Password Reset & Activated Successfully!")
                    print(f"   ID    : {user['id']}")
                    print(f"   Name  : {user['name']}")
                    print(f"   Email : {user['email']}")
                    print(f"   Role  : {new_role}")
                    print(f"   Status: active\n")
                elif "@" in identifier:
                    new_role = role or "admin"
                    name_part = identifier.split("@")[0].replace(".", " ").title()
                    save_user(conn, name=name_part, email=identifier.lower(), password=password, role=new_role)
                    print(f"\n[SUCCESS] New Account Created & Activated Successfully!")
                    print(f"   Name  : {name_part}")
                    print(f"   Email : {identifier.lower()}")
                    print(f"   Role  : {new_role}")
                    print(f"   Status: active\n")
                else:
                    print(f"\n[ERROR] User '{identifier}' nahi mila.")
                    sys.exit(1)
        except Exception as e:
            print(f"\n[ERROR] {e}\n")
            sys.exit(1)
        return

    print("=" * 60)
    print("       Morph Academy -- User & Staff Management")
    print("=" * 60)

    try:
        engine = get_db_engine()
        with engine.begin() as conn:
            rows = fetch_all_users(conn)

            if not rows:
                print("\n[WARN] Database mein koi user nahi mila.")
                print("Pehle Super Admin account banate hain:\n")
                create_new_account(conn, default_role="admin")
                return

            display_users(rows)

            print("Aap kya karna chahte hain?")
            print("  1. Password Reset karein & Account Activate karein")
            print("  2. Naya Account banayein (Admin / Teacher / Counselor)")
            print("  3. Kisi existing user ka Role badlein & Activate karein")
            print("  4. Exit")

            choice = input("\nOption select karein (1/2/3/4): ").strip()

            if choice == "1":
                reset_user_password(conn)
            elif choice == "2":
                create_new_account(conn)
            elif choice == "3":
                change_user_role(conn)
            elif choice == "4":
                print("Script exit kiya gaya.")
                return
            else:
                print("[ERROR] Invalid option. Dubara run karein.")

    except (EOFError, KeyboardInterrupt):
        print("\n\nScript band kar di gayi.")
    except OperationalError as oe:
        print("\n[ERROR] Database Connection Error!")
        print("Database se connect nahi ho paya. Yeh check karein:")
        print("  1. Internet connection active hai ya nahi.")
        print("  2. .env file mein DATABASE_URL sahi hai ya nahi.")
        print(f"\nDetails: {oe}")
    except SQLAlchemyError as se:
        print(f"\n[ERROR] Database Error: {se}")
    except Exception as e:
        print(f"\n[ERROR] Unexpected Error: {e}")


if __name__ == "__main__":
    main()

