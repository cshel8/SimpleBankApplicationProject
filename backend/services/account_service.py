from decimal import Decimal

from exceptions.account_exceptions import (
    AccountOwnershipException,
    AccountNotFoundException,
    InsufficientFundsException,
    InvalidAmountException,
    SameAccountTransferException,
)
from exceptions.customer_exceptions import CustomerNotFoundException
from models.account import Account, AccountCreate, AccountUpdate, TransferCreate, TransferResult
from repositories.account_repository import AccountRepository
from repositories.customer_repository import CustomerRepository
from services.audit_service import AuditService


class AccountService:
    def __init__(
        self,
        account_repository: AccountRepository,
        customer_repository: CustomerRepository,
        audit_service: AuditService,
    ):
        self.account_repository = account_repository
        self.customer_repository = customer_repository
        self.audit_service = audit_service

    def get_all_accounts(self) -> list[Account]:
        return self.account_repository.get_all_accounts()

    def get_accounts_for_customer(self, customer_id: str) -> list[Account]:
        return self.account_repository.get_accounts_for_customer(customer_id)

    def get_premium_accounts(self, threshold: Decimal) -> list[Account]:
        if threshold < 0:
            raise InvalidAmountException("Threshold cannot be negative.")
        return self.account_repository.get_premium_accounts(threshold)

    def get_account_by_id(self, account_id: str) -> Account:
        account = self.account_repository.get_account_by_id(account_id)
        if account is None:
            raise AccountNotFoundException("Account not found.")
        return account

    def create_account(self, customer_id: str, account_data: AccountCreate) -> Account:
        if self.customer_repository.get_customer_by_id(customer_id) is None:
            raise CustomerNotFoundException("Customer not found.")
        account = self.account_repository.create_account(
            customer_id,
            account_data.account_type,
            account_data.opening_balance,
        )
        if account is None:
            raise CustomerNotFoundException("Customer not found.")
        return account

    def update_account(self, account_id: str, account_data: AccountUpdate) -> Account:
        account = self.get_account_by_id(account_id)
        if account_data.account_type is None:
            return account
        updated_account = self.account_repository.update_account(account_id, account_data.account_type)
        if updated_account is None:
            raise AccountNotFoundException("Account not found.")
        return updated_account

    def delete_account(self, account_id: str, customer_id: str | None = None) -> None:
        account = self.get_account_by_id(account_id)
        if customer_id is not None and account.customer_id != customer_id:
            raise AccountNotFoundException("Account not found for this customer.")
        self.account_repository.delete_account(account_id)

    def deposit(self, account_id: str, amount: Decimal) -> Account:
        self._validate_amount(amount)
        self.get_account_by_id(account_id)
        updated_account = self.account_repository.deposit(
            account_id,
            amount,
            self.audit_service.audit_repository,
        )
        if updated_account is None:
            raise AccountNotFoundException("Account not found.")
        return updated_account

    def deposit_for_customer(self, customer_id: str, account_id: str, amount: Decimal) -> Account:
        self._get_owned_account(customer_id, account_id)
        return self.deposit(account_id, amount)

    def withdraw(self, account_id: str, amount: Decimal) -> Account:
        self._validate_amount(amount)
        account = self.get_account_by_id(account_id)
        if amount > account.balance:
            raise InsufficientFundsException("Insufficient funds.")
        updated_account = self.account_repository.withdraw(
            account_id,
            amount,
            self.audit_service.audit_repository,
        )
        if updated_account is None:
            self.get_account_by_id(account_id)
            raise InsufficientFundsException("Insufficient funds.")
        return updated_account

    def withdraw_for_customer(self, customer_id: str, account_id: str, amount: Decimal) -> Account:
        self._get_owned_account(customer_id, account_id)
        return self.withdraw(account_id, amount)

    def transfer(self, transfer_data: TransferCreate) -> TransferResult:
        self._validate_amount(transfer_data.amount)
        source_account = self.get_account_by_id(transfer_data.from_account_id)
        self.get_account_by_id(transfer_data.to_account_id)
        if transfer_data.from_account_id == transfer_data.to_account_id:
            raise SameAccountTransferException("Source and destination accounts must be different.")
        if transfer_data.amount > source_account.balance:
            raise InsufficientFundsException("Insufficient funds.")

        updated_accounts = self.account_repository.transfer(
            transfer_data.from_account_id,
            transfer_data.to_account_id,
            transfer_data.amount,
            self.audit_service.audit_repository,
        )
        if updated_accounts is None:
            raise AccountNotFoundException("Account not found.")
        source_account, destination_account = updated_accounts
        return TransferResult(
            from_account=source_account,
            to_account=destination_account,
        )

    def transfer_for_customer(self, customer_id: str, transfer_data: TransferCreate) -> TransferResult:
        self._get_owned_account(customer_id, transfer_data.from_account_id)
        self._get_owned_account(customer_id, transfer_data.to_account_id)
        return self.transfer(transfer_data)

    def _get_owned_account(self, customer_id: str, account_id: str) -> Account:
        account = self.get_account_by_id(account_id)
        if account.customer_id != customer_id:
            raise AccountOwnershipException("You are not authorized to access this account.")
        return account

    @staticmethod
    def _validate_amount(amount: Decimal) -> None:
        if amount <= 0:
            raise InvalidAmountException("Amount must be greater than zero.")
