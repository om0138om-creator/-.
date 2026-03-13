/**
 * ============================================
 * فونت ستوديو - مدير الخطوط
 * ============================================
 * إدارة كاملة للخطوط المخصصة مع دعم IndexedDB
 */

class FontsManager {
    constructor() {
        // إعدادات قاعدة البيانات
        this.dbName = 'FontStudioDB';
        this.dbVersion = 1;
        this.storeName = 'fonts';
        this.db = null;
        
        // حالة الخطوط
        this.fonts = [];
        this.selectedFont = null;
        this.editingFontId = null;
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.sortOrder = 'name-asc';
        
        // العناصر
        this.elements = {};
        
        // تهيئة
        this.init();
    }
    
    /**
     * تهيئة مدير الخطوط
     */
    async init() {
        await this.initDatabase();
        await this.loadFonts();
        this.cacheElements();
        this.bindEvents();
        this.renderFontsList();
        this.updateStats();
        this.loadSelectedFont();
        
        console.log('✅ FontsManager initialized successfully');
    }
    
    /**
     * تهيئة قاعدة البيانات IndexedDB
     */
    initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('❌ Failed to open database');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Database opened successfully');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // إنشاء مخزن الخطوط
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    // إنشاء الفهارس
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('originalName', 'originalName', { unique: false });
                    store.createIndex('category', 'category', { unique: false });
                    store.createIndex('favorite', 'favorite', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                    store.createIndex('lastUsed', 'lastUsed', { unique: false });
                    
                    console.log('✅ Object store created');
                }
            };
        });
    }
    
    /**
     * تحميل الخطوط من قاعدة البيانات
     */
    loadFonts() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                this.fonts = request.result || [];
                
                // تسجيل الخطوط في المتصفح
                this.fonts.forEach(font => {
                    this.registerFont(font);
                });
                
                console.log(`✅ Loaded ${this.fonts.length} fonts`);
                resolve();
            };
            
            request.onerror = () => {
                console.error('❌ Failed to load fonts');
                reject(request.error);
            };
        });
    }
    
    /**
     * تسجيل خط في المتصفح
     */
    registerFont(font) {
        try {
            const fontFace = new FontFace(font.fontFamily, `url(${font.dataUrl})`);
            
            fontFace.load().then((loadedFace) => {
                document.fonts.add(loadedFace);
                console.log(`✅ Font registered: ${font.fontFamily}`);
            }).catch((error) => {
                console.error(`❌ Failed to register font: ${font.fontFamily}`, error);
            });
        } catch (error) {
            console.error('❌ Error registering font:', error);
        }
    }
    
    /**
     * حفظ العناصر في الذاكرة
     */
    cacheElements() {
        this.elements = {
            // قائمة الخطوط
            fontsList: document.getElementById('fontsList'),
            noFontsState: document.getElementById('noFontsState'),
            
            // البحث والترتيب
            fontSearchInput: document.getElementById('fontSearchInput'),
            clearSearchBtn: document.getElementById('clearSearchBtn'),
            sortFontsBtn: document.getElementById('sortFontsBtn'),
            
            // التصنيفات
            fontTabs: document.querySelectorAll('.font-tab'),
            
            // الإحصائيات
            totalFonts: document.getElementById('totalFonts'),
            favoriteFonts: document.getElementById('favoriteFonts'),
            recentFonts: document.getElementById('recentFonts'),
            
            // أزرار الإضافة
            addFontBtn: document.getElementById('addFontBtn'),
            fontInput: document.getElementById('fontInput'),
            
            // مودال التعديل
            editFontModal: document.getElementById('editFontModal'),
            newFontName: document.getElementById('newFontName'),
            fontCategory: document.getElementById('fontCategory'),
            saveEditFont: document.getElementById('saveEditFont'),
            cancelEditFont: document.getElementById('cancelEditFont'),
            
            // لوحة اختيار الخطوط
            fontsPanel: document.getElementById('fontsPanel'),
            fontPanelSearch: document.getElementById('fontPanelSearch'),
            fontPanelList: document.getElementById('fontPanelList'),
            
            // التصدير والاستيراد
            exportAllFonts: document.getElementById('exportAllFonts'),
            importFontsBackup: document.getElementById('importFontsBackup'),
            backupInput: document.getElementById('backupInput')
        };
    }
    
    /**
     * ربط الأحداث
     */
    bindEvents() {
        // إضافة خط جديد
        this.elements.addFontBtn?.addEventListener('click', () => {
            this.elements.fontInput.click();
        });
        
        this.elements.fontInput?.addEventListener('change', (e) => {
            this.handleFontUpload(e.target.files);
        });
        
        // البحث
        this.elements.fontSearchInput?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.trim();
            this.toggleClearSearch();
            this.renderFontsList();
        });
        
        this.elements.clearSearchBtn?.addEventListener('click', () => {
            this.elements.fontSearchInput.value = '';
            this.searchQuery = '';
            this.toggleClearSearch();
            this.renderFontsList();
        });
        
        // البحث في لوحة الخطوط
        this.elements.fontPanelSearch?.addEventListener('input', (e) => {
            this.renderFontPanelList(e.target.value.trim());
        });
        
        // الترتيب
        this.elements.sortFontsBtn?.addEventListener('click', () => {
            this.toggleSort();
        });
        
        // التصنيفات
        this.elements.fontTabs?.forEach(tab => {
            tab.addEventListener('click', () => {
                this.elements.fontTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentFilter = tab.dataset.filter;
                this.renderFontsList();
            });
        });
        
        // مودال التعديل
        this.elements.saveEditFont?.addEventListener('click', () => {
            this.saveEditedFont();
        });
        
        this.elements.cancelEditFont?.addEventListener('click', () => {
            this.closeEditModal();
        });
        
        this.elements.editFontModal?.querySelector('.modal-close')?.addEventListener('click', () => {
            this.closeEditModal();
        });
        
        // التصدير والاستيراد
        this.elements.exportAllFonts?.addEventListener('click', () => {
            this.exportFonts();
        });
        
        this.elements.importFontsBackup?.addEventListener('click', () => {
            this.elements.backupInput.click();
        });
        
        this.elements.backupInput?.addEventListener('change', (e) => {
            this.importFonts(e.target.files[0]);
        });
        
        // إغلاق اللوحات عند النقر على الخلفية
        document.querySelectorAll('.bottom-sheet .sheet-close').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.bottom-sheet').classList.remove('active');
            });
        });
    }
    
    /**
     * معالجة رفع الخطوط
     */
    async handleFontUpload(files) {
        if (!files || files.length === 0) return;
        
        const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
        let uploadedCount = 0;
        
        for (const file of files) {
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            
            if (!validExtensions.includes(extension)) {
                showToast(`الملف ${file.name} غير مدعوم`, 'error');
                continue;
            }
            
            try {
                const font = await this.processFont(file);
                await this.saveFont(font);
                uploadedCount++;
            } catch (error) {
                console.error(`❌ Failed to upload ${file.name}:`, error);
                showToast(`فشل رفع ${file.name}`, 'error');
            }
        }
        
        if (uploadedCount > 0) {
            showToast(`تم رفع ${uploadedCount} خط بنجاح`, 'success');
            this.renderFontsList();
            this.updateStats();
        }
        
        // إعادة تعيين الإدخال
        this.elements.fontInput.value = '';
    }
    
    /**
     * معالجة ملف الخط
     */
    processFont(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                const originalName = file.name;
                const nameWithoutExt = originalName.replace(/\.(ttf|otf|woff|woff2)$/i, '');
                
                // إنشاء اسم فريد للخط
                const fontFamily = `font_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                // تحديد التصنيف تلقائياً
                const category = this.detectCategory(nameWithoutExt);
                
                const font = {
                    name: nameWithoutExt,
                    originalName: originalName,
                    fontFamily: fontFamily,
                    dataUrl: dataUrl,
                    category: category,
                    favorite: false,
                    usageCount: 0,
                    createdAt: Date.now(),
                    lastUsed: null,
                    fileSize: file.size,
                    fileType: file.type || this.getMimeType(originalName)
                };
                
                // تسجيل الخط
                this.registerFont(font);
                
                resolve(font);
            };
            
            reader.onerror = () => {
                reject(reader.error);
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * اكتشاف تصنيف الخط
     */
    detectCategory(name) {
        const arabicPattern = /[\u0600-\u06FF]/;
        const englishPattern = /^[a-zA-Z\s\-_0-9]+$/;
        
        if (arabicPattern.test(name)) {
            return 'arabic';
        } else if (englishPattern.test(name)) {
            return 'english';
        }
        
        return 'mixed';
    }
    
    /**
     * الحصول على نوع MIME
     */
    getMimeType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
            'ttf': 'font/ttf',
            'otf': 'font/otf',
            'woff': 'font/woff',
            'woff2': 'font/woff2'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
    
    /**
     * حفظ الخط في قاعدة البيانات
     */
    saveFont(font) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(font);
            
            request.onsuccess = () => {
                font.id = request.result;
                this.fonts.push(font);
                console.log(`✅ Font saved: ${font.name}`);
                resolve(font);
            };
            
            request.onerror = () => {
                console.error('❌ Failed to save font');
                reject(request.error);
            };
        });
    }
    
    /**
     * تحديث الخط في قاعدة البيانات
     */
    updateFont(font) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(font);
            
            request.onsuccess = () => {
                const index = this.fonts.findIndex(f => f.id === font.id);
                if (index !== -1) {
                    this.fonts[index] = font;
                }
                console.log(`✅ Font updated: ${font.name}`);
                resolve(font);
            };
            
            request.onerror = () => {
                console.error('❌ Failed to update font');
                reject(request.error);
            };
        });
    }
    
    /**
     * حذف خط
     */
    deleteFont(fontId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(fontId);
            
            request.onsuccess = () => {
                this.fonts = this.fonts.filter(f => f.id !== fontId);
                console.log(`✅ Font deleted: ${fontId}`);
                showToast('تم حذف الخط', 'success');
                this.renderFontsList();
                this.updateStats();
                resolve();
            };
            
            request.onerror = () => {
                console.error('❌ Failed to delete font');
                reject(request.error);
            };
        });
    }
    
    /**
     * عرض قائمة الخطوط
     */
    renderFontsList() {
        let filteredFonts = this.getFilteredFonts();
        
        if (filteredFonts.length === 0) {
            this.elements.fontsList.innerHTML = '';
            this.elements.noFontsState?.classList.remove('hidden');
            return;
        }
        
        this.elements.noFontsState?.classList.add('hidden');
        
        // الترتيب
        filteredFonts = this.sortFonts(filteredFonts);
        
        const html = filteredFonts.map(font => this.createFontItemHTML(font)).join('');
        this.elements.fontsList.innerHTML = html;
        
        // ربط أحداث العناصر
        this.bindFontItemEvents();
    }
    
    /**
     * الحصول على الخطوط المفلترة
     */
    getFilteredFonts() {
        let fonts = [...this.fonts];
        
        // تطبيق البحث
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            fonts = fonts.filter(font => 
                font.name.toLowerCase().includes(query) ||
                font.originalName.toLowerCase().includes(query)
            );
        }
        
        // تطبيق التصنيف
        switch (this.currentFilter) {
            case 'favorites':
                fonts = fonts.filter(f => f.favorite);
                break;
            case 'recent':
                fonts = fonts.filter(f => f.lastUsed)
                    .sort((a, b) => b.lastUsed - a.lastUsed)
                    .slice(0, 10);
                break;
            case 'arabic':
                fonts = fonts.filter(f => f.category === 'arabic');
                break;
            case 'english':
                fonts = fonts.filter(f => f.category === 'english');
                break;
        }
        
        return fonts;
    }
    
    /**
     * ترتيب الخطوط
     */
    sortFonts(fonts) {
        switch (this.sortOrder) {
            case 'name-asc':
                return fonts.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
            case 'name-desc':
                return fonts.sort((a, b) => b.name.localeCompare(a.name, 'ar'));
            case 'date-asc':
                return fonts.sort((a, b) => a.createdAt - b.createdAt);
            case 'date-desc':
                return fonts.sort((a, b) => b.createdAt - a.createdAt);
            case 'usage':
                return fonts.sort((a, b) => b.usageCount - a.usageCount);
            default:
                return fonts;
        }
    }
    
    /**
     * تبديل الترتيب
     */
    toggleSort() {
        const orders = ['name-asc', 'name-desc', 'date-desc', 'date-asc', 'usage'];
        const currentIndex = orders.indexOf(this.sortOrder);
        this.sortOrder = orders[(currentIndex + 1) % orders.length];
        
        // تحديث الأيقونة
        const icon = this.elements.sortFontsBtn.querySelector('i');
        const icons = {
            'name-asc': 'fa-sort-alpha-down',
            'name-desc': 'fa-sort-alpha-up',
            'date-asc': 'fa-sort-numeric-down',
            'date-desc': 'fa-sort-numeric-up',
            'usage': 'fa-sort-amount-down'
        };
        
        icon.className = `fas ${icons[this.sortOrder]}`;
        
        this.renderFontsList();
        showToast(this.getSortLabel(), 'info');
    }
    
    /**
     * الحصول على وصف الترتيب
     */
    getSortLabel() {
        const labels = {
            'name-asc': 'ترتيب أبجدي (أ-ي)',
            'name-desc': 'ترتيب أبجدي (ي-أ)',
            'date-asc': 'الأقدم أولاً',
            'date-desc': 'الأحدث أولاً',
            'usage': 'الأكثر استخداماً'
        };
        return labels[this.sortOrder];
    }
    
    /**
     * إنشاء HTML لعنصر الخط
     */
    createFontItemHTML(font) {
        const isSelected = this.selectedFont?.id === font.id;
        const previewText = this.getPreviewText(font.category);
        
        return `
            <div class="font-item ${isSelected ? 'selected' : ''}" 
                 data-font-id="${font.id}">
                <div class="font-preview" style="font-family: '${font.fontFamily}'">
                    ${previewText}
                </div>
                <div class="font-info">
                    <div class="font-name">${this.escapeHtml(font.name)}</div>
                    <div class="font-original">${this.escapeHtml(font.originalName)}</div>
                </div>
                <div class="font-actions">
                    <button class="font-action-btn favorite ${font.favorite ? 'active' : ''}" 
                            data-action="favorite" title="المفضلة">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="font-action-btn edit" data-action="edit" title="تعديل الاسم">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="font-action-btn delete" data-action="delete" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * الحصول على نص المعاينة
     */
    getPreviewText(category) {
        switch (category) {
            case 'arabic':
                return 'أب';
            case 'english':
                return 'Aa';
            default:
                return 'أA';
        }
    }
    
    /**
     * ربط أحداث عناصر الخطوط
     */
    bindFontItemEvents() {
        // النقر على عنصر الخط
        document.querySelectorAll('.font-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.font-action-btn')) return;
                
                const fontId = parseInt(item.dataset.fontId);
                this.selectFont(fontId);
            });
        });
        
        // أزرار الإجراءات
        document.querySelectorAll('.font-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fontId = parseInt(btn.closest('.font-item').dataset.fontId);
                const action = btn.dataset.action;
                
                switch (action) {
                    case 'favorite':
                        this.toggleFavorite(fontId);
                        break;
                    case 'edit':
                        this.openEditModal(fontId);
                        break;
                    case 'delete':
                        this.confirmDelete(fontId);
                        break;
                }
            });
        });
    }
    
    /**
     * اختيار خط
     */
    selectFont(fontId) {
        const font = this.fonts.find(f => f.id === fontId);
        if (!font) return;
        
        this.selectedFont = font;
        
        // تحديث وقت الاستخدام
        font.lastUsed = Date.now();
        font.usageCount = (font.usageCount || 0) + 1;
        this.updateFont(font);
        
        // حفظ الخط المحدد
        localStorage.setItem('selectedFontId', fontId.toString());
        
        // تحديث العرض
        document.querySelectorAll('.font-item').forEach(item => {
            item.classList.toggle('selected', parseInt(item.dataset.fontId) === fontId);
        });
        
        // إرسال حدث للمحرر
        window.dispatchEvent(new CustomEvent('fontSelected', { 
            detail: { font: font } 
        }));
        
        showToast(`تم اختيار: ${font.name}`, 'success');
    }
    
    /**
     * تحميل الخط المحدد سابقاً
     */
    loadSelectedFont() {
        const savedId = localStorage.getItem('selectedFontId');
        if (savedId) {
            const font = this.fonts.find(f => f.id === parseInt(savedId));
            if (font) {
                this.selectedFont = font;
            }
        }
    }
    
    /**
     * تبديل المفضلة
     */
    async toggleFavorite(fontId) {
        const font = this.fonts.find(f => f.id === fontId);
        if (!font) return;
        
        font.favorite = !font.favorite;
        await this.updateFont(font);
        
        // تحديث الزر
        const btn = document.querySelector(`.font-item[data-font-id="${fontId}"] .favorite`);
        btn?.classList.toggle('active', font.favorite);
        
        this.updateStats();
        
        showToast(font.favorite ? 'تمت الإضافة للمفضلة' : 'تمت الإزالة من المفضلة', 'success');
    }
    
    /**
     * فتح مودال التعديل
     */
    openEditModal(fontId) {
        const font = this.fonts.find(f => f.id === fontId);
        if (!font) return;
        
        this.editingFontId = fontId;
        this.elements.newFontName.value = font.name;
        this.elements.fontCategory.value = font.category;
        this.elements.editFontModal.classList.add('active');
        
        // التركيز على حقل الإدخال
        setTimeout(() => {
            this.elements.newFontName.focus();
            this.elements.newFontName.select();
        }, 100);
    }
    
    /**
     * إغلاق مودال التعديل
     */
    closeEditModal() {
        this.editingFontId = null;
        this.elements.editFontModal.classList.remove('active');
    }
    
    /**
     * حفظ تعديل الخط
     */
    async saveEditedFont() {
        if (!this.editingFontId) return;
        
        const font = this.fonts.find(f => f.id === this.editingFontId);
        if (!font) return;
        
        const newName = this.elements.newFontName.value.trim();
        const newCategory = this.elements.fontCategory.value;
        
        if (!newName) {
            showToast('يرجى إدخال اسم الخط', 'error');
            this.elements.newFontName.focus();
            return;
        }
        
        font.name = newName;
        font.category = newCategory;
        
        await this.updateFont(font);
        this.closeEditModal();
        this.renderFontsList();
        this.updateStats();
        
        showToast('تم تحديث اسم الخط', 'success');
    }
    
    /**
     * تأكيد الحذف
     */
    confirmDelete(fontId) {
        const font = this.fonts.find(f => f.id === fontId);
        if (!font) return;
        
        if (confirm(`هل تريد حذف خط "${font.name}"؟`)) {
            this.deleteFont(fontId);
        }
    }
    
    /**
     * تحديث الإحصائيات
     */
    updateStats() {
        const total = this.fonts.length;
        const favorites = this.fonts.filter(f => f.favorite).length;
        const recent = this.fonts.filter(f => f.lastUsed).length;
        
        if (this.elements.totalFonts) {
            this.elements.totalFonts.textContent = total;
        }
        if (this.elements.favoriteFonts) {
            this.elements.favoriteFonts.textContent = favorites;
        }
        if (this.elements.recentFonts) {
            this.elements.recentFonts.textContent = recent;
        }
    }
    
    /**
     * إظهار/إخفاء زر مسح البحث
     */
    toggleClearSearch() {
        const hasQuery = this.searchQuery.length > 0;
        this.elements.clearSearchBtn?.classList.toggle('hidden', !hasQuery);
    }
    
    /**
     * عرض قائمة الخطوط في اللوحة
     */
    renderFontPanelList(searchQuery = '') {
        let fonts = [...this.fonts];
        
        // البحث
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            fonts = fonts.filter(font => 
                font.name.toLowerCase().includes(query) ||
                font.originalName.toLowerCase().includes(query)
            );
        }
        
        // ترتيب حسب المفضلة ثم الأحدث استخداماً
        fonts.sort((a, b) => {
            if (a.favorite !== b.favorite) return b.favorite - a.favorite;
            if (a.lastUsed && b.lastUsed) return b.lastUsed - a.lastUsed;
            return a.name.localeCompare(b.name, 'ar');
        });
        
        if (fonts.length === 0) {
            this.elements.fontPanelList.innerHTML = `
                <div class="no-fonts-state">
                    <i class="fas fa-search"></i>
                    <p>لا توجد نتائج</p>
                </div>
            `;
            return;
        }
        
        const html = fonts.map(font => {
            const isSelected = this.selectedFont?.id === font.id;
            const previewText = this.getPreviewText(font.category);
            
            return `
                <div class="font-panel-item ${isSelected ? 'selected' : ''}" 
                     data-font-id="${font.id}">
                    <span class="font-panel-preview" style="font-family: '${font.fontFamily}'">
                        ${previewText}
                    </span>
                    <span class="font-panel-name">${this.escapeHtml(font.name)}</span>
                    ${font.favorite ? '<i class="fas fa-star" style="color: var(--warning-color)"></i>' : ''}
                </div>
            `;
        }).join('');
        
        this.elements.fontPanelList.innerHTML = html;
        
        // ربط الأحداث
        document.querySelectorAll('.font-panel-item').forEach(item => {
            item.addEventListener('click', () => {
                const fontId = parseInt(item.dataset.fontId);
                this.selectFont(fontId);
                this.elements.fontsPanel.classList.remove('active');
            });
        });
    }
    
    /**
     * فتح لوحة اختيار الخطوط
     */
    openFontsPanel() {
        this.elements.fontsPanel.classList.add('active');
        this.elements.fontPanelSearch.value = '';
        this.renderFontPanelList();
        
        setTimeout(() => {
            this.elements.fontPanelSearch.focus();
        }, 300);
    }
    
    /**
     * تصدير الخطوط (محدث ليدعم تطبيقات الأندرويد)
     */
    async exportFonts() {
        if (this.fonts.length === 0) {
            showToast('لا توجد خطوط للتصدير', 'warning');
            return;
        }
        
        try {
            const exportData = {
                version: '2.0',
                exportDate: new Date().toISOString(),
                fonts: this.fonts
            };
            
            const jsonStr = JSON.stringify(exportData);
            const fileName = `font-studio-backup-${Date.now()}.json`;
            const file = new File([jsonStr], fileName, { type: 'application/json' });
            
            // 🚀 استخدام نافذة المشاركة الأصلية للموبايل
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'نسخة احتياطية للخطوط',
                    text: 'إليك ملف النسخة الاحتياطية لخطوط تطبيق فونت ستوديو',
                    files: [file]
                });
                showToast('تم تصدير الخطوط بنجاح', 'success');
            } else {
                // البديل في حالة تشغيل التطبيق على متصفح الكمبيوتر
                const url = URL.createObjectURL(file);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
                URL.revokeObjectURL(url);
                showToast('تم تصدير الخطوط بنجاح', 'success');
            }
        } catch (error) {
            console.error('❌ Export failed:', error);
            showToast('تم إلغاء التصدير', 'info');
        }
    }
    
    /**
     * استيراد الخطوط
     */
    async importFonts(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.fonts || !Array.isArray(data.fonts)) {
                throw new Error('Invalid backup format');
            }
            
            let importedCount = 0;
            
            for (const font of data.fonts) {
                // التحقق من عدم وجود تكرار
                const exists = this.fonts.some(f => 
                    f.originalName === font.originalName
                );
                
                if (exists) continue;
                
                // إنشاء معرف فريد جديد
                delete font.id;
                font.fontFamily = `font_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                font.createdAt = Date.now();
                
                // تسجيل وحفظ الخط
                this.registerFont(font);
                await this.saveFont(font);
                importedCount++;
            }
            
            if (importedCount > 0) {
                this.renderFontsList();
                this.updateStats();
                showToast(`تم استيراد ${importedCount} خط`, 'success');
            } else {
                showToast('جميع الخطوط موجودة مسبقاً', 'info');
            }
        } catch (error) {
            console.error('❌ Import failed:', error);
            showToast('فشل استيراد الخطوط', 'error');
        }
        
        // إعادة تعيين
        this.elements.backupInput.value = '';
    }
    
    /**
     * الحصول على خط بواسطة المعرف
     */
    getFontById(fontId) {
        return this.fonts.find(f => f.id === fontId);
    }
    
    /**
     * الحصول على الخط المحدد
     */
    getSelectedFont() {
        return this.selectedFont;
    }
    
    /**
     * الحصول على جميع الخطوط
     */
    getAllFonts() {
        return [...this.fonts];
    }
    
    /**
     * تنظيف النص (منع XSS)
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * مسح جميع الخطوط
     */
    async clearAllFonts() {
        if (!confirm('هل تريد حذف جميع الخطوط؟ هذا الإجراء لا يمكن التراجع عنه!')) {
            return;
        }
        
        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            await store.clear();
            
            this.fonts = [];
            this.selectedFont = null;
            localStorage.removeItem('selectedFontId');
            
            this.renderFontsList();
            this.updateStats();
            
            showToast('تم حذف جميع الخطوط', 'success');
        } catch (error) {
            console.error('❌ Clear failed:', error);
            showToast('فشل حذف الخطوط', 'error');
        }
    }
}

/**
 * ============================================
 * دالة عرض التنبيهات Toast
 * ============================================
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // إزالة التنبيه بعد 3 ثواني
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * ============================================
 * تهيئة مدير الخطوط عند تحميل الصفحة
 * ============================================
 */
let fontsManager;

document.addEventListener('DOMContentLoaded', () => {
    // انتظار تحميل قاعدة البيانات
    setTimeout(() => {
        fontsManager = new FontsManager();
        
        // جعله متاحاً عالمياً
        window.fontsManager = fontsManager;
    }, 100);
});

/**
 * ============================================
 * دوال مساعدة عامة
 * ============================================
 */

// تنسيق حجم الملف
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// تنسيق التاريخ
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// توليد معرف فريد
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
