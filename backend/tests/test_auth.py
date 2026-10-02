from datetime import timedelta

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

import controllers.auth_controller as auth_controller
import dependencies
from main import app
from models.customer import AuthenticatedIdentity, Customer, CustomerAuthRecord
from services.auth_service import AuthService
from services.customer_service import CustomerService
from utilities.jwt_utils import create_access_token


class AuthFakeCustomerRepository:
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


@pytest.fixture
def auth_setup(monkeypatch):
    repository = AuthFakeCustomerRepository()
    customer_service = CustomerService(repository, UnusedAccountRepository())
    service = AuthService(customer_service, repository)
    monkeypatch.setattr(dependencies, "auth_service", service)
    monkeypatch.setattr(auth_controller, "auth_service", service)
    return TestClient(app), repository, service


def register(client, username="janesmith"):
    return client.post(
        "/api/auth/register",
        json={"name": "Jane Smith", "username": username, "password": "securepass123"},
    )


def test_registration_hashes_password_returns_safe_customer_and_forces_customer_role(auth_setup):
    client, repository, _ = auth_setup
    response = register(client)

    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "janesmith"
    assert body["role"] == "customer"
    assert "password" not in body and "password_hash" not in body
    assert repository.password_hashes[body["id"]] != "securepass123"


def test_registration_rejects_duplicate_reserved_and_role_escalation(auth_setup):
    client, _, _ = auth_setup
    assert register(client).status_code == 201
    assert register(client).status_code == 409
    assert register(client, "admin").status_code == 409
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Other Customer",
            "username": "othercustomer",
            "password": "securepass123",
            "role": "admin",
        },
    )
    assert response.status_code == 422


def test_valid_login_and_me_report_the_customer_role(auth_setup):
    client, _, _ = auth_setup
    register(client)
    login_response = client.post(
        "/api/auth/login",
        json={"username": "janesmith", "password": "securepass123"},
    )

    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    me_response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["username"] == "janesmith"
    assert me_response.json()["role"] == "customer"


def test_invalid_missing_invalid_and_expired_tokens_are_rejected(auth_setup):
    client, _, _ = auth_setup
    register(client)
    invalid_login = client.post(
        "/api/auth/login",
        json={"username": "janesmith", "password": "wrongpassword"},
    )
    unknown_login = client.post(
        "/api/auth/login",
        json={"username": "missinguser", "password": "securepass123"},
    )
    assert invalid_login.status_code == unknown_login.status_code == 401
    assert invalid_login.json()["detail"] == unknown_login.json()["detail"] == "Invalid username or password."
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer invalid"}).status_code == 401

    expired_token = create_access_token(
        AuthenticatedIdentity(id="customer-1", username="janesmith", role="customer"),
        expires_delta=timedelta(seconds=-1),
    )
    assert client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"}
    ).status_code == 401


def test_admin_bootstrap_and_role_helper(auth_setup):
    _, _, service = auth_setup
    admin = service.bootstrap_admin("adminsecurepass123")
    assert admin is not None and admin.username == "admin" and admin.role == "admin"
    assert service.bootstrap_admin("anothersecurepass123") is None

    assert dependencies.require_admin(
        AuthenticatedIdentity(id=admin.id, username=admin.username, role="admin")
    ).role == "admin"
    with pytest.raises(HTTPException) as error:
        dependencies.require_admin(
            AuthenticatedIdentity(id="customer-1", username="janesmith", role="customer")
        )
    assert error.value.status_code == 403
