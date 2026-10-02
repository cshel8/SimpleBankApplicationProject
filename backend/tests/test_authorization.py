import pytest
from fastapi.testclient import TestClient

import controllers.account_controller as account_controller
import controllers.audit_controller as audit_controller
import controllers.auth_controller as auth_controller
import controllers.customer_controller as customer_controller
import dependencies
from exceptions.customer_exceptions import CustomerNotFoundException
from main import app
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


@pytest.fixture
def authorization_client(monkeypatch):
    repository = AuthorizationFakeCustomerRepository()
    service = AuthService(CustomerService(repository, UnusedAccountRepository()), repository)
    monkeypatch.setattr(dependencies, "auth_service", service)
    monkeypatch.setattr(auth_controller, "auth_service", service)
    monkeypatch.setattr(customer_controller, "customer_service", ReadOnlyCustomerService())
    monkeypatch.setattr(account_controller, "account_service", ReadOnlyAccountService())
    monkeypatch.setattr(audit_controller, "audit_service", ReadOnlyAuditService())
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
