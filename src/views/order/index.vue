<template>
    <main class="restro-page" @click="resetIdleTimer">
        <section class="restro-shell">
            <header class="restro-topbar">
                <h1>Restro POS</h1>

                <label class="search-box">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input v-model.trim="searchKeyword" type="text" placeholder="Search products.....">
                </label>

                <div class="top-actions">
                    <button type="button" class="square-btn"><i class="fa-solid fa-rotate-right"></i></button>
                    <button type="button" class="square-btn wifi"><i class="fa-solid fa-wifi"></i></button>
                    <button type="button" class="orange-btn" @click="backToTables">
                        <i class="fa-solid fa-table-cells-large"></i>
                        Select Table
                    </button>
                </div>
            </header>

            <aside class="app-sidebar">
                <button
                    v-for="item in navItems"
                    :key="item.label"
                    type="button"
                    :class="{ active: item.label === 'Home' }"
                >
                    <i class="fa-solid" :class="item.icon"></i>
                    <span>{{ item.label }}</span>
                </button>
                <div class="sidebar-spacer"></div>
                <div class="avatar">{{ initials }}</div>
                <button type="button" @click="logout">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>Logout</span>
                </button>
            </aside>

            <section class="menu-workspace">
                <div class="category-tabs">
                    <button
                        v-for="category in categories"
                        :key="category"
                        type="button"
                        :class="{ active: activeCategory === category }"
                        @click="activeCategory = category"
                    >
                        {{ category }}
                    </button>
                </div>

                <div v-if="filteredProducts.length" class="product-grid">
                    <article v-for="product in filteredProducts" :key="product.id" class="product-card" :class="{ soldout: product.soldOut }">
                        <div class="dish-wrap">
                            <img :src="product.image" :alt="product.name">
                        </div>
                        <h2>{{ product.name }}</h2>
                        <strong>${{ formatMoney(product.price) }}</strong>
                        <button type="button" :disabled="product.soldOut" @click="selectProduct(product)">
                            <i class="fa-solid fa-plus"></i>
                            Add
                        </button>
                    </article>
                </div>

                <div v-else class="empty-menu">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <strong>No products found</strong>
                </div>
            </section>

            <aside class="cart-panel">
                <div class="cart-actions">
                    <button type="button"><i class="fa-solid fa-plus"></i> Add Customer</button>
                    <button type="button"><i class="fa-solid fa-plus"></i></button>
                    <button type="button"><i class="fa-solid fa-barcode"></i></button>
                    <button type="button"><i class="fa-solid fa-rotate-right"></i></button>
                </div>

                <div class="order-meta">
                    <span>Order No.</span>
                    <strong>{{ orderNumber }}</strong>
                    <b>{{ orderSetup.orderType }}<template v-if="orderSetup.tableNumber"> - {{ orderSetup.tableNumber }}</template></b>
                </div>

                <div class="cart-list">
                    <article v-for="item in cart" :key="item.key" class="cart-line">
                        <button type="button" class="expand"><i class="fa-solid fa-chevron-right"></i></button>
                        <strong>{{ item.qty }}</strong>
                        <div>
                            <h3>{{ item.name }}</h3>
                            <p>{{ optionText(item) }}</p>
                        </div>
                        <b>${{ formatMoney(item.total) }}</b>
                        <button type="button" class="remove" @click="removeCartItem(item.key)">
                            <i class="fa-solid fa-circle-xmark"></i>
                        </button>
                    </article>

                    <div v-if="!cart.length" class="empty-cart">
                        <i class="fa-solid fa-basket-shopping"></i>
                        <span>No items yet</span>
                    </div>
                </div>

                <div class="cart-add-row">
                    <strong>Add</strong>
                    <button type="button">Discount</button>
                    <button type="button">Coupon Code</button>
                    <button type="button">Note</button>
                </div>

                <div class="summary">
                    <div><span>Subtotal</span><strong>${{ formatMoney(subtotal) }}</strong></div>
                    <div><span>Tax</span><strong>${{ formatMoney(tax) }}</strong></div>
                    <div class="payable"><span>Payable Amount</span><strong>${{ formatMoney(payableAmount) }}</strong></div>
                </div>

                <div class="cart-buttons">
                    <button type="button" class="hold-btn" @click="showHoldCart = true">
                        <i class="fa-regular fa-circle-pause"></i>
                        Hold Cart
                    </button>
                    <button type="button" class="proceed-btn" @click="proceedPayment">
                        <i class="fa-regular fa-circle-right"></i>
                        Proceed
                    </button>
                </div>
            </aside>
        </section>

        <transition name="modal-fade">
            <div v-if="drawerProduct" class="modal-backdrop">
                <section class="modifier-modal">
                    <button type="button" class="close-modal" @click="closeDrawer"><i class="fa-solid fa-xmark"></i></button>
                    <div class="modifier-head">
                        <img :src="drawerProduct.image" :alt="drawerProduct.name">
                        <div>
                            <span>Customize item</span>
                            <h2>{{ drawerProduct.name }}</h2>
                            <p>{{ drawerProduct.description }}</p>
                        </div>
                    </div>

                    <div v-if="drawerProduct.sizes" class="option-section">
                        <strong>Size</strong>
                        <label v-for="size in drawerProduct.sizes" :key="size.name">
                            <input v-model="drawerState.size" :value="size.name" type="radio">
                            <span>{{ size.name }}</span>
                            <b v-if="size.price">+${{ formatMoney(size.price) }}</b>
                        </label>
                    </div>

                    <div v-if="drawerProduct.ingredients" class="option-section">
                        <strong>Ingredients</strong>
                        <label v-for="ingredient in drawerProduct.ingredients" :key="ingredient">
                            <input v-model="drawerState.ingredients" :value="ingredient" type="checkbox">
                            <span>{{ ingredient }}</span>
                        </label>
                    </div>

                    <div v-if="drawerProduct.removable" class="option-section">
                        <strong>Remove</strong>
                        <label v-for="ingredient in drawerProduct.removable" :key="ingredient">
                            <input v-model="drawerState.removedIngredients" :value="ingredient" type="checkbox">
                            <span>No {{ ingredient }}</span>
                        </label>
                    </div>

                    <div v-if="drawerProduct.addons" class="option-section">
                        <strong>Add-ons</strong>
                        <label v-for="addon in drawerProduct.addons" :key="addon.name">
                            <input v-model="drawerState.addons" :value="addon.name" type="checkbox">
                            <span>{{ addon.name }}</span>
                            <b>+${{ formatMoney(addon.price) }}</b>
                        </label>
                    </div>

                    <label class="note-box">
                        Note
                        <textarea v-model.trim="drawerState.remark" placeholder="Less spicy, no onion..."></textarea>
                    </label>

                    <footer class="modifier-footer">
                        <div class="qty-control">
                            <button type="button" @click="drawerState.qty = Math.max(1, drawerState.qty - 1)">-</button>
                            <strong>{{ drawerState.qty }}</strong>
                            <button type="button" @click="drawerState.qty += 1">+</button>
                        </div>
                        <strong>${{ formatMoney(drawerTotal) }}</strong>
                        <button type="button" @click="submitDrawerItem">
                            {{ editingKey ? 'Update Item' : 'Add to Order' }}
                        </button>
                    </footer>
                </section>
            </div>
        </transition>

        <transition name="modal-fade">
            <div v-if="showHoldCart" class="modal-backdrop">
                <section class="hold-modal">
                    <div class="mini-summary">
                        <div><span>Subtotal</span><strong>${{ formatMoney(subtotal) }}</strong></div>
                        <div><span>Tax</span><strong>${{ formatMoney(tax) }}</strong></div>
                        <div><span>Payable Amount</span><strong>${{ formatMoney(payableAmount) }}</strong></div>
                    </div>
                    <form @submit.prevent="showHoldCart = false">
                        <h2>Hold Cart</h2>
                        <label>
                            Cart Note
                            <input v-model.trim="holdNote" type="text" placeholder="Enter the note for holding cart">
                        </label>
                        <div>
                            <button type="button" @click="showHoldCart = false">Cancel</button>
                            <button type="submit">Proceed</button>
                        </div>
                    </form>
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
                        <span v-for="index in 4" :key="index" :class="{ filled: staffPin.length >= index }"></span>
                    </div>
                    <div class="pin-pad">
                        <button v-for="number in [1,2,3,4,5,6,7,8,9]" :key="number" type="button" @click="pressPin(number)">{{ number }}</button>
                        <button type="button" @click="clearPin">CLEAR</button>
                        <button type="button" @click="pressPin(0)">0</button>
                        <button type="button" @click="backspacePin"><i class="fa-solid fa-delete-left"></i></button>
                    </div>
                    <p v-if="staffPinError" class="pin-error">{{ staffPinError }}</p>
                </section>
            </div>
        </transition>
    </main>
