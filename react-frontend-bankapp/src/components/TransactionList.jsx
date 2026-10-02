import { formatCurrency } from '../utils/formatCurrency.js'
import {
  formatTransactionIdentifier,
  formatTransactionTimestamp,
  formatTransactionType,
} from '../utils/formatTransaction.js'

function TransactionList({ transactions, onViewTransaction }) {
  return (
    <div className="table-wrap">
      <table>
      <thead>
        <tr>
          <th scope="col">Type</th>
          <th scope="col">Amount</th>
          <th scope="col">From Account</th>
          <th scope="col">To Account</th>
          <th scope="col">Customer</th>
          <th scope="col">Date/Time</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction) => (
          <tr key={transaction.id}>
            <td>{formatTransactionType(transaction.action_type)}</td>
            <td>{formatCurrency(transaction.amount)}</td>
            <td>{formatTransactionIdentifier(transaction.from_account_id)}</td>
            <td>{formatTransactionIdentifier(transaction.to_account_id)}</td>
            <td>{formatTransactionIdentifier(transaction.customer_id)}</td>
            <td>{formatTransactionTimestamp(transaction.timestamp)}</td>
            <td>
              <button type="button" onClick={() => onViewTransaction(transaction.id)}>
                View
              </button>
            </td>
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  )
}

export default TransactionList
