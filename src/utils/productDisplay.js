const PRODUCT_CODE_COLUMN_WIDTH = 10

function productOptionLabel(product) {
    const code = String(product?.sku || '').trim()
    const alignedCode = code.padEnd(PRODUCT_CODE_COLUMN_WIDTH, '\u00a0')
    return `${alignedCode} - ${product?.name || ''}`
}

export { productOptionLabel }
