# Request Flow

The API follows one path for each request:

`React Customers page → DataService / fetch → HTTP → FastAPI Controller → Service → Repository → MongoDB Atlas → JSON response → React state / render`

## Authentication flow

`POST /api/auth/register` sends normal-customer registration data to `AuthController`, which delegates to `AuthService` and the existing `CustomerService`. The service applies duplicate and reserved-username rules, hashes the password, and `CustomerRepository` stores the normal `customer` role with the customer document. Safe customer responses never include a password or password hash.

`POST /api/auth/login` sends username/password JSON to `AuthController → AuthService → CustomerRepository`. AuthService reads the internal authentication record, verifies the submitted password against its stored hash, then issues a signed, expiring JWT containing only the customer ID (`sub`), username, role, and expiry. Invalid username and invalid password share one generic `401` response.

For `GET /api/auth/me`, the client sends `Authorization: Bearer <token>`. The reusable FastAPI authentication dependency validates the token signature and expiry, then loads the current customer identity. It uses the stored customer role as authoritative before returning safe identity data. `require_admin` is available as the next route-authorization dependency, but existing banking endpoints remain unchanged during this foundation checkpoint.

The Customers, Accounts, and Transaction History routers are the current administrative API. Their router-level `require_admin` dependency runs before controller business logic: missing, invalid, or expired credentials return `401`; a valid customer identity returns `403`; and a valid admin identity proceeds to the unchanged controller → service → repository behavior.

The one admin account is created only by the explicitly run `scripts.bootstrap_admin` command. Its password comes from ignored environment configuration, is hashed with the same password utility, and no public registration route can create an admin.

The local React/Vite frontend communicates with FastAPI over HTTP. `App.jsx` provides a reusable application shell: a persistent desktop sidebar, responsive navigation treatment for smaller screens, page content, and footer. Its `activePage` state still selects Home, Customers, Accounts, or Transactions without adding React Router. The visual shell changes presentation only; API ownership and request flow stay within the existing page components. `Customers.jsx` calls `DataService.js` using browser `fetch()` and stores full-list or backend search-result state for rendering through one `CustomerList.jsx`. Its controlled search form calls `GET /api/customers/search?query=...`; filtering occurs in the MongoDB repository, not in React. `CustomerForm.jsx` passes controlled creation data to a parent callback; `Customers.jsx` calls `POST /api/customers`, then adds the backend-returned customer to the full list. View, Edit, and Delete actions in `CustomerList.jsx` pass a customer ID to parent callbacks. `Customers.jsx` opens `EditCustomerForm.jsx` with the selected customer, calls `PUT /api/customers/{id}`, and replaces that list/detail customer only with the backend-returned response. It uses the ID to call `GET /api/customers/{id}` or, after browser confirmation, `DELETE /api/customers/{id}`. CORS middleware permits browser requests from `http://localhost:5173` and `http://127.0.0.1:5173`; it does not change the Controller → Service → Repository flow.

`Accounts.jsx` owns account API/state behavior. It calls `getAccounts()` for the table and `getCustomers()` for the Create Account customer dropdown. `AccountForm.jsx` owns controlled input values but passes them to its parent callback. `Accounts.jsx` sends the selected customer ID in `POST /api/customers/{customer_id}/accounts`, then adds the backend-returned account to the list. `AccountList.jsx` remains presentational; its View, Edit, and Delete actions pass an account ID back to `Accounts.jsx`. Edit opens `EditAccountForm.jsx`, whose account-type value is submitted through `PUT /api/accounts/{id}`; Delete requires browser confirmation before `DELETE /api/accounts/{id}`. The frontend removes an account from state only after FastAPI confirms deletion.

`DepositForm.jsx` receives the existing accounts as understandable dropdown options and submits a selected ID plus a plain numeric amount to `Accounts.jsx`. The page calls `POST /api/accounts/{id}/deposit` through DataService, then replaces its matching account state only with the backend-returned Account. It clears an active premium-results mode after a deposit because that previous database query may no longer be current.

`WithdrawForm.jsx` follows the same structure with `POST /api/accounts/{id}/withdraw`. It sends a selected account ID and plain positive amount to `Accounts.jsx`, which replaces normal-list/detail state only with the backend-returned Account. Insufficient-funds errors leave the account state unchanged, and successful withdrawals clear active premium results because they may be stale.