</template>

<script>
import pastaImg from '@/assets/img/pasta.png'
import pizzaImg from '@/assets/img/pizza.png'
import backgroundImg from '@/assets/img/background.jpg'

export default {
    name: 'POSOrder',
    data() {
        return {
            cashierName: 'Alice Tan',
            employeeId: 'EMP001',
            searchKeyword: '',
            activeCategory: 'Lunch',
            drawerProduct: null,
            editingKey: '',
            showHoldCart: false,
            holdNote: '',
            isStaffLocked: false,
            staffPin: '',
            staffPinError: '',
            idleDelay: 60000,
            drawerState: this.emptyDrawerState(),
            orderSetup: {
                orderType: 'Takeaway',
                customerName: 'Jason',
                pickupNumber: 'T012',
                orderNo: '#5266',
            },
            cart: [],
            navItems: [
                { label: 'Home', icon: 'fa-house' },
                { label: 'Customers', icon: 'fa-user' },
                { label: 'Tables', icon: 'fa-table-cells-large' },
                { label: 'Cashier', icon: 'fa-circle-dollar-to-slot' },
                { label: 'Orders', icon: 'fa-bag-shopping' },
                { label: 'Reports', icon: 'fa-chart-pie' },
                { label: 'Settings', icon: 'fa-gear' },
            ],
            categories: ['Starters', 'Breakfast', 'Lunch', 'Supper', 'Deserts', 'Beverages'],
            products: [
                { id: 'noodle-egg', name: 'Schezwan Egg Noodles', category: 'Lunch', description: 'Noodles with egg, greens and aromatic chilli oil.', price: 24, image: pastaImg, sizes: [{ name: 'Medium', price: 0 }, { name: 'Large', price: 5 }], ingredients: ['Egg', 'Noodles', 'Greens', 'Chilli Oil'], removable: ['Egg', 'Greens', 'Chilli Oil'], addons: [{ name: 'Extra Pickles', price: 2 }, { name: 'Extra Egg', price: 3 }] },
                { id: 'udon', name: 'Stir Egg Fry Udon Noodles', category: 'Lunch', description: 'Udon with fried egg and light soy glaze.', price: 24, image: pastaImg, sizes: [{ name: 'Medium', price: 0 }, { name: 'Large', price: 5 }], ingredients: ['Udon', 'Fried Egg', 'Soy Glaze', 'Spring Onion'], removable: ['Egg', 'Spring Onion'], addons: [{ name: 'Grilled Chicken', price: 6 }] },
                { id: 'thai-noodle', name: 'Thai Style Fried Noodles', category: 'Lunch', description: 'Fragrant noodles with herb stock and vegetables.', price: 24, image: pastaImg, sizes: [{ name: 'Medium', price: 0 }, { name: 'Large', price: 5 }], ingredients: ['Noodles', 'Herbs', 'Vegetables', 'Lime'], removable: ['Vegetables', 'Lime'], addons: [{ name: 'Shrimp', price: 8 }] },
                { id: 'prawn', name: 'Chinese Prawn Spaghetti', category: 'Lunch', description: 'Prawn spaghetti with garlic chilli oil.', price: 24, image: pizzaImg, sizes: [{ name: 'Medium', price: 0 }, { name: 'Large', price: 5 }], ingredients: ['Prawn', 'Spaghetti', 'Garlic', 'Chilli'], removable: ['Garlic', 'Chilli'], addons: [{ name: 'Extra Prawn', price: 8 }] },
                { id: 'soba', name: 'Japanese Soba Noodles', category: 'Supper', description: 'Cold soba with greens and sesame dressing.', price: 24, image: pastaImg, sizes: [{ name: 'Medium', price: 0 }, { name: 'Large', price: 5 }], ingredients: ['Soba', 'Greens', 'Sesame'], removable: ['Greens', 'Sesame'], addons: [{ name: 'Egg', price: 3 }] },
                { id: 'garlic', name: 'Chilli Garlic Thai Noodles', category: 'Lunch', description: 'Thai noodles with garlic and light chilli sauce.', price: 24, image: pastaImg, sizes: [{ name: 'Medium', price: 0 }, { name: 'Large', price: 5 }], ingredients: ['Garlic', 'Chilli Sauce', 'Thai Noodles'], removable: ['Garlic', 'Chilli Sauce'], addons: [{ name: 'Extra Sauce', price: 2 }] },
                { id: 'tea', name: 'Iced Lemon Tea', category: 'Beverages', description: 'Ceylon tea with lemon and honey.', price: 8.9, image: backgroundImg, sizes: [{ name: 'Less Ice', price: 0 }, { name: 'Regular Ice', price: 0 }], ingredients: ['Lemon', 'Honey', 'Ice'], removable: ['Lemon', 'Honey', 'Ice'], addons: [{ name: 'Extra Lemon', price: 1 }] },
                { id: 'water', name: 'Sparkling Water 500ml', category: 'Beverages', description: 'Imported sparkling mineral water.', price: 6, image: backgroundImg, soldOut: true, ingredients: ['Ice Cup'], removable: ['Ice Cup'], addons: [{ name: 'Lemon Slice', price: 1 }] },
                { id: 'pizza', name: 'Classic Margherita Pizza', category: 'Starters', description: 'Tomato, cheese and basil.', price: 39, image: pizzaImg, sizes: [{ name: 'Regular', price: 0 }, { name: 'Large', price: 9 }], ingredients: ['Tomato', 'Cheese', 'Basil'], removable: ['Tomato', 'Cheese', 'Basil'], addons: [{ name: 'Extra Cheese', price: 5 }] },
            ],
        }
    },
    computed: {
        initials() {
            return this.cashierName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
        },
        orderNumber() {
            return this.orderSetup.orderNo || '#5266'
        },
        filteredProducts() {
            const keyword = this.searchKeyword.toLowerCase()
            return this.products.filter((product) => {
                const categoryMatch = product.category === this.activeCategory
                const keywordMatch = !keyword || product.name.toLowerCase().includes(keyword)
                return categoryMatch && keywordMatch
            })
        },
        subtotal() {
            return this.cart.reduce((total, item) => total + item.total, 0)
        },
        tax() {
            return this.subtotal * 0.225
        },
        payableAmount() {
            return this.subtotal + this.tax
        },
        drawerTotal() {
            if (!this.drawerProduct) return 0
            const size = this.drawerProduct.sizes?.find((item) => item.name === this.drawerState.size)
            const addonTotal = (this.drawerProduct.addons || [])
                .filter((addon) => this.drawerState.addons.includes(addon.name))
                .reduce((total, addon) => total + addon.price, 0)
            return (this.drawerProduct.price + (size?.price || 0) + addonTotal) * this.drawerState.qty
        },
    },
    mounted() {
        this.loadSession()
        this.seedCart()
        this.activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
        this.activityEvents.forEach((eventName) => window.addEventListener(eventName, this.resetIdleTimer, { passive: true }))
        this.resetIdleTimer()
    },
    beforeUnmount() {
        clearTimeout(this.idleTimer)
        if (this.activityEvents) {
            this.activityEvents.forEach((eventName) => window.removeEventListener(eventName, this.resetIdleTimer))
        }
    },
    methods: {
        emptyDrawerState() {
            return {
                size: '',
                ingredients: [],
                removedIngredients: [],
                addons: [],
                remark: '',
                qty: 1,
            }
        },
        loadSession() {
            try {
                const account = JSON.parse(localStorage.getItem('posfood_active_account'))
                if (!account) {
                    this.$router.push('/')
                    return
                }
                this.cashierName = account.name || this.cashierName
                this.employeeId = account.employeeId || this.employeeId
                this.orderSetup = JSON.parse(localStorage.getItem('posfood_order_setup')) || this.orderSetup
            } catch (error) {
                this.$router.push('/')
            }
        },
        seedCart() {
            const product = this.products.find((item) => item.id === 'noodle-egg')
            if (!product) return
            this.cart = [
                this.buildCartItem(product, {
                    size: 'Medium',
                    ingredients: ['Egg', 'Noodles', 'Greens'],
                    removedIngredients: [],
                    addons: ['Extra Pickles'],
                    remark: '',
                    qty: 1,
                }),
            ]
        },
        formatMoney(value) {
            return Number(value || 0).toFixed(2)
        },
        optionText(item) {
            const lines = item.optionLines.filter(Boolean)
            return lines.length ? lines.join(' · ') : 'Medium'
        },
        selectProduct(product) {
            if (product.soldOut) return
            this.editingKey = ''
            this.drawerProduct = product
            this.drawerState = {
                size: product.sizes ? product.sizes[0].name : '',
                ingredients: product.ingredients ? [...product.ingredients] : [],
                removedIngredients: [],
                addons: [],
                remark: '',
                qty: 1,
            }
        },
        buildCartItem(product, state) {
            const size = product.sizes?.find((item) => item.name === state.size)
            const selectedAddons = state.addons || []
            const selectedIngredients = state.ingredients || []
            const selectedRemoved = state.removedIngredients || []
            const addons = product.addons?.filter((item) => selectedAddons.includes(item.name)) || []
            const removedLines = selectedRemoved.map((item) => `No ${item}`)
            const optionLines = [state.size, ...addons.map((item) => item.name), ...removedLines].filter(Boolean)
            const unitPrice = product.price + (size?.price || 0) + addons.reduce((total, item) => total + item.price, 0)
            const key = JSON.stringify({
                productId: product.id,
                size: state.size,
                ingredients: [...selectedIngredients].sort(),
                removedIngredients: [...selectedRemoved].sort(),
                addons: [...selectedAddons].sort(),
                remark: state.remark,
            })
            return {
                key,
                productId: product.id,
                name: product.name,
                optionLines,
                size: state.size,
                ingredients: [...selectedIngredients],
                removedIngredients: [...selectedRemoved],
                addons: [...selectedAddons],
                remark: state.remark,
                qty: state.qty,
                unitPrice,
                total: unitPrice * state.qty,
            }
        },
        addCartItem(item) {
            const existing = this.cart.find((cartItem) => cartItem.key === item.key)
            if (existing) {
                existing.qty += item.qty
                existing.total = existing.qty * existing.unitPrice
            } else {
                this.cart.push(item)
            }
        },
        submitDrawerItem() {
            const item = this.buildCartItem(this.drawerProduct, this.drawerState)
            if (this.editingKey) this.cart = this.cart.filter((cartItem) => cartItem.key !== this.editingKey)
            this.addCartItem(item)
            this.closeDrawer()
        },
        closeDrawer() {
            this.drawerProduct = null
            this.editingKey = ''
            this.drawerState = this.emptyDrawerState()
        },
        removeCartItem(key) {
            this.cart = this.cart.filter((item) => item.key !== key)
        },
        proceedPayment() {
            if (!this.cart.length) return
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
                if (this.staffPin === '1234') {
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

<style scoped lang="scss">
$orange: #fc8019;
$green: #09aa29;
$linen: #fff2e8;
$black: #171826;
$gray: #9f9f9e;
$cultured: #f5f5f5;

.restro-page {
    min-height: 100vh;
    padding: .45rem;
    background: #efefef;
    color: $black;
    font-family: 'poppins', Arial, sans-serif;
}

.restro-shell {
    min-height: calc(100vh - .9rem);
    display: grid;
    grid-template-columns: 5.3rem minmax(34rem, 1fr) 22.5rem;
    grid-template-rows: 4.4rem 1fr;
    overflow: hidden;
    border-radius: 1.35rem;
    background: $cultured;
    box-shadow: 0 .85rem 2.8rem rgba(23, 24, 38, .12);
}

.restro-topbar {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 10rem minmax(19rem, 24rem) 1fr;
    align-items: center;
    gap: 1.2rem;
    padding: 0 1rem 0 1.3rem;
    border-bottom: 1px solid #ececec;
    background: #fff;
}

.restro-topbar h1 {
    margin: 0;
    font-size: 1.65rem;
    font-weight: 900;
}

.search-box {
    height: 2.95rem;
    display: flex;
    align-items: center;
    gap: .75rem;
    padding: 0 1rem;
    border-radius: .45rem;
    background: $cultured;
}

.search-box input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: $black;
    font-size: .9rem;
}

.top-actions {
    display: flex;
    justify-content: flex-end;
    gap: .8rem;
}

.square-btn,
.orange-btn {
    height: 2.7rem;
    border: 0;
    border-radius: .45rem;
    font-weight: 900;
    cursor: pointer;
}

.square-btn {
    width: 2.7rem;
    background: $cultured;
    color: $black;
}

.square-btn.wifi {
    color: $green;
}

.orange-btn {
    display: flex;
    align-items: center;
    gap: .55rem;
    padding: 0 1rem;
    background: $orange;
    color: #fff;
}

.app-sidebar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .58rem;
    padding: .9rem .55rem;
    border-right: 1px solid #ececec;
    background: #fff;
}

.app-sidebar button {
    width: 4rem;
    min-height: 4rem;
    border: 1px solid transparent;
    border-radius: .45rem;
    background: transparent;
    color: $gray;
    cursor: pointer;
}

.app-sidebar i,
.app-sidebar span {
    display: block;
}

.app-sidebar i {
    margin-bottom: .32rem;
}

.app-sidebar span {
    font-size: .7rem;
    font-weight: 700;
}

.app-sidebar button.active {
    border-color: $orange;
    background: $linen;
    color: $orange;
}

.sidebar-spacer {
    flex: 1;
}

.avatar {
    width: 2.1rem;
    height: 2.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: $linen;
    color: $orange;
    font-size: .72rem;
    font-weight: 900;
}

.menu-workspace {
    padding: .9rem 1rem 1.4rem;
    overflow: auto;
}

.category-tabs {
    display: flex;
    gap: .55rem;
    align-items: center;
    height: 3.1rem;
    margin-bottom: 1.1rem;
    padding: .4rem .7rem;
    border-radius: .45rem;
    background: #fff;
}

.category-tabs button {
    height: 2.05rem;
    padding: 0 1rem;
    border: 1px solid transparent;
    border-radius: 2rem;
    background: transparent;
    color: $black;
    font-weight: 900;
    cursor: pointer;
}

.category-tabs button.active {
    border-color: $orange;
    color: $orange;
    background: $linen;
}

.product-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(9.5rem, 1fr));
    gap: 1.1rem 1.25rem;
}

