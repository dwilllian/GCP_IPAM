import sqlite3
from pathlib import Path
from typing import Iterable, Optional

DEFAULT_DB_PATH = Path("/tmp/ipam.db")


def get_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    path = Path(db_path) if db_path else DEFAULT_DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    return connection


def init_db(connection: sqlite3.Connection) -> None:
    cursor = connection.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS allocations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cidr TEXT NOT NULL,
            vpc TEXT NOT NULL,
            region TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            resource_name TEXT NOT NULL,
            status TEXT NOT NULL,
            created_by TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    connection.commit()


def list_allocations(connection: sqlite3.Connection) -> Iterable[sqlite3.Row]:
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM allocations ORDER BY created_at DESC")
    return cursor.fetchall()


def create_allocation(
    connection: sqlite3.Connection,
    cidr: str,
    vpc: str,
    region: str,
    resource_type: str,
    resource_name: str,
    status: str,
    created_by: str,
    created_at: str,
) -> int:
    cursor = connection.cursor()
    cursor.execute(
        """
        INSERT INTO allocations (
            cidr, vpc, region, resource_type, resource_name, status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            cidr,
            vpc,
            region,
            resource_type,
            resource_name,
            status,
            created_by,
            created_at,
        ),
    )
    connection.commit()
    return cursor.lastrowid
