import { useState } from 'react'

function CustomerForm({ isCreating, onCreateCustomer }) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
  })

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((currentData) => ({ ...currentData, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const wasCreated = await onCreateCustomer(formData)
    if (wasCreated) {
      setFormData({ name: '', username: '', password: '' })
    } else {
      setFormData((currentData) => ({ ...currentData, password: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create Customer</h3>
      <p>
        <label htmlFor="customer-name">Name</label>
        <input
          id="customer-name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </p>
      <p>
        <label htmlFor="customer-username">Username</label>
        <input
          id="customer-username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          required
        />
      </p>
      <p>
        <label htmlFor="customer-password">Password</label>
        <input
          id="customer-password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </p>
      <button type="submit" disabled={isCreating}>
        {isCreating ? 'Creating customer...' : 'Create customer'}
      </button>
    </form>
  )
}

export default CustomerForm
