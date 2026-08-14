export function defaultLabelStyle(key) {
    const sizes = {
        brand: 18,
        warehouse: 14,
        name: 30,
        sku: 14,
        batch: 16,
        quantity: 16,
        sequence: 16,
        received: 16,
        expiry: 16,
        location: 16,
        price: 16,
        items: 12,
        supplier: 12,
    }
    const custom = key.startsWith('custom-text-')
    return {
        text: custom ? 'Text' : '',
        size: custom ? 14 : sizes[key] || 12,
        align: 'left',
        scale: 100,
        x: 0,
        y: 0,
    }
}

export function resolvedLabelStyle(edits, key) {
    return {
        ...defaultLabelStyle(key),
        ...(edits?.[key] || {}),
    }
}

export function labelTransformStyle(edits, key) {
    const style = resolvedLabelStyle(edits, key)
    return {
        fontSize: style.size ? `${style.size}px` : undefined,
        textAlign: style.align || undefined,
        transform: `translate(${style.x || 0}px, ${style.y || 0}px) scale(${(style.scale || 100) / 100})`,
        transformOrigin: 'center',
    }
}

export function labelTextStyle(edits, key) {
    const style = resolvedLabelStyle(edits, key)
    return {
        fontSize: style.size ? `${style.size}px` : undefined,
        textAlign: style.align || undefined,
    }
}

export function labelFieldStyle(edits, key) {
    const style = resolvedLabelStyle(edits, key)
    return {
        transform: `translate(${style.x || 0}px, ${style.y || 0}px) scale(${(style.scale || 100) / 100})`,
        transformOrigin: 'center',
    }
}

export function labelText(edits, key, fallback) {
    return Object.prototype.hasOwnProperty.call(edits || {}, key)
        ? edits[key].text
        : fallback
}
