from fastapi import APIRouter, Depends, HTTPException, Query
from exceptions.customer_exceptions import ( 
    CustomerNotFoundException, 
    DuplicateUsernameException,
    ReservedUsernameException,
)
from models.customer import Customer, CustomerCreate, CustomerUpdate
from dependencies import customer_service, require_admin

router = APIRouter(prefix="/api", tags=["Customers"], dependencies=[Depends(require_admin)])

@router.get("/customers", response_model=list[Customer], summary="Get all customers")
def get_all_customers():
    return customer_service.get_all_customers()

@router.get(
    "/customers/search",
    response_model=list[Customer],
    summary="Search customers by name or username",
)
def search_customers(query: str = Query(min_length=1, description="Text to find in a customer name or username")):
    return customer_service.search_customers(query)

@router.get(
    "/customers/{customer_id}",
    response_model=Customer,
    summary="Get a customer by ID",
    responses={404: {"description": "Customer not found."}},
)
def get_customer_by_id( customer_id: str ):
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
    except ReservedUsernameException as error:
        raise HTTPException(status_code=409, detail=str(error))

@router.put(
    "/customers/{customer_id}",
    response_model=Customer,
    summary="Update a customer",
    responses={
        404: {"description": "Customer not found."},
        409: {"description": "Username already exists."},
    },
)
def update_customer( customer_id: str, customer_data: CustomerUpdate ):
    try:
        return customer_service.update_customer( customer_id, customer_data )

    except CustomerNotFoundException:
        raise HTTPException( status_code=404, detail="Customer not found." )

    except DuplicateUsernameException:
        raise HTTPException( status_code=409, detail="Username already exists." )
    except ReservedUsernameException as error:
        raise HTTPException(status_code=409, detail=str(error))


@router.delete(
    "/customers/{customer_id}",
    status_code=204,
    summary="Delete a customer and their accounts",
    responses={404: {"description": "Customer not found."}},
)
def delete_customer(customer_id: str):
    try:
        customer_service.delete_customer(customer_id)
    except CustomerNotFoundException:
        raise HTTPException(status_code=404, detail="Customer not found.")
