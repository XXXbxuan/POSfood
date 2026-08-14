import Sortable from 'sortablejs'

const LONG_PRESS_DELAY = 1000

function moveListItem(items, oldIndex, newIndex) {
    if (
        !Array.isArray(items) ||
        !Number.isInteger(oldIndex) ||
        !Number.isInteger(newIndex) ||
        oldIndex < 0 ||
        newIndex < 0 ||
        oldIndex >= items.length ||
        newIndex >= items.length ||
        oldIndex === newIndex
    ) {
        return items.slice()
    }

    const reorderedItems = items.slice()
    const [movedItem] = reorderedItems.splice(oldIndex, 1)
    reorderedItems.splice(newIndex, 0, movedItem)
    return reorderedItems
}

function reorderVisibleItems(
    allItems,
    visibleItems,
    oldIndex,
    newIndex,
    getKey = (item) => item.id,
) {
    const reorderedVisibleItems = moveListItem(
        visibleItems,
        oldIndex,
        newIndex,
    )
    const visibleKeys = new Set(visibleItems.map(getKey))
    let visibleIndex = 0

    return allItems.map((item) => {
        if (!visibleKeys.has(getKey(item))) return item
        const replacement = reorderedVisibleItems[visibleIndex]
        visibleIndex += 1
        return replacement
    })
}

function createLongPressSortable(
    element,
    { disabled = false, draggable, onReorder },
) {
    let suppressClickUntil = 0

    const instance = Sortable.create(element, {
        animation: 180,
        chosenClass: 'long-sort-chosen',
        delay: LONG_PRESS_DELAY,
        delayOnTouchOnly: false,
        disabled,
        dragClass: 'long-sort-active',
        draggable,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        ghostClass: 'long-sort-placeholder',
        touchStartThreshold: 5,
        onStart: () => {
            suppressClickUntil = Number.POSITIVE_INFINITY
        },
        onEnd: ({ oldDraggableIndex, newDraggableIndex }) => {
            if (
                Number.isInteger(oldDraggableIndex) &&
                Number.isInteger(newDraggableIndex) &&
                oldDraggableIndex !== newDraggableIndex
            ) {
                onReorder?.({
                    oldIndex: oldDraggableIndex,
                    newIndex: newDraggableIndex,
                })
            }

            suppressClickUntil = Date.now() + 250
        },
    })

    return {
        destroy() {
            instance.destroy()
        },
        setDisabled(value) {
            instance.option('disabled', Boolean(value))
        },
        shouldSuppressClick() {
            return Date.now() < suppressClickUntil
        },
    }
}

export {
    LONG_PRESS_DELAY,
    createLongPressSortable,
    moveListItem,
    reorderVisibleItems,
}
