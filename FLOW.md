# Request Flow

The API follows one path for each request:

`Client / Swagger / Postman → Controller → Service → Repository → temporary data → Repository → Service → Controller → HTTP response`

- **Controller**: owns HTTP routes, reads request models, and turns application exceptions into status codes.
- **Service**: owns application rules, such as unique usernames, sufficient funds, and deleting a customer's accounts.
- **Repository**: reads and changes the in-memory lists. It has no HTTP code.
- **Models**: define request and response shapes. Stored customer data includes a password hash, while API responses use `Customer` and never include it.

## Customer flows

- `GET /api/customers` and `GET /api/customers/{id}` call the customer service. A missing ID becomes `404 Not Found`.
- `POST /api/customers` validates the body, checks the username, hashes the password, and stores the customer. A duplicate username becomes `409 Conflict`.
- `PUT /api/customers/{id}` verifies the customer and username before updating it.
- `DELETE /api/customers/{id}` first removes that customer's accounts, then removes the customer. A missing customer is `404`.

## Account flows

- `POST /api/customers/{customer_id}/accounts` verifies that the customer exists before the account repository creates it.
- Account GET, PUT, and DELETE requests pass through `AccountService`; missing accounts become `404`.
- `DELETE /api/customers/{customer_id}/accounts/{account_id}` also verifies that the account belongs to that customer.

## Deposit and withdraw

`POST /api/accounts/{id}/deposit` and `/withdraw` send a positive decimal amount to `AccountService`. Deposit adds to the balance. Withdraw also checks the balance; insufficient funds becomes `409 Conflict`. Pydantic rejects malformed or non-positive request amounts with `422 Unprocessable Entity` before the controller runs.

Application exceptions travel upward from service to controller, where they become HTTP responses. Because controllers only know services and repositories isolate storage, a later MongoDB repository can replace the temporary lists with little or no controller change.
