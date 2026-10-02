import { formatCurrency } from '../utils/formatCurrency.js'

function formatAccountType(accountType) {
  return accountType === 'checking' ? 'Checking' : 'Savings'
}

function MyAccountList({ accounts }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Account ID</th>
            <th scope="col">Account Type</th>
            <th scope="col">Balance</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td>{account.id}</td>
              <td>{formatAccountType(account.account_type)}</td>
              <td>{formatCurrency(account.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MyAccountList
