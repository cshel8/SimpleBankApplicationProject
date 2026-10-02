import { useEffect, useRef, useState } from 'react'
import {
  getAccounts,
  getTransactionById,
  getTransactions,
  getTransactionsByAccount,
} from '../api/DataService.js'
import TransactionList from '../components/TransactionList.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'
import {
  formatTransactionIdentifier,
  formatTransactionTimestamp,
  formatTransactionType,
} from '../utils/formatTransaction.js'

function formatAccountType(accountType) {
  return accountType === 'checking' ? 'Checking' : 'Savings'
}

function Transactions() {
  const [allTransactions, setAllTransactions] = useState([])
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [isAccountsLoading, setIsAccountsLoading] = useState(true)
  const [accountsError, setAccountsError] = useState(null)
  const [accountId, setAccountId] = useState('')
  const [isHistoryActive, setIsHistoryActive] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState(null)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [isTransactionLoading, setIsTransactionLoading] = useState(false)
  const [transactionError, setTransactionError] = useState(null)
  const transactionRequestId = useRef(0)

  useEffect(() => {
    let isCurrent = true

    async function loadTransactions() {
      try {
        const transactionData = await getTransactions()
        if (isCurrent) {
          setAllTransactions(transactionData)
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

    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    let isCurrent = true

    async function loadAccounts() {
      try {
        const accountData = await getAccounts()
        if (isCurrent) {
          setAccounts(accountData)
        }
      } catch (requestError) {
        if (isCurrent) {
          setAccountsError(requestError.message)
        }
      } finally {
        if (isCurrent) {
          setIsAccountsLoading(false)
        }
      }
    }

    loadAccounts()

    return () => {
      isCurrent = false
    }
  }, [])

  async function handleAccountHistory(event) {
    event.preventDefault()
    transactionRequestId.current += 1
    setSelectedTransaction(null)
    setTransactionError(null)
    setIsTransactionLoading(false)
    setIsHistoryLoading(true)
    setHistoryError(null)

    try {
      const transactionData = await getTransactionsByAccount(accountId)
      setTransactions(transactionData)
      setIsHistoryActive(true)
    } catch (requestError) {
      setHistoryError(requestError.message)
    } finally {
      setIsHistoryLoading(false)
    }
  }

  function handleShowAllTransactions() {
    transactionRequestId.current += 1
    setSelectedTransaction(null)
    setTransactionError(null)
    setIsTransactionLoading(false)
    setTransactions(allTransactions)
    setIsHistoryActive(false)
    setHistoryError(null)
  }

  async function handleViewTransaction(transactionId) {
    const requestId = transactionRequestId.current + 1
    transactionRequestId.current = requestId
    setIsTransactionLoading(true)
    setTransactionError(null)
    setSelectedTransaction(null)

    try {
      const transaction = await getTransactionById(transactionId)
      if (transactionRequestId.current === requestId) {
        setSelectedTransaction(transaction)
      }
    } catch (requestError) {
      if (transactionRequestId.current === requestId) {
        setTransactionError(requestError.message)
      }
    } finally {
      if (transactionRequestId.current === requestId) {
        setIsTransactionLoading(false)
      }
    }
  }

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Audit history</p>
        <h1>Transactions</h1>
        <p className="page-subtitle">Review recorded deposits, withdrawals, and transfers.</p>
      </div>
      <form onSubmit={handleAccountHistory}>
        <h3>Transactions By Account</h3>
        <label htmlFor="transaction-account">Account</label>
        <select
          id="transaction-account"
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
          disabled={isAccountsLoading}
          required
        >
          <option value="">Select an account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {formatAccountType(account.account_type)} — …{account.id.slice(-6)} —{' '}
              {formatCurrency(account.balance)}
            </option>
          ))}
        </select>
        <button type="submit" disabled={isHistoryLoading || isAccountsLoading}>
          {isHistoryLoading ? 'Finding transactions...' : 'Find transactions'}
        </button>
      </form>
      {accountsError && (
        <p role="alert">Could not load accounts for transaction history: {accountsError}</p>
      )}
      {isHistoryActive && (
        <button type="button" onClick={handleShowAllTransactions}>
          Show all transactions
        </button>
      )}
      {isHistoryLoading && <p>Finding transactions...</p>}
      {historyError && <p role="alert">Could not load account history: {historyError}</p>}
      {isLoading && <p>Loading transactions from the backend...</p>}
      {error && <p role="alert">Could not load transactions: {error}</p>}
      {!isLoading && !error && transactions.length === 0 && (
        <p>No transactions found.</p>
      )}
      {!isLoading && !error && transactions.length > 0 && (
        <TransactionList
          transactions={transactions}
          onViewTransaction={handleViewTransaction}
        />
      )}
      {isTransactionLoading && <p>Loading transaction details...</p>}
      {transactionError && (
        <p role="alert">Could not load transaction details: {transactionError}</p>
      )}
      {selectedTransaction && (
        <section className="detail-card">
          <h3>Transaction Details</h3>
          <p>Type: {formatTransactionType(selectedTransaction.action_type)}</p>
          <p>Amount: {formatCurrency(selectedTransaction.amount)}</p>
          <p>
            From Account: {formatTransactionIdentifier(selectedTransaction.from_account_id)}
          </p>
          <p>To Account: {formatTransactionIdentifier(selectedTransaction.to_account_id)}</p>
          <p>Customer: {formatTransactionIdentifier(selectedTransaction.customer_id)}</p>
          <p>Date/Time: {formatTransactionTimestamp(selectedTransaction.timestamp)}</p>
        </section>
      )}
    </section>
  )
}

export default Transactions
