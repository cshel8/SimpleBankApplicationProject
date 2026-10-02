import { useEffect, useState } from 'react'
import { getAccounts, getCustomers, getMyAccounts } from '../api/DataService.js'
import { formatCurrency } from '../utils/formatCurrency.js'

function getCombinedBalance(accounts) {
  return accounts.reduce((total, account) => total + Number(account.balance), 0)
}

function Home({ currentUser, onNavigate }) {
  const isAdmin = currentUser.role === 'admin'
  const [overview, setOverview] = useState(null)
  const [isOverviewLoading, setIsOverviewLoading] = useState(true)
  const [overviewError, setOverviewError] = useState(null)

  useEffect(() => {
    let isCurrent = true

    async function loadOverview() {
      setIsOverviewLoading(true)
      setOverviewError(null)

      try {
        if (isAdmin) {
          const [customers, accounts] = await Promise.all([getCustomers(), getAccounts()])
          if (isCurrent) {
            setOverview({
              customers: customers.length,
              accounts: accounts.length,
              combinedBalance: getCombinedBalance(accounts),
            })
          }
        } else {
          const accounts = await getMyAccounts()
          if (isCurrent) {
            setOverview({
              accounts: accounts.length,
              combinedBalance: getCombinedBalance(accounts),
            })
          }
        }
      } catch (requestError) {
        if (isCurrent) {
          setOverviewError(requestError.message)
        }
      } finally {
        if (isCurrent) {
          setIsOverviewLoading(false)
        }
      }
    }

    loadOverview()
    return () => { isCurrent = false }
  }, [isAdmin])

  const dashboardCards = isAdmin
    ? [
        {
          title: 'Customers',
          description: 'Manage customer records and search the customer directory.',
          action: 'Manage customers',
          page: 'customers',
        },
        {
          title: 'Accounts',
          description: 'Manage account records and complete banking operations.',
          action: 'Manage accounts',
          page: 'accounts',
        },
        {
          title: 'Transactions',
          description: 'Review deposits, withdrawals, transfers, and audit history.',
          action: 'View transactions',
          page: 'transactions',
        },
      ]
    : [
        {
          title: 'My Accounts',
          description: 'View balances and complete deposits, withdrawals, and transfers.',
          action: 'View my accounts',
          page: 'my-accounts',
        },
        {
          title: 'My Transactions',
          description: 'Review transaction history for your accounts.',
          action: 'View my transactions',
          page: 'my-transactions',
        },
      ]

  return (
    <section className="page home-page">
      <div className="page-heading">
        <p className="eyebrow">{isAdmin ? 'Administration' : 'Signed in'}</p>
        <h1>Welcome, {currentUser.username}.</h1>
        <p className="page-subtitle">
          {isAdmin
            ? 'Manage customer records, accounts, money movements, and audit history.'
            : 'View your accounts, complete banking operations, and review your transaction history.'}
        </p>
      </div>

      <section className="dashboard-section dashboard-overview" aria-labelledby="overview-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h2 id="overview-heading">{isAdmin ? 'Current bank totals' : 'Your account overview'}</h2>
        </div>
        {isOverviewLoading && <p className="dashboard-status">Loading overview...</p>}
        {overviewError && <p className="dashboard-error" role="alert">Could not load overview: {overviewError}</p>}
        {overview && (
          <div className={`dashboard-metrics ${isAdmin ? '' : 'dashboard-grid--two'}`}>
            {isAdmin && (
              <div className="dashboard-metric">
                <p>Customers</p>
                <strong>{overview.customers}</strong>
              </div>
            )}
            <div className="dashboard-metric">
              <p>{isAdmin ? 'Accounts' : 'My accounts'}</p>
              <strong>{overview.accounts}</strong>
            </div>
            <div className="dashboard-metric">
              <p>{isAdmin ? 'Combined balance' : 'My combined balance'}</p>
              <strong>{formatCurrency(overview.combinedBalance)}</strong>
            </div>
          </div>
        )}
      </section>

      <section className="dashboard-section" aria-labelledby="management-heading">
        <p className="eyebrow">{isAdmin ? 'Management' : 'Self-service banking'}</p>
        <h2 id="management-heading">{isAdmin ? 'Manage the bank' : 'Manage your banking'}</h2>
        <div className={`dashboard-cards ${isAdmin ? '' : 'dashboard-grid--two'}`}>
          {dashboardCards.map((card) => (
            <article className="dashboard-card" key={card.page}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <button type="button" onClick={() => onNavigate(card.page)}>{card.action}</button>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default Home
