const API_BASE_URL = 'http://127.0.0.1:8000'

let accessToken = null
let unauthorizedHandler = null

export function setAccessToken(token) {
  accessToken = token
}

export function clearAccessToken() {
  accessToken = null
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

async function apiRequest(path, options = {}, includeAuthorization = true) {
  const headers = { ...options.headers }

  if (includeAuthorization && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  if (includeAuthorization && accessToken && response.status === 401) {
    unauthorizedHandler?.()
  }

  return response
}

async function getErrorMessage(response, fallbackMessage) {
  try {
    const errorData = await response.json()
    if (typeof errorData.detail === 'string') {
      return errorData.detail
    }
    if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
      return errorData.detail[0].msg
    }
  } catch {
    // Keep the caller's fallback when the response is not JSON.
  }

  return fallbackMessage
}

export async function login(credentials) {
  const response = await apiRequest(
    '/api/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    },
    false,
  )

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Unable to sign in (${response.status})`))
  }

  return response.json()
}

export async function register(registrationData) {
  const response = await apiRequest(
    '/api/auth/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData),
    },
    false,
  )

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Unable to register (${response.status})`))
  }

  return response.json()
}

export async function getCurrentUser() {
  const response = await apiRequest('/api/auth/me')

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Unable to verify sign-in (${response.status})`))
  }

  return response.json()
}

export async function getMyAccounts() {
  const response = await apiRequest('/api/me/accounts')

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Unable to load your accounts (${response.status})`))
  }

  return response.json()
}

export async function getMyTransactions() {
  const response = await apiRequest('/api/me/transactions')

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Unable to load your transactions (${response.status})`))
  }

  return response.json()
}

export async function depositToMyAccount(accountId, amount) {
  const response = await apiRequest(`/api/me/accounts/${accountId}/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Unable to deposit funds (${response.status})`))
  }

  return response.json()
}

export async function withdrawFromMyAccount(accountId, amount) {
  const response = await apiRequest(`/api/me/accounts/${accountId}/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Unable to withdraw funds (${response.status})`))
  }

  return response.json()
}

export async function transferBetweenMyAccounts(transferData) {
  const response = await apiRequest('/api/me/accounts/transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transferData),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Unable to transfer funds (${response.status})`))
  }

  return response.json()
}

export async function getCustomers() {
  const response = await apiRequest('/api/customers')

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Unable to load customers (${response.status})`))
  }

  return response.json()
}

export async function getCustomerById(customerId) {
  const response = await apiRequest(`/api/customers/${customerId}`)

  if (!response.ok) {
    throw new Error(`Unable to load customer (${response.status})`)
  }

  return response.json()
}

export async function createCustomer(customerData) {
  const response = await apiRequest('/api/customers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  })

  if (!response.ok) {
    let message = `Unable to create customer (${response.status})`

    try {
      const errorData = await response.json()
      if (typeof errorData.detail === 'string') {
        message = errorData.detail
      } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
        message = errorData.detail[0].msg
      }
    } catch {
      // Keep the HTTP-status message when the response is not JSON.
    }

    throw new Error(message)
  }

  return response.json()
}

export async function deleteCustomer(customerId) {
  const response = await apiRequest(`/api/customers/${customerId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    let message = `Unable to delete customer (${response.status})`

    try {
      const errorData = await response.json()
      if (typeof errorData.detail === 'string') {
        message = errorData.detail
      }
    } catch {
      // Keep the HTTP-status message when the response is not JSON.
    }

    throw new Error(message)
  }
}

export async function updateCustomer(customerId, customerData) {
  const response = await apiRequest(`/api/customers/${customerId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  })

  if (!response.ok) {
    let message = `Unable to update customer (${response.status})`

    try {
      const errorData = await response.json()
      if (typeof errorData.detail === 'string') {
        message = errorData.detail
      } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
        message = errorData.detail[0].msg
      }
    } catch {
      // Keep the HTTP-status message when the response is not JSON.
    }

    throw new Error(message)
  }

  return response.json()
}

export async function searchCustomers(query) {
  const response = await apiRequest(
    `/api/customers/search?query=${encodeURIComponent(query)}`,
  )

  if (!response.ok) {
    let message = `Unable to search customers (${response.status})`

    try {
      const errorData = await response.json()
      if (typeof errorData.detail === 'string') {
        message = errorData.detail
      } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
        message = errorData.detail[0].msg
      }
    } catch {
      // Keep the HTTP-status message when the response is not JSON.
    }

    throw new Error(message)
  }

  return response.json()
}

export async function getAccounts() {
  const response = await apiRequest('/api/accounts')

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Unable to load accounts (${response.status})`))
  }

  return response.json()
}

