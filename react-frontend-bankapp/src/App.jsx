import { useCallback, useEffect, useState } from 'react'
import './App.css'
import {
  clearAccessToken,
  getCurrentUser,
  login,
  register,
  setAccessToken,
  setUnauthorizedHandler,
} from './api/DataService.js'
import Footer from './components/Footer.jsx'
import Header from './components/Header.jsx'
import Accounts from './pages/Accounts.jsx'
import Customers from './pages/Customers.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import MyAccounts from './pages/MyAccounts.jsx'
import MyTransactions from './pages/MyTransactions.jsx'
import Transactions from './pages/Transactions.jsx'
import { readAccessToken, removeAccessToken, saveAccessToken } from './utils/authStorage.js'

function App() {
  const [activePage, setActivePage] = useState('home')
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authMessage, setAuthMessage] = useState(null)

  const handleSessionExpired = useCallback(() => {
    clearAccessToken()
    removeAccessToken()
    setCurrentUser(null)
    setActivePage('home')
    setAuthMessage('Your session has expired. Please sign in again.')
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(handleSessionExpired)

    return () => {
      setUnauthorizedHandler(null)
    }
  }, [handleSessionExpired])

  useEffect(() => {
    let isCurrent = true
    const restoredToken = readAccessToken()

    async function restoreAuthentication() {
      if (!restoredToken) {
        setIsAuthLoading(false)
        return
      }

      setAccessToken(restoredToken)

      try {
        const user = await getCurrentUser()
        if (isCurrent) {
          setCurrentUser(user)
        }
      } catch {
        if (isCurrent) {
          handleSessionExpired()
        }
      } finally {
        if (isCurrent) {
          setIsAuthLoading(false)
        }
      }
    }

    restoreAuthentication()

    return () => {
      isCurrent = false
    }
  }, [handleSessionExpired])

  async function handleLogin(credentials) {
    const tokenResponse = await login(credentials)
    setAccessToken(tokenResponse.access_token)

    try {
      const user = await getCurrentUser()
      saveAccessToken(tokenResponse.access_token)
      setCurrentUser(user)
      setActivePage('home')
      setAuthMessage(null)
    } catch (error) {
      clearAccessToken()
      removeAccessToken()
      throw error
    }
  }

  async function handleRegister(registrationData) {
    return register(registrationData)
  }

  function handleLogout() {
    clearAccessToken()
    removeAccessToken()
    setCurrentUser(null)
    setActivePage('home')
    setAuthMessage(null)
  }

  if (isAuthLoading) {
    return <main className="auth-loading">Checking your sign-in…</main>
  }

  if (!currentUser) {
    return <Login authMessage={authMessage} onLogin={handleLogin} onRegister={handleRegister} />
  }

  const isAdmin = currentUser.role === 'admin'
  const customerPages = new Set(['home', 'my-accounts', 'my-transactions'])
  const visiblePage = isAdmin ? activePage : customerPages.has(activePage) ? activePage : 'home'

  return (
    <div className="app-shell">
      <Header
        activePage={visiblePage}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onNavigate={setActivePage}
      />
      <div className="app-content">
        <main className="app-main" id="main-content">
          {visiblePage === 'customers' && <Customers />}
          {visiblePage === 'accounts' && <Accounts />}
          {visiblePage === 'transactions' && <Transactions />}
          {visiblePage === 'my-accounts' && <MyAccounts />}
          {visiblePage === 'my-transactions' && <MyTransactions />}
          {visiblePage === 'home' && <Home currentUser={currentUser} onNavigate={setActivePage} />}
        </main>
        <Footer isAdmin={isAdmin} />
      </div>
    </div>
  )
}

export default App
