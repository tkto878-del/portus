const app = {
    contentDiv: document.getElementById('app-content'),
    heroSlideIndex: 0,
    heroSliderInterval: null,

    init() {
        this.updateCartBadge();
        window.addEventListener('cartUpdated', () => this.updateCartBadge());
        
        // Handle basic routing via history state or just simple hash
        window.addEventListener('hashchange', () => this.router());
        
        // Default to home if no hash
        if(!window.location.hash) {
            window.location.hash = '#home';
        } else {
            this.router();
        }
    },

    toggleMenu() {
        const menu = document.getElementById('side-menu');
        const overlay = document.getElementById('side-menu-overlay');
        menu.classList.toggle('open');
        overlay.classList.toggle('open');
    },

    updateCartBadge() {
        const badge = document.getElementById('basket-count');
        badge.innerText = Store.cart.length;
    },

    navigate(path) {
        window.location.hash = '#' + path;
    },

    openCategory(cat) {
        window.location.hash = '#catalog?cat=' + encodeURIComponent(cat);
    },

    router() {
        const hash = window.location.hash.substring(1);
        this.contentDiv.innerHTML = ''; // clear
        clearInterval(this.heroSliderInterval); // Clear slider if leaving home

        if(hash.startsWith('catalog')) {
            const params = new URLSearchParams(hash.split('?')[1]);
            this.renderCatalog(params.get('cat') || 'Входные');
        } else if (hash === 'cart') {
            this.renderCart();
        } else if (hash === 'profile') {
            this.renderProfile();
        } else if (hash === 'admin' && Store.user?.role === 'admin') {
            this.renderAdminDashboard();
        } else if (hash === 'admin-form' && Store.user?.role === 'admin') {
            this.renderAdminForm();
        } else {
            this.renderHome();
        }
    },

    // SLIDER LOGIC
    cycleHeroSlide(offset) {
        this.heroSlideIndex += offset;
        if(this.heroSlideIndex >= Store.heroImages.length) this.heroSlideIndex = 0;
        if(this.heroSlideIndex < 0) this.heroSlideIndex = Store.heroImages.length - 1;
        this.updateHeroSlideDOM();
        this.resetHeroTimer();
    },

    setHeroSlide(idx) {
        this.heroSlideIndex = idx;
        this.updateHeroSlideDOM();
        this.resetHeroTimer();
    },

    updateHeroSlideDOM() {
        const imgEl = document.getElementById('hero-img-element');
        const dotsBox = document.getElementById('hero-dots-container');
        if(imgEl && dotsBox) {
            imgEl.src = Store.heroImages[this.heroSlideIndex];
            dotsBox.innerHTML = Store.heroImages.map((_, i) => 
                `<span class="${i === this.heroSlideIndex ? 'active' : ''}" onclick="app.setHeroSlide(${i})"></span>`
            ).join('');
        }
    },

    resetHeroTimer() {
        clearInterval(this.heroSliderInterval);
        this.heroSliderInterval = setInterval(() => {
            this.cycleHeroSlide(1);
        }, 20000); // 20 seconds loop
    },

    renderHome() {
        const categoriesHtml = Store.categories.map(c => `
            <div class="cat-item" onclick="app.openCategory('${c.name.split(' ')[0]}')">
                <img src="${c.img}" alt="${c.name}">
                <span>${c.name}</span>
            </div>
        `).join('');

        this.contentDiv.innerHTML = `
            <div class="view active container">
                <div class="hero-section">
                    <div class="hero-image">
                        <img id="hero-img-element" src="${Store.heroImages[0]}" alt="Workshop" style="transition: opacity 0.5s;">
                        <div class="hero-slider-btn left" onclick="app.cycleHeroSlide(-1)">‹</div>
                        <div class="hero-slider-btn right" onclick="app.cycleHeroSlide(1)">›</div>
                        <div class="hero-dots" id="hero-dots-container"></div>
                    </div>
                    <div class="hero-content">
                        <h3>Изготовление, продажа и установка дверей</h3>
                        <h1>Ремесленная мануфактура<br>и качественные материалы</h1>
                        <a href="#" class="hero-link">portus-dveri.ru</a>
                        <ul class="hero-list">
                            <li>- Подберем двери в размеры, фурнитуру, панели</li>
                            <li>- Окрас на выбор</li>
                            <li>- Стандартные и скрытые межкомнатные двери</li>
                            <li>- Входные металлические, противопожарные коммерческие</li>
                            <li>- Тепло и звукоизоляция, отличные замки</li>
                        </ul>
                    </div>
                </div>

                <div class="categories-preview">${categoriesHtml}</div>
            </div>
        `;
        
        this.updateHeroSlideDOM();
        this.resetHeroTimer();
    },

    renderCatalog(category) {
        let products = Store.products;
        if(category && category !== 'Все' && category !== 'null') {
             products = products.filter(p => p.category.includes(category) || category.includes(p.category));
        }

        const gridHtml = products.length === 0 
            ? '<p>В этой категории пока нет товаров.</p>'
            : products.map(p => `
            <div class="product-card">
                <img class="product-card-img" src="${p.img}" alt="${p.title}" onclick="app.navigate('product?id=${p.id}')">
                <div class="product-title">${p.title}</div>
                <div class="product-price">${p.price} ₽</div>
                <div class="product-desc">${p.desc}</div>
                <button class="btn-basket" onclick="Store.addToCart(${p.id})">В корзину</button>
            </div>
        `).join('');

        this.contentDiv.innerHTML = `
            <div class="view active container">
                <div class="catalog-header">
                    <h2>Каталог ${category !== 'Все' && category !== 'null' ? '- ' + category : ''}</h2>
                </div>
                
                <div class="catalog-layout">
                    <div class="catalog-grid-area">
                        <div class="catalog-toolbar">
                            <div class="filter-search">
                                <input type="text" placeholder="Товар или услуга" onkeyup="app.filterGridList(this.value)">
                            </div>
                            <div class="sort-options">
                                <span class="active">▶ ПО ЦЕНЕ</span>
                                <span>▶ ПО НАЗВАНИЮ</span>
                            </div>
                        </div>

                        <div class="product-grid" id="productGridContainer">
                            ${gridHtml}
                        </div>
                    </div>
                    
                    <aside class="sidebar">
                        <h3>Фильтры</h3>
                        
                        <div class="filter-group">
                            <div class="filter-group-title">Цена</div>
                            <div class="price-inputs">
                                <input type="number" placeholder="От">
                                <input type="number" placeholder="До">
                            </div>
                        </div>

                        <ul class="filter-list">
                            <li>Цвет</li>
                            <li>Остекление</li>
                            <li>Новинка</li>
                            <li>Стиль коллекции</li>
                            <li>Хит продаж</li>
                            <li>Материал кромки</li>
                            <li>Цвет кромки</li>
                            <li>Тип покрытия</li>
                            <li>Коллекция</li>
                            <li>Тип остекления</li>
                            <li>Высота</li>
                            <li>Ширина</li>
                            <li>Тип помещения</li>
                            <li>Замок входит в комплект</li>
                        </ul>
                    </aside>
                </div>
            </div>
        `;
    },

    filterGridList(query) {
        query = query.toLowerCase();
        const cards = document.querySelectorAll('.product-card');
        cards.forEach(card => {
            const title = card.querySelector('.product-title').innerText.toLowerCase();
            card.style.display = title.includes(query) ? 'flex' : 'none';
        });
    },

    renderCart() {
        let itemsHtml = '';
        let total = 0;

        if(Store.cart.length === 0) {
            itemsHtml = '<p>Ваша корзина пуста</p>';
        } else {
            Store.cart.forEach((item, idx) => {
                total += item.price;
                itemsHtml += `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <img src="${item.img}" class="cart-item-img">
                            <div class="cart-item-details">
                                <strong>${item.title}</strong>
                                <span>Артикул: ${item.id}</span>
                            </div>
                        </div>
                        <div class="cart-item-price">${item.price} Р</div>
                        <div class="cart-item-remove" onclick="app.removeCartItem(${idx})">Удалить</div>
                    </div>
                `;
            });
        }

        this.contentDiv.innerHTML = `
            <div class="view active container">
                <h2>Ваша корзина</h2>
                <div style="max-width: 800px; margin: 0 auto;">
                    ${itemsHtml}
                    ${total > 0 ? `<div class="cart-total">Итого: ${total} Р</div>
                    <button class="btn-primary" onclick="app.checkout()">Оформить заказ</button>` : ''}
                </div>
            </div>
        `;
    },

    removeCartItem(idx) {
        Store.removeFromCart(idx);
        this.renderCart();
    },

    checkout() {
        if(!Store.user) {
            alert('Пожалуйста, войдите в личный кабинет для оформления заказа.');
            this.navigate('profile');
            return;
        }
        
        let total = Store.cart.reduce((sum, item) => sum + item.price, 0);
        Store.addOrder(total);
        alert('Заказ успешно оформлен! Вы можете отследить его в личном кабинете.');
        this.navigate('profile');
    },

    renderProfile() {
        if(Store.user) {
            if(Store.user.role === 'admin') {
                this.navigate('admin');
                return;
            }

            const ordersHtml = Store.orders.length === 0 
                ? '<p>У вас еще нет заказов.</p>' 
                : Store.orders.map(o => `
                    <div style="border:1px solid #ddd; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                        <strong>Заказ #${o.id} от ${o.date}</strong><br>
                        Статус: ${o.status}<br>
                        Товаров: ${o.items.length}<br>
                        Сумма: ${o.total} Р
                    </div>
                `).join('');

            this.contentDiv.innerHTML = `
                <div class="view active container form-container">
                    <h2>Личный кабинет</h2>
                    <p style="margin-bottom: 20px;">Добро пожаловать, <strong>${Store.user.name}</strong>!</p>
                    
                    <h3>История моих заказов (что я хочу заказать)</h3>
                    <div style="margin-bottom: 30px; margin-top: 20px;">
                        ${ordersHtml}
                    </div>

                    <button class="btn-primary" style="background:#d32f2f" onclick="app.doLogout()">Выйти</button>
                </div>
            `;
        } else {
            this.contentDiv.innerHTML = `
                <div class="view active container form-container">
                    <h2>Вход в кабинет</h2>
                    <div class="form-group">
                        <label>Email / Логин</label>
                        <input type="text" id="auth-email" placeholder="example@mail.ru или admin">
                    </div>
                    <div class="form-group">
                        <label>Пароль</label>
                        <input type="password" id="auth-pass" placeholder="******">
                    </div>
                    <button class="btn-primary" onclick="app.doLogin()">Войти / Зарегистрироваться</button>
                </div>
            `;
        }
    },

    renderAdminDashboard() {
        const prodHtml = Store.products.map(p => `
            <div class="admin-product-row">
                <div style="display:flex; align-items:center; gap:15px;">
                    <img src="${p.img}" style="width:40px; height:40px; object-fit:cover; border-radius:5px;">
                    <div>
                        <strong>${p.title}</strong>
                        <div style="font-size:12px; color:#777;">Цена: ${p.price} Р | Категория: ${p.category}</div>
                    </div>
                </div>
                <div>
                   <button class="admin-btn" style="background:#555; padding:5px 15px;" onclick="alert('Редактирование пока находится в разработке!')">Ред.</button>
                </div>
            </div>
        `).join('');

        this.contentDiv.innerHTML = `
            <div class="view active container">
                <div class="admin-layout">
                    <div class="admin-sidebar">
                        <div class="admin-card">
                            <h3 style="margin-bottom:20px;">Админ Панель</h3>
                            <ul class="side-menu-links">
                                <li><a href="javascript:void(0)" style="color:#f57c00">Товары</a></li>
                                <li><a href="javascript:void(0)" onclick="app.doLogout()">Выйти</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="admin-content">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                            <h2>Список товаров</h2>
                            <button class="admin-btn" onclick="app.navigate('admin-form')">+ Добавить товар</button>
                        </div>
                        <div class="admin-product-list">
                            ${prodHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderAdminForm() {
        this.contentDiv.innerHTML = `
            <div class="view active container">
                <button onclick="app.navigate('admin')" style="background:none; border:none; color:#555; display:flex; align-items:center; gap:5px; margin-bottom:20px; cursor:pointer;" class="hero-link">‹ Вернуться к списку</button>
                <div class="admin-layout">
                    
                    <div class="admin-content" style="flex:2;">
                        <h2 style="margin-bottom:20px;">О товаре</h2>
                        <div class="admin-card">
                            <div class="admin-input-group">
                                <label>Название товара</label>
                                <input type="text" id="add-title" placeholder="Введите название">
                            </div>
                            <div style="display:flex; gap:15px;">
                                <div class="admin-input-group" style="flex:1;">
                                    <label>Основная цена (Р)</label>
                                    <input type="number" id="add-price" placeholder="1000">
                                </div>
                                <div class="admin-input-group" style="flex:1;">
                                    <label>Старая цена (Р)</label>
                                    <input type="number" placeholder="Введите цену кросс-аут">
                                </div>
                            </div>
                            <div class="admin-input-group">
                                <label>Краткое описание</label>
                                <textarea id="add-desc" rows="3" placeholder="Самое важное о товаре..."></textarea>
                            </div>
                            <div class="admin-input-group">
                                <label>Артикул / Остаток</label>
                                <div style="display:flex; gap:15px;">
                                    <input type="text" placeholder="Артикул">
                                    <input type="text" placeholder="Не ограничен">
                                </div>
                            </div>
                        </div>

                        <h2 style="margin-bottom:20px; margin-top:40px;">Габариты</h2>
                        <div class="admin-card">
                            <div class="admin-input-group">
                                <input type="text" placeholder="Вес (кг)" style="margin-bottom:10px;">
                                <input type="text" placeholder="Высота (см)" style="margin-bottom:10px;">
                                <input type="text" placeholder="Ширина (см)" style="margin-bottom:10px;">
                                <input type="text" placeholder="Длина (см)">
                            </div>
                        </div>
                    </div>

                    <div class="admin-sidebar" style="flex:1;">
                        <div class="admin-card">
                            <div class="admin-card-title">Фотографии</div>
                            <p style="font-size:12px; color:#555; margin-bottom:15px;">Из-за того, что сайт работает офлайн, напрямую загрузить файл нельзя. Положите картинку и её варианты в папку <strong>assets</strong> и <strong>просто впишите её имя ниже</strong> (Например: assets/door-new.png):</p>
                            
                            <div class="admin-input-group">
                                <input type="text" id="add-img" value="assets/door-dummy.png">
                            </div>
                            <div class="admin-input-group">
                                <input type="text" placeholder="Имя картинки варианта 2 (опционально)">
                            </div>
                            <div class="admin-input-group">
                                <input type="text" placeholder="Имя картинки варианта 3 (опционально)">
                            </div>
                        </div>

                        <div class="admin-card">
                            <div class="admin-card-title">Категория товара</div>
                            <div class="admin-input-group">
                                <select id="add-cat">
                                    <option value="Входные">Входные</option>
                                    <option value="Межкомнатные">Межкомнатные</option>
                                    <option value="Скрытые">Скрытые</option>
                                    <option value="Пожарные/технические">Технические</option>
                                </select>
                            </div>
                        </div>

                        <button class="admin-btn" style="width:100%; font-size:16px;" onclick="app.processAddProduct()">Сохранить товар</button>
                    </div>

                </div>
            </div>
        `;
    },

    processAddProduct() {
        const title = document.getElementById('add-title').value;
        const price = parseInt(document.getElementById('add-price').value) || 0;
        const desc = document.getElementById('add-desc').value;
        const img = document.getElementById('add-img').value;
        const cat = document.getElementById('add-cat').value;

        if(!title) {
            alert('Пожалуйста, введите название товара.'); return;
        }

        Store.addProduct({ title, price, desc, img, category: cat });
        this.navigate('admin');
    },

    doLogin() {
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-pass').value;
        if(email && pass) {
            Store.login(email, pass);
            this.router();
        } else {
            alert('Пожалуйста, заполните логин и пароль');
        }
    },

    doLogout() {
        Store.logout();
        this.navigate('profile');
    }
};

window.onload = () => {
    app.init();
};
