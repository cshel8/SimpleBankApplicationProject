import { useState } from 'react'
import { formatCurrency } from '../utils/formatCurrency.js'
import CurrencyInput from './CurrencyInput.jsx'

function formatAccountType(accountType) {
  return accountType === 'checking' ? 'Checking' : 'Savings'
}

function WithdrawForm({ accounts, isAccountsLoading, isWithdrawing, onWithdraw }) {
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('0.00')

  async function handleSubmit(event) {
    event.preventDefault()

    const wasWithdrawn = await onWithdraw(accountId, amount)
    if (wasWithdrawn) {
      setAmount('0.00')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Withdraw</h3>
      <p>
        <label htmlFor="withdraw-account">Account</label>
        <select
          id="withdraw-account"
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
        <label htmlFor="withdraw-amount">Amount</label>
        <CurrencyInput
          id="withdraw-amount"
          value={amount}
          onValueChange={setAmount}
          required
        />
      </p>
      <button type="submit" disabled={isWithdrawing || isAccountsLoading}>
        {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
      </button>
    </form>
  )
}

export default WithdrawForm
