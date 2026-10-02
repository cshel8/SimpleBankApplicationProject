from models.customer import (
    AuthenticatedIdentity,
    Customer,
    LoginRequest,
    RegistrationRequest,
    TokenResponse,
)
from repositories.customer_repository import CustomerRepository
from services.customer_service import CustomerService
from utilities.jwt_utils import create_access_token
from utilities.password_utils import hash_password, verify_password


class InvalidCredentialsException(Exception):
    pass


class AuthenticatedIdentityNotFoundException(Exception):
    pass


class AuthService:
    def __init__(self, customer_service: CustomerService, customer_repository: CustomerRepository):
        self.customer_service = customer_service
        self.customer_repository = customer_repository

    def register(self, registration: RegistrationRequest) -> Customer:
        # CustomerService keeps registration rules, duplicate checks, and hashing in one place.
        return self.customer_service.create_customer(registration)

    def login(self, credentials: LoginRequest) -> TokenResponse:
        auth_record = self.customer_repository.get_auth_record_by_username(credentials.username)
        if auth_record is None or not verify_password(credentials.password, auth_record.password_hash):
            raise InvalidCredentialsException("Invalid username or password.")

        identity = AuthenticatedIdentity(
            id=auth_record.id,
            username=auth_record.username,
            role=auth_record.role,
        )
        return TokenResponse(access_token=create_access_token(identity))

    def get_identity_from_claims(self, claims: dict) -> AuthenticatedIdentity:
        customer_id = claims.get("sub")
        if not isinstance(customer_id, str):
            raise AuthenticatedIdentityNotFoundException()

        customer = self.customer_repository.get_customer_by_id(customer_id)
        if customer is None:
            raise AuthenticatedIdentityNotFoundException()

        # The stored role, not an arbitrary request value, is authoritative.
        return AuthenticatedIdentity(
            id=customer.id,
            username=customer.username,
            role=customer.role,
        )

    def bootstrap_admin(self, password: str, name: str = "Administrator") -> Customer | None:
        """Create the one reserved admin only when explicitly invoked by the bootstrap script."""
        if self.customer_repository.get_customer_by_username("admin") is not None:
            return None
        return self.customer_repository.create_customer(
            name=name,
            username="admin",
            password_hash=hash_password(password),
            role="admin",
        )
