export function computeLinePrice(menuItem, variant, addonIds) {
  const addonTotal = menuItem.addons
    .filter((a) => addonIds.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0)
  return menuItem.basePrice + (variant?.priceDelta || 0) + addonTotal
}

export function cartTotal(lines) {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0)
}

export function buildWhatsAppMessage({ lines, customer, shopInfo }) {
  const rows = lines.map((line, i) => {
    const parts = [`${i + 1}. ${line.menuItem.name} (${line.variant.name}) x${line.qty}`]
    if (line.spiceLevel) parts.push(`   Spice: ${line.spiceLevel}`)
    if (line.addons.length) parts.push(`   Add-ons: ${line.addons.map((a) => a.name).join(', ')}`)
    parts.push(`   ₹${line.unitPrice * line.qty}`)
    return parts.join('\n')
  })

  const total = cartTotal(lines)

  const message = [
    `New order — ${shopInfo.name}`,
    '',
    ...rows,
    '',
    `Total: ₹${total}`,
    '',
    `Name: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Address: ${customer.address}`,
    customer.notes ? `Notes: ${customer.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return message
}

export function whatsAppOrderLink({ lines, customer, shopInfo }) {
  const message = buildWhatsAppMessage({ lines, customer, shopInfo })
  return `https://wa.me/${shopInfo.whatsappNumber}?text=${encodeURIComponent(message)}`
}
