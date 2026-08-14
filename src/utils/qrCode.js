import QRCode from 'qrcode'

export function qrCodeDataUrl(value, options = {}) {
    const text = String(value || '').trim()
    if (!text) return Promise.resolve('')
    return QRCode.toDataURL(text, {
        errorCorrectionLevel: 'M',
        margin: options.margin ?? 1,
        width: options.width || 280,
        color: {
            dark: options.dark || '#17353a',
            light: options.light || '#ffffff',
        },
    })
}
