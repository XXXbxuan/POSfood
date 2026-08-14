<template>
    <div class="page-stack labels-page">
        <section class="page-heading labels-heading-simple">
            <div class="labels-heading-copy">
                <div class="labels-title-row">
                    <button v-if="showStageBackButton" class="labels-previous-link" type="button" @click="goBackStage">
                        <i class="fa-solid fa-arrow-left"></i> Back
                    </button>
                    <button v-else-if="isShipmentWizard && !wizardCompleted" class="labels-previous-link" type="button" @click="previousShipmentStep">
                        <i class="fa-solid fa-arrow-left"></i> Previous
                    </button>
                    <h1 class="inventory-page-title">{{ isShipmentWizard ? 'Shipment Labels' : 'Warehouse Labels' }}</h1>
                </div>
            </div>
            <nav class="labels-steps labels-workflow-steps" aria-label="Label progress">
                <span v-if="!isShipmentWizard" :class="{ active: currentStage === 1, done: currentStage > 1 }"><b>1</b><em>Source</em></span>
                <i v-if="!isShipmentWizard"></i>
                <span :class="{ active: currentStage === 2, done: currentStage > 2 }"><b>{{ isShipmentWizard ? 1 : 2 }}</b><em>Design</em></span>
                <i></i>
                <span :class="{ active: currentStage === 3 }"><b>{{ isShipmentWizard ? 2 : 3 }}</b><em>Print</em></span>
            </nav>
        </section>


        <button v-if="currentStage === 2" class="button print label-floating-preview" type="button" :disabled="!canPrint" @click="openPrintPreview">
            <i class="fa-solid fa-print"></i>Preview
        </button>

        <section v-if="currentStage === 1" class="labels-source-stage">
            <LabelSourcePicker
                :products="labelSourceProducts"
                :batch-products="activeProducts"
                :model-value="productId"
                :quantities="labelQuantities"
                :units-by-product="labelUnitsByProduct"
                :selected-unit-ids="selectedUnitIdsByProduct"
                :receipt-layers-by-product="labelReceiptLayersByProduct"
                :receipt-quantities="receiptLabelQuantities"
                :batches="labelBatches"
                :selected-batch-id="selectedBatchId"
                :batch-quantities="batchLabelQuantities"
                @update:modelValue="selectLabelProduct"
                @update:quantities="labelQuantities = $event"
                @update:selected-unit-ids="selectedUnitIdsByProduct = $event"
                @update:receipt-quantities="receiptLabelQuantities = $event"
                @update:batch-quantities="batchLabelQuantities = $event"
                @select-batch="selectLabelBatch"
                @clear-batch="clearLabelBatch"
                @proceed="goToDesign"
            />
            <footer class="labels-source-stage-actions">
                <button class="button primary" type="button" :disabled="!hasSourceSelection" @click="goToDesign">Continue<i class="fa-solid fa-arrow-right"></i></button>
            </footer>
        </section>

        <section v-else-if="currentStage === 2" class="labels-layout">
            <form class="panel label-controls" @submit.prevent>
                <header class="section-header label-setup-header"><span><i class="fa-solid fa-sliders"></i></span><div><h2>Label setup</h2></div></header>
                <div v-if="selectedBatch" class="label-batch-output-mode" role="group" aria-label="Batch label output">
                    <button type="button" :class="{ active: batchPrintMode === 'items' }" @click="batchPrintMode = 'items'"><i class="fa-solid fa-tags"></i>Individual labels</button>
                    <button type="button" :class="{ active: batchPrintMode === 'batch' }" @click="batchPrintMode = 'batch'"><i class="fa-solid fa-layer-group"></i>One batch label</button>
                </div>
                <div class="form-grid two-column label-print-settings">
                    <label><span>Label Size</span><ScrollableSelect v-model="size"><option value="medium">60 × 40 mm</option><option value="small">50 × 30 mm</option><option value="large">80 × 50 mm</option></ScrollableSelect></label>
                    <label><span>Copies per numbered item</span><input v-model.number="quantity" type="number" min="1" :max="maxCopies" inputmode="numeric" @input="normalisePrintQuantity" /></label>
                </div>
                <div v-if="!isShipmentWizard" class="label-template-picker" role="tablist" aria-label="Sticker template">
                    <button v-for="template in labelTemplates" :key="template.key" type="button" :class="{ active: labelTemplate === template.key }" @click="chooseLabelTemplate(template)">
                        <i class="fa-solid" :class="template.icon"></i>{{ template.label }}
                    </button>
                </div>
                <label v-if="!isShipmentWizard"><span>Orientation</span><ScrollableSelect v-model="orientation"><option value="landscape">Landscape</option><option value="portrait">Portrait</option></ScrollableSelect></label>
                <label v-if="!isShipmentWizard"><span>Label Type</span>
                    <ScrollableSelect v-model="labelPurpose">
                        <option value="standard">Standard stock label</option>
                        <option value="move">Stock Movement label</option>
                        <option value="remove">Remove label</option>
                        <option value="return">Return to supplier label</option>
                        <option value="damage">Damage / issue label</option>
                        <option value="custom">Other label</option>
                    </ScrollableSelect>
                </label>
                <label v-if="!isShipmentWizard"><span>Description</span><input v-model.trim="customDescription" type="text" placeholder="Optional label note e.g. Broken, Wet box, Refund to supplier" /></label>
                <label v-if="!isShipmentWizard" class="toggle-label"><input v-model="showExpiry" type="checkbox" /><span><strong>Show expiry date</strong></span></label>
                <label v-if="!isShipmentWizard" class="toggle-label"><input v-model="showPrice" type="checkbox" /><span><strong>Show selling price</strong></span></label>
                <label v-if="!isShipmentWizard" class="toggle-label"><input v-model="showActionTag" type="checkbox" /><span><strong>Show label type</strong></span></label>
                <label v-if="!isShipmentWizard" class="toggle-label"><input v-model="showDescription" type="checkbox" /><span><strong>Show description</strong></span></label>
                <p v-if="wizardError" class="label-wizard-error"><i class="fa-solid fa-circle-exclamation"></i>{{ wizardError }}</p>
            </form>

            <section class="panel label-preview-panel">
                <header class="panel-header label-preview-header">
                    <div><h2>Warehouse sticker</h2></div>
                    <div class="label-preview-actions">
                        <span>{{ sizeLabel }}</span>
                        <button v-if="canEditCurrentLabelLayout" class="button secondary" type="button" @click="openLabelDesigner"><i class="fa-solid fa-pen-ruler"></i>Edit Layout</button>
                    </div>
                </header>
                <div v-if="currentLabelItem" class="label-stage label-stage-carousel" @click="canEditCurrentLabelLayout && openLabelDesigner()">
                    <button class="label-preview-arrow previous" type="button" aria-label="Previous label" :disabled="printCount <= 1" @click.stop="previousLabelPreview">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <div class="label-preview-fit" :class="`orientation-${orientation}`">
                    <BatchLabel
                        v-if="currentLabelItem.kind === 'batch'"
                        :batch="currentLabelItem.batch"
                        :products="activeProducts"
                        :size="size"
                        :orientation="orientation"
                        :warehouse-name="currentLabelItem.warehouseName"
                        :barcode-data-url="currentLabelItem.barcodeDataUrl"
                        :edits="labelEdits"
                    />
                    <WarehouseLabel
                        v-else
                        id="printable-label"
                        :product="currentLabelItem.product || product"
                        :batch="currentLabelItem.batch || (currentLabelItem.product?.id === product?.id ? batch : null)"
                        :size="size"
                        :orientation="orientation"
                        :show-expiry="showExpiry"
                        :show-price="showPrice"
                        :show-action-tag="showActionTag"
                        :show-description="showDescription"
                        :label-purpose="labelPurpose"
                        :description-text="customDescription"
                        :barcode-data-url="currentLabelItem.barcodeDataUrl"
                        :stock-unit="currentLabelItem.unit"
                        :warehouse-name="currentLabelItem.warehouseName"
                        :location-name="currentLabelItem.locationName"
                        :label-quantity="currentLabelItem.displayQuantity"
                        :sequence-index="currentLabelItem.sequenceIndex"
                        :sequence-total="currentLabelItem.sequenceTotal"
                        :edits="labelEdits"
                    />
                    </div>
                    <button class="label-preview-arrow next" type="button" aria-label="Next label" :disabled="printCount <= 1" @click.stop="nextLabelPreview">
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
                <div v-else class="summary-placeholder"><i class="fa-solid fa-tag"></i><strong>Select a source</strong></div>
            </section>
        </section>

        <Teleport to="body">
            <div v-if="printCount" class="print-sheet" :class="{ 'is-single': printCount === 1 }">
                <div v-for="(page, pageIndex) in printPages" :key="pageIndex" class="print-page">
                    <div v-for="item in page" :key="item.key" class="print-label-slot" :class="[`label-${size}`, `orientation-${orientation}`]">
                        <BatchLabel
                            v-if="item.kind === 'batch'"
                            class="print-copy"
                            :batch="item.batch"
                            :products="activeProducts"
                            :size="size"
                            :orientation="orientation"
                            :warehouse-name="item.warehouseName"
                            :barcode-data-url="item.barcodeDataUrl"
                            :edits="labelEdits"
                        />
                        <WarehouseLabel
                            v-else
                            class="print-copy"
                            :product="item.product || product"
                            :batch="item.batch || (item.product?.id === product?.id ? batch : null)"
                            :size="size"
                            :orientation="orientation"
                            :show-expiry="showExpiry"
                            :show-price="showPrice"
                            :show-action-tag="showActionTag"
                            :show-description="showDescription"
                            :label-purpose="labelPurpose"
                            :description-text="customDescription"
                            :barcode-data-url="item.barcodeDataUrl"
                            :stock-unit="item.unit"
                            :warehouse-name="item.warehouseName"
                            :location-name="item.locationName"
                            :label-quantity="item.displayQuantity"
                            :sequence-index="item.sequenceIndex"
                            :sequence-total="item.sequenceTotal"
                            :edits="labelEdits"
                        />
                    </div>
                </div>
            </div>
        </Teleport>

        <div v-if="printPreviewOpen" class="modal-backdrop" @click.self="closePrintPreview">
            <section class="form-modal label-print-preview-modal">
                <header class="modal-header">
                    <div>
                        <span class="eyebrow">PRINT PREVIEW</span>
                        <h2>{{ printCount }} Warehouse {{ printCount === 1 ? 'Label' : 'Labels' }}</h2>
                    </div>
                    <button class="icon-button" type="button" aria-label="Close print preview" @click="closePrintPreview"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="label-print-preview-body">
                    <div class="label-print-preview-canvas" :class="{ 'is-single': printCount === 1 }">
                        <section
                            v-for="(page, pageIndex) in printPages"
                            :key="pageIndex"
                            class="label-print-preview-page"
                        >
                            <header>
                                <strong>Page {{ pageIndex + 1 }}</strong>
                                <span>{{ page.length }} labels</span>
                            </header>
                            <div class="label-print-preview-page-grid">
                                <div v-for="item in page" :key="item.key" class="label-print-preview-slot" :class="[`label-${size}`, `orientation-${orientation}`]">
                                    <BatchLabel
                                        v-if="item.kind === 'batch'"
                                        :batch="item.batch"
                                        :products="activeProducts"
                                        :size="size"
                                        :orientation="orientation"
                                        :warehouse-name="item.warehouseName"
                                        :barcode-data-url="item.barcodeDataUrl"
                                        :edits="labelEdits"
                                    />
                                    <WarehouseLabel
                                        v-else
                                        :product="item.product || product"
                                        :batch="item.batch || (item.product?.id === product?.id ? batch : null)"
                                        :size="size"
                                        :orientation="orientation"
                                        :show-expiry="showExpiry"
                                        :show-price="showPrice"
                                        :show-action-tag="showActionTag"
                                        :show-description="showDescription"
                                        :label-purpose="labelPurpose"
                                        :description-text="customDescription"
                                        :barcode-data-url="item.barcodeDataUrl"
                                        :stock-unit="item.unit"
                                        :warehouse-name="item.warehouseName"
                                        :location-name="item.locationName"
                                        :label-quantity="item.displayQuantity"
                                        :sequence-index="item.sequenceIndex"
                                        :sequence-total="item.sequenceTotal"
                                        :edits="labelEdits"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                    <aside class="label-print-summary">
                        <span><small>Label Size</small><strong>{{ sizeLabel }}</strong></span>
                        <span><small>Numbered Items</small><strong>{{ uniqueLabelCount }}</strong></span>
                        <span><small>Copies / Item</small><strong>× {{ quantity }}</strong></span>
                        <span><small>Total Labels</small><strong>{{ printCount }}</strong></span>
                        <span><small>Pages</small><strong>{{ printPageCount }}</strong></span>
                        <span><small>Selling Price</small><strong>{{ showPrice ? `RM ${Number(product?.sellingPrice || 0).toFixed(2)}` : 'Hidden' }}</strong></span>
                    </aside>
                </div>
                <footer class="form-actions label-print-preview-actions">
                    <button class="button secondary" type="button" @click="closePrintPreview">Back</button>
                    <span></span>
                    <button class="button primary" type="button" @click="printLabels"><i class="fa-solid fa-print"></i>Print Now</button>
                </footer>
            </section>
        </div>

        <div v-if="printResultOpen" class="modal-backdrop" @click.self="cancelPrintConfirmation">
            <section class="form-modal shipment-print-confirm-modal">
                <header class="modal-header">
                    <div>
                        <span class="eyebrow">PRINT CHECK</span>
                        <h2>Did all labels print correctly?</h2>
                    </div>
                    <button class="icon-button" type="button" aria-label="Close" @click="cancelPrintConfirmation"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="shipment-print-confirm-body">
                    <span><i class="fa-solid fa-print"></i></span>
                    <div>
                        <strong>{{ printCount }} {{ printCount === 1 ? 'label' : 'labels' }} prepared</strong>
                        <small v-if="!isShipmentWizard">Complete returns to the first labels page. Cancel goes back to edit.</small>
                    </div>
                </div>
                <footer class="form-actions shipment-print-confirm-actions">
                    <button class="button secondary" type="button" @click="cancelPrintConfirmation"><i class="fa-solid fa-arrow-left"></i>Cancel</button>
                    <span></span>
                    <button class="button primary" type="button" @click="confirmPrintedShipment"><i class="fa-solid fa-check"></i>{{ isShipmentWizard ? 'Complete Shipment' : 'Complete' }}</button>
                </footer>
            </section>
        </div>

        <div v-if="labelDesignerOpen" class="modal-backdrop" @click.self="requestCloseDesigner">
            <section class="form-modal label-designer-modal">
                <header class="modal-header">
                    <div><h2>Edit Warehouse Sticker</h2></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="requestCloseDesigner"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="label-designer-body">
                    <div class="label-designer-stage">
                        <BatchLabel
                            v-if="currentLabelItem?.kind === 'batch'"
                            :batch="currentLabelItem.batch"
                            :products="activeProducts"
                            :size="size"
                            :orientation="orientation"
                            :warehouse-name="currentLabelItem.warehouseName"
                            :barcode-data-url="currentLabelItem.barcodeDataUrl"
                            :edits="designerRenderEdits"
                            editing
                            :selected-key="selectedTextKey"
                            @element-pointer="beginDesignerPointer"
                        />
                        <WarehouseLabel
                            v-else
                            :product="currentLabelItem?.product || product"
                            :batch="currentLabelItem?.batch || batch"
                            :size="size"
                            :orientation="orientation"
                            :show-expiry="showExpiry"
                            :show-price="showPrice"
                            :show-action-tag="showActionTag"
                            :show-description="showDescription"
                            :label-purpose="labelPurpose"
                            :description-text="customDescription"
                            :barcode-data-url="currentLabelItem?.barcodeDataUrl || barcodeDataUrl"
                            :stock-unit="currentLabelItem?.unit || previewItem.unit"
                            :warehouse-name="currentLabelItem?.warehouseName || previewItem.warehouseName"
                            :location-name="currentLabelItem?.locationName || previewItem.locationName"
                            :label-quantity="currentLabelItem?.displayQuantity || ''"
                            :sequence-index="currentLabelItem?.sequenceIndex || 0"
                            :sequence-total="currentLabelItem?.sequenceTotal || 0"
                            :edits="designerRenderEdits"
                            editing
                            :selected-key="selectedTextKey"
                            @element-pointer="beginDesignerPointer"
                        />
                    </div>
                    <form class="label-designer-controls form-grid" @submit.prevent="saveLabelText">
                        <div class="designer-selection"><span>SELECTED ITEM</span><strong>{{ editorLabel }}</strong></div>
                        <button class="button secondary label-add-text-button" type="button" @click="addTextBox"><i class="fa-solid fa-plus"></i>Add Text Box</button>
                        <label><span>Element Size</span>
                            <div class="label-font-size-control">
                                <input v-model.number="textDraft.scale" class="label-font-size-range" type="range" min="30" max="300" />
                                <input v-model.number="textDraft.scale" class="label-font-size-number" type="number" min="30" max="300" inputmode="numeric" aria-label="Exact element scale" @change="normaliseElementScale" />
                            </div>
                        </label>
                        <label v-if="isTextElement"><span>Display Text</span><input v-model="textDraft.text" type="text" /></label>
                        <label v-if="isTextElement"><span>Font Size</span>
                            <div class="label-font-size-control">
                                <input v-model.number="textDraft.size" class="label-font-size-range" type="range" min="9" max="66" />
                                <input v-model.number="textDraft.size" class="label-font-size-number" type="number" min="9" max="202" inputmode="numeric" aria-label="Exact font size" @change="normaliseFontSize" />
                            </div>
                        </label>
                        <label v-if="isTextElement"><span>Text Alignment</span>
                            <div class="label-align-control">
                                <button v-for="align in ['left', 'center', 'right']" :key="align" type="button" :class="{ active: textDraft.align === align }" @click="textDraft.align = align">
                                    <i class="fa-solid" :class="`fa-align-${align}`"></i>
                                </button>
                            </div>
                        </label>
                        <button v-if="isCustomText" class="button label-delete-text-button" type="button" @click="deleteTextBox"><i class="fa-solid fa-trash-can"></i>Delete Text Box</button>
                        <footer class="form-actions label-designer-actions">
                            <button class="button secondary" type="button" @click="resetAllLabelElements">Reset</button>
                            <span></span>
                            <button class="button primary" type="submit">Save</button>
                        </footer>
                    </form>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
