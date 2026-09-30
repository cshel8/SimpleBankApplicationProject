from decimal import Decimal

from models.account import Account
from utilities.all_data import accounts


class AccountRepository:
    """Data-access operations for the temporary account list."""

    def get_all_accounts(self) -> list[Account]:
        return accounts

    def get_account_by_id(self, account_id: int) -> Account | None:
        return next((account for account in accounts if account.id == account_id), None)

    def create_account(self, customer_id: int, account_type: str, balance: Decimal) -> Account:
        new_account = Account(
            id=max((account.id for account in accounts), default=0) + 1,
            customer_id=customer_id,
            account_type=account_type,
            balance=balance,
        )
        accounts.append(new_account)
        return new_account

    def update_account(self, account_id: int, account_type: str) -> Account | None:
        account = self.get_account_by_id(account_id)
        if account is not None:
            account.account_type = account_type
        return account

    def update_balance(self, account_id: int, balance: Decimal) -> Account | None:
        account = self.get_account_by_id(account_id)
        if account is not None:
            account.balance = balance
        return account

    def delete_account(self, account_id: int) -> bool:
        for index, account in enumerate(accounts):
            if account.id == account_id:
                del accounts[index]
                return True
        return False

    def delete_accounts_for_customer(self, customer_id: int) -> None:
        accounts[:] = [account for account in accounts if account.customer_id != customer_id]
