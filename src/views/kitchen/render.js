import { h, resolveComponent } from 'vue'

function icon(name) {
    return h('i', { class: `fa-solid ${name}`, 'aria-hidden': 'true' })
}

function itemOptionSummary(item) {
    const details = [
        item.size || item.state?.size,
        ...(item.optionLines || []),
        ...(item.state?.addons || item.addons || []),
        ...(item.state?.removedIngredients || item.removedIngredients || []).map(
            (name) => `No ${name}`,
        ),
    ]
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
    return details.slice(0, 2).join(' · ')
}

function renderQuickDishButton(
    ctx,
    ticket,
    item,
    status,
    completeHandler,
    options = {},
) {
    const disabled =
        ticket.status === 'completed' ||
        ['done', 'returned'].includes(status)
    return h(
        'button',
        {
            type: 'button',
            class: [
                'kitchen-ticket-dish-action',
                status,
                {
                    'set-selection': options.setSelection,
                    'no-icon': status !== 'done',
                },
            ],
            disabled,
            onClick: (event) => {
                event.stopPropagation()
                if (!disabled) completeHandler()
            },
        },
        [
            status === 'done'
                ? h('span', { class: 'kitchen-ticket-dish-icon' }, [
                      icon('fa-check'),
                  ])
                : null,
            h('span', { class: 'kitchen-ticket-dish-copy' }, [
                h('strong', item.name),
                itemOptionSummary(item)
                    ? h('small', itemOptionSummary(item))
                    : null,
            ]),
            status === 'returned'
                ? h('span', { class: 'kitchen-ticket-dish-state returned' }, 'RETURN')
                : status === 'done'
                  ? h('span', { class: 'kitchen-ticket-dish-state done' }, 'DONE')
                  : null,
        ],
    )
}

function renderTicketItems(ctx, ticket) {
    const rows = []
    let lastGroup = ''
    ctx.sortedTicketItems(ticket).forEach((item, itemIndex) => {
        const itemStatus = ctx.itemDisplayStatus(item)
        if (item.groupLabel !== lastGroup) {
            lastGroup = item.groupLabel
            rows.push(
                h(
                    'li',
                    {
                        key: `group-${lastGroup}-${rows.length}`,
                        class: 'kitchen-ticket-group-label',
                    },
                    lastGroup,
                ),
            )
        }

        if (item.setSelections?.length) {
            const expanded = ctx.isTicketSetExpanded(ticket.id, item)
            const allSetDone = ctx.setItemAllDone(item)
            rows.push(
                h(
                    'li',
                    {
                        key: `set-${item.id}`,
                        class: 'kitchen-ticket-set-row',
                    },
                    [
                        h(
                            'button',
                            {
                                type: 'button',
                                class: [
                                    'kitchen-ticket-set-heading',
                                    itemStatus,
                                    { expanded, collapsed: !expanded },
                                ],
                                onClick: (event) => {
                                    event.stopPropagation()
                                    ctx.toggleTicketSet(ticket.id, item)
                                },
                            },
                            [
                                h(
                                    'span',
                                    { class: 'kitchen-ticket-set-heading-left' },
                                    [
                                        itemStatus === 'done'
                                            ? h(
                                                  'span',
                                                  {
                                                      class: [
                                                          'kitchen-ticket-dish-icon',
                                                          'set-icon',
                                                          itemStatus,
                                                      ],
                                                  },
                                                  [icon('fa-check')],
                                              )
                                            : null,
                                        h('strong', item.name),
                                    ],
                                ),
                                h('small', [
                                    `${item.setSelections.length} set dishes`,
                                    allSetDone
                                        ? null
                                        : h('i', {
                                              class: `fa-solid ${
                                                  expanded
                                                      ? 'fa-chevron-up'
                                                      : 'fa-chevron-down'
                                              }`,
                                              'aria-hidden': 'true',
                                          }),
                                ]),
                            ],
                        ),
                        expanded
                            ? h(
                                  'div',
                                  { class: 'kitchen-ticket-set-panel' },
                                  [
                                      h(
                                          'div',
                                          { class: 'kitchen-ticket-set-dishes' },
                                          ctx.sortedSetSelections(item).map(
                                              ({ selection, setIndex }, selectionIndex) =>
                                                  renderQuickDishButton(
                                                      ctx,
                                                      ticket,
                                                      selection,
                                                      selection.kitchenStatus || 'queued',
                                                      () =>
                                                          ctx.quickCompleteSetSelection(
                                                              ticket,
                                                              item,
                                                              setIndex,
                                                          ),
                                                      {
                                                          setSelection: true,
                                                          itemIndex,
                                                          selectionIndex,
                                                      },
                                                  ),
                                          ),
                                      ),
                                  ],
                              )
                            : null,
                    ],
                ),
            )
            return
        }

        rows.push(
            h(
                'li',
                {
                    key: item.id,
                    class: 'kitchen-ticket-dish-row',
                },
                [
                    renderQuickDishButton(
                        ctx,
                        ticket,
                        item,
                        itemStatus,
                        () => ctx.quickCompleteItem(ticket, item),
                    ),
                ],
            ),
        )
    })
    return h('ul', { class: 'kitchen-ticket-items' }, rows)
}

