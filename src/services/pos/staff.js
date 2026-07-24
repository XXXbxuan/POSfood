import { normalizeStaffPermissions } from './permissions.js'

const STAFF_STORAGE_KEY = 'posfood_accounts'
const STAFF_ROLES = ['Superadmin', 'Admin', 'Kitchen']

const DEFAULT_SUPERADMIN = {
    name: 'Alice Tan',
    employeeId: 'EMP001',
    password: 'restro123',
    pin: '1234',
    role: 'Superadmin',
    status: 'active',
}

function normalizeRole(role) {
    const match = STAFF_ROLES.find(
        (item) => item.toLowerCase() === String(role || '').toLowerCase(),
    )
    return match || 'Kitchen'
}

function normalizeStaff(account = {}) {
    return {
        ...account,
        name: String(account.name || '').trim(),
        employeeId: String(account.employeeId || '').trim().toUpperCase(),
        password: String(account.password || ''),
        pin: String(account.pin || ''),
        role: normalizeRole(account.role),
        status: account.status === 'disabled' ? 'disabled' : 'active',
        permissions: normalizeStaffPermissions(
            normalizeRole(account.role),
            account.permissions,
        ),
    }
}

function readStoredStaff() {
    try {
        const accounts = JSON.parse(localStorage.getItem(STAFF_STORAGE_KEY))
        return Array.isArray(accounts) ? accounts.map(normalizeStaff) : []
    } catch (error) {
        return []
    }
}

function loadStaffAccounts() {
    const accounts = readStoredStaff()
    const storedSuperadmin = accounts.find(
        (account) => account.employeeId === DEFAULT_SUPERADMIN.employeeId,
    )
    return [
        storedSuperadmin || DEFAULT_SUPERADMIN,
        ...accounts.filter(
            (account) => account.employeeId !== DEFAULT_SUPERADMIN.employeeId,
        ),
    ].map(normalizeStaff)
}

function saveStaffAccounts(accounts) {
    const normalized = accounts.map(normalizeStaff)
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(normalized))
    window.dispatchEvent(
        new CustomEvent('pos-staff:changed', { detail: normalized }),
    )
    return normalized
}

function recordStaffLogin(employeeId) {
    const id = String(employeeId || '').trim().toUpperCase()
    const accounts = loadStaffAccounts().map((account) =>
        account.employeeId === id
            ? { ...account, lastLoginAt: new Date().toISOString() }
            : account,
    )
    saveStaffAccounts(accounts)
    return accounts.find((account) => account.employeeId === id) || null
}

function findStaffAccount(employeeId) {
    const id = String(employeeId || '').trim().toUpperCase()
    return loadStaffAccounts().find((account) => account.employeeId === id)
}

function nextEmployeeId(accounts = loadStaffAccounts()) {
    const highest = accounts.reduce((value, account) => {
        const number = Number(account.employeeId.replace(/\D/g, '')) || 0
        return Math.max(value, number)
    }, 0)
    return `EMP${String(highest + 1).padStart(3, '0')}`
}

function canManageStaff(role) {
    return normalizeRole(role) === 'Superadmin'
}

export {
    DEFAULT_SUPERADMIN,
    STAFF_ROLES,
    canManageStaff,
    findStaffAccount,
    loadStaffAccounts,
    nextEmployeeId,
    normalizeRole,
    recordStaffLogin,
    saveStaffAccounts,
}
