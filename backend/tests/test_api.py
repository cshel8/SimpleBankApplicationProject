from fastapi.testclient import TestClient

from main import app
from utilities.all_data import accounts, customers

client = TestClient(app)


def reset_data():
    accounts.clear()
    customers[:] = customers[:3]


def test_customer_crud_and_duplicate_username():
    reset_data()
    created = client.post("/api/customers", json={"name": "Test Customer", "username": "testcustomer", "password": "securepass123"})
    assert created.status_code == 201
    customer = created.json()
    assert "password_hash" not in customer

    assert client.post("/api/customers", json={"name": "Again", "username": "testcustomer", "password": "securepass123"}).status_code == 409
    assert client.get(f"/api/customers/{customer['id']}").status_code == 200
    assert client.put(f"/api/customers/{customer['id']}", json={"name": "Updated"}).json()["name"] == "Updated"
    assert client.delete(f"/api/customers/{customer['id']}").status_code == 204
    assert client.get(f"/api/customers/{customer['id']}").status_code == 404


def test_account_crud_deposit_withdraw_and_cascade_delete():
    reset_data()
    assert client.post("/api/customers/99999/accounts", json={}).status_code == 404
    created = client.post("/api/customers/1/accounts", json={"account_type": "savings", "opening_balance": "10.00"})
    assert created.status_code == 201
    account_id = created.json()["id"]

    assert client.post(f"/api/accounts/{account_id}/deposit", json={"amount": "5.25"}).json()["balance"] == "15.25"
    assert client.post(f"/api/accounts/{account_id}/withdraw", json={"amount": "3.00"}).json()["balance"] == "12.25"
    assert client.post(f"/api/accounts/{account_id}/withdraw", json={"amount": "20.00"}).status_code == 409
    assert client.put(f"/api/accounts/{account_id}", json={"account_type": "checking"}).status_code == 200
    assert client.delete("/api/customers/1").status_code == 204
    assert client.get(f"/api/accounts/{account_id}").status_code == 404
