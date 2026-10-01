function Header({ activePage, onNavigate }) {
  return (
    <header>
      <h1>Bank Application</h1>
      <nav aria-label="Main navigation">
        <button
          type="button"
          aria-current={activePage === 'home' ? 'page' : undefined}
          onClick={() => onNavigate('home')}
        >
          Home
        </button>
        <button
          type="button"
          aria-current={activePage === 'customers' ? 'page' : undefined}
          onClick={() => onNavigate('customers')}
        >
          Customers
        </button>
      </nav>
    </header>
  )
}

export default Header
