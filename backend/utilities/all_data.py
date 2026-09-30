from models.customer import Customer
from models.account import Account

customers = [
    Customer( id=1, name="John Doe", username="johndoe" ),
    Customer( id=2, name="Jane Smith", username="janesmith" ),
    Customer( id=3, name="Alice Johnson", username="alicejohnson" )
]

# Temporary storage. A database repository can replace this list later.
accounts: list[Account] = []
