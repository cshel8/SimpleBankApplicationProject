import pytest
from fastapi.testclient import TestClient

import controllers.account_controller as account_controller
import controllers.audit_controller as audit_controller
import controllers.auth_controller as auth_controller
import controllers.customer_controller as customer_controller
import controllers.self_service_controller as self_service_controller
import dependencies
from exceptions.account_exceptions import AccountNotFoundException, AccountOwnershipException
from exceptions.customer_exceptions import CustomerNotFoundException
from main import app
from models.account import Account, TransferCreate, TransferResult
from models.audit import AuditRecord
from models.customer import Customer, CustomerAuthRecord
from services.auth_service import AuthService
from services.customer_service import CustomerService


class AuthorizationFakeCustomerRepository:
    def __init__(self):
        self.customers = {}
        self.password_hashes = {}

    def get_customer_by_id(self, customer_id):
        return self.customers.get(customer_id)

    def get_customer_by_username(self, username):
        return next((customer for customer in self.customers.values() if customer.username == username), None)

    def get_auth_record_by_username(self, username):
        customer = self.get_customer_by_username(username)
        if customer is None:
            return None
        return CustomerAuthRecord(
            id=customer.id,
            username=customer.username,
            password_hash=self.password_hashes[customer.id],
            role=customer.role,
        )

    def create_customer(self, name, username, password_hash, role="customer"):
        customer = Customer(
            id=f"customer-{len(self.customers) + 1}",
            name=name,
            username=username,
            role=role,
        )
        self.customers[customer.id] = customer
        self.password_hashes[customer.id] = password_hash
        return customer


class UnusedAccountRepository:
    pass


class ReadOnlyCustomerService:
    def get_all_customers(self):
        return []

    def get_customer_by_id(self, customer_id):
        raise CustomerNotFoundException("Customer not found.")


class ReadOnlyAccountService:
    def get_all_accounts(self):
        return []


class ReadOnlyAuditService:
    def get_all_records(self):
        return []


class SelfServiceAccountService:
    def __init__(self):
        self.accounts = {
            "first-checking": Account(
                id="first-checking", customer_id="customer-1", account_type="checking", balance=100
            ),
            "first-savings": Account(
                id="first-savings", customer_id="customer-1", account_type="savings", balance=25
            ),
            "second-checking": Account(
                id="second-checking", customer_id="customer-2", account_type="checking", balance=50
            ),
        }

    def get_accounts_for_customer(self, customer_id):
        return [account for account in self.accounts.values() if account.customer_id == customer_id]

    def _owned_account(self, customer_id, account_id):
        account = self.accounts.get(account_id)
        if account is None:
            raise AccountNotFoundException()
        if account.customer_id != customer_id:
            raise AccountOwnershipException()
        return account

    def deposit_for_customer(self, customer_id, account_id, amount):
        account = self._owned_account(customer_id, account_id)
        account.balance += amount
        return account

    def withdraw_for_customer(self, customer_id, account_id, amount):
        account = self._owned_account(customer_id, account_id)
        account.balance -= amount
        return account

    def transfer_for_customer(self, customer_id, transfer_data):
        source = self._owned_account(customer_id, transfer_data.from_account_id)
        destination = self._owned_account(customer_id, transfer_data.to_account_id)
        source.balance -= transfer_data.amount
        destination.balance += transfer_data.amount
        return TransferResult(from_account=source, to_account=destination)


class SelfServiceAuditService:
    def __init__(self):
        self.records = [
            AuditRecord(
                id="first-record",
                action_type="deposit",
                customer_id="customer-1",
                to_account_id="first-checking",
                amount=10,
                timestamp="2026-01-01T00:00:00Z",
            ),
            AuditRecord(
                id="second-record",
                action_type="deposit",
                customer_id="customer-2",
                to_account_id="second-checking",
                amount=10,
                timestamp="2026-01-01T00:00:00Z",
            ),
        ]

    def get_records_for_accounts(self, account_ids):
        return [
            record for record in self.records
            if record.from_account_id in account_ids or record.to_account_id in account_ids
        ]


@pytest.fixture
def authorization_client(monkeypatch):
    repository = AuthorizationFakeCustomerRepository()
    service = AuthService(CustomerService(repository, UnusedAccountRepository()), repository)
    monkeypatch.setattr(dependencies, "auth_service", service)
    monkeypatch.setattr(auth_controller, "auth_service", service)
    monkeypatch.setattr(customer_controller, "customer_service", ReadOnlyCustomerService())
    monkeypatch.setattr(account_controller, "account_service", ReadOnlyAccountService())
    monkeypatch.setattr(audit_controller, "audit_service", ReadOnlyAuditService())
    monkeypatch.setattr(self_service_controller, "account_service", SelfServiceAccountService())
    monkeypatch.setattr(self_service_controller, "audit_service", SelfServiceAuditService())
    return TestClient(app), service


def register_and_login(client, username, password="securepass123"):
    registration = client.post(
        "/api/auth/register",
        json={"name": "Normal Customer", "username": username, "password": password},
    )
    assert registration.status_code == 201
    login = client.post("/api/auth/login", json={"username": username, "password": password})
    assert login.status_code == 200
    return login.json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def test_public_auth_routes_and_me_remain_available_to_customer_and_admin(authorization_client):
    client, service = authorization_client
    customer_token = register_and_login(client, "normalcustomer")
    assert client.get("/api/auth/me", headers=auth_header(customer_token)).json()["role"] == "customer"

    admin = service.bootstrap_admin("adminsecurepass123")
    assert admin is not None
    admin_login = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "adminsecurepass123"},
    )
    assert admin_login.status_code == 200
    assert client.get(
        "/api/auth/me", headers=auth_header(admin_login.json()["access_token"])
    ).json()["role"] == "admin"


