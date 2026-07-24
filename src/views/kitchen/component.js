import PosTopbar from '@/components/common/PosTopbar.vue'
import { loadMenuCatalog } from '@/services/pos/menuCatalog.js'
import {
    completeKitchenItem,
    completeKitchenSetSelection,
    completeKitchenTicket,
    loadKitchenTickets,
    redoKitchenItem,
    redoKitchenSetSelection,
    redoKitchenTicket,
    returnKitchenItems,
    startKitchenItem,
    startKitchenSetSelection,
} from '@/services/pos/kitchen.js'
import { render } from './render.js'

const KITCHEN_STATUS_PRIORITY = {
    returned: 0,
    preparing: 1,
    queued: 2,
    done: 3,
}

function kitchenItemStatus(item) {
    if (
        item?.kitchenStatus === 'returned' ||
        item?.setSelections?.some(
            (selection) => selection.kitchenStatus === 'returned',
        )
    )
        return 'returned'
    return item?.kitchenStatus || 'queued'
}

function sortedKitchenEntries(items, statusGetter = kitchenItemStatus) {
    return (items || [])
        .map((item, originalIndex) => ({ item, originalIndex }))
        .sort((a, b) => {
            const statusDifference =
                (KITCHEN_STATUS_PRIORITY[statusGetter(a.item)] ?? 2) -
                (KITCHEN_STATUS_PRIORITY[statusGetter(b.item)] ?? 2)
            return statusDifference || a.originalIndex - b.originalIndex
        })
}

