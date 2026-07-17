<template>
    <div class="table-layout-layer" @click.self="requestClose">
        <section class="table-layout-dialog" role="dialog" aria-modal="true">
            <header class="table-layout-header">
                <div>
                    <span>TABLE PLAN</span>
                    <h2>{{ isEditing ? 'Design table layout' : layoutName }}</h2>
                    <p>
                        {{
                            isEditing
                                ? 'Drag every table into its real position. Changes save only when you press Done.'
                                : `${placedCount} of ${tables.length} tables placed · ${savedLabel}`
                        }}
                    </p>
                </div>

                <div class="table-layout-header-actions">
                    <template v-if="isEditing">
                        <button
                            type="button"
                            class="layout-tool-button"
                            :disabled="!canUndo"
                            @click="undo"
                        >
                            <i class="fa-solid fa-rotate-left"></i>Undo
                        </button>
                        <button
                            type="button"
                            class="layout-tool-button"
                            :disabled="!canRedo"
                            @click="redo"
                        >
                            <i class="fa-solid fa-rotate-right"></i>Redo
                        </button>
                        <button
                            type="button"
                            class="layout-tool-button"
                            @click="resetDraft"
                        >
                            <i class="fa-solid fa-arrow-rotate-left"></i>Reset
                        </button>
                        <button
                            type="button"
                            class="layout-done-button"
                            @click="saveAndFinish"
                        >
                            <i class="fa-solid fa-check"></i>Done
                        </button>
                    </template>
                    <template v-else>
                        <button
                            type="button"
                            class="layout-tool-button"
                            @click="printLayout"
                        >
                            <i class="fa-solid fa-print"></i>Print
                        </button>
                        <button
                            type="button"
                            class="layout-tool-button"
                            @click="exportLayout"
                        >
                            <i class="fa-solid fa-image"></i>Export PNG
                        </button>
                        <button
                            type="button"
                            class="layout-edit-button"
                            @click="startEditing"
                        >
                            <i class="fa-solid fa-pen"></i>Edit
                        </button>
                    </template>
                    <button
                        type="button"
                        class="table-layout-close"
                        aria-label="Close table layout"
                        @click="requestClose"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </header>

            <div class="table-layout-body">
                <section class="layout-canvas-panel">
                    <div class="layout-canvas-heading">
                        <label>
                            <span>Layout name</span>
                            <input
                                v-model.trim="layoutName"
                                type="text"
                                maxlength="50"
                                :disabled="!isEditing"
                            />
                        </label>
                        <div class="layout-coordinate-help">
                            <i class="fa-solid fa-location-dot"></i>
                            <strong>{{ selectedCoordinateLabel }}</strong>
                        </div>
                    </div>

                    <div
                        ref="canvasShell"
                        class="layout-canvas-shell"
                        :class="{ editing: isEditing }"
                        @dragover.prevent
                        @drop="dropHtmlTable"
                    >
                        <v-stage ref="stage" :config="stageConfig">
                            <v-layer :config="{ listening: false }">
                                <v-line
                                    v-for="line in gridLines"
                                    :key="line.key"
                                    :config="line.config"
                                />
                            </v-layer>
                            <v-layer>
                                <v-group
                                    v-for="item in visibleItems"
                                    :key="item.number"
                                    :config="tableGroupConfig(item)"
                                    @click="selectItem(item.number)"
                                    @tap="selectItem(item.number)"
                                    @dragstart="beginCanvasDrag"
                                    @dragend="finishCanvasDrag(item.number, $event)"
                                >
                                    <v-rect :config="tableShadowConfig(item)" />
                                    <v-rect
                                        v-for="chair in chairConfigs(item)"
                                        :key="chair.key"
                                        :config="chair"
                                    />
                                    <v-rect :config="tableRectConfig(item)" />
                                    <v-text :config="tableNumberConfig(item)" />
                                    <v-text :config="tableSeatConfig(item)" />
                                    <v-rect
                                        :config="tableCoordinateBadgeConfig(item)"
                                    />
                                    <v-text
                                        :config="tableCoordinateConfig(item)"
                                    />
                                </v-group>
                            </v-layer>
                        </v-stage>

                        <div v-if="!visibleItems.length" class="layout-empty-canvas">
                            <i class="fa-solid fa-table-cells-large"></i>
                            <strong>No tables placed yet</strong>
                            <span>Drag a table here or tap Add to floor.</span>
                        </div>
                    </div>
                </section>

                <aside class="layout-table-sidebar">
                    <header>
                        <div>
                            <span>TABLES</span>
                            <h3>All tables</h3>
                        </div>
                        <strong>{{ tables.length }}</strong>
                    </header>
                    <p v-if="isEditing">
                        Drag a table to the floor. On a tablet, you can also tap
                        Add to floor, then drag it into place.
                    </p>
                    <p v-else>The saved floor plan is ready to print.</p>

                    <div class="layout-table-list">
                        <article
                            v-for="table in tables"
                            :key="table.number"
                            class="layout-palette-card"
                            :class="{
                                placed: isPlaced(table.number),
                                selected: selectedNumber === table.number,
                            }"
                            :draggable="isEditing && !isPlaced(table.number)"
                            @dragstart="startHtmlDrag(table.number, $event)"
                            @click="selectItem(table.number)"
                        >
                            <div class="palette-table-icon">
                                <strong>{{ table.number }}</strong>
                            </div>
                            <div>
                                <strong>{{ table.number }}</strong>
                                <span>{{ table.seats }} seats</span>
                            </div>
                            <button
                                v-if="isEditing && !isPlaced(table.number)"
                                type="button"
                                @click.stop="placeAutomatically(table.number)"
                            >
                                Add to floor
                            </button>
                            <button
                                v-else-if="isEditing"
                                type="button"
                                class="remove-floor-button"
                                @click.stop="removeFromFloor(table.number)"
                            >
                                Remove
                            </button>
                            <span v-else class="placed-label">
                                {{ isPlaced(table.number) ? 'Placed' : 'Not placed' }}
                            </span>
                        </article>
                    </div>
                </aside>
            </div>

            <footer v-if="isEditing" class="table-layout-footer">
                <span>
                    <i class="fa-solid fa-circle-info"></i>
                    Print and Export PNG appear after Done saves the layout.
                </span>
                <strong>{{ placedCount }} / {{ tables.length }} placed</strong>
            </footer>
        </section>

        <div v-if="showCloseConfirm" class="layout-confirm-layer">
            <section class="layout-confirm-card" role="alertdialog">
                <div class="layout-confirm-icon">
                    <i class="fa-solid fa-pen-ruler"></i>
                </div>
                <h3>Leave Edit mode?</h3>
                <p>
                    This draft has not been saved. Press Done to save it, or
                    discard the draft and close.
                </p>
                <div>
                    <button type="button" @click="showCloseConfirm = false">
                        Keep editing
                    </button>
                    <button
                        type="button"
                        class="discard-layout-button"
                        @click="discardAndClose"
                    >
                        Discard draft
                    </button>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
