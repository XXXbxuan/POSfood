<template>
    <div class="wv2-page">
        <header class="wv2-heading wv2-heading-with-warehouses">
            <div class="page-title-row">
                <button v-if="$route.query.from === 'dashboard'" class="page-back-link" type="button" @click="goBack">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Back</span>
                </button>
                <h1 class="inventory-page-title">Warehouses</h1>
            </div>

            <nav class="wv2-warehouse-tabs" aria-label="Select warehouse">
                <button
                    v-for="warehouse in warehouses"
                    :key="warehouse.id"
                    class="wv2-warehouse-tab"
                    :class="{ active: warehouse.id === selectedWarehouseId }"
                    type="button"
                    @click="selectWarehouseCard(warehouse)"
                >
                    <i class="fa-solid fa-boxes-stacked"></i>
                    <span>
                        <strong>{{ warehouse.name }}</strong>
                        <small>{{ warehouse.code }}</small>
                    </span>
                </button>
                <button
                    v-if="canManage"
                    class="wv2-warehouse-tab wv2-warehouse-add"
                    type="button"
                    aria-label="Add warehouse"
                    title="Add warehouse"
                    @click="openWarehouseForm()"
                >
                    <i class="fa-solid fa-plus"></i>
                </button>
            </nav>
        </header>

        <section
            v-if="selectedWarehouse && summary && warehouseInventory"
            class="wv2-workspace wv2-inventory-workspace"
            :class="{ 'is-counting': stockCount }"
        >
            <nav v-if="!stockCount" class="wv2-location-filter wv2-location-filter--primary" aria-label="Filter warehouse inventory by location">
                <button type="button" :class="{ active: !selectedLocationFilterId }" @click="selectLocationFilter('')">All</button>
                <button
                    v-for="row in locationRows"
                    :key="`filter-${row.location.id}`"
                    type="button"
                    :class="{ active: selectedLocationFilterId === row.location.id }"
                    @click="selectLocationCard(row)"
                >{{ row.location.name }}</button>
                <button
                    v-if="canManage"
                    class="wv2-location-add"
                    type="button"
                    aria-label="Add location"
                    title="Add location"
                    @click="openLocationForm()"
                >
                    <i class="fa-solid fa-plus"></i>
                </button>
            </nav>

            <header class="wv2-inventory-toolbar">
                <nav v-if="!stockCount" class="wv2-inventory-tabs" aria-label="Warehouse inventory type">
                    <button type="button" :class="{ active: inventoryMode === 'product' }" @click="inventoryMode = 'product'">
                        <i class="fa-solid fa-box"></i>
                        Products
                        <strong>{{ warehouseInventory.productCount }}</strong>
                    </button>
                    <button type="button" :class="{ active: inventoryMode === 'batch' }" @click="inventoryMode = 'batch'">
                        <i class="fa-solid fa-layer-group"></i>
                        Batches
                        <strong>{{ warehouseInventory.batchCount }}</strong>
                    </button>
                </nav>

                <div v-if="!stockCount" class="wv2-location-actions">
                    <button v-if="canReceive" class="wv2-button wv2-button-in" type="button" @click="openStockIn(selectedFilterLocation)">
                        <i class="fa-solid fa-arrow-down"></i>
                        Stock In
                    </button>
                    <button v-if="canIssue && summary.totalStock > 0" class="wv2-button wv2-button-out" type="button" @click="openStockOut(selectedFilterLocation)">
                        <i class="fa-solid fa-trash-can"></i>
                        Stock Out
                    </button>
                    <button
                        v-if="canCount && summary.totalStock > 0"
                        class="wv2-button wv2-button-count"
                        type="button"
                        aria-label="Stock Count"
                        title="Stock Count"
                        @click="startStockCount"
                    >
                        <i class="fa-solid fa-list-check"></i>
                    </button>
                    <button
                        v-if="canIssue && summary.totalStock > 0"
                        class="wv2-button wv2-button-movement wv2-button-icon-only"
                        type="button"
                        aria-label="Stock Movement"
                        title="Stock Movement"
                        @click="openStockMovement(selectedFilterLocation)"
                    >
                        <i class="fa-solid fa-right-left"></i>
                    </button>
                </div>
                <div v-else class="wv2-count-mode-bar">
                    <div class="wv2-count-mode-title">
                        <i class="fa-solid fa-list-check"></i>
                        <strong>Stock Count</strong>
                    </div>
                    <nav class="wv2-count-location-filter" aria-label="Filter stock count by location">
                        <button type="button" :class="{ active: !countLocationFilterId }" @click="countLocationFilterId = ''">All</button>
                        <button
                            v-for="row in locationRows"
                            :key="`count-filter-${row.location.id}`"
                            type="button"
                            :class="{ active: countLocationFilterId === row.location.id }"
                            @click="countLocationFilterId = row.location.id"
                        >{{ row.location.name }}</button>
                    </nav>
                </div>
            </header>

            <section class="wv2-inventory-panel" :class="{ 'is-counting': stockCount }">
                <header v-if="stockCount" class="wv2-count-columns">
                    <span>PRODUCT</span>
                    <span>LOCATION</span>
                    <span>PHYSICAL QUANTITY</span>
                </header>
                <header v-else class="wv2-inventory-columns" :class="`is-${inventoryMode}`">
                    <span>{{ inventoryMode === 'batch' ? 'BATCH' : 'PRODUCT' }}</span>
                    <span>{{ inventoryMode === 'batch' ? 'RECIPE' : 'CODE' }}</span>
                    <span>LOCATION</span>
                    <span>STOCK</span>
                    <span>STATUS</span>
                    <span></span>
                </header>

                <div v-if="stockCount" class="wv2-count-list">
                    <article v-for="line in filteredCountLines" :key="line.positionId" class="wv2-count-row">
                        <div class="wv2-count-product">
                            <span class="wv2-product-symbol">{{ initials(line.productName) }}</span>
                            <span>
                                <strong>{{ line.productName }}</strong>
                                <small class="wv2-count-source-line">
                                    <span class="mono">{{ line.sku }}</span>
                                    <span
                                        class="wv2-count-source"
                                        :class="line.stockSource === 'batch' ? 'is-batch' : 'is-product'"
                                    >{{ line.sourceLabel }}</span>
                                </small>
                            </span>
                        </div>
                        <div class="wv2-count-location">
                            <strong>{{ line.locationName }}</strong>
                            <small>{{ line.lotCode }} · {{ formatCountDate(line.receivedDate) }}</small>
                        </div>
                        <div class="wv2-count-control">
                            <button type="button" aria-label="Decrease quantity" @click="changeCount(line, -countStep(line))">
                                <i class="fa-solid fa-minus"></i>
                            </button>
                            <label>
                                <input v-model.number="line.countedQuantity" :step="countStep(line)" min="0" type="number" @input="stockCountError = ''">
                                <span>{{ line.unit }}</span>
                            </label>
                            <button type="button" aria-label="Increase quantity" @click="changeCount(line, countStep(line))">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    </article>
                    <div v-if="!filteredCountLines.length" class="wv2-count-empty">
                        <i class="fa-solid fa-box-open"></i>
                        <strong>{{ countLocationFilterId ? 'No stock positions in this location' : 'No stock positions in this warehouse' }}</strong>
                    </div>
                </div>

                <div v-else-if="pagedInventoryRows.length" class="wv2-inventory-list">
                    <button
                        v-for="row in pagedInventoryRows"
                        :key="`${inventoryMode}-${row.id}`"
                        type="button"
                        class="wv2-inventory-row"
                        :class="`is-${inventoryMode}`"
                        @click="openWarehouseInventoryRow(row)"
                    >
                        <span class="wv2-inventory-identity">
                            <span class="wv2-product-symbol">
                                <i v-if="inventoryMode === 'batch'" class="fa-solid fa-layer-group"></i>
                                <template v-else>{{ initials(row.name) }}</template>
                            </span>
                            <span>
                                <strong>{{ inventoryMode === 'batch' ? row.id : row.name }}</strong>
                                <small v-if="inventoryMode === 'batch'">Registered batch</small>
                                <small v-else>{{ row.unit }} · {{ row.category }}</small>
                            </span>
                        </span>

                        <span class="wv2-inventory-secondary">
                            <template v-if="inventoryMode === 'batch'">
                                <strong>{{ row.productCount }}</strong>
                                <small>{{ row.productCount === 1 ? 'product' : 'products' }} · {{ formatNumber(row.recipePartCount) }} parts / batch</small>
                            </template>
                            <template v-else>
                                <strong class="mono">{{ row.sku }}</strong>
                                <small>{{ row.category }}</small>
                            </template>
                        </span>

                        <span class="wv2-inventory-location">
                            <strong>{{ inventoryLocationLabel(row) }}</strong>
                        </span>

                        <span class="wv2-inventory-stock">
                            <template v-if="inventoryMode === 'batch'">
                                <strong>{{ row.warehouseAvailableBatchCount }}</strong>
                                <small>complete · {{ formatNumber(row.warehouseAvailableQuantity) }} parts</small>
                            </template>
                            <template v-else>
                                <strong class="wv2-inventory-stock-value">
                                    <span>{{ formatNumber(row.quantity) }}</span>
                                    <em>{{ row.unit }}</em>
                                </strong>
                            </template>
                        </span>

                        <span class="wv2-status" :class="inventoryStatusClass(row)">
                            {{ inventoryStatusLabel(row) }}
                        </span>
                        <i class="fa-solid fa-chevron-right wv2-inventory-chevron" aria-hidden="true"></i>
                    </button>
                </div>

                <div v-else class="wv2-inventory-empty">
                    <i class="fa-solid" :class="inventoryMode === 'batch' ? 'fa-layer-group' : 'fa-box'"></i>
                    <strong>No {{ inventoryMode === 'batch' ? 'batch stock' : 'product stock' }} in this warehouse</strong>
                </div>

                <footer v-if="stockCount" class="wv2-count-footer">
                    <span v-if="stockCountError" class="wv2-count-error"><i class="fa-solid fa-circle-exclamation"></i>{{ stockCountError }}</span>
                    <span v-else></span>
                    <div>
                        <button type="button" class="wv2-count-cancel" @click="cancelStockCount">Cancel</button>
                        <button type="button" class="wv2-count-complete" :disabled="!stockCount.id || !stockCount.lines.length" @click="completeStockCount">
                            Complete
                            <i class="fa-solid fa-check"></i>
                        </button>
                    </div>
                </footer>

                <footer v-else-if="inventoryRows.length" class="wv2-pagination wv2-inventory-pagination">
                    <button type="button" class="wv2-pagination-nav" aria-label="Previous page" :disabled="inventoryPage <= 1" @click="inventoryPage -= 1">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <button
                        v-for="page in inventoryPaginationItems"
                        :key="`inventory-page-${inventoryMode}-${page}`"
                        type="button"
                        class="wv2-pagination-page"
                        :class="{ active: page === inventoryPage, ellipsis: typeof page !== 'number' }"
                        @click="typeof page === 'number' && (inventoryPage = page)"
                    >{{ paginationLabel(page) }}</button>
                    <button type="button" class="wv2-pagination-nav" aria-label="Next page" :disabled="inventoryPage >= inventoryPageCount" @click="inventoryPage += 1">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </footer>
            </section>

        </section>

        <section v-else class="wv2-empty wv2-empty-page">
            <i class="fa-solid fa-boxes-stacked"></i>
            <strong>No warehouses</strong>
            <button v-if="canManage" type="button" @click="openWarehouseForm()">
                Add Warehouse
            </button>
        </section>

        <div
            v-if="warehouseProductDetail"
            class="wv2-modal-backdrop"
            @mousedown.self="closeWarehouseProductDetail"
        >
            <section class="wv2-warehouse-product-modal" role="dialog" aria-modal="true" aria-label="Warehouse product details">
                <header class="wv2-modal-header">
                    <div>
                        <span class="wv2-eyebrow">PRODUCT DETAILS</span>
                        <h2>{{ warehouseProductDetail.name }}</h2>
                        <small class="mono">{{ warehouseProductDetail.sku }}</small>
                    </div>
                    <div class="wv2-modal-header-actions">
                        <button
                            v-if="canIssue && warehouseProductDetailQuantity > 0"
                            class="wv2-icon-button"
                            type="button"
                            aria-label="Stock Movement"
                            title="Stock Movement"
                            @click="moveWarehouseProduct"
                        >
                            <i class="fa-solid fa-right-left"></i>
                        </button>
                        <button class="wv2-icon-button" type="button" aria-label="Close" @click="closeWarehouseProductDetail">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </header>

                <div class="wv2-warehouse-product-body">
                    <aside class="wv2-warehouse-product-summary">
                        <div class="wv2-warehouse-product-photo">
                            <img v-if="warehouseProductDetail.photo" :src="warehouseProductDetail.photo" :alt="warehouseProductDetail.name" />
                            <strong v-else>{{ initials(warehouseProductDetail.name) }}</strong>
                        </div>
                        <strong>{{ warehouseProductDetail.name }}</strong>
                        <small class="mono">{{ warehouseProductDetail.sku }}</small>
                        <span class="wv2-status" :class="warehouseProductDetailStatusClass">{{ warehouseProductDetailStatus }}</span>
                        <dl>
                            <div><dt>Available</dt><dd>{{ formatNumber(warehouseProductDetailQuantity) }} {{ warehouseProductDetail.unit }}</dd></div>
                            <div><dt>Warehouse</dt><dd>{{ selectedWarehouse.name }}</dd></div>
                            <div><dt>View</dt><dd>{{ selectedFilterLocation?.name || 'All locations' }}</dd></div>
                        </dl>
                    </aside>

                    <section class="wv2-warehouse-product-stock">
                        <button class="wv2-warehouse-product-stock-barcode" type="button" aria-label="Enlarge barcode" @click="barcodePreviewOpen = true">
                            <img v-if="warehouseProductBarcode" :src="warehouseProductBarcode" :alt="`${warehouseProductDetail.name} barcode`" />
                            <span v-else><i class="fa-solid fa-barcode"></i></span>
                        </button>

                        <div class="wv2-warehouse-product-detail-scroll">
                            <section class="wv2-warehouse-product-section">
                                <div class="wv2-warehouse-product-section-title">
                                    <strong>Stock locations</strong>
                                    <span>{{ warehouseProductLayerRows.length }}</span>
                                </div>
                                <div class="wv2-warehouse-product-location-list">
                                    <button v-for="row in warehouseProductLayerRows" :key="row.key" type="button" @click="openWarehouseProductPage">
                                        <span class="wv2-location-icon"><i :class="locationIcon(row.location?.type)"></i></span>
                                        <span>
                                            <strong>{{ row.location?.name || row.locationName || 'Location' }}</strong>
                                            <small>{{ row.layerCode }} · {{ row.receivedDate || 'Received stock' }}</small>
                                        </span>
                                        <strong>{{ formatNumber(row.quantity) }} <small>{{ warehouseProductDetail.unit }}</small></strong>
                                        <i class="fa-solid fa-chevron-right"></i>
                                    </button>
                                    <p v-if="!warehouseProductLayerRows.length" class="wv2-detail-empty">No standalone product stock in this view</p>
                                </div>
                            </section>

                            <section v-if="warehouseProductBatchRows.length" class="wv2-warehouse-product-section">
                                <div class="wv2-warehouse-product-section-title">
                                    <strong>Registered batches</strong>
                                    <span>{{ warehouseProductBatchRows.length }}</span>
                                </div>
                                <div class="wv2-warehouse-product-batch-links">
                                    <button v-for="batch in warehouseProductBatchRows" :key="batch.id" type="button" @click="openWarehouseProductBatch(batch.id)">
                                        <span class="wv2-location-icon"><i class="fa-solid fa-layer-group"></i></span>
                                        <span><strong>Batch {{ batch.id }}</strong><small>{{ batch.warehouseAvailableBatchCount }} batch{{ batch.warehouseAvailableBatchCount === 1 ? '' : 'es' }} · {{ inventoryLocationLabel(batch) }}</small></span>
                                        <i class="fa-solid fa-chevron-right"></i>
                                    </button>
                                </div>
                            </section>
                        </div>
                    </section>
                </div>
                <footer class="wv2-warehouse-product-footer">
                    <button class="wv2-button wv2-button-secondary" type="button" @click="closeWarehouseProductDetail">Close</button>
                    <div>
                        <button v-if="canReceive" class="wv2-button wv2-button-in" type="button" @click="stockInWarehouseProduct">
                            <i class="fa-solid fa-arrow-down"></i>Stock In
                        </button>
                        <button v-if="canIssue && warehouseProductDetailQuantity > 0" class="wv2-button wv2-button-primary" type="button" @click="shipWarehouseProduct">
                            <i class="fa-solid fa-truck"></i>Ship Product
                        </button>
                        <button class="wv2-button wv2-button-primary" type="button" @click="openWarehouseProductPage"><i class="fa-solid fa-box"></i>Product Page</button>
                    </div>
                </footer>
            </section>
        </div>

        <div v-if="barcodePreviewOpen && warehouseProductDetail" class="wv2-modal-backdrop wv2-barcode-preview-backdrop" @mousedown.self="barcodePreviewOpen = false">
            <section class="wv2-barcode-preview" role="dialog" aria-modal="true" aria-label="Product barcode">
                <button class="wv2-icon-button" type="button" aria-label="Close barcode" @click="barcodePreviewOpen = false"><i class="fa-solid fa-xmark"></i></button>
                <img v-if="warehouseProductBarcode" :src="warehouseProductBarcode" :alt="`${warehouseProductDetail.name} enlarged barcode`" />
                <div><strong>{{ warehouseProductDetail.name }}</strong><span class="mono">{{ warehouseProductDetail.bar || warehouseProductDetail.sku }}</span></div>
            </section>
        </div>

        <div
            v-if="detailRow"
            class="wv2-modal-backdrop"
            @mousedown.self="closeLocationDetails"
        >
            <section class="wv2-detail-modal" role="dialog" aria-modal="true">
                <header class="wv2-modal-header">
                    <div>
                        <span class="wv2-eyebrow">LOCATION DETAILS</span>
                        <div class="wv2-detail-title">
                            <h2>{{ detailRow.location.name }}</h2>
                            <span class="wv2-status" :class="statusClass(detailRow.status)">
                                {{ statusLabel(detailRow.status) }}
                            </span>
                        </div>
                        <small class="mono">{{ detailRow.location.code }}</small>
                    </div>
                    <div class="wv2-modal-header-actions">
                        <button
                            v-if="canReceive"
                            class="wv2-detail-action wv2-detail-action-in"
                            type="button"
                            @click="openStockIn(detailRow.location)"
                        >
                            <i class="fa-solid fa-arrow-down"></i>
                            Stock In
                        </button>
                        <button
                            v-if="canIssue && detailRow.stockQuantity > 0"
                            class="wv2-detail-action wv2-detail-action-out"
                            type="button"
                            @click="openStockOut(detailRow.location)"
                        >
                            <i class="fa-solid fa-trash-can"></i>
                            Stock Out
                        </button>
                        <button
                            v-if="canManage"
                            class="wv2-icon-button"
                            type="button"
                            aria-label="Edit location"
                            @click="openLocationForm(detailRow.location)"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button
                            v-if="canManage"
                            class="wv2-icon-button wv2-icon-button-danger"
                            type="button"
                            aria-label="Delete location"
                            @click="confirmDeleteLocation(detailRow.location)"
                        >
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                        <button
                            class="wv2-icon-button"
                            type="button"
                            aria-label="Close"
                            @click="closeLocationDetails"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </header>

                <div class="wv2-detail-summary">
                    <span><small>Warehouse</small><strong>{{ selectedWarehouse.name }}</strong></span>
                    <span><small>Type</small><strong>{{ detailRow.location.type }}</strong></span>
                    <span><small>Capacity</small><strong>{{ capacityText(detailRow) }}</strong></span>
                    <span><small>Stock</small><strong>{{ formatNumber(detailRow.stockQuantity) }}</strong></span>
                </div>

                <nav class="wv2-detail-tabs" aria-label="Location details">
                    <button
                        v-for="tab in detailTabs"
                        :key="tab.id"
                        type="button"
                        :class="{ active: detailTab === tab.id }"
                        @click="detailTab = tab.id"
                    >
                        {{ tab.label }}
                        <small>{{ tab.count }}</small>
                    </button>
                </nav>

                <div class="wv2-detail-body">
                    <div v-if="detailTab === 'products'" class="wv2-detail-list">
                        <button
                            v-for="product in detailProducts"
                            :key="product.id"
                            type="button"
                            class="wv2-detail-row"
                            @click="openProduct(product)"
                        >
                            <span class="wv2-product-symbol">{{ initials(product.name) }}</span>
                            <span class="wv2-detail-main">
                                <strong>{{ product.name }}</strong>
                                <small class="mono">{{ product.sku }}</small>
                            </span>
                            <span class="wv2-detail-value">
                                <strong>{{ formatNumber(product.quantity) }}</strong>
                                <small>{{ product.unit }}</small>
                            </span>
                            <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        </button>
                        <p v-if="!detailProducts.length" class="wv2-detail-empty">No products</p>
                    </div>

                    <div v-else-if="detailTab === 'lots'" class="wv2-detail-list wv2-lot-list">
                        <article v-for="batch in detailLots" :key="batch.id" class="wv2-lot-card">
                            <button class="wv2-detail-row wv2-lot-row" type="button" @click="openDetailLot(batch)">
                                <span class="wv2-product-symbol">
                                    <i class="fa-solid fa-layer-group"></i>
                                </span>
                                <span class="wv2-detail-main">
                                    <strong>{{ batch.id }}</strong>
                                    <small>{{ batch.productCount }} {{ batch.productCount === 1 ? 'product' : 'products' }}</small>
                                </span>
                                <span class="wv2-detail-value">
                                    <strong>{{ formatNumber(batch.locationQuantity) }}</strong>
                                    <small>parts</small>
                                </span>
                                <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                            </button>
                        </article>
                        <p v-if="!detailLots.length" class="wv2-detail-empty">No batches</p>
                    </div>


                    <div v-else class="wv2-detail-list">
                        <button
                            v-for="movement in detailMovements"
                            :key="movement.id"
                            type="button"
                            class="wv2-detail-row wv2-history-row"
                            @click="openLocationMovement(movement)"
                        >
                            <span
                                class="wv2-movement-icon"
                                :class="movementTone(movement)"
                            >
                                <i
                                    class="fa-solid"
                                    :class="movementIcon(movement)"
                                ></i>
                            </span>
                            <span class="wv2-detail-main">
                                <strong>{{ movement.type || movement.reason || 'Movement' }}</strong>
                                <small>{{ movement.productName }} · {{ movement.staffName }}</small>
                            </span>
                            <span
                                class="wv2-movement-quantity"
                                :class="movementTone(movement)"
                            >
                                {{ movementQuantityLabel(movement) }}
                            </span>
                            <time class="wv2-detail-date"><strong>{{ movementDateLabel(movement.createdAt) }}</strong><small>{{ movementTimeLabel(movement.createdAt) }}</small></time>
                            <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        </button>
                        <p v-if="!detailMovements.length" class="wv2-detail-empty">No movements</p>
                    </div>
                </div>
            </section>
        </div>

        <div
            v-if="warehouseBatchDetail"
            class="wv2-modal-backdrop"
            @mousedown.self="closeDetailLot"
        >
            <section class="wv2-warehouse-batch-modal" role="dialog" aria-modal="true" aria-label="Warehouse batch details">
                <header class="wv2-modal-header">
                    <div>
                        <span class="wv2-eyebrow">BATCH DETAILS</span>
                        <h2>Batch {{ warehouseBatchDetail.id }}</h2>
                        <small class="mono">{{ warehouseBatchDetail.id }}</small>
                    </div>
                    <div class="wv2-modal-header-actions">
                        <button v-if="canIssue && warehouseBatchDetail.warehouseAvailableBatchCount > 0" class="wv2-icon-button" type="button" aria-label="Stock Movement" title="Stock Movement" @click="moveWarehouseBatch">
                            <i class="fa-solid fa-right-left"></i>
                        </button>
                        <button class="wv2-icon-button" type="button" aria-label="Close" @click="closeDetailLot">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </header>

                <div class="wv2-warehouse-batch-body">
                    <aside class="wv2-warehouse-batch-summary">
                        <span class="wv2-warehouse-batch-symbol"><i class="fa-solid fa-layer-group"></i></span>
                        <strong>{{ warehouseBatchDetail.id }}</strong>
                        <span class="wv2-status" :class="warehouseBatchDetail.warehouseStatus === 'Complete' ? 'complete' : 'incomplete'">
                            {{ warehouseBatchDetail.warehouseStatus }}
                        </span>
                        <dl>
                            <div><dt>Products</dt><dd>{{ warehouseBatchDetailItems.length }}</dd></div>
                            <div><dt>Available parts</dt><dd>{{ formatNumber(warehouseBatchDetail.warehouseAvailableQuantity) }}</dd></div>
                            <div><dt>Complete sets</dt><dd>{{ warehouseBatchDetail.warehouseAvailableBatchCount }}</dd></div>
                            <div><dt>Warehouse</dt><dd>{{ selectedWarehouse.name }}</dd></div>
                            <div><dt>Location</dt><dd>{{ warehouseBatchContextLocation?.name || 'All' }}</dd></div>
                        </dl>
                    </aside>

                    <section class="wv2-warehouse-batch-stock">
                        <header>
                            <div>
                                <small>{{ warehouseBatchContextLocation ? 'SELECTED LOCATION' : 'SELECTED WAREHOUSE' }}</small>
                                <h3>{{ warehouseBatchContextLocation?.name || selectedWarehouse.name }}</h3>
                            </div>
                            <strong>{{ warehouseBatchDetail.warehouseAvailableBatchCount }} <small>sets</small></strong>
                        </header>

                        <div class="wv2-warehouse-batch-item-list">
                            <button
                                v-for="item in warehouseBatchDetailItems"
                                :key="item.productId"
                                class="wv2-warehouse-batch-item-card"
                                type="button"
                                @click="openBatchProduct(item.productId)"
                            >
                                <span class="wv2-product-symbol">{{ initials(item.productName) }}</span>
                                <span class="wv2-warehouse-batch-item-main">
                                    <strong>{{ item.productName }}</strong>
                                    <small class="mono">{{ item.sku }}</small>
                                    <em>Per batch: {{ formatNumber(item.recipeQuantity) }} {{ item.unit }}</em>
                                </span>
                                <span class="wv2-warehouse-batch-item-location">
                                    <i class="fa-solid fa-location-dot"></i>
                                    {{ item.locationLabel }}
                                </span>
                                <span class="wv2-warehouse-batch-item-qty">
                                    <strong>
                                        <span :class="batchItemAvailabilityTone(item)">{{ formatNumber(item.availableQuantity) }}</span>
                                        <em>/ {{ formatNumber(item.recipeQuantity) }}</em>
                                    </strong>
                                    <small>{{ item.unit }}</small>
                                </span>
                            </button>
                            <p v-if="!warehouseBatchDetailItems.length" class="wv2-detail-empty">No batch stock in this location</p>
                        </div>
                    </section>
                </div>

                <footer class="wv2-warehouse-product-footer">
                    <button class="wv2-button wv2-button-secondary" type="button" @click="closeDetailLot">Close</button>
                    <div>
                        <button v-if="canReceive" class="wv2-button wv2-button-in" type="button" @click="stockInWarehouseBatch">
                            <i class="fa-solid fa-arrow-down"></i>Stock In
                        </button>
                        <button v-if="canIssue && warehouseBatchDetail.warehouseAvailableBatchCount > 0" class="wv2-button wv2-button-primary" type="button" @click="shipBatch(warehouseBatchDetail)">
                            <i class="fa-solid fa-truck"></i>Ship Batch
                        </button>
                    </div>
                </footer>
            </section>
        </div>

        <Teleport to="body">
            <div v-if="selectedLocationMovement" class="wv2-lot-modal-backdrop" @mousedown.self="closeLocationMovement">
                <section class="wv2-movement-detail-modal" role="dialog" aria-modal="true" aria-label="Stock movement details">
                    <header class="wv2-movement-detail-header">
                        <div>
                            <span class="wv2-eyebrow">STOCK MOVEMENT</span>
                            <h2>Movement details</h2>
                        </div>
                        <div class="wv2-modal-header-actions">
                            <button
                                v-if="selectedLocationMovementInvoice"
                                class="wv2-icon-button"
                                type="button"
                                aria-label="View linked invoice"
                                title="View invoice"
                                @click="openLocationMovementInvoice"
                            ><i class="fa-solid fa-file-invoice"></i></button>
                            <button class="wv2-icon-button" type="button" aria-label="Close movement details" @click="closeLocationMovement"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </header>

                    <div class="wv2-movement-overview">
                        <span class="wv2-movement-overview-icon" :class="movementTone(selectedLocationMovement)">
                            <i class="fa-solid" :class="movementIcon(selectedLocationMovement)"></i>
                        </span>
                        <div>
                            <template v-if="selectedLocationMovementShipmentContext?.isBatchShipment">
                                <small>BATCH SHIPMENT</small>
                                <strong class="shipment">{{ selectedLocationMovementShipmentContext.batchId || selectedLocationMovement.batch || 'Batch' }} · {{ formatNumber(selectedLocationMovementShipmentContext.batchCount) }} sets</strong>
                                <span>This item: {{ movementQuantityLabel(selectedLocationMovement) }} {{ movementUnit(selectedLocationMovement) }}</span>
                            </template>
                            <template v-else>
                                <small>{{ selectedLocationMovement.type || selectedLocationMovement.reason || 'Movement' }}</small>
                                <strong :class="movementTone(selectedLocationMovement)">{{ movementQuantityLabel(selectedLocationMovement) }}</strong>
                                <span>{{ movementUnit(selectedLocationMovement) }}</span>
                            </template>
                        </div>
                        <time>
                            <strong>{{ movementDateLabel(selectedLocationMovement.createdAt) }}</strong>
                            <small>{{ movementTimeLabel(selectedLocationMovement.createdAt) }}</small>
                        </time>
                    </div>

                    <div class="wv2-movement-detail-content">
                        <section class="wv2-movement-detail-panel wv2-movement-product-panel">
                            <header>
                                <span><i class="fa-solid fa-box"></i></span>
                                <div><small>PRODUCT</small><h3>{{ selectedLocationMovement.productName || productName(selectedLocationMovement.productId) }}</h3></div>
                            </header>
                            <dl>
                                <div><dt>Product code</dt><dd class="mono">{{ selectedLocationMovement.sku || '—' }}</dd></div>
                                <div><dt>Batch</dt><dd class="mono">{{ selectedLocationMovementShipmentContext?.batchId || selectedLocationMovement.batch || '—' }}</dd></div>
                                <div><dt>{{ isTransferMovement(selectedLocationMovement) ? 'Route' : 'Source' }}</dt><dd>{{ movementSourceLabel(selectedLocationMovement) }}</dd></div>
                                <div v-if="selectedLocationMovementShipmentContext?.recipeQuantity !== null"><dt>Per set at shipment</dt><dd>{{ formatNumber(selectedLocationMovementShipmentContext.recipeQuantity) }} {{ movementUnit(selectedLocationMovement) }}</dd></div>
                                <div v-if="selectedLocationMovementShipmentContext"><dt>Shipped this item</dt><dd>{{ formatNumber(Math.abs(Number(selectedLocationMovement.changedQuantity || 0))) }} {{ movementUnit(selectedLocationMovement) }}</dd></div>
                                <div><dt>Movement ID</dt><dd class="mono">{{ selectedLocationMovement.id }}</dd></div>
                                <div v-if="selectedLocationMovementShipmentContext?.batchShipmentId"><dt>Batch shipment</dt><dd class="mono">{{ selectedLocationMovementShipmentContext.batchShipmentId }}</dd></div>
                                <div><dt>{{ selectedLocationMovementShipmentContext?.batchShipmentId ? 'Shipment line' : 'Document' }}</dt><dd class="mono">{{ selectedLocationMovement.document || selectedLocationMovement.shipmentId || selectedLocationMovement.transferId || selectedLocationMovement.receiptId || '—' }}</dd></div>
                            </dl>
                        </section>

                        <section class="wv2-movement-detail-panel wv2-movement-change-panel">
                            <header>
                                <span><i class="fa-solid fa-right-left"></i></span>
                                <div><small>{{ selectedLocationMovementShipmentContext ? 'SOURCE STOCK' : 'STOCK CHANGE' }}</small><h3>{{ selectedLocationMovementShipmentContext?.isBatchShipment ? 'Batch shipment' : (selectedLocationMovement.type || 'Movement') }}</h3></div>
                            </header>
                            <div class="wv2-movement-balance">
                                <div><small>{{ movementBalanceScope(selectedLocationMovement) }} before</small><strong>{{ movementDisplayBefore(selectedLocationMovement) }}</strong></div>
                                <i class="fa-solid fa-arrow-right"></i>
                                <div><small>{{ movementBalanceScope(selectedLocationMovement) }} after</small><strong>{{ movementDisplayAfter(selectedLocationMovement) }}</strong></div>
                            </div>
                            <dl>
                                <div v-if="selectedLocationMovementShipmentContext?.recipient"><dt>Recipient</dt><dd>{{ selectedLocationMovementShipmentContext.recipient }}</dd></div>
                                <div><dt>Reference</dt><dd class="mono">{{ selectedLocationMovementShipmentContext?.reference || selectedLocationMovement.reference || '—' }}</dd></div>
                                <div v-if="hasTransferBalances(selectedLocationMovement)"><dt>Source balance</dt><dd>{{ transferSourceBalanceLabel(selectedLocationMovement) }}</dd></div>
                                <div v-if="hasTransferBalances(selectedLocationMovement)"><dt>Destination balance</dt><dd>{{ transferDestinationBalanceLabel(selectedLocationMovement) }}</dd></div>
                                <div v-if="selectedLocationMovement.remark"><dt>Remark</dt><dd>{{ selectedLocationMovement.remark }}</dd></div>
                            </dl>
                        </section>

                        <button
                            v-if="selectedLocationMovement.reason || selectedLocationMovement.photo"
                            class="wv2-movement-proof-panel"
                            type="button"
                            @click="openLocationEvidence"
                        >
                            <span><i class="fa-solid fa-camera"></i></span>
                            <div>
                                <small>STOCK PROOF</small>
                                <strong>{{ selectedLocationMovement.reason || 'Reason & photo record' }}</strong>
                                <em>Open proof details</em>
                            </div>
                            <img v-if="selectedLocationMovement.photo" :src="selectedLocationMovement.photo" alt="Stock movement evidence" />
                            <i v-else class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        </button>
                    </div>

                    <footer class="wv2-movement-detail-footer">
                        <div><span><i class="fa-solid fa-user"></i></span><strong>{{ selectedLocationMovement.staffName || 'System' }}</strong></div>
                        <button class="wv2-button wv2-button-primary" type="button" @click="closeLocationMovement">Done</button>
                    </footer>
                </section>
            </div>

            <div
                v-if="locationEvidenceOpen && selectedLocationMovement"
                class="wv2-lot-modal-backdrop wv2-evidence-backdrop"
                @mousedown.self="closeLocationEvidence"
            >
                <section class="wv2-evidence-modal" role="dialog" aria-modal="true" aria-label="Stock proof details">
                    <header class="wv2-evidence-header">
                        <div>
                            <span class="wv2-eyebrow">STOCK PROOF</span>
                            <h2>{{ selectedLocationMovement.reason || 'Movement evidence' }}</h2>
                        </div>
                        <button class="wv2-icon-button" type="button" aria-label="Close stock proof" @click="closeLocationEvidence">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </header>
                    <div class="wv2-evidence-body">
                        <img
                            v-if="selectedLocationMovement.photo"
                            :src="selectedLocationMovement.photo"
                            alt="Full stock movement evidence"
                        />
                        <div v-else class="wv2-evidence-empty">
                            <i class="fa-solid fa-camera"></i>
                            <strong>No proof photo attached</strong>
                        </div>
                        <dl>
                            <div><dt>Reason</dt><dd>{{ selectedLocationMovement.reason || '—' }}</dd></div>
                            <div><dt>Reference</dt><dd class="mono">{{ selectedLocationMovement.reference || '—' }}</dd></div>
                            <div v-if="selectedLocationMovement.remark"><dt>Remark</dt><dd>{{ selectedLocationMovement.remark }}</dd></div>
                            <div><dt>Operator</dt><dd>{{ selectedLocationMovement.staffName || 'System' }}</dd></div>
                        </dl>
                    </div>
                </section>
            </div>
        </Teleport>

        <SupplierReceiptModal
            v-if="selectedLocationReceipt"
            :record="selectedLocationReceipt"
            :supplier="selectedLocationReceiptSupplier"
            @close="selectedLocationReceipt = null"
        />

        <ProductDetailsModal
            v-if="detailProduct"
            :product="detailProduct"
            @close="closeNestedProduct"
            @receive="receiveNestedProduct"
            @updated="refreshNestedProduct"
            @edit="editNestedProduct"
            @view-product="openBatchProduct"
        />

        <div
            v-if="formMode"
            class="wv2-modal-backdrop"
            @mousedown.self="closeForm"
        >
            <form class="wv2-form-modal" @submit.prevent="saveForm">
                <header class="wv2-modal-header">
                    <div>
                        <span class="wv2-eyebrow">
                            {{ formMode === 'warehouse' ? 'WAREHOUSE' : 'LOCATION' }}
                        </span>
                        <h2>
                            {{ editing ? 'Edit' : 'Add' }}
                            {{ formMode === 'warehouse' ? 'Warehouse' : 'Location' }}
                        </h2>
                    </div>
                    <div class="wv2-modal-header-actions">
                        <button
                            v-if="editing"
                            class="wv2-icon-button wv2-icon-button-danger"
                            type="button"
                            :aria-label="formMode === 'warehouse' ? 'Delete warehouse' : 'Delete location'"
                            @click="formMode === 'warehouse' ? confirmDeleteWarehouse(editing) : confirmDeleteLocation(editing)"
                        >
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                        <button
                            class="wv2-icon-button"
                            type="button"
                            aria-label="Close"
                            @click="closeForm"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </header>

                <div class="wv2-form-body">
                    <LocalizedNameField
                        required
                        :label="formMode === 'warehouse' ? 'Warehouse Name' : 'Location Name'"
                        :editor-title="formMode === 'warehouse' ? 'Enter warehouse name' : 'Enter location name'"
                        :placeholder="formMode === 'warehouse' ? 'Enter warehouse name' : 'Click to enter location name'"
                        :example="formMode === 'warehouse' ? 'e.g. Main Warehouse' : 'e.g. Rack A-01'"
                        :mode="form.nameMode"
                        :translations="form.nameTranslations"
                        @save="applyLocalizedName"
                    />

                    <label>
                        <span>Code <b>*</b></span>
                        <input
                            v-model.trim="form.code"
                            required
                            maxlength="16"
                            :placeholder="formMode === 'warehouse' ? 'MAIN' : 'RACK-A-01'"
                        />
                    </label>

                    <template v-if="formMode === 'warehouse'">
                        <label>
                            <span>Company / owner</span>
                            <input v-model.trim="form.companyName" placeholder="Company name" />
                        </label>
                        <label>
                            <span>Contact</span>
                            <input v-model.trim="form.contactName" placeholder="Contact person" />
                        </label>
                        <label class="wv2-form-wide">
                            <span>Address <b>*</b></span>
                            <textarea v-model.trim="form.address" rows="3" required placeholder="Full warehouse / delivery address"></textarea>
                        </label>
                        <label>
                            <span>Phone</span>
                            <input v-model.trim="form.phone" placeholder="Contact number" />
                        </label>
                        <label>
                            <span>Purpose</span>
                            <input v-model.trim="form.purpose" placeholder="Available stock" />
                        </label>
                    </template>

                    <template v-else>
                        <label>
                            <span>Type <b>*</b></span>
                            <ScrollableSelect v-model="form.type" required>
                                <option v-for="type in locationTypes" :key="type" :value="type">
                                    {{ type }}
                                </option>
                            </ScrollableSelect>
                        </label>

                        <label>
                            <span>Status</span>
                            <ScrollableSelect v-model="form.status">
                                <option value="active">Active</option>
                                <option value="unavailable">Unavailable</option>
                            </ScrollableSelect>
                        </label>

                        <label>
                            <span>Maximum stock</span>
                            <input
                                v-model.number="form.capacityValue"
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                            />
                        </label>

                    </template>

                    <p v-if="error" class="wv2-form-error">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        {{ error }}
                    </p>
                </div>

                <footer class="wv2-form-footer">
                    <button class="wv2-button wv2-button-secondary" type="button" @click="closeForm">
                        Cancel
                    </button>
                    <button class="wv2-button wv2-button-primary" type="submit">
                        Save
                    </button>
                </footer>
            </form>
        </div>

    </div>