export default {
    name: 'POSKitchen',
    components: { PosTopbar },
    render,
    data() {
        return {
            tickets: loadKitchenTickets(),
            products: loadMenuCatalog().products,
            activeTab: 'All',
            selectedTicketId: '',
            selectedItemId: '',
            selectedSetDish: null,
            expandedSetItems: [],
            slideValue: 0,
            ticketSlideValues: {},
            ticketSetExpanded: {},
            showReturnDialog: false,
            showRedoConfirm: false,
            redoConfirmType: '',
            returnTargets: [],
            returnSetPickerItemId: '',
            returnRequestType: 'Return dish',
            returnReason: '',
            returnReplacement: '',
            returnError: '',
            now: Date.now(),
            refreshTimer: null,
        }
    },
    computed: {
        tabs() {
            return [
                { label: 'All', count: this.activeTickets.length },
                {
                    label: 'New',
                    count: this.activeTickets.filter(
                        (ticket) => ticket.status === 'new',
                    ).length,
                },
                {
                    label: 'Preparing',
                    count: this.activeTickets.filter(
                        (ticket) => ticket.status === 'preparing',
                    ).length,
                },
                { label: 'History', count: this.historyTickets.length },
            ]
        },
        activeTickets() {
            return this.tickets
                .filter((ticket) => ticket.status !== 'completed')
                .sort(
                    (a, b) =>
                        new Date(a.createdAt || 0) -
                        new Date(b.createdAt || 0),
                )
        },
        historyTickets() {
            return this.tickets
                .filter((ticket) => ticket.status === 'completed')
                .sort(
                    (a, b) =>
                        new Date(b.completedAt || 0) -
                        new Date(a.completedAt || 0),
                )
        },
        visibleTickets() {
            if (this.activeTab === 'History') return this.historyTickets
            if (this.activeTab === 'All') return this.activeTickets
            return this.activeTickets.filter(
                (ticket) =>
                    ticket.status === this.activeTab.toLowerCase(),
            )
        },
        selectedTicket() {
            return (
                this.tickets.find(
                    (ticket) => ticket.id === this.selectedTicketId,
                ) || null
            )
        },
        selectedItem() {
            return (
                this.selectedTicket?.items.find(
                    (item) => item.id === this.selectedItemId,
                ) || null
            )
        },
        displayItem() {
            const parent = this.selectedItem
            if (!parent || !this.selectedSetDish) return parent
            const selection = parent.setSelections?.[
                this.selectedSetDish.index
            ]
            if (!selection) return parent
            return {
                ...selection,
                id: `${parent.id}-set-${this.selectedSetDish.index}`,
                groupLabel: `${parent.name} · Set item`,
                size: selection.state?.size || '',
                addons: selection.state?.addons || [],
                removedIngredients:
                    selection.state?.removedIngredients || [],
                modifiers: selection.state?.modifiers || {},
                remark: selection.state?.remark || '',
                kitchenStatus:
                    selection.kitchenStatus || parent.kitchenStatus,
                returnRequest: selection.returnRequest || null,
            }
        },
        selectedItemIndex() {
            const orderedItems = this.sortedTicketItems(this.selectedTicket)
            return Math.max(
                0,
                orderedItems.findIndex(
                    (item) => item.id === this.selectedItemId,
                ),
            )
        },
        returnSetPickerItem() {
            return (
                this.selectedTicket?.items.find(
                    (item) => item.id === this.returnSetPickerItemId,
                ) || null
            )
        },
        allItemsDone() {
            return Boolean(
                this.selectedTicket?.items.length &&
                    this.selectedTicket.items.every(
                        (item) => item.kitchenStatus === 'done',
                    ),
            )
        },
        isHistoryDetail() {
            return this.selectedTicket?.status === 'completed'
        },
    },
    mounted() {
        window.addEventListener('storage', this.refreshTickets)
        this.refreshTimer = window.setInterval(() => {
            this.now = Date.now()
            this.refreshTickets()
        }, 3000)
    },
    beforeUnmount() {
        window.removeEventListener('storage', this.refreshTickets)
        if (this.refreshTimer) window.clearInterval(this.refreshTimer)
    },
    methods: {
        refreshTickets() {
            this.tickets = loadKitchenTickets()
        },
        setTab(tab) {
            this.activeTab = tab
            this.closeTicket()
        },
        orderLocation(ticket) {
            return ticket.orderType === 'Takeaway'
                ? 'Takeaway'
                : ticket.tableNumber
                  ? `Table ${ticket.tableNumber}`
                  : 'Dine In'
        },
        itemImage(item) {
            return (
                this.products.find(
                    (product) =>
                        product.id === item?.productId ||
                        product.name === item?.name,
                )?.image || ''
            )
        },
        ticketDoneCount(ticket) {
            return (ticket.items || []).reduce((total, item) => {
                if (item.setSelections?.length)
                    return (
                        total +
                        item.setSelections.filter(
                            (selection) =>
                                selection.kitchenStatus === 'done',
                        ).length
                    )
                return total + (item.kitchenStatus === 'done' ? 1 : 0)
            }, 0)
        },
        ticketDishTotal(ticket) {
            return (ticket.items || []).reduce(
                (total, item) =>
                    total +
                    (item.setSelections?.length
                        ? item.setSelections.length
                        : 1),
                0,
            )
        },
        ticketAllItemsDone(ticket) {
            return Boolean(
                ticket?.items?.length &&
                    ticket.items.every(
                        (item) => item.kitchenStatus === 'done',
                    ),
            )
        },
        itemDisplayStatus(item) {
            return kitchenItemStatus(item)
        },
        sortedTicketItems(ticket) {
            return sortedKitchenEntries(ticket?.items).map(
                (entry) => entry.item,
            )
        },
        sortedSetSelections(item) {
            return sortedKitchenEntries(
                item?.setSelections,
                (selection) => selection?.kitchenStatus || 'queued',
            ).map((entry) => ({
                selection: entry.item,
                setIndex: entry.originalIndex,
            }))
        },
        ticketSetKey(ticketId, itemId) {
            return `${ticketId}::${itemId}`
        },
        setItemAllDone(item) {
            return Boolean(
                item?.setSelections?.length &&
                    item.setSelections.every(
                        (selection) => selection.kitchenStatus === 'done',
                    ),
            )
        },
        isTicketSetExpanded(ticketId, item) {
            if (!ticketId || !item?.setSelections?.length) return false
            const key = this.ticketSetKey(ticketId, item.id)
            if (Object.prototype.hasOwnProperty.call(this.ticketSetExpanded, key))
                return Boolean(this.ticketSetExpanded[key])
            return !this.setItemAllDone(item)
        },
        toggleTicketSet(ticketId, item) {
            if (!ticketId || !item?.setSelections?.length) return
            const key = this.ticketSetKey(ticketId, item.id)
            this.ticketSetExpanded = {
                ...this.ticketSetExpanded,
                [key]: !this.isTicketSetExpanded(ticketId, item),
            }
        },
        syncTicketSetExpansion(ticketId, item) {
            if (!ticketId || !item?.setSelections?.length) return
            const key = this.ticketSetKey(ticketId, item.id)
            if (this.setItemAllDone(item)) {
                this.ticketSetExpanded = {
                    ...this.ticketSetExpanded,
                    [key]: false,
                }
                return
            }
            if (!Object.prototype.hasOwnProperty.call(this.ticketSetExpanded, key)) {
                this.ticketSetExpanded = {
                    ...this.ticketSetExpanded,
                    [key]: true,
                }
            }
        },
        elapsedMinutes(ticket) {
            return Math.max(
                0,
                Math.floor(
                    (this.now - new Date(ticket.createdAt || 0).getTime()) /
                        60000,
                ),
            )
        },
        elapsedLabel(ticket) {
            const minutes = this.elapsedMinutes(ticket)
            if (ticket.status === 'completed')
                return `Completed ${this.formatTime(ticket.completedAt)}`
            if (minutes < 1) return 'Just now'
            if (minutes < 60) return `${minutes} min`
            return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
        },
        isUrgent(ticket) {
            return (
                ticket.status !== 'completed' &&
                this.elapsedMinutes(ticket) >= 15
            )
        },
        formatTime(value) {
            if (!value) return ''
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) return ''
            return new Intl.DateTimeFormat('en-MY', {
                hour: '2-digit',
                minute: '2-digit',
            }).format(date)
        },
        openTicket(ticket) {
            this.selectedTicketId = ticket.id
            const orderedItems = this.sortedTicketItems(ticket)
            const next =
                orderedItems.find(
                    (item) =>
                        !['done', 'returned'].includes(
                            this.itemDisplayStatus(item),
                        ),
                ) ||
                orderedItems.find(
                    (item) => this.itemDisplayStatus(item) === 'returned',
                ) ||
                orderedItems[0]
            this.selectedItemId = next?.id || ''
            this.selectedSetDish = null
            this.expandedSetItems = []
            this.slideValue = 0
            if (next && ticket.status !== 'completed')
                this.startItem(next.id)
        },
        openTicketAtItem(ticket, item) {
            if (!ticket || !item) return
            this.selectedTicketId = ticket.id
            this.selectedItemId = item.id
            this.selectedSetDish = null
            this.expandedSetItems = item.setSelections?.length
                ? [item.id]
                : []
            this.slideValue = 0
            if (!item.setSelections?.length) {
                if (
                    ticket.status !== 'completed' &&
                    !['done', 'returned'].includes(
                        this.itemDisplayStatus(item),
                    )
                )
                    this.startItem(item.id)
                return
            }
            const nextSelection =
                this.sortedSetSelections(item).find(
                    ({ selection }) =>
                        !['done', 'returned'].includes(
                            selection.kitchenStatus,
                        ),
                ) ||
                this.sortedSetSelections(item).find(
                    ({ selection }) =>
                        selection.kitchenStatus === 'returned',
                ) ||
                this.sortedSetSelections(item)[0]
            if (!nextSelection) return
            this.selectedSetDish = {
                parentId: item.id,
                index: nextSelection.setIndex,
            }
            if (
                ticket.status !== 'completed' &&
                !['done', 'returned'].includes(
                    nextSelection.selection.kitchenStatus,
                )
            )
                this.startSetDish(item.id, nextSelection.setIndex)
        },
        closeTicket() {
            this.selectedTicketId = ''
            this.selectedItemId = ''
            this.selectedSetDish = null
            this.expandedSetItems = []
            this.slideValue = 0
            this.closeReturnDialog()
            this.closeRedoConfirm()
        },
        selectItem(item) {
            this.selectedItemId = item.id
            this.selectedSetDish = null
            if (
                this.selectedTicket?.status !== 'completed' &&
                !['done', 'returned'].includes(item.kitchenStatus)
            )
                this.startItem(item.id)
        },
        isSetExpanded(itemId) {
            return this.expandedSetItems.includes(itemId)
        },
        toggleSet(item) {
            this.selectItem(item)
            if (this.isSetExpanded(item.id)) {
                this.expandedSetItems = this.expandedSetItems.filter(
                    (id) => id !== item.id,
                )
                this.selectedSetDish = null
                return
            }
            this.expandedSetItems = [...this.expandedSetItems, item.id]
            const nextSelection = this.sortedSetSelections(item).find(
                ({ selection }) =>
                    !['done', 'returned'].includes(
                        selection.kitchenStatus,
                    ),
            )
            if (item.setSelections?.length)
                this.selectSetDish(
                    item,
                    nextSelection?.setIndex ??
                        this.sortedSetSelections(item)[0]?.setIndex ??
                        0,
                )
        },
        selectSetDish(parent, index) {
            this.selectedItemId = parent.id
            this.selectedSetDish = { parentId: parent.id, index }
            const selection = parent.setSelections?.[index]
            if (
                this.selectedTicket?.status !== 'completed' &&
                selection &&
                !['done', 'returned'].includes(selection.kitchenStatus)
            )
                this.startSetDish(parent.id, index)
        },
        startItem(itemId) {
            const updated = startKitchenItem(
                this.selectedTicketId,
                itemId,
            )
            if (updated)
                this.tickets = this.tickets.map((ticket) =>
                    ticket.id === updated.id ? updated : ticket,
                )
        },
        startSetDish(itemId, setIndex) {
            const updated = startKitchenSetSelection(
                this.selectedTicketId,
                itemId,
                setIndex,
            )
            if (updated)
                this.tickets = this.tickets.map((ticket) =>
                    ticket.id === updated.id ? updated : ticket,
                )
        },
        moveItem(direction) {
            const items = this.sortedTicketItems(this.selectedTicket)
            if (!items.length) return
            const index = Math.min(
                items.length - 1,
                Math.max(0, this.selectedItemIndex + direction),
            )
            this.selectItem(items[index])
        },
        updateTicketState(updated) {
            if (!updated) return null
            this.tickets = this.tickets.map((ticket) =>
                ticket.id === updated.id ? updated : ticket,
            )
            return updated
        },
        quickCompleteItem(ticket, item) {
            if (
                !ticket ||
                !item ||
                ticket.status === 'completed' ||
                ['done', 'returned'].includes(
                    this.itemDisplayStatus(item),
                ) ||
                item.setSelections?.length
            )
                return
            this.updateTicketState(
                completeKitchenItem(ticket.id, item.id),
            )
        },
        quickCompleteSetSelection(ticket, item, setIndex) {
            const selection = item?.setSelections?.[setIndex]
            if (
                !ticket ||
                !item ||
                !selection ||
                ticket.status === 'completed' ||
                ['done', 'returned'].includes(
                    selection.kitchenStatus,
                )
            )
                return
            const updated = this.updateTicketState(
                completeKitchenSetSelection(
                    ticket.id,
                    item.id,
                    setIndex,
                ),
            )
            const updatedParent = updated?.items?.find(
                (entry) => entry.id === item.id,
            )
            if (updatedParent)
                this.syncTicketSetExpansion(ticket.id, updatedParent)
        },
        cardSlideValue(ticketId) {
            return Number(this.ticketSlideValues[ticketId] || 0)
        },
        setCardSlideValue(ticketId, value) {
            this.ticketSlideValues = {
                ...this.ticketSlideValues,
                [ticketId]: Number(value || 0),
            }
        },
        resetCardSlide(ticketId) {
            const nextValues = { ...this.ticketSlideValues }
            delete nextValues[ticketId]
            this.ticketSlideValues = nextValues
        },
        finishTicketFromCard(ticket) {
            const latestTicket = this.tickets.find(
                (entry) => entry.id === ticket?.id,
            )
            if (!this.ticketAllItemsDone(latestTicket)) {
                this.resetCardSlide(ticket?.id)
                return
            }
            const updated = completeKitchenTicket(latestTicket.id)
            if (!updated || updated.status !== 'completed') {
                this.resetCardSlide(latestTicket.id)
                return
            }
            this.updateTicketState(updated)
            this.resetCardSlide(updated.id)
            if (this.selectedTicketId === updated.id) this.closeTicket()
        },
        handleCardSlideRelease(ticket) {
            if (this.cardSlideValue(ticket.id) >= 95)
                this.finishTicketFromCard(ticket)
            else this.resetCardSlide(ticket.id)
        },
        completeSelectedItem() {
            if (!this.selectedItem || this.isHistoryDetail) return
            const setIndex = this.selectedSetDish?.index
            const completingSetDish =
                Number.isInteger(setIndex) &&
                Boolean(this.selectedItem.setSelections?.length)
            if (
                this.selectedItem.setSelections?.length &&
                !completingSetDish
            )
                return
            const updated = completingSetDish
                ? completeKitchenSetSelection(
                      this.selectedTicketId,
                      this.selectedItem.id,
                      setIndex,
                  )
                : completeKitchenItem(
                      this.selectedTicketId,
                      this.selectedItem.id,
                  )
            if (!updated) return
            this.tickets = this.tickets.map((ticket) =>
                ticket.id === updated.id ? updated : ticket,
            )
            if (completingSetDish) {
                const updatedParent = updated.items.find(
                    (item) => item.id === this.selectedItemId,
                )
                if (updatedParent)
                    this.syncTicketSetExpansion(
                        this.selectedTicketId,
                        updatedParent,
                    )
                const nextSetSelection = this.sortedSetSelections(
                    updatedParent,
                ).find(
                    ({ selection }) =>
                        !['done', 'returned'].includes(
                            selection.kitchenStatus,
                        ),
                )
                if (nextSetSelection) {
                    this.selectedSetDish = {
                        parentId: updatedParent.id,
                        index: nextSetSelection.setIndex,
                    }
                    this.startSetDish(
                        updatedParent.id,
                        nextSetSelection.setIndex,
                    )
                    return
                }
            }
            const orderedItems = this.sortedTicketItems(updated)
            const next =
                orderedItems.find(
                    (item) =>
                        !['done', 'returned'].includes(
                            this.itemDisplayStatus(item),
                        ),
                ) ||
                orderedItems.find(
                    (item) => this.itemDisplayStatus(item) === 'returned',
                ) ||
                orderedItems.find(
                    (item) => item.id === this.selectedItemId,
                )
            if (next) {
                this.selectedItemId = next.id
                this.selectedSetDish = null
                if (next.setSelections?.length) {
                    if (!this.isSetExpanded(next.id))
                        this.expandedSetItems = [
                            ...this.expandedSetItems,
                            next.id,
                        ]
                    const nextSetSelection = this.sortedSetSelections(
                        next,
                    ).find(
                        ({ selection }) =>
                            !['done', 'returned'].includes(
                                selection.kitchenStatus,
                            ),
                    )
                    if (nextSetSelection)
                        this.selectSetDish(
                            next,
                            nextSetSelection.setIndex,
                        )
                    else {
                        const firstSetSelection =
                            this.sortedSetSelections(next)[0]
                        if (firstSetSelection)
                            this.selectedSetDish = {
                                parentId: next.id,
                                index: firstSetSelection.setIndex,
                            }
                    }
                } else if (next.kitchenStatus !== 'done')
                    this.startItem(next.id)
            }
        },
        finishTicket() {
            if (!this.allItemsDone) {
                this.slideValue = 0
                return
            }
            const updated = completeKitchenTicket(this.selectedTicketId)
            if (updated)
                this.tickets = this.tickets.map((ticket) =>
                    ticket.id === updated.id ? updated : ticket,
                )
            this.activeTab = 'History'
            this.closeTicket()
        },
        handleSlideRelease() {
            if (Number(this.slideValue) >= 95) this.finishTicket()
            else this.slideValue = 0
        },
        selectNextSetDish() {
            const item = this.selectedItem
            if (!item?.setSelections?.length) return
            if (!this.isSetExpanded(item.id))
                this.expandedSetItems = [
                    ...this.expandedSetItems,
                    item.id,
                ]
            const nextSelection =
                this.sortedSetSelections(item).find(
                    ({ selection }) =>
                        !['done', 'returned'].includes(
                            selection.kitchenStatus,
                        ),
                ) || this.sortedSetSelections(item)[0]
            if (nextSelection)
                this.selectSetDish(item, nextSelection.setIndex)
        },
        requestRedoSelectedItem() {
            if (!this.selectedItem || !this.isHistoryDetail) return
            if (
                this.selectedItem.setSelections?.length &&
                !this.selectedSetDish
            ) {
                this.selectNextSetDish()
                return
            }
            this.redoConfirmType = 'item'
            this.showRedoConfirm = true
        },
        requestRedoSelectedTicket() {
            if (!this.selectedTicket || !this.isHistoryDetail) return
            this.redoConfirmType = 'ticket'
            this.showRedoConfirm = true
        },
        closeRedoConfirm() {
            this.showRedoConfirm = false
            this.redoConfirmType = ''
        },
        confirmRedo() {
            const type = this.redoConfirmType
            this.closeRedoConfirm()
            if (type === 'ticket') {
                this.redoSelectedTicket()
                return
            }
            if (type === 'item') this.redoSelectedItem()
        },
        redoSelectedItem() {
            if (!this.selectedItem || !this.isHistoryDetail) return
            const setIndex = this.selectedSetDish?.index
            const redoingSetDish =
                Number.isInteger(setIndex) &&
                Boolean(this.selectedItem.setSelections?.length)
            const updated = redoingSetDish
                ? redoKitchenSetSelection(
                      this.selectedTicketId,
                      this.selectedItem.id,
                      setIndex,
                  )
                : redoKitchenItem(
                      this.selectedTicketId,
                      this.selectedItem.id,
                  )
            if (!updated) return
            this.tickets = this.tickets.map((ticket) =>
                ticket.id === updated.id ? updated : ticket,
            )
            this.activeTab = 'Preparing'
            this.slideValue = 0
            if (redoingSetDish) {
                this.startSetDish(this.selectedItem.id, setIndex)
                return
            }
            this.startItem(this.selectedItem.id)
        },
        redoSelectedTicket() {
            if (!this.selectedTicket || !this.isHistoryDetail) return
            const updated = redoKitchenTicket(this.selectedTicketId)
            if (!updated) return
            this.tickets = this.tickets.map((ticket) =>
                ticket.id === updated.id ? updated : ticket,
            )
            this.activeTab = 'Preparing'
            this.selectedSetDish = null
            this.expandedSetItems = []
            this.slideValue = 0
            const firstItem = this.sortedTicketItems(updated)[0]
            if (!firstItem) return
            this.selectedItemId = firstItem.id
            if (firstItem.setSelections?.length) {
                this.expandedSetItems = [firstItem.id]
                const firstSelection =
                    this.sortedSetSelections(firstItem)[0]
                if (firstSelection)
                    this.selectSetDish(
                        firstItem,
                        firstSelection.setIndex,
                    )
                return
            }
            this.startItem(firstItem.id)
        },
        openReturnDialog() {
            this.returnTargets = []
            this.returnSetPickerItemId = ''
            if (this.selectedItem) {
                if (
                    this.selectedItem.setSelections?.length &&
                    this.selectedSetDish
                ) {
                    this.returnTargets = [
                        {
                            itemId: this.selectedItem.id,
                            setIndex: this.selectedSetDish.index,
                        },
                    ]
                } else if (!this.selectedItem.setSelections?.length) {
                    this.returnTargets = [
                        {
                            itemId: this.selectedItem.id,
                            setIndex: null,
                        },
                    ]
                }
            }
            this.returnRequestType = 'Return dish'
            this.returnReason = ''
            this.returnReplacement = ''
            this.returnError = ''
            this.showReturnDialog = true
        },
        closeReturnDialog() {
            this.showReturnDialog = false
            this.returnSetPickerItemId = ''
            this.returnError = ''
        },
        returnTargetKey(itemId, setIndex = null) {
            return `${itemId}::${
                setIndex === null || setIndex === undefined
                    ? 'item'
                    : setIndex
            }`
        },
        isReturnTargetSelected(itemId, setIndex = null) {
            const key = this.returnTargetKey(itemId, setIndex)
            return this.returnTargets.some(
                (target) =>
                    this.returnTargetKey(
                        target.itemId,
                        target.setIndex,
                    ) === key,
            )
        },
        toggleReturnTarget(itemId, setIndex = null) {
            const key = this.returnTargetKey(itemId, setIndex)
            if (this.isReturnTargetSelected(itemId, setIndex)) {
                this.returnTargets = this.returnTargets.filter(
                    (target) =>
                        this.returnTargetKey(
                            target.itemId,
                            target.setIndex,
                        ) !== key,
                )
                return
            }
            this.returnTargets = [
                ...this.returnTargets,
                { itemId, setIndex },
            ]
        },
        openReturnSetPicker(itemId) {
            this.returnSetPickerItemId = itemId
        },
        closeReturnSetPicker() {
            this.returnSetPickerItemId = ''
        },
        areAllSetSelectionsSelected(item) {
            return Boolean(
                item.setSelections?.length &&
                    item.setSelections.every((selection, index) =>
                        this.isReturnTargetSelected(item.id, index),
                    ),
            )
        },
        toggleAllSetSelections(item) {
            const allSelected = this.areAllSetSelectionsSelected(item)
            const setKeys = new Set(
                (item.setSelections || []).map((selection, index) =>
                    this.returnTargetKey(item.id, index),
                ),
            )
            this.returnTargets = this.returnTargets.filter(
                (target) =>
                    !setKeys.has(
                        this.returnTargetKey(
                            target.itemId,
                            target.setIndex,
                        ),
                    ),
            )
            if (!allSelected)
                this.returnTargets = [
                    ...this.returnTargets,
                    ...(item.setSelections || []).map(
                        (selection, index) => ({
                            itemId: item.id,
                            setIndex: index,
                        }),
                    ),
                ]
        },
        submitReturnRequest() {
            const reason = this.returnReason.trim()
            const replacement = this.returnReplacement.trim()
            if (!this.returnTargets.length) {
                this.returnError = 'Please select at least one dish.'
                return
            }
            if (!reason) {
                this.returnError = 'A return reason is required.'
                return
            }
            if (
                this.returnRequestType === 'Request replacement' &&
                !replacement
            ) {
                this.returnError =
                    'Enter the replacement ingredient or instruction.'
                return
            }
            const updated = returnKitchenItems(
                this.selectedTicketId,
                this.returnTargets,
                {
                    requestType: this.returnRequestType,
                    reason,
                    replacement,
                },
            )
            if (!updated) {
                this.returnError = 'Unable to return this dish.'
                return
            }
            this.tickets = this.tickets.map((ticket) =>
                ticket.id === updated.id ? updated : ticket,
            )
            const firstTarget = this.returnTargets[0]
            this.selectedItemId = firstTarget.itemId
            this.selectedSetDish =
                firstTarget.setIndex === null
                    ? null
                    : {
                          parentId: firstTarget.itemId,
                          index: firstTarget.setIndex,
                      }
            this.closeReturnDialog()
        },
    },
}