const STORAGE_KEY = 'posfood_table_layout'
const DESIGN_WIDTH = 600
const DESIGN_HEIGHT = 600
const GRID_SIZE = 30

export default {
    name: 'TableLayoutDesigner',
    props: {
        tables: { type: Array, default: () => [] },
    },
    emits: ['close'],
    data() {
        return {
            layoutName: 'Main dining layout',
            savedItems: [],
            draftItems: [],
            isEditing: true,
            selectedNumber: '',
            savedAt: '',
            canvasWidth: 900,
            canvasHeight: 570,
            resizeObserver: null,
            history: [],
            historyIndex: -1,
            dragStartSnapshot: '',
            htmlDragNumber: '',
            showCloseConfirm: false,
        }
    },
    computed: {
        stageConfig() {
            const scale = Math.min(
                this.canvasWidth / DESIGN_WIDTH,
                this.canvasHeight / DESIGN_HEIGHT,
            )
            return {
                width: this.canvasWidth,
                height: this.canvasHeight,
                scaleX: scale,
                scaleY: scale,
            }
        },
        activeItems() {
            return this.isEditing ? this.draftItems : this.savedItems
        },
        visibleItems() {
            return this.activeItems.filter((item) => item.placed)
        },
        placedCount() {
            return this.visibleItems.length
        },
        selectedCoordinateLabel() {
            const item = this.activeItems.find(
                (candidate) => candidate.number === this.selectedNumber,
            )
            if (!item?.placed) return 'Select a table to view (x, y)'
            return `${item.number}  (${Math.round(item.x)}, ${Math.round(item.y)})`
        },
        tableMap() {
            return new Map(this.tables.map((table) => [table.number, table]))
        },
        gridLines() {
            const lines = []
            for (let x = 0; x <= DESIGN_WIDTH; x += GRID_SIZE)
                lines.push({
                    key: `x-${x}`,
                    config: {
                        points: [x, 0, x, DESIGN_HEIGHT],
                        stroke: '#dfe2e7',
                        strokeWidth: 1,
                        dash: [5, 7],
                    },
                })
            for (let y = 0; y <= DESIGN_HEIGHT; y += GRID_SIZE)
                lines.push({
                    key: `y-${y}`,
                    config: {
                        points: [0, y, DESIGN_WIDTH, y],
                        stroke: '#dfe2e7',
                        strokeWidth: 1,
                        dash: [5, 7],
                    },
                })
            return lines
        },
        canUndo() {
            return this.historyIndex > 0
        },
        canRedo() {
            return this.historyIndex < this.history.length - 1
        },
        isDirty() {
            return (
                JSON.stringify(this.normalizedItems(this.draftItems)) !==
                    JSON.stringify(this.normalizedItems(this.savedItems)) ||
                this.layoutName !== this.savedLayoutName
            )
        },
        savedLayoutName() {
            return this.readStoredLayout().name || 'Main dining layout'
        },
        savedLabel() {
            if (!this.savedAt) return 'Not saved yet'
            const date = new Date(this.savedAt)
            return Number.isNaN(date.getTime())
                ? 'Saved'
                : `Saved ${date.toLocaleString()}`
        },
    },
    watch: {
        tables: {
            deep: true,
            handler() {
                this.reconcileTableList()
            },
        },
    },
    mounted() {
        this.loadLayout()
        this.measureCanvas()
        this.resizeObserver = new ResizeObserver(this.measureCanvas)
        this.resizeObserver.observe(this.$refs.canvasShell)
    },
    beforeUnmount() {
        this.resizeObserver?.disconnect()
    },
    methods: {
        readStoredLayout() {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
            } catch (error) {
                return {}
            }
        },
        clone(value) {
            return JSON.parse(JSON.stringify(value))
        },
        normalizedItems(items) {
            return this.clone(items)
                .sort((first, second) =>
                    first.number.localeCompare(second.number),
                )
                .map((item) => ({
                    number: item.number,
                    x: Math.round(Number(item.x) || 0),
                    y: Math.round(Number(item.y) || 0),
                    placed: Boolean(item.placed),
                }))
        },
        loadLayout() {
            const stored = this.readStoredLayout()
            this.layoutName = stored.name || 'Main dining layout'
            this.savedAt = stored.savedAt || ''
            const sourceWidth = Number(stored.canvas?.width) || DESIGN_WIDTH
            const sourceHeight = Number(stored.canvas?.height) || DESIGN_HEIGHT
            const validNumbers = new Set(this.tables.map((table) => table.number))
            this.savedItems = (Array.isArray(stored.items) ? stored.items : [])
                .filter((item) => validNumbers.has(item.number))
                .map((item) => ({
                    number: item.number,
                    x: Math.max(
                        0,
                        Math.min(
                            DESIGN_WIDTH - 112,
                            ((Number(item.x) || GRID_SIZE) * DESIGN_WIDTH) /
                                sourceWidth,
                        ),
                    ),
                    y: Math.max(
                        0,
                        Math.min(
                            DESIGN_HEIGHT - 112,
                            ((Number(item.y) || GRID_SIZE) * DESIGN_HEIGHT) /
                                sourceHeight,
                        ),
                    ),
                    placed: Boolean(item.placed),
                }))
            this.reconcileTableList()
            this.draftItems = this.clone(this.savedItems)
            this.isEditing = !this.savedAt
            this.resetHistory()
        },
        reconcileTableList() {
            const numbers = new Set(this.tables.map((table) => table.number))
            const reconcile = (items) => {
                const byNumber = new Map(
                    items
                        .filter((item) => numbers.has(item.number))
                        .map((item) => [item.number, item]),
                )
                return this.tables.map(
                    (table) =>
                        byNumber.get(table.number) || {
                            number: table.number,
                            x: GRID_SIZE,
                            y: GRID_SIZE,
                            placed: false,
                        },
                )
            }
            this.savedItems = reconcile(this.savedItems)
            this.draftItems = reconcile(this.draftItems)
        },
        measureCanvas() {
            const shell = this.$refs.canvasShell
            if (!shell) return
            this.canvasWidth = Math.max(320, shell.clientWidth)
            this.canvasHeight = Math.max(320, shell.clientHeight)
        },
        tableDimensions(item) {
            const seats = Number(this.tableMap.get(item.number)?.seats) || 4
            return { width: 112, height: 112, seats }
        },
        tableGroupConfig(item) {
            return {
                x: item.x,
                y: item.y,
                draggable: this.isEditing,
                opacity: this.isEditing ? 1 : 0.98,
            }
        },
        tableShadowConfig(item) {
            const { width, height } = this.tableDimensions(item)
            return {
                x: -8,
                y: -8,
                width: width + 16,
                height: height + 16,
                cornerRadius: 18,
                fill: '#ffffff',
                shadowColor: '#171826',
                shadowBlur: this.selectedNumber === item.number ? 12 : 8,
                shadowOpacity: 0.12,
                stroke:
                    this.selectedNumber === item.number
                        ? '#fc8019'
                        : '#e6e7ea',
                strokeWidth: this.selectedNumber === item.number ? 3 : 1,
            }
        },
        tableRectConfig(item) {
            const { width, height } = this.tableDimensions(item)
            return {
                x: 16,
                y: 13,
                width: width - 32,
                height: height - 26,
                cornerRadius: 9,
                fill: '#fc8019',
            }
        },
        chairConfigs(item) {
            const { width, height, seats } = this.tableDimensions(item)
            const chairs = [
                { key: 'left', x: 2, y: 41, width: 8, height: 30 },
                { key: 'right', x: width - 10, y: 41, width: 8, height: 30 },
                { key: 'top-1', x: seats === 6 ? 18 : 42, y: 2, width: 28, height: 7 },
                { key: 'bottom-1', x: seats === 6 ? 18 : 42, y: height - 9, width: 28, height: 7 },
            ]
            if (seats === 6)
                chairs.push(
                    { key: 'top-2', x: 66, y: 2, width: 28, height: 7 },
                    { key: 'bottom-2', x: 66, y: height - 9, width: 28, height: 7 },
                )
            return chairs.map((chair) => ({
                ...chair,
                cornerRadius: 4,
                fill: '#dfe1e4',
            }))
        },
        tableNumberConfig(item) {
            const { width } = this.tableDimensions(item)
            return {
                x: 16,
                y: 30,
                width: width - 32,
                text: item.number,
                align: 'center',
                fontFamily: 'Arial',
                fontSize: 20,
                fontStyle: 'bold',
                fill: '#ffffff',
            }
        },
        tableSeatConfig(item) {
            const { width, seats } = this.tableDimensions(item)
            return {
                x: 16,
                y: 56,
                width: width - 32,
                text: `${seats} seats`,
                align: 'center',
                fontFamily: 'Arial',
                fontSize: 14,
                fill: '#ffffff',
            }
        },
        tableCoordinateConfig(item) {
            const { width } = this.tableDimensions(item)
            return {
                x: 20,
                y: 82,
                width: width - 40,
                text: `(${Math.round(item.x)}, ${Math.round(item.y)})`,
                align: 'center',
                fontFamily: 'Arial',
                fontSize: 12,
                fontStyle: 'bold',
                fill: '#171826',
            }
        },
        tableCoordinateBadgeConfig(item) {
            const { width } = this.tableDimensions(item)
            return {
                x: 20,
                y: 75,
                width: width - 40,
                height: 27,
                cornerRadius: 12,
                fill: '#ffffff',
                opacity: 0.94,
            }
        },
        isPlaced(number) {
            return Boolean(
                this.activeItems.find((item) => item.number === number)?.placed,
            )
        },
        selectItem(number) {
            this.selectedNumber = number
        },
        findDraft(number) {
            return this.draftItems.find((item) => item.number === number)
        },
        nextFreePosition(number) {
            const item = this.findDraft(number)
            const { width, height } = this.tableDimensions(item)
            const occupied = this.draftItems.filter(
                (candidate) => candidate.placed && candidate.number !== number,
            )
            for (let y = GRID_SIZE; y < DESIGN_HEIGHT - height; y += GRID_SIZE * 3)
                for (let x = GRID_SIZE; x < DESIGN_WIDTH - width; x += GRID_SIZE * 4)
                    if (
                        !occupied.some(
                            (candidate) =>
                                Math.abs(candidate.x - x) < width &&
                                Math.abs(candidate.y - y) < height,
                        )
                    )
                        return { x, y }
            return { x: GRID_SIZE, y: GRID_SIZE }
        },
        placeAutomatically(number) {
            if (!this.isEditing) return
            const item = this.findDraft(number)
            if (!item) return
            const position = this.nextFreePosition(number)
            Object.assign(item, position, { placed: true })
            this.selectedNumber = number
            this.pushHistory()
        },
        removeFromFloor(number) {
            const item = this.findDraft(number)
            if (!item) return
            item.placed = false
            if (this.selectedNumber === number) this.selectedNumber = ''
            this.pushHistory()
        },
        startHtmlDrag(number, event) {
            this.htmlDragNumber = number
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', number)
        },
        dropHtmlTable(event) {
            if (!this.isEditing) return
            const number =
                event.dataTransfer.getData('text/plain') || this.htmlDragNumber
            const item = this.findDraft(number)
            if (!item) return
            const rect = this.$refs.canvasShell.getBoundingClientRect()
            const scale = Math.min(rect.width / DESIGN_WIDTH, rect.height / DESIGN_HEIGHT)
            const { width, height } = this.tableDimensions(item)
            item.x = this.clampAndSnap((event.clientX - rect.left) / scale - width / 2, 0, DESIGN_WIDTH - width)
            item.y = this.clampAndSnap((event.clientY - rect.top) / scale - height / 2, 0, DESIGN_HEIGHT - height)
            item.placed = true
            this.selectedNumber = number
            this.htmlDragNumber = ''
            this.pushHistory()
        },
        beginCanvasDrag() {
            this.dragStartSnapshot = JSON.stringify(this.draftItems)
        },
        finishCanvasDrag(number, event) {
            const item = this.findDraft(number)
            if (!item) return
            const { width, height } = this.tableDimensions(item)
            const node = event.target
            item.x = this.clampAndSnap(node.x(), 0, DESIGN_WIDTH - width)
            item.y = this.clampAndSnap(node.y(), 0, DESIGN_HEIGHT - height)
            node.position({ x: item.x, y: item.y })
            if (JSON.stringify(this.draftItems) !== this.dragStartSnapshot)
                this.pushHistory()
            this.dragStartSnapshot = ''
        },
        clampAndSnap(value, minimum, maximum) {
            const snapped = Math.round(Number(value) / GRID_SIZE) * GRID_SIZE
            return Math.max(minimum, Math.min(maximum, snapped))
        },
        resetHistory() {
            this.history = [this.clone(this.draftItems)]
            this.historyIndex = 0
        },
        pushHistory() {
            const snapshot = this.clone(this.draftItems)
            this.history = this.history.slice(0, this.historyIndex + 1)
            this.history.push(snapshot)
            this.historyIndex = this.history.length - 1
        },
        undo() {
            if (!this.canUndo) return
            this.historyIndex -= 1
            this.draftItems = this.clone(this.history[this.historyIndex])
        },
        redo() {
            if (!this.canRedo) return
            this.historyIndex += 1
            this.draftItems = this.clone(this.history[this.historyIndex])
        },
        resetDraft() {
            this.draftItems = this.tables.map((table) => ({
                number: table.number,
                x: GRID_SIZE,
                y: GRID_SIZE,
                placed: false,
            }))
            this.selectedNumber = ''
            this.pushHistory()
        },
        startEditing() {
            this.draftItems = this.clone(this.savedItems)
            this.isEditing = true
            this.selectedNumber = ''
            this.resetHistory()
        },
        saveAndFinish() {
            const name = this.layoutName || 'Main dining layout'
            this.layoutName = name
            this.savedAt = new Date().toISOString()
            this.savedItems = this.clone(this.draftItems)
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    version: 1,
                    name,
                    savedAt: this.savedAt,
                    canvas: { width: DESIGN_WIDTH, height: DESIGN_HEIGHT },
                    items: this.normalizedItems(this.savedItems),
                }),
            )
            this.isEditing = false
            this.selectedNumber = ''
        },
        requestClose() {
            if (this.isEditing && this.isDirty) {
                this.showCloseConfirm = true
                return
            }
            this.$emit('close')
        },
        discardAndClose() {
            this.showCloseConfirm = false
            this.$emit('close')
        },
        exportDataUrl() {
            const stage = this.$refs.stage?.getNode()
            return stage?.toDataURL({ pixelRatio: 2, mimeType: 'image/png' })
        },
        exportLayout() {
            if (this.isEditing) return
            const url = this.exportDataUrl()
            if (!url) return
            const link = document.createElement('a')
            link.download = `${this.layoutName.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'table-layout'}.png`
            link.href = url
            link.click()
        },
        printLayout() {
            if (this.isEditing) return
            const url = this.exportDataUrl()
            if (!url) return
            const printWindow = window.open('', '_blank', 'width=1200,height=850')
            if (!printWindow) return
            printWindow.document.write(
                `<html><head><title>${this.layoutName}</title><style>body{margin:0;padding:24px;font-family:Arial,sans-serif;text-align:center}h1{font-size:24px}img{width:100%;height:auto;object-fit:contain}</style></head><body><h1>${this.layoutName}</h1><img src="${url}" alt="Table layout"></body></html>`,
            )
            printWindow.document.close()
            printWindow.onload = () => {
                printWindow.focus()
                printWindow.print()
            }
        },
    },
}
</script>
