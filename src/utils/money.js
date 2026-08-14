const MAX_MENU_PRICE = 99999.99

function moneyNumber(value, fallback = 0) {
    const number = Number(value)
    return Number.isFinite(number) && number >= 0 ? number : fallback
}

function validMenuPrice(value) {
    const number = Number(value)
    return (
        Number.isFinite(number) &&
        number >= 0 &&
        number <= MAX_MENU_PRICE
    )
}

function safeMenuPrice(value, fallback = 0) {
    return validMenuPrice(value)
        ? Number(value)
        : validMenuPrice(fallback)
          ? Number(fallback)
          : 0
}

function validOrderLine(item) {
    const quantity = Math.max(1, Number(item?.qty) || 1)
    const unitPrice = Number(item?.unitPrice ?? item?.unitTotal)
    const total = Number(item?.total ?? item?.lineTotal)
    return (
        Number.isFinite(total) &&
        total >= 0 &&
        total <= MAX_MENU_PRICE * quantity &&
        (!Number.isFinite(unitPrice) || validMenuPrice(unitPrice))
    )
}

export {
    MAX_MENU_PRICE,
    moneyNumber,
    safeMenuPrice,
    validMenuPrice,
    validOrderLine,
}
