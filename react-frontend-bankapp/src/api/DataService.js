const API_BASE_URL = 'http://127.0.0.1:8000'

export async function getCustomers() {
  const response = await fetch(`${API_BASE_URL}/api/customers`)

  if (!response.ok) {
    throw new Error(`Unable to load customers (${response.status})`)
  }

  return response.json()
}

export async function getCustomerById(customerId) {
  const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`)

  if (!response.ok) {
    throw new Error(`Unable to load customer (${response.status})`)
  }

  return response.json()
}

export async function createCustomer(customerData) {
  const response = await fetch(`${API_BASE_URL}/api/customers`, {
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
  const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`, {
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
  const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`, {
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
  const response = await fetch(
    `${API_BASE_URL}/api/customers/search?query=${encodeURIComponent(query)}`,
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
  const response = await fetch(`${API_BASE_URL}/api/accounts`)

  if (!response.ok) {
    throw new Error(`Unable to load accounts (${response.status})`)
  }

  return response.json()
}

export async function getAccountById(accountId) {
  const response = await fetch(`${API_BASE_URL}/api/accounts/${accountId}`)

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
  const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}/accounts`, {
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
  const response = await fetch(`${API_BASE_URL}/api/accounts/${accountId}`, {
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
  const response = await fetch(`${API_BASE_URL}/api/accounts/${accountId}`, {
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
  const response = await fetch(
    `${API_BASE_URL}/api/accounts/premium?threshold=${encodeURIComponent(threshold)}`,
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
  const response = await fetch(`${API_BASE_URL}/api/accounts/${accountId}/deposit`, {
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
  const response = await fetch(`${API_BASE_URL}/api/accounts/${accountId}/withdraw`, {
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
  const response = await fetch(`${API_BASE_URL}/api/accounts/transfer`, {
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
  const response = await fetch(`${API_BASE_URL}/api/transactions`)

  if (!response.ok) {
    throw new Error(`Unable to load transactions (${response.status})`)
  }

  return response.json()
}

export async function getTransactionById(transactionId) {
  const response = await fetch(`${API_BASE_URL}/api/transactions/${transactionId}`)

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
  const response = await fetch(`${API_BASE_URL}/api/transactions/account/${accountId}`)

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
