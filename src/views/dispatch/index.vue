<template>
    <StockMovementRequestForm v-if="modeIsMove" />
    <main v-else class="dsp-page">
        <header class="dsp-head">
            <div class="page-title-row">
                <button v-if="canReturnToSource" class="page-back-link" type="button" @click="goBack">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Back</span>
                </button>
                <h1 class="inventory-page-title">{{ modeTitle }}</h1>
                <button v-if="modeIsMove" class="dsp-request-list-link" type="button" @click="$router.push({ name: 'stock-movement-requests' })"><i class="fa-solid fa-list-check"></i>Requests</button>
            </div>
            <nav v-if="modeIsShip" class="dsp-steps" aria-label="Shipment progress">
                <template v-for="(label, index) in ['Stock', 'Details', 'Review', 'Labels']" :key="label">
                    <span :class="{ active: shipStep === index + 1, done: shipStep > index + 1 }"><b>{{ index + 1 }}</b>{{ label }}</span>
                    <i v-if="index < 3"></i>
                </template>
            </nav>
            <nav v-else-if="modeIsMove" class="dsp-steps" aria-label="Stock movement request progress">
                <span :class="{ active: moveStep === 1, done: moveStep > 1 }"><b>1</b> Stock source</span>
                <i></i>
                <span :class="{ active: moveStep === 2 }"><b>2</b> Destination</span>
            </nav>
            <div v-else class="dsp-mode-chip">Remove Stock</div>
        </header>

        <section class="dsp-layout" :class="{ single: !modeIsShip }">
            <form class="dsp-card" @submit.prevent="modeIsMove && moveStep === 1 ? nextMoveStep() : submit()">
                <header class="dsp-card__head">
                    <span><i class="fa-solid fa-truck-fast"></i></span>
                    <h2>{{ modePanelTitle }}</h2>
                </header>

                <div v-if="!modeIsShip || shipStep === 1" class="dsp-ship-stage-body">
                <nav v-if="modeIsShip" class="dsp-source-toggle" aria-label="Shipment source">
                    <button type="button" :class="{ active: shipSource === 'product' }" @click="selectShipSource('product')"><i class="fa-solid fa-box"></i>Product & quantity</button>
                    <button type="button" :class="{ active: shipSource === 'batch' }" @click="selectShipSource('batch')"><i class="fa-solid fa-layer-group"></i>Whole batch</button>
                </nav>

                <nav v-if="!modeIsShip && (!modeIsMove || moveStep === 1)" class="dsp-source-toggle dsp-operation-source-toggle" :aria-label="`${modeTitle} source`">
                    <button type="button" :class="{ active: operationSource === 'product' }" @click="selectOperationSource('product')"><i class="fa-solid fa-box"></i>Products</button>
                    <button type="button" :class="{ active: operationSource === 'batch' }" @click="selectOperationSource('batch')"><i class="fa-solid fa-layer-group"></i>Batches</button>
                </nav>

                <section v-if="modeIsShip && shipSource === 'batch'" class="dsp-batch-shipment">
                    <div class="dsp-batch-select-row">
                        <div class="dsp-whole-batch-field"><span>Batch *</span><div class="dsp-product-picker" :class="{ open: wholeBatchMenuOpen }">
                            <button class="dsp-product-picker__trigger" type="button" :aria-expanded="wholeBatchMenuOpen ? 'true' : 'false'" @click="wholeBatchMenuOpen = !wholeBatchMenuOpen"><span>{{ selectedBatch ? `${selectedBatch.id} · ${selectedBatch.productCount} products · ${selectedBatch.availableBatchCount} batches available` : 'Select Batch' }}</span><i class="fa-solid fa-chevron-down"></i></button>
                            <div v-if="wholeBatchMenuOpen" class="dsp-product-picker__menu dsp-whole-batch-menu" role="listbox">
                                <button v-for="batch in batchOptions" :key="batch.id" type="button" :class="{ selected: batch.id === selectedBatchId }" @click="selectedBatchId = batch.id; selectedBatchCount = 1; wholeBatchMenuOpen = false"><span><strong>{{ batch.id }}</strong><small>{{ batch.productCount }} products · {{ batch.availableBatchCount }} batches available</small></span></button>
                            </div>
                        </div></div>
                        <button class="button secondary dsp-scan-button" type="button" @click="scannerOpen = true"><i class="fa-solid fa-qrcode"></i>Scan Batch</button>
                    </div>
                    <label v-if="selectedBatch" class="dsp-batch-count"><span>Batch quantity *</span><input v-model.number="selectedBatchCount" type="number" min="1" :max="selectedBatch.availableBatchCount" step="1" /></label>
                    <div v-if="selectedBatch" class="dsp-selected-batch">
                        <header><div><small>BATCH CONTENTS</small><strong>{{ selectedBatch.id }}</strong></div><span>{{ selectedBatchCount }} / {{ selectedBatch.availableBatchCount }} batches</span></header>
                        <div class="dsp-selected-batch-list">
                            <article v-for="item in selectedBatch.items" :key="item.lotId">
                                <span>{{ String(item.productName).slice(0,2).toUpperCase() }}</span>
                                <div><strong>{{ item.productName }}</strong><small class="mono">{{ item.sku }}</small></div>
                                <b>{{ formatQuantity(item.recipeQuantity * selectedBatchCount) }} <small>{{ item.unit }}</small></b>
                                <div><small v-for="position in item.positions" :key="position.id"><i class="fa-solid fa-location-dot"></i>{{ position.locationName }}</small></div>
                            </article>
                        </div>
                    </div>
                </section>

                <section v-if="!modeIsShip && operationSource === 'batch' && (!modeIsMove || moveStep === 1)" class="dsp-batch-operation">
                    <div class="dsp-batch-select-row">
                        <div class="dsp-whole-batch-field">
                            <span>Batch *</span>
                            <div class="dsp-product-picker" :class="{ open: wholeBatchMenuOpen }">
                                <button class="dsp-product-picker__trigger" type="button" :aria-expanded="wholeBatchMenuOpen ? 'true' : 'false'" @click="wholeBatchMenuOpen = !wholeBatchMenuOpen">
                                    <span>{{ selectedBatch ? `${selectedBatch.id} · ${selectedBatch.productCount} products · ${formatQuantity(selectedBatch.availableQuantity)} parts` : 'Select batch' }}</span>
                                    <i class="fa-solid fa-chevron-down"></i>
                                </button>
                                <div v-if="wholeBatchMenuOpen" class="dsp-product-picker__menu dsp-whole-batch-menu" role="listbox">
                                    <button v-for="batch in batchActionOptions" :key="batch.id" type="button" :class="{ selected: batch.id === selectedBatchId }" @click="selectOperationBatch(batch)">
                                        <span><strong>{{ batch.id }}</strong><small>{{ batch.productCount }} products · {{ formatQuantity(batch.availableQuantity) }} parts · {{ batch.availableBatchCount }} complete</small></span>
                                        <i v-if="batch.id === selectedBatchId" class="fa-solid fa-check"></i>
                                    </button>
                                    <p v-if="!batchActionOptions.length">No registered batch stock available</p>
                                </div>
                            </div>
                        </div>
                        <button class="button secondary dsp-scan-button" type="button" @click="scannerOpen = true"><i class="fa-solid fa-barcode"></i>Scan Batch</button>
                    </div>

                    <article v-if="selectedBatch" class="dsp-batch-operation-card">
                        <header>
                            <div><small>{{ modeIsMove ? 'WHOLE BATCH REQUEST' : 'WHOLE BATCH REMOVE' }}</small><strong>{{ selectedBatch.id }}</strong></div>
                            <span><b>{{ selectedBatch.productCount }}</b> products · <b>{{ formatQuantity(selectedBatch.availableQuantity) }}</b> parts</span>
                        </header>
                        <div class="dsp-batch-operation-list">
                            <article v-for="item in selectedBatch.items" :key="`action-${selectedBatch.id}-${item.productId}`">
                                <span class="dsp-batch-operation-symbol"><i class="fa-solid fa-box"></i></span>
                                <div><strong>{{ item.productName }}</strong><small class="mono">{{ item.sku }}</small></div>
                                <div class="dsp-batch-operation-meta"><small>Available</small><strong>{{ formatQuantity(item.availableQuantity) }} {{ item.unit }}</strong></div>
                                <div class="dsp-batch-operation-meta"><small>Per batch</small><strong>{{ formatQuantity(item.recipeQuantity) }} {{ item.unit }}</strong></div>
                            </article>
                        </div>
                        <footer>
                            <span><i class="fa-solid fa-location-dot"></i>{{ batchSourceLocationLabel }}</span>
                            <strong><i class="fa-solid" :class="modeIsMove ? 'fa-right-left' : 'fa-trash-can'"></i>{{ modeIsMove ? 'Whole batch stock movement completes after receiving confirmation' : 'All remaining batch stock will be removed' }}</strong>
                        </footer>
                    </article>
                </section>

                <div v-if="(!modeIsMove || moveStep === 1) && !(modeIsShip && shipSource === 'batch') && !(!modeIsShip && operationSource === 'batch')" class="dsp-fields dsp-form-grid">
                    <label class="dsp-product-field">
                        <span>Product *</span>
                        <div class="dsp-product-control">
                            <div
                                class="dsp-product-picker"
                                :class="{ open: productMenuOpen }"
                                @focusout="closeProductMenu"
                            >
                                <button
                                    class="dsp-product-picker__trigger"
                                    type="button"
                                    :aria-expanded="productMenuOpen ? 'true' : 'false'"
                                    @click="productMenuOpen = !productMenuOpen"
                                >
                                    <span>{{ product ? `${product.name} — ${product.sku}` : 'Select product' }}</span>
                                    <i class="fa-solid fa-chevron-down"></i>
                                </button>
                                <div v-if="productMenuOpen" class="dsp-product-picker__menu" role="listbox">
                                    <button
                                        v-for="item in activeProducts"
                                        :key="item.id"
                                        type="button"
                                        role="option"
                                        :class="{ selected: item.id === form.productId }"
                                        @click="selectProduct(item)"
                                    >
                                        <span><strong>{{ item.name }}</strong><small class="mono">{{ item.sku }}</small></span>
                                        <i v-if="item.id === form.productId" class="fa-solid fa-check"></i>
                                    </button>
                                    <p v-if="!activeProducts.length">No products with available stock</p>
                                </div>
                            </div>
                            <button type="button" class="button secondary dsp-scan-button" @click="scannerOpen = true">
                                <i class="fa-solid fa-barcode"></i> Scan
                            </button>
                        </div>
                    </label>

                    <label>
                        <span>Warehouse *</span>
                        <ScrollableSelect v-model="form.sourceWarehouseId" :disabled="!product">
                            <option value="" disabled>Select warehouse</option>
                            <option v-for="warehouse in warehouseOptions" :key="warehouse.id" :value="warehouse.id">
                                {{ warehouse.name }}
                            </option>
                        </ScrollableSelect>
                    </label>

                    <label>
                        <span>Location *</span>
                        <ScrollableSelect v-model="form.sourceLocationId" :disabled="!form.sourceWarehouseId">
                            <option value="" disabled>Select location</option>
                            <option v-if="modeIsShip" value="__auto__">Auto</option>
                            <option v-for="location in locationOptions" :key="location.id" :value="location.id">
                                {{ location.name }}
                            </option>
                        </ScrollableSelect>
                    </label>

                    <div class="dsp-batch-quantity-row">
                        <label v-if="!modeIsShip" class="dsp-batch-field">
                            <span>Receipt layer *</span>
                            <div
                                ref="batchPicker"
                                class="dsp-batch-picker"
                                :class="{ disabled: !form.sourceLocationId, open: batchMenuOpen }"
                                @focusout="closeBatchMenu"
                            >
                                <button
                                    class="dsp-batch-picker__trigger"
                                    type="button"
                                    :disabled="!form.sourceLocationId"
                                    :aria-expanded="batchMenuOpen ? 'true' : 'false'"
                                    @click="batchMenuOpen = !batchMenuOpen"
                                >
                                    <span>{{ selectedLot ? selectedLotLabel(selectedLot) : 'Select receipt layer' }}</span>
                                    <i class="fa-solid fa-chevron-down"></i>
                                </button>
                                <div v-if="batchMenuOpen" class="dsp-batch-picker__menu" role="listbox">
                                    <button
                                        v-for="lot in lotOptions"
                                        :key="lot.id"
                                        type="button"
                                        role="option"
                                        :class="{ selected: lot.id === form.lotId, expired: lot.expired }"
                                        @click="selectLot(lot)"
                                    >
                                        <span>{{ lotListLabel(lot) }}</span>
                                        <i v-if="lot.id === form.lotId" class="fa-solid fa-check"></i>
                                    </button>
                                    <p v-if="!lotOptions.length">No available receipt layers</p>
                                </div>
                            </div>
                        </label>
                        <label class="dsp-quantity-field">
                            <span>{{ quantityLabel }} *</span>
                            <button
                                v-if="product?.trackingMode === 'unit'"
                                class="dsp-quantity-control dsp-quantity-picker-trigger"
                                type="button"
                                :disabled="!product || !form.sourceWarehouseId || !quantityAvailable"
                                @click="openUnitPicker"
                            >
                                <span>{{ formatQuantity(requestedQuantity) }}</span>
                                <strong>{{ product?.unit || '' }}</strong>
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                            <button v-else-if="modeIsShip" class="dsp-quantity-control dsp-quantity-picker-trigger" type="button" :disabled="!product || !form.sourceWarehouseId || !quantityAvailable" @click="openReceiptAllocationPicker">
                                <span>{{ formatQuantity(requestedQuantity) }}</span><strong>{{ product?.unit || '' }}</strong><i class="fa-solid fa-chevron-right"></i>
                            </button>
                            <div v-else class="dsp-quantity-control">
                                <input
                                    v-model="form.quantity"
                                    type="text"
                                    :inputmode="quantityStep === 1 ? 'numeric' : 'decimal'"
                                    autocomplete="off"
                                    :disabled="!product || !form.sourceWarehouseId || !quantityAvailable"
                                    @focus="selectQuantityInput"
                                    @click="selectQuantityInput"
                                    @input="handleQuantityInput"
                                    @blur="normaliseQuantity"
                                />
                                <strong>{{ product?.unit || '' }}</strong>
                            </div>
                        </label>
                    </div>
                </div>

                <section v-if="modeIsMove && moveStep === 2" class="dsp-move-step-two">
                    <div class="dsp-transfer-board">
                        <fieldset class="dsp-transfer-side">
                            <legend>From</legend>
                            <template v-if="operationSource === 'batch'">
                                <label><span>Batch</span><input :value="selectedBatch?.id || '—'" readonly /></label>
                                <label><span>Current locations</span><input :value="batchSourceLocationLabel" readonly /></label>
                                <label><span>Batch stock</span><input :value="`${selectedBatch?.productCount || 0} products · ${formatQuantity(selectedBatch?.availableQuantity || 0)} parts`" readonly /></label>
                            </template>
                            <template v-else>
                                <label><span>Warehouse</span><input :value="selectedWarehouse?.name || '—'" readonly /></label>
                                <label><span>Location</span><input :value="selectedLocation?.name || '—'" readonly /></label>
                                <label><span>Receipt / quantity</span><input :value="`${selectedLot?.batchNumber || '—'} · ${formatQuantity(requestedQuantity)} ${product?.unit || ''}`" readonly /></label>
                            </template>
                        </fieldset>
                        <i class="fa-solid fa-arrow-right dsp-transfer-arrow" aria-hidden="true"></i>
                        <fieldset class="dsp-transfer-side">
                            <legend>To</legend>
                            <label>
                                <span>Warehouse *</span>
                                <ScrollableSelect v-model="form.destinationWarehouseId">
                                    <option value="" disabled>Select warehouse</option>
                                    <option v-for="warehouse in destinationWarehouseOptions" :key="warehouse.id" :value="warehouse.id">{{ warehouse.name }}</option>
                                </ScrollableSelect>
                            </label>
                            <label>
                                <span>Preferred location</span>
                                <ScrollableSelect v-model="form.destinationLocationId" :disabled="!form.destinationWarehouseId">
                                    <option value="">Choose on receiving</option>
                                    <option v-for="location in destinationLocationOptions" :key="location.id" :value="location.id">{{ location.name }}</option>
                                </ScrollableSelect>
                            </label>
                            <label>
                                <span>Reason *</span>
                                <ScrollableSelect v-model="form.reason">
                                    <option>Warehouse stock movement</option>
                                    <option>Replenishment</option>
                                    <option>Return movement</option>
                                    <option>Inspection movement</option>
                                    <option>Other</option>
                                </ScrollableSelect>
                            </label>
                        </fieldset>
                    </div>
                    <div v-if="operationSource === 'batch' && selectedBatch" class="dsp-batch-destination-note">
                        <i class="fa-solid fa-layer-group"></i>
                        <span><strong>{{ selectedBatch.id }} stays as one registered batch.</strong><small>The request keeps the whole batch together. Stock moves only after the destination warehouse confirms receiving.</small></span>
                    </div>
                    <div class="dsp-proof-row">
                        <label><span>Request photo</span><input type="file" accept="image/*" @change="loadPhoto" /></label>
                        <button class="button secondary" type="button" @click="detailsOpen = true"><i class="fa-solid fa-circle-plus"></i>Add reference / remark</button>
                    </div>
                </section>

                <section v-if="modeIsRemove" class="dsp-details-panel open dsp-mode-extra">
                    <div class="dsp-fields dsp-form-grid">
                        <label>
                            <span>Remove reason *</span>
                            <ScrollableSelect v-model="form.reason">
                                <option>Damaged</option>
                                <option>Expired</option>
                                <option>Lost</option>
                                <option>Refund to supplier</option>
                                <option>Wastage</option>
                                <option>Other</option>
                            </ScrollableSelect>
                        </label>
                        <label class="dsp-photo-evidence-field">
                            <span>Photo evidence</span>
                            <div class="dsp-photo-upload">
                                <input ref="removalPhotoInput" class="dsp-photo-upload__input" type="file" accept="image/*" @change="loadPhoto" />
                                <button class="dsp-photo-upload__button" type="button" @click="$refs.removalPhotoInput?.click()">Choose File</button>
                                <span class="dsp-photo-upload__name" :class="{ selected: photoFileName }">{{ photoFileName || 'No file chosen' }}</span>
                            </div>
                        </label>
                    </div>
                </section>
                </div>

                <section v-if="modeIsShip && shipStep === 2" class="dsp-inline-stage">
                    <div class="dsp-fields dsp-extra-inline-grid">
                        <label><span>Recipient / Department *</span><input v-model.trim="form.recipient" placeholder="Enter recipient or department" /></label>
                        <label class="dsp-numbered-field"><span>Reference Number *</span><div><input v-model.trim="form.reference" class="mono" placeholder="Enter order or delivery reference" /><button type="button" title="Next sequential reference" aria-label="Next sequential reference" @click="regenerateShipmentReference('sequence')"><i class="fa-solid fa-arrow-down-short-wide"></i></button><button type="button" title="Generate random reference" aria-label="Generate random reference" @click="regenerateShipmentReference('random')"><i class="fa-solid fa-rotate"></i></button></div></label>
                        <label class="full"><span>Shipment Remark</span><textarea v-model.trim="form.remark" rows="4" placeholder="Optional"></textarea></label>
                    </div>
                </section>

                <section v-if="modeIsShip && shipStep === 3" class="dsp-inline-stage dsp-shipment-review">
                    <h3>Check shipment</h3>
                    <dl>
                        <div><dt>Stock</dt><dd>{{ shipReviewStock }}</dd></div>
                        <div><dt>From</dt><dd>{{ shipReviewSource }}</dd></div>
                        <div><dt>Recipient</dt><dd>{{ form.recipient }}</dd></div>
                        <div><dt>Reference</dt><dd class="mono">{{ form.reference }}</dd></div>
                        <div class="full"><dt>Remark</dt><dd>{{ form.remark || '—' }}</dd></div>
                    </dl>
                </section>

                <button v-if="!modeIsShip && (!modeIsMove || moveStep === 1)" class="dsp-details-toggle dsp-details-launch" type="button" @click="detailsOpen = true">
                    <span><i class="fa-solid" :class="modeIsShip && shipmentDetailsComplete ? 'fa-circle-check' : 'fa-circle-plus'"></i>{{ modeIsShip ? 'Shipment details' : 'Add extra details' }}</span>
                    <i class="fa-solid fa-chevron-right"></i>
                </button>

                <p v-if="error" class="dsp-error"><i class="fa-solid fa-circle-exclamation"></i>{{ error }}</p>
                <footer class="dsp-actions">
                    <button v-if="modeIsShip && shipStep > 1" class="button secondary" type="button" @click="shipStep -= 1"><i class="fa-solid fa-arrow-left"></i>Previous</button>
                    <button v-if="modeIsMove && moveStep === 2" class="button secondary" type="button" @click="moveStep = 1">
                        <i class="fa-solid fa-arrow-left"></i> Previous
                    </button>
                    <span></span>
                    <button
                        class="button primary"
                        type="button"
                        :disabled="modeIsMove && moveStep === 1 ? !canShip : modeIsShip ? (shipStep === 1 ? !canShip : shipStep === 2 ? !shipmentDetailsComplete : !canSubmit) : !canSubmit"
                        @click="modeIsShip ? advanceShipStage() : modeIsMove && moveStep === 1 ? nextMoveStep() : submit()"
                    >
                        {{ modeIsShip ? (shipStep < 3 ? 'Next' : 'Continue to Labels') : modeIsMove && moveStep === 1 ? 'Next' : submitButtonLabel }}
                        <i class="fa-solid" :class="modeIsMove && moveStep === 1 ? 'fa-arrow-right' : modeIsShip ? 'fa-arrow-right' : 'fa-check'"></i>
                    </button>
                </footer>
            </form>

            <aside v-if="modeIsShip" class="dsp-summary">
                <template v-if="shipSource === 'batch' && selectedBatch">
                    <small>BATCH SHIPMENT</small>
                    <h2>{{ selectedBatch.name }}</h2>
                    <p class="mono">{{ selectedBatch.qrCode }}</p>
                    <div class="dsp-summary-source">
                        <span><i class="fa-solid fa-layer-group"></i>{{ selectedBatch.productCount }} products</span>
                        <span><i class="fa-solid fa-boxes-stacked"></i>{{ formatQuantity(selectedBatch.recipePartCount * selectedBatchCount) }} selected parts</span>
                        <span><i class="fa-solid fa-location-dot"></i>{{ selectedBatch.locations.length }} stock positions</span>
                    </div>
                    <dl>
                        <div><dt>Ship mode</dt><dd>Whole batch</dd></div>
                        <div><dt>Products</dt><dd>{{ selectedBatch.productCount }}</dd></div>
                        <div><dt>Batches</dt><dd>{{ selectedBatchCount }}</dd></div>
                        <div><dt>Parts</dt><dd>{{ formatQuantity(selectedBatch.recipePartCount * selectedBatchCount) }}</dd></div>
                    </dl>
                </template>
                <template v-else-if="product">
                    <small>SHIPMENT SUMMARY</small>
                    <h2>{{ product.name }}</h2>
                    <p class="mono">{{ product.sku }}</p>
                    <div class="dsp-summary-source">
                        <span><i class="fa-solid fa-boxes-stacked"></i>{{ selectedWarehouse?.name || 'Select warehouse' }}</span>
                        <span><i class="fa-solid fa-location-dot"></i>{{ selectedLocation?.name || (form.sourceLocationId === '__auto__' ? 'Auto' : 'Select location') }}</span>
                        <span><i class="fa-solid fa-layer-group"></i>{{ allocationModeLabel }}</span>
                    </div>
                    <dl>
                        <div><dt>Available</dt><dd>{{ formatQuantity(quantityAvailable) }} {{ product.unit }}</dd></div>
                        <div><dt>Ship quantity</dt><dd>{{ formatQuantity(requestedQuantity) }} {{ product.unit }}</dd></div>
                        <div><dt>Remaining</dt><dd>{{ formatQuantity(Math.max(0, quantityAvailable - requestedQuantity)) }} {{ product.unit }}</dd></div>
                    </dl>
                </template>
                <template v-else>
                    <header class="dsp-recent-aside-head"><small>RECENT SHIPMENTS</small><strong>{{ store.state.shipments.length }}</strong></header>
                    <div class="dsp-recent-aside-list">
                        <button v-for="shipment in store.state.shipments.slice(0, 5)" :key="shipment.id" type="button" @click="selectedShipment = shipment">
                            <span><i class="fa-solid fa-truck-arrow-right"></i></span>
                            <div><strong>{{ shipment.productName }}</strong><small>{{ shipment.quantity }} {{ shipment.unit }} · {{ shipment.sourceLocation }}</small></div>
                            <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        </button>
                        <p v-if="!store.state.shipments.length">No shipments yet.</p>
                    </div>
                </template>
            </aside>
        </section>

        <div v-if="detailsOpen && !modeIsShip" class="modal-backdrop" @click.self="detailsOpen = false">
            <section class="form-modal dsp-extra-modal">
                <header class="modal-header">
                    <div><span class="eyebrow">{{ modeIsShip ? 'SHIPMENT' : 'OPTIONAL DETAILS' }}</span><h2>{{ modeIsShip ? 'Shipment details' : modeIsMove ? 'Stock movement request details' : 'Removal details' }}</h2></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="detailsOpen = false"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="dsp-extra-modal-body">
                    <label v-if="modeIsShip"><span>Recipient / Department *</span><input v-model.trim="form.recipient" placeholder="Enter recipient or department" /></label>
                    <label><span>Reference Number{{ modeIsShip ? ' *' : '' }}</span><input v-model.trim="form.reference" class="mono" :placeholder="modeIsShip ? 'Enter order or delivery reference' : 'Optional'" /></label>
                    <label class="full"><span>{{ modeIsShip ? 'Shipment Remark' : modeIsMove ? 'Request Remark' : 'Removal Remark' }}</span><textarea v-model.trim="form.remark" rows="3" placeholder="Optional"></textarea></label>
                </div>
                <footer class="form-actions"><span></span><button class="button primary" type="button" :disabled="modeIsShip && !shipmentDetailsComplete" @click="detailsOpen = false"><i class="fa-solid fa-check"></i>Done</button></footer>
            </section>
        </div>

        <div v-if="selectedShipment" class="modal-backdrop" @click.self="selectedShipment = null">
            <section class="form-modal dsp-shipment-modal">
                <header class="modal-header">
                    <div><span class="eyebrow">SHIPMENT DETAILS</span><h2>{{ selectedShipment.productName }}</h2><p class="mono">{{ selectedShipment.id }}</p></div>
                    <button class="icon-button" type="button" aria-label="Close shipment details" @click="selectedShipment = null"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <dl class="dsp-shipment-facts">
                    <div><dt>Quantity</dt><dd>{{ selectedShipment.quantity }} {{ selectedShipment.unit }}</dd></div>
                    <div><dt>From</dt><dd>{{ selectedShipment.sourceWarehouseName || selectedShipment.sourceWarehouse }} · {{ selectedShipment.sourceLocation }}</dd></div>
                    <div><dt>Recipient</dt><dd>{{ selectedShipment.recipient || '—' }}</dd></div>
                    <div><dt>Reference</dt><dd class="mono">{{ selectedShipment.reference || '—' }}</dd></div>
                    <div><dt>Created</dt><dd>{{ new Date(selectedShipment.createdAt).toLocaleString('en-MY') }}</dd></div>
                    <div><dt>Remark</dt><dd>{{ selectedShipment.remark || '—' }}</dd></div>
                    <div><dt>Status</dt><dd class="dsp-shipment-status" :class="`is-${selectedShipment.status}`">{{ selectedShipment.status === 'voided' ? 'Voided' : 'Completed' }}</dd></div>
                    <div v-if="selectedShipment.voidedAt"><dt>Voided</dt><dd>{{ new Date(selectedShipment.voidedAt).toLocaleString('en-MY') }}</dd></div>
                    <div v-if="selectedShipment.voidReason" class="dsp-shipment-fact-wide"><dt>Void reason</dt><dd>{{ selectedShipment.voidReason }}</dd></div>
                </dl>
                <footer v-if="selectedShipment.status === 'shipped'" class="form-actions dsp-shipment-actions">
                    <button class="button danger" type="button" @click="openVoidShipment"><i class="fa-solid fa-rotate-left"></i>Void Shipment</button>
                </footer>
            </section>
        </div>

        <div v-if="voidShipmentOpen" class="modal-backdrop" @click.self="closeVoidShipment">
            <section class="form-modal dsp-void-shipment-modal" role="dialog" aria-modal="true" aria-label="Void shipment">
                <header class="modal-header">
                    <div><span class="eyebrow">VOID SHIPMENT</span><h2>Return stock to inventory</h2><p class="mono">{{ selectedShipment?.batchShipmentId || selectedShipment?.id }}</p></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closeVoidShipment"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="dsp-void-shipment-body">
                    <p>The shipment and label history will be kept. Stock returns to its exact original positions.</p>
                    <label><span>Void reason *</span><textarea v-model.trim="voidReason" rows="3" placeholder="Enter the reason"></textarea></label>
                    <p v-if="voidShipmentError" class="form-error">{{ voidShipmentError }}</p>
                </div>
                <footer class="form-actions">
                    <button class="button" type="button" :disabled="voidShipmentBusy" @click="closeVoidShipment">Cancel</button>
                    <button class="button danger" type="button" :disabled="voidShipmentBusy || !voidReason" @click="confirmVoidShipment"><i class="fa-solid fa-rotate-left"></i>{{ voidShipmentBusy ? 'Voiding…' : 'Confirm Void' }}</button>
                </footer>
            </section>
        </div>

        <div v-if="allocationPickerOpen" class="modal-backdrop dsp-unit-picker-backdrop" @click.self="cancelReceiptAllocationPicker">
            <section class="dsp-allocation-modal" role="dialog" aria-modal="true" aria-label="Choose shipment quantities">
                <header class="modal-header"><div><span class="eyebrow">SHIPMENT QUANTITY</span><h2>Choose stock quantities</h2></div><button class="icon-button" type="button" aria-label="Close" @click="cancelReceiptAllocationPicker"><i class="fa-solid fa-xmark"></i></button></header>
                <div class="dsp-allocation-modal-body">
                    <div class="dsp-allocation-total-row">
                        <label><span>Total quantity</span><div class="dsp-allocation-total-input"><input v-model="allocationDraftQuantityText" type="text" :inputmode="quantityStep === 1 ? 'numeric' : 'decimal'" @input="handleAllocationTotalInput" @blur="normaliseAllocationTotal" /><strong>{{ product?.unit || '' }}</strong></div></label>
                    </div>
                    <div class="dsp-allocation-layer-list">
                        <article v-for="layer in receiptLayersByArrival" :key="layer.id" :class="{ selected: allocationDraftQuantity(layer.id) > 0 }">
                            <div class="dsp-allocation-layer-copy"><strong>{{ layer.batchNumber }}</strong><span>{{ receiptLayerLocations(layer) }}</span><small>{{ formatShortDate(layer.receivedDate) }} · {{ formatQuantity(layer.availableQuantity) }} {{ product?.unit }}</small></div>
                            <div class="dsp-allocation-stepper"><button type="button" :disabled="allocationDraftQuantity(layer.id) <= 0" @click="adjustAllocationDraft(layer, -quantityStep)"><i class="fa-solid fa-chevron-left"></i></button><b>{{ formatQuantity(allocationDraftQuantity(layer.id)) }} <small>{{ product?.unit }}</small></b><button type="button" :disabled="allocationDraftQuantity(layer.id) >= layer.availableQuantity" @click="adjustAllocationDraft(layer, quantityStep)"><i class="fa-solid fa-chevron-right"></i></button></div>
                        </article>
                    </div>
                </div>
                <footer class="dsp-unit-picker-actions"><button class="button secondary" type="button" @click="cancelReceiptAllocationPicker">Cancel</button><button class="button primary" type="button" :disabled="!canConfirmReceiptAllocation" @click="confirmReceiptAllocationPicker">Confirm {{ formatQuantity(allocationDraftTotal) }}</button></footer>
            </section>
        </div>

        <div v-if="unitPickerOpen" class="modal-backdrop dsp-unit-picker-backdrop" @click.self="cancelUnitPicker">
            <section class="dsp-unit-picker-modal" role="dialog" aria-modal="true" aria-label="Select shipment units">
                <header class="modal-header">
                    <div><span class="eyebrow">SELECT SHIPMENT QUANTITY</span><h2>Choose individual units</h2></div>
                    <button class="icon-button" type="button" aria-label="Close unit selector" @click="cancelUnitPicker"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="dsp-unit-picker-body">
                    <div class="dsp-unit-picker-count">
                        <label><span>Quantity</span><input v-model="unitPickerQuantityText" type="text" inputmode="numeric" autocomplete="off" @input="handleUnitPickerQuantityInput" @blur="normaliseUnitPickerQuantity" /></label>
                    </div>
                    <div class="dsp-unit-picker-summary"><strong>{{ unitPickerIds.length }} / {{ availableUnits.length }}</strong></div>
                    <div class="dsp-unit-picker-list">
                        <label v-for="unit in availableUnits" :key="unit.id" :class="{ selected: unitPickerIds.includes(unit.id) }">
                            <input type="checkbox" :checked="unitPickerIds.includes(unit.id)" @change="toggleUnitPicker(unit.id)" />
                            <span><strong>{{ unitOrdinal(unit) }} / {{ unit.receiptQuantity }}</strong><small class="mono">{{ unit.code }}</small></span>
                            <span><small>{{ unit.batchId }}</small><strong>{{ unit.location }}</strong></span>
                        </label>
                    </div>
                </div>
                <footer class="dsp-unit-picker-actions">
                    <button class="button secondary" type="button" @click="cancelUnitPicker">Cancel</button>
                    <button class="button primary" type="button" :disabled="!unitPickerIds.length" @click="confirmUnitPicker">Confirm {{ unitPickerIds.length }} units</button>
                </footer>
            </section>
        </div>

        <StockInRequestModal v-if="createdRequest" :request="createdRequest" :confirmable="true" @receive="receiveCreatedRequest" @close="finishCreatedRequest" />

        <ScannerModal v-if="scannerOpen" @close="scannerOpen = false" @scanned="handleScan" />
    </main>
