import { h, resolveComponent } from 'vue'

const icon = (name) => h('i', { class: ['fa-solid', name] })

function filterButton(ctx, value, current, onClick, rounded = false) {
    return h(
        'button',
        {
            key: value,
            type: 'button',
            class: { active: current === value, rounded },
            'aria-pressed': current === value ? 'true' : 'false',
            onClick,
        },
        value,
    )
}

function summaryCard(label, value, iconName) {
    return h('article', [
        h('span', [icon(iconName), label]),
        h('strong', String(value)),
    ])
}

function renderStaffRow(ctx, staff) {
    return h(
        'button',
        {
            key: staff.employeeId,
            type: 'button',
            class: 'staff-list-row',
            onClick: () => ctx.openStaffEdit(staff),
        },
        [
            h(
                'span',
                { class: 'staff-list-avatar' },
                staff.profileImage
                    ? h('img', {
                          src: staff.profileImage,
                          alt: staff.name,
                      })
                    : ctx.staffInitials(staff.name),
            ),
            h('span', { class: 'staff-list-identity' }, [
                h('strong', staff.name),
                h('small', staff.employeeId),
                h(
                    'small',
                    { class: 'staff-last-login' },
                    `Last login: ${ctx.formatLastLogin(staff.lastLoginAt)}`,
                ),
            ]),
            h(
                'span',
                {
                    class: [
                        'staff-role-badge',
                        String(staff.role).toLowerCase(),
                    ],
                },
                staff.role,
            ),
            h(
                'span',
                { class: ['staff-status', staff.status] },
                staff.status,
            ),
            h('span', { class: 'staff-row-open', 'aria-hidden': 'true' }, [
                icon('fa-chevron-right'),
            ]),
        ],
    )
}

function field(label, input) {
    return h('label', [h('span', label), input])
}

function textInput(ctx, key, props = {}) {
    return h('input', {
        ...props,
        value: ctx.staffForm[key],
        onInput: (event) => {
            ctx.staffForm[key] = event.target.value
        },
    })
}

function yesNoToggle(ctx, page, type, label) {
    const enabled = ctx.permissionEnabled(page, type)
    const locked = ctx.editingStaffId === 'EMP001'
    return h('div', { class: 'staff-permission-setting' }, [
        h('small', label),
        h(
            'div',
            {
                class: 'staff-permission-toggle',
                role: 'group',
                'aria-label': `${page.label} ${label}`,
            },
            [
                h(
                    'button',
                    {
                        type: 'button',
                        class: { active: enabled },
                        disabled: locked,
                        'aria-pressed': enabled ? 'true' : 'false',
                        onClick: () =>
                            ctx.setPagePermission(page, type, true),
                    },
                    [icon('fa-check'), 'Yes'],
                ),
                h(
                    'button',
                    {
                        type: 'button',
                        class: { active: !enabled },
                        disabled: locked,
                        'aria-pressed': !enabled ? 'true' : 'false',
                        onClick: () =>
                            ctx.setPagePermission(page, type, false),
                    },
                    [icon('fa-xmark'), 'No'],
                ),
            ],
        ),
    ])
}

function renderPermissionTrigger(ctx) {
    return h(
        'button',
        {
            type: 'button',
            class: 'staff-permission-open',
            onClick: ctx.openPagePermissions,
        },
        [
            h('span', { class: 'staff-permission-open-icon' }, [
                icon('fa-user-shield'),
            ]),
            h('span', { class: 'staff-permission-open-copy' }, [
                h('strong', 'Page permissions'),
                h(
                    'small',
                    ctx.editingStaffId === 'EMP001'
                        ? 'Superadmin access is protected.'
                        : 'Choose page and action access.',
                ),
            ]),
            icon('fa-chevron-right'),
        ],
    )
}

function renderPermissionPanel(ctx) {
    return h('aside', { class: 'staff-permissions-panel' }, [
        h('header', [
            h('div', [
                h('span', 'ACCESS CONTROL'),
                h('h3', 'Page permissions'),
            ]),
            h('div', { class: 'staff-permissions-header-actions' }, [
                h(
                    'small',
                    ctx.editingStaffId === 'EMP001'
                        ? 'Superadmin access is protected.'
                        : 'Choose exactly Yes or No.',
                ),
                h(
                    'button',
                    {
                        type: 'button',
                        'aria-label': 'Close page permissions',
                        onClick: ctx.closePagePermissions,
                    },
                    [icon('fa-xmark')],
                ),
            ]),
        ]),
        h(
            'div',
            { class: 'staff-permissions-scroll' },
            ctx.staffAccessPages.map((page) =>
                h('article', { key: page.id }, [
                    h('div', { class: 'staff-permission-page' }, [
                        h('span', [icon(page.icon)]),
                        h('div', [
                            h('strong', page.label),
                            h('small', page.description),
                        ]),
                    ]),
                    yesNoToggle(ctx, page, 'view', 'View page'),
                    yesNoToggle(
                        ctx,
                        page,
                        'action',
                        page.actionLabel,
                    ),
                ]),
            ),
        ),
    ])
}

