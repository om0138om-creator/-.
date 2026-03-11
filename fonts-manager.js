/* ============================================
   🔤 Font Studio Pro - Fonts Manager
   ============================================
   إدارة الخطوط مع IndexedDB للحفظ الدائم
   ============================================ */

// ============================================
// 🗄️ قاعدة البيانات IndexedDB
// ============================================

class FontDatabase {
    constructor() {
        this.dbName = 'FontStudioDB';
        this.dbVersion = 1;
        this.storeName = 'fonts';
        this.db = null;
    }

    // فتح/إنشاء قاعدة البيانات
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('❌ فشل فتح قاعدة البيانات:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ تم فتح قاعدة البيانات بنجاح');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // إنشاء مخزن الخطوط
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    
                    // إنشاء فهارس للبحث السريع
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('originalName', 'originalName', { unique: false });
                    store.createIndex('dateAdded', 'dateAdded', { unique: false });
                    
                    console.log('✅ تم إنشاء مخزن الخطوط');
                }
            };
        });
    }

    // إضافة خط جديد
    async addFont(fontData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const request = store.add(fontData);
            
            request.onsuccess = () => {
                console.log('✅ تم حفظ الخط:', fontData.name);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('❌ فشل حفظ الخط:', request.error);
                reject(request.error);
            };
        });
    }

    // الحصول على جميع الخطوط
    async getAllFonts() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // الحصول على خط بالـ ID
    async getFont(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // تحديث خط
    async updateFont(fontData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(fontData);
            
            request.onsuccess = () => {
                console.log('✅ تم تحديث الخط:', fontData.name);
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // حذف خط
    async deleteFont(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log('✅ تم حذف الخط');
                resolve();
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // حذف جميع الخطوط
    async clearAllFonts() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('✅ تم حذف جميع الخطوط');
                resolve();
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // البحث عن خطوط بالاسم
    async searchFonts(query) {
        const allFonts = await this.getAllFonts();
        const lowerQuery = query.toLowerCase().trim();
        
        return allFonts.filter(font => 
            font.name.toLowerCase().includes(lowerQuery) ||
            font.originalName.toLowerCase().includes(lowerQuery)
        );
    }
}

// ============================================
// 🎨 مدير الخطوط الرئيسي
// ============================================

class FontsManager {
    constructor() {
        this.db = new FontDatabase();
        this.fonts = [];
        this.loadedFontFaces = new Map();
        this.selectedFontId = null;
        this.editingFontId = null;
        
        // عناصر DOM
        this.elements = {
            fontsList: document.getElementById('fonts-list'),
            fontsCount: document.getElementById('fonts-count'),
            emptyFonts: document.getElementById('empty-fonts'),
            searchInput: document.getElementById('font-search'),
            clearSearchBtn: document.getElementById('clear-search'),
            uploadBtn: document.getElementById('upload-font-btn'),
            uploadMultipleBtn: document.getElementById('upload-multiple-btn'),
            dropZone: document.getElementById('drop-zone'),
            fontFileInput: document.getElementById('font-file-input'),
            editModal: document.getElementById('edit-font-modal'),
            newFontName: document.getElementById('new-font-name'),
            fontPreviewText: document.getElementById('font-preview-text'),
            saveFontNameBtn: document.getElementById('save-font-name'),
            fontSelect: document.getElementById('font-select')
        };
        
        this.init();
    }

    // التهيئة
    async init() {
        try {
            // فتح قاعدة البيانات
            await this.db.init();
            
            // تحميل الخطوط المحفوظة
            await this.loadSavedFonts();
            
            // إعداد المستمعين للأحداث
            this.setupEventListeners();
            
            console.log('✅ تم تهيئة مدير الخطوط');
        } catch (error) {
            console.error('❌ فشل تهيئة مدير الخطوط:', error);
            showToast('فشل في تحميل الخطوط المحفوظة', 'error');
        }
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // زر رفع خط
        this.elements.uploadBtn?.addEventListener('click', () => {
            this.elements.fontFileInput.click();
        });

        // زر رفع عدة خطوط
        this.elements.uploadMultipleBtn?.addEventListener('click', () => {
            this.elements.fontFileInput.click();
        });

        // منطقة السحب والإفلات
        this.setupDropZone();

        // اختيار ملف
        this.elements.fontFileInput?.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
            e.target.value = ''; // إعادة تعيين للسماح برفع نفس الملف مرة أخرى
        });

        // البحث
        this.elements.searchInput?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // مسح البحث
        this.elements.clearSearchBtn?.addEventListener('click', () => {
            this.elements.searchInput.value = '';
            this.elements.clearSearchBtn.classList.add('hidden');
            this.renderFontsList(this.fonts);
        });

        // حفظ اسم الخط الجديد
        this.elements.saveFontNameBtn?.addEventListener('click', () => {
            this.saveEditedFontName();
        });

        // الضغط على Enter في حقل تعديل الاسم
        this.elements.newFontName?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveEditedFontName();
            }
        });

        // تحديث المعاينة عند الكتابة
        this.elements.newFontName?.addEventListener('input', (e) => {
            const previewText = e.target.value || 'نص تجريبي - Preview Text';
            this.elements.fontPreviewText.textContent = previewText;
        });
    }

    // إعداد منطقة السحب والإفلات
    setupDropZone() {
        const dropZone = this.elements.dropZone;
        if (!dropZone) return;

        // منع السلوك الافتراضي
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // تأثيرات بصرية عند السحب
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            });
        });

        // معالجة الإفلات
        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFileSelect(files);
        });

        // النقر على منطقة السحب
        dropZone.addEventListener('click', () => {
            this.elements.fontFileInput.click();
        });
    }

    // تحميل الخطوط المحفوظة
    async loadSavedFonts() {
        try {
            this.fonts = await this.db.getAllFonts();
            
            // تحميل كل خط في CSS
            for (const font of this.fonts) {
                await this.loadFontFace(font);
            }
            
            // عرض القائمة
            this.renderFontsList(this.fonts);
            this.updateFontSelect();
            
            console.log(`✅ تم تحميل ${this.fonts.length} خط`);
        } catch (error) {
            console.error('❌ فشل تحميل الخطوط:', error);
        }
    }

    // معالجة اختيار الملفات
    async handleFileSelect(files) {
        if (!files || files.length === 0) return;

        const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
        const validFiles = [];

        // التحقق من الملفات
        for (const file of files) {
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            
            if (validExtensions.includes(extension)) {
                validFiles.push(file);
            } else {
                showToast(`الملف "${file.name}" غير مدعوم`, 'warning');
            }
        }

        if (validFiles.length === 0) {
            showToast('لم يتم العثور على ملفات خطوط صالحة', 'error');
            return;
        }

        // رفع الملفات الصالحة
        let successCount = 0;
        
        for (const file of validFiles) {
            try {
                await this.uploadFont(file);
                successCount++;
            } catch (error) {
                console.error(`❌ فشل رفع ${file.name}:`, error);
                showToast(`فشل رفع "${file.name}"`, 'error');
            }
        }

        if (successCount > 0) {
            showToast(`تم رفع ${successCount} خط بنجاح! 🎉`, 'success');
        }
    }

    // رفع خط واحد
    async uploadFont(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const fontData = {
                        name: this.cleanFontName(file.name),
                        originalName: file.name,
                        data: e.target.result, // Base64
                        mimeType: this.getMimeType(file.name),
                        size: file.size,
                        dateAdded: new Date().toISOString(),
                        favorite: false
                    };
                    
                    // حفظ في قاعدة البيانات
                    const id = await this.db.addFont(fontData);
                    fontData.id = id;
                    
                    // إضافة للقائمة المحلية
                    this.fonts.push(fontData);
                    
                    // تحميل في CSS
                    await this.loadFontFace(fontData);
                    
                    // تحديث العرض
                    this.renderFontsList(this.fonts);
                    this.updateFontSelect();
                    
                    resolve(fontData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    // تنظيف اسم الخط
    cleanFontName(fileName) {
        return fileName
            .replace(/\.(ttf|otf|woff|woff2)$/i, '')
            .replace(/[-_]/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .trim();
    }

    // الحصول على نوع MIME
    getMimeType(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        const mimeTypes = {
            'ttf': 'font/ttf',
            'otf': 'font/otf',
            'woff': 'font/woff',
            'woff2': 'font/woff2'
        };
        return mimeTypes[extension] || 'font/ttf';
    }

    // تحميل الخط في CSS
    async loadFontFace(font) {
        try {
            // إنشاء اسم فريد للخط في CSS
            const fontFamilyName = `custom-font-${font.id}`;
            
            // التحقق من عدم تحميله مسبقاً
            if (this.loadedFontFaces.has(font.id)) {
                return fontFamilyName;
            }
            
            // إنشاء FontFace
            const fontFace = new FontFace(fontFamilyName, `url(${font.data})`);
            
            // تحميل الخط
            await fontFace.load();
            
            // إضافة للمستند
            document.fonts.add(fontFace);
            
            // حفظ المرجع
            this.loadedFontFaces.set(font.id, fontFamilyName);
            
            console.log(`✅ تم تحميل الخط: ${font.name}`);
            
            return fontFamilyName;
        } catch (error) {
            console.error(`❌ فشل تحميل الخط ${font.name}:`, error);
            throw error;
        }
    }

    // الحصول على اسم عائلة الخط في CSS
    getFontFamily(fontId) {
        return this.loadedFontFaces.get(fontId) || 'Tajawal';
    }

    // عرض قائمة الخطوط
    renderFontsList(fonts) {
        const container = this.elements.fontsList;
        const emptyState = this.elements.emptyFonts;
        
        if (!container) return;

        // تحديث العداد
        this.elements.fontsCount.textContent = `${fonts.length} خط`;
        
        // التحقق من وجود خطوط
        if (fonts.length === 0) {
            container.innerHTML = '';
            emptyState?.classList.remove('hidden');
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState?.classList.add('hidden');
        emptyState.style.display = 'none';
        
        // إنشاء عناصر الخطوط
        container.innerHTML = fonts.map(font => this.createFontItem(font)).join('');
        
        // إضافة مستمعي الأحداث للعناصر الجديدة
        this.attachFontItemListeners();
    }

    // إنشاء عنصر خط
    createFontItem(font) {
        const fontFamily = this.getFontFamily(font.id);
        const firstLetter = font.name.charAt(0).toUpperCase();
        const fileSize = this.formatFileSize(font.size);
        const dateAdded = this.formatDate(font.dateAdded);
        const isSelected = this.selectedFontId === font.id;
        
        return `
            <div class="font-item ${isSelected ? 'selected' : ''}" 
                 data-font-id="${font.id}"
                 data-font-family="${fontFamily}">
                <div class="font-icon">${firstLetter}</div>
                <div class="font-info">
                    <div class="font-name">${this.escapeHtml(font.name)}</div>
                    <div class="font-preview" style="font-family: '${fontFamily}', sans-serif;">
                        أبجد هوز - The Quick Brown Fox 123
                    </div>
                    <div class="font-meta">
                        <span>${fileSize}</span> • <span>${dateAdded}</span>
                    </div>
                </div>
                <div class="font-actions">
                    <button class="font-action-btn edit tooltip" 
                            data-tooltip="تعديل الاسم"
                            data-action="edit" 
                            data-font-id="${font.id}">
                        <span class="material-symbols-rounded">edit</span>
                    </button>
                    <button class="font-action-btn favorite tooltip ${font.favorite ? 'active' : ''}" 
                            data-tooltip="مفضلة"
                            data-action="favorite" 
                            data-font-id="${font.id}">
                        <span class="material-symbols-rounded">${font.favorite ? 'star' : 'star_border'}</span>
                    </button>
                    <button class="font-action-btn delete tooltip" 
                            data-tooltip="حذف"
                            data-action="delete" 
                            data-font-id="${font.id}">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </div>
            </div>
        `;
    }

    // إرفاق مستمعي أحداث لعناصر الخطوط
    attachFontItemListeners() {
        const fontItems = document.querySelectorAll('.font-item');
        
        fontItems.forEach(item => {
            // النقر على العنصر للاختيار
            item.addEventListener('click', (e) => {
                // تجاهل إذا كان النقر على الأزرار
                if (e.target.closest('.font-action-btn')) return;
                
                const fontId = parseInt(item.dataset.fontId);
                this.selectFont(fontId);
            });
        });

        // أزرار الإجراءات
        const actionBtns = document.querySelectorAll('.font-action-btn');
        
        actionBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                const action = btn.dataset.action;
                const fontId = parseInt(btn.dataset.fontId);
                
                switch (action) {
                    case 'edit':
                        this.openEditModal(fontId);
                        break;
                    case 'favorite':
                        await this.toggleFavorite(fontId);
                        break;
                    case 'delete':
                        await this.deleteFont(fontId);
                        break;
                }
            });
        });
    }

    // اختيار خط
    selectFont(fontId) {
        this.selectedFontId = fontId;
        
        // تحديث العرض
        document.querySelectorAll('.font-item').forEach(item => {
            item.classList.toggle('selected', parseInt(item.dataset.fontId) === fontId);
        });
        
        // تحديث قائمة الخطوط في المحرر
        if (this.elements.fontSelect) {
            this.elements.fontSelect.value = fontId;
        }
        
        // إرسال حدث للمحرر
        window.dispatchEvent(new CustomEvent('fontSelected', { 
            detail: { 
                fontId, 
                fontFamily: this.getFontFamily(fontId) 
            } 
        }));
        
        showToast('تم اختيار الخط', 'success');
    }

    // فتح نافذة تعديل الاسم
    openEditModal(fontId) {
        const font = this.fonts.find(f => f.id === fontId);
        if (!font) return;
        
        this.editingFontId = fontId;
        
        // تعبئة البيانات
        this.elements.newFontName.value = font.name;
        
        // تطبيق الخط على المعاينة
        const fontFamily = this.getFontFamily(fontId);
        this.elements.fontPreviewText.style.fontFamily = `'${fontFamily}', sans-serif`;
        this.elements.fontPreviewText.textContent = font.name;
        
        // فتح النافذة
        openModal('edit-font-modal');
        
        // التركيز على حقل الاسم
        setTimeout(() => {
            this.elements.newFontName.focus();
            this.elements.newFontName.select();
        }, 100);
    }

    // حفظ الاسم الجديد
    async saveEditedFontName() {
        const newName = this.elements.newFontName.value.trim();
        
        if (!newName) {
            showToast('يرجى إدخال اسم للخط', 'warning');
            this.elements.newFontName.classList.add('shake');
            setTimeout(() => this.elements.newFontName.classList.remove('shake'), 500);
            return;
        }
        
        const font = this.fonts.find(f => f.id === this.editingFontId);
        if (!font) return;
        
        try {
            // تحديث الاسم
            font.name = newName;
            
            // حفظ في قاعدة البيانات
            await this.db.updateFont(font);
            
            // تحديث العرض
            this.renderFontsList(this.fonts);
            this.updateFontSelect();
            
            // إغلاق النافذة
            closeModal('edit-font-modal');
            
            showToast('تم تحديث اسم الخط بنجاح ✏️', 'success');
        } catch (error) {
            console.error('❌ فشل تحديث اسم الخط:', error);
            showToast('فشل في تحديث اسم الخط', 'error');
        }
    }

    // تبديل المفضلة
    async toggleFavorite(fontId) {
        const font = this.fonts.find(f => f.id === fontId);
        if (!font) return;
        
        try {
            font.favorite = !font.favorite;
            await this.db.updateFont(font);
            
            // تحديث الزر
            const btn = document.querySelector(`[data-action="favorite"][data-font-id="${fontId}"]`);
            if (btn) {
                btn.classList.toggle('active', font.favorite);
                btn.querySelector('.material-symbols-rounded').textContent = 
                    font.favorite ? 'star' : 'star_border';
            }
            
            showToast(font.favorite ? 'تمت الإضافة للمفضلة ⭐' : 'تمت الإزالة من المفضلة', 'success');
        } catch (error) {
            console.error('❌ فشل تحديث المفضلة:', error);
        }
    }

    // حذف خط
    async deleteFont(fontId) {
        const font = this.fonts.find(f => f.id === fontId);
        if (!font) return;
        
        const confirmed = await showConfirm(
            'حذف الخط',
            `هل أنت متأكد من حذف الخط "${font.name}"؟`
        );
        
        if (!confirmed) return;
        
        try {
            // حذف من قاعدة البيانات
            await this.db.deleteFont(fontId);
            
            // إزالة من القائمة المحلية
            this.fonts = this.fonts.filter(f => f.id !== fontId);
            
            // إزالة FontFace
            this.loadedFontFaces.delete(fontId);
            
            // تحديث العرض
            this.renderFontsList(this.fonts);
            this.updateFontSelect();
            
            // إعادة تعيين الاختيار إذا كان هو المحذوف
            if (this.selectedFontId === fontId) {
                this.selectedFontId = null;
            }
            
            showToast('تم حذف الخط 🗑️', 'success');
        } catch (error) {
            console.error('❌ فشل حذف الخط:', error);
            showToast('فشل في حذف الخط', 'error');
        }
    }

    // البحث
    handleSearch(query) {
        const trimmedQuery = query.trim();
        
        // إظهار/إخفاء زر المسح
        this.elements.clearSearchBtn?.classList.toggle('hidden', !trimmedQuery);
        
        if (!trimmedQuery) {
            this.renderFontsList(this.fonts);
            return;
        }
        
        const filtered = this.fonts.filter(font => 
            font.name.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
            font.originalName.toLowerCase().includes(trimmedQuery.toLowerCase())
        );
        
        this.renderFontsList(filtered);
    }

    // تحديث قائمة الخطوط في المحرر
    updateFontSelect() {
        const select = this.elements.fontSelect;
        if (!select) return;
        
        // الاحتفاظ بالخيار الافتراضي
        const defaultOption = '<option value="default">الخط الافتراضي (Tajawal)</option>';
        
        // إضافة الخطوط المرفوعة
        const fontOptions = this.fonts.map(font => {
            const fontFamily = this.getFontFamily(font.id);
            return `<option value="${font.id}" style="font-family: '${fontFamily}'">${this.escapeHtml(font.name)}</option>`;
        }).join('');
        
        select.innerHTML = defaultOption + fontOptions;
    }

    // تصدير الخطوط
    async exportFonts() {
        try {
            const fonts = await this.db.getAllFonts();
            
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                fonts: fonts
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `font-studio-fonts-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('تم تصدير الخطوط بنجاح 📤', 'success');
        } catch (error) {
            console.error('❌ فشل تصدير الخطوط:', error);
            showToast('فشل في تصدير الخطوط', 'error');
        }
    }

    // استيراد الخطوط
    async importFonts(file) {
        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            
            if (!importData.fonts || !Array.isArray(importData.fonts)) {
                throw new Error('ملف غير صالح');
            }
            
            let importedCount = 0;
            
            for (const font of importData.fonts) {
                // إزالة الـ ID القديم
                delete font.id;
                font.dateAdded = new Date().toISOString();
                
                // إضافة الخط
                const id = await this.db.addFont(font);
                font.id = id;
                this.fonts.push(font);
                await this.loadFontFace(font);
                importedCount++;
            }
            
            this.renderFontsList(this.fonts);
            this.updateFontSelect();
            
            showToast(`تم استيراد ${importedCount} خط بنجاح 📥`, 'success');
        } catch (error) {
            console.error('❌ فشل استيراد الخطوط:', error);
            showToast('فشل في استيراد الخطوط - تأكد من صحة الملف', 'error');
        }
    }

    // حذف جميع الخطوط
    async clearAllFonts() {
        const confirmed = await showConfirm(
            'حذف جميع الخطوط',
            'هل أنت متأكد من حذف جميع الخطوط؟ هذا الإجراء لا يمكن التراجع عنه!'
        );
        
        if (!confirmed) return;
        
        try {
            await this.db.clearAllFonts();
            this.fonts = [];
            this.loadedFontFaces.clear();
            this.selectedFontId = null;
            
            this.renderFontsList(this.fonts);
            this.updateFontSelect();
            
            showToast('تم حذف جميع الخطوط', 'success');
        } catch (error) {
            console.error('❌ فشل حذف الخطوط:', error);
            showToast('فشل في حذف الخطوط', 'error');
        }
    }

    // ============================================
    // 🛠️ دوال مساعدة
    // ============================================

    // تنسيق حجم الملف
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // تنسيق التاريخ
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        // أقل من دقيقة
        if (diff < 60000) {
            return 'الآن';
        }
        
        // أقل من ساعة
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `منذ ${minutes} دقيقة`;
        }
        
        // أقل من يوم
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `منذ ${hours} ساعة`;
        }
        
        // أقل من أسبوع
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `منذ ${days} يوم`;
        }
        
        // تاريخ كامل
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // تهريب HTML لمنع XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // الحصول على جميع الخطوط
    getAllFonts() {
        return this.fonts;
    }

    // الحصول على خط بالـ ID
    getFontById(id) {
        return this.fonts.find(f => f.id === id);
    }
}

// ============================================
// 🚀 تهيئة مدير الخطوط
// ============================================

let fontsManager;

document.addEventListener('DOMContentLoaded', () => {
    fontsManager = new FontsManager();
    
    // جعله متاحاً عالمياً
    window.fontsManager = fontsManager;
});

// ============================================
// 📤 تصدير/استيراد من الإعدادات
// ============================================

document.getElementById('export-data-btn')?.addEventListener('click', () => {
    fontsManager?.exportFonts();
});

document.getElementById('import-data-btn')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            fontsManager?.importFonts(file);
        }
    };
    
    input.click();
});

document.getElementById('clear-data-btn')?.addEventListener('click', () => {
    fontsManager?.clearAllFonts();
});

// ============================================
// 🎨 CSS إضافي للخطوط المفضلة
// ============================================

const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .font-action-btn.favorite.active {
        background: linear-gradient(135deg, #f59e0b, #fbbf24) !important;
        color: white !important;
    }
    
    .font-action-btn.favorite.active:hover {
        background: linear-gradient(135deg, #d97706, #f59e0b) !important;
    }
    
    .font-item.selected .font-icon {
        background: linear-gradient(135deg, #10b981, #34d399);
    }
    
    .font-item:hover .font-preview {
        color: var(--primary);
    }
    
    /* أنيميشن عند إضافة خط جديد */
    .font-item {
        animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    /* تحسين عرض المعاينة */
    .font-preview {
        font-size: 1.1rem;
        letter-spacing: 0.5px;
        transition: color 0.2s ease;
    }
    
    /* Drag over effect */
    .drop-zone.drag-over .drop-icon {
        animation: bounce 0.5s ease infinite;
    }
    
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
`;

document.head.appendChild(additionalStyles);

// ============================================
// 🔧 دوال مساعدة إضافية
// ============================================

// التحقق من دعم المتصفح
function checkBrowserSupport() {
    const features = {
        indexedDB: 'indexedDB' in window,
        fontFace: 'FontFace' in window,
        fileReader: 'FileReader' in window
    };
    
    const unsupported = Object.entries(features)
        .filter(([, supported]) => !supported)
        .map(([feature]) => feature);
    
    if (unsupported.length > 0) {
        console.warn('⚠️ ميزات غير مدعومة:', unsupported);
        showToast('متصفحك لا يدعم بعض الميزات. يرجى استخدام متصفح حديث.', 'warning', 5000);
    }
    
    return unsupported.length === 0;
}

// فحص الدعم عند التحميل
document.addEventListener('DOMContentLoaded', checkBrowserSupport);

// ============================================
// 📱 دعم PWA - تثبيت التطبيق
// ============================================

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // يمكنك إظهار زر التثبيت هنا
    console.log('📱 التطبيق جاهز للتثبيت');
});

// تثبيت التطبيق
async function installApp() {
    if (!deferredPrompt) {
        showToast('التطبيق مثبت بالفعل أو غير متاح للتثبيت', 'info');
        return;
    }
    
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        showToast('تم تثبيت التطبيق بنجاح! 🎉', 'success');
    }
    
    deferredPrompt = null;
}

// جعل دالة التثبيت متاحة عالمياً
window.installApp = installApp;

console.log('✅ تم تحميل fonts-manager.js');