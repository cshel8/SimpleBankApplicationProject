from decimal import Decimal

from exceptions.account_exceptions import AccountNotFoundException, InsufficientFundsException, InvalidAmountException
from exceptions.customer_exceptions import CustomerNotFoundException
from models.account import Account, AccountCreate, AccountUpdate
from repositories.account_repository import AccountRepository
from repositories.customer_repository import CustomerRepository


class AccountService:
    def __init__(self, account_repository: AccountRepository, customer_repository: CustomerRepository):
        self.account_repository = account_repository
        self.customer_repository = customer_repository

    def get_all_accounts(self) -> list[Account]:
        return self.account_repository.get_all_accounts()

    def get_account_by_id(self, account_id: int) -> Account:
        account = self.account_repository.get_account_by_id(account_id)
        if account is None:
            raise AccountNotFoundException("Account not found.")
        return account

    def create_account(self, customer_id: int, account_data: AccountCreate) -> Account:
        if self.customer_repository.get_customer_by_id(customer_id) is None:
            raise CustomerNotFoundException("Customer not found.")
        return self.account_repository.create_account(customer_id, account_data.account_type, account_data.opening_balance)

    def update_account(self, account_id: int, account_data: AccountUpdate) -> Account:
        account = self.get_account_by_id(account_id)
        if account_data.account_type is None:
            return account
        updated_account = self.account_repository.update_account(account_id, account_data.account_type)
        if updated_account is None:
            raise AccountNotFoundException("Account not found.")
        return updated_account

    def delete_account(self, account_id: int, customer_id: int | None = None) -> None:
        account = self.get_account_by_id(account_id)
        if customer_id is not None and account.customer_id != customer_id:
            raise AccountNotFoundException("Account not found for this customer.")
        self.account_repository.delete_account(account_id)

    def deposit(self, account_id: int, amount: Decimal) -> Account:
        self._validate_amount(amount)
        account = self.get_account_by_id(account_id)
        updated_account = self.account_repository.update_balance(account_id, account.balance + amount)
        if updated_account is None:
            raise AccountNotFoundException("Account not found.")
        return updated_account

    def withdraw(self, account_id: int, amount: Decimal) -> Account:
        self._validate_amount(amount)
        account = self.get_account_by_id(account_id)
        if amount > account.balance:
            raise InsufficientFundsException("Insufficient funds.")
        updated_account = self.account_repository.update_balance(account_id, account.balance - amount)
        if updated_account is None:
            raise AccountNotFoundException("Account not found.")
        return updated_account

    @staticmethod
    def _validate_amount(amount: Decimal) -> None:
        if amount <= 0:
            raise InvalidAmountException("Amount must be greater than zero.")
