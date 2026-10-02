from fastapi import APIRouter, Depends, HTTPException

from dependencies import account_service, audit_service, get_current_identity
from exceptions.account_exceptions import (
    AccountNotFoundException,
    AccountOwnershipException,
    InsufficientFundsException,
    InvalidAmountException,
    SameAccountTransferException,
)
from models.account import Account, MoneyAmount, TransferCreate, TransferResult
from models.audit import AuditRecord
from models.customer import AuthenticatedIdentity


router = APIRouter(prefix="/api/me", tags=["My Banking"])


def self_service_error_to_http(error: Exception) -> HTTPException:
    if isinstance(error, AccountNotFoundException):
        return HTTPException(status_code=404, detail="Account not found.")
    if isinstance(error, AccountOwnershipException):
        return HTTPException(status_code=403, detail="You are not authorized to access this account.")
    if isinstance(error, InsufficientFundsException):
        return HTTPException(status_code=409, detail="Insufficient funds.")
    return HTTPException(status_code=400, detail=str(error))


@router.get("/accounts", response_model=list[Account], summary="Get my accounts")
def get_my_accounts(
    current_identity: AuthenticatedIdentity = Depends(get_current_identity),
):
    return account_service.get_accounts_for_customer(current_identity.id)


@router.get("/transactions", response_model=list[AuditRecord], summary="Get my transaction history")
def get_my_transactions(
    current_identity: AuthenticatedIdentity = Depends(get_current_identity),
):
    accounts = account_service.get_accounts_for_customer(current_identity.id)
    return audit_service.get_records_for_accounts([account.id for account in accounts])


@router.post(
    "/accounts/{account_id}/deposit",
    response_model=Account,
    summary="Deposit into one of my accounts",
    responses={403: {"description": "Account is not owned by the authenticated customer."}},
)
def deposit_to_my_account(
    account_id: str,
    money: MoneyAmount,
    current_identity: AuthenticatedIdentity = Depends(get_current_identity),
):
    try:
        return account_service.deposit_for_customer(current_identity.id, account_id, money.amount)
    except (AccountNotFoundException, AccountOwnershipException, InvalidAmountException) as error:
        raise self_service_error_to_http(error)


@router.post(
    "/accounts/{account_id}/withdraw",
    response_model=Account,
    summary="Withdraw from one of my accounts",
    responses={
        403: {"description": "Account is not owned by the authenticated customer."},
        409: {"description": "Insufficient funds."},
    },
)
def withdraw_from_my_account(
    account_id: str,
    money: MoneyAmount,
    current_identity: AuthenticatedIdentity = Depends(get_current_identity),
):
    try:
        return account_service.withdraw_for_customer(current_identity.id, account_id, money.amount)
    except (
        AccountNotFoundException,
        AccountOwnershipException,
        InvalidAmountException,
        InsufficientFundsException,
    ) as error:
        raise self_service_error_to_http(error)


@router.post(
    "/accounts/transfer",
    response_model=TransferResult,
    summary="Transfer between my accounts",
    responses={
        400: {"description": "Source and destination accounts must be different."},
        403: {"description": "Account is not owned by the authenticated customer."},
        409: {"description": "Insufficient funds."},
    },
)
def transfer_between_my_accounts(
    transfer_data: TransferCreate,
    current_identity: AuthenticatedIdentity = Depends(get_current_identity),
):
    try:
        return account_service.transfer_for_customer(current_identity.id, transfer_data)
    except (
        AccountNotFoundException,
        AccountOwnershipException,
        InvalidAmountException,
        InsufficientFundsException,
        SameAccountTransferException,
    ) as error:
        raise self_service_error_to_http(error)
