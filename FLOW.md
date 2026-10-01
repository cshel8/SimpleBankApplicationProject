# Request Flow

The API follows one path for each request:

`React Customers page → DataService / fetch → HTTP → FastAPI Controller → Service → Repository → MongoDB Atlas → JSON response → React state / render`

The local React/Vite frontend communicates with FastAPI over HTTP. `App.jsx` provides the reusable header, navigation, footer, and the current Home or Customers page. `Customers.jsx` calls `DataService.js` using browser `fetch()` and stores full-list or backend search-result state for rendering through one `CustomerList.jsx`. Its controlled search form calls `GET /api/customers/search?query=...`; filtering occurs in the MongoDB repository, not in React. `CustomerForm.jsx` passes controlled creation data to a parent callback; `Customers.jsx` calls `POST /api/customers`, then adds the backend-returned customer to the full list. View, Edit, and Delete actions in `CustomerList.jsx` pass a customer ID to parent callbacks. `Customers.jsx` opens `EditCustomerForm.jsx` with the selected customer, calls `PUT /api/customers/{id}`, and replaces that list/detail customer only with the backend-returned response. It uses the ID to call `GET /api/customers/{id}` or, after browser confirmation, `DELETE /api/customers/{id}`. CORS middleware permits browser requests from `http://localhost:5173` and `http://127.0.0.1:5173`; it does not change the Controller → Service → Repository flow.

- **Controller**: owns HTTP routes, reads request models, and turns application exceptions into status codes.
- **Service**: owns application rules, such as unique usernames, sufficient funds, and deleting a customer's accounts.
- **Repository**: reads and changes MongoDB collections. It owns BSON `ObjectId` and `Decimal128` conversion and has no HTTP code.
- **Models**: define request and response shapes. Stored customer data includes a password hash, while API responses use `Customer` and never include it.

## Customer flows

- `GET /api/customers` loads the Customers page table. Its View action calls `GET /api/customers/{id}` as a separate request, so the page demonstrates the individual-customer REST endpoint rather than reusing the list object. A missing ID becomes `404 Not Found`, which the page displays as a detail-request error.
- `GET /api/customers/search?query=...` is called only for nonblank submitted search text. It asks MongoDB to find case-insensitive name/username matches and passes the returned list to the same CustomerList component. Clearing the search restores the already loaded full list without another request.
- `POST /api/customers` receives JSON from the Customers form, validates the body, checks the username, hashes the password, and stores the customer with a backend-generated UTC `created_at`. The frontend uses the returned safe customer response to update its table and clears the password-containing form state. A duplicate username becomes `409 Conflict` and is displayed as a creation error.
- `PUT /api/customers/{id}` receives only editable `name` and `username` JSON from the prepopulated edit form. The frontend replaces the matching customer in its list and matching Customer Details with the returned response only after a successful PUT. Missing customers return `404`; duplicate usernames return `409`.
- `DELETE /api/customers/{id}` requires browser confirmation in the frontend. On backend `204 No Content`, the page removes that ID from local state and clears matching displayed details. The backend service removes that customer's accounts first, then the customer; transaction/audit records are not deleted by this customer-delete flow.
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
