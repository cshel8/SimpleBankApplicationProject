function Header({ activePage, currentUser, isAdmin, onLogout, onNavigate }) {
  const navigationItems = isAdmin
    ? [
        ['home', 'Home'],
        ['customers', 'Customers'],
        ['accounts', 'Accounts'],
        ['transactions', 'Transactions'],
      ]
    : [
        ['home', 'Home'],
        ['my-accounts', 'My Accounts'],
        ['my-transactions', 'My Transactions'],
      ]

  return (
    <header className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">B</span>
        <div>
          <p className="brand-name">Bank Application</p>
          <p className="brand-caption">{isAdmin ? 'Administration' : 'Self-service banking'}</p>
        </div>
      </div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigationItems.map(([page, label]) => (
          <button
            key={page}
            type="button"
            aria-current={activePage === page ? 'page' : undefined}
            onClick={() => onNavigate(page)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="user-menu">
        <p className="user-name">{currentUser.username}</p>
        <p className="user-role">{currentUser.role}</p>
        <button type="button" onClick={onLogout}>Sign out</button>
      </div>
    </header>
  )
}

export default Header
