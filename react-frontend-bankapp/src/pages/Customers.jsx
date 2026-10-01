import { useEffect, useState } from 'react'
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomers,
  searchCustomers,
  updateCustomer,
} from '../api/DataService.js'
import CustomerForm from '../components/CustomerForm.jsx'
import EditCustomerForm from '../components/EditCustomerForm.jsx'
import CustomerList from '../components/CustomerList.jsx'

function formatCreatedAt(createdAt) {
  if (!createdAt) {
    return 'Not available for this legacy customer'
  }

  return new Date(createdAt).toLocaleString()
}

function Customers() {
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isCustomerLoading, setIsCustomerLoading] = useState(false)
  const [customerError, setCustomerError] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [createdCustomer, setCreatedCustomer] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [deletedCustomer, setDeletedCustomer] = useState(null)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState(null)
  const [updatedCustomer, setUpdatedCustomer] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)

  useEffect(() => {
    let isCurrent = true

    async function loadCustomers() {
      try {
        const customerData = await getCustomers()
        if (isCurrent) {
          setCustomers(customerData)
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(requestError.message)
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    loadCustomers()

    return () => {
      isCurrent = false
    }
  }, [])

  async function handleViewCustomer(customerId) {
    setIsCustomerLoading(true)
    setCustomerError(null)
    setSelectedCustomer(null)

    try {
      const customer = await getCustomerById(customerId)
      setSelectedCustomer(customer)
    } catch (requestError) {
      setCustomerError(requestError.message)
    } finally {
      setIsCustomerLoading(false)
    }
  }

  async function handleCreateCustomer(customerData) {
    setIsCreating(true)
    setCreateError(null)
    setCreatedCustomer(null)

    try {
      const customer = await createCustomer(customerData)
      setCustomers((currentCustomers) => [...currentCustomers, customer])
      setCreatedCustomer(customer)
      return true
    } catch (requestError) {
      setCreateError(requestError.message)
      return false
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDeleteCustomer(customerId) {
    const customer = findCustomer(customerId)
    const customerLabel = customer
      ? `${customer.name} (@${customer.username})`
      : 'this customer'

    if (!window.confirm(`Delete ${customerLabel}? This also deletes their accounts.`)) {
      return
    }

    setIsDeleting(true)
    setDeleteError(null)
    setDeletedCustomer(null)

    try {
      await deleteCustomer(customerId)
      setCustomers((currentCustomers) =>
        currentCustomers.filter((currentCustomer) => currentCustomer.id !== customerId),
      )
      setSearchResults((currentResults) =>
        currentResults.filter((currentCustomer) => currentCustomer.id !== customerId),
      )
      setSelectedCustomer((currentCustomer) =>
        currentCustomer?.id === customerId ? null : currentCustomer,
      )
      setDeletedCustomer(customer)
    } catch (requestError) {
      setDeleteError(requestError.message)
    } finally {
      setIsDeleting(false)
    }
  }

  function handleEditCustomer(customerId) {
    const customer = findCustomer(customerId)
    if (customer) {
      setEditingCustomer(customer)
      setUpdateError(null)
      setUpdatedCustomer(null)
    }
  }

  function handleCancelEdit() {
    setEditingCustomer(null)
    setUpdateError(null)
  }

  async function handleUpdateCustomer(customerId, customerData) {
    setIsUpdating(true)
    setUpdateError(null)
    setUpdatedCustomer(null)

    try {
      const customer = await updateCustomer(customerId, customerData)
      setCustomers((currentCustomers) =>
        currentCustomers.map((currentCustomer) =>
          currentCustomer.id === customerId ? customer : currentCustomer,
        ),
      )
      setSearchResults((currentResults) =>
        currentResults.map((currentCustomer) =>
          currentCustomer.id === customerId ? customer : currentCustomer,
        ),
      )
      setSelectedCustomer((currentCustomer) =>
        currentCustomer?.id === customerId ? customer : currentCustomer,
      )
      setEditingCustomer(null)
      setUpdatedCustomer(customer)
      return true
    } catch (requestError) {
      setUpdateError(requestError.message)
      return false
    } finally {
      setIsUpdating(false)
    }
  }

  function findCustomer(customerId) {
    return (
      searchResults.find((currentCustomer) => currentCustomer.id === customerId) ??
      customers.find((currentCustomer) => currentCustomer.id === customerId)
    )
  }

  async function handleSearch(event) {
    event.preventDefault()
    const query = searchQuery.trim()

    if (!query) {
      handleClearSearch()
      return
    }

    setIsSearching(true)
    setIsSearchActive(false)
    setSearchResults([])
    setSearchError(null)

    try {
      const results = await searchCustomers(query)
      setSearchResults(results)
      setIsSearchActive(true)
    } catch (requestError) {
      setSearchError(requestError.message)
    } finally {
      setIsSearching(false)
    }
  }

  function handleClearSearch() {
    setSearchQuery('')
    setSearchResults([])
    setIsSearchActive(false)
    setSearchError(null)
  }

  const displayedCustomers = isSearchActive ? searchResults : customers

  return (
    <section>
      <h2>Customers</h2>
      <CustomerForm
        isCreating={isCreating}
        onCreateCustomer={handleCreateCustomer}
      />
      {createdCustomer && <p>Customer {createdCustomer.username} was created.</p>}
      {createError && <p role="alert">Could not create customer: {createError}</p>}
      {deletedCustomer && <p>Customer {deletedCustomer.username} was deleted.</p>}
      {deleteError && <p role="alert">Could not delete customer: {deleteError}</p>}
      {updatedCustomer && <p>Customer {updatedCustomer.username} was updated.</p>}
      {updateError && <p role="alert">Could not update customer: {updateError}</p>}
      {editingCustomer && (
        <EditCustomerForm
          key={editingCustomer.id}
          customer={editingCustomer}
          isSaving={isUpdating}
          onCancel={handleCancelEdit}
          onUpdateCustomer={handleUpdateCustomer}
        />
      )}
      <form onSubmit={handleSearch}>
        <h3>Search Customers</h3>
        <label htmlFor="customer-search">Name or username</label>
        <input
          id="customer-search"
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <button type="submit" disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
        <button type="button" onClick={handleClearSearch}>
          Clear search
        </button>
      </form>
      {isSearching && <p>Searching customers...</p>}
      {searchError && <p role="alert">Could not search customers: {searchError}</p>}
      {isLoading && <p>Loading customers from the backend...</p>}
      {error && <p role="alert">Could not load customers: {error}</p>}
      {!isLoading && !error && !isSearchActive && customers.length === 0 && (
        <p>No customers found.</p>
      )}
      {!isLoading && !error && isSearchActive && searchResults.length === 0 && (
        <p>No customers matched your search.</p>
      )}
      {!isLoading && !error && displayedCustomers.length > 0 && (
        <CustomerList
          customers={displayedCustomers}
          isDeleting={isDeleting}
          isUpdating={isUpdating}
          onDeleteCustomer={handleDeleteCustomer}
          onEditCustomer={handleEditCustomer}
          onViewCustomer={handleViewCustomer}
        />
      )}
      {isCustomerLoading && <p>Loading customer details...</p>}
      {customerError && (
        <p role="alert">Could not load customer details: {customerError}</p>
      )}
      {selectedCustomer && (
        <section>
          <h3>Customer Details</h3>
          <p>ID: {selectedCustomer.id}</p>
          <p>Name: {selectedCustomer.name}</p>
          <p>Username: {selectedCustomer.username}</p>
          <p>Created at: {formatCreatedAt(selectedCustomer.created_at)}</p>
        </section>
      )}
    </section>
  )
}

export default Customers
