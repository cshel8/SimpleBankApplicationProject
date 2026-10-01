from repositories.account_repository import AccountRepository
from repositories.audit_repository import AuditRepository
from repositories.customer_repository import CustomerRepository
from services.account_service import AccountService
from services.audit_service import AuditService
from services.customer_service import CustomerService

customer_repository = CustomerRepository()
account_repository = AccountRepository()
audit_repository = AuditRepository()
customer_service = CustomerService(customer_repository, account_repository)
audit_service = AuditService(audit_repository)
account_service = AccountService(account_repository, customer_repository, audit_service)
