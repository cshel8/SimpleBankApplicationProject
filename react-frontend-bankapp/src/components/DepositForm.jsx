import { useState } from 'react'
import { formatCurrency } from '../utils/formatCurrency.js'
import CurrencyInput from './CurrencyInput.jsx'

function formatAccountType(accountType) {
  return accountType === 'checking' ? 'Checking' : 'Savings'
}

function DepositForm({ accounts, isAccountsLoading, isDepositing, onDeposit }) {
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('0.00')

  async function handleSubmit(event) {
    event.preventDefault()

    const wasDeposited = await onDeposit(accountId, amount)
    if (wasDeposited) {
      setAmount('0.00')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Deposit</h3>
      <p>
        <label htmlFor="deposit-account">Account</label>
        <select
          id="deposit-account"
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
      </p>
      <p>
        <label htmlFor="deposit-amount">Amount</label>
        <CurrencyInput
          id="deposit-amount"
          value={amount}
          onValueChange={setAmount}
          required
        />
      </p>
      <button type="submit" disabled={isDepositing || isAccountsLoading}>
        {isDepositing ? 'Depositing...' : 'Deposit'}
      </button>
    </form>
  )
}

export default DepositForm
