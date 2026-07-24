const ROLES = Object.freeze({
    SUPERADMIN: 'Superadmin',
    ADMIN: 'Admin',
    KITCHEN: 'Kitchen',
})

const PERMISSIONS = Object.freeze({
    VIEW_POS: 'view_pos',
    CREATE_ORDER: 'create_order',
    CHECKOUT_ORDER: 'checkout_order',
    VIEW_TRANSACTIONS: 'view_transactions',
    REPRINT_RECEIPT: 'reprint_receipt',

    VIEW_MENU: 'view_menu',
    MANAGE_MENU: 'manage_menu',
    VIEW_MEMBERS: 'view_members',
    MANAGE_MEMBERS: 'manage_members',
    REGISTER_MEMBER: 'register_member',
    VIEW_VOUCHERS: 'view_vouchers',
    MANAGE_VOUCHERS: 'manage_vouchers',
    APPLY_VOUCHER: 'apply_voucher',
    VIEW_TABLES: 'view_tables',
    MANAGE_TABLES: 'manage_tables',
    UPDATE_TABLE_STATUS: 'update_table_status',
    MANAGE_LAYOUTS: 'manage_layouts',
    VIEW_REPORTS: 'view_reports',
    EXPORT_REPORTS: 'export_reports',
    VIEW_STAFF: 'view_staff',
    MANAGE_STAFF: 'manage_staff',

    VIEW_KITCHEN: 'view_kitchen',
    UPDATE_KITCHEN_STATUS: 'update_kitchen_status',

    REFUND_TRANSACTION: 'refund_transaction',
    VOID_TRANSACTION: 'void_transaction',
})

const STAFF_ACCESS_PAGES = Object.freeze([
    Object.freeze({
        id: 'orders',
        label: 'Orders',
        description: 'Home, table orders and checkout',
        icon: 'fa-cash-register',
        viewPermissions: Object.freeze([
            PERMISSIONS.VIEW_POS,
            PERMISSIONS.CHECKOUT_ORDER,
        ]),
        actionPermissions: Object.freeze([PERMISSIONS.CREATE_ORDER]),
        actionLabel: 'Add order',
    }),
    Object.freeze({
        id: 'history',
        label: 'History',
        description: 'Transactions and completed receipts',
        icon: 'fa-clock-rotate-left',
        viewPermissions: Object.freeze([PERMISSIONS.VIEW_TRANSACTIONS]),
        actionPermissions: Object.freeze([PERMISSIONS.REPRINT_RECEIPT]),
        actionLabel: 'Reprint',
    }),
    Object.freeze({
        id: 'menu',
        label: 'Menu',
        description: 'Products, categories, sets and availability',
        icon: 'fa-utensils',
        viewPermissions: Object.freeze([PERMISSIONS.VIEW_MENU]),
        actionPermissions: Object.freeze([PERMISSIONS.MANAGE_MENU]),
        actionLabel: 'Add / edit',
    }),
    Object.freeze({
        id: 'members',
        label: 'Membership',
        description: 'Member profiles and points',
        icon: 'fa-address-card',
        viewPermissions: Object.freeze([PERMISSIONS.VIEW_MEMBERS]),
        actionPermissions: Object.freeze([PERMISSIONS.REGISTER_MEMBER]),
        actionLabel: 'Add / edit',
    }),
    Object.freeze({
        id: 'vouchers',
        label: 'Vouchers',
        description: 'Voucher list, redemption and printing',
        icon: 'fa-ticket',
        viewPermissions: Object.freeze([PERMISSIONS.VIEW_VOUCHERS]),
        actionPermissions: Object.freeze([PERMISSIONS.APPLY_VOUCHER]),
        actionLabel: 'Apply',
    }),
    Object.freeze({
        id: 'tables',
        label: 'Table plan',
        description: 'Tables, layouts and availability',
        icon: 'fa-border-all',
        viewPermissions: Object.freeze([PERMISSIONS.VIEW_TABLES]),
        actionPermissions: Object.freeze([
            PERMISSIONS.UPDATE_TABLE_STATUS,
            PERMISSIONS.MANAGE_LAYOUTS,
        ]),
        actionLabel: 'Add / edit',
    }),
    Object.freeze({
        id: 'reports',
        label: 'Reports',
        description: 'Sales and operating reports',
        icon: 'fa-chart-simple',
        viewPermissions: Object.freeze([PERMISSIONS.VIEW_REPORTS]),
        actionPermissions: Object.freeze([PERMISSIONS.EXPORT_REPORTS]),
        actionLabel: 'Export',
    }),
    Object.freeze({
        id: 'staff',
        label: 'Staff',
        description: 'Staff accounts, roles and access',
        icon: 'fa-users-gear',
        viewPermissions: Object.freeze([PERMISSIONS.VIEW_STAFF]),
        actionPermissions: Object.freeze([PERMISSIONS.MANAGE_STAFF]),
        actionLabel: 'Add / edit',
    }),
    Object.freeze({
        id: 'kitchen',
        label: 'Kitchen',
        description: 'Kitchen orders and preparation status',
        icon: 'fa-kitchen-set',
        viewPermissions: Object.freeze([PERMISSIONS.VIEW_KITCHEN]),
        actionPermissions: Object.freeze([
            PERMISSIONS.UPDATE_KITCHEN_STATUS,
        ]),
        actionLabel: 'Update',
    }),
])

