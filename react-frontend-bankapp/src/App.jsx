import { useState } from 'react'
import './App.css'
import Footer from './components/Footer.jsx'
import Header from './components/Header.jsx'
import Accounts from './pages/Accounts.jsx'
import Customers from './pages/Customers.jsx'
import Home from './pages/Home.jsx'
import Transactions from './pages/Transactions.jsx'

function App() {
  const [activePage, setActivePage] = useState('home')

  return (
    <div>
      <Header activePage={activePage} onNavigate={setActivePage} />
      <main>
        {activePage === 'customers' && <Customers />}
        {activePage === 'accounts' && <Accounts />}
        {activePage === 'transactions' && <Transactions />}
        {activePage === 'home' && <Home />}
      </main>
      <Footer />
    </div>
  )
}

export default App