function renderPermissionDialog(ctx) {
    if (!ctx.showPagePermissions) return null

    return h(
        'div',
        {
            class: 'module-modal-backdrop staff-permissions-backdrop',
            onClick: (event) => {
                if (event.target === event.currentTarget)
                    ctx.closePagePermissions()
            },
        },
        [
            h(
                'section',
                {
                    class: 'staff-permissions-modal',
                    role: 'dialog',
                    'aria-modal': 'true',
                    'aria-label': 'Page permissions',
                },
                [
                    renderPermissionPanel(ctx),
                    h('footer', [
                        h(
                            'button',
                            {
                                type: 'button',
                                onClick: ctx.closePagePermissions,
                            },
                            'Done',
                        ),
                    ]),
                ],
            ),
        ],
    )
}

function renderEditor(ctx) {
    if (!ctx.showStaffEditor) return null

    return h(
        'div',
        {
            class: 'module-modal-backdrop staff-editor-backdrop',
            onClick: (event) => {
                if (event.target === event.currentTarget)
                    ctx.closeStaffEditor()
            },
        },
        [
            h(
                'section',
                {
                    class: [
                        'staff-editor-modal',
                        'staff-editor-modal-compact',
                    ],
                    role: 'dialog',
                    'aria-modal': 'true',
                    'aria-label': ctx.editingStaffId
                        ? 'Edit staff'
                        : 'Add staff',
                },
                [
                    h('header', [
                        h('div', [
                            h('span', 'STAFF ACCOUNT'),
                            h(
                                'h2',
                                ctx.editingStaffId
                                    ? 'Edit staff'
                                    : 'Add staff',
                            ),
                        ]),
                        h(
                            'button',
                            {
                                type: 'button',
                                'aria-label': 'Close',
                                onClick: ctx.closeStaffEditor,
                            },
                            [icon('fa-xmark')],
                        ),
                    ]),
                    h(
                        'form',
                        {
                            class: 'staff-editor-form',
                            onSubmit: (event) => {
                                event.preventDefault()
                                ctx.saveStaffAccount()
                            },
                        },
                        [
                            h('div', { class: 'staff-editor-body' }, [
                                h('section', { class: 'staff-account-fields' }, [
                                    h('div', { class: 'staff-fields-grid' }, [
                                        field(
                                            'Staff name',
                                            textInput(ctx, 'name', {
                                                type: 'text',
                                                placeholder: 'Full name',
                                            }),
                                        ),
                                        field(
                                            'Staff ID',
                                            h('input', {
                                                value:
                                                    ctx.staffForm.employeeId,
                                                type: 'text',
                                                readonly: true,
                                            }),
                                        ),
                                        field(
                                            'Role',
                                            h(
                                                'select',
                                                {
                                                    value:
                                                        ctx.staffForm.role,
                                                    disabled:
                                                        ctx.editingStaffId ===
                                                        'EMP001',
                                                    onChange: (event) =>
                                                        ctx.changeStaffRole(
                                                            event.target.value,
                                                        ),
                                                },
                                                ctx.staffRoles.map((role) =>
                                                    h(
                                                        'option',
                                                        {
                                                            key: role,
                                                            value: role,
                                                        },
                                                        role,
                                                    ),
                                                ),
                                            ),
                                        ),
                                        field(
                                            'Status',
                                            h(
                                                'select',
                                                {
                                                    value:
                                                        ctx.staffForm.status,
                                                    disabled:
                                                        ctx.editingStaffId ===
                                                        'EMP001',
                                                    onChange: (event) => {
                                                        ctx.staffForm.status =
                                                            event.target.value
                                                    },
                                                },
                                                [
                                                    h(
                                                        'option',
                                                        { value: 'active' },
                                                        'Active',
                                                    ),
                                                    h(
                                                        'option',
                                                        { value: 'disabled' },
                                                        'Disabled',
                                                    ),
                                                ],
                                            ),
                                        ),
                                        field(
                                            'Password',
                                            textInput(ctx, 'password', {
                                                type: 'password',
                                                placeholder:
                                                    'At least 6 characters',
                                            }),
                                        ),
                                        field(
                                            '4-digit PIN',
                                            textInput(ctx, 'pin', {
                                                type: 'password',
                                                inputmode: 'numeric',
                                                maxlength: '4',
                                                placeholder: '0000',
                                            }),
                                        ),
                                    ]),
                                    renderPermissionTrigger(ctx),
                                    h('p', { class: 'staff-role-help' }, [
                                        icon('fa-shield-halved'),
                                        ctx.roleAccessText,
                                    ]),
                                ]),
                            ]),
                            ctx.staffFormError
                                ? h(
                                      'p',
                                      { class: 'staff-form-error' },
                                      ctx.staffFormError,
                                  )
                                : null,
                            h('footer', [
                                h(
                                    'button',
                                    {
                                        type: 'button',
                                        onClick: ctx.closeStaffEditor,
                                    },
                                    'Cancel',
                                ),
                                h(
                                    'button',
                                    { type: 'submit' },
                                    'Save staff',
                                ),
                            ]),
                        ],
                    ),
                ],
            ),
            renderPermissionDialog(ctx),
        ],
    )
}