function renderTicketCardSlider(ctx, ticket) {
    const slideValue = ctx.cardSlideValue(ticket.id)
    return h(
        'footer',
        {
            class: 'kitchen-ticket-card-slider',
            onClick: (event) => event.stopPropagation(),
            onPointerdown: (event) => event.stopPropagation(),
        },
        [
            h('div', { class: 'kitchen-ticket-card-slide-track' }, [
                h('span', {
                    class: 'kitchen-ticket-card-slide-fill',
                    style: { width: `${slideValue}%` },
                }),
                h('strong', [
                    icon('fa-check-double'),
                    ' Slide to finish order',
                ]),
                h('input', {
                    type: 'range',
                    min: 0,
                    max: 100,
                    step: 1,
                    value: slideValue,
                    'aria-label': `Slide to finish order ${ticket.orderNumber}`,
                    onInput: (event) =>
                        ctx.setCardSlideValue(
                            ticket.id,
                            Number(event.target.value),
                        ),
                    onChange: () => ctx.handleCardSlideRelease(ticket),
                }),
            ]),
        ],
    )
}

function renderTicketCard(ctx, ticket) {
    const done = ctx.ticketDoneCount(ticket)
    const total = ctx.ticketDishTotal(ticket)
    const progress = total ? Math.round((done / total) * 100) : 0
    const allDone = ctx.ticketAllItemsDone(ticket)
    return h(
        'article',
        {
            key: ticket.id,
            class: [
                'kitchen-ticket-card',
                ticket.status,
                { urgent: ctx.isUrgent(ticket) },
            ],
            role: 'button',
            tabindex: 0,
            onClick: () => ctx.openTicket(ticket),
            onKeydown: (event) => {
                if (
                    event.target === event.currentTarget &&
                    ['Enter', ' '].includes(event.key)
                ) {
                    event.preventDefault()
                    ctx.openTicket(ticket)
                }
            },
        },
        [
            h('div', { class: 'kitchen-ticket-topbar' }, [
                h(
                    'span',
                    { class: 'kitchen-order-number' },
                    String(ticket.orderNumber || ''),
                ),
            ]),
            h('header', [
                h(
                    'strong',
                    { class: 'kitchen-ticket-title' },
                    ctx.orderLocation(ticket),
                ),
                h('div', { class: 'kitchen-ticket-time-row' }, [
                    h('small', { class: 'kitchen-ticket-start-time' }, [
                        icon('fa-clock'),
                        ` ${ctx.formatTime(ticket.createdAt) || ''}`,
                    ]),
                    h(
                        'span',
                        {
                            class: [
                                'kitchen-time-badge',
                                { urgent: ctx.isUrgent(ticket) },
                            ],
                        },
                        [
                            icon(
                                ctx.isUrgent(ticket)
                                    ? 'fa-triangle-exclamation'
                                    : 'fa-clock',
                            ),
                            ` ${ctx.elapsedLabel(ticket)}`,
                        ],
                    ),
                ]),
            ]),
            ticket.orderNote
                ? h('p', { class: 'kitchen-order-note' }, [
                      icon('fa-note-sticky'),
                      ` ${ticket.orderNote}`,
                  ])
                : null,
            renderTicketItems(ctx, ticket),
            allDone && ticket.status !== 'completed'
                ? renderTicketCardSlider(ctx, ticket)
                : h('footer', [
                      h('div', { class: 'kitchen-progress-copy' }, [
                          h(
                              'strong',
                              ticket.status === 'completed'
                                  ? 'Completed'
                                  : `${done} / ${total} dishes`,
                          ),
                          ticket.returnCount
                              ? h(
                                    'small',
                                    `${ticket.returnCount} rework${
                                        ticket.returnCount > 1 ? 's' : ''
                                    }`,
                                )
                              : null,
                      ]),
                      h('div', { class: 'kitchen-progress-track' }, [
                          h('span', {
                              style: { width: `${progress}%` },
                          }),
                      ]),
                      icon('fa-chevron-right'),
                  ]),
        ],
    )
}

function renderDetailSection(title, values, className = '') {
    const lines = (Array.isArray(values) ? values : [values]).filter(Boolean)
    if (!lines.length) return null
    return h('section', { class: ['kitchen-detail-section', className] }, [
        h('span', title),
        h(
            'div',
            lines.map((line) => h('strong', { key: String(line) }, line)),
        ),
    ])
}

