<template>
    <main class="menu-admin-page">
        <section class="menu-admin-shell">
            <PosTopbar />
            <section class="menu-admin-workspace">
                <header class="menu-admin-header">
                    <h2>Menu Management</h2>
                </header>
                <nav class="menu-category-bar">
                    <button
                        type="button"
                        :class="{ active: selectedCategory === 'All' }"
                        @click="selectedCategory = 'All'"
                    >
                        All
                    </button>
                    <button
                        v-for="category in categories"
                        :key="category"
                        type="button"
                        :class="{ active: selectedCategory === category }"
                        @click="selectedCategory = category"
                    >
                        {{ localizedCategoryName(category) }}
                    </button>
                    <button
                        type="button"
                        class="add-category-inline"
                        aria-label="Add category"
                        title="Add category"
                        @click="showCategoryField"
                    >
                        <i class="fa-solid fa-plus"></i></button
                    ><span class="category-spacer"></span
                    ><button
                        type="button"
                        class="create-set-button"
                        @click="createSetMeal"
                    >
                        <i class="fa-solid fa-layer-group"></i>
                        Create set
                    </button
                    ><button
                        type="button"
                        class="delete-category-trigger"
                        aria-label="Delete category"
                        title="Delete category"
                        @click="openCategoryDelete"
                    >
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </nav>
                <p class="menu-sort-hint">
                    <i class="fa-solid fa-grip"></i>
                    Hold a dish for 1 second, then drag it to reorder.
                </p>
                <section
                    ref="productGrid"
                    class="managed-product-grid long-sort-enabled"
                >
                    <button
                        type="button"
                        class="simple-add-card"
                        @click="handleAddCard"
                    >
                        <i class="fa-solid fa-plus"></i
                        ><strong
                            >Add to
                            {{
                                selectedCategory === 'All'
                                    ? 'menu'
                                    : selectedCategory
                            }}</strong
                        >
                    </button>
                    <button
                        v-for="product in filteredProducts"
                        :key="product.id"
                        type="button"
                        class="simple-menu-card"
                        :data-sort-id="product.id"
                        :aria-label="`${localizedProductName(product)}, hold for one second to move`"
                        :class="productStatus(product)"
                        @click="handleProductClick(product)"
                    >
                        <img
                            v-if="product.image"
                            :class="{
                                muted: productStatus(product) !== 'available',
                            }"
                            :src="product.image"
                            :alt="localizedProductName(product)"
                        /><span v-else class="card-photo-empty"
                            ><i class="fa-regular fa-image"></i></span
                        ><small>{{ productCardEyebrow(product) }}</small>
                        <h3>{{ localizedProductName(product) }}</h3>
                        <strong>RM {{ money(product.price) }}</strong
                        ><span class="card-status">{{
                            statusLabel(product)
                        }}</span
                        ><i class="fa-solid fa-chevron-right"></i>
                    </button>
                </section>
            </section>
        </section>

        <div
            v-if="detailProduct"
            class="menu-admin-backdrop"
            @click.self="requestCloseDetail"
        >
            <section class="product-inspector">
                <header>
                    <div class="inspector-heading">
                        <span class="inspector-category-label">
                            {{ detailProduct.category }}
                        </span>
                        <h2>Product details</h2>
                    </div>
                    <div class="inspector-header-actions">
                        <button
                            type="button"
                            class="header-add-option"
                            @click="
                                groupEditor = {
                                    name: '',
                                    nameMode: 'single',
                                    nameTranslations: newLocalizedName(),
                                    languageIndex: 0,
                                    editingOptions: true,
                                    options: [{ name: '', price: 0 }],
                                }
                            "
                        >
                            <i class="fa-solid fa-plus"></i
                            ><span>Option category</span></button
                        ><button
                            type="button"
                            class="inspector-close"
                            @click="requestCloseDetail"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </header>
                <div class="product-inspector-body">
                    <section class="inspector-photo">
                        <button
                            type="button"
                            class="change-image"
                            :class="{ empty: !detailProduct.image }"
                            title="Change image"
                            @click="$refs.productImageInput.click()"
                        >
                            <img
                                v-if="detailProduct.image"
                                :class="{
                                    muted:
                                        productStatus(detailProduct) !==
                                        'available',
                                }"
                                :src="detailProduct.image"
                                :alt="detailProduct.name"
                            /><span v-else class="empty-photo"
                                ><i class="fa-solid fa-camera"></i
                                ><small>Add photo</small></span
                            ><span
                                v-if="
                                    detailProduct.image &&
                                    productStatus(detailProduct) !== 'available'
                                "
                                class="photo-status"
                                >{{ statusLabel(detailProduct) }}</span
                            ><i
                                v-if="detailProduct.image"
                                class="fa-solid fa-camera"
                            ></i>
                        </button>
                        <input
                            ref="productImageInput"
                            class="hidden-file"
                            type="file"
                            accept="image/*"
                            @change="replaceImage"
                        />
                        <span
                            v-if="productStatus(detailProduct) === 'available'"
                            class="available-label"
                            >Available</span
                        >
                    </section>
                    <section class="inspector-details">
                        <div class="inspector-product-fields">
                            <strong>Product</strong>
                            <div>
                                <input
                                    v-if="isCreatingProduct"
                                    v-model.trim="detailProduct.name"
                                    maxlength="60"
                                    placeholder="Product name"
                                /><button
                                    v-else
                                    type="button"
                                    @click="startFieldEdit('name')"
                                >
                                    {{ localizedProductName(detailProduct) }}</button
                                ><button
                                    type="button"
                                    class="product-price-field"
                                    @click="startFieldEdit('price')"
                                >
                                    RM {{ money(detailProduct.price) }}
                                </button>
                            </div>
                        </div>
                        <fieldset class="product-category-choices">
                            <legend>Category</legend>
                            <div>
                                <button
                                    v-for="category in categories"
                                    :key="category"
                                    type="button"
                                    role="radio"
                                    :aria-checked="
                                        detailProduct.category === category
                                    "
                                    :class="{
                                        active:
                                            detailProduct.category ===
                                            category,
                                    }"
                                    @click="selectProductCategory(category)"
                                >
                                    <i
                                        :class="
                                            detailProduct.category === category
                                                ? 'fa-solid fa-circle-check'
                                                : 'fa-regular fa-circle'
                                        "
                                    ></i>
                                    {{ localizedCategoryName(category) }}
                                </button>
                                <button
                                    type="button"
                                    class="product-category-add"
                                    aria-label="Add category"
                                    title="Add category"
                                    @click="showCategoryField"
                                >
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </fieldset>
                        <div
                            v-for="group in editableOptionGroups(detailProduct)"
                            :key="group.key"
                            class="inspector-option-group"
                        >
                            <header class="option-group-heading">
                                <strong>{{ group.label }}</strong
                                ><button
                                    v-if="group.custom"
                                    type="button"
                                    :aria-label="`Remove ${group.label}`"
                                    @click="groupDeleteTarget = group"
                                >
                                    −
                                </button>
                            </header>
                            <div>
                                <button
                                    v-for="(option, index) in group.items"
                                    :key="`${group.key}-${index}`"
                                    type="button"
                                    class="option-chip"
                                    @click="startOptionEdit(group, index)"
                                >
                                    {{ displayOption(group, option) }}</button
                                ><button
                                    type="button"
                                    class="option-add"
                                    :aria-label="`Add ${group.label}`"
                                    @click="startOptionEdit(group, -1)"
                                >
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        <div class="description-field">
                            <strong>Description</strong
                            ><button
                                type="button"
                                class="editable-description"
                                @click="startFieldEdit('description')"
                            >
                                {{
                                    detailProduct.description ||
                                    'Click to add description.'
                                }}
                            </button>
                        </div>
                    </section>
                    <aside class="inspector-actions">
                        <button
                            type="button"
                            title="Sold out"
                            aria-label="Sold out"
                            :class="{
                                active:
                                    productStatus(detailProduct) === 'soldout',
                            }"
                            @click="toggleStatus('soldout')"
                        >
                            <i class="fa-solid fa-box-open"></i>
                        </button>
                        <button
                            type="button"
                            title="Unavailable"
                            aria-label="Unavailable"
                            :class="{
                                active:
                                    productStatus(detailProduct) ===
                                    'unavailable',
                            }"
                            @click="toggleStatus('unavailable')"
                        >
                            <i class="fa-solid fa-eye-slash"></i>
                        </button>
                        <button
                            type="button"
                            class="inspector-delete"
                            title="Delete dish"
                            aria-label="Delete dish"
                            @click="requestDelete(detailProduct)"
                        >
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </aside>
                </div>
                <footer
                    v-if="isCreatingProduct && hasDraftChanges"
                    class="product-create-footer"
                >
                    <button
                        type="button"
                        :disabled="!isDraftReady"
                        @click="confirmNewProduct"
                    >
                        <i class="fa-solid fa-check"></i>Confirm product
                    </button>
                </footer>
            </section>
        </div>

        <div
            v-if="setEditor"
            class="menu-admin-backdrop set-meal-layer"
            @click.self="requestCloseSetMealEditor"
        >
            <form class="set-meal-editor" @submit.prevent="saveSetMeal">
                <header>
                    <div>
                        <span>SET MENU</span>
                        <h2>{{ setEditor.id ? 'Edit set' : 'Create set' }}</h2>
                    </div>
                    <div class="set-editor-header-actions">
                        <button
                            v-if="setEditor.id"
                            type="button"
                            class="set-editor-delete"
                            aria-label="Delete set"
                            @click="setDeleteConfirm = true"
                        >
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                        <button
                            type="button"
                            class="set-editor-close"
                            aria-label="Close set editor"
                            @click="requestCloseSetMealEditor"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </header>

                <div class="set-meal-layout">
                    <section class="set-meal-details-panel">
                    <label class="set-name-field">
                        Set name
                        <input
                            v-model.trim="setEditor.name"
                            maxlength="60"
                            placeholder="e.g. Workday Lunch Set"
                            required
                        />
                    </label>
                    <label class="set-price-field">
                        Set price (RM)
                        <input
                            v-model.number="setEditor.price"
                            type="number"
                            min="0.01"
                            max="99999.99"
                            step="0.01"
                            required
                        />
                    </label>
                    <div class="set-time-range">
                    <label>
                        Available from
                        <input v-model="setEditor.availableFrom" type="time" />
                    </label>
                    <i class="fa-solid fa-arrow-right"></i>
                    <label>
                        Available until
                        <input v-model="setEditor.availableTo" type="time" />
                    </label>
                    </div>
                    <p class="set-schedule-note">
                        <i class="fa-regular fa-clock"></i>
                        Outside this time, customers see Set unavailable.
                    </p>
                    </section>

                    <section
                        class="set-meal-products-panel"
                        role="button"
                        tabindex="0"
                        @click="openSetProductPicker"
                        @keydown.enter="openSetProductPicker"
                    >
                        <header>
                            <span>
                                <strong>Included menu items</strong>
                                <small>Press this area to choose dishes.</small>
                            </span>
                            <button
                                type="button"
                                aria-label="Choose menu items"
                                @click.stop="openSetProductPicker"
                            >
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </header>
                        <div
                            v-if="setEditor.setItems.length"
                            class="set-editor-item-preview"
                        >
                            <article
                                v-for="item in setEditor.setItems"
                                :key="item.productId"
                            >
                                <img
                                    v-if="setItemProduct(item.productId)?.image"
                                    :src="setItemProduct(item.productId).image"
                                    :alt="setItemProduct(item.productId).name"
                                />
                                <span>
                                    <strong>
                                        {{ localizedProductName(setItemProduct(item.productId)) }}
                                    </strong>
                                    <small>Qty {{ item.quantity }}</small>
                                </span>
                            </article>
                        </div>
                        <p v-else>
                            <i class="fa-solid fa-plus"></i>
                            No menu items selected yet
                        </p>
                    </section>
                </div>

                <footer>
                    <button type="button" @click="requestCloseSetMealEditor">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        class="save-set-meal"
                        :disabled="!setEditorReady"
                    >
                        Save set
                    </button>
                </footer>
            </form>
        </div>

        <div
            v-if="setEditor && showSetProductPicker"
            class="menu-admin-backdrop set-picker-layer"
            @click.self="closeSetProductPicker"
        >
            <section class="set-picker-modal">
                <header>
                    <button
                        type="button"
                        class="set-picker-back"
                        :aria-label="
                            setPickerProduct
                                ? 'Back to menu items'
                                : 'Back to set editor'
                        "
                        @click="handleSetPickerBack"
                    >
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <span>BUILD SET</span>
                        <h2>
                            {{
                                setPickerProduct
                                    ? localizedProductName(setPickerProduct)
                                    : 'Choose menu items'
                            }}
                        </h2>
                    </div>
                    <button
                        type="button"
                        class="modal-x"
                        aria-label="Close menu item picker"
                        @click="closeSetProductPicker"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>

                <div class="set-picker-body">
                    <section class="set-picker-selection">
                        <header>
                            <div>
                                <strong>Included menu items</strong>
                                <small>Items added to this set.</small>
                            </div>
                            <span>{{ setEditor.setItems.length }}</span>
                        </header>
                        <div
                            v-if="setEditor.setItems.length"
                            class="selected-set-products"
                        >
                            <article
                                v-for="item in setEditor.setItems"
                                :key="item.productId"
                            >
                                <img
                                    v-if="setItemProduct(item.productId)?.image"
                                    :src="setItemProduct(item.productId).image"
                                    :alt="setItemProduct(item.productId).name"
                                />
                                <span>
                                    <strong>
                                        {{ localizedProductName(setItemProduct(item.productId)) }}
                                    </strong>
                                    <small>Qty {{ item.quantity }}</small>
                                </span>
                                <div>
                                    <button
                                        type="button"
                                        :aria-label="`Decrease ${setItemProduct(item.productId)?.name}`"
                                        @click="changeSetItemQuantity(item.productId, -1)"
                                    >
                                        −
                                    </button>
                                    <strong>{{ item.quantity }}</strong>
                                    <button
                                        type="button"
                                        :aria-label="`Increase ${setItemProduct(item.productId)?.name}`"
                                        @click="changeSetItemQuantity(item.productId, 1)"
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    :aria-label="`Remove ${setItemProduct(item.productId)?.name}`"
                                    @click="removeSetProduct(item.productId)"
                                >
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </article>
                        </div>
                        <p v-else class="set-products-empty">
                            No menu items selected yet. Choose a dish on the right.
                        </p>
                    </section>

                    <section v-if="!setPickerProduct" class="set-picker-browser">
                        <nav class="set-picker-categories">
                            <button
                                type="button"
                                :class="{ active: setPickerCategory === 'All' }"
                                @click="setPickerCategory = 'All'"
                            >
                                All
                            </button>
                            <button
                                v-for="category in setPickerCategories"
                                :key="category"
                                type="button"
                                :class="{ active: setPickerCategory === category }"
                                @click="setPickerCategory = category"
                            >
                                {{ localizedCategoryName(category) }}
                            </button>
                        </nav>
                        <div class="set-picker-product-grid">
                            <button
                                v-for="product in setPickerProducts"
                                :key="product.id"
                                type="button"
                                @click="previewSetProduct(product)"
                            >
                                <img
                                    v-if="product.image"
                                    :src="product.image"
                                    :alt="product.name"
                                />
                                <span v-else class="set-picker-photo-empty">
                                    <i class="fa-regular fa-image"></i>
                                </span>
                                <strong>{{ localizedProductName(product) }}</strong>
                                <small>RM {{ money(product.price) }}</small>
                            </button>
                        </div>
                    </section>

                    <section v-else class="set-picker-product-detail">
                        <div class="set-picker-product-photo">
                            <img
                                v-if="setPickerProduct.image"
                                :src="setPickerProduct.image"
                                :alt="setPickerProduct.name"
                            />
                            <i v-else class="fa-regular fa-image"></i>
                        </div>
                        <span>{{ setPickerProduct.category }}</span>
                                <h3>{{ localizedProductName(setPickerProduct) }}</h3>
                        <strong>RM {{ money(setPickerProduct.price) }}</strong>
                        <div class="set-picker-quantity">
                            <button
                                type="button"
                                aria-label="Decrease quantity"
                                :disabled="setPickerQuantity === 1"
                                @click="setPickerQuantity--"
                            >
                                −
                            </button>
                            <span>
                                <small>Quantity</small>
                                <strong>{{ setPickerQuantity }}</strong>
                            </span>
                            <button
                                type="button"
                                aria-label="Increase quantity"
                                @click="setPickerQuantity++"
                            >
                                +
                            </button>
                        </div>
                        <button
                            type="button"
                            class="add-set-product"
                            @click="addSetPickerProduct"
                        >
                            <i class="fa-solid fa-plus"></i>
                            Add to set
                        </button>
                    </section>
                </div>
                <footer class="set-picker-footer">
                    <button type="button" @click="closeSetProductPicker">
                        <i class="fa-solid fa-check"></i>
                        Confirm items
                    </button>
                </footer>
            </section>
        </div>

        <div
            v-if="setCloseConfirm"
            class="menu-admin-backdrop draft-close-layer"
        >
            <section class="draft-close-modal">
                <h2>
                    {{ setEditorReady ? 'Save this set?' : 'Set details incomplete' }}
                </h2>
                <p>
                    {{
                        setEditorReady
                            ? 'Save the completed set before closing, or discard these changes.'
                            : 'The set still needs a name, price and at least one menu item.'
                    }}
                </p>
                <footer>
                    <button
                        type="button"
                        class="discard-draft"
                        @click="discardSetDraft"
                    >
                        Discard
                    </button>
                    <button
                        v-if="setEditorReady"
                        type="button"
                        class="save-draft"
                        @click="saveSetMeal"
                    >
                        Save
                    </button>
                    <button
                        v-else
                        type="button"
                        class="resume-draft"
                        @click="setCloseConfirm = false"
                    >
                        Resume
                    </button>
                </footer>
            </section>
        </div>

        <div
            v-if="setDeleteConfirm"
            class="menu-admin-backdrop edit-layer set-delete-layer"
        >
            <section class="confirm-status-modal delete-confirm">
                <button
                    type="button"
                    class="modal-x"
                    aria-label="Close delete confirmation"
                    @click="setDeleteConfirm = false"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <i class="fa-regular fa-trash-can"></i>
                <h2>Delete {{ setEditor?.name || 'this set' }}?</h2>
                <p>This set will be removed from the menu.</p>
                <footer>
                    <button type="button" @click="setDeleteConfirm = false">
                        Cancel
                    </button>
                    <button type="button" @click="deleteSetMeal">
                        Delete
                    </button>
                </footer>
            </section>
        </div>

        <div
            v-if="closeDraftConfirm"
            class="menu-admin-backdrop draft-close-layer"
        >
            <section class="draft-close-modal">
                <h2>
                    {{
                        isDraftReady
                            ? 'Save this product?'
                            : 'Product details incomplete'
                    }}
                </h2>
                <p>
                    {{
                        isDraftReady
                            ? 'Your product details have not been confirmed.'
                            : 'Complete the product name and price before saving.'
                    }}
                </p>
                <footer>
                    <button
                        type="button"
                        class="discard-draft"
                        @click="discardNewProduct"
                    >
                        Discard</button
                    ><button
                        v-if="isDraftReady"
                        type="button"
                        class="save-draft"
                        @click="confirmNewProduct"
                    >
                        Save</button
                    ><button
                        v-else
                        type="button"
                        class="resume-draft"
                        @click="resumeDraft"
                    >
                        Resume
                    </button>
                </footer>
            </section>
        </div>

        <div
            v-if="categoryEditor"
            class="menu-admin-backdrop edit-layer"
            @click.self="categoryEditor = null"
        >
            <form class="small-edit-modal" @submit.prevent="addCategory">
                <button
                    type="button"
                    class="modal-x"
                    aria-label="Close"
                    @click="categoryEditor = null"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <header>
                    <span>NEW</span>
                    <h2>Add category</h2>
                </header>
                <div class="language-choice-row">
                    <button
                        type="button"
                        :class="{ active: categoryEditor.mode === 'single' }"
                        @click="setCategoryNameMode('single')"
                    >
                        {{ $t('singleLanguage', 'Single language') }}
                    </button>
                    <button
                        type="button"
                        :class="{ active: categoryEditor.mode === 'multiple' }"
                        @click="setCategoryNameMode('multiple')"
                    >
                        {{ $t('multipleLanguages', 'Multiple languages') }}
                    </button>
                </div>
                <template v-if="categoryEditor.mode === 'multiple'">
                    <strong class="language-current-label">{{ languageLabel(categoryEditor.languageIndex) }}</strong>
                    <label>Category name<input
                        ref="categoryInput"
                        v-model.trim="categoryEditor.translations[currentCategoryLanguage]"
                        maxlength="24"
                        placeholder="e.g. Seasonal"
                        required
                    /></label>
                    <div class="language-entry-nav">
                        <button type="button" class="language-nav-button" :disabled="categoryEditor.languageIndex === 0" @click="moveCategoryLanguage(-1)">{{ $t('previous', 'Previous') }}</button>
                        <button v-if="categoryEditor.languageIndex < languages.length - 1" type="button" class="language-nav-button language-next-button" @click="moveCategoryLanguage(1)">{{ $t('next', 'Next') }}</button>
                        <button v-else type="submit" class="language-nav-button language-done-button">{{ $t('done', 'Done') }}</button>
                    </div>
                </template>
                <template v-else>
                    <label>Category name<input
                        ref="categoryInput"
                        v-model.trim="categoryEditor.value"
                        maxlength="24"
                        placeholder="e.g. Seasonal"
                        required
                    /></label>
                    <div class="language-entry-nav language-entry-nav-bottom language-single-complete-nav">
                        <button type="submit" class="language-nav-button language-done-button">{{ $t('complete', 'Complete') }}</button>
                    </div>
                </template>
            </form>
        </div>

        <div
            v-if="categoryDeletePicker"
            class="menu-admin-backdrop edit-layer"
            @click.self="categoryDeletePicker = false"
        >
            <section class="category-delete-modal">
                <button
                    type="button"
                    class="modal-x"
                    aria-label="Close"
                    @click="categoryDeletePicker = false"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <header>
                    <span>CATEGORY</span>
                    <h2>Choose a category</h2>
                </header>
                <div class="category-delete-list">
                    <button
                        v-for="category in categories"
                        :key="category"
                        type="button"
                        :class="{ active: categoryDeleteTarget === category }"
                        @click="categoryDeleteTarget = category"
                    >
                        <strong>{{ localizedCategoryName(category) }}</strong
                        ><span>{{ categoryProductCount(category) }} dishes</span
                        ><i class="fa-solid fa-check"></i>
                    </button>
                </div>
                <footer>
                    <button type="button" @click="categoryDeletePicker = false">
                        Cancel</button
                    ><button
                        type="button"
                        :disabled="!categoryDeleteTarget"
                        @click="continueCategoryDelete"
                    >
                        Continue
                    </button>
                </footer>
            </section>
        </div>

        <div
            v-if="categoryDeleteConfirm"
            class="menu-admin-backdrop edit-layer"
            @click.self="categoryDeleteConfirm = false"
        >
            <section class="confirm-status-modal delete-confirm">
                <button
                    type="button"
                    class="modal-x"
                    aria-label="Close"
                    @click="categoryDeleteConfirm = false"
                >
                    <i class="fa-solid fa-xmark"></i></button
                ><i class="fa-regular fa-trash-can"></i>
                <h2>Delete {{ categoryDeleteTarget }}?</h2>
                <p v-if="categoryProductCount(categoryDeleteTarget)">
                    Its dishes will move to Uncategorised.
                </p>
                <p v-else>This category will be removed.</p>
                <footer>
                    <button
                        type="button"
                        @click="categoryDeleteConfirm = false"
                    >
                        Cancel</button
                    ><button type="button" @click="deleteCategory">
                        Delete
                    </button>
                </footer>
            </section>
        </div>

        <div
            v-if="fieldEditor"
            class="menu-admin-backdrop edit-layer"
            @click.self="fieldEditor = null"
        >
            <form class="small-edit-modal language-editor-modal" @submit.prevent="completeFieldEdit">
                <button
                    type="button"
                    class="modal-x"
                    aria-label="Close"
                    @click="fieldEditor = null"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <template v-if="fieldEditor.field === 'name'">
                    <div class="language-choice-row">
                        <button type="button" :class="{ active: fieldEditor.mode === 'single' }" @click="setFieldNameMode('single')">{{ $t('singleLanguage', 'Single language') }}</button>
                        <button type="button" :class="{ active: fieldEditor.mode === 'multiple' }" @click="setFieldNameMode('multiple')">{{ $t('multipleLanguages', 'Multiple languages') }}</button>
                    </div>
                    <template v-if="fieldEditor.mode === 'multiple'">
                        <strong class="language-current-label">{{ languageLabel(fieldEditor.languageIndex) }}</strong>
                        <input v-model.trim="fieldEditor.translations[currentNameLanguage]" required />
                        <div class="language-entry-nav">
                            <button type="button" class="language-nav-button" :disabled="fieldEditor.languageIndex === 0" @click="moveNameLanguage(-1)">{{ $t('previous', 'Previous') }}</button>
                            <button v-if="fieldEditor.languageIndex < languages.length - 1" type="button" class="language-nav-button language-next-button" @click="moveNameLanguage(1)">{{ $t('next', 'Next') }}</button>
                            <button v-else type="button" class="language-nav-button language-done-button" @click="completeFieldEdit">Done</button>
                        </div>
                    </template>
                    <template v-else>
                        <input v-model.trim="fieldEditor.value" required />
                        <div class="language-entry-nav language-entry-nav-bottom language-single-complete-nav">
                            <button type="button" class="language-nav-button language-done-button" @click="completeFieldEdit">Complete</button>
                        </div>
                    </template>
                </template><select
                    v-else-if="fieldEditor.field === 'category'"
                    v-model="fieldEditor.value"
                >
                    <option v-for="category in categories" :key="category">
                        {{ localizedCategoryName(category) }}
                    </option></select
                ><textarea
                    v-else-if="fieldEditor.field === 'description'"
                    v-model.trim="fieldEditor.value"
                    rows="4"
                ></textarea
                ><input
                    v-else
                    v-model="fieldEditor.value"
                    :type="fieldEditor.field === 'price' ? 'number' : 'text'"
                    :step="fieldEditor.field === 'price' ? '0.10' : undefined"
                    :min="fieldEditor.field === 'price' ? '0' : undefined"
                    required
                />
            </form>
        </div>

        <div
            v-if="optionEditor"
            class="menu-admin-backdrop edit-layer"
            @click.self="optionEditor = null"
        >
            <form class="small-edit-modal" @submit.prevent="completeOptionEdit">
                <button
                    type="button"
                    class="modal-x"
                    aria-label="Close"
                    @click="optionEditor = null"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <header>
                    <span>{{ optionEditor.index < 0 ? 'ADD' : 'EDIT' }}</span>
                    <h2>{{ optionEditor.label }}</h2>
                </header>
                <label
                    >Name<input
                        v-model.trim="optionEditor.name"
                        required /></label
                ><label v-if="optionEditor.priced"
                    >Extra price (RM)<input
                        v-model.number="optionEditor.price"
                        type="number"
                        min="0"
                        step="0.10"
                /></label>
                <footer>
                    <button
                        type="button"
                        class="delete-edit"
                        @click="deleteOption"
                    >
                        <i class="fa-regular fa-trash-can"></i>Delete</button
                    ><button type="submit" class="complete-edit">
                        Complete
                    </button>
                </footer>
            </form>
        </div>

        <div
            v-if="groupEditor"
            class="menu-admin-backdrop edit-layer"
            @click.self="groupEditor = null"
        >
            <form class="small-edit-modal language-editor-modal" @submit.prevent="completeGroupEdit">
                <button
                    type="button"
                    class="modal-x"
                    aria-label="Close"
                    @click="groupEditor = null"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="language-choice-row">
                    <button type="button" :class="{ active: groupEditor.nameMode === 'single' }" @click="setGroupNameMode('single')">{{ $t('singleLanguage', 'Single language') }}</button>
                    <button type="button" :class="{ active: groupEditor.nameMode === 'multiple' }" @click="setGroupNameMode('multiple')">{{ $t('multipleLanguages', 'Multiple languages') }}</button>
                </div>
                <input v-if="groupEditor.nameMode === 'single'" v-model.trim="groupEditor.name" placeholder="e.g. Spice level" required />
                <template v-else-if="!groupEditor.editingOptions">
                    <strong class="language-current-label">{{ languageLabel(groupEditor.languageIndex) }}</strong>
                    <input v-model.trim="groupEditor.nameTranslations[currentGroupLanguage]" placeholder="e.g. Spice level" required />
                    <div class="language-entry-nav language-entry-nav-bottom">
                        <button type="button" class="language-nav-button" :disabled="groupEditor.languageIndex === 0" @click="moveGroupLanguage(-1)">{{ $t('previous', 'Previous') }}</button>
                        <button v-if="groupEditor.languageIndex < languages.length - 1" type="button" class="language-nav-button language-next-button" @click="moveGroupLanguage(1)">{{ $t('next', 'Next') }}</button>
                        <button v-else type="button" class="language-nav-button language-next-button" @click="openGroupOptions">Next</button>
                    </div>
                </template>
                <template v-if="groupEditor.nameMode === 'single' || groupEditor.editingOptions">
                <div class="group-option-labels">
                    <span>Option</span><span>Extra price (RM)</span>
                </div>
                <div
                    v-for="(option, index) in groupEditor.options"
                    :key="index"
                    class="group-option-create-row"
                >
                    <input
                        v-model.trim="option.name"
                        :placeholder="
                            index === 0 ? 'e.g. Mild' : 'Another option'
                        "
                        required
                    /><input
                        v-model.number="option.price"
                        type="number"
                        min="0"
                        step="0.10"
                        placeholder="0.00"
                    /><button
                        v-if="index === groupEditor.options.length - 1"
                        type="button"
                        aria-label="Add another option"
                        @click="addGroupOption"
                    >
                        <i class="fa-solid fa-plus"></i></button
                    ><button
                        v-else
                        type="button"
                        aria-label="Remove option"
                        @click="removeGroupOption(index)"
                    >
                        −
                    </button>
                </div>
                <div v-if="groupEditor.nameMode === 'multiple'" class="language-entry-nav language-entry-nav-bottom group-complete-nav">
                    <button type="button" class="language-nav-button" @click="backToGroupLanguage">{{ $t('previous', 'Previous') }}</button>
                    <button type="button" class="language-nav-button language-done-button" @click="completeGroupEdit">Complete</button>
                </div>
                <div v-else class="language-entry-nav language-entry-nav-bottom language-single-complete-nav">
                    <button type="button" class="language-nav-button language-done-button" @click="completeGroupEdit">Complete</button>
                </div>
                </template>
            </form>
        </div>

        <div
            v-if="groupDeleteTarget"
            class="menu-admin-backdrop edit-layer"
            @click.self="groupDeleteTarget = null"
        >
            <section class="confirm-status-modal delete-confirm">
                <button
                    type="button"
                    class="modal-x"
                    aria-label="Close"
                    @click="groupDeleteTarget = null"
                >
                    <i class="fa-solid fa-xmark"></i></button
                ><i class="fa-solid fa-minus"></i>
                <h2>Remove {{ groupDeleteTarget.label }}?</h2>
                <p>This option category and its choices will be removed.</p>
                <footer>
                    <button type="button" @click="groupDeleteTarget = null">
                        Cancel</button
                    ><button type="button" @click="deleteOptionGroup">
                        Remove
                    </button>
                </footer>
            </section>
        </div>

        <div
            v-if="statusConfirm"
            class="menu-admin-backdrop edit-layer"
            @click.self="statusConfirm = null"
        >
            <section class="confirm-status-modal">
                <button
                    type="button"
                    class="modal-x"
                    aria-label="Close"
                    @click="statusConfirm = null"
                >
                    <i class="fa-solid fa-xmark"></i></button
                ><i
                    class="fa-solid"
                    :class="
                        statusConfirm.target === 'available'
                            ? 'fa-rotate-left'
                            : statusConfirm.target === 'soldout'
                              ? 'fa-box-open'
                              : 'fa-eye-slash'
                    "
                ></i>
                <h2>
                    {{
                        statusConfirm.target === 'available'
                            ? 'Make this dish available?'
                            : `Mark as ${statusConfirm.target === 'soldout' ? 'Sold out' : 'Unavailable'}?`
                    }}
                </h2>
                <p>
                    {{
                        statusConfirm.target === 'available'
                            ? 'The current status will be removed.'
                            : 'This dish will no longer be available for ordering.'
                    }}
                </p>
                <footer>
                    <button type="button" @click="statusConfirm = null">
                        Cancel</button
                    ><button type="button" @click="confirmStatusChange">
                        Confirm
                    </button>
                </footer>
            </section>
        </div>

        <div
            v-if="deleteTarget"
            class="menu-admin-backdrop edit-layer"
            @click.self="deleteTarget = null"
        >
            <section class="confirm-status-modal delete-confirm">
                <button
                    type="button"
                    class="modal-x"
                    aria-label="Close"
                    @click="deleteTarget = null"
                >
                    <i class="fa-solid fa-xmark"></i></button
                ><i class="fa-regular fa-trash-can"></i>
                <h2>Delete {{ deleteTarget.name }}?</h2>
                <p>This dish will be removed from the menu.</p>
                <footer>
                    <button type="button" @click="deleteTarget = null">
                        Cancel</button
                    ><button type="button" @click="deleteProduct">
                        Delete
                    </button>
                </footer>
            </section>
        </div>
        <div v-if="toast" class="menu-admin-toast">
            <i class="fa-solid fa-circle-check"></i>{{ toast }}
        </div>
    </main>
