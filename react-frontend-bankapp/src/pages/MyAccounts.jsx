import { useEffect, useState } from 'react'
import {
  depositToMyAccount,
  getMyAccounts,
  transferBetweenMyAccounts,
  withdrawFromMyAccount,
} from '../api/DataService.js'
import DepositForm from '../components/DepositForm.jsx'
import MyAccountList from '../components/MyAccountList.jsx'
import TransferForm from '../components/TransferForm.jsx'
import WithdrawForm from '../components/WithdrawForm.jsx'

function MyAccounts() {
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDepositing, setIsDepositing] = useState(false)
  const [depositError, setDepositError] = useState(null)
  const [depositSuccess, setDepositSuccess] = useState(null)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState(null)
  const [withdrawSuccess, setWithdrawSuccess] = useState(null)
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferError, setTransferError] = useState(null)
  const [transferSuccess, setTransferSuccess] = useState(false)

  useEffect(() => {
    let isCurrent = true

    async function loadAccounts() {
      try {
        const accountData = await getMyAccounts()
        if (isCurrent) {
          setAccounts(accountData)
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

    loadAccounts()
    return () => { isCurrent = false }
  }, [])

  function replaceAccount(updatedAccount) {
    setAccounts((currentAccounts) => currentAccounts.map((account) => (
      account.id === updatedAccount.id ? updatedAccount : account
    )))
  }

  async function handleDeposit(accountId, amount) {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setDepositError('Deposit amount must be greater than zero.')
      return false
    }

    setIsDepositing(true)
    setDepositError(null)
    setDepositSuccess(null)
    try {
      const account = await depositToMyAccount(accountId, amount)
      replaceAccount(account)
      setDepositSuccess(account)
      return true
    } catch (requestError) {
      setDepositError(requestError.message)
      return false
    } finally {
      setIsDepositing(false)
    }
  }

  async function handleWithdraw(accountId, amount) {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setWithdrawError('Withdrawal amount must be greater than zero.')
      return false
    }

    setIsWithdrawing(true)
    setWithdrawError(null)
    setWithdrawSuccess(null)
    try {
      const account = await withdrawFromMyAccount(accountId, amount)
      replaceAccount(account)
      setWithdrawSuccess(account)
      return true
    } catch (requestError) {
      setWithdrawError(requestError.message)
      return false
    } finally {
      setIsWithdrawing(false)
    }
  }

  async function handleTransfer({ fromAccountId, toAccountId, amount }) {
    if (fromAccountId === toAccountId) {
      setTransferError('Source and destination accounts must be different.')
      return false
    }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setTransferError('Transfer amount must be greater than zero.')
      return false
    }

    setIsTransferring(true)
    setTransferError(null)
    setTransferSuccess(false)
    try {
      const result = await transferBetweenMyAccounts({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount,
      })
      replaceAccount(result.from_account)
      replaceAccount(result.to_account)
      setTransferSuccess(true)
      return true
    } catch (requestError) {
      setTransferError(requestError.message)
      return false
    } finally {
      setIsTransferring(false)
    }
  }

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Self-service banking</p>
        <h1>My Accounts</h1>
        <p className="page-subtitle">View and manage only the accounts assigned to you.</p>
      </div>
      <DepositForm
        accounts={accounts}
        isAccountsLoading={isLoading}
        isDepositing={isDepositing}
        onDeposit={handleDeposit}
      />
      {depositSuccess && <p>Deposit completed for account {depositSuccess.id}.</p>}
      {depositError && <p role="alert">Could not deposit funds: {depositError}</p>}
      <WithdrawForm
        accounts={accounts}
        isAccountsLoading={isLoading}
        isWithdrawing={isWithdrawing}
        onWithdraw={handleWithdraw}
      />
      {withdrawSuccess && <p>Withdrawal completed for account {withdrawSuccess.id}.</p>}
      {withdrawError && <p role="alert">Could not withdraw funds: {withdrawError}</p>}
      <TransferForm
        accounts={accounts}
        isAccountsLoading={isLoading}
        isTransferring={isTransferring}
        onTransfer={handleTransfer}
      />
      {transferSuccess && <p>Transfer completed successfully.</p>}
      {transferError && <p role="alert">Could not transfer funds: {transferError}</p>}
      {isLoading && <p>Loading your accounts...</p>}
      {error && <p role="alert">Could not load your accounts: {error}</p>}
      {!isLoading && !error && accounts.length === 0 && <p>You do not have any accounts yet.</p>}
      {!isLoading && !error && accounts.length > 0 && <MyAccountList accounts={accounts} />}
    </section>
  )
}

export default MyAccounts
