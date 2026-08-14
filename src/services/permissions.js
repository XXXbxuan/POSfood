const ROLES = Object.freeze([
    'Developer',
    'Superadmin',
    'Inventory Manager',
    'Warehouse Staff',
    'Viewer',
])

const PERMISSIONS = Object.freeze({
    VIEW_DASHBOARD: 'view_dashboard',
    VIEW_REPORTS: 'view_reports',
    VIEW_PRODUCTS: 'view_products',
    MANAGE_PRODUCTS: 'manage_products',
    RECEIVE_STOCK: 'receive_stock',
    APPROVE_SUPPLIER_RECEIPT: 'approve_supplier_receipt',
    ISSUE_STOCK: 'issue_stock',
    VIEW_WAREHOUSES: 'view_warehouses',
    MANAGE_WAREHOUSES: 'manage_warehouses',
    COUNT_STOCK: 'count_stock',
    APPROVE_STOCK_COUNT: 'approve_stock_count',
    VIEW_STOCK_HISTORY: 'view_stock_history',
    PRINT_LABELS: 'print_labels',
    VIEW_SUPPLIERS: 'view_suppliers',
    MANAGE_SUPPLIERS: 'manage_suppliers',
    VIEW_STAFF: 'view_staff',
    MANAGE_STAFF: 'manage_staff',
})

const ROLE_PERMISSIONS = Object.freeze({
    Developer: Object.freeze(Object.values(PERMISSIONS)),
    Superadmin: Object.freeze(Object.values(PERMISSIONS)),
    'Inventory Manager': Object.freeze(Object.values(PERMISSIONS)),
    'Warehouse Staff': Object.freeze([
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.VIEW_PRODUCTS,
        PERMISSIONS.MANAGE_PRODUCTS,
        PERMISSIONS.RECEIVE_STOCK,
        PERMISSIONS.ISSUE_STOCK,
        PERMISSIONS.VIEW_WAREHOUSES,
        PERMISSIONS.COUNT_STOCK,
        PERMISSIONS.VIEW_STOCK_HISTORY,
        PERMISSIONS.PRINT_LABELS,
        PERMISSIONS.VIEW_SUPPLIERS,
    ]),
    Viewer: Object.freeze([
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.VIEW_PRODUCTS,
        PERMISSIONS.VIEW_STOCK_HISTORY,
        PERMISSIONS.VIEW_WAREHOUSES,
    ]),
})

const ACCESS_MODULES = Object.freeze([
    {
        id: 'warehouses',
        label: 'Warehouses',
        icon: 'fa-boxes-stacked',
        view: PERMISSIONS.VIEW_WAREHOUSES,
        action: PERMISSIONS.MANAGE_WAREHOUSES,
    },
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'fa-table-cells-large',
        view: PERMISSIONS.VIEW_DASHBOARD,
    },
    {
        id: 'reports',
        label: 'Reports',
        icon: 'fa-chart-pie',
        view: PERMISSIONS.VIEW_REPORTS,
    },
    {
        id: 'products',
        label: 'Products',
        icon: 'fa-box',
        view: PERMISSIONS.VIEW_PRODUCTS,
        action: PERMISSIONS.MANAGE_PRODUCTS,
    },
    {
        id: 'stock',
        label: 'Stock operations',
        icon: 'fa-boxes-stacked',
        view: PERMISSIONS.VIEW_STOCK_HISTORY,
        actions: [
            PERMISSIONS.RECEIVE_STOCK,
            PERMISSIONS.ISSUE_STOCK,
            PERMISSIONS.COUNT_STOCK,
        ],
    },
    {
        id: 'supplier-confirmation',
        label: 'Confirm supplier receiving',
        icon: 'fa-circle-check',
        view: PERMISSIONS.APPROVE_SUPPLIER_RECEIPT,
    },
    {
        id: 'stock-count-approval',
        label: 'Approve stock counts',
        icon: 'fa-list-check',
        view: PERMISSIONS.APPROVE_STOCK_COUNT,
    },
    {
        id: 'labels',
        label: 'Print labels',
        icon: 'fa-print',
        view: PERMISSIONS.PRINT_LABELS,
    },
    {
        id: 'suppliers',
        label: 'Suppliers',
        icon: 'fa-truck-fast',
        view: PERMISSIONS.VIEW_SUPPLIERS,
        action: PERMISSIONS.MANAGE_SUPPLIERS,
    },
    {
        id: 'staff',
        label: 'Staff management',
        icon: 'fa-users-gear',
        view: PERMISSIONS.VIEW_STAFF,
        action: PERMISSIONS.MANAGE_STAFF,
    },
])

function normalizeRole(role) {
    const source = String(role || '').trim().toLowerCase()
    if (source === 'manager' || source === 'admin') return 'Inventory Manager'
    if (source === 'warehouse' || source === 'kitchen')
        return 'Warehouse Staff'
    if (source === 'cashier') return 'Viewer'
    return (
        ROLES.find((item) => item.toLowerCase() === source) ||
        'Warehouse Staff'
    )
}

function defaultPermissionsForRole(role) {
    return [...(ROLE_PERMISSIONS[normalizeRole(role)] || [])]
}

function normalizePermissions(role, permissions) {
    const normalizedRole = normalizeRole(role)
    if (normalizedRole === 'Developer')
        return defaultPermissionsForRole('Developer')
    const known = new Set(Object.values(PERMISSIONS))
    const source = Array.isArray(permissions)
        ? permissions
        : defaultPermissionsForRole(role)
    const normalized = [...new Set(source)].filter((permission) => known.has(permission))
    return normalized
}

function hasPermission(subject, permission) {
    if (!subject) return false
    const role = normalizeRole(
        typeof subject === 'object' ? subject.role : subject,
    )
    const permissions =
        typeof subject === 'object' && Array.isArray(subject.permissions)
            ? normalizePermissions(role, subject.permissions)
            : ROLE_PERMISSIONS[role]
    return Boolean(permissions?.includes(permission))
}

export {
    ACCESS_MODULES,
    PERMISSIONS,
    ROLES,
    ROLE_PERMISSIONS,
    defaultPermissionsForRole,
    hasPermission,
    normalizePermissions,
    normalizeRole,
}
