from exceptions.audit_exceptions import AuditRecordNotFoundException
from models.audit import AuditRecord
from repositories.audit_repository import AuditRepository


class AuditService:
    def __init__(self, audit_repository: AuditRepository):
        self.audit_repository = audit_repository

    def get_all_records(self) -> list[AuditRecord]:
        return self.audit_repository.get_all_records()

    def get_record_by_id(self, record_id: str) -> AuditRecord:
        record = self.audit_repository.get_record_by_id(record_id)
        if record is None:
            raise AuditRecordNotFoundException("Transaction record not found.")
        return record

    def get_records_for_account(self, account_id: str) -> list[AuditRecord]:
        return self.audit_repository.get_records_for_account(account_id)