.product-card {
    position: relative;
    min-height: 12rem;
    padding: 1rem .9rem .8rem;
    border-radius: .4rem;
    background: #fff;
    text-align: center;
    box-shadow: 0 .45rem 1.2rem rgba(23, 24, 38, .08);
}

.dish-wrap {
    height: 7rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.dish-wrap img {
    width: 6.7rem;
    height: 6.7rem;
    object-fit: contain;
    border-radius: 50%;
}

.product-card h2 {
    min-height: 2.8rem;
    margin: .15rem 0 .2rem;
    font-size: .98rem;
    line-height: 1.2;
    font-weight: 800;
}

.product-card strong {
    display: block;
    font-size: 1rem;
    font-weight: 900;
}

.product-card button {
    position: absolute;
    right: .72rem;
    bottom: .72rem;
    min-width: 4rem;
    height: 2.1rem;
    border: 0;
    border-radius: 2rem;
    background: $orange;
    color: #fff;
    font-weight: 900;
    cursor: pointer;
}

.product-card.soldout {
    filter: grayscale(1);
    opacity: .58;
}

.product-card.soldout button {
    background: $gray;
    cursor: not-allowed;
}

.empty-menu,
.empty-cart {
    min-height: 12rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: .45rem;
    color: $gray;
}

.cart-panel {
    display: flex;
    flex-direction: column;
    border-left: 1px solid #ececec;
    background: #fff;
}

.cart-actions {
    display: grid;
    grid-template-columns: 1fr 2.7rem 2.7rem 2.7rem;
    gap: .7rem;
    padding: .9rem 1rem;
}

.cart-actions button {
    height: 2.7rem;
    border: 0;
    border-radius: .45rem;
    background: $cultured;
    color: $black;
    font-weight: 900;
    cursor: pointer;
}

.order-meta {
    position: relative;
    padding: .95rem 1rem 1rem;
    border-top: 1px solid #f1f1f1;
    border-bottom: 1px solid #f1f1f1;
}

.order-meta span,
.order-meta strong {
    display: block;
}

.order-meta span {
    color: $gray;
    font-size: .75rem;
    font-weight: 800;
}

.order-meta strong {
    margin-top: .12rem;
    font-size: 1rem;
}

.order-meta b {
    position: absolute;
    top: .95rem;
    right: 1rem;
    font-size: .78rem;
}

.cart-list {
    flex: 1;
    overflow: auto;
    padding: .55rem 1rem;
}

.cart-line {
    display: grid;
    grid-template-columns: 1rem 1.2rem 1fr auto 1rem;
    align-items: center;
    gap: .65rem;
    min-height: 4rem;
    margin-bottom: .55rem;
    padding: .65rem .55rem;
    border-radius: .35rem;
    background: $cultured;
}

.cart-line button {
    border: 0;
    background: transparent;
    color: $gray;
    cursor: pointer;
}

.cart-line h3 {
    margin: 0;
    font-size: .86rem;
    line-height: 1.2;
}

.cart-line p {
    margin: .18rem 0 0;
    color: $gray;
    font-size: .72rem;
}

.cart-line b {
    font-size: .86rem;
}

.cart-add-row {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    align-items: center;
    gap: .8rem;
    min-height: 3.2rem;
    padding: 0 1rem;
    background: $linen;
}

.cart-add-row button {
    border: 0;
    background: transparent;
    color: $orange;
    font-weight: 900;
    cursor: pointer;
}

.summary {
    padding: 1rem 1rem .75rem;
}

.summary div {
    display: flex;
    justify-content: space-between;
    margin-bottom: .55rem;
    font-weight: 800;
}

.summary .payable {
    margin-top: .2rem;
    font-size: 1.05rem;
}

.cart-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .4rem;
    padding: 0 1rem .9rem;
}

