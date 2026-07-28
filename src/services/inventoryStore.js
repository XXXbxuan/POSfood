import { reactive } from 'vue'

const STORAGE = Object.freeze({
    products: 'ims_products',
    movements: 'ims_movements',
    staff: 'ims_staff',
    session: 'ims_active_account',
    locked: 'ims_session_locked',
})

const DEFAULT_STAFF = [
    {
        name: 'Alice Tan',
        employeeId: 'INV001',
        password: 'inventory123',
        pin: '1234',
        role: 'Superadmin',
        status: 'active',
        barcode: 'STAFF-INV001',
    },
    {
        name: 'Daniel Wong',
        employeeId: 'INV002',
        password: 'stock123',
        pin: '2468',
        role: 'Inventory Manager',
        status: 'active',
        barcode: 'STAFF-INV002',
    },
    {
        name: 'Siti Rahman',
        employeeId: 'INV003',
        password: 'warehouse123',
        pin: '1357',
        role: 'Warehouse Staff',
        status: 'active',
        barcode: 'STAFF-INV003',
    },
]

const DEFAULT_PRODUCTS = [
    {
        id: 'prd-milk-001',
        name: 'Fresh Milk',
        sku: 'MILK-001',
        bar: '9551001000012',
        qrCode: 'IMS:PRODUCT:MILK-001',
        category: 'Dairy',
        type: 'Ingredient',
        unit: 'cartons',
        currentStock: 8,
        minimumStock: 10,
        costPrice: 6.5,
        sellingPrice: 0,
        supplier: 'Fresh Valley Foods',
        location: 'Chiller A-02',
        expiryTracking: true,
        active: true,
        batches: [
            {
                id: 'B26072701',
                quantity: 8,
                receivedDate: '2026-07-27',
                expiryDate: '2026-08-10',
                location: 'Chiller A-02',
                batchQr: 'IMS:BATCH:MILK-001:B26072701',
            },
        ],
        createdAt: '2026-07-27T08:00:00.000Z',
        lastStockIn: '2026-07-27T08:30:00.000Z',
        lastStockOut: '2026-07-27T10:15:00.000Z',
    },
    {
        id: 'prd-coffee-001',
        name: 'Arabica Coffee Beans',
        sku: 'BEAN-001',
        bar: '9551001000029',
        qrCode: 'IMS:PRODUCT:BEAN-001',
        category: 'Dry Goods',
        type: 'Ingredient',
        unit: 'kg',
        currentStock: 24,
        minimumStock: 8,
        costPrice: 48,
        sellingPrice: 0,
        supplier: 'Roast Works',
        location: 'Rack A-01',
        expiryTracking: true,
        active: true,
        batches: [
            {
                id: 'B26071502',
                quantity: 24,
                receivedDate: '2026-07-15',
                expiryDate: '2027-01-15',
                location: 'Rack A-01',
                batchQr: 'IMS:BATCH:BEAN-001:B26071502',
            },
        ],
        createdAt: '2026-07-15T03:00:00.000Z',
        lastStockIn: '2026-07-15T03:30:00.000Z',
        lastStockOut: '2026-07-27T09:10:00.000Z',
    },
    {
        id: 'prd-cup-001',
        name: '12oz Paper Cup',
        sku: 'CUP-012',
        bar: '9551001000036',
        qrCode: 'IMS:PRODUCT:CUP-012',
        category: 'Packaging',
        type: 'Retail Product',
        unit: 'pcs',
        currentStock: 0,
        minimumStock: 50,
        costPrice: 0.28,
        sellingPrice: 0,
        supplier: 'PackRight Supply',
        location: 'Rack B-03',
        expiryTracking: false,
        active: true,
        batches: [],
        createdAt: '2026-07-10T02:00:00.000Z',
        lastStockIn: '2026-07-10T02:30:00.000Z',
        lastStockOut: '2026-07-27T11:20:00.000Z',
    },
    {
        id: 'prd-sandwich-001',
        name: 'Chicken Sandwich',
        sku: 'PREP-014',
        bar: '9551001000043',
        qrCode: 'IMS:PRODUCT:PREP-014',
        category: 'Prepared Food',
        type: 'Prepared Product',
        unit: 'pcs',
        currentStock: 18,
        minimumStock: 6,
        costPrice: 4.2,
        sellingPrice: 9.9,
        supplier: 'In-house Production',
        location: 'Chiller B-01',
        expiryTracking: true,
        active: true,
        batches: [
            {
                id: 'B26072703',
                quantity: 18,
                receivedDate: '2026-07-27',
                expiryDate: '2026-07-30',
                location: 'Chiller B-01',
                batchQr: 'IMS:BATCH:PREP-014:B26072703',
            },
        ],
        createdAt: '2026-07-27T04:00:00.000Z',
        lastStockIn: '2026-07-27T04:30:00.000Z',
        lastStockOut: '2026-07-27T11:40:00.000Z',
    },
    {
        id: 'prd-sugar-001',
        name: 'Fine Sugar',
        sku: 'SUGAR-001',
        bar: '9551001000050',
        qrCode: 'IMS:PRODUCT:SUGAR-001',
        category: 'Dry Goods',
        type: 'Ingredient',
        unit: 'kg',
        currentStock: 35,
        minimumStock: 10,
        costPrice: 3.6,
        sellingPrice: 0,
        supplier: 'Central Grocer',
        location: 'Rack A-03',
        expiryTracking: false,
        active: true,
        batches: [],
        createdAt: '2026-07-01T02:00:00.000Z',
        lastStockIn: '2026-07-25T02:30:00.000Z',
        lastStockOut: '2026-07-27T08:20:00.000Z',
    },
]

