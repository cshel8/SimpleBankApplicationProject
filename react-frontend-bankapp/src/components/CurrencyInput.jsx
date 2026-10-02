import { useState } from 'react'

const amountFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function CurrencyInput({ id, name, value, onValueChange, required = false }) {
  const [editingValue, setEditingValue] = useState(null)

  const displayValue = editingValue ?? (value === '' ? '' : amountFormatter.format(Number(value)))

  function handleChange(event) {
    const nextValue = event.target.value.replaceAll(',', '')

    if (/^\d*\.?\d*$/.test(nextValue)) {
      setEditingValue(nextValue)
      onValueChange(nextValue)
    }
  }

  function handleBlur() {
    const numericValue = Number(value)
    setEditingValue(null)

    if (value !== '' && Number.isFinite(numericValue) && numericValue >= 0) {
      onValueChange(numericValue.toFixed(2))
    }
  }

  return (
    <span className="currency-input">
      <span className="currency-input-prefix" aria-hidden="true">
        $
      </span>
      <input
        id={id}
        name={name}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        required={required}
      />
    </span>
  )
}

export default CurrencyInput
