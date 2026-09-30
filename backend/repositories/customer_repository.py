from models.customer import Customer, CustomerStored
from utilities.all_data import customers


class CustomerRepository:
    def get_all_customers(self) -> list[Customer]:
        return customers

    def create_customer(
        self,
        name: str,
        username: str,
        password_hash: str
    ) -> Customer:

        new_id = max((customer.id for customer in customers), default=0) + 1

        new_customer = CustomerStored(
            id=new_id,
            name=name,
            username=username,
            password_hash=password_hash
        )

        customers.append(new_customer)

        return Customer(
            id=new_customer.id,
            name=new_customer.name,
            username=new_customer.username
        )

    def get_customer_by_id(self, customer_id: int) -> Customer | None:
        for customer in customers:
            if customer.id == customer_id:
                return customer
        return None

    def get_customer_by_username(self, username: str) -> Customer | None:
        for customer in customers:
            if customer.username == username:
                return customer
        return None

    def update_customer(
        self,
        customer_id: int,
        name: str,
        username: str
    ) -> Customer | None:
        for customer in customers:
            if customer.id == customer_id:
                customer.name = name
                customer.username = username

                return Customer(
                    id=customer.id,
                    name=customer.name,
                    username=customer.username
                )
        return None

    def delete_customer(self, customer_id: int) -> bool:
        for index, customer in enumerate(customers):
            if customer.id == customer_id:
                del customers[index]
                return True
        return False
