import { useState } from 'react'
import CurrencyInput from './CurrencyInput.jsx'

function AccountForm({ customers, isCreating, isCustomersLoading, onCreateAccount }) {
  const [formData, setFormData] = useState({
    customerId: '',
    accountType: 'checking',
    openingBalance: '0.00',
  })

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((currentData) => ({ ...currentData, [name]: value }))
  }

  function handleOpeningBalanceChange(openingBalance) {
    setFormData((currentData) => ({ ...currentData, openingBalance }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const wasCreated = await onCreateAccount(formData)
    if (wasCreated) {
      setFormData({
        customerId: '',
        accountType: 'checking',
        openingBalance: '0.00',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create Account</h3>
      <p>
        <label htmlFor="account-customer">Customer</label>
        <select
          id="account-customer"
          name="customerId"
          value={formData.customerId}
          onChange={handleChange}
          disabled={isCustomersLoading}
          required
        >
          <option value="">Select a customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} (@{customer.username})
            </option>
          ))}
        </select>
      </p>
      <p>
        <label htmlFor="account-type">Account type</label>
        <select
          id="account-type"
          name="accountType"
          value={formData.accountType}
          onChange={handleChange}
        >
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
        </select>
      </p>
      <p>
        <label htmlFor="opening-balance">Opening balance</label>
        <CurrencyInput
          id="opening-balance"
          name="openingBalance"
          value={formData.openingBalance}
          onValueChange={handleOpeningBalanceChange}
          required
        />
      </p>
      <button type="submit" disabled={isCreating || isCustomersLoading}>
        {isCreating ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  )
}

export default AccountForm
