class AccountNotFoundException(Exception):
    pass


class InvalidAmountException(Exception):
    pass


class InsufficientFundsException(Exception):
    pass


class SameAccountTransferException(Exception):
    pass


class AccountOwnershipException(Exception):
    pass
