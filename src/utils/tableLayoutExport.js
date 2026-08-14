function safeFileName(value) {
    return String(value || '')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase()
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

export function downloadTableLayout(dataUrl, layoutName) {
    const link = document.createElement('a')
    link.download = `${safeFileName(layoutName) || 'table-layout'}.png`
    link.href = dataUrl
    link.click()
}

export function printTableLayout(dataUrl, layoutName) {
    const printWindow = window.open('', '_blank', 'width=1000,height=800')
    if (!printWindow) return

    const title = escapeHtml(layoutName || 'Table layout')
    printWindow.document.write(`
        <!doctype html>
        <html>
            <head>
                <title>${title}</title>
                <style>
                    body {
                        margin: 0;
                        padding: 1.5rem;
                        font-family: Arial, sans-serif;
                        text-align: center;
                    }

                    h1 {
                        font-size: 1.5rem;
                    }

                    img {
                        width: 100%;
                        height: auto;
                        object-fit: contain;
                    }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <img src="${dataUrl}" alt="Table layout" />
            </body>
        </html>
    `)
    printWindow.document.close()
    printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
    }
}
