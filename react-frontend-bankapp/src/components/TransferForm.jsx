import { useState } from 'react'
import { formatCurrency } from '../utils/formatCurrency.js'
import CurrencyInput from './CurrencyInput.jsx'

function formatAccountType(accountType) {
  return accountType === 'checking' ? 'Checking' : 'Savings'
}

function TransferForm({ accounts, isAccountsLoading, isTransferring, onTransfer }) {
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('0.00')

  async function handleSubmit(event) {
    event.preventDefault()

    const wasTransferred = await onTransfer({ fromAccountId, toAccountId, amount })
    if (wasTransferred) {
      setAmount('0.00')
    }
  }

  function renderAccountOptions() {
    return accounts.map((account) => (
      <option key={account.id} value={account.id}>
        {formatAccountType(account.account_type)} — …{account.id.slice(-6)} —{' '}
        {formatCurrency(account.balance)}
      </option>
    ))
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Transfer</h3>
      <p>
        <label htmlFor="transfer-from-account">From account</label>
        <select
          id="transfer-from-account"
          value={fromAccountId}
          onChange={(event) => setFromAccountId(event.target.value)}
          disabled={isAccountsLoading}
          required
        >
          <option value="">Select a source account</option>
          {renderAccountOptions()}
        </select>
      </p>
      <p>
        <label htmlFor="transfer-to-account">To account</label>
        <select
          id="transfer-to-account"
          value={toAccountId}
          onChange={(event) => setToAccountId(event.target.value)}
          disabled={isAccountsLoading}
          required
        >
          <option value="">Select a destination account</option>
          {renderAccountOptions()}
        </select>
      </p>
      <p>
        <label htmlFor="transfer-amount">Amount</label>
        <CurrencyInput
          id="transfer-amount"
          value={amount}
          onValueChange={setAmount}
          required
        />
      </p>
      <button type="submit" disabled={isTransferring || isAccountsLoading}>
        {isTransferring ? 'Transferring...' : 'Transfer'}
      </button>
    </form>
  )
}

export default TransferForm