.cart-buttons button {
    height: 3rem;
    border: 0;
    border-radius: .35rem;
    color: #fff;
    font-weight: 900;
    cursor: pointer;
}

.hold-btn { background: $orange; }
.proceed-btn { background: $green; }

.modal-backdrop,
.staff-lock {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(23, 24, 38, .42);
    backdrop-filter: blur(3px);
}

.modifier-modal {
    width: min(41rem, 94vw);
    max-height: 92vh;
    overflow: auto;
    position: relative;
    padding: 1.35rem;
    border-radius: .75rem;
    background: #fff;
    box-shadow: 0 1.3rem 3rem rgba(23, 24, 38, .25);
}

.close-modal {
    position: absolute;
    top: .85rem;
    right: .85rem;
    border: 0;
    background: transparent;
    color: $black;
    font-size: 1.15rem;
}

.modifier-head {
    display: grid;
    grid-template-columns: 8rem 1fr;
    gap: 1rem;
    align-items: center;
    padding-right: 1.7rem;
}

.modifier-head img {
    width: 8rem;
    height: 8rem;
    object-fit: contain;
    border-radius: .65rem;
    background: $cultured;
}

.modifier-head span {
    color: $orange;
    font-weight: 900;
}

.modifier-head h2 {
    margin: .25rem 0;
    font-size: 1.55rem;
}

