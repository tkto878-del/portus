// Mock Database and State Management
const DUMMY_IMG = "assets/door-dummy.png"; // Placeholder for catalog products

window.Store = {
    user: JSON.parse(localStorage.getItem('portus_user')) || null,
    cart: JSON.parse(localStorage.getItem('portus_cart')) || [],
    orders: JSON.parse(localStorage.getItem('portus_orders')) || [],

    heroImages: ['assets/bg-hero.png', 'assets/bg-hero-2.png', 'assets/bg-hero-3.png'],

    products: [
        { id: 1, title: 'Дверь Стиль - 1 ( эмаль )', price: 8970, category: 'Межкомнатные', img: DUMMY_IMG, desc: 'полотна с врезкой под ручку и защелку. БЕЗ ФУРНИТУРЫ' },
        { id: 2, title: 'Дверь Стиль - 2 ( эмаль )', price: 8970, category: 'Межкомнатные', img: DUMMY_IMG, desc: 'полотна с врезкой под ручку и защелку. БЕЗ ФУРНИТУРЫ' },
        { id: 3, title: 'Дверь Нео - 1 ( эмаль )', price: 10300, category: 'Межкомнатные', img: DUMMY_IMG, desc: 'полотна с врезкой под ручку и защелку. БЕЗ ФУРНИТУРЫ' },
        { id: 4, title: 'Дверь Классика-5 стекло ( эмаль )', price: 31430, category: 'Межкомнатные', img: DUMMY_IMG, desc: 'полотна с врезкой под ручку и защелку. БЕЗ ФУРНИТУРЫ' },
        { id: 5, title: 'Вена ( Эко - шпон )', price: 5950, category: 'Межкомнатные', img: DUMMY_IMG, desc: '' },
        { id: 6, title: 'Сеул ( Эко - шпон )', price: 5950, category: 'Межкомнатные', img: DUMMY_IMG, desc: '' },
        { id: 7, title: 'Прага ( Эко - шпон )', price: 6490, category: 'Межкомнатные', img: DUMMY_IMG, desc: '' },
        { id: 8, title: 'Дублин ( бетон )', price: 6250, category: 'Межкомнатные', img: DUMMY_IMG, desc: '' },
        
        { id: 9, title: 'Входная дверь Металл-1', price: 15000, category: 'Входные', img: DUMMY_IMG, desc: 'Отличная шумоизоляция' },
        { id: 10, title: 'Скрытая дверь Invisi', price: 12000, category: 'Скрытые', img: DUMMY_IMG, desc: 'Под покраску' }
    ],

    categories: [
        { name: 'Межкомнатные двери', img: 'assets/cat-interior.png' },
        { name: 'Скрытые двери', img: 'assets/cat-hidden.png' },
        { name: 'Входные двери', img: 'assets/cat-entrance.png' },
        { name: 'Противопожарные, технические и двери на заказ', img: 'assets/cat-tech.png' },
        { name: 'Панели из Бамбука', img: 'assets/cat-bamboo.png' },
        { name: 'Мануфактура акрилового камня', img: 'assets/cat-stone.png' },
    ],

    saveCart() {
        localStorage.setItem('portus_cart', JSON.stringify(this.cart));
        window.dispatchEvent(new Event('cartUpdated'));
    },

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if(product) {
            this.cart.push(product);
            this.saveCart();
            alert('Товар добавлен в корзину!');
        }
    },

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.saveCart();
    },

    clearCart() {
        this.cart = [];
        this.saveCart();
    },

    login(email, password) {
        // Check for admin
        let role = 'user';
        if (email === 'admin' && password === '2580') {
            role = 'admin';
        }
        this.user = { email, name: email.split('@')[0], role };
        localStorage.setItem('portus_user', JSON.stringify(this.user));
    },

    addProduct(productObj) {
        productObj.id = Date.now();
        this.products.unshift(productObj);
        // Normally we would save this to DB/LocalStorage, but for this mock we just append to running array
        // Since products is hardcoded initially, to persist it we would need to merge localStorage with hardcoded
        // But for demonstration, we will just keep it in memory
        alert('Товар успешно добавлен!');
    },

    logout() {
        this.user = null;
        localStorage.removeItem('portus_user');
    },

    addOrder(total) {
        const order = { id: Date.now(), total, items: [...this.cart], status: 'В обработке', date: new Date().toLocaleDateString() };
        this.orders.push(order);
        localStorage.setItem('portus_orders', JSON.stringify(this.orders));
        this.clearCart();
    }
};
