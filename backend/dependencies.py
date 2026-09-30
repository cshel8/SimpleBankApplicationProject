from repositories.account_repository import AccountRepository
from repositories.customer_repository import CustomerRepository
from services.account_service import AccountService
from services.customer_service import CustomerService

customer_repository = CustomerRepository()
account_repository = AccountRepository()
customer_service = CustomerService(customer_repository, account_repository)
account_service = AccountService(account_repository, customer_repository)