.modifier-head p {
    margin: 0;
    color: $gray;
}

.option-section {
    margin-top: .95rem;
    padding: .85rem;
    border: 1px solid #ececec;
    border-radius: .45rem;
    background: $cultured;
}

.option-section strong {
    display: block;
    margin-bottom: .45rem;
}

.option-section label {
    min-height: 2.05rem;
    display: flex;
    align-items: center;
    gap: .55rem;
}

.option-section input {
    accent-color: $orange;
}

.option-section b {
    margin-left: auto;
}

.note-box {
    display: block;
    margin-top: .95rem;
    font-weight: 900;
}

.note-box textarea {
    width: 100%;
    min-height: 4.7rem;
    margin-top: .45rem;
    border: 1px solid #d8d8d8;
    border-radius: .35rem;
    padding: .7rem;
    resize: vertical;
}

.modifier-footer {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
}

.qty-control {
    display: flex;
    align-items: center;
    gap: .7rem;
}

.qty-control button {
    width: 2.1rem;
    height: 2.1rem;
    border: 1px solid #d8d8d8;
    border-radius: 50%;
    background: #fff;
}

.modifier-footer > strong {
    text-align: right;
    font-size: 1.35rem;
}

.modifier-footer > button {
    min-width: 10rem;
    height: 3rem;
    border: 0;
    border-radius: .35rem;
    background: $orange;
    color: #fff;
    font-weight: 900;
}

