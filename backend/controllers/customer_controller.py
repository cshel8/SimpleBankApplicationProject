from fastapi import APIRouter, HTTPException
from exceptions.customer_exceptions import ( 
    CustomerNotFoundException, 
    DuplicateUsernameException 
)
from models.customer import Customer, CustomerCreate, CustomerUpdate
from dependencies import customer_service

router = APIRouter(prefix="/api", tags=["Customers"])

@router.get("/customers", response_model=list[Customer], summary="Get all customers")
def get_all_customers():
    return customer_service.get_all_customers()

@router.get(
    "/customers/{customer_id}",
    response_model=Customer,
    summary="Get a customer by ID",
    responses={404: {"description": "Customer not found."}},
)
def get_customer_by_id( customer_id: int ):
    try:
        return customer_service.get_customer_by_id( customer_id )
    except CustomerNotFoundException:
        raise HTTPException( status_code=404, detail="Customer not found." )

@router.post(
    "/customers",
    response_model=Customer,
    status_code=201,
    summary="Create a customer",
    responses={409: {"description": "Username already exists."}},
)
def create_customer( customer_data: CustomerCreate ):
    try:
        return customer_service.create_customer( customer_data )
    except DuplicateUsernameException:
        raise HTTPException( status_code=409, detail="Username already exists." )

@router.put(
    "/customers/{customer_id}",
    response_model=Customer,
    summary="Update a customer",
    responses={
        404: {"description": "Customer not found."},
        409: {"description": "Username already exists."},
    },
)
def update_customer( customer_id: int, customer_data: CustomerUpdate ):
    try:
        return customer_service.update_customer( customer_id, customer_data )

    except CustomerNotFoundException:
        raise HTTPException( status_code=404, detail="Customer not found." )

    except DuplicateUsernameException:
        raise HTTPException( status_code=409, detail="Username already exists." )


@router.delete(
    "/customers/{customer_id}",
    status_code=204,
    summary="Delete a customer and their accounts",
    responses={404: {"description": "Customer not found."}},
)
def delete_customer(customer_id: int):
    try:
        customer_service.delete_customer(customer_id)
    except CustomerNotFoundException:
        raise HTTPException(status_code=404, detail="Customer not found.")
