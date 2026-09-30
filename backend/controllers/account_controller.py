from fastapi import APIRouter, HTTPException

from dependencies import account_service
from exceptions.account_exceptions import AccountNotFoundException, InsufficientFundsException, InvalidAmountException
from exceptions.customer_exceptions import CustomerNotFoundException
from models.account import Account, AccountCreate, AccountUpdate, MoneyAmount

router = APIRouter(prefix="/api", tags=["Accounts"])


def account_error_to_http(error: Exception) -> HTTPException:
    if isinstance(error, AccountNotFoundException):
        return HTTPException(status_code=404, detail=str(error))
    if isinstance(error, CustomerNotFoundException):
        return HTTPException(status_code=404, detail="Customer not found.")
    if isinstance(error, InsufficientFundsException):
        return HTTPException(status_code=409, detail="Insufficient funds.")
    return HTTPException(status_code=400, detail=str(error))


@router.get("/accounts", response_model=list[Account], summary="Get all accounts")
def get_all_accounts():
    return account_service.get_all_accounts()


@router.get(
    "/accounts/{account_id}",
    response_model=Account,
    summary="Get an account by ID",
    responses={404: {"description": "Account not found."}},
)
def get_account_by_id(account_id: int):
    try:
        return account_service.get_account_by_id(account_id)
    except AccountNotFoundException as error:
        raise account_error_to_http(error)


@router.post(
    "/customers/{customer_id}/accounts",
    response_model=Account,
    status_code=201,
    summary="Create an account for a customer",
    responses={404: {"description": "Customer not found."}},
)
def create_account(customer_id: int, account_data: AccountCreate):
    try:
        return account_service.create_account(customer_id, account_data)
    except CustomerNotFoundException as error:
        raise account_error_to_http(error)


@router.put(
    "/accounts/{account_id}",
    response_model=Account,
    summary="Update an account type",
    responses={404: {"description": "Account not found."}},
)
def update_account(account_id: int, account_data: AccountUpdate):
    try:
        return account_service.update_account(account_id, account_data)
    except AccountNotFoundException as error:
        raise account_error_to_http(error)


@router.delete(
    "/accounts/{account_id}",
    status_code=204,
    summary="Delete an account",
    responses={404: {"description": "Account not found."}},
)
def delete_account(account_id: int):
    try:
        account_service.delete_account(account_id)
    except AccountNotFoundException as error:
        raise account_error_to_http(error)


@router.delete(
    "/customers/{customer_id}/accounts/{account_id}",
    status_code=204,
    summary="Delete one account belonging to a customer",
    responses={404: {"description": "Account not found for this customer."}},
)
def delete_customer_account(customer_id: int, account_id: int):
    try:
        account_service.delete_account(account_id, customer_id)
    except AccountNotFoundException as error:
        raise account_error_to_http(error)


@router.post(
    "/accounts/{account_id}/deposit",
    response_model=Account,
    summary="Deposit money into an account",
    responses={404: {"description": "Account not found."}},
)
def deposit(account_id: int, money: MoneyAmount):
    try:
        return account_service.deposit(account_id, money.amount)
    except (AccountNotFoundException, InvalidAmountException) as error:
        raise account_error_to_http(error)


@router.post(
    "/accounts/{account_id}/withdraw",
    response_model=Account,
    summary="Withdraw money from an account",
    responses={
        404: {"description": "Account not found."},
        409: {"description": "Insufficient funds."},
    },
)
def withdraw(account_id: int, money: MoneyAmount):
    try:
        return account_service.withdraw(account_id, money.amount)
    except (AccountNotFoundException, InvalidAmountException, InsufficientFundsException) as error:
        raise account_error_to_http(error)
