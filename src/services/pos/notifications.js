import { readList, writeObject } from './storage.js'

const POS_NOTIFICATIONS_KEY = 'posfood_notifications'
const MAX_NOTIFICATIONS = 100

function loadNotifications() {
    return readList(POS_NOTIFICATIONS_KEY).sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    )
}

function saveNotifications(notifications) {
    const sorted = notifications.sort(
            (a, b) =>
                new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        )
    const pending = sorted.filter((notification) => !notification.resolved)
    const history = sorted.filter((notification) => notification.resolved)
    const saved = [...pending, ...history]
        .slice(0, MAX_NOTIFICATIONS)
        .sort(
            (a, b) =>
                new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        )
    writeObject(POS_NOTIFICATIONS_KEY, saved)
    window.dispatchEvent(
        new CustomEvent('pos-notifications:changed', { detail: saved }),
    )
    return saved
}

function createKitchenReturnNotification(ticket, item, request) {
    const notifications = loadNotifications()
    const sourceMatch = String(item.id || '').match(
        /^(\d+)-(\d+)-(\d+)(?:::set::(\d+))?$/,
    )
    const notification = {
        id: `KITCHEN-${Date.now()}-${String(item.id || 'ITEM').replace(
            /[^a-z0-9-]/gi,
            '-',
        )}`,
        type: 'kitchen-return',
        orderId: ticket.sourceOrderId || ticket.id,
        orderNumber: ticket.orderNumber,
        orderType: ticket.orderType,
        tableNumber: ticket.tableNumber || '',
        itemId: item.id,
        itemName: item.name,
        parentName: item.parentName || '',
        requestType: request.requestType,
        issueType: String(request.requestType || '')
            .toLowerCase()
            .includes('replacement')
            ? 'replacement'
            : 'refund',
        reason: request.reason,
        replacement: request.replacement || '',
        chefNote: request.replacement || request.reason,
        source: sourceMatch
            ? {
                  groupIndex: Number(sourceMatch[1]),
                  itemIndex: Number(sourceMatch[2]),
                  unitIndex: Number(sourceMatch[3]),
                  setIndex:
                      sourceMatch[4] === undefined
                          ? null
                          : Number(sourceMatch[4]),
              }
            : null,
        createdAt: new Date().toISOString(),
        requestedAt: new Date().toISOString(),
        status: 'pending',
        read: false,
        resolved: false,
    }
    saveNotifications([notification, ...notifications])
    return notification
}

function markNotificationRead(notificationId) {
    return saveNotifications(
        loadNotifications().map((notification) =>
            notification.id === notificationId
                ? { ...notification, read: true }
                : notification,
        ),
    )
}

function resolveOrderNotifications(orderId, orderNumber) {
    const id = String(orderId || '')
    const number = String(orderNumber || '')
    return saveNotifications(
        loadNotifications().map((notification) =>
            !notification.resolved &&
            ((id && String(notification.orderId) === id) ||
                (number &&
                    String(notification.orderNumber) === number))
                ? {
                      ...notification,
                      read: true,
                      resolved: true,
                      resolvedAt: new Date().toISOString(),
                  }
                : notification,
        ),
    )
}

function resolveKitchenIssues(notificationIds, resolution = {}) {
    const ids = new Set((notificationIds || []).map(String))
    if (!ids.size) return loadNotifications()
    return saveNotifications(
        loadNotifications().map((notification) =>
            ids.has(String(notification.id))
                ? {
                      ...notification,
                      read: true,
                      resolved: true,
                      status: 'resolved',
                      resolution: { ...resolution },
                      resolvedAt: new Date().toISOString(),
                  }
                : notification,
        ),
    )
}

export {
    POS_NOTIFICATIONS_KEY,
    createKitchenReturnNotification,
    loadNotifications,
    markNotificationRead,
    resolveKitchenIssues,
    resolveOrderNotifications,
}