const DEFAULT_MOVEMENTS = [
    {
        id: 'MOV-260727-0003',
        productId: 'prd-milk-001',
        productName: 'Fresh Milk',
        sku: 'MILK-001',
        batch: 'B26072701',
        beforeQuantity: 10,
        changedQuantity: -2,
        afterQuantity: 8,
        type: 'Stock Out',
        reason: 'Kitchen Usage',
        location: 'Chiller A-02',
        staffId: 'INV003',
        staffName: 'Siti Rahman',
        reference: 'KITCHEN-0727',
        remark: 'Morning service',
        createdAt: '2026-07-27T10:15:00.000Z',
    },
    {
        id: 'MOV-260727-0002',
        productId: 'prd-cup-001',
        productName: '12oz Paper Cup',
        sku: 'CUP-012',
        batch: '',
        beforeQuantity: 35,
        changedQuantity: -35,
        afterQuantity: 0,
        type: 'Stock Out',
        reason: 'Kitchen Usage',
        location: 'Rack B-03',
        staffId: 'INV003',
        staffName: 'Siti Rahman',
        reference: 'KITCHEN-0727',
        remark: 'Cup issue to outlet',
        createdAt: '2026-07-27T09:45:00.000Z',
    },
    {
        id: 'MOV-260727-0001',
        productId: 'prd-sandwich-001',
        productName: 'Chicken Sandwich',
        sku: 'PREP-014',
        batch: 'B26072703',
        beforeQuantity: 0,
        changedQuantity: 20,
        afterQuantity: 20,
        type: 'Stock In',
        reason: 'Production Completed',
        location: 'Chiller B-01',
        staffId: 'INV002',
        staffName: 'Daniel Wong',
        reference: 'PROD-0727',
        remark: 'Morning production',
        createdAt: '2026-07-27T04:30:00.000Z',
    },
]

function clone(value) {
    return JSON.parse(JSON.stringify(value))
}

function read(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key))
        return value ?? clone(fallback)
    } catch (error) {
        return clone(fallback)
    }
}

function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

function clearLegacyData() {
    Object.keys(localStorage)
        .filter((key) => key.toLowerCase().startsWith('posfood'))
        .forEach((key) => localStorage.removeItem(key))
}

function number(value) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

