const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const esbuild = require('esbuild')

class MemoryStorage {
    constructor() {
        Object.defineProperty(this, 'values', {
            value: new Map(),
            enumerable: false,
        })
    }

    get length() {
        return this.values.size
    }

    key(index) {
        return [...this.values.keys()][index] ?? null
    }

    getItem(key) {
        return this.values.has(key) ? this.values.get(key) : null
    }

    setItem(key, value) {
        const normalizedKey = String(key)
        const normalizedValue = String(value)
        this.values.set(normalizedKey, normalizedValue)
        Object.defineProperty(this, normalizedKey, {
            value: normalizedValue,
            writable: true,
            configurable: true,
            enumerable: true,
        })
    }

    removeItem(key) {
        const normalizedKey = String(key)
        this.values.delete(normalizedKey)
        delete this[normalizedKey]
    }
}

const compiledPath = path.join(__dirname, '.inventory-store.compiled.cjs')

try {
    global.localStorage = new MemoryStorage()
    global.window = { setTimeout }
    localStorage.setItem('posfood_old_data', '{"legacy":true}')

    const sourcePath = path.join(
        __dirname,
        '..',
        'src',
        'services',
        'inventoryStore.js',
    )
    const source = fs
        .readFileSync(sourcePath, 'utf8')
        .replace(
            "import { reactive } from 'vue'",
            'const reactive = (value) => value',
        )
    const compiled = esbuild.transformSync(source, {
        format: 'cjs',
        target: 'node18',
    })
    fs.writeFileSync(compiledPath, compiled.code)

    const { inventoryStore } = require(compiledPath)
    inventoryStore.initialize()

    assert.equal(localStorage.getItem('posfood_old_data'), null)
    assert.equal(inventoryStore.findStaff('IMS:STAFF:INV001').employeeId, 'INV001')
    inventoryStore.startSession(inventoryStore.findStaff('INV001'))

    const product = inventoryStore.saveProduct({
        name: 'Logic Test Item',
        sku: 'TEST-001',
        category: 'Testing',
        type: 'Retail Product',
        unit: 'pcs',
        minimumStock: 5,
        costPrice: 2,
        supplier: 'Test Supplier',
        location: 'Rack T-01',
        expiryTracking: true,
    })

    const receiving = inventoryStore.receiveStock({
        productId: product.id,
        supplier: 'Test Supplier',
        quantity: 50,
        unitCost: 2,
        batch: 'BTEST001',
        expiryDate: '2027-12-31',
        location: 'Rack T-01',
        invoiceNumber: 'INV-TEST-001',
    })

    assert.equal(receiving.before, 0)
    assert.equal(receiving.after, 50)
    assert.equal(product.currentStock, 50)
    assert.equal(product.batches[0].quantity, 50)
    assert.equal(receiving.movement.staffId, 'INV001')
    assert.equal(inventoryStore.findProduct('IMS:BATCH:TEST-001:BTEST001').id, product.id)

    const stockOut = inventoryStore.adjustStock({
        productId: product.id,
        direction: 'out',
        quantity: 5,
        reason: 'Kitchen Usage',
        reference: 'TEST-OUT-001',
    })

    assert.equal(stockOut.before, 50)
    assert.equal(stockOut.after, 45)
    assert.equal(product.currentStock, 45)
    assert.equal(product.batches[0].quantity, 45)

    assert.throws(
        () =>
            inventoryStore.adjustStock({
                productId: product.id,
                direction: 'out',
                quantity: 46,
                reason: 'Sale',
            }),
        /Insufficient stock/,
    )
    assert.equal(product.currentStock, 45)

    const movements = inventoryStore.state.movements.filter(
        (movement) => movement.productId === product.id,
    )
    assert.equal(movements.length, 2)
    assert.deepEqual(
        movements.map((movement) => movement.afterQuantity),
        [45, 50],
    )

    console.log('Inventory logic checks passed: receive 50 → stock 50 → deduct 5 → stock 45.')
} finally {
    if (fs.existsSync(compiledPath)) fs.rmSync(compiledPath)
}
