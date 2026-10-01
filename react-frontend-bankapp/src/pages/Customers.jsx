import { useEffect, useState } from 'react'
import { getCustomers } from '../api/DataService.js'
import CustomerList from '../components/CustomerList.jsx'

function Customers() {
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isCurrent = true

    async function loadCustomers() {
      try {
        const customerData = await getCustomers()
        if (isCurrent) {
          setCustomers(customerData)
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(requestError.message)
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    loadCustomers()

    return () => {
      isCurrent = false
    }
  }, [])

  return (
    <section>
      <h2>Customers</h2>
      {isLoading && <p>Loading customers from the backend...</p>}
      {error && <p role="alert">Could not load customers: {error}</p>}
      {!isLoading && !error && customers.length === 0 && (
        <p>No customers found.</p>
      )}
      {!isLoading && !error && customers.length > 0 && (
        <CustomerList customers={customers} />
      )}
    </section>
  )
}

export default Customers
