const app = {
    contentDiv: document.getElementById('app-content'),
    heroSlideIndex: 0,
    heroSliderInterval: null,
    currentCategory: 'Все',
    sortBy: 'price',
    priceMin: '',
    priceMax: '',

    init() {
        this.updateCartBadge();
        window.addEventListener('cartUpdated', () => this.updateCartBadge());

        // Handle basic routing via history state or just simple hash
        window.addEventListener('hashchange', () => this.router());

        // Default to home if no hash
        if (!window.location.hash) {
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
        let totalQty = Store.cart.reduce((sum, item) => sum + (item.qty || 1), 0);
        badge.innerText = totalQty;
    },

    navigate(path) {
        window.location.hash = '#' + path;
    },

    openCategory(cat) {
        this.currentCategory = cat;
        if (window.location.hash === '#catalog') {
            this.renderCatalogInner();
        } else {
            window.location.hash = '#catalog';
        }
    },

    filterByCategory(cat) {
        this.currentCategory = cat;
        this.renderCatalogInner();
    },

    handleSearch(query) {
        query = query.toLowerCase().trim();
        const dropdown = document.getElementById('search-dropdown');
        if (!query) {
            dropdown.classList.remove('active');
            return;
        }

        let resultsHtml = '';
        const lowerQ = query;
        
        const staticPages = [
            { t: 'Политика конфиденциальности', h: 'privacy' },
            { t: 'Оферта', h: 'terms' },
            { t: 'Доставка и оплата', h: 'delivery' },
            { t: 'Контакты', h: 'contacts' },
            { t: 'Возврат и обмен', h: 'return' },
            { t: 'Двери на заказ', h: 'custom-door' },
            { t: 'ВКонтакте (VK)', link: 'https://vk.com/portus_dveri' },
            { t: 'Telegram', link: 'https://t.me/portus_dveri' },
            { t: 'Телефон: +7-995-592-66-70', link: 'tel:+79955926670' },
            { t: 'Почта', link: 'mailto:goldmoskva@yandex.ru' }
        ];

        staticPages.forEach(p => {
            if (p.t.toLowerCase().includes(lowerQ)) {
                if (p.h) {
                    resultsHtml += `<a class="search-item" href="javascript:void(0)" onclick="app.navigate('${p.h}'); document.getElementById('search-dropdown').classList.remove('active')"><span>Раздел сайта</span>${p.t}</a>`;
                } else {
                    resultsHtml += `<a class="search-item" href="${p.link}" target="_blank" onclick="document.getElementById('search-dropdown').classList.remove('active')"><span>Контакт</span>${p.t}</a>`;
                }
            }
        });

        Store.categories.forEach(c => {
            if (c.name.toLowerCase().includes(lowerQ)) {
                resultsHtml += `<a class="search-item" href="javascript:void(0)" onclick="app.openCategory('${c.name.split(' ')[0]}'); document.getElementById('search-dropdown').classList.remove('active')"><span>Категория</span>${c.name}</a>`;
            }
        });

        Store.products.forEach(p => {
            if (p.title.toLowerCase().includes(lowerQ) || p.category.toLowerCase().includes(lowerQ)) {
                resultsHtml += `<a class="search-item" href="javascript:void(0)" onclick="app.openCategory('${p.category}'); document.getElementById('search-dropdown').classList.remove('active')"><span>Товар (${p.price} ₽)</span>${p.title}</a>`;
            }
        });

        if (resultsHtml) {
            dropdown.innerHTML = resultsHtml;
            dropdown.classList.add('active');
        } else {
            dropdown.innerHTML = '<div style="padding:15px; color:#999; font-size:14px; text-align:center;">Ничего не найдено</div>';
            dropdown.classList.add('active');
        }
    },

    router() {
        const hash = window.location.hash.substring(1);
        this.contentDiv.innerHTML = ''; // clear
        clearInterval(this.heroSliderInterval); // Clear slider if leaving home
        document.getElementById('search-dropdown').classList.remove('active'); // Close search

        if (hash === 'catalog') {
            this.renderCatalogPage();
        } else if (hash === 'cart') {
            this.renderCart();
        } else if (hash === 'custom-door') {
            this.renderCustomDoor();
        } else if (hash === 'contacts') {
            this.renderContacts();
        } else if (hash === 'privacy') {
            this.renderPrivacy();
        } else if (hash === 'delivery') {
            this.renderDelivery();
        } else if (hash === 'return') {
            this.renderReturn();
        } else if (hash === 'terms') {
            this.renderTerms();
        } else if (hash === 'profile') {
            this.renderProfile();
        } else if (hash === 'admin' && Store.user?.role === 'admin') {
            this.renderAdminDashboard();
        } else if (hash === 'admin-orders' && Store.user?.role === 'admin') {
            this.renderAdminOrders();
        } else if (hash === 'admin-form' && Store.user?.role === 'admin') {
            this.renderAdminForm();
        } else if (hash === 'home' || hash === '') {
            this.currentCategory = 'Все';
            this.renderHome();
        } else {
            this.currentCategory = 'Все';
            this.renderHome();
        }
    },

    // SLIDER LOGIC
    cycleHeroSlide(offset) {
        this.heroSlideIndex += offset;
        if (this.heroSlideIndex >= Store.heroImages.length) this.heroSlideIndex = 0;
        if (this.heroSlideIndex < 0) this.heroSlideIndex = Store.heroImages.length - 1;
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
        if (imgEl && dotsBox) {
            imgEl.src = Store.heroImages[this.heroSlideIndex];
            dotsBox.innerHTML = Store.heroImages.map((_, i) =>
                `<span class="${i === this.heroSlideIndex ? 'active' : ''}" onclick="app.setHeroSlide(${i})"></span>`
            ).join('');
        }
    },

    resetHeroTimer() {
        clearInterval(this.heroSliderInterval);
        
        const bar = document.getElementById('hero-bar');
        if (bar) {
            bar.style.transition = 'none';
            bar.style.width = '0%';
            // Форсируем перерисовку стилей перед новой анимацией
            void bar.offsetWidth;
            
            bar.style.transition = 'width 20s linear';
            bar.style.width = '100%';
        }

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
                        <div style="position:relative; border-radius: 30px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                            <img id="hero-img-element" src="${Store.heroImages[0]}" alt="Workshop" style="transition: opacity 0.5s; border-radius: 0; box-shadow: none; display: block; width: 100%;">
                            <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 6px; background: rgba(0,0,0,0.3);">
                                <div id="hero-bar" style="height: 100%; width: 0%; background: #fbc02d; transition: none;"></div>
                            </div>
                        </div>
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
                
                <div id="general-catalog-anchor" style="padding-top:20px;"></div>
                <div id="home-catalog-container"></div>
            </div>
        `;

        this.updateHeroSlideDOM();
        this.resetHeroTimer();
        this.renderCatalogInner();
    },

    setSort(type) {
        this.sortBy = type;
        this.renderCatalogInner();
    },

    applyFilters() {
        this.priceMin = document.getElementById('filter-price-min')?.value || '';
        this.priceMax = document.getElementById('filter-price-max')?.value || '';
        this.filterLock = document.getElementById('filter-lock')?.checked || false;
        this.renderCatalogInner();
    },

    renderCatalogPage() {
        this.contentDiv.innerHTML = `
            <div class="view active container" style="margin-bottom: 50px;">
                <div id="home-catalog-container"></div>
            </div>
        `;
        this.renderCatalogInner();
    },

    renderCatalogInner() {
        const catContainer = document.getElementById('home-catalog-container');
        if (!catContainer) return; // Only runs if container exists

        let products = Store.products;
        
        // Filter by category
        if (this.currentCategory && this.currentCategory !== 'Все' && this.currentCategory !== 'null') {
            products = products.filter(p => p.category.includes(this.currentCategory) || this.currentCategory.includes(p.category));
        }

        // Filter by Price
        if (this.priceMin) products = products.filter(p => p.price >= parseInt(this.priceMin));
        if (this.priceMax) products = products.filter(p => p.price <= parseInt(this.priceMax));

        // Mock lock filter for dummy data (assuming some descriptions have "защелку" or we strictly match)
        if (this.filterLock) {
            products = products.filter(p => p.desc.toLowerCase().includes('защелк') || p.desc.toLowerCase().includes('замок'));
        }

        // Sort
        if (this.sortBy === 'price') {
            products = products.sort((a,b) => a.price - b.price);
        } else if (this.sortBy === 'name') {
            products = products.sort((a,b) => a.title.localeCompare(b.title));
        }

        const gridHtml = products.length === 0
            ? '<p>В этой категории пока нет товаров по заданным фильтрам.</p>'
            : products.map(p => `
            <div class="product-card">
                <img class="product-card-img" src="${p.img}" alt="${p.title}" onclick="alert('В разработке!')">
                <div class="product-title">${p.title}</div>
                <div class="product-price">${p.price} ₽</div>
                <div class="product-desc">${p.desc}</div>
                <button class="btn-basket" onclick="Store.addToCart(${p.id})">В корзину</button>
            </div>
        `).join('');

        const sortPriceCls = this.sortBy === 'price' ? 'active' : '';
        const sortNameCls = this.sortBy === 'name' ? 'active' : '';

        catContainer.innerHTML = `
            <div class="catalog-header">
                <h2>Каталог ${this.currentCategory !== 'Все' && this.currentCategory !== 'null' ? '- ' + this.currentCategory : ''}</h2>
            </div>
            
            <div class="catalog-layout">
                <div class="catalog-grid-area">
                    <div class="catalog-toolbar">
                        <div class="filter-search">
                            <input type="text" placeholder="Товар или услуга (локальный поиск)" onkeyup="app.filterGridList(this.value)">
                        </div>
                        <div class="sort-options">
                            <span class="${sortPriceCls}" onclick="app.setSort('price')" style="cursor:pointer;">▶ ПО ЦЕНЕ</span>
                            <span class="${sortNameCls}" onclick="app.setSort('name')" style="cursor:pointer; margin-left:15px;">▶ ПО НАЗВАНИЮ</span>
                        </div>
                    </div>

                    <div class="product-grid" id="productGridContainer">
                        ${gridHtml}
                    </div>
                </div>
                
                <aside class="sidebar">
                    <h3>Фильтры</h3>
                    
                    <div class="filter-group">
                        <div class="filter-group-title" style="margin-bottom:10px;">Цена</div>
                        <div class="price-inputs">
                            <input type="number" id="filter-price-min" value="${this.priceMin}" placeholder="От" onchange="app.applyFilters()">
                            <input type="number" id="filter-price-max" value="${this.priceMax}" placeholder="До" onchange="app.applyFilters()">
                        </div>
                    </div>

                    <div class="filter-group" style="margin-top:20px;">
                        <div class="filter-group-title" style="margin-bottom:10px;">Категории</div>
                        <div style="display:flex; flex-direction:column; gap:8px; font-size:14px; color:#555;">
                            <label style="cursor:pointer; display:flex; align-items:center;">
                                <input type="radio" name="catFilter" ${(!this.currentCategory || this.currentCategory === 'Все') ? 'checked' : ''} onchange="app.filterByCategory('Все')">
                                <span style="margin-left:8px;">Все категории</span>
                            </label>
                            <label style="cursor:pointer; display:flex; align-items:center;">
                                <input type="radio" name="catFilter" ${(this.currentCategory === 'Входные') ? 'checked' : ''} onchange="app.filterByCategory('Входные')">
                                <span style="margin-left:8px;">Входные</span>
                            </label>
                            <label style="cursor:pointer; display:flex; align-items:center;">
                                <input type="radio" name="catFilter" ${(this.currentCategory === 'Межкомнатные') ? 'checked' : ''} onchange="app.filterByCategory('Межкомнатные')">
                                <span style="margin-left:8px;">Межкомнатные</span>
                            </label>
                            <label style="cursor:pointer; display:flex; align-items:center;">
                                <input type="radio" name="catFilter" ${(this.currentCategory === 'Скрытые') ? 'checked' : ''} onchange="app.filterByCategory('Скрытые')">
                                <span style="margin-left:8px;">Скрытые</span>
                            </label>
                            <label style="cursor:pointer; display:flex; align-items:center;">
                                <input type="radio" name="catFilter" ${(this.currentCategory === 'Панели') ? 'checked' : ''} onchange="app.filterByCategory('Панели')">
                                <span style="margin-left:8px;">Панели и накладки</span>
                            </label>
                            <label style="cursor:pointer; display:flex; align-items:center;">
                                <input type="radio" name="catFilter" ${(this.currentCategory === 'Мануфактура') ? 'checked' : ''} onchange="app.filterByCategory('Мануфактура')">
                                <span style="margin-left:8px;">Мануфактура акрила</span>
                            </label>
                        </div>
                    </div>

                    <label style="display:flex; align-items:center; cursor:pointer; font-size:14px; color:#555;">
                        <input type="checkbox" id="filter-lock" ${this.filterLock ? 'checked' : ''} onchange="app.applyFilters()" style="margin-right:10px;">
                        <span>Замок входит в комплект</span>
                    </label>
                </aside>
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

    renderContacts() {
        this.contentDiv.innerHTML = `
            <div class="view active container" style="margin-bottom: 50px;">
                <h1 style="margin-bottom: 40px; font-size: 32px; font-weight: 400; padding-top: 20px;">Контакты</h1>
                
                <div style="display: flex; gap: 40px; flex-wrap: wrap; margin-bottom: 60px;">
                    <div style="flex: 1; min-width: 300px;">
                        <h3 style="font-size: 20px; font-weight: 400; margin-bottom: 15px;">Для связи:</h3>
                        <p style="color: #666; margin-bottom: 15px; font-size: 14px;">e-mail: <a href="mailto:goldmoskva@yandex.ru" style="color: #666; text-decoration: none;">goldmoskva@yandex.ru</a></p>
                        <p style="color: #666; margin-bottom: 15px; font-size: 14px;">Telegram: <a href="https://t.me/portusgid" target="_blank" style="color: #4B7BEC; text-decoration: underline;">ПОРТУС-ДВЕРИ</a></p>
                        <p style="color: #666; font-size: 14px; margin-bottom: 30px;">Тел: +7-995-592-66-70</p>

                        <h3 style="font-size: 20px; font-weight: 400; margin-bottom: 15px;">Время работы</h3>
                        <p style="color: #666; margin-bottom: 5px; font-size: 14px;">Пн—пт: 10:00—20:00</p>
                        <p style="color: #666; margin-bottom: 5px; font-size: 14px;">Сб: 10:00—18:00</p>
                        <p style="color: #666; font-size: 14px; margin-bottom: 30px;">Вс: выходной</p>

                        <h3 style="font-size: 20px; font-weight: 400; margin-bottom: 15px;">Адрес</h3>
                        <p style="color: #666; line-height: 1.5; font-size: 14px;">Ленинградская область, Гатчинский муниципальный округ, деревня Старицы, 26</p>
                    </div>

                    <div style="flex: 1.5; min-width: 300px;">
                        <div style="border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                           <iframe src="https://yandex.ru/map-widget/v1/?um=constructor%3A7a19bb6df8d0eb5f4ccce06ce06497330dbf22c60c1d2ebed8cf1f1ab405a306&amp;source=constructor" width="100%" height="400" frameborder="0"></iframe>
                        </div>
                    </div>
                </div>

                <div style="max-width: 800px; margin-bottom: 80px;">
                    <h2 style="font-size: 32px; font-weight: 400; margin-bottom: 15px;">Оставьте заявку</h2>
                    <p style="color: #666; margin-bottom: 40px; font-size: 15px;">Менеджер свяжется с вами в течение 5 минут, ответит на вопросы и поможет оформить заказ</p>
                    
                    <div style="display: flex; flex-wrap: wrap; gap: 30px;">
                        <input type="text" id="req-name" placeholder="Имя" style="flex: 1; min-width: 250px; border: none; border-bottom: 1px solid #ccc; padding: 15px 0; outline: none; font-size: 14px;">
                        <input type="text" id="req-email" placeholder="Email *" style="flex: 1; min-width: 250px; border: none; border-bottom: 1px solid #ccc; padding: 15px 0; outline: none; font-size: 14px;">
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 30px; margin-top: 15px;">
                        <input type="text" id="req-phone" placeholder="Телефон" style="flex: 1; min-width: 250px; border: none; border-bottom: 1px solid #ccc; padding: 15px 0; outline: none; font-size: 14px;">
                        <input type="text" id="req-comment" placeholder="Комментарий" style="flex: 1; min-width: 250px; border: none; border-bottom: 1px solid #ccc; padding: 15px 0; outline: none; font-size: 14px;">
                    </div>

                    <div style="margin-top: 40px; display: flex; flex-direction: column; align-items: flex-start; gap: 20px;">
                        <button onclick="app.processContact()" style="background: #f8f9fa; color: #333; border: 1px solid #eee; padding: 15px 30px; border-radius: 25px; cursor: pointer; font-size: 14px; font-weight: bold;">Отправить</button>
                        
                        <label style="display:flex; align-items:center; gap:10px; font-size: 12px; color: #777; cursor:pointer;">
                            <input type="checkbox" id="req-check" style="width:16px; height:16px;">
                            <span>Нажимая на кнопку, вы даете согласие на обработку своих персональных данных и соглашаетесь <a href="javascript:void(0)" onclick="app.navigate('privacy')" style="color:#777; text-decoration: underline;">с политикой конфиденциальности</a>.</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    },

    processContact() {
        const name = document.getElementById('req-name').value;
        const email = document.getElementById('req-email').value;
        const phone = document.getElementById('req-phone').value;
        const comment = document.getElementById('req-comment').value;
        const agree = document.getElementById('req-check').checked;

        if (!email) { alert('Пожалуйста, введите Email'); return; }
        if (!agree) { alert('Пожалуйста, согласитесь с политикой конфиденциальности'); return; }

        Store.submitRequest(name, email, phone, comment);

        document.getElementById('req-name').value = '';
        document.getElementById('req-email').value = '';
        document.getElementById('req-phone').value = '';
        document.getElementById('req-comment').value = '';
        document.getElementById('req-check').checked = false;
    },

    renderPrivacy() {
        this.contentDiv.innerHTML = `
            <div class="view active container" style="margin-bottom: 50px; line-height: 1.6;">
                <h1 style="margin-bottom: 30px; font-weight:400; padding-top:20px;">Политика конфиденциальности</h1>
                <p style="margin-bottom: 15px;">Я даю согласие интернет-магазину portus-dveri.ru, и ИП Головнёв Д. И. (далее — Компания) на обработку всех моих персональных данных, указанных мной при оформлении заказа, любыми способами, в том числе третьими лицами, в том числе воспроизведение, электронное копирование, обезличивание, блокирование, уничтожение, а также вышеуказанную обработку иных моих персональных данных, полученных в результате их обработки, в любых целях, прямо или косвенно связанных с предложением иных продуктов Компании, и направления мне информации о новых продуктах и услугах Компании и/или ее контрагентов.</p>
                <p style="margin-bottom: 15px;">Указанное согласие дано на срок 5 лет, а в случае его отзыва обработка моих персональных данных должна быть прекращена Компанией и/или третьими лицами и данные уничтожены при условии расторжения Договора, но в любом случае не позднее 1 (одного) года с даты прекращения действия Договора.</p>
                <p>Я даю согласие на получение мной рекламы, рассылки, в том числе по сети подвижной радиотелефонной связи, от Компании, ее контрагентов и аффилированных лиц.</p>
            </div>
        `;
    },

    renderDelivery() {
        this.contentDiv.innerHTML = `
            <div class="view active container" style="margin-bottom: 50px; line-height: 1.6;">
                <h1 style="margin-bottom: 30px; font-weight:400; padding-top:20px;">Доставка и оплата</h1>
                
                <h3 style="margin-top: 30px; margin-bottom:15px; font-weight:500;">Доставка</h3>
                <p>Когда оформите заказ, наш менеджер свяжется с вами и сообщит стоимость, а также уточнит детали доставки.</p>
                <p>Доставка по Санкт-Петербургу в пределах КАД - 2500 руб., далее 65 руб. за километр. До двери</p>
                <ol style="margin-top: 15px; margin-left: 20px; display:flex; flex-direction:column; gap:10px;">
                    <li>Сроки доставки согласуются Покупателем с менеджером после оформления и оплаты заказа, в случае оплаты при получении после согласования даты доставки с менеджером. Ожидаемое время доставки Покупатель может уточнить у менеджера. Ожидаемое время доставки может быть откорректировано, о чем менеджер сообщает Покупателю.</li>
                    <li>Территория доставки товаров, представленных на сайте и реализуемых Продавцом, ограничена регионами, указанными на сайте.</li>
                    <li>При доставке заказ вручается Покупателю либо третьему лицу, указанному Покупателем в качестве получателя при оформлении заказа.</li>
                    <li>Покупатель осведомлен и соглашается с тем, что доставка товара является отдельной услугой, не являющейся неотъемлемой частью оформленного заказа, выполнение которой может быть возложено Продавцом на третьих лиц.</li>
                    <li>Стоимость доставки не включается в стоимость товара и оплачивается отдельно. Стоимость доставки, является приблизительной, уточняется у менеджера, при публикации на сайте носит исключительно справочный характер и может быть откорректирована при оформлении заказа, поскольку стоимость доставки каждого заказа рассчитывается индивидуально, исходя из сведений о количестве товара, региона/района и способа доставки.</li>
                    <li>Стоимость доставки указывается Продавцом на последнем этапе оформления заказа. О способах и порядке оплаты услуги по осуществлению доставки менеджер заблаговременно уведомляет Покупателя.</li>
                    <li>В стоимость доставки не включается подъем товара на этаж и занос товара в здание / помещение. Доставка товара осуществляется до подъезда / входа в здание / помещение соответственно.</li>
                    <li>Обязанность Продавца передать товар считается исполненной в момент его передачи Покупателю или получателю, указанному Покупателем. Разгрузочные работы осуществляются силами Продавца, если сторонами дополнительно не согласовано иное. С момента передачи товара риск случайной гибели или случайного повреждения товара переходит к Покупателю.</li>
                    <li>Если в согласованный день и/или время доставки товара Покупатель отсутствовал по адресу, указанному при оформлении заказа, повторная доставка является платной. Кроме того, Покупатель оплачивает стоимость простоя автомашины Продавца более 30 (тридцати) минут, возникшего по вине Покупателя, исходя из следующей ставки: 500 (пятьсот) рублей за час ожидания.</li>
                </ol>

                <h3 style="margin-top: 30px; margin-bottom:15px; font-weight:500;">Оплата</h3>
                <ol style="margin-top: 15px; margin-left: 20px; display:flex; flex-direction:column; gap:10px;">
                    <li>Цена товара указывается на сайте. В случае указания неверной/неактуальной цены заказанного Покупателем товара, Продавец информирует об этом Покупателя после получения заказа для подтверждения заказа по измененной цене либо аннулирования заказа. В случае невозможности связаться с Покупателем заказ считается аннулированным в течение 5 (пяти) календарных дней с момента его оформления.</li>
                    <li>Цена товара на сайте на любые позиции товара может быть изменена Продавцом в одностороннем порядке. При этом цена на заказанный Покупателем и подтвержденный менеджером товар изменению не подлежит.</li>
                    <li>Продавец вправе предоставлять скидки на товары и устанавливать программу бонусов. Виды скидок, бонусов, порядок и условия начисления определяются Продавцом самостоятельно, указываются на сайте и могут быть изменены Продавцом в одностороннем порядке.</li>
                    <li>Полная стоимость заказа состоит из стоимости товара и стоимости доставки, по договоренности могут быть оказаны дополнительные услуги.</li>
                    <li>Оплата заказа осуществляется одним из следующих способов, выбор которого осуществляется Покупателем при оформлении заказа: (1) безналичный платеж после оформления заказа либо (2) иной способ оплаты (наличный платеж, банковская карта Visa / Mastercard, / МИР, безналичный платеж) после согласования заказа с менеджером.</li>
                    <li>Оплата товара, изготавливаемого «под заказ», осуществляется Покупателем в следующем порядке: на условиях 100% предоплаты, если сторонами не согласовано иное. Такой заказ принимается в работу (к исполнению) только после поступления денежных средств Покупателя на расчетный счет Продавца.</li>
                    <li>Окончательная сумма заказа согласовывается с продавцом, при необходимости составляется коммерческое предложение, и только после производится оплата.</li>
                </ol>
            </div>
        `;
    },

    renderReturn() {
        this.contentDiv.innerHTML = `
            <div class="view active container" style="margin-bottom: 50px; line-height: 1.6;">
                <h1 style="margin-bottom: 30px; font-weight:400; padding-top:20px;">Возврат и обмен товара</h1>
                <div style="background: #f8f9fa; padding: 30px; border-radius: 15px;">
                    <p style="color: #333; font-style: normal; white-space: pre-wrap; font-size: 15px; font-family: sans-serif;">
Возврат и обмен товара
Товар надлежащего качества:
1. В соответствии со статьей 502 ГК РФ и статьей 25 Закона РФ от 07.02.1992 № 2300-1 «О защите прав потребителей» требование покупателя об обмене товара надлежащего качества подлежит удовлетворению, если товар не был в употреблении, сохранены его потребительские свойства, пломбы, фабричные ярлыки и имеются доказательства приобретенного его у данного продавца (товарный или кассовый чек, иной документ, подтверждающий оплату товара). Если товар не соответствует данным требованиям Закона РФ «О защите прав потребителей», то он не подлежит обмену как товар надлежащего качества.
Покупатель имеет право на обмен товара надлежащего качества в течение 14 (четырнадцати) календарных дней, не считая дня покупки.
Замена товара осуществляется в течение 1 (одной) недели, если товар есть в наличии и в течение 3-х недель, если товара в наличии нет.
2. Покупатель вправе отказаться (вернуть) товар в течение 7 (семи) календарных дней с момента получения товара, если сохранен товарный вид и потребительские свойства товара, а также документ, подтверждающий факт и условия покупки указанного товара у Продавца.
3. Обмену и возврату не подлежит: (1) товар надлежащего качества, имеющий индивидуально определенные свойства (товар, изготовленный «под заказ»), а также (2) товар, подверженный изменению силами Покупателя (например, врезанная фурнитура, самовольное изменение размеров и проч.).
4. Возврат товара осуществляется на основании письменного заявления Покупателя, которое составляется в свободной форме с указанием актуальных контактных данных Покупателя, наименования и количества товара, а также причин возврата, силами Продавца за счет Покупателя.
5. Возврат товара производится в рабочие дни в офисе продаж Продавца. Срок осуществления возврата товара определяется по соглашению сторон, но не может составлять более 10 (десяти) календарных дней со дня получения соответствующего заявления.
6. При возврате товара составляется двусторонний акт о возврате товара, в котором указываются следующие сведения: полное фирменное наименование Продавца; фамилия, имя, отчество и паспортные данные Покупателя; наименование и количество товара; причина возврата товара; дата передачи товара; сумма, подлежащая возврату; подписи Продавца и Покупателя.
7. Возврат денежных средств, уплаченных Покупателем за товар, осуществляется на основании письменного заявления Покупателя, которое высылается по адресу электронной почты Продавца или передается представителю Продавца лично в руки. Продавец обязан возвратить денежную сумму, уплаченную Покупателем по договору, за исключением расходов Продавца на доставку от Покупателя возвращенного товара, не позднее чем через 10 (десять) календарных дней со дня получения соответствующего заявления.

Товар ненадлежащего качества:
1. В случае получения товара ненадлежащего качества Покупатель обязуется незамедлительно сообщить об этом Продавцу в письменном виде с приложением материалов фотофиксации и предоставлять товар Продавцу для проверки качества товара и составления соответствующего заключения.
2. Обмен или возврат товара ненадлежащего качества производится при соблюдении Покупателем следующих условий: (1) товар находится в том же виде и состоянии, в котором он был получен Покупателем, укомплектован всеми составными частями, (2) товар находится в упаковке, обеспечивающей его безопасную транспортировку, (3) на товаре и упаковке отсутствуют дополнительные повреждения (надписи, царапины и проч.), (4) Покупателем предоставлено заключение Продавца, подтверждающее наличие оснований для обмена или возврата товара, (5) Покупателем предоставлен документ, подтверждающий приобретение товара у Продавца.
3. Уплаченная Покупателем сумма за товар ненадлежащего качества, за исключением расходов Продавца на доставку (если стороны не договорятся об ином в день приемки заказа), подлежит возврату Покупателю в течение 10 (десяти) календарных дней с момента получения соответствующего письменного заявления Покупателя.</p>
                </div>
            </div>
        `;
    },

    renderTerms() {
        this.contentDiv.innerHTML = `
            <div class="view active container" style="margin-bottom: 50px; line-height: 1.6;">
                <h1 style="margin-bottom: 30px; font-weight:400; padding-top:20px;">Оферта / Пользовательское соглашение</h1>
                <div style="background: #f8f9fa; padding: 30px; border-radius: 15px;">
                    <p style="color: #333; font-style: normal; white-space: pre-wrap; font-size: 15px; font-family: sans-serif;">
                        <br>Оферта
Настоящая Оферта — адресованное неопределенному кругу лиц приглашение интернет-магазина portus-dveri.ru (ИП Головнев Д.И.), далее “Продавец”, сделать Заказ и заключить договор купли-продажи Товара в соответствии с п. 1 ст. 437 Гражданского кодекса Российской Федерации.
СОВЕРШАЯ ПОКУПКУ В ИНТЕРНЕТ-МАГАЗИНЕ https://www.portus-dveri.ru/ А ТАКЖЕ ПОДДОМЕНАХ ИНТЕРНЕТ МАГАЗИНА https://www.portus-dveri.ru/, ВЫ СОГЛАШАЕТЕСЬ СО ВСЕМИ НИЖЕПЕРЕПИСЛЕННЫМИ УСЛОВИЯМИ ДОГОВОРА-ОФЕРТЫ.
ПРОСИМ ВАС ВНИМАТЕЛЬНО ОЗНАКОМИТЬСЯ С ДОГОВОРОМ-ОФЕРТОЙ ПЕРЕД ОФОРМЛЕНИЕМ ЗАКАЗА.
1. Общие положения
1.     Настоящим интернет-магазин portus-dveri.ru (далее – «Продавец») публикует публичную оферту о продаже товаров дистанционным способом по образцам, представленным на официальном интернет-сайте Продавца https://www.portus-dveri.ru/
2.     Все предложения Продавца действительны исключительно на территории Российской Федерации и распространяется на те виды товара, которые представлены на сайте, пока такие предложения присутствуют в каталоге и после подтверждения продавцом по средствам связи (электронной почты, мессенджерах) и отправки ссылки на оплату товаров и/или услуг. Продавец сохраняет за собой право в одностороннем порядке вносить изменения в настоящую оферту с предварительной публикацией обновленной редакции оферты на официальном интернет-сайте https://www.portus-dveri.ru/ Новая редакция оферты вступает в силу с момента ее опубликования на сайте и применяется к заказам, сформированным после даты ее опубликования.
3.     Настоящий документ является офертой Продавца, составленной в соответствии со статьей 437 Гражданского Кодекса Российской Федерации (далее «ГК РФ»), и содержит все существенные условия договора купли-продажи товара. В случае принятия изложенных ниже условий физическое лицо, производящее акцепт этой оферты, осуществляет оплату товара Продавца в соответствии с условиями настоящего договора.
4.     В соответствии с пунктом 3 статьи 438 ГК РФ акцептом оферты и моментом заключения договора розничной купли-продажи товара является оформление Покупателем заказа товара на сайте https://www.portus-dveri.ru/ и его подтверждение менеджером (в случае оплаты заказа при получении) или оплата заказа согласно условиям настоящей оферты (в случае внесение предоплаты) в зависимости от того, какое из двух событий наступит ранее. Оформление заказа, оплата заказа Покупателем считается равносильным заключению договора на условиях, изложенных в оферте.
5.     В связи с вышеизложенным, просим внимательно ознакомиться с содержанием настоящей оферты. Если Вы не согласны с любым из ее условий, Продавец предлагает Вам отказаться от акцепта оферты и, следовательно, приобретения товара и (или) использования услуг, предоставляемых Продавцом.
Акцептуя настоящую оферту путем совершения действий, определенных в оферте, Продавец и Покупатель заключают договор на следующих условиях.
6.     Настоящие Условия применяются к приобретению товара в розничных интернет-магазинах Продавца, в том числе при оформлении заказа по телефону и/или посредством использования электронной почты, форм обратной связи, размещенных на сайте, с последующим личным обращением в розничный интернет-магазин Продавца.
2. Термины и определения
В настоящей оферте, если контекст не требует иного, нижеприведенные термины имеют следующие значения:
✔          Публичная оферта (Оферта) – публичное предложение Продавца, адресованное неопределенному кругу лиц, то есть любому физическому лицу (гражданину), заключить с Продавцом договор купли-продажи товара на условиях, содержащихся в настоящей оферте.
✔          Акцепт – полное и безоговорочное согласие и принятие Покупателем условий оферты путем оформления заказа товара на сайте Продавца или его оплаты согласно условиям оферты в зависимости от того, какое из двух событий произойдет ранее.
✔          Сайт – официальный интернет-сайт, принадлежащий Продавцу, расположенный в сети Интернет по адресу https://www.portus-dveri.ru/
✔          Продавец – юридическое лицо, указанное в п. 1 раздела 1 «Общие положения» настоящей оферты.
✔          Покупатель – физическое или юридическое лицо, разместившее заказ на сайте Продавца и заключившее с Продавцом Договор на условиях, содержащихся в оферте.
✔          Товар – ассортимент товара, представленный к продаже на сайте Продавца.
✔          Товар, изготавливаемый «под заказ» – (1) товар, отсутствующий на складе с пометкой “под заказ”; (2) товар, изготавливаемый по нестандартным параметрам и/или индивидуально-определенным характеристикам (в том числе размер, цветовая гамма и проч.), предназначенный для использования конкретным Покупателем.
✔          Заказ – надлежащим образом оформленная заявка Покупателя на приобретение и на доставку (при необходимости) отдельных позиций товара из ассортимента, представленного на сайте Продавца.
✔          Менеджер – сотрудник Продавца, предоставляющий Покупателю информационно-консультационные услуги, а также услуги по оформлению заказа товара.
✔          Доставка – процесс транспортировки товара из исходного местоположения в заранее определенный пункт назначения (до подъезда / входа в здание / помещение) силами Продавца и за счет Покупателя;
✔          День – все даты, определенные в Договоре в днях, считаются рабочими днями, если иное прямо не указано в тексте Договора.
✔          Заказ – форма документа, в котором сторонами согласуются размеры, материал, цвет, количество, иные характеристики и стоимость товара, а также дополнительные услуги, в случае заказа товара не в интернет-магазине. Подписание сторонами Заказа является подтверждением согласия Покупателя с условиями настоящей оферты.
✔          Коммерческое предложение – форма документа, в котором менеджер отражает все условия предварительного заказа Покупателя. Получение ответа Покупателя на коммерческое предложение является основанием для составления Заказа.
3. Предмет договора
1.     Продавец передает в собственность Покупателя товар в соответствии с условиями настоящей оферты, а Покупатель производит оплату и принимает товар в соответствии с условиями настоящей оферты. Окончательная цена обговаривается с менеджером и может незначительно отличаться от опубликованной цены на сайте https://www.portus-dveri.ru/
2.     Продавец гарантирует, что товар, представленный на сайте, по качеству соответствует ГОСТу 475-2016, ТУ 5361-002-74790213-2009, что подтверждается соответствующими документами.
4. Порядок оформления и отмены заказа
1.    Заказ товара осуществляется Покупателем самостоятельно через сайт Продавца и/или по телефону с последующим личным обращением, и/или посредством использования электронной почты, форм обратной связи, размещенных на сайте, с последующим личным обращением и/или при личном обращении в розничный интернет-магазин Продавца.
2.     Порядок заказа товара на сайте.
а.            После осуществления Покупателем выбора товара по фото-образцам и текстовой информации к товару (наименование, размерный ряд, цена, описание), он помещает товар в корзину, нажав кнопку «в корзину» на странице с описанием товара.
Для оформления заказа Покупатель переходит в раздел «корзина» (сделать это можно нажатием кнопки «Корзина», проверяет характеристики выбранного товара, количество товара, при необходимости вносит изменения, после чего переходит к оформлению заказа путем нажатия кнопки «оформить заказ».
б.            При оформлении заказа товара Покупатель обязуется предоставить следующую информацию: 
✔                    фамилия, имя, отчество (по-русски); 
✔                    контактный телефон;
✔                    адрес электронной почты (e-mail);
✔                    способ получения товара: доставка – адрес доставки;;
✔                    указание на необходимость монтажа и (или) замеров;
✔                    способ оплаты: наличный платеж, банковская карта Visa / Mastercard, безналичный платеж;
✔                    комментарии (при необходимости).
в.            После оформления заказа менеджер связывается с Покупателем по телефону или иными средствами связи для уточнения деталей заказа (условий доставки, монтажа и проч.) и подтверждения заказа.
г.            Покупатель соглашается и принимает комплектацию, количество, цвет и стоимость товара, указанные в заказе. После согласования заказа с Покупателем, Продавец не несет ответственности за комплектацию или не соответствие ожиданий Покупателя по цвету и структуре товара. Все рекомендации Продавца носят лишь консультативный характер и не обязывают Покупателя к определенному выбору.
д.            По заявке Покупателя Продавец может предоставить услугу осуществления замера дверных проемов и отдельных элементов, которая не включается в стоимость товара и оплачивается отдельно, в рамках проводимых акций услуга осуществления замера дверных проемов и отдельных элементов может быть оказана на безвозмездной основе.
Для оказания услуги Продавец вправе привлекать третьих лиц.
По окончании оказания услуги Покупателю передается один экземпляр бланка замера с указанием результатов, при осуществлении замеров на безвозмездной основе бланк замера с указанием результатов остается у Поставщика. Подписав указанный бланк, Покупатель соглашается с данными, указанными в нем.
Продавец не несет ответственности за результаты замеров, выполненных Покупателем самостоятельно. В случае несоответствия предоставленных Покупателем результатов замера фактическим размерам проемов и иных отдельных элементов (с учетом особенностей бытовых конструкций, систем коммуникаций, препятствующих установке дверей, и проч.), устранение этих несоответствий производится за счет Покупателя.
Также, в случае если Продавец не оказывает Покупателю услуги по осуществлению замера дверных проемов и отдельных элементов, а неправильное выполнение замеров, произведенное Покупателем самостоятельно, привело к невозможности монтажа товара, Покупатель в любом случае обязан оплатить стоимость услуг по выезду специалистов Продавца для осуществления замеров, а также стоимость иных сопутствующих услуг.
Продавец не несет ответственность в случае изменений размеров дверных проемов или отдельных элементов, произошедших после осуществления замера специалистом Продавца.
е.           При оформлении заказа через менеджера Покупатель обязуется предоставить информацию, указанную в разделе 4 «Порядок оформления и отмена заказа» настоящей оферты, и иную необходимую информацию по требованию менеджера.
Принятие Покупателем условий настоящей оферты осуществляется посредством внесения Покупателем соответствующих данных в форму и последующего подтверждения заказа менеджером при оформлении заказа (в случае выбора способа оплаты «при получении») или посредством оплаты заказа (в случае внесения предоплаты).
ж.            Все информационные материалы, представленные на сайте https://www.portus-dveri.ru/ носят справочный характер и могут не в полной мере передавать информацию об определенных свойствах и характеристиках товара. В частности, фото-образцы товара могут отличаться от товара по цвету в силу различной цветопередачи на электронных устройствах, а также фото-образцы не передают в полной мере текстуру товара, его размер, форму и его качество. В связи с чем, в случае возникновения у Покупателя вопросов, касающихся свойств и характеристик товара, перед оформлением заказа ему необходимо обратиться за консультацией к менеджеру для получения достоверной информации по номеру, указанному на сайте.
3.     При оформлении заказа по телефону и/или посредством использования электронной почты, форм обратной связи, размещенных на сайте, и/или при личном обращении в розничный магазин Продавца, Покупатель подтверждает, что он ознакомлен с условиями настоящей оферты и обязуется предоставить Продавцу всю информацию, необходимую для надлежащего оформления и исполнения заказа.
4.     После уточнения деталей покупки менеджером, последний направляет на электронную почту Покупателя коммерческое предложение с предварительными условиями покупки. Коммерческое предложение действительно в течение времени, указанного в нем.
В случае согласия с условиями коммерческого предложения, Покупатель связывается с ответственным менеджером по телефону или по адресу электронной почты, по которым ранее менеджер взаимодействовал с Покупателем, для составления Заказа .
5.    Составленный Заказ подписывается сторонами при личном обращении Покупателя в розничный магазин Продавца.
6.     При оформлении заказа путем личной встречи с предстовителем коммерческое предложение не оформляется. После уточнения деталей покупки и получения устного согласия Покупателя менеджер составляет Заказ, который подписывается сторонами.
7.     Для оформления заказа на товар, изготавливаемый «под заказ» Покупателем с менеджером дополнительно должны быть согласованы индивидуальные параметры, необходимые и достаточные для выполнения заказа Продавцом, в частности: габариты (размеры), цвет, материалы и их комбинации, комплектность и проч.
В случае необходимости Продавец изготавливает графический рисунок изделия (эскиз), который высылается Покупателю и подтверждается последним посредством письма, направленного Продавцу по электронной почте. После подтверждения эскиза Покупателем Продавец не несет ответственность за выбранный Покупателем дизайн товара.
Заказ принимается в работу (к исполнению) после согласования всех индивидуальных параметров заказа Покупателем с менеджером.
Покупатель уведомлен о том, что в силу специфики изготовления товара «под заказ» срок выполнения такого заказа и порядок его оплаты могут отличаться от срока выполнения и порядка оплаты обычного заказа.
8.     Оформляя заказ, Покупатель соглашается с тем, что Продавец может поручить исполнение договора третьему лицу, при этом оставаясь ответственным за его исполнение.
9.     Продавец (в том числе в лице менеджеров) не несет ответственности за содержание и достоверность информации, предоставленной Покупателем при оформлении заказа. Полная ответственность за достоверность предоставленной при оформлении заказа информации, в том числе в случае, если предоставление неверных сведений повлекло за собой невозможность надлежащего исполнения Продавцом своих обязательств, возлагается на Покупателя.
10.     Внесения предоплаты Покупателем после подтверждения заказа менеджером означает полное и безоговорочное согласие Покупателя с условиями настоящей оферты.
Датой заключения договора купли-продажи товара между Продавцом и Покупателем на условиях, изложенных в настоящей оферте является, соответственно, либо день оплаты заказа, либо день оформления заказа Покупателем и подтверждения заказа менеджером (при выборе способа оплаты «при получении»), либо день подписания Заказа.
11.     Подтвержденный заказ может быть отменен путем обращения к менеджеру только до момента исполнения заказа, то есть до направления заказа по адресу, указанному Покупателем, в случае доставки товара, и не позднее даты получения Покупателем уведомления о готовности товара.
Указанные правила не распространяются на товар, изготовленный «под заказ»: в таком случае Покупатель не вправе отменить заказ с момента оплата услуги по осуществлению замеров дверных проемов и отдельных элементов и согласования с менеджером индивидуальных параметров заказа, что является моментом принятия Продавцом заказа в работу (к исполнению).
5. Сроки исполнения заказа
1.     Срок, в который Продавец обязуется исполнить заказ, составляет от 1(одного) до 90 (девяносто) рабочих дней. Срок исполнения Заказа зависит от наличия заказанных позиций товара на складе Продавца и времени, необходимого на обработку заказа.
2.     Продавец не может гарантировать наличие товара в необходимом количестве / комплектности / ассортименте на складе в момент оплаты товара, в связи с чем, сроки исполнения заказа могут быть увеличены, о чем Продавец сообщает Покупателю посредством электронной почты или телефонного звонка.
Срок исполнения заказа в исключительных случаях может быть изменен по согласованию с Покупателем индивидуально в зависимости от характеристик и количества заказанного товара.
Срок изготовления товаров «под заказ» является предварительным и может быть уточнен Продавцом в одностороннем порядке без применения к нему каких-либо санкций путем увеличения, но не более чем на 30 (тридцать) рабочих дней, о чем Продавец незамедлительно уведомляет Покупателя как только станет возможным определить конечный срок изготовления товара. Продавец уведомляет об этом Покупателя посредством направления письма на электронную почту или телефонного звонка.
3.     В случае отсутствия заказанных Покупателем товаров или их части на складе Продавца, последний вправе в одностороннем порядке исключить отсутствующий товар из заказа / изменить комплектность / аннулировать заказ Покупателя, уведомив об этом Покупателя путем направления соответствующего электронного сообщения по адресу электронной почты, указанному Покупателем при оформлении заказа, или путем совершения звонка на контактный номер телефона, указанный Покупателем при оформлении заказа.
4.     Подтвержденный заказ может быть отменен путем обращения к менеджеру только до момента исполнения заказа, то есть до направления заказа по адресу, указанному Покупателем, и/или не позднее даты получения Покупателем уведомления о готовности товара.
Указанные правила не распространяются на товар, изготовленный «под заказ»: в таком случае Покупатель не вправе отменить заказ с момента оплата услуги по осуществлению замеров дверных проемов и отдельных элементов и согласования с менеджером индивидуальных параметров заказа, что является моментом принятия Продавцом заказа в работу (к исполнению).
6. Доставка / выборка и приемка товара
 Доставка:
1.     Сроки доставки согласуются Покупателем с менеджером после оформления и оплаты заказа, в случае оплаты при получении после согласования даты доставки с менеджером. Ожидаемое время доставки Покупатель может уточнить у менеджера. Ожидаемое время доставки может быть откорректировано, о чем менеджер сообщает Покупателю.
2.     Территория доставки товаров, представленных на сайте и реализуемых Продавцом, ограничена регионами, указанными на сайте.
3.     При доставке заказ вручается Покупателю либо третьему лицу, указанному Покупателем в качестве получателя при оформлении заказа.
4.     Покупатель осведомлен и соглашается с тем, что доставка товара является отдельной услугой, не являющейся неотъемлемой частью оформленного заказа, выполнение которой может быть возложено Продавцом на третьих лиц.
5.     Стоимость доставки не включается в стоимость товара и оплачивается отдельно. Стоимость доставки, является приблизительной, уточняется у менеджера, при публикации на сайте носит исключительно справочный характер и может быть откорректирована при оформлении заказа, поскольку стоимость доставки каждого заказа рассчитывается индивидуально, исходя из сведений о количестве товара, региона/района и способа доставки.
6.     Стоимость доставки указывается Продавцом на последнем этапе оформления заказа. О способах и порядке оплаты услуги по осуществлению доставки менеджер заблаговременно уведомляет Покупателя.
7.     В стоимость доставки не включается подъем товара на этаж и занос товара в здание / помещение. Доставка товара осуществляется до подъезда / входа в здание / помещение соответственно.
8.     Обязанность Продавца передать товар считается исполненной в момент его передачи Покупателю или получателю, указанному Покупателем. Разгрузочные работы осуществляются силами Продавца, если сторонами дополнительно не согласовано иное. С момента передачи товара риск случайной гибели или случайного повреждения товара переходит к Покупателю.
9.     Если в согласованный день и/или время доставки товара Покупатель отсутствовал по адресу, указанному при оформлении заказа, повторная доставка является платной. Кроме того, Покупатель оплачивает стоимость простоя автомашины Продавца более 30 (тридцати) минут, возникшего по вине Покупателя, исходя из следующей ставки: 500 (пятьсот) рублей за час ожидания.
 
 
Приемка:
1.     При получении товара любым из вышеперечисленных способов в момент доставки товара, либо в момент отгрузки соответственно, Покупатель обязан в присутствии представителя Продавца проверить товар на предмет наличия внешних (видимых) повреждений/недостатков путем визуального осмотр, а также проверить его на соответствие заявленному количеству, ассортименту и комплектности, а также целостность упаковки. Если упаковка нарушена, Покупатель и представитель Продавца вскрывают упаковку и проверяют товар и/или детали, находящиеся в такой упаковке.
При приемке товара без осмотра и проверки дальнейшие претензии Покупателя по внешним (видимым) повреждениям/недостаткам товара не подлежат рассмотрению.
2.     В случае отсутствия претензий Покупатель подписывает акт приемки товара без замечаний. Подписание такого акта свидетельствует о том, что претензий к товару Покупателем не заявлено, Продавец в полном объеме и надлежащим образом исполнил свою обязанность по передаче товара.
3.     В случае наличия замечаний по количеству, внешним (явным, видимым) недостаткам, ассортименту и комплектности товара, претензии предъявляются непосредственно в момент передачи товара путем совершения соответствующей записи в акте приема-передачи. Покупатель делает в акте приемке отметку о наличии повреждений/недостатков с подробным описанием выявленных повреждений/недостатков и обязательным приложением материалов фотофиксации.
4.     В случае наличия недостатков товара, Продавец устраняет недостатки, указанные в акте приемки товара, в течение 14 (четырнадцати) рабочих дней с момента подписания сторонами акта приема-передачи, не включая срок на доставку товара (как до места нахождения Продавца, так и до места нахождения Покупателя при доставке товара).
5.     Товар надлежащего качества не может быть возвращен Продавцу по причине недоукомплектованности или его неправильной комплектации. Такой товар должен быть доукомплектован Продавцом в течение 14 (четырнадцати) рабочих дней с момента получения требования Покупателя.
6.     Покупатель соглашается с тем, что не являются недостатками товара расхождения с изображениями товаров на сайте товара, переданного Покупателю, если эти расхождения касаются оттенка цвета, вариантов распила (раскроя), фактуры, оттенка, узора древесины и прочим отличиям, связанным с неоднородностью натурального материала. Покупатель согласен с тем, что элементы товара могут незначительно отличаться друг от друга по оттенкам, а также по цвету от представленного на сайте изображения.
7.     В случае отказа Покупателя от приемки товара надлежащего качества, Продавец вправе возвратить Покупателю денежные средства, за вычетом расходов, понесенных в связи с совершением действий по выполнению договора, которые Продавец вправе самостоятельно удержать при возврате денежных средств.
7. Оплата заказа
    Оплата заказа
1.     Цена товара указывается на сайте. В случае указания неверной/неактуальной цены заказанного Покупателем товара, Продавец информирует об этом Покупателя после получения заказа для подтверждения заказа по измененной цене либо аннулирования заказа. В случае невозможности связаться с Покупателем заказ считается аннулированным в течение 5 (пяти) календарных дней с момента его оформления.
2.     Цена товара на сайте на любые позиции товара может быть изменена Продавцом в одностороннем порядке. При этом цена на заказанный Покупателем и подтвержденный менеджером товар изменению не подлежит.
3.     Продавец вправе предоставлять скидки на товары и устанавливать программу бонусов. Виды скидок, бонусов, порядок и условия начисления определяются Продавцом самостоятельно, указываются на сайте и могут быть изменены Продавцом в одностороннем порядке.
4.     Полная стоимость заказа состоит из стоимости товара и стоимости доставки, по договоренности могут быть оказаны дополнительные услуги.
5.     Оплата заказа осуществляется одним из следующих способов, выбор которого осуществляется Покупателем при оформлении заказа: (1) безналичный платеж после оформления заказа либо (2) иной способ оплаты (наличный платеж, банковская карта Visa / Mastercard, / МИР, безналичный платеж) после согласования заказа с менеджером.
6.     Оплата товара, изготавливаемого «под заказ», осуществляется Покупателем в следующем порядке: на условиях 100% предоплаты, если сторонами не согласовано иное. Такой заказ принимается в работу (к исполнению) только после поступления денежных средств Покупателя на расчетный счет Продавца.
7.     Окончательная сумма заказа согласовывается с продавцом, при необходимости составляется коммерческое предложение, и только после производится оплата.
8. Возврат товара
Товар надлежащего качества:
1.     В соответствии со статьей 502 ГК РФ и статьей 25 Закона РФ от 07.02.1992 № 2300-1 «О защите прав потребителей» требование покупателя об обмене товара надлежащего качества подлежит удовлетворению, если товар не был в употреблении, сохранены его потребительские свойства, пломбы, фабричные ярлыки и имеются доказательства приобретенного его у данного продавца (товарный или кассовый чек, иной документ, подтверждающий оплату товара). Если товар не соответствует данным требованиям Закона РФ «О защите прав потребителей», то он не подлежит обмену как товар надлежащего качества.
Покупатель имеет право на обмен товара надлежащего качества в течение 14 (четырнадцати) календарных дней, не считая дня покупки.
Замена товара осуществляется в течение 1 (одной) недели, если товар есть в наличии и в течение 3-х недель, если товара в наличии нет.
2.     Покупатель вправе отказаться (вернуть) товар в течение 7 (семи) календарных дней с момента получения товара, если сохранен товарный вид и потребительские свойства товара, а также документ, подтверждающий факт и условия покупки указанного товара у Продавца.
3.     Обмену и возврату не подлежит: (1) товар надлежащего качества, имеющий индивидуально определенные свойства (товар, изготовленный «под заказ»), а также (2) товар, подверженный изменению силами Покупателя (например, врезанная фурнитура, самовольное изменение размеров и проч.).
4.     Возврат товара осуществляется на основании письменного заявления Покупателя, которое составляется в свободной форме с указанием актуальных контактных данных Покупателя, наименования и количества товара, а также причин возврата, силами Продавца за счет Покупателя.
5.     Возврат товара производится в рабочие дни в офисе продаж Продавца. Срок осуществления возврата товара определяется по соглашению сторон, но не может составлять более 10 (десяти) календарных дней со дня получения соответствующего заявления.
6.     При возврате товара составляется двусторонний акт о возврате товара, в котором указываются следующие сведения: полное фирменное наименование Продавца; фамилия, имя, отчество и паспортные данные Покупателя; наименование и количество товара; причина возврата товара; дата передачи товара; сумма, подлежащая возврату; подписи Продавца и Покупателя.
7.     Возврат денежных средств, уплаченных Покупателем за товар, осуществляется на основании письменного заявления Покупателя, которое высылается по адресу электронной почты Продавца или передается представителю Продавца лично в руки. Продавец обязан возвратить денежную сумму, уплаченную Покупателем по договору, за исключением расходов Продавца на доставку от Покупателя возвращенного товара, не позднее чем через 10 (десять) календарных дней со дня получения соответствующего заявления.
 
Товар ненадлежащего качества:
1.     В случае получения товара ненадлежащего качества Покупатель обязуется незамедлительно сообщить об этом Продавцу в письменном виде с приложением материалов фотофиксации и предоставлять товар Продавцу для проверки качества товара и составления соответствующего заключения.
2.     Обмен или возврат товара ненадлежащего качества производится при соблюдении Покупателем следующих условий: (1) товар находится в том же виде и состоянии, в котором он был получен Покупателем, укомплектован всеми составными частями, (2) товар находится в упаковке, обеспечивающей его безопасную транспортировку, (3) на товаре и упаковке отсутствуют дополнительные повреждения (надписи, царапины и проч.), (4) Покупателем предоставлено заключение Продавца, подтверждающее наличие оснований для обмена или возврата товара, (5) Покупателем предоставлен документ, подтверждающий приобретение товара у Продавца.
3.     Уплаченная Покупателем сумма за товар ненадлежащего качества, за исключением расходов Продавца на доставку (если стороны не договорятся об ином в день приемки заказа), подлежит возврату Покупателю в течение 10 (десяти) календарных дней с момента получения соответствующего письменного заявления Покупателя. 
9. Гарантийные обязательства
1.     Все товары, предоставляемые Продавцом, сертифицированы и получены от официального производителя.
2.     На товар установлен гарантийный срок 5 (пять) лет в случае, если услуги по монтажу товара выполнены с привлечением сертифицированных бригад, перечень которых утвержден и опубликован Продавцом на сайте. Если монтаж осуществлен иными лицами или самостоятельно Покупателем, гарантийный срок составляет 3 (три) года.
3.     Гарантия распространяется на скрытые недостатки товара, возникшие после приемки товара в процессе его эксплуатации.
4.     Гарантийный срок на товар течет с момента доставки товара Покупателю (подписания акта приемки сдачи) или получения товара Покупателем в случае самовывоза.
5.     Претензии относительно скрытых недостатков товара и/или работ принимаются в течение гарантийного срока с обязательным приложением Покупателем акта приема-передачи товара и/или акта приемки выполненных работ и материалом фотофиксации выявленных недостатков.
6.     Срок устранения недостатков по соглашению сторон определен как 45 (сорок пять) календарных дней со дня получения письменной претензии Покупателя, а в случае необходимости доставки товара на фабрику производителя товара – 45 (сорок пять) календарных дней с момента поступления товара на фабрику.
7.     Гарантия не распространяется на: (1) естественный износ, (2) дефекты, вызванные перегрузкой, неправильной эксплуатацией, (3) проникновением жидкости, грязи, других посторонних предметов, (4) проведения ремонта лицами, не имеющими на это соответствующих полномочий от производителя, (5) недостатки, возникшие при установке, сборке (монтаже) товара силами Покупателя или привлеченных им третьих лиц, не входящих в перечень рекомендованных Продавцом, (6) товар и/или детали, комплектующие принадлежности, в конструкцию которых Покупателем были самостоятельно внесены изменения, а также (6) допустимые отклонения согласно ГОСТу 475-2016, ТУ 5361-002-74790213-2009, а именно:
●         учитывая специфику материала, из которого изготавливается товар, допускается отклонение по тону и текстуре полотен в одном комплекте (кроме распашных полотен), наличие минеральных вкраплений (в том числе, темные прожилки - одиночные и разбросанные, разные по длине, ширине и глубине), пороки древесины, т.к. текстура древесины является индивидуальной в связи с природным происхождением материала;
●         возможны и не считаются дефектами: особенности шпона, такие как ярко выраженный рисунок шпона, сучки, узор древесины; различные оттенки горизонтальных и вертикальных волокон шпона; тонировка различных комплектующих может отличаться друг от друга в пределах одного цветового тона или при различных углах ракурса. Претензии по такого рода отличиям, связанным с неоднородностью натурального материала, не принимаются, поскольку указанные отличия не являются браком;
●         не являются браком неоднородность и разнооттеночность искусственного покрытия, имитирующего натуральный материал;
●         не являются браком неоднородность и разнооттеночность окрашенного покрытия Товара в связи с технологическими особенностями: невозможностью равномерного по интенсивности окрашивания вручную дверных полотен и погонажных изделий из-за сложности конфигурации изделий;
●         в случае использования покрытия, имитирующего эффект природного растрескивания, размер трещин зависит от толщины слоя покрытия, так как распыление производится вручную, равномерное нанесение лакокрасочного материала по всей поверхности товара невозможно;
●         на стеклах и стеклоизделиях допускается наличие отклонений, перечень которых отражен в технических условиях завода-изготовителя стеклоизделий;
●         учитывая специфику материала, из которого изготавливается товар, цвет товара может отличаться. Незначительное отличие цвета полотна дверей или деталей дверей не является браком и не может служить в последующем основанием для предъявления претензий к Продавцу. Незначительные неровности окраски поверхности дверей (мелкие пузырьки, волнистость, единичные вкрапления, расхождения профиля в углах) также не является браком, и не могут служить в последующем основанием для предъявления претензий Продавцу;
●         не являются браком дефекты, не видимые с расстояния от 1 (одного) метра, незначительные повреждения поверхностного слоя облицовочного материала, конструктивные зазоры между деталями, технологические отверстия и заглушки.
●         другие допустимые отклонения согласно ГОСТу 475-2016, ТУ 5361-002-74790213-2009
8.     Никакая информация, предоставляемая менеджерами Продавца, не может рассматриваться как гарантии, поскольку носит исключительно консультативный характер.
10. Рекомендации по эксплуатации товара
1.     Во избежание деформации дверной коробки малярно-штукатурные работы можно проводить с использованием распорок не ранее, чем через 2 (два) календарных дня с момента установки дверей, при их выполнении исключить соприкасание штукатурных смесей и растворов с дверной коробкой.
2.     Межкомнатные двери относятся к изделиям нормальной влагостойкости и предназначены для эксплуатации внутри помещений, не подверженных перепадам температур, имеющих отопление и вентиляцию, при температуре не ниже 15 С и не выше 35 С с относительной влажностью от 30% до 60%. Существенные и/или резкие отклонения от указанных режимов приводят к значительному ухудшению потребительских свойств межкомнатных дверей.
3.     В случае задевания дверью коробки, пола держать дверь в положении, исключающем повреждение поверхности.
4.     Избегайте грубого механического воздействия на дверь, так как на ней могут образоваться сколы, задиры, вмятины и, как следствие, деформации и повреждения покрытия.
5.     Не допускается контакт дверей с поверхностями или воздухом, температура которых превышает 65 С, что может привести к деформации и/или повреждению межкомнатных дверей.
6.     Не допускается эксплуатация дверей ближе одного метра от отопительных приборов и других источников тепла.
7.     В случае загрязнения, дверь можно протереть специальной чистящей салфеткой и средствами для ухода за мебелью. Для ухода за межкомнатными дверями используйте только качественные, специально предназначенные для этих целей чистящие и полирующие средства в соответствии с прилагаемыми к ним инструкциями о способе и области их применения.
8.     Не допускайте навешивание на дверное полотно и ручку каких-либо предметов.
11. Авторские права
Вся информация (в том числе текстовая, графическая и проч.), размещенная на сайте Продавца, являются собственностью последнего и/или производителей товара и/или поставщиков и/или партнеров. 
12. Права, обязанности и ответственность сторон
1.     Продавец вправе привлекать третьих лиц для исполнения своих обязанностей по договору.
2.     Продавец имеет право на осуществление записи телефонных переговоров с Покупателем. В соответствии с п. 4 ст. 16 Федерального закона «Об информации, информационных технологиях и о защите информации» Продавец обязуется: предотвращать попытки несанкционированного доступа к информации и/или передачу ее лицам, не имеющим непосредственного отношения к исполнению заказов; своевременно обнаруживать и пресекать такие факты. Телефонные разговоры записываются исключительно в целях осуществления контроля деятельности менеджеров и контроля качества исполнения заказов.
3.     Продавец не несет ответственности за ущерб, вызванный ненадлежащим использованием товара Покупателем, а равно несоблюдением Покупателем рекомендаций Продавца по эксплуатации товара, размещенных на сайте.
4.     Продавец не несет ответственности за правильность результатов замеров, выполненных Покупателем самостоятельно, а также в случае изменений размеров дверных проемов или отдельных элементов, произошедших после осуществления замера специалистом Продавца.
5.     Продавец не несет ответственности, если в течение 5 (пяти) рабочих дней со дня получения заказа, уведомит Покупателя, о невозможности передачи ему товара (части товара), в устной форме по телефону и/или посредством направления уведомления по электронной почте, направленного на адрес указанный Покупателем при оформлении заказа.
13. Дополнительные условия
1.     Сообщая Продавцу свои персональные данные (в том числе: ФИО, место жительства, адрес электронной почты (e-mail), номер телефона и др.) при использовании сайта Продавца https://www.portus-dveri.ru/, в том числе при оформлении заказа, при совершении покупки в розничном магазине Продавца, Покупатель дает свое согласие на обработку персональных данных и предоставление этих данных третьим лицам, привлекаемым Продавцом исключительно для целей выполнения обязательств перед Покупателем в рамках договора (в том числе, для осуществления доставки и/или монтажа товара).
2.     Взаимодействие Покупателя с менеджерами и иными представителями Продавца должно строиться на принципах общепринятой морали и этикета.
3.     Продавец и предоставляемые им сервисы могут быть временно частично или полностью недоступны по причине проведения профилактических или иных работ или по любым другим причинам технического характера. Продавец имеет право периодически проводить необходимые профилактические или иные работы с предварительным уведомлением Покупателей или без такового.
4.     В случае возникновения вопросов и/или претензий стороны обращаются друг к другу в письменном виде, путем направления обращений / претензий по адресу электронной почты. Срок рассмотрения и ответа на обращение / претензию составляет 7 (семь) календарных дней. Все возникающие споры стороны будут стараться решить путем переговоров, при недостижении соглашения спор будет передан на рассмотрение в суд в соответствии с действующим законодательством РФ.
5.     При осуществлении расчетов, кассовый чек (бланк строгой отчетности) должен быть сформирован не позднее рабочего дня, следующего за днем осуществления расчета, но не позднее момента передачи товара (согласно п. 5.4 ст.1 Федерального закона от 03.07.2018 г. № 192-ФЗ).
6. Реквизиты продавца
Продавец: интернет-магазин portus-dveri.ru
Название организации, ИП: ИП Головнев Д. И.
Телефон: +79955926670
E-mail: goldmoskva@ya.ru
Адрес: Ленинградская область, Гатчинский муниципальный округ, деревня Старицы, 26
Банковские реквизиты: БИК: 044525974; ИНН: 410502655858; К/с 30101810145250000974;
Р/с 40802810800006048162; АО "Тинькофф Банк" 127287, г. Москва, ул. Хуторская 2-я, д. 38А, стр.25
ФИО руководителя: Головнев Дмитрий Иванович<br>
                        
                    </p>
                </div>
            </div>
        `;
    },

    renderCustomDoor() {
        this.contentDiv.innerHTML = `
            <div class="view active container" style="margin-bottom: 50px;">
                <h1 style="margin-bottom: 30px; font-size: 32px; font-weight: 400; padding-top: 20px;">Двери на заказ по вашим размерам</h1>
                <p style="color: #666; font-size: 15px; margin-bottom: 40px; max-width: 800px;">Опишите какую дверь вы хотите, укажите размеры и контактную информацию. Мы рассчитаем стоимость и свяжемся с вами для уточнения деталей.</p>
                
                <div style="max-width: 800px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 30px; margin-bottom: 20px;">
                        <input type="text" id="cust-name" placeholder="Ваше Имя" style="flex: 1; min-width: 250px; border: none; border-bottom: 1px solid #ccc; padding: 15px 0; outline: none; font-size: 14px;">
                        <input type="text" id="cust-phone" placeholder="Телефон *" style="flex: 1; min-width: 250px; border: none; border-bottom: 1px solid #ccc; padding: 15px 0; outline: none; font-size: 14px;">
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 30px; margin-bottom: 20px;">
                        <input type="text" id="cust-email" placeholder="Email" style="flex: 1; min-width: 250px; border: none; border-bottom: 1px solid #ccc; padding: 15px 0; outline: none; font-size: 14px;">
                        <input type="text" id="cust-size" placeholder="Примерные размеры (ширина x высота)" style="flex: 1; min-width: 250px; border: none; border-bottom: 1px solid #ccc; padding: 15px 0; outline: none; font-size: 14px;">
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <label style="display:block; margin-bottom:10px; color:#555; font-size:14px;">Описание двери (цвет, материалы, фурнитура):</label>
                        <textarea id="cust-desc" rows="5" placeholder="Опишите желаемую дверь..." style="width: 100%; border: 1px solid #ccc; border-radius: 10px; padding: 15px; outline: none; font-size: 14px; resize:vertical;"></textarea>
                    </div>

                    <button onclick="app.processCustomOrder()" style="background: #fbc02d; color: #fff; border: none; padding: 15px 30px; border-radius: 25px; cursor: pointer; font-size: 14px; font-weight: bold; width: 100%; max-width: 300px;">Отправить заявку</button>
                </div>
            </div>
        `;
    },

    processCustomOrder() {
        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;
        const email = document.getElementById('cust-email').value;
        const size = document.getElementById('cust-size').value;
        const desc = document.getElementById('cust-desc').value;

        if (!phone) { alert('Пожалуйста, введите номер телефона'); return; }

        Store.addCustomOrder({ name, phone, email, size, desc });
        this.navigate('home');
    },

    renderCart() {
        let itemsHtml = '';
        let total = 0;

        if (Store.cart.length === 0) {
            itemsHtml = '<p>Ваша корзина пуста</p>';
        } else {
            Store.cart.forEach((item, idx) => {
                let itemTotal = item.price * (item.qty || 1);
                total += itemTotal;
                itemsHtml += `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <img src="${item.img}" class="cart-item-img">
                            <div class="cart-item-details">
                                <strong>${item.title}</strong>
                                <span>Артикул: ${item.id}</span>
                            </div>
                        </div>
                        
                        <div class="cart-qty-ctrl">
                            <div onclick="Store.updateCartQty(${idx}, -1); app.renderCart()">-</div>
                            <span>${item.qty || 1}</span>
                            <div onclick="Store.updateCartQty(${idx}, 1); app.renderCart()">+</div>
                        </div>

                        <div class="cart-item-price">${itemTotal} Р</div>
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
        if (!Store.user) {
            alert('Пожалуйста, войдите в личный кабинет для оформления заказа.');
            this.navigate('profile');
            return;
        }

        let total = Store.cart.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
        Store.addOrder(total);
        alert('Заказ успешно оформлен! Вы можете отследить его в личном кабинете.');
        this.navigate('profile');
    },

    renderProfile() {
        if (Store.user) {
            if (Store.user.role === 'admin') {
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
                        <input type="text" id="auth-email" placeholder="example@mail.ru">
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
                                <li><a href="javascript:void(0)" onclick="app.navigate('admin-orders')">Заказы и Заявки</a></li>
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

    renderAdminOrders(tab = 'catalog') {
        let ordersHtml = '';

        if (tab === 'catalog') {
            ordersHtml = Store.orders.length === 0 ? '<p>Заказов из каталога пока нет.</p>' : Store.orders.map(o => `
                <div class="admin-product-row" style="flex-direction:column; align-items:flex-start; gap:10px;">
                    <div style="display:flex; justify-content:space-between; width:100%;">
                        <strong>Заказ #${o.id}</strong>
                        <span style="font-size:12px; color:#999;">${o.date}</span>
                    </div>
                    <div style="font-size:13px;"><strong>Статус:</strong> ${o.status} | <strong>Сумма:</strong> ${o.total} Р</div>
                    <div style="font-size:13px; margin-top:5px;">
                        <strong>Товары:</strong><br>
                        ${o.items.map(i => `- ${i.title} (x${i.qty || 1}) - ${i.price * (i.qty || 1)} Р`).join('<br>')}
                    </div>
                </div>
            `).join('');
        } else if (tab === 'custom') {
            ordersHtml = Store.customOrders.length === 0 ? '<p>Заказов по своим размерам пока нет.</p>' : Store.customOrders.map(c => `
                <div class="admin-product-row" style="flex-direction:column; align-items:flex-start; gap:10px;">
                    <div style="font-size: 11px; color:#999;">${c.date}</div>
                    <div><strong>Имя:</strong> ${c.name} | <strong>Телефон:</strong> ${c.phone} | <strong>Email:</strong> ${c.email || '—'}</div>
                    <div><strong>Размеры:</strong> ${c.size || 'Не указаны'}</div>
                    <div style="font-size: 13px; color: #444; background:#f5f5f5; padding:10px; border-radius:5px; width:100%; box-sizing:border-box;"><strong>Описание:</strong><br>${c.desc || '—'}</div>
                </div>
            `).join('');
        } else {
            ordersHtml = Store.requests.length === 0 ? '<p>Обычных заявок из Контактов пока нет.</p>' : Store.requests.map(r => `
                <div class="admin-product-row" style="flex-direction:column; align-items:flex-start; gap:10px;">
                    <div style="font-size: 11px; color:#999;">${r.date}</div>
                    <div><strong>Имя:</strong> ${r.name || '—'} | <strong>Email:</strong> ${r.email} | <strong>Телефон:</strong> ${r.phone || '—'}</div>
                    <div style="font-size: 13px; color: #444;"><strong>Комментарий:</strong> ${r.comment || '—'}</div>
                </div>
            `).join('');
        }

        const catCls = tab === 'catalog' ? 'active' : '';
        const custCls = tab === 'custom' ? 'active' : '';
        const reqCls = tab === 'requests' ? 'active' : '';

        this.contentDiv.innerHTML = `
            <div class="view active container">
                <div class="admin-layout">
                    <div class="admin-sidebar">
                        <div class="admin-card">
                            <h3 style="margin-bottom:20px;">Админ Панель</h3>
                            <ul class="side-menu-links">
                                <li><a href="javascript:void(0)" onclick="app.navigate('admin')">Товары</a></li>
                                <li><a href="javascript:void(0)" style="color:#f57c00;">Заказы и Заявки</a></li>
                                <li><a href="javascript:void(0)" onclick="app.doLogout()">Выйти</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="admin-content">
                        <h2>Заказы и Заявки</h2>
                        
                        <div class="admin-tabs">
                            <div class="admin-tab ${catCls}" onclick="app.renderAdminOrders('catalog')">Заказы из корзины</div>
                            <div class="admin-tab ${custCls}" onclick="app.renderAdminOrders('custom')">Индивидуальный заказ</div>
                            <div class="admin-tab ${reqCls}" onclick="app.renderAdminOrders('requests')">Обратная связь (Контакты)</div>
                        </div>

                        <div class="admin-product-list">
                            ${ordersHtml}
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

        if (!title) {
            alert('Пожалуйста, введите название товара.'); return;
        }

        Store.addProduct({ title, price, desc, img, category: cat });
        this.navigate('admin');
    },

    doLogin() {
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-pass').value;
        if (email && pass) {
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