.hold-modal {
    width: min(52rem, 94vw);
    display: grid;
    grid-template-columns: 1fr 1.05fr;
    gap: 3rem;
    padding: 1.7rem;
    border-radius: .75rem;
    background: #fff;
    box-shadow: 0 1.3rem 3rem rgba(23, 24, 38, .25);
}

.mini-summary {
    padding: 1rem 1.35rem;
    border-radius: .65rem;
    background: $cultured;
}

.mini-summary div {
    display: flex;
    justify-content: space-between;
    margin-bottom: .7rem;
    font-weight: 900;
}

.hold-modal h2 {
    margin: 0 0 1rem;
}

.hold-modal label {
    display: block;
    font-weight: 900;
}

.hold-modal input {
    width: 100%;
    height: 2.7rem;
    margin-top: .45rem;
    border: 1px solid #cfcfcf;
    padding: 0 .8rem;
}

.hold-modal form div {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1.25rem;
}

.hold-modal form button {
    height: 3rem;
    border-radius: .35rem;
    border: 2px solid $orange;
    background: #fff;
    color: $orange;
    font-weight: 900;
}

.hold-modal form button:last-child {
    background: $orange;
    color: #fff;
}

.pin-card {
    width: min(24rem, 92vw);
    padding: 2rem;
    border-radius: .85rem;
    background: #fff;
    text-align: center;
    box-shadow: 0 1.3rem 3rem rgba(23, 24, 38, .25);
}

