import { readList, writeObject } from '@/services/pos/storage.js'

const VOUCHER_KEY = 'posfood_vouchers'
const REDEMPTION_KEY = 'posfood_voucher_redemptions'
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

function localDateKey(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const starterVouchers = [
    {
        id: 'VOUCHER-WELCOME5',
        name: 'Welcome RM5',
        code: 'WELCOME5',
        type: 'fixed',
        value: 5,
        minSpend: 30,
        maxDiscount: 5,
        serviceTypes: ['Dine In', 'Takeaway'],
        weekdays: ALL_DAYS,
        memberOnly: true,
        totalLimit: 500,
        perMemberLimit: 1,
        status: 'active',
    },
    {
        id: 'VOUCHER-LUNCH10',
        name: 'Lunch 10% Off',
        code: 'LUNCH10',
        type: 'percentage',
        value: 10,
        minSpend: 40,
        maxDiscount: 12,
        startTime: '12:00',
        endTime: '17:00',
        serviceTypes: ['Dine In', 'Takeaway'],
        weekdays: [1, 2, 3, 4, 5],
        memberOnly: false,
        totalLimit: 200,
        perMemberLimit: 2,
        status: 'active',
    },
]

function normalizeVoucher(voucher) {
    return {
        id: voucher.id || `VOUCHER-${Date.now()}`,
        name: String(voucher.name || '').trim(),
        code: String(voucher.code || '')
            .trim()
            .toUpperCase(),
        type: voucher.type === 'percentage' ? 'percentage' : 'fixed',
        value: Math.max(0, Number(voucher.value || 0)),
        minSpend: Math.max(0, Number(voucher.minSpend || 0)),
        maxDiscount: Math.max(0, Number(voucher.maxDiscount || 0)),
        startDate: voucher.startDate || '',
        endDate: voucher.endDate || '',
        startTime: voucher.startTime || '',
        endTime: voucher.endTime || '',
        serviceTypes: Array.isArray(voucher.serviceTypes)
            ? voucher.serviceTypes
            : ['Dine In', 'Takeaway'],
        weekdays: Array.isArray(voucher.weekdays)
            ? voucher.weekdays.map(Number)
            : [...ALL_DAYS],
        memberOnly: Boolean(voucher.memberOnly),
        allowedCategories: Array.isArray(voucher.allowedCategories)
            ? voucher.allowedCategories.filter(Boolean)
            : [],
        allowedProducts: Array.isArray(voucher.allowedProducts)
            ? voucher.allowedProducts.filter(Boolean)
            : [],
        totalLimit: Math.max(0, Number(voucher.totalLimit || 0)),
        perMemberLimit: Math.max(0, Number(voucher.perMemberLimit || 0)),
        status: voucher.status === 'disabled' ? 'disabled' : 'active',
        createdAt: voucher.createdAt || new Date().toISOString(),
        updatedAt: voucher.updatedAt || new Date().toISOString(),
    }
}

function loadVouchers() {
    const stored = readList(VOUCHER_KEY)
    if (stored.length) return stored.map(normalizeVoucher)
    const vouchers = starterVouchers.map(normalizeVoucher)
    writeObject(VOUCHER_KEY, vouchers)
    return vouchers
}

function saveVouchers(vouchers) {
    return writeObject(VOUCHER_KEY, vouchers.map(normalizeVoucher))
}

function saveVoucher(input) {
    const vouchers = loadVouchers()
    if (!input.code?.trim()) throw new Error('Voucher code is required.')
    if (Number(input.value || 0) <= 0)
        throw new Error('Discount value must be greater than zero.')
    const code = input.code.trim().toUpperCase()
    const name = input.name?.trim() || code
    const duplicate = vouchers.find(
        (voucher) => voucher.code === code && voucher.id !== input.id,
    )
    if (duplicate) throw new Error('This voucher code already exists.')
    const existingIndex = vouchers.findIndex(
        (voucher) => voucher.id === input.id,
    )
    const existing = existingIndex >= 0 ? vouchers[existingIndex] : null
    const voucher = normalizeVoucher({
        ...existing,
        ...input,
        name,
        code,
        id: existing?.id || `VOUCHER-${Date.now()}`,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    })
    if (existingIndex >= 0) vouchers.splice(existingIndex, 1, voucher)
    else vouchers.unshift(voucher)
    saveVouchers(vouchers)
    return voucher
}

function deleteVoucher(voucherId) {
    const vouchers = loadVouchers().filter(
        (voucher) => voucher.id !== voucherId,
    )
    saveVouchers(vouchers)
    const redemptions = readList(REDEMPTION_KEY).filter(
        (entry) => entry.voucherId !== voucherId,
    )
    writeObject(REDEMPTION_KEY, redemptions)
}

function voucherStatus(voucher, now = new Date()) {
    if (voucher.status === 'disabled') return 'Disabled'
    const today = localDateKey(now)
    if (voucher.startDate && today < voucher.startDate) return 'Scheduled'
    if (voucher.endDate && today > voucher.endDate) return 'Expired'
    const uses = readList(REDEMPTION_KEY).filter(
        (entry) => entry.voucherId === voucher.id,
    ).length
    if (voucher.totalLimit && uses >= voucher.totalLimit) return 'Used up'
    return 'Active'
}

function isTimeAllowed(voucher, now) {
    if (!voucher.startTime || !voucher.endTime) return true
    const current = now.getHours() * 60 + now.getMinutes()
    const [startHour, startMinute] = voucher.startTime.split(':').map(Number)
    const [endHour, endMinute] = voucher.endTime.split(':').map(Number)
    const start = startHour * 60 + startMinute
    const end = endHour * 60 + endMinute
    return start <= end
        ? current >= start && current <= end
        : current >= start || current <= end
}

function eligibleSubtotal(voucher, checkout) {
    const items = checkout.items || []
    if (!voucher.allowedCategories.length && !voucher.allowedProducts.length)
        return Number(checkout.subtotal || 0)
    return items.reduce((total, item) => {
        const categoryMatch = voucher.allowedCategories.includes(item.category)
        const productMatch = voucher.allowedProducts.includes(item.name)
        return categoryMatch || productMatch
            ? total + Number(item.total || 0)
            : total
    }, 0)
}

function validateVoucher(voucher, checkout, member, now = new Date()) {
    if (!voucher) return { valid: false, reason: 'Voucher code not found.' }
    const status = voucherStatus(voucher, now)
    if (status !== 'Active')
        return { valid: false, reason: `Voucher is ${status.toLowerCase()}.` }
    const today = localDateKey(now)
    if (voucher.startDate && today < voucher.startDate)
        return { valid: false, reason: 'Voucher is not available yet.' }
    if (voucher.endDate && today > voucher.endDate)
        return { valid: false, reason: 'Voucher has expired.' }
    if (!voucher.weekdays.includes(now.getDay()))
        return { valid: false, reason: 'Voucher is unavailable today.' }
    if (!isTimeAllowed(voucher, now))
        return { valid: false, reason: 'Voucher is unavailable at this time.' }
    const serviceType = checkout.orderSetup?.orderType || 'Takeaway'
    if (!voucher.serviceTypes.includes(serviceType))
        return {
            valid: false,
            reason: `Only valid for ${voucher.serviceTypes.join(' / ')}.`,
        }
    if (voucher.memberOnly && !member)
        return { valid: false, reason: 'Attach a member to use this voucher.' }
    const subtotal = eligibleSubtotal(voucher, checkout)
    if (subtotal < voucher.minSpend)
        return {
            valid: false,
            reason: `Minimum eligible spend is RM ${voucher.minSpend.toFixed(2)}.`,
        }
    if (voucher.allowedCategories.length || voucher.allowedProducts.length) {
        if (subtotal <= 0)
            return { valid: false, reason: 'No eligible items in this order.' }
    }
    const redemptions = readList(REDEMPTION_KEY).filter(
        (entry) => entry.voucherId === voucher.id,
    )
    if (voucher.totalLimit && redemptions.length >= voucher.totalLimit)
        return { valid: false, reason: 'Voucher redemption limit reached.' }
    if (voucher.perMemberLimit && member) {
        const memberUses = redemptions.filter(
            (entry) => entry.memberId === member.id,
        ).length
        if (memberUses >= voucher.perMemberLimit)
            return { valid: false, reason: 'Member usage limit reached.' }
    }
    return { valid: true, eligibleSubtotal: subtotal }
}

function calculateVoucherDiscount(voucher, checkout) {
    const subtotal = eligibleSubtotal(voucher, checkout)
    const raw =
        voucher.type === 'percentage'
            ? subtotal * (voucher.value / 100)
            : voucher.value
    const limited = voucher.maxDiscount
        ? Math.min(raw, voucher.maxDiscount)
        : raw
    return Number(Math.min(subtotal, limited).toFixed(2))
}

function findVoucherByCode(code) {
    const normalized = String(code || '')
        .trim()
        .toUpperCase()
    return loadVouchers().find((voucher) => voucher.code === normalized) || null
}

function recordVoucherRedemption(voucher, receipt, member) {
    if (!voucher?.id || !receipt?.id) return null
    const redemptions = readList(REDEMPTION_KEY)
    if (redemptions.some((entry) => entry.saleId === receipt.id)) return null
    const redemption = {
        id: `REDEMPTION-${Date.now()}`,
        voucherId: voucher.id,
        voucherCode: voucher.code,
        memberId: member?.id || '',
        saleId: receipt.id,
        amount: Number(receipt.voucherDiscount || 0),
        redeemedAt: new Date().toISOString(),
    }
    writeObject(REDEMPTION_KEY, [redemption, ...redemptions])
    return redemption
}

function voucherRedemptions(voucherId) {
    return readList(REDEMPTION_KEY).filter(
        (entry) => entry.voucherId === voucherId,
    )
}

export {
    ALL_DAYS,
    calculateVoucherDiscount,
    deleteVoucher,
    findVoucherByCode,
    loadVouchers,
    recordVoucherRedemption,
    saveVoucher,
    validateVoucher,
    voucherRedemptions,
    voucherStatus,
}