const ROLE_PERMISSIONS = Object.freeze({
    [ROLES.SUPERADMIN]: Object.freeze(Object.values(PERMISSIONS)),
    [ROLES.ADMIN]: Object.freeze([
        PERMISSIONS.VIEW_POS,
        PERMISSIONS.CREATE_ORDER,
        PERMISSIONS.CHECKOUT_ORDER,
        PERMISSIONS.VIEW_TRANSACTIONS,
        PERMISSIONS.REPRINT_RECEIPT,
        PERMISSIONS.VIEW_MEMBERS,
        PERMISSIONS.REGISTER_MEMBER,
        PERMISSIONS.VIEW_VOUCHERS,
        PERMISSIONS.APPLY_VOUCHER,
        PERMISSIONS.VIEW_TABLES,
        PERMISSIONS.UPDATE_TABLE_STATUS,
    ]),
    [ROLES.KITCHEN]: Object.freeze([
        PERMISSIONS.VIEW_KITCHEN,
        PERMISSIONS.UPDATE_KITCHEN_STATUS,
    ]),
})

function normalizePermissionRole(role) {
    const normalized = Object.values(ROLES).find(
        (item) => item.toLowerCase() === String(role || '').toLowerCase(),
    )
    return normalized || ''
}

function defaultPermissionsForRole(role) {
    const normalizedRole = normalizePermissionRole(role)
    return [...(ROLE_PERMISSIONS[normalizedRole] || [])]
}

function normalizeStaffPermissions(role, permissions) {
    const allowed = new Set(Object.values(PERMISSIONS))
    const source = Array.isArray(permissions)
        ? permissions
        : defaultPermissionsForRole(role)
    return [...new Set(source)].filter((permission) => allowed.has(permission))
}

function hasPermission(subject, permission) {
    const normalizedRole = normalizePermissionRole(
        typeof subject === 'object' ? subject?.role : subject,
    )
    const assigned =
        typeof subject === 'object' && Array.isArray(subject?.permissions)
            ? normalizeStaffPermissions(normalizedRole, subject.permissions)
            : ROLE_PERMISSIONS[normalizedRole]
    return Boolean(normalizedRole && assigned?.includes(permission))
}

function hasAnyPermission(subject, permissions = []) {
    return permissions.some((permission) =>
        hasPermission(subject, permission),
    )
}

function roleHome(role) {
    return normalizePermissionRole(role) === ROLES.KITCHEN
        ? '/pos/kitchen'
        : '/pos/start'
}

function readActiveAccount() {
    try {
        return (
            JSON.parse(localStorage.getItem('posfood_active_account')) || null
        )
    } catch (error) {
        return null
    }
}

export {
    PERMISSIONS,
    ROLES,
    ROLE_PERMISSIONS,
    STAFF_ACCESS_PAGES,
    defaultPermissionsForRole,
    hasAnyPermission,
    hasPermission,
    normalizeStaffPermissions,
    normalizePermissionRole,
    readActiveAccount,
    roleHome,
}