.staff-photo {
    width: 5rem;
    height: 5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto .9rem;
    border-radius: 50%;
    background: $linen;
    color: $orange;
    font-weight: 900;
}

.pin-card h2 {
    margin: 0;
    font-size: 1rem;
}

.pin-card p {
    margin: .35rem 0 .8rem;
    color: $gray;
    font-size: .72rem;
}

.pin-boxes {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: .55rem;
    margin-bottom: .85rem;
}

.pin-boxes span {
    height: 2.5rem;
    border-radius: .25rem;
    background: $cultured;
}

.pin-boxes span.filled {
    background: $linen;
    box-shadow: inset 0 0 0 2px $orange;
}

.pin-pad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: .55rem;
}

.pin-pad button {
    height: 2.6rem;
    border: 1px solid #ececec;
    border-radius: .35rem;
    background: #fff;
    font-weight: 900;
}

.pin-error {
    color: #ff2f1d !important;
    font-weight: 900;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity .18s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

@media (max-width: 1180px) {
    .restro-shell {
        grid-template-columns: 4.8rem 1fr;
        grid-template-rows: auto auto auto;
    }

    .restro-topbar {
        grid-template-columns: 1fr;
        padding: 1rem;
    }

    .cart-panel {
        grid-column: 2;
        min-height: 28rem;
    }

    .product-grid {
        grid-template-columns: repeat(2, minmax(9rem, 1fr));
    }
}
</style>