function selectedDetailSections(ctx, item) {
    const modifierLines = Object.entries(item.modifiers || {}).map(
        ([name, value]) => `${name}: ${value}`,
    )
    const setLines = (item.setSelections || []).map((selection) => {
        const options = (selection.optionLines || []).join(', ')
        return `${selection.name}${options ? ` — ${options}` : ''}`
    })
    const generalOptions = (item.optionLines || []).filter(
        (line) =>
            line !== item.size &&
            !(item.addons || []).includes(line) &&
            !String(line).startsWith('No '),
    )
    return [
        renderDetailSection('Size', item.size),
        renderDetailSection('Options', [
            ...modifierLines,
            ...generalOptions,
        ]),
        renderDetailSection('Add-ons', item.addons),
        renderDetailSection(
            'Do not include',
            (item.removedIngredients || []).map((name) => `NO ${name}`),
            'kitchen-remove-lines',
        ),
        renderDetailSection('Set items', setLines),
        renderDetailSection('Dish note', item.remark, 'kitchen-note-lines'),
        renderDetailSection(
            'Order note',
            ctx.selectedTicket?.orderNote,
            'kitchen-note-lines',
        ),
    ].filter(Boolean)
}

function renderItemRail(ctx, ticket) {
    const railItems = []
    let lastGroup = ''
    const sortedItems = ctx.sortedTicketItems(ticket)
    sortedItems.forEach((item, index) => {
        const itemStatus = ctx.itemDisplayStatus(item)
        if (item.groupLabel !== lastGroup) {
            lastGroup = item.groupLabel
            railItems.push(
                h(
                    'span',
                    {
                        key: `rail-group-${lastGroup}-${index}`,
                        class: 'kitchen-rail-group-label',
                    },
                    lastGroup,
                ),
            )
        }
        const image = ctx.itemImage(item)
        const isSet = Boolean(item.setSelections?.length)
        const expanded = isSet && ctx.isSetExpanded(item.id)
        railItems.push(
            h(
                'div',
                {
                    key: item.id,
                    class: [
                        'kitchen-rail-item-shell',
                        { 'set-expanded': expanded },
                    ],
                },
                [
                    h(
                        'button',
                        {
                            type: 'button',
                            class: [
                                'kitchen-rail-item',
                                {
                                    active:
                                        item.id === ctx.selectedItemId &&
                                        !ctx.selectedSetDish,
                                    done: item.kitchenStatus === 'done',
                                    returned:
                                        itemStatus === 'returned',
                                },
                            ],
                            onClick: () =>
                                isSet
                                    ? ctx.toggleSet(item)
                                    : ctx.selectItem(item),
                        },
                        [
                            image
                                ? h('img', { src: image, alt: item.name })
                                : icon('fa-bowl-food'),
                            h(
                                'small',
                                `${index + 1} / ${ticket.items.length}`,
                            ),
                            isSet
                                ? h('b', { class: 'kitchen-set-toggle' }, [
                                      icon(
                                          expanded
                                              ? 'fa-chevron-up'
                                              : 'fa-chevron-down',
                                      ),
                                      ' SET',
                                  ])
                                : null,
                            itemStatus === 'done'
                                ? h('span', 'DONE')
                                : itemStatus === 'returned'
                                  ? h(
                                        'span',
                                        { class: 'returned' },
                                        'RETURN',
                                    )
                                  : item.kitchenStatus === 'preparing'
                                    ? h(
                                          'span',
                                          { class: 'preparing' },
                                          'NOW',
                                      )
                                    : null,
                        ],
                    ),
                    expanded
                        ? h(
                              'div',
                              { class: 'kitchen-set-dish-list' },
                              ctx
                                  .sortedSetSelections(item)
                                  .map(({ selection, setIndex }) => {
                                  const setImage = ctx.itemImage(selection)
                                  return h(
                                      'button',
                                      {
                                          key: `${item.id}-${setIndex}`,
                                          type: 'button',
                                          class: {
                                              active:
                                                  ctx.selectedSetDish
                                                      ?.parentId === item.id &&
                                                  ctx.selectedSetDish?.index ===
                                                      setIndex,
                                              done:
                                                  selection.kitchenStatus ===
                                                  'done',
                                              returned:
                                                  selection.kitchenStatus ===
                                                  'returned',
                                          },
                                          onClick: () =>
                                              ctx.selectSetDish(
                                                  item,
                                                  setIndex,
                                              ),
                                      },
                                      [
                                          setImage
                                              ? h('img', {
                                                    src: setImage,
                                                    alt: selection.name,
                                                })
                                              : icon('fa-bowl-food'),
                                          h('span', selection.name),
                                          selection.kitchenStatus === 'done'
                                              ? h(
                                                    'b',
                                                    {
                                                        class:
                                                            'kitchen-set-dish-state done',
                                                    },
                                                    'DONE',
                                                )
                                              : selection.kitchenStatus ===
                                                  'returned'
                                                ? h(
                                                      'b',
                                                      {
                                                          class:
                                                              'kitchen-set-dish-state returned',
                                                      },
                                                      'RETURN',
                                                  )
                                                : selection.kitchenStatus ===
                                                    'preparing'
                                                  ? h(
                                                        'b',
                                                        {
                                                            class:
                                                                'kitchen-set-dish-state preparing',
                                                        },
                                                        'NOW',
                                                    )
                                                  : null,
                                      ],
                                  )
                              }),
                          )
                        : null,
                ],
            ),
        )
    })
    return h('aside', { class: 'kitchen-item-rail' }, [
        h(
            'button',
            {
                type: 'button',
                class: 'kitchen-rail-arrow',
                disabled: ctx.selectedItemIndex <= 0,
                'aria-label': 'Previous dish',
                onClick: () => ctx.moveItem(-1),
            },
            [icon('fa-chevron-up')],
        ),
        h(
            'div',
            { class: 'kitchen-rail-list' },
            railItems,
        ),
        h(
            'button',
            {
                type: 'button',
                class: 'kitchen-rail-arrow',
                disabled:
                    ctx.selectedItemIndex >= sortedItems.length - 1,
                'aria-label': 'Next dish',
                onClick: () => ctx.moveItem(1),
            },
            [icon('fa-chevron-down')],
        ),
    ])
}

