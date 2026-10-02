import { useEffect, useRef, useState } from 'react'
import {
  createAccount,
  deleteAccount,
  deposit,
  getAccountById,
  getAccounts,
  getCustomers,
  getPremiumAccounts,
  transfer,
  updateAccount,
  withdraw,
} from '../api/DataService.js'
import AccountForm from '../components/AccountForm.jsx'
import CurrencyInput from '../components/CurrencyInput.jsx'
import DepositForm from '../components/DepositForm.jsx'
import EditAccountForm from '../components/EditAccountForm.jsx'
import AccountList from '../components/AccountList.jsx'
import PremiumAccountList from '../components/PremiumAccountList.jsx'
import TransferForm from '../components/TransferForm.jsx'
import WithdrawForm from '../components/WithdrawForm.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'

function formatCreatedAt(createdAt) {
  if (!createdAt) {
    return 'Not available for this legacy account'
  }

  return new Date(createdAt).toLocaleString()
}

function formatAccountType(accountType) {
  return accountType === 'checking' ? 'Checking' : 'Savings'
}

function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [isAccountLoading, setIsAccountLoading] = useState(false)
  const [accountError, setAccountError] = useState(null)
  const [customers, setCustomers] = useState([])
  const [isCustomersLoading, setIsCustomersLoading] = useState(true)
  const [customersError, setCustomersError] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [createdAccount, setCreatedAccount] = useState(null)
  const [editingAccount, setEditingAccount] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState(null)
  const [updatedAccount, setUpdatedAccount] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [deletedAccount, setDeletedAccount] = useState(null)
  const [premiumThreshold, setPremiumThreshold] = useState('0.00')
  const [premiumAccounts, setPremiumAccounts] = useState([])
  const [isPremiumSearchActive, setIsPremiumSearchActive] = useState(false)
  const [isPremiumLoading, setIsPremiumLoading] = useState(false)
  const [premiumError, setPremiumError] = useState(null)
  const [isDepositing, setIsDepositing] = useState(false)
  const [depositError, setDepositError] = useState(null)
  const [depositedAccount, setDepositedAccount] = useState(null)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState(null)
  const [withdrawnAccount, setWithdrawnAccount] = useState(null)
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferError, setTransferError] = useState(null)
  const [transferResult, setTransferResult] = useState(null)
  const editAccountFormRef = useRef(null)

  useEffect(() => {
    let isCurrent = true

    async function loadAccounts() {
      try {
        const accountData = await getAccounts()
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

    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    if (editingAccount) {
      editAccountFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [editingAccount])

  useEffect(() => {
    let isCurrent = true

    async function loadCustomers() {
      try {
        const customerData = await getCustomers()
        if (isCurrent) {
          setCustomers(customerData)
        }
      } catch (requestError) {
        if (isCurrent) {
          setCustomersError(requestError.message)
        }
      } finally {
        if (isCurrent) {
          setIsCustomersLoading(false)
        }
      }
    }

    loadCustomers()

    return () => {
      isCurrent = false
    }
  }, [])

  async function handleViewAccount(accountId) {
    setIsAccountLoading(true)
    setAccountError(null)
    setSelectedAccount(null)

    try {
      const account = await getAccountById(accountId)
      setSelectedAccount(account)
    } catch (requestError) {
      setAccountError(requestError.message)
    } finally {
      setIsAccountLoading(false)
    }
  }

  async function handleCreateAccount(formData) {
    setIsCreating(true)
    setCreateError(null)
    setCreatedAccount(null)

    try {
      const account = await createAccount(formData.customerId, {
        account_type: formData.accountType,
        opening_balance: formData.openingBalance,
      })
      setAccounts((currentAccounts) => [...currentAccounts, account])
      setCreatedAccount(account)
      return true
    } catch (requestError) {
      setCreateError(requestError.message)
      return false
    } finally {
      setIsCreating(false)
    }
  }

  function handleEditAccount(accountId) {
    const account = accounts.find((currentAccount) => currentAccount.id === accountId)
    if (account) {
      setEditingAccount(account)
      setUpdateError(null)
      setUpdatedAccount(null)
    }
  }

  function handleCancelEdit() {
    setEditingAccount(null)
    setUpdateError(null)
  }

  async function handleUpdateAccount(accountId, accountData) {
    setIsUpdating(true)
    setUpdateError(null)
    setUpdatedAccount(null)

    try {
      const account = await updateAccount(accountId, accountData)
      setAccounts((currentAccounts) =>
        currentAccounts.map((currentAccount) =>
          currentAccount.id === accountId ? account : currentAccount,
        ),
      )
      setSelectedAccount((currentAccount) =>
        currentAccount?.id === accountId ? account : currentAccount,
      )
      setEditingAccount(null)
      setUpdatedAccount(account)
      return true
    } catch (requestError) {
      setUpdateError(requestError.message)
      return false
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDeleteAccount(accountId) {
    const account = accounts.find((currentAccount) => currentAccount.id === accountId)
    const accountLabel = account
      ? `${formatAccountType(account.account_type)} account ${account.id}`
      : 'this account'

    if (!window.confirm(`Delete ${accountLabel}?`)) {
      return
    }

    setIsDeleting(true)
    setDeleteError(null)
    setDeletedAccount(null)

    try {
      await deleteAccount(accountId)
      setAccounts((currentAccounts) =>
        currentAccounts.filter((currentAccount) => currentAccount.id !== accountId),
      )
      setSelectedAccount((currentAccount) =>
        currentAccount?.id === accountId ? null : currentAccount,
      )
      setEditingAccount((currentAccount) =>
        currentAccount?.id === accountId ? null : currentAccount,
      )
      setDeletedAccount(account)
    } catch (requestError) {
      setDeleteError(requestError.message)
    } finally {
      setIsDeleting(false)
    }
  }

  async function handlePremiumSearch(event) {
    event.preventDefault()

    setIsPremiumLoading(true)
    setIsPremiumSearchActive(false)
    setPremiumAccounts([])
    setPremiumError(null)

    try {
      const premiumResults = await getPremiumAccounts(premiumThreshold)
      setPremiumAccounts(premiumResults)
      setIsPremiumSearchActive(true)
    } catch (requestError) {
      setPremiumError(requestError.message)
    } finally {
      setIsPremiumLoading(false)
    }
  }

  function handleShowAllAccounts() {
    setIsPremiumSearchActive(false)
    setPremiumAccounts([])
    setPremiumError(null)
  }

  async function handleDeposit(accountId, amount) {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setDepositError('Deposit amount must be greater than zero.')
      return false
    }

    setIsDepositing(true)
    setDepositError(null)
    setDepositedAccount(null)

    try {
      const account = await deposit(accountId, amount)
      setAccounts((currentAccounts) =>
        currentAccounts.map((currentAccount) =>
          currentAccount.id === accountId ? account : currentAccount,
        ),
      )
      setSelectedAccount((currentAccount) =>
        currentAccount?.id === accountId ? account : currentAccount,
      )
      setIsPremiumSearchActive(false)
      setPremiumAccounts([])
      setPremiumError(null)
      setDepositedAccount(account)
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
    setWithdrawnAccount(null)

    try {
      const account = await withdraw(accountId, amount)
      setAccounts((currentAccounts) =>
        currentAccounts.map((currentAccount) =>
          currentAccount.id === accountId ? account : currentAccount,
        ),
      )
      setSelectedAccount((currentAccount) =>
        currentAccount?.id === accountId ? account : currentAccount,
      )
      setIsPremiumSearchActive(false)
      setPremiumAccounts([])
      setPremiumError(null)
      setWithdrawnAccount(account)
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
    setTransferResult(null)

    try {
      const result = await transfer({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount,
      })
      setAccounts((currentAccounts) =>
        currentAccounts.map((currentAccount) => {
          if (currentAccount.id === result.from_account.id) {
            return result.from_account
          }
          if (currentAccount.id === result.to_account.id) {
            return result.to_account
          }
          return currentAccount
        }),
      )
      setSelectedAccount((currentAccount) => {
        if (currentAccount?.id === result.from_account.id) {
          return result.from_account
        }
        if (currentAccount?.id === result.to_account.id) {
          return result.to_account
        }
        return currentAccount
      })
      setIsPremiumSearchActive(false)
      setPremiumAccounts([])
      setPremiumError(null)
      setTransferResult(result)
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
        <p className="eyebrow">Account management</p>
        <h1>Accounts</h1>
        <p className="page-subtitle">Manage account records and complete banking operations.</p>
      </div>
      <AccountForm
        customers={customers}
        isCreating={isCreating}
        isCustomersLoading={isCustomersLoading}
        onCreateAccount={handleCreateAccount}
      />
      {customersError && (
        <p role="alert">Could not load customers for account creation: {customersError}</p>
      )}
      {createdAccount && <p>Account {createdAccount.id} was created.</p>}
      {createError && <p role="alert">Could not create account: {createError}</p>}
      {updatedAccount && <p>Account {updatedAccount.id} was updated.</p>}
      {updateError && <p role="alert">Could not update account: {updateError}</p>}
      {deletedAccount && <p>Account {deletedAccount.id} was deleted.</p>}
      {deleteError && <p role="alert">Could not delete account: {deleteError}</p>}
      {editingAccount && (
        <div className="edit-form-anchor" ref={editAccountFormRef}>
          <EditAccountForm
            key={editingAccount.id}
            account={editingAccount}
            isSaving={isUpdating}
            onCancel={handleCancelEdit}
            onUpdateAccount={handleUpdateAccount}
          />
        </div>
      )}
      <DepositForm
        accounts={accounts}
        isAccountsLoading={isLoading}
        isDepositing={isDepositing}
        onDeposit={handleDeposit}
      />
      {depositedAccount && <p>Deposit completed for account {depositedAccount.id}.</p>}
      {depositError && <p role="alert">Could not deposit funds: {depositError}</p>}
      <WithdrawForm
        accounts={accounts}
        isAccountsLoading={isLoading}
        isWithdrawing={isWithdrawing}
        onWithdraw={handleWithdraw}
      />
      {withdrawnAccount && <p>Withdrawal completed for account {withdrawnAccount.id}.</p>}
      {withdrawError && <p role="alert">Could not withdraw funds: {withdrawError}</p>}
      <TransferForm
        accounts={accounts}
        isAccountsLoading={isLoading}
        isTransferring={isTransferring}
        onTransfer={handleTransfer}
      />
      {transferResult && <p>Transfer completed successfully.</p>}
      {transferError && <p role="alert">Could not transfer funds: {transferError}</p>}
      <form onSubmit={handlePremiumSearch}>
        <h3>Premium Accounts</h3>
        <label htmlFor="premium-threshold">Minimum balance</label>
        <CurrencyInput
          id="premium-threshold"
          value={premiumThreshold}
          onValueChange={setPremiumThreshold}
          required
        />
        <button type="submit" disabled={isPremiumLoading}>
          {isPremiumLoading ? 'Finding premium accounts...' : 'Find premium accounts'}
        </button>
      </form>
      {isPremiumLoading && <p>Finding premium accounts...</p>}
      {premiumError && (
        <p role="alert">Could not load premium accounts: {premiumError}</p>
      )}
      {isPremiumSearchActive && premiumAccounts.length === 0 && (
        <p>No accounts meet this threshold.</p>
      )}
      {isPremiumSearchActive && premiumAccounts.length > 0 && (
        <PremiumAccountList accounts={premiumAccounts} />
      )}
      {isPremiumSearchActive && (
        <button type="button" onClick={handleShowAllAccounts}>
          Show all accounts
        </button>
      )}
      {isLoading && <p>Loading accounts from the backend...</p>}
      {error && <p role="alert">Could not load accounts: {error}</p>}
      {!isLoading && !error && !isPremiumSearchActive && accounts.length === 0 && (
        <p>No accounts found.</p>
      )}
      {!isLoading && !error && !isPremiumSearchActive && accounts.length > 0 && (
        <AccountList
          accounts={accounts}
          isDeleting={isDeleting}
          isUpdating={isUpdating}
          onDeleteAccount={handleDeleteAccount}
          onEditAccount={handleEditAccount}
          onViewAccount={handleViewAccount}
        />
      )}
      {isAccountLoading && <p>Loading account details...</p>}
      {accountError && (
        <p role="alert">Could not load account details: {accountError}</p>
      )}
      {selectedAccount && (
        <section className="detail-card">
          <h3>Account Details</h3>
          <p>Account ID: {selectedAccount.id}</p>
          <p>Customer ID: {selectedAccount.customer_id}</p>
          <p>Account Type: {formatAccountType(selectedAccount.account_type)}</p>
          <p>Balance: {formatCurrency(selectedAccount.balance)}</p>
          <p>Created at: {formatCreatedAt(selectedAccount.created_at)}</p>
        </section>
      )}
    </section>
  )
}

export default Accounts
