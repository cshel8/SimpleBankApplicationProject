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