function renderFinalSlider(ctx) {
    if (!ctx.allItemsDone || ctx.isHistoryDetail) return null
    return h('section', { class: 'kitchen-final-confirm' }, [
        h('div', { class: 'kitchen-slide-track' }, [
            h('span', {
                class: 'kitchen-slide-fill',
                style: { width: `${ctx.slideValue}%` },
            }),
            h('strong', [
                icon('fa-check-double'),
                ' Slide to finish order',
            ]),
            h('input', {
                type: 'range',
                min: 0,
                max: 100,
                step: 1,
                value: ctx.slideValue,
                'aria-label': 'Slide to finish order',
                onInput: (event) =>
                    (ctx.slideValue = Number(event.target.value)),
                onChange: ctx.handleSlideRelease,
            }),
        ]),
        h(
            'small',
            'All dishes are done. Slide fully from left to right for final confirmation.',
        ),
    ])
}

function renderTicketModal(ctx) {
    const ticket = ctx.selectedTicket
    const item = ctx.displayItem
    const parentItem = ctx.selectedItem
    if (!ticket || !item) return null
    const image = ctx.itemImage(item)
    const itemStatus = item.kitchenStatus || parentItem.kitchenStatus
    const isSetParent =
        Boolean(parentItem.setSelections?.length) &&
        !ctx.selectedSetDish
    return h(
        'div',
        {
            class: 'kitchen-modal-backdrop',
            onClick: (event) => {
                if (event.target === event.currentTarget) ctx.closeTicket()
            },
        },
        [
            h(
                'section',
                {
                    class: 'kitchen-order-modal',
                    role: 'dialog',
                    'aria-modal': 'true',
                    'aria-label': `Kitchen order ${ticket.orderNumber}`,
                },
                [
                    h('header', { class: 'kitchen-modal-header' }, [
                        h('div', [
                            h('span', 'KITCHEN ORDER'),
                            h('h2', `#${ticket.orderNumber}`),
                            h('p', [
                                h('strong', ctx.orderLocation(ticket)),
                                ` · ${ctx.ticketDishTotal(ticket)} dishes · ${ctx.elapsedLabel(
                                    ticket,
                                )}`,
                            ]),
                        ]),
                        h('div', { class: 'kitchen-modal-actions' }, [
                            !ctx.isHistoryDetail
                                ? h(
                                      'button',
                                      {
                                          type: 'button',
                                          class: 'kitchen-return-trigger',
                                          onClick: ctx.openReturnDialog,
                                      },
                                      [
                                          icon('fa-rotate-left'),
                                          ' Return',
                                      ],
                                  )
                                : h(
                                      'button',
                                      {
                                          type: 'button',
                                          class: 'kitchen-ticket-redo',
                                          title: 'Redo entire kitchen order',
                                          'aria-label':
                                              'Redo entire kitchen order',
                                          onClick:
                                              ctx.requestRedoSelectedTicket,
                                      },
                                      [icon('fa-rotate-left')],
                                  ),
                            h(
                                'button',
                                {
                                    type: 'button',
                                    class: 'kitchen-modal-close',
                                    'aria-label': 'Close kitchen order',
                                    onClick: ctx.closeTicket,
                                },
                                [icon('fa-xmark')],
                            ),
                        ]),
                    ]),
                    h('div', { class: 'kitchen-modal-workspace' }, [
                        renderItemRail(ctx, ticket),
                        h('section', { class: 'kitchen-item-detail' }, [
                            h('div', { class: 'kitchen-detail-visual' }, [
                                image
                                    ? h('img', {
                                          src: image,
                                          alt: item.name,
                                      })
                                    : icon('fa-bowl-food'),
                                itemStatus === 'done'
                                    ? h(
                                          'span',
                                          { class: 'kitchen-large-done' },
                                          'DONE',
                                      )
                                    : null,
                            ]),
                            h('div', { class: 'kitchen-detail-copy' }, [
                                h(
                                    'span',
                                    {
                                        class: [
                                            'kitchen-item-status',
                                            itemStatus,
                                        ],
                                    },
                                    itemStatus === 'done'
                                        ? 'Completed'
                                        : itemStatus === 'returned'
                                          ? 'Waiting for cashier'
                                          : itemStatus === 'preparing'
                                          ? 'Preparing now'
                                          : isSetParent
                                            ? 'Select a set dish'
                                            : 'Waiting',
                                ),
                                h('h3', item.name),
                                h('p', [
                                    h('strong', '1x'),
                                    ` · ${item.groupLabel || 'Order'}`,
                                ]),
                                h(
                                    'div',
                                    { class: 'kitchen-detail-grid' },
                                    selectedDetailSections(ctx, item),
                                ),
                                item.returnRequest
                                    ? h(
                                          'section',
                                          {
                                              class:
                                                  'kitchen-return-request-summary',
                                          },
                                          [
                                              h('strong', [
                                                  icon(
                                                      'fa-circle-exclamation',
                                                  ),
                                                  ` ${item.returnRequest.requestType}`,
                                              ]),
                                              h(
                                                  'p',
                                                  item.returnRequest.reason,
                                              ),
                                              item.returnRequest.replacement
                                                  ? h(
                                                        'small',
                                                        `Replace with: ${item.returnRequest.replacement}`,
                                                    )
                                                  : null,
                                          ],
                                      )
                                    : null,
                                ctx.isHistoryDetail
                                    ? h(
                                          'button',
                                          {
                                              type: 'button',
                                              class: isSetParent
                                                  ? 'kitchen-dish-done'
                                                  : 'kitchen-redo-button',
                                              onClick: isSetParent
                                                  ? ctx.selectNextSetDish
                                                  : ctx.requestRedoSelectedItem,
                                          },
                                          [
                                              icon(
                                                  isSetParent
                                                      ? 'fa-list-check'
                                                      : 'fa-rotate-left',
                                              ),
                                              isSetParent
                                                  ? ' Select a set dish'
                                                  : ' Redo this dish',
                                          ],
                                      )
                                    : h(
                                          'button',
                                          {
                                              type: 'button',
                                              class: [
                                                  'kitchen-dish-done',
                                                  {
                                                      completed:
                                                          itemStatus ===
                                                          'done',
                                                      returned:
                                                          itemStatus ===
                                                          'returned',
                                                  },
                                              ],
                                              disabled:
                                                  ['done', 'returned'].includes(
                                                      itemStatus,
                                                  ),
                                              onClick: isSetParent
                                                  ? ctx.selectNextSetDish
                                                  : ctx.completeSelectedItem,
                                          },
                                          [
                                              icon(
                                                  isSetParent
                                                      ? 'fa-list-check'
                                                      : 'fa-check',
                                              ),
                                              itemStatus === 'done'
                                                  ? ' Dish completed'
                                                  : itemStatus === 'returned'
                                                    ? ' Waiting for cashier update'
                                                    : isSetParent
                                                      ? ' Select a set dish'
                                                      : ' Complete dish & next',
                                          ],
                                      ),
                            ]),
                        ]),
                    ]),
                    renderFinalSlider(ctx),
                ],
            ),
        ],
    )
}

