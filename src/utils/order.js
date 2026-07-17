function itemUnitPrice(item) {
    return Number(
        item.unitPrice ||
            Number(item.total || 0) / Math.max(1, Number(item.qty || 1)),
    )
}
function lineTotal(item, qty) {
    return Number((itemUnitPrice(item) * Number(qty || 0)).toFixed(2))
}
function normalizeCheckout(checkout) {
    const sourceGroups = checkout.orderGroups?.length
        ? checkout.orderGroups
        : [{ label: 'ORDER', items: checkout.items || [] }]
    const orderGroups = sourceGroups.map((group, groupIndex) => ({
        ...group,
        __splitId: `group-${groupIndex}`,
        items: (group.items || []).map((item, itemIndex) => ({
            ...item,
            __splitId: `group-${groupIndex}-item-${itemIndex}`,
            qty: Number(item.qty || 1),
            total: Number(item.total || 0),
        })),
    }))
    return {
        ...checkout,
        orderGroups,
        items: orderGroups.flatMap((group) => group.items),
    }
}
function buildSelectedGroups(groups, quantityFor) {
    return groups
        .map((group) => ({
            ...group,
            items: (group.items || [])
                .filter((item) => quantityFor(item) > 0)
                .map((item) => ({
                    ...item,
                    qty: quantityFor(item),
                    total: lineTotal(item, quantityFor(item)),
                })),
        }))
        .filter((group) => group.items.length)
}
function buildRemainingGroups(groups, quantityFor) {
    return groups
        .map((group) => ({
            ...group,
            items: (group.items || [])
                .map((item) => {
                    const qty = Number(item.qty || 1) - quantityFor(item)
                    return qty > 0
                        ? { ...item, qty, total: lineTotal(item, qty) }
                        : null
                })
                .filter(Boolean),
        }))
        .filter((group) => group.items.length)
}
export {
    buildRemainingGroups,
    buildSelectedGroups,
    itemUnitPrice,
    lineTotal,
    normalizeCheckout,
}
