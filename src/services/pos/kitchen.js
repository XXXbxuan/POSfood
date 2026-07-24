import { readList, writeObject } from './storage.js'
import {
    createKitchenReturnNotification,
    loadNotifications,
    resolveKitchenIssues,
} from './notifications.js'

const KITCHEN_TICKETS_KEY = 'posfood_kitchen_tickets'
const MAX_KITCHEN_HISTORY = 100

function orderItems(order) {
    const groups = Array.isArray(order?.orderGroups) && order.orderGroups.length
        ? order.orderGroups
        : [{ label: 'Order', items: order?.items || [] }]

    return groups.flatMap((group, groupIndex) =>
        (group.items || []).flatMap((item, itemIndex) => {
            const quantity = Math.max(1, Number(item.qty) || 1)
            return Array.from({ length: quantity }, (_, quantityIndex) => {
                const { image, ...compactItem } = item
                return {
                    ...compactItem,
                    id: `${groupIndex}-${itemIndex}-${quantityIndex}`,
                    groupLabel: group.label || 'Order',
                    qty: 1,
                    kitchenStatus: 'queued',
                    startedAt: '',
                    completedAt: '',
                }
            })
        }),
    )
}

function kitchenSetSelections(item, previous = null) {
    return (item.setSelections || []).map((selection, index) => {
        const previousSelection = previous?.setSelections?.[index]
        const sameSelection =
            previousSelection &&
            previousSelection.name === selection.name
        const inheritedStatus =
            previous?.kitchenStatus === 'done' ? 'done' : 'queued'
        return {
            ...selection,
            kitchenStatus: sameSelection
                ? previousSelection.kitchenStatus || inheritedStatus
                : inheritedStatus,
            startedAt: sameSelection
                ? previousSelection.startedAt || ''
                : '',
            completedAt: sameSelection
                ? previousSelection.completedAt || ''
                : '',
            returnRequest: sameSelection
                ? previousSelection.returnRequest || null
                : null,
        }
    })
}

function createKitchenTicket(order, existing = null) {
    const previousItems = new Map(
        (existing?.items || []).map((item) => [item.id, item]),
    )
    let hasChangedItems = false
    const items = orderItems(order).map((item) => {
        const previous = previousItems.get(item.id)
        const sameDish =
            previous &&
            previous.name === item.name &&
            previous.key === item.key
        if (!sameDish) hasChangedItems = true
        const setSelections = kitchenSetSelections(
            item,
            sameDish ? previous : null,
        )
        return sameDish
            ? {
                  ...item,
                  setSelections,
                  kitchenStatus: previous.kitchenStatus || 'queued',
                  startedAt: previous.startedAt || '',
                  completedAt: previous.completedAt || '',
                  returnRequest: previous.returnRequest || null,
              }
            : {
                  ...item,
                  setSelections,
              }
    })
    const hasProgress = items.some(
        (item) => item.kitchenStatus !== 'queued',
    )
    const keepCompleted =
        existing?.status === 'completed' &&
        !hasChangedItems &&
        items.every((item) => item.kitchenStatus === 'done')

    return {
        id: String(order.id || `ORDER-${order.orderNumber || Date.now()}`),
        sourceOrderId: String(order.id || ''),
        orderNumber: String(order.orderNumber || order.id || ''),
        orderType: order.orderSetup?.orderType || order.orderType || 'Dine In',
        tableNumber:
            order.orderSetup?.tableNumber || order.tableNumber || '',
        guests: Number(order.guests || order.orderSetup?.guests || 1),
        cashier: order.cashier || '',
        orderNote: order.note || order.orderSetup?.note || '',
        createdAt:
            existing?.createdAt ||
            order.heldAt ||
            order.createdAt ||
            new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: keepCompleted
            ? 'completed'
            : hasProgress
              ? 'preparing'
              : 'new',
        completedAt: keepCompleted ? existing?.completedAt || '' : '',
        returnCount: Number(existing?.returnCount || 0),
        returnedAt: existing?.returnedAt || '',
        items,
    }
}

function trimTickets(tickets) {
    const active = tickets.filter((ticket) => ticket.status !== 'completed')
    const history = tickets
        .filter((ticket) => ticket.status === 'completed')
        .sort(
            (a, b) =>
                new Date(b.completedAt || 0) - new Date(a.completedAt || 0),
        )
        .slice(0, MAX_KITCHEN_HISTORY)
    return [...active, ...history]
}

