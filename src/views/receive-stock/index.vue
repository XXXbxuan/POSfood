<template>
    <main ref="page" class="rcv-page" :class="{ 'is-supplier-order': supplierOrderFlow }">
        <header v-if="!supplierOrderFlow" class="rcv-head">
            <div class="rcv-head-copy">
                <button v-if="!receipt && step === 1 && canReturnToSource" class="rcv-back" type="button" @click="goBack">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Back</span>
                </button>
                <h1 class="inventory-page-title">{{ pageTitle }}</h1>
            </div>
            <nav class="rcv-steps" aria-label="Receiving progress">
                <span v-for="item in progressSteps" :key="item.id" :class="{ active: step >= item.id, done: step > item.id || receipt }">
                    <b>{{ item.id }}</b>{{ item.label }}
                </span>
            </nav>
        </header>

        <section v-if="supplierOrderFlow && !receipt" class="rcv-layout rcv-supplier-order-layout">
            <form class="rcv-card" @submit.prevent="submitStep">
                <header class="rcv-card__head rcv-card__head--supplier">
                    <button v-if="step === 1 && canReturnToSource" class="rcv-back" type="button" @click="goBack">
                        <i class="fa-solid fa-arrow-left"></i>
                        <span>Back</span>
                    </button>
                    <span><i class="fa-solid" :class="stepIcon"></i></span>
                    <div class="rcv-card__head-copy"><h2>{{ stepTitle }}</h2></div>
                    <nav class="rcv-inline-steps" aria-label="Receiving progress">
                        <span v-for="item in progressSteps" :key="`inline-${item.id}`" :class="{ active: step >= item.id, done: step > item.id || receipt }">
                            <b>{{ item.id }}</b>{{ item.label }}
                        </span>
                    </nav>
                </header>

                <div v-if="step === 1" class="rcv-step">
                    <div class="rcv-fields rcv-supplier-origin-fields">
                        <label>
                            <span>Supplier *</span>
                            <button type="button" class="rcv-picker-button" @click="openSupplierPicker">
                                <span>{{ selectedSupplier ? `${selectedSupplier.code} — ${selectedSupplier.name}` : 'Select supplier' }}</span>
                                <i class="fa-solid fa-chevron-down"></i>
                            </button>
                        </label>
                        <label>
                            <span>Supplier address *</span>
                            <textarea v-model.trim="form.supplierAddress" rows="4" placeholder="Enter supplier address" required></textarea>
                        </label>
                    </div>
                </div>

                <div v-else-if="step === 2" class="rcv-step">
                    <div class="rcv-fields two rcv-delivery-grid">
                        <label><span>Warehouse *</span><ScrollableSelect v-model="form.warehouseId" required><option value="" disabled>Select warehouse</option><option v-for="warehouse in activeWarehouses" :key="warehouse.id" :value="warehouse.id">{{ warehouse.name }}</option></ScrollableSelect></label>
                        <label><span>Location *</span><ScrollableSelect v-model="form.locationId" required :disabled="!form.warehouseId"><option value="" disabled>Select location</option><option v-for="entry in locationPickerEntries" :key="entry.id" :value="entry.id" :disabled="entry.disabled">{{ entry.name }}{{ entry.disabled ? ` — ${entry.meta}` : (entry.meta !== 'Available' ? ` — ${entry.meta}` : '') }}</option></ScrollableSelect></label>
                        <label><span>Receiving date *</span><input v-model="form.receivingDate" type="date" required /></label>
                        <div class="rcv-proof-upload">
                            <span>Delivery proof photo</span>
                            <div class="rcv-proof-upload__control">
                                <input ref="proofInput" class="rcv-proof-upload__input" type="file" accept="image/*" @change="loadProofPhoto" />
                                <button class="rcv-proof-upload__button" type="button" @click="openProofPicker">Choose File</button>
                                <span class="rcv-proof-upload__name" :class="{ selected: form.photo }">{{ proofPhotoName }}</span>
                                <i v-if="form.photo" class="fa-solid fa-circle-check rcv-proof-ready"></i>
                            </div>
                        </div>
                        <label class="rcv-numbered-field"><span>Invoice</span><div><input v-model.trim="form.invoiceNumber" class="mono" placeholder="Auto generated" /><button type="button" title="Next sequential invoice number" aria-label="Next sequential invoice number" @click="regenerateDocumentNumber('invoiceNumber', 'INV', 'sequence')"><i class="fa-solid fa-arrow-down-short-wide"></i></button><button type="button" title="Generate random invoice number" aria-label="Generate random invoice number" @click="regenerateDocumentNumber('invoiceNumber', 'INV', 'random')"><i class="fa-solid fa-rotate"></i></button></div></label>
                        <label class="rcv-numbered-field"><span>Purchase order</span><div><input v-model.trim="form.purchaseOrderNumber" class="mono" placeholder="Auto generated" /><button type="button" title="Next sequential purchase order number" aria-label="Next sequential purchase order number" @click="regenerateDocumentNumber('purchaseOrderNumber', 'PO', 'sequence')"><i class="fa-solid fa-arrow-down-short-wide"></i></button><button type="button" title="Generate random purchase order number" aria-label="Generate random purchase order number" @click="regenerateDocumentNumber('purchaseOrderNumber', 'PO', 'random')"><i class="fa-solid fa-rotate"></i></button></div></label>
                    </div>
                </div>

                <div v-else-if="step === 3" class="rcv-step rcv-supplier-stock-step">
                    <nav class="rcv-type-toggle rcv-supplier-stock-toggle" aria-label="Supplier stock type">
                        <button type="button" :class="{ active: supplierOrderTarget === 'product' }" @click="selectSupplierOrderTarget('product')"><i class="fa-solid fa-box"></i>Products</button>
                        <button type="button" :class="{ active: supplierOrderTarget === 'batch' }" @click="selectSupplierOrderTarget('batch')"><i class="fa-solid fa-layer-group"></i>Batches</button>
                    </nav>

                    <section class="rcv-supplier-selection-shell">
                        <header class="rcv-supplier-selection-head">
                            <div>
                                <small>STOCK IN LIST</small>
                                <strong>{{ supplierOrderSelectedCount }} {{ supplierOrderTarget === 'batch' ? `batch${supplierOrderSelectedCount === 1 ? '' : 'es'}` : `item${supplierOrderSelectedCount === 1 ? '' : 's'}` }}</strong>
                            </div>
                        </header>

                        <div v-if="supplierOrderTarget === 'product' && batchItems.length" class="rcv-supplier-quantity-panel rcv-supplier-selected-list">
                            <article v-for="(item, index) in batchItems" :key="item.key" class="rcv-supplier-quantity-row" @click="openSupplierStockPicker">
                                <button type="button" class="rcv-supplier-line-card" @click.stop="openSupplierStockPicker">
                                    <span><strong>{{ store.findProduct(item.productId)?.name || 'Product' }}</strong><small class="mono">{{ store.findProduct(item.productId)?.sku || '—' }}</small></span>
                                </button>
                                <label @click.stop><span>Quantity *</span><input v-model.number="item.quantity" type="number" min="0.01" step="0.01" required /></label>
                                <button type="button" class="rcv-supplier-remove-line" aria-label="Remove product" @click.stop="removeSupplierOrderProduct(index)"><i class="fa-solid fa-xmark"></i></button>
                            </article>
                            <button type="button" class="rcv-supplier-add-line" @click="openSupplierStockPicker"><i class="fa-solid fa-plus"></i>Add product</button>
                        </div>

                        <div v-else-if="supplierOrderTarget === 'batch' && supplierBatchSelections.length" class="rcv-supplier-batch-selection-list">
                            <article v-for="selection in supplierBatchSelections" :key="selection.batchId" class="rcv-supplier-batch-button-row">
                                <button type="button" class="rcv-supplier-batch-open" @click="openBatchSelectionEdit(selection.batchId)">
                                    <span><strong>{{ selection.batchId }}</strong><small>{{ selection.items.length }} items</small></span>
                                </button>
                                <label class="rcv-supplier-batch-quick-count">
                                    <span>Batch qty</span>
                                    <input v-model.number="selection.batchCount" type="number" min="1" step="1" required />
                                </label>
                                <button type="button" class="rcv-supplier-batch-edit" :aria-label="`Edit ${selection.batchId}`" @click="openBatchSelectionEdit(selection.batchId)"><i class="fa-solid fa-chevron-right"></i></button>
                                <button type="button" class="rcv-supplier-remove-batch" :aria-label="`Remove ${selection.batchId}`" @click="removeSupplierOrderBatch(selection.batchId)"><i class="fa-solid fa-xmark"></i></button>
                            </article>
                            <button type="button" class="rcv-supplier-add-line" @click="openSupplierStockPicker"><i class="fa-solid fa-plus"></i>Add batch</button>
                        </div>

                        <button v-else type="button" class="rcv-supplier-empty-picker" @click="openSupplierStockPicker">
                            <span><i class="fa-solid" :class="supplierOrderTarget === 'batch' ? 'fa-layer-group' : 'fa-boxes-stacked'"></i></span>
                            <strong>{{ supplierOrderTarget === 'batch' ? 'Choose batches' : 'Choose products' }}</strong>
                        </button>
                    </section>

                    <div class="rcv-fields two rcv-supplier-stock-meta">
                        <label><span>Manufactured</span><input v-model="form.manufacturingDate" type="date" /></label>
                        <label><span>Expiry</span><input v-model="form.expiryDate" type="date" :required="batchNeedsExpiry" /></label>
                        <label class="full"><span>Remark</span><textarea v-model.trim="form.remark" rows="2" placeholder="Optional"></textarea></label>
                    </div>
                </div>

                <div v-else class="rcv-step rcv-cart-step">
                    <section class="rcv-cart-route rcv-cart-route--review">
                        <article class="rcv-cart-route-stop is-origin">
                            <header>
                                <span><i class="fa-solid fa-truck"></i></span>
                                <small>FROM SUPPLIER</small>
                                <button v-if="!receipt" type="button" aria-label="Edit supplier" @click="editSupplierOrderStep(1)"><i class="fa-solid fa-pen"></i></button>
                            </header>
                            <strong>{{ selectedSupplier?.name || 'Supplier' }}</strong>
                            <small class="mono">{{ selectedSupplier?.code || '—' }}</small>
                            <p>{{ form.supplierAddress || 'Address not set' }}</p>
                        </article>
                        <div class="rcv-cart-route-track" aria-hidden="true">
                            <i class="fa-solid fa-arrow-right"></i>
                            <span><i class="fa-solid fa-box-open"></i></span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </div>
                        <article class="rcv-cart-route-stop is-destination">
                            <header>
                                <span><i class="fa-solid fa-warehouse"></i></span>
                                <small>TO WAREHOUSE</small>
                                <button v-if="!receipt" type="button" aria-label="Edit destination" @click="editSupplierOrderStep(2)"><i class="fa-solid fa-pen"></i></button>
                            </header>
                            <strong>{{ selectedWarehouse?.name || 'Warehouse' }}</strong>
                            <small>{{ selectedLocation?.name || 'Location not selected' }}</small>
                            <p>Receiving {{ form.receivingDate }}</p>
                            <p v-if="form.invoiceNumber || form.purchaseOrderNumber" class="rcv-cart-route-detail">{{ form.invoiceNumber || 'No invoice' }}<span v-if="form.purchaseOrderNumber"> · {{ form.purchaseOrderNumber }}</span></p>
                        </article>
                    </section>

                    <section class="rcv-cart-card rcv-cart-stock-card">
                        <header>
                            <div><i class="fa-solid" :class="supplierOrderTarget === 'batch' ? 'fa-layer-group' : 'fa-boxes-stacked'"></i><strong>{{ supplierOrderTarget === 'batch' ? 'Batches' : 'Products' }}</strong></div>
                            <button v-if="!receipt" type="button" aria-label="Edit stock" @click="editSupplierOrderStep(3)"><i class="fa-solid fa-pen"></i></button>
                        </header>
                        <div v-if="supplierOrderTarget === 'product'" class="rcv-cart-lines">
                            <div v-for="item in batchItems" :key="`cart-${item.key}`"><span><strong>{{ store.findProduct(item.productId)?.name || 'Product' }}</strong><small class="mono">{{ store.findProduct(item.productId)?.sku || '—' }}</small></span><b>{{ item.quantity }} {{ store.findProduct(item.productId)?.unit || '' }}</b></div>
                        </div>
                        <div v-else class="rcv-cart-batch-groups">
                            <section v-for="selection in supplierBatchSelections" :key="`cart-${selection.batchId}`">
                                <header><strong class="mono">{{ selection.batchId }}</strong><small>{{ selection.batchCount }} batch{{ selection.batchCount === 1 ? '' : 'es' }}</small></header>
                                <div class="rcv-cart-lines">
                                    <div v-for="item in selection.items" :key="`cart-${selection.batchId}-${item.productId}`"><span><strong>{{ store.findProduct(item.productId)?.name || 'Product' }}</strong><small class="mono">{{ store.findProduct(item.productId)?.sku || '—' }}</small></span><b>{{ Number(item.quantity || 0) * Number(selection.batchCount || 0) }} {{ store.findProduct(item.productId)?.unit || '' }}</b></div>
                                </div>
                            </section>
                        </div>
                    </section>
                </div>

                <p v-if="error" class="rcv-error"><i class="fa-solid fa-circle-exclamation"></i>{{ error }}</p>
                <footer class="rcv-actions">
                    <button v-if="step > 1" type="button" class="button secondary" @click="previous"><i class="fa-solid fa-arrow-left"></i> Back</button>
                    <RouterLink v-else class="button secondary" :to="cancelRoute">Cancel</RouterLink>
                    <button class="button primary" type="submit">{{ step < 4 ? 'Next' : 'Submit Request' }}<i class="fa-solid" :class="step < 4 ? 'fa-arrow-right' : 'fa-check'"></i></button>
                </footer>
            </form>
        </section>

        <section v-else-if="!receipt" class="rcv-layout">
            <form class="rcv-card" @submit.prevent="submitStep">
                <header class="rcv-card__head">
                    <span><i class="fa-solid" :class="stepIcon"></i></span>
                    <div><h2>{{ stepTitle }}</h2></div>
                </header>

                <div v-if="step === 1" class="rcv-step">
                    <div class="rcv-fields two rcv-delivery-grid">
                        <label v-if="isSupplierStockIn" class="full">
                            <span>Supplier *</span>
                            <button type="button" class="rcv-picker-button" @click="openSupplierPicker">
                                <span>{{ selectedSupplier ? `${selectedSupplier.code} — ${selectedSupplier.name}` : 'Select supplier' }}</span>
                                <i class="fa-solid fa-chevron-down"></i>
                            </button>
                        </label>
                        <label v-if="isSupplierStockIn" class="full">
                            <span>Supplier address *</span>
                            <textarea v-model.trim="form.supplierAddress" rows="3" placeholder="Enter supplier address. This will be saved to the supplier profile." required></textarea>
                        </label>
                        <label>
                            <span>Receiving date *</span>
                            <input v-model="form.receivingDate" type="date" required />
                        </label>
                        <div class="rcv-proof-upload">
                            <span>Delivery proof photo</span>
                            <div class="rcv-proof-upload__control">
                                <input ref="proofInput" class="rcv-proof-upload__input" type="file" accept="image/*" @change="loadProofPhoto" />
                                <button class="rcv-proof-upload__button" type="button" @click="openProofPicker">Choose File</button>
                                <span class="rcv-proof-upload__name" :class="{ selected: form.photo }">{{ proofPhotoName }}</span>
                                <i v-if="form.photo" class="fa-solid fa-circle-check rcv-proof-ready" aria-label="Photo ready"></i>
                            </div>
                        </div>
                        <label v-if="isSupplierStockIn"><span>Invoice</span><input v-model.trim="form.invoiceNumber" class="mono" placeholder="INV-2026-001" /></label>
                        <label v-if="isSupplierStockIn"><span>Purchase order</span><input v-model.trim="form.purchaseOrderNumber" class="mono" placeholder="PO-2026-001" /></label>
                    </div>
                </div>

                <div v-else-if="step === 2" class="rcv-step">
                    <div v-if="isBatchStockIn" class="rcv-standard-batch-lines">
                        <article v-for="selection in supplierBatchSelections" :key="`stock-in-${selection.batchId}`" class="rcv-standard-batch-row">
                            <label class="rcv-standard-batch-row__batch">
                                <span>Batch *</span>
                                <button type="button" class="rcv-picker-button" @click="openBatchPicker">
                                    <span>{{ selection.batchId }} · {{ selection.items.length }} products</span>
                                    <i class="fa-solid fa-chevron-down"></i>
                                </button>
                            </label>
                            <label class="rcv-standard-batch-row__quantity">
                                <span>Quantity *</span>
                                <input v-model.number="selection.batchCount" type="number" min="1" step="1" required />
                            </label>
                            <button type="button" class="rcv-standard-batch-row__remove" :aria-label="`Remove ${selection.batchId}`" @click="removeSupplierOrderBatch(selection.batchId)"><i class="fa-solid fa-trash-can"></i></button>
                        </article>
                        <button type="button" class="rcv-standard-batch-add" aria-label="Add batch" @click="openBatchPicker"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <div v-if="!isBatchStockIn" class="rcv-batch-list">
                        <article v-for="(item, index) in batchItems" :key="item.key" class="rcv-batch-item">
                            <div class="rcv-batch-item-top">
                                <label>
                                    <span>Product {{ index + 1 }} *</span>
                                    <button type="button" class="rcv-picker-button" :disabled="isBatchStockIn" @click="openProductPicker(index)">
                                        <span>{{ item.productId ? productOptionLabel(store.findProduct(item.productId)) : 'Select product' }}</span>
                                        <i class="fa-solid fa-chevron-down"></i>
                                    </button>
                                </label>
                                <button v-if="!isBatchStockIn" type="button" class="button secondary rcv-tool-button" aria-label="Scan product" title="Scan product" @click="openScanner(index)"><i class="fa-solid fa-barcode"></i></button>
                                <button v-if="!isBatchStockIn" type="button" class="button secondary rcv-tool-button rcv-tool-button--danger" aria-label="Remove product" title="Remove product" :disabled="batchItems.length === 1" @click="removeBatchItem(index)"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                            <div class="rcv-fields two rcv-batch-item-grid">
                                <label v-if="!isBatchStockIn"><span>{{ isBatchRegistration ? 'Per batch quantity *' : 'Quantity *' }}</span><input v-model.number="item.quantity" type="number" min="0.01" step="0.01" required /></label>
                                <label v-else><span>Per batch</span><output>{{ item.quantity }} {{ store.findProduct(item.productId)?.unit || '' }}</output></label>
                                <label class="rcv-readonly-cost"><span>Cost price (RM)</span><output>{{ registeredCost(item.productId) }}</output></label>
                            </div>
                        </article>
                    </div>
                    <button v-if="!isBatchStockIn" type="button" class="rcv-add-product" title="Add another product" @click="addBatchItem">
                        <span class="rcv-add-product__line" aria-hidden="true"></span>
                        <span class="rcv-add-product__icon" aria-hidden="true"><i class="fa-solid fa-plus"></i></span>
                        <span class="rcv-add-product__line" aria-hidden="true"></span>
                    </button>
                    <div v-if="!isBatchStockIn" class="rcv-batch-meta">
                        <div class="rcv-batch-summary">
                            <small>{{ isBatchRegistration || isBatchStockIn ? 'BATCH REFERENCE' : 'RECEIPT REFERENCE' }}</small>
                            <strong class="mono">{{ nextBatchPreview }}</strong>
                        </div>
                        <div class="rcv-batch-summary">
                            <small>PRODUCT TYPES</small>
                            <strong>{{ selectedBatchItems.length }}</strong>
                        </div>
                    </div>
                </div>

                <div v-else class="rcv-step">
                    <div class="rcv-fields two">
                        <label>
                            <span>Warehouse *</span>
                            <ScrollableSelect v-model="form.warehouseId" required>
                                <option value="" disabled>Select warehouse</option>
                                <option v-for="warehouse in activeWarehouses" :key="warehouse.id" :value="warehouse.id">{{ warehouse.name }}</option>
                            </ScrollableSelect>
                        </label>
                        <label>
                            <span>Location *</span>
                            <ScrollableSelect v-model="form.locationId" required :disabled="!form.warehouseId">
                                <option value="" disabled>Select location</option>
                                <option v-for="entry in locationPickerEntries" :key="entry.id" :value="entry.id" :disabled="entry.disabled">
                                    {{ entry.name }}{{ entry.disabled ? ` — ${entry.meta}` : '' }}
                                </option>
                            </ScrollableSelect>
                        </label>
                        <label><span>Manufactured</span><input v-model="form.manufacturingDate" type="date" /></label>
                        <label><span>Expiry</span><input v-model="form.expiryDate" type="date" :required="batchNeedsExpiry" /></label>
                        <label class="full"><span>Remark</span><textarea v-model.trim="form.remark" rows="3" placeholder="Optional"></textarea></label>
                    </div>
                </div>

                <p v-if="error" class="rcv-error"><i class="fa-solid fa-circle-exclamation"></i>{{ error }}</p>
                <footer class="rcv-actions">
                    <button v-if="step > 1" type="button" class="button secondary" @click="previous">
                        <i class="fa-solid fa-arrow-left"></i> Back
                    </button>
                    <RouterLink v-else class="button secondary" :to="cancelRoute">Cancel</RouterLink>
                    <button class="button primary" type="submit">
                        {{ step < 3 ? 'Next' : 'Confirm Stock In' }}
                        <i class="fa-solid" :class="step < 3 ? 'fa-arrow-right' : 'fa-arrow-down'"></i>
                    </button>
                </footer>
            </form>

            <aside class="rcv-summary">
                <header><small>SUMMARY</small><h2>{{ !selectedBatchItems.length ? 'Select products' : isBatchRegistration ? `Batch · ${selectedBatchItems.length} product${selectedBatchItems.length === 1 ? '' : 's'}` : 'Stock receipt' }}</h2></header>
                <div class="rcv-equation">
                    <span><small>Current</small><strong>{{ currentStock }}</strong></span>
                    <i class="fa-solid fa-plus"></i>
                    <span><small>Incoming</small><strong>{{ incoming }}</strong></span>
                    <i class="fa-solid fa-equals"></i>
                    <span><small>After</small><strong>{{ currentStock + incoming }}</strong></span>
                </div>
                <dl>
                    <div v-if="isSupplierStockIn"><dt>Supplier</dt><dd>{{ selectedSupplier?.name || '—' }}</dd></div>
                    <div><dt>Products</dt><dd>{{ selectedBatchItems.length || '—' }}</dd></div>
                    <div><dt>{{ isBatchRegistration || isBatchStockIn ? 'Batch' : 'Receipt' }}</dt><dd class="mono">{{ nextBatchPreview }}</dd></div>
                    <div><dt>Location</dt><dd>{{ selectedLocation?.code || '—' }}</dd></div>
                </dl>
            </aside>
        </section>

        <section v-else-if="!supplierOrderFlow" class="rcv-complete">
            <span class="rcv-check"><i class="fa-solid fa-check"></i></span>
            <small>RECEIVING COMPLETE</small>
            <h1>{{ receipt.productCount }} product{{ receipt.productCount === 1 ? '' : 's' }} received</h1>
            <div class="rcv-equation complete">
                <span><small>Current</small><strong>{{ receiptBeforeTotal }}</strong></span>
                <i class="fa-solid fa-plus"></i>
                <span><small>Received</small><strong>{{ receipt.totalQuantity }}</strong></span>
                <i class="fa-solid fa-equals"></i>
                <span><small>After</small><strong>{{ receiptAfterTotal }}</strong></span>
            </div>
            <dl class="rcv-complete__meta">
                <div><dt>Receipts</dt><dd>{{ receipt.receipts.length }}</dd></div>
                <div><dt>{{ receiptWasBatch ? 'Batch' : 'Receipt' }}</dt><dd class="mono">{{ receipt.batchId }}</dd></div>
                <div><dt>Location</dt><dd>{{ receipt.receipt.location }}</dd></div>
                <div><dt>Labels</dt><dd>{{ receipt.stockUnits.length || 1 }}</dd></div>
            </dl>
            <footer>
                <RouterLink class="button secondary" :to="completionRoute">Done</RouterLink>
                <button v-if="isSupplierStockIn" class="button secondary" type="button" @click="receiptDocumentOpen = true"><i class="fa-solid fa-file-invoice"></i>View Receipt</button>
                <RouterLink
                    class="button primary"
                    :to="{
                        name: 'labels',
                        query: {
                            product: receipt.product.sku,
                            batch: receipt.batchId,
                            receipt: receipt.receipt.id,
                            source: 'receive',
                            ...labelReturnQuery,
                        },
                    }"
                >
                    <i class="fa-solid fa-print"></i> Print Labels
                </RouterLink>
            </footer>
        </section>


        <div v-if="productPickerOpen" class="modal-backdrop" @click.self="closeProductPicker">
            <section class="form-modal rcv-product-picker-modal">
                <header class="modal-header">
                    <div>
                        <span class="eyebrow">SELECT PRODUCT</span>
                        <h2>Choose product</h2>
                    </div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closeProductPicker"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="rcv-product-picker-body">
                    <label class="rcv-product-picker-search">
                        <span>Search</span>
                        <input v-model.trim="productPickerSearch" type="text" placeholder="Search name or SKU" />
                    </label>
                    <div class="rcv-product-picker-list">
                        <button
                            v-for="product in filteredProductOptions"
                            :key="product.id"
                            type="button"
                            class="rcv-product-picker-item"
                            :class="{ selected: batchItems[productPickerIndex]?.productId === product.id }"
                            @click="selectProductFromPicker(product)"
                        >
                            <strong>{{ product.name }}</strong>
                            <small>{{ product.sku }}</small>
                        </button>
                    </div>
                </div>
                <footer class="form-actions rcv-product-picker-actions">
                    <button class="button secondary" type="button" @click="closeProductPicker">Cancel</button>
                    <span></span>
                    <button class="button primary" type="button" @click="openRegisterProductFromPicker"><i class="fa-solid fa-plus"></i>Other</button>
                </footer>
            </section>
        </div>

        <div v-if="supplierStockPickerOpen" class="modal-backdrop rcv-picker-backdrop" @click.self="closeSupplierStockPicker">
            <section class="form-modal rcv-supplier-stock-picker-modal" role="dialog" aria-modal="true" :aria-label="supplierOrderTarget === 'batch' ? 'Choose supplier batches' : 'Choose supplier products'">
                <header class="modal-header">
                    <div>
                        <span class="eyebrow">{{ supplierOrderTarget === 'batch' ? 'SUPPLIER BATCHES' : 'SUPPLIER PRODUCTS' }}</span>
                        <h2>{{ supplierOrderTarget === 'batch' ? 'Choose batches' : 'Choose products' }}</h2>
                    </div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closeSupplierStockPicker"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="rcv-supplier-stock-picker-body">
                    <label class="rcv-product-picker-search">
                        <span>Search</span>
                        <input v-model.trim="supplierStockPickerSearch" type="text" :placeholder="supplierOrderTarget === 'batch' ? 'Search batch or product' : 'Search product or SKU'" />
                    </label>
                    <div v-if="supplierOrderTarget === 'product'" class="rcv-supplier-stock-picker-grid">
                        <button
                            v-for="product in filteredSupplierOrderProducts"
                            :key="product.id"
                            type="button"
                            class="rcv-supplier-catalog-item"
                            :class="{ selected: supplierOrderHasProduct(product.id) }"
                            @click="toggleSupplierOrderProduct(product)"
                        >
                            <span><strong>{{ product.name }}</strong><small class="mono">{{ product.sku }}</small></span>
                            <i class="fa-solid" :class="supplierOrderHasProduct(product.id) ? 'fa-circle-check' : 'fa-circle-plus'"></i>
                        </button>
                        <p v-if="!filteredSupplierOrderProducts.length" class="rcv-supplier-catalog-empty">No matching supplier products.</p>
                    </div>
                    <div v-else class="rcv-supplier-stock-picker-grid">
                        <button
                            v-for="batch in filteredSupplierOrderBatches"
                            :key="batch.id"
                            type="button"
                            class="rcv-supplier-catalog-item"
                            :class="{ selected: supplierOrderHasBatch(batch.id) }"
                            @click="toggleSupplierOrderBatch(batch)"
                        >
                            <span><strong>{{ batch.id }}</strong><small>{{ batch.productCount }} products · {{ batch.availableQuantity }} on hand</small></span>
                            <i class="fa-solid" :class="supplierOrderHasBatch(batch.id) ? 'fa-circle-check' : 'fa-circle-plus'"></i>
                        </button>
                        <p v-if="!filteredSupplierOrderBatches.length" class="rcv-supplier-catalog-empty">No matching supplier batches.</p>
                    </div>
                </div>
                <footer class="form-actions rcv-supplier-stock-picker-actions">
                    <button class="button secondary" type="button" @click="supplierOrderTarget === 'batch' ? openSupplierOrderOtherBatch() : openSupplierOrderOtherProduct()"><i class="fa-solid fa-plus"></i>Other</button>
                    <span></span>
                    <button class="button primary" type="button" @click="closeSupplierStockPicker">Done <i class="fa-solid fa-check"></i></button>
                </footer>
            </section>
        </div>

        <ProductRegistrationModal
            v-if="registerProductOpen"
            :edit-product="registerProductEditProduct"
            :initial-supplier-id="form.supplierId"
            @close="closeRegisterProduct"
            @registered="handleRegisteredProduct"
        />

        <div v-if="batchPickerOpen" class="modal-backdrop" @click.self="closeBatchPicker">
            <section class="form-modal rcv-product-picker-modal" role="dialog" aria-modal="true" aria-label="Choose batch">
                <header class="modal-header">
                    <div><span class="eyebrow">SELECT BATCH</span><h2>Choose batch</h2></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closeBatchPicker"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="rcv-product-picker-body">
                    <label class="rcv-product-picker-search"><span>Search</span><input v-model.trim="batchPickerSearch" type="text" placeholder="Search batch or product" /></label>
                    <div class="rcv-product-picker-list">
                        <button v-for="batch in filteredBatchDefinitions" :key="batch.id" type="button" class="rcv-product-picker-item" :class="{ selected: supplierOrderHasBatch(batch.id) }" @click="selectExistingBatch(batch)">
                            <strong>{{ batch.id }}</strong>
                            <small>{{ batch.productCount }} products · {{ batch.availableQuantity }} parts</small>
                        </button>
                    </div>
                </div>
                <footer class="form-actions rcv-product-picker-actions">
                    <button class="button secondary" type="button" @click="closeBatchPicker">Cancel</button>
                    <span></span>
                    <button class="button secondary" type="button" @click="openInlineBatchFromPicker"><i class="fa-solid fa-plus"></i>Other</button>
                    <button class="button primary" type="button" @click="closeBatchPicker">Done</button>
                </footer>
            </section>
        </div>

        <div v-if="batchSelectionEdit" class="modal-backdrop" @click.self="closeBatchSelectionEdit">
            <section class="form-modal rcv-batch-selection-edit-modal" role="dialog" aria-modal="true" :aria-label="`Edit ${batchSelectionEdit.batchId}`">
                <header class="modal-header">
                    <div><span class="eyebrow">BATCH STOCK IN</span><h2>{{ batchSelectionEdit.batchId }}</h2></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closeBatchSelectionEdit"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="rcv-batch-selection-edit-body">
                    <article v-for="item in batchSelectionEdit.items" :key="`edit-${item.key}`" class="rcv-supplier-quantity-row is-batch-line">
                        <div><strong>{{ store.findProduct(item.productId)?.name || 'Product' }}</strong><small class="mono">{{ store.findProduct(item.productId)?.sku || '—' }}</small></div>
                        <label><span>Per batch</span><output>{{ item.quantity }} {{ store.findProduct(item.productId)?.unit || '' }}</output></label>
                    </article>
                    <div class="rcv-supplier-batch-footer">
                        <strong>{{ batchSelectionEdit.batchId }}</strong>
                        <label><span>Quantity *</span><input v-model.number="batchSelectionEdit.batchCount" type="number" min="1" step="1" required /></label>
                    </div>
                </div>
                <footer class="form-actions"><button class="button primary" type="button" @click="closeBatchSelectionEdit">Done</button></footer>
            </section>
        </div>

        <div v-if="supplierPickerOpen" class="modal-backdrop" @click.self="closeSupplierPicker">
            <section class="form-modal rcv-product-picker-modal" role="dialog" aria-modal="true" aria-label="Choose supplier">
                <header class="modal-header">
                    <div><span class="eyebrow">SELECT SUPPLIER</span><h2>Choose supplier</h2></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closeSupplierPicker"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="rcv-product-picker-body">
                    <label class="rcv-product-picker-search"><span>Search</span><input v-model.trim="supplierPickerSearch" type="text" placeholder="Search supplier or code" /></label>
                    <div class="rcv-product-picker-list">
                        <button v-for="supplier in filteredSuppliers" :key="supplier.id" type="button" class="rcv-product-picker-item" :class="{ selected: form.supplierId === supplier.id }" @click="selectSupplier(supplier)">
                            <strong>{{ supplier.name }}</strong>
                            <small>{{ supplier.code }}</small>
                        </button>
                    </div>
                </div>
                <footer class="form-actions rcv-product-picker-actions">
                    <button class="button secondary" type="button" @click="closeSupplierPicker">Cancel</button>
                    <span></span>
                    <button class="button primary" type="button" @click="openOtherSupplier"><i class="fa-solid fa-plus"></i>Other</button>
                </footer>
            </section>
        </div>


        <div v-if="cartEditModal === 'supplier'" class="modal-backdrop" @click.self="closeCartEdit">
            <section class="form-modal rcv-cart-edit-modal" role="dialog" aria-modal="true" aria-label="Edit supplier">
                <header class="modal-header">
                    <div><span class="eyebrow">EDIT SUPPLIER</span><h2>Supplier details</h2></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closeCartEdit"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="quick-add-body">
                    <div class="form-grid quick-add-grid">
                        <label class="full"><span>Supplier *</span><ScrollableSelect v-model="form.supplierId" @change="handleCartSupplierSelection"><option value="" disabled>Select supplier</option><option v-for="supplier in activeSuppliers" :key="supplier.id" :value="supplier.id">{{ supplier.code }} — {{ supplier.name }}</option></ScrollableSelect></label>
                        <label class="full"><span>Supplier address *</span><textarea v-model.trim="form.supplierAddress" rows="4" placeholder="Enter supplier address"></textarea></label>
                    </div>
                </div>
                <footer class="form-actions rcv-supplier-stock-picker-actions">
                    <button class="button secondary" type="button" @click="closeCartEdit">Cancel</button><span></span>
                    <button class="button primary" type="button" @click="saveCartSupplierEdit"><i class="fa-solid fa-check"></i>Save</button>
                </footer>
            </section>
        </div>

        <div v-if="cartEditModal === 'warehouse'" class="modal-backdrop" @click.self="closeCartEdit">
            <section class="form-modal rcv-cart-edit-modal" role="dialog" aria-modal="true" aria-label="Edit destination">
                <header class="modal-header">
                    <div><span class="eyebrow">EDIT DESTINATION</span><h2>Warehouse details</h2></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closeCartEdit"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="quick-add-body">
                    <div class="form-grid two-column quick-add-grid">
                        <label><span>Warehouse *</span><ScrollableSelect v-model="form.warehouseId"><option value="" disabled>Select warehouse</option><option v-for="warehouse in activeWarehouses" :key="warehouse.id" :value="warehouse.id">{{ warehouse.name }}</option></ScrollableSelect></label>
                        <label><span>Location *</span><ScrollableSelect v-model="form.locationId" :disabled="!form.warehouseId"><option value="" disabled>Select location</option><option v-for="entry in locationPickerEntries" :key="entry.id" :value="entry.id" :disabled="entry.disabled">{{ entry.name }}{{ entry.disabled ? ` — ${entry.meta}` : (entry.meta !== 'Available' ? ` — ${entry.meta}` : '') }}</option></ScrollableSelect></label>
                        <label><span>Receiving date *</span><input v-model="form.receivingDate" type="date" /></label>
                        <label class="rcv-numbered-field"><span>Invoice</span><div><input v-model.trim="form.invoiceNumber" class="mono" placeholder="Auto generated" /><button type="button" title="Next sequential invoice number" aria-label="Next sequential invoice number" @click="regenerateDocumentNumber('invoiceNumber', 'INV', 'sequence')"><i class="fa-solid fa-arrow-down-short-wide"></i></button><button type="button" title="Generate random invoice number" aria-label="Generate random invoice number" @click="regenerateDocumentNumber('invoiceNumber', 'INV', 'random')"><i class="fa-solid fa-rotate"></i></button></div></label>
                        <label class="full rcv-numbered-field"><span>Purchase order</span><div><input v-model.trim="form.purchaseOrderNumber" class="mono" placeholder="Auto generated" /><button type="button" title="Next sequential purchase order number" aria-label="Next sequential purchase order number" @click="regenerateDocumentNumber('purchaseOrderNumber', 'PO', 'sequence')"><i class="fa-solid fa-arrow-down-short-wide"></i></button><button type="button" title="Generate random purchase order number" aria-label="Generate random purchase order number" @click="regenerateDocumentNumber('purchaseOrderNumber', 'PO', 'random')"><i class="fa-solid fa-rotate"></i></button></div></label>
                    </div>
                </div>
                <footer class="form-actions rcv-supplier-stock-picker-actions">
                    <button class="button secondary" type="button" @click="closeCartEdit">Cancel</button><span></span>
                    <button class="button primary" type="button" @click="saveCartWarehouseEdit"><i class="fa-solid fa-check"></i>Save</button>
                </footer>
            </section>
        </div>

        <div v-if="cartEditModal === 'stock'" class="modal-backdrop" @click.self="closeCartEdit">
            <section class="form-modal rcv-cart-stock-edit-modal" role="dialog" aria-modal="true" aria-label="Edit stock">
                <header class="modal-header">
                    <div><span class="eyebrow">EDIT STOCK</span><h2>{{ supplierOrderTarget === 'batch' ? 'Batch stock' : 'Product stock' }}</h2></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closeCartEdit"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="rcv-cart-stock-edit-body">
                    <nav class="rcv-type-toggle rcv-supplier-stock-toggle" aria-label="Supplier stock type">
                        <button type="button" :class="{ active: supplierOrderTarget === 'product' }" @click="selectSupplierOrderTarget('product')"><i class="fa-solid fa-box"></i>Products</button>
                        <button type="button" :class="{ active: supplierOrderTarget === 'batch' }" @click="selectSupplierOrderTarget('batch')"><i class="fa-solid fa-layer-group"></i>Batches</button>
                    </nav>
                    <div v-if="supplierOrderTarget === 'product' && batchItems.length" class="rcv-supplier-quantity-panel rcv-supplier-selected-list">
                        <article v-for="(item, index) in batchItems" :key="`modal-${item.key}`" class="rcv-supplier-quantity-row" @click="openSupplierStockPicker">
                            <button type="button" class="rcv-supplier-line-card" @click.stop="openSupplierStockPicker"><span><strong>{{ store.findProduct(item.productId)?.name || 'Product' }}</strong><small class="mono">{{ store.findProduct(item.productId)?.sku || '—' }}</small></span></button>
                            <label @click.stop><span>Quantity *</span><input v-model.number="item.quantity" type="number" min="0.01" step="0.01" /></label>
                            <button type="button" class="rcv-supplier-remove-line" aria-label="Remove product" @click.stop="removeSupplierOrderProduct(index)"><i class="fa-solid fa-xmark"></i></button>
                        </article>
                        <button type="button" class="rcv-supplier-add-line" @click="openSupplierStockPicker"><i class="fa-solid fa-plus"></i>Add product</button>
                    </div>
                    <div v-else-if="supplierOrderTarget === 'batch' && supplierBatchSelections.length" class="rcv-supplier-batch-selection-list">
                        <article v-for="selection in supplierBatchSelections" :key="`modal-${selection.batchId}`" class="rcv-supplier-batch-selection-card">
                            <header>
                                <button type="button" class="rcv-supplier-batch-name" @click="openSupplierStockPicker"><span><strong>{{ selection.batchId }}</strong><small>{{ selection.items.length }} product{{ selection.items.length === 1 ? '' : 's' }}</small></span></button>
                                <button type="button" class="rcv-supplier-remove-batch" aria-label="Remove batch" @click.stop="removeSupplierOrderBatch(selection.batchId)"><i class="fa-solid fa-xmark"></i></button>
                            </header>
                            <label class="rcv-batch-count-field"><span>Batch quantity *</span><input v-model.number="selection.batchCount" type="number" min="1" step="1" required /></label>
                            <div class="rcv-supplier-batch-lines">
                                <article v-for="item in selection.items" :key="`modal-${item.key}`" class="rcv-supplier-quantity-row is-batch-line">
                                    <div><strong>{{ store.findProduct(item.productId)?.name || 'Product' }}</strong><small class="mono">{{ store.findProduct(item.productId)?.sku || '—' }}</small></div>
                                    <label @click.stop><span>Per batch</span><output>{{ item.quantity }} {{ store.findProduct(item.productId)?.unit || '' }}</output></label>
                                </article>
                            </div>
                        </article>
                        <button type="button" class="rcv-supplier-add-line" @click="openSupplierStockPicker"><i class="fa-solid fa-plus"></i>Add batch</button>
                    </div>
                    <button v-else type="button" class="rcv-supplier-empty-picker" @click="openSupplierStockPicker"><span><i class="fa-solid" :class="supplierOrderTarget === 'batch' ? 'fa-layer-group' : 'fa-boxes-stacked'"></i></span><strong>{{ supplierOrderTarget === 'batch' ? 'Choose batches' : 'Choose products' }}</strong></button>
                    <div class="rcv-fields two rcv-supplier-stock-meta">
                        <label><span>Manufactured</span><input v-model="form.manufacturingDate" type="date" /></label>
                        <label><span>Expiry</span><input v-model="form.expiryDate" type="date" :required="batchNeedsExpiry" /></label>
                        <label class="full"><span>Remark</span><textarea v-model.trim="form.remark" rows="2" placeholder="Optional"></textarea></label>
                    </div>
                </div>
                <footer class="form-actions rcv-supplier-stock-picker-actions">
                    <button class="button secondary" type="button" @click="closeCartEdit">Cancel</button><span></span>
                    <button class="button primary" type="button" @click="saveCartStockEdit"><i class="fa-solid fa-check"></i>Save</button>
                </footer>
            </section>
        </div>

        <ScannerModal v-if="scannerOpen" @close="scannerOpen = false" @scanned="handleScan" />
        <SupplierReceiptModal v-if="receiptDocumentOpen && receiptDocument" :record="receiptDocument" :supplier="selectedSupplier" @close="handleReceiptDocumentClose" />

        <div v-if="submittedRequest && !submittedRequestDocumentOpen" class="modal-backdrop rcv-request-document-backdrop">
            <section class="form-modal rcv-request-document" role="dialog" aria-modal="true" aria-label="Supplier stock in request">
                <header class="modal-header">
                    <div><span class="eyebrow">SUPPLIER STOCK IN REQUEST</span><h2>{{ submittedRequest.requestNumber || submittedRequest.id }}</h2></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="finishSubmittedRequest"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="rcv-request-document-body">
                    <section class="rcv-request-document-route">
                        <article><small>SUPPLIER</small><strong>{{ submittedRequest.supplierName }}</strong><p>{{ submittedRequest.sourceAddress || 'Address not recorded' }}</p></article>
                        <span><i class="fa-solid fa-arrow-right"></i></span>
                        <article><small>RECEIVE AT</small><strong>{{ [submittedRequest.destinationWarehouseName, submittedRequest.destinationLocationName].filter(Boolean).join(' · ') }}</strong><p>{{ submittedRequest.destinationAddress || 'Address not recorded' }}</p></article>
                    </section>
                    <section class="rcv-request-document-stock">
                        <header><strong><i class="fa-solid fa-boxes-stacked"></i>{{ submittedRequestRows.length }}</strong><b>Pending</b></header>
                        <div>
                            <article v-for="row in submittedRequestRows" :key="row.key"><span><strong>{{ row.name }}</strong><small class="mono">{{ row.code }}</small></span><b>{{ row.quantity }} {{ row.unit }}</b></article>
                        </div>
                    </section>
                </div>
                <footer class="rcv-request-document-actions">
                    <button class="button secondary" type="button" @click="finishSubmittedRequest"><i class="fa-solid fa-arrow-left"></i>Back</button>
                    <button class="button primary" type="button" @click="printSubmittedRequest"><i class="fa-solid fa-print"></i>Print</button>
                </footer>
            </section>
        </div>
        <StockInRequestModal v-if="submittedRequestDocumentOpen && submittedRequest" :request="submittedRequest" @close="submittedRequestDocumentOpen = false" />

        <div v-if="supplierCompleteOpen && receipt" class="modal-backdrop">
            <section class="form-modal rcv-supplier-complete-modal" role="dialog" aria-modal="true" aria-label="Supplier stock in complete">
                <div class="rcv-supplier-complete-body">
                    <span class="rcv-supplier-complete-check"><i class="fa-solid fa-check"></i></span>
                    <small>STOCK IN COMPLETE</small>
                    <h2>{{ receipt.productCount }} product{{ receipt.productCount === 1 ? '' : 's' }} received</h2>
                    
                    <div class="rcv-supplier-complete-summary">
                        <span><small>{{ supplierOrderTarget === 'batch' ? 'Batches' : 'Products' }}</small><strong>{{ supplierOrderSelectedCount }}</strong></span>
                        <span><small>Total quantity</small><strong>{{ receipt.totalQuantity }}</strong></span>
                    </div>
                </div>
                <footer class="rcv-supplier-complete-actions">
                    <button class="button secondary" type="button" @click="finishSupplierOrder"><i class="fa-solid fa-arrow-left"></i>Back</button>
                    <button class="button secondary" type="button" @click="openSupplierLabels"><i class="fa-solid fa-tags"></i>Labels</button>
                    <button class="button primary" type="button" @click="openSupplierInvoiceFromComplete"><i class="fa-solid fa-file-invoice"></i>Invoice</button>
                </footer>
            </section>
        </div>

        <div v-if="showReceiveChooser" class="modal-backdrop" @click.self="cancelReceiveChoice">
            <section class="new-item-picker rcv-stock-in-type-picker" role="dialog" aria-modal="true" aria-label="Choose stock-in target">
                <header class="modal-header">
                    <div class="rcv-stock-in-picker-heading">
                        <button v-if="stockInChooserStage === 'target'" class="icon-button" type="button" aria-label="Back" @click="stockInChooserStage = 'source'">
                            <i class="fa-solid fa-arrow-left"></i>
                        </button>
                        <div><span class="eyebrow">STOCK IN</span><h2>Choose stock in type</h2></div>
                    </div>
                    <button class="icon-button" type="button" aria-label="Close" @click="cancelReceiveChoice"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div v-if="stockInChooserStage === 'source'" class="new-item-picker__grid">
                    <button type="button" @click="chooseStockInPath('internal')"><span><i class="fa-solid fa-warehouse"></i></span><div><strong>Internal Stock In</strong></div><i class="fa-solid fa-chevron-right"></i></button>
                    <button type="button" @click="chooseStockInPath('supplier')"><span><i class="fa-solid fa-truck"></i></span><div><strong>Supplier Stock In</strong></div><i class="fa-solid fa-chevron-right"></i></button>
                </div>
                <div v-else class="new-item-picker__grid">
                    <button type="button" @click="chooseStockInPath('product')"><span><i class="fa-solid fa-box"></i></span><div><strong>Product Stock In</strong></div><i class="fa-solid fa-chevron-right"></i></button>
                    <button type="button" @click="chooseStockInPath('batch')"><span><i class="fa-solid fa-layer-group"></i></span><div><strong>Batch Stock In</strong></div><i class="fa-solid fa-chevron-right"></i></button>
                </div>
            </section>
        </div>

        <div v-if="batchRegisterOpen" class="modal-backdrop" @click.self="closeInlineBatchRegister">
            <section class="form-modal rcv-inline-batch-modal" role="dialog" aria-modal="true" aria-label="Register batch">
                <header class="modal-header">
                    <div><span class="eyebrow">REGISTER BATCH</span><h2>Choose batch products</h2></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closeInlineBatchRegister"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="rcv-inline-batch-list">
                    <button
                        v-for="product in batchRegistrationProducts"
                        :key="product.id"
                        type="button"
                        :class="{ selected: batchRegisterProductIds.includes(product.id) }"
                        @click="toggleInlineBatchProduct(product.id)"
                    >
                        <span class="rcv-inline-batch-symbol">{{ String(product.name || '').slice(0, 2).toUpperCase() }}</span>
                        <span><strong>{{ product.name }}</strong><small class="mono">{{ product.sku }}</small></span>
                        <i class="fa-solid" :class="batchRegisterProductIds.includes(product.id) ? 'fa-circle-check' : 'fa-circle-plus'"></i>
                    </button>
                </div>
                <footer class="form-actions">
                    <button class="button secondary" type="button" @click="closeInlineBatchRegister">Cancel</button>
                    <span></span>
                    <button class="button primary" type="button" :disabled="!batchRegisterProductIds.length" @click="saveInlineBatch"><i class="fa-solid fa-check"></i>Register Batch</button>
                </footer>
            </section>
        </div>

        <div v-if="supplierFormOpen" class="modal-backdrop" @click.self="closeQuickSupplier">
            <section class="form-modal quick-add-modal">
                <header class="modal-header">
                    <div>
                        <span class="eyebrow">OTHER SUPPLIER</span>
                        <h2>Add Supplier</h2>
                    </div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closeQuickSupplier"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <form class="quick-add-body" @submit.prevent="saveQuickSupplier">
                    <div class="form-grid two-column quick-add-grid">
                        <label class="full"><span>Supplier name *</span><input v-model.trim="quickSupplier.name" type="text" placeholder="e.g. New supplier" /></label>
                        <label><span>Contact person</span><input v-model.trim="quickSupplier.contactName" type="text" placeholder="Optional" /></label>
                        <label><span>Phone</span><input v-model.trim="quickSupplier.phone" type="text" placeholder="Optional" /></label>
                        <label class="full"><span>Address *</span><textarea v-model.trim="quickSupplier.address" rows="3" placeholder="Supplier address"></textarea></label>
                        <label class="full toggle-label quick-save-toggle">
                            <input v-model="quickSupplier.saveToDirectory" type="checkbox" />
                            <span><strong>Save this supplier</strong></span>
                        </label>
                    </div>
                    <p v-if="quickSupplierError" class="rcv-error quick-add-error"><i class="fa-solid fa-circle-exclamation"></i>{{ quickSupplierError }}</p>
                    <footer class="form-actions">
                        <button class="button secondary" type="button" @click="closeQuickSupplier">Cancel</button>
                        <span></span>
                        <button class="button primary" type="submit"><i class="fa-solid fa-check"></i>Use Supplier</button>
                    </footer>
                </form>
            </section>
        </div>

        <div v-if="productFormOpen" class="modal-backdrop" @click.self="closeQuickProduct">
            <section class="form-modal quick-add-modal">
                <header class="modal-header">
                    <div>
                        <span class="eyebrow">OTHER PRODUCT</span>
                        <h2>Add Product</h2>
                    </div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closeQuickProduct"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <form class="quick-add-body" @submit.prevent="saveQuickProduct">
                    <div class="form-grid two-column quick-add-grid">
                        <label class="full"><span>Product name *</span><input v-model.trim="quickProduct.name" type="text" placeholder="e.g. New product" /></label>
                        <label><span>Category *</span><ScrollableSelect v-model="quickProduct.category"><option v-for="category in store.state.productCategories" :key="category" :value="category">{{ category }}</option></ScrollableSelect></label>
                        <label><span>Unit *</span><input v-model.trim="quickProduct.unit" type="text" placeholder="pcs, kg, box" /></label>
                        <label><span>Tracking mode</span><ScrollableSelect v-model="quickProduct.trackingMode"><option value="none">Quantity only</option><option value="batch">Batch / lot</option><option value="unit">Unit level</option></ScrollableSelect></label>
                        <label class="toggle-label"><input v-model="quickProduct.expiryTracking" type="checkbox" /><span><strong>Track expiry</strong></span></label>
                        <label class="toggle-label"><input v-model="quickProduct.saveToDirectory" type="checkbox" /><span><strong>Save this product</strong></span></label>
                    </div>
                    <p v-if="quickProductError" class="rcv-error quick-add-error"><i class="fa-solid fa-circle-exclamation"></i>{{ quickProductError }}</p>
                    <footer class="form-actions">
                        <button class="button secondary" type="button" @click="closeQuickProduct">Cancel</button>
                        <span></span>
                        <button class="button primary" type="submit"><i class="fa-solid fa-check"></i>Use Product</button>
                    </footer>
                </form>
            </section>
        </div>
    </main>