`TransferForm.jsx` submits distinct source/destination account IDs plus a plain positive amount to `POST /api/accounts/transfer`. The backend returns both updated accounts, and `Accounts.jsx` replaces both matching normal-list entries and any matching Account Details from that response. Successful transfers clear premium mode because the database query results may be stale.

The Premium Accounts form sends its controlled, nonnegative threshold to `getPremiumAccounts()` and `GET /api/accounts/premium?threshold=...`. The AccountRepository queries MongoDB for balances greater than or equal to the Decimal128 threshold, so React receives only qualifying accounts. `Accounts.jsx` keeps those results separate from the normal account list and switches the account-list area to the read-only `PremiumAccountList.jsx` after a successful query. Show all accounts exits this mode without another GET request.

`Transactions.jsx` loads all audit records through `GET /api/transactions` and renders them through `TransactionList.jsx`. Its account-history form sends the selected full account ID to `GET /api/transactions/account/{id}`; the AuditRepository filters MongoDB records for that account, rather than React filtering the all-transactions list. A View action calls `GET /api/transactions/{id}` and displays the backend-returned record on the same page.

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

- `GET /api/accounts` loads the Accounts table. Its View action calls `GET /api/accounts/{id}` as a separate request, so it demonstrates the individual-account endpoint rather than reusing a table object. A missing account becomes a detail-request error while the existing table stays visible.
- `GET /api/customers` supplies the Create Account dropdown. It displays customer name/username but uses the selected customer's string ID as the value sent to `POST /api/customers/{customer_id}/accounts`. The request body contains `account_type` (`checking` or `savings`) and a nonnegative `opening_balance`; a successful response is appended to the AccountList.
- `PUT /api/accounts/{id}` accepts only `account_type` through the prepopulated edit form. On a successful response, the frontend replaces the matching account in AccountList and Account Details; missing accounts become an update error while existing state remains unchanged.
- `DELETE /api/accounts/{id}` uses the direct account-resource endpoint. After browser confirmation and backend `204 No Content`, the frontend removes only that ID from AccountList and clears matching details/editing state. Failed deletion leaves the existing UI state unchanged.
- `GET /api/accounts/premium?threshold=...` asks the backend/database for accounts whose balance is at least the supplied nonnegative threshold. Successful results replace the visible normal AccountList in the account-list area until Show all accounts restores it; React does not determine premium eligibility by filtering the full account list.
- `POST /api/accounts/{id}/deposit` receives a positive `{ "amount": ... }` body. React does not calculate a balance; it replaces the normal-list and matching detail account only with the Account returned after the backend completes its atomic balance-and-audit transaction.
- `POST /api/accounts/{id}/withdraw` also receives a positive `{ "amount": ... }` body. The backend enforces sufficient funds and returns `409` when needed; React displays that error without changing the current balance.
- `POST /api/accounts/transfer` receives `{ "from_account_id": ..., "to_account_id": ..., "amount": ... }`. React validates required/different IDs and positive amount, but the backend owns account existence, funds checks, and its atomic debit, credit, and audit transaction. It returns both updated accounts for UI synchronization.
- `POST /api/customers/{customer_id}/accounts` verifies that the customer exists before the account repository creates it with a backend-generated UTC `created_at`. Account types are `checking` or `savings`.
- Account GET, PUT, and DELETE requests pass through `AccountService`; missing accounts become `404`.
- `DELETE /api/customers/{customer_id}/accounts/{account_id}` also verifies that the account belongs to that customer.

## Deposit and withdraw

`POST /api/accounts/{id}/deposit` and `/withdraw` send a positive decimal amount to `AccountService`. Their repositories update the Decimal128 balance and insert the matching audit record in one MongoDB transaction. Withdraw checks the balance; insufficient funds becomes `409 Conflict`.

`POST /api/accounts/transfer` validates both accounts, sufficient funds, and different account IDs. The repository performs the debit, credit, and transfer audit insert in one MongoDB transaction.

`GET /api/customers/search`, `GET /api/accounts/premium`, and `GET /api/transactions` query MongoDB directly. Transaction history can also be read for one account.

Application exceptions travel upward from service to controller, where they become HTTP responses. Controllers remain independent of BSON details because repositories isolate MongoDB storage concerns.
