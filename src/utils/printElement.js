function nextPaint() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve))
    })
}

function copyCanvasImages(source, clone) {
    const sourceCanvases = source.querySelectorAll('canvas')
    const clonedCanvases = clone.querySelectorAll('canvas')

    sourceCanvases.forEach((canvas, index) => {
        const clonedCanvas = clonedCanvases[index]
        if (!clonedCanvas) return

        try {
            const image = document.createElement('img')
            const bounds = canvas.getBoundingClientRect()
            image.src = canvas.toDataURL('image/png', 1)
            image.alt = 'Printed chart'
            image.className = 'print-canvas-image'
            image.style.aspectRatio = `${bounds.width} / ${bounds.height}`
            clonedCanvas.replaceWith(image)
        } catch (error) {
            console.error('Unable to prepare chart for printing.', error)
        }
    })
}

async function waitForImages(root) {
    await Promise.all(
        [...root.querySelectorAll('img')].map((image) => {
            if (image.complete) return image.decode?.().catch(() => undefined)
            return new Promise((resolve) => {
                image.addEventListener('load', resolve, { once: true })
                image.addEventListener('error', resolve, { once: true })
            })
        }),
    )
}

export async function printElement(source, options = {}) {
    if (!source) {
        console.error('Print area not found.')
        return false
    }

    document.querySelector('.pos-print-root')?.remove()

    const printRoot = document.createElement('div')
    const variant = options.variant ? ` ${options.variant}` : ''
    printRoot.className = `pos-print-root${variant}`

    const clone = source.cloneNode(true)
    copyCanvasImages(source, clone)
    printRoot.appendChild(clone)
    document.body.appendChild(printRoot)
    document.body.classList.add('print-element-active')

    await waitForImages(printRoot)
    await nextPaint()

    let cleaned = false
    const cleanup = () => {
        if (cleaned) return
        cleaned = true
        printRoot.remove()
        document.body.classList.remove('print-element-active')
        window.removeEventListener('afterprint', cleanup)
    }

    window.addEventListener('afterprint', cleanup, { once: true })
    window.print()
    return true
}
