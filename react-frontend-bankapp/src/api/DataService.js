const API_BASE_URL = 'http://127.0.0.1:8000'

export async function getCustomers() {
  const response = await fetch(`${API_BASE_URL}/api/customers`)

  if (!response.ok) {
    throw new Error(`Unable to load customers (${response.status})`)
  }

  return response.json()
}
