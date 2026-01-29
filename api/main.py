from __future__ import annotations

import os
from datetime import datetime, timezone
from ipaddress import ip_network
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from storage import create_allocation, get_connection, init_db, list_allocations

app = FastAPI(title="GCP IPAM API")

DB_PATH = os.getenv("IPAM_DB_PATH")


class AllocationIn(BaseModel):
    cidr: str = Field(..., examples=["10.10.0.0/24"])
    vpc: str
    region: str
    resource_type: str
    resource_name: str
    status: str = Field("ALLOCATED")
    created_by: str = Field("system")


class AllocationOut(AllocationIn):
    id: int
    created_at: str


class CheckRequest(BaseModel):
    requested_cidr: str
    availability_mode: str = Field("FULL", examples=["FULL", "PARTIAL"])


class CheckResponse(BaseModel):
    requested_cidr: str
    availability_mode: str
    is_free: bool
    conflicts: List[str]


@app.on_event("startup")
def startup() -> None:
    connection = get_connection(DB_PATH)
    init_db(connection)
    connection.close()


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok"}


@app.get("/allocations", response_model=list[AllocationOut])
def get_allocations() -> list[AllocationOut]:
    connection = get_connection(DB_PATH)
    init_db(connection)
    rows = list_allocations(connection)
    allocations = [AllocationOut(**dict(row)) for row in rows]
    connection.close()
    return allocations


@app.post("/allocations", response_model=AllocationOut)
def post_allocation(allocation: AllocationIn) -> AllocationOut:
    connection = get_connection(DB_PATH)
    init_db(connection)
    created_at = datetime.now(timezone.utc).isoformat()
    allocation_id = create_allocation(
        connection,
        cidr=allocation.cidr,
        vpc=allocation.vpc,
        region=allocation.region,
        resource_type=allocation.resource_type,
        resource_name=allocation.resource_name,
        status=allocation.status,
        created_by=allocation.created_by,
        created_at=created_at,
    )
    connection.close()
    return AllocationOut(id=allocation_id, created_at=created_at, **allocation.dict())


@app.post("/check", response_model=CheckResponse)
def check_block(request: CheckRequest) -> CheckResponse:
    connection = get_connection(DB_PATH)
    init_db(connection)
    rows = list_allocations(connection)
    requested = ip_network(request.requested_cidr)
    conflicts = []
    for row in rows:
        existing = ip_network(row["cidr"])
        if requested.overlaps(existing):
            conflicts.append(row["cidr"])
    connection.close()

    availability_mode = request.availability_mode.upper()
    if availability_mode not in {"FULL", "PARTIAL"}:
        raise HTTPException(status_code=400, detail="availability_mode must be FULL or PARTIAL")

    is_free = len(conflicts) == 0
    if availability_mode == "PARTIAL":
        is_free = True

    return CheckResponse(
        requested_cidr=request.requested_cidr,
        availability_mode=availability_mode,
        is_free=is_free,
        conflicts=conflicts,
    )


@app.post("/sync")
def sync_discovery() -> dict:
    return {
        "status": "queued",
        "message": "Sync scheduled. Implement CAI/PubSub integration here.",
    }
