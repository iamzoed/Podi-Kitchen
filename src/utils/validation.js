// Strips everything but digits and drops a leading country code, so
// "+91 98765-43210", "919876543210", and "9876543210" all normalize to the
// same 10-digit number for validation.
export function normalizedPhoneDigits(raw) {
  const digitsOnly = (raw || '').replace(/\D/g, '')
  return digitsOnly.length > 10 && digitsOnly.startsWith('91') ? digitsOnly.slice(2) : digitsOnly
}

// Indian mobile numbers: exactly 10 digits, starting 6-9.
const PHONE_PATTERN = /^[6-9]\d{9}$/

export function validateCustomer({ name, phone, address, landmark, notes }) {
  const errors = {}

  const trimmedName = (name || '').trim()
  if (trimmedName.length < 2) errors.name = 'Please enter your name.'
  else if (trimmedName.length > 100) errors.name = 'That name looks too long — please shorten it.'

  const phoneDigits = normalizedPhoneDigits(phone)
  if (!PHONE_PATTERN.test(phoneDigits)) errors.phone = 'Please enter a valid 10-digit mobile number.'

  const trimmedAddress = (address || '').trim()
  if (trimmedAddress.length < 10) errors.address = 'Please enter your full delivery address.'
  else if (trimmedAddress.length > 300) errors.address = 'That address looks too long — please shorten it.'

  const trimmedLandmark = (landmark || '').trim()
  if (trimmedLandmark.length > 100) errors.landmark = 'That landmark looks too long — please shorten it.'

  const trimmedNotes = (notes || '').trim()
  if (trimmedNotes.length > 300) errors.notes = 'That note looks too long — please shorten it.'

  return { valid: Object.keys(errors).length === 0, errors }
}
