import JsBarcode from 'jsbarcode'

export function barcodeDataUrl(value, options = {}) {
    const content = String(value || '').trim()
    if (!content) return ''

    const canvas = document.createElement('canvas')
    JsBarcode(canvas, content, {
        format: 'CODE128',
        width: options.width || 2,
        height: options.height || 64,
        margin: options.margin ?? 0,
        displayValue: options.displayValue !== false,
        font: 'monospace',
        fontSize: options.fontSize || 16,
        textMargin: options.textMargin ?? 4,
        lineColor: options.lineColor || '#102f35',
        background: options.background || '#ffffff',
    })
    return canvas.toDataURL('image/png')
}
