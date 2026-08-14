export const warehouseSections = Object.freeze([
    'Rack A',
    'Rack B',
    'Rack C',
    'Rack D',
    'Chiller A',
    'Chiller B',
    'Freezer A',
    'Freezer B',
])

export const warehousePositionNumbers = Object.freeze(
    Array.from({ length: 20 }, (_, index) => String(index + 1).padStart(2, '0')),
)

export function formatWarehouseLocation(section, number) {
    return section && number ? `${section}-${number}` : ''
}

export function parseWarehouseLocation(value = '') {
    const match = String(value).trim().match(/^(.*\s[A-Z])-(\d{2})$/)
    return {
        section:
            match?.[1] && warehouseSections.includes(match[1])
                ? match[1]
                : '',
        number:
            match?.[2] && warehousePositionNumbers.includes(match[2])
                ? match[2]
                : '',
    }
}

export function warehousePositionOptions(products, section, currentProductId = '') {
    return warehousePositionNumbers.map((number) => {
        const location = formatWarehouseLocation(section, number)
        const occupiedBy = products.find(
            (product) =>
                product.active &&
                product.id !== currentProductId &&
                product.location === location,
        )
        return {
            number,
            location,
            unavailable: Boolean(occupiedBy),
            label: occupiedBy ? `${number} — Unavailable` : number,
        }
    })
}