</template>

<script>
import PosTopbar from '@/components/common/PosTopbar.vue'
import { loadMenuCatalog, saveMenuCatalog } from '@/services/pos/menuCatalog.js'
import {
    createLongPressSortable,
    reorderVisibleItems,
} from '@/utils/sortable.js'
import {
    productAvailabilityLabel,
    productAvailabilityStatus,
    sortProductsByAvailability,
} from '@/utils/menu.js'
import { safeMenuPrice, validMenuPrice } from '@/utils/money.js'
import { LANGUAGES, localizedName, makeLocalizedName } from '@/system/language'
export default {
    name: 'POSMenuManagement',
    components: { PosTopbar },
    data() {
        const catalog = loadMenuCatalog()
        return {
            languages: LANGUAGES,
            categories: catalog.categories,
            products: catalog.products,
            keyword: '',
            selectedCategory: 'All',
            categoryTranslations: catalog.categoryTranslations,
            categoryEditor: null,
            categoryDeletePicker: false,
            categoryDeleteTarget: '',
            categoryDeleteConfirm: false,
            detailProduct: null,
            newProductId: '',
            newProductSnapshot: '',
            closeDraftConfirm: false,
            fieldEditor: null,
            optionEditor: null,
            groupEditor: null,
            groupDeleteTarget: null,
            statusConfirm: null,
            deleteTarget: null,
            toast: '',
            toastTimer: null,
            productSortController: null,
            setEditor: null,
            setCloseConfirm: false,
            setDeleteConfirm: false,
            showSetProductPicker: false,
            setPickerCategory: 'All',
            setPickerProduct: null,
            setPickerQuantity: 1,
        }
    },
    computed: {
        currentCategoryLanguage() {
            return (
                LANGUAGES[this.categoryEditor?.languageIndex || 0]?.code ||
                'en'
            )
        },
        currentNameLanguage() {
            return LANGUAGES[this.fieldEditor?.languageIndex || 0]?.code || 'en'
        },
        currentGroupLanguage() {
            return LANGUAGES[this.groupEditor?.languageIndex || 0]?.code || 'en'
        },
        filteredProducts() {
            const search = this.keyword.toLowerCase()
            const products = this.products.filter(
                (product) =>
                    (this.selectedCategory === 'All' ||
                        product.category === this.selectedCategory) &&
                    (!search || this.localizedProductName(product).toLowerCase().includes(search)),
            )
            return sortProductsByAvailability(products)
        },
        setSelectableProducts() {
            return this.products.filter((product) => product.type !== 'set')
        },
        setPickerCategories() {
            const productCategories = new Set(
                this.setSelectableProducts.map((product) => product.category),
            )
            return this.categories.filter((category) =>
                productCategories.has(category),
            )
        },
        setPickerProducts() {
            return this.setSelectableProducts.filter(
                (product) =>
                    this.setPickerCategory === 'All' ||
                    product.category === this.setPickerCategory,
            )
        },
        setEditorReady() {
            return Boolean(
                this.setEditor?.name?.trim() &&
                    validMenuPrice(this.setEditor?.price) &&
                    Number(this.setEditor?.price) > 0 &&
                    this.setEditor?.setItems?.length,
            )
        },
        isCreatingProduct() {
            return Boolean(
                this.detailProduct &&
                    this.detailProduct.id === this.newProductId,
            )
        },
        hasDraftChanges() {
            return (
                this.isCreatingProduct &&
                JSON.stringify(this.detailProduct) !== this.newProductSnapshot
            )
        },
        isDraftReady() {
            return Boolean(
                this.detailProduct?.name?.trim() &&
                    Number(this.detailProduct?.price) > 0,
            )
        },
    },
    mounted() {
        if (!localStorage.getItem('posfood_active_account'))
            return this.$router.push('/')

        this.productSortController = createLongPressSortable(
            this.$refs.productGrid,
            {
                draggable: '.simple-menu-card',
                onReorder: this.reorderProducts,
            },
        )
    },
    beforeUnmount() {
        this.productSortController?.destroy()
        this.productSortController = null
        clearTimeout(this.toastTimer)
    },
    methods: {
        localizedProductName(product) {
            return localizedName(product?.nameTranslations, product?.name || '')
        },
        localizedCategoryName(category) {
            return localizedName(
                this.categoryTranslations?.[category],
                category || '',
            )
        },
        newLocalizedName() {
            return makeLocalizedName()
        },
        languageLabel(index) {
            return LANGUAGES[index]?.label || LANGUAGES[0].label
        },
        moveNameLanguage(delta) {
            const nextIndex = this.fieldEditor.languageIndex + delta
            if (nextIndex >= 0 && nextIndex < LANGUAGES.length)
                this.fieldEditor.languageIndex = nextIndex
        },
        moveCategoryLanguage(delta) {
            const code = this.currentCategoryLanguage
            if (!this.categoryEditor.translations[code]?.trim())
                return this.showToast('Enter the category name first.')
            const nextIndex = this.categoryEditor.languageIndex + delta
            if (nextIndex >= 0 && nextIndex < LANGUAGES.length)
                this.categoryEditor.languageIndex = nextIndex
        },
        setCategoryNameMode(mode) {
            this.categoryEditor.mode = mode
            this.categoryEditor.languageIndex = 0
        },
        moveGroupLanguage(delta) {
            const nextIndex = this.groupEditor.languageIndex + delta
            if (nextIndex >= 0 && nextIndex < LANGUAGES.length)
                this.groupEditor.languageIndex = nextIndex
        },
        setFieldNameMode(mode) {
            this.fieldEditor.mode = mode
            this.fieldEditor.languageIndex = 0
        },
        setGroupNameMode(mode) {
            this.groupEditor.nameMode = mode
            this.groupEditor.languageIndex = 0
            this.groupEditor.editingOptions = mode === 'single'
        },
        openGroupOptions() {
            this.groupEditor.editingOptions = true
        },
        backToGroupLanguage() {
            this.groupEditor.editingOptions = false
            this.groupEditor.languageIndex = LANGUAGES.length - 1
        },
        handleAddCard() {
            if (this.selectedCategory === 'Sets') this.createSetMeal()
            else this.createProduct()
        },
        money(value) {
            return Number(value || 0).toFixed(2)
        },
        productStatus(product) {
            return productAvailabilityStatus(product)
        },
        statusLabel(product) {
            return productAvailabilityLabel(product)
        },
        productCardEyebrow(product) {
            if (product.type !== 'set') return product.category
            return `SET · ${product.availableFrom || 'Any time'}–${product.availableTo || 'Any time'}`
        },
        persist(message, force = false) {
            if (force || !this.isCreatingProduct)
                saveMenuCatalog(
                    this.categories,
                    this.products,
                    this.categoryTranslations,
                )
            if (message) this.showToast(message)
        },
        showToast(message) {
            this.toast = message
            clearTimeout(this.toastTimer)
            this.toastTimer = setTimeout(() => {
                this.toast = ''
            }, 2600)
        },
        handleProductClick(product) {
            if (this.productSortController?.shouldSuppressClick()) return
            if (product.type === 'set') this.editSetMeal(product)
            else this.openDetail(product)
        },
        reorderProducts({ oldIndex, newIndex }) {
            const visibleProducts = this.filteredProducts.slice()
            const reorderedProducts = reorderVisibleItems(
                this.products,
                visibleProducts,
                oldIndex,
                newIndex,
            )
            const movedProduct = visibleProducts[oldIndex]

            this.products = reorderedProducts
            this.persist(`${movedProduct.name} position was saved.`)
        },
        showCategoryField() {
            this.categoryEditor = {
                mode: 'single',
                value: '',
                translations: makeLocalizedName(),
                languageIndex: 0,
            }
            this.$nextTick(() => this.$refs.categoryInput?.focus())
        },
        addCategory() {
            const editor = this.categoryEditor
            if (!editor) return
            const translations =
                editor.mode === 'multiple'
                    ? { ...editor.translations }
                    : makeLocalizedName(editor.value.trim())
            if (
                editor.mode === 'multiple' &&
                LANGUAGES.some((language) => !translations[language.code]?.trim())
            )
                return this.showToast('Complete all language names first.')
            const name = translations.en.trim()
            if (!name) return
            if (
                this.categories.some(
                    (item) => item.toLowerCase() === name.toLowerCase(),
                )
            )
                return this.showToast('This category already exists.')
            this.categories.push(name)
            this.categoryTranslations[name] = translations
            this.selectedCategory = name
            this.categoryEditor = null
            this.persist(`${name} category was added.`)
        },
        categoryProductCount(category) {
            return this.products.filter(
                (product) => product.category === category,
            ).length
        },
        openCategoryDelete() {
            if (this.categories.length <= 1)
                return this.showToast('At least one category is required.')
            this.categoryDeleteTarget = ''
            this.categoryDeletePicker = true
        },
        continueCategoryDelete() {
            if (!this.categoryDeleteTarget) return
            this.categoryDeletePicker = false
            this.categoryDeleteConfirm = true
        },
        deleteCategory() {
            const target = this.categoryDeleteTarget
            const remaining = this.categories.filter(
                (category) => category !== target,
            )
            const affected = this.products.filter(
                (product) => product.category === target,
            )
            let destination = ''
            if (affected.length) {
                destination =
                    target === 'Uncategorised'
                        ? remaining[0] || 'Menu'
                        : 'Uncategorised'
                if (!remaining.includes(destination))
                    remaining.push(destination)
                affected.forEach((product) => {
                    product.category = destination
                })
            }
            this.categories = remaining
            delete this.categoryTranslations[target]
            if (this.selectedCategory === target)
                this.selectedCategory = destination || 'All'
            this.categoryDeleteConfirm = false
            this.categoryDeleteTarget = ''
            this.persist(`${target} category was deleted.`)
        },
        createProduct() {
            const category =
                this.selectedCategory === 'All'
                    ? this.categories[0] || 'Menu'
                    : this.selectedCategory
            const product = {
                id: `dish-${Date.now()}`,
                name: '',
                nameMode: 'single',
                nameTranslations: makeLocalizedName(),
                category,
                description: '',
                price: 0,
                image: '',
                sizes: [{ name: 'Regular', price: 0 }],
                ingredients: [],
                removable: [],
                addons: [],
                modifierGroups: [],
                soldOut: false,
                unavailable: false,
            }
            this.products.unshift(product)
            this.newProductId = product.id
            this.newProductSnapshot = JSON.stringify(product)
            this.openDetail(product)
        },
        selectProductCategory(category) {
            if (!this.detailProduct || this.detailProduct.category === category)
                return
            this.detailProduct.category = category
            this.persist(`${this.detailProduct.name || 'Product'} category was updated.`)
        },
        createSetMeal() {
            this.setEditor = {
                id: '',
                name: '',
                price: 0,
                availableFrom: '12:00',
                availableTo: '17:00',
                setItems: [],
                soldOut: false,
                unavailable: false,
            }
            this.setCloseConfirm = false
            this.setDeleteConfirm = false
            this.showSetProductPicker = false
        },
        editSetMeal(product) {
            const setItems = product.setItems?.length
                ? product.setItems.map((item) => ({
                      productId: item.productId,
                      quantity: Math.max(1, Number(item.quantity) || 1),
                  }))
                : (product.setItemIds || []).map((productId) => ({
                      productId,
                      quantity: 1,
                  }))
            this.setEditor = {
                id: product.id,
                name: product.name,
                price: Number(product.price || 0),
                availableFrom: product.availableFrom || '12:00',
                availableTo: product.availableTo || '17:00',
                setItems,
                soldOut: Boolean(product.soldOut),
                unavailable: Boolean(product.unavailable),
            }
            this.setCloseConfirm = false
            this.setDeleteConfirm = false
            this.showSetProductPicker = false
        },
        requestCloseSetMealEditor() {
            this.showSetProductPicker = false
            this.setPickerProduct = null
            this.setCloseConfirm = true
        },
        clearSetMealEditor() {
            this.setEditor = null
            this.setCloseConfirm = false
            this.setDeleteConfirm = false
            this.showSetProductPicker = false
            this.setPickerProduct = null
        },
        discardSetDraft() {
            this.clearSetMealEditor()
        },
        deleteSetMeal() {
            if (!this.setEditor?.id) return
            const deletedName = this.setEditor.name || 'Set'
            this.products = this.products.filter(
                (product) => product.id !== this.setEditor.id,
            )
            saveMenuCatalog(
                this.categories,
                this.products,
                this.categoryTranslations,
            )
            this.clearSetMealEditor()
            this.showToast(`${deletedName} was deleted.`)
        },
        setItemProduct(productId) {
            return this.products.find((product) => product.id === productId)
        },
        openSetProductPicker() {
            this.setPickerCategory = 'All'
            this.setPickerProduct = null
            this.setPickerQuantity = 1
            this.showSetProductPicker = true
        },
        closeSetProductPicker() {
            this.showSetProductPicker = false
            this.setPickerProduct = null
            this.setPickerQuantity = 1
        },
        previewSetProduct(product) {
            this.setPickerProduct = product
            this.setPickerQuantity = 1
        },
        backToSetProductGrid() {
            this.setPickerProduct = null
            this.setPickerQuantity = 1
        },
        handleSetPickerBack() {
            if (this.setPickerProduct) this.backToSetProductGrid()
            else this.closeSetProductPicker()
        },
        addSetPickerProduct() {
            if (!this.setPickerProduct) return
            const productId = this.setPickerProduct.id
            const existing = this.setEditor.setItems.find(
                (item) => item.productId === productId,
            )
            if (existing) existing.quantity += this.setPickerQuantity
            else
                this.setEditor.setItems.push({
                    productId,
                    quantity: this.setPickerQuantity,
                })
            this.backToSetProductGrid()
        },
        changeSetItemQuantity(productId, change) {
            const item = this.setEditor.setItems.find(
                (setItem) => setItem.productId === productId,
            )
            if (!item) return
            item.quantity = Math.max(1, item.quantity + change)
        },
        removeSetProduct(productId) {
            this.setEditor.setItems = this.setEditor.setItems.filter(
                (item) => item.productId !== productId,
            )
        },
        saveSetMeal() {
            if (!this.setEditorReady) return
            const itemProducts = this.setEditor.setItems
                .map((item) => ({
                    ...item,
                    product: this.setItemProduct(item.productId),
                }))
                .filter((item) => item.product)
            const existing = this.products.find(
                (product) => product.id === this.setEditor.id,
            )
            const setProduct = {
                ...(existing || {}),
                id: existing?.id || `set-${Date.now()}`,
                type: 'set',
                name: this.setEditor.name.trim(),
                category: 'Sets',
                description: itemProducts
                    .map(
                        (item) =>
                            `${item.quantity > 1 ? `${item.quantity}× ` : ''}${item.product.name}`,
                    )
                    .join(', '),
                price: Number(safeMenuPrice(this.setEditor.price).toFixed(2)),
                image: existing?.image || itemProducts[0]?.product.image || '',
                availableFrom: this.setEditor.availableFrom,
                availableTo: this.setEditor.availableTo,
                setItems: itemProducts.map((item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                })),
                setItemIds: itemProducts.map((item) => item.product.id),
                setItemNames: itemProducts.map(
                    (item) =>
                        `${item.quantity > 1 ? `${item.quantity}× ` : ''}${item.product.name}`,
                ),
                sizes: [{ name: 'Regular', price: 0 }],
                ingredients: [],
                removable: [],
                addons: [],
                modifierGroups: [],
                soldOut: this.setEditor.soldOut,
                unavailable: this.setEditor.unavailable,
            }

            if (!this.categories.includes('Sets')) this.categories.push('Sets')
            if (existing) {
                const index = this.products.findIndex(
                    (product) => product.id === existing.id,
                )
                this.products.splice(index, 1, setProduct)
            } else this.products.unshift(setProduct)

            saveMenuCatalog(
                this.categories,
                this.products,
                this.categoryTranslations,
            )
            this.selectedCategory = 'Sets'
            this.clearSetMealEditor()
            this.showToast(`${setProduct.name} was saved.`)
        },
        openDetail(product) {
            this.detailProduct = product
            this.fieldEditor = null
            this.optionEditor = null
            this.groupEditor = null
        },
        requestCloseDetail() {
            if (!this.isCreatingProduct) return this.closeDetail()
            if (this.hasDraftChanges) {
                this.closeDraftConfirm = true
                return
            }
            this.discardNewProduct()
        },
        resumeDraft() {
            this.closeDraftConfirm = false
        },
        closeDetail() {
            this.detailProduct = null
            this.fieldEditor = null
            this.optionEditor = null
            this.groupEditor = null
            this.groupDeleteTarget = null
            this.closeDraftConfirm = false
        },
        confirmNewProduct() {
            if (!this.isDraftReady) return
            const name = this.detailProduct.name.trim()
            this.detailProduct.name = name
            if (!this.detailProduct.nameTranslations?.en)
                this.detailProduct.nameTranslations = makeLocalizedName(name)
            this.persist(`${name} was added.`, true)
            this.newProductId = ''
            this.newProductSnapshot = ''
            this.closeDetail()
        },
        discardNewProduct() {
            const id = this.newProductId
            this.products = this.products.filter((product) => product.id !== id)
            saveMenuCatalog(
                this.categories,
                this.products,
                this.categoryTranslations,
            )
            this.newProductId = ''
            this.newProductSnapshot = ''
            this.closeDetail()
        },
        startFieldEdit(field) {
            const labels = {
                name: 'Dish name',
                category: 'Category',
                description: 'Description',
                price: 'Price',
            }
            this.fieldEditor = {
                field,
                label: labels[field],
                value: this.detailProduct[field] ?? '',
                mode: this.detailProduct.nameMode || 'single',
                translations: {
                    ...makeLocalizedName(this.detailProduct.name || ''),
                    ...(this.detailProduct.nameTranslations || {}),
                },
                languageIndex: 0,
            }
        },
        completeFieldEdit() {
            const editor = this.fieldEditor
            if (editor.field === 'price')
                this.detailProduct.price = Math.max(
                    0,
                    Number(editor.value) || 0,
                )
            else if (editor.field === 'name') {
                if (editor.mode === 'multiple') {
                    this.detailProduct.nameMode = 'multiple'
                    this.detailProduct.nameTranslations = { ...editor.translations }
                    this.detailProduct.name =
                        editor.translations.en ||
                        editor.translations.cn ||
                        editor.translations.bm ||
                        editor.translations['zh-CN'] ||
                        editor.translations.ms
                } else {
                    this.detailProduct.nameMode = 'single'
                    this.detailProduct.name = String(editor.value || '').trim()
                    this.detailProduct.nameTranslations = makeLocalizedName(this.detailProduct.name)
                }
            } else
                this.detailProduct[editor.field] = String(
                    editor.value || '',
                ).trim()
            this.fieldEditor = null
            this.persist(`${this.detailProduct.name} was updated.`)
        },
        replaceImage(event) {
            const file = event.target.files?.[0]
            if (!file) return
            if (file.size > 15e5) {
                this.showToast('Choose an image smaller than 1.5 MB.')
                event.target.value = ''
                return
            }
            const reader = new FileReader()
            reader.onload = () => {
                this.detailProduct.image = reader.result
                this.persist('Product image was updated.')
            }
            reader.readAsDataURL(file)
            event.target.value = ''
        },
        editableOptionGroups(product) {
            const groups = []
            groups.push({
                key: 'sizes',
                label: 'Size',
                items: product.sizes || [],
                priced: true,
                custom: false,
            })
            ;(product.modifierGroups || []).forEach((group, index) =>
                groups.push({
                    key: `modifier:${index}`,
                    label: localizedName(group.nameTranslations, group.name),
                    items: group.options || [],
                    priced: true,
                    custom: true,
                }),
            )
            groups.push({
                key: 'addons',
                label: 'Add-ons',
                items: product.addons || [],
                priced: true,
                custom: false,
            })
            groups.push({
                key: 'removable',
                label: 'Can remove',
                items: product.removable || [],
                priced: false,
                custom: false,
            })
            return groups
        },
        displayOption(group, option) {
            const name =
                group.key === 'removable' ? `No ${option}` : option.name
            const price = group.priced ? Number(option.price || 0) : 0
            return `${name}${price > 0 ? ` +RM ${this.money(price)}` : ''}`
        },
        resolveGroup(key) {
            if (key === 'sizes')
                return (
                    this.detailProduct.sizes || (this.detailProduct.sizes = [])
                )
            if (key === 'addons')
                return (
                    this.detailProduct.addons ||
                    (this.detailProduct.addons = [])
                )
            if (key === 'removable')
                return (
                    this.detailProduct.removable ||
                    (this.detailProduct.removable = [])
                )
            const index = Number(key.split(':')[1])
            return this.detailProduct.modifierGroups[index].options
        },
        startOptionEdit(group, index) {
            const option = index >= 0 ? group.items[index] : null
            this.optionEditor = {
                groupKey: group.key,
                label: group.label,
                index,
                priced: group.priced,
                name:
                    group.key === 'removable'
                        ? option || ''
                        : option?.name || '',
                price: group.priced ? Number(option?.price || 0) : 0,
            }
        },
        completeOptionEdit() {
            const editor = this.optionEditor
            const list = this.resolveGroup(editor.groupKey)
            const value =
                editor.groupKey === 'removable'
                    ? editor.name
                    : { name: editor.name, price: Number(editor.price || 0) }
            if (editor.index < 0) list.push(value)
            else list.splice(editor.index, 1, value)
            this.optionEditor = null
            this.persist(`${this.detailProduct.name} options were updated.`)
        },
        deleteOption() {
            const editor = this.optionEditor
            if (editor.index >= 0)
                this.resolveGroup(editor.groupKey).splice(editor.index, 1)
            this.optionEditor = null
            this.persist(`${this.detailProduct.name} options were updated.`)
        },
        addGroupOption() {
            this.groupEditor.options.push({ name: '', price: 0 })
        },
        removeGroupOption(index) {
            if (this.groupEditor.options.length > 1)
                this.groupEditor.options.splice(index, 1)
        },
        completeGroupEdit() {
            const editor = this.groupEditor
            const options = editor.options
                .map((option) => ({
                    name: option.name.trim(),
                    price: Number(option.price || 0),
                }))
                .filter((option) => option.name)
            if (!options.length) return
            this.detailProduct.modifierGroups ||
                (this.detailProduct.modifierGroups = [])
            this.detailProduct.modifierGroups.push({
                name: editor.nameMode === 'multiple'
                    ? (
                          editor.nameTranslations.en ||
                          editor.nameTranslations.cn ||
                          editor.nameTranslations.bm ||
                          editor.nameTranslations['zh-CN'] ||
                          editor.nameTranslations.ms
                      )
                    : editor.name,
                nameMode: editor.nameMode,
                nameTranslations: editor.nameMode === 'multiple'
                    ? { ...editor.nameTranslations }
                    : makeLocalizedName(editor.name),
                options,
            })
            this.groupEditor = null
            this.persist(`${this.detailProduct.name} options were updated.`)
        },
        deleteOptionGroup() {
            const index = Number(this.groupDeleteTarget.key.split(':')[1])
            this.detailProduct.modifierGroups.splice(index, 1)
            const label = this.groupDeleteTarget.label
            this.groupDeleteTarget = null
            this.persist(`${label} was removed.`)
        },
        setStatus(status) {
            this.detailProduct.soldOut = status === 'soldout'
            this.detailProduct.unavailable = status === 'unavailable'
            this.persist(
                `${this.detailProduct.name} is now ${status === 'soldout' ? 'sold out' : status}.`,
            )
        },
        toggleStatus(status) {
            const current = this.productStatus(this.detailProduct)
            this.statusConfirm = {
                current,
                target: current === status ? 'available' : status,
            }
        },
        confirmStatusChange() {
            this.setStatus(this.statusConfirm.target)
            this.statusConfirm = null
        },
        requestDelete(product) {
            this.deleteTarget = product
        },
        deleteProduct() {
            const product = this.deleteTarget
            this.products = this.products.filter(
                (item) => item.id !== product.id,
            )
            if (this.detailProduct?.id === product.id) this.detailProduct = null
            this.deleteTarget = null
            this.persist(`${product.name} was deleted.`)
        },
    },
}
</script>
