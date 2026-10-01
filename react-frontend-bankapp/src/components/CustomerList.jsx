function CustomerList({
  customers,
  isDeleting,
  isUpdating,
  onDeleteCustomer,
  onEditCustomer,
  onViewCustomer,
}) {
  return (
    <table>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Username</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {customers.map((customer) => (
          <tr key={customer.id}>
            <td>{customer.name}</td>
            <td>{customer.username}</td>
            <td>
              <button type="button" onClick={() => onViewCustomer(customer.id)}>
                View
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onEditCustomer(customer.id)}
              >
                Edit
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => onDeleteCustomer(customer.id)}
              >
                {isDeleting ? 'Deleting customer...' : 'Delete'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default CustomerList
