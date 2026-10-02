# Request Flow

## Deployed request path

`Browser → HTTPS → CloudFront → HTTP S3 static website origin → React application in browser → HTTPS REST request → Lambda Function URL → Mangum → FastAPI Controller → Service → Repository / PyMongo → MongoDB Atlas`

CloudFront delivers the deployed React/Vite build over HTTPS. The browser then calls the Lambda Function URL over HTTPS using the production `VITE_API_BASE_URL`. FastAPI CORS allows the deployed CloudFront origin through runtime configuration. Lambda runs the FastAPI ASGI application through Mangum and has a 30-second timeout for MongoDB-backed requests. Local React/Vite → Uvicorn development remains supported.

## Application request flow

The application follows this path:

`React → DataService / native fetch → HTTP + Bearer JWT when required → FastAPI Controller → Service → Repository → PyMongo → MongoDB Atlas → JSON response → React state / render`

`dependencies.py` is the backend composition point. It creates the repositories and services used by controllers and supplies the reusable authentication dependencies; controllers do not construct MongoDB clients or decode JWTs themselves.

## Authentication and authorization

**Authentication** proves who is making a request. **Authorization** determines what that authenticated identity may do.

### Registration

`React Register form → POST /api/auth/register → AuthController → AuthService / CustomerService → CustomerRepository → MongoDB Atlas`

Registration creates only a normal `customer` account. The backend applies duplicate and reserved-username rules, hashes the submitted password, and never returns a password or password hash. React returns to Sign In after a successful registration; it does not select a role or automatically grant administrative access.

### Login and session restoration

`React Login form → POST /api/auth/login → password-hash verification → signed expiring JWT → React DataService memory → GET /api/auth/me → current identity and role → sessionStorage`

React stores only the access token in `sessionStorage`. On refresh, `App.jsx` restores that token into `DataService.js` and validates it with `GET /api/auth/me`; username and role come from that backend response, not from decoding or trusting frontend storage.

### Protected request

`React → DataService → Authorization: Bearer <JWT> → FastAPI authentication dependency → JWT signature/expiry validation → current stored identity → require_admin → protected controller`

The Customer, Account, and Transaction routers require an admin role. Missing, invalid, or expired tokens return `401`; a valid customer token on an administrative route returns `403`; a valid admin request proceeds through the normal Controller → Service → Repository flow. React role-aware navigation improves usability, but the backend remains the security boundary.

`GET /api/auth/me` is authenticated for either role. `POST /api/auth/login` and `POST /api/auth/register` remain public.

## Customer self-service

Customer self-service uses a separate authenticated namespace:

`React My Accounts/My Transactions → DataService → /api/me/... + Bearer JWT → get_current_identity → ownership-aware service method → Repository → MongoDB Atlas`

`GET /api/me/accounts` derives the customer ID from the validated identity and returns only accounts whose stored `customer_id` matches it. `GET /api/me/transactions` first identifies those owned account IDs, then queries audit records whose source or destination account is in that set.

`POST /api/me/accounts/{id}/deposit`, `/withdraw`, and `/transfer` never accept a customer ID from React. `AccountService` verifies the authenticated identity owns the requested account before it delegates to the existing money-operation methods. A transfer requires ownership of both source and destination accounts. A non-owner receives `403`; a genuinely absent account receives `404`.

## Banking operation example

For a deposit:

`React Deposit form → DataService → POST /api/accounts/{id}/deposit → AccountController → AccountService → AccountRepository → MongoDB Atlas transaction → updated Account JSON → Accounts state`

React sends a plain positive amount and replaces its displayed account only with the backend-returned account; it does not calculate balances itself. Withdrawal follows the same pattern, with the service enforcing sufficient funds. A transfer validates both account IDs and funds in the service, then the repository atomically debits, credits, and writes its audit record.

## Filtering and transaction history

- Customer search, premium-account filtering, and account-specific transaction history are MongoDB-side queries. React sends query input and displays returned results; it does not download all data and filter it locally.
- Successful deposit, withdrawal, and transfer operations create audit records in the `transactions` collection. Each money movement and its audit insert are committed together in a MongoDB transaction, so failed operations do not create audit history.
- Customer and Account pages own page-level API/state coordination. Their list and form components receive data and callback props, keeping HTTP logic in `DataService.js` and page components rather than presentational children.

## Frontend session behavior

`DataService.js` adds the Bearer header to protected requests. A centralized protected-request `401` clears the in-memory token, removes the session token, clears the current user, and returns to Sign In with a session-expired message. A `403` leaves the authenticated session intact and surfaces the authorization error. Sign out is local: it clears the same token/current-user state and does not need a server-side logout endpoint for this stateless JWT design.