function render() {
    const ctx = this
    const PosTopbar = resolveComponent('PosTopbar')

    return h('main', { class: 'staff-management-page' }, [
        h(
            PosTopbar,
            { showOrderActions: false },
            {
                actions: () => [
                    h(
                        'button',
                        {
                            type: 'button',
                            class: 'staff-add-button',
                            onClick: ctx.openStaffCreate,
                        },
                        [icon('fa-user-plus'), 'Add staff'],
                    ),
                    h(
                        'button',
                        {
                            type: 'button',
                            class: 'staff-management-close',
                            'aria-label': 'Close staff management',
                            onClick: () => ctx.$router.push('/pos/start'),
                        },
                        [icon('fa-xmark')],
                    ),
                ],
            },
        ),
        h('section', { class: 'staff-management-content' }, [
            h('header', { class: 'staff-management-header' }, [
                h('div', [
                    h('span', 'ADMIN MANAGEMENT'),
                    h('h1', 'Staff management'),
                    h(
                        'p',
                        'Manage staff access, roles and account status.',
                    ),
                ]),
            ]),
            h('section', { class: 'staff-summary-grid' }, [
                summaryCard(
                    'Total staff',
                    ctx.staffSummary.total,
                    'fa-users',
                ),
                summaryCard(
                    'Active',
                    ctx.staffSummary.active,
                    'fa-user-check',
                ),
                summaryCard(
                    'Disabled',
                    ctx.staffSummary.disabled,
                    'fa-user-lock',
                ),
            ]),
            h('section', { class: 'staff-filter-panel' }, [
                h('label', { class: 'staff-search' }, [
                    icon('fa-magnifying-glass'),
                    h('input', {
                        value: ctx.staffQuery,
                        type: 'search',
                        placeholder: 'Search name or Staff ID',
                        onInput: (event) => {
                            ctx.staffQuery = event.target.value
                        },
                    }),
                ]),
                h(
                    'nav',
                    {
                        class: 'staff-status-filters',
                        'aria-label': 'Filter by status',
                    },
                    ['All', 'Active', 'Disabled'].map((status) =>
                        filterButton(
                            ctx,
                            status,
                            ctx.staffStatusFilter,
                            () => ctx.setStaffStatusFilter(status),
                            true,
                        ),
                    ),
                ),
                h(
                    'nav',
                    {
                        class: 'staff-role-filters',
                        'aria-label': 'Filter by role',
                    },
                    ['All', ...ctx.staffRoles].map((role) =>
                        filterButton(
                            ctx,
                            role,
                            ctx.staffRoleFilter,
                            () => ctx.setStaffRoleFilter(role),
                        ),
                    ),
                ),
            ]),
            h(
                'section',
                { class: 'staff-list' },
                ctx.filteredStaffAccounts.length
                    ? ctx.filteredStaffAccounts.map((staff) =>
                          renderStaffRow(ctx, staff),
                      )
                    : [
                          h('div', { class: 'staff-empty' }, [
                              icon('fa-user-slash'),
                              h('strong', 'No staff found'),
                              h(
                                  'small',
                                  'Try another role, status or search.',
                              ),
                          ]),
                      ],
            ),
        ]),
        renderEditor(ctx),
    ])
}

export { render }
