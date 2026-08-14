export function paginationItems(currentPage, totalPages) {
    const total = Math.max(1, Number(totalPages) || 1)
    const current = Math.min(total, Math.max(1, Number(currentPage) || 1))
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
    if (current <= 3) return [1, 2, 3, 'end-ellipsis', total - 2, total - 1, total]
    if (current >= total - 2) return [1, 2, 3, 'start-ellipsis', total - 2, total - 1, total]
    return [1, 'start-ellipsis', current - 1, current, current + 1, 'end-ellipsis', total]
}

export function paginationLabel(item) {
    return typeof item === 'number' ? item : '…'
}