export async function getAccountById(accountId) {
  const response = await apiRequest(`/api/accounts/${accountId}`)

  if (!response.ok) {
    let message = `Unable to load account (${response.status})`

    try {
      const errorData = await response.json()
      if (typeof errorData.detail === 'string') {
        message = errorData.detail
      }
    } catch {
      // Keep the HTTP-status message when the response is not JSON.
    }

    throw new Error(message)
  }

  return response.json()
}

export async function createAccount(customerId, accountData) {
  const response = await apiRequest(`/api/customers/${customerId}/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(accountData),
  })

  if (!response.ok) {
    let message = `Unable to create account (${response.status})`

    try {
      const errorData = await response.json()
      if (typeof errorData.detail === 'string') {
        message = errorData.detail
      } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
        message = errorData.detail[0].msg
      }
    } catch {
      // Keep the HTTP-status message when the response is not JSON.
    }

    throw new Error(message)
  }

  return response.json()
}

export async function updateAccount(accountId, accountData) {
  const response = await apiRequest(`/api/accounts/${accountId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(accountData),
  })

  if (!response.ok) {
    let message = `Unable to update account (${response.status})`

    try {
      const errorData = await response.json()
      if (typeof errorData.detail === 'string') {
        message = errorData.detail
      } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
        message = errorData.detail[0].msg
      }
    } catch {
      // Keep the HTTP-status message when the response is not JSON.
    }

    throw new Error(message)
  }

  return response.json()
}

export async function deleteAccount(accountId) {
  const response = await apiRequest(`/api/accounts/${accountId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    let message = `Unable to delete account (${response.status})`

    try {
      const errorData = await response.json()
      if (typeof errorData.detail === 'string') {
        message = errorData.detail
      }
    } catch {
      // Keep the HTTP-status message when the response is not JSON.
    }

    throw new Error(message)
  }
}

export async function getPremiumAccounts(threshold) {
  const response = await apiRequest(
    `/api/accounts/premium?threshold=${encodeURIComponent(threshold)}`,
  )

  if (!response.ok) {
    let message = `Unable to load premium accounts (${response.status})`

    try {
      const errorData = await response.json()
      if (typeof errorData.detail === 'string') {
        message = errorData.detail
      } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
        message = errorData.detail[0].msg
      }
    } catch {
      // Keep the HTTP-status message when the response is not JSON.
    }

    throw new Error(message)
  }

  return response.json()
}

export async function deposit(accountId, amount) {
  const response = await apiRequest(`/api/accounts/${accountId}/deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  })

  if (!response.ok) {
    let message = `Unable to deposit funds (${response.status})`

    try {
      const errorData = await response.json()
      if (typeof errorData.detail === 'string') {
        message = errorData.detail
      } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
        message = errorData.detail[0].msg
      }
    } catch {
      // Keep the HTTP-status message when the response is not JSON.
    }

    throw new Error(message)
  }

  return response.json()
}

export async function withdraw(accountId, amount) {
  const response = await apiRequest(`/api/accounts/${accountId}/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  })

  if (!response.ok) {
    let message = `Unable to withdraw funds (${response.status})`

    try {
      const errorData = await response.json()
      if (typeof errorData.detail === 'string') {
        message = errorData.detail
      } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
        message = errorData.detail[0].msg
      }
    } catch {
      // Keep the HTTP-status message when the response is not JSON.
    }

    throw new Error(message)
  }

  return response.json()
}

export async function transfer(transferData) {
  const response = await apiRequest('/api/accounts/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transferData),
  })

  if (!response.ok) {
    let message = `Unable to transfer funds (${response.status})`

    try {
      const errorData = await response.json()
      if (typeof errorData.detail === 'string') {
        message = errorData.detail
      } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
        message = errorData.detail[0].msg
      }
    } catch {
      // Keep the HTTP-status message when the response is not JSON.
    }

    throw new Error(message)
  }

  return response.json()
}

export async function getTransactions() {
  const response = await apiRequest('/api/transactions')

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Unable to load transactions (${response.status})`))
  }

  return response.json()
}

export async function getTransactionById(transactionId) {
  const response = await apiRequest(`/api/transactions/${transactionId}`)

  if (!response.ok) {
    let message = `Unable to load transaction (${response.status})`

    try {
      const errorData = await response.json()
      if (typeof errorData.detail === 'string') {
        message = errorData.detail
      }
    } catch {
      // Keep the HTTP-status message when the response is not JSON.
    }

    throw new Error(message)
  }

  return response.json()
}

export async function getTransactionsByAccount(accountId) {
  const response = await apiRequest(`/api/transactions/account/${accountId}`)

  if (!response.ok) {
    let message = `Unable to load account transactions (${response.status})`

    try {
      const errorData = await response.json()
      if (typeof errorData.detail === 'string') {
        message = errorData.detail
      }
    } catch {
      // Keep the HTTP-status message when the response is not JSON.
    }

    throw new Error(message)
  }

  return response.json()
}