def test_admin_routes_distinguish_missing_invalid_customer_and_admin_tokens(authorization_client):
    client, service = authorization_client
    customer_token = register_and_login(client, "normalcustomer")
    service.bootstrap_admin("adminsecurepass123")
    admin_token = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "adminsecurepass123"},
    ).json()["access_token"]

    representative_routes = ["/api/customers", "/api/accounts", "/api/transactions"]
    for route in representative_routes:
        assert client.get(route).status_code == 401
        assert client.get(route, headers={"Authorization": "Bearer invalid"}).status_code == 401
        customer_response = client.get(route, headers=auth_header(customer_token))
        assert customer_response.status_code == 403
        assert customer_response.json()["detail"] == "Admin role required."
        assert client.get(route, headers=auth_header(admin_token)).status_code == 200

    admin_missing_customer = client.get(
        "/api/customers/missing", headers=auth_header(admin_token)
    )
    assert admin_missing_customer.status_code == 404
    assert admin_missing_customer.json()["detail"] == "Customer not found."


def test_every_administrative_route_declares_require_admin():
    expected_routes = {
        ("/api/customers", "GET"),
        ("/api/customers/search", "GET"),
        ("/api/customers/{customer_id}", "GET"),
        ("/api/customers", "POST"),
        ("/api/customers/{customer_id}", "PUT"),
        ("/api/customers/{customer_id}", "DELETE"),
        ("/api/accounts", "GET"),
        ("/api/accounts/premium", "GET"),
        ("/api/accounts/transfer", "POST"),
        ("/api/accounts/{account_id}", "GET"),
        ("/api/customers/{customer_id}/accounts", "POST"),
        ("/api/accounts/{account_id}", "PUT"),
        ("/api/accounts/{account_id}", "DELETE"),
        ("/api/customers/{customer_id}/accounts/{account_id}", "DELETE"),
        ("/api/accounts/{account_id}/deposit", "POST"),
        ("/api/accounts/{account_id}/withdraw", "POST"),
        ("/api/transactions", "GET"),
        ("/api/transactions/account/{account_id}", "GET"),
        ("/api/transactions/{record_id}", "GET"),
    }
    routes = [
        route
        for router in (customer_controller.router, account_controller.router, audit_controller.router)
        for route in router.routes
    ]
    assert {
        (route.path, method)
        for route in routes
        for method in route.methods
    } == expected_routes
    for route in routes:
        assert any(dependency.call is dependencies.require_admin for dependency in route.dependant.dependencies)


def test_openapi_marks_administrative_routes_as_bearer_protected():
    schema = app.openapi()
    for path in ("/api/customers", "/api/accounts", "/api/transactions"):
        assert schema["paths"][path]["get"]["security"] == [{"HTTPBearer": []}]

    assert "security" not in schema["paths"]["/api/auth/register"]["post"]
    assert "security" not in schema["paths"]["/api/auth/login"]["post"]
    assert schema["paths"]["/api/auth/me"]["get"]["security"] == [{"HTTPBearer": []}]


def test_customer_self_service_routes_enforce_authenticated_account_ownership(authorization_client):
    client, _ = authorization_client
    first_token = register_and_login(client, "firstcustomer")
    second_token = register_and_login(client, "secondcustomer")

    assert client.get("/api/me/accounts").status_code == 401
    assert client.get("/api/me/transactions").status_code == 401

    own_accounts = client.get("/api/me/accounts", headers=auth_header(first_token))
    assert own_accounts.status_code == 200
    assert [account["id"] for account in own_accounts.json()] == ["first-checking", "first-savings"]

    own_transactions = client.get("/api/me/transactions", headers=auth_header(first_token))
    assert own_transactions.status_code == 200
    assert [record["id"] for record in own_transactions.json()] == ["first-record"]

    assert client.post(
        "/api/me/accounts/first-checking/deposit",
        json={"amount": "10.00"},
        headers=auth_header(first_token),
    ).status_code == 200
    assert client.post(
        "/api/me/accounts/second-checking/deposit",
        json={"amount": "10.00"},
        headers=auth_header(first_token),
    ).status_code == 403
    assert client.post(
        "/api/me/accounts/first-checking/withdraw",
        json={"amount": "5.00"},
        headers=auth_header(first_token),
    ).status_code == 200
    assert client.post(
        "/api/me/accounts/second-checking/withdraw",
        json={"amount": "5.00"},
        headers=auth_header(first_token),
    ).status_code == 403

    transfer_response = client.post(
        "/api/me/accounts/transfer",
        json={
            "from_account_id": "first-checking",
            "to_account_id": "first-savings",
            "amount": "10.00",
        },
        headers=auth_header(first_token),
    )
    assert transfer_response.status_code == 200
    assert client.post(
        "/api/me/accounts/transfer",
        json={
            "from_account_id": "second-checking",
            "to_account_id": "first-savings",
            "amount": "1.00",
        },
        headers=auth_header(first_token),
    ).status_code == 403
    assert client.post(
        "/api/me/accounts/transfer",
        json={
            "from_account_id": "first-checking",
            "to_account_id": "second-checking",
            "amount": "1.00",
        },
        headers=auth_header(first_token),
    ).status_code == 403

    assert client.get("/api/me/accounts", headers=auth_header(second_token)).json()[0]["id"] == "second-checking"
