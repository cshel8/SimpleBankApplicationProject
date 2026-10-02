from fastapi import APIRouter, Depends, HTTPException

from dependencies import audit_service, require_admin
from exceptions.audit_exceptions import AuditRecordNotFoundException
from models.audit import AuditRecord

router = APIRouter(
    prefix="/api",
    tags=["Transaction History"],
    dependencies=[Depends(require_admin)],
)


@router.get("/transactions", response_model=list[AuditRecord], summary="Get all transaction records")
def get_all_records():
    return audit_service.get_all_records()


@router.get(
    "/transactions/account/{account_id}",
    response_model=list[AuditRecord],
    summary="Get transaction history for an account",
)
def get_records_for_account(account_id: str):
    return audit_service.get_records_for_account(account_id)


@router.get(
    "/transactions/{record_id}",
    response_model=AuditRecord,
    summary="Get a transaction record by ID",
    responses={404: {"description": "Transaction record not found."}},
)
def get_record_by_id(record_id: str):
    try:
        return audit_service.get_record_by_id(record_id)
    except AuditRecordNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error))
