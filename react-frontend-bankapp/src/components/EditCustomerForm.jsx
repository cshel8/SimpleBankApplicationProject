import { useState } from 'react'

function EditCustomerForm({ customer, isSaving, onCancel, onUpdateCustomer }) {
  const [formData, setFormData] = useState({
    name: customer.name,
    username: customer.username,
  })

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((currentData) => ({ ...currentData, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    await onUpdateCustomer(customer.id, formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Edit Customer</h3>
      <p>
        <label htmlFor="edit-customer-name">Name</label>
        <input
          id="edit-customer-name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </p>
      <p>
        <label htmlFor="edit-customer-username">Username</label>
        <input
          id="edit-customer-username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          required
        />
      </p>
      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving customer...' : 'Save changes'}
      </button>
      <button type="button" disabled={isSaving} onClick={onCancel}>
        Cancel
      </button>
    </form>
  )
}

export default EditCustomerForm