function renderRedoConfirm(ctx) {
    if (!ctx.showRedoConfirm || !ctx.selectedTicket) return null
    const entireTicket = ctx.redoConfirmType === 'ticket'
    const dishName = ctx.displayItem?.name || ctx.selectedItem?.name || 'dish'
    return h(
        'div',
        {
            class: 'kitchen-redo-confirm-backdrop',
            onClick: ctx.closeRedoConfirm,
        },
        [
            h(
                'section',
                {
                    class: 'kitchen-redo-confirm-dialog',
                    role: 'alertdialog',
                    'aria-modal': 'true',
                    'aria-label': entireTicket
                        ? 'Confirm redo entire kitchen order'
                        : 'Confirm redo dish',
                    onClick: (event) => event.stopPropagation(),
                },
                [
                    h('div', { class: 'kitchen-redo-confirm-icon' }, [
                        icon('fa-rotate-left'),
                    ]),
                    h(
                        'h3',
                        entireTicket
                            ? 'Redo entire kitchen order?'
                            : 'Redo this dish?',
                    ),
                    h(
                        'p',
                        entireTicket
                            ? `All ${ctx.selectedTicket.items.length} dishes in order #${ctx.selectedTicket.orderNumber} will return to Preparing.`
                            : `${dishName} will return to Preparing.`,
                    ),
                    h('footer', [
                        h(
                            'button',
                            {
                                type: 'button',
                                class: 'cancel',
                                onClick: ctx.closeRedoConfirm,
                            },
                            'Cancel',
                        ),
                        h(
                            'button',
                            {
                                type: 'button',
                                class: 'confirm',
                                onClick: ctx.confirmRedo,
                            },
                            [icon('fa-rotate-left'), ' Confirm'],
                        ),
                    ]),
                ],
            ),
        ],
    )
}

