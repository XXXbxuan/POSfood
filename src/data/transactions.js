import pastaImg from '@/assets/img/food/pasta.png'
import pizzaImg from '@/assets/img/food/pizza.png'

export function createDemoTransactions(now = Date.now()) {
    return [
        {
            id: 'DEMO-DINE',
            orderNumber: '#05822',
            status: 'paid',
            orderSetup: { orderType: 'Dine In', tableNumber: 'T22' },
            guests: 4,
            paymentMethod: 'Cash',
            subtotal: 87,
            tax: 19.58,
            total: 106.58,
            paidAt: new Date(now - 42 * 6e4).toISOString(),
            items: [
                {
                    name: 'Schezwan Egg Noodles',
                    size: 'Large',
                    optionLines: ['Large', 'No onion'],
                    qty: 2,
                    total: 58,
                    image: pastaImg,
                },
                {
                    name: 'Margherita Pizza',
                    size: 'Regular',
                    optionLines: ['Regular'],
                    qty: 1,
                    total: 29,
                    image: pizzaImg,
                },
            ],
        },
        {
            id: 'DEMO-TAKE',
            orderNumber: '#05818',
            status: 'paid',
            orderSetup: { orderType: 'Takeaway', tableNumber: '' },
            paymentMethod: 'E-Wallet',
            subtotal: 48,
            tax: 10.8,
            total: 58.8,
            paidAt: new Date(now - 96 * 6e4).toISOString(),
            items: [
                {
                    name: 'Thai Style Fried Noodles',
                    size: 'Medium',
                    optionLines: ['Medium'],
                    qty: 2,
                    total: 48,
                    image: pastaImg,
                },
            ],
        },
    ]
}
