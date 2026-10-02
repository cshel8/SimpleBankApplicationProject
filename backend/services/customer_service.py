from models.customer import Customer, CustomerCreate, CustomerUpdate
from repositories.customer_repository import CustomerRepository
from repositories.account_repository import AccountRepository
from exceptions.customer_exceptions import ( 
    CustomerNotFoundException, 
    DuplicateUsernameException,
    ReservedUsernameException,
)
from utilities.password_utils import hash_password


class CustomerService:
    def __init__(self, customer_repository: CustomerRepository, account_repository: AccountRepository):
        self.customer_repository = customer_repository
        self.account_repository = account_repository

    def get_all_customers( self ) -> list[ Customer ]:
        return self.customer_repository.get_all_customers()

    def search_customers(self, query: str) -> list[Customer]:
        return self.customer_repository.search_customers(query)

    def get_customer_by_id( self, customer_id: str ) -> Customer:
        customer = self.customer_repository.get_customer_by_id( customer_id )

        if customer is None:
            raise CustomerNotFoundException( "Customer not found." )

        return customer

    def create_customer( self, customer_data: CustomerCreate ) -> Customer:
        if customer_data.username.lower() == "admin":
            raise ReservedUsernameException("Username is reserved.")
        existing_customer = self.customer_repository.get_customer_by_username( customer_data.username )
        if existing_customer is not None:
            raise DuplicateUsernameException( "Username already exists." )
        password_hash = hash_password( customer_data.password )
        return self.customer_repository.create_customer(
            customer_data.name,
            customer_data.username,
            password_hash
        )

    def update_customer( self, customer_id: str, customer_data: CustomerUpdate ) -> Customer:

        customer = self.customer_repository.get_customer_by_id( customer_id )
        if customer is None:
            raise CustomerNotFoundException( "Customer not found." )
        username = customer_data.username if customer_data.username is not None else customer.username
        if username.lower() == "admin" and customer.role != "admin":
            raise ReservedUsernameException("Username is reserved.")
        name = customer_data.name if customer_data.name is not None else customer.name
        existing_customer = self.customer_repository.get_customer_by_username(username)
        if existing_customer is not None and existing_customer.id != customer_id:
            raise DuplicateUsernameException( "Username already exists." )

        updated_customer = self.customer_repository.update_customer(
            customer_id,
            name,
            username
        )
        if updated_customer is None:
            raise CustomerNotFoundException("Customer not found.")
        return updated_customer

    def delete_customer(self, customer_id: str) -> None:
        customer = self.customer_repository.get_customer_by_id(customer_id)
        if customer is None:
            raise CustomerNotFoundException("Customer not found.")
        self.account_repository.delete_accounts_for_customer(customer_id)
        self.customer_repository.delete_customer(customer_id)