function renderReturnSetPicker(ctx) {
    const item = ctx.returnSetPickerItem
    if (!item) return null
    const selectedCount = item.setSelections.filter((selection, index) =>
        ctx.isReturnTargetSelected(item.id, index),
    ).length
    return h(
        'div',
        {
            class: 'kitchen-return-set-backdrop',
            onClick: (event) => {
                if (event.target === event.currentTarget)
                    ctx.closeReturnSetPicker()
            },
        },
        [
            h(
                'section',
                {
                    class: 'kitchen-return-set-modal',
                    role: 'dialog',
                    'aria-modal': 'true',
                    'aria-label': `Select ${item.name} dishes`,
                },
                [
                    h('header', [
                        h('div', [
                            h('span', 'SET SELECTIONS'),
                            h('h3', item.name),
                            h(
                                'p',
                                `${selectedCount} of ${item.setSelections.length} selected`,
                            ),
                        ]),
                        h(
                            'button',
                            {
                                type: 'button',
                                'aria-label': 'Close set selections',
                                onClick: ctx.closeReturnSetPicker,
                            },
                            [icon('fa-xmark')],
                        ),
                    ]),
                    h(
                        'label',
                        {
                            class: [
                                'kitchen-return-select-all',
                                {
                                    active:
                                        ctx.areAllSetSelectionsSelected(item),
                                },
                            ],
                        },
                        [
                            h('input', {
                                type: 'checkbox',
                                checked:
                                    ctx.areAllSetSelectionsSelected(item),
                                onChange: () =>
                                    ctx.toggleAllSetSelections(item),
                            }),
                            h('div', [
                                h('strong', 'All selections'),
                                h(
                                    'small',
                                    'Select every dish inside this set',
                                ),
                            ]),
                            h(
                                'b',
                                `${selectedCount} / ${item.setSelections.length}`,
                            ),
                        ],
                    ),
                    h(
                        'section',
                        { class: 'kitchen-return-set-options' },
                        ctx
                            .sortedSetSelections(item)
                            .map(({ selection, setIndex }) =>
                                h(
                                    'label',
                                    {
                                        key: `${item.id}-${setIndex}`,
                                        class: {
                                            active:
                                                ctx.isReturnTargetSelected(
                                                    item.id,
                                                    setIndex,
                                                ),
                                            done:
                                                selection.kitchenStatus ===
                                                'done',
                                            returned:
                                                selection.kitchenStatus ===
                                                'returned',
                                        },
                                    },
                                    [
                                        h('input', {
                                            type: 'checkbox',
                                            checked:
                                                ctx.isReturnTargetSelected(
                                                    item.id,
                                                    setIndex,
                                                ),
                                            onChange: () =>
                                                ctx.toggleReturnTarget(
                                                    item.id,
                                                    setIndex,
                                                ),
                                        }),
                                        ctx.itemImage(selection)
                                            ? h('img', {
                                                  src: ctx.itemImage(selection),
                                                  alt: selection.name,
                                              })
                                            : icon('fa-bowl-food'),
                                        h('div', [
                                            h('strong', selection.name),
                                            h(
                                                'small',
                                                `Selection ${setIndex + 1}`,
                                            ),
                                        ]),
                                    ],
                                ),
                            ),
                    ),
                    h('footer', [
                        h(
                            'button',
                            {
                                type: 'button',
                                onClick: ctx.closeReturnSetPicker,
                            },
                            [icon('fa-check'), ' Done'],
                        ),
                    ]),
                ],
            ),
        ],
    )
}

