<template>
    <main class="restro-page order-page" @click="resetIdleTimer">
        <section class="restro-shell">
            <PosTopbar
                @new-takeaway="applyNewTakeaway"
            >
                <template #center>
                    <label class="search-box">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input
                            v-model.trim="searchKeyword"
                            type="text"
                            placeholder="Search products....."
                        />
                    </label>
                </template>
            </PosTopbar>

            <ProductMenu
                :categories="categories"
                :category-translations="categoryTranslations"
                :active-category="activeCategory"
                :products="filteredProducts"
                @update:active-category="activeCategory = $event"
                @select="selectProduct"
            />

            <aside class="cart-panel">
                <div class="order-toolbar">
                    <div
                        v-if="orderSetup.orderType === 'Dine In'"
                        class="order-table-wrap"
                    >
                        <button
                            type="button"
                            class="order-table-trigger"
                            @click="showTableMenu = !showTableMenu"
                        >
                            <strong>{{
                                orderSetup.tableNumber || 'Select table'
                            }}</strong
                            ><i
                                class="fa-solid"
                                :class="
                                    showTableMenu
                                        ? 'fa-chevron-up'
                                        : 'fa-chevron-down'
                                "
                            ></i>
                        </button>
                        <div v-if="showTableMenu" class="order-table-menu">
                            <button
                                v-for="table in availableTables"
                                :key="table"
                                type="button"
                                :class="{
                                    active: orderSetup.tableNumber === table,
                                }"
                                @click="changeTable(table)"
                            >
                                {{ table }}
                            </button>
                        </div>
                    </div>
                    <div v-else class="order-identity">
                        <span>Order</span>
                        <strong>{{ orderNumber }}</strong>
                    </div>
                    <div class="guest-stepper" aria-label="Customers">
                        <button
                            type="button"
                            aria-label="Decrease customers"
                            :disabled="guestCount === 1"
                            @click="changeGuest(-1)"
                        >
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                        <span
                            ><i class="fa-solid fa-user-group"></i
                            ><strong>{{ guestCount }}</strong></span
                        >
                        <button
                            type="button"
                            aria-label="Increase customers"
                            :disabled="guestCount === 6"
                            @click="changeGuest(1)"
                        >
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                    <button
                        type="button"
                        class="cancel-order-tool"
                        aria-label="Cancel order"
                        @click="showCancelOrder = true"
                    >
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>

                <div
                    v-if="pendingRefundTarget"
                    class="refund-replacement-banner"
                >
                    <i class="fa-solid fa-arrow-right-arrow-left"></i>
                    <div>
                        <strong>Choose a replacement dish</strong>
                        <span>Replacing {{ pendingRefundTarget.item.name }}</span>
                        <small v-if="pendingRefundTarget.issue?.reason">
                            {{ pendingRefundTarget.issue.reason }}
                        </small>
                        <small v-if="pendingRefundTarget.issue?.replacement">
                            Replace with: {{ pendingRefundTarget.issue.replacement }}
                        </small>
                    </div>
                    <button type="button" @click="cancelRefundReplacement">
                        Cancel
                    </button>
                </div>

                <div class="cart-list">
                    <section
                        v-for="(group, groupIndex) in previousOrderGroups"
                        :key="`previous-${groupIndex}`"
                        class="order-group previous-order-group"
                    >
                        <header>
                            <span>{{
                                group.label ||
                                (groupIndex === 0 ? 'Order' : 'Previous Order')
                            }}</span
                            ><strong>{{ group.items.length }} items</strong>
                        </header>
                        <div
                            v-for="(item, itemIndex) in group.items"
                            :key="`${groupIndex}-${itemIndex}-${item.key || item.name}`"
                            class="cart-row-shell"
                            :class="{
                                'is-readonly': !isEditingExistingOrder,
                                'kitchen-issue-row': item.kitchenIssue,
                            }"
                        >
                            <article
                                class="cart-line"
                                :class="{
                                    'readonly-line': !isEditingExistingOrder,
                                    'kitchen-issue-line': item.kitchenIssue,
                                }"
                                @click="
                                    editPreviousItem(
                                        item,
                                        groupIndex,
                                        itemIndex,
                                    )
                                "
                            >
                                <img :src="item.image" :alt="item.name" />
                                <div class="cart-item-copy">
                                    <h3>{{ item.name }}</h3>
                                    <p>{{ optionText(item) }}</p>
                                    <small v-if="item.remark"
                                        ><i
                                            class="fa-regular fa-note-sticky"
                                        ></i>
                                        {{ item.remark }}</small
                                    >
                                    <small
                                        v-if="item.kitchenIssue"
                                        class="chef-return-note"
                                        ><i
                                            class="fa-solid fa-triangle-exclamation"
                                        ></i>
                                        {{ item.kitchenIssue.reason }}</small
                                    >
                                </div>
                                <div class="cart-item-end">
                                    <span>{{ item.qty }}×</span
                                    ><b
                                        v-if="item.kitchenIssue"
                                        class="kitchen-issue-label"
                                        >{{
                                            issueLabel(item.kitchenIssue)
                                        }}</b
                                    ><b v-else
                                        >RM {{ formatMoney(item.total) }}</b
                                    >
                                </div>
                            </article>
                        </div>
                    </section>
                    <div
                        v-for="item in cart"
                        :key="item.key"
                        class="cart-row-shell"
                    >
                        <article class="cart-line" @click="editCartItem(item)">
                            <img :src="item.image" :alt="item.name" />
                            <div class="cart-item-copy">
                                <h3>{{ item.name }}</h3>
                                <p>{{ optionText(item) }}</p>
                                <small v-if="item.remark"
                                    ><i class="fa-regular fa-note-sticky"></i>
                                    {{ item.remark }}</small
                                >
                            </div>
                            <div class="cart-item-end">
                                <span>{{ item.qty }}×</span
                                ><b>${{ formatMoney(item.total) }}</b>
                            </div>
                        </article>
                    </div>

                    <div
                        v-if="!cart.length && !previousOrderGroups.length"
                        class="empty-cart"
                    >
                        <i class="fa-solid fa-basket-shopping"></i>
                        <span>No items yet</span>
                    </div>
                </div>

                <transition name="price-slide">
                    <div v-if="showPriceBreakdown" class="price-breakdown">
                        <div>
                            <span>Subtotal</span
                            ><strong>${{ formatMoney(subtotal) }}</strong>
                        </div>
                        <div>
                            <span>Tax</span
                            ><strong>${{ formatMoney(tax) }}</strong>
                        </div>
                    </div>
                </transition>
                <button
                    type="button"
                    class="summary-toggle"
                    :aria-expanded="showPriceBreakdown"
                    @click="showPriceBreakdown = !showPriceBreakdown"
                >
                    <div class="payable">
                        <span>Payable Amount</span
                        ><strong>${{ formatMoney(payableAmount) }}</strong>
                    </div>
                    <i
                        class="fa-solid"
                        :class="
                            showPriceBreakdown
                                ? 'fa-chevron-down'
                                : 'fa-chevron-up'
                        "
                    ></i>
                </button>

                <div class="cart-buttons">
                    <p v-if="orderError" class="order-submit-error">
                        {{ orderError }}
                    </p>
                    <button
                        type="button"
                        class="proceed-btn"
                        @click="confirmOrder"
                    >
                        <i class="fa-solid fa-check"></i>
                        Confirm Order
                    </button>
                </div>
            </aside>
        </section>

        <transition name="modal-fade">
            <div
                v-if="showMemberPicker"
                class="modal-backdrop"
                @click.self="closeMemberPicker"
            >
                <section class="order-member-modal">
                    <header>
                        <div>
                            <span>MEMBERSHIP</span>
                            <h2>
                                {{
                                    memberRegisterMode
                                        ? 'Register member'
                                        : 'Sign in member'
                                }}
                            </h2>
                        </div>
                        <button
                            type="button"
                            aria-label="Close"
                            @click="closeMemberPicker"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </header>
                    <template v-if="!memberRegisterMode">
                        <label class="order-member-search">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input
                                v-model.trim="memberQuery"
                                type="search"
                                placeholder="Name, phone or Member ID"
                                autofocus
                            />
                        </label>
                        <div class="order-member-results">
                            <button
                                v-for="member in memberResults"
                                :key="member.id"
                                type="button"
                                @click="attachMember(member)"
                            >
                                <span class="order-member-avatar">{{
                                    memberInitials(member.name)
                                }}</span>
                                <span
                                    ><strong>{{ member.name }}</strong
                                    ><small
                                        >{{ member.memberId }} ·
                                        {{ member.phone }}</small
                                    ></span
                                >
                                <b>{{ member.points }} pts</b>
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                            <div
                                v-if="!memberResults.length"
                                class="order-member-empty"
                            >
                                <i class="fa-solid fa-user-plus"></i>
                                <strong>No member found</strong>
                            </div>
                        </div>
                        <button
                            type="button"
                            class="order-member-register-link"
                            @click="memberRegisterMode = true"
                        >
                            Register
                        </button>
                    </template>
                    <form
                        v-else
                        class="order-quick-register"
                        @submit.prevent="quickRegisterMember"
                    >
                        <MemberFormFields v-model="quickMember" />
                        <p v-if="memberError">{{ memberError }}</p>
                        <footer>
                            <button
                                type="button"
                                class="order-member-register-back"
                                @click="memberRegisterMode = false"
                            >
                                Back
                            </button>
                            <button type="submit">Register</button>
                        </footer>
                    </form>
                </section>
            </div>
        </transition>

        <transition name="modal-fade">
            <div
                v-if="showCancelOrder"
                class="modal-backdrop"
                @click.self="showCancelOrder = false"
            >
                <section class="confirm-cancel-modal">
                    <div class="danger-mark">
                        <i class="fa-regular fa-trash-can"></i>
                    </div>
                    <h2>Cancel this order?</h2>
                    <p>
                        This removes the unpaid order and releases the table.
                        This action cannot be undone.
                    </p>
                    <div>
                        <button type="button" @click="showCancelOrder = false">
                            Keep Order</button
                        ><button
                            type="button"
                            class="danger-confirm"
                            @click="cancelCurrentOrder"
                        >
                            Yes, Cancel Order
                        </button>
                    </div>
                </section>
            </div>
        </transition>

        <transition name="modal-fade">
            <div
                v-if="refundTarget"
                class="modal-backdrop"
                @click.self="closeRefundAction"
            >
                <section class="refund-action-modal">
                    <header>
                        <span>KITCHEN RETURN</span>
                        <h2>{{ refundTarget.item.name }}</h2>
                        <p>{{ refundTarget.issue?.reason }}</p>
                    </header>
                    <button
                        type="button"
                        class="choose-refund-replacement"
                        @click="chooseRefundReplacement"
                    >
                        <i class="fa-solid fa-arrow-right-arrow-left"></i>
                        <span
                            ><strong>Choose another dish</strong
                            ><small
                                >Select a new product from the menu.</small
                            ></span
                        >
                    </button>
                    <button
                        type="button"
                        class="cancel-refund-item"
                        @click="cancelRefundItem"
                    >
                        <i class="fa-regular fa-trash-can"></i>
                        <span
                            ><strong>Cancel this dish</strong
                            ><small
                                >Remove it and update the payable
                                amount.</small
                            ></span
                        >
                    </button>
                    <button type="button" @click="closeRefundAction">
                        Back
                    </button>
                </section>
            </div>
        </transition>

        <transition name="modal-fade">
            <div
                v-if="showSetExchangePicker"
                class="modal-backdrop set-exchange-backdrop"
                @click.self="closeSetExchangePicker"
            >
                <section class="set-exchange-modal">
                    <header>
                        <span>SET REPLACEMENT</span>
                        <h2>{{ activeSetSelection?.product?.name || 'Set dish' }}</h2>
                        <p v-if="activeSetSelectionIssue?.reason">
                            {{ activeSetSelectionIssue.reason }}
                        </p>
                        <small v-if="activeSetSelectionIssue?.replacement">
                            Replace with: {{ activeSetSelectionIssue.replacement }}
                        </small>
                    </header>
                    <label class="set-exchange-search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input
                            v-model.trim="setExchangeQuery"
                            type="text"
                            placeholder="Search replacement dish..."
                        />
                    </label>
                    <div class="set-exchange-list">
                        <button
                            v-for="product in exchangeableSetProducts"
                            :key="product.id"
                            type="button"
                            @click="replaceActiveSetSelectionWith(product)"
                        >
                            <img v-if="product.image" :src="product.image" :alt="product.name" />
                            <span>
                                <strong>{{ product.name }}</strong>
                                <small>{{ product.category }}</small>
                            </span>
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                        <div v-if="!exchangeableSetProducts.length" class="set-exchange-empty">
                            No replacement dishes found.
                        </div>
                    </div>
                    <footer>
                        <button type="button" @click="closeSetExchangePicker">Cancel</button>
                    </footer>
                </section>
            </div>
        </transition>

        <transition name="modal-fade">
            <div v-if="drawerProduct" class="modal-backdrop">
                <section
                    class="modifier-modal"
                    :class="{ 'set-order-modal': drawerProduct.type === 'set' }"
                >
                    <header class="detail-title">
                        <h2>{{ drawerProduct.name }}</h2>
                    </header>
                    <button
                        v-if="showSetExchangeAction"
                        type="button"
                        class="detail-exchange-trigger"
                        aria-label="Exchange set dish"
                        @click="openSetExchangePicker"
                    >
                        <i class="fa-solid fa-arrow-right-arrow-left"></i>
                    </button>
                    <button
                        v-if="editingKey || editingGroupIndex !== null"
                        type="button"
                        class="detail-delete-trigger"
                        aria-label="Delete item"
                        @click="deleteEditingItem"
                    >
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                    <button
                        type="button"
                        class="detail-close"
                        @click="closeDrawer"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <aside
                        v-if="editingIssue && drawerProduct.type !== 'set'"
                        class="chef-instruction-panel"
                    >
                        <span>CHEF NOTE</span>
                        <strong>{{ editingIssue.reason || 'Chef returned this dish.' }}</strong>
                        <p v-if="editingIssue.replacement">
                            Replace with: {{ editingIssue.replacement }}
                        </p>
                    </aside>
                    <SetMealCustomizer
                        v-if="drawerProduct.type === 'set'"
                        :selections="setMealSelections"
                        :active-index="activeSetSelectionIndex"
                        @update:selections="setMealSelections = $event"
                        @update:active-index="activeSetSelectionIndex = $event"
                    />
                    <div v-else class="detail-hero">
                        <section class="detail-basic">
                            <div
                                v-if="drawerProduct.sizes?.length"
                                class="detail-sizes"
                            >
                                <span>Size</span>
                                <button
                                    v-for="size in drawerProduct.sizes"
                                    :key="size.name"
                                    type="button"
                                    :class="{
                                        active: drawerState.size === size.name,
                                    }"
                                    @click="drawerState.size = size.name"
                                >
                                    <i
                                        class="fa-regular"
                                        :class="
                                            drawerState.size === size.name
                                                ? 'fa-square-check'
                                                : 'fa-square'
                                        "
                                    ></i
                                    >{{ size.name
                                    }}<small v-if="size.price"
                                        >+${{ formatMoney(size.price) }}</small
                                    >
                                </button>
                            </div>
                            <div
                                v-for="group in drawerProduct.modifierGroups ||
                                []"
                                :key="group.name"
                                class="detail-sizes"
                            >
                                <span>{{ group.name }}</span>
                                <button
                                    v-for="option in group.options"
                                    :key="option.name"
                                    type="button"
                                    :class="{
                                        active:
                                            drawerState.modifiers[
                                                group.name
                                            ] === option.name,
                                    }"
                                    @click="
                                        drawerState.modifiers[group.name] =
                                            option.name
                                    "
                                >
                                    <i
                                        class="fa-regular"
                                        :class="
                                            drawerState.modifiers[
                                                group.name
                                            ] === option.name
                                                ? 'fa-square-check'
                                                : 'fa-square'
                                        "
                                    ></i
                                    >{{ option.name
                                    }}<small v-if="option.price"
                                        >+${{
                                            formatMoney(option.price)
                                        }}</small
                                    >
                                </button>
                            </div>
                            <div
                                v-if="drawerProduct.ingredients?.length"
                                class="detail-checks"
                            >
                                <span>Included</span
                                ><label
                                    v-for="ingredient in drawerProduct.ingredients"
                                    :key="ingredient"
                                    ><input
                                        v-model="drawerState.ingredients"
                                        :value="ingredient"
                                        type="checkbox"
                                    />{{ ingredient }}</label
                                >
                            </div>
                            <div
                                v-if="drawerProduct.removable?.length"
                                class="detail-checks"
                            >
                                <span>Remove</span
                                ><label
                                    v-for="ingredient in drawerProduct.removable"
                                    :key="ingredient"
                                    ><input
                                        v-model="drawerState.removedIngredients"
                                        :value="ingredient"
                                        type="checkbox"
                                    />No {{ ingredient }}</label
                                >
                            </div>
                            <div
                                v-if="drawerProduct.addons?.length"
                                class="detail-checks addons"
                            >
                                <span>Add-ons</span
                                ><label
                                    v-for="addon in drawerProduct.addons"
                                    :key="addon.name"
                                    ><input
                                        v-model="drawerState.addons"
                                        :value="addon.name"
                                        type="checkbox"
                                    />{{ addon.name }}
                                    <b
                                        >+${{ formatMoney(addon.price) }}</b
                                    ></label
                                >
                            </div>
                            <label class="detail-note always-visible"
                                ><span>Note</span
                                ><textarea
                                    v-model.trim="drawerState.remark"
                                    rows="3"
                                    placeholder="Add item note..."
                                ></textarea>
                            </label>
                        </section>
                        <div class="detail-image">
                            <img
                                v-if="drawerProduct.image"
                                :src="drawerProduct.image"
                                :alt="drawerProduct.name"
                            /><i v-else class="fa-regular fa-image"></i
                            ><strong
                                >RM
                                {{ formatMoney(drawerProduct.price) }}</strong
                            >
                        </div>
                    </div>
                    <footer class="modifier-footer">
                        <div class="qty-control">
                            <button
                                type="button"
                                @click="
                                    drawerState.qty = Math.max(
                                        1,
                                        drawerState.qty - 1,
                                    )
                                "
                            >
                                -
                            </button>
                            <strong>{{ drawerState.qty }}</strong>
                            <button type="button" @click="drawerState.qty += 1">
                                +
                            </button>
                        </div>
                        <button type="button" @click="submitDrawerItem">
                            <i class="fa-solid fa-cart-shopping"></i
                            ><strong>${{ formatMoney(drawerTotal) }}</strong>
                        </button>
                    </footer>
                </section>
            </div>
        </transition>

        <transition name="modal-fade">
            <div v-if="showHoldCart" class="modal-backdrop">
                <section class="hold-modal">
                    <div class="mini-summary">
                        <div>
                            <span>Subtotal</span
                            ><strong>${{ formatMoney(subtotal) }}</strong>
                        </div>
                        <div>
                            <span>Tax</span
                            ><strong>${{ formatMoney(tax) }}</strong>
                        </div>
                        <div>
                            <span>Payable Amount</span
                            ><strong>${{ formatMoney(payableAmount) }}</strong>
                        </div>
                    </div>
                    <form @submit.prevent="holdCart">
                        <h2>Hold Cart</h2>
                        <label>
                            Cart Note
                            <input
                                v-model.trim="holdNote"
                                type="text"
                                placeholder="Enter the note for holding cart"
                            />
                        </label>
                        <div>
                            <button type="button" @click="showHoldCart = false">
                                Cancel
                            </button>
                            <button type="submit">Proceed</button>
                        </div>
                    </form>
                </section>
            </div>
        </transition>

        <transition name="modal-fade">
            <div v-if="showPayment" class="modal-backdrop">
                <section class="payment-modal">
                    <button
                        type="button"
                        class="close-modal"
                        @click="closePayment"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <template v-if="!paymentComplete">
                        <p class="payment-eyebrow">Checkout</p>
                        <h2>Collect Payment</h2>
                        <div class="payment-total">
                            <span>Amount due</span
                            ><strong>${{ formatMoney(payableAmount) }}</strong>
                        </div>
                        <div class="payment-methods">
                            <button
                                v-for="method in paymentMethods"
                                :key="method.name"
                                type="button"
                                :class="{
                                    active: paymentMethod === method.name,
                                }"
                                @click="selectPaymentMethod(method.name)"
                            >
                                <i class="fa-solid" :class="method.icon"></i
                                >{{ method.name }}
                            </button>
                        </div>
                        <label
                            v-if="paymentMethod === 'Cash'"
                            class="cash-field"
                            >Cash received
                            <input
                                v-model.number="cashReceived"
                                type="number"
                                min="0"
                                step="0.01"
                                inputmode="decimal"
                            />
                        </label>
                        <div v-if="paymentMethod === 'Cash'" class="change-row">
                            <span>Change</span
                            ><strong>${{ formatMoney(changeAmount) }}</strong>
                        </div>
                        <p v-if="paymentError" class="payment-error">
                            {{ paymentError }}
                        </p>
                        <button
                            type="button"
                            class="complete-payment"
                            @click="completePayment"
                        >
                            Complete payment
                        </button>
                    </template>
                    <div v-else class="payment-success">
                        <i class="fa-solid fa-circle-check"></i>
                        <h2>Payment successful</h2>
                        <p>
                            {{ lastReceipt.orderNumber }} · {{ paymentMethod }}
                        </p>
                        <strong>${{ formatMoney(lastReceipt.total) }}</strong>
                        <span v-if="lastReceipt.change > 0"
                            >Change ${{ formatMoney(lastReceipt.change) }}</span
                        >
                        <button type="button" @click="finishOrder">
                            Start next order
                        </button>
                    </div>
                </section>
            </div>
        </transition>

        <transition name="modal-fade">
            <div v-if="isStaffLocked" class="staff-lock">
                <section class="pin-card">
                    <div class="staff-photo">{{ initials }}</div>
                    <h2>{{ cashierName }}</h2>
                    <p>Enter your PIN to continue</p>
                    <div class="pin-boxes">
                        <span
                            v-for="index in 4"
                            :key="index"
                            :class="{ filled: staffPin.length >= index }"
                            >{{ staffPin.length >= index ? '*' : '' }}</span
                        >
                    </div>
                    <div class="pin-pad">
                        <button
                            v-for="number in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
                            :key="number"
                            type="button"
                            @click="pressPin(number)"
                        >
                            {{ number }}
                        </button>
                        <button type="button" @click="clearPin">CLEAR</button>
                        <button type="button" @click="pressPin(0)">0</button>
                        <button type="button" @click="backspacePin">
                            <i class="fa-solid fa-delete-left"></i>
                        </button>
                    </div>
                    <p v-if="staffPinError" class="pin-error">
                        {{ staffPinError }}
                    </p>
                </section>
            </div>
        </transition>
    </main>
