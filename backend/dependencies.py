from repositories.account_repository import AccountRepository
from repositories.audit_repository import AuditRepository
from repositories.customer_repository import CustomerRepository
from services.account_service import AccountService
from services.audit_service import AuditService
from services.auth_service import AuthService, AuthenticatedIdentityNotFoundException
from services.customer_service import CustomerService
from utilities.jwt_utils import ExpiredSignatureError, InvalidTokenError, decode_access_token
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from models.customer import AuthenticatedIdentity

customer_repository = CustomerRepository()
account_repository = AccountRepository()
audit_repository = AuditRepository()
customer_service = CustomerService(customer_repository, account_repository)
audit_service = AuditService(audit_repository)
account_service = AccountService(account_repository, customer_repository, audit_service)
auth_service = AuthService(customer_service, customer_repository)

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_identity(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthenticatedIdentity:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        claims = decode_access_token(credentials.credentials)
        return auth_service.get_identity_from_claims(claims)
    except (ExpiredSignatureError, InvalidTokenError, AuthenticatedIdentityNotFoundException):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_admin(
    current_identity: AuthenticatedIdentity = Depends(get_current_identity),
) -> AuthenticatedIdentity:
    if current_identity.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")
    return current_identity