function renderReturnDialog(ctx) {
    if (!ctx.showReturnDialog || !ctx.selectedTicket) return null
    const ticket = ctx.selectedTicket
    return h('div', { class: ['modal-backdrop', 'kitchen-return-backdrop'] }, [
        h(
            'form',
            {
                class: 'kitchen-return-dialog',
                onSubmit: (event) => {
                    event.preventDefault()
                    ctx.submitReturnRequest()
                },
            },
            [
                h('header', [
                    h('div', [
                        h('span', 'KITCHEN RETURN'),
                        h('h3', 'Return or change a dish'),
                        h(
                            'p',
                            `Order #${ticket.orderNumber} · Cashier will be notified`,
                        ),
                    ]),
                    h(
                        'button',
                        {
                            type: 'button',
                            'aria-label': 'Close return request',
                            onClick: ctx.closeReturnDialog,
                        },
                        [icon('fa-xmark')],
                    ),
                ]),
                h(
                    'section',
                    { class: 'kitchen-return-dishes' },
                    ctx.sortedTicketItems(ticket).map((item) => {
                        const isSet = Boolean(item.setSelections?.length)
                        if (!isSet)
                            return h(
                                'label',
                                {
                                    key: item.id,
                                    class: {
                                        active:
                                            ctx.isReturnTargetSelected(
                                                item.id,
                                            ),
                                    },
                                },
                                [
                                    h('input', {
                                        type: 'checkbox',
                                        checked:
                                            ctx.isReturnTargetSelected(
                                                item.id,
                                            ),
                                        onChange: () =>
                                            ctx.toggleReturnTarget(
                                                item.id,
                                            ),
                                    }),
                                    ctx.itemImage(item)
                                        ? h('img', {
                                              src: ctx.itemImage(item),
                                              alt: item.name,
                                          })
                                        : icon('fa-bowl-food'),
                                    h('div', [
                                        h('strong', item.name),
                                        h('small', item.groupLabel),
                                    ]),
                                ],
                            )

                        const expanded = false
                        const selectedCount = item.setSelections.filter(
                            (selection, index) =>
                                ctx.isReturnTargetSelected(item.id, index),
                        ).length
                        return h(
                            'div',
                            {
                                key: item.id,
                                class: [
                                    'kitchen-return-set-shell',
                                    {
                                        active: selectedCount > 0,
                                        expanded,
                                    },
                                ],
                            },
                            [
                                h(
                                    'button',
                                    {
                                        type: 'button',
                                        class: 'kitchen-return-set-trigger',
                                        onClick: () =>
                                            ctx.openReturnSetPicker(item.id),
                                    },
                                    [
                                        ctx.itemImage(item)
                                            ? h('img', {
                                                  src: ctx.itemImage(item),
                                                  alt: item.name,
                                              })
                                            : icon('fa-layer-group'),
                                        h('div', [
                                            h('strong', item.name),
                                            h(
                                                'small',
                                                `${item.setSelections.length} set selections${
                                                    selectedCount
                                                        ? ` · ${selectedCount} selected`
                                                        : ''
                                                }`,
                                            ),
                                        ]),
                                        selectedCount
                                            ? h('b', selectedCount)
                                            : null,
                                        icon('fa-chevron-right'),
                                    ],
                                ),
                                expanded
                                    ? h(
                                          'div',
                                          {
                                              class:
                                                  'kitchen-return-set-picker',
                                          },
                                          [
                                              h(
                                                  'label',
                                                  {
                                                      class:
                                                          'kitchen-return-select-all',
                                                  },
                                                  [
                                                      h('input', {
                                                          type: 'checkbox',
                                                          checked:
                                                              ctx.areAllSetSelectionsSelected(
                                                                  item,
                                                              ),
                                                          onChange: () =>
                                                              ctx.toggleAllSetSelections(
                                                                  item,
                                                              ),
                                                      }),
                                                      h(
                                                          'strong',
                                                          'All selections',
                                                      ),
                                                      h(
                                                          'small',
                                                          `${selectedCount} / ${item.setSelections.length}`,
                                                      ),
                                                  ],
                                              ),
                                              ...item.setSelections.map(
                                                  (
                                                      selection,
                                                      setIndex,
                                                  ) =>
                                                      h(
                                                          'label',
                                                          {
                                                              key: `${item.id}-${setIndex}`,
                                                              class: {
                                                                  active:
                                                                      ctx.isReturnTargetSelected(
                                                                          item.id,
                                                                          setIndex,
                                                                      ),
                                                              },
                                                          },
                                                          [
                                                              h('input', {
                                                                  type: 'checkbox',
                                                                  checked:
                                                                      ctx.isReturnTargetSelected(
                                                                          item.id,
                                                                          setIndex,
                                                                      ),
                                                                  onChange:
                                                                      () =>
                                                                          ctx.toggleReturnTarget(
                                                                              item.id,
                                                                              setIndex,
                                                                          ),
                                                              }),
                                                              ctx.itemImage(
                                                                  selection,
                                                              )
                                                                  ? h('img', {
                                                                        src: ctx.itemImage(
                                                                            selection,
                                                                        ),
                                                                        alt: selection.name,
                                                                    })
                                                                  : icon(
                                                                        'fa-bowl-food',
                                                                    ),
                                                              h('div', [
                                                                  h(
                                                                      'strong',
                                                                      selection.name,
                                                                  ),
                                                                  h(
                                                                      'small',
                                                                      `Selection ${setIndex + 1}`,
                                                                  ),
                                                              ]),
                                                          ],
                                                      ),
                                              ),
                                          ],
                                      )
                                    : null,
                            ],
                        )
                    }),
                ),
                h('nav', { class: 'kitchen-return-types' }, [
                    ...['Return dish', 'Request replacement'].map((type) =>
                        h(
                            'button',
                            {
                                key: type,
                                type: 'button',
                                class: {
                                    active: ctx.returnRequestType === type,
                                },
                                onClick: () =>
                                    (ctx.returnRequestType = type),
                            },
                            type,
                        ),
                    ),
                ]),
                h('label', { class: 'kitchen-return-field' }, [
                    h('span', 'Reason *'),
                    h('textarea', {
                        value: ctx.returnReason,
                        placeholder:
                            'e.g. Ingredient unavailable, equipment issue...',
                        onInput: (event) =>
                            (ctx.returnReason = event.target.value),
                    }),
                ]),
                ctx.returnRequestType === 'Request replacement'
                    ? h('label', { class: 'kitchen-return-field' }, [
                          h('span', 'Replacement / instruction *'),
                          h('input', {
                              value: ctx.returnReplacement,
                              type: 'text',
                              placeholder:
                                  'e.g. Replace prawn with chicken',
                              onInput: (event) =>
                                  (ctx.returnReplacement =
                                      event.target.value),
                          }),
                      ])
                    : null,
                ctx.returnError
                    ? h('p', { class: 'kitchen-return-error' }, [
                          icon('fa-circle-exclamation'),
                          ` ${ctx.returnError}`,
                      ])
                    : null,
                h('footer', [
                    h(
                        'button',
                        {
                            type: 'button',
                            onClick: ctx.closeReturnDialog,
                        },
                        'Cancel',
                    ),
                    h(
                        'button',
                        { type: 'submit' },
                        [icon('fa-paper-plane'), ' Send to cashier'],
                    ),
                ]),
            ],
        ),
        renderReturnSetPicker(ctx),
    ])
}

