import { useState } from 'react'

function EditAccountForm({ account, isSaving, onCancel, onUpdateAccount }) {
  const [accountType, setAccountType] = useState(account.account_type)

  async function handleSubmit(event) {
    event.preventDefault()
    await onUpdateAccount(account.id, { account_type: accountType })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Edit Account</h3>
      <p>
        <label htmlFor="edit-account-type">Account type</label>
        <select
          id="edit-account-type"
          value={accountType}
          onChange={(event) => setAccountType(event.target.value)}
        >
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
        </select>
      </p>
      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving account...' : 'Save changes'}
      </button>
      <button type="button" disabled={isSaving} onClick={onCancel}>
        Cancel
      </button>
    </form>
  )
}

export default EditAccountForm
