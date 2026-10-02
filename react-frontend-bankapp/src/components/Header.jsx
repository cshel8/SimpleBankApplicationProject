function Header({ activePage, onNavigate }) {
  const navigationItems = [
    ['home', 'Home'],
    ['customers', 'Customers'],
    ['accounts', 'Accounts'],
    ['transactions', 'Transactions'],
  ]

  return (
    <header className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">B</span>
        <div>
          <p className="brand-name">Bank Application</p>
          <p className="brand-caption">Administration</p>
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
    </header>
  )
}

export default Header