function render() {
    const ctx = this
    const PosTopbar = resolveComponent('PosTopbar')
    return h('main', { class: 'kitchen-page' }, [
        h(PosTopbar, { 'show-order-actions': false }),
        h('section', { class: 'kitchen-workspace' }, [
            h('header', { class: 'kitchen-heading' }, [
                h('div', [
                    h('span', 'KITCHEN DISPLAY'),
                    h('h1', 'Kitchen orders'),
                    h(
                        'p',
                        'Oldest orders first. Open an order to prepare every dish.',
                    ),
                ]),
                h('div', { class: 'kitchen-heading-summary' }, [
                    h('strong', ctx.activeTickets.length),
                    h('span', 'active orders'),
                ]),
            ]),
            h(
                'nav',
                {
                    class: 'kitchen-status-tabs',
                    'aria-label': 'Kitchen order status',
                },
                ctx.tabs.map((tab) =>
                    h(
                        'button',
                        {
                            key: tab.label,
                            type: 'button',
                            class: { active: ctx.activeTab === tab.label },
                            onClick: () => ctx.setTab(tab.label),
                        },
                        [tab.label, h('span', tab.count)],
                    ),
                ),
            ),
            ctx.visibleTickets.length
                ? h(
                      'section',
                      { class: 'kitchen-ticket-grid' },
                      ctx.visibleTickets.map((ticket) =>
                          renderTicketCard(ctx, ticket),
                      ),
                  )
                : h('section', { class: 'kitchen-empty-state' }, [
                      icon(
                          ctx.activeTab === 'History'
                              ? 'fa-clock-rotate-left'
                              : 'fa-kitchen-set',
                      ),
                      h(
                          'strong',
                          ctx.activeTab === 'History'
                              ? 'No completed orders'
                              : `No ${ctx.activeTab.toLowerCase()} orders`,
                      ),
                      h(
                          'span',
                          ctx.activeTab === 'History'
                              ? 'Finished kitchen orders will appear here.'
                              : 'New confirmed orders will appear automatically.',
                      ),
                  ]),
        ]),
        renderTicketModal(ctx),
        renderReturnDialog(ctx),
        renderRedoConfirm(ctx),
    ])
}

export { render }
