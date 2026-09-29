from models.customer import Customer, CustomerCreate
from utilities.all_data import customers

class CustomerRepository:
    def get_all_customers( self ) -> list[Customer]:
        return customers

    def create_customer( self, customer_data: CustomerCreate ) -> Customer:
        new_id = max(( customer.id for customer in customers ), default=0 ) + 1
        new_customer = Customer( id=new_id, name=customer_data.name, username=customer_data.username)
        customers.append( new_customer )
        return new_customer
    
    def get_customer_by_id( self, customer_id: int ) -> Customer | None:
        for customer in customers:
            if customer.id == customer_id:
                return customer
        return None

    def get_customer_by_username( self, username: str ) -> Customer | None:
        for customer in customers:
            if customer.username == username:
                return customer
        return None