import { formatCurrency } from '../utils/formatCurrency.js'

function formatAccountType(accountType) {
  return accountType === 'checking' ? 'Checking' : 'Savings'
}

function AccountList({
  accounts,
  isDeleting,
  isUpdating,
  onDeleteAccount,
  onEditAccount,
  onViewAccount,
}) {
  return (
    <div className="table-wrap">
      <table>
      <thead>
        <tr>
          <th scope="col">Account ID</th>
          <th scope="col">Customer ID</th>
          <th scope="col">Account Type</th>
          <th scope="col">Balance</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {accounts.map((account) => (
          <tr key={account.id}>
            <td>{account.id}</td>
            <td>{account.customer_id}</td>
            <td>{formatAccountType(account.account_type)}</td>
            <td>{formatCurrency(account.balance)}</td>
            <td className="table-actions">
              <div className="table-action-buttons">
                <button className="table-action-button" type="button" onClick={() => onViewAccount(account.id)}>
                  View
                </button>
                <button
                  className="table-action-button"
                  type="button"
                  disabled={isUpdating}
                  onClick={() => onEditAccount(account.id)}
                >
                  Edit
                </button>
                <button
                  className="table-action-button button-danger"
                  type="button"
                  disabled={isDeleting}
                  onClick={() => onDeleteAccount(account.id)}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  )
}

export default AccountList
