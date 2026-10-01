import { useEffect, useState } from 'react'
import './App.css'
import { getCustomers } from './api/DataService.js'

function App() {
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
    <main>
      <h1>Bank Application</h1>
      {isLoading && <p>Loading customers from the backend...</p>}
      {error && <p role="alert">Could not load customers: {error}</p>}
      {!isLoading && !error && (
        <section>
          <h2>Customers from FastAPI</h2>
          {customers.length === 0 ? (
            <p>No customers were returned.</p>
          ) : (
            <ul>
              {customers.map((customer) => (
                <li key={customer.id}>
                  {customer.name} (@{customer.username})
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  )
}

export default App
