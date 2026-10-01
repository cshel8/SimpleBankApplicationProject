from decimal import Decimal
from datetime import datetime, timezone

import pytest
from bson import ObjectId
from bson.decimal128 import Decimal128
from pydantic import ValidationError

from exceptions.account_exceptions import InsufficientFundsException
from exceptions.customer_exceptions import CustomerNotFoundException, DuplicateUsernameException
from models.account import Account, AccountCreate, AccountUpdate, TransferCreate
from models.audit import AuditRecord
from models.customer import Customer, CustomerCreate, CustomerUpdate
from repositories.account_repository import AccountRepository
from repositories.customer_repository import CustomerRepository
from services.account_service import AccountService
from services.audit_service import AuditService
from services.customer_service import CustomerService


class FakeCustomerRepository:
    def __init__(self):
        self.customers = {}
        self.password_hashes = {}

    def get_all_customers(self): return list(self.customers.values())
    def get_customer_by_id(self, customer_id): return self.customers.get(customer_id)
    def get_customer_by_username(self, username): return next((c for c in self.customers.values() if c.username == username), None)
    def create_customer(self, name, username, password_hash):
        customer = Customer(id=f"customer-{len(self.customers) + 1}", name=name, username=username, created_at=datetime.now(timezone.utc))
        self.customers[customer.id] = customer
        self.password_hashes[customer.id] = password_hash
        return customer
    def update_customer(self, customer_id, name, username):
        customer = self.customers.get(customer_id)
        if customer: customer.name, customer.username = name, username
        return customer
    def delete_customer(self, customer_id): return self.customers.pop(customer_id, None) is not None
    def search_customers(self, query):
        query = query.lower()
        return [c for c in self.customers.values() if query in c.name.lower() or query in c.username.lower()]


class FakeAccountRepository:
    def __init__(self): self.accounts = {}; self.deleted_customer_ids = []
    def get_all_accounts(self): return list(self.accounts.values())
    def get_premium_accounts(self, threshold): return [a for a in self.accounts.values() if a.balance >= threshold]
    def get_account_by_id(self, account_id): return self.accounts.get(account_id)
    def create_account(self, customer_id, account_type, balance):
        account = Account(id=f"account-{len(self.accounts) + 1}", customer_id=customer_id, account_type=account_type, balance=balance, created_at=datetime.now(timezone.utc))
        self.accounts[account.id] = account
        return account
    def update_account(self, account_id, account_type):
        account = self.accounts.get(account_id)
        if account: account.account_type = account_type
        return account
    def deposit(self, account_id, amount, audit_repository):
        account = self.accounts.get(account_id)
        if account:
            account.balance += amount
            audit_repository.create_record("deposit", account.customer_id, None, account_id, amount, session=object())
        return account
    def withdraw(self, account_id, amount, audit_repository):
        account = self.accounts.get(account_id)
        if account and account.balance >= amount:
            account.balance -= amount
            audit_repository.create_record("withdrawal", account.customer_id, account_id, None, amount, session=object())
        else:
            return None
        return account
    def delete_account(self, account_id): return self.accounts.pop(account_id, None) is not None
    def delete_accounts_for_customer(self, customer_id):
        self.deleted_customer_ids.append(customer_id)
        self.accounts = {key: value for key, value in self.accounts.items() if value.customer_id != customer_id}
    def transfer(self, from_id, to_id, amount, audit_repository):
        source, destination = self.accounts.get(from_id), self.accounts.get(to_id)
        if source is None or destination is None or source.balance < amount: return None
        source.balance -= amount; destination.balance += amount
        audit_repository.create_record("transfer", source.customer_id, from_id, to_id, amount, session=object())
        return source, destination


class FakeAuditRepository:
    def __init__(self): self.records = []
    def create_record(self, action_type, customer_id, from_account_id, to_account_id, amount, session=None):
        record = AuditRecord(id=f"record-{len(self.records) + 1}", action_type=action_type, customer_id=customer_id, from_account_id=from_account_id, to_account_id=to_account_id, amount=amount, timestamp="2026-01-01T00:00:00Z")
        self.records.append(record); return record
    def get_all_records(self): return list(self.records)
    def get_record_by_id(self, record_id): return next((r for r in self.records if r.id == record_id), None)
    def get_records_for_account(self, account_id): return [r for r in self.records if account_id in (r.from_account_id, r.to_account_id)]


@pytest.fixture
def services():
    customers, accounts, audits = FakeCustomerRepository(), FakeAccountRepository(), FakeAuditRepository()
    audit_service = AuditService(audits)
    return CustomerService(customers, accounts), AccountService(accounts, customers, audit_service), audits


