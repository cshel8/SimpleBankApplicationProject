# Technology Stack

- **Python**: application language.
- **FastAPI**: HTTP framework and automatic OpenAPI/Swagger documentation.
- **React / Vite**: local frontend development environment, connected to FastAPI over HTTP.
- **CORS middleware**: permits the two local Vite development origins to call the API from a browser.
- **Pydantic**: request validation and response serialization.
- **Uvicorn**: ASGI server used to run the API.
- **pwdlib / Argon2**: password hashing.
- **MongoDB Atlas / PyMongo**: persistent document storage accessed through repositories.
- **BSON ObjectId and Decimal128**: MongoDB ID and monetary-storage formats, converted at repository boundaries to strings and Python `Decimal` values.
- **BSON datetime / UTC timestamps**: repositories generate and persist `created_at` values for new customers and accounts.
- **MongoDB sessions/transactions**: keep each money movement and its audit record atomic.
- **python-dotenv**: loads local MongoDB configuration from ignored environment files.
