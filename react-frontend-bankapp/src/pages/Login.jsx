import { useState } from 'react'

function Login({ authMessage, onLogin, onRegister }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'login') {
        await onLogin({ username, password })
      } else {
        await onRegister({ name, username, password })
        setMode('login')
        setName('')
        setUsername('')
        setMessage('Registration successful. Please sign in.')
      }
      setPassword('')
    } catch (loginError) {
      setError(loginError.message)
      setPassword('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <p className="eyebrow">Bank Application</p>
        <h1 id="login-heading">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
        <p className="page-subtitle">
          {mode === 'login'
            ? 'Use your account credentials to access the application.'
            : 'Create a normal customer account. Administrator access is not granted by registration.'}
        </p>
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <p>
              <label htmlFor="registration-name">Name</label>
              <input
                id="registration-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </p>
          )}
          <p>
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </p>
          <p>
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </p>
          <button type="submit" disabled={isLoading}>
            {isLoading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <button
          className="auth-switch"
          type="button"
          disabled={isLoading}
          onClick={() => {
            setMode((currentMode) => (currentMode === 'login' ? 'register' : 'login'))
            setError(null)
            setMessage(null)
            setPassword('')
          }}
        >
          {mode === 'login' ? 'Create a customer account' : 'Back to sign in'}
        </button>
        {authMessage && <p className="auth-message">{authMessage}</p>}
        {message && <p className="auth-message">{message}</p>}
        {error && <p role="alert">{mode === 'login' ? 'Could not sign in' : 'Could not create account'}: {error}</p>}
      </section>
    </main>
  )
}

export default Login
