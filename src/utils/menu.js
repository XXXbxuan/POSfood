function timeToMinutes(value) {
    const [hours, minutes] = String(value || '')
        .split(':')
        .map(Number)

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
    return hours * 60 + minutes
}

function isSetWithinSchedule(product, date = new Date()) {
    if (product?.type !== 'set') return true

    const start = timeToMinutes(product.availableFrom)
    const end = timeToMinutes(product.availableTo)
    if (start === null || end === null || start === end) return true

    const current = date.getHours() * 60 + date.getMinutes()
    if (start < end) return current >= start && current < end
    return current >= start || current < end
}

function productAvailabilityStatus(product, date = new Date()) {
    if (product?.unavailable) return 'unavailable'
    if (product?.soldOut) return 'soldout'
    if (!isSetWithinSchedule(product, date)) return 'set-unavailable'
    return 'available'
}

function productAvailabilityLabel(product, date = new Date()) {
    return {
        available: 'Available',
        soldout: 'Sold out',
        unavailable: 'Unavailable',
        'set-unavailable': 'Set unavailable',
    }[productAvailabilityStatus(product, date)]
}

function sortProductsByAvailability(products, date = new Date()) {
    const priority = {
        available: 0,
        soldout: 1,
        unavailable: 2,
        'set-unavailable': 2,
    }

    return products
        .map((product, index) => ({ product, index }))
        .sort((first, second) => {
            const difference =
                priority[productAvailabilityStatus(first.product, date)] -
                priority[productAvailabilityStatus(second.product, date)]
            return difference || first.index - second.index
        })
        .map(({ product }) => product)
}

export {
    isSetWithinSchedule,
    productAvailabilityLabel,
    productAvailabilityStatus,
    sortProductsByAvailability,
}
