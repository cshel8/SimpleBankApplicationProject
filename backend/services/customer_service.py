from models.customer import Customer, CustomerCreate
from repositories.customer_repository import CustomerRepository
from exceptions.customer_exceptions import ( 
    CustomerNotFoundException, 
    DuplicateUsernameException 
)

class CustomerService:
    def __init__( self, customer_repository: CustomerRepository ):
        self.customer_repository = customer_repository

    def get_all_customers( self ) -> list[ Customer ]:
        return self.customer_repository.get_all_customers()

    def get_customer_by_id( self, customer_id: int ) -> Customer:
        customer = self.customer_repository.get_customer_by_id( customer_id )

        if customer is None:
            raise CustomerNotFoundException( "Customer not found." )

        return customer

    def create_customer( self, customer_data: CustomerCreate ) -> Customer:
        existing_customer = self.customer_repository.get_customer_by_username( customer_data.username )
        if existing_customer is not None:
            raise DuplicateUsernameException( "Username already exists." )
        return self.customer_repository.create_customer( customer_data )