def test_customer_crud_duplicate_search_and_cascade(services):
    customer_service, account_service, _ = services
    customer = customer_service.create_customer(CustomerCreate(name="Jane Smith", username="janesmith", password="securepass123"))
    assert customer.created_at is not None and customer.created_at.tzinfo == timezone.utc
    assert customer_service.update_customer(customer.id, CustomerUpdate(name="Jane Updated")).name == "Jane Updated"
    assert customer_service.search_customers("JANE") == [customer]
    assert customer_service.customer_repository.password_hashes[customer.id] != "securepass123"
    with pytest.raises(DuplicateUsernameException):
        customer_service.create_customer(CustomerCreate(name="Other", username="janesmith", password="securepass123"))
    account_service.create_account(customer.id, AccountCreate(opening_balance=Decimal("10")))
    customer_service.delete_customer(customer.id)
    assert not account_service.get_all_accounts()


def test_account_crud_deposit_withdraw_filter_and_audit(services):
    customer_service, account_service, audits = services
    customer = customer_service.create_customer(CustomerCreate(name="Jane", username="jane", password="securepass123"))
    account = account_service.create_account(customer.id, AccountCreate(account_type="savings", opening_balance=Decimal("100")))
    assert account.created_at is not None and account.created_at.tzinfo == timezone.utc
    assert account_service.update_account(account.id, AccountUpdate(account_type="checking")).account_type == "checking"
    assert account_service.deposit(account.id, Decimal("25")).balance == Decimal("125")
    assert account_service.withdraw(account.id, Decimal("20")).balance == Decimal("105")
    assert [record.action_type for record in audits.records] == ["deposit", "withdrawal"]
    assert audits.records[0].from_account_id is None and audits.records[0].to_account_id == account.id
    assert audits.records[1].from_account_id == account.id and audits.records[1].to_account_id is None
    assert account_service.get_premium_accounts(Decimal("100")) == [account]
    with pytest.raises(InsufficientFundsException): account_service.withdraw(account.id, Decimal("106"))
    assert len(audits.records) == 2


def test_transfer_and_account_history(services):
    customer_service, account_service, audits = services
    customer = customer_service.create_customer(CustomerCreate(name="Jane", username="jane", password="securepass123"))
    source = account_service.create_account(customer.id, AccountCreate(opening_balance=Decimal("50")))
    destination = account_service.create_account(customer.id, AccountCreate(opening_balance=Decimal("10")))
    result = account_service.transfer(TransferCreate(from_account_id=source.id, to_account_id=destination.id, amount=Decimal("15")))
    assert (result.from_account.balance, result.to_account.balance) == (Decimal("35"), Decimal("25"))
    assert audits.records[0].action_type == "transfer"
    assert audits.records[0].from_account_id == source.id and audits.records[0].to_account_id == destination.id
    assert AuditService(audits).get_records_for_account(destination.id) == audits.records
    with pytest.raises(InsufficientFundsException):
        account_service.transfer(TransferCreate(from_account_id=source.id, to_account_id=destination.id, amount=Decimal("36")))
    assert len(audits.records) == 1


def test_account_creation_requires_existing_customer_and_account_type_is_limited(services):
    _, account_service, _ = services
    with pytest.raises(CustomerNotFoundException):
        account_service.create_account("missing", AccountCreate())
    with pytest.raises(ValidationError):
        AccountCreate(account_type="premium")


class InsertOnlyCollection:
    def __init__(self): self.document = None
    def insert_one(self, document):
        self.document = document
        return type("InsertResult", (), {"inserted_id": ObjectId()})()


def test_repository_created_at_and_legacy_document_handling():
    customer_collection, account_collection = InsertOnlyCollection(), InsertOnlyCollection()
    customer_repository = CustomerRepository.__new__(CustomerRepository)
    account_repository = AccountRepository.__new__(AccountRepository)
    customer_repository.collection, account_repository.collection = customer_collection, account_collection

    customer = customer_repository.create_customer("Jane", "jane", "hash")
    account = account_repository.create_account(str(ObjectId()), "checking", Decimal("10.00"))
    assert customer.created_at is not None and customer_collection.document["created_at"] == customer.created_at
    assert account is not None and account.created_at is not None and account_collection.document["created_at"] == account.created_at

    legacy_customer = CustomerRepository._to_customer({"_id": ObjectId(), "name": "Legacy", "username": "legacy"})
    legacy_account = AccountRepository._to_account({"_id": ObjectId(), "customer_id": ObjectId(), "account_type": "checking", "balance": Decimal128("1.00")})
    assert legacy_customer.created_at is None and legacy_account.created_at is None