function saveKitchenTickets(tickets) {
    return writeObject(KITCHEN_TICKETS_KEY, trimTickets(tickets))
}

function sourceOrders() {
    const held = readList('posfood_held_orders')
    let checkout = null
    try {
        checkout = JSON.parse(localStorage.getItem('posfood_checkout'))
    } catch (error) {
        checkout = null
    }
    return [
        ...held,
        ...(checkout?.items?.length || checkout?.orderGroups?.length
            ? [checkout]
            : []),
    ]
}

function loadKitchenTickets() {
    let tickets = readList(KITCHEN_TICKETS_KEY)
    let changed = false
    sourceOrders().forEach((order) => {
        const id = String(order.id || `ORDER-${order.orderNumber || ''}`)
        if (tickets.some((ticket) => ticket.id === id)) return
        tickets.push(createKitchenTicket(order))
        changed = true
    })
    if (changed) tickets = saveKitchenTickets(tickets)
    return tickets
}

function upsertKitchenTicket(order) {
    const tickets = loadKitchenTickets()
    const id = String(order.id || `ORDER-${order.orderNumber || ''}`)
    const index = tickets.findIndex((ticket) => ticket.id === id)
    let ticket = createKitchenTicket(
        order,
        index >= 0 ? tickets[index] : null,
    )
    const resolvedIssueIds = new Set(
        (order.resolvedKitchenIssueIds || []).map(String),
    )
    const resolvedItemIds = new Set(
        loadNotifications()
            .filter((notification) =>
                resolvedIssueIds.has(String(notification.id)),
            )
            .map((notification) => String(notification.itemId || '')),
    )
    if (index >= 0) {
        ticket.items = ticket.items.map((item) => {
            const setSelections = (item.setSelections || []).map(
                (selection, setIndex) =>
                    selection.kitchenStatus === 'returned' &&
                    resolvedItemIds.has(`${item.id}::set::${setIndex}`)
                        ? {
                              ...selection,
                              kitchenStatus: 'queued',
                              startedAt: '',
                              completedAt: '',
                              returnRequest: null,
                          }
                        : selection,
            )
            if (
                item.kitchenStatus === 'returned' &&
                resolvedItemIds.has(item.id)
            )
                return {
                    ...item,
                    setSelections,
                    kitchenStatus: 'queued',
                    startedAt: '',
                    completedAt: '',
                    returnRequest: null,
                }
            if (setSelections.length)
                return {
                    ...item,
                    setSelections,
                    kitchenStatus: setSelections.every(
                        (selection) => selection.kitchenStatus === 'done',
                    )
                        ? 'done'
                        : setSelections.some(
                                (selection) =>
                                    selection.kitchenStatus !== 'queued',
                            )
                          ? 'preparing'
                          : 'queued',
                }
            return item
        })
        if (ticket.items.some((item) => item.kitchenStatus === 'queued')) {
            ticket.status = ticket.items.some(
                (item) => item.kitchenStatus === 'done',
            )
                ? 'preparing'
                : 'new'
            ticket.completedAt = ''
        }
    }
    if (index >= 0) tickets.splice(index, 1, ticket)
    else tickets.unshift(ticket)
    saveKitchenTickets(tickets)
    resolveKitchenIssues([...resolvedIssueIds], {
        orderId: ticket.sourceOrderId,
        orderNumber: ticket.orderNumber,
        action: 'cashier-updated-order',
    })
    return ticket
}

