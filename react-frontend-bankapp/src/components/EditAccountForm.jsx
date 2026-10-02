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
      <p className="edit-account-note">
        Only the account type can be updated. Account ownership, balance, and IDs stay unchanged.
      </p>
      <p>
        <label htmlFor="edit-account-type">Account type</label>
        <select
          id="edit-account-type"
          value={accountType}
          onChange={(event) => setAccountType(event.target.value)}
          disabled={isSaving}
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