import WarehouseLabel from '@/components/labels/WarehouseLabel.vue'
import BatchLabel from '@/components/labels/BatchLabel.vue'
import LabelSourcePicker from '@/components/labels/LabelSourcePicker.vue'
import { inventoryStore } from '@/services/inventoryStore'
import { barcodeDataUrl as createBarcodeDataUrl } from '@/utils/barcode'
import { qrCodeDataUrl } from '@/utils/qrCode'
import { defaultLabelStyle } from '@/utils/labelLayout'
import { productOptionLabel } from '@/utils/productDisplay'

const LABEL_FONT_SIZE_VERSION_KEY = 'ims_label_font_size_version'
const LABEL_FONT_SIZE_VERSION = '3'

function migrateSavedLabelFontSizes(saved) {
    if (localStorage.getItem(LABEL_FONT_SIZE_VERSION_KEY) === LABEL_FONT_SIZE_VERSION) {
        return saved
    }

    const migrated = Object.fromEntries(
        Object.entries(saved).map(([productId, edits]) => [
            productId,
            Object.fromEntries(
                Object.entries(edits || {}).map(([key, style]) => {
                    if (
                        key === '__customTextKeys' ||
                        !style ||
                        typeof style !== 'object'
                    ) {
                        return [key, style]
                    }
                    if (['barcode', 'bar', 'qr'].includes(key)) {
                        return [
                            key,
                            {
                                ...style,
                                scale: Math.max(90, Number(style.scale) || 100),
                            },
                        ]
                    }
                    const minimum = defaultLabelStyle(key).size
                    return [
                        key,
                        {
                            ...style,
                            size: Math.max(
                                minimum,
                                Number(style.size) || minimum,
                            ),
                        },
                    ]
                }),
            ),
        ]),
    )

    localStorage.setItem('ims_label_text_styles', JSON.stringify(migrated))
    localStorage.setItem(LABEL_FONT_SIZE_VERSION_KEY, LABEL_FONT_SIZE_VERSION)
    return migrated
}