function todayCode() {
    const date = new Date()
    return `${String(date.getFullYear()).slice(-2)}${String(
        date.getMonth() + 1,
    ).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
}

function nowIso() {
    return new Date().toISOString()
}

function normalizeCode(value) {
    return String(value || '').trim().toUpperCase()
}

function buildMovementId() {
    const prefix = `MOV-${todayCode()}-`
    const sequence =
        state.movements.filter((item) => item.id.startsWith(prefix)).length + 1
    return `${prefix}${String(sequence).padStart(4, '0')}`
}

const state = reactive({
    initialized: false,
    products: [],
    movements: [],
    staff: [],
    activeAccount: null,
    sessionLocked: false,
    toasts: [],
})

function persistInventory() {
    write(STORAGE.products, state.products)
    write(STORAGE.movements, state.movements)
}

function initialize() {
    if (state.initialized) return
    clearLegacyData()
    state.products = read(STORAGE.products, DEFAULT_PRODUCTS).map((product) => {
        const { barcode: legacyBarcode, ...productData } = product
        return {
            ...productData,
            bar: normalizeCode(product.bar || legacyBarcode),
        }
    })
    state.movements = read(STORAGE.movements, DEFAULT_MOVEMENTS)
    state.staff = read(STORAGE.staff, DEFAULT_STAFF).map((account) => {
        const { staffQr: legacyStaffQr, ...accountData } = account
        return {
            ...accountData,
            barcode: normalizeCode(
                account.barcode ||
                    `STAFF-${account.employeeId}`,
            ),
        }
    })
    state.activeAccount = read(STORAGE.session, null)
    state.sessionLocked = localStorage.getItem(STORAGE.locked) === '1'
    write(STORAGE.products, state.products)
    write(STORAGE.staff, state.staff)
    state.initialized = true
}

function findStaff(identifier) {
    const code = normalizeCode(identifier)
    const employeeId = code
        .replace('IMS:STAFF:', '')
        .replace('STAFF-', '')
    return (
        state.staff.find(
            (account) =>
                account.status === 'active' &&
                (account.employeeId === employeeId ||
                    normalizeCode(account.barcode) === code),
        ) || null
    )
}

function startSession(account) {
    const session = {
        name: account.name,
        employeeId: account.employeeId,
        role: account.role,
        signedInAt: nowIso(),
    }
    state.activeAccount = session
    state.sessionLocked = false
    write(STORAGE.session, session)
    localStorage.removeItem(STORAGE.locked)
    return session
}

function logout() {
    state.activeAccount = null
    state.sessionLocked = false
    localStorage.removeItem(STORAGE.session)
    localStorage.removeItem(STORAGE.locked)
}

function lockSession() {
    state.sessionLocked = true
    localStorage.setItem(STORAGE.locked, '1')
}

function unlockSession() {
    state.sessionLocked = false
    localStorage.removeItem(STORAGE.locked)
}

function productStatus(product) {
    if (!product.active) return 'Inactive'
    if (number(product.currentStock) <= 0) return 'Out of Stock'
    if (number(product.currentStock) <= number(product.minimumStock))
        return 'Low Stock'
    return 'In Stock'
}

function expiryStatus(batch) {
    if (!batch?.expiryDate) return ''
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(`${batch.expiryDate}T00:00:00`)
    const days = Math.ceil((expiry - today) / 86400000)
    if (days < 0) return 'Expired'
    if (days <= 3) return 'Expiring Soon'
    return 'Valid'
}

function findProduct(value) {
    const code = normalizeCode(value)
    const batchProductCode = code.startsWith('IMS:BATCH:')
        ? code.split(':')[2]
        : ''
    const clean = (batchProductCode || code)
        .replace('IMS:PRODUCT:', '')
        .replace(/^PRODUCT:/, '')
    return (
        state.products.find(
            (product) =>
                product.id === value ||
                normalizeCode(product.sku) === clean ||
                normalizeCode(product.bar) === clean ||
                normalizeCode(product.qrCode) === code,
        ) || null
    )
}

function nextSku(category = 'Product') {
    const prefix =
        normalizeCode(category)
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 4) || 'PRD'
    let sequence = state.products.length + 1
    let sku = `${prefix}-${String(sequence).padStart(3, '0')}`
    while (findProduct(sku)) {
        sequence += 1
        sku = `${prefix}-${String(sequence).padStart(3, '0')}`
    }
    return sku
}

function nextBar() {
    const stem = `95588${String(Date.now()).slice(-7)}`
    const digits = stem.slice(0, 12).split('').map(Number)
    const total = digits.reduce(
        (sum, digit, index) => sum + digit * (index % 2 === 0 ? 1 : 3),
        0,
    )
    return `${digits.join('')}${(10 - (total % 10)) % 10}`
}

function saveProduct(input, productId = '') {
    const name = String(input.name || '').trim()
    if (!name) throw new Error('Product name is required.')
    const current = productId
        ? state.products.find((product) => product.id === productId)
        : null
    const sku = normalizeCode(input.sku || current?.sku || nextSku(input.category))
    const duplicate = state.products.find(
        (product) => product.sku === sku && product.id !== productId,
    )
    if (duplicate) throw new Error('This product code already exists.')

    const product = {
        ...(current || {}),
        id: current?.id || `prd-${Date.now().toString(36)}`,
        name,
        sku,
        bar: normalizeCode(
            input.bar ||
                input.barcode ||
                current?.bar ||
                nextBar(),
        ),
        qrCode: `IMS:PRODUCT:${sku}`,
        category: String(input.category || 'General').trim(),
        type: input.type || 'Retail Product',
        unit: String(input.unit || 'pcs').trim(),
        currentStock: current ? number(current.currentStock) : 0,
        minimumStock: Math.max(0, number(input.minimumStock)),
        costPrice: Math.max(0, number(input.costPrice)),
        sellingPrice: Math.max(0, number(input.sellingPrice)),
        supplier: String(input.supplier || '').trim(),
        location: String(input.location || '').trim(),
        photo: String(input.photo || current?.photo || ''),
        expiryTracking: Boolean(input.expiryTracking),
        active: input.active !== false,
        batches: current?.batches || [],
        createdAt: current?.createdAt || nowIso(),
    }

    if (current) Object.assign(current, product)
    else state.products.unshift(product)
    write(STORAGE.products, state.products)
    return product
}

function setProductActive(productId, active) {
    const product = findProduct(productId)
    if (!product) throw new Error('Product not found.')
    product.active = Boolean(active)
    write(STORAGE.products, state.products)
    return product
}

function recordMovement(product, data) {
    const account = state.activeAccount || {
        name: 'System',
        employeeId: 'SYSTEM',
    }
    const movement = {
        id: buildMovementId(),
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        batch: data.batch || '',
        beforeQuantity: number(data.beforeQuantity),
        changedQuantity: number(data.changedQuantity),
        afterQuantity: number(data.afterQuantity),
        type: data.type,
        reason: data.reason,
        location: data.location || product.location,
        staffId: account.employeeId,
        staffName: account.name,
        reference: String(data.reference || '').trim(),
        remark: String(data.remark || '').trim(),
        createdAt: nowIso(),
    }
    state.movements.unshift(movement)
    return movement
}

function receiveStock(payload) {
    const product = findProduct(payload.productId)
    if (!product || !product.active) throw new Error('Select an active product.')
    const quantity = number(payload.quantity)
    if (quantity <= 0) throw new Error('Quantity received must be greater than zero.')
    const batchId = normalizeCode(
        payload.batch || `B${todayCode()}${String(product.batches.length + 1).padStart(2, '0')}`,
    )
    const before = number(product.currentStock)
    const after = before + quantity
    const unitCost = Math.max(0, number(payload.unitCost))
    if (unitCost > 0)
        product.costPrice = (before * number(product.costPrice) + quantity * unitCost) / after
    product.currentStock = after
    product.supplier = payload.supplier || product.supplier
    product.location = payload.location || product.location
    product.lastStockIn = nowIso()

    const existingBatch = product.batches.find((batch) => batch.id === batchId)
    if (existingBatch) {
        existingBatch.quantity = number(existingBatch.quantity) + quantity
        existingBatch.expiryDate = payload.expiryDate || existingBatch.expiryDate
        existingBatch.location = payload.location || existingBatch.location
    } else {
        product.batches.push({
            id: batchId,
            quantity,
            receivedDate: payload.receivingDate || nowIso().slice(0, 10),
            manufacturingDate: payload.manufacturingDate || '',
            expiryDate: payload.expiryDate || '',
            location: payload.location || product.location,
            batchQr: `IMS:BATCH:${product.sku}:${batchId}`,
        })
    }

    const movement = recordMovement(product, {
        batch: batchId,
        beforeQuantity: before,
        changedQuantity: quantity,
        afterQuantity: after,
        type: 'Stock In',
        reason: 'Supplier Delivery',
        location: payload.location,
        reference: payload.invoiceNumber || payload.purchaseOrderNumber,
        remark: payload.remark,
    })
    persistInventory()
    return { product, movement, before, after, batchId }
}

function deductBatches(product, quantity) {
    let remaining = quantity
    const batches = [...product.batches].sort((a, b) => {
        const aDate = a.expiryDate || '9999-12-31'
        const bDate = b.expiryDate || '9999-12-31'
        return aDate.localeCompare(bDate)
    })
    batches.forEach((batch) => {
        if (remaining <= 0) return
        const deduction = Math.min(number(batch.quantity), remaining)
        batch.quantity = number(batch.quantity) - deduction
        remaining -= deduction
    })
    return remaining
}

function adjustStock(payload) {
    const product = findProduct(payload.productId)
    if (!product || !product.active) throw new Error('Select an active product.')
    const quantity = number(payload.quantity)
    if (quantity <= 0) throw new Error('Quantity must be greater than zero.')
    const isOut = payload.direction === 'out'
    const before = number(product.currentStock)
    if (isOut && quantity > before) {
        const error = new Error(
            `Insufficient stock. Available: ${before} ${product.unit}.`,
        )
        error.code = 'INSUFFICIENT_STOCK'
        error.available = before
        error.requested = quantity
        throw error
    }

    const changed = isOut ? -quantity : quantity
    const after = Math.max(0, before + changed)
    product.currentStock = after
    if (isOut) {
        deductBatches(product, quantity)
        product.lastStockOut = nowIso()
    } else {
        product.lastStockIn = nowIso()
    }

    const movement = recordMovement(product, {
        batch: payload.batch,
        beforeQuantity: before,
        changedQuantity: changed,
        afterQuantity: after,
        type: isOut ? 'Stock Out' : 'Stock In',
        reason: payload.reason || (isOut ? 'Stock Adjustment' : 'Stock Top Up'),
        location: payload.location,
        reference: payload.reference,
        remark: payload.remark,
    })
    persistInventory()
    return { product, movement, before, after }
}

function addToast(message, tone = 'success') {
    const toast = { id: Date.now() + Math.random(), message, tone }
    state.toasts.push(toast)
    window.setTimeout(() => removeToast(toast.id), 3200)
}

function removeToast(id) {
    const index = state.toasts.findIndex((toast) => toast.id === id)
    if (index >= 0) state.toasts.splice(index, 1)
}

function dashboardStats() {
    const active = state.products.filter((product) => product.active)
    const totalQuantity = active.reduce(
        (sum, product) => sum + number(product.currentStock),
        0,
    )
    const stockValue = active.reduce(
        (sum, product) =>
            sum + number(product.currentStock) * number(product.costPrice),
        0,
    )
    const lowStock = active.filter(
        (product) =>
            number(product.currentStock) > 0 &&
            number(product.currentStock) <= number(product.minimumStock),
    )
    const outOfStock = active.filter((product) => number(product.currentStock) <= 0)
    const expiring = active.flatMap((product) =>
        product.batches
            .filter((batch) => expiryStatus(batch) === 'Expiring Soon')
            .map((batch) => ({ ...batch, product })),
    )
    const today = nowIso().slice(0, 10)
    const todayMovements = state.movements.filter((item) =>
        item.createdAt.startsWith(today),
    )
    return {
        totalProducts: active.length,
        totalQuantity,
        stockValue,
        lowStock,
        outOfStock,
        expiring,
        todayIn: todayMovements
            .filter((item) => item.changedQuantity > 0)
            .reduce((sum, item) => sum + item.changedQuantity, 0),
        todayOut: Math.abs(
            todayMovements
                .filter((item) => item.changedQuantity < 0)
                .reduce((sum, item) => sum + item.changedQuantity, 0),
        ),
    }
}

const inventoryStore = {
    state,
    initialize,
    findStaff,
    startSession,
    logout,
    lockSession,
    unlockSession,
    findProduct,
    productStatus,
    expiryStatus,
    nextSku,
    saveProduct,
    setProductActive,
    receiveStock,
    adjustStock,
    addToast,
    removeToast,
    dashboardStats,
}

export { inventoryStore, STORAGE }
