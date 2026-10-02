function Home({ onNavigate }) {
  return (
    <section className="page home-page">
      <div className="page-heading">
        <p className="eyebrow">Overview</p>
        <h1>Bank operations, in one place.</h1>
        <p className="page-subtitle">
          Manage customer records, accounts, money movements, and audit history from the
          administration workspace.
        </p>
      </div>
      <section className="overview-card" aria-labelledby="start-heading">
        <p className="eyebrow">Quick access</p>
        <h2 id="start-heading">Choose an area to manage</h2>
        <p>Use the sections below to work with live banking data from the API.</p>
        <div className="quick-actions">
          <button type="button" onClick={() => onNavigate('customers')}>Customers</button>
          <button type="button" onClick={() => onNavigate('accounts')}>Accounts</button>
          <button type="button" onClick={() => onNavigate('transactions')}>Transactions</button>
        </div>
      </section>
    </section>
  )
}

export default Home