function readSavedLabelEdits() {
    try {
        const saved = migrateSavedLabelFontSizes(
            JSON.parse(localStorage.getItem('ims_label_text_styles')) || {},
        )
        return Object.fromEntries(
            Object.entries(saved).map(([productId, edits]) => {
                const {
                    barcode: savedBarcodeStyle,
                    bar: legacyBarStyle,
                    qr: legacyQrStyle,
                    ...currentEdits
                } = edits || {}
                const barcodeStyle =
                    savedBarcodeStyle || legacyBarStyle || legacyQrStyle
                return [
                    productId,
                    {
                        ...currentEdits,
                        ...(barcodeStyle ? { barcode: barcodeStyle } : {}),
                    },
                ]
            }),
        )
    } catch (error) {
        return {}
    }
}

export default {
    name: 'LabelsView',
    components: { WarehouseLabel, BatchLabel, LabelSourcePicker },
    data() {
        return {
            store: inventoryStore,
            currentStage: 1,
            productId: '',
            batchId: '',
            unitId: '',
            receiptId: '',
            shipmentId: '',
            shipmentDraft: null,
            wizardCompleted: false,
            wizardError: '',
            sourceWarehouseId: '',
            sourceLocationId: '',
            printMode: 'single',
            size: 'medium',
            orientation: 'landscape',
            quantity: 1,
            labelTemplate: 'stock',
            labelQuantities: {},
            selectedUnitIdsByProduct: {},
            receiptLabelQuantities: {},
            batchLabelQuantities: {},
            selectedBatchId: '',
            batchPrintMode: 'items',
            previewLabelIndex: 0,
            labelTemplates: [
                { key: 'stock', label: 'Stock', purpose: 'standard', icon: 'fa-box' },
                { key: 'return', label: 'Return', purpose: 'return', icon: 'fa-rotate-left' },
                { key: 'handling', label: 'Handling', purpose: 'damage', icon: 'fa-triangle-exclamation' },
                { key: 'custom', label: 'Custom', purpose: 'custom', icon: 'fa-pen-ruler' },
            ],
            showExpiry: true,
            showPrice: false,
            labelPurpose: 'standard',
            customDescription: '',
            showActionTag: false,
            showDescription: false,
            barcodeDataUrl: '',
            batchQrDataUrl: '',
            printPreviewOpen: false,
            printResultOpen: false,
            printInProgress: false,
            printJobRecorded: false,
            labelDesignerOpen: false,
            selectedTextKey: '',
            selectedFallback: '',
            textDraft: { text: '', size: 14, align: 'left' },
            labelEditsByProduct: readSavedLabelEdits(),
            designerEdits: {},
            designerPointer: null,
        }
    },
    computed: {
        activeProducts() {
            return this.store.state.products.filter((product) => product.active)
        },
        showStageBackButton() {
            if (this.isShipmentWizard || this.printPreviewOpen) return false
            return this.currentStage > 1 || (this.currentStage === 1 && ['dashboard', 'scan'].includes(String(this.$route.query.from || '')))
        },
        labelSourceProducts() {
            return this.activeProducts
                .map((product) => ({
                    ...product,
                    stock: Math.max(0, Number(this.store.productStock(product.id, { stockSource: 'standalone' })) || 0),
                }))
                .filter((product) => product.stock > 0)
        },
        labelUnitsByProduct() {
            return Object.fromEntries(
                this.labelSourceProducts
                    .filter((product) => product.trackingMode === 'unit')
                    .map((product) => [
                        product.id,
                        this.store.availableStockUnits(product.id, { stockSource: 'standalone' })
                            .slice()
                            .sort((left, right) => this.compareStockUnits(left, right)),
                    ]),
            )
        },
        labelReceiptLayersByProduct() {
            return Object.fromEntries(
                this.labelSourceProducts
                    .filter((product) => product.trackingMode !== 'unit')
                    .map((product) => [
                        product.id,
                        this.store.stockLotsFor(product.id, { stockSource: 'standalone' })
                            .filter((lot) => Number(lot.availableQuantity) > 0)
                            .slice()
                            .sort((left, right) => {
                                const leftExpiry = left.expiryDate ? new Date(left.expiryDate).getTime() : Number.MAX_SAFE_INTEGER
                                const rightExpiry = right.expiryDate ? new Date(right.expiryDate).getTime() : Number.MAX_SAFE_INTEGER
                                return leftExpiry - rightExpiry || new Date(left.receivedDate || 0).getTime() - new Date(right.receivedDate || 0).getTime()
                            }),
                    ]),
            )
        },
        hasSourceSelection() {
            if (this.isShipmentWizard) return Boolean(this.shipmentDraft)
            if (this.selectedBatchForLabels) return this.selectedBatchForLabels.items.length > 0
            return Object.values(this.labelQuantities).some((value) => Number(value) > 0)
        },
        sourceSelectionLabel() {
            if (this.isShipmentWizard) return this.shipmentSourceLabel
            if (this.selectedBatchForLabels) {
                const count = this.selectedBatchForLabels.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
                return `${this.selectedBatchForLabels.name} · ${this.formatQuantity(count)} parts`
            }
            const selected = Object.entries(this.labelQuantities).filter(([, quantity]) => Number(quantity) > 0)
            if (!selected.length) return 'No source selected'
            const count = selected.reduce((sum, [, quantity]) => sum + Number(quantity || 0), 0)
            return `${selected.length} ${selected.length === 1 ? 'product' : 'products'} · ${this.formatQuantity(count)} labels`
        },
        labelBatches() {
            return this.store.batchGroups({ availableOnly: true, completeOnly: true }).map((batch) => {
                const warehouseNames = [...new Set(
                    batch.locations.map((location) => location.warehouseName).filter(Boolean),
                )]
                return {
                    ...batch,
                    items: batch.items
                        .map((item) => ({ ...item, quantity: item.availableQuantity }))
                        .filter((item) => item.quantity > 0),
                    warehouseName: warehouseNames.length === 1
                        ? warehouseNames[0]
                        : warehouseNames.length > 1
                            ? 'Multiple warehouses'
                            : '',
                }
            })
        },
        selectedBatch() {
            return this.labelBatches.find((batch) => batch.id === this.selectedBatchId) || null
        },
        selectedBatchForLabels() {
            if (!this.selectedBatch) return null
            const items = this.selectedBatch.items
                .map((item) => ({
                    ...item,
                    quantity: Math.max(0, Math.min(Number(item.quantity) || 0, Number(this.batchLabelQuantities[item.lotId || item.productId]) || 0)),
                }))
                .filter((item) => item.quantity > 0)
            return { ...this.selectedBatch, items }
        },
        batchBarcodeDataUrl() {
            if (!this.selectedBatch) return ''
            return this.batchQrDataUrl
        },
        product() {
            return this.store.findProduct(this.productId)
        },
        standaloneProductStock() {
            return this.product
                ? Math.max(0, Number(this.store.productStock(this.product.id, { stockSource: 'standalone' })) || 0)
                : 0
        },
        productLots() {
            return this.product
                ? this.store.stockLotsFor(this.product.id, { stockSource: 'standalone' })
                : []
        },
        batch() {
            const lot = this.productLots.find(
                (item) =>
                    item.id === this.batchId ||
                    item.batchNumber === this.batchId,
            )
            if (!lot) return null
            return {
                ...lot,
                lotId: lot.id,
                id: lot.batchNumber,
                quantity: lot.availableQuantity,
                receivedDate: lot.receivedDate,
            }
        },
        stockUnit() {
            return this.store.state.stockUnits.find((unit) => unit.id === this.unitId) || null
        },
        productUnits() {
            return this.product
                ? this.store.state.stockUnits.filter(
                      (unit) => unit.productId === this.product.id,
                  )
                : []
        },
        receiptUnits() {
            if (!this.receiptId || !this.product) return []
            return this.productUnits
                .filter((unit) => unit.receiptId === this.receiptId)
                .sort((a, b) => Number(a.ordinal) - Number(b.ordinal))
        },
        shipment() {
            return this.store.state.shipments.find((item) => item.id === this.shipmentId) || null
        },
        shipmentUnits() {
            if (!this.shipment || !this.product) return []
            const unitIds = new Set(this.shipment.unitIds || [])
            const actualUnits = this.productUnits
                .filter((unit) => unitIds.has(unit.id))
                .sort((a, b) => Number(a.ordinal) - Number(b.ordinal))
            if (actualUnits.length) {
                return actualUnits.map((unit) => ({
                    ...unit,
                    displayOrdinal: Number(unit.batchOrdinal || unit.ordinal),
                    displayTotal: Number(unit.receiptQuantity || 0),
                }))
            }
            return [...(this.shipment.labelUnits || [])]
                .sort((a, b) => Number(a.ordinal) - Number(b.ordinal))
        },
        isShipmentWizard() {
            return Boolean(this.shipmentDraft)
        },
        shipmentSourceLabel() {
            if (!this.shipmentDraft) return ''
            if (this.shipmentDraft.kind === 'batch') {
                const count = this.selectedBatchForLabels?.items.reduce(
                    (sum, item) => sum + Math.max(0, Number(item.quantity) || 0),
                    0,
                ) || 0
                return `Registered batch items (${this.formatQuantity(count)})`
            }
            return `Shipment items (${this.shipmentLabelUnits.length})`
        },
        shipmentDraftUnits() {
            if (!this.shipmentDraft || !this.product) return []
            const requested = Number(this.shipmentDraft.quantity || 0)
            if (!(requested > 0)) return []
            if (this.product.trackingMode === 'unit') {
                const selectedIds = new Set(this.shipmentDraft.unitIds || [])
                return this.productUnits
                    .filter((unit) => selectedIds.has(unit.id))
                    .slice()
                    .sort((left, right) => this.compareStockUnits(left, right))
            }
            const wholePieces = Number.isInteger(requested) && this.isPieceUnit(this.product.unit)
            let lines = []
            try {
                lines = this.store.previewShipmentAllocation(this.shipmentDraft).lines || []
            } catch (error) {
                lines = []
            }
            if (!lines.length) {
                const warehouse = this.store.findWarehouse(this.shipmentDraft.sourceWarehouseId)
                const location = this.store.findLocation(this.shipmentDraft.sourceWarehouseId, this.shipmentDraft.sourceLocationId)
                lines = [{
                    lotId: this.shipmentDraft.lotId || '',
                    positionId: '',
                    warehouseId: this.shipmentDraft.sourceWarehouseId,
                    warehouseName: warehouse?.name || 'Warehouse',
                    locationId: this.shipmentDraft.sourceLocationId || '',
                    locationName: location?.name || 'Auto allocated',
                    quantity: requested,
                }]
            }
            const labelCount = wholePieces ? requested : lines.length
            let sequence = 0
            return lines.flatMap((line, lineIndex) => {
                const lot = this.store.state.stockLots.find((item) => item.id === line.lotId)
                // A missing lot must never leak the internal lot id into a
                // printable product code. Prefer its public lot number and
                // otherwise fall back to the product SKU.
                const code = this.store.stockLayerCode(
                    this.product,
                    lot || line.batchNumber || '',
                )
                const lineCount = wholePieces ? Math.max(0, Math.floor(Number(line.quantity) || 0)) : 1
                return Array.from({ length: lineCount }, (_, lineItemIndex) => {
                    sequence += 1
                    return {
                        id: `draft-shipment-label-${this.product.id}-${line.lotId || lineIndex}-${lineItemIndex + 1}`,
                        code,
                        productId: this.product.id,
                        lotId: line.lotId || '',
                        positionId: line.positionId || '',
                        warehouseId: line.warehouseId || this.shipmentDraft.sourceWarehouseId,
                        warehouseName: line.warehouseName || 'Warehouse',
                        locationId: line.locationId || '',
                        location: line.locationName || 'Auto allocated',
                        ordinal: sequence,
                        batchOrdinal: sequence,
                        receiptQuantity: labelCount,
                        displayOrdinal: sequence,
                        displayTotal: labelCount,
                        displayQuantity: wholePieces
                            ? `${requested} ${this.product.unit}`
                            : `${this.formatQuantity(line.quantity)} ${this.product.unit}`,
                        status: 'draft',
                        virtualLabel: true,
                        sharedProductBarcode: true,
                    }
                })
            })
        },
        shipmentLabelUnits() {
            return this.wizardCompleted ? this.shipmentUnits : (this.shipmentDraftUnits.length ? this.shipmentDraftUnits : this.shipmentUnits)
        },
        batchUnits() {
            if (!this.product || !this.batch) return []
            const actualUnits = this.productUnits
                .filter((unit) => unit.lotId === this.batch.lotId)
                .sort((a, b) => Number(a.ordinal) - Number(b.ordinal))
            if (actualUnits.length) return actualUnits

            const total = Number(this.batch.receivedQuantity || this.batch.quantity || 0)
            if (!Number.isInteger(total) || total <= 0) return []
            const position = this.selectedPosition
            const warehouseId = this.sourceWarehouseId || position?.warehouseId || ''
            const locationId = this.sourceLocationId || position?.locationId || ''
            const warehouse = this.store.findWarehouse(warehouseId)
            const location = this.store.findLocation(warehouseId, locationId)
            const productCode = String(this.product.sku || this.product.id || 'ITEM')
                .toUpperCase()
                .replace(/[^A-Z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            const batchCode = String(this.batch.batchNumber || this.batch.id || 'BATCH')
                .toUpperCase()
                .replace(/[^A-Z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            const digits = Math.max(3, String(total).length)

            return Array.from({ length: total }, (_, index) => {
                const ordinal = index + 1
                return {
                    id: `batch-label-${this.batch.lotId}-${ordinal}`,
                    code: `${productCode}-${batchCode}-${String(ordinal).padStart(digits, '0')}`,
                    productId: this.product.id,
                    lotId: this.batch.lotId,
                    receiptId: this.batch.receiptId || '',
                    positionId: position?.id || '',
                    warehouseId,
                    warehouseName: warehouse?.name || position?.warehouseName || 'Warehouse',
                    locationId,
                    location: location?.name || position?.location || 'Not assigned',
                    ordinal,
                    receiptQuantity: total,
                    status: 'labelled',
                    virtualLabel: true,
                }
            })
        },
        labelSourceUnits() {
            if (this.printMode === 'batch') return this.batchUnits
            if (this.printMode === 'shipment') return this.shipmentLabelUnits
            if (this.printMode === 'receipt') return this.receiptUnits
            return this.stockUnit ? [this.stockUnit] : []
        },
        selectedPosition() {
            const directPosition = this.store.state.stockPositions.find(
                (position) =>
                    position.productId === this.product?.id &&
                    (!this.batch || position.lotId === this.batch.lotId) &&
                    (!this.sourceWarehouseId || position.warehouseId === this.sourceWarehouseId) &&
                    (!this.sourceLocationId || position.locationId === this.sourceLocationId),
            )
            if (directPosition) return directPosition

            const unit = this.stockUnit || this.shipmentLabelUnits[0] || this.receiptUnits[0]
            if (unit) {
                return this.store.state.stockPositions.find(
                    (position) => position.id === unit.positionId,
                )
            }
            if (!this.batch) return null
            return this.store
                .stockPositionsFor(this.product.id, { lotId: this.batch.lotId })
                .find((position) => Number(position.availableQuantity) > 0) || null
        },
        previewItem() {
            const unit = this.printMode === 'single'
                ? this.stockUnit
                : this.labelSourceUnits[0] || null
            return this.makeLabelItem(unit, 0)
        },
        currentLabelItem() {
            if (!this.labelItems.length) return null
            const index = ((this.previewLabelIndex % this.labelItems.length) + this.labelItems.length) % this.labelItems.length
            return this.labelItems[index]
        },
        canEditCurrentLabelLayout() {
            if (!this.currentLabelItem || this.currentLabelItem.kind === 'batch') return false
            return !this.selectedBatch || (this.isShipmentWizard && this.batchPrintMode === 'items')
        },
        codeContent() {
            if (this.previewItem.unit?.code) return this.previewItem.unit.code
            if (this.batch?.batchNumber) return this.batch.batchNumber
            return this.store.stockLayerCode(this.product, this.previewItem?.batch)
        },
        sizeLabel() {
            return { small: '50 × 30 mm', medium: '60 × 40 mm', large: '80 × 50 mm' }[this.size]
        },
        maxCopies() {
            const selectedQuantity = this.selectedBatchForLabels
                ? (this.batchPrintMode === 'batch' ? 1 : this.selectedBatchForLabels.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0))
                : Object.values(this.labelQuantities).reduce((sum, value) => sum + Number(value || 0), 0)
            const sourceCount = Math.max(1, selectedQuantity || this.labelSourceUnits.length)
            return Math.max(1, Math.floor(500 / sourceCount))
        },
        labelItems() {
            const copies = Math.min(this.maxCopies, Math.max(1, Math.floor(Number(this.quantity) || 1)))
            if (this.isShipmentWizard && this.shipmentDraft?.kind === 'product') {
                const sourceUnits = this.shipmentLabelUnits
                const sequenceTotal = sourceUnits.length
                return sourceUnits.flatMap((unit, unitIndex) =>
                    Array.from({ length: copies }, (_, copyIndex) => ({
                        ...this.makeLabelItem(unit, copyIndex, unitIndex),
                        displayQuantity: this.product?.trackingMode === 'unit' ? `1 ${this.product.unit}` : (unit.displayQuantity || `${this.formatQuantity(this.shipmentDraft.quantity)} ${this.product.unit}`),
                        sequenceIndex: unitIndex + 1,
                        sequenceTotal,
                    })),
                )
            }
            if (this.isShipmentWizard && this.shipmentDraft?.kind === 'batch' && this.selectedBatchForLabels) {
                if (this.batchPrintMode === 'batch') {
                    return Array.from({ length: copies }, (_, copyIndex) => ({
                        key: `${this.selectedBatchForLabels.id}-copy-${copyIndex}`,
                        kind: 'batch',
                        batch: this.selectedBatchForLabels,
                        warehouseName: this.selectedBatchForLabels.warehouseName || '',
                        barcodeDataUrl: this.batchBarcodeDataUrl,
                    }))
                }
                return this.buildBatchUnitLabelItems(this.selectedBatchForLabels, copies)
            }
            if (this.selectedBatchForLabels && this.batchPrintMode === 'batch') {
                if (!this.selectedBatchForLabels.items.length) return []
                return Array.from({ length: copies }, (_, copyIndex) => ({
                    key: `${this.selectedBatchForLabels.id}-copy-${copyIndex}`,
                    kind: 'batch',
                    batch: this.selectedBatchForLabels,
                    warehouseName: this.selectedBatchForLabels.warehouseName || this.previewItem.warehouseName,
                    barcodeDataUrl: this.batchBarcodeDataUrl,
                }))
            }
            if (this.selectedBatchForLabels) {
                return this.buildBatchUnitLabelItems(this.selectedBatchForLabels, copies)
            }
            const sourceEntries = Object.entries(this.labelQuantities).map(([productId, quantity]) => ({ productId, quantity }))
            if (sourceEntries.some((entry) => Number(entry.quantity) > 0)) {
                return sourceEntries.flatMap((entry) => {
                    const sourceProduct = this.store.findProduct(entry.productId)
                    if (!sourceProduct) return []
                    if (sourceProduct.trackingMode === 'unit') {
                        const selectedIds = new Set(this.selectedUnitIdsByProduct[sourceProduct.id] || [])
                        const selectedUnits = (this.labelUnitsByProduct[sourceProduct.id] || []).filter((unit) => selectedIds.has(unit.id))
                        return selectedUnits.flatMap((unit, unitIndex) =>
                            Array.from({ length: copies }, (_, copyIndex) => ({
                                ...this.makeLabelItem(unit, copyIndex, unitIndex, sourceProduct),
                                key: `${unit.id}-${copyIndex}`,
                                displayQuantity: `1 ${sourceProduct.unit}`,
                                sequenceIndex: unitIndex + 1,
                                sequenceTotal: selectedUnits.length,
                            })),
                        )
                    }

                    const selectedQuantity = Math.min(500, Math.max(0, Number(entry.quantity) || 0))
                    const layerAllocations = Object.entries(this.receiptLabelQuantities[sourceProduct.id] || {})
                        .map(([lotId, quantity]) => ({
                            lot: (this.labelReceiptLayersByProduct[sourceProduct.id] || []).find((lot) => lot.id === lotId),
                            quantity: Number(quantity) || 0,
                        }))
                        .filter((allocation) => allocation.lot && allocation.quantity > 0)
                    const isPieceQuantity = this.isPieceUnit(sourceProduct.unit) && Number.isInteger(selectedQuantity)
                    if (!isPieceQuantity) {
                        const layers = layerAllocations.length ? layerAllocations : [{ lot: null, quantity: selectedQuantity }]
                        return layers.flatMap((allocation, layerIndex) => {
                            const sourceUnit = this.makeReceiptLayerUnit(sourceProduct, allocation.lot, layerIndex)
                            return Array.from({ length: copies }, (_, copyIndex) => ({
                                ...this.makeLabelItem(sourceUnit, copyIndex, layerIndex, sourceProduct),
                                key: `${sourceProduct.id}-${allocation.lot?.id || 'stock'}-${copyIndex}`,
                                batch: allocation.lot || null,
                                displayQuantity: `${this.formatQuantity(allocation.quantity)} ${sourceProduct.unit}`,
                                sequenceIndex: layers.length > 1 ? layerIndex + 1 : 0,
                                sequenceTotal: layers.length > 1 ? layers.length : 0,
                            }))
                        })
                    }

                    const count = Math.floor(selectedQuantity)
                    const expandedLayers = layerAllocations.flatMap((allocation) =>
                        Array.from({ length: Math.floor(allocation.quantity) }, () => allocation.lot),
                    )
                    return Array.from({ length: count }, (_, index) => {
                        const lot = expandedLayers[index] || null
                        const sourceUnit = this.makeReceiptLayerUnit(sourceProduct, lot, index)
                        return Array.from({ length: copies }, (_, copyIndex) => ({
                            ...this.makeLabelItem(sourceUnit, copyIndex, index, sourceProduct),
                            key: `${sourceProduct.id}-${lot?.id || 'stock'}-${index}-${copyIndex}`,
                            batch: lot,
                            displayQuantity: `1 ${sourceProduct.unit}`,
                            sequenceIndex: index + 1,
                            sequenceTotal: count,
                        }))
                    }).flat()
                })
            }
            if (!this.product) return []
            if (this.printMode === 'single' && !this.stockUnit && !(this.standaloneProductStock > 0)) return []
            const sourceUnits = this.printMode === 'single'
                ? [this.stockUnit]
                : this.labelSourceUnits
            const rows = []
            sourceUnits.forEach((unit, unitIndex) => {
                for (let copyIndex = 0; copyIndex < copies; copyIndex += 1) {
                    rows.push({
                        ...this.makeLabelItem(unit, copyIndex, unitIndex),
                        sequenceIndex: unit ? unitIndex + 1 : 0,
                        sequenceTotal: unit ? sourceUnits.length : 0,
                    })
                }
            })
            return rows
        },
        uniqueLabelCount() {
            if (this.selectedBatch && this.batchPrintMode === 'batch') return 1
            if (this.labelItems.length) return Math.ceil(this.labelItems.length / Math.max(1, Number(this.quantity) || 1))
            if (!this.product) return 0
            return this.printMode === 'single' ? 1 : this.labelSourceUnits.length
        },
        printCount() {
            return this.labelItems.length
        },
        canPrint() {
            if (!this.printCount) return false
            if (this.selectedBatch && this.batchPrintMode === 'batch' && !this.batchBarcodeDataUrl) return false
            if (this.selectedBatch || Object.values(this.labelQuantities).some((value) => Number(value) > 0)) return true
            if (!this.product) return false
            if (this.printMode === 'single' && this.product.trackingMode === 'unit') {
                return Boolean(this.stockUnit) || this.standaloneProductStock > 0
            }
            if (this.printMode === 'single') return this.standaloneProductStock > 0
            return this.labelSourceUnits.length > 0
        },
        printPageCount() {
            return Math.ceil(this.printCount / 6)
        },
        printPages() {
            return Array.from(
                { length: this.printPageCount },
                (_, pageIndex) =>
                    this.labelItems.slice(pageIndex * 6, pageIndex * 6 + 6),
            )
        },
        labelEdits() {
            const savedTemplate = this.labelEditsByProduct[this.labelLayoutKey]
            return savedTemplate || this.labelEditsByProduct[this.productId] || {}
        },
        labelLayoutKey() {
            if (this.currentLabelItem?.kind === 'batch') return `batch:${this.labelTemplate}:${this.orientation}`
            return `${this.currentLabelItem?.product?.id || this.productId}:${this.labelTemplate}:${this.orientation}`
        },
        designerCustomTextKeys() {
            return this.designerEdits.__customTextKeys || []
        },
        designerRenderEdits() {
            if (!this.selectedTextKey) return this.designerEdits
            return {
                ...this.designerEdits,
                [this.selectedTextKey]: {
                    ...defaultLabelStyle(this.selectedTextKey),
                    ...this.textDraft,
                },
            }
        },
        editorLabel() {
            if (this.isCustomText) return 'Text Box'
            return {
                logo: 'Logo',
                brand: 'Brand',
                warehouse: 'Warehouse',
                name: this.currentLabelItem?.kind === 'batch' ? 'Batch Name' : 'Product Name',
                sku: this.currentLabelItem?.kind === 'batch' ? 'Batch Code' : 'Product Code',
                batch: 'Batch Number',
                quantity: 'Quantity',
                received: 'Received Date',
                expiry: 'Expiry Date',
                location: 'Location',
                price: 'Price',
                barcode: 'Barcode',
                sequence: 'Unit sequence',
                items: 'Batch products',
                supplier: 'Supplier',
            }[this.selectedTextKey] || 'Text'
        },
        isTextElement() {
            return !['logo', 'barcode'].includes(this.selectedTextKey)
        },
        isCustomText() {
            return this.selectedTextKey.startsWith('custom-text-')
        },
    },
    watch: {
        '$route.query.reset'() {
            this.resetToSourceStage()
        },
        codeContent: 'generateBarcode',
        labelPurpose(value) {
            const template = this.labelTemplates.find((item) => item.purpose === value)
            if (template) this.labelTemplate = template.key
            const needsActionTag = value !== 'standard'
            this.showActionTag = needsActionTag
            if (['return', 'damage', 'custom'].includes(value)) this.showDescription = true
            if (value === 'return' && !this.customDescription) this.customDescription = 'Return to supplier'
            if (value === 'damage' && !this.customDescription) this.customDescription = 'Handle with care'
        },
    },
    beforeUnmount() {
        this.endDesignerPointer()
        window.removeEventListener('afterprint', this.handleAfterPrint)
        document.body.classList.remove('printing-labels')
    },
    mounted() {
        if (this.$route.query.reset) {
            this.resetToSourceStage()
            return
        }
        if (this.$route.query.draft === 'batch-shipment') {
            try {
                this.shipmentDraft = JSON.parse(sessionStorage.getItem('ims_batch_shipment_draft') || 'null')
            } catch (error) {
                this.shipmentDraft = null
            }
            if (!this.shipmentDraft?.batchId) {
                this.$router.replace({ name: 'dispatch', query: { mode: 'ship', source: 'batch' } })
                return
            }
            const batch = this.labelBatches.find((item) => item.id === this.shipmentDraft.batchId)
            if (!batch) {
                sessionStorage.removeItem('ims_batch_shipment_draft')
                this.$router.replace({ name: 'dispatch', query: { mode: 'ship', source: 'batch' } })
                return
            }
            this.selectedBatchId = batch.id
            this.batchPrintMode = 'items'
            this.batchLabelQuantities = Object.fromEntries(
                batch.items.map((item) => [
                    item.lotId || item.productId,
                    Math.max(0, Number(item.recipeQuantity || 1) * Number(this.shipmentDraft.batchCount || 1)),
                ]),
            )
            this.productId = batch.items[0]?.productId || ''
            this.quantity = 1
            this.currentStage = 2
            this.generateBatchQrCode()
            return
        }
        if (this.$route.query.draft === 'shipment') {
            try {
                this.shipmentDraft = JSON.parse(sessionStorage.getItem('ims_shipment_draft') || 'null')
            } catch (error) {
                this.shipmentDraft = null
            }
            if (!this.shipmentDraft) {
                this.$router.replace({ name: 'dispatch' })
                return
            }
            const product = this.store.findProduct(this.shipmentDraft.productId)
            if (!product) {
                sessionStorage.removeItem('ims_shipment_draft')
                this.$router.replace({ name: 'dispatch' })
                return
            }
            this.productId = product.id
            this.labelQuantities = {}
            this.batchId = this.shipmentDraft.lotId
            this.sourceWarehouseId = this.shipmentDraft.sourceWarehouseId || ''
            this.sourceLocationId = this.shipmentDraft.sourceLocationId || ''
            this.printMode = 'shipment'
            this.quantity = 1
            this.currentStage = 2
            this.generateBarcode()
            return
        }
        const product = this.store.findProduct(this.$route.query.product)
        if (product) {
            this.productId = product.id
            this.currentStage = 2
            const standaloneStock = Math.max(
                0,
                Math.floor(Number(this.store.productStock(product.id, { stockSource: 'standalone' })) || 0),
            )
            this.labelQuantities = standaloneStock
                ? { [product.id]: Math.min(standaloneStock, Math.max(1, Number(this.$route.query.copies) || 1)) }
                : {}
            this.batchId = this.$route.query.batch || ''
            this.unitId = this.$route.query.unit || ''
            if (product.trackingMode === 'unit') {
                const availableUnits = this.store.availableStockUnits(product.id, { stockSource: 'standalone' })
                const requestedUnit = availableUnits.find((unit) => unit.id === this.unitId)
                const selectedUnits = requestedUnit
                    ? [requestedUnit.id]
                    : availableUnits.slice(0, Math.min(availableUnits.length, Math.max(1, Number(this.$route.query.copies) || 1))).map((unit) => unit.id)
                this.selectedUnitIdsByProduct = { [product.id]: selectedUnits }
                this.labelQuantities = { [product.id]: selectedUnits.length }
            }
            this.receiptId = this.$route.query.receipt || ''
            this.shipmentId = this.$route.query.shipment || ''
            this.sourceWarehouseId = this.$route.query.sourceWarehouse || ''
            this.sourceLocationId = this.$route.query.sourceLocation || ''

            const groupedBatch = this.labelBatches.find((batch) => batch.id === this.$route.query.batch)
            if (groupedBatch) {
                this.selectedBatchId = groupedBatch.id
                this.batchPrintMode = 'items'
                this.batchLabelQuantities = Object.fromEntries(
                    groupedBatch.items.map((item) => [item.lotId || item.productId, Math.max(0, Number(item.recipeQuantity) || 1)]),
                )
                this.labelQuantities = {}
                this.productId = groupedBatch.items[0]?.productId || this.productId
                this.batchId = ''
                this.generateBatchQrCode()
            }

            const requestedMode = String(this.$route.query.mode || '')
            if (requestedMode === 'shipment' && this.shipmentLabelUnits.length) {
                this.printMode = 'shipment'
            } else if (this.batchId && this.batchUnits.length) {
                this.printMode = 'batch'
            } else if (this.receiptId && this.receiptUnits.length) {
                this.printMode = 'receipt'
            } else {
                this.printMode = 'single'
            }
            const requestedCopies = Math.max(1, Number(this.$route.query.copies) || 1)
            this.quantity = Math.min(this.maxCopies, requestedCopies)
            this.generateBarcode()
            if (this.$route.query.autoPreview === '1') {
                this.$nextTick(() => {
                    if (this.canPrint) this.openPrintPreview()
                })
            }
        }
    },
    methods: {
        resetToSourceStage() {
            this.shipmentDraft = null
            this.currentStage = 1
            this.productId = ''
            this.selectedBatchId = ''
            this.labelQuantities = {}
            this.selectedUnitIdsByProduct = {}
            this.receiptLabelQuantities = {}
            this.batchLabelQuantities = {}
            this.printPreviewOpen = false
        },
        productOptionLabel,
        goToDesign() {
            if (!this.hasSourceSelection) return
            this.previewLabelIndex = 0
            this.currentStage = 2
        },
        openPrintPreview() {
            if (!this.canPrint) return
            this.wizardError = ''
            if (this.isShipmentWizard) {
                try {
                    if (this.shipmentDraft.kind === 'batch') {
                        this.store.previewBatchShipment({
                            batchId: this.shipmentDraft.batchId,
                            batchCount: Number(this.shipmentDraft.batchCount || 1),
                            recipient: this.shipmentDraft.recipient,
                            reference: this.shipmentDraft.reference,
                            remark: this.shipmentDraft.remark,
                        })
                    } else {
                        this.store.previewShipmentAllocation({
                            ...this.shipmentDraft,
                            quantity: Number(this.shipmentDraft.quantity),
                            unitIds: [...(this.shipmentDraft.unitIds || [])],
                        })
                    }
                } catch (error) {
                    this.wizardError = error.message
                    return
                }
            }
            this.currentStage = 3
            this.printPreviewOpen = true
        },
        goBackStage() {
            if (this.printPreviewOpen || this.currentStage === 3) {
                this.closePrintPreview()
                return
            }
            if (this.currentStage > 1) {
                this.currentStage -= 1
                return
            }
            if (this.$route.query.from === 'scan') {
                const query = { code: String(this.$route.query.code || this.product?.bar || this.product?.sku || '') }
                if (this.$route.query.scanFrom) query.from = String(this.$route.query.scanFrom)
                this.$router.push({ name: 'scan', query })
                return
            }
            if (this.$route.query.from === 'dashboard') this.$router.push({ name: 'dashboard' })
        },
        closePrintPreview() {
            this.printPreviewOpen = false
            this.currentStage = 2
        },
        selectLabelProduct(productId) {
            if (this.productId === productId) {
                this.selectedBatchId = ''
                this.batchLabelQuantities = {}
                return
            }
            this.productId = productId
            this.selectedBatchId = ''
            this.batchLabelQuantities = {}
            this.previewLabelIndex = 0
            this.onProductChange()
        },
        selectLabelBatch(batch) {
            this.labelQuantities = {}
            this.selectedUnitIdsByProduct = {}
            this.receiptLabelQuantities = {}
            this.selectedBatchId = batch.id
            this.batchPrintMode = 'items'
            this.batchLabelQuantities = Object.fromEntries(
                batch.items.map((item) => [item.lotId || item.productId, Math.max(0, Number(item.recipeQuantity) || 1)]),
            )
            this.previewLabelIndex = 0
            this.productId = batch.items[0]?.productId || ''
            this.batchId = ''
            this.unitId = ''
            this.generateBatchQrCode()
            this.$nextTick(this.generateBarcode)
        },
        clearLabelBatch() {
            this.selectedBatchId = ''
            this.batchPrintMode = 'items'
            this.batchLabelQuantities = {}
            this.previewLabelIndex = 0
            this.productId = ''
            this.batchId = ''
            this.batchQrDataUrl = ''
        },
        previousLabelPreview() {
            if (this.printCount <= 1) return
            this.previewLabelIndex = (this.previewLabelIndex - 1 + this.printCount) % this.printCount
        },
        nextLabelPreview() {
            if (this.printCount <= 1) return
            this.previewLabelIndex = (this.previewLabelIndex + 1) % this.printCount
        },
        formatQuantity(value) {
            return new Intl.NumberFormat('en-MY', { maximumFractionDigits: 2 }).format(Number(value) || 0)
        },
        isPieceUnit(unit) {
            return /(?:pcs?|pieces?|units?|cartons?|boxes?|packs?)$/i.test(String(unit || '').trim())
        },
        previousShipmentStep() {
            if (this.shipmentDraft?.kind === 'batch') {
                this.$router.push({ name: 'dispatch', query: { mode: 'ship', source: 'batch', batch: this.shipmentDraft.batchId } })
                return
            }
            this.$router.push({ name: 'dispatch', query: { resume: '1' } })
        },
        cancelPrintConfirmation() {
            this.printResultOpen = false
            this.printInProgress = false
            this.currentStage = 2
        },
        resetLabelWorkflow() {
            this.currentStage = 1
            this.productId = ''
            this.batchId = ''
            this.unitId = ''
            this.receiptId = ''
            this.shipmentId = ''
            this.labelQuantities = {}
            this.selectedUnitIdsByProduct = {}
            this.receiptLabelQuantities = {}
            this.batchLabelQuantities = {}
            this.selectedBatchId = ''
            this.previewLabelIndex = 0
            this.printPreviewOpen = false
        },
        confirmPrintedShipment() {
            this.wizardError = ''
            if (!this.isShipmentWizard) {
                try {
                    this.recordCurrentPrint()
                    this.printResultOpen = false
                    this.resetLabelWorkflow()
                } catch (error) {
                    this.wizardError = error.message
                    this.printResultOpen = false
                    this.currentStage = 2
                }
                return
            }
            if (!this.shipmentDraft) {
                this.printResultOpen = false
                return
            }
            try {
                this.recordCurrentPrint()
                if (this.shipmentDraft.kind === 'batch') {
                    const result = this.store.createBatchShipment({
                        batchId: this.shipmentDraft.batchId,
                        batchCount: Number(this.shipmentDraft.batchCount || 1),
                        recipient: this.shipmentDraft.recipient,
                        reference: this.shipmentDraft.reference,
                        remark: this.shipmentDraft.remark,
                    })
                    this.wizardCompleted = true
                    this.printResultOpen = false
                    sessionStorage.removeItem('ims_batch_shipment_draft')
                    this.store.addToast(`${result.batchId} confirmed and stock deducted.`)
                    this.$router.push({ name: 'dispatch', query: { mode: 'ship', source: 'batch' } })
                    return
                }
                const shipment = this.store.createShipment({
                    ...this.shipmentDraft,
                    quantity: Number(this.shipmentDraft.quantity),
                    unitIds: [...(this.shipmentDraft.unitIds || [])],
                })
                this.shipmentId = shipment.id
                this.wizardCompleted = true
                this.printResultOpen = false
                sessionStorage.removeItem('ims_shipment_draft')
                this.store.addToast(`${shipment.id} confirmed and stock deducted.`)
                this.$router.push({ name: 'dispatch', query: { mode: 'ship' } })
            } catch (error) {
                this.wizardError = error.message
                this.printResultOpen = false
            }
        },
        handleAfterPrint() {
            if (!this.printInProgress) return
            this.printInProgress = false
            window.removeEventListener('afterprint', this.handleAfterPrint)
            document.body.classList.remove('printing-labels')
            this.printResultOpen = true
            this.currentStage = 2
        },
        normalisePrintQuantity(event) {
            if (event.target.value === '') return
            const quantity = Math.min(
                this.maxCopies,
                Math.max(1, Number(event.target.value) || 1),
            )
            this.quantity = quantity
            event.target.value = String(quantity)
        },
        stockUnitSeriesKey(unit) {
            return String(
                unit?.lotId ||
                unit?.receiptId ||
                unit?.positionId ||
                unit?.batchNumber ||
                unit?.locationId ||
                '',
            )
        },
        compareStockUnits(left, right) {
            const seriesCompare = this.stockUnitSeriesKey(left).localeCompare(
                this.stockUnitSeriesKey(right),
                undefined,
                { numeric: true },
            )
            if (seriesCompare) return seriesCompare
            const leftOrdinal = Number(left?.displayOrdinal || left?.batchPartOrdinal || left?.batchOrdinal || left?.ordinal) || 0
            const rightOrdinal = Number(right?.displayOrdinal || right?.batchPartOrdinal || right?.batchOrdinal || right?.ordinal) || 0
            return leftOrdinal - rightOrdinal || String(left?.code || '').localeCompare(String(right?.code || ''), undefined, { numeric: true })
        },
        chooseLabelTemplate(template) {
            this.labelTemplate = template.key
            this.labelPurpose = template.purpose
            if (template.key === 'return') {
                this.showActionTag = true
                this.showDescription = true
                this.customDescription = this.customDescription || 'Return to supplier'
            }
            if (template.key === 'handling') {
                this.showActionTag = true
                this.showDescription = true
                this.customDescription = this.customDescription || 'Handle with care'
            }
        },
        buildBatchUnitLabelItems(batch, copies = 1) {
            const entries = batch.items || []
            const totalParts = entries.reduce(
                (sum, entry) => sum + Math.max(0, Math.floor(Number(entry.quantity) || 0)),
                0,
            )
            const rows = []
            let batchSequence = 0
            entries.forEach((entry) => {
                const sourceProduct = this.store.findProduct(entry.productId)
                if (!sourceProduct) return
                const count = Math.max(0, Math.floor(Number(entry.quantity) || 0))
                const actualUnits = (entry.units || [])
                    .filter((unit) => unit.status === 'available')
                    .slice()
                    .sort((left, right) => this.compareStockUnits(left, right))
                    .slice(0, count)
                const sourceUnits = sourceProduct.trackingMode === 'unit'
                    ? actualUnits
                    : this.buildBatchPositionLabelUnits(entry, batch, sourceProduct, count)

                sourceUnits.forEach((unit) => {
                    batchSequence += 1
                    const labelUnit = unit.virtualLabel
                        ? {
                              ...unit,
                              code: `${sourceProduct.sku}-${String(batch.id || entry.batchNumber || 'B01').toUpperCase()}-${String(batchSequence).padStart(3, '0')}`,
                              ordinal: batchSequence,
                              batchOrdinal: batchSequence,
                              receiptQuantity: totalParts,
                          }
                        : unit
                    const lot = this.store.state.stockLots.find((item) => item.id === labelUnit.lotId)
                    for (let copyIndex = 0; copyIndex < copies; copyIndex += 1) {
                        rows.push({
                            ...this.makeLabelItem(labelUnit, copyIndex, batchSequence - 1, sourceProduct),
                            batch: lot || null,
                            displayQuantity: `1 ${sourceProduct.unit}`,
                            sequenceIndex: batchSequence,
                            sequenceTotal: totalParts,
                            batchGroupId: batch.id,
                        })
                    }
                })
            })
            return rows
        },
        buildBatchPositionLabelUnits(entry, batch, sourceProduct, count) {
            const positions = (entry.positions || [])
                .filter((position) => Number(position.quantity || position.availableQuantity) > 0)
                .slice()
                .sort((left, right) =>
                    String(left.createdAt || '').localeCompare(String(right.createdAt || '')) ||
                    String(left.warehouseName || '').localeCompare(String(right.warehouseName || '')) ||
                    String(left.locationName || left.location || '').localeCompare(String(right.locationName || right.location || '')) ||
                    String(left.id || '').localeCompare(String(right.id || '')),
                )
            const units = []
            let remaining = count
            positions.forEach((position) => {
                if (remaining <= 0) return
                const available = Math.max(
                    0,
                    Math.floor(Number(position.quantity || position.availableQuantity) || 0),
                )
                const take = Math.min(remaining, available)
                for (let index = 0; index < take; index += 1) {
                    const ordinal = units.length + 1
                    units.push({
                        id: `batch-label-${position.lotId}-${position.id}-${ordinal}`,
                        code: '',
                        productId: sourceProduct.id,
                        lotId: position.lotId,
                        positionId: position.id,
                        warehouseId: position.warehouseId || '',
                        warehouseName: position.warehouseName || batch.warehouseName || 'Warehouse',
                        locationId: position.locationId || '',
                        location: position.locationName || position.location || 'Not assigned',
                        ordinal,
                        batchOrdinal: ordinal,
                        receiptQuantity: count,
                        virtualLabel: true,
                    })
                }
                remaining -= take
            })
            return units
        },
        makeReceiptLayerUnit(product, lot, index = 0) {
            const position = lot
                ? this.store.stockPositionsFor(product.id, { lotId: lot.id, stockSource: 'standalone' })
                    .find((item) => Number(item.availableQuantity) > 0)
                : this.store.stockPositionsFor(product.id, { stockSource: 'standalone' })
                    .find((item) => Number(item.availableQuantity) > 0)
            const warehouse = this.store.findWarehouse(position?.warehouseId)
            const location = this.store.findLocation(position?.warehouseId, position?.locationId)
            return {
                id: `label-layer-${product.id}-${lot?.id || 'stock'}-${index}`,
                code: this.store.stockLayerCode(product, lot),
                productId: product.id,
                lotId: lot?.id || '',
                receiptId: lot?.receiptId || '',
                positionId: position?.id || '',
                warehouseId: position?.warehouseId || '',
                warehouseName: warehouse?.name || position?.warehouseName || 'Warehouse',
                locationId: position?.locationId || '',
                location: location?.name || position?.location || 'Not assigned',
                virtualLabel: true,
                sharedProductBarcode: true,
            }
        },
        makeLabelItem(unit, copyIndex = 0, unitIndex = 0, productOverride = null) {
            const labelProduct = productOverride || this.product
            const position = unit
                ? this.store.state.stockPositions.find(
                      (item) => item.id === unit.positionId,
                  )
                : this.selectedPosition
            const warehouseId = unit?.warehouseId || position?.warehouseId || ''
            const labelLot = unit?.lotId
                ? this.store.state.stockLots.find((item) => item.id === unit.lotId) || null
                : (productOverride ? null : this.batch)
            const code = unit?.code || (labelLot
                ? this.store.stockLayerCode(labelProduct, labelLot)
                : labelProduct?.sku || '')
            return {
                key: `${unit?.id || (productOverride ? labelProduct?.id : this.batch?.id) || labelProduct?.id || 'label'}-${unitIndex}-${copyIndex}`,
                product: labelProduct,
                unit: unit || null,
                batch: labelLot,
                warehouseName:
                    unit?.warehouseName ||
                    position?.warehouseName ||
                    this.store.findWarehouse(warehouseId)?.name ||
                    'Warehouse',
                locationName:
                    unit?.location ||
                    position?.location ||
                    'Not assigned',
                barcodeDataUrl: code
                    ? createBarcodeDataUrl(code, {
                          margin: 0,
                          width: 2,
                          height: 72,
                          fontSize: 15,
                          displayValue: false,
                      })
                    : '',
            }
        },
        defaultTextStyle(key) {
            return defaultLabelStyle(key)
        },
        openLabelDesigner() {
            if (!this.canEditCurrentLabelLayout) return
            this.designerEdits = JSON.parse(JSON.stringify(this.labelEdits))
            this.labelDesignerOpen = true
            this.selectedTextKey = ''
            this.selectLabelText('name', this.currentLabelItem?.kind === 'batch' ? this.currentLabelItem.batch.name : (this.currentLabelItem?.product?.name || this.product.name))
        },
        selectLabelText(key, fallback) {
            this.commitDesignerDraft()
            this.selectedTextKey = key
            this.selectedFallback = String(fallback || '')
            const saved = this.designerEdits[key]
            this.textDraft = saved
                ? { ...this.defaultTextStyle(key), ...saved }
                : { ...this.defaultTextStyle(key), text: this.selectedFallback }
        },
        commitDesignerDraft() {
            if (!this.selectedTextKey) return
            this.designerEdits = {
                ...this.designerEdits,
                [this.selectedTextKey]: { ...this.textDraft },
            }
        },
        addTextBox() {
            this.commitDesignerDraft()
            const key = `custom-text-${Date.now()}`
            const customCount = this.designerCustomTextKeys.length
            this.designerEdits = {
                ...this.designerEdits,
                __customTextKeys: [...this.designerCustomTextKeys, key],
                [key]: {
                    ...this.defaultTextStyle(key),
                    text: 'Text',
                    x: 24,
                    y: 24 + customCount * 28,
                },
            }
            this.selectedTextKey = ''
            this.selectLabelText(key, 'Text')
        },
        deleteTextBox() {
            if (!this.isCustomText) return
            const key = this.selectedTextKey
            const { [key]: removed, ...remainingEdits } = this.designerEdits
            this.designerEdits = {
                ...remainingEdits,
                __customTextKeys: this.designerCustomTextKeys.filter((item) => item !== key),
            }
            this.selectedTextKey = ''
            this.selectLabelText('name', this.product.name)
        },
        beginDesignerPointer(event, key, fallback = '') {
            if (this.designerPointer) this.endDesignerPointer()
            if (this.selectedTextKey !== key) this.selectLabelText(key, fallback)
            const target = event.currentTarget
            const rect = target.getBoundingClientRect()
            const labelRect = target.closest('.inventory-label, .batch-label')?.getBoundingClientRect()
            const resizeEdge = 20
            const isResize =
                event.clientX >= rect.right - resizeEdge &&
                event.clientY >= rect.bottom - resizeEdge

            this.designerPointer = {
                mode: isResize ? 'resize' : 'move',
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                startStyle: { ...this.defaultTextStyle(key), ...this.textDraft },
                labelWidth: labelRect?.width || 480,
                labelHeight: labelRect?.height || 320,
            }

            document.body.classList.add('label-designer-dragging')
            window.addEventListener('pointermove', this.moveDesignerPointer, { passive: false })
            window.addEventListener('pointerup', this.endDesignerPointer)
            window.addEventListener('pointercancel', this.endDesignerPointer)
        },
        moveDesignerPointer(event) {
            if (!this.designerPointer) return
            event.preventDefault()

            const deltaX = event.clientX - this.designerPointer.startX
            const deltaY = event.clientY - this.designerPointer.startY
            const start = this.designerPointer.startStyle

            if (this.designerPointer.mode === 'resize') {
                const nextScale = Math.round(Number(start.scale || 100) + (deltaX + deltaY) / 2)
                this.textDraft.scale = Math.min(300, Math.max(30, nextScale))
                return
            }

            const nextX = Math.round(Number(start.x || 0) + deltaX)
            const nextY = Math.round(Number(start.y || 0) + deltaY)
            if (this.isCustomText) {
                this.textDraft.x = Math.min(this.designerPointer.labelWidth - 44, Math.max(0, nextX))
                this.textDraft.y = Math.min(this.designerPointer.labelHeight - 30, Math.max(0, nextY))
                return
            }
            this.textDraft.x = Math.min(280, Math.max(-280, nextX))
            this.textDraft.y = Math.min(180, Math.max(-180, nextY))
        },
        endDesignerPointer() {
            window.removeEventListener('pointermove', this.moveDesignerPointer)
            window.removeEventListener('pointerup', this.endDesignerPointer)
            window.removeEventListener('pointercancel', this.endDesignerPointer)
            document.body.classList.remove('label-designer-dragging')
            this.designerPointer = null
        },
        normaliseFontSize() {
            const value = Number(this.textDraft.size) || 12
            this.textDraft.size = Math.min(202, Math.max(9, value))
        },
        normaliseElementScale() {
            const value = Number(this.textDraft.scale) || 100
            this.textDraft.scale = Math.min(300, Math.max(30, value))
        },
        saveLabelText() {
            this.commitDesignerDraft()
            this.labelEditsByProduct[this.labelLayoutKey] = {
                ...this.designerEdits,
            }
            localStorage.setItem('ims_label_text_styles', JSON.stringify(this.labelEditsByProduct))
            this.labelDesignerOpen = false
            this.store.addToast('Label saved.')
        },
        resetAllLabelElements() {
            if (!window.confirm('Reset the entire label to its default layout?')) return
            this.designerEdits = {}
            const key = this.selectedTextKey || 'name'
            const fallback = key === 'name' ? this.product.name : this.selectedFallback
            this.selectedTextKey = ''
            this.selectLabelText(key, fallback)
        },
        requestCloseDesigner() {
            if (!window.confirm('Close without saving these label changes?')) return
            this.endDesignerPointer()
            this.labelDesignerOpen = false
        },
        onBatchChange() {
            this.unitId = ''
            this.receiptId = ''
            this.shipmentId = ''
            this.quantity = 1
            this.$nextTick(() => {
                this.printMode = this.batchUnits.length ? 'batch' : 'single'
                this.generateBarcode()
            })
        },
        onProductChange() {
            this.batchId = ''
            this.unitId = ''
            this.receiptId = ''
            this.shipmentId = ''
            this.sourceWarehouseId = ''
            this.sourceLocationId = ''
            this.printMode = 'single'
            this.quantity = 1
            this.generateBarcode()
        },
        generateBarcode() {
            if (!this.codeContent) {
                this.barcodeDataUrl = ''
                return
            }
            this.barcodeDataUrl = createBarcodeDataUrl(this.codeContent, {
                margin: 0,
                width: 1.6,
                height: 54,
                fontSize: 13,
                displayValue: false,
            })
        },
        async generateBatchQrCode() {
            const batch = this.selectedBatch
            this.batchQrDataUrl = batch
                ? createBarcodeDataUrl(batch.code || batch.id, {
                      margin: 0,
                      width: 2,
                      height: 88,
                      fontSize: 14,
                      displayValue: false,
                  })
                : ''
        },
        recordCurrentPrint() {
            if (this.printJobRecorded) return null
            const printJob = this.store.recordLabelPrint({
                source: this.isShipmentWizard ? 'shipment' : 'labels',
                shipmentDraftKind: this.shipmentDraft?.kind || '',
                batchId: this.selectedBatchForLabels?.id || this.shipmentDraft?.batchId || '',
                labelCount: this.printCount,
                copiesPerItem: Math.max(1, Number(this.quantity) || 1),
                size: this.size,
                orientation: this.orientation,
                items: this.labelItems.map((item) => ({
                    productId: item.product?.id || '',
                    unitId: item.unit?.virtualLabel ? '' : item.unit?.id || '',
                    unitCode: item.unit?.code || '',
                    lotId: item.batch?.id || item.unit?.lotId || '',
                    batchId: item.batchGroupId || item.batch?.batchGroupId || '',
                    quantity: 1,
                })),
            })
            this.printJobRecorded = true
            return printJob
        },
        printLabels() {
            this.printJobRecorded = false
            this.printPreviewOpen = false
            this.printInProgress = true
            document.body.classList.add('printing-labels')
            window.removeEventListener('afterprint', this.handleAfterPrint)
            window.addEventListener('afterprint', this.handleAfterPrint, { once: true })
            this.$nextTick(() => {
                try {
                    window.print()
                } catch (error) {
                    this.printInProgress = false
                    document.body.classList.remove('printing-labels')
                    window.removeEventListener('afterprint', this.handleAfterPrint)
                    this.wizardError = error.message
                    this.store.addToast(error.message, 'danger')
                }
            })
        },
    },
}
</script>

<style scoped src="@/assets/css/pages/labels.css"></style>