</template>

<script>
import PosTopbar from '@/components/common/PosTopbar.vue'
import MemberFormFields from '@/components/membership/MemberFormFields.vue'
import ProductMenu from '@/components/order/ProductMenu.vue'
import SetMealCustomizer from '@/components/order/SetMealCustomizer.vue'
import {
    loadMembers,
    saveMember,
} from '@/services/pos/memberships.js'
import { findStaffAccount } from '@/services/pos/staff.js'
import { loadMenuCatalog } from '@/services/pos/menuCatalog.js'
import {
    removeKitchenTicket,
    upsertKitchenTicket,
} from '@/services/pos/kitchen.js'
import { resolveOrderNotifications } from '@/services/pos/notifications.js'
import {
    productAvailabilityStatus,
    sortProductsByAvailability,
} from '@/utils/menu.js'
import {
    moneyNumber,
    safeMenuPrice,
    validOrderLine,
} from '@/utils/money.js'
import {
    createProductOptionState,
    productOptionExtra,
    productOptionLines,
} from '@/utils/productOptions.js'
export default {
    name: 'POSOrder',
    components: {
        MemberFormFields,
        PosTopbar,
        ProductMenu,
        SetMealCustomizer,
    },
    data() {
        const catalog = loadMenuCatalog()
        return {
            cashierName: 'Alice Tan',
            employeeId: 'EMP001',
            searchKeyword: '',
            activeCategory: catalog.categories.includes('Lunch')
                ? 'Lunch'
                : catalog.categories[0] || '',
            drawerProduct: null,
            setMealSelections: [],
            activeSetSelectionIndex: 0,
            editingKey: '',
            editingGroupIndex: null,
            editingItemIndex: null,
            refundTarget: null,
            pendingRefundTarget: null,
            showSetExchangePicker: false,
            setExchangeQuery: '',
            pendingResolvedSelectionIssueIds: [],
            initialSetIssueSignatures: {},
            resolvedKitchenIssueIds: [],
            selectedCartKey: '',
            selectedPreviousItem: '',
            previousOrderGroups: [],
            baseEditingOrder: null,
            isEditingExistingOrder: false,
            showCancelOrder: false,
            showMemberPicker: false,
            memberRegisterMode: false,
            memberQuery: '',
            members: [],
            selectedMember: null,
            quickMember: {
                name: '',
                phone: '',
                email: '',
                birthday: '',
                note: '',
            },
            memberError: '',
            showHoldCart: false,
            holdNote: '',
            guestCount: 2,
            orderNote: '',
            showGuestEditor: false,
            showNoteEditor: false,
            showTableMenu: false,
            showOrderContext: false,
            showPriceBreakdown: false,
            showPayment: false,
            paymentComplete: false,
            paymentMethod: 'Cash',
            cashReceived: 0,
            paymentError: '',
            orderError: '',
            lastReceipt: {},
            paymentMethods: [
                { name: 'Cash', icon: 'fa-money-bill-wave' },
                { name: 'Card', icon: 'fa-credit-card' },
                { name: 'E-Wallet', icon: 'fa-mobile-screen-button' },
            ],
            isStaffLocked: false,
            staffPin: '',
            staffPinError: '',
            idleDelay: 6e4,
            drawerState: this.emptyDrawerState(),
            orderSetup: {
                orderType: 'Dine In',
                tableNumber: 'T43',
                orderNo: '#5266',
            },
            cart: [],
            navItems: [
                { label: 'Home', icon: 'fa-house' },
                { label: 'Tables', icon: 'fa-table-cells-large' },
                { label: 'Transactions', icon: 'fa-receipt' },
            ],
            categories: catalog.categories,
            categoryTranslations: catalog.categoryTranslations,
            products: catalog.products,
        }
    },
    computed: {
        initials() {
            return this.cashierName
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
        },
        orderNumber() {
            return this.orderSetup.orderNo || '#5266'
        },
        editingIssue() {
            if (this.activeSetSelectionIssue) return this.activeSetSelectionIssue
            if (
                this.editingGroupIndex === null ||
                this.editingItemIndex === null
            )
                return null
            const item =
                this.previousOrderGroups[this.editingGroupIndex]?.items[
                    this.editingItemIndex
                ] || null
            const unresolved = this.unresolvedIssuesForItem(item)
            return unresolved[0] || item?.kitchenIssue || null
        },
        activeSetSelection() {
            return this.setMealSelections[this.activeSetSelectionIndex] || null
        },
        activeSetSelectionIssue() {
            return this.activeSetSelection?.returnIssue || null
        },
        showSetExchangeAction() {
            return Boolean(
                this.drawerProduct?.type === 'set' &&
                    this.activeSetSelectionIssue &&
                    this.editingGroupIndex !== null &&
                    this.editingItemIndex !== null,
            )
        },
        exchangeableSetProducts() {
            const keyword = this.setExchangeQuery.toLowerCase()
            const activeProductId = this.activeSetSelection?.product?.id
            return this.products.filter((product) => {
                if (product.type === 'set') return false
                if (productAvailabilityStatus(product) !== 'available')
                    return false
                if (activeProductId && product.id === activeProductId)
                    return false
                return (
                    !keyword ||
                    product.name.toLowerCase().includes(keyword) ||
                    String(product.category || '')
                        .toLowerCase()
                        .includes(keyword)
                )
            })
        },
        filteredProducts() {
            const keyword = this.searchKeyword.toLowerCase()
            const products = this.products.filter((product) => {
                const categoryMatch = product.category === this.activeCategory
                const keywordMatch =
                    !keyword || product.name.toLowerCase().includes(keyword)
                return categoryMatch && keywordMatch
            })
            return sortProductsByAvailability(products)
        },
        availableTables() {
            const all = [
                'T21',
                'T22',
                'T23',
                'T24',
                'T25',
                'T26',
                'T41',
                'T42',
                'T43',
                'T44',
                'T45',
                'T46',
            ]
            const currentId = this.baseEditingOrder?.id
            const occupied = new Set(
                this.readLocalList('posfood_held_orders')
                    .filter((order) => order.id !== currentId)
                    .map((order) => order.orderSetup?.tableNumber)
                    .filter(Boolean),
            )
            return all.filter(
                (table) =>
                    table === this.orderSetup.tableNumber ||
                    !occupied.has(table),
            )
        },
        memberResults() {
            const keyword = this.memberQuery.toLowerCase()
            return this.members
                .filter((member) => member.status === 'active')
                .filter(
                    (member) =>
                        !keyword ||
                        [member.name, member.phone, member.memberId].some(
                            (value) =>
                                String(value).toLowerCase().includes(keyword),
                        ),
                )
                .slice(0, 8)
        },
        subtotal() {
            return this.allItems.reduce(
                (total, item) => total + moneyNumber(item.total),
                0,
            )
        },
        allItems() {
            return [
                ...this.previousOrderGroups.flatMap(
                    (group) => group.items || [],
                ),
                ...this.cart,
            ]
        },
        tax() {
            return this.subtotal * 0.225
        },
        payableAmount() {
            return this.subtotal + this.tax
        },
        changeAmount() {
            return Math.max(
                0,
                Number(this.cashReceived || 0) - this.payableAmount,
            )
        },
        drawerTotal() {
            if (!this.drawerProduct) return 0
            if (this.drawerProduct.type === 'set') {
                const extra = this.setMealSelections.reduce(
                    (total, selection) =>
                        total +
                        productOptionExtra(selection.product, selection.state),
                    0,
                )
                return (
                    (Number(this.drawerProduct.price || 0) + extra) *
                    this.drawerState.qty
                )
            }
            const size = this.drawerProduct.sizes?.find(
                (item) => item.name === this.drawerState.size,
            )
            const addonTotal = (this.drawerProduct.addons || [])
                .filter((addon) => this.drawerState.addons.includes(addon.name))
                .reduce((total, addon) => total + addon.price, 0)
            const modifierTotal = (
                this.drawerProduct.modifierGroups || []
            ).reduce((total, group) => {
                const option = (group.options || []).find(
                    (item) =>
                        item.name === this.drawerState.modifiers[group.name],
                )
                return total + Number(option?.price || 0)
            }, 0)
            return (
                (this.drawerProduct.price +
                    (size?.price || 0) +
                    addonTotal +
                    modifierTotal) *
                this.drawerState.qty
            )
        },
    },
    mounted() {
        this.loadSession()
        this.loadOrderCart()
        this.activityEvents = [
            'mousemove',
            'mousedown',
            'keydown',
            'touchstart',
            'scroll',
        ]
        this.activityEvents.forEach((eventName) =>
            window.addEventListener(eventName, this.resetIdleTimer, {
                passive: true,
            }),
        )
        this.resetIdleTimer()
    },
    beforeUnmount() {
        clearTimeout(this.idleTimer)
        if (this.activityEvents) {
            this.activityEvents.forEach((eventName) =>
                window.removeEventListener(eventName, this.resetIdleTimer),
            )
        }
    },
    methods: {
        toggleOrderType() {
            if (this.orderSetup.orderType === 'Dine In') {
                this.orderSetup = {
                    ...this.orderSetup,
                    orderType: 'Takeaway',
                    tableNumber: '',
                }
                this.showTableMenu = false
            } else {
                this.orderSetup = {
                    ...this.orderSetup,
                    orderType: 'Dine In',
                    tableNumber: this.orderSetup.tableNumber || 'T43',
                }
            }
            localStorage.setItem(
                'posfood_order_setup',
                JSON.stringify(this.orderSetup),
            )
        },
        changeTable(table) {
            this.orderSetup = {
                ...this.orderSetup,
                orderType: 'Dine In',
                tableNumber: table,
            }
            this.showTableMenu = false
            this.showOrderContext = false
            localStorage.setItem(
                'posfood_order_setup',
                JSON.stringify(this.orderSetup),
            )
        },
        changeGuest(delta) {
            this.guestCount = Math.min(6, Math.max(1, this.guestCount + delta))
            this.orderSetup = { ...this.orderSetup, pax: this.guestCount }
            localStorage.setItem(
                'posfood_order_setup',
                JSON.stringify(this.orderSetup),
            )
        },
        navigateNav(label) {
            if (label === 'Tables') this.$router.push('/pos/start')
            if (label === 'Transactions') this.$router.push('/pos/transactions')
        },
        emptyDrawerState() {
            return {
                size: '',
                ingredients: [],
                removedIngredients: [],
                addons: [],
                modifiers: {},
                remark: '',
                qty: 1,
            }
        },
        buildSetMealSelections(product, savedSelections = [], sourceItem = null) {
            const selectionIssueMap = new Map(
                this.unresolvedIssuesForItem(sourceItem)
                    .filter((issue) => Number.isInteger(issue?.source?.setIndex))
                    .map((issue) => [issue.source.setIndex, issue]),
            )
            if (savedSelections.length) {
                return savedSelections
                    .map((selection, index) => {
                        const itemProduct = this.products.find(
                            (item) => item.id === selection.productId,
                        )
                        if (!itemProduct) return null
                        return {
                            key: `${selection.productId}-${index}`,
                            product: itemProduct,
                            state: createProductOptionState(
                                itemProduct,
                                selection.state,
                            ),
                            returnIssue: selectionIssueMap.get(index) || null,
                        }
                    })
                    .filter(Boolean)
            }

            const setItems =
                Array.isArray(product.setItems) && product.setItems.length
                    ? product.setItems
                    : (Array.isArray(product.setItemIds)
                          ? product.setItemIds
                          : []
                      ).map((productId) => ({
                          productId,
                          quantity: 1,
                      }))
            let sequence = 0
            return setItems.flatMap((item) => {
                const itemProduct = this.products.find(
                    (productItem) =>
                        String(productItem.id) === String(item.productId),
                )
                if (!itemProduct) return []
                return Array.from(
                    { length: Math.max(1, Number(item.quantity) || 1) },
                    () => {
                        const nextIndex = sequence++
                        return {
                            key: `${item.productId}-${nextIndex}`,
                            product: itemProduct,
                            state: createProductOptionState(itemProduct),
                            returnIssue:
                                selectionIssueMap.get(nextIndex) || null,
                        }
                    },
                )
            })
        },
        loadSession() {
            try {
                const account = JSON.parse(
                    localStorage.getItem('posfood_active_account'),
                )
                if (!account) {
                    this.$router.push('/')
                    return
                }
                this.cashierName = account.name || this.cashierName
                this.employeeId = account.employeeId || this.employeeId
                this.orderSetup =
                    JSON.parse(localStorage.getItem('posfood_order_setup')) ||
                    this.orderSetup
                const pax = Number.parseInt(this.orderSetup.pax, 10)
                if (Number.isFinite(pax) && pax > 0)
                    this.guestCount = Math.min(6, Math.max(1, pax))
            } catch (error) {
                this.$router.push('/')
            }
        },
        loadOrderCart() {
            try {
                const draft = JSON.parse(
                    localStorage.getItem('posfood_order_draft'),
                )
                const shouldRestoreDraft =
                    draft?.orderSetup?.orderNo === this.orderSetup.orderNo ||
                    this.$route.query.restore === '1'
                if (draft?.items?.length && shouldRestoreDraft) {
                    this.orderSetup = { ...draft.orderSetup }
                    this.guestCount = Number(
                        draft.guests ||
                            draft.orderSetup?.pax ||
                            this.guestCount,
                    )
                    this.previousOrderGroups = (
                        draft.previousOrderGroups || []
                    ).map((group) => ({
                        ...group,
                        items: (group.items || []).map((item) =>
                            this.repairOrderItem(item),
                        ),
                    }))
                    this.cart = (draft.cart || []).map((item) =>
                        this.repairOrderItem(item),
                    )
                    this.baseEditingOrder = draft.baseEditingOrder || null
                    this.resolvedKitchenIssueIds = [
                        ...(draft.resolvedKitchenIssueIds || []),
                    ]
                    this.selectedMember = draft.member || null
                    this.isEditingExistingOrder = Boolean(
                        draft.isEditingExistingOrder,
                    )
                    return
                }
                const editingOrder = JSON.parse(
                    localStorage.getItem('posfood_editing_order'),
                )
                this.baseEditingOrder = editingOrder || null
                this.resolvedKitchenIssueIds = [
                    ...(editingOrder?.resolvedKitchenIssueIds || []),
                ]
                this.selectedMember = editingOrder?.member || null
                this.isEditingExistingOrder = Boolean(editingOrder)
                if (editingOrder?.orderGroups?.length)
                    this.previousOrderGroups = editingOrder.orderGroups.map(
                        (group) => ({
                            ...group,
                            items: (group.items || []).map((item) =>
                                this.repairOrderItem(item),
                            ),
                        }),
                    )
                else if (
                    Array.isArray(editingOrder?.items) &&
                    editingOrder.items.length
                )
                    this.previousOrderGroups = [
                        {
                            label: 'Order',
                            createdAt: editingOrder.createdAt,
                            items: editingOrder.items.map((item) =>
                                this.repairOrderItem(item),
                            ),
                        },
                    ]
                else this.previousOrderGroups = []
                this.cart = []
                localStorage.removeItem('posfood_editing_order')
                localStorage.removeItem('posfood_add_order_mode')
            } catch (error) {
                this.cart = []
                this.previousOrderGroups = []
                this.baseEditingOrder = null
            }
        },
        applyNewTakeaway(setup) {
            localStorage.removeItem('posfood_order_draft')
            this.orderSetup = setup
            this.guestCount = 1
            this.cart = []
            this.previousOrderGroups = []
            this.baseEditingOrder = null
            this.isEditingExistingOrder = false
            this.selectedCartKey = ''
            this.selectedPreviousItem = ''
            this.selectedMember = null
        },
        openMemberPicker() {
            this.members = loadMembers()
            this.memberRegisterMode = false
            this.memberQuery = ''
            this.memberError = ''
            this.quickMember = {
                name: '',
                phone: '',
                email: '',
                birthday: '',
                note: '',
            }
            this.showMemberPicker = true
        },
        closeMemberPicker() {
            this.showMemberPicker = false
            this.memberRegisterMode = false
            this.memberError = ''
        },
        memberInitials(name) {
            return String(name || '')
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
        },
        attachMember(member) {
            this.selectedMember = { ...member }
            this.closeMemberPicker()
        },
        removeMember() {
            this.selectedMember = null
            this.closeMemberPicker()
        },
        quickRegisterMember() {
            try {
                const member = saveMember(this.quickMember)
                this.members = loadMembers()
                this.attachMember(member)
            } catch (error) {
                this.memberError = error.message
            }
        },
        formatMoney(value) {
            return moneyNumber(value).toFixed(2)
        },
        issueLabel(issue) {
            return String(issue?.requestType || '')
                .toLowerCase()
                .includes('replacement')
                ? 'Replacement'
                : 'Refund'
        },
        unresolvedIssuesForItem(item) {
            const issues = [
                ...(item?.kitchenIssues || []),
                ...(item?.kitchenIssue ? [item.kitchenIssue] : []),
            ].filter(Boolean)
            return issues.filter(
                (issue, index, all) =>
                    !this.resolvedKitchenIssueIds.includes(issue.id) &&
                    all.findIndex((candidate) => candidate.id === issue.id) === index,
            )
        },
        rememberResolvedIssue(issue) {
            if (
                issue?.id &&
                !this.resolvedKitchenIssueIds.includes(issue.id)
            )
                this.resolvedKitchenIssueIds.push(issue.id)
        },
        rememberResolvedIssues(issues) {
            ;(issues || []).forEach((issue) =>
                this.rememberResolvedIssue(issue),
            )
        },
        normalizedSetSelectionState(state = {}) {
            const sortValues = (values) =>
                [...(Array.isArray(values) ? values : [])]
                    .map((value) => String(value))
                    .sort((a, b) => a.localeCompare(b))
            const modifiers = Object.fromEntries(
                Object.entries(state.modifiers || {})
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([name, value]) => [name, String(value || '')]),
            )
            return {
                size: String(state.size || ''),
                ingredients: sortValues(state.ingredients),
                removedIngredients: sortValues(state.removedIngredients),
                addons: sortValues(state.addons),
                modifiers,
                remark: String(state.remark || '').trim(),
            }
        },
        setSelectionResolutionSignature(selection) {
            return JSON.stringify({
                productId: String(selection?.product?.id || ''),
                state: this.normalizedSetSelectionState(selection?.state),
            })
        },
        rememberInitialSetIssueSignatures() {
            this.initialSetIssueSignatures = Object.fromEntries(
                this.setMealSelections
                    .filter((selection) => selection.returnIssue?.id)
                    .map((selection) => [
                        selection.returnIssue.id,
                        this.setSelectionResolutionSignature(selection),
                    ]),
            )
        },
        modifiedSetSelectionIssueIds() {
            return this.setMealSelections
                .filter(
                    (selection) =>
                        selection.returnIssue?.id &&
                        this.issueLabel(selection.returnIssue) ===
                            'Replacement',
                )
                .filter((selection) => {
                    const issueId = selection.returnIssue.id
                    const initialSignature =
                        this.initialSetIssueSignatures[issueId]
                    return (
                        initialSignature &&
                        initialSignature !==
                            this.setSelectionResolutionSignature(selection)
                    )
                })
                .map((selection) => selection.returnIssue.id)
        },
        repairOrderItem(item) {
            const quantity = Math.max(1, Math.min(999, Number(item?.qty) || 1))
            const product = this.products.find(
                (candidate) =>
                    candidate.id === item?.productId ||
                    candidate.name === item?.name,
            )
            let unitPrice = Number(item?.unitPrice ?? item?.unitTotal)
            if (!validOrderLine(item) || !Number.isFinite(unitPrice)) {
                const basePrice = safeMenuPrice(product?.price)
                const setExtras =
                    product?.type === 'set'
                        ? (item?.setSelections || []).reduce(
                              (total, selection) =>
                                  total + safeMenuPrice(selection.extraPrice),
                              0,
                          )
                        : 0
                unitPrice = basePrice + setExtras
            }
            unitPrice = safeMenuPrice(unitPrice, product?.price)
            return {
                ...item,
                qty: quantity,
                unitPrice: Number(unitPrice.toFixed(2)),
                total: Number((unitPrice * quantity).toFixed(2)),
            }
        },
        compactOrderItem(item, stripImage = false) {
            return {
                ...item,
                image: stripImage ? '' : item.image,
                setSelections: (item.setSelections || []).map(
                    ({ image, ...selection }) => selection,
                ),
            }
        },
        compactStoredOrder(order) {
            return {
                ...order,
                items: (order.items || []).map((item) =>
                    this.compactOrderItem(item, true),
                ),
                orderGroups: (order.orderGroups || []).map((group) => ({
                    ...group,
                    items: (group.items || []).map((item) =>
                        this.compactOrderItem(item, true),
                    ),
                })),
            }
        },
        optionText(item) {
            const lines = (item.optionLines || [item.size]).filter(Boolean)
            return lines.length ? lines.join(' · ') : 'Medium'
        },
        selectProduct(product) {
            if (productAvailabilityStatus(product) !== 'available') return
            if (!this.pendingRefundTarget) {
                this.editingKey = ''
                this.editingGroupIndex = null
                this.editingItemIndex = null
            }
            this.drawerProduct = product
            this.setMealSelections =
                product.type === 'set'
                    ? this.buildSetMealSelections(product)
                    : []
            this.initialSetIssueSignatures = {}
            this.activeSetSelectionIndex = 0
            const optionState = createProductOptionState(product)
            this.drawerState = {
                ...optionState,
                qty: 1,
            }
        },
        buildSetCartItem(product, state) {
            const setSelections = this.setMealSelections.map((selection) => {
                const optionLines = productOptionLines(
                    selection.product,
                    selection.state,
                )
                return {
                    productId: selection.product.id,
                    name: selection.product.name,
                    image: selection.product.image,
                    state: JSON.parse(JSON.stringify(selection.state)),
                    optionLines,
                    extraPrice: productOptionExtra(
                        selection.product,
                        selection.state,
                    ),
                }
            })
            const optionLines = setSelections.map((selection) => {
                const options = selection.optionLines.join(', ')
                return `${selection.name}${options ? `: ${options}` : ''}`
            })
            const unitPrice =
                safeMenuPrice(product.price) +
                setSelections.reduce(
                    (total, selection) =>
                        total + safeMenuPrice(selection.extraPrice),
                    0,
                )
            const key = JSON.stringify({
                productId: product.id,
                setSelections: setSelections.map((selection) => ({
                    productId: selection.productId,
                    state: selection.state,
                })),
                remark: state.remark,
            })
            return {
                key,
                productId: product.id,
                name: product.name,
                category: product.category,
                image: product.image,
                type: 'set',
                setSelections,
                optionLines,
                remark: state.remark,
                qty: Math.max(1, Number(state.qty) || 1),
                unitPrice,
                total:
                    unitPrice * Math.max(1, Number(state.qty) || 1),
            }
        },
        buildCartItem(product, state) {
            if (product.type === 'set')
                return this.buildSetCartItem(product, state)
            const size = product.sizes?.find((item) => item.name === state.size)
            const selectedAddons = state.addons || []
            const selectedIngredients = state.ingredients || []
            const selectedRemoved = state.removedIngredients || []
            const addons =
                product.addons?.filter((item) =>
                    selectedAddons.includes(item.name),
                ) || []
            const modifiers = Object.fromEntries(
                (product.modifierGroups || []).map((group) => [
                    group.name,
                    state.modifiers?.[group.name] ||
                        group.options?.[0]?.name ||
                        '',
                ]),
            )
            const selectedModifiers = (product.modifierGroups || [])
                .map((group) =>
                    (group.options || []).find(
                        (item) => item.name === modifiers[group.name],
                    ),
                )
                .filter(Boolean)
            const removedLines = selectedRemoved.map((item) => `No ${item}`)
            const optionLines = [
                state.size,
                ...selectedModifiers.map((item) => item.name),
                ...addons.map((item) => item.name),
                ...removedLines,
            ].filter(Boolean)
            const unitPrice =
                safeMenuPrice(product.price) +
                safeMenuPrice(size?.price) +
                addons.reduce(
                    (total, item) => total + safeMenuPrice(item.price),
                    0,
                ) +
                selectedModifiers.reduce(
                    (total, item) => total + safeMenuPrice(item.price),
                    0,
                )
            const key = JSON.stringify({
                productId: product.id,
                size: state.size,
                ingredients: [...selectedIngredients].sort(),
                removedIngredients: [...selectedRemoved].sort(),
                addons: [...selectedAddons].sort(),
                modifiers,
                remark: state.remark,
            })
            return {
                key,
                productId: product.id,
                name: product.name,
                category: product.category,
                image: product.image,
                optionLines,
                size: state.size,
                ingredients: [...selectedIngredients],
                removedIngredients: [...selectedRemoved],
                addons: [...selectedAddons],
                modifiers,
                remark: state.remark,
                qty: Math.max(1, Number(state.qty) || 1),
                unitPrice,
                total: unitPrice * Math.max(1, Number(state.qty) || 1),
            }
        },
        addCartItem(item) {
            const existing = this.cart.find(
                (cartItem) => cartItem.key === item.key,
            )
            if (existing) {
                existing.qty += item.qty
                existing.total = existing.qty * existing.unitPrice
            } else {
                this.cart.push(item)
            }
        },
        openSetExchangePicker() {
            if (!this.showSetExchangeAction) return
            this.setExchangeQuery = ''
            this.showSetExchangePicker = true
        },
        closeSetExchangePicker() {
            this.showSetExchangePicker = false
            this.setExchangeQuery = ''
        },
        replaceActiveSetSelectionWith(product) {
            if (!this.activeSetSelection || !product) return
            const resolvedIssue = this.activeSetSelection.returnIssue || null
            this.setMealSelections = this.setMealSelections.map((selection, index) =>
                index === this.activeSetSelectionIndex
                    ? {
                          ...selection,
                          product,
                          state: createProductOptionState(product),
                          returnIssue: null,
                      }
                    : selection,
            )
            if (resolvedIssue?.id)
                this.pendingResolvedSelectionIssueIds = [
                    ...new Set([
                        ...this.pendingResolvedSelectionIssueIds,
                        resolvedIssue.id,
                    ]),
                ]
            this.closeSetExchangePicker()
        },
        submitDrawerItem() {
            const modifiedSelectionIssueIds =
                this.drawerProduct?.type === 'set'
                    ? this.modifiedSetSelectionIssueIds()
                    : []
            const item = this.buildCartItem(
                this.drawerProduct,
                this.drawerState,
            )
            if (
                this.editingGroupIndex !== null &&
                this.editingItemIndex !== null
            ) {
                const previousItem =
                    this.previousOrderGroups[this.editingGroupIndex]?.items[
                        this.editingItemIndex
                    ]
                const previousIssues = this.unresolvedIssuesForItem(previousItem)
                const resolvedSelectionIssueIds = new Set([
                    ...this.pendingResolvedSelectionIssueIds,
                    ...modifiedSelectionIssueIds,
                ])
                if (this.pendingRefundTarget) {
                    this.rememberResolvedIssues(previousIssues)
                    delete item.kitchenIssue
                    delete item.kitchenIssues
                } else if (item.type === 'set') {
                    const remainingIssues = previousIssues.filter(
                        (issue) => !resolvedSelectionIssueIds.has(issue.id),
                    )
                    const resolvedIssues = previousIssues.filter((issue) =>
                        resolvedSelectionIssueIds.has(issue.id),
                    )
                    if (resolvedIssues.length)
                        this.rememberResolvedIssues(resolvedIssues)
                    if (remainingIssues.length) {
                        item.kitchenIssues = remainingIssues
                        item.kitchenIssue = remainingIssues[0]
                    } else {
                        delete item.kitchenIssue
                        delete item.kitchenIssues
                    }
                } else {
                    this.rememberResolvedIssues(previousIssues)
                    delete item.kitchenIssue
                    delete item.kitchenIssues
                }
                this.previousOrderGroups[this.editingGroupIndex].items.splice(
                    this.editingItemIndex,
                    1,
                    item,
                )
                this.pendingRefundTarget = null
                this.pendingResolvedSelectionIssueIds = []
            } else {
                if (this.editingKey)
                    this.cart = this.cart.filter(
                        (cartItem) => cartItem.key !== this.editingKey,
                    )
                this.addCartItem(item)
            }
            this.closeDrawer()
        },
        closeDrawer() {
            const pendingRefundTarget = this.pendingRefundTarget
            this.drawerProduct = null
            this.setMealSelections = []
            this.activeSetSelectionIndex = 0
            this.showSetExchangePicker = false
            this.setExchangeQuery = ''
            this.pendingResolvedSelectionIssueIds = []
            this.initialSetIssueSignatures = {}
            this.editingKey = ''
            this.editingGroupIndex = null
            this.editingItemIndex = null
            if (pendingRefundTarget) {
                this.editingGroupIndex = pendingRefundTarget.groupIndex
                this.editingItemIndex = pendingRefundTarget.itemIndex
            }
            this.drawerState = this.emptyDrawerState()
        },
        removeCartItem(key) {
            this.cart = this.cart.filter((item) => item.key !== key)
            if (this.selectedCartKey === key) this.selectedCartKey = ''
        },
        editCartItem(item) {
            this.openItemEditor(item)
        },
        editPreviousItem(item, groupIndex, itemIndex) {
            if (!this.isEditingExistingOrder) return
            this.editingGroupIndex = groupIndex
            this.editingItemIndex = itemIndex
            const unresolvedIssues = this.unresolvedIssuesForItem(item)
            const firstIssue = unresolvedIssues[0] || item.kitchenIssue || null
            const hasSetIssue = unresolvedIssues.some((issue) =>
                Number.isInteger(issue?.source?.setIndex),
            )
            if (firstIssue && this.issueLabel(firstIssue) === 'Refund' && !(item.type === 'set' && hasSetIssue)) {
                this.refundTarget = { item, groupIndex, itemIndex, issue: firstIssue }
                return
            }
            this.openItemEditor(item)
        },
        closeRefundAction() {
            this.refundTarget = null
            if (!this.pendingRefundTarget) {
                this.editingGroupIndex = null
                this.editingItemIndex = null
            }
        },
        chooseRefundReplacement() {
            if (!this.refundTarget) return
            this.pendingRefundTarget = { ...this.refundTarget }
            this.refundTarget = null
        },
        cancelRefundReplacement() {
            this.pendingRefundTarget = null
            this.editingGroupIndex = null
            this.editingItemIndex = null
        },
        cancelRefundItem() {
            if (!this.refundTarget) return
            const { item, groupIndex, itemIndex } = this.refundTarget
            this.rememberResolvedIssues(
                item.kitchenIssues?.length
                    ? item.kitchenIssues
                    : [item.kitchenIssue],
            )
            this.removePreviousItem(groupIndex, itemIndex)
            this.refundTarget = null
            this.pendingRefundTarget = null
            this.editingGroupIndex = null
            this.editingItemIndex = null
        },
        openItemEditor(item) {
            const product = this.products.find(
                (productItem) =>
                    productItem.id === item.productId ||
                    productItem.name === item.name,
            )
            if (!product) return
            this.editingKey = item.key
            this.selectedCartKey = ''
            this.drawerProduct = product
            this.setMealSelections =
                product.type === 'set'
                    ? this.buildSetMealSelections(
                          product,
                          item.setSelections || [],
                          item,
                      )
                    : []
            this.rememberInitialSetIssueSignatures()
            this.activeSetSelectionIndex = Math.max(
                0,
                this.setMealSelections.findIndex(
                    (selection) => Boolean(selection.returnIssue),
                ),
            )
            this.drawerState = {
                size: item.size || '',
                ingredients: [...(item.ingredients || [])],
                removedIngredients: [...(item.removedIngredients || [])],
                addons: [...(item.addons || [])],
                modifiers: {
                    ...(item.modifiers ||
                        Object.fromEntries(
                            (product.modifierGroups || []).map((group) => [
                                group.name,
                                group.options?.[0]?.name || '',
                            ]),
                        )),
                },
                remark: item.remark || '',
                qty: item.qty || 1,
            }
        },
        togglePreviousItem(groupIndex, itemIndex) {
            if (!this.isEditingExistingOrder) return
            const key = `${groupIndex}-${itemIndex}`
            this.selectedPreviousItem =
                this.selectedPreviousItem === key ? '' : key
            this.selectedCartKey = ''
        },
        removePreviousItem(groupIndex, itemIndex) {
            if (!this.isEditingExistingOrder) return
            const group = this.previousOrderGroups[groupIndex]
            if (!group) return
            group.items.splice(itemIndex, 1)
            if (!group.items.length)
                this.previousOrderGroups.splice(groupIndex, 1)
            this.selectedPreviousItem = ''
        },
        deleteEditingItem() {
            if (
                this.editingGroupIndex !== null &&
                this.editingItemIndex !== null
            ) {
                const previousItem =
                    this.previousOrderGroups[this.editingGroupIndex]?.items[
                        this.editingItemIndex
                    ]
                this.rememberResolvedIssues(
                    previousItem?.kitchenIssues?.length
                        ? previousItem.kitchenIssues
                        : [previousItem?.kitchenIssue],
                )
                this.removePreviousItem(
                    this.editingGroupIndex,
                    this.editingItemIndex,
                )
            } else if (this.editingKey) this.removeCartItem(this.editingKey)
            this.closeDrawer()
        },
        async confirmOrder() {
            if (!this.allItems.length) {
                if (this.isEditingExistingOrder && this.baseEditingOrder)
                    this.cancelCurrentOrder()
                return
            }
            this.orderError = ''
            const unresolvedKitchenIssues =
                this.previousOrderGroups.flatMap((group) =>
                    (group.items || []).flatMap((item) =>
                        this.unresolvedIssuesForItem(item),
                    ),
                )
            if (unresolvedKitchenIssues.length) {
                this.orderError =
                    'Resolve every kitchen return before confirming the order.'
                return
            }
            try {
                this.previousOrderGroups = this.previousOrderGroups.map(
                    (group) => ({
                        ...group,
                        items: (group.items || []).map((item) =>
                            this.repairOrderItem(item),
                        ),
                    }),
                )
                this.cart = this.cart.map((item) =>
                    this.repairOrderItem(item),
                )
                const orderGroups = [
                    ...this.previousOrderGroups,
                    ...(this.cart.length
                        ? [
                              {
                                  label: this.previousOrderGroups.length
                                      ? 'Add-on order'
                                      : 'Order',
                                  createdAt: new Date().toISOString(),
                                  items: this.cart.map((item) => ({ ...item })),
                              },
                          ]
                        : []),
                ].map((group) => ({
                    ...group,
                    items: (group.items || []).map((item) =>
                        this.compactOrderItem(item),
                    ),
                }))
                const fallbackItems = orderGroups.flatMap((group) =>
                    (group.items || []).map((item) =>
                        this.compactOrderItem(item, true),
                    ),
                )
                const heldOrder = {
                    ...(this.baseEditingOrder || {}),
                    id: this.baseEditingOrder?.id || `HOLD-${Date.now()}`,
                    orderNumber: this.orderNumber,
                    orderSetup: { ...this.orderSetup },
                    cashier: this.cashierName,
                    employeeId: this.employeeId,
                    member: this.selectedMember
                        ? { ...this.selectedMember }
                        : null,
                    guests: this.guestCount,
                    note: this.orderNote,
                    status: 'unpaid',
                    items: fallbackItems,
                    orderGroups,
                    subtotal: Number(this.subtotal.toFixed(2)),
                    tax: Number(this.tax.toFixed(2)),
                    total: Number(this.payableAmount.toFixed(2)),
                    createdAt:
                        this.baseEditingOrder?.createdAt ||
                        new Date().toISOString(),
                    heldAt:
                        this.baseEditingOrder?.heldAt ||
                        new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    resolvedKitchenIssueIds: [
                        ...this.resolvedKitchenIssueIds,
                    ],
                }
                const heldOrders = this.readLocalList('posfood_held_orders')
                const remaining = this.baseEditingOrder?.id
                    ? heldOrders.filter((order) => order.id !== heldOrder.id)
                    : heldOrders.filter(
                          (order) =>
                              order.orderNumber !== heldOrder.orderNumber,
                      )
                const isTakeaway =
                    heldOrder.orderSetup?.orderType === 'Takeaway'
                upsertKitchenTicket(heldOrder)
                if (isTakeaway)
                    localStorage.setItem(
                        'posfood_checkout',
                        JSON.stringify(heldOrder),
                    )
                else {
                    localStorage.setItem(
                        'posfood_held_orders',
                        JSON.stringify([heldOrder, ...remaining]),
                    )
                    localStorage.setItem(
                        'posfood_dashboard_focus_order',
                        heldOrder.id,
                    )
                }
                localStorage.removeItem('posfood_order_draft')
                localStorage.removeItem('posfood_order_setup')
                localStorage.removeItem('posfood_editing_order')
                localStorage.removeItem('posfood_add_order_mode')
                await this.$router.push(
                    isTakeaway ? '/pos/checkout' : '/pos/start',
                )
            } catch (error) {
                const quotaError =
                    error?.name === 'QuotaExceededError' ||
                    error?.code === 22 ||
                    error?.code === 1014
                this.orderError = quotaError
                    ? 'Order storage is full. Remove oversized menu photos and try again.'
                    : 'Unable to confirm this order. Please try again.'
                console.error('Unable to confirm order.', error)
            }
        },
        selectPaymentMethod(method) {
            this.paymentMethod = method
            this.paymentError = ''
        },
        closePayment() {
            if (this.paymentComplete) return
            this.showPayment = false
            this.paymentError = ''
        },
        completePayment() {
            if (
                this.paymentMethod === 'Cash' &&
                Number(this.cashReceived || 0) < this.payableAmount
            ) {
                this.paymentError = 'Cash received is less than the amount due.'
                return
            }
            const receipt = {
                id: `SALE-${Date.now()}`,
                orderNumber: this.orderNumber,
                orderType: this.orderSetup.orderType,
                tableNumber: this.orderSetup.tableNumber || '',
                cashier: this.cashierName,
                guests: this.guestCount,
                note: this.orderNote,
                items: this.cart.map((item) => ({ ...item })),
                subtotal: Number(this.subtotal.toFixed(2)),
                tax: Number(this.tax.toFixed(2)),
                total: Number(this.payableAmount.toFixed(2)),
                paymentMethod: this.paymentMethod,
                cashReceived:
                    this.paymentMethod === 'Cash'
                        ? Number(this.cashReceived)
                        : this.payableAmount,
                change:
                    this.paymentMethod === 'Cash'
                        ? Number(this.changeAmount.toFixed(2))
                        : 0,
                createdAt: new Date().toISOString(),
            }
            const sales = this.readLocalList('posfood_sales')
            localStorage.setItem(
                'posfood_sales',
                JSON.stringify([receipt, ...sales]),
            )
            this.lastReceipt = receipt
            this.paymentComplete = true
        },
        finishOrder() {
            this.cart = []
            localStorage.removeItem('posfood_order_draft')
            localStorage.removeItem('posfood_order_setup')
            this.showPayment = false
            this.paymentComplete = false
            this.$router.push('/pos/start')
        },
        readLocalList(key) {
            try {
                const value = JSON.parse(localStorage.getItem(key))
                return Array.isArray(value) ? value : []
            } catch (error) {
                return []
            }
        },
        holdCart() {
            if (!this.allItems.length) {
                this.showHoldCart = false
                return
            }
            const orderGroups = [
                ...this.previousOrderGroups,
                ...(this.cart.length
                    ? [
                          {
                              label: this.previousOrderGroups.length
                                  ? 'Add-on order'
                                  : 'Order',
                              createdAt: new Date().toISOString(),
                              items: this.cart,
                          },
                      ]
                    : []),
            ].map((group) => ({
                ...group,
                items: (group.items || []).map((item) =>
                    this.compactOrderItem(item),
                ),
            }))
            const heldOrder = {
                id: this.baseEditingOrder?.id || `HOLD-${Date.now()}`,
                orderNumber: this.orderNumber,
                orderSetup: { ...this.orderSetup },
                cashier: this.cashierName,
                note: this.holdNote,
                orderNote: this.orderNote,
                guests: this.guestCount,
                items: orderGroups.flatMap((group) =>
                    (group.items || []).map((item) =>
                        this.compactOrderItem(item, true),
                    ),
                ),
                orderGroups,
                subtotal: Number(this.subtotal.toFixed(2)),
                tax: Number(this.tax.toFixed(2)),
                total: Number(this.payableAmount.toFixed(2)),
                createdAt: new Date().toISOString(),
            }
            const heldOrders = this.readLocalList('posfood_held_orders')
            localStorage.setItem(
                'posfood_held_orders',
                JSON.stringify([
                    heldOrder,
                    ...heldOrders.filter(
                        (order) =>
                            order.id !== heldOrder.id &&
                            order.orderNumber !== heldOrder.orderNumber,
                    ),
                ]),
            )
            if (heldOrder.orderSetup?.orderType === 'Dine In')
                localStorage.setItem(
                    'posfood_dashboard_focus_order',
                    heldOrder.id,
                )
            this.cart = []
            this.holdNote = ''
            this.showHoldCart = false
            localStorage.removeItem('posfood_order_draft')
            localStorage.removeItem('posfood_order_setup')
            this.$router.push('/pos/start')
        },
        cancelCurrentOrder() {
            const heldOrders = this.readLocalList('posfood_held_orders')
            const cancelled =
                this.baseEditingOrder ||
                heldOrders.find(
                    (order) => order.orderNumber === this.orderNumber,
                )
            if (cancelled) {
                const cancelledOrderNumber =
                    cancelled.orderNumber || this.orderNumber
                resolveOrderNotifications(
                    cancelled.id,
                    cancelledOrderNumber,
                )
                removeKitchenTicket(cancelled.id, cancelledOrderNumber)
            }
            localStorage.setItem(
                'posfood_held_orders',
                JSON.stringify(
                    heldOrders.filter(
                        (order) =>
                            order.id !== cancelled?.id &&
                            order.orderNumber !== this.orderNumber,
                    ),
                ),
            )
            if (cancelled)
                localStorage.setItem(
                    'posfood_cancelled_orders',
                    JSON.stringify([
                        {
                            ...this.compactStoredOrder(cancelled),
                            status: 'cancelled',
                            cancelledAt: new Date().toISOString(),
                            cancelledBy: this.employeeId,
                        },
                        ...this.readLocalList(
                            'posfood_cancelled_orders',
                        ).map((order) => this.compactStoredOrder(order)),
                    ]),
                )
            if (this.orderSetup.tableNumber) {
                let states = {}
                try {
                    states =
                        JSON.parse(
                            localStorage.getItem('posfood_table_states'),
                        ) || {}
                } catch (error) {
                    states = {}
                }
                states[this.orderSetup.tableNumber] = {
                    status: 'vacant',
                    updatedAt: Date.now(),
                }
                localStorage.setItem(
                    'posfood_table_states',
                    JSON.stringify(states),
                )
            }
            localStorage.removeItem('posfood_order_setup')
            localStorage.removeItem('posfood_editing_order')
            localStorage.removeItem('posfood_add_order_mode')
            localStorage.removeItem('posfood_order_draft')
            this.showCancelOrder = false
            this.cart = []
            this.previousOrderGroups = []
            this.$router.push('/pos/start')
        },
        backToTables() {
            this.$router.push('/pos/start')
        },
        logout() {
            localStorage.removeItem('posfood_active_account')
            localStorage.removeItem('posfood_order_setup')
            this.$router.push('/')
        },
        resetIdleTimer() {
            if (this.isStaffLocked) return
            clearTimeout(this.idleTimer)
            this.idleTimer = setTimeout(() => {
                this.isStaffLocked = true
                this.staffPin = ''
                this.staffPinError = ''
            }, this.idleDelay)
        },
        pressPin(number) {
            if (this.staffPin.length >= 4) return
            this.staffPin += String(number)
            if (this.staffPin.length === 4) {
                const account = findStaffAccount(this.employeeId)
                if (this.staffPin === (account?.pin || '1234')) {
                    this.isStaffLocked = false
                    this.staffPin = ''
                    this.staffPinError = ''
                    this.resetIdleTimer()
                } else {
                    this.staffPinError = 'Wrong PIN'
                    setTimeout(() => {
                        this.staffPin = ''
                    }, 350)
                }
            }
        },
        clearPin() {
            this.staffPin = ''
            this.staffPinError = ''
        },
        backspacePin() {
            this.staffPin = this.staffPin.slice(0, -1)
            this.staffPinError = ''
        },
    },
}
</script>