</template>

<script>
import ScannerModal from '@/components/common/ScannerModal.vue'
import StockInRequestModal from '@/components/stock/StockInRequestModal.vue'
import { inventoryStore } from '@/services/inventoryStore'
import StockMovementRequestForm from '@/components/stock/StockMovementRequestForm.vue'

export default {
    name: 'DispatchView',
    components: { ScannerModal, StockInRequestModal, StockMovementRequestForm },
    data() {
        return {
            store: inventoryStore,
            scannerOpen: false,
            createdRequest: null,
            detailsOpen: false,
            selectedShipment: null,
            voidShipmentOpen: false,
            voidReason: '',
            voidShipmentError: '',
            voidShipmentBusy: false,
            batchMenuOpen: false,
            wholeBatchMenuOpen: false,
            productMenuOpen: false,
            error: '',
            selectedIds: [],
            receiptLayerQuantities: {},
            fcfsEnabled: true,
            photoFileName: '',
            allocationPickerOpen: false,
            allocationDraftQuantityText: '1',
            allocationDraftQuantities: {},
            allocationPickerSnapshot: null,
            unitPickerOpen: false,
            unitPickerIds: [],
            unitPickerQuantityText: '1',
            unitPickerSnapshot: null,
            moveStep: 1,
            shipStep: 1,
            shipSource: String(this.$route.query.source || '') === 'batch' ? 'batch' : 'product',
            operationSource: String(this.$route.query.source || '') === 'batch' ? 'batch' : 'product',
            selectedBatchId: String(this.$route.query.batch || ''),
            selectedBatchCount: 1,
            mode: ['ship', 'move', 'remove'].includes(String(this.$route.query.mode || '').toLowerCase()) ? String(this.$route.query.mode).toLowerCase() : 'ship',
            preferredWarehouseId: String(this.$route.query.warehouse || ''),
            preferredLocationId: String(this.$route.query.location || ''),
            preferredLotId: String(this.$route.query.lot || ''),
            form: {
                productId:
                    inventoryStore.findProduct(String(this.$route.query.product || ''))?.id || '',
                quantity: '1',
                sourceWarehouseId: String(this.$route.query.warehouse || ''),
                sourceLocationId: String(this.$route.query.location || ''),
                lotId: '',
                recipient: '',
                reference: '',
                remark: '',
                destinationWarehouseId: '',
                destinationLocationId: '',
                reason: 'Warehouse stock movement',
                photo: '',
            },
        }
    },
    computed: {
        modeIsShip() {
            return this.mode === 'ship'
        },
        modeIsMove() {
            return this.mode === 'move'
        },
        modeIsRemove() {
            return this.mode === 'remove'
        },
        modeEyebrow() {
            return this.modeIsShip ? 'STOCK OUT' : this.modeIsMove ? 'STOCK MOVEMENT' : 'STOCK REMOVE'
        },
        modeTitle() {
            return this.modeIsShip ? 'Ship Items' : this.modeIsMove ? 'Stock Movement Request' : 'Remove Stock'
        },
        modePanelTitle() {
            return this.modeIsShip ? 'Shipment' : this.modeIsMove ? 'Stock In Request' : 'Removal request'
        },
        quantityLabel() {
            return this.modeIsShip ? 'Ship quantity' : this.modeIsMove ? 'Request quantity' : 'Remove quantity'
        },
        summaryEyebrow() {
            return this.modeIsShip ? 'SHIPMENT SUMMARY' : this.modeIsMove ? 'REQUEST SUMMARY' : 'REMOVAL SUMMARY'
        },
        destinationWarehouseOptions() {
            return this.store.state.warehouses.filter((warehouse) => warehouse.active !== false)
        },
        destinationLocationOptions() {
            if (!this.form.destinationWarehouseId) return []
            const warehouse = this.store.findWarehouse(this.form.destinationWarehouseId)
            return (warehouse?.locations || []).filter((location) => {
                if (location.active === false || location.status === 'unavailable') return false
                return !(
                    this.form.destinationWarehouseId === this.form.sourceWarehouseId &&
                    location.id === this.form.sourceLocationId
                )
            })
        },
        destinationSummary() {
            const warehouse = this.store.findWarehouse(this.form.destinationWarehouseId)
            const location = this.store.findLocation(this.form.destinationWarehouseId, this.form.destinationLocationId)
            return [warehouse?.name, location?.name].filter(Boolean).join(' · ') || '—'
        },
        activeProducts() {
            const products = this.store.state.products.filter(
                (product) => product.active && this.store.productStock(product.id, { stockSource: 'standalone' }) > 0,
            )
            if (!this.preferredWarehouseId) return products
            return products.filter((product) =>
                this.store.stockPositionsFor(product.id, {
                    warehouseId: this.preferredWarehouseId,
                    ...(this.preferredLocationId ? { locationId: this.preferredLocationId } : {}),
                    stockSource: 'standalone',
                }).some((position) => Number(position.availableQuantity) > 0),
            )
        },
        batchOptions() {
            return this.store.batchGroups({ availableOnly: true, completeOnly: true })
        },
        batchActionOptions() {
            return this.store.batchGroups({ availableOnly: true })
        },
        selectedBatch() {
            const options = this.modeIsShip ? this.batchOptions : this.batchActionOptions
            return options.find((batch) => batch.id === this.selectedBatchId) || null
        },
        batchSourceLocationLabel() {
            if (!this.selectedBatch) return '—'
            const locations = [...new Map(
                (this.selectedBatch.locations || [])
                    .filter((position) => Number(position.quantity || position.availableQuantity) > 0)
                    .map((position) => [
                        `${position.warehouseId}:${position.locationId}`,
                        `${position.warehouseName || 'Warehouse'} · ${position.locationName || position.location || 'Location'}`,
                    ]),
            ).values()]
            if (!locations.length) return 'No active stock location'
            if (locations.length <= 2) return locations.join(' / ')
            return `${locations.length} locations`
        },
        product() {
            return this.store.findProduct(this.form.productId)
        },
        positions() {
            return this.product
                ? this.store.stockPositionsFor(this.product.id, { stockSource: 'standalone' })
                : []
        },
        warehouseOptions() {
            if (!this.product && this.preferredWarehouseId) {
                const preferred = this.store.findWarehouse(this.preferredWarehouseId)
                return preferred ? [preferred] : []
            }
            const ids = [...new Set(
                this.positions
                    .filter((item) => Number(item.availableQuantity) > 0)
                    .map((item) => item.warehouseId),
            )]
            return ids.map((id) => this.store.findWarehouse(id)).filter(Boolean)
        },
        locationOptions() {
            if (!this.form.sourceWarehouseId) return []
            if (!this.product && this.preferredLocationId) {
                const preferred = this.store.findLocation(
                    this.form.sourceWarehouseId,
                    this.preferredLocationId,
                )
                return preferred ? [preferred] : []
            }
            const rows = this.positions.filter(
                (item) =>
                    item.warehouseId === this.form.sourceWarehouseId &&
                    Number(item.availableQuantity) > 0,
            )
            return [...new Set(rows.map((item) => item.locationId))]
                .map((id) => this.store.findLocation(this.form.sourceWarehouseId, id))
                .filter(Boolean)
        },
        lotOptions() {
            if (!this.product || !this.form.sourceWarehouseId || !this.form.sourceLocationId) return []
            const today = new Date().toISOString().slice(0, 10)
            const grouped = new Map()
            this.store.stockPositionsFor(this.product.id, {
                warehouseId: this.form.sourceWarehouseId,
                locationId: this.form.sourceLocationId,
                stockSource: 'standalone',
            })
                .filter((position) => Number(position.availableQuantity) > 0)
                .forEach((position) => {
                    const current = grouped.get(position.lotId) || 0
                    grouped.set(position.lotId, current + Number(position.availableQuantity))
                })
            return [...grouped.entries()]
                .map(([lotId, quantity]) => {
                    const lot = this.store.state.stockLots.find((item) => item.id === lotId)
                    return lot
                        ? {
                              ...lot,
                              quantity,
                              expired: Boolean(lot.expiryDate && lot.expiryDate < today),
                          }
                        : null
                })
                .filter(Boolean)
                .sort((a, b) => {
                    const aExpiry = a.expiryDate || '9999-12-31'
                    const bExpiry = b.expiryDate || '9999-12-31'
                    return aExpiry.localeCompare(bExpiry) || String(a.receivedDate || '').localeCompare(String(b.receivedDate || ''))
                })
                .map((lot, index) => ({ ...lot, displayIndex: index + 1 }))
        },
        availableUnits() {
            if (!this.product || !this.form.sourceWarehouseId) return []
            const locationId = this.form.sourceLocationId && this.form.sourceLocationId !== '__auto__'
                ? this.form.sourceLocationId
                : ''
            const lotOrder = new Map(this.eligibleLots.map((lot, index) => [lot.id, index]))
            return this.store.availableStockUnits(this.product.id, {
                warehouseId: this.form.sourceWarehouseId,
                ...(locationId ? { locationId } : {}),
                stockSource: 'standalone',
            })
                .filter((unit) => this.eligibleLotIds.has(unit.lotId))
                .slice()
                .sort((left, right) => {
                    const leftLot = lotOrder.get(left.lotId) ?? Number.MAX_SAFE_INTEGER
                    const rightLot = lotOrder.get(right.lotId) ?? Number.MAX_SAFE_INTEGER
                    return leftLot - rightLot || this.unitOrdinal(left) - this.unitOrdinal(right) || String(left.code).localeCompare(String(right.code), undefined, { numeric: true })
                })
        },
        unitsToShip() {
            if (this.product?.trackingMode !== 'unit') return []
            const selected = new Set(this.selectedIds)
            return this.availableUnits.filter((unit) => selected.has(unit.id))
        },
        selectedWarehouse() {
            return this.store.findWarehouse(this.form.sourceWarehouseId)
        },
        selectedLocation() {
            if (this.form.sourceLocationId === '__auto__') return null
            return this.store.findLocation(this.form.sourceWarehouseId, this.form.sourceLocationId)
        },
        eligibleLots() {
            if (!this.product || !this.form.sourceWarehouseId) return []
            const locationId = this.form.sourceLocationId && this.form.sourceLocationId !== '__auto__'
                ? this.form.sourceLocationId
                : ''
            const today = new Date().toISOString().slice(0, 10)
            const lotIds = new Set(
                this.store.stockPositionsFor(this.product.id, {
                    warehouseId: this.form.sourceWarehouseId,
                    ...(locationId ? { locationId } : {}),
                    stockSource: 'standalone',
                })
                    .filter((position) => Number(position.availableQuantity) > 0)
                    .map((position) => position.lotId),
            )
            return this.store.stockLotsFor(this.product.id, { stockSource: 'standalone' })
                .filter((lot) => lotIds.has(lot.id) && !(lot.expiryDate && lot.expiryDate < today))
                .slice()
                .sort((left, right) => {
                    const leftExpiry = left.expiryDate || '9999-12-31'
                    const rightExpiry = right.expiryDate || '9999-12-31'
                    return leftExpiry.localeCompare(rightExpiry) || String(left.receivedDate || '').localeCompare(String(right.receivedDate || '')) || String(left.createdAt || '').localeCompare(String(right.createdAt || ''))
                })
        },
        receiptLayers() {
            if (!this.product || !this.form.sourceWarehouseId) return []
            const locationId = this.form.sourceLocationId && this.form.sourceLocationId !== '__auto__'
                ? this.form.sourceLocationId
                : ''
            return this.eligibleLots.map((lot, index) => {
                const availableQuantity = this.store.stockPositionsFor(this.product.id, {
                    warehouseId: this.form.sourceWarehouseId,
                    ...(locationId ? { locationId } : {}),
                    lotId: lot.id,
                    stockSource: 'standalone',
                }).reduce((sum, position) => sum + Number(position.availableQuantity || 0), 0)
                return {
                    ...lot,
                    displayIndex: index + 1,
                    availableQuantity,
                }
            }).filter((lot) => lot.availableQuantity > 0)
        },
        receiptLayersByArrival() {
            return this.receiptLayers.slice().sort((left, right) => {
                const leftArrival = String(left.receivedDate || left.createdAt || '9999-12-31')
                const rightArrival = String(right.receivedDate || right.createdAt || '9999-12-31')
                return leftArrival.localeCompare(rightArrival) ||
                    String(left.createdAt || '').localeCompare(String(right.createdAt || '')) ||
                    String(left.id).localeCompare(String(right.id))
            })
        },
        manualLotAllocations() {
            return this.receiptLayersByArrival
                .map((layer) => ({
                    lotId: layer.id,
                    quantity: Number(this.receiptLayerQuantities[layer.id] || 0),
                }))
                .filter((item) => item.quantity > 0)
        },
        fcfsLotAllocations() {
            return this.buildFcfsAllocations(this.requestedQuantity)
        },
        effectiveLotAllocations() {
            return this.fcfsEnabled ? this.fcfsLotAllocations : this.manualLotAllocations
        },
        manualAllocationTotal() {
            return this.manualLotAllocations.reduce((sum, item) => sum + item.quantity, 0)
        },
        effectiveAllocationTotal() {
            return this.effectiveLotAllocations.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
        },
        hasManualAllocation() {
            return !this.fcfsEnabled
        },
        allocationModeLabel() {
            if (this.product?.trackingMode === 'unit') return 'Individual unit selection'
            return 'FEFO / FIFO automatic'
        },
        allocationSummary() {
            const allocations = this.effectiveLotAllocations
            if (!allocations.length) return 'Choose shipment quantity'
            return `${allocations.length} ${allocations.length === 1 ? 'receipt layer' : 'receipt layers'} · ${this.formatQuantity(this.effectiveAllocationTotal)} ${this.product?.unit || ''}`
        },
        allocationDraftTotal() {
            return Object.values(this.allocationDraftQuantities).reduce((sum, value) => sum + Number(value || 0), 0)
        },
        canConfirmReceiptAllocation() {
            const requested = Number(this.allocationDraftQuantityText || 0)
            return requested > 0 && requested <= this.quantityAvailable && Math.abs(this.allocationDraftTotal - requested) <= 0.0001
        },
        eligibleLotIds() {
            return new Set(this.eligibleLots.map((lot) => lot.id))
        },
        allocationLayerCount() {
            return this.eligibleLots.length
        },
        selectedLot() {
            return this.lotOptions.find((lot) => lot.id === this.form.lotId) || null
        },
        requestedQuantity() {
            return Number(this.form.quantity) || 0
        },
        quantityStep() {
            return this.product?.trackingMode === 'unit' || this.product?.unit === 'pcs'
                ? 1
                : 0.5
        },
        totalStock() {
            return this.product
                ? this.store.productStock(this.product.id, { stockSource: 'standalone' })
                : 0
        },
        quantityAvailable() {
            if (!this.product || !this.form.sourceWarehouseId) return 0
            if (this.product.trackingMode === 'unit') return this.availableUnits.length
            if (!this.modeIsShip) return Number(this.selectedLot?.quantity || 0)
            const locationId = this.form.sourceLocationId && this.form.sourceLocationId !== '__auto__'
                ? this.form.sourceLocationId
                : ''
            const today = new Date().toISOString().slice(0, 10)
            return this.store.stockPositionsFor(this.product.id, {
                warehouseId: this.form.sourceWarehouseId,
                ...(locationId ? { locationId } : {}),
                stockSource: 'standalone',
            })
                .filter((position) => {
                    const lot = this.store.state.stockLots.find((item) => item.id === position.lotId)
                    return !(lot?.expiryDate && lot.expiryDate < today)
                })
                .reduce((sum, position) => sum + Number(position.availableQuantity || 0), 0)
        },
        labelSetCount() {
            if (!this.product) return 0
            return Number.isInteger(this.requestedQuantity) && this.requestedQuantity > 0
                ? this.requestedQuantity
                : 1
        },
        canShip() {
            if (this.modeIsShip && this.shipSource === 'batch') return Boolean(this.selectedBatch?.availableBatchCount > 0 && this.selectedBatchCount > 0 && this.selectedBatchCount <= this.selectedBatch.availableBatchCount)
            if (!this.modeIsShip && this.operationSource === 'batch') return Boolean(this.selectedBatch?.availableQuantity > 0)
            if (
                !this.product ||
                !this.form.sourceWarehouseId ||
                !(this.requestedQuantity > 0) ||
                this.requestedQuantity > this.quantityAvailable
            ) return false
            if (!this.modeIsShip && (!this.form.sourceLocationId || !this.form.lotId)) return false
            if (this.product.trackingMode === 'unit') {
                return (
                    Number.isInteger(this.requestedQuantity) &&
                    this.selectedIds.length === this.requestedQuantity
                )
            }
            return true
        },
        canSubmit() {
            if (!this.canShip) return false
            if (this.modeIsShip) return this.shipmentDetailsComplete
            if (this.modeIsMove) {
                return Boolean(
                    this.form.destinationWarehouseId &&
                    (!this.form.destinationLocationId || this.destinationLocationOptions.some((location) => location.id === this.form.destinationLocationId))
                )
            }
            if (this.modeIsRemove) return Boolean(this.form.photo)
            return true
        },
        shipmentDetailsComplete() {
            return Boolean(String(this.form.recipient || '').trim() && String(this.form.reference || '').trim())
        },
        shipReviewStock() {
            if (this.shipSource === 'batch') return `${this.selectedBatch?.id || '—'} · ${this.selectedBatchCount} batch${this.selectedBatchCount === 1 ? '' : 'es'}`
            return `${this.product?.name || '—'} · ${this.formatQuantity(this.requestedQuantity)} ${this.product?.unit || ''}`
        },
        shipReviewSource() {
            if (this.shipSource === 'batch') return this.batchSourceLocationLabel
            return [this.selectedWarehouse?.name, this.selectedLocation?.name || (this.form.sourceLocationId === '__auto__' ? 'Auto' : '')].filter(Boolean).join(' · ') || '—'
        },
        submitButtonLabel() {
            if (this.modeIsShip && this.shipSource === 'batch') return 'Ship Batch'
            if (!this.modeIsShip && this.operationSource === 'batch') return this.modeIsMove ? 'Create Batch Request' : 'Remove Batch'
            return this.modeIsShip ? 'Next' : this.modeIsMove ? 'Create Request' : 'Complete Remove'
        },
        historyRows() {
            if (this.modeIsShip) {
                return this.store.state.shipments.slice(0, 8).map((shipment) => ({
                    id: shipment.id,
                    productName: shipment.productName,
                    quantityLabel: `${shipment.quantity} ${shipment.unit}`,
                    locationLabel: shipment.sourceLocation,
                    createdAt: shipment.createdAt,
                    kind: 'ship',
                }))
            }
            if (this.modeIsMove) {
                return this.store.state.stockInRequests.slice(0, 8).map((request) => ({
                    id: request.id,
                    productName: request.sourceType === 'batch' ? `Batch ${request.batchId}` : (request.lines?.[0]?.productName || 'Product'),
                    quantityLabel: `${this.formatQuantity(request.totalQuantity)} total`,
                    locationLabel: `${request.destinationWarehouseName}${request.destinationLocationName ? ` · ${request.destinationLocationName}` : ''}`,
                    createdAt: request.createdAt,
                    kind: 'move',
                }))
            }
            return this.store.state.movements
                .filter((movement) => ['Stock Out', 'Damage', 'Expired', 'Lost'].includes(movement.type))
                .slice(0, 8)
                .map((movement) => ({
                    id: movement.id,
                    productName: movement.productName,
                    quantityLabel: `${Math.abs(movement.changedQuantity)} ${this.store.findProduct(movement.productId)?.unit || ''}`,
                    locationLabel: movement.reason || movement.type,
                    createdAt: movement.createdAt,
                    kind: 'remove',
                }))
        },
        historyTitle() {
            return this.modeIsShip ? 'Recent Shipments' : this.modeIsMove ? 'Recent Stock Movement Requests' : 'Recent Removals'
        },
        readiness() {
            if (this.modeIsShip && this.shipSource === 'batch') {
                if (!this.selectedBatch) return 'Select or scan a Batch to continue.'
                if (!this.shipmentDetailsComplete) return 'Add the recipient and reference before continuing.'
                return this.selectedBatch
                    ? `Ready to ship ${this.selectedBatchCount} batch${this.selectedBatchCount === 1 ? '' : 'es'} with ${this.formatQuantity(this.selectedBatch.recipePartCount * this.selectedBatchCount)} parts.`
                    : 'Select or scan a Batch to continue.'
            }
            if (!this.modeIsShip && this.operationSource === 'batch') {
                if (!this.selectedBatch) return 'Select or scan a registered batch to continue.'
                if (this.modeIsMove && this.moveStep === 1) return `Source ready: all ${this.formatQuantity(this.selectedBatch.availableQuantity)} parts under ${this.selectedBatch.id} will be included in the request.`
                if (this.modeIsMove && !this.form.destinationWarehouseId) return 'Select the destination warehouse.'
                                if (this.modeIsRemove && !this.form.photo) return 'Attach photo evidence for this batch removal.'
                return this.modeIsMove
                    ? `Ready to create a Stock In Request for all stock under ${this.selectedBatch.id}.`
                    : `Ready to remove all remaining stock under ${this.selectedBatch.id}.`
            }
            if (!this.product) return 'Select a product to continue.'
            if (!this.form.sourceWarehouseId) return 'Select a warehouse.'
            if (!this.modeIsShip && !this.form.sourceLocationId) return 'Select a location.'
            if (!this.modeIsShip && !this.form.lotId) return 'Select a receipt layer.'
            if (!(this.requestedQuantity > 0)) return 'Enter a quantity to ship.'
            if (this.requestedQuantity > this.quantityAvailable) return `Only ${this.formatQuantity(this.quantityAvailable)} usable ${this.product.unit} are available. Expired stock is excluded.`
            if (this.product.trackingMode === 'unit' && this.selectedIds.length !== this.requestedQuantity) {
                return 'The individual unit balance for this batch is inconsistent.'
            }
            if (this.modeIsShip && !this.shipmentDetailsComplete) return 'Add the recipient and reference before continuing.'
            if (this.modeIsMove && this.moveStep === 1) {
                return `Source ready: ${this.formatQuantity(this.requestedQuantity)} ${this.product.unit} from ${this.selectedLocation?.name || 'location'}.`
            }
            if (this.modeIsMove && !this.form.destinationWarehouseId) {
                return 'Select the destination warehouse.'
            }
                        if (this.modeIsRemove && !this.form.photo) return 'Attach photo evidence for this removal.'
            if (this.modeIsShip && this.product.trackingMode === 'unit') return `Ready for label setup: ${this.selectedIds.length} individual ${this.selectedIds.length === 1 ? 'unit' : 'units'} selected.`
            if (this.modeIsShip) return `Ready for label setup: ${this.formatQuantity(this.requestedQuantity)} ${this.product.unit}. Stock will be allocated automatically by FEFO / FIFO.`
            if (this.modeIsMove) return `Ready to create a Stock In Request for ${this.formatQuantity(this.requestedQuantity)} ${this.product.unit}.`
            return `Ready to remove ${this.formatQuantity(this.requestedQuantity)} ${this.product.unit}.`
        },
        canReturnToSource() {
            return ['dashboard', 'scan', 'warehouses'].includes(String(this.$route.query.from || ''))
        },
        trackingLabel() {
            return { unit: 'Individual units', batch: 'Expiry / lot', none: 'Quantity only', quantity: 'Quantity only' }[this.product?.trackingMode] || 'Quantity only'
        },
    },
    watch: {
        'form.productId'() {
            this.productMenuOpen = false
            this.selectedIds = []
            this.receiptLayerQuantities = {}
            this.fcfsEnabled = true
            this.form.sourceWarehouseId = ''
            this.form.sourceLocationId = ''
            this.form.lotId = ''
            this.form.quantity = '1'
            this.batchMenuOpen = false
            this.error = ''
            this.moveStep = 1
            this.form.destinationWarehouseId = ''
            this.form.destinationLocationId = ''
            this.$nextTick(() => this.applyPreferredWarehouse())
        },
        'form.sourceWarehouseId'() {
            if (!this.locationOptions.some((location) => location.id === this.form.sourceLocationId)) {
                this.form.sourceLocationId = ''
            }
            this.form.lotId = ''
            this.form.quantity = '1'
            this.batchMenuOpen = false
            this.selectedIds = []
            this.receiptLayerQuantities = {}
            if (this.modeIsShip && this.form.sourceWarehouseId) {
                const preferred = this.locationOptions.find((location) => location.id === this.preferredLocationId)
                this.form.sourceLocationId = preferred?.id || '__auto__'
            } else {
                this.$nextTick(() => this.applyPreferredLocation())
            }
        },
        'form.sourceLocationId'() {
            this.form.lotId = ''
            this.form.quantity = '1'
            this.batchMenuOpen = false
            this.selectedIds = []
            this.receiptLayerQuantities = {}
            if (this.modeIsShip) {
                this.$nextTick(() => this.syncSelectedBatchUnits())
                return
            }
            const preferredLot = this.lotOptions.find((lot) => lot.id === this.preferredLotId)
            const firstUsableLot = preferredLot || this.lotOptions[0]
            if (firstUsableLot) this.form.lotId = firstUsableLot.id
            this.$nextTick(() => {
                this.syncSelectedBatchUnits()
                if (!this.destinationLocationOptions.some((location) => location.id === this.form.destinationLocationId)) {
                    this.form.destinationLocationId = ''
                }
            })
        },
        'form.destinationWarehouseId'() {
            if (!this.destinationLocationOptions.some((location) => location.id === this.form.destinationLocationId)) {
                this.form.destinationLocationId = ''
            }
        },
        'form.lotId'() {
            this.batchMenuOpen = false
            if (!this.modeIsShip) {
                this.form.quantity = this.quantityAvailable > 0 ? '1' : ''
                this.normaliseQuantity()
            }
            this.syncSelectedBatchUnits()
        },
        'form.quantity'() {
            if (this.product?.trackingMode !== 'unit') this.syncSelectedBatchUnits()
        },
    },
    mounted() {
        this.form.reason = this.modeIsMove ? 'Warehouse stock movement' : this.modeIsRemove ? 'Damaged' : ''
        if (this.form.productId && !this.product) this.form.productId = ''
        if (this.$route.query.resume === '1') {
            try {
                const draft = JSON.parse(sessionStorage.getItem('ims_shipment_draft') || 'null')
                if (draft?.productId) {
                    this.form.productId = draft.productId
                    this.preferredWarehouseId = draft.sourceWarehouseId || ''
                    this.preferredLocationId = draft.sourceLocationId || ''
                    this.$nextTick(() => {
                        this.form.sourceWarehouseId = draft.sourceWarehouseId || ''
                        this.$nextTick(() => {
                            this.form.sourceLocationId = draft.sourceLocationId || '__auto__'
                            this.$nextTick(() => {
                                this.form.lotId = draft.lotId || ''
                                this.$nextTick(() => {
                                    this.form.quantity = String(draft.quantity || 1)
                                    this.fcfsEnabled = true
                                    this.receiptLayerQuantities = {}
                                    this.form.recipient = draft.recipient || ''
                                    this.form.reference = draft.reference || ''
                                    this.form.remark = draft.remark || ''
                                    this.detailsOpen = Boolean(draft.recipient || draft.reference || draft.remark)
                                    const availableIds = new Set(this.availableUnits.map((unit) => unit.id))
                                    const restoredIds = (draft.unitIds || []).filter((id) => availableIds.has(id))
                                    if (this.product?.trackingMode === 'unit' && restoredIds.length === Number(draft.quantity || 0)) {
                                        this.selectedIds = restoredIds
                                    } else {
                                        this.syncSelectedBatchUnits()
                                    }
                                })
                            })
                        })
                    })
                    return
                }
            } catch (error) {
                sessionStorage.removeItem('ims_shipment_draft')
            }
        }
        this.$nextTick(() => this.applyPreferredProduct())
    },
    methods: {
        openVoidShipment() {
            this.voidReason = ''
            this.voidShipmentError = ''
            this.voidShipmentOpen = true
        },
        closeVoidShipment() {
            if (this.voidShipmentBusy) return
            this.voidShipmentOpen = false
            this.voidShipmentError = ''
        },
        confirmVoidShipment() {
            if (!this.selectedShipment || !this.voidReason || this.voidShipmentBusy) return
            this.voidShipmentBusy = true
            this.voidShipmentError = ''
            try {
                const selectedId = this.selectedShipment.id
                const result = this.store.voidShipment({ shipmentId: selectedId, reason: this.voidReason })
                this.selectedShipment = result.shipments.find((shipment) => shipment.id === selectedId) || result.shipments[0]
                this.voidShipmentOpen = false
                this.store.addToast(result.batchShipmentId ? 'Batch shipment voided and stock restored.' : 'Shipment voided and stock restored.')
            } catch (error) {
                this.voidShipmentError = error.message
            } finally {
                this.voidShipmentBusy = false
            }
        },
        regenerateShipmentReference(mode = 'sequence') {
            this.form.reference = this.store.generateDocumentNumber('SHP', mode === 'random' ? 'random' : 'sequence')
        },
        goBack() {
            if (this.$route.query.from === 'scan') {
                const query = { code: String(this.$route.query.code || this.product?.bar || this.product?.sku || this.selectedBatchId || '') }
                if (this.$route.query.scanFrom) query.from = String(this.$route.query.scanFrom)
                this.$router.push({ name: 'scan', query })
                return
            }
            if (this.$route.query.from === 'warehouses') {
                this.$router.push({ name: 'warehouses' })
                return
            }
            this.$router.push({ name: 'dashboard' })
        },
        applyPreferredProduct() {
            if (this.form.productId) {
                this.applyPreferredWarehouse()
                return
            }
            if (this.preferredWarehouseId && this.activeProducts.length === 1) {
                this.form.productId = this.activeProducts[0].id
                return
            }
            this.applyPreferredWarehouse()
        },
        applyPreferredWarehouse() {
            if (!this.product) return
            const preferred = this.warehouseOptions.find((item) => item.id === this.preferredWarehouseId)
            if (preferred) this.form.sourceWarehouseId = preferred.id
            else if (this.warehouseOptions.length === 1) this.form.sourceWarehouseId = this.warehouseOptions[0].id
        },
        applyPreferredLocation() {
            if (!this.form.sourceWarehouseId) return
            const preferred = this.locationOptions.find((item) => item.id === this.preferredLocationId)
            if (preferred) this.form.sourceLocationId = preferred.id
            else if (this.locationOptions.length === 1) this.form.sourceLocationId = this.locationOptions[0].id
        },
        nextMoveStep() {
            this.error = ''
            if (!this.canShip) {
                this.error = this.readiness
                return
            }
            this.moveStep = 2
        },
        advanceShipStage() {
            this.error = ''
            if (this.shipStep === 1) {
                if (!this.canShip) { this.error = this.readiness; return }
                this.shipStep = 2
                return
            }
            if (this.shipStep === 2) {
                if (!this.shipmentDetailsComplete) { this.error = 'Recipient and reference are required.'; return }
                this.shipStep = 3
                return
            }
            this.submit()
        },
        submit() {
            this.error = ''
            if (!this.canSubmit) {
                this.error = this.readiness
                return
            }
            if (this.modeIsShip && this.shipSource === 'batch') {
                const draft = {
                    kind: 'batch',
                    batchId: this.selectedBatch.id,
                    batchCount: Number(this.selectedBatchCount),
                    quantity: this.selectedBatch.recipePartCount * Number(this.selectedBatchCount),
                    recipient: this.form.recipient,
                    reference: this.form.reference,
                    remark: this.form.remark,
                    createdAt: new Date().toISOString(),
                }
                sessionStorage.removeItem('ims_shipment_draft')
                sessionStorage.setItem('ims_batch_shipment_draft', JSON.stringify(draft))
                this.$router.push({ name: 'labels', query: { draft: 'batch-shipment' } })
                return
            }
            if (this.modeIsShip) {
                const draft = {
                    kind: 'product',
                    productId: this.product.id,
                    sourceWarehouseId: this.form.sourceWarehouseId,
                    sourceLocationId: this.form.sourceLocationId === '__auto__' ? '' : this.form.sourceLocationId,
                    lotId: '',
                    batchNumber: '',
                    allocationMethod: 'FEFO/FIFO',
                    lotAllocations: this.effectiveLotAllocations.map((allocation) => ({ ...allocation })),
                    quantity: this.requestedQuantity,
                    unitIds: [...this.selectedIds],
                    recipient: this.form.recipient,
                    reference: this.form.reference,
                    remark: this.form.remark,
                    createdAt: new Date().toISOString(),
                }
                sessionStorage.removeItem('ims_batch_shipment_draft')
                sessionStorage.setItem('ims_shipment_draft', JSON.stringify(draft))
                this.$router.push({ name: 'labels', query: { draft: 'shipment' } })
                return
            }
            try {
                if (!this.modeIsShip && this.operationSource === 'batch') {
                    if (this.modeIsMove) {
                        const request = this.store.createStockInRequest({
                            sourceType: 'batch',
                            batchId: this.selectedBatch.id,
                            destinationWarehouseId: this.form.destinationWarehouseId,
                            destinationLocationId: this.form.destinationLocationId,
                            reason: this.form.reason,
                            reference: this.form.reference,
                            remark: this.form.remark,
                            photo: this.form.photo,
                        })
                        this.createdRequest = request
                        this.store.addToast(`${request.id} created. Destination stock will update after confirmation.`)
                    } else {
                        const removal = this.store.removeRegisteredBatch({
                            batchId: this.selectedBatch.id,
                            reason: this.form.reason,
                            reference: this.form.reference,
                            remark: this.form.remark,
                            photo: this.form.photo,
                        })
                        this.store.addToast(`${removal.batchId} stock removed completely.`)
                    }
                    if (!this.modeIsMove) this.$router.push({ name: 'history' })
                    return
                }
                if (this.modeIsMove) {
                    const request = this.store.createStockInRequest({
                        sourceType: 'product',
                        productId: this.product.id,
                        quantity: this.requestedQuantity,
                        sourceWarehouseId: this.form.sourceWarehouseId,
                        sourceLocationId: this.form.sourceLocationId,
                        destinationWarehouseId: this.form.destinationWarehouseId,
                        destinationLocationId: this.form.destinationLocationId,
                        lotId: this.form.lotId,
                        unitIds: [...this.selectedIds],
                        reason: this.form.reason,
                        reference: this.form.reference,
                        remark: this.form.remark,
                        photo: this.form.photo,
                    })
                    this.createdRequest = request
                    this.store.addToast(`${request.id} created. Destination stock will update after confirmation.`)
                } else {
                    const result = this.store.adjustStock({
                        productId: this.product.id,
                        quantity: this.requestedQuantity,
                        sourceWarehouseId: this.form.sourceWarehouseId,
                        sourceLocationId: this.form.sourceLocationId,
                        lotId: this.form.lotId,
                        unitIds: [...this.selectedIds],
                        direction: 'out',
                        reason: this.form.reason,
                        reference: this.form.reference,
                        remark: this.form.remark,
                        photo: this.form.photo,
                    })
                    this.store.addToast(`${result.product.name} removed.`)
                }
                if (!this.modeIsMove) this.$router.push({ name: 'history' })
            } catch (error) {
                this.error = error.message
            }
        },
        finishCreatedRequest() {
            this.createdRequest = null
            this.$router.push({ name: 'stock-movement-requests', query: { from: 'dispatch' } })
        },
        receiveCreatedRequest() {
            const requestId = this.createdRequest?.id || ''
            this.createdRequest = null
            this.$router.push({ name: 'stock-movement-requests', query: { from: 'dispatch', request: requestId } })
        },
        loadPhoto(event) {
            const file = event.target.files?.[0]
            if (!file) {
                this.photoFileName = ''
                return
            }
            if (file.size > 1500000) {
                this.error = 'Choose a photo smaller than 1.5 MB.'
                this.photoFileName = ''
                event.target.value = ''
                return
            }
            this.photoFileName = file.name
            const reader = new FileReader()
            reader.onload = () => {
                this.form.photo = String(reader.result || '')
            }
            reader.readAsDataURL(file)
        },
        selectedLotLabel(lot) {
            return `Receipt ${lot.displayIndex} · ${lot.batchNumber}`
        },
        lotListLabel(lot) {
            if (lot.expired) return `Receipt ${lot.displayIndex} · ${lot.batchNumber} · Expired`
            return `Receipt ${lot.displayIndex} · ${lot.batchNumber} · ${this.formatQuantity(lot.quantity)} ${this.product?.unit || ''}`
        },
        selectProduct(product) {
            if (!product) return
            this.form.productId = product.id
            this.productMenuOpen = false
        },
        closeProductMenu(event) {
            if (!event.currentTarget.contains(event.relatedTarget)) {
                this.productMenuOpen = false
            }
        },
        selectLot(lot) {
            if (!lot || (this.modeIsShip && lot.expired)) return
            this.form.lotId = lot.id
            this.batchMenuOpen = false
        },
        closeBatchMenu(event) {
            if (!event.currentTarget.contains(event.relatedTarget)) {
                this.batchMenuOpen = false
            }
        },
        selectQuantityInput(event) {
            event?.target?.select?.()
        },
        handleQuantityInput(event) {
            const wholeNumber = this.product?.trackingMode === 'unit' || this.product?.unit === 'pcs'
            let value = String(event?.target?.value ?? this.form.quantity ?? '')
            if (wholeNumber) {
                value = value.replace(/\D/g, '')
            } else {
                value = value.replace(/[^0-9.]/g, '')
                const dot = value.indexOf('.')
                if (dot >= 0) value = value.slice(0, dot + 1) + value.slice(dot + 1).replace(/\./g, '')
            }
            this.form.quantity = value
            if (event?.target && event.target.value !== value) event.target.value = value
        },
        normaliseQuantity() {
            if (!this.product || !this.form.sourceWarehouseId || (!this.modeIsShip && !this.selectedLot)) {
                this.form.quantity = ''
                return
            }
            if (!this.fcfsEnabled && this.manualAllocationTotal > 0) {
                this.form.quantity = String(this.manualAllocationTotal)
                return
            }
            let value = Number(this.form.quantity)
            if (!Number.isFinite(value) || value <= 0) value = this.quantityStep
            const wholeNumber = this.product?.trackingMode === 'unit' || this.product?.unit === 'pcs'
            if (wholeNumber) value = Math.round(value)
            value = Math.max(this.quantityStep, Math.min(this.quantityAvailable, value))
            this.form.quantity = String(value)
            this.syncSelectedBatchUnits()
        },
        buildFcfsAllocations(requestedQuantity) {
            let remaining = Math.max(0, Number(requestedQuantity) || 0)
            const allocations = []
            this.receiptLayersByArrival.forEach((layer) => {
                if (remaining <= 0) return
                const quantity = Math.min(remaining, Number(layer.availableQuantity || 0))
                if (quantity > 0) allocations.push({ lotId: layer.id, quantity: Number(quantity.toFixed(4)) })
                remaining = Number((remaining - quantity).toFixed(4))
            })
            return allocations
        },
        receiptLayerLocations(layer) {
            if (!this.product || !layer) return 'No location'
            const selectedLocationId = this.form.sourceLocationId && this.form.sourceLocationId !== '__auto__'
                ? this.form.sourceLocationId
                : ''
            const names = this.store.stockPositionsFor(this.product.id, {
                warehouseId: this.form.sourceWarehouseId,
                ...(selectedLocationId ? { locationId: selectedLocationId } : {}),
                lotId: layer.id,
                stockSource: 'standalone',
            })
                .filter((position) => Number(position.availableQuantity || 0) > 0)
                .map((position) => this.store.findLocation(position.warehouseId, position.locationId)?.name || position.location)
                .filter(Boolean)
            return [...new Set(names)].join(', ') || 'No location'
        },
        toggleFcfsMode() {
            if (this.fcfsEnabled) {
                this.fcfsEnabled = false
                this.receiptLayerQuantities = Object.fromEntries(
                    this.fcfsLotAllocations.map((item) => [item.lotId, item.quantity]),
                )
            } else {
                this.fcfsEnabled = true
                this.receiptLayerQuantities = {}
            }
            if (this.allocationPickerOpen) this.syncAllocationDraftFromMode()
        },
        toggleFcfsModeInPicker() {
            this.toggleFcfsMode()
        },
        syncAllocationDraftFromMode() {
            const requested = Math.max(this.quantityStep, Math.min(this.quantityAvailable, Number(this.allocationDraftQuantityText || this.requestedQuantity || this.quantityStep)))
            this.allocationDraftQuantityText = String(Number(requested.toFixed(4)))
            if (this.fcfsEnabled) {
                this.allocationDraftQuantities = Object.fromEntries(
                    this.buildFcfsAllocations(requested).map((item) => [item.lotId, item.quantity]),
                )
                return
            }
            const source = Object.keys(this.allocationDraftQuantities).length
                ? this.allocationDraftQuantities
                : this.receiptLayerQuantities
            this.allocationDraftQuantities = this.fitManualAllocationToTotal(source, requested)
        },
        fitManualAllocationToTotal(source, requestedTotal) {
            const next = {}
            let current = 0
            this.receiptLayersByArrival.forEach((layer) => {
                const quantity = Math.max(0, Math.min(Number(layer.availableQuantity || 0), Number(source?.[layer.id] || 0)))
                if (quantity > 0) {
                    next[layer.id] = Number(quantity.toFixed(4))
                    current += quantity
                }
            })
            let difference = Number((requestedTotal - current).toFixed(4))
            if (difference > 0) {
                this.receiptLayersByArrival.forEach((layer) => {
                    if (difference <= 0) return
                    const currentLayer = Number(next[layer.id] || 0)
                    const capacity = Math.max(0, Number(layer.availableQuantity || 0) - currentLayer)
                    const add = Math.min(capacity, difference)
                    if (add > 0) next[layer.id] = Number((currentLayer + add).toFixed(4))
                    difference = Number((difference - add).toFixed(4))
                })
            } else if (difference < 0) {
                let remove = Math.abs(difference)
                this.receiptLayersByArrival.slice().reverse().forEach((layer) => {
                    if (remove <= 0) return
                    const currentLayer = Number(next[layer.id] || 0)
                    const take = Math.min(currentLayer, remove)
                    const remaining = Number((currentLayer - take).toFixed(4))
                    if (remaining > 0) next[layer.id] = remaining
                    else delete next[layer.id]
                    remove = Number((remove - take).toFixed(4))
                })
            }
            return next
        },
        openReceiptAllocationPicker() {
            if (!this.receiptLayers.length) return
            this.allocationPickerSnapshot = {
                quantity: this.form.quantity,
                quantities: { ...this.receiptLayerQuantities },
                fcfsEnabled: this.fcfsEnabled,
            }
            const quantity = Math.max(this.quantityStep, Math.min(this.quantityAvailable, this.requestedQuantity || this.quantityStep))
            this.allocationDraftQuantityText = String(Number(quantity.toFixed(4)))
            this.allocationDraftQuantities = this.fcfsEnabled
                ? Object.fromEntries(this.buildFcfsAllocations(quantity).map((item) => [item.lotId, item.quantity]))
                : this.fitManualAllocationToTotal(this.receiptLayerQuantities, quantity)
            // Start with automatic first-arrival allocation, but allow direct manual adjustment.
            this.fcfsEnabled = false
            this.allocationPickerOpen = true
        },
        handleAllocationTotalInput(event) {
            let value = String(event?.target?.value ?? this.allocationDraftQuantityText ?? '')
            if (this.quantityStep === 1) value = value.replace(/\D/g, '')
            else {
                value = value.replace(/[^0-9.]/g, '')
                const dot = value.indexOf('.')
                if (dot >= 0) value = value.slice(0, dot + 1) + value.slice(dot + 1).replace(/\./g, '')
            }
            this.allocationDraftQuantityText = value
            if (event?.target && event.target.value !== value) event.target.value = value
            if (!value) {
                this.allocationDraftQuantities = {}
                return
            }
            const requested = Math.max(0, Math.min(this.quantityAvailable, Number(value) || 0))
            this.allocationDraftQuantities = this.fcfsEnabled
                ? Object.fromEntries(this.buildFcfsAllocations(requested).map((item) => [item.lotId, item.quantity]))
                : this.fitManualAllocationToTotal(this.allocationDraftQuantities, requested)
        },
        normaliseAllocationTotal() {
            let requested = Number(this.allocationDraftQuantityText)
            if (!Number.isFinite(requested) || requested <= 0) requested = this.quantityStep
            if (this.quantityStep === 1) requested = Math.round(requested)
            requested = Math.max(this.quantityStep, Math.min(this.quantityAvailable, requested))
            this.allocationDraftQuantityText = String(Number(requested.toFixed(4)))
            this.allocationDraftQuantities = this.fcfsEnabled
                ? Object.fromEntries(this.buildFcfsAllocations(requested).map((item) => [item.lotId, item.quantity]))
                : this.fitManualAllocationToTotal(this.allocationDraftQuantities, requested)
        },
        allocationDraftQuantity(lotId) {
            return Number(this.allocationDraftQuantities[lotId] || 0)
        },
        adjustAllocationDraft(layer, delta) {
            if (!layer) return
            const next = { ...this.allocationDraftQuantities }
            const current = Number(next[layer.id] || 0)
            const wholeNumber = this.quantityStep === 1
            let quantity = Math.max(0, Math.min(Number(layer.availableQuantity || 0), current + Number(delta || 0)))
            quantity = wholeNumber ? Math.round(quantity) : Number(quantity.toFixed(2))
            if (quantity > 0) next[layer.id] = quantity
            else delete next[layer.id]
            this.allocationDraftQuantities = next
            const total = Object.values(next).reduce((sum, value) => sum + Number(value || 0), 0)
            this.allocationDraftQuantityText = total > 0 ? String(Number(total.toFixed(4))) : ''
        },
        cancelReceiptAllocationPicker() {
            if (this.allocationPickerSnapshot) {
                this.form.quantity = this.allocationPickerSnapshot.quantity
                this.receiptLayerQuantities = { ...this.allocationPickerSnapshot.quantities }
                this.fcfsEnabled = this.allocationPickerSnapshot.fcfsEnabled
            }
            this.allocationPickerOpen = false
            this.allocationDraftQuantities = {}
            this.allocationPickerSnapshot = null
        },
        confirmReceiptAllocationPicker() {
            this.normaliseAllocationTotal()
            if (!this.canConfirmReceiptAllocation) return
            this.form.quantity = String(Number(this.allocationDraftTotal.toFixed(4)))
            this.receiptLayerQuantities = { ...this.allocationDraftQuantities }
            this.fcfsEnabled = false
            this.allocationPickerOpen = false
            this.allocationPickerSnapshot = null
            this.error = ''
        },
        isReceiptLayerSelected(lotId) {
            return Number(this.receiptLayerQuantities[lotId] || 0) > 0
        },
        receiptLayerQuantity(lotId) {
            return Number(this.receiptLayerQuantities[lotId] || 0)
        },
        syncReceiptLayerQuantity(next) {
            this.receiptLayerQuantities = next
            const total = Object.values(next).reduce((sum, value) => sum + Number(value || 0), 0)
            if (total > 0) this.form.quantity = String(Number(total.toFixed(4)))
        },
        toggleReceiptLayer(layer) {
            if (!layer) return
            const next = { ...this.receiptLayerQuantities }
            if (Number(next[layer.id] || 0) > 0) {
                delete next[layer.id]
            } else {
                const preferred = Object.keys(next).length
                    ? this.quantityStep
                    : Math.max(this.quantityStep, this.requestedQuantity || this.quantityStep)
                next[layer.id] = Math.min(Number(layer.availableQuantity || 0), preferred)
            }
            this.syncReceiptLayerQuantity(next)
            if (!Object.keys(next).length) this.form.quantity = String(Math.min(this.quantityAvailable, Math.max(this.quantityStep, this.requestedQuantity || this.quantityStep)))
        },
        adjustReceiptLayer(layer, delta) {
            if (!layer) return
            const next = { ...this.receiptLayerQuantities }
            const current = Number(next[layer.id] || 0)
            const wholeNumber = this.product?.trackingMode === 'unit' || this.product?.unit === 'pcs'
            let quantity = Math.max(0, Math.min(Number(layer.availableQuantity || 0), current + Number(delta || 0)))
            quantity = wholeNumber ? Math.round(quantity) : Number(quantity.toFixed(2))
            if (quantity > 0) next[layer.id] = quantity
            else delete next[layer.id]
            this.syncReceiptLayerQuantity(next)
            if (!Object.keys(next).length) this.form.quantity = String(this.quantityStep)
        },
        resetReceiptAllocation() {
            this.receiptLayerQuantities = {}
            const nextQuantity = Math.max(this.quantityStep, Math.min(this.quantityAvailable || this.quantityStep, this.requestedQuantity || this.quantityStep))
            this.form.quantity = String(nextQuantity)
        },
        unitOrdinal(unit) {
            const direct = Number(unit?.displayOrdinal || unit?.batchPartOrdinal || unit?.batchOrdinal || unit?.ordinal)
            if (direct > 0) return direct
            const suffix = String(unit?.code || '').match(/(\d+)$/)
            return suffix ? Number(suffix[1]) : Number.MAX_SAFE_INTEGER
        },
        openUnitPicker() {
            if (!this.availableUnits.length) return
            this.unitPickerSnapshot = {
                quantity: this.form.quantity,
                ids: [...this.selectedIds],
            }
            this.unitPickerIds = this.selectedIds.length
                ? [...this.selectedIds]
                : this.availableUnits.slice(0, Math.max(1, Math.round(this.requestedQuantity || 1))).map((unit) => unit.id)
            this.unitPickerQuantityText = String(this.unitPickerIds.length)
            this.unitPickerOpen = true
        },
        handleUnitPickerQuantityInput(event) {
            const value = String(event?.target?.value ?? this.unitPickerQuantityText ?? '').replace(/\D/g, '')
            this.unitPickerQuantityText = value
            if (event?.target && event.target.value !== value) event.target.value = value
            if (value === '') {
                this.unitPickerIds = []
                return
            }
            this.applyUnitPickerQuantity(Number(value))
        },
        normaliseUnitPickerQuantity() {
            if (this.unitPickerQuantityText === '') return
            this.applyUnitPickerQuantity(Number(this.unitPickerQuantityText))
        },
        applyUnitPickerQuantity(requested) {
            if (!this.availableUnits.length) {
                this.unitPickerIds = []
                this.unitPickerQuantityText = ''
                return
            }
            const quantity = Math.max(0, Math.min(this.availableUnits.length, Math.round(Number(requested) || 0)))
            this.unitPickerQuantityText = quantity ? String(quantity) : ''
            this.unitPickerIds = this.availableUnits.slice(0, quantity).map((unit) => unit.id)
        },
        toggleUnitPicker(unitId) {
            if (this.unitPickerIds.includes(unitId)) {
                this.unitPickerIds = this.unitPickerIds.filter((id) => id !== unitId)
            } else {
                this.unitPickerIds = [...this.unitPickerIds, unitId]
            }
            const order = new Map(this.availableUnits.map((unit, index) => [unit.id, index]))
            this.unitPickerIds.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
            this.unitPickerQuantityText = String(this.unitPickerIds.length)
        },
        cancelUnitPicker() {
            this.unitPickerOpen = false
            this.unitPickerIds = []
            this.unitPickerQuantityText = String(this.selectedIds.length || 1)
            this.unitPickerSnapshot = null
        },
        confirmUnitPicker() {
            if (!this.unitPickerIds.length) return
            this.selectedIds = [...this.unitPickerIds]
            this.form.quantity = String(this.selectedIds.length)
            this.unitPickerOpen = false
            this.unitPickerSnapshot = null
            this.error = ''
        },
        syncSelectedBatchUnits() {
            if (this.product?.trackingMode === 'unit' && this.form.sourceWarehouseId) {
                const required = Math.max(0, Math.round(this.requestedQuantity))
                this.selectedIds = this.availableUnits.slice(0, required).map((unit) => unit.id)
                return
            }
            this.selectedIds = []
        },
        handleScan(value) {
            this.scannerOpen = false
            this.productMenuOpen = false
            const batch = this.store.findBatch(value)
            if (batch) {
                if (this.modeIsShip) {
                    if (batch.availableBatchCount <= 0) {
                        this.error = 'This batch has no complete sets available.'
                        return
                    }
                    this.shipSource = 'batch'
                    this.selectedBatchId = batch.id
                    this.selectedBatchCount = 1
                    this.error = ''
                    return
                }
                if (batch.availableQuantity <= 0) {
                    this.error = 'This batch has no stock available.'
                    return
                }
                this.operationSource = 'batch'
                this.selectedBatchId = batch.id
                this.moveStep = 1
                this.form.destinationWarehouseId = ''
                this.form.destinationLocationId = ''
                this.error = ''
                return
            }
            const unit = this.store.findStockUnit(value)
            if (unit) {
                if (!this.modeIsShip) this.operationSource = 'product' 
                if (unit.status !== 'available') {
                    this.error = 'This unit is unavailable.'
                    return
                }
                if (this.selectedIds.includes(unit.id)) {
                    this.error = 'This unit was already scanned.'
                    return
                }
                this.form.productId = unit.productId
                this.preferredWarehouseId = unit.warehouseId
                this.preferredLocationId = unit.locationId
                this.$nextTick(() => {
                    this.form.sourceWarehouseId = unit.warehouseId
                    this.$nextTick(() => {
                        this.form.sourceLocationId = unit.locationId
                        this.$nextTick(() => {
                            if (!this.modeIsShip) this.form.lotId = unit.lotId
                            this.selectedIds = [unit.id]
                            this.form.quantity = '1'
                        })
                    })
                })
                this.error = ''
                return
            }
            const product = this.store.findProduct(value)
            if (!product || !product.active) {
                this.error = 'Barcode not found.'
                return
            }
            if (!this.modeIsShip) this.operationSource = 'product'
            this.form.productId = product.id
            this.error = ''
        },
        selectOperationSource(source) {
            if (!['product', 'batch'].includes(source) || source === this.operationSource) return
            this.operationSource = source
            this.error = ''
            this.moveStep = 1
            this.form.destinationWarehouseId = ''
            this.form.destinationLocationId = ''
            if (source === 'product') {
                this.selectedBatchId = ''
                this.wholeBatchMenuOpen = false
            } else {
                this.form.productId = ''
                this.form.sourceWarehouseId = ''
                this.form.sourceLocationId = ''
                this.form.lotId = ''
                this.selectedIds = []
            }
        },
        selectOperationBatch(batch) {
            if (!batch || !(Number(batch.availableQuantity) > 0)) return
            this.operationSource = 'batch'
            this.selectedBatchId = batch.id
            this.wholeBatchMenuOpen = false
            this.error = ''
            this.moveStep = 1
            this.form.destinationWarehouseId = ''
            this.form.destinationLocationId = ''
        },
        selectShipSource(source) {
            this.shipSource = source
            this.error = ''
            if (source === 'product') this.selectedBatchId = ''
            else {
                this.form.productId = ''
                this.selectedBatchCount = 1
            }
        },
        historyIcon(row) {
            if (row.kind === 'move') return 'fa-right-left'
            if (row.kind === 'remove') return 'fa-trash-can'
            return 'fa-truck-arrow-right'
        },
        formatQuantity(value) {
            return new Intl.NumberFormat('en-MY', { maximumFractionDigits: 2 }).format(Number(value) || 0)
        },
        formatShortDate(value) {
            if (!value) return '—'
            return new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
        },
        formatDate(value) {
            return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
        },
    },
}
</script>

<style scoped src="@/assets/css/pages/dispatch.css"></style>
