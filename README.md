# Simple Bank Application

Full-stack banking application built with FastAPI, MongoDB Atlas, and React/Vite. It includes JWT authentication, customer/admin roles, protected administrative banking operations, customer self-service banking, account money movements with audit history, and a deployed React frontend.

## Live Deployment

https://d14swpenhkqrb1.cloudfront.net

## Demo Admin Account

Use this intentionally public class-project account to test administrative functionality:

```yaml
Username: admin
Password: Keiser367!
```

## Deployed architecture

`Browser → CloudFront (HTTPS) → S3 static website React frontend → Lambda Function URL (HTTPS) → Mangum → FastAPI → MongoDB Atlas`

- **CloudFront and S3** deliver the production React/Vite build over HTTPS.
- **AWS Lambda Python 3.13** hosts the FastAPI application through the Mangum ASGI adapter; the Lambda Function URL exposes the REST API.
- **MongoDB Atlas** persists customer, account, and transaction data through PyMongo.
- **JWT authentication and backend role authorization** protect customer self-service and administrative operations.

Runtime configuration—including MongoDB connectivity, JWT signing settings, and the deployed CloudFront CORS origin—is supplied through environment variables and is not committed to the repository. Lambda is configured with a 30-second timeout for MongoDB-backed requests.