function removeKitchenTicket(orderId, orderNumber = '') {
    const id = String(orderId || '')
    const number = String(orderNumber || '').replace(/^#/, '')
    const remaining = loadKitchenTickets().filter((ticket) => {
        const ticketNumber = String(ticket.orderNumber || '').replace(/^#/, '')
        return !(
            (id &&
                (String(ticket.id || '') === id ||
                    String(ticket.sourceOrderId || '') === id)) ||
            (number && ticketNumber === number)
        )
    })
    saveKitchenTickets(remaining)
    return remaining
}

function updateTicket(ticketId, updater) {
    const tickets = loadKitchenTickets()
    const index = tickets.findIndex((ticket) => ticket.id === ticketId)
    if (index < 0) return null
    const next = updater({
        ...tickets[index],
        items: tickets[index].items.map((item) => ({ ...item })),
    })
    next.updatedAt = new Date().toISOString()
    tickets.splice(index, 1, next)
    saveKitchenTickets(tickets)
    return next
}

function startKitchenItem(ticketId, itemId) {
    return updateTicket(ticketId, (ticket) => {
        ticket.status = 'preparing'
        ticket.completedAt = ''
        ticket.items = ticket.items.map((item) =>
            item.id === itemId &&
            !['done', 'returned'].includes(item.kitchenStatus)
                ? {
                      ...item,
                      kitchenStatus: 'preparing',
                      startedAt: item.startedAt || new Date().toISOString(),
                  }
                : item,
        )
        return ticket
    })
}

function startKitchenSetSelection(ticketId, itemId, setIndex) {
    return updateTicket(ticketId, (ticket) => {
        ticket.status = 'preparing'
        ticket.completedAt = ''
        ticket.items = ticket.items.map((item) => {
            if (item.id !== itemId) return item
            const setSelections = (item.setSelections || []).map(
                (selection, index) =>
                    index === setIndex &&
                    !['done', 'returned'].includes(
                        selection.kitchenStatus,
                    )
                        ? {
                              ...selection,
                              kitchenStatus: 'preparing',
                              startedAt:
                                  selection.startedAt ||
                                  new Date().toISOString(),
                          }
                        : selection,
            )
            return {
                ...item,
                setSelections,
                kitchenStatus: 'preparing',
                startedAt: item.startedAt || new Date().toISOString(),
            }
        })
        return ticket
    })
}

function completeKitchenItem(ticketId, itemId) {
    return updateTicket(ticketId, (ticket) => {
        ticket.status = 'preparing'
        ticket.items = ticket.items.map((item) =>
            item.id === itemId
                ? {
                      ...item,
                      kitchenStatus: 'done',
                      startedAt: item.startedAt || new Date().toISOString(),
                      completedAt: new Date().toISOString(),
                  }
                : item,
        )
        return ticket
    })
}

function completeKitchenSetSelection(ticketId, itemId, setIndex) {
    return updateTicket(ticketId, (ticket) => {
        ticket.status = 'preparing'
        ticket.items = ticket.items.map((item) => {
            if (item.id !== itemId) return item
            const completedAt = new Date().toISOString()
            const setSelections = (item.setSelections || []).map(
                (selection, index) =>
                    index === setIndex
                        ? {
                              ...selection,
                              kitchenStatus: 'done',
                              startedAt:
                                  selection.startedAt || completedAt,
                              completedAt,
                          }
                        : selection,
            )
            const allDone =
                setSelections.length &&
                setSelections.every(
                    (selection) => selection.kitchenStatus === 'done',
                )
            return {
                ...item,
                setSelections,
                kitchenStatus: allDone ? 'done' : 'preparing',
                startedAt: item.startedAt || completedAt,
                completedAt: allDone ? completedAt : '',
            }
        })
        return ticket
    })
}

function completeKitchenTicket(ticketId) {
    return updateTicket(ticketId, (ticket) => {
        if (
            !ticket.items.length ||
            ticket.items.some((item) => item.kitchenStatus !== 'done')
        )
            return ticket
        ticket.status = 'completed'
        ticket.completedAt = new Date().toISOString()
        return ticket
    })
}

function redoKitchenItem(ticketId, itemId) {
    return updateTicket(ticketId, (ticket) => {
        ticket.status = 'preparing'
        ticket.completedAt = ''
        ticket.returnedAt = new Date().toISOString()
        ticket.returnCount = Number(ticket.returnCount || 0) + 1
        ticket.items = ticket.items.map((item) =>
            item.id === itemId
                ? {
                      ...item,
                      kitchenStatus: 'queued',
                      startedAt: '',
                      completedAt: '',
                  }
                : item,
        )
        return ticket
    })
}

function redoKitchenSetSelection(ticketId, itemId, setIndex) {
    return updateTicket(ticketId, (ticket) => {
        ticket.status = 'preparing'
        ticket.completedAt = ''
        ticket.returnedAt = new Date().toISOString()
        ticket.returnCount = Number(ticket.returnCount || 0) + 1
        ticket.items = ticket.items.map((item) => {
            if (item.id !== itemId) return item
            const setSelections = (item.setSelections || []).map(
                (selection, index) =>
                    index === setIndex
                        ? {
                              ...selection,
                              kitchenStatus: 'queued',
                              startedAt: '',
                              completedAt: '',
                              returnRequest: null,
                          }
                        : selection,
            )
            return {
                ...item,
                setSelections,
                kitchenStatus: 'preparing',
                completedAt: '',
                returnRequest: null,
            }
        })
        return ticket
    })
}

function redoKitchenTicket(ticketId) {
    return updateTicket(ticketId, (ticket) => {
        ticket.status = 'preparing'
        ticket.completedAt = ''
        ticket.returnedAt = new Date().toISOString()
        ticket.returnCount = Number(ticket.returnCount || 0) + 1
        ticket.items = ticket.items.map((item) => ({
            ...item,
            kitchenStatus: 'queued',
            startedAt: '',
            completedAt: '',
            returnRequest: null,
            setSelections: (item.setSelections || []).map((selection) => ({
                ...selection,
                kitchenStatus: 'queued',
                startedAt: '',
                completedAt: '',
                returnRequest: null,
            })),
        }))
        return ticket
    })
}

function returnKitchenItems(ticketId, targets, request) {
    const normalizedTargets = (targets || []).map((target) => ({
        itemId: target.itemId,
        setIndex:
            target.setIndex === null || target.setIndex === undefined
                ? null
                : Number(target.setIndex),
    }))
    const requestedAt = new Date().toISOString()
    const updated = updateTicket(ticketId, (ticket) => {
        ticket.status = 'preparing'
        ticket.completedAt = ''
        ticket.items = ticket.items.map((item) => {
            const itemTargets = normalizedTargets.filter(
                (target) => target.itemId === item.id,
            )
            if (!itemTargets.length) return item
            const wholeItem = itemTargets.some(
                (target) => target.setIndex === null,
            )
            const requestData = {
                requestType: request.requestType,
                reason: request.reason,
                replacement: request.replacement || '',
                requestedAt,
            }
            if (wholeItem)
                return {
                    ...item,
                    kitchenStatus: 'returned',
                    startedAt: item.startedAt || requestedAt,
                    completedAt: '',
                    returnRequest: requestData,
                }
            const selectedIndexes = new Set(
                itemTargets.map((target) => target.setIndex),
            )
            const setSelections = (item.setSelections || []).map(
                (selection, index) =>
                    selectedIndexes.has(index)
                        ? {
                              ...selection,
                              kitchenStatus: 'returned',
                              startedAt:
                                  selection.startedAt || requestedAt,
                              completedAt: '',
                              returnRequest: requestData,
                          }
                        : selection,
            )
            return {
                ...item,
                setSelections,
                kitchenStatus: 'preparing',
                completedAt: '',
            }
        })
        return ticket
    })
    if (updated)
        normalizedTargets.forEach((target) => {
            const item = updated.items.find(
                (candidate) => candidate.id === target.itemId,
            )
            if (!item) return
            const selection =
                target.setIndex === null
                    ? null
                    : item.setSelections?.[target.setIndex]
            createKitchenReturnNotification(
                updated,
                selection
                    ? {
                          ...item,
                          id: `${item.id}::set::${target.setIndex}`,
                          name: selection.name,
                          parentName: item.name,
                      }
                    : item,
                request,
            )
        })
    return updated
}

function returnKitchenItem(ticketId, itemId, request) {
    return returnKitchenItems(
        ticketId,
        [{ itemId, setIndex: null }],
        request,
    )
}

export {
    KITCHEN_TICKETS_KEY,
    completeKitchenItem,
    completeKitchenSetSelection,
    completeKitchenTicket,
    loadKitchenTickets,
    redoKitchenItem,
    redoKitchenSetSelection,
    redoKitchenTicket,
    removeKitchenTicket,
    returnKitchenItem,
    returnKitchenItems,
    startKitchenItem,
    startKitchenSetSelection,
    upsertKitchenTicket,
}
