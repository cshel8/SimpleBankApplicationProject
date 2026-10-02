from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_current_identity, auth_service
from exceptions.customer_exceptions import DuplicateUsernameException, ReservedUsernameException
from models.customer import AuthenticatedIdentity, Customer, LoginRequest, RegistrationRequest, TokenResponse
from services.auth_service import InvalidCredentialsException


router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=Customer,
    status_code=status.HTTP_201_CREATED,
    summary="Register a normal customer account",
    responses={409: {"description": "Username already exists or is reserved."}},
)
def register(registration: RegistrationRequest):
    try:
        return auth_service.register(registration)
    except DuplicateUsernameException:
        raise HTTPException(status_code=409, detail="Username already exists.")
    except ReservedUsernameException as error:
        raise HTTPException(status_code=409, detail=str(error))


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in and receive a JWT access token",
    responses={401: {"description": "Invalid username or password."}},
)
def login(credentials: LoginRequest):
    try:
        return auth_service.login(credentials)
    except InvalidCredentialsException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get(
    "/me",
    response_model=AuthenticatedIdentity,
    summary="Get the authenticated identity",
    responses={401: {"description": "Missing, invalid, or expired access token."}},
)
def me(current_identity: AuthenticatedIdentity = Depends(get_current_identity)):
    return current_identity