</template>

<script>
import ScannerModal from '@/components/common/ScannerModal.vue'
import SupplierReceiptModal from '@/components/supplier/SupplierReceiptModal.vue'
import StockInRequestModal from '@/components/stock/StockInRequestModal.vue'
import ProductRegistrationModal from '@/components/product/ProductRegistrationModal.vue'
import { inventoryStore } from '@/services/inventoryStore'
import { PERMISSIONS } from '@/services/permissions'
import { productOptionLabel } from '@/utils/productDisplay'

const today = () => new Date().toISOString().slice(0, 10)

export default {
    name: 'ReceiveStockView',
    components: { ScannerModal, SupplierReceiptModal, ProductRegistrationModal, StockInRequestModal },
    data() {
        return {
            store: inventoryStore,
            steps: [
                { id: 1, label: 'Delivery' },
                { id: 2, label: 'Stock' },
                { id: 3, label: 'Location' },
            ],
            step: 1,
            scannerOpen: false,
            productPickerOpen: false,
            productPickerIndex: 0,
            productPickerSearch: '',
            registerProductOpen: false,
            scanTargetIndex: 0,
            receipt: null,
            receiptWasBatch: false,
            receiptDocumentOpen: false,
            stockInType: this.$route.query.supplier || this.$route.query.type === 'supplier' || this.$route.query.supplierFlow === '1' ? 'supplier' : 'standard',
            supplierOrderTarget: 'product',
            supplierStockPickerOpen: false,
            supplierStockPickerSearch: '',
            supplierBatchSelections: [],
            batchSelectionEditId: '',
            supplierCompleteOpen: false,
            submittedRequest: null,
            submittedRequestDocumentOpen: false,
            cartEditModal: '',
            routeRefreshKey: this.$route.query.refresh || '',
            registerProductPurpose: '',
            registerProductEditId: '',
            error: '',
            proofPhotoName: 'No file chosen',
            documentNumberMode: 'sequence',
            showReceiveChooser: this.$route.query.choose === '1',
            stockInChooserStage: this.$route.query.stockInStage === 'target' ? 'target' : 'source',
            selectedExistingBatchId: '',
            batchCount: 1,
            batchPickerOpen: false,
            batchPickerSearch: '',
            supplierPickerOpen: false,
            supplierPickerSearch: '',
            batchRegisterOpen: false,
            batchRegisterProductIds: [],
            batchItems: [
                { key: `batch-item-${Date.now()}`, productId: '', quantity: '' },
            ],
            form: {
                supplierId: '',
                supplierAddress: '',
                receivingDate: today(),
                invoiceNumber: '',
                purchaseOrderNumber: '',
                photo: '',
                productId: '',
                quantity: '',
                batch: '',
                warehouseId: 'wh-main',
                locationId: '',
                manufacturingDate: '',
                expiryDate: '',
                remark: '',
            },
            supplierFormOpen: false,
            productFormOpen: false,
            quickProductTargetIndex: 0,
            quickSupplierError: '',
            quickProductError: '',
            quickSupplier: {
                name: '',
                contactName: '',
                phone: '',
                address: '',
                saveToDirectory: true,
            },
            quickProduct: {
                name: '',
                category: 'General',
                unit: 'pcs',
                trackingMode: 'none',
                expiryTracking: false,
                saveToDirectory: true,
            },
        }
    },
    computed: {
        supplierOrderFlow() { return this.$route.query.supplierFlow === '1' },
        pageTitle() {
            if (this.supplierOrderFlow) return 'Supplier Stock In'
            return this.isBatchRegistration ? 'Register Batch' : (this.isBatchStockIn ? 'Batch Stock In' : 'Internal Stock In')
        },
        progressSteps() {
            return this.supplierOrderFlow
                ? [{ id: 1, label: 'Supplier' }, { id: 2, label: 'Warehouse' }, { id: 3, label: 'Stock' }, { id: 4, label: 'Cart' }]
                : this.steps
        },
        supplierOrderProducts() {
            if (!this.selectedSupplier) return []
            return this.activeProducts.filter((product) => product.supplierId === this.selectedSupplier.id || product.supplier === this.selectedSupplier.name)
        },
        supplierOrderBatches() {
            if (!this.selectedSupplier) return []
            const productIds = new Set(this.supplierOrderProducts.map((product) => product.id))
            return this.store.batchGroups({ availableOnly: false }).filter((batch) =>
                batch.supplierId === this.selectedSupplier.id || (!batch.supplierId && (batch.items || []).some((item) => productIds.has(item.productId))),
            )
        },
        submittedRequestRows() {
            return (this.submittedRequest?.lines || []).map((line, index) => ({
                key: `${line.batchId || 'product'}-${line.productId || index}-${index}`,
                name: line.productName || 'Product',
                code: [line.sku, line.batchId ? `Batch ${line.batchId}` : ''].filter(Boolean).join(' · '),
                quantity: Number(line.requestedQuantity ?? line.quantity) || 0,
                unit: line.unit || '',
            }))
        },
        filteredSupplierOrderProducts() {
            const keyword = this.supplierStockPickerSearch.trim().toLowerCase()
            if (!keyword) return this.supplierOrderProducts
            return this.supplierOrderProducts.filter((product) =>
                [product.name, product.sku, product.bar]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(keyword)),
            )
        },
        filteredSupplierOrderBatches() {
            const keyword = this.supplierStockPickerSearch.trim().toLowerCase()
            if (!keyword) return this.supplierOrderBatches
            return this.supplierOrderBatches.filter((batch) =>
                [batch.id, batch.name, ...(batch.items || []).flatMap((item) => [item.productName, item.sku])]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(keyword)),
            )
        },
        supplierOrderSelectedCount() {
            return this.supplierOrderTarget === 'batch'
                ? this.supplierBatchSelections.length
                : this.batchItems.length
        },
        batchSelectionEdit() {
            return this.supplierBatchSelections.find((selection) => selection.batchId === this.batchSelectionEditId) || null
        },
        registerProductEditProduct() {
            return this.registerProductEditId ? this.store.findProduct(this.registerProductEditId) : null
        },
        batchRegistrationProducts() { return this.supplierOrderFlow ? this.supplierOrderProducts : this.activeProducts },
        receiptBeforeTotal() {
            return (this.receipt?.results || []).reduce(
                (sum, result) => sum + Number(result.before || 0),
                0,
            )
        },
        receiptAfterTotal() {
            return (this.receipt?.results || []).reduce(
                (sum, result) => sum + Number(result.after || 0),
                0,
            )
        },
        activeSuppliers() {
            return this.store.state.suppliers.filter((supplier) => supplier.status === 'active')
        },
        filteredSuppliers() {
            const keyword = this.supplierPickerSearch.trim().toLowerCase()
            if (!keyword) return this.activeSuppliers
            return this.activeSuppliers.filter((supplier) =>
                [supplier.name, supplier.code, supplier.contactName]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(keyword)),
            )
        },
        activeProducts() {
            return this.store.state.products.filter((product) => product.active)
        },
        activeWarehouses() {
            return this.store.state.warehouses.filter((warehouse) => warehouse.active)
        },
        filteredProductOptions() {
            const keyword = this.productPickerSearch.trim().toLowerCase()
            return this.productsForRow(this.productPickerIndex).filter((product) => {
                if (!keyword) return true
                return [product.name, product.sku, product.bar]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(keyword))
            })
        },
        selectedSupplier() {
            return this.store.findSupplier(this.form.supplierId)
        },
        isSupplierStockIn() {
            return this.stockInType === 'supplier'
        },
        selectedProduct() {
            return this.store.findProduct(this.selectedBatchItems[0]?.productId)
        },
        selectedBatchItems() {
            if (this.isBatchStockIn) {
                return this.supplierBatchSelections
                    .flatMap((selection) => selection.items || [])
                    .filter((item) => this.store.findProduct(item.productId))
            }
            if (this.supplierOrderFlow && this.supplierOrderTarget === 'batch') {
                return this.supplierBatchSelections
                    .flatMap((selection) => selection.items || [])
                    .filter((item) => this.store.findProduct(item.productId))
            }
            return this.batchItems.filter((item) => this.store.findProduct(item.productId))
        },
        batchNeedsExpiry() {
            return this.selectedBatchItems.some((item) => this.store.findProduct(item.productId)?.expiryTracking)
        },
        selectedWarehouse() {
            return this.store.findWarehouse(this.form.warehouseId)
        },
        locationOptions() {
            return (this.selectedWarehouse?.locations || []).filter(
                (location) => location.active && location.status !== 'unavailable',
            )
        },
        selectedLocation() {
            return this.store.findLocation(this.form.warehouseId, this.form.locationId)
        },
        locationPickerEntries() {
            return this.locationOptions.map((location) => {
                const metrics = this.store.locationMetrics(this.form.warehouseId, location.id)
                const isFull = Boolean(metrics?.capacityConfigured) && Number(metrics?.availableCapacity || 0) <= 0
                const disabled = !location.active || location.status === 'unavailable' || isFull
                const meta = disabled
                    ? (isFull ? 'Full' : 'Unavailable')
                    : (metrics?.capacityConfigured ? `${Number(metrics.availableCapacity || 0)} ${location.capacityUnit || ''} left` : 'Available')
                return { id: location.id, name: location.name, disabled, meta }
            })
        },
        sourceProduct() {
            return this.store.findProduct(this.$route.query.product)
        },
        canReturnToSource() {
            return ['dashboard', 'scan'].includes(String(this.$route.query.from || '')) || this.$route.query.source === 'suppliers'
        },
        scanReturnRoute() {
            const query = { code: String(this.$route.query.code || this.sourceProduct?.bar || this.sourceProduct?.sku || '') }
            if (this.$route.query.scanFrom) query.from = String(this.$route.query.scanFrom)
            return { name: 'scan', query }
        },
        cancelRoute() {
            if (this.$route.query.from === 'scan') return this.scanReturnRoute
            if (this.$route.query.source === 'suppliers') return { name: 'suppliers' }
            return { name: this.sourceProduct ? 'products' : 'dashboard' }
        },
        completionRoute() {
            if (this.$route.query.from === 'scan') return this.scanReturnRoute
            if (this.$route.query.source === 'suppliers') return { name: 'suppliers' }
            return { name: 'products' }
        },
        labelReturnQuery() {
            if (this.$route.query.from !== 'scan') return {}
            const query = {
                from: 'scan',
                code: String(this.$route.query.code || this.sourceProduct?.bar || this.sourceProduct?.sku || ''),
            }
            if (this.$route.query.scanFrom) query.scanFrom = String(this.$route.query.scanFrom)
            return query
        },
        isBatchRegistration() {
            return this.$route.query.registerBatch === '1'
        },
        isBatchStockIn() {
            return this.$route.query.stockTarget === 'batch'
        },
        availableBatchDefinitions() {
            return this.store.batchGroups({ availableOnly: false }).filter((batch) => batch.productCount > 0)
        },
        filteredBatchDefinitions() {
            const keyword = this.batchPickerSearch.trim().toLowerCase()
            if (!keyword) return this.availableBatchDefinitions
            return this.availableBatchDefinitions.filter((batch) =>
                [batch.id, batch.name, ...(batch.items || []).flatMap((item) => [item.productName, item.sku])]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(keyword)),
            )
        },
        selectedExistingBatch() {
            return this.selectedExistingBatchId ? this.store.findBatch(this.selectedExistingBatchId) : null
        },
        currentStock() {
            if (this.isBatchStockIn) return this.supplierBatchSelections.reduce((sum, selection) => sum + Number(this.store.findBatch(selection.batchId)?.availableBatchCount || 0), 0)
            return this.selectedBatchItems.reduce((sum, item) => sum + this.store.productStock(item.productId), 0)
        },
        incoming() {
            if (this.isBatchStockIn) return this.supplierBatchSelections.reduce((sum, selection) => sum + (Number(selection.batchCount) || 0), 0)
            return this.selectedBatchItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
        },
        nextBatchPreview() {
            if (this.isBatchRegistration) return this.store.previewNextBatchNumber()
            if (this.isBatchStockIn) return this.supplierBatchSelections.map((selection) => selection.batchId).join(', ')
            return this.store.previewNextReceiptBatchNumber(this.selectedBatchItems[0]?.productId || '')
        },
        receiptDocument() {
            if (!this.receipt) return null
            const receipts = this.receipt.receipts?.length ? this.receipt.receipts : [this.receipt.receipt].filter(Boolean)
            const first = receipts[0]
            if (!first) return null
            return {
                ...first,
                receiptIds: receipts.map((item) => item.receiptNumber || item.id),
                lines: receipts.flatMap((item) => item.lines || []),
                batchNumber: this.receipt.batchId,
                companyName: 'Inventory Workspace',
                companyDetails: first.warehouseName || 'Main Warehouse',
            }
        },
        stepTitle() {
            if (this.supplierOrderFlow) return ['Choose supplier', 'Choose warehouse', 'Choose stock', 'Review cart'][this.step - 1]
            return [this.isBatchRegistration ? 'Batch details' : 'Delivery details', this.isBatchRegistration ? 'Choose batch products' : (this.isBatchStockIn ? 'Batch quantities' : 'Product & quantity'), 'Location & dates'][this.step - 1]
        },
        stepIcon() {
            if (this.supplierOrderFlow) return ['fa-truck', 'fa-warehouse', 'fa-boxes-stacked', 'fa-list-check'][this.step - 1]
            return ['fa-truck-ramp-box', 'fa-boxes-stacked', 'fa-location-dot'][this.step - 1]
        },
    },
    watch: {
        stockInType(value) {
            if (value === 'standard') {
                this.form.supplierId = ''
                this.form.supplierAddress = ''
                this.form.invoiceNumber = ''
                this.form.purchaseOrderNumber = ''
                return
            }
            if (!this.form.supplierId && this.selectedProduct?.supplierId) {
                this.form.supplierId = this.selectedProduct.supplierId
            }
        },
        'form.supplierId'(value) {
            const supplier = this.store.findSupplier(value)
            if (supplier) this.form.supplierAddress = supplier.address || ''
        },
        'form.warehouseId'() {
            if (!this.locationOptions.some((location) => location.id === this.form.locationId)) {
                this.form.locationId = ''
            }
        },
        '$route.query.refresh'(value) {
            if (this.$route.query.supplierFlow === '1' && value && value !== this.routeRefreshKey) {
                this.routeRefreshKey = value
                this.resetSupplierOrderFlow()
            }
        },
    },
    created() {
        // Registering a batch is master-data setup only: choose its products,
        // then stock is added later through the separate Batch Stock In flow.
        if (this.isBatchRegistration) this.step = 2
        if (this.supplierOrderFlow) this.resetSupplierOrderFlow()
        const requestedSupplier = String(this.$route.query.supplier || '')
        if (requestedSupplier && this.store.findSupplier(requestedSupplier)) {
            this.form.supplierId = this.store.findSupplier(requestedSupplier).id
            this.form.supplierAddress = this.store.findSupplier(requestedSupplier).address || ''
            this.stockInType = 'supplier'
        }
        if (!this.supplierOrderFlow && this.sourceProduct) {
            if (!this.batchItems.length) this.batchItems.push({ key: `batch-item-${Date.now()}`, productId: '', quantity: '' })
            this.batchItems[0].productId = this.sourceProduct.id
            this.applyProductDefaults(0)
        }
        const requestedBatch = String(this.$route.query.batch || '')
        if (!this.supplierOrderFlow && this.isBatchStockIn && requestedBatch && this.store.findBatch(requestedBatch)) {
            const batch = this.store.findBatch(requestedBatch)
            this.supplierBatchSelections = [this.supplierOrderBatchSelection(batch)]
        }
        const requestedWarehouse = String(this.$route.query.warehouse || '')
        const requestedLocation = String(this.$route.query.location || '')
        if (requestedWarehouse && this.store.findWarehouse(requestedWarehouse)) {
            this.form.warehouseId = requestedWarehouse
            this.$nextTick(() => {
                if (requestedLocation && this.store.findLocation(requestedWarehouse, requestedLocation)) {
                    this.form.locationId = requestedLocation
                }
            })
        }
    },
    methods: {
        productOptionLabel,
        setDocumentNumberMode(mode) {
            if (!['sequence', 'random'].includes(mode)) return
            this.documentNumberMode = mode
            this.form.invoiceNumber = this.store.generateDocumentNumber('INV', mode)
            this.form.purchaseOrderNumber = this.store.generateDocumentNumber('PO', mode)
        },
        regenerateDocumentNumber(field, prefix, mode = 'sequence') {
            if (!['invoiceNumber', 'purchaseOrderNumber'].includes(field)) return
            this.form[field] = this.store.generateDocumentNumber(prefix, mode === 'random' ? 'random' : 'sequence')
        },
        resetSupplierOrderFlow() {
            this.step = 1
            this.stockInType = 'supplier'
            this.supplierOrderTarget = 'product'
            this.batchItems = []
            this.supplierBatchSelections = []
            this.selectedExistingBatchId = ''
            this.supplierCompleteOpen = false
            this.cartEditModal = ''
            this.error = ''
            this.receipt = null
            this.form.receivingDate = today()
            this.form.invoiceNumber = this.store.generateDocumentNumber('INV', this.documentNumberMode)
            this.form.purchaseOrderNumber = this.store.generateDocumentNumber('PO', this.documentNumberMode)
            this.form.warehouseId = ''
            this.form.locationId = ''
            this.form.manufacturingDate = ''
            this.form.expiryDate = ''
            this.form.remark = ''
            this.form.photo = ''
            this.proofPhotoName = 'No file chosen'
            if (!this.$route.query.supplier) {
                this.form.supplierId = ''
                this.form.supplierAddress = ''
            }
        },
        goBack() {
            if (this.$route.query.source === 'suppliers') {
                this.$router.push({ name: 'suppliers' })
                return
            }
            if (this.$route.query.from === 'scan') {
                this.$router.push(this.scanReturnRoute)
                return
            }
            this.$router.push({ name: 'dashboard' })
        },
        productsForRow(index) {
            const selectedElsewhere = new Set(
                this.batchItems
                    .filter((_, itemIndex) => itemIndex !== index)
                    .map((item) => item.productId)
                    .filter(Boolean),
            )
            return this.activeProducts.filter((product) => !selectedElsewhere.has(product.id))
        },
        openProductPicker(index) {
            this.productPickerIndex = index
            this.productPickerSearch = ''
            this.productPickerOpen = true
        },
        closeProductPicker() {
            this.productPickerOpen = false
            this.productPickerSearch = ''
        },
        selectProductFromPicker(product) {
            const item = this.batchItems[this.productPickerIndex]
            if (!item || !product) return
            item.productId = product.id
            this.applyProductDefaults(this.productPickerIndex)
            this.closeProductPicker()
        },
        openRegisterProductFromPicker() {
            this.productPickerOpen = false
            this.registerProductPurpose = 'standard'
            this.registerProductEditId = ''
            this.registerProductOpen = true
        },
        closeRegisterProduct() {
            this.registerProductOpen = false
            if (this.supplierOrderFlow && this.registerProductPurpose === 'supplier-new') {
                const item = this.batchItems[this.productPickerIndex]
                if (item && !item.productId) this.batchItems.splice(this.productPickerIndex, 1)
            }
            this.registerProductPurpose = ''
            this.registerProductEditId = ''
        },
        handleRegisteredProduct(product) {
            this.registerProductOpen = false
            if (!product) return
            if (this.registerProductPurpose === 'supplier-edit') {
                this.registerProductPurpose = ''
                this.registerProductEditId = ''
                return
            }
            const item = this.batchItems[this.productPickerIndex] || this.batchItems[0]
            if (!item) return
            item.productId = product.id
            this.applyProductDefaults(this.productPickerIndex)
            this.registerProductPurpose = ''
            this.registerProductEditId = ''
        },
        addBatchItem() {
            this.batchItems.push({
                key: `batch-item-${Date.now()}-${this.batchItems.length}`,
                productId: '',
                quantity: '',
            })
        },
        removeBatchItem(index) {
            if (this.batchItems.length === 1) return
            this.batchItems.splice(index, 1)
        },
        openScanner(index) {
            this.scanTargetIndex = index
            this.scannerOpen = true
        },
        selectStockInType(type) {
            this.stockInType = type
            if (type === 'standard') {
                this.form.supplierId = ''
                this.form.supplierAddress = ''
                this.form.invoiceNumber = ''
                this.form.purchaseOrderNumber = ''
            }
        },
        openSupplierPicker() {
            this.supplierPickerSearch = ''
            this.supplierPickerOpen = true
        },
        closeSupplierPicker() {
            this.supplierPickerOpen = false
            this.supplierPickerSearch = ''
        },
        selectSupplier(supplier) {
            this.form.supplierId = supplier.id
            this.form.supplierAddress = supplier.address || ''
            if (this.supplierOrderFlow) {
                this.batchItems = []
                this.supplierBatchSelections = []
                this.selectedExistingBatchId = ''
            }
            this.closeSupplierPicker()
        },
        openOtherSupplier() {
            this.closeSupplierPicker()
            this.quickSupplierError = ''
            this.quickSupplier = { name: '', contactName: '', phone: '', address: '', saveToDirectory: true }
            this.supplierFormOpen = true
        },
        chooseStockInPath(type) {
            const sourceProduct = this.sourceProduct
            const warehouseId = String(this.$route.query.warehouse || '')
            const locationId = String(this.$route.query.location || '')
            const source = String(this.$route.query.source || '')
            const from = String(this.$route.query.from || '')
            if (type === 'internal') {
                this.stockInChooserStage = 'target'
                return
            }
            this.showReceiveChooser = false
            if (type === 'supplier') {
                const supplierId = sourceProduct?.supplierId || String(this.$route.query.supplier || '')
                this.$router.replace({
                    name: 'receive',
                    query: {
                        type: 'supplier',
                        supplierFlow: '1',
                        ...(supplierId ? { supplier: supplierId } : {}),
                        ...(warehouseId ? { warehouse: warehouseId } : {}),
                        ...(locationId ? { location: locationId } : {}),
                        ...(source ? { source } : {}),
                        ...(from ? { from } : {}),
                    },
                }).then(() => {
                    this.resetSupplierOrderFlow()
                    if (supplierId && this.store.findSupplier(supplierId)) {
                        this.form.supplierId = supplierId
                        this.form.supplierAddress = this.store.findSupplier(supplierId)?.address || ''
                    }
                    if (warehouseId && this.store.findWarehouse(warehouseId)) {
                        this.form.warehouseId = warehouseId
                        this.$nextTick(() => {
                            if (locationId && this.store.findLocation(warehouseId, locationId)) this.form.locationId = locationId
                        })
                    }
                })
                return
            }
            const query = {
                type: 'standard',
                ...(type === 'batch' ? { stockTarget: 'batch' } : {}),
                ...(sourceProduct ? { product: sourceProduct.id } : {}),
                ...(warehouseId ? { warehouse: warehouseId } : {}),
                ...(locationId ? { location: locationId } : {}),
                ...(source ? { source } : {}),
                ...(from ? { from } : {}),
            }
            this.$router.replace({ name: 'receive', query })
        },
        openBatchPicker() {
            this.batchPickerSearch = ''
            this.batchPickerOpen = true
        },
        closeBatchPicker() {
            this.batchPickerOpen = false
            this.batchPickerSearch = ''
        },
        selectExistingBatch(batch) {
            if (this.isBatchStockIn) {
                this.toggleSupplierOrderBatch(batch)
                return
            }
            this.selectedExistingBatchId = batch.id
            this.applyExistingBatch()
            this.closeBatchPicker()
        },
        openInlineBatchFromPicker() {
            this.closeBatchPicker()
            this.batchRegisterProductIds = []
            this.batchRegisterOpen = true
        },
        cancelReceiveChoice() {
            if (this.stockInChooserStage === 'target') {
                this.stockInChooserStage = 'source'
                return
            }
            this.showReceiveChooser = false
            if (this.$route.query.from === 'warehouses') {
                this.$router.push({ name: 'warehouses' })
                return
            }
            if (this.$route.query.source === 'products') {
                this.$router.push({ name: 'products' })
                return
            }
            this.$router.push({ name: 'dashboard' })
        },
        applyExistingBatch() {
            if (this.selectedExistingBatchId === '__other__') {
                this.selectedExistingBatchId = ''
                this.batchRegisterProductIds = []
                this.batchRegisterOpen = true
                return
            }
            const batch = this.selectedExistingBatch
            if (!batch) return
            const recipeItems = batch.items.length
                ? batch.items.map((item) => ({ productId: item.productId, quantity: Number(item.recipeQuantity) || 1 }))
                : batch.productIds.map((productId) => ({ productId, quantity: 1 }))
            this.batchItems = recipeItems.map((item, index) => ({ key: `batch-item-${Date.now()}-${index}`, ...item }))
            this.batchCount = 1
        },
        closeInlineBatchRegister() {
            this.batchRegisterOpen = false
            this.batchRegisterProductIds = []
        },
        toggleInlineBatchProduct(productId) {
            this.batchRegisterProductIds = this.batchRegisterProductIds.includes(productId)
                ? this.batchRegisterProductIds.filter((id) => id !== productId)
                : [...this.batchRegisterProductIds, productId]
        },
        saveInlineBatch() {
            try {
                const batch = this.store.registerBatchDefinition({ productIds: this.batchRegisterProductIds, supplierId: this.supplierOrderFlow ? this.form.supplierId : '' })
                this.batchRegisterOpen = false
                this.batchRegisterProductIds = []
                if (this.supplierOrderFlow && this.supplierOrderTarget === 'batch') {
                    this.supplierBatchSelections.push(this.supplierOrderBatchSelection(batch))
                } else if (this.isBatchStockIn) {
                    this.supplierBatchSelections.push(this.supplierOrderBatchSelection(batch))
                } else {
                    this.selectedExistingBatchId = batch.id
                    this.applyExistingBatch()
                }
                this.store.addToast(`${batch.id} registered and selected.`)
            } catch (error) {
                this.error = error.message
            }
        },
        openProofPicker() {
            this.$refs.proofInput?.click()
        },
        loadProofPhoto(event) {
            const file = event.target.files?.[0]
            if (!file) {
                this.form.photo = ''
                this.proofPhotoName = 'No file chosen'
                return
            }
            if (file.size > 1500000) {
                this.error = 'Choose a photo smaller than 1.5 MB.'
                this.form.photo = ''
                this.proofPhotoName = 'No file chosen'
                event.target.value = ''
                return
            }
            this.proofPhotoName = file.name
            const reader = new FileReader()
            reader.onload = () => {
                this.form.photo = String(reader.result || '')
                this.error = ''
            }
            reader.readAsDataURL(file)
        },
        closeQuickSupplier() {
            this.supplierFormOpen = false
            this.quickSupplierError = ''
        },
        saveQuickSupplier() {
            this.quickSupplierError = ''
            try {
                const supplier = this.store.saveSupplier({
                    name: this.quickSupplier.name,
                    contactName: this.quickSupplier.contactName,
                    phone: this.quickSupplier.phone,
                    address: this.quickSupplier.address,
                    status: 'active',
                })
                this.form.supplierId = supplier.id
                this.form.supplierAddress = supplier.address || ''
                this.supplierFormOpen = false
                this.store.addToast(`${supplier.name} added.`)
            } catch (error) {
                this.quickSupplierError = error.message
            }
        },
        handleProductSelection(index = 0) {
            const item = this.batchItems[index]
            if (!item) return
            if (item.productId === '__other__') {
                this.quickProductError = ''
                this.quickProduct = {
                    name: '',
                    category: 'General',
                    unit: 'pcs',
                    trackingMode: 'none',
                    expiryTracking: false,
                    saveToDirectory: true,
                }
                item.productId = ''
                this.quickProductTargetIndex = index
                this.productFormOpen = true
                return
            }
            this.applyProductDefaults(index)
        },
        closeQuickProduct() {
            this.productFormOpen = false
            this.quickProductError = ''
        },
        saveQuickProduct() {
            this.quickProductError = ''
            try {
                const product = this.store.saveProduct({
                    name: this.quickProduct.name,
                    category: this.quickProduct.category,
                    unit: this.quickProduct.unit,
                    trackingMode: this.quickProduct.trackingMode,
                    expiryTracking: this.quickProduct.expiryTracking,
                    supplierId: this.form.supplierId || '',
                    active: true,
                })
                const item = this.batchItems[this.quickProductTargetIndex] || this.batchItems[0]
                item.productId = product.id
                this.productFormOpen = false
                this.applyProductDefaults(this.quickProductTargetIndex)
                this.store.addToast(`${product.name} added.`)
            } catch (error) {
                this.quickProductError = error.message
            }
        },
        selectSupplierOrderTarget(target) {
            if (!['product', 'batch'].includes(target) || target === this.supplierOrderTarget) return
            this.supplierOrderTarget = target
            this.error = ''
        },
        openSupplierStockPicker() {
            this.supplierStockPickerSearch = ''
            this.supplierStockPickerOpen = true
        },
        closeSupplierStockPicker() {
            this.supplierStockPickerOpen = false
            this.supplierStockPickerSearch = ''
        },
        supplierOrderHasProduct(productId) { return this.batchItems.some((item) => item.productId === productId) },
        toggleSupplierOrderProduct(product) {
            const index = this.batchItems.findIndex((item) => item.productId === product.id)
            if (index >= 0) {
                this.batchItems.splice(index, 1)
                return
            }
            this.batchItems.push({ key: `supplier-product-${product.id}-${Date.now()}`, productId: product.id, quantity: '' })
        },
        removeSupplierOrderProduct(index) { this.batchItems.splice(index, 1) },
        editSupplierOrderProduct(productId) {
            const product = this.store.findProduct(productId)
            if (!product) return
            this.closeSupplierStockPicker()
            this.registerProductPurpose = 'supplier-edit'
            this.registerProductEditId = product.id
            this.registerProductOpen = true
        },
        openSupplierOrderOtherProduct() {
            this.closeSupplierStockPicker()
            this.supplierOrderTarget = 'product'
            this.productPickerIndex = this.batchItems.length
            this.batchItems.push({ key: `supplier-product-new-${Date.now()}`, productId: '', quantity: '' })
            this.registerProductPurpose = 'supplier-new'
            this.registerProductEditId = ''
            this.registerProductOpen = true
        },
        supplierOrderHasBatch(batchId) {
            return this.supplierBatchSelections.some((selection) => selection.batchId === batchId)
        },
        supplierOrderBatchSelection(batch) {
            const recipeItems = batch?.items?.length
                ? batch.items.map((item) => ({ productId: item.productId, quantity: Number(item.recipeQuantity) || 1 }))
                : (batch?.productIds || []).map((productId) => ({ productId, quantity: 1 }))
            return {
                batchId: batch.id,
                batchCount: 1,
                items: recipeItems.map((item, index) => ({
                    key: `supplier-batch-${batch.id}-${item.productId}-${Date.now()}-${index}`,
                    productId: item.productId,
                    quantity: item.quantity,
                })),
            }
        },
        toggleSupplierOrderBatch(batch) {
            const index = this.supplierBatchSelections.findIndex((selection) => selection.batchId === batch.id)
            if (index >= 0) {
                this.supplierBatchSelections.splice(index, 1)
                return
            }
            this.supplierBatchSelections.push(this.supplierOrderBatchSelection(batch))
        },
        removeSupplierOrderBatch(batchId) {
            const index = this.supplierBatchSelections.findIndex((selection) => selection.batchId === batchId)
            if (index >= 0) this.supplierBatchSelections.splice(index, 1)
            if (this.batchSelectionEditId === batchId) this.batchSelectionEditId = ''
        },
        openBatchSelectionEdit(batchId) { this.batchSelectionEditId = batchId },
        closeBatchSelectionEdit() { this.batchSelectionEditId = '' },
        openSupplierOrderOtherBatch() {
            this.closeSupplierStockPicker()
            this.supplierOrderTarget = 'batch'
            this.batchRegisterProductIds = []
            this.batchRegisterOpen = true
        },
        openCartEdit(section) {
            this.error = ''
            this.cartEditModal = section
        },
        closeCartEdit() {
            this.cartEditModal = ''
        },
        handleCartSupplierSelection() {
            this.batchItems = []
            this.supplierBatchSelections = []
            this.selectedExistingBatchId = ''
            this.supplierOrderTarget = 'product'
        },
        saveCartSupplierEdit() {
            if (!this.selectedSupplier || !String(this.form.supplierAddress || '').trim()) {
                this.error = 'Select a supplier and enter its address.'
                return
            }
            this.persistSupplierAddress()
            this.closeCartEdit()
        },
        saveCartWarehouseEdit() {
            if (!this.selectedWarehouse || !this.selectedLocation || !this.form.receivingDate) {
                this.error = 'Select the warehouse, location and receiving date.'
                return
            }
            this.closeCartEdit()
        },
        saveCartStockEdit() {
            const items = this.selectedBatchItems
            if (!items.length || items.some((item) => !item.productId || !(Number(item.quantity) > 0))) {
                this.error = 'Choose stock and enter a quantity for every item.'
                return
            }
            if (this.supplierOrderTarget === 'batch' && !this.supplierBatchSelections.length) {
                this.error = 'Choose at least one batch.'
                return
            }
            if (this.supplierOrderTarget === 'batch' && this.supplierBatchSelections.some((selection) => !(Number(selection.batchCount) > 0))) {
                this.error = 'Enter the quantity of complete batches.'
                return
            }
            this.closeCartEdit()
        },
        editSupplierOrderStep(step) {
            const section = step === 1 ? 'supplier' : step === 2 ? 'warehouse' : 'stock'
            this.openCartEdit(section)
        },
        persistSupplierAddress() {
            const supplier = this.selectedSupplier
            const address = String(this.form.supplierAddress || '').trim()
            if (!supplier || !address || supplier.address === address) return
            if (!this.store.can(PERMISSIONS.MANAGE_SUPPLIERS)) return
            this.store.saveSupplier({ ...supplier, address }, supplier.id)
        },
        submitSupplierOrderStep() {
            this.error = ''
            if (this.step === 1) {
                if (!this.selectedSupplier || !this.form.supplierAddress.trim()) {
                    this.error = 'Select a supplier and enter its address.'
                    return
                }
                this.persistSupplierAddress()
                this.step = 2
                return
            }
            if (this.step === 2) {
                if (!this.selectedWarehouse || !this.selectedLocation || !this.form.receivingDate) {
                    this.error = 'Select the warehouse, location and receiving date.'
                    return
                }
                this.step = 3
                return
            }
            if (this.step === 3) {
                const items = this.selectedBatchItems
                if (!items.length || items.some((item) => !item.productId || !(Number(item.quantity) > 0))) {
                    this.error = 'Choose stock and enter a quantity for every item.'
                    return
                }
                if (this.supplierOrderTarget === 'batch' && !this.supplierBatchSelections.length) {
                    this.error = 'Choose at least one batch.'
                    return
                }
                if (this.supplierOrderTarget === 'batch' && this.supplierBatchSelections.some((selection) => !(Number(selection.batchCount) > 0))) {
                    this.error = 'Enter the quantity of complete batches.'
                    return
                }
                const invalidUnitItem = items.find((item) => this.store.findProduct(item.productId)?.trackingMode === 'unit' && !Number.isInteger(Number(item.quantity)))
                if (invalidUnitItem) {
                    this.error = 'Unit-tracked products require whole quantities.'
                    return
                }
                this.step = 4
                return
            }
            this.confirmSupplierOrder()
        },
        confirmSupplierOrder() {
            this.error = ''
            try {
                const request = this.store.createSupplierStockInRequest({
                    ...this.form,
                    target: this.supplierOrderTarget,
                    items: this.batchItems.map(({ productId, quantity }) => ({ productId, quantity: Number(quantity) || 0 })),
                    batches: this.supplierBatchSelections.map((selection) => ({
                        batchId: selection.batchId,
                        batchCount: Number(selection.batchCount) || 0,
                        items: selection.items.map(({ productId, quantity }) => ({ productId, quantity: Number(quantity) || 0 })),
                    })),
                })
                this.store.addToast(`${request.requestNumber} submitted and pending confirmation.`)
                this.submittedRequest = request
            } catch (error) {
                this.error = error.message
            }
        },
        finishSubmittedRequest() {
            this.submittedRequestDocumentOpen = false
            this.submittedRequest = null
            this.$router.push({ name: 'stock-movement-requests', query: { status: 'pending', from: 'receive' } })
        },
        printSubmittedRequest() {
            this.submittedRequestDocumentOpen = true
        },
        finishSupplierOrder() {
            this.supplierCompleteOpen = false
            this.$router.push(this.completionRoute)
        },
        openSupplierLabels() {
            this.supplierCompleteOpen = false
            const receipts = this.receipt?.receipts || []
            const firstReceipt = receipts[0] || this.receipt?.receipt
            const batchIds = this.receipt?.batchIds || []
            const query = { source: 'receive', ...this.labelReturnQuery }
            if (this.supplierOrderTarget === 'product') {
                if (this.receipt?.product?.sku) query.product = this.receipt.product.sku
                if (firstReceipt?.id) query.receipt = firstReceipt.id
            } else if (batchIds.length === 1) {
                query.batch = batchIds[0]
                if (this.receipt?.product?.sku) query.product = this.receipt.product.sku
                if (firstReceipt?.id) query.receipt = firstReceipt.id
            }
            this.$router.push({ name: 'labels', query })
        },
        openSupplierInvoiceFromComplete() {
            this.supplierCompleteOpen = false
            this.receiptDocumentOpen = true
        },
        handleReceiptDocumentClose() {
            this.receiptDocumentOpen = false
            if (this.supplierOrderFlow && this.receipt) this.supplierCompleteOpen = true
        },
        submitStep() {
            this.error = ''
            if (this.supplierOrderFlow) {
                this.submitSupplierOrderStep()
                return
            }
            if (this.step === 1) {
                if (this.isBatchRegistration) {
                    this.step = 2
                    return
                }
                if (!this.form.receivingDate || (this.isSupplierStockIn && (!this.selectedSupplier || !this.form.supplierAddress.trim()))) {
                    this.error = this.isSupplierStockIn ? 'Select a supplier, enter its address and receiving date.' : 'Select a receiving date.'
                    return
                }
                if (this.isSupplierStockIn) this.persistSupplierAddress()
            }
            if (this.step === 2) {
                const invalidBatchSelection = this.isBatchStockIn && (!this.supplierBatchSelections.length || this.supplierBatchSelections.some((selection) => !(Number(selection.batchCount) > 0)))
                if (invalidBatchSelection || !this.selectedBatchItems.length || (!this.isBatchStockIn && (this.selectedBatchItems.length !== this.batchItems.length || this.batchItems.some((item) => !(Number(item.quantity) > 0))))) {
                    this.error = 'Select every product and enter its quantity.'
                    return
                }
                const invalidUnitItem = this.batchItems.find((item) => Number(item.quantity) > 0 && this.store.findProduct(item.productId)?.trackingMode === 'unit' && !Number.isInteger(Number(item.quantity)))
                if (invalidUnitItem) {
                    this.error = 'Unit-tracked products require whole quantities.'
                    return
                }
                if (this.isBatchRegistration) {
                    this.finishBatchRegistration()
                    return
                }
            }
            if (this.step < 3) {
                this.step += 1
                this.$refs.page?.scrollTo({ top: 0 })
                if (this.isBatchStockIn && this.step === 2 && !this.supplierBatchSelections.length) this.$nextTick(this.openBatchPicker)
                return
            }
            if (!this.selectedLocation) {
                this.error = 'Select a warehouse location.'
                return
            }
            try {
                if (this.isBatchRegistration) {
                    this.finishBatchRegistration()
                    return
                }
                this.receiptWasBatch = this.isBatchStockIn
                this.receipt = this.isBatchStockIn
                    ? this.store.receiveSupplierBatchOrder({
                          ...this.form,
                          stockInType: this.stockInType,
                          batches: this.supplierBatchSelections.map((selection) => ({
                              batchId: selection.batchId,
                              batchCount: Number(selection.batchCount) || 0,
                              items: selection.items.map(({ productId, quantity }) => ({ productId, quantity })),
                          })),
                      })
                    : this.store.receiveStockBatch({
                          ...this.form,
                          stockInType: this.stockInType,
                          batch: this.nextBatchPreview,
                          forceBatch: false,
                          items: this.batchItems.map(({ productId, quantity }) => ({ productId, quantity })),
                      })
                this.store.addToast(
                    this.receiptWasBatch
                        ? `${this.receipt.productCount} products received in ${this.receipt.batchId}.`
                        : `${this.receipt.productCount} product${this.receipt.productCount === 1 ? '' : 's'} received.`,
                )
            } catch (error) {
                this.error = error.message
            }
        },
        finishBatchRegistration() {
            try {
                const batch = this.store.registerBatchDefinition({
                    items: this.batchItems.map(({ productId, quantity }) => ({ productId, quantity: Number(quantity) })),
                })
                this.store.addToast(`${batch.id} registered. Add stock through Batch Stock In.`)
                if (this.$route.query.returnTo === 'batch-stock-in') {
                    this.$router.push({ name: 'receive', query: { stockTarget: 'batch', batch: batch.id, from: 'dashboard' } })
                } else {
                    this.$router.push({ name: 'products', query: { tab: 'batch' } })
                }
            } catch (error) {
                this.error = error.message
            }
        },
        previous() {
            this.error = ''
            this.step = Math.max(1, this.step - 1)
        },
        applyProductDefaults(index = 0) {
            const item = this.batchItems[index]
            const product = this.store.findProduct(item?.productId)
            if (!product || !item) return
            if (this.isSupplierStockIn && !this.form.supplierId) {
                this.form.supplierId = product.supplierId || ''
                this.form.supplierAddress = this.store.findSupplier(this.form.supplierId)?.address || ''
            }
        },
        registeredCost(productId) {
            const product = this.store.findProduct(productId)
            return Number(product?.costPrice || 0).toFixed(2)
        },
        handleScan(value) {
            this.scannerOpen = false
            const product = this.store.findProduct(value)
            if (!product || !product.active) {
                this.error = 'Product not found.'
                return
            }
            const item = this.batchItems[this.scanTargetIndex] || this.batchItems[0]
            if (this.batchItems.some((row, index) => index !== this.scanTargetIndex && row.productId === product.id)) {
                this.error = 'This product is already in the batch.'
                return
            }
            item.productId = product.id
            this.applyProductDefaults(this.scanTargetIndex)
        },
    },
}
</script>

<style scoped src="@/assets/css/pages/receive-stock.css"></style>
