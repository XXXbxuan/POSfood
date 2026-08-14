import { reactive } from 'vue'
import {
    PERMISSIONS,
    defaultPermissionsForRole,
    hasPermission,
    normalizePermissions,
    normalizeRole,
} from './permissions.js'

const STORAGE = Object.freeze({
    snapshot: 'ims_inventory_v2',
    products: 'ims_products',
    movements: 'ims_movements',
    staff: 'ims_staff',
    suppliers: 'ims_suppliers',
    warehouses: 'ims_warehouses',
    stockUnits: 'ims_stock_units',
    shipments: 'ims_shipments',
    receipts: 'ims_receipts',
    stockLots: 'ims_stock_lots',
    stockPositions: 'ims_stock_positions',
    transfers: 'ims_transfers',
    stockInRequests: 'ims_stock_in_requests',
    labelPrints: 'ims_label_prints',
    batchDefinitions: 'ims_batch_definitions',
    session: 'ims_active_account',
    locked: 'ims_session_locked',
})

const DEFAULT_DEVELOPER_ACCOUNT = Object.freeze({
    name: 'System Developer',
    employeeId: 'DEV001',
    password: 'developer123',
    pin: '9999',
    role: 'Developer',
    status: 'active',
    barcode: 'STAFF-DEV001',
    qrCode: 'IMS:STAFF:DEV001',
    phone: '',
    email: '',
    lastLoginAt: '',
    permissionsVersion: 5,
})

const DEFAULT_STAFF = [
    DEFAULT_DEVELOPER_ACCOUNT,
    {
        name: 'Alice Tan',
        employeeId: 'INV001',
        password: 'inventory123',
        pin: '1234',
        role: 'Superadmin',
        status: 'active',
        barcode: 'STAFF-INV001',
        qrCode: 'IMS:STAFF:INV001',
        phone: '',
        email: '',
        lastLoginAt: '',
    },
    {
        name: 'Daniel Wong',
        employeeId: 'INV002',
        password: 'stock123',
        pin: '2468',
        role: 'Inventory Manager',
        status: 'active',
        barcode: 'STAFF-INV002',
        qrCode: 'IMS:STAFF:INV002',
        phone: '',
        email: '',
        lastLoginAt: '',
    },
    {
        name: 'Siti Rahman',
        employeeId: 'INV003',
        password: 'warehouse123',
        pin: '1357',
        role: 'Warehouse Staff',
        status: 'active',
        barcode: 'STAFF-INV003',
        qrCode: 'IMS:STAFF:INV003',
        phone: '',
        email: '',
        lastLoginAt: '',
    },
]

const CATEGORY_CODES = Object.freeze({
    Dairy: 'DAI',
    'Dry Goods': 'DRY',
    Packaging: 'PAC',
    'Prepared Food': 'PRE',
})

const DEFAULT_PRODUCT_CATEGORIES = Object.freeze([
    'Dairy',
    'Dry Goods',
    'Packaging',
    'Prepared Food',
    'General',
])

