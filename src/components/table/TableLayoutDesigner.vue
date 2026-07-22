<template>
    <div class="table-layout-layer" @click.self="handleBackdropClick">
        <section class="table-layout-dialog" role="dialog" aria-modal="true">
            <header class="table-layout-header">
                <div class="table-layout-title">
                    <button
                        v-if="isEditing"
                        type="button"
                        class="layout-icon-button layout-header-back"
                        aria-label="Back to layout preview"
                        title="Back to preview"
                        @click="requestLeaveEditMode"
                    >
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <span>TABLE PLAN</span>
                </div>

                <div class="table-layout-header-actions">
                    <template v-if="!isEditing">
                        <button
                            type="button"
                            class="layout-icon-button"
                            aria-label="Print map"
                            title="Print"
                            @click="printLayout"
                        >
                            <i class="fa-solid fa-print"></i>
                        </button>
                        <button
                            type="button"
                            class="layout-icon-button"
                            aria-label="Export map as PNG"
                            title="Export PNG"
                            @click="exportLayout"
                        >
                            <i class="fa-solid fa-image"></i>
                        </button>
                        <button
                            type="button"
                            class="layout-icon-button primary"
                            aria-label="Edit maps"
                            title="Edit"
                            @click="startEditing"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>
                    </template>
                    <button
                        v-if="isEditing"
                        type="button"
                        class="layout-icon-button danger"
                        aria-label="Delete this map"
                        title="Delete this map"
                        @click="showDeleteConfirm = true"
                    >
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                    <button
                        type="button"
                        class="table-layout-close"
                        aria-label="Close table plan"
                        title="Close"
                        @click="requestClose"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </header>

            <nav class="layout-map-tabs" aria-label="Table maps">
                <button
                    v-for="layout in layouts"
                    :key="layout.id"
                    type="button"
                    :class="{ active: layout.id === activeLayoutId }"
                    @click="switchLayout(layout.id)"
                >
                    {{ layout.name || 'Untitled map' }}
                </button>
                <span aria-hidden="true"></span>
                <button
                    type="button"
                    class="add-layout-tab"
                    aria-label="Add another table map"
                    title="Add map"
                    @click="addLayout"
                >
                    <i class="fa-solid fa-plus"></i>
                </button>
            </nav>

            <div class="table-layout-body">
                <section class="layout-canvas-panel">
                    <div
                        ref="canvasShell"
                        class="layout-canvas-shell"
                        :class="{ editing: isEditing }"
                    >
                        <v-stage
                            ref="stage"
                            :config="stageConfig"
                            @dragstart="beginStagePan"
                            @dragend="finishStagePan"
                        >
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
                                    @dragstart="beginCanvasDrag(item, $event)"
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
                                    <v-rect :config="tableCoordinateBadgeConfig(item)" />
                                    <v-text :config="tableCoordinateConfig(item)" />
                                </v-group>
                            </v-layer>
                        </v-stage>

                        <div v-if="!visibleItems.length" class="layout-empty-canvas">
                            <i class="fa-solid fa-table-cells-large"></i>
                            <strong>No tables placed yet</strong>
                            <span>Drag a table here or press +.</span>
                        </div>
                    </div>
                </section>

                <aside class="layout-table-sidebar">
                    <label class="layout-name-field">
                        <span>MAP NAME</span>
                        <input
                            v-model.trim="layoutName"
                            type="text"
                            maxlength="50"
                            @blur="commitLayoutName"
                            @keydown.enter="$event.target.blur()"
                        />
                    </label>

                    <header class="layout-table-count">
                        <strong>TABLES</strong>
                        <span>{{ tables.length }}</span>
                    </header>

                    <div
                        class="layout-sidebar-content"
                        :class="{ 'without-tools': !isEditing }"
                    >
                        <nav
                            v-if="!isEditing"
                            class="layout-preview-zoom-tools"
                            aria-label="Map zoom controls"
                        >
                            <button
                                type="button"
                                aria-label="Zoom out"
                                title="Zoom out"
                                :disabled="zoomPercent <= 10"
                                @click="changeZoom(-10)"
                            >
                                <i class="fa-solid fa-minus"></i>
                            </button>
                            <button
                                type="button"
                                aria-label="Zoom in"
                                title="Zoom in"
                                :disabled="zoomPercent >= 150"
                                @click="changeZoom(10)"
                            >
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </nav>
                        <nav
                            v-if="isEditing"
                            class="layout-vertical-tools"
                            aria-label="Map editing tools"
                        >
                            <button
                                type="button"
                                aria-label="Undo"
                                title="Undo"
                                :disabled="!canUndo"
                                @click="undo"
                            >
                                <i class="fa-solid fa-rotate-left"></i>
                            </button>
                            <button
                                type="button"
                                aria-label="Redo"
                                title="Redo"
                                :disabled="!canRedo"
                                @click="redo"
                            >
                                <i class="fa-solid fa-rotate-right"></i>
                            </button>
                            <button
                                type="button"
                                aria-label="Add a new table"
                                title="Add table"
                                @click="
                                    $emit('add-table', {
                                        placeOnCurrentLayout: true,
                                    })
                                "
                            >
                                <i class="fa-solid fa-plus"></i>
                            </button>
                            <button
                                type="button"
                                aria-label="Remove selected table from this map"
                                title="Remove selected table from map"
                                :disabled="!selectedNumber"
                                @click="removeFromFloor(selectedNumber)"
                            >
                                <i class="fa-solid fa-minus"></i>
                            </button>
                            <div class="layout-zoom-tool">
                                <button
                                    type="button"
                                    aria-label="Open zoom controls"
                                    title="Zoom"
                                    :class="{ active: showZoomControl }"
                                    @click="showZoomControl = !showZoomControl"
                                >
                                    <i class="fa-solid fa-magnifying-glass"></i>
                                </button>
                                <div
                                    v-if="showZoomControl"
                                    class="layout-zoom-control"
                                    aria-label="Canvas zoom"
                                >
                                    <button
                                        type="button"
                                        aria-label="Zoom out"
                                    :disabled="zoomPercent <= 10"
                                        @click="changeZoom(-10)"
                                    >
                                        <i class="fa-solid fa-chevron-left"></i>
                                    </button>
                                    <strong>{{ zoomPercent }}%</strong>
                                    <button
                                        type="button"
                                        aria-label="Zoom in"
                                        :disabled="zoomPercent >= 150"
                                        @click="changeZoom(10)"
                                    >
                                        <i class="fa-solid fa-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        </nav>

                        <div class="layout-table-groups">
                            <section class="unplaced-table-group">
                                <button
                                    type="button"
                                    class="layout-group-toggle"
                                    :aria-expanded="showUnplacedGroup"
                                    @click="showUnplacedGroup = !showUnplacedGroup"
                                >
                                    <i
                                        class="fa-solid fa-chevron-right"
                                        :class="{ open: showUnplacedGroup }"
                                    ></i>
                                    <span>NOT USED</span>
                                    <strong>{{ unplacedTables.length }}</strong>
                                </button>
                                <div
                                    v-show="showUnplacedGroup"
                                    class="layout-table-list"
                                >
                                    <article
                                        v-for="table in unplacedTables"
                                        :key="table.number"
                                        class="layout-palette-card"
                                        :class="{
                                            dragging:
                                                paletteDragNumber ===
                                                    table.number &&
                                                paletteDragMoved,
                                        }"
                                        @pointerdown="
                                            beginPalettePointerDrag(
                                                table.number,
                                                $event,
                                            )
                                        "
                                    >
                                        <div class="palette-table-icon">
                                            {{ table.number }}
                                        </div>
                                        <strong>{{ table.number }}</strong>
                                        <button
                                            v-if="isEditing"
                                            type="button"
                                            :aria-label="`Add ${table.number} to floor`"
                                            title="Add to floor"
                                            @click="placeAutomatically(table.number)"
                                        >
                                            <i class="fa-solid fa-plus"></i>
                                        </button>
                                    </article>
                                    <p
                                        v-if="!unplacedTables.length"
                                        class="layout-group-empty"
                                    >
                                        Every table is used in this map.
                                    </p>
                                </div>
                            </section>

                            <section class="placed-table-group">
                                <button
                                    type="button"
                                    class="layout-group-toggle"
                                    :aria-expanded="showPlacedGroup"
                                    @click="showPlacedGroup = !showPlacedGroup"
                                >
                                    <i
                                        class="fa-solid fa-chevron-right"
                                        :class="{ open: showPlacedGroup }"
                                    ></i>
                                    <span>USED IN THIS MAP</span>
                                    <strong>{{ placedTables.length }}</strong>
                                </button>
                                <div
                                    v-show="showPlacedGroup"
                                    class="layout-table-list"
                                >
                                    <article
                                        v-for="table in placedTables"
                                        :key="table.number"
                                        class="layout-palette-card placed"
                                        :class="{
                                            selected:
                                                selectedNumber === table.number,
                                        }"
                                        @click="selectItem(table.number)"
                                    >
                                        <div class="palette-table-icon muted">
                                            {{ table.number }}
                                        </div>
                                        <div class="placed-table-details">
                                            <strong>{{ table.number }}</strong>
                                            <span>{{ coordinateFor(table.number) }}</span>
                                        </div>
                                        <button
                                            v-if="isEditing"
                                            type="button"
                                            class="remove-floor-button"
                                            :aria-label="`Remove ${table.number} from floor`"
                                            title="Remove from floor"
                                            @click.stop="removeFromFloor(table.number)"
                                        >
                                            <i class="fa-solid fa-minus"></i>
                                        </button>
                                    </article>
                                    <p
                                        v-if="!placedTables.length"
                                        class="layout-group-empty"
                                    >
                                        No tables used yet.
                                    </p>
                                </div>
                            </section>
                        </div>
                    </div>
                </aside>
            </div>

            <footer v-if="isEditing" class="table-layout-actions">
                <button
                    type="button"
                    class="layout-done-button"
                    @click="saveAndFinish"
                >
                    <i class="fa-solid fa-check"></i>Done
                </button>
            </footer>
        </section>

        <div
            v-if="paletteDragMoved"
            class="layout-palette-drag-ghost"
            :style="{
                left: `${paletteGhostX}px`,
                top: `${paletteGhostY}px`,
            }"
        >
            {{ paletteDragNumber }}
        </div>

        <div v-if="showCloseConfirm" class="layout-confirm-layer">
            <section class="layout-confirm-card" role="alertdialog">
                <div class="layout-confirm-icon">
                    <i class="fa-solid fa-pen-ruler"></i>
                </div>
                <h3>Leave Edit mode?</h3>
                <p>
                    These map changes have not been saved. Save them now, or
                    discard the draft and
                    {{ closeIntent === 'leave-edit' ? 'return to preview.' : 'close.' }}
                </p>
                <div>
                    <button
                        type="button"
                        class="confirm-edit-button"
                        @click="savePendingChanges"
                    >
                        Save changes
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

        <div v-if="showDeleteConfirm" class="layout-confirm-layer">
            <section class="layout-confirm-card" role="alertdialog">
                <div class="layout-confirm-icon danger">
                    <i class="fa-solid fa-trash-can"></i>
                </div>
                <h3>Delete this map?</h3>
                <p>
                    {{ layoutName || 'This map' }} and all of its table
                     positions will be removed immediately.
                </p>
                <div>
                    <button type="button" @click="showDeleteConfirm = false">
                        Cancel
                    </button>
                    <button
                        type="button"
                        class="discard-layout-button"
                        @click="deleteCurrentLayout"
                    >
                        Delete map
                    </button>
                </div>
            </section>
        </div>

        <div
            v-if="showEditPrompt"
            class="layout-confirm-layer"
            @pointerup.stop
            @click.stop
        >
            <section class="layout-confirm-card" role="alertdialog">
                <div class="layout-confirm-icon">
                    <i class="fa-solid fa-pen"></i>
                </div>
                <h3>Enter Edit mode?</h3>
                <p>
                    Table positions are locked in preview mode. Enter Edit mode
                    before moving or adding a table?
                </p>
                <div>
                    <button type="button" @click="showEditPrompt = false">
                        No
                    </button>
                    <button
                        type="button"
                        class="confirm-edit-button"
                        @click="confirmEditMode"
                    >
                        Yes
                    </button>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
