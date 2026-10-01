function CustomerList({ customers }) {
  return (
    <table>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Username</th>
        </tr>
      </thead>
      <tbody>
        {customers.map((customer) => (
          <tr key={customer.id}>
            <td>{customer.name}</td>
            <td>{customer.username}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default CustomerList