</template>

<script>
import { inventoryStore } from '@/services/inventoryStore'
import { paginationItems, paginationLabel } from '@/utils/pagination'
import { barcodeDataUrl } from '@/utils/barcode'
import { PERMISSIONS } from '@/services/permissions'
import ProductDetailsModal from '@/components/product/ProductDetailsModal.vue'
import SupplierReceiptModal from '@/components/supplier/SupplierReceiptModal.vue'
import LocalizedNameField from '@/components/common/LocalizedNameField.vue'
import { registerLocalizedFields } from '@/system/language'

export default {
    name: 'WarehousesView',
    components: { ProductDetailsModal, SupplierReceiptModal, LocalizedNameField },
    data() {
        return {
            store: inventoryStore,
            selectedWarehouseId:
                String(this.$route.query.warehouse || localStorage.getItem('ims_selected_warehouse') || ''),
            inventoryMode:
                localStorage.getItem('ims_warehouse_inventory_mode') === 'batch'
                    ? 'batch'
                    : 'product',
            inventoryPage: 1,
            selectedLocationFilterId: String(this.$route.query.location || ''),
            countLocationFilterId: '',
            warehouseProductDetail: null,
            barcodePreviewOpen: false,
            detailRow: null,
            detailProduct: null,
            detailTab: 'products',
            expandedDetailLotId: '',
            warehouseBatchDetailId: '',
            warehouseBatchDetailLocationId: '',
            selectedLocationMovement: null,
            locationEvidenceOpen: false,
            selectedLocationReceipt: null,
            formMode: '',
            stockCount: null,
            stockCountError: '',
            editing: null,
            error: '',
            locationPage: 1,
            form: this.emptyForm(),
            locationTypes: ['Rack', 'Shelf', 'Chiller', 'Freezer', 'Inspection', 'Returns', 'Other'],
        }
    },
    computed: {
        selectedLocationMovementInvoice() {
            return this.store.findReceiptForMovement(this.selectedLocationMovement, { invoiceOnly: true })
        },
        selectedLocationMovementShipmentContext() {
            return this.store.shipmentMovementContext(this.selectedLocationMovement)
        },
        selectedLocationReceiptSupplier() {
            return this.selectedLocationReceipt
                ? this.store.findSupplier(this.selectedLocationReceipt.supplierId) || null
                : null
        },
        canManage() {
            return this.store.can(PERMISSIONS.MANAGE_WAREHOUSES)
        },
        canReceive() {
            return this.store.can(PERMISSIONS.RECEIVE_STOCK)
        },
        canIssue() {
            return this.store.can(PERMISSIONS.ISSUE_STOCK)
        },
        canCount() {
            return this.store.can(PERMISSIONS.COUNT_STOCK)
        },
        canApproveCount() {
            return this.store.can(PERMISSIONS.APPROVE_STOCK_COUNT)
        },
        warehouses() {
            return this.store.state.warehouses
        },
        selectedWarehouse() {
            return (
                this.warehouses.find(
                    (warehouse) => warehouse.id === this.selectedWarehouseId,
                ) ||
                this.warehouses[0] ||
                null
            )
        },
        summary() {
            return this.selectedWarehouse
                ? this.store.warehouseSummary(this.selectedWarehouse.id)
                : null
        },
        warehouseInventory() {
            return this.selectedWarehouse
                ? this.store.warehouseInventory(
                      this.selectedWarehouse.id,
                      this.selectedLocationFilterId,
                  )
                : null
        },
        selectedFilterLocation() {
            return this.selectedLocationFilterId && this.selectedWarehouse
                ? this.store.findLocation(this.selectedWarehouse.id, this.selectedLocationFilterId)
                : null
        },
        inventoryRows() {
            if (!this.warehouseInventory) return []
            return this.inventoryMode === 'batch'
                ? this.warehouseInventory.batches
                : this.warehouseInventory.products
        },
        inventoryPageCount() {
            return Math.max(1, Math.ceil(this.inventoryRows.length / 5))
        },
        inventoryPaginationItems() {
            return paginationItems(this.inventoryPage, this.inventoryPageCount)
        },
        pagedInventoryRows() {
            const start = (this.inventoryPage - 1) * 5
            return this.inventoryRows.slice(start, start + 5)
        },
        locationRows() {
            return this.summary?.locations || []
        },
        filteredCountLines() {
            const lines = this.stockCount?.lines || []
            if (!this.countLocationFilterId) return lines
            return lines.filter((line) => line.locationId === this.countLocationFilterId)
        },
        locationPageCount() {
            return Math.max(1, Math.ceil(this.locationRows.length / 4))
        },
        pagedLocationRows() {
            const start = (this.locationPage - 1) * 4
            return this.locationRows.slice(start, start + 4)
        },
        warehouseProductBarcode() {
            if (!this.warehouseProductDetail) return ''
            try {
                return barcodeDataUrl(this.warehouseProductDetail.bar || this.warehouseProductDetail.sku, { width: 1.5, height: 48, fontSize: 12 })
            } catch {
                return ''
            }
        },
        warehouseProductLayerRows() {
            if (!this.warehouseProductDetail || !this.selectedWarehouse) return []
            const rows = new Map()
            this.store.stockPositionsFor(this.warehouseProductDetail.id)
                .filter((position) => {
                    if (position.warehouseId !== this.selectedWarehouse.id || !(Number(position.availableQuantity) > 0)) return false
                    if (this.selectedLocationFilterId && position.locationId !== this.selectedLocationFilterId) return false
                    const lot = this.store.state.stockLots.find((item) => item.id === position.lotId)
                    return !(lot?.isBatch && lot?.batchGroupId)
                })
                .forEach((position) => {
                    const lot = this.store.state.stockLots.find((item) => item.id === position.lotId)
                    const key = `${position.locationId}:${position.lotId || 'no-lot'}`
                    const current = rows.get(key) || {
                        key,
                        locationId: position.locationId,
                        location: this.store.findLocation(this.selectedWarehouse.id, position.locationId),
                        locationName: position.location || '',
                        lotId: position.lotId || '',
                        layerCode: lot?.batchNumber || 'Stock layer',
                        receivedDate: lot?.receivedDate || '',
                        quantity: 0,
                    }
                    current.quantity += Number(position.availableQuantity) || 0
                    rows.set(key, current)
                })
            return [...rows.values()].sort((left, right) => {
                const locationCompare = String(left.location?.name || left.locationName).localeCompare(String(right.location?.name || right.locationName), undefined, { numeric: true })
                return locationCompare || String(left.layerCode).localeCompare(String(right.layerCode), undefined, { numeric: true })
            })
        },
        warehouseProductBatchRows() {
            if (!this.warehouseProductDetail || !this.warehouseInventory) return []
            return (this.warehouseInventory.batches || []).filter((batch) =>
                (batch.items || []).some((item) => item.productId === this.warehouseProductDetail.id && Number(item.availableQuantity || 0) > 0),
            )
        },
        warehouseProductLocationRows() {
            if (!this.warehouseProductDetail || !this.selectedWarehouse) return []
            const rows = new Map()
            this.store.stockPositionsFor(this.warehouseProductDetail.id)
                .filter((position) => {
                    if (position.warehouseId !== this.selectedWarehouse.id || !(Number(position.availableQuantity) > 0)) return false
                    if (this.selectedLocationFilterId && position.locationId !== this.selectedLocationFilterId) return false
                    const lot = this.store.state.stockLots.find((item) => item.id === position.lotId)
                    return !(lot?.isBatch && lot?.batchGroupId)
                })
                .forEach((position) => {
                    const current = rows.get(position.locationId) || {
                        locationId: position.locationId,
                        location: this.store.findLocation(this.selectedWarehouse.id, position.locationId),
                        locationName: position.location || '',
                        quantity: 0,
                        lotIds: new Set(),
                    }
                    current.quantity += Number(position.availableQuantity) || 0
                    if (position.lotId) current.lotIds.add(position.lotId)
                    rows.set(position.locationId, current)
                })
            return [...rows.values()]
                .map((row) => ({ ...row, receiptCount: row.lotIds.size }))
                .sort((left, right) => String(left.location?.name || left.locationName).localeCompare(String(right.location?.name || right.locationName), undefined, { numeric: true }))
        },
        warehouseProductDetailQuantity() {
            return this.warehouseProductLocationRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0)
        },
        warehouseProductDetailStatus() {
            if (!this.warehouseProductDetail) return 'Out of Stock'
            const quantity = this.warehouseProductDetailQuantity
            const minimum = Number(this.warehouseProductDetail.minimumStock || 0)
            if (!(quantity > 0)) return 'Out of Stock'
            return minimum > 0 && quantity <= minimum ? 'Low Stock' : 'In Stock'
        },
        warehouseProductDetailStatusClass() {
            const value = String(this.warehouseProductDetailStatus).toLowerCase()
            if (value.includes('low')) return 'low-stock'
            if (value.includes('out')) return 'out-of-stock'
            return 'in-stock'
        },
        warehouseBatchContextLocation() {
            if (!this.warehouseBatchDetailLocationId || !this.selectedWarehouse) return null
            return this.store.findLocation(this.selectedWarehouse.id, this.warehouseBatchDetailLocationId)
        },
        warehouseBatchDetail() {
            if (!this.warehouseBatchDetailId || !this.selectedWarehouse) return null
            const inventory = this.store.warehouseInventory(
                this.selectedWarehouse.id,
                this.warehouseBatchDetailLocationId,
            )
            return inventory?.batches?.find((batch) => batch.id === this.warehouseBatchDetailId) || null
        },
        warehouseBatchDetailItems() {
            if (!this.warehouseBatchDetail) return []
            return (this.warehouseBatchDetail.items || [])
                .map((item) => {
                    const product = this.store.findProduct(item.productId)
                    const names = [...new Set((item.positions || []).map((position) =>
                        this.store.findLocation(this.selectedWarehouse.id, position.locationId)?.name ||
                        position.locationName ||
                        position.location ||
                        'Not assigned'
                    ))]
                    return {
                        ...item,
                        productName: item.productName || product?.name || 'Product',
                        sku: item.sku || product?.sku || '—',
                        unit: item.unit || product?.unit || 'pcs',
                        locationLabel: names.length ? names.slice(0, 2).join(' · ') + (names.length > 2 ? ' · …' : '') : 'No stock',
                    }
                })
        },
        detailProducts() {
            if (!this.detailRow) return []
            const rows = new Map()
            this.detailRow.positions
                .filter((position) => {
                    const lot = this.store.state.stockLots.find((item) => item.id === position.lotId)
                    return !(lot?.isBatch && lot?.batchGroupId)
                })
                .forEach((position) => {
                    const product = this.store.findProduct(position.productId)
                    if (!product) return
                    const current = rows.get(product.id) || {
                        id: product.id,
                        name: product.name,
                        sku: product.sku,
                        unit: product.unit,
                        quantity: 0,
                    }
                    current.quantity += Number(position.availableQuantity) || 0
                    rows.set(product.id, current)
                })
            return [...rows.values()].sort((left, right) =>
                left.name.localeCompare(right.name),
            )
        },
        detailLots() {
            if (!this.detailRow) return []
            return this.store.batchGroups({ availableOnly: true })
                .map((batch) => {
                    const locationQuantity = batch.items
                        .flatMap((item) => item.positions)
                        .filter(
                            (position) =>
                                position.warehouseId === this.selectedWarehouse.id &&
                                position.locationId === this.detailRow.location.id,
                        )
                        .reduce((sum, position) => sum + Number(position.quantity || 0), 0)
                    return { ...batch, locationQuantity }
                })
                .filter((batch) => batch.locationQuantity > 0)
                .sort((left, right) => left.id.localeCompare(right.id))
        },
        detailMovements() {
            if (!this.detailRow) return []
            const warehouseId = this.selectedWarehouse.id
            const locationId = this.detailRow.location.id
            return this.store.state.movements
                .filter(
                    (movement) =>
                        (movement.warehouseId === warehouseId &&
                            movement.locationId === locationId) ||
                        (movement.sourceWarehouseId === warehouseId &&
                            movement.sourceLocationId === locationId) ||
                        (movement.destinationWarehouseId === warehouseId &&
                            movement.destinationLocationId === locationId),
                )
                .slice(0, 12)
        },
        detailTabs() {
            return [
                { id: 'products', label: 'Products', count: this.detailProducts.length },
                { id: 'lots', label: 'Batches', count: this.detailLots.length },
                { id: 'history', label: 'History', count: this.detailMovements.length },
            ]
        },
    },
    watch: {
        warehouses: {
            immediate: true,
            handler(warehouses) {
                if (
                    !warehouses.some(
                        (warehouse) => warehouse.id === this.selectedWarehouseId,
                    )
                ) {
                    this.selectedWarehouseId = warehouses[0]?.id || ''
                }
            },
        },
        selectedWarehouseId(value) {
            const previousCount = this.stockCount
            localStorage.setItem(
                'ims_selected_warehouse',
                this.selectedWarehouseId,
            )
            this.closeLocationDetails()
            this.closeWarehouseProductDetail()
            this.closeDetailLot()
            this.selectedLocationFilterId = ''
            this.countLocationFilterId = ''
            this.inventoryPage = 1
            this.locationPage = 1
            if (previousCount && previousCount.warehouseId !== value) {
                if (previousCount.id) this.store.cancelStockCount(previousCount.id)
                this.$nextTick(() => this.openStockCountForWarehouse(value))
            }
        },
        inventoryMode(value) {
            localStorage.setItem('ims_warehouse_inventory_mode', value)
            this.inventoryPage = 1
            this.closeWarehouseProductDetail()
            this.closeDetailLot()
        },
        selectedLocationFilterId() {
            this.inventoryPage = 1
            this.closeWarehouseProductDetail()
            this.closeDetailLot()
        },
        inventoryRows() {
            if (this.inventoryPage > this.inventoryPageCount) {
                this.inventoryPage = this.inventoryPageCount
            }
            if (this.inventoryRows.length && this.inventoryPage < 1) this.inventoryPage = 1
        },
        locationRows() {
            if (this.locationPage > this.locationPageCount) {
                this.locationPage = this.locationPageCount
            }
            if (this.locationRows.length && this.locationPage < 1) this.locationPage = 1
        },
    },
    methods: {
        paginationLabel,
        startStockCount() {
            this.selectedLocationFilterId = ''
            this.countLocationFilterId = ''
            this.openStockCountForWarehouse(this.selectedWarehouseId)
        },
        openStockCountForWarehouse(warehouseId) {
            try {
                this.stockCountError = ''
                this.stockCount = this.store.createStockCount({
                    warehouseId,
                    locationId: '',
                })
            } catch (error) {
                this.stockCount = {
                    id: '',
                    warehouseId,
                    warehouseName: this.store.findWarehouse(warehouseId)?.name || '',
                    locationId: '',
                    locationName: 'All locations',
                    lines: [],
                }
                this.stockCountError = ''
            }
        },
        countStep(line) {
            return line.trackingMode === 'unit' || line.unit === 'pcs' ? 1 : 0.5
        },
        changeCount(line, amount) {
            line.countedQuantity = Math.max(
                0,
                Math.round((Number(line.countedQuantity || 0) + amount) * 1000) / 1000,
            )
            this.stockCountError = ''
        },
        formatCountDate(value) {
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) return String(value || '').slice(0, 10)
            return new Intl.DateTimeFormat('en-MY', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }).format(date)
        },
        cancelStockCount() {
            if (this.stockCount?.id) this.store.cancelStockCount(this.stockCount.id)
            this.stockCount = null
            this.countLocationFilterId = ''
            this.stockCountError = ''
        },
        completeStockCount() {
            try {
                const submitted = this.store.submitStockCount(
                    this.stockCount.id,
                    this.stockCount.lines,
                )
                if (this.canApproveCount) {
                    const posted = this.store.approveStockCount(submitted.id)
                    this.store.addToast(`${posted.id} completed. Variances were posted to Stock History.`)
                } else {
                    this.store.addToast(`${submitted.id} completed and sent for approval.`)
                }
                this.stockCount = null
                this.countLocationFilterId = ''
                this.stockCountError = ''
                this.refreshSelectedWarehouse()
            } catch (error) {
                this.stockCountError = error.message
            }
        },
        refreshSelectedWarehouse() {
            const current = this.selectedWarehouseId
            this.selectedWarehouseId = ''
            this.$nextTick(() => {
                this.selectedWarehouseId = current
            })
        },
        emptyForm() {
            return {
                name: '',
                nameMode: 'single',
                nameTranslations: { en: '', cn: '', bm: '' },
                code: '',
                purpose: '',
                companyName: '',
                address: '',
                contactName: '',
                phone: '',
                type: 'Rack',
                capacityValue: '',
                capacityUnit: 'units',
                status: 'active',
            }
        },
        selectWarehouse(warehouseId) {
            this.selectedWarehouseId = warehouseId
        },
        selectLocationFilter(locationId) {
            this.selectedLocationFilterId = String(locationId || '')
        },
        selectLocationCard(row) {
            const location = row?.location || row
            if (!location?.id) return
            const locationId = String(location.id)

            // Match the warehouse-card interaction: the first tap changes the
            // active filter; a second tap on the already-active location opens
            // its editable location record. This is more reliable than dblclick
            // on tablet/touch devices.
            if (locationId === this.selectedLocationFilterId) {
                if (this.canManage) this.openLocationForm(location)
                return
            }

            this.selectLocationFilter(locationId)
        },
        selectWarehouseCard(warehouse) {
            if (!warehouse?.id) return
            if (this.stockCount && warehouse.id === this.selectedWarehouseId) return
            if (warehouse.id === this.selectedWarehouseId && this.canManage) {
                this.openWarehouseForm(warehouse)
                return
            }
            this.selectWarehouse(warehouse.id)
        },
        formatNumber(value) {
            return new Intl.NumberFormat('en-MY', {
                maximumFractionDigits: 2,
            }).format(Number(value) || 0)
        },
        inventoryLocationLabel(row) {
            const names = this.inventoryMode === 'batch'
                ? row.warehouseLocationNames || []
                : row.locationNames || []
            if (!names.length) return 'Not assigned'
            return names.slice(0, 2).join(' · ') + (names.length > 2 ? ' · …' : '')
        },
        inventoryStatusLabel(row) {
            return this.inventoryMode === 'batch'
                ? row.warehouseStatus
                : row.status
        },
        inventoryStatusClass(row) {
            const value = String(this.inventoryStatusLabel(row) || '').toLowerCase()
            if (value.includes('low')) return 'low-stock'
            if (value.includes('out')) return 'out-of-stock'
            if (value.includes('incomplete')) return 'incomplete'
            if (value.includes('complete')) return 'complete'
            return 'in-stock'
        },
        openWarehouseInventoryRow(row) {
            if (!row) return
            if (this.inventoryMode === 'batch') {
                this.openDetailLot(this.store.findBatch(row.id) || row)
                return
            }
            this.warehouseProductDetail = this.store.findProduct(row.id) || row
        },
        stockInWarehouseProduct() {
            if (!this.warehouseProductDetail || !this.selectedWarehouse) return
            this.$router.push({
                name: 'receive',
                query: {
                    type: 'standard',
                    product: this.warehouseProductDetail.id,
                    warehouse: this.selectedWarehouse.id,
                    ...(this.selectedFilterLocation ? { location: this.selectedFilterLocation.id } : {}),
                    from: 'warehouses',
                },
            })
        },
        shipWarehouseProduct() {
            if (!this.warehouseProductDetail || !this.selectedWarehouse) return
            this.$router.push({
                name: 'dispatch',
                query: {
                    mode: 'ship',
                    product: this.warehouseProductDetail.id,
                    warehouse: this.selectedWarehouse.id,
                    ...(this.selectedFilterLocation ? { location: this.selectedFilterLocation.id } : {}),
                    from: 'warehouses',
                },
            })
        },
        moveWarehouseProduct() {
            if (!this.warehouseProductDetail || !this.selectedWarehouse) return
            this.$router.push({
                name: 'dispatch',
                query: {
                    mode: 'move',
                    product: this.warehouseProductDetail.id,
                    warehouse: this.selectedWarehouse.id,
                    ...(this.selectedFilterLocation ? { location: this.selectedFilterLocation.id } : {}),
                    from: 'warehouses',
                },
            })
        },
        openWarehouseProductPage() {
            if (!this.warehouseProductDetail) return
            this.$router.push({
                name: 'products',
                query: {
                    product: this.warehouseProductDetail.id,
                    open: '1',
                    warehouse: this.selectedWarehouse?.id || undefined,
                    location: this.selectedLocationFilterId || undefined,
                    from: 'warehouses',
                },
            })
        },
        openWarehouseProductBatch(batchId) {
            if (!batchId) return
            this.closeWarehouseProductDetail()
            this.openDetailLot(batchId)
        },
        closeWarehouseProductDetail() {
            this.barcodePreviewOpen = false
            this.warehouseProductDetail = null
        },
        signedNumber(value) {
            const number = Number(value) || 0
            return `${number > 0 ? '+' : ''}${this.formatNumber(number)}`
        },
        movementTone(movement) {
            return this.store.isTransferMovement(movement)
                ? 'in'
                : movement?.changedQuantity >= 0
                  ? 'in'
                  : 'out'
        },
        batchItemAvailabilityTone(item) {
            const available = Number(item?.availableQuantity || 0)
            const required = Number(item?.recipeQuantity || 0)
            if (!(required > 0)) return ''
            if (available + 0.0001 < required) return 'is-short'
            if (available > required + 0.0001) return 'is-over'
            return 'is-exact'
        },
        movementSourceLabel(movement) {
            const context = this.store.shipmentMovementContext(movement)
            if (!context) return this.movementRoute(movement)
            const parts = [context.sourceWarehouseName, context.sourceLocation].filter(Boolean)
            return parts.join(' · ') || this.movementRoute(movement)
        },
        movementBalanceScope(movement) {
            const context = this.store.shipmentMovementContext(movement)
            if (!context) return 'Total stock'
            return context.sourceBefore !== null && context.sourceAfter !== null
                ? 'Source stock'
                : context.isBatchShipment
                  ? 'Batch stock total'
                  : 'Total stock'
        },
        movementDisplayBefore(movement) {
            const context = this.store.shipmentMovementContext(movement)
            const value = context?.sourceBefore !== null && context?.sourceBefore !== undefined
                ? context.sourceBefore
                : this.store.movementBalances(movement).totalBefore
            return `${this.formatNumber(value)} ${this.movementUnit(movement)}`
        },
        movementDisplayAfter(movement) {
            const context = this.store.shipmentMovementContext(movement)
            const value = context?.sourceAfter !== null && context?.sourceAfter !== undefined
                ? context.sourceAfter
                : this.store.movementBalances(movement).totalAfter
            return `${this.formatNumber(value)} ${this.movementUnit(movement)}`
        },
        movementIcon(movement) {
            if (this.store.isTransferMovement(movement)) return 'fa-right-left'
            if (movement?.type === 'Label Print') return 'fa-print'
            if (['Count Gain', 'Count Loss'].includes(movement?.type)) return 'fa-list-check'
            return movement?.changedQuantity >= 0
                ? 'fa-arrow-down'
                : 'fa-arrow-up'
        },
        movementQuantityLabel(movement) {
            const quantity = this.store.movementQuantity(movement)
            if (this.store.isTransferMovement(movement)) return this.formatNumber(quantity)
            return this.signedNumber(quantity)
        },
        isTransferMovement(movement) {
            return this.store.isTransferMovement(movement)
        },
        movementUnit(movement) {
            return this.store.movementUnit(movement)
        },
        hasTransferBalances(movement) {
            if (!this.isTransferMovement(movement)) return false
            const balances = this.store.movementBalances(movement)
            return [
                balances.sourceBefore,
                balances.sourceAfter,
                balances.destinationBefore,
                balances.destinationAfter,
            ].every((value) => value !== null)
        },
        transferSourceBalanceLabel(movement) {
            const balances = this.store.movementBalances(movement)
            return `${this.formatNumber(balances.sourceBefore)} → ${this.formatNumber(balances.sourceAfter)} ${this.movementUnit(movement)}`
        },
        transferDestinationBalanceLabel(movement) {
            const balances = this.store.movementBalances(movement)
            return `${this.formatNumber(balances.destinationBefore)} → ${this.formatNumber(balances.destinationAfter)} ${this.movementUnit(movement)}`
        },
        movementTotalBefore(movement) {
            return this.formatNumber(this.store.movementBalances(movement).totalBefore)
        },
        movementTotalAfter(movement) {
            return this.formatNumber(this.store.movementBalances(movement).totalAfter)
        },
        movementRoute(movement) {
            return this.store.movementRoute(movement)
        },
        initials(name) {
            return String(name || '')
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase()
        },
        locationIcon(type) {
            const value = String(type || '').toLowerCase()
            if (value.includes('chiller') || value.includes('freezer'))
                return 'fa-solid fa-snowflake'
            if (value.includes('return')) return 'fa-solid fa-arrow-rotate-left'
            if (value.includes('inspection')) return 'fa-solid fa-magnifying-glass'
            return 'fa-solid fa-table-cells-large'
        },
        statusClass(status) {
            return String(status || 'active')
                .toLowerCase()
                .replaceAll('_', '-')
        },
        statusLabel(status) {
            const labels = {
                empty: 'Empty',
                'partially-occupied': 'Partial',
                occupied: 'Full',
                unavailable: 'Unavailable',
                available: 'Available',
                active: 'Active',
                shipped: 'Shipped',
                damaged: 'Damaged',
                expired: 'Expired',
                lost: 'Lost',
            }
            return labels[status] || String(status || 'Active')
        },
        capacityText(row) {
            return this.stockCapacityText(row)
        },
        stockCapacityText(row) {
            const current = this.formatNumber(row.stockQuantity)
            const maximum = Number(row.location.capacityValue) > 0
                ? this.formatNumber(row.location.capacityValue)
                : '—'
            return `${current} / ${maximum}`
        },
        dateLabel(value) {
            if (!value) return 'No expiry'
            const date = new Date(value)
            return Number.isNaN(date.getTime())
                ? value
                : new Intl.DateTimeFormat('en-MY', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                  }).format(date)
        },
        dateTimeLabel(value) {
            if (!value) return '–'
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) return value
            return new Intl.DateTimeFormat('en-MY', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date)
        },
        movementDateLabel(value) {
            if (!value) return '—'
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) return String(value)
            return new Intl.DateTimeFormat('en-MY', {
                day: '2-digit', month: 'short', year: 'numeric',
            }).format(date)
        },
        movementTimeLabel(value) {
            if (!value) return ''
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) return ''
            return new Intl.DateTimeFormat('en-MY', {
                hour: '2-digit', minute: '2-digit',
            }).format(date)
        },
        productName(productId) {
            return this.store.findProduct(productId)?.name || 'Product'
        },
        productUnit(productId) {
            return this.store.findProduct(productId)?.unit || ''
        },
        openProduct(product) {
            this.detailProduct = this.store.findProduct(product.id) || product
        },
        openBatchProduct(productId) {
            this.closeDetailLot()
            this.detailProduct = this.store.findProduct(productId) || this.detailProduct
        },
        closeNestedProduct() {
            this.detailProduct = null
        },
        refreshNestedProduct() {
            if (!this.detailProduct) return
            this.detailProduct = this.store.findProduct(this.detailProduct.id) || null
        },
        receiveNestedProduct(product) {
            this.$router.push({ name: 'receive', query: { product: product.id, open: '1', choose: '1', warehouse: this.selectedWarehouse?.id || undefined, location: this.selectedLocationFilterId || undefined, from: 'warehouses' } })
        },
        editNestedProduct() {
            if (!this.detailProduct) return
            this.$router.push({ path: '/inventory/products', query: { product: this.detailProduct.id, open: '1' } })
        },
        openDetailLot(lot) {
            const batchId = typeof lot === 'object' ? lot?.id : lot
            if (!batchId) return
            this.warehouseBatchDetailId = batchId
            this.warehouseBatchDetailLocationId = this.detailRow?.location?.id || this.selectedLocationFilterId || ''
        },
        closeDetailLot() {
            this.warehouseBatchDetailId = ''
            this.warehouseBatchDetailLocationId = ''
        },
        stockInWarehouseBatch() {
            if (!this.warehouseBatchDetail || !this.selectedWarehouse) return
            this.$router.push({
                name: 'receive',
                query: {
                    stockTarget: 'batch',
                    batch: this.warehouseBatchDetail.id,
                    warehouse: this.selectedWarehouse.id,
                    from: 'warehouses',
                    ...(this.warehouseBatchContextLocation ? { location: this.warehouseBatchContextLocation.id } : {}),
                },
            })
        },
        moveWarehouseBatch() {
            if (!this.warehouseBatchDetail || !this.selectedWarehouse) return
            this.$router.push({
                name: 'dispatch',
                query: {
                    mode: 'move',
                    source: 'batch',
                    batch: this.warehouseBatchDetail.id,
                    warehouse: this.selectedWarehouse.id,
                    from: 'warehouses',
                    ...(this.warehouseBatchContextLocation ? { location: this.warehouseBatchContextLocation.id } : {}),
                },
            })
        },
        shipBatch(batchOrId) {
            const batchId = typeof batchOrId === 'object' ? batchOrId?.id : batchOrId
            this.closeLocationDetails()
            this.locationPage = 1
            this.$router.push({
                name: 'dispatch',
                query: { mode: 'ship', source: 'batch', batch: batchId },
            })
        },
        openStockIn(location = null) {
            if (!this.selectedWarehouse) return
            this.$router.push({
                name: 'receive',
                query: {
                    warehouse: this.selectedWarehouse.id,
                    choose: '1',
                    from: 'warehouses',
                    ...(location ? { location: location.id } : {}),
                },
            })
        },
        openStockOut(location = null) {
            if (!this.selectedWarehouse) return
            this.$router.push({
                name: 'dispatch',
                query: {
                    warehouse: this.selectedWarehouse.id,
                    mode: 'remove',
                    from: 'warehouses',
                    ...(location ? { location: location.id, source: 'location' } : {}),
                },
            })
        },
        openStockMovement(location = null) {
            if (!this.selectedWarehouse) return
            this.$router.push({
                name: 'dispatch',
                query: {
                    mode: 'move',
                    warehouse: this.selectedWarehouse.id,
                    from: 'warehouses',
                    ...(location ? { location: location.id, source: 'location' } : {}),
                },
            })
        },
        receiptDocument(receipt) {
            if (!receipt) return null
            const siblings = this.store.state.receipts.filter((item) => {
                if (receipt.batchGroupId) return item.batchGroupId === receipt.batchGroupId && item.supplierId === receipt.supplierId
                if (receipt.invoiceNumber) return item.invoiceNumber === receipt.invoiceNumber && item.supplierId === receipt.supplierId && item.receivedDate === receipt.receivedDate
                return item.id === receipt.id
            })
            const receipts = siblings.length ? siblings : [receipt]
            return {
                ...receipt,
                receiptIds: receipts.map((item) => item.receiptNumber || item.id),
                lines: receipts.flatMap((item) => (item.lines || []).map((line) => ({ ...line, receiptId: item.id }))),
                companyName: 'Inventory Workspace',
                companyDetails: receipt.warehouseName || 'Main Warehouse',
            }
        },
        openLocationMovementInvoice() {
            if (!this.selectedLocationMovementInvoice) return
            this.locationEvidenceOpen = false
            this.selectedLocationReceipt = this.receiptDocument(this.selectedLocationMovementInvoice)
        },
        openLocationEvidence() {
            if (!this.selectedLocationMovement) return
            this.locationEvidenceOpen = true
        },
        closeLocationEvidence() {
            this.locationEvidenceOpen = false
        },
        closeLocationMovement() {
            this.locationEvidenceOpen = false
            this.selectedLocationMovement = null
        },
        openLocationMovement(movement) {
            this.locationEvidenceOpen = false
            const receipt = this.store.findReceiptForMovement(movement, { invoiceOnly: true })
            if (receipt) {
                this.selectedLocationMovement = null
                this.selectedLocationReceipt = this.receiptDocument(receipt)
                return
            }
            this.selectedLocationReceipt = null
            this.selectedLocationMovement = movement
        },
        openLocationDetails(row) {
            this.detailRow =
                this.store.locationMetrics(
                    this.selectedWarehouse.id,
                    row.location.id,
                ) || row
            this.detailTab = 'products'
            this.locationEvidenceOpen = false
            this.selectedLocationMovement = null
            this.selectedLocationReceipt = null
        },
        closeLocationDetails() {
            this.detailProduct = null
            this.expandedDetailLotId = ''
            this.closeDetailLot()
            this.locationEvidenceOpen = false
            this.selectedLocationMovement = null
            this.selectedLocationReceipt = null
            this.detailRow = null
            this.detailTab = 'products'
        },
        goBack() {
            this.$router.push({ name: 'dashboard' })
        },
        openWarehouseForm(warehouse = null) {
            this.formMode = 'warehouse'
            this.editing = warehouse
            this.error = ''
            this.form = {
                ...this.emptyForm(),
                name: warehouse?.name || '',
                nameMode: warehouse?.nameMode || 'single',
                nameTranslations: this.editableNameTranslations(warehouse),
                code: warehouse?.code || '',
                purpose: warehouse?.purpose || '',
                companyName: warehouse?.companyName || '',
                address: warehouse?.address || '',
                contactName: warehouse?.contactName || '',
                phone: warehouse?.phone || '',
            }
        },
        openLocationForm(location = null) {
            if (!this.selectedWarehouse) return
            this.formMode = 'location'
            this.editing = location
            this.error = ''
            this.form = {
                ...this.emptyForm(),
                name: location?.name || '',
                nameMode: location?.nameMode || 'single',
                nameTranslations: this.editableNameTranslations(location),
                code: location?.code || '',
                type: location?.type || 'Rack',
                capacityValue: location?.capacityValue ?? '',
                capacityUnit: 'units',
                status:
                    location?.status === 'unavailable' || location?.active === false
                        ? 'unavailable'
                        : 'active',
            }
        },
        closeForm() {
            this.formMode = ''
            this.editing = null
            this.error = ''
            this.form = this.emptyForm()
        },
        editableNameTranslations(record) {
            const translations = record?.nameTranslations || record?.nameI18n || {}
            const english = translations.en || record?.name || ''
            return {
                en: english,
                cn: translations.cn === english ? '' : translations.cn || '',
                bm: translations.bm === english ? '' : translations.bm || '',
            }
        },
        applyLocalizedName({ mode, translations }) {
            this.form.nameMode = mode
            this.form.nameTranslations = translations
            this.form.name = translations.en
            this.error = ''
        },
        confirmDeleteWarehouse(warehouse) {
            if (!warehouse?.id) return
            if (!window.confirm(`Delete warehouse "${warehouse.name}"?`)) return
            try {
                const deletingSelected = warehouse.id === this.selectedWarehouseId
                this.store.deleteWarehouse(warehouse.id)
                this.store.addToast('Warehouse deleted.')
                this.closeForm()
                this.closeLocationDetails()
                if (deletingSelected) {
                    this.selectedWarehouseId = this.warehouses[0]?.id || ''
                }
            } catch (error) {
                this.error = error.message
                this.store.addToast(error.message)
            }
        },
        confirmDeleteLocation(location) {
            if (!location?.id || !this.selectedWarehouse) return
            if (!window.confirm(`Delete location "${location.name}"?`)) return
            try {
                this.store.deleteWarehouseLocation(this.selectedWarehouse.id, location.id)
                this.store.addToast('Location deleted.')
                this.closeForm()
                if (this.detailRow?.location?.id === location.id) this.closeLocationDetails()
                if (this.locationPage > this.locationPageCount) this.locationPage = this.locationPageCount
            } catch (error) {
                this.error = error.message
                this.store.addToast(error.message)
            }
        },
        saveForm() {
            try {
                this.form.name = this.form.nameTranslations.en
                if (this.formMode === 'warehouse') {
                    const warehouse = this.store.saveWarehouse(
                        this.form,
                        this.editing?.id,
                    )
                    this.selectedWarehouseId = warehouse.id
                    registerLocalizedFields(warehouse.nameTranslations)
                } else {
                    const location = this.store.saveWarehouseLocation(
                        this.selectedWarehouse.id,
                        {
                            ...this.form,
                            capacityUnit: Number(this.form.capacityValue) > 0 ? 'units' : '',
                            active: this.form.status !== 'unavailable',
                        },
                        this.editing?.id,
                    )
                    registerLocalizedFields(location.nameTranslations)
                }
                this.store.addToast(
                    `${this.formMode === 'warehouse' ? 'Warehouse' : 'Location'} saved.`,
                )
                this.closeForm()
                if (this.detailRow) {
                    this.detailRow = this.store.locationMetrics(
                        this.selectedWarehouse.id,
                        this.detailRow.location.id,
                    )
                }
            } catch (error) {
                this.error = error.message
            }
        },
    },
}
</script>

<style scoped src="@/assets/css/pages/warehouses.css"></style>
