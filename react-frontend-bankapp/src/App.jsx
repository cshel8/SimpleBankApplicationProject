import { useState } from 'react'
import './App.css'
import Footer from './components/Footer.jsx'
import Header from './components/Header.jsx'
import Customers from './pages/Customers.jsx'
import Home from './pages/Home.jsx'

function App() {
  const [activePage, setActivePage] = useState('home')

  return (
    <div>
      <Header activePage={activePage} onNavigate={setActivePage} />
      <main>{activePage === 'customers' ? <Customers /> : <Home />}</main>
      <Footer />
    </div>
  )
}

export default App
