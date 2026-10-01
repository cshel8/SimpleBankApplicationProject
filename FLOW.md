# Request Flow

The API follows one path for each request:

`React component → DataService / fetch → HTTP → FastAPI Controller → Service → Repository → MongoDB Atlas → JSON response → React state / render`

The local React/Vite frontend communicates with FastAPI over HTTP. `DataService.js` calls the API using browser `fetch()`, and `App.jsx` stores the JSON result in React state for rendering. CORS middleware permits browser requests from `http://localhost:5173` and `http://127.0.0.1:5173`; it does not change the Controller → Service → Repository flow.

- **Controller**: owns HTTP routes, reads request models, and turns application exceptions into status codes.
- **Service**: owns application rules, such as unique usernames, sufficient funds, and deleting a customer's accounts.
- **Repository**: reads and changes MongoDB collections. It owns BSON `ObjectId` and `Decimal128` conversion and has no HTTP code.
- **Models**: define request and response shapes. Stored customer data includes a password hash, while API responses use `Customer` and never include it.

## Customer flows

- `GET /api/customers` and `GET /api/customers/{id}` call the customer service. A missing ID becomes `404 Not Found`.
- `POST /api/customers` validates the body, checks the username, hashes the password, and stores the customer with a backend-generated UTC `created_at`. A duplicate username becomes `409 Conflict`.
- `PUT /api/customers/{id}` verifies the customer and username before updating it.
- `DELETE /api/customers/{id}` first removes that customer's accounts, then removes the customer. A missing customer is `404`.

## Account flows

- `POST /api/customers/{customer_id}/accounts` verifies that the customer exists before the account repository creates it with a backend-generated UTC `created_at`. Account types are `checking` or `savings`.
- Account GET, PUT, and DELETE requests pass through `AccountService`; missing accounts become `404`.
- `DELETE /api/customers/{customer_id}/accounts/{account_id}` also verifies that the account belongs to that customer.

## Deposit and withdraw

`POST /api/accounts/{id}/deposit` and `/withdraw` send a positive decimal amount to `AccountService`. Their repositories update the Decimal128 balance and insert the matching audit record in one MongoDB transaction. Withdraw checks the balance; insufficient funds becomes `409 Conflict`.

`POST /api/accounts/transfer` validates both accounts, sufficient funds, and different account IDs. The repository performs the debit, credit, and transfer audit insert in one MongoDB transaction.

`GET /api/customers/search`, `GET /api/accounts/premium`, and `GET /api/transactions` query MongoDB directly. Transaction history can also be read for one account.

Application exceptions travel upward from service to controller, where they become HTTP responses. Controllers remain independent of BSON details because repositories isolate MongoDB storage concerns.
