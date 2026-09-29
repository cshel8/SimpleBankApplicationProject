from fastapi import APIRouter, HTTPException
from exceptions.customer_exceptions import ( 
    CustomerNotFoundException, 
    DuplicateUsernameException 
)
from models.customer import Customer, CustomerCreate
from repositories.customer_repository import CustomerRepository
from services.customer_service import CustomerService

router = APIRouter( prefix="/api" )

customer_repository = CustomerRepository()
customer_service = CustomerService( customer_repository )

@router.get( "/customers", response_model = list[ Customer ] )
def get_all_customers():
    return customer_service.get_all_customers()

@router.get( "/customers/{customer_id}", response_model = Customer )
def get_customer_by_id( customer_id: int ):
    try:
        return customer_service.get_customer_by_id( customer_id )
    except CustomerNotFoundException:
        raise HTTPException( status_code=404, detail="Customer not found." )

@router.post( "/customers", response_model = Customer, status_code=201 )
def create_customer( customer_data: CustomerCreate ):
    try:
        return customer_service.create_customer( customer_data )
    except DuplicateUsernameException:
        raise HTTPException( status_code=409, detail="Username already exists." )