const DEFAULT_WAREHOUSES = [
    {
        id: 'wh-main',
        code: 'MAIN',
        name: 'Main Warehouse',
        purpose: 'Available stock',
        active: true,
        locations: [
            'Rack A-01', 'Rack A-02', 'Rack A-03', 'Rack A-04', 'Rack A-05',
            'Rack B-03', 'Chiller A-02', 'Chiller B-01',
        ].map((name) => ({ id: `loc-main-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name, active: true })),
    },
    {
        id: 'wh-refunds',
        code: 'REFUNDS',
        name: 'Refunds Warehouse',
        purpose: 'Returned and unavailable stock',
        active: true,
        locations: [
            { id: 'loc-refunds-return-shelf-r-01', name: 'Return Shelf R-01', active: true },
            { id: 'loc-refunds-inspection-r-02', name: 'Inspection Shelf R-02', active: true },
        ],
    },
]

const DEFAULT_PRODUCTS = [
    {
        id: 'prd-milk-001',
        name: 'Fresh Milk',
        nameMode: 'multiple',
        nameTranslations: { en: 'Fresh Milk', cn: '鲜牛奶', bm: 'Susu Segar' },
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
        nameMode: 'multiple',
        nameTranslations: { en: 'Arabica Coffee Beans', cn: '阿拉比卡咖啡豆', bm: 'Biji Kopi Arabika' },
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
        nameMode: 'multiple',
        nameTranslations: { en: '12oz Paper Cup', cn: '12安士纸杯', bm: 'Cawan Kertas 12oz' },
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
        nameMode: 'multiple',
        nameTranslations: { en: 'Chicken Sandwich', cn: '鸡肉三明治', bm: 'Sandwic Ayam' },
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
        nameMode: 'multiple',
        nameTranslations: { en: 'Fine Sugar', cn: '细砂糖', bm: 'Gula Halus' },
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

const DEFAULT_SUPPLIERS = [
    {
        id: 'sup-001',
        code: 'SUP001',
        name: 'Fresh Valley Foods',
        contactName: '',
        phone: '',
        email: '',
        address: '',
        leadTimeDays: 2,
        paymentTerms: '30 days',
        status: 'active',
    },
    {
        id: 'sup-002',
        code: 'SUP002',
        name: 'Roast Works',
        contactName: '',
        phone: '',
        email: '',
        address: '',
        leadTimeDays: 5,
        paymentTerms: '30 days',
        status: 'active',
    },
    {
        id: 'sup-003',
        code: 'SUP003',
        name: 'PackRight Supply',
        contactName: '',
        phone: '',
        email: '',
        address: '',
        leadTimeDays: 4,
        paymentTerms: '30 days',
        status: 'active',
    },
    {
        id: 'sup-004',
        code: 'SUP004',
        name: 'In-house Production',
        contactName: 'Production Team',
        phone: '',
        email: '',
        address: '',
        leadTimeDays: 0,
        paymentTerms: 'Internal',
        status: 'active',
    },
    {
        id: 'sup-005',
        code: 'SUP005',
        name: 'Central Grocer',
        contactName: '',
        phone: '',
        email: '',
        address: '',
        leadTimeDays: 3,
        paymentTerms: 'Cash',
        status: 'active',
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

const LEGACY_INVENTORY_STORAGE_KEYS = Object.freeze([
    STORAGE.products,
    STORAGE.movements,
    STORAGE.stockUnits,
    STORAGE.shipments,
    STORAGE.receipts,
    STORAGE.stockLots,
    STORAGE.stockPositions,
    STORAGE.transfers,
    STORAGE.stockInRequests,
    STORAGE.labelPrints,
    STORAGE.batchDefinitions,
])

function isStorageQuotaError(error) {
    return Boolean(
        error &&
            (error.name === 'QuotaExceededError' ||
                error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                Number(error.code) === 22 ||
                Number(error.code) === 1014),
    )
}

function clearLegacyInventoryStorage(excludeKey = '') {
    LEGACY_INVENTORY_STORAGE_KEYS.forEach((key) => {
        if (key && key !== excludeKey) localStorage.removeItem(key)
    })
}

// localStorage is intentionally kept as the synchronous persistence layer for this
// tablet-first demo, but the inventory ledger can become large because thousands of
// records repeat the same JSON property names. Store the exact same data in a compact
// column format and expand it again during initialize(). Runtime state remains normal
// objects/arrays, so none of the inventory/business logic needs to know about this.
const INVENTORY_STORAGE_CODEC = 'ims-column-v1'
const PACKED_ROWS_MARKER = '__imsRows'
const MEDIA_REF_PREFIX = '__IMS_MEDIA_REF__:'

function isPlainStorageObject(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function packStorageValue(value) {
    if (Array.isArray(value)) {
        const packedItems = value.map((item) => packStorageValue(item))
        if (
            packedItems.length >= 2 &&
            packedItems.every((item) => isPlainStorageObject(item) && !item[PACKED_ROWS_MARKER])
        ) {
            const keys = []
            const seen = new Set()
            packedItems.forEach((item) => {
                Object.keys(item).forEach((key) => {
                    if (seen.has(key)) return
                    seen.add(key)
                    keys.push(key)
                })
            })
            return {
                [PACKED_ROWS_MARKER]: 1,
                k: keys,
                r: packedItems.map((item) =>
                    keys.map((key) =>
                        Object.prototype.hasOwnProperty.call(item, key)
                            ? packStorageValue(item[key])
                            : null,
                    ),
                ),
            }
        }
        return packedItems
    }
    if (isPlainStorageObject(value)) {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, packStorageValue(item)]),
        )
    }
    return value
}

function unpackStorageValue(value) {
    if (Array.isArray(value)) return value.map((item) => unpackStorageValue(item))
    if (!isPlainStorageObject(value)) return value
    if (value[PACKED_ROWS_MARKER] === 1 && Array.isArray(value.k) && Array.isArray(value.r)) {
        return value.r.map((row) => {
            const item = {}
            value.k.forEach((key, index) => {
                const cell = row?.[index]
                if (cell !== null && cell !== undefined) item[key] = unpackStorageValue(cell)
            })
            return item
        })
    }
    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, unpackStorageValue(item)]),
    )
}

function extractStorageMedia(value) {
    const media = []
    const ids = new Map()
    const visit = (item) => {
        if (typeof item === 'string' && item.length > 1024 && item.startsWith('data:image/')) {
            let index = ids.get(item)
            if (index === undefined) {
                index = media.length
                ids.set(item, index)
                media.push(item)
            }
            return `${MEDIA_REF_PREFIX}${index}`
        }
        if (Array.isArray(item)) return item.map((child) => visit(child))
        if (isPlainStorageObject(item)) {
            return Object.fromEntries(
                Object.entries(item).map(([key, child]) => [key, visit(child)]),
            )
        }
        return item
    }
    return { value: visit(value), media }
}

function restoreStorageMedia(value, media = []) {
    const visit = (item) => {
        if (typeof item === 'string' && item.startsWith(MEDIA_REF_PREFIX)) {
            const index = Number(item.slice(MEDIA_REF_PREFIX.length))
            return Number.isInteger(index) && index >= 0 && index < media.length
                ? media[index]
                : ''
        }
        if (Array.isArray(item)) return item.map((child) => visit(child))
        if (isPlainStorageObject(item)) {
            return Object.fromEntries(
                Object.entries(item).map(([key, child]) => [key, visit(child)]),
            )
        }
        return item
    }
    return visit(value)
}

function encodeInventorySnapshot(snapshot) {
    const extracted = extractStorageMedia(snapshot)
    return {
        version: 3,
        storageCodec: INVENTORY_STORAGE_CODEC,
        media: extracted.media,
        data: packStorageValue(extracted.value),
    }
}

function decodeInventorySnapshot(stored) {
    if (!stored || stored.storageCodec !== INVENTORY_STORAGE_CODEC) return stored
    try {
        return restoreStorageMedia(unpackStorageValue(stored.data), stored.media || [])
    } catch (error) {
        console.error('Failed to decode compact inventory storage.', error)
        return null
    }
}

function write(key, value) {
    const serialized = JSON.stringify(value)
    try {
        localStorage.setItem(key, serialized)
    } catch (error) {
        if (!isStorageQuotaError(error)) throw error

        // Older IMS builds persisted every inventory collection in its own key.
        // The v2 snapshot supersedes those keys, so keeping both copies can use
        // almost twice the browser quota. Temporarily keep the legacy values in
        // memory, clear their storage space and retry the current write.
        const legacyBackup = LEGACY_INVENTORY_STORAGE_KEYS
            .filter((legacyKey) => legacyKey && legacyKey !== key)
            .map((legacyKey) => [legacyKey, localStorage.getItem(legacyKey)])
            .filter(([, legacyValue]) => legacyValue !== null)

        clearLegacyInventoryStorage(key)
        try {
            localStorage.setItem(key, serialized)
        } catch (retryError) {
            // The snapshot itself is genuinely too large. Restore the legacy
            // keys so a failed migration never silently destroys user data.
            legacyBackup.forEach(([legacyKey, legacyValue]) => {
                try {
                    localStorage.setItem(legacyKey, legacyValue)
                } catch (_) {
                    // Best-effort restore; keep the original quota error below.
                }
            })
            if (isStorageQuotaError(retryError)) {
                throw new Error(
                    'Inventory storage is full. Remove large old photos or browser site data, then try again.',
                )
            }
            throw retryError
        }
    }

    // Once the canonical snapshot is safely stored, the old per-collection
    // inventory keys are redundant and only waste quota. Staff, suppliers,
    // warehouses and session keys are intentionally kept because they are still
    // stored separately by the current design.
    if (key === STORAGE.snapshot) clearLegacyInventoryStorage(STORAGE.snapshot)
}

function readLegacyStaff() {
    try {
        const accounts = JSON.parse(localStorage.getItem('posfood_accounts'))
        if (!Array.isArray(accounts)) return []
        return accounts.map((account) => {
            const employeeId = normalizeCode(account.employeeId).replace(
                'EMP',
                'INV',
            )
            return {
                ...account,
                employeeId,
                barcode: account.barcode || `STAFF-${employeeId}`,
                qrCode: account.qrCode || `IMS:STAFF:${employeeId}`,
            }
        })
    } catch (error) {
        return []
    }
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

function normalizeStaff(account = {}) {
    const employeeId = normalizeCode(account.employeeId)
    const role = normalizeRole(account.role)
    const permissions =
        Number(account.permissionsVersion) >= 2
            ? normalizePermissions(role, account.permissions)
            : defaultPermissionsForRole(role)

    // Permission schema v3 introduced stock counting. Preserve every existing
    // custom permission and only add the new capability to operational roles.
    if (Number(account.permissionsVersion) < 3) {
        if (['Developer', 'Superadmin', 'Inventory Manager', 'Warehouse Staff'].includes(role)) {
            permissions.push(PERMISSIONS.COUNT_STOCK)
        }
        if (['Developer', 'Superadmin', 'Inventory Manager'].includes(role)) {
            permissions.push(PERMISSIONS.APPROVE_STOCK_COUNT)
        }
    }
    // Supplier receiving uses separation of duties: warehouse staff may submit
    // a request, while only management can confirm it and mutate inventory.
    if (Number(account.permissionsVersion) < 4 && ['Developer', 'Superadmin', 'Inventory Manager'].includes(role)) {
        permissions.push(PERMISSIONS.APPROVE_SUPPLIER_RECEIPT)
    }
    return {
        ...account,
        name: String(account.name || '').trim(),
        employeeId,
        password: String(account.password || ''),
        pin: String(account.pin || ''),
        phone: String(account.phone || '').trim(),
        email: String(account.email || account.gmail || '').trim(),
        role,
        status: account.status === 'disabled' ? 'disabled' : 'active',
        barcode: normalizeCode(account.barcode || `STAFF-${employeeId}`),
        qrCode: normalizeCode(account.qrCode || `IMS:STAFF:${employeeId}`),
        permissions: [...new Set(permissions)],
        permissionsVersion: 5,
        createdAt: account.createdAt || nowIso(),
        lastLoginAt: account.lastLoginAt || '',
    }
}

function migrateSupplierLinks(products, movements, suppliers) {
    const supplierById = new Map(
        suppliers.map((supplier) => [supplier.id, supplier]),
    )
    const supplierByName = new Map(
        suppliers.map((supplier) => [
            String(supplier.name || '').trim().toLowerCase(),
            supplier,
        ]),
    )
    const productById = new Map(products.map((product) => [product.id, product]))

    products.forEach((product) => {
        const supplier =
            supplierById.get(product.supplierId) ||
            supplierByName.get(
                String(product.supplier || '').trim().toLowerCase(),
            )
        if (!supplier) {
            product.supplierId = ''
            product.supplier = ''
            return
        }
        product.supplierId = supplier.id
        product.supplier = supplier.name
    })

    movements.forEach((movement) => {
        if (
            movement.type !== 'Stock In' ||
            movement.reason !== 'Supplier Delivery'
        )
            return
        const product = productById.get(movement.productId)
        const supplier =
            supplierById.get(movement.supplierId) ||
            supplierByName.get(
                String(movement.supplierName || '').trim().toLowerCase(),
            ) ||
            supplierById.get(product?.supplierId)
        if (!supplier) return
        movement.supplierId = supplier.id
        movement.supplierName = supplier.name
    })
}

function categoryCode(category = 'Product') {
    const categoryName = String(category || '').trim()
    return (
        CATEGORY_CODES[categoryName] ||
        normalizeCode(categoryName)
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 3) ||
        'PRD'
    )
}

function skuSequence(sku) {
    const match = normalizeCode(sku).match(/(\d+)$/)
    return match ? Math.max(1, Number(match[1])) : 1
}

function formatCategorySku(category, sequence) {
    return `${categoryCode(category)}-${String(sequence).padStart(3, '0')}`
}

function migrateCategorySkus(products, movements) {
    const used = new Set()
    const skuByProductId = new Map()

    products.forEach((product) => {
        const previousSku = normalizeCode(product.sku)
        let sequence = skuSequence(previousSku)
        let nextCode = formatCategorySku(product.category, sequence)

        while (used.has(nextCode)) {
            sequence += 1
            nextCode = formatCategorySku(product.category, sequence)
        }
        used.add(nextCode)

        if (previousSku && previousSku !== nextCode) {
            product.legacySku = product.legacySku || previousSku
        }

        product.sku = nextCode
        product.qrCode = `IMS:PRODUCT:${nextCode}`
        product.batches = (product.batches || []).map((batch) => ({
            ...batch,
            batchQr: `IMS:BATCH:${nextCode}:${batch.id}`,
        }))
        skuByProductId.set(product.id, nextCode)
    })

    movements.forEach((movement) => {
        const currentSku = skuByProductId.get(movement.productId)
        if (currentSku) movement.sku = currentSku
    })
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
    productCategories: [],
    movements: [],
    staff: [],
    suppliers: [],
    warehouses: [],
    stockUnits: [],
    shipments: [],
    receipts: [],
    stockLots: [],
    stockPositions: [],
    transfers: [],
    stockInRequests: [],
    labelPrints: [],
    batchDefinitions: [],
    stockCounts: [],
    activeAccount: null,
    sessionLocked: false,
    toasts: [],
})

let inventoryCodeVersion = 0

function persistInventory() {
    const snapshot = {
        version: 3,
        inventoryCodeVersion,
        products: state.products,
        productCategories: state.productCategories,
        movements: state.movements,
        stockUnits: state.stockUnits,
        shipments: state.shipments,
        receipts: state.receipts,
        stockLots: state.stockLots,
        stockPositions: state.stockPositions,
        transfers: state.transfers,
        stockInRequests: state.stockInRequests,
        labelPrints: state.labelPrints,
        batchDefinitions: state.batchDefinitions,
        stockCounts: state.stockCounts,
    }
    write(STORAGE.snapshot, encodeInventorySnapshot(snapshot))
}

function persistWarehouses() {
    write(STORAGE.warehouses, state.warehouses)
}

function normalizeWarehouse(warehouse) {
    const nameTranslations = warehouse.nameTranslations || warehouse.nameI18n || {}
    const englishName = String(nameTranslations.en || warehouse.name || '').trim()
    return {
        ...warehouse,
        name: englishName,
        nameMode: warehouse.nameMode === 'multiple' ? 'multiple' : 'single',
        nameTranslations: {
            en: englishName,
            cn: String(nameTranslations.cn || englishName).trim() || englishName,
            bm: String(nameTranslations.bm || englishName).trim() || englishName,
        },
        companyName: String(warehouse.companyName || '').trim(),
        address: String(warehouse.address || '').trim(),
        contactName: String(warehouse.contactName || '').trim(),
        phone: String(warehouse.phone || '').trim(),
        locations: Array.isArray(warehouse.locations)
            ? warehouse.locations.map((location) => {
                  const translations = location.nameTranslations || location.nameI18n || {}
                  const name = String(translations.en || location.name || '').trim()
                  return {
                  ...location,
                  id: location.id || `loc-${warehouse.id}-${String(location.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                  warehouseId: warehouse.id,
                  code: normalizeCode(location.code || location.name),
                  name,
                  nameMode: location.nameMode === 'multiple' ? 'multiple' : 'single',
                  nameTranslations: {
                      en: name,
                      cn: String(translations.cn || name).trim() || name,
                      bm: String(translations.bm || name).trim() || name,
                  },
                  type: String(
                      location.type ||
                          (/chiller/i.test(location.name || '') ? 'Chiller' : 'Rack'),
                  ).trim(),
                  capacityValue:
                      location.capacityValue === '' ||
                      location.capacityValue === null ||
                      location.capacityValue === undefined
                          ? null
                          : Math.max(0, number(location.capacityValue)),
                  capacityUnit: String(location.capacityUnit || '').trim(),
                  status:
                      location.status === 'unavailable' ||
                      location.active === false
                          ? 'unavailable'
                          : 'active',
                  active: location.active !== false,
              }}).filter((location) => location.name)
            : [],
        active: warehouse.active !== false,
    }
}

const SIMPLE_DEFAULT_LOCATION_NAMES = Object.freeze({
    'loc-main-rack-a-01': 'Rack A',
    'loc-main-rack-a-02': 'Rack B',
    'loc-main-rack-a-03': 'Rack C',
    'loc-main-rack-a-04': 'Rack D',
    'loc-main-rack-a-05': 'Rack E',
    'loc-main-rack-b-03': 'Rack F',
    'loc-main-chiller-a-02': 'Chiller A',
    'loc-main-chiller-b-01': 'Chiller B',
    'loc-refunds-return-shelf-r-01': 'Return Area',
    'loc-refunds-inspection-r-02': 'Inspection Area',
})

function migrateSimpleLocationNames() {
    state.warehouses.forEach((warehouse) => {
        warehouse.locations.forEach((location) => {
            const nextName = SIMPLE_DEFAULT_LOCATION_NAMES[location.id]
            if (!nextName) return
            location.legacyName = location.legacyName || location.name
            location.legacyCode = location.legacyCode || location.code
            location.name = nextName
            location.code = normalizeCode(nextName)
            if (/^Rack /i.test(nextName)) location.type = 'Rack'
            if (/^Chiller /i.test(nextName)) location.type = 'Chiller'
            if (/Return Area/i.test(nextName)) location.type = 'Returns'
            if (/Inspection Area/i.test(nextName)) location.type = 'Inspection'
        })
    })
}

function migrateWarehouseAllocations() {
    const main = state.warehouses.find((warehouse) => warehouse.id === 'wh-main') || state.warehouses[0]
    if (!main) return
    const knownLocations = new Set(main.locations.map((location) => location.name.toLowerCase()))
    state.products.forEach((product) => {
        product.warehouseId = product.warehouseId || main.id
        product.warehouseName = product.warehouseName || main.name
        const locations = [product.location, ...(product.batches || []).map((batch) => batch.location)]
        locations.filter(Boolean).forEach((name) => {
            if (knownLocations.has(name.toLowerCase())) return
            main.locations.push({
                id: `loc-${main.id}-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                warehouseId: main.id,
                code: normalizeCode(name),
                name,
                type: /chiller/i.test(name) ? 'Chiller' : 'Rack',
                capacityValue: null,
                capacityUnit: '',
                status: 'active',
                active: true,
            })
            knownLocations.add(name.toLowerCase())
        })
        product.batches = (product.batches || []).map((batch) => ({
            ...batch,
            warehouseId: batch.warehouseId || product.warehouseId,
            warehouseName: batch.warehouseName || product.warehouseName,
        }))
    })
}

function normalizeTrackingMode(product) {
    const requested = String(product.trackingMode || '').toLowerCase()
    if (['none', 'batch', 'unit'].includes(requested)) return requested
    return product.expiryTracking ? 'batch' : 'none'
}

function normalizeStockUnit(unit) {
    return {
        ...unit,
        id: String(unit.id || `unit-${Date.now().toString(36)}`),
        code: normalizeCode(unit.code || unit.serial || ''),
        status: unit.status || 'available',
        receiptId: String(unit.receiptId || ''),
        receiptLineId: String(unit.receiptLineId || ''),
        lotId: String(unit.lotId || ''),
        positionId: String(unit.positionId || ''),
        warehouseId: unit.warehouseId || 'wh-main',
        warehouseName: unit.warehouseName || 'Main Warehouse',
        locationId: String(unit.locationId || ''),
        location: String(unit.location || '').trim(),
        createdAt: unit.createdAt || nowIso(),
    }
}

function unitCode(product, batchNumber, ordinal) {
    return `${normalizeCode(product.sku)}-${normalizeCode(batchNumber)}-${String(ordinal).padStart(3, '0')}`
}

function stockLayerCode(productOrId, lotOrCode = '') {
    const product = typeof productOrId === 'object'
        ? productOrId
        : state.products.find((item) => item.id === productOrId)
    if (!product) return ''
    const layerCode = typeof lotOrCode === 'object'
        ? String(lotOrCode?.batchNumber || lotOrCode?.id || '').trim()
        : String(lotOrCode || '').trim()
    return layerCode
        ? `${normalizeCode(product.sku)}-${normalizeCode(layerCode)}`
        : normalizeCode(product.sku)
}

function nextStockUnitOrdinal(lotId) {
    return (
        state.stockUnits
            .filter((unit) => unit.lotId === lotId)
            .reduce(
                (maximum, unit) =>
                    Math.max(maximum, number(unit.batchOrdinal || unit.ordinal)),
                0,
            ) + 1
    )
}

function createStockUnits(
    product,
    lot,
    position,
    quantity,
    warehouse,
    location,
    receipt,
    receiptLine,
) {
    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error('Unit-level tracking requires a whole-number quantity.')
    }
    const firstOrdinal = nextStockUnitOrdinal(lot.id)
    const units = Array.from({ length: quantity }, (_, index) => {
        const ordinal = firstOrdinal + index
        return normalizeStockUnit({
            id: `unit-${normalizeCode(lot.id)}-${String(ordinal).padStart(3, '0')}`,
            code: unitCode(product, lot.batchNumber, ordinal),
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            batchId: lot.batchNumber,
            lotId: lot.id,
            positionId: position.id,
            receiptId: receipt.id,
            receiptLineId: receiptLine.id,
            ordinal,
            batchOrdinal: ordinal,
            receiptQuantity: number(lot.receivedQuantity),
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            locationId: location.id,
            location: location.name,
            status: 'available',
        })
    })
    state.stockUnits.push(...units)
    return units
}

function findLocation(warehouseId, value) {
    const warehouse = findWarehouse(warehouseId)
    if (!warehouse) return null
    const key = String(value || '').trim().toLowerCase()
    return warehouse.locations.find((location) =>
        location.id.toLowerCase() === key ||
        location.code.toLowerCase() === key ||
        location.name.toLowerCase() === key ||
        String(location.legacyCode || '').toLowerCase() === key ||
        String(location.legacyName || '').toLowerCase() === key,
    ) || null
}

function isRegisteredBatchLot(value) {
    const lot = typeof value === 'object'
        ? value
        : state.stockLots.find((item) => item.id === value)
    return Boolean(lot?.isBatch && lot?.batchGroupId)
}

function matchesStockSource(lotId, stockSource = '') {
    if (!stockSource || stockSource === 'all') return true
    const registeredBatch = isRegisteredBatchLot(lotId)
    return stockSource === 'batch' ? registeredBatch : !registeredBatch
}

function stockPositionsFor(productId, filters = {}) {
    return state.stockPositions.filter((position) =>
        position.productId === productId &&
        (!filters.positionId || position.id === filters.positionId) &&
        (!filters.warehouseId || position.warehouseId === filters.warehouseId) &&
        (!filters.locationId || position.locationId === filters.locationId) &&
        (!filters.lotId || position.lotId === filters.lotId) &&
        matchesStockSource(position.lotId, filters.stockSource),
    )
}

function productStock(productId, filters = {}) {
    return stockPositionsFor(productId, filters).reduce(
        (sum, position) => sum + number(position.availableQuantity),
        0,
    )
}

function stockLotsFor(productId, filters = {}) {
    return state.stockLots.filter((lot) =>
        lot.productId === productId &&
        (!filters.lotId || lot.id === filters.lotId) &&
        (!filters.batchNumber || lot.batchNumber === filters.batchNumber) &&
        matchesStockSource(lot.id, filters.stockSource),
    )
}

function batchGroups(options = {}) {
    const groups = new Map()
    state.batchDefinitions.forEach((definition) => {
        if (!definition?.id) return
        groups.set(definition.id, {
            id: definition.id,
            code: definition.id,
            name: definition.name || `Batch ${definition.id}`,
            qrCode: `IMS:BATCH:${definition.id}`,
            supplierId: definition.supplierId || '',
            supplierName: definition.supplierName || '',
            receivedDate: '',
            productIds: Array.isArray(definition.productIds) ? definition.productIds : [],
            recipeItems: Array.isArray(definition.items) ? definition.items : [],
            items: [],
        })
    })
    state.stockLots
        .filter((lot) => lot.isBatch && lot.batchGroupId)
        .forEach((lot) => {
            const product = state.products.find((item) => item.id === lot.productId)
            if (!product) return
            const positions = state.stockPositions
                .filter((position) => position.lotId === lot.id && number(position.availableQuantity) > 0)
                .map((position) => ({
                    ...position,
                    quantity: number(position.availableQuantity),
                    warehouseName: findWarehouse(position.warehouseId)?.name || position.warehouseName || 'Warehouse',
                    locationName: findLocation(position.warehouseId, position.locationId)?.name || position.location || 'Not assigned',
                }))
            const availableQuantity = positions.reduce((sum, position) => sum + position.quantity, 0)
            const receipt = state.receipts.find((item) => item.id === lot.receiptId)
            const batch = groups.get(lot.batchGroupId) || {
                id: lot.batchGroupId,
                code: lot.batchGroupId,
                name: `Batch ${lot.batchGroupId}`,
                qrCode: `IMS:BATCH:${lot.batchGroupId}`,
                supplierId: receipt?.supplierId || '',
                supplierName: receipt?.supplierName || '',
                receivedDate: lot.receivedDate || receipt?.receivedDate || '',
                productIds: [],
                items: [],
            }
            const receivedDate = lot.receivedDate || receipt?.receivedDate || ''
            if (receivedDate && (!batch.receivedDate || receivedDate > batch.receivedDate)) batch.receivedDate = receivedDate
            if (!batch.supplierId && receipt?.supplierId) {
                batch.supplierId = receipt.supplierId
                batch.supplierName = receipt.supplierName || ''
            }
            batch.items.push({
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                unit: product.unit,
                trackingMode: product.trackingMode,
                lotId: lot.id,
                batchNumber: lot.batchNumber,
                receivedQuantity: number(lot.receivedQuantity),
                availableQuantity,
                positions,
                units: state.stockUnits
                    .filter((unit) => unit.lotId === lot.id)
                    .slice()
                    .sort((left, right) =>
                        number(left.batchPartOrdinal || left.batchOrdinal || left.ordinal) -
                        number(right.batchPartOrdinal || right.batchOrdinal || right.ordinal),
                    ),
            })
            groups.set(batch.id, batch)
        })
    return [...groups.values()]
        .map((batch) => {
            const combinedItems = [...batch.items.reduce((items, item) => {
                const existing = items.get(item.productId)
                if (!existing) {
                    items.set(item.productId, { ...item, lotIds: [item.lotId], positions: [...item.positions], units: [...item.units] })
                    return items
                }
                existing.receivedQuantity += item.receivedQuantity
                existing.availableQuantity += item.availableQuantity
                existing.lotIds.push(item.lotId)
                existing.positions.push(...item.positions)
                existing.units.push(...item.units)
                return items
            }, new Map()).values()]
            const receivedQuantity = combinedItems.reduce((sum, item) => sum + item.receivedQuantity, 0)
            let nextPartOrdinal = 1
            const stockedProductIds = new Set(combinedItems.map((item) => item.productId))
            const recipeByProduct = new Map(
                (batch.recipeItems || []).map((item) => [item.productId, Math.max(0, number(item.quantity))]),
            )
            const declaredItems = (batch.productIds || [])
                .filter((productId) => !stockedProductIds.has(productId))
                .map((productId) => {
                    const product = findProduct(productId)
                    if (!product) return null
                    return {
                        productId: product.id,
                        productName: product.name,
                        sku: product.sku,
                        unit: product.unit,
                        trackingMode: product.trackingMode,
                        lotId: `batch-master-${batch.id}-${product.id}`,
                        batchNumber: batch.id,
                        receivedQuantity: 0,
                        availableQuantity: 0,
                        positions: [],
                        units: [],
                        registeredOnly: true,
                        recipeQuantity: recipeByProduct.get(product.id) || 1,
                    }
                })
                .filter(Boolean)
            const items = [...combinedItems, ...declaredItems].map((item) => {
                const units = item.units.map((unit) => {
                    const ordinal = number(unit.batchPartOrdinal || unit.batchOrdinal || unit.ordinal) || nextPartOrdinal
                    nextPartOrdinal = Math.max(nextPartOrdinal, ordinal + 1)
                    return {
                        ...unit,
                        displayOrdinal: ordinal,
                        displayTotal: number(unit.batchPartTotal) || receivedQuantity,
                    }
                })
                return { ...item, recipeQuantity: recipeByProduct.get(item.productId) || item.recipeQuantity || 1, units }
            })
            const availableBatchCount = items.length
                ? Math.max(0, Math.floor(Math.min(...items.map((item) =>
                    number(item.availableQuantity) / Math.max(0.0001, number(item.recipeQuantity) || 1),
                )) + 0.0000001))
                : 0
            return {
                ...batch,
                items,
                productCount: new Set(items.map((item) => item.productId)).size,
                receivedQuantity,
                availableQuantity: items.reduce((sum, item) => sum + item.availableQuantity, 0),
                availableBatchCount,
                recipePartCount: items.reduce((sum, item) => sum + number(item.recipeQuantity), 0),
                locations: items.flatMap((item) => item.positions),
            }
        })
        .filter((batch) =>
            (!options.availableOnly || batch.availableQuantity > 0) &&
            (!options.completeOnly || batch.availableBatchCount > 0),
        )
        .sort((a, b) => {
            const left = Number(String(a.id || '').match(/\d+/)?.[0] || 0)
            const right = Number(String(b.id || '').match(/\d+/)?.[0] || 0)
            return right - left || String(b.id).localeCompare(String(a.id))
        })
}

function findBatch(value) {
    const code = normalizeCode(value).replace(/^IMS:BATCH:/, '')
    const batches = batchGroups()
    const direct = batches.find((batch) => normalizeCode(batch.id) === code || normalizeCode(batch.qrCode) === normalizeCode(value))
    if (direct) return direct
    const legacyLot = state.stockLots.find((lot) =>
        isRegisteredBatchLot(lot) && [
            lot.legacyBatchGroupId,
            lot.legacyBatchNumber,
        ].some((legacy) => normalizeCode(legacy) === code),
    )
    return legacyLot ? batches.find((batch) => batch.id === legacyLot.batchGroupId) || null : null
}

function productStockBreakdown(productId, filters = {}) {
    const rows = new Map()
    stockPositionsFor(productId, filters)
        .filter((position) => number(position.availableQuantity) > 0)
        .forEach((position) => {
            const key = `${position.warehouseId}:${position.locationId}`
            const current = rows.get(key) || {
                warehouseId: position.warehouseId,
                warehouseName:
                    findWarehouse(position.warehouseId)?.name ||
                    position.warehouseName ||
                    'Warehouse',
                locationId: position.locationId,
                location:
                    findLocation(position.warehouseId, position.locationId)
                        ?.name ||
                    position.location ||
                    'Not assigned',
                quantity: 0,
            }
            current.quantity += number(position.availableQuantity)
            rows.set(key, current)
        })
    return [...rows.values()]
}

function availableStockUnits(productId, filters = {}) {
    return state.stockUnits.filter((unit) =>
        unit.productId === productId &&
        unit.status === 'available' &&
        (!filters.positionId || unit.positionId === filters.positionId) &&
        (!filters.warehouseId || unit.warehouseId === filters.warehouseId) &&
        (!filters.locationId || unit.locationId === filters.locationId) &&
        (!filters.lotId || unit.lotId === filters.lotId) &&
        matchesStockSource(unit.lotId, filters.stockSource),
    )
}

// A physical count gain creates real tracked items, but it is not a second
// supplier receipt. Keep the original receipt quantity immutable and maintain
// the lifetime unit-ledger total separately.
function trackedLotUnitQuantity(lot) {
    if (!lot) return 0
    const value = lot.trackedUnitQuantity
    return Math.max(
        0,
        Math.round(number(value === undefined || value === null ? lot.receivedQuantity : value)),
    )
}

function trackedUnitBalanceIssues(productId = '') {
    const issues = []
    state.products
        .filter((product) => product.trackingMode === 'unit' && (!productId || product.id === productId))
        .forEach((product) => {
            const positions = state.stockPositions.filter((position) => position.productId === product.id)
            const lotIds = [...new Set([
                ...positions.map((position) => position.lotId),
                ...state.stockUnits
                    .filter((unit) => unit.productId === product.id)
                    .map((unit) => unit.lotId),
            ].filter(Boolean))]
            lotIds.forEach((lotId) => {
                const lot = state.stockLots.find((item) => item.id === lotId)
                const expected = trackedLotUnitQuantity(lot)
                const actual = state.stockUnits.filter(
                    (unit) => unit.productId === product.id && unit.lotId === lotId,
                ).length
                if (expected > 0 && actual !== expected) {
                    issues.push({
                        type: actual < expected ? 'incomplete-unit-ledger' : 'duplicate-unit-ledger',
                        productId: product.id,
                        productName: product.name,
                        lotId,
                        expectedUnitCount: expected,
                        actualUnitCount: actual,
                    })
                }
            })
            positions.forEach((position) => {
                const lotUnits = state.stockUnits.filter(
                    (unit) => unit.productId === product.id && unit.lotId === position.lotId,
                )
                const availableUnits = state.stockUnits.filter(
                    (unit) =>
                        unit.productId === product.id &&
                        unit.status === 'available' &&
                        unit.positionId === position.id,
                )
                const positionQuantity = number(position.availableQuantity)
                if (!lotUnits.length && positionQuantity > 0) {
                    issues.push({
                        type: 'missing-unit-records',
                        productId: product.id,
                        productName: product.name,
                        lotId: position.lotId,
                        positionId: position.id,
                        warehouseId: position.warehouseId,
                        locationId: position.locationId,
                        positionQuantity,
                        availableUnitCount: 0,
                    })
                    return
                }
                if (Math.abs(positionQuantity - availableUnits.length) > 0.0001) {
                    issues.push({
                        type: 'position-unit-mismatch',
                        productId: product.id,
                        productName: product.name,
                        lotId: position.lotId,
                        positionId: position.id,
                        warehouseId: position.warehouseId,
                        locationId: position.locationId,
                        positionQuantity,
                        availableUnitCount: availableUnits.length,
                    })
                }
            })
            state.stockUnits
                .filter((unit) => unit.productId === product.id && unit.status === 'available')
                .forEach((unit) => {
                    const position = state.stockPositions.find((item) => item.id === unit.positionId)
                    if (
                        !position ||
                        position.productId !== unit.productId ||
                        position.lotId !== unit.lotId ||
                        position.warehouseId !== unit.warehouseId ||
                        position.locationId !== unit.locationId
                    ) {
                        issues.push({
                            type: 'orphan-available-unit',
                            productId: product.id,
                            productName: product.name,
                            unitId: unit.id,
                            unitCode: unit.code,
                            lotId: unit.lotId,
                            positionId: unit.positionId,
                            warehouseId: unit.warehouseId,
                            locationId: unit.locationId,
                        })
                    }
                })
        })
    return issues
}

function reconcileTrackedUnitBalances(productId = '', options = {}) {
    const repaired = []
    let changed = false
    const products = state.products.filter(
        (product) => product.trackingMode === 'unit' && (!productId || product.id === productId),
    )
    products.forEach((product) => {
        // Older count/edit flows could create the correct physical unit rows and
        // position balance without updating the lot's lifetime ledger total.
        // Only adopt the physical ledger when every unit is structurally linked
        // and its available total agrees with the stock positions. This repairs
        // legacy data without masking genuinely missing or orphaned units.
        state.stockLots
            .filter((lot) => lot.productId === product.id)
            .forEach((lot) => {
                const lotUnits = state.stockUnits.filter((unit) => unit.productId === product.id && unit.lotId === lot.id)
                const lotPositions = state.stockPositions.filter((position) => position.productId === product.id && position.lotId === lot.id)
                const availableUnits = lotUnits.filter((unit) => unit.status === 'available')
                const positionQuantity = lotPositions.reduce((sum, position) => sum + number(position.availableQuantity), 0)
                const structurallyValid = lotUnits.every((unit) => {
                    const position = lotPositions.find((item) => item.id === unit.positionId)
                    return unit.status !== 'available' || Boolean(position && position.warehouseId === unit.warehouseId && position.locationId === unit.locationId)
                })
                if (!lotUnits.length || !structurallyValid || Math.abs(positionQuantity - availableUnits.length) > 0.0001) return
                if (trackedLotUnitQuantity(lot) === lotUnits.length) return
                const before = trackedLotUnitQuantity(lot)
                lot.trackedUnitQuantity = lotUnits.length
                lot.updatedAt = nowIso()
                lotUnits.forEach((unit) => { unit.receiptQuantity = lotUnits.length })
                changed = true
                repaired.push({ type: 'reconciled-lot-ledger', productId: product.id, lotId: lot.id, beforeQuantity: before, afterQuantity: lotUnits.length })
            })

        const registeredLots = state.stockLots.filter(
            (lot) => lot.productId === product.id && isRegisteredBatchLot(lot),
        )
        const registeredGroups = new Map()
        registeredLots.forEach((lot) => {
            const rows = registeredGroups.get(lot.batchGroupId) || []
            rows.push(lot)
            registeredGroups.set(lot.batchGroupId, rows)
        })
        registeredGroups.forEach((lots, batchGroupId) => {
            const orderedLots = lots.slice().sort((left, right) =>
                String(left.receivedDate || left.createdAt || '').localeCompare(
                    String(right.receivedDate || right.createdAt || ''),
                ) || String(left.id).localeCompare(String(right.id)),
            )
            const lotIds = new Set(orderedLots.map((lot) => lot.id))
            const units = state.stockUnits
                .filter((unit) => unit.productId === product.id && lotIds.has(unit.lotId))
                .sort((left, right) =>
                    number(left.batchPartOrdinal || left.batchOrdinal || left.ordinal) -
                        number(right.batchPartOrdinal || right.batchOrdinal || right.ordinal) ||
                    String(left.createdAt || '').localeCompare(String(right.createdAt || '')) ||
                    String(left.id).localeCompare(String(right.id)),
                )
            const expectedTotal = orderedLots.reduce(
                (sum, lot) => sum + trackedLotUnitQuantity(lot),
                0,
            )
            if (!expectedTotal || units.length !== expectedTotal) return
            const needsRedistribution = orderedLots.some((lot) =>
                units.filter((unit) => unit.lotId === lot.id).length !==
                trackedLotUnitQuantity(lot),
            )
            if (!needsRedistribution) return

            let cursor = 0
            orderedLots.forEach((lot) => {
                const expected = trackedLotUnitQuantity(lot)
                const assigned = units.slice(cursor, cursor + expected)
                cursor += expected
                const position = state.stockPositions.find(
                    (item) => item.productId === product.id && item.lotId === lot.id,
                )
                if (!position) return
                const receipt = state.receipts.find((item) => item.id === lot.receiptId)
                const receiptLine = receipt?.lines?.find(
                    (line) => line.productId === product.id && (!line.lotId || line.lotId === lot.id),
                )
                assigned.forEach((unit, index) => {
                    const ordinal = units.indexOf(unit) + 1
                    unit.lotId = lot.id
                    unit.positionId = position.id
                    unit.receiptId = lot.receiptId || unit.receiptId
                    unit.receiptLineId = receiptLine?.id || unit.receiptLineId
                    unit.warehouseId = position.warehouseId
                    unit.warehouseName = position.warehouseName
                    unit.locationId = position.locationId
                    unit.location = position.location
                    unit.batchId = batchGroupId
                    unit.batchGroupId = batchGroupId
                    unit.ordinal = ordinal
                    unit.batchOrdinal = ordinal
                    unit.batchPartOrdinal = ordinal
                    unit.batchPartTotal = expectedTotal
                    unit.receiptQuantity = expected
                    unit.code = unitCode(product, batchGroupId, ordinal)
                    if (index === 0) unit.updatedAt = nowIso()
                })
                const before = number(position.availableQuantity)
                position.availableQuantity = assigned.filter((unit) => unit.status === 'available').length
                position.updatedAt = nowIso()
                repaired.push({
                    type: 'redistributed-batch-units',
                    productId: product.id,
                    batchGroupId,
                    lotId: lot.id,
                    positionId: position.id,
                    beforeQuantity: before,
                    afterQuantity: position.availableQuantity,
                })
            })
            changed = true
        })

        state.stockUnits
            .filter((unit) => unit.productId === product.id && unit.status === 'available')
            .forEach((unit) => {
                let position = state.stockPositions.find(
                    (item) =>
                        item.id === unit.positionId &&
                        item.productId === unit.productId &&
                        item.lotId === unit.lotId,
                )
                if (!position) {
                    position = state.stockPositions.find(
                        (item) =>
                            item.productId === unit.productId &&
                            item.lotId === unit.lotId &&
                            item.warehouseId === unit.warehouseId &&
                            item.locationId === unit.locationId,
                    )
                }
                if (!position) {
                    const warehouse = findWarehouse(unit.warehouseId)
                    const location = findLocation(unit.warehouseId, unit.locationId || unit.location)
                    const lot = state.stockLots.find((item) => item.id === unit.lotId)
                    if (!warehouse || !location || !lot) return
                    const baseId = `pos-${unit.lotId}-${warehouse.id}-${location.id}`
                    let positionId = baseId
                    let suffix = 2
                    while (state.stockPositions.some((item) => item.id === positionId)) {
                        positionId = `${baseId}-${suffix}`
                        suffix += 1
                    }
                    position = {
                        id: positionId,
                        productId: product.id,
                        lotId: unit.lotId,
                        warehouseId: warehouse.id,
                        warehouseName: warehouse.name,
                        locationId: location.id,
                        location: location.name,
                        unit: product.unit,
                        availableQuantity: 0,
                        createdAt: unit.createdAt || nowIso(),
                        updatedAt: nowIso(),
                    }
                    state.stockPositions.push(position)
                    changed = true
                    repaired.push({ type: 'created-position', productId: product.id, unitId: unit.id, positionId })
                }
                if (
                    unit.positionId !== position.id ||
                    unit.locationId !== position.locationId ||
                    unit.warehouseId !== position.warehouseId ||
                    unit.location !== position.location ||
                    unit.warehouseName !== position.warehouseName
                ) {
                    unit.positionId = position.id
                    unit.warehouseId = position.warehouseId
                    unit.warehouseName = position.warehouseName
                    unit.locationId = position.locationId
                    unit.location = position.location
                    changed = true
                    repaired.push({ type: 'relinked-unit', productId: product.id, unitId: unit.id, positionId: position.id })
                }
            })

        state.stockPositions
            .filter((position) => position.productId === product.id)
            .forEach((position) => {
                const lotUnits = state.stockUnits.filter(
                    (unit) => unit.productId === product.id && unit.lotId === position.lotId,
                )
                const lot = state.stockLots.find((item) => item.id === position.lotId)
                const expectedUnitCount = trackedLotUnitQuantity(lot)
                if (!lotUnits.length || (expectedUnitCount > 0 && lotUnits.length !== expectedUnitCount)) return
                const availableCount = state.stockUnits.filter(
                    (unit) =>
                        unit.productId === product.id &&
                        unit.status === 'available' &&
                        unit.positionId === position.id,
                ).length
                const before = number(position.availableQuantity)
                if (Math.abs(before - availableCount) <= 0.0001) return
                position.availableQuantity = availableCount
                position.updatedAt = nowIso()
                changed = true
                repaired.push({
                    type: 'reconciled-position',
                    productId: product.id,
                    positionId: position.id,
                    beforeQuantity: before,
                    afterQuantity: availableCount,
                })
            })
    })
    if (changed) {
        syncDerivedInventory(productId)
        if (options.persist !== false) persistInventory()
    }
    return {
        changed,
        repaired,
        issues: trackedUnitBalanceIssues(productId),
    }
}

function assertTrackedUnitBalances(productId = '') {
    const issues = trackedUnitBalanceIssues(productId)
    if (!issues.length) return true
    const issue = issues[0]
    const location = findLocation(issue.warehouseId, issue.locationId)
    if (issue.type === 'incomplete-unit-ledger' || issue.type === 'duplicate-unit-ledger') {
        throw new Error(
            `Tracked unit ledger is incomplete for this receipt layer. Expected ${issue.expectedUnitCount} units; found ${issue.actualUnitCount}.`,
        )
    }
    if (issue.type === 'missing-unit-records') {
        throw new Error(
            `Tracked unit records are missing at ${location?.name || 'this location'}. Position stock: ${issue.positionQuantity}; available units: 0.`,
        )
    }
    if (issue.type === 'orphan-available-unit') {
        throw new Error(`Tracked unit ${issue.unitCode || issue.unitId} is not linked to a valid stock position.`)
    }
    throw new Error(
        `Tracked unit balance is inconsistent at ${location?.name || 'this location'}. Position stock: ${issue.positionQuantity}; available units: ${issue.availableUnitCount}.`,
    )
}

function syncDerivedInventory(productId = '') {
    state.stockLots.forEach((lot) => {
        lot.availableQuantity = state.stockPositions
            .filter((position) => position.lotId === lot.id)
            .reduce(
                (sum, position) =>
                    sum + number(position.availableQuantity),
                0,
            )
    })

    state.products
        .filter((product) => !productId || product.id === productId)
        .forEach((product) => {
            const positions = stockPositionsFor(product.id)
            const breakdown = productStockBreakdown(product.id)
            product.currentStock = positions.reduce(
                (sum, position) =>
                    sum + number(position.availableQuantity),
                0,
            )
            product.warehouseId =
                breakdown.length === 1 ? breakdown[0].warehouseId : ''
            product.warehouseName =
                breakdown.length === 1 ? breakdown[0].warehouseName : ''
            product.location =
                breakdown.length === 1 ? breakdown[0].location : ''
            product.batches = stockLotsFor(product.id).map((lot) => {
                const lotPositions = positions.filter(
                    (position) => position.lotId === lot.id,
                )
                return {
                    id: lot.batchNumber,
                    lotId: lot.id,
                    quantity: number(lot.availableQuantity),
                    receivedQuantity: number(lot.receivedQuantity),
                    receivedDate: lot.receivedDate,
                    manufacturingDate: lot.manufacturingDate || '',
                    expiryDate: lot.expiryDate || '',
                    warehouseId:
                        lotPositions.length === 1
                            ? lotPositions[0].warehouseId
                            : '',
                    warehouseName:
                        lotPositions.length === 1
                            ? lotPositions[0].warehouseName
                            : '',
                    location:
                        lotPositions.length === 1
                            ? lotPositions[0].location
                            : '',
                    positions: lotPositions.map((position) => ({
                        id: position.id,
                        warehouseId: position.warehouseId,
                        warehouseName: position.warehouseName,
                        locationId: position.locationId,
                        location: position.location,
                        quantity: number(position.availableQuantity),
                    })),
                    batchQr: lot.isBatch && lot.batchGroupId
                        ? `IMS:BATCH:${lot.batchGroupId}`
                        : `IMS:LOT:${product.sku}:${lot.batchNumber}`,
                }
            })
        })
}

function migrateCanonicalInventory() {
    if (!state.stockPositions.length) {
        state.products.forEach((product) => {
            const target = Math.max(0, number(product.currentStock))
            let allocated = 0
            ;(product.batches || []).forEach((batch) => {
                const quantity = Math.min(
                    Math.max(0, number(batch.quantity)),
                    Math.max(0, target - allocated),
                )
                if (!quantity) return
                const warehouse =
                    findWarehouse(batch.warehouseId) ||
                    findWarehouse(product.warehouseId) ||
                    findWarehouse('wh-main')
                const location =
                    findLocation(
                        warehouse?.id,
                        batch.location || product.location,
                    ) ||
                    warehouse?.locations.find(
                        (item) => item.active && item.status !== 'unavailable',
                    )
                if (!warehouse || !location) return
                const batchNumber = normalizeCode(
                    batch.id || `OPEN-${product.sku}`,
                )
                const lot = {
                    id: `lot-${product.id}-${batchNumber}`,
                    productId: product.id,
                    batchNumber,
                    receiptId: '',
                    receivedQuantity: quantity,
                    availableQuantity: quantity,
                    receivedDate:
                        batch.receivedDate ||
                        product.createdAt?.slice(0, 10) ||
                        nowIso().slice(0, 10),
                    manufacturingDate: batch.manufacturingDate || '',
                    expiryDate: batch.expiryDate || '',
                    createdAt: product.createdAt || nowIso(),
                }
                state.stockLots.push(lot)
                state.stockPositions.push({
                    id: `pos-${lot.id}-${location.id}`,
                    productId: product.id,
                    lotId: lot.id,
                    warehouseId: warehouse.id,
                    warehouseName: warehouse.name,
                    locationId: location.id,
                    location: location.name,
                    unit: product.unit,
                    availableQuantity: quantity,
                    createdAt: lot.createdAt,
                    updatedAt: lot.createdAt,
                })
                allocated += quantity
            })

            const remainder = Math.max(0, target - allocated)
            if (!remainder) return
            const warehouse =
                findWarehouse(product.warehouseId) || findWarehouse('wh-main')
            const location =
                findLocation(warehouse?.id, product.location) ||
                warehouse?.locations.find(
                    (item) => item.active && item.status !== 'unavailable',
                )
            if (!warehouse || !location) return
            const batchNumber = `OPEN-${normalizeCode(product.sku)}`
            const lot = {
                id: `lot-${product.id}-opening`,
                productId: product.id,
                batchNumber,
                receiptId: '',
                receivedQuantity: remainder,
                availableQuantity: remainder,
                receivedDate:
                    product.createdAt?.slice(0, 10) ||
                    nowIso().slice(0, 10),
                manufacturingDate: '',
                expiryDate: '',
                createdAt: product.createdAt || nowIso(),
            }
            state.stockLots.push(lot)
            state.stockPositions.push({
                id: `pos-${lot.id}-${location.id}`,
                productId: product.id,
                lotId: lot.id,
                warehouseId: warehouse.id,
                warehouseName: warehouse.name,
                locationId: location.id,
                location: location.name,
                unit: product.unit,
                availableQuantity: remainder,
                createdAt: lot.createdAt,
                updatedAt: lot.createdAt,
            })
        })
    }

    state.stockPositions = state.stockPositions.map((position) => {
        const warehouse =
            findWarehouse(position.warehouseId) || findWarehouse('wh-main')
        const location =
            findLocation(
                warehouse?.id,
                position.locationId || position.location,
            ) ||
            warehouse?.locations.find(
                (item) => item.active && item.status !== 'unavailable',
            )
        return {
            ...position,
            warehouseId: warehouse?.id || position.warehouseId,
            warehouseName: warehouse?.name || position.warehouseName || '',
            locationId: location?.id || position.locationId || '',
            location: location?.name || position.location || '',
            availableQuantity: Math.max(
                0,
                number(position.availableQuantity ?? position.quantity),
            ),
            updatedAt: position.updatedAt || position.createdAt || nowIso(),
        }
    })

    state.stockUnits = state.stockUnits.map((unit) => {
        const lot =
            state.stockLots.find(
                (item) =>
                    item.productId === unit.productId &&
                    (item.id === unit.lotId ||
                        item.batchNumber === unit.batchId),
            ) || null
        const position =
            state.stockPositions.find(
                (item) =>
                    item.productId === unit.productId &&
                    item.lotId === lot?.id &&
                    item.warehouseId === unit.warehouseId &&
                    (item.locationId === unit.locationId ||
                        item.location === unit.location),
            ) || null
        return normalizeStockUnit({
            ...unit,
            lotId: lot?.id || unit.lotId,
            positionId: position?.id || unit.positionId,
            locationId: position?.locationId || unit.locationId,
        })
    })
    syncDerivedInventory()
}

function locationMetrics(warehouseId, locationId) {
    const warehouse = findWarehouse(warehouseId)
    const location = findLocation(warehouseId, locationId)
    if (!warehouse || !location) return null
    const positions = state.stockPositions.filter(
        (position) =>
            position.warehouseId === warehouse.id &&
            position.locationId === location.id &&
            number(position.availableQuantity) > 0,
    )
    const productIds = [...new Set(positions.map((item) => item.productId))]
    const stockQuantity = positions.reduce(
        (sum, item) => sum + number(item.availableQuantity),
        0,
    )
    const capacityConfigured =
        Number.isFinite(Number(location.capacityValue)) &&
        Number(location.capacityValue) > 0 &&
        Boolean(location.capacityUnit)
    const compatiblePositions = capacityConfigured
        ? positions.filter(
              (position) =>
                  position.unit === location.capacityUnit ||
                  location.capacityUnit === 'units',
          )
        : []
    const capacityCompatible =
        capacityConfigured && compatiblePositions.length === positions.length
    const usedCapacity = capacityCompatible
        ? compatiblePositions.reduce(
              (sum, position) => sum + number(position.availableQuantity),
              0,
          )
        : null
    const availableCapacity =
        usedCapacity === null
            ? null
            : Math.max(0, number(location.capacityValue) - usedCapacity)
    const usagePercent =
        usedCapacity === null
            ? null
            : Math.min(
                  100,
                  Math.round(
                      (usedCapacity / number(location.capacityValue)) * 100,
                  ),
              )
    let status = 'empty'
    if (!location.active || location.status === 'unavailable')
        status = 'unavailable'
    else if (stockQuantity > 0)
        status =
            usagePercent !== null && usagePercent >= 100
                ? 'occupied'
                : 'partially-occupied'
    return {
        warehouse,
        location,
        positions,
        productIds,
        productCount: productIds.length,
        stockQuantity,
        capacityConfigured,
        capacityCompatible,
        usedCapacity,
        availableCapacity,
        usagePercent,
        status,
        lots: state.stockLots.filter((lot) =>
            positions.some((position) => position.lotId === lot.id),
        ),
        units: state.stockUnits.filter(
            (unit) =>
                unit.warehouseId === warehouse.id &&
                unit.locationId === location.id,
        ),
    }
}

function warehouseSummary(warehouseId) {
    const warehouse = findWarehouse(warehouseId)
    if (!warehouse) return null
    const locations = warehouse.locations
        .filter((location) => location.active || location.status === 'unavailable')
        .map((location) => locationMetrics(warehouse.id, location.id))
        .filter(Boolean)
    return {
        warehouse,
        locations,
        locationCount: locations.length,
        occupied: locations.filter((item) => item.status === 'occupied').length,
        partial: locations.filter(
            (item) => item.status === 'partially-occupied',
        ).length,
        empty: locations.filter((item) => item.status === 'empty').length,
        unavailable: locations.filter(
            (item) => item.status === 'unavailable',
        ).length,
        totalStock: warehouseStock(warehouse.id),
        productCount: warehouseProducts(warehouse.id).length,
    }
}

function warehouseInventory(warehouseId, locationId = '') {
    const warehouse = findWarehouse(warehouseId)
    if (!warehouse) return null

    const selectedLocationId = String(locationId || '').trim()
    const activePositions = state.stockPositions.filter(
        (position) =>
            position.warehouseId === warehouse.id &&
            (!selectedLocationId || position.locationId === selectedLocationId) &&
            number(position.availableQuantity) > 0,
    )

    const standalone = new Map()
    activePositions.forEach((position) => {
        const lot = state.stockLots.find((item) => item.id === position.lotId)
        if (isRegisteredBatchLot(lot)) return
        const product = findProduct(position.productId)
        if (!product) return
        const current = standalone.get(product.id) || {
            id: product.id,
            productId: product.id,
            name: product.name,
            sku: product.sku,
            unit: product.unit,
            category: product.category || 'General',
            minimumStock: number(product.minimumStock),
            quantity: 0,
            locationIds: new Set(),
            locationNames: new Set(),
            lotIds: new Set(),
            positionCount: 0,
        }
        current.quantity += number(position.availableQuantity)
        current.positionCount += 1
        current.locationIds.add(position.locationId)
        current.locationNames.add(
            findLocation(warehouse.id, position.locationId)?.name ||
                position.location ||
                'Not assigned',
        )
        if (position.lotId) current.lotIds.add(position.lotId)
        standalone.set(product.id, current)
    })

    const products = [...standalone.values()]
        .map((row) => ({
            ...row,
            locationIds: [...row.locationIds],
            locationNames: [...row.locationNames],
            lotIds: [...row.lotIds],
            locationCount: row.locationIds.size,
            status:
                row.quantity <= 0
                    ? 'Out of Stock'
                    : row.minimumStock > 0 && row.quantity <= row.minimumStock
                      ? 'Low Stock'
                      : 'In Stock',
        }))
        .sort((left, right) =>
            left.name.localeCompare(right.name) || left.sku.localeCompare(right.sku),
        )

    const batches = batchGroups({ availableOnly: true })
        .map((batch) => {
            const items = batch.items.map((item) => {
                const positions = (item.positions || []).filter(
                    (position) =>
                        position.warehouseId === warehouse.id &&
                        (!selectedLocationId || position.locationId === selectedLocationId) &&
                        number(position.quantity ?? position.availableQuantity) > 0,
                )
                const availableQuantity = positions.reduce(
                    (sum, position) =>
                        sum + number(position.quantity ?? position.availableQuantity),
                    0,
                )
                return { ...item, positions, availableQuantity }
            })
            const availableQuantity = items.reduce(
                (sum, item) => sum + number(item.availableQuantity),
                0,
            )
            if (!(availableQuantity > 0)) return null

            const locationIds = new Set()
            const locationNames = new Set()
            items.forEach((item) =>
                item.positions.forEach((position) => {
                    locationIds.add(position.locationId)
                    locationNames.add(
                        findLocation(warehouse.id, position.locationId)?.name ||
                            position.locationName ||
                            position.location ||
                            'Not assigned',
                    )
                }),
            )

            const recipeItems = items.filter(
                (item) => number(item.recipeQuantity) > 0,
            )
            const availableBatchCount = recipeItems.length
                ? Math.max(
                      0,
                      Math.floor(
                          Math.min(
                              ...recipeItems.map(
                                  (item) =>
                                      number(item.availableQuantity) /
                                      Math.max(
                                          0.0001,
                                          number(item.recipeQuantity) || 1,
                                      ),
                              ),
                          ) + 0.0000001,
                      ),
                  )
                : 0

            return {
                ...batch,
                items,
                warehouseId: warehouse.id,
                warehouseName: warehouse.name,
                warehouseAvailableQuantity: availableQuantity,
                warehouseAvailableBatchCount: availableBatchCount,
                warehouseLocationIds: [...locationIds],
                warehouseLocationNames: [...locationNames],
                warehouseLocationCount: locationIds.size,
                warehouseProductCount: items.filter(
                    (item) => number(item.availableQuantity) > 0,
                ).length,
                warehouseStatus:
                    availableBatchCount > 0 ? 'Complete' : 'Incomplete',
            }
        })
        .filter(Boolean)
        .sort((left, right) => {
            const leftNumber = Number(String(left.id || '').match(/\d+/)?.[0] || 0)
            const rightNumber = Number(String(right.id || '').match(/\d+/)?.[0] || 0)
            return rightNumber - leftNumber || String(right.id).localeCompare(String(left.id))
        })

    return {
        warehouse,
        locationId: selectedLocationId,
        location: selectedLocationId ? findLocation(warehouse.id, selectedLocationId) : null,
        products,
        batches,
        productCount: products.length,
        batchCount: batches.length,
        standaloneQuantity: products.reduce(
            (sum, row) => sum + number(row.quantity),
            0,
        ),
        batchPartQuantity: batches.reduce(
            (sum, row) => sum + number(row.warehouseAvailableQuantity),
            0,
        ),
    }
}

function migrateTransferMovementDetails() {
    state.movements.forEach((movement) => {
        if (!isTransferMovement(movement)) return
        const transfer = findTransfer(movement)
        const quantity = transferMovementQuantity(movement, transfer)
        const product = findProduct(movement.productId)

        movement.type = 'Transfer'
        movement.changedQuantity = 0
        if (quantity > 0) {
            movement.quantity = quantity
            movement.movedQuantity = quantity
            if (transfer) transfer.quantity = quantity
        }
        if (!movement.unit) movement.unit = transfer?.unit || product?.unit || ''
        if (!movement.sourceWarehouseId && transfer?.sourceWarehouseId)
            movement.sourceWarehouseId = transfer.sourceWarehouseId
        if (!movement.sourceLocationId && transfer?.sourceLocationId)
            movement.sourceLocationId = transfer.sourceLocationId
        if (!movement.destinationWarehouseId && transfer?.destinationWarehouseId)
            movement.destinationWarehouseId = transfer.destinationWarehouseId
        if (!movement.destinationLocationId && transfer?.destinationLocationId)
            movement.destinationLocationId = transfer.destinationLocationId
        movement.sourceWarehouseName =
            movement.sourceWarehouseName ||
            transfer?.sourceWarehouseName ||
            findWarehouse(movement.sourceWarehouseId)?.name ||
            ''
        movement.sourceLocationName =
            movement.sourceLocationName ||
            transfer?.sourceLocationName ||
            findLocation(
                movement.sourceWarehouseId,
                movement.sourceLocationId,
            )?.name ||
            ''
        movement.destinationWarehouseName =
            movement.destinationWarehouseName ||
            transfer?.destinationWarehouseName ||
            findWarehouse(movement.destinationWarehouseId)?.name ||
            ''
        movement.destinationLocationName =
            movement.destinationLocationName ||
            transfer?.destinationLocationName ||
            findLocation(
                movement.destinationWarehouseId,
                movement.destinationLocationId,
            )?.name ||
            ''

        ;[
            'sourceBeforeQuantity',
            'sourceAfterQuantity',
            'destinationBeforeQuantity',
            'destinationAfterQuantity',
        ].forEach((key) => {
            if (
                !Object.prototype.hasOwnProperty.call(movement, key) &&
                Object.prototype.hasOwnProperty.call(transfer || {}, key)
            )
                movement[key] = number(transfer[key])
        })
    })
}


function movementSequence(movement) {
    const match = String(movement?.id || '').match(/(\d+)$/)
    return match ? Number(match[1]) : 0
}

function migrateMovementTotalBalances() {
    const movementsByProduct = new Map()
    state.movements.forEach((movement, index) => {
        if (!movement?.productId) return
        const entries = movementsByProduct.get(movement.productId) || []
        entries.push({ movement, index })
        movementsByProduct.set(movement.productId, entries)
    })

    movementsByProduct.forEach((entries, productId) => {
        let runningTotal = productStock(productId)
        entries
            .sort((left, right) => {
                const timeDifference =
                    movementTimeValue(right.movement) -
                    movementTimeValue(left.movement)
                if (timeDifference) return timeDifference
                const sequenceDifference =
                    movementSequence(right.movement) -
                    movementSequence(left.movement)
                if (sequenceDifference) return sequenceDifference
                return left.index - right.index
            })
            .forEach(({ movement }) => {
                const hasBefore = Object.prototype.hasOwnProperty.call(
                    movement,
                    'totalBeforeQuantity',
                )
                const hasAfter = Object.prototype.hasOwnProperty.call(
                    movement,
                    'totalAfterQuantity',
                )
                const change = number(movement.changedQuantity)
                const totalAfter = hasAfter
                    ? number(movement.totalAfterQuantity)
                    : runningTotal
                const totalBefore = hasBefore
                    ? number(movement.totalBeforeQuantity)
                    : totalAfter - change

                movement.totalBeforeQuantity = totalBefore
                movement.totalAfterQuantity = totalAfter
                runningTotal = totalBefore
            })
    })
}

function migrateInboundMovementReceiptLinks() {
    state.movements.forEach((movement) => {
        if (number(movement.changedQuantity) <= 0) return
        const isSupplierInbound =
            movement.stockInType === 'supplier' ||
            movement.reason === 'Supplier Delivery'

        // A plain Stock Receipt is an internal stock-in, not an invoice.
        // Earlier broad matching could attach it to a supplier receipt that
        // happened to share its product/location/date. Remove that false link.
        if (!isSupplierInbound) {
            if (movement.reason === 'Stock Receipt') {
                const linkedReceipt = state.receipts.find(
                    (receipt) => receipt.id === movement.receiptId,
                )
                if (receiptHasInvoice(linkedReceipt)) {
                    movement.receiptId = ''
                    movement.supplierId = ''
                    movement.supplierName = ''
                }
            }
            return
        }
        if (movement.receiptId) return

        const receipt = findReceiptForMovement(movement, { invoiceOnly: true })
        if (!receipt) return

        movement.receiptId = receipt.id
        if (!movement.supplierId && receipt.supplierId)
            movement.supplierId = receipt.supplierId
        if (!movement.supplierName && receipt.supplierName)
            movement.supplierName = receipt.supplierName
        if (!movement.reference && receipt.invoiceNumber)
            movement.reference = receipt.invoiceNumber
    })
}

function initialize() {
    if (state.initialized) return
    const legacyStaff = readLegacyStaff()
    clearLegacyData()
    const storedSnapshot = read(STORAGE.snapshot, null)
    const snapshot = decodeInventorySnapshot(storedSnapshot)
    inventoryCodeVersion = number(snapshot?.inventoryCodeVersion)
    state.products = (
        snapshot?.products || read(STORAGE.products, DEFAULT_PRODUCTS)
    ).map((product) => {
        const { barcode: legacyBarcode, ...productData } = product
        const defaultProduct = DEFAULT_PRODUCTS.find((item) => item.id === productData.id)
        const translations = productData.nameTranslations || productData.nameI18n || defaultProduct?.nameTranslations
        const englishName = String(translations?.en || productData.name || '').trim()
        return {
            ...productData,
            nameMode: productData.nameMode || defaultProduct?.nameMode || 'single',
            nameTranslations: {
                en: englishName,
                cn: String(translations?.cn || englishName).trim() || englishName,
                bm: String(translations?.bm || englishName).trim() || englishName,
            },
            active: productData.active !== false,
            bar: normalizeCode(product.bar || legacyBarcode),
            trackingMode: normalizeTrackingMode(productData),
        }
    })
    state.productCategories = normalizeProductCategories([
        ...DEFAULT_PRODUCT_CATEGORIES,
        ...(Array.isArray(snapshot?.productCategories) ? snapshot.productCategories : []),
        ...state.products.map((product) => product.category),
    ])
    state.movements =
        snapshot?.movements || read(STORAGE.movements, DEFAULT_MOVEMENTS)
    state.stockUnits = (
        snapshot?.stockUnits || read(STORAGE.stockUnits, [])
    ).map(normalizeStockUnit)
    state.shipments =
        snapshot?.shipments || read(STORAGE.shipments, [])
    state.receipts =
        snapshot?.receipts || read(STORAGE.receipts, [])
    state.stockLots =
        snapshot?.stockLots || read(STORAGE.stockLots, [])
    state.stockPositions =
        snapshot?.stockPositions || read(STORAGE.stockPositions, [])
    state.transfers =
        snapshot?.transfers || read(STORAGE.transfers, [])
    state.stockInRequests =
        snapshot?.stockInRequests || read(STORAGE.stockInRequests, [])
    state.labelPrints =
        snapshot?.labelPrints || read(STORAGE.labelPrints, [])
    state.batchDefinitions =
        snapshot?.batchDefinitions || read(STORAGE.batchDefinitions, [])
    state.stockCounts = Array.isArray(snapshot?.stockCounts)
        ? snapshot.stockCounts
        : []
    state.suppliers = read(STORAGE.suppliers, DEFAULT_SUPPLIERS).map((supplier) => ({
        ...supplier,
        address: String(supplier.address || '').trim(),
    }))
    state.warehouses = read(STORAGE.warehouses, DEFAULT_WAREHOUSES).map(normalizeWarehouse)
    migrateWarehouseAllocations()
    migrateSimpleLocationNames()
    migrateCategorySkus(state.products, state.movements)
    migrateSupplierLinks(state.products, state.movements, state.suppliers)
    migrateCanonicalInventory()
    reconcileTrackedUnitBalances('', { persist: false })
    migrateTransferMovementDetails()
    if (inventoryCodeVersion < 1) {
        migrateSimpleInventoryCodes()
        inventoryCodeVersion = 1
    }
    if (inventoryCodeVersion < 2) {
        migrateProductLabelCodes()
        inventoryCodeVersion = 2
    }
    migrateInboundMovementReceiptLinks()
    syncDerivedInventory()
    migrateMovementTotalBalances()
    const storedStaff = read(STORAGE.staff, [])
    const staffSource = storedStaff.length
        ? storedStaff
        : legacyStaff.length
          ? legacyStaff
          : DEFAULT_STAFF
    state.staff = staffSource.map((account) => {
        const { staffQr: legacyStaffQr, ...accountData } = account
        return normalizeStaff(accountData)
    })
    if (!state.staff.some((account) => account.role === 'Developer')) {
        const developerSeed = { ...DEFAULT_DEVELOPER_ACCOUNT }
        if (state.staff.some((account) => account.employeeId === developerSeed.employeeId)) {
            developerSeed.employeeId = 'DEV002'
            developerSeed.barcode = 'STAFF-DEV002'
            developerSeed.qrCode = 'IMS:STAFF:DEV002'
        }
        state.staff.unshift(normalizeStaff(developerSeed))
    }
    state.activeAccount = read(STORAGE.session, null)
    if (state.activeAccount) {
        const account = state.staff.find(
            (staff) =>
                staff.employeeId === state.activeAccount.employeeId,
        )
        if (!account || account.status !== 'active') {
            state.activeAccount = null
            localStorage.removeItem(STORAGE.session)
        } else {
            state.activeAccount = {
                ...state.activeAccount,
                name: account.name,
                role: account.role,
                permissions: account.permissions,
            }
            write(STORAGE.session, state.activeAccount)
        }
    }
    state.sessionLocked = localStorage.getItem(STORAGE.locked) === '1'
    persistInventory()
    write(STORAGE.staff, state.staff)
    write(STORAGE.suppliers, state.suppliers)
    persistWarehouses()
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
                    normalizeCode(account.qrCode) === code ||
                    normalizeCode(account.barcode) === code),
        ) || null
    )
}

function startSession(account) {
    account.lastLoginAt = nowIso()
    write(STORAGE.staff, state.staff)
    const session = {
        name: account.name,
        employeeId: account.employeeId,
        role: account.role,
        permissions: normalizePermissions(account.role, account.permissions),
        signedInAt: nowIso(),
    }
    state.activeAccount = session
    state.sessionLocked = false
    write(STORAGE.session, session)
    localStorage.removeItem(STORAGE.locked)
    return session
}

function currentStaff() {
    if (!state.activeAccount) return null
    return (
        state.staff.find(
            (account) =>
                account.employeeId === state.activeAccount.employeeId,
        ) || state.activeAccount
    )
}

function can(permission) {
    return hasPermission(currentStaff(), permission)
}


function updateMyAccount(input = {}) {
    const account = currentStaff()
    if (!account?.employeeId) throw new Error('No active account was found.')
    const current = state.staff.find((staff) => staff.employeeId === account.employeeId)
    if (!current) throw new Error('Staff account not found.')

    const name = String(input.name || '').trim()
    if (!name) throw new Error('Name is required.')
    const password = String(input.password || '')
    if (password && password.length < 6)
        throw new Error('New password must contain at least 6 characters.')
    const pin = String(input.pin || '')
    if (pin && !/^\d{4}$/.test(pin))
        throw new Error('PIN must be exactly 4 digits.')

    const updated = normalizeStaff({
        ...current,
        name,
        email: String(input.email || '').trim(),
        phone: String(input.phone || '').trim(),
        birthDate: String(input.birthDate || '').trim(),
        password: password || current.password,
        pin: pin || current.pin,
        updatedAt: nowIso(),
    })
    Object.assign(current, updated)
    write(STORAGE.staff, state.staff)

    state.activeAccount = {
        ...state.activeAccount,
        name: current.name,
        role: current.role,
        permissions: current.permissions,
        email: current.email,
        phone: current.phone,
        birthDate: current.birthDate || '',
    }
    write(STORAGE.session, state.activeAccount)
    return current
}

function nextEmployeeId() {
    const highest = state.staff.reduce((maximum, account) => {
        const value =
            Number(String(account.employeeId).replace(/\D/g, '')) || 0
        return Math.max(maximum, value)
    }, 0)
    return `INV${String(highest + 1).padStart(3, '0')}`
}

function saveStaff(input, originalEmployeeId = '') {
    if (!can(PERMISSIONS.MANAGE_STAFF))
        throw new Error('You do not have permission to manage staff.')

    const current = originalEmployeeId
        ? state.staff.find(
              (account) => account.employeeId === originalEmployeeId,
          )
        : null
    const employeeId = current?.employeeId || nextEmployeeId()
    const name = String(input.name || '').trim()
    if (!name) throw new Error('Staff name is required.')
    if (String(input.password || '').length < 6)
        throw new Error('Password must contain at least 6 characters.')
    if (!/^\d{4}$/.test(String(input.pin || '')))
        throw new Error('PIN must be exactly 4 digits.')

    const actor = currentStaff()
    const actorIsDeveloper = normalizeRole(actor?.role) === 'Developer'
    const existingRole = current ? normalizeRole(current.role) : ''
    const requestedRole = normalizeRole(input.role)
    const developerAccount = existingRole === 'Developer' || requestedRole === 'Developer'
    const superadminAccount = existingRole === 'Superadmin'

    if (developerAccount && !actorIsDeveloper && existingRole !== 'Developer')
        throw new Error('Only Developer can create Developer accounts.')
    if (existingRole === 'Developer' && !actorIsDeveloper)
        throw new Error('Developer account can only be edited by Developer.')

    const staff = normalizeStaff({
        ...(current || {}),
        ...input,
        employeeId,
        barcode: current?.barcode || `STAFF-${employeeId}`,
        qrCode: current?.qrCode || `IMS:STAFF:${employeeId}`,
        role: developerAccount
            ? 'Developer'
            : superadminAccount
              ? 'Superadmin'
              : requestedRole,
        status: developerAccount
            ? 'active'
            : superadminAccount && !actorIsDeveloper
              ? current.status
              : input.status,
        permissions: developerAccount
            ? defaultPermissionsForRole('Developer')
            : superadminAccount && !actorIsDeveloper
              ? current.permissions
              : input.permissions,
        permissionsVersion: 5,
        createdAt: current?.createdAt || nowIso(),
        updatedAt: nowIso(),
    })

    if (current) Object.assign(current, staff)
    else state.staff.push(staff)
    write(STORAGE.staff, state.staff)

    if (state.activeAccount?.employeeId === staff.employeeId) {
        state.activeAccount = {
            ...state.activeAccount,
            name: staff.name,
            role: staff.role,
            permissions: staff.permissions,
        }
        write(STORAGE.session, state.activeAccount)
    }
    return staff
}

function nextSupplierCode() {
    const highest = state.suppliers.reduce((maximum, supplier) => {
        const value = Number(String(supplier.code).replace(/\D/g, '')) || 0
        return Math.max(maximum, value)
    }, 0)
    return `SUP${String(highest + 1).padStart(3, '0')}`
}

function findSupplier(value) {
    const normalized = String(value || '').trim().toLowerCase()
    if (!normalized) return null
    return (
        state.suppliers.find(
            (supplier) =>
                supplier.id.toLowerCase() === normalized ||
                supplier.code.toLowerCase() === normalized ||
                supplier.name.toLowerCase() === normalized,
        ) || null
    )
}

function saveSupplier(input, supplierId = '') {
    if (!can(PERMISSIONS.MANAGE_SUPPLIERS))
        throw new Error('You do not have permission to manage suppliers.')
    const current = supplierId
        ? state.suppliers.find((supplier) => supplier.id === supplierId)
        : null
    const name = String(input.name || '').trim()
    if (!name) throw new Error('Supplier name is required.')
    const duplicate = state.suppliers.find(
        (supplier) =>
            supplier.id !== current?.id &&
            supplier.name.toLowerCase() === name.toLowerCase(),
    )
    if (duplicate) throw new Error('A supplier with this name already exists.')

    const previousName = current?.name || ''
    const supplier = {
        ...(current || {}),
        id: current?.id || `sup-${Date.now().toString(36)}`,
        code: current?.code || nextSupplierCode(),
        name,
        contactName: String(input.contactName || '').trim(),
        phone: String(input.phone || '').trim(),
        email: String(input.email || '').trim(),
        address: String(input.address || '').trim(),
        leadTimeDays: Math.max(0, number(input.leadTimeDays)),
        paymentTerms: String(input.paymentTerms || '').trim(),
        status: input.status === 'inactive' ? 'inactive' : 'active',
        createdAt: current?.createdAt || nowIso(),
        updatedAt: nowIso(),
    }

    if (current) Object.assign(current, supplier)
    else state.suppliers.push(supplier)
    write(STORAGE.suppliers, state.suppliers)

    if (previousName && previousName !== name) {
        state.products
            .filter(
                (product) =>
                    product.supplierId === supplier.id ||
                    product.supplier === previousName,
            )
            .forEach((product) => {
                product.supplierId = supplier.id
                product.supplier = name
            })
        state.movements
            .filter((movement) => movement.supplierId === supplier.id)
            .forEach((movement) => {
                movement.supplierName = name
            })
        persistInventory()
    }
    return supplier
}

function setSupplierStatus(supplierId, status) {
    const supplier = state.suppliers.find((item) => item.id === supplierId)
    if (!supplier) throw new Error('Supplier not found.')
    return saveSupplier({ ...supplier, status }, supplierId)
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
    const stockUnit = state.stockUnits.find((unit) =>
        unit.id === value ||
        normalizeCode(unit.code) === code ||
        normalizeCode(unit.legacyCode) === code,
    )
    if (stockUnit) return state.products.find((product) => product.id === stockUnit.productId) || null
    const stockLot = state.stockLots.find((lot) => {
        const product = state.products.find((item) => item.id === lot.productId)
        return product && normalizeCode(stockLayerCode(product, lot)) === code
    })
    if (stockLot)
        return state.products.find((product) => product.id === stockLot.productId) || null
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
                normalizeCode(product.legacySku) === clean ||
                normalizeCode(product.bar) === clean ||
                normalizeCode(product.qrCode) === code ||
                normalizeCode(`IMS:PRODUCT:${product.legacySku || ''}`) === code,
        ) || null
    )
}

function findStockUnit(value) {
    const code = normalizeCode(value)
    return state.stockUnits.find(
        (unit) =>
            unit.id === value ||
            normalizeCode(unit.code) === code ||
            normalizeCode(unit.legacyCode) === code,
    ) || null
}

function findTransfer(value) {
    const transferId = typeof value === 'object'
        ? value?.transferId || value?.id
        : value
    return state.transfers.find((transfer) => transfer.id === transferId) || null
}

function isTransferMovement(movement) {
    if (!movement) return false
    const type = String(movement.type || '').trim().toLowerCase()
    return Boolean(
        movement.transferId ||
        ['transfer', 'stock transfer', 'move stock', 'stock move'].includes(type),
    )
}

function transferMovementQuantity(movement, transfer = findTransfer(movement)) {
    const lineQuantity = (transfer?.lines || []).reduce(
        (sum, line) => sum + number(line?.quantity),
        0,
    )
    const unitIdCount = new Set([
        ...(movement?.unitIds || []),
        ...(transfer?.unitIds || []),
    ].filter(Boolean)).size
    const unitCodeCount = new Set([
        ...(movement?.unitCodes || []),
        ...(transfer?.unitCodes || []),
    ].filter(Boolean)).size
    const unitCount = Math.max(unitIdCount, unitCodeCount)

    // Allocation lines and individual unit records describe what physically
    // moved. They are more reliable than a presentation-only movement field.
    return [
        lineQuantity,
        unitCount,
        transfer?.quantity,
        movement?.movedQuantity,
        movement?.quantity,
    ]
        .map(number)
        .find((quantity) => quantity > 0) || 0
}

function movementQuantity(movement) {
    if (!movement) return 0
    if (!isTransferMovement(movement)) return number(movement.changedQuantity)
    return transferMovementQuantity(movement)
}

function movementUnit(movement) {
    if (!movement) return ''
    const transfer = isTransferMovement(movement)
        ? findTransfer(movement)
        : null
    return movement.unit || transfer?.unit || findProduct(movement.productId)?.unit || ''
}

function movementBalances(movement) {
    const transfer = isTransferMovement(movement)
        ? findTransfer(movement)
        : null
    const readBalance = (key) => {
        if (Object.prototype.hasOwnProperty.call(movement || {}, key))
            return number(movement[key])
        if (Object.prototype.hasOwnProperty.call(transfer || {}, key))
            return number(transfer[key])
        return null
    }
    const readTotal = (totalKey, fallbackKey) =>
        Object.prototype.hasOwnProperty.call(movement || {}, totalKey)
            ? number(movement[totalKey])
            : number(movement?.[fallbackKey])
    return {
        totalBefore: readTotal('totalBeforeQuantity', 'beforeQuantity'),
        totalAfter: readTotal('totalAfterQuantity', 'afterQuantity'),
        sourceBefore: readBalance('sourceBeforeQuantity'),
        sourceAfter: readBalance('sourceAfterQuantity'),
        destinationBefore: readBalance('destinationBeforeQuantity'),
        destinationAfter: readBalance('destinationAfterQuantity'),
    }
}

function movementRoute(movement) {
    if (!movement) return '—'
    const transfer = isTransferMovement(movement)
        ? findTransfer(movement)
        : null
    const sourceWarehouse = findWarehouse(
        movement.sourceWarehouseId ||
            movement.warehouseId ||
            transfer?.sourceWarehouseId,
    )
    const sourceLocation = findLocation(
        sourceWarehouse?.id,
        movement.sourceLocationId ||
            movement.locationId ||
            transfer?.sourceLocationId,
    )
    const sourceLocationLabel =
        sourceLocation?.name ||
        sourceLocation?.code ||
        movement.sourceLocationName ||
        movement.location ||
        transfer?.sourceLocationName ||
        sourceWarehouse?.name ||
        '—'
    if (!isTransferMovement(movement)) return sourceLocationLabel

    const destinationWarehouse = findWarehouse(
        movement.destinationWarehouseId || transfer?.destinationWarehouseId,
    )
    const destinationLocation = findLocation(
        destinationWarehouse?.id,
        movement.destinationLocationId || transfer?.destinationLocationId,
    )
    const destinationLocationLabel =
        destinationLocation?.name ||
        destinationLocation?.code ||
        movement.destinationLocationName ||
        transfer?.destinationLocationName ||
        destinationWarehouse?.name ||
        '—'
    const sameWarehouse =
        sourceWarehouse?.id &&
        destinationWarehouse?.id &&
        sourceWarehouse.id === destinationWarehouse.id
    if (sameWarehouse) {
        return `${sourceLocationLabel} → ${destinationLocationLabel}`
    }
    const source = sourceWarehouse?.name
        ? `${sourceWarehouse.name} / ${sourceLocationLabel}`
        : sourceLocationLabel
    const destination = destinationWarehouse?.name
        ? `${destinationWarehouse.name} / ${destinationLocationLabel}`
        : destinationLocationLabel
    return `${source} → ${destination}`
}

function findShipmentForMovement(movement) {
    if (!movement) return null
    const shipmentId = String(movement.shipmentId || '').trim()
    if (!shipmentId) return null
    return state.shipments.find((shipment) => shipment.id === shipmentId) || null
}

function shipmentMovementContext(movement) {
    const shipment = findShipmentForMovement(movement)
    if (!shipment) return null
    const batchId = String(
        shipment.batchGroupId || movement?.batchGroupId || movement?.batch || '',
    ).trim()
    const batchShipmentId = String(
        shipment.batchShipmentId || movement?.batchShipmentId || '',
    ).trim()
    const batchCount = Math.max(
        0,
        number(shipment.batchCount || movement?.batchCount),
    )
    const recipeLine = Array.isArray(shipment.batchRecipeSnapshot)
        ? shipment.batchRecipeSnapshot.find(
              (item) => String(item.productId) === String(movement?.productId),
          )
        : null
    const balances = movementBalances(movement)
    return {
        shipmentId: shipment.id,
        batchShipmentId,
        isBatchShipment: Boolean(batchShipmentId || batchId),
        batchId,
        batchCount,
        recipeQuantity: recipeLine ? number(recipeLine.quantity) : null,
        recipient: String(shipment.recipient || shipment.destination || '').trim(),
        reference: String(shipment.reference || movement?.reference || '').trim(),
        remark: String(shipment.remark || movement?.remark || '').trim(),
        sourceWarehouseId: shipment.sourceWarehouseId || movement?.sourceWarehouseId || '',
        sourceWarehouseName:
            shipment.sourceWarehouseName ||
            movement?.sourceWarehouseName ||
            findWarehouse(shipment.sourceWarehouseId || movement?.sourceWarehouseId)?.name ||
            '',
        sourceLocationId: shipment.sourceLocationId || movement?.sourceLocationId || '',
        sourceLocation:
            shipment.sourceLocation ||
            movement?.sourceLocationName ||
            findLocation(
                shipment.sourceWarehouseId || movement?.sourceWarehouseId,
                shipment.sourceLocationId || movement?.sourceLocationId,
            )?.name ||
            '',
        sourceBefore: movement?.sourceBalanceRecorded === true ? balances.sourceBefore : null,
        sourceAfter: movement?.sourceBalanceRecorded === true ? balances.sourceAfter : null,
        totalBefore: balances.totalBefore,
        totalAfter: balances.totalAfter,
    }
}

function nextSku(category = 'Product') {
    const prefix = categoryCode(category)
    const sequences = state.products
        .map((product) => normalizeCode(product.sku))
        .filter((sku) => sku.startsWith(`${prefix}-`))
        .map((sku) => skuSequence(sku))
    let sequence = sequences.length ? Math.max(...sequences) + 1 : 1
    let sku = formatCategorySku(category, sequence)
    while (findProduct(sku)) {
        sequence += 1
        sku = formatCategorySku(category, sequence)
    }
    return sku
}

function normalizeProductCategories(categories = []) {
    const output = []
    const seen = new Set()
    categories.forEach((category) => {
        const name = String(category || '').replace(/\s+/g, ' ').trim()
        const key = name.toLocaleLowerCase('en')
        if (!name || seen.has(key)) return
        seen.add(key)
        output.push(name)
    })
    return output
}

function ensureProductCategory(category) {
    const name = String(category || '').replace(/\s+/g, ' ').trim()
    if (!name) return ''
    const existing = state.productCategories.find(
        (item) => item.toLocaleLowerCase('en') === name.toLocaleLowerCase('en'),
    )
    if (existing) return existing
    state.productCategories.push(name)
    return name
}

function addProductCategory(category) {
    if (!can(PERMISSIONS.MANAGE_PRODUCTS))
        throw new Error('You do not have permission to manage products.')
    const name = String(category || '').replace(/\s+/g, ' ').trim()
    if (!name) throw new Error('Category name is required.')
    if (name.length > 40) throw new Error('Category name must be 40 characters or fewer.')
    const savedName = ensureProductCategory(name)
    persistInventory()
    return savedName
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
    if (!can(PERMISSIONS.MANAGE_PRODUCTS))
        throw new Error('You do not have permission to manage products.')
    const name = String(input.name || '').trim()
    if (!name) throw new Error('Product name is required.')
    const current = productId
        ? state.products.find((product) => product.id === productId)
        : null
    const category = String(input.category || current?.category || 'General').trim()
    const previousSku = normalizeCode(current?.sku)
    const categoryChanged = Boolean(current && current.category !== category)
    const hasInventory = Boolean(current && productStock(current.id) > 0)
    const sku =
        !current || (categoryChanged && !hasInventory)
            ? nextSku(category)
            : previousSku
    const supplierValue = String(
        input.supplierId || input.supplier || '',
    ).trim()
    const supplier = supplierValue ? findSupplier(supplierValue) : null
    if (supplierValue && !supplier)
        throw new Error('Choose a supplier from Supplier Management.')
    if (
        supplier?.status !== 'active' &&
        supplier?.id !== current?.supplierId
    )
        throw new Error('This supplier is unavailable. Choose an active supplier.')
    const requestedTrackingMode = ['none', 'batch', 'unit'].includes(
        String(input.trackingMode || '').toLowerCase(),
    )
        ? String(input.trackingMode).toLowerCase()
        : normalizeTrackingMode(current || input)
    if (
        current &&
        hasInventory &&
        requestedTrackingMode !== normalizeTrackingMode(current)
    )
        throw new Error('Tracking mode cannot change while stock exists.')

    const product = {
        ...(current || {}),
        id: current?.id || `prd-${Date.now().toString(36)}`,
        name,
        nameMode: input.nameMode === 'multiple' ? 'multiple' : 'single',
        nameTranslations: (() => {
            const translations = input.nameTranslations || input.nameI18n || {}
            const english = String(translations.en || name).trim() || name
            return {
                en: english,
                cn: String(translations.cn || english).trim() || english,
                bm: String(translations.bm || english).trim() || english,
            }
        })(),
        sku,
        bar: normalizeCode(
            input.bar ||
                input.barcode ||
                current?.bar ||
                nextBar(),
        ),
        qrCode: `IMS:PRODUCT:${sku}`,
        category,
        type: input.type || 'Retail Product',
        unit: String(input.unit || 'pcs').trim(),
        currentStock: current ? productStock(current.id) : 0,
        minimumStock: Math.max(0, number(input.minimumStock)),
        costPrice: Math.max(0, number(input.costPrice)),
        sellingPrice: Math.max(0, number(input.sellingPrice)),
        supplierId: supplier?.id || '',
        supplier: supplier?.name || '',
        location: current?.location || '',
        warehouseId: current?.warehouseId || '',
        warehouseName: current?.warehouseName || '',
        photo: String(input.photo || current?.photo || ''),
        expiryTracking: Boolean(input.expiryTracking),
        trackingMode: requestedTrackingMode,
        active: input.active !== false,
        batches: current?.batches || [],
        createdAt: current?.createdAt || nowIso(),
    }

    if (current) {
        if (previousSku && previousSku !== sku) {
            product.legacySku = current.legacySku || previousSku
            product.batches = (product.batches || []).map((batch) => ({
                ...batch,
                batchQr: `IMS:BATCH:${sku}:${batch.id}`,
            }))
            state.movements
                .filter((movement) => movement.productId === current.id)
                .forEach((movement) => {
                    movement.sku = sku
                })
        }
        Object.assign(current, product)
    } else state.products.unshift(product)
    ensureProductCategory(category)
    syncDerivedInventory((current || product).id)
    persistInventory()
    return current || product
}

function findWarehouse(value) {
    const key = String(value || '').trim().toLowerCase()
    return state.warehouses.find((warehouse) =>
        warehouse.id.toLowerCase() === key ||
        warehouse.code.toLowerCase() === key ||
        warehouse.name.toLowerCase() === key,
    ) || null
}

function saveWarehouse(input, warehouseId = '') {
    if (!can(PERMISSIONS.MANAGE_WAREHOUSES))
        throw new Error('You do not have permission to manage warehouses.')
    const current = warehouseId ? findWarehouse(warehouseId) : null
    const name = String(input.name || '').trim()
    if (!name) throw new Error('Warehouse name is required.')
    const duplicate = state.warehouses.find((warehouse) =>
        warehouse.id !== current?.id && warehouse.name.toLowerCase() === name.toLowerCase(),
    )
    if (duplicate) throw new Error('A warehouse with this name already exists.')
    const warehouse = normalizeWarehouse({
        ...(current || {}),
        id: current?.id || `wh-${Date.now().toString(36)}`,
        code: String(input.code || current?.code || name).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 12),
        name,
        nameMode: input.nameMode === 'multiple' ? 'multiple' : 'single',
        nameTranslations: (() => {
            const translations = input.nameTranslations || input.nameI18n || {}
            const english = String(translations.en || name).trim() || name
            return {
                en: english,
                cn: String(translations.cn || english).trim() || english,
                bm: String(translations.bm || english).trim() || english,
            }
        })(),
        purpose: String(input.purpose || '').trim(),
        companyName: String(input.companyName || current?.companyName || '').trim(),
        address: String(input.address || current?.address || '').trim(),
        contactName: String(input.contactName || current?.contactName || '').trim(),
        phone: String(input.phone || current?.phone || '').trim(),
        active: input.active !== false,
    })
    if (current) Object.assign(current, warehouse)
    else state.warehouses.push(warehouse)
    persistWarehouses()
    return current || warehouse
}

function saveWarehouseLocation(warehouseId, input, locationId = '') {
    if (!can(PERMISSIONS.MANAGE_WAREHOUSES))
        throw new Error('You do not have permission to manage warehouses.')
    const warehouse = findWarehouse(warehouseId)
    if (!warehouse) throw new Error('Warehouse not found.')
    const name = String(input.name || '').trim()
    if (!name) throw new Error('Location name is required.')
    const current = locationId ? warehouse.locations.find((location) => location.id === locationId) : null
    const duplicate = warehouse.locations.find((location) =>
        location.id !== current?.id && location.name.toLowerCase() === name.toLowerCase(),
    )
    if (duplicate) throw new Error('This location already exists in the warehouse.')
    const location = {
        ...(current || {}),
        id: current?.id || `loc-${warehouse.id}-${Date.now().toString(36)}`,
        warehouseId: warehouse.id,
        code: normalizeCode(input.code || current?.code || name),
        name,
        nameMode: input.nameMode === 'multiple' ? 'multiple' : 'single',
        nameTranslations: (() => {
            const translations = input.nameTranslations || input.nameI18n || {}
            const english = String(translations.en || name).trim() || name
            return {
                en: english,
                cn: String(translations.cn || english).trim() || english,
                bm: String(translations.bm || english).trim() || english,
            }
        })(),
        type: String(input.type || current?.type || 'Rack').trim(),
        capacityValue:
            input.capacityValue === '' ||
            input.capacityValue === null ||
            input.capacityValue === undefined
                ? null
                : Math.max(0, number(input.capacityValue)),
        capacityUnit: String(
            input.capacityUnit || current?.capacityUnit || '',
        ).trim(),
        status:
            input.status === 'unavailable' || input.active === false
                ? 'unavailable'
                : 'active',
        active: input.active !== false,
    }
    if (current) Object.assign(current, location)
    else warehouse.locations.push(location)
    persistWarehouses()
    return current || location
}


function deleteWarehouse(warehouseId) {
    if (!can(PERMISSIONS.MANAGE_WAREHOUSES))
        throw new Error('You do not have permission to manage warehouses.')
    const index = state.warehouses.findIndex((warehouse) => warehouse.id === warehouseId)
    if (index < 0) throw new Error('Warehouse not found.')
    const warehouse = state.warehouses[index]
    const hasStock = state.stockPositions.some((position) =>
        position.warehouseId === warehouse.id && number(position.availableQuantity) > 0,
    )
    if (hasStock) throw new Error('Move or remove all stock in this warehouse before deleting it.')
    state.warehouses.splice(index, 1)
    persistWarehouses()
    return true
}

function deleteWarehouseLocation(warehouseId, locationId) {
    if (!can(PERMISSIONS.MANAGE_WAREHOUSES))
        throw new Error('You do not have permission to manage warehouses.')
    const warehouse = findWarehouse(warehouseId)
    if (!warehouse) throw new Error('Warehouse not found.')
    const index = warehouse.locations.findIndex((location) => location.id === locationId)
    if (index < 0) throw new Error('Location not found.')
    const location = warehouse.locations[index]
    const hasStock = state.stockPositions.some((position) =>
        position.warehouseId === warehouse.id &&
        position.locationId === location.id &&
        number(position.availableQuantity) > 0,
    )
    if (hasStock) throw new Error('Move or remove all stock in this location before deleting it.')
    warehouse.locations.splice(index, 1)
    persistWarehouses()
    return true
}

function warehouseProducts(warehouseId) {
    const productIds = new Set(
        state.stockPositions
            .filter(
                (position) =>
                    position.warehouseId === warehouseId &&
                    number(position.availableQuantity) > 0,
            )
            .map((position) => position.productId),
    )
    return state.products.filter((product) => productIds.has(product.id))
}

function warehouseStock(warehouseId) {
    return state.stockPositions
        .filter((position) => position.warehouseId === warehouseId)
        .reduce(
            (sum, position) => sum + number(position.availableQuantity),
            0,
        )
}

function setProductActive(productId, active) {
    if (!can(PERMISSIONS.MANAGE_PRODUCTS))
        throw new Error('You do not have permission to manage products.')
    const product = findProduct(productId)
    if (!product) throw new Error('Product not found.')
    product.active = Boolean(active)
    write(STORAGE.products, state.products)
    return product
}

function receiptHasInvoice(receipt) {
    // An invoice exists only for an explicit Supplier Stock In transaction.
    // A product's preferred supplier, or a stale hidden supplier field, must
    // never turn a normal Stock Receipt into an invoice.
    // Both fields are required. This also safely ignores old/incorrect records
    // that were tagged as supplier receipts without an actual supplier.
    return receipt?.stockInType === 'supplier' && Boolean(String(receipt?.supplierId || '').trim())
}

function receiptTimeValue(receipt) {
    const value = receipt?.createdAt || receipt?.receivedDate || ''
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

function movementTimeValue(movement) {
    const parsed = Date.parse(movement?.createdAt || '')
    return Number.isNaN(parsed) ? 0 : parsed
}

function findReceiptForMovement(movement, options = {}) {
    if (!movement) return null
    const invoiceOnly = Boolean(options.invoiceOnly)
    const canRouteToInvoice =
        movement.stockInType === 'supplier' ||
        movement.reason === 'Supplier Delivery'
    if (invoiceOnly && !canRouteToInvoice) return null
    const candidates = new Map()
    const add = (receipt, score) => {
        if (!receipt) return
        if (invoiceOnly && !receiptHasInvoice(receipt)) return
        const existing = candidates.get(receipt.id)
        if (!existing || score > existing.score) candidates.set(receipt.id, { receipt, score })
    }

    const directIds = new Set([
        movement.receiptId,
        movement.receiptNumber,
    ].filter(Boolean).map(String))
    directIds.forEach((value) => {
        add(state.receipts.find((receipt) => receipt.id === value || receipt.receiptNumber === value), 120)
    })

    const lotIds = new Set([movement.lotId].filter(Boolean).map(String))
    if (movement.batchGroupId) {
        state.stockLots
            .filter((lot) => lot.batchGroupId === movement.batchGroupId)
            .forEach((lot) => lotIds.add(lot.id))
    }
    if (movement.batchId || movement.batch) {
        const batchCode = String(movement.batchId || movement.batch)
        state.stockLots
            .filter((lot) => lot.batchNumber === batchCode || lot.batchGroupId === batchCode)
            .forEach((lot) => lotIds.add(lot.id))
    }
    lotIds.forEach((lotId) => {
        const lot = state.stockLots.find((item) => item.id === lotId)
        if (lot?.receiptId) add(state.receipts.find((receipt) => receipt.id === lot.receiptId), 112)
    })

    const unitIds = new Set(Array.isArray(movement.unitIds) ? movement.unitIds.map(String) : [])
    const unitCodes = new Set(Array.isArray(movement.unitCodes) ? movement.unitCodes.map(String) : [])
    state.stockUnits.forEach((unit) => {
        if (!unitIds.has(String(unit.id)) && !unitCodes.has(String(unit.code))) return
        if (unit.receiptId) add(state.receipts.find((receipt) => receipt.id === unit.receiptId), 110)
        if (unit.lotId) {
            const lot = state.stockLots.find((item) => item.id === unit.lotId)
            if (lot?.receiptId) add(state.receipts.find((receipt) => receipt.id === lot.receiptId), 108)
        }
    })

    const reference = String(movement.reference || '').trim()
    if (reference) {
        state.receipts.forEach((receipt) => {
            if ([receipt.invoiceNumber, receipt.purchaseOrderNumber, receipt.receiptNumber, receipt.id]
                .some((value) => String(value || '').trim() === reference)) add(receipt, 105)
        })
    }

    const movementDay = String(movement.createdAt || '').slice(0, 10)
    state.receipts.forEach((receipt) => {
        const lines = Array.isArray(receipt.lines) ? receipt.lines : []
        const containsProduct = lines.some((line) => line.productId === movement.productId)
        if (!containsProduct) return
        let score = 60
        if (movement.supplierId && receipt.supplierId === movement.supplierId) score += 18
        if (movement.warehouseId && receipt.warehouseId === movement.warehouseId) score += 8
        if (movement.locationId && receipt.locationId === movement.locationId) score += 8
        if (movementDay && String(receipt.createdAt || receipt.receivedDate || '').slice(0, 10) === movementDay) score += 12
        add(receipt, score)
    })

    const movementTime = movementTimeValue(movement)
    return [...candidates.values()]
        .sort((left, right) => {
            if (right.score !== left.score) return right.score - left.score
            if (!movementTime) return receiptTimeValue(right.receipt) - receiptTimeValue(left.receipt)
            return Math.abs(receiptTimeValue(left.receipt) - movementTime) - Math.abs(receiptTimeValue(right.receipt) - movementTime)
        })[0]?.receipt || null
}

function findReceiptForStock(productId, stock = {}, options = {}) {
    const invoiceOnly = Boolean(options.invoiceOnly)
    const candidates = []
    const add = (receipt, score) => {
        if (!receipt) return
        if (invoiceOnly && !receiptHasInvoice(receipt)) return
        candidates.push({ receipt, score })
    }

    const unitIds = new Set((stock.units || []).map((unit) => String(unit.id || '')))
    const unitCodes = new Set((stock.units || []).map((unit) => String(unit.code || '')))
    state.stockUnits.forEach((unit) => {
        if (!unitIds.has(String(unit.id)) && !unitCodes.has(String(unit.code))) return
        if (unit.receiptId) add(state.receipts.find((receipt) => receipt.id === unit.receiptId), 120)
        const lot = state.stockLots.find((item) => item.id === unit.lotId)
        if (lot?.receiptId) add(state.receipts.find((receipt) => receipt.id === lot.receiptId), 115)
    })

    const layerIds = new Set((stock.receipts || []).flatMap((layer) => [layer.receiptId, layer.lotId, layer.id]).filter(Boolean).map(String))
    layerIds.forEach((value) => {
        add(state.receipts.find((receipt) => receipt.id === value || receipt.receiptNumber === value), 118)
        const lot = state.stockLots.find((item) => item.id === value)
        if (lot?.receiptId) add(state.receipts.find((receipt) => receipt.id === lot.receiptId), 116)
    })

    state.receipts.forEach((receipt) => {
        const lines = Array.isArray(receipt.lines) ? receipt.lines : []
        if (!lines.some((line) => line.productId === productId)) return
        let score = 60
        if (stock.warehouseId && receipt.warehouseId === stock.warehouseId) score += 12
        if (stock.locationId && receipt.locationId === stock.locationId) score += 12
        add(receipt, score)
    })

    const unique = new Map()
    candidates.forEach((candidate) => {
        const existing = unique.get(candidate.receipt.id)
        if (!existing || candidate.score > existing.score) unique.set(candidate.receipt.id, candidate)
    })
    return [...unique.values()]
        .sort((left, right) => right.score - left.score || receiptTimeValue(right.receipt) - receiptTimeValue(left.receipt))[0]?.receipt || null
}

function recordMovement(product, data) {
    const account = state.activeAccount || {
        name: 'System',
        employeeId: 'SYSTEM',
    }
    // A movement records the supplier used for this action. Do not inherit the
    // product's default supplier: normal stock-in must never look like a
    // supplier receipt merely because the product has a preferred supplier.
    const supplier = findSupplier(data.supplierId || data.supplier)
    const movement = {
        id: buildMovementId(),
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        batch: data.batch || '',
        batchId: data.batchId || data.batch || '',
        lotId: data.lotId || '',
        beforeQuantity: number(data.beforeQuantity),
        changedQuantity: number(data.changedQuantity),
        afterQuantity: number(data.afterQuantity),
        totalBeforeQuantity: Object.prototype.hasOwnProperty.call(
            data,
            'totalBeforeQuantity',
        )
            ? number(data.totalBeforeQuantity)
            : number(data.beforeQuantity),
        totalAfterQuantity: Object.prototype.hasOwnProperty.call(
            data,
            'totalAfterQuantity',
        )
            ? number(data.totalAfterQuantity)
            : number(data.afterQuantity),
        quantity: number(data.quantity),
        movedQuantity: number(data.movedQuantity),
        unit: data.unit || product.unit || '',
        type: data.type,
        reason: data.reason,
        supplierId: supplier?.id || '',
        supplierName: supplier?.name || '',
        warehouseId: data.warehouseId || data.sourceWarehouseId || '',
        warehouseName:
            data.warehouseName ||
            findWarehouse(data.warehouseId || data.sourceWarehouseId)?.name ||
            '',
        locationId: data.locationId || data.sourceLocationId || '',
        location:
            data.location ||
            findLocation(
                data.warehouseId || data.sourceWarehouseId,
                data.locationId || data.sourceLocationId,
            )?.name ||
            '',
        sourceWarehouseId: data.sourceWarehouseId || '',
        sourceWarehouseName:
            data.sourceWarehouseName ||
            findWarehouse(data.sourceWarehouseId)?.name ||
            '',
        sourceLocationId: data.sourceLocationId || '',
        sourceLocationName:
            data.sourceLocationName ||
            findLocation(data.sourceWarehouseId, data.sourceLocationId)?.name ||
            '',
        destinationWarehouseId: data.destinationWarehouseId || '',
        destinationWarehouseName:
            data.destinationWarehouseName ||
            findWarehouse(data.destinationWarehouseId)?.name ||
            '',
        destinationLocationId: data.destinationLocationId || '',
        destinationLocationName:
            data.destinationLocationName ||
            findLocation(
                data.destinationWarehouseId,
                data.destinationLocationId,
            )?.name ||
            '',
        sourceBeforeQuantity: number(data.sourceBeforeQuantity),
        sourceAfterQuantity: number(data.sourceAfterQuantity),
        sourceBalanceRecorded: data.sourceBalanceRecorded === true,
        destinationBeforeQuantity: number(data.destinationBeforeQuantity),
        destinationAfterQuantity: number(data.destinationAfterQuantity),
        receiptId: data.receiptId || '',
        shipmentId: data.shipmentId || '',
        batchShipmentId: data.batchShipmentId || '',
        batchCount: Math.max(0, number(data.batchCount)),
        transferId: data.transferId || '',
        batchTransferId: data.batchTransferId || '',
        batchRemovalId: data.batchRemovalId || '',
        stockSource: data.stockSource || '',
        stockInType: data.stockInType || '',
        batchGroupId: data.batchGroupId || '',
        staffId: account.employeeId,
        staffName: account.name,
        reference: String(data.reference || '').trim(),
        remark: String(data.remark || '').trim(),
        photo: String(data.photo || '').trim(),
        unitIds: Array.isArray(data.unitIds) ? data.unitIds : [],
        unitCodes: Array.isArray(data.unitCodes) ? data.unitCodes : [],
        createdAt: nowIso(),
    }
    state.movements.unshift(movement)
    return movement
}

function documentDateCode() {
    return nowIso().slice(0, 10).replaceAll('-', '')
}

function nextDocumentId(prefix, collection) {
    const stem = `${prefix}-${documentDateCode()}-`
    const sequence =
        collection.filter((item) => item.id.startsWith(stem)).length + 1
    return `${stem}${String(sequence).padStart(3, '0')}`
}

function generateDocumentNumber(prefix = 'DOC', mode = 'sequence') {
    const cleanPrefix = normalizeCode(prefix || 'DOC') || 'DOC'
    const dateCode = documentDateCode()
    if (String(mode).toLowerCase() === 'random') {
        const used = new Set(
            state.receipts.flatMap((receipt) => [receipt.invoiceNumber, receipt.purchaseOrderNumber]).filter(Boolean),
        )
        let value = ''
        do {
            value = `${cleanPrefix}-${dateCode}-${Math.floor(100000 + Math.random() * 900000)}`
        } while (used.has(value))
        return value
    }
    const stem = `${cleanPrefix}-${dateCode}-`
    const prefixPattern = new RegExp(`^${cleanPrefix}-\\d{8}-(\\d+)$`, 'i')
    const sequence = state.receipts
        .flatMap((receipt) => [receipt.invoiceNumber, receipt.purchaseOrderNumber])
        .reduce((maximum, value) => {
            const match = String(value || '').trim().match(prefixPattern)
            const suffix = match ? Number(match[1]) : NaN
            return Number.isFinite(suffix) ? Math.max(maximum, suffix) : maximum
        }, 0) + 1
    return `${stem}${String(sequence).padStart(3, '0')}`
}

function stockMovementNumbers() {
    return state.stockInRequests.flatMap((request) => [
        request.requestNumber || request.id,
        request.confirmationId,
    ]).filter(Boolean)
}

function generateStockMovementNumber(prefix = 'SIR', mode = 'sequence') {
    const cleanPrefix = normalizeCode(prefix || 'SIR') || 'SIR'
    const dateCode = documentDateCode()
    const used = new Set(stockMovementNumbers().map((value) => String(value).trim().toUpperCase()))
    if (String(mode).toLowerCase() === 'random') {
        let value = ''
        do {
            value = `${cleanPrefix}-${dateCode}-${Math.floor(100000 + Math.random() * 900000)}`
        } while (used.has(value))
        return value
    }

    const candidates = cleanPrefix === 'SIC'
        ? state.stockInRequests
              .filter((request) => request.confirmationId && request.confirmationNumberMode !== 'random')
              .map((request) => request.confirmationId)
        : cleanPrefix === 'SIR'
          ? state.stockInRequests
                .filter((request) => (request.requestNumber || request.id) && request.requestNumberMode !== 'random')
                .map((request) => request.requestNumber || request.id)
          : stockMovementNumbers()
    const sequencePattern = new RegExp(`^${cleanPrefix}-\\d{8}-(\\d+)$`, 'i')
    const sequence = candidates.reduce((maximum, value) => {
        const match = String(value || '').trim().match(sequencePattern)
        const suffix = match ? Number(match[1]) : NaN
        return Number.isFinite(suffix) ? Math.max(maximum, suffix) : maximum
    }, 0) + 1
    return `${cleanPrefix}-${dateCode}-${String(sequence).padStart(3, '0')}`
}

function normalizeStockMovementNumber(value, label = 'Document ID') {
    const normalized = String(value || '').trim().toUpperCase()
    if (!normalized) throw new Error(`${label} is required.`)
    return normalized
}

function assertUniqueStockMovementNumber(value, excludeRequestId = '') {
    const normalized = normalizeStockMovementNumber(value)
    const duplicate = state.stockInRequests.some((request) => {
        if (request.id === excludeRequestId) return false
        return [request.requestNumber || request.id, request.confirmationId]
            .filter(Boolean)
            .some((candidate) => String(candidate).trim().toUpperCase() === normalized)
    })
    if (duplicate) throw new Error(`${normalized} is already in use.`)
    return normalized
}

function nextStockInConfirmationId() {
    return generateStockMovementNumber('SIC', 'sequence')
}

function nextBatchShipmentId() {
    const stem = `BSH-${documentDateCode()}-`
    const sequence = state.shipments.reduce((maximum, shipment) => {
        const value = String(shipment.batchShipmentId || shipment.id || '')
        if (!value.startsWith(stem)) return maximum
        return Math.max(maximum, number(value.slice(stem.length)))
    }, 0) + 1
    return `${stem}${String(sequence).padStart(3, '0')}`
}

function nextBatchTransferId() {
    const stem = `BTR-${documentDateCode()}-`
    const sequence = state.transfers.reduce((maximum, transfer) => {
        const value = String(transfer.batchTransferId || '')
        if (!value.startsWith(stem)) return maximum
        return Math.max(maximum, number(value.slice(stem.length)))
    }, 0) + 1
    return `${stem}${String(sequence).padStart(3, '0')}`
}

function nextBatchRemovalId() {
    const stem = `BRM-${documentDateCode()}-`
    const sequence = state.movements.reduce((maximum, movement) => {
        const value = String(movement.batchRemovalId || '')
        if (!value.startsWith(stem)) return maximum
        return Math.max(maximum, number(value.slice(stem.length)))
    }, 0) + 1
    return `${stem}${String(sequence).padStart(3, '0')}`
}

function nextBatchNumber() {
    const sequence =
        [
            ...state.stockLots.filter((lot) => lot.isBatch && lot.batchGroupId).map((lot) => lot.batchGroupId || lot.batchNumber),
            ...state.batchDefinitions.map((batch) => batch.id),
        ]
            .reduce((maximum, batchId) => {
                const match = String(batchId || '').match(/^B(\d+)$/i)
                return Math.max(maximum, match ? Number(match[1]) : 0)
            }, 0) + 1
    return `B${String(sequence).padStart(2, '0')}`
}

function registerBatchDefinition(input = {}) {
    const rawItems = Array.isArray(input.items) && input.items.length
        ? input.items
        : (input.productIds || []).map((productId) => ({ productId, quantity: 1 }))
    const items = [...rawItems.reduce((result, item) => {
        const productId = String(item?.productId || '').trim()
        const quantity = number(item?.quantity)
        if (!findProduct(productId) || !(quantity > 0)) return result
        result.set(productId, { productId, quantity })
        return result
    }, new Map()).values()]
    const productIds = items.map((item) => item.productId)
    if (!productIds.length) throw new Error('Choose at least one product for the batch.')
    const id = nextBatchNumber()
    const supplier = findSupplier(input.supplierId)
    const batch = {
        id,
        name: String(input.name || `Batch ${id}`).trim(),
        productIds,
        items,
        supplierId: supplier?.id || '',
        supplierName: supplier?.name || '',
        recipeVersion: 1,
        createdAt: nowIso(),
    }
    state.batchDefinitions.push(batch)
    persistInventory()
    return batch
}

function updateBatchDefinition(batchId, input = {}) {
    const definition = state.batchDefinitions.find((item) => item.id === batchId)
    if (!definition) throw new Error('Batch definition was not found.')
    const rawItems = Array.isArray(input.items) ? input.items : []
    const items = [...rawItems.reduce((result, item) => {
        const productId = String(item?.productId || '').trim()
        const quantity = number(item?.quantity)
        if (!findProduct(productId) || !(quantity > 0)) return result
        result.set(productId, { productId, quantity })
        return result
    }, new Map()).values()]
    if (!items.length) throw new Error('Choose at least one product and set its per-batch quantity.')
    definition.items = items
    definition.productIds = items.map((item) => item.productId)
    definition.name = String(input.name || definition.name || `Batch ${definition.id}`).trim()
    definition.recipeVersion = Math.max(1, Math.floor(number(definition.recipeVersion) || 1)) + 1
    definition.updatedAt = nowIso()
    persistInventory()
    return findBatch(definition.id)
}

function standaloneLayerPrefix(product) {
    return normalizeTrackingMode(product) === 'unit' ? 'U' : 'L'
}

function nextStandaloneLayerNumber(product) {
    const prefix = standaloneLayerPrefix(product)
    const sequence =
        state.stockLots
            .filter((lot) => lot.productId === product.id && !isRegisteredBatchLot(lot))
            .reduce((maximum, lot) => {
                const match = String(lot.batchNumber || '').match(new RegExp(`^${prefix}(\\d+)$`, 'i'))
                return Math.max(maximum, match ? Number(match[1]) : 0)
            }, 0) + 1
    return `${prefix}${String(sequence).padStart(2, '0')}`
}

function migrateSimpleInventoryCodes() {
    const lotMappings = new Map()
    const groupIdMappings = new Map()

    const registeredGroups = new Map()
    state.stockLots
        .filter((lot) => lot.isBatch && lot.batchGroupId)
        .forEach((lot) => {
            const key = String(lot.batchGroupId || lot.batchNumber || lot.id)
            const rows = registeredGroups.get(key) || []
            rows.push(lot)
            registeredGroups.set(key, rows)
        })

    ;[...registeredGroups.entries()]
        .map(([key, lots]) => ({
            key,
            lots,
            sortKey: lots
                .map((lot) => `${lot.receivedDate || ''}-${lot.createdAt || ''}-${lot.id}`)
                .sort()[0],
        }))
        .sort((left, right) => left.sortKey.localeCompare(right.sortKey) || left.key.localeCompare(right.key))
        .forEach((group, index) => {
            const next = `B${String(index + 1).padStart(2, '0')}`
            const totalParts = group.lots.reduce((sum, lot) => sum + number(lot.receivedQuantity), 0)
            if (group.key !== next) groupIdMappings.set(group.key, next)
            group.lots.forEach((lot) => {
                lotMappings.set(lot.id, {
                    previous: String(lot.batchNumber || ''),
                    next,
                    registered: true,
                    previousGroup: String(lot.batchGroupId || ''),
                })
                lot.legacyBatchNumber = lot.legacyBatchNumber || lot.batchNumber || ''
                lot.legacyBatchGroupId = lot.legacyBatchGroupId || lot.batchGroupId || ''
                lot.batchNumber = next
                lot.batchGroupId = next
                lot.batchQrCode = `IMS:BATCH:${next}`
                lot.batchTotalParts = totalParts
                lot.batchSequence = index + 1
            })
        })

    const standaloneByProduct = new Map()
    state.stockLots
        .filter((lot) => !isRegisteredBatchLot(lot))
        .forEach((lot) => {
            const rows = standaloneByProduct.get(lot.productId) || []
            rows.push(lot)
            standaloneByProduct.set(lot.productId, rows)
        })

    standaloneByProduct.forEach((lots, productId) => {
        const product = findProduct(productId)
        if (!product) return
        const prefix = standaloneLayerPrefix(product)
        lots
            .slice()
            .sort((left, right) =>
                `${left.receivedDate || ''}-${left.createdAt || ''}-${left.id}`.localeCompare(
                    `${right.receivedDate || ''}-${right.createdAt || ''}-${right.id}`,
                ),
            )
            .forEach((lot, index) => {
                const next = `${prefix}${String(index + 1).padStart(2, '0')}`
                lotMappings.set(lot.id, {
                    previous: String(lot.batchNumber || ''),
                    next,
                    registered: false,
                    previousGroup: '',
                })
                lot.legacyBatchNumber = lot.legacyBatchNumber || lot.batchNumber || ''
                lot.batchNumber = next
                lot.batchSequence = index + 1
                lot.batchGroupId = ''
                lot.isBatch = false
                lot.batchQrCode = ''
                lot.batchTotalParts = 0
            })
    })

    const unitsByLot = new Map()
    state.stockUnits.forEach((unit) => {
        const rows = unitsByLot.get(unit.lotId) || []
        rows.push(unit)
        unitsByLot.set(unit.lotId, rows)
    })

    registeredGroups.forEach((originalLots, originalGroupId) => {
        const nextGroupId = groupIdMappings.get(originalGroupId) || originalLots[0]?.batchGroupId || originalGroupId
        const lots = state.stockLots
            .filter((lot) => lot.batchGroupId === nextGroupId)
            .slice()
            .sort((left, right) => `${left.createdAt || ''}-${left.id}`.localeCompare(`${right.createdAt || ''}-${right.id}`))
        const total = lots.reduce((sum, lot) => sum + number(lot.receivedQuantity), 0)
        let ordinal = 1
        lots.forEach((lot) => {
            const product = findProduct(lot.productId)
            if (!product) return
            ;(unitsByLot.get(lot.id) || [])
                .slice()
                .sort((left, right) => number(left.ordinal) - number(right.ordinal) || String(left.id).localeCompare(String(right.id)))
                .forEach((unit) => {
                    unit.legacyCode = unit.legacyCode || unit.code
                    unit.ordinal = ordinal
                    unit.batchOrdinal = ordinal
                    unit.batchPartOrdinal = ordinal
                    unit.batchPartTotal = total
                    unit.receiptQuantity = total
                    unit.batchId = nextGroupId
                    unit.batchGroupId = nextGroupId
                    unit.code = unitCode(product, nextGroupId, ordinal)
                    ordinal += 1
                })
        })
    })

    standaloneByProduct.forEach((lots, productId) => {
        const product = findProduct(productId)
        if (!product) return
        lots.forEach((originalLot) => {
            const lot = state.stockLots.find((item) => item.id === originalLot.id)
            if (!lot) return
            ;(unitsByLot.get(lot.id) || [])
                .slice()
                .sort((left, right) => number(left.ordinal) - number(right.ordinal) || String(left.id).localeCompare(String(right.id)))
                .forEach((unit, index) => {
                    const ordinal = index + 1
                    unit.legacyCode = unit.legacyCode || unit.code
                    unit.ordinal = ordinal
                    unit.batchOrdinal = ordinal
                    unit.batchPartOrdinal = undefined
                    unit.batchPartTotal = undefined
                    unit.receiptQuantity = number(lot.receivedQuantity) || (unitsByLot.get(lot.id) || []).length
                    unit.batchId = lot.batchNumber
                    unit.batchGroupId = ''
                    unit.code = unitCode(product, lot.batchNumber, ordinal)
                })
        })
    })

    state.receipts.forEach((receipt) => {
        ;(receipt.lines || []).forEach((line) => {
            const mapping = lotMappings.get(line.lotId)
            if (mapping) line.batchNumber = mapping.next
        })
        const registeredMapping = (receipt.lines || [])
            .map((line) => lotMappings.get(line.lotId))
            .find((mapping) => mapping?.registered)
        if (registeredMapping) {
            receipt.batchNumber = registeredMapping.next
            receipt.batchGroupId = registeredMapping.next
            receipt.batchQrCode = `IMS:BATCH:${registeredMapping.next}`
        } else {
            receipt.batchGroupId = ''
            receipt.batchQrCode = ''
        }
    })

    state.shipments.forEach((shipment) => {
        if (shipment.batchGroupId && groupIdMappings.has(shipment.batchGroupId)) {
            shipment.batchGroupId = groupIdMappings.get(shipment.batchGroupId)
        }
        ;(shipment.lines || []).forEach((line) => {
            const mapping = lotMappings.get(line.lotId)
            if (mapping) line.batchNumber = mapping.next
        })
        ;(shipment.labelUnits || []).forEach((unit) => {
            const mapping = lotMappings.get(unit.lotId)
            const product = findProduct(unit.productId || shipment.productId)
            if (!mapping || !product || unit.sharedProductBarcode) return
            unit.batchId = mapping.next
            const ordinal = number(unit.batchOrdinal || unit.ordinal)
            if (ordinal > 0) unit.code = unitCode(product, mapping.next, ordinal)
        })
        shipment.unitCodes = (shipment.unitIds || [])
            .map((unitId) => state.stockUnits.find((unit) => unit.id === unitId)?.code)
            .filter(Boolean)
        shipment.labelCodes = (shipment.labelUnits || []).map((unit) => unit.code).filter(Boolean)
    })

    state.transfers.forEach((transfer) => {
        transfer.unitCodes = (transfer.unitIds || [])
            .map((unitId) => state.stockUnits.find((unit) => unit.id === unitId)?.code)
            .filter(Boolean)
    })

    state.movements.forEach((movement) => {
        const mapping = lotMappings.get(movement.lotId)
        if (mapping) {
            movement.batch = mapping.next
            movement.batchId = mapping.next
        }
        if (movement.batchGroupId && groupIdMappings.has(movement.batchGroupId)) {
            movement.batchGroupId = groupIdMappings.get(movement.batchGroupId)
        }
        movement.unitCodes = (movement.unitIds || [])
            .map((unitId) => state.stockUnits.find((unit) => unit.id === unitId)?.code)
            .filter(Boolean)
    })
}

function migrateProductLabelCodes() {
    const replaceLegacyProductCode = (value, product, lot) => {
        if (!product || !lot || isRegisteredBatchLot(lot)) return value
        const normalized = normalizeCode(value)
        const legacyCodes = [product.bar, product.sku]
            .map(normalizeCode)
            .filter(Boolean)
        return !normalized || legacyCodes.includes(normalized)
            ? stockLayerCode(product, lot)
            : value
    }

    state.shipments.forEach((shipment) => {
        ;(shipment.labelUnits || []).forEach((unit) => {
            if (!unit.sharedProductBarcode) return
            const product = state.products.find((item) => item.id === (unit.productId || shipment.productId))
            const lot = state.stockLots.find((item) => item.id === unit.lotId)
            const nextCode = replaceLegacyProductCode(unit.code, product, lot)
            if (nextCode === unit.code) return
            unit.legacyCode = unit.legacyCode || unit.code || ''
            unit.code = nextCode
        })
        shipment.labelCodes = (shipment.labelUnits || []).map((unit) => unit.code).filter(Boolean)
    })

    state.labelPrints.forEach((printJob) => {
        ;(printJob.items || []).forEach((item) => {
            const product = state.products.find((entry) => entry.id === item.productId)
            const lot = state.stockLots.find((entry) => entry.id === item.lotId)
            const nextCode = replaceLegacyProductCode(item.unitCode, product, lot)
            if (nextCode === item.unitCode) return
            item.legacyUnitCode = item.legacyUnitCode || item.unitCode || ''
            item.unitCode = nextCode
        })
    })

    state.movements.forEach((movement) => {
        const product = state.products.find((item) => item.id === movement.productId)
        const lot = state.stockLots.find((item) => item.id === movement.lotId)
        movement.unitCodes = (movement.unitCodes || []).map((code) =>
            replaceLegacyProductCode(code, product, lot),
        )
    })
}

function inventoryStateSnapshot() {
    return clone({
        products: state.products,
        movements: state.movements,
        stockUnits: state.stockUnits,
        shipments: state.shipments,
        receipts: state.receipts,
        stockLots: state.stockLots,
        stockPositions: state.stockPositions,
        transfers: state.transfers,
        stockInRequests: state.stockInRequests,
        labelPrints: state.labelPrints,
        batchDefinitions: state.batchDefinitions,
        stockCounts: state.stockCounts,
    })
}

function restoreInventorySnapshot(snapshot, productRefs) {
    snapshot.products.forEach((savedProduct) => {
        const reference = productRefs.get(savedProduct.id)
        if (!reference) return
        Object.keys(reference).forEach((key) => delete reference[key])
        Object.assign(reference, clone(savedProduct))
    })
    state.products = snapshot.products.map(
        (product) => productRefs.get(product.id) || product,
    )
    state.movements = snapshot.movements
    state.stockUnits = snapshot.stockUnits
    state.shipments = snapshot.shipments
    state.receipts = snapshot.receipts
    state.stockLots = snapshot.stockLots
    state.stockPositions = snapshot.stockPositions
    state.transfers = snapshot.transfers
    state.stockInRequests = snapshot.stockInRequests || []
    state.labelPrints = snapshot.labelPrints || []
    state.batchDefinitions = snapshot.batchDefinitions || []
    state.stockCounts = snapshot.stockCounts || []
}

function runInventoryTransaction(mutate) {
    const snapshot = inventoryStateSnapshot()
    const productRefs = new Map(
        state.products.map((product) => [product.id, product]),
    )
    try {
        const result = mutate()
        syncDerivedInventory()
        persistInventory()
        return result
    } catch (error) {
        restoreInventorySnapshot(snapshot, productRefs)
        throw error
    }
}

function requireUsableLocation(warehouseId, locationValue) {
    const warehouse = findWarehouse(warehouseId)
    if (!warehouse || !warehouse.active)
        throw new Error('Choose an active warehouse.')
    const location = findLocation(warehouse.id, locationValue)
    if (!location || !location.active || location.status === 'unavailable')
        throw new Error('Choose an available storage location.')
    return { warehouse, location }
}

function assertCapacity(location, warehouseId, product, quantity) {
    const metrics = locationMetrics(warehouseId, location.id)
    if (!metrics?.capacityConfigured) return
    if (
        location.capacityUnit !== 'units' &&
        location.capacityUnit !== product.unit
    )
        throw new Error(
            `This location accepts ${location.capacityUnit}, not ${product.unit}.`,
        )
    if (
        metrics.usedCapacity !== null &&
        metrics.usedCapacity + quantity > number(location.capacityValue)
    )
        throw new Error('This location does not have enough capacity.')
}

function receiveStock(payload) {
    if (!can(PERMISSIONS.RECEIVE_STOCK))
        throw new Error('You do not have permission to receive stock.')
    const product = findProduct(payload.productId)
    if (!product) throw new Error('The selected product no longer exists.')
    if (product.active === false && payload.allowInactiveProduct !== true)
        throw new Error('Select an active product.')
    const supplierStockIn = payload.stockInType === 'supplier' || payload.supplierStockIn === true
    const supplier = supplierStockIn
        ? findSupplier(payload.supplierId || payload.supplier)
        : null
    if (supplierStockIn && !supplier)
        throw new Error('Choose a supplier from Supplier Management.')
    if (supplier && supplier.status !== 'active')
        throw new Error('This supplier is unavailable for new receiving.')
    const quantity = number(payload.quantity)
    if (quantity <= 0)
        throw new Error('Quantity received must be greater than zero.')
    if (product.trackingMode === 'unit' && !Number.isInteger(quantity))
        throw new Error('Unit-level tracking requires a whole-number quantity.')
    const { warehouse, location } = requireUsableLocation(
        payload.warehouseId || 'wh-main',
        payload.locationId || payload.location,
    )
    assertCapacity(location, warehouse.id, product, quantity)
    const suppliedBatch = payload.forceBatch
        ? ''
        : String(payload.supplierBatchNumber || payload.batch || payload.batchNumber || '').trim()
    const batchNumber = payload.forceBatch
        ? String(payload.internalBatchNumber || payload.batch || payload.batchNumber || nextBatchNumber()).trim()
        : nextStandaloneLayerNumber(product)
    const before = productStock(product.id)
    const receiptId = nextDocumentId('RCV', state.receipts)

    return runInventoryTransaction(() => {
        const receipt = {
            id: receiptId,
            receiptNumber: receiptId,
            stockInType: supplierStockIn ? 'supplier' : 'standard',
            supplierId: supplier?.id || '',
            supplierName: supplier?.name || '',
            supplierAddress: String(payload.supplierAddress || supplier?.address || '').trim(),
            warehouseAddress: String(warehouse.address || '').trim(),
            receivedDate:
                payload.receivingDate || nowIso().slice(0, 10),
            receivedBy: currentStaff()?.employeeId || 'SYSTEM',
            receivedByName: currentStaff()?.name || 'System',
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            locationId: location.id,
            location: location.name,
            invoiceNumber: String(payload.invoiceNumber || '').trim(),
            purchaseOrderNumber: String(
                payload.purchaseOrderNumber || '',
            ).trim(),
            remark: String(payload.remark || '').trim(),
            lines: [],
            createdAt: nowIso(),
        }
        const lot = {
            id: `lot-${product.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            productId: product.id,
            batchNumber,
            supplierBatchNumber: suppliedBatch,
            receiptId: receipt.id,
            receivedQuantity: quantity,
            availableQuantity: 0,
            receivedDate: receipt.receivedDate,
            manufacturingDate: payload.manufacturingDate || '',
            expiryDate: payload.expiryDate || '',
            isBatch: Boolean(payload.forceBatch),
            batchGroupId: payload.forceBatch ? batchNumber : '',
            createdAt: nowIso(),
        }
        state.stockLots.push(lot)
        let position = state.stockPositions.find(
            (item) =>
                item.lotId === lot.id &&
                item.warehouseId === warehouse.id &&
                item.locationId === location.id,
        )
        if (!position) {
            position = {
                id: `pos-${lot.id}-${location.id}`,
                productId: product.id,
                lotId: lot.id,
                warehouseId: warehouse.id,
                warehouseName: warehouse.name,
                locationId: location.id,
                location: location.name,
                unit: product.unit,
                availableQuantity: 0,
                createdAt: nowIso(),
                updatedAt: nowIso(),
            }
            state.stockPositions.push(position)
        }
        position.availableQuantity =
            number(position.availableQuantity) + quantity
        position.updatedAt = nowIso()
        const receiptLine = {
            id: `${receipt.id}-01`,
            receiptId: receipt.id,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            lotId: lot.id,
            batchNumber,
            positionId: position.id,
            warehouseId: warehouse.id,
            locationId: location.id,
            quantity,
            unit: product.unit,
        }
        receipt.lines.push(receiptLine)
        state.receipts.unshift(receipt)
        const stockUnits =
            product.trackingMode === 'unit'
                ? createStockUnits(
                      product,
                      lot,
                      position,
                      quantity,
                      warehouse,
                      location,
                      receipt,
                      receiptLine,
                  )
                : []
        if (product.trackingMode === 'unit') assertTrackedUnitBalances(product.id)
        if (supplier) {
            product.supplierId = supplier.id
            product.supplier = supplier.name
        }
        product.lastStockIn = nowIso()
        const movement = recordMovement(product, {
            batch: batchNumber,
            batchId: batchNumber,
            lotId: lot.id,
            beforeQuantity: before,
            changedQuantity: quantity,
            afterQuantity: before + quantity,
            type: 'Stock In',
            reason: supplierStockIn ? 'Supplier Delivery' : 'Stock Receipt',
            supplierId: supplier?.id || '',
            stockInType: supplierStockIn ? 'supplier' : 'standard',
            warehouseId: warehouse.id,
            locationId: location.id,
            receiptId: receipt.id,
            reference:
                payload.invoiceNumber || payload.purchaseOrderNumber,
            remark: payload.remark,
            photo: payload.photo,
            unitIds: stockUnits.map((unit) => unit.id),
            unitCodes: stockUnits.map((unit) => unit.code),
        })
        return {
            product,
            movement,
            receipt,
            receiptLine,
            lot,
            position,
            before,
            after: before + quantity,
            batchId: batchNumber,
            stockUnits,
        }
    })
}

function nextReceiptBatchNumber(productId = '') {
    const product = findProduct(productId)
    return product ? nextStandaloneLayerNumber(product) : 'L01'
}

function receiveStockBatch(payload) {
    const isBatch = Boolean(payload.forceBatch)
    const requestedBatchNumber = String(payload.batch || payload.batchNumber || '').trim()
    const definition = isBatch
        ? state.batchDefinitions.find((item) => item.id === requestedBatchNumber)
        : null
    const hasExplicitBatchCount = payload.batchCount !== undefined && payload.batchCount !== null && payload.batchCount !== ''
    const batchCount = isBatch && definition && hasExplicitBatchCount
        ? Math.max(0, Math.floor(number(payload.batchCount)))
        : 0
    const registeredRecipe = definition?.items?.length ? definition.items : (payload.items || [])
    const sourceItems = isBatch && definition && hasExplicitBatchCount
        ? registeredRecipe.map((item) => ({
              productId: item.productId,
              quantity: number(item.quantity) * batchCount,
          }))
        : (payload.items || [])
    if (isBatch && definition && hasExplicitBatchCount && !(batchCount > 0))
        throw new Error('Enter how many complete batches are being received.')
    const mergedItems = new Map()
    ;sourceItems.forEach((item) => {
        const productId = String(item.productId || '').trim()
        if (!productId) return
        const current = mergedItems.get(productId) || { productId, quantity: 0 }
        current.quantity += number(item.quantity)
        mergedItems.set(productId, current)
    })
    const items = [...mergedItems.values()].filter((item) => item.quantity > 0)
    if (!items.length) throw new Error('Add at least one product to this batch.')
    const totalQuantity = items.reduce((sum, item) => sum + number(item.quantity), 0)
    const batchNumber =
        requestedBatchNumber ||
        (isBatch
            ? nextBatchNumber()
            : nextReceiptBatchNumber(items[0]?.productId || ''))
    const snapshot = inventoryStateSnapshot()
    const productRefs = new Map(state.products.map((product) => [product.id, product]))
    try {
        const results = items.map((item) => receiveStock({
            ...payload,
            ...item,
            forceBatch: isBatch,
            internalBatchNumber: batchNumber,
            supplierBatchNumber: '',
        }))
        results.forEach((result, index) => {
            // Older registered batches may only contain productIds. Use the
            // normalized recipe prepared above instead of assuming items exists.
            const recipeSnapshot = (isBatch ? registeredRecipe : items).map((item) => ({
                productId: item.productId,
                quantity: number(item.quantity || item.recipeQuantity || 1),
            }))
            result.receipt.batchNumber = batchNumber
            result.receipt.batchGroupId = isBatch ? batchNumber : ''
            result.receipt.batchLine = index + 1
            result.receipt.batchProductCount = results.length
            result.receipt.isBatch = isBatch
            result.receipt.batchQrCode = isBatch ? `IMS:BATCH:${batchNumber}` : ''
            result.receipt.batchTotalParts = isBatch ? totalQuantity : 0
            result.receipt.batchCount = isBatch ? (batchCount || 1) : 0
            result.receipt.batchRecipeSnapshot = isBatch ? recipeSnapshot : []
            result.receipt.batchRecipeVersion = isBatch ? Math.max(1, number(definition?.recipeVersion) || 1) : 0
            result.lot.batchGroupId = isBatch ? batchNumber : ''
            result.lot.isBatch = isBatch
            result.lot.batchQrCode = isBatch ? `IMS:BATCH:${batchNumber}` : ''
            result.lot.batchTotalParts = isBatch ? totalQuantity : 0
            result.lot.batchCount = isBatch ? (batchCount || 1) : 0
            result.lot.batchRecipeSnapshot = isBatch ? recipeSnapshot : []
            result.lot.batchRecipeVersion = isBatch ? Math.max(1, number(definition?.recipeVersion) || 1) : 0
            if (isBatch && result.movement) {
                result.movement.batchCount = batchCount || 1
                result.movement.batchRecipeSnapshot = recipeSnapshot
                result.movement.batchRecipeVersion = Math.max(1, number(definition?.recipeVersion) || 1)
            }
        })
        if (isBatch) {
            const newUnitIds = new Set(results.flatMap((result) => result.stockUnits.map((unit) => unit.id)))
            const batchLotIds = new Set(
                state.stockLots
                    .filter((lot) => lot.isBatch && lot.batchGroupId === batchNumber)
                    .map((lot) => lot.id),
            )
            const existingBatchUnits = state.stockUnits.filter(
                (unit) => batchLotIds.has(unit.lotId) && !newUnitIds.has(unit.id),
            )
            let batchPartOrdinal = Math.max(
                0,
                ...existingBatchUnits.map((unit) =>
                    number(unit.batchPartOrdinal || unit.batchOrdinal || unit.ordinal),
                ),
            ) + 1
            results.forEach((result) => {
                result.stockUnits.forEach((unit) => {
                    unit.batchId = batchNumber
                    unit.batchGroupId = batchNumber
                    unit.batchPartOrdinal = batchPartOrdinal
                    unit.ordinal = batchPartOrdinal
                    unit.batchOrdinal = batchPartOrdinal
                    unit.code = unitCode(result.product, batchNumber, batchPartOrdinal)
                    batchPartOrdinal += 1
                })
            })
            const batchReceivedQuantity = state.stockLots
                .filter((lot) => lot.isBatch && lot.batchGroupId === batchNumber)
                .reduce((sum, lot) => sum + number(lot.receivedQuantity), 0)
            state.stockUnits
                .filter((unit) => batchLotIds.has(unit.lotId))
                .forEach((unit) => {
                    unit.batchId = batchNumber
                    unit.batchGroupId = batchNumber
                    unit.batchPartTotal = batchReceivedQuantity
                    unit.receiptQuantity = batchReceivedQuantity
                })
        }
        persistInventory()
        const first = results[0]
        return {
            ...first,
            batchId: batchNumber,
            batchNumber,
            results,
            receipts: results.map((result) => result.receipt),
            productCount: results.length,
            totalQuantity,
            batchCount: isBatch ? (batchCount || 1) : 0,
            batchRecipeSnapshot: isBatch
                ? (definition?.items || items).map((item) => ({ productId: item.productId, quantity: number(item.quantity) }))
                : [],
            isBatch,
            qrCode: isBatch ? `IMS:BATCH:${batchNumber}` : '',
            stockUnits: results.flatMap((result) => result.stockUnits),
        }
    } catch (error) {
        restoreInventorySnapshot(snapshot, productRefs)
        syncDerivedInventory()
        persistInventory()
        throw error
    }
}

function receiveSupplierBatchOrder(payload) {
    if (!can(PERMISSIONS.RECEIVE_STOCK))
        throw new Error('You do not have permission to receive stock.')
    const isSupplierReceipt = payload.stockInType === 'supplier'
    const supplier = findSupplier(payload.supplierId || payload.supplier)
    if (isSupplierReceipt && (!supplier || supplier.status !== 'active'))
        throw new Error('Choose an active supplier from Supplier Management.')

    const batchPayloads = (payload.batches || [])
        .map((entry) => ({
            batchId: String(entry.batchId || entry.batch || '').trim(),
            batchCount: Math.max(0, Math.floor(number(entry.batchCount))),
            items: (entry.items || []).map((item) => ({
                productId: String(item.productId || '').trim(),
                quantity: number(item.quantity),
            })),
        }))
        .filter((entry) => entry.batchId)

    if (!batchPayloads.length) throw new Error('Choose at least one batch.')
    if (new Set(batchPayloads.map((entry) => entry.batchId)).size !== batchPayloads.length)
        throw new Error('Each batch can only be selected once.')

    batchPayloads.forEach((entry) => {
        const batch = findBatch(entry.batchId)
        if (!batch) throw new Error(`Batch ${entry.batchId} was not found.`)
        if (!(entry.batchCount > 0))
            throw new Error(`Enter the number of complete batches for ${entry.batchId}.`)
        const registeredProducts = new Set(
            (batch.items?.length ? batch.items.map((item) => item.productId) : batch.productIds || [])
                .filter(Boolean),
        )
        if (entry.items.some((item) => !registeredProducts.has(item.productId)))
            throw new Error(`${entry.batchId} contains a product that is not registered to this batch.`)
    })

    const snapshot = inventoryStateSnapshot()
    const productRefs = new Map(state.products.map((product) => [product.id, product]))
    try {
        const batchReceipts = batchPayloads.map((entry) => receiveStockBatch({
            ...payload,
            stockInType: isSupplierReceipt ? 'supplier' : 'standard',
            forceBatch: true,
            batch: entry.batchId,
            batchCount: entry.batchCount,
            items: entry.items,
        }))
        const results = batchReceipts.flatMap((entry) => entry.results || [])
        const receipts = batchReceipts.flatMap((entry) => entry.receipts || [])
        const stockUnits = batchReceipts.flatMap((entry) => entry.stockUnits || [])
        const productIds = new Set(results.map((entry) => entry.product?.id).filter(Boolean))
        const totalQuantity = batchReceipts.reduce((sum, entry) => sum + number(entry.totalQuantity), 0)
        const first = batchReceipts[0]
        return {
            ...first,
            batchId: batchReceipts.length === 1 ? first.batchId : `${batchReceipts.length} batches`,
            batchIds: batchReceipts.map((entry) => entry.batchId),
            batchReceipts,
            results,
            receipts,
            stockUnits,
            productCount: productIds.size,
            totalQuantity,
            isBatch: true,
        }
    } catch (error) {
        restoreInventorySnapshot(snapshot, productRefs)
        syncDerivedInventory()
        persistInventory()
        throw error
    }
}

function lotIsExpired(lot, referenceDate = nowIso().slice(0, 10)) {
    return Boolean(lot?.expiryDate && lot.expiryDate < referenceDate)
}

function sortedPositions(productId, filters = {}) {
    return stockPositionsFor(productId, filters)
        .filter((position) => number(position.availableQuantity) > 0)
        .map((position) => ({
            position,
            lot: state.stockLots.find((lot) => lot.id === position.lotId),
        }))
        .filter(({ lot }) => !filters.excludeExpired || !lotIsExpired(lot))
        .sort((left, right) => {
            const leftExpiry = left.lot?.expiryDate || '9999-12-31'
            const rightExpiry = right.lot?.expiryDate || '9999-12-31'
            return (
                leftExpiry.localeCompare(rightExpiry) ||
                String(left.lot?.receivedDate || '').localeCompare(String(right.lot?.receivedDate || '')) ||
                String(left.lot?.createdAt || '').localeCompare(String(right.lot?.createdAt || '')) ||
                String(left.position.id).localeCompare(String(right.position.id))
            )
        })
        .map(({ position }) => position)
}

function allocatePositionQuantity(productId, quantity, filters = {}) {
    const positions = sortedPositions(productId, filters)
    const available = positions.reduce(
        (sum, position) => sum + number(position.availableQuantity),
        0,
    )
    if (quantity > available)
        throw new Error(`Insufficient usable stock. Available: ${available}.`)
    let remaining = quantity
    const allocations = []
    positions.forEach((position) => {
        if (remaining <= 0) return
        const take = Math.min(remaining, number(position.availableQuantity))
        if (take > 0) allocations.push({ position, quantity: take })
        remaining -= take
    })
    return allocations
}

function allocateRequestedReceiptLayers(product, quantity, input, filters = {}) {
    const requests = Array.isArray(input.lotAllocations)
        ? input.lotAllocations
              .map((item) => ({
                  lotId: String(item?.lotId || ''),
                  quantity: number(item?.quantity),
              }))
              .filter((item) => item.lotId && item.quantity > 0)
        : []
    if (!requests.length) return null

    const uniqueLotIds = new Set(requests.map((item) => item.lotId))
    if (uniqueLotIds.size !== requests.length)
        throw new Error('Each receipt layer can only be selected once.')

    const requestedTotal = requests.reduce((sum, item) => sum + item.quantity, 0)
    if (Math.abs(requestedTotal - quantity) > 0.0001)
        throw new Error('Receipt layer quantities must match the ship quantity.')

    return requests.flatMap((request) => {
        const lot = state.stockLots.find((item) => item.id === request.lotId)
        if (
            !lot ||
            lot.productId !== product.id ||
            !matchesStockSource(lot.id, 'standalone')
        )
            throw new Error('Choose a valid product receipt layer.')
        if (lotIsExpired(lot))
            throw new Error('Expired receipt layers cannot be shipped.')

        return allocatePositionQuantity(product.id, request.quantity, {
            ...filters,
            lotId: lot.id,
            stockSource: 'standalone',
            excludeExpired: true,
        })
    })
}

function applyPositionAllocations(allocations) {
    allocations.forEach(({ position, quantity }) => {
        const available = number(position.availableQuantity)
        const requested = number(quantity)
        if (requested <= 0)
            throw new Error('Inventory allocation quantity must be greater than zero.')
        if (requested - available > 0.0001)
            throw new Error('Inventory allocation exceeds the available stock.')
        position.availableQuantity = Math.max(0, available - requested)
        position.updatedAt = nowIso()
    })
}

function validateUnitSelection(product, input, options = {}) {
    const rawIds = Array.isArray(input.unitIds)
        ? input.unitIds.map(String)
        : []
    const uniqueIds = [...new Set(rawIds)]
    if (rawIds.length !== uniqueIds.length)
        throw new Error('This unit has already been selected.')
    const quantity = number(input.quantity)
    if (!Number.isInteger(quantity) || quantity < 1)
        throw new Error('Enter a whole-number quantity.')
    if (uniqueIds.length !== quantity)
        throw new Error(`Scan exactly ${quantity} different unit labels.`)
    const selected = uniqueIds.map((id) => findStockUnit(id))
    if (selected.some((unit) => !unit))
        throw new Error('One or more scanned unit labels were not found.')
    if (
        selected.some(
            (unit) =>
                unit.productId !== product.id ||
                unit.status !== 'available',
        )
    )
        throw new Error('Choose available units that belong to this product.')
    if (
        options.warehouseId &&
        selected.some((unit) => unit.warehouseId !== options.warehouseId)
    )
        throw new Error('A scanned unit is in another warehouse.')
    if (
        options.locationId &&
        selected.some((unit) => unit.locationId !== options.locationId)
    )
        throw new Error('A scanned unit is in another location.')
    if (
        options.lotId &&
        selected.some((unit) => unit.lotId !== options.lotId)
    )
        throw new Error('A scanned unit belongs to another batch.')
    if (
        options.positionId &&
        selected.some((unit) => unit.positionId !== options.positionId)
    )
        throw new Error('A scanned unit belongs to another stock position.')
    if (
        options.stockSource &&
        selected.some((unit) => !matchesStockSource(unit.lotId, options.stockSource))
    )
        throw new Error(
            options.stockSource === 'batch'
                ? 'Choose units from the selected registered batch.'
                : 'Registered batch units must be shipped from Whole batch.',
        )
    const expired = selected.some((unit) => {
        const lot = state.stockLots.find((item) => item.id === unit.lotId)
        return lot?.expiryDate && lot.expiryDate < nowIso().slice(0, 10)
    })
    if (expired) throw new Error('Expired units cannot be shipped.')
    return selected
}

function nextShipmentId() {
    return nextDocumentId('SHP', state.shipments)
}

function previewShipmentAllocation(input) {
    const product = findProduct(input.productId)
    if (!product || !product.active) throw new Error('Select an active product.')
    if (product.trackingMode === 'unit') {
        reconcileTrackedUnitBalances(product.id)
        assertTrackedUnitBalances(product.id)
    }
    const quantity = number(input.quantity)
    if (quantity <= 0) throw new Error('Enter a quantity to ship.')
    const warehouse = findWarehouse(input.sourceWarehouseId || input.warehouseId)
    if (!warehouse || warehouse.active === false) throw new Error('Select an active warehouse.')
    const locationId = String(input.sourceLocationId || input.locationId || '')
    const location = locationId ? findLocation(warehouse.id, locationId) : null
    if (locationId && (!location || location.active === false || location.status === 'unavailable')) {
        throw new Error('Select an active source location.')
    }
    const stockSource = input.stockSource === 'batch' ? 'batch' : 'standalone'
    const isUnitTracked = product.trackingMode === 'unit'
    const selected = isUnitTracked
        ? validateUnitSelection(product, input, {
              warehouseId: warehouse.id,
              ...(location ? { locationId: location.id } : {}),
              ...(input.lotId ? { lotId: String(input.lotId) } : {}),
              ...(input.positionId ? { positionId: String(input.positionId) } : {}),
              stockSource,
          })
        : []
    let allocations = []
    if (isUnitTracked) {
        const counts = new Map()
        selected.forEach((unit) => counts.set(unit.positionId, (counts.get(unit.positionId) || 0) + 1))
        allocations = [...counts].map(([positionId, count]) => {
            const position = state.stockPositions.find((item) => item.id === positionId)
            if (!position || number(position.availableQuantity) < count)
                throw new Error('Tracked unit balance is inconsistent.')
            return { position, quantity: count }
        })
    } else {
        if (stockSource === 'batch' && !input.lotId) {
            throw new Error('Choose a lot from the selected registered batch.')
        }
        if (input.lotId) {
            const selectedLot = state.stockLots.find((lot) => lot.id === String(input.lotId))
            if (!selectedLot || !matchesStockSource(selectedLot.id, stockSource)) {
                throw new Error(
                    stockSource === 'batch'
                        ? 'Choose a lot from the selected registered batch.'
                        : 'Registered batch stock must be shipped from Whole batch.',
                )
            }
        }
        const allocationFilters = {
            warehouseId: warehouse.id,
            ...(location ? { locationId: location.id } : {}),
            ...(input.positionId ? { positionId: String(input.positionId) } : {}),
        }
        const requestedReceiptLayers = stockSource === 'standalone'
            ? allocateRequestedReceiptLayers(product, quantity, input, allocationFilters)
            : null
        allocations = requestedReceiptLayers || allocatePositionQuantity(product.id, quantity, {
            ...allocationFilters,
            ...(input.lotId ? { lotId: String(input.lotId) } : {}),
            stockSource,
            excludeExpired: true,
        })
    }
    const lines = allocations.map(({ position, quantity: lineQuantity }) => {
        const lot = state.stockLots.find((item) => item.id === position.lotId)
        const lineLocation = findLocation(position.warehouseId, position.locationId)
        return {
            lotId: position.lotId,
            layerCode: lot?.batchNumber || '',
            batchNumber: lot?.batchNumber || '',
            positionId: position.id,
            warehouseId: position.warehouseId,
            warehouseName: findWarehouse(position.warehouseId)?.name || position.warehouseName || warehouse.name,
            locationId: position.locationId,
            locationName: lineLocation?.name || position.location || 'Not assigned',
            receivedDate: lot?.receivedDate || '',
            expiryDate: lot?.expiryDate || '',
            quantity: lineQuantity,
        }
    })
    const allocationMethod = stockSource === 'batch'
        ? 'Exact registered batch'
        : Array.isArray(input.lotAllocations) && input.lotAllocations.some((item) => number(item?.quantity) > 0)
            ? String(input.allocationMethod || 'Manual receipt layers')
            : 'FEFO/FIFO'
    return { product, warehouse, location, stockSource, quantity, selected, allocations, lines, allocationMethod }
}

function createShipment(input) {
    if (!can(PERMISSIONS.ISSUE_STOCK))
        throw new Error('You do not have permission to issue stock.')
    const preview = previewShipmentAllocation(input)
    const { product, warehouse, location, stockSource, quantity, selected, allocations, allocationMethod } = preview
    const before = productStock(product.id, { stockSource })
    const totalBeforeQuantity = productStock(product.id)
    const shipmentId = nextShipmentId()
    const isUnitTracked = product.trackingMode === 'unit'
    const sourceBeforeQuantity = allocations.reduce(
        (sum, allocation) => sum + number(allocation.position?.availableQuantity),
        0,
    )

    return runInventoryTransaction(() => {
        applyPositionAllocations(allocations)
        if (isUnitTracked) {
            selected.forEach((unit) => {
                unit.status = 'shipped'
                unit.shipmentId = shipmentId
                unit.shippedAt = nowIso()
                unit.shippedBy = currentStaff()?.employeeId || 'SYSTEM'
            })
            assertTrackedUnitBalances(product.id)
        }
        product.lastStockOut = nowIso()
        const shipmentLines = preview.lines
        const wholeItems = Number.isInteger(quantity) && String(product.unit).toLowerCase() === 'pcs'
        const labelCount = wholeItems ? quantity : 1
        const primaryLine = shipmentLines[0] || {}
        const primaryLot = state.stockLots.find((lot) => lot.id === primaryLine.lotId)
        const isRegisteredBatch = stockSource === 'batch'
        const usedBatchOrdinals = isRegisteredBatch
            ? state.shipments
                  .filter((shipment) =>
                      input.batchGroupId
                          ? shipment.batchGroupId === String(input.batchGroupId)
                          : true,
                  )
                  .flatMap((shipment) => shipment.labelUnits || [])
                  .filter((unit) =>
                      !unit.sharedProductBarcode &&
                      (input.batchGroupId || unit.lotId === primaryLine.lotId),
                  )
                  .map((unit) => number(unit.batchOrdinal || unit.ordinal))
            : []
        const firstBatchOrdinal = Math.max(0, ...usedBatchOrdinals) + 1
        const labelUnits = isUnitTracked
            ? []
            : Array.from({ length: labelCount }, (_, index) => {
                  const shipmentSequence = index + 1
                  const batchOrdinal = firstBatchOrdinal + index
                  const code = isRegisteredBatch
                      ? unitCode(product, primaryLine.batchNumber || primaryLot?.batchNumber || 'B01', batchOrdinal)
                      : stockLayerCode(product, primaryLot || primaryLine.batchNumber)
                  return {
                      id: `${shipmentId}-label-${String(shipmentSequence).padStart(3, '0')}`,
                      code,
                      productId: product.id,
                      lotId: primaryLine.lotId || '',
                      batchId: primaryLine.batchNumber || primaryLot?.batchNumber || '',
                      positionId: primaryLine.positionId || '',
                      warehouseId: warehouse.id,
                      warehouseName: warehouse.name,
                      locationId: primaryLine.locationId || '',
                      location: primaryLine.locationName || location?.name || 'Multiple locations',
                      ordinal: isRegisteredBatch ? batchOrdinal : shipmentSequence,
                      batchOrdinal: isRegisteredBatch ? batchOrdinal : shipmentSequence,
                      receiptQuantity: isRegisteredBatch
                          ? Math.max(number(primaryLot?.receivedQuantity), batchOrdinal)
                          : labelCount,
                      displayOrdinal: shipmentSequence,
                      displayTotal: labelCount,
                      displayQuantity: `${quantity} ${product.unit}`,
                      status: 'shipped',
                      shipmentId,
                      virtualLabel: true,
                      sharedProductBarcode: !isRegisteredBatch,
                  }
              })
        const uniqueLocations = [...new Set(shipmentLines.map((line) => line.locationName).filter(Boolean))]
        const shipment = {
            id: shipmentId,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity,
            unit: product.unit,
            sourceWarehouseId: warehouse.id,
            sourceWarehouseName: warehouse.name,
            sourceLocationId: location?.id || '',
            sourceLocation: location?.name || (uniqueLocations.length === 1 ? uniqueLocations[0] : 'Multiple locations'),
            unitIds: selected.map((unit) => unit.id),
            unitCodes: selected.map((unit) => unit.code),
            labelUnits,
            labelCodes: isUnitTracked
                ? selected.map((unit) => unit.code)
                : labelUnits.map((unit) => unit.code),
            labelCopies: Math.max(1, Math.round(number(input.labelCopies) || 1)),
            lines: shipmentLines,
            allocationMethod,
            recipient: String(input.recipient || input.destination || '').trim(),
            destination: String(input.recipient || input.destination || '').trim(),
            reference: String(input.reference || '').trim(),
            remark: String(input.remark || '').trim(),
            status: 'shipped',
            stockSource,
            batchGroupId: stockSource === 'batch' ? String(input.batchGroupId || '') : '',
            batchShipmentId: String(input.batchShipmentId || ''),
            batchCount: Math.max(0, number(input.batchCount)),
            batchRecipeSnapshot: Array.isArray(input.batchRecipeSnapshot)
                ? clone(input.batchRecipeSnapshot)
                : [],
            shippedBy: currentStaff()?.employeeId || 'SYSTEM',
            shippedByName: currentStaff()?.name || 'System',
            createdAt: nowIso(),
        }
        state.shipments.unshift(shipment)
        const totalAfterQuantity = productStock(product.id)
        recordMovement(product, {
            batch: shipment.lines.map((line) => line.batchNumber).filter(Boolean).join(', '),
            lotId: shipment.lines.length === 1 ? shipment.lines[0].lotId : '',
            beforeQuantity: before,
            changedQuantity: -quantity,
            afterQuantity: before - quantity,
            totalBeforeQuantity,
            totalAfterQuantity,
            type: 'Shipment',
            reason: 'Shipment',
            sourceWarehouseId: warehouse.id,
            sourceLocationId: location?.id || '',
            shipmentId: shipment.id,
            batchShipmentId: shipment.batchShipmentId,
            batchCount: shipment.batchCount,
            sourceBeforeQuantity,
            sourceAfterQuantity: sourceBeforeQuantity - quantity,
            sourceBalanceRecorded: true,
            stockSource,
            batchGroupId: shipment.batchGroupId,
            reference: shipment.reference,
            remark: shipment.remark,
            unitIds: shipment.unitIds,
            unitCodes: shipment.unitCodes,
        })
        return shipment
    })
}

function previewBatchShipment(input) {
    if (!can(PERMISSIONS.ISSUE_STOCK))
        throw new Error('You do not have permission to issue stock.')
    reconcileTrackedUnitBalances()
    const batch = findBatch(input.batchId || input.code || input.qrCode)
    if (!batch) throw new Error('Select an available batch.')
    if (!(batch.availableQuantity > 0))
        throw new Error('This batch has no stock available to ship.')

    const legacyWholeBatch = input.batchCount === undefined || input.batchCount === null || input.batchCount === ''
    const requestedBatchCount = legacyWholeBatch
        ? Math.max(1, number(batch.availableBatchCount) || 1)
        : Math.max(1, Math.floor(number(input.batchCount) || 1))
    if (!legacyWholeBatch && requestedBatchCount > number(batch.availableBatchCount))
        throw new Error(`Only ${batch.availableBatchCount} complete batch${batch.availableBatchCount === 1 ? '' : 'es'} are available.`)
    const plans = []
    batch.items.forEach((item) => {
        const product = findProduct(item.productId)
        if (!product || !product.active)
            throw new Error(`Product ${item.sku || item.productId} is unavailable.`)
        let remainingForItem = legacyWholeBatch
            ? number(item.availableQuantity)
            : number(item.recipeQuantity) * requestedBatchCount
        item.positions.forEach((positionSummary) => {
            if (remainingForItem <= 0) return
            const position = state.stockPositions.find(
                (candidate) => candidate.id === positionSummary.id,
            )
            if (!position)
                throw new Error('A batch stock position could not be found.')
            const quantity = Math.min(number(position.availableQuantity), remainingForItem)
            if (!(quantity > 0)) return
            const lot = state.stockLots.find((candidate) => candidate.id === position.lotId)
            if (
                !lot ||
                lot.productId !== product.id ||
                !isRegisteredBatchLot(lot) ||
                lot.batchGroupId !== batch.id
            )
                throw new Error('A batch stock position is linked to the wrong receipt layer.')

            if (product.trackingMode === 'unit' && !Number.isInteger(quantity))
                throw new Error(`${product.name} is unit-tracked and requires whole quantities in the batch recipe.`)
            const unitIds = product.trackingMode === 'unit'
                ? availableStockUnits(product.id, {
                      positionId: position.id,
                      warehouseId: position.warehouseId,
                      locationId: position.locationId,
                      lotId: position.lotId,
                      stockSource: 'batch',
                  }).map((unit) => unit.id)
                    .slice(0, Math.floor(quantity))
                : []
            if (product.trackingMode === 'unit' && unitIds.length !== quantity)
                throw new Error(
                    `Tracked unit balance is inconsistent at ${findLocation(position.warehouseId, position.locationId)?.name || 'this location'}. Position stock: ${quantity}; available units: ${unitIds.length}.`,
                )

            const shipmentInput = {
                productId: product.id,
                quantity,
                positionId: position.id,
                sourceWarehouseId: position.warehouseId,
                sourceLocationId: position.locationId,
                lotId: position.lotId,
                unitIds,
                recipient: input.recipient,
                reference: input.reference,
                remark: input.remark,
                stockSource: 'batch',
                batchGroupId: batch.id,
            }
            const shipmentPreview = previewShipmentAllocation(shipmentInput)
            if (
                shipmentPreview.allocations.length !== 1 ||
                shipmentPreview.allocations[0].position.id !== position.id ||
                Math.abs(number(shipmentPreview.allocations[0].quantity) - quantity) > 0.0001
            )
                throw new Error('The batch shipment allocation does not match its stock position.')
            plans.push({
                ...shipmentInput,
                productName: product.name,
                sku: product.sku,
                unit: product.unit,
                warehouseName: shipmentPreview.warehouse.name,
                locationName: shipmentPreview.location?.name || position.location || 'Not assigned',
            })
            remainingForItem -= quantity
        })
        if (remainingForItem > 0.0001)
            throw new Error(`${item.productName} does not have enough stock for ${requestedBatchCount} complete batches.`)
    })

    const totalQuantity = plans.reduce((sum, plan) => sum + number(plan.quantity), 0)
    if (!(totalQuantity > 0))
        throw new Error('This batch has no stock available to ship.')
    const expectedQuantity = legacyWholeBatch
        ? number(batch.availableQuantity)
        : batch.items.reduce((sum, item) => sum + number(item.recipeQuantity), 0) * requestedBatchCount
    if (Math.abs(totalQuantity - expectedQuantity) > 0.0001)
        throw new Error('The batch quantity does not match its fixed recipe.')

    return {
        batch,
        plans,
        productCount: new Set(plans.map((plan) => plan.productId)).size,
        positionCount: plans.length,
        totalQuantity,
        batchCount: requestedBatchCount,
        recipeSnapshot: batch.items.map((item) => ({ productId: item.productId, quantity: number(item.recipeQuantity) })),
    }
}

function createBatchShipment(input) {
    const preview = previewBatchShipment(input)
    const { batch, plans } = preview
    const snapshot = inventoryStateSnapshot()
    const productRefs = new Map(state.products.map((product) => [product.id, product]))
    const batchShipmentId = nextBatchShipmentId()
    try {
        const shipments = plans.map((plan) => {
            const shipment = createShipment({
                ...plan,
                batchShipmentId,
                batchCount: preview.batchCount,
                batchRecipeSnapshot: preview.recipeSnapshot,
            })
            shipment.batchGroupId = batch.id
            shipment.batchShipmentId = batchShipmentId
            shipment.batchCount = preview.batchCount
            shipment.batchRecipeSnapshot = preview.recipeSnapshot
            return shipment
        })
        const shippedQuantity = shipments.reduce(
            (sum, shipment) => sum + number(shipment.quantity),
            0,
        )
        if (Math.abs(shippedQuantity - preview.totalQuantity) > 0.0001)
            throw new Error('The completed batch shipment quantity is inconsistent.')
        persistInventory()
        return {
            id: batchShipmentId,
            batchId: batch.id,
            batchQrCode: batch.qrCode,
            shipments,
            productCount: preview.productCount,
            positionCount: preview.positionCount,
            totalQuantity: shippedQuantity,
            batchCount: preview.batchCount,
            batchRecipeSnapshot: preview.recipeSnapshot,
            createdAt: nowIso(),
        }
    } catch (error) {
        restoreInventorySnapshot(snapshot, productRefs)
        syncDerivedInventory()
        persistInventory()
        throw error
    }
}

function voidShipment(input) {
    if (!can(PERMISSIONS.ISSUE_STOCK))
        throw new Error('You do not have permission to void shipments.')
    const shipmentId = String(input?.shipmentId || input?.id || input || '')
    const selectedShipment = state.shipments.find((shipment) => shipment.id === shipmentId)
    if (!selectedShipment) throw new Error('Shipment not found.')
    if (selectedShipment.status === 'voided') throw new Error('This shipment has already been voided.')
    if (selectedShipment.status !== 'shipped') throw new Error('Only completed shipments can be voided.')
    const reason = String(input?.reason || '').trim()
    if (!reason) throw new Error('Enter a reason for voiding this shipment.')

    const shipments = selectedShipment.batchShipmentId
        ? state.shipments.filter(
              (shipment) =>
                  shipment.batchShipmentId === selectedShipment.batchShipmentId &&
                  shipment.status === 'shipped',
          )
        : [selectedShipment]

    return runInventoryTransaction(() => {
        const voidedAt = nowIso()
        const operator = currentStaff()
        const movements = shipments.map((shipment) => {
            const product = findProduct(shipment.productId)
            if (!product) throw new Error('The shipped product no longer exists.')
            const stockSource = shipment.stockSource === 'batch' ? 'batch' : 'standalone'
            const before = productStock(product.id, { stockSource })
            const totalBeforeQuantity = productStock(product.id)

            ;(shipment.lines || []).forEach((line) => {
                const position = state.stockPositions.find((item) => item.id === line.positionId)
                if (!position) throw new Error(`The original stock position for ${product.name} no longer exists.`)
                position.availableQuantity = number(position.availableQuantity) + number(line.quantity)
                position.updatedAt = voidedAt
            })
            ;(shipment.unitIds || []).forEach((unitId) => {
                const unit = findStockUnit(unitId)
                if (!unit || unit.shipmentId !== shipment.id || unit.status !== 'shipped')
                    throw new Error(`A shipped unit for ${product.name} cannot be restored safely.`)
                unit.status = 'available'
                unit.shipmentId = ''
                unit.shippedAt = ''
                unit.shippedBy = ''
                unit.voidedShipmentId = shipment.id
                unit.voidedAt = voidedAt
            })
            ;(shipment.labelUnits || []).forEach((label) => {
                label.status = 'voided'
                label.voidedAt = voidedAt
            })

            shipment.status = 'voided'
            shipment.voidReason = reason
            shipment.voidedAt = voidedAt
            shipment.voidedBy = operator?.employeeId || 'SYSTEM'
            shipment.voidedByName = operator?.name || 'System'
            product.lastStockIn = voidedAt
            const totalAfterQuantity = productStock(product.id)
            return recordMovement(product, {
                batch: (shipment.lines || []).map((line) => line.batchNumber).filter(Boolean).join(', '),
                lotId: shipment.lines?.length === 1 ? shipment.lines[0].lotId : '',
                beforeQuantity: before,
                changedQuantity: number(shipment.quantity),
                afterQuantity: before + number(shipment.quantity),
                totalBeforeQuantity,
                totalAfterQuantity,
                type: 'Shipment Void',
                reason: 'Shipment Void',
                sourceWarehouseId: shipment.sourceWarehouseId,
                sourceLocationId: shipment.sourceLocationId,
                shipmentId: shipment.id,
                stockSource,
                batchGroupId: shipment.batchGroupId,
                reference: shipment.reference,
                remark: reason,
                unitIds: shipment.unitIds,
                unitCodes: shipment.unitCodes,
            })
        })
        reconcileTrackedUnitBalances()
        return {
            shipmentId: selectedShipment.id,
            batchShipmentId: selectedShipment.batchShipmentId || '',
            shipments,
            movements,
            voidedAt,
            reason,
        }
    })
}

function statusForReason(reason) {
    const value = String(reason || '').toLowerCase()
    if (value.includes('damage')) return 'damaged'
    if (value.includes('expire')) return 'expired'
    if (value.includes('lost')) return 'lost'
    return 'private-out'
}

function adjustStock(payload) {
    const isOut = payload.direction === 'out'
    if (!isOut)
        throw new Error('Use Receive Stock for every stock-in operation.')
    if (!can(PERMISSIONS.ISSUE_STOCK))
        throw new Error('You do not have permission to issue stock.')
    const product = findProduct(payload.productId)
    if (!product || !product.active) throw new Error('Select an active product.')
    if (product.trackingMode === 'unit') {
        reconcileTrackedUnitBalances(product.id)
        assertTrackedUnitBalances(product.id)
    }
    const quantity = number(payload.quantity)
    if (quantity <= 0) throw new Error('Quantity must be greater than zero.')
    if (product.trackingMode === 'unit' && !Number.isInteger(quantity))
        throw new Error('Enter a whole-number quantity.')
    const fallbackPosition = sortedPositions(product.id)[0]
    if (!fallbackPosition)
        throw new Error(`Insufficient stock. Available: 0 ${product.unit}.`)
    const { warehouse, location } = requireUsableLocation(
        payload.sourceWarehouseId ||
            payload.warehouseId ||
            fallbackPosition.warehouseId,
        payload.sourceLocationId ||
            payload.locationId ||
            fallbackPosition.locationId,
    )
    const before = productStock(product.id)
    let selected = []
    let allocations = []
    if (product.trackingMode === 'unit') {
        const unitIds =
            Array.isArray(payload.unitIds) && payload.unitIds.length
                ? payload.unitIds
                : availableStockUnits(product.id, {
                      warehouseId: warehouse.id,
                      locationId: location.id,
                  })
                      .sort((a, b) =>
                          String(a.createdAt).localeCompare(
                              String(b.createdAt),
                          ),
                      )
                      .slice(0, quantity)
                      .map((unit) => unit.id)
        selected = validateUnitSelection(
            product,
            { ...payload, quantity, unitIds },
            {
                warehouseId: warehouse.id,
                locationId: location.id,
                ...(payload.lotId ? { lotId: String(payload.lotId) } : {}),
                ...(payload.positionId ? { positionId: String(payload.positionId) } : {}),
                ...(payload.stockSource ? { stockSource: String(payload.stockSource) } : {}),
            },
        )
        const counts = new Map()
        selected.forEach((unit) =>
            counts.set(
                unit.positionId,
                (counts.get(unit.positionId) || 0) + 1,
            ),
        )
        allocations = [...counts].map(([positionId, count]) => ({
            position: state.stockPositions.find(
                (item) => item.id === positionId,
            ),
            quantity: count,
        }))
    } else {
        allocations = allocatePositionQuantity(product.id, quantity, {
            warehouseId: warehouse.id,
            locationId: location.id,
            lotId: payload.lotId || '',
            ...(payload.positionId ? { positionId: String(payload.positionId) } : {}),
            ...(payload.stockSource ? { stockSource: String(payload.stockSource) } : {}),
        })
    }
    const unitStatus = statusForReason(payload.reason)
    const movementType =
        unitStatus === 'damaged'
            ? 'Damage'
            : unitStatus === 'expired'
              ? 'Expired'
              : unitStatus === 'lost'
                ? 'Lost'
                : 'Stock Out'

    return runInventoryTransaction(() => {
        applyPositionAllocations(allocations)
        selected.forEach((unit) => {
            unit.status = unitStatus
            unit.outboundReference = String(payload.reference || '').trim()
            unit.outboundAt = nowIso()
        })
        if (product.trackingMode === 'unit') assertTrackedUnitBalances(product.id)
        product.lastStockOut = nowIso()
        const movement = recordMovement(product, {
            batch: payload.batch,
            beforeQuantity: before,
            changedQuantity: -quantity,
            afterQuantity: before - quantity,
            type: movementType,
            reason: payload.reason || 'Private Use',
            sourceWarehouseId: warehouse.id,
            sourceLocationId: location.id,
            reference: payload.reference,
            remark: payload.remark,
            photo: payload.photo,
            stockSource: payload.stockSource || '',
            batchGroupId: payload.batchGroupId || '',
            batchId: payload.batchGroupId || payload.batch || '',
            batchRemovalId: payload.batchRemovalId || '',
            unitIds: selected.map((unit) => unit.id),
            unitCodes: selected.map((unit) => unit.code),
        })
        return {
            product,
            movement,
            before,
            after: before - quantity,
            stockUnits: selected,
        }
    })
}

function findStockInRequest(value) {
    const key = String(value || '').trim()
    return state.stockInRequests.find((request) => request.id === key) || null
}

function warehouseRequestSnapshot(warehouse) {
    if (!warehouse) return null
    return {
        id: warehouse.id,
        code: warehouse.code,
        name: warehouse.name,
        companyName: String(warehouse.companyName || '').trim(),
        address: String(warehouse.address || '').trim(),
        contactName: String(warehouse.contactName || '').trim(),
        phone: String(warehouse.phone || '').trim(),
    }
}

function batchWarehouseAvailability(batchOrId, warehouseId, locationId = '') {
    const batch = typeof batchOrId === 'object' ? batchOrId : findBatch(batchOrId)
    const warehouse = findWarehouse(warehouseId)
    if (!batch) throw new Error('Select a registered batch.')
    if (!warehouse) throw new Error('Select the source warehouse.')
    const lotIds = new Set(
        state.stockLots
            .filter((lot) => isRegisteredBatchLot(lot) && lot.batchGroupId === batch.id)
            .map((lot) => lot.id),
    )
    const positions = state.stockPositions.filter(
        (position) =>
            lotIds.has(position.lotId) &&
            position.warehouseId === warehouse.id &&
            (!locationId || position.locationId === locationId) &&
            number(position.availableQuantity) > 0,
    )
    const availableByProduct = new Map()
    positions.forEach((position) => {
        availableByProduct.set(
            position.productId,
            (availableByProduct.get(position.productId) || 0) + number(position.availableQuantity),
        )
    })
    const recipeItems = (batch.items || []).filter((item) => number(item.recipeQuantity) > 0)
    const availableBatchCount = recipeItems.length
        ? Math.max(
              0,
              Math.min(
                  ...recipeItems.map((item) =>
                      Math.floor((availableByProduct.get(item.productId) || 0) / number(item.recipeQuantity) + 1e-9),
                  ),
              ),
          )
        : 0
    const location = locationId ? findLocation(warehouse.id, locationId) : null
    return { batch, warehouse, location, positions, availableByProduct, availableBatchCount }
}

function prepareStockInRequestProductItem(item = {}, sourceWarehouse) {
    const product = findProduct(item.productId)
    if (!product || !product.active) throw new Error('Select an active product.')
    const sourceLocation = findLocation(sourceWarehouse.id, item.sourceLocationId)
    if (!sourceLocation || sourceLocation.active === false || sourceLocation.status === 'unavailable')
        throw new Error(`Select an available source location for ${product.name}.`)
    const quantity = number(item.quantity)
    if (!(quantity > 0)) throw new Error(`Enter a quantity for ${product.name}.`)
    const stockFilters = {
        warehouseId: sourceWarehouse.id,
        locationId: sourceLocation.id,
        ...(item.lotId ? { lotId: String(item.lotId) } : {}),
        stockSource: 'standalone',
    }
    const available = productStock(product.id, stockFilters)
    if (quantity - available > 0.0001)
        throw new Error(`Only ${available} ${product.unit} of ${product.name} are available at ${sourceLocation.name}.`)
    let unitIds = Array.isArray(item.unitIds) ? [...new Set(item.unitIds.map(String))] : []
    if (product.trackingMode === 'unit') {
        if (!Number.isInteger(quantity))
            throw new Error(`${product.name} is unit-tracked and requires a whole quantity.`)
        const availableUnits = availableStockUnits(product.id, stockFilters)
        if (!unitIds.length) unitIds = availableUnits.slice(0, quantity).map((unit) => unit.id)
        const allowed = new Set(availableUnits.map((unit) => unit.id))
        if (unitIds.length !== quantity || unitIds.some((id) => !allowed.has(id)))
            throw new Error(`The selected individual units for ${product.name} are no longer available.`)
    }
    return {
        kind: 'product',
        sourceType: 'product',
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity,
        unit: product.unit,
        sourceLocationId: sourceLocation.id,
        sourceLocationName: sourceLocation.name,
        lotId: String(item.lotId || ''),
        unitIds,
        lines: [{
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity,
            unit: product.unit,
            sourceLocationId: sourceLocation.id,
            sourceLocationName: sourceLocation.name,
            lotId: String(item.lotId || ''),
            unitIds,
            requestKind: 'product',
        }],
    }
}

function prepareStockInRequestBatchItem(item = {}, sourceWarehouse) {
    const sourceLocation = findLocation(sourceWarehouse.id, item.sourceLocationId)
    if (!sourceLocation || sourceLocation.active === false || sourceLocation.status === 'unavailable')
        throw new Error('Select an available source location for the registered batch.')
    const availability = batchWarehouseAvailability(item.batchId || item.batch, sourceWarehouse.id, sourceLocation.id)
    const batchCount = Math.max(1, Math.floor(number(item.batchCount) || 1))
    if (availability.availableBatchCount < 1)
        throw new Error(`${availability.batch.id} has no complete batch available at ${sourceLocation.name}.`)
    if (batchCount > availability.availableBatchCount)
        throw new Error(`Only ${availability.availableBatchCount} complete ${availability.batch.id} batch${availability.availableBatchCount === 1 ? '' : 'es'} are available at ${sourceLocation.name}.`)
    const lines = (availability.batch.items || [])
        .filter((recipe) => number(recipe.recipeQuantity) > 0)
        .map((recipe) => ({
            productId: recipe.productId,
            productName: recipe.productName,
            sku: recipe.sku,
            quantity: number(recipe.recipeQuantity) * batchCount,
            unit: recipe.unit,
            recipeQuantity: number(recipe.recipeQuantity),
            batchId: availability.batch.id,
            batchCount,
            sourceLocationId: sourceLocation.id,
            sourceLocationName: sourceLocation.name,
            requestKind: 'batch',
        }))
    return {
        kind: 'batch',
        sourceType: 'batch',
        batchId: availability.batch.id,
        batchName: availability.batch.name,
        batchCount,
        availableBatchCountSnapshot: availability.availableBatchCount,
        productCount: availability.batch.productCount,
        sourceWarehouseId: sourceWarehouse.id,
        sourceLocationId: sourceLocation.id,
        sourceLocationName: sourceLocation.name,
        lines,
    }
}

function createStockInRequest(input = {}) {
    if (!can(PERMISSIONS.ISSUE_STOCK))
        throw new Error('You do not have permission to create a stock movement request.')

    let sourceWarehouse = findWarehouse(input.sourceWarehouseId)
    if (!sourceWarehouse && input.sourceType === 'batch') {
        const batch = findBatch(input.batchId || input.batch)
        const firstLocation = (batch?.locations || []).find((row) => number(row.quantity || row.availableQuantity) > 0)
        sourceWarehouse = firstLocation ? findWarehouse(firstLocation.warehouseId) : null
    }
    if (!sourceWarehouse || sourceWarehouse.active === false)
        throw new Error('Select an active source warehouse.')
    if (!String(sourceWarehouse.address || '').trim())
        throw new Error(`Set the full address for ${sourceWarehouse.name} before creating a Stock In Request.`)

    const destinationWarehouse = findWarehouse(input.destinationWarehouseId)
    if (!destinationWarehouse || destinationWarehouse.active === false)
        throw new Error('Select an active destination warehouse.')
    if (!String(destinationWarehouse.address || '').trim())
        throw new Error(`Set the full address for ${destinationWarehouse.name} before creating a Stock In Request.`)
    let destinationLocation = null
    if (input.destinationLocationId) {
        destinationLocation = findLocation(destinationWarehouse.id, input.destinationLocationId)
        if (!destinationLocation || destinationLocation.active === false || destinationLocation.status === 'unavailable')
            throw new Error('The preferred destination location is unavailable.')
    }

    const rawItems = Array.isArray(input.items) && input.items.length
        ? input.items
        : [{
              kind: input.sourceType === 'batch' ? 'batch' : 'product',
              sourceType: input.sourceType,
              productId: input.productId,
              batchId: input.batchId || input.batch,
              batchCount: input.batchCount || input.selectedBatchCount || 1,
              quantity: input.quantity,
              sourceLocationId: input.sourceLocationId,
              lotId: input.lotId,
              unitIds: input.unitIds,
          }]
    if (!rawItems.length) throw new Error('Add at least one product or batch to the request.')

    const preparedItems = rawItems.map((item) =>
        (item.kind || item.sourceType) === 'batch'
            ? prepareStockInRequestBatchItem(item, sourceWarehouse)
            : prepareStockInRequestProductItem(item, sourceWarehouse),
    )
    if (
        sourceWarehouse.id === destinationWarehouse.id
        && preparedItems.some((item) => item.sourceLocationId === destinationLocation?.id)
    ) {
        throw new Error('For movement inside one warehouse, choose a different destination location.')
    }
    const duplicateProducts = new Set()
    const duplicateBatches = new Set()
    preparedItems.forEach((item) => {
        if (item.kind === 'batch') {
            const key = `${item.batchId}:${item.sourceLocationId || ''}`
            if (duplicateBatches.has(key)) throw new Error(`${item.batchId} is already included from this source location.`)
            duplicateBatches.add(key)
        } else {
            const key = `${item.productId}:${item.sourceLocationId}:${item.lotId || ''}`
            if (duplicateProducts.has(key)) throw new Error(`${item.productName} is already included from this source location.`)
            duplicateProducts.add(key)
        }
    })

    const account = currentStaff() || { employeeId: 'SYSTEM', name: 'System' }
    const requestId = nextDocumentId('SIR', state.stockInRequests)
    const requestNumberMode = String(input.requestNumberMode || 'sequence').toLowerCase() === 'random' ? 'random' : 'sequence'
    const requestNumber = assertUniqueStockMovementNumber(
        input.requestNumber || generateStockMovementNumber('SIR', requestNumberMode),
    )
    const sourceSnapshot = warehouseRequestSnapshot(sourceWarehouse)
    const destinationSnapshot = warehouseRequestSnapshot(destinationWarehouse)
    const lines = preparedItems.flatMap((item) => item.lines || [])
    const kinds = [...new Set(preparedItems.map((item) => item.kind))]
    const sourceLocationNames = [...new Set(preparedItems.map((item) => item.sourceLocationName).filter(Boolean))]
    const sourceLocationIds = [...new Set(preparedItems.map((item) => item.sourceLocationId).filter(Boolean))]
    const request = {
        id: requestId,
        requestNumber,
        requestNumberMode,
        status: 'pending',
        transitStatus: 'in_transit',
        requestType: 'stock_movement',
        sourceType: kinds.length > 1 ? 'mixed' : kinds[0],
        sourceWarehouseId: sourceWarehouse.id,
        sourceWarehouseName: sourceWarehouse.name,
        sourceWarehouseCode: sourceWarehouse.code,
        sourceCompanyName: sourceSnapshot.companyName,
        sourceAddress: sourceSnapshot.address,
        sourceContactName: sourceSnapshot.contactName,
        sourcePhone: sourceSnapshot.phone,
        sourceLabel: sourceWarehouse.name,
        sourceLocationId: sourceLocationIds.length === 1 ? sourceLocationIds[0] : '',
        sourceLocationName: sourceLocationNames.length === 1 ? sourceLocationNames[0] : '',
        sourceLocationIds,
        sourceLocationNames,
        destinationWarehouseId: destinationWarehouse.id,
        destinationWarehouseName: destinationWarehouse.name,
        destinationWarehouseCode: destinationWarehouse.code,
        destinationCompanyName: destinationSnapshot.companyName,
        destinationAddress: destinationSnapshot.address,
        destinationContactName: destinationSnapshot.contactName,
        destinationPhone: destinationSnapshot.phone,
        destinationLocationId: destinationLocation?.id || '',
        destinationLocationName: destinationLocation?.name || '',
        movementScope: sourceWarehouse.id === destinationWarehouse.id ? 'location' : 'warehouse',
        sourceSnapshot,
        destinationSnapshot,
        items: clone(preparedItems),
        lines: clone(lines),
        itemCount: preparedItems.length,
        productItemCount: preparedItems.filter((item) => item.kind === 'product').length,
        batchItemCount: preparedItems.filter((item) => item.kind === 'batch').length,
        totalQuantity: lines.reduce((sum, line) => sum + number(line.quantity), 0),
        reason: String(input.reason || 'Warehouse stock movement').trim(),
        reference: String(input.reference || '').trim(),
        remark: String(input.remark || '').trim(),
        photo: String(input.photo || '').trim(),
        requestedBy: account.employeeId,
        requestedByName: account.name,
        requestedAt: nowIso(),
        dispatchedAt: nowIso(),
        createdAt: nowIso(),
        confirmationId: '',
        confirmationNumberMode: 'sequence',
        confirmedAt: '',
        confirmedBy: '',
        confirmedByName: '',
        driverName: '',
        transferId: '',
        batchTransferId: '',
    }
    state.stockInRequests.unshift(request)
    persistInventory()
    return request
}

function createSupplierStockInRequest(input = {}) {
    if (!can(PERMISSIONS.RECEIVE_STOCK))
        throw new Error('You do not have permission to create supplier stock-in requests.')
    const supplier = findSupplier(input.supplierId)
    const warehouse = findWarehouse(input.warehouseId)
    const location = findLocation(input.warehouseId, input.locationId)
    if (!supplier || !warehouse || !location) throw new Error('Select a supplier, warehouse and location.')
    const target = input.target === 'batch' ? 'batch' : 'product'
    const products = target === 'batch'
        ? (input.batches || []).flatMap((entry) => (entry.items || []).map((item) => ({ ...item, batchId: entry.batchId, batchCount: Number(entry.batchCount) || 0 })))
        : (input.items || [])
    if (!products.length) throw new Error('Add at least one product or batch.')
    const account = currentStaff() || { employeeId: 'SYSTEM', name: 'System' }
    const id = nextDocumentId('SRQ', state.stockInRequests)
    const request = {
        id,
        requestNumber: id,
        requestType: 'supplier_stock_in',
        status: 'pending',
        target,
        supplierId: supplier.id,
        supplierName: supplier.name,
        sourceWarehouseName: supplier.name,
        sourceAddress: String(input.supplierAddress || supplier.address || ''),
        destinationWarehouseId: warehouse.id,
        destinationWarehouseName: warehouse.name,
        destinationLocationId: location.id,
        destinationLocationName: location.name,
        destinationAddress: warehouse.address || '',
        invoiceNumber: String(input.invoiceNumber || ''),
        purchaseOrderNumber: String(input.purchaseOrderNumber || ''),
        receivingDate: input.receivingDate || '',
        photo: input.photo || '',
        remark: String(input.remark || ''),
        payload: clone(input),
        lines: products.map((item) => {
            const product = findProduct(item.productId)
            const multiplier = target === 'batch' ? Number(item.batchCount || 0) : 1
            return {
                productId: item.productId,
                productName: product?.name || 'Product',
                sku: product?.sku || '',
                unit: product?.unit || '',
                quantity: Number(item.quantity || 0) * multiplier,
                requestedQuantity: Number(item.quantity || 0) * multiplier,
                batchId: item.batchId || '',
                batchCount: Number(item.batchCount || 0),
            }
        }),
        itemCount: products.length,
        requestedBy: account.employeeId,
        requestedByName: account.name,
        requestedAt: nowIso(),
    }
    state.stockInRequests.unshift(request)
    persistInventory()
    return request
}

function confirmSupplierStockInRequest(requestOrId, input = {}) {
    const approver = currentStaff()
    if (!can(PERMISSIONS.APPROVE_SUPPLIER_RECEIPT))
        throw new Error('Only a supervisor or inventory manager can confirm supplier receiving.')
    const request = typeof requestOrId === 'object' ? findStockInRequest(requestOrId.id) : findStockInRequest(requestOrId)
    if (!request || request.requestType !== 'supplier_stock_in') throw new Error('Supplier stock-in request not found.')
    if (request.status !== 'pending') throw new Error('This request is no longer pending.')

    const snapshot = inventoryStateSnapshot()
    const productRefs = new Map(state.products.map((product) => [product.id, product]))
    const requestBefore = clone(request)

    try {
        const payload = clone(request.payload || {})
        if (request.target === 'batch') {
            const counts = input.batchCounts || {}
            payload.batches = (payload.batches || []).map((entry) => ({
                ...entry,
                batchCount: Math.max(0, Number(counts[entry.batchId] ?? entry.batchCount) || 0),
            })).filter((entry) => entry.batchCount > 0)
        } else {
            const quantities = input.quantities || {}
            payload.items = (payload.items || []).map((item) => ({
                ...item,
                quantity: Math.max(0, Number(quantities[item.productId] ?? item.quantity) || 0),
            })).filter((item) => item.quantity > 0)
        }
        payload.stockInType = 'supplier'
        // A pending supplier request is an existing receiving commitment. Allow the
        // confirmed receipt to finish even if a referenced product was deactivated
        // after the request was created. Missing/deleted products are still blocked.
        payload.allowInactiveProduct = true
        const receipt = request.target === 'batch'
            ? receiveSupplierBatchOrder(payload)
            : receiveStockBatch({ ...payload, forceBatch: false })
        const account = approver || { employeeId: 'SYSTEM', name: 'System' }
        request.status = 'confirmed'
        request.confirmationId = nextStockInConfirmationId()
        request.confirmedAt = nowIso()
        request.confirmedBy = account.employeeId
        request.confirmedByName = account.name
        const confirmationRemark = String(input.remark || '').trim()
        request.confirmationRemark = confirmationRemark
        payload.confirmationRemark = confirmationRemark
        if (receipt && typeof receipt === 'object') {
            receipt.confirmationRemark = confirmationRemark
            if (receipt.receipt && typeof receipt.receipt === 'object') receipt.receipt.confirmationRemark = confirmationRemark
            if (Array.isArray(receipt.receipts)) {
                receipt.receipts.forEach((item) => {
                    if (item && typeof item === 'object') item.confirmationRemark = confirmationRemark
                })
            }
        }
        request.receiptIds = (receipt.receipts || [receipt.receipt]).filter(Boolean).map((item) => item.id)
        request.receipt = clone(receipt)
        // Keep the physically confirmed quantities separate from the original request.
        // The request remains an immutable audit snapshot; every confirmed/history view
        // reads this payload so it never falls back to the requested amounts.
        request.actualPayload = clone(payload)
        request.actualLines = request.target === 'batch'
            ? (payload.batches || []).flatMap((entry) => (entry.items || []).map((item) => ({ ...item, batchId: entry.batchId, batchCount: entry.batchCount })))
            : clone(payload.items || [])
        persistInventory()
        return { request, receipt }
    } catch (error) {
        restoreInventorySnapshot(snapshot, productRefs)
        // The caller may still hold the original reactive request object. Restore it
        // too, so a persistence failure can never leave a false "Confirmed" modal.
        Object.keys(request).forEach((key) => delete request[key])
        Object.assign(request, requestBefore)
        syncDerivedInventory()
        try {
            persistInventory()
        } catch (_) {
            // Preserve the original confirmation error. The in-memory transaction
            // has already been rolled back even if storage is completely exhausted.
        }
        throw error
    }
}

function executeStockMovement(input = {}) {
    if (!can(PERMISSIONS.ISSUE_STOCK) || !can(PERMISSIONS.MANAGE_WAREHOUSES))
        throw new Error('You do not have permission to move warehouse stock.')
    const items = Array.isArray(input.items) ? input.items : []
    if (!items.length) throw new Error('Add at least one product or batch.')
    const snapshot = inventoryStateSnapshot()
    const productRefs = new Map(state.products.map((product) => [product.id, product]))
    try {
        const results = items.map((item) => item.kind === 'batch'
            ? transferRegisteredBatchQuantity({ ...item, sourceWarehouseId: input.sourceWarehouseId, destinationWarehouseId: input.destinationWarehouseId, destinationLocationId: input.destinationLocationId, reason: input.reason || 'Warehouse stock movement', reference: input.reference, remark: input.remark })
            : transferStock({ ...item, sourceWarehouseId: input.sourceWarehouseId, destinationWarehouseId: input.destinationWarehouseId, destinationLocationId: input.destinationLocationId, stockSource: 'standalone', reason: input.reason || 'Warehouse stock movement', reference: input.reference, remark: input.remark }))
        return { id: generateStockMovementNumber('MOV', 'sequence'), status: 'completed', results, completedAt: nowIso() }
    } catch (error) {
        restoreInventorySnapshot(snapshot, productRefs)
        syncDerivedInventory()
        persistInventory()
        throw error
    }
}

function updateStockInRequestDetails(requestOrId, input = {}) {
    if (!can(PERMISSIONS.ISSUE_STOCK) && !can(PERMISSIONS.RECEIVE_STOCK))
        throw new Error('You do not have permission to edit this Stock In Request.')
    const request = typeof requestOrId === 'object' ? findStockInRequest(requestOrId.id) : findStockInRequest(requestOrId)
    if (!request) throw new Error('Stock In Request not found.')
    if (request.status !== 'pending') throw new Error('Only pending Stock In Requests can be edited.')
    if (Object.prototype.hasOwnProperty.call(input, 'requestNumber')) {
        request.requestNumber = assertUniqueStockMovementNumber(input.requestNumber, request.id)
    }
    if (Object.prototype.hasOwnProperty.call(input, 'requestNumberMode')) {
        request.requestNumberMode = String(input.requestNumberMode || '').toLowerCase() === 'random' ? 'random' : 'sequence'
    }
    request.updatedAt = nowIso()
    persistInventory()
    return request
}

function transferRegisteredBatchQuantity(input = {}) {
    const receivingConfirmation = input.stockInRequestConfirmation === true && can(PERMISSIONS.RECEIVE_STOCK)
    if (!receivingConfirmation && (!can(PERMISSIONS.ISSUE_STOCK) || !can(PERMISSIONS.MANAGE_WAREHOUSES)))
        throw new Error('You do not have permission to transfer batch stock.')
    reconcileTrackedUnitBalances()
    const sourceWarehouse = findWarehouse(input.sourceWarehouseId)
    if (!sourceWarehouse) throw new Error('Source warehouse not found.')
    const destination = requireUsableLocation(input.destinationWarehouseId, input.destinationLocationId)
    const sourceLocationId = String(input.sourceLocationId || '')
    const sourceLocation = sourceLocationId ? findLocation(sourceWarehouse.id, sourceLocationId) : null
    if (sourceLocationId && (!sourceLocation || sourceLocation.active === false || sourceLocation.status === 'unavailable'))
        throw new Error('The batch source location is no longer available.')
    const availability = batchWarehouseAvailability(input.batchId, sourceWarehouse.id, sourceLocationId)
    const batchCount = Math.max(1, Math.floor(number(input.batchCount) || 1))
    if (batchCount > availability.availableBatchCount)
        throw new Error(`${availability.batch.id} no longer has ${batchCount} complete batch${batchCount === 1 ? '' : 'es'} at ${sourceLocation?.name || sourceWarehouse.name}.`)

    const lotIds = new Set(
        state.stockLots
            .filter((lot) => isRegisteredBatchLot(lot) && lot.batchGroupId === availability.batch.id)
            .map((lot) => lot.id),
    )
    const plans = []
    ;(availability.batch.items || []).forEach((recipe) => {
        let remaining = number(recipe.recipeQuantity) * batchCount
        if (!(remaining > 0)) return
        const positions = state.stockPositions
            .filter((position) =>
                position.productId === recipe.productId &&
                position.warehouseId === sourceWarehouse.id &&
                (!sourceLocationId || position.locationId === sourceLocationId) &&
                lotIds.has(position.lotId) &&
                number(position.availableQuantity) > 0,
            )
            .slice()
            .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
        positions.forEach((position) => {
            if (remaining <= 0.0001) return
            const quantity = Math.min(remaining, number(position.availableQuantity))
            plans.push({ product: findProduct(recipe.productId), position, quantity })
            remaining -= quantity
        })
        if (remaining > 0.0001)
            throw new Error(`${availability.batch.id} no longer has enough ${recipe.productName} stock at ${sourceLocation?.name || sourceWarehouse.name}.`)
    })
    assertBatchDestinationCapacity(destination, plans)

    const snapshot = inventoryStateSnapshot()
    const productRefs = new Map(state.products.map((product) => [product.id, product]))
    const batchTransferId = nextBatchTransferId()
    try {
        const transfers = plans.map(({ product, position, quantity }) => {
            if (!product) throw new Error('A batch product no longer exists.')
            if (product.trackingMode === 'unit' && !Number.isInteger(quantity))
                throw new Error(`${product.name} is unit-tracked and requires whole quantities in the batch recipe.`)
            const unitIds = product.trackingMode === 'unit'
                ? availableStockUnits(product.id, {
                      positionId: position.id,
                      warehouseId: position.warehouseId,
                      locationId: position.locationId,
                      lotId: position.lotId,
                      stockSource: 'batch',
                  }).slice(0, quantity).map((unit) => unit.id)
                : []
            if (product.trackingMode === 'unit' && unitIds.length !== quantity)
                throw new Error(`Tracked unit balance is inconsistent for ${product.name}.`)
            return transferStock({
                productId: product.id,
                quantity,
                sourceWarehouseId: position.warehouseId,
                sourceLocationId: position.locationId,
                destinationWarehouseId: destination.warehouse.id,
                destinationLocationId: destination.location.id,
                lotId: position.lotId,
                positionId: position.id,
                unitIds,
                stockSource: 'batch',
                batchGroupId: availability.batch.id,
                batchTransferId,
                stockInRequestConfirmation: input.stockInRequestConfirmation === true,
                reason: input.reason || 'Stock In Request Confirmation',
                reference: input.reference,
                remark: input.remark,
                photo: input.photo,
            })
        })
        return {
            id: batchTransferId,
            batchId: availability.batch.id,
            batchCount,
            sourceWarehouseId: sourceWarehouse.id,
            sourceLocationId,
            sourceLocationName: sourceLocation?.name || '',
            destinationWarehouseId: destination.warehouse.id,
            destinationLocationId: destination.location.id,
            totalQuantity: plans.reduce((sum, plan) => sum + number(plan.quantity), 0),
            transfers,
            createdAt: nowIso(),
        }
    } catch (error) {
        restoreInventorySnapshot(snapshot, productRefs)
        syncDerivedInventory()
        persistInventory()
        throw error
    }
}

function confirmStockInRequest(requestOrId, input = {}) {
    if (!can(PERMISSIONS.RECEIVE_STOCK))
        throw new Error('You do not have permission to confirm stock in.')
    const request = typeof requestOrId === 'object' ? findStockInRequest(requestOrId.id) : findStockInRequest(requestOrId)
    if (!request) throw new Error('Stock In Request not found.')
    if (request.status !== 'pending') throw new Error('This Stock In Request has already been confirmed.')

    const snapshot = inventoryStateSnapshot()
    const productRefs = new Map(state.products.map((product) => [product.id, product]))
    try {
        const destinationWarehouseId = request.destinationWarehouseId
        const destinationLocationId = String(request.destinationLocationId || input.destinationLocationId || '')
        if (!destinationLocationId) throw new Error('This request does not have a destination location.')
        const destination = requireUsableLocation(destinationWarehouseId, destinationLocationId)
        if (Object.prototype.hasOwnProperty.call(input, 'requestNumber')) {
            request.requestNumber = assertUniqueStockMovementNumber(input.requestNumber, request.id)
        }
        if (Object.prototype.hasOwnProperty.call(input, 'requestNumberMode')) {
            request.requestNumberMode = String(input.requestNumberMode || '').toLowerCase() === 'random' ? 'random' : 'sequence'
        }
        const requestItems = Array.isArray(request.items) && request.items.length
            ? request.items
            : request.sourceType === 'batch'
                ? [{ kind: 'legacy-batch', batchId: request.batchId }]
                : [{ kind: 'legacy-product', ...(request.lines?.[0] || {}) }]
        const results = []

        requestItems.forEach((item) => {
            if (item.kind === 'batch') {
                results.push(transferRegisteredBatchQuantity({
                    batchId: item.batchId,
                    batchCount: item.batchCount,
                    sourceWarehouseId: request.sourceWarehouseId,
                    sourceLocationId: item.sourceLocationId || '',
                    destinationWarehouseId: destination.warehouse.id,
                    destinationLocationId: destination.location.id,
                    stockInRequestConfirmation: true,
                    reason: 'Stock In Request Confirmation',
                    reference: request.requestNumber || request.id,
                    remark: request.remark,
                    photo: input.photo || request.photo,
                }))
                return
            }
            if (item.kind === 'legacy-batch') {
                results.push(transferRegisteredBatch({
                    batchId: item.batchId,
                    destinationWarehouseId: destination.warehouse.id,
                    destinationLocationId: destination.location.id,
                    stockInRequestConfirmation: true,
                    reason: 'Stock In Request Confirmation',
                    reference: request.requestNumber || request.id,
                    remark: request.remark,
                    photo: input.photo || request.photo,
                }))
                return
            }
            const line = item.kind === 'product' ? item : request.lines?.[0]
            if (!line) throw new Error('The request has an invalid product line.')
            results.push(transferStock({
                productId: line.productId,
                quantity: line.quantity,
                sourceWarehouseId: request.sourceWarehouseId,
                sourceLocationId: line.sourceLocationId || request.sourceLocationId,
                destinationWarehouseId: destination.warehouse.id,
                destinationLocationId: destination.location.id,
                lotId: line.lotId || '',
                unitIds: Array.isArray(line.unitIds) ? line.unitIds : [],
                stockSource: 'standalone',
                stockInRequestConfirmation: true,
                reason: 'Stock In Request Confirmation',
                reference: request.requestNumber || request.id,
                remark: request.remark,
                photo: input.photo || request.photo,
            }))
        })

        const transferRows = results.flatMap((result) => result?.transfers?.length ? result.transfers : [result]).filter(Boolean)
        const inventoryConfirmed = transferRows.length > 0 && transferRows.every((transfer) => {
            const quantity = number(transfer.quantity)
            const sourceDecrease = number(transfer.sourceBeforeQuantity) - number(transfer.sourceAfterQuantity)
            const destinationIncrease = number(transfer.destinationAfterQuantity) - number(transfer.destinationBeforeQuantity)
            return Math.abs(sourceDecrease - quantity) <= 0.0001 && Math.abs(destinationIncrease - quantity) <= 0.0001
        })
        if (!inventoryConfirmed)
            throw new Error('Stock confirmation failed: source and destination balances did not update correctly.')

        const account = currentStaff() || { employeeId: 'SYSTEM', name: 'System' }
        const confirmationNumberMode = String(input.confirmationNumberMode || 'sequence').toLowerCase() === 'random' ? 'random' : 'sequence'
        const confirmationId = assertUniqueStockMovementNumber(
            input.confirmationId || generateStockMovementNumber('SIC', confirmationNumberMode),
            request.id,
        )
        request.status = 'confirmed'
        request.transitStatus = 'received'
        request.confirmationId = confirmationId
        request.confirmationNumberMode = confirmationNumberMode
        request.confirmedAt = nowIso()
        request.confirmedBy = account.employeeId
        request.confirmedByName = account.name
        request.driverName = String(input.driverName || '').trim()
        request.destinationLocationId = destination.location.id
        request.destinationLocationName = destination.location.name
        request.transferId = transferRows[0]?.id || ''
        request.batchTransferId = results.find((result) => result?.batchId)?.id || ''
        request.confirmedLines = clone(request.lines || [])
        request.inventoryConfirmed = true
        request.confirmationAudit = transferRows.map((transfer) => ({
            transferId: transfer.id,
            productId: transfer.productId,
            productName: transfer.productName,
            quantity: number(transfer.quantity),
            unit: transfer.unit,
            sourceWarehouseId: transfer.sourceWarehouseId,
            sourceLocationId: transfer.sourceLocationId,
            sourceBeforeQuantity: number(transfer.sourceBeforeQuantity),
            sourceAfterQuantity: number(transfer.sourceAfterQuantity),
            destinationWarehouseId: transfer.destinationWarehouseId,
            destinationLocationId: transfer.destinationLocationId,
            destinationBeforeQuantity: number(transfer.destinationBeforeQuantity),
            destinationAfterQuantity: number(transfer.destinationAfterQuantity),
            batchId: transfer.batchId || transfer.batchGroupId || '',
        }))
        syncDerivedInventory()
        persistInventory()
        return { request, transfer: results[0] || null, transfers: results }
    } catch (error) {
        restoreInventorySnapshot(snapshot, productRefs)
        syncDerivedInventory()
        persistInventory()
        throw error
    }
}

function cancelStockInRequest(requestOrId, input = {}) {
    const request = typeof requestOrId === 'object' ? findStockInRequest(requestOrId.id) : findStockInRequest(requestOrId)
    if (!request) throw new Error('Stock In Request not found.')
    if (request.status !== 'pending') throw new Error('Only pending requests can be cancelled.')

    const requestBefore = clone(request)
    try {
        request.status = 'cancelled'
        request.transitStatus = 'cancelled'
        request.cancelledAt = nowIso()
        request.cancelledByName = currentStaff()?.name || 'System'
        request.cancellationRemark = String(input.remark || '').trim()
        persistInventory()
        return request
    } catch (error) {
        Object.keys(request).forEach((key) => delete request[key])
        Object.assign(request, requestBefore)
        throw error
    }
}

function transferStock(input) {
    const receivingConfirmation = input.stockInRequestConfirmation === true && can(PERMISSIONS.RECEIVE_STOCK)
    if (
        !receivingConfirmation &&
        (!can(PERMISSIONS.ISSUE_STOCK) || !can(PERMISSIONS.MANAGE_WAREHOUSES))
    )
        throw new Error('You do not have permission to transfer stock.')
    const product = findProduct(input.productId)
    if (!product || !product.active) throw new Error('Select an active product.')
    if (product.trackingMode === 'unit') {
        reconcileTrackedUnitBalances(product.id)
        assertTrackedUnitBalances(product.id)
    }
    const quantity = number(input.quantity)
    if (quantity <= 0) throw new Error('Enter a quantity to transfer.')
    const source = requireUsableLocation(
        input.sourceWarehouseId,
        input.sourceLocationId,
    )
    const destination = requireUsableLocation(
        input.destinationWarehouseId,
        input.destinationLocationId,
    )
    if (
        source.warehouse.id === destination.warehouse.id &&
        source.location.id === destination.location.id
    )
        throw new Error('Choose a different destination location.')
    assertCapacity(destination.location, destination.warehouse.id, product, quantity)

    const totalBeforeQuantity = productStock(product.id)
    const sourceBeforeQuantity = productStock(product.id, {
        warehouseId: source.warehouse.id,
        locationId: source.location.id,
    })
    const destinationBeforeQuantity = productStock(product.id, {
        warehouseId: destination.warehouse.id,
        locationId: destination.location.id,
    })
    let selected = []
    let allocations = []
    if (product.trackingMode === 'unit') {
        const unitIds =
            Array.isArray(input.unitIds) && input.unitIds.length
                ? input.unitIds
                : availableStockUnits(product.id, {
                      warehouseId: source.warehouse.id,
                      locationId: source.location.id,
                      ...(input.lotId ? { lotId: String(input.lotId) } : {}),
                      ...(input.positionId ? { positionId: String(input.positionId) } : {}),
                      ...(input.stockSource ? { stockSource: String(input.stockSource) } : {}),
                  })
                      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
                      .slice(0, quantity)
                      .map((unit) => unit.id)
        selected = validateUnitSelection(product, { ...input, quantity, unitIds }, {
            warehouseId: source.warehouse.id,
            locationId: source.location.id,
            ...(input.lotId ? { lotId: String(input.lotId) } : {}),
            ...(input.positionId ? { positionId: String(input.positionId) } : {}),
            ...(input.stockSource ? { stockSource: String(input.stockSource) } : {}),
        })
        const counts = new Map()
        selected.forEach((unit) =>
            counts.set(
                unit.positionId,
                (counts.get(unit.positionId) || 0) + 1,
            ),
        )
        allocations = [...counts].map(([positionId, count]) => ({
            position: state.stockPositions.find(
                (item) => item.id === positionId,
            ),
            quantity: count,
        }))
    } else {
        const filters = {
            warehouseId: source.warehouse.id,
            locationId: source.location.id,
            lotId: input.lotId || '',
            ...(input.positionId ? { positionId: String(input.positionId) } : {}),
            ...(input.stockSource ? { stockSource: String(input.stockSource) } : {}),
        }
        allocations = product.trackingMode === 'none'
            ? allocateRequestedReceiptLayers(product, quantity, input, filters) ||
              allocatePositionQuantity(product.id, quantity, filters)
            : allocatePositionQuantity(product.id, quantity, filters)
    }
    if (allocations.some((allocation) => !allocation.position))
        throw new Error('The source inventory position could not be found.')

    const allocatedQuantity = allocations.reduce(
        (sum, allocation) => sum + number(allocation.quantity),
        0,
    )
    if (Math.abs(allocatedQuantity - quantity) > 0.0001)
        throw new Error('The transfer allocation does not match the requested quantity.')

    const transferId = nextDocumentId('TRF', state.transfers)

    return runInventoryTransaction(() => {
        applyPositionAllocations(allocations)
        const destinationByLot = new Map()
        allocations.forEach(({ position, quantity: moved }) => {
            let target = state.stockPositions.find(
                (item) =>
                    item.lotId === position.lotId &&
                    item.warehouseId === destination.warehouse.id &&
                    item.locationId === destination.location.id,
            )
            if (!target) {
                target = {
                    id: `pos-${position.lotId}-${destination.warehouse.id}-${destination.location.id}`,
                    productId: product.id,
                    lotId: position.lotId,
                    warehouseId: destination.warehouse.id,
                    warehouseName: destination.warehouse.name,
                    locationId: destination.location.id,
                    location: destination.location.name,
                    unit: product.unit,
                    availableQuantity: 0,
                    createdAt: nowIso(),
                    updatedAt: nowIso(),
                }
                state.stockPositions.push(target)
            }
            target.availableQuantity =
                number(target.availableQuantity) + moved
            target.updatedAt = nowIso()
            destinationByLot.set(position.lotId, target)
        })
        selected.forEach((unit) => {
            const target = destinationByLot.get(unit.lotId)
            if (!target)
                throw new Error('The destination inventory position could not be created.')
            unit.warehouseId = destination.warehouse.id
            unit.warehouseName = destination.warehouse.name
            unit.locationId = destination.location.id
            unit.location = destination.location.name
            unit.positionId = target.id
            unit.transferId = transferId
            unit.transferredAt = nowIso()
        })
        if (product.trackingMode === 'unit') assertTrackedUnitBalances(product.id)

        const sourceAfterQuantity = productStock(product.id, {
            warehouseId: source.warehouse.id,
            locationId: source.location.id,
        })
        const destinationAfterQuantity = productStock(product.id, {
            warehouseId: destination.warehouse.id,
            locationId: destination.location.id,
        })
        const totalAfterQuantity = productStock(product.id)
        const sourceMovedQuantity = sourceBeforeQuantity - sourceAfterQuantity
        const destinationMovedQuantity =
            destinationAfterQuantity - destinationBeforeQuantity
        const tolerance = 0.0001

        if (Math.abs(sourceMovedQuantity - quantity) > tolerance)
            throw new Error('Transfer validation failed: source stock did not decrease correctly.')
        if (Math.abs(destinationMovedQuantity - quantity) > tolerance)
            throw new Error('Transfer validation failed: destination stock did not increase correctly.')
        if (Math.abs(totalAfterQuantity - totalBeforeQuantity) > tolerance)
            throw new Error('Transfer validation failed: total stock changed unexpectedly.')
        if (
            product.trackingMode === 'unit' &&
            selected.some(
                (unit) =>
                    unit.warehouseId !== destination.warehouse.id ||
                    unit.locationId !== destination.location.id ||
                    !destinationByLot.get(unit.lotId) ||
                    unit.positionId !== destinationByLot.get(unit.lotId).id,
            )
        )
            throw new Error('Transfer validation failed: an individual unit was not moved correctly.')

        const transfer = {
            id: transferId,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity,
            unit: product.unit,
            sourceWarehouseId: source.warehouse.id,
            sourceWarehouseName: source.warehouse.name,
            sourceLocationId: source.location.id,
            sourceLocationName: source.location.name,
            destinationWarehouseId: destination.warehouse.id,
            destinationWarehouseName: destination.warehouse.name,
            destinationLocationId: destination.location.id,
            destinationLocationName: destination.location.name,
            totalBeforeQuantity,
            totalAfterQuantity,
            sourceBeforeQuantity,
            sourceAfterQuantity,
            destinationBeforeQuantity,
            destinationAfterQuantity,
            unitIds: selected.map((unit) => unit.id),
            unitCodes: selected.map((unit) => unit.code),
            stockSource: String(input.stockSource || ''),
            batchGroupId: String(input.batchGroupId || ''),
            batchId: String(input.batchGroupId || ''),
            batchTransferId: String(input.batchTransferId || ''),
            lines: allocations.map(({ position, quantity: moved }) => ({
                lotId: position.lotId,
                quantity: moved,
            })),
            reason: String(input.reason || 'Move').trim(),
            reference: String(input.reference || '').trim(),
            remark: String(input.remark || '').trim(),
            photo: String(input.photo || '').trim(),
            transferredBy: currentStaff()?.employeeId || 'SYSTEM',
            transferredByName: currentStaff()?.name || 'System',
            createdAt: nowIso(),
        }
        state.transfers.unshift(transfer)
        recordMovement(product, {
            beforeQuantity: totalBeforeQuantity,
            changedQuantity: 0,
            afterQuantity: totalAfterQuantity,
            quantity,
            movedQuantity: quantity,
            unit: product.unit,
            type: 'Transfer',
            reason: transfer.reason || 'Transfer',
            sourceWarehouseId: source.warehouse.id,
            sourceWarehouseName: source.warehouse.name,
            sourceLocationId: source.location.id,
            sourceLocationName: source.location.name,
            destinationWarehouseId: destination.warehouse.id,
            destinationWarehouseName: destination.warehouse.name,
            destinationLocationId: destination.location.id,
            destinationLocationName: destination.location.name,
            sourceBeforeQuantity,
            sourceAfterQuantity,
            destinationBeforeQuantity,
            destinationAfterQuantity,
            transferId: transfer.id,
            stockSource: transfer.stockSource,
            batchGroupId: transfer.batchGroupId,
            batchId: transfer.batchId,
            batchTransferId: transfer.batchTransferId,
            reference: transfer.reference,
            remark: transfer.remark,
            photo: transfer.photo,
            unitIds: transfer.unitIds,
            unitCodes: transfer.unitCodes,
        })
        return transfer
    })
}

function registeredBatchStockPlans(batchId) {
    const batch = findBatch(batchId)
    if (!batch) throw new Error('Select an available registered batch.')
    const lotIds = new Set(
        state.stockLots
            .filter((lot) => isRegisteredBatchLot(lot) && lot.batchGroupId === batch.id)
            .map((lot) => lot.id),
    )
    const plans = state.stockPositions
        .filter((position) => lotIds.has(position.lotId) && number(position.availableQuantity) > 0)
        .map((position) => {
            const product = findProduct(position.productId)
            const lot = state.stockLots.find((item) => item.id === position.lotId)
            if (!product || !lot) return null
            return {
                product,
                lot,
                position,
                quantity: number(position.availableQuantity),
            }
        })
        .filter(Boolean)
    if (!plans.length) throw new Error(`${batch.id} has no stock available.`)
    return { batch, plans }
}

function assertBatchDestinationCapacity(destination, plans) {
    const metrics = locationMetrics(destination.warehouse.id, destination.location.id)
    if (!metrics?.capacityConfigured) return
    const incomingPlans = plans.filter(({ position }) => !(
        position.warehouseId === destination.warehouse.id &&
        position.locationId === destination.location.id
    ))
    if (!incomingPlans.length) return
    const capacityUnit = destination.location.capacityUnit
    if (capacityUnit !== 'units') {
        const incompatible = incomingPlans.find(({ product }) => product.unit !== capacityUnit)
        if (incompatible)
            throw new Error(`This location accepts ${capacityUnit}, not ${incompatible.product.unit}.`)
    }
    if (metrics.usedCapacity === null) return
    const incoming = incomingPlans.reduce((sum, plan) => sum + number(plan.quantity), 0)
    if (number(metrics.usedCapacity) + incoming > number(destination.location.capacityValue))
        throw new Error('This location does not have enough capacity for the whole batch.')
}

function transferRegisteredBatch(input = {}) {
    const receivingConfirmation = input.stockInRequestConfirmation === true && can(PERMISSIONS.RECEIVE_STOCK)
    if (!receivingConfirmation && (!can(PERMISSIONS.ISSUE_STOCK) || !can(PERMISSIONS.MANAGE_WAREHOUSES)))
        throw new Error('You do not have permission to transfer stock.')
    reconcileTrackedUnitBalances()
    const { batch, plans } = registeredBatchStockPlans(input.batchId || input.batch || input.code)
    const destination = requireUsableLocation(input.destinationWarehouseId, input.destinationLocationId)
    const movingPlans = plans.filter(({ position }) => !(
        position.warehouseId === destination.warehouse.id &&
        position.locationId === destination.location.id
    ))
    if (!movingPlans.length)
        throw new Error(`${batch.id} is already stored entirely at this destination.`)
    assertBatchDestinationCapacity(destination, movingPlans)

    const snapshot = inventoryStateSnapshot()
    const productRefs = new Map(state.products.map((product) => [product.id, product]))
    const batchTransferId = nextBatchTransferId()
    try {
        const transfers = movingPlans.map(({ product, position, quantity }) => {
            if (product.trackingMode === 'unit' && !Number.isInteger(quantity))
                throw new Error(`${product.name} is unit-tracked and requires whole quantities in the batch recipe.`)
            const unitIds = product.trackingMode === 'unit'
                ? availableStockUnits(product.id, {
                      positionId: position.id,
                      warehouseId: position.warehouseId,
                      locationId: position.locationId,
                      lotId: position.lotId,
                      stockSource: 'batch',
                  }).map((unit) => unit.id)
                : []
            if (product.trackingMode === 'unit' && unitIds.length !== quantity)
                throw new Error(`Tracked unit balance is inconsistent for ${product.name}.`)
            return transferStock({
                productId: product.id,
                quantity,
                sourceWarehouseId: position.warehouseId,
                sourceLocationId: position.locationId,
                destinationWarehouseId: destination.warehouse.id,
                destinationLocationId: destination.location.id,
                lotId: position.lotId,
                positionId: position.id,
                unitIds,
                stockSource: 'batch',
                batchGroupId: batch.id,
                batchTransferId,
                stockInRequestConfirmation: input.stockInRequestConfirmation === true,
                reason: input.reason || 'Move batch',
                reference: input.reference,
                remark: input.remark,
                photo: input.photo,
            })
        })
        const refreshed = findBatch(batch.id)
        if ((refreshed?.locations || []).some((position) => number(position.quantity || position.availableQuantity) > 0 && (
            position.warehouseId !== destination.warehouse.id ||
            position.locationId !== destination.location.id
        )))
            throw new Error('Batch transfer validation failed: some batch stock did not reach the destination.')
        persistInventory()
        return {
            id: batchTransferId,
            batchId: batch.id,
            batchName: batch.name,
            productCount: batch.productCount,
            totalQuantity: plans.reduce((sum, plan) => sum + number(plan.quantity), 0),
            movedQuantity: movingPlans.reduce((sum, plan) => sum + number(plan.quantity), 0),
            destinationWarehouseId: destination.warehouse.id,
            destinationWarehouseName: destination.warehouse.name,
            destinationLocationId: destination.location.id,
            destinationLocationName: destination.location.name,
            transfers,
            createdAt: nowIso(),
        }
    } catch (error) {
        restoreInventorySnapshot(snapshot, productRefs)
        syncDerivedInventory()
        persistInventory()
        throw error
    }
}

function removeRegisteredBatch(input = {}) {
    if (!can(PERMISSIONS.ISSUE_STOCK))
        throw new Error('You do not have permission to issue stock.')
    reconcileTrackedUnitBalances()
    const { batch, plans } = registeredBatchStockPlans(input.batchId || input.batch || input.code)
    const snapshot = inventoryStateSnapshot()
    const productRefs = new Map(state.products.map((product) => [product.id, product]))
    const batchRemovalId = nextBatchRemovalId()
    try {
        const results = plans.map(({ product, position, quantity }) => {
            if (product.trackingMode === 'unit' && !Number.isInteger(quantity))
                throw new Error(`${product.name} is unit-tracked and requires whole quantities in the batch recipe.`)
            const unitIds = product.trackingMode === 'unit'
                ? availableStockUnits(product.id, {
                      positionId: position.id,
                      warehouseId: position.warehouseId,
                      locationId: position.locationId,
                      lotId: position.lotId,
                      stockSource: 'batch',
                  }).map((unit) => unit.id)
                : []
            if (product.trackingMode === 'unit' && unitIds.length !== quantity)
                throw new Error(`Tracked unit balance is inconsistent for ${product.name}.`)
            return adjustStock({
                productId: product.id,
                quantity,
                sourceWarehouseId: position.warehouseId,
                sourceLocationId: position.locationId,
                lotId: position.lotId,
                positionId: position.id,
                unitIds,
                stockSource: 'batch',
                batchGroupId: batch.id,
                batchRemovalId,
                batch: batch.id,
                direction: 'out',
                reason: input.reason || 'Damaged',
                reference: input.reference,
                remark: input.remark,
                photo: input.photo,
            })
        })
        const refreshed = findBatch(batch.id)
        if (number(refreshed?.availableQuantity) > 0.0001)
            throw new Error('Batch removal validation failed: some batch stock is still available.')
        persistInventory()
        return {
            id: batchRemovalId,
            batchId: batch.id,
            batchName: batch.name,
            productCount: batch.productCount,
            totalQuantity: plans.reduce((sum, plan) => sum + number(plan.quantity), 0),
            results,
            reason: String(input.reason || 'Damaged').trim(),
            createdAt: nowIso(),
        }
    } catch (error) {
        restoreInventorySnapshot(snapshot, productRefs)
        syncDerivedInventory()
        persistInventory()
        throw error
    }
}

function recordLabelPrint(input = {}) {
    if (!can(PERMISSIONS.PRINT_LABELS))
        throw new Error('You do not have permission to print labels.')
    const items = (Array.isArray(input.items) ? input.items : [])
        .map((item) => ({
            productId: String(item?.productId || ''),
            unitId: String(item?.unitId || ''),
            unitCode: String(item?.unitCode || item?.code || ''),
            lotId: String(item?.lotId || ''),
            batchId: String(item?.batchId || ''),
            quantity: number(item?.quantity),
        }))
    const batch = input.batchId ? findBatch(input.batchId) : null
    const productIds = [...new Set([
        ...items.map((item) => item.productId).filter(Boolean),
        ...(batch?.items || []).map((item) => item.productId),
    ])]
    if (!items.length && !batch)
        throw new Error('No printable label items were selected.')

    const printId = nextDocumentId('PRT', state.labelPrints)
    return runInventoryTransaction(() => {
        const account = currentStaff() || { employeeId: 'SYSTEM', name: 'System' }
        const printJob = {
            id: printId,
            printId,
            source: String(input.source || 'labels'),
            batchId: String(input.batchId || ''),
            shipmentDraftKind: String(input.shipmentDraftKind || ''),
            labelCount: Math.max(1, Math.round(number(input.labelCount) || items.length || 1)),
            copiesPerItem: Math.max(1, Math.round(number(input.copiesPerItem) || 1)),
            size: String(input.size || ''),
            orientation: String(input.orientation || ''),
            items,
            productIds,
            printedBy: account.employeeId,
            printedByName: account.name,
            status: 'printed',
            createdAt: nowIso(),
        }
        state.labelPrints.unshift(printJob)
        productIds.forEach((productId) => {
            const product = findProduct(productId)
            if (!product) return
            const productItems = items.filter((item) => item.productId === productId)
            const lotIds = [...new Set(productItems.map((item) => item.lotId).filter(Boolean))]
            const unitIds = [...new Set(productItems.map((item) => item.unitId).filter(Boolean))]
            const unitCodes = [...new Set(productItems.map((item) => item.unitCode).filter(Boolean))]
            const stock = productStock(product.id)
            recordMovement(product, {
                beforeQuantity: stock,
                changedQuantity: 0,
                afterQuantity: stock,
                type: 'Label Print',
                reason: 'Label Print',
                reference: printId,
                batch: batch?.id || '',
                batchGroupId: batch?.id || '',
                lotId: lotIds.length === 1 ? lotIds[0] : '',
                unitIds,
                unitCodes,
                remark: `${printJob.labelCount} label${printJob.labelCount === 1 ? '' : 's'}`,
            })
        })
        return printJob
    })
}

function nextStockCountId() {
    const prefix = `CNT-${todayCode()}-`
    const sequence = state.stockCounts.filter((item) =>
        String(item.id || '').startsWith(prefix),
    ).length + 1
    return `${prefix}${String(sequence).padStart(3, '0')}`
}

function stockCountRows(warehouseId, locationId = '') {
    const warehouse = findWarehouse(warehouseId)
    if (!warehouse) throw new Error('Select a warehouse to count.')
    return state.stockPositions
        .filter((position) =>
            position.warehouseId === warehouse.id &&
            (!locationId || position.locationId === locationId) &&
            number(position.availableQuantity) > 0,
        )
        .map((position) => {
            const product = findProduct(position.productId)
            const lot = state.stockLots.find((item) => item.id === position.lotId)
            const location = findLocation(position.warehouseId, position.locationId)
            const registeredBatch = isRegisteredBatchLot(lot)
            return {
                id: `count-line-${position.id}`,
                positionId: position.id,
                productId: position.productId,
                productName: product?.name || position.productName || 'Product',
                sku: product?.sku || '',
                unit: product?.unit || position.unit || 'pcs',
                trackingMode: product?.trackingMode || 'none',
                warehouseId: position.warehouseId,
                warehouseName: warehouse.name,
                locationId: position.locationId,
                locationName: location?.name || position.location || '',
                lotId: position.lotId || '',
                lotCode: lot?.batchNumber || '',
                stockSource: registeredBatch ? 'batch' : 'product',
                batchId: registeredBatch ? lot.batchGroupId : '',
                sourceLabel: registeredBatch
                    ? `Batch ${lot.batchGroupId}`
                    : 'Product Stock',
                receivedDate: lot?.receivedDate || position.createdAt || '',
                systemQuantity: number(position.availableQuantity),
                countedQuantity: number(position.availableQuantity),
            }
        })
        .sort((left, right) =>
            left.locationName.localeCompare(right.locationName) ||
            left.productName.localeCompare(right.productName) ||
            left.receivedDate.localeCompare(right.receivedDate),
        )
}

function createStockCount(input = {}) {
    if (!can(PERMISSIONS.COUNT_STOCK))
        throw new Error('You do not have permission to count stock.')
    const rows = stockCountRows(input.warehouseId, input.locationId)
    if (!rows.length) throw new Error('There is no stock in this count scope.')
    const account = currentStaff() || { employeeId: 'SYSTEM', name: 'System' }
    const count = {
        id: nextStockCountId(),
        warehouseId: input.warehouseId,
        warehouseName: findWarehouse(input.warehouseId)?.name || '',
        locationId: input.locationId || '',
        locationName: input.locationId
            ? findLocation(input.warehouseId, input.locationId)?.name || ''
            : 'All locations',
        status: 'in_progress',
        lines: rows,
        createdBy: account.employeeId,
        createdByName: account.name,
        createdAt: nowIso(),
        submittedAt: '',
        approvedAt: '',
    }
    state.stockCounts.unshift(count)
    persistInventory()
    return count
}

function findStockCount(id) {
    return state.stockCounts.find((item) => item.id === id) || null
}

function submitStockCount(id, values = []) {
    if (!can(PERMISSIONS.COUNT_STOCK))
        throw new Error('You do not have permission to count stock.')
    const count = findStockCount(id)
    if (!count || count.status !== 'in_progress')
        throw new Error('This stock count is no longer editable.')
    const byPosition = new Map(values.map((item) => [item.positionId, item]))
    count.lines.forEach((line) => {
        const value = byPosition.get(line.positionId)
        if (!value || value.countedQuantity === '' || value.countedQuantity === null)
            throw new Error('Enter every physical count before review.')
        const quantity = number(value.countedQuantity)
        if (quantity < 0) throw new Error('A physical count cannot be negative.')
        if (line.trackingMode === 'unit' && !Number.isInteger(quantity))
            throw new Error(`${line.productName} requires a whole-number count.`)
        line.countedQuantity = quantity
        line.variance = quantity - number(line.systemQuantity)
    })
    count.status = 'submitted'
    count.submittedAt = nowIso()
    persistInventory()
    return count
}

function applyTrackedCountVariance(line, position, variance, count) {
    const product = findProduct(line.productId)
    if (!product || product.trackingMode !== 'unit') return []
    if (variance < 0) {
        const units = state.stockUnits
            .filter((unit) => unit.positionId === position.id && unit.status === 'available')
            .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
            .slice(0, Math.abs(variance))
        if (units.length !== Math.abs(variance))
            throw new Error(`Unit records for ${line.productName} do not match the stock position.`)
        units.forEach((unit) => {
            unit.status = 'count-loss'
            unit.outboundReference = count.id
            unit.outboundAt = nowIso()
        })
        return units
    }
    if (variance > 0) {
        const lot = state.stockLots.find((item) => item.id === position.lotId)
        if (!lot) throw new Error(`The receipt layer for ${line.productName} no longer exists.`)
        const firstOrdinal = nextStockUnitOrdinal(lot.id)
        const previousLedgerQuantity = state.stockUnits.filter(
            (unit) => unit.productId === product.id && unit.lotId === lot.id,
        ).length
        const nextLedgerQuantity = previousLedgerQuantity + variance
        const units = Array.from({ length: variance }, (_, index) => {
            const ordinal = firstOrdinal + index
            return normalizeStockUnit({
                id: `unit-${normalizeCode(lot.id)}-COUNT-${String(ordinal).padStart(3, '0')}`,
                code: unitCode(product, lot.batchNumber, ordinal),
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                batchId: lot.batchNumber,
                lotId: lot.id,
                positionId: position.id,
                receiptId: lot.receiptId || '',
                ordinal,
                batchOrdinal: ordinal,
                warehouseId: position.warehouseId,
                warehouseName: position.warehouseName,
                locationId: position.locationId,
                location: position.location,
                status: 'available',
                countReference: count.id,
                receiptQuantity: nextLedgerQuantity,
            })
        })
        state.stockUnits.push(...units)
        lot.trackedUnitQuantity = nextLedgerQuantity
        lot.updatedAt = nowIso()
        state.stockUnits
            .filter((unit) => unit.productId === product.id && unit.lotId === lot.id)
            .forEach((unit) => {
                unit.receiptQuantity = nextLedgerQuantity
            })

        if (isRegisteredBatchLot(lot)) {
            const batchLotIds = new Set(
                state.stockLots
                    .filter((candidate) => candidate.batchGroupId === lot.batchGroupId)
                    .map((candidate) => candidate.id),
            )
            const batchPartTotal = state.stockUnits.filter((unit) => batchLotIds.has(unit.lotId)).length
            state.stockUnits
                .filter((unit) => batchLotIds.has(unit.lotId))
                .forEach((unit) => {
                    unit.batchPartTotal = batchPartTotal
                })
        }
        return units
    }
    return []
}

function approveStockCount(id) {
    if (!can(PERMISSIONS.APPROVE_STOCK_COUNT))
        throw new Error('You do not have access to approve this stock count.')
    const count = findStockCount(id)
    if (!count || count.status !== 'submitted')
        throw new Error('Submit the stock count before approval.')
    const account = currentStaff() || { employeeId: 'SYSTEM', name: 'System' }
    return runInventoryTransaction(() => {
        count.lines.forEach((line) => {
            const position = state.stockPositions.find((item) => item.id === line.positionId)
            if (!position)
                throw new Error(`${line.productName} was moved after this count started. Start a new count.`)
            if (Math.abs(number(position.availableQuantity) - number(line.systemQuantity)) > 0.0001)
                throw new Error(`${line.productName} at ${line.locationName} changed after counting. Start a new count.`)
        })
        count.lines.forEach((line) => {
            const variance = number(line.countedQuantity) - number(line.systemQuantity)
            if (Math.abs(variance) <= 0.0001) return
            const product = findProduct(line.productId)
            const position = state.stockPositions.find((item) => item.id === line.positionId)
            const totalBefore = productStock(product.id)
            const affectedUnits = applyTrackedCountVariance(line, position, variance, count)
            position.availableQuantity = number(line.countedQuantity)
            position.updatedAt = nowIso()
            recordMovement(product, {
                beforeQuantity: line.systemQuantity,
                changedQuantity: variance,
                afterQuantity: line.countedQuantity,
                totalBeforeQuantity: totalBefore,
                totalAfterQuantity: totalBefore + variance,
                type: variance > 0 ? 'Count Gain' : 'Count Loss',
                reason: variance > 0 ? 'Stock Count Gain' : 'Stock Count Loss',
                warehouseId: line.warehouseId,
                locationId: line.locationId,
                lotId: line.lotId,
                batch: line.lotCode,
                reference: count.id,
                remark: `Physical count approved by ${account.name}`,
                unitIds: affectedUnits.map((unit) => unit.id),
                unitCodes: affectedUnits.map((unit) => unit.code),
            })
        })
        count.status = 'posted'
        count.approvedBy = account.employeeId
        count.approvedByName = account.name
        count.approvedAt = nowIso()
        return count
    })
}

function cancelStockCount(id) {
    const count = findStockCount(id)
    if (!count || count.status === 'posted') return false
    count.status = 'cancelled'
    count.cancelledAt = nowIso()
    persistInventory()
    return true
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
    currentStaff,
    updateMyAccount,
    can,
    nextEmployeeId,
    saveStaff,
    nextSupplierCode,
    findSupplier,
    saveSupplier,
    setSupplierStatus,
    logout,
    lockSession,
    unlockSession,
    findProduct,
    stockLayerCode,
    findBatch,
    findStockUnit,
    findTransfer,
    findStockInRequest,
    isTransferMovement,
    movementQuantity,
    movementUnit,
    movementBalances,
    movementRoute,
    findShipmentForMovement,
    shipmentMovementContext,
    findReceiptForMovement,
    findReceiptForStock,
    productStatus,
    expiryStatus,
    nextSku,
    addProductCategory,
    previewNextBatchNumber: nextBatchNumber,
    registerBatchDefinition,
    updateBatchDefinition,
    previewNextReceiptBatchNumber: nextReceiptBatchNumber,
    generateDocumentNumber,
    generateStockMovementNumber,
    createStockInRequest,
    createSupplierStockInRequest,
    confirmSupplierStockInRequest,
    executeStockMovement,
    updateStockInRequestDetails,
    confirmStockInRequest,
    batchWarehouseAvailability,
    cancelStockInRequest,
    saveProduct,
    setProductActive,
    findWarehouse,
    findLocation,
    saveWarehouse,
    saveWarehouseLocation,
    deleteWarehouse,
    deleteWarehouseLocation,
    warehouseProducts,
    warehouseStock,
    warehouseSummary,
    warehouseInventory,
    locationMetrics,
    stockPositionsFor,
    stockLotsFor,
    batchGroups,
    productStock,
    productStockBreakdown,
    availableStockUnits,
    auditTrackedUnitBalances: trackedUnitBalanceIssues,
    repairTrackedUnitBalances: reconcileTrackedUnitBalances,
    previewShipmentAllocation,
    previewBatchShipment,
    createShipment,
    createBatchShipment,
    voidShipment,
    recordLabelPrint,
    stockCountRows,
    createStockCount,
    findStockCount,
    submitStockCount,
    approveStockCount,
    cancelStockCount,
    receiveStock,
    receiveStockBatch,
    receiveSupplierBatchOrder,
    adjustStock,
    transferStock,
    transferRegisteredBatch,
    removeRegisteredBatch,
    addToast,
    removeToast,
    dashboardStats,
}

export { inventoryStore, STORAGE }