import {
    downloadTableLayout,
    printTableLayout,
} from '@/utils/tableLayoutExport.js'

const STORAGE_KEY = 'posfood_table_layout'
const DESIGN_WIDTH = 600
const DESIGN_HEIGHT = 600
const TABLE_SIZE = 96
const GRID_SIZE = 30

export default {
    name: 'TableLayoutDesigner',
    props: {
        tables: { type: Array, default: () => [] },
        initialLayoutId: { type: String, default: '' },
    },
    emits: ['close', 'add-table'],
    data() {
        return {
            layouts: [],
            activeLayoutId: '',
            isEditing: true,
            selectedNumber: '',
            canvasWidth: 600,
            canvasHeight: 600,
            designWidth: DESIGN_WIDTH,
            designHeight: DESIGN_HEIGHT,
            zoomPercent: 100,
            showZoomControl: false,
            stageOffsetX: 0,
            stageOffsetY: 0,
            isCanvasPanning: false,
            resizeObserver: null,
            history: [],
            historyIndex: -1,
            dragStartSnapshot: '',
            paletteDragNumber: '',
            paletteDragPointerId: null,
            paletteDragStartX: 0,
            paletteDragStartY: 0,
            paletteGhostX: 0,
            paletteGhostY: 0,
            paletteDragMoved: false,
            savedSnapshot: '',
            showUnplacedGroup: true,
            showPlacedGroup: true,
            showCloseConfirm: false,
            showDeleteConfirm: false,
            showEditPrompt: false,
            ignoreBackdropUntil: 0,
            closeIntent: 'close',
        }
    },
    computed: {
        currentLayout() {
            return (
                this.layouts.find(
                    (layout) => layout.id === this.activeLayoutId,
                ) || this.layouts[0]
            )
        },
        layoutName: {
            get() {
                return this.currentLayout?.name || ''
            },
            set(value) {
                if (this.currentLayout) this.currentLayout.name = value
            },
        },
        savedItems: {
            get() {
                return this.currentLayout?.savedItems || []
            },
            set(value) {
                if (this.currentLayout) this.currentLayout.savedItems = value
            },
        },
        draftItems: {
            get() {
                return this.currentLayout?.draftItems || []
            },
            set(value) {
                if (this.currentLayout) this.currentLayout.draftItems = value
            },
        },
        stageConfig() {
            const scale = this.stageScale
            return {
                width: Math.max(this.canvasWidth, this.designWidth * scale),
                height: Math.max(this.canvasHeight, this.designHeight * scale),
                scaleX: scale,
                scaleY: scale,
                x: this.stageOffsetX,
                y: this.stageOffsetY,
                draggable: true,
                dragBoundFunc: this.limitStagePosition,
            }
        },
        stageScale() {
            const baseScale = Math.min(
                this.canvasWidth / DESIGN_WIDTH,
                this.canvasHeight / DESIGN_HEIGHT,
            )
            return baseScale * (this.zoomPercent / 100)
        },
        activeItems() {
            return this.isEditing ? this.draftItems : this.savedItems
        },
        visibleItems() {
            return this.activeItems.filter((item) => item.placed)
        },
        placedTables() {
            return this.tables.filter((table) => this.isPlaced(table.number))
        },
        unplacedTables() {
            return this.tables.filter((table) => !this.isPlaced(table.number))
        },
        canUndo() {
            return this.historyIndex > 0
        },
        canRedo() {
            return this.historyIndex < this.history.length - 1
        },
        isDirty() {
            return this.draftSnapshot() !== this.savedSnapshot
        },
        tableMap() {
            return new Map(this.tables.map((table) => [table.number, table]))
        },
        gridLines() {
            const lines = []
            for (let x = 0; x <= this.designWidth; x += GRID_SIZE)
                lines.push({
                    key: `x-${x}`,
                    config: {
                        points: [x, 0, x, this.designHeight],
                        stroke: '#dfe2e7',
                        strokeWidth: 1,
                        dash: [5, 7],
                    },
                })
            for (let y = 0; y <= this.designHeight; y += GRID_SIZE)
                lines.push({
                    key: `y-${y}`,
                    config: {
                        points: [0, y, this.designWidth, y],
                        stroke: '#dfe2e7',
                        strokeWidth: 1,
                        dash: [5, 7],
                    },
                })
            return lines
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
        this.loadLayouts()
        this.$nextTick(() => {
            this.measureCanvas()
            this.resizeObserver = new ResizeObserver(this.measureCanvas)
            this.resizeObserver.observe(this.$refs.canvasShell)
        })
    },
    beforeUnmount() {
        this.resizeObserver?.disconnect()
        this.clearPalettePointerDrag()
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
        createId() {
            return `map-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        },
        createBlankItems() {
            return this.tables.map((table) => ({
                number: table.number,
                x: GRID_SIZE,
                y: GRID_SIZE,
                placed: false,
            }))
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
        normalizeStoredItems(items, sourceWidth, sourceHeight) {
            const validNumbers = new Set(
                this.tables.map((table) => table.number),
            )
            return (Array.isArray(items) ? items : [])
                .filter((item) => validNumbers.has(item.number))
                .map((item) => ({
                    number: item.number,
                    x: Math.max(
                        0,
                        Math.min(
                            sourceWidth - TABLE_SIZE,
                            Number(item.x) || GRID_SIZE,
                        ),
                    ),
                    y: Math.max(
                        0,
                        Math.min(
                            sourceHeight - TABLE_SIZE,
                            Number(item.y) || GRID_SIZE,
                        ),
                    ),
                    placed: Boolean(item.placed),
                }))
        },
        loadLayouts() {
            const stored = this.readStoredLayout()
            const sourceWidth = Number(stored.canvas?.width) || DESIGN_WIDTH
            const sourceHeight = Number(stored.canvas?.height) || DESIGN_HEIGHT
            this.designWidth = Math.max(DESIGN_WIDTH, sourceWidth)
            this.designHeight = Math.max(DESIGN_HEIGHT, sourceHeight)
            const storedLayouts =
                stored.version >= 2 && Array.isArray(stored.layouts)
                    ? stored.layouts
                    : [
                          {
                              id: 'main-map',
                              name: stored.name || 'Main dining layout',
                              savedAt: stored.savedAt || '',
                              items: stored.items || [],
                          },
                      ]

            this.layouts = storedLayouts.map((layout, index) => {
                const savedItems = this.normalizeStoredItems(
                    layout.items,
                    sourceWidth,
                    sourceHeight,
                )
                return {
                    id: layout.id || `map-${index + 1}`,
                    name: layout.name || `Layout ${index + 1}`,
                    savedAt: layout.savedAt || '',
                    savedItems,
                    draftItems: this.clone(savedItems),
                }
            })
            if (!this.layouts.length)
                this.layouts.push(this.createBlankLayout(1))

            const requestedLayoutId =
                this.initialLayoutId || stored.activeLayoutId || ''
            this.activeLayoutId = this.layouts.some(
                (layout) => layout.id === requestedLayoutId,
            )
                ? requestedLayoutId
                : this.layouts[0].id
            this.reconcileTableList()
            const hasSavedLayout = this.layouts.some(
                (layout) => Boolean(layout.savedAt),
            )
            this.isEditing = !hasSavedLayout
            this.savedSnapshot = this.savedStateSnapshot()
            this.resetHistory()
        },
        createBlankLayout(index) {
            return {
                id: this.createId(),
                name: `Layout ${index}`,
                savedAt: '',
                savedItems: this.createBlankItems(),
                draftItems: this.createBlankItems(),
            }
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
            this.layouts.forEach((layout) => {
                layout.savedItems = reconcile(layout.savedItems)
                layout.draftItems = reconcile(layout.draftItems)
            })
        },
        savedStateSnapshot() {
            return JSON.stringify(
                this.layouts.map((layout) => ({
                    id: layout.id,
                    name: layout.name,
                    items: this.normalizedItems(layout.savedItems),
                })),
            )
        },
        draftSnapshot() {
            return JSON.stringify(
                this.layouts.map((layout) => ({
                    id: layout.id,
                    name: layout.name,
                    items: this.normalizedItems(layout.draftItems),
                })),
            )
        },
        switchLayout(id) {
            if (id === this.activeLayoutId) return
            this.activeLayoutId = id
            this.selectedNumber = ''
            this.resetStagePosition()
            this.resetHistory()
            this.$nextTick(this.measureCanvas)
        },
        addLayout() {
            if (!this.isEditing) this.startEditing()
            const layout = this.createBlankLayout(this.layouts.length + 1)
            this.layouts.push(layout)
            this.activeLayoutId = layout.id
            this.selectedNumber = ''
            this.resetHistory()
            this.$nextTick(this.measureCanvas)
        },
        deleteCurrentLayout() {
            const currentId = this.activeLayoutId
            this.layouts = this.layouts.filter(
                (layout) => layout.id !== currentId,
            )
            if (!this.layouts.length)
                this.layouts.push(this.createBlankLayout(1))
            this.activeLayoutId = this.layouts[0].id
            this.selectedNumber = ''
            this.showDeleteConfirm = false
            this.persistDeletedLayout(currentId)
            this.resetHistory()
        },
        persistDeletedLayout(deletedId) {
            const stored = this.readStoredLayout()
            let persistedLayouts =
                stored.version >= 2 && Array.isArray(stored.layouts)
                    ? stored.layouts.filter(
                          (layout) => layout.id !== deletedId,
                      )
                    : []

            let savedRecords = []
            try {
                savedRecords = JSON.parse(this.savedSnapshot || '[]').filter(
                    (layout) => layout.id !== deletedId,
                )
            } catch (error) {
                savedRecords = []
            }

            if (!persistedLayouts.length) {
                const fallback = this.layouts[0]
                const savedAt = new Date().toISOString()
                fallback.savedAt = savedAt
                fallback.savedItems = this.clone(fallback.savedItems)
                persistedLayouts = [
                    {
                        id: fallback.id,
                        name: fallback.name,
                        savedAt,
                        items: this.normalizedItems(fallback.savedItems),
                    },
                ]
                if (!savedRecords.some((layout) => layout.id === fallback.id))
                    savedRecords.push({
                        id: fallback.id,
                        name: fallback.name,
                        items: this.normalizedItems(fallback.savedItems),
                    })
            }

            const persistedActiveId = persistedLayouts.some(
                (layout) => layout.id === this.activeLayoutId,
            )
                ? this.activeLayoutId
                : persistedLayouts[0].id

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    version: 2,
                    activeLayoutId: persistedActiveId,
                    canvas: { width: this.designWidth, height: this.designHeight },
                    layouts: persistedLayouts,
                }),
            )
            this.savedSnapshot = JSON.stringify(savedRecords)
        },
        measureCanvas() {
            const shell = this.$refs.canvasShell
            if (!shell) return
            this.canvasWidth = Math.max(280, shell.clientWidth)
            this.canvasHeight = Math.max(280, shell.clientHeight)
            this.$nextTick(this.clampStagePosition)
        },
        changeZoom(amount) {
            this.zoomPercent = Math.max(
                10,
                Math.min(150, this.zoomPercent + amount),
            )
            this.$nextTick(this.clampStagePosition)
        },
        limitStagePosition(position) {
            const scaledWidth = this.designWidth * this.stageScale
            const scaledHeight = this.designHeight * this.stageScale
            const minimumX = Math.min(0, this.canvasWidth - scaledWidth)
            const minimumY = Math.min(0, this.canvasHeight - scaledHeight)
            return {
                x: Math.max(minimumX, Math.min(0, Number(position.x) || 0)),
                y: Math.max(minimumY, Math.min(0, Number(position.y) || 0)),
            }
        },
        beginStagePan(event) {
            const stage = event.target.getStage()
            if (event.target !== stage) return
            this.isCanvasPanning = true
        },
        finishStagePan(event) {
            const stage = event.target.getStage()
            if (event.target !== stage) return
            const position = this.limitStagePosition(stage.position())
            this.stageOffsetX = position.x
            this.stageOffsetY = position.y
            stage.position(position)
            this.isCanvasPanning = false
        },
        clampStagePosition() {
            const position = this.limitStagePosition({
                x: this.stageOffsetX,
                y: this.stageOffsetY,
            })
            this.stageOffsetX = position.x
            this.stageOffsetY = position.y
            this.$refs.stage?.getNode()?.position(position)
        },
        resetStagePosition() {
            this.stageOffsetX = 0
            this.stageOffsetY = 0
            this.isCanvasPanning = false
        },
        tableDimensions(item) {
            const seats = Number(this.tableMap.get(item.number)?.seats) || 4
            return { width: TABLE_SIZE, height: TABLE_SIZE, seats }
        },
        tableGroupConfig(item) {
            return {
                x: item.x,
                y: item.y,
                scaleX: 1,
                scaleY: 1,
                draggable: true,
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
                x: 12,
                y: 11,
                width: width - 24,
                height: height - 22,
                cornerRadius: 9,
                fill: '#fc8019',
            }
        },
        chairConfigs(item) {
            const { width, height, seats } = this.tableDimensions(item)
            const chairs = [
                { key: 'left', x: 1, y: 34, width: 7, height: 28 },
                { key: 'right', x: width - 8, y: 34, width: 7, height: 28 },
                {
                    key: 'top-1',
                    x: seats === 6 ? 12 : 34,
                    y: 1,
                    width: 28,
                    height: 6,
                },
                {
                    key: 'bottom-1',
                    x: seats === 6 ? 12 : 34,
                    y: height - 7,
                    width: 28,
                    height: 6,
                },
            ]
            if (seats === 6)
                chairs.push(
                    {
                        key: 'top-2',
                        x: 56,
                        y: 1,
                        width: 28,
                        height: 6,
                    },
                    {
                        key: 'bottom-2',
                        x: 56,
                        y: height - 7,
                        width: 28,
                        height: 6,
                    },
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
                x: 12,
                y: 25,
                width: width - 24,
                text: item.number,
                align: 'center',
                fontFamily: 'Arial',
                fontSize: 22,
                fontStyle: 'bold',
                fill: '#ffffff',
            }
        },
        tableCoordinateBadgeConfig(item) {
            const { width } = this.tableDimensions(item)
            return {
                x: 8,
                y: 59,
                width: width - 16,
                height: 29,
                cornerRadius: 14,
                fill: '#ffffff',
                opacity: 0.95,
            }
        },
        tableCoordinateConfig(item) {
            const { width } = this.tableDimensions(item)
            return {
                x: 8,
                y: 66,
                width: width - 16,
                text: this.coordinateFor(item.number),
                align: 'center',
                fontFamily: 'Arial',
                fontSize: 13,
                fontStyle: 'bold',
                fill: '#171826',
            }
        },
        isPlaced(number) {
            return Boolean(
                this.activeItems.find((item) => item.number === number)?.placed,
            )
        },
        coordinateFor(number) {
            const item = this.activeItems.find(
                (candidate) => candidate.number === number,
            )
            if (!item?.placed) return '(–, –)'
            return `(${Math.round(item.x)}, ${Math.round(item.y)})`
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
            for (
                let y = GRID_SIZE;
                y < this.designHeight - height;
                y += GRID_SIZE * 3
            )
                for (
                    let x = GRID_SIZE;
                    x < this.designWidth - width;
                    x += GRID_SIZE * 4
                )
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
        placeNewTable(number) {
            if (!this.isEditing) return
            this.reconcileTableList()
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
            this.shrinkCanvasToUsedBounds()
            if (this.selectedNumber === number) this.selectedNumber = ''
            this.pushHistory()
        },
        beginPalettePointerDrag(number, event) {
            if (!this.isEditing) {
                this.requestEditFromInteraction()
                return
            }
            if (event.button !== undefined && event.button !== 0) return
            if (event.target.closest('button')) return

            this.paletteDragNumber = number
            this.paletteDragPointerId = event.pointerId
            this.paletteDragStartX = event.clientX
            this.paletteDragStartY = event.clientY
            this.paletteGhostX = event.clientX
            this.paletteGhostY = event.clientY
            this.paletteDragMoved = false

            window.addEventListener(
                'pointermove',
                this.movePalettePointerDrag,
                { passive: false },
            )
            window.addEventListener('pointerup', this.finishPalettePointerDrag)
            window.addEventListener(
                'pointercancel',
                this.cancelPalettePointerDrag,
            )
        },
        movePalettePointerDrag(event) {
            if (event.pointerId !== this.paletteDragPointerId) return
            const distance = Math.hypot(
                event.clientX - this.paletteDragStartX,
                event.clientY - this.paletteDragStartY,
            )
            if (!this.paletteDragMoved && distance < 6) return

            this.paletteDragMoved = true
            this.paletteGhostX = event.clientX
            this.paletteGhostY = event.clientY
            event.preventDefault()
        },
        finishPalettePointerDrag(event) {
            if (event.pointerId !== this.paletteDragPointerId) return
            if (this.paletteDragMoved)
                this.placePaletteTableAtPoint(
                    this.paletteDragNumber,
                    event.clientX,
                    event.clientY,
                )
            this.clearPalettePointerDrag()
        },
        cancelPalettePointerDrag(event) {
            if (
                event?.pointerId !== undefined &&
                event.pointerId !== this.paletteDragPointerId
            )
                return
            this.clearPalettePointerDrag()
        },
        clearPalettePointerDrag() {
            window.removeEventListener(
                'pointermove',
                this.movePalettePointerDrag,
            )
            window.removeEventListener(
                'pointerup',
                this.finishPalettePointerDrag,
            )
            window.removeEventListener(
                'pointercancel',
                this.cancelPalettePointerDrag,
            )
            this.paletteDragNumber = ''
            this.paletteDragPointerId = null
            this.paletteDragMoved = false
        },
        placePaletteTableAtPoint(number, clientX, clientY) {
            if (!this.isEditing) return
            const item = this.findDraft(number)
            if (!item) return
            const rect = this.$refs.canvasShell.getBoundingClientRect()
            if (
                clientX < rect.left ||
                clientX > rect.right ||
                clientY < rect.top ||
                clientY > rect.bottom
            )
                return
            const scale = this.stageScale
            const { width, height } = this.tableDimensions(item)
            item.x = this.clampAndSnap(
                (clientX -
                    rect.left -
                    this.stageOffsetX +
                    this.$refs.canvasShell.scrollLeft) /
                    scale -
                    width / 2,
                0,
                this.designWidth - width,
            )
            item.y = this.clampAndSnap(
                (clientY -
                    rect.top -
                    this.stageOffsetY +
                    this.$refs.canvasShell.scrollTop) /
                    scale -
                    height / 2,
                0,
                this.designHeight - height,
            )
            item.placed = true
            this.selectedNumber = number
            this.pushHistory()
        },
        beginCanvasDrag(item, event) {
            if (!this.isEditing) {
                event.target.stopDrag()
                event.target.position({ x: item.x, y: item.y })
                this.requestEditFromInteraction()
                return
            }
            this.dragStartSnapshot = JSON.stringify(this.draftItems)
        },
        finishCanvasDrag(number, event) {
            const item = this.findDraft(number)
            if (!item) return
            if (!this.isEditing) {
                event.target.position({ x: item.x, y: item.y })
                return
            }
            const { width, height } = this.tableDimensions(item)
            const node = event.target
            const expanded = this.expandCanvasForDrop(
                node.x(),
                node.y(),
                width,
                height,
            )
            item.x = this.clampAndSnap(
                expanded.x,
                0,
                this.designWidth - width,
            )
            item.y = this.clampAndSnap(
                expanded.y,
                0,
                this.designHeight - height,
            )
            node.position({ x: item.x, y: item.y })
            this.shrinkCanvasToUsedBounds()
            if (JSON.stringify(this.draftItems) !== this.dragStartSnapshot)
                this.pushHistory()
            this.dragStartSnapshot = ''
        },
        expandCanvasForDrop(rawX, rawY, width, height) {
            let x = Number(rawX) || 0
            let y = Number(rawY) || 0
            const extension = DESIGN_WIDTH / 2

            if (x < 0) {
                const shift = Math.ceil(Math.abs(x) / extension) * extension
                this.shiftPlacedItems(shift, 0)
                this.designWidth += shift
                x += shift
            }
            if (y < 0) {
                const shift = Math.ceil(Math.abs(y) / extension) * extension
                this.shiftPlacedItems(0, shift)
                this.designHeight += shift
                y += shift
            }
            if (x + width >= this.designWidth - GRID_SIZE)
                this.designWidth +=
                    Math.ceil(
                        (x + width + GRID_SIZE - this.designWidth) / extension,
                    ) * extension || extension
            if (y + height >= this.designHeight - GRID_SIZE)
                this.designHeight +=
                    Math.ceil(
                        (y + height + GRID_SIZE - this.designHeight) / extension,
                    ) * extension || extension

            return { x, y }
        },
        shiftPlacedItems(xAmount, yAmount) {
            this.draftItems.forEach((item) => {
                if (!item.placed) return
                item.x += xAmount
                item.y += yAmount
            })
        },
        shrinkCanvasToUsedBounds() {
            const placedItems = this.draftItems.filter((item) => item.placed)
            const extension = DESIGN_WIDTH / 2
            if (!placedItems.length) {
                this.designWidth = DESIGN_WIDTH
                this.designHeight = DESIGN_HEIGHT
                this.resetStagePosition()
                return
            }

            const minimumX = Math.min(...placedItems.map((item) => item.x))
            const minimumY = Math.min(...placedItems.map((item) => item.y))
            const trimX = Math.min(
                Math.floor(minimumX / extension) * extension,
                this.designWidth - DESIGN_WIDTH,
            )
            const trimY = Math.min(
                Math.floor(minimumY / extension) * extension,
                this.designHeight - DESIGN_HEIGHT,
            )

            if (trimX || trimY) {
                this.shiftPlacedItems(-trimX, -trimY)
                this.resetStagePosition()
            }

            const items = this.draftItems.filter((item) => item.placed)
            const maximumX = Math.max(...items.map((item) => item.x + TABLE_SIZE))
            const maximumY = Math.max(...items.map((item) => item.y + TABLE_SIZE))
            this.designWidth = Math.max(
                DESIGN_WIDTH,
                Math.ceil(maximumX / extension) * extension,
            )
            this.designHeight = Math.max(
                DESIGN_HEIGHT,
                Math.ceil(maximumY / extension) * extension,
            )
            this.$nextTick(this.clampStagePosition)
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
        startEditing() {
            this.layouts.forEach((layout) => {
                layout.draftItems = this.clone(layout.savedItems)
            })
            this.isEditing = true
            this.selectedNumber = ''
            this.resetHistory()
        },
        requestEditFromInteraction() {
            if (this.isEditing) return
            this.ignoreBackdropUntil = Date.now() + 700
            this.$nextTick(() => {
                this.showEditPrompt = true
            })
        },
        confirmEditMode() {
            this.showEditPrompt = false
            this.startEditing()
        },
        saveAndFinish() {
            const savedAt = new Date().toISOString()
            this.layouts.forEach((layout, index) => {
                layout.name = layout.name.trim() || `Layout ${index + 1}`
                layout.savedAt = savedAt
                layout.savedItems = this.clone(layout.draftItems)
            })
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    version: 2,
                    activeLayoutId: this.activeLayoutId,
                    canvas: { width: this.designWidth, height: this.designHeight },
                    layouts: this.layouts.map((layout) => ({
                        id: layout.id,
                        name: layout.name,
                        savedAt: layout.savedAt,
                        items: this.normalizedItems(layout.savedItems),
                    })),
                }),
            )
            this.savedSnapshot = this.savedStateSnapshot()
            this.isEditing = false
            this.selectedNumber = ''
        },
        commitLayoutName() {
            if (!this.currentLayout) return
            const layoutIndex = this.layouts.findIndex(
                (layout) => layout.id === this.currentLayout.id,
            )
            this.currentLayout.name =
                this.currentLayout.name.trim() || `Layout ${layoutIndex + 1}`
            if (this.isEditing) return

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    version: 2,
                    activeLayoutId: this.activeLayoutId,
                    canvas: { width: this.designWidth, height: this.designHeight },
                    layouts: this.layouts.map((layout) => ({
                        id: layout.id,
                        name: layout.name,
                        savedAt: layout.savedAt,
                        items: this.normalizedItems(layout.savedItems),
                    })),
                }),
            )
            this.savedSnapshot = this.savedStateSnapshot()
        },
        savePendingChanges() {
            const shouldClose = this.closeIntent === 'close'
            this.showCloseConfirm = false
            this.saveAndFinish()
            this.closeIntent = 'close'
            if (shouldClose) this.$emit('close')
        },
        requestClose() {
            if (this.isEditing && this.isDirty) {
                this.closeIntent = 'close'
                this.showCloseConfirm = true
                return
            }
            this.$emit('close')
        },
        requestLeaveEditMode() {
            if (!this.isEditing) return
            if (this.isDirty) {
                this.closeIntent = 'leave-edit'
                this.showCloseConfirm = true
                return
            }
            this.leaveEditMode()
        },
        leaveEditMode() {
            this.layouts.forEach((layout) => {
                layout.draftItems = this.clone(layout.savedItems)
            })
            this.isEditing = false
            this.selectedNumber = ''
            this.showCloseConfirm = false
            this.closeIntent = 'close'
            this.resetHistory()
        },
        handleBackdropClick() {
            if (this.showEditPrompt || Date.now() < this.ignoreBackdropUntil)
                return
            this.requestClose()
        },
        discardAndClose() {
            this.showCloseConfirm = false
            if (this.closeIntent === 'leave-edit') {
                this.leaveEditMode()
                return
            }
            this.closeIntent = 'close'
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
            downloadTableLayout(url, this.layoutName)
        },
        printLayout() {
            if (this.isEditing) return
            const url = this.exportDataUrl()
            if (!url) return
            printTableLayout(url, this.layoutName)
        },
    },
}
</script>
