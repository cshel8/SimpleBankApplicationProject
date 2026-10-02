import { useEffect, useState } from 'react'
import { getMyTransactions } from '../api/DataService.js'
import TransactionList from '../components/TransactionList.jsx'

function MyTransactions() {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isCurrent = true

    async function loadTransactions() {
      try {
        const transactionData = await getMyTransactions()
        if (isCurrent) {
          setTransactions(transactionData)
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

    loadTransactions()
    return () => { isCurrent = false }
  }, [])

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Self-service banking</p>
        <h1>My Transactions</h1>
        <p className="page-subtitle">Review transaction history for your accounts.</p>
      </div>
      {isLoading && <p>Loading your transactions...</p>}
      {error && <p role="alert">Could not load your transactions: {error}</p>}
      {!isLoading && !error && transactions.length === 0 && <p>No transactions found.</p>}
      {!isLoading && !error && transactions.length > 0 && (
        <TransactionList transactions={transactions} />
      )}
    </section>
  )
}

export default MyTransactions
