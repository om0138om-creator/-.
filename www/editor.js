/**
 * ============================================
 * فونت ستوديو - محرر الصور
 * ============================================
 * محرر صور متكامل مع دعم اللمس المتعدد
 */

class ImageEditor {
    constructor() {
        // إعدادات Canvas
        this.canvas = null;
        this.ctx = null;
        this.canvasWrapper = null;
        
        // حالة الصورة
        this.image = null;
        this.imageLoaded = false;
        this.originalWidth = 0;
        this.originalHeight = 0;
        
        // حالة العرض
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.rotation = 0;
        
        // طبقات النص
        this.textLayers = [];
        this.selectedLayer = null;
        this.layerIdCounter = 0;
        
        // إعدادات النص الافتراضية
        this.textSettings = {
            color: '#ffffff',
            fontSize: 48,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'center',
            opacity: 1,
            shadowEnabled: false,
            shadowX: 2,
            shadowY: 2,
            shadowBlur: 5,
            shadowColor: '#000000',
            strokeEnabled: false,
            strokeWidth: 0,
            strokeColor: '#000000',
            letterSpacing: 0,
            lineHeight: 1.4
        };
        
        // حالة السحب
        this.isDragging = false;
        this.isResizing = false;
        this.isPinching = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.lastTouchDistance = 0;
        
        // سجل التراجع/الإعادة
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 30;
        
        // العناصر
        this.elements = {};
        
        // تهيئة
        this.init();
    }
    
    /**
     * تهيئة المحرر
     */
    init() {
        this.cacheElements();
        this.setupCanvas();
        this.bindEvents();
        this.initTheme();
        this.initSplashScreen();
        
        console.log('✅ ImageEditor initialized successfully');
    }
    
    /**
     * حفظ العناصر
     */
    cacheElements() {
        this.elements = {
            // الشاشة الرئيسية
            splashScreen: document.getElementById('splashScreen'),
            appContainer: document.getElementById('appContainer'),
            
            // Canvas
            canvasArea: document.getElementById('canvasArea'),
            canvasWrapper: document.getElementById('canvasWrapper'),
            mainCanvas: document.getElementById('mainCanvas'),
            textOverlay: document.getElementById('textOverlay'),
            emptyState: document.getElementById('emptyState'),
            
            // أزرار الصور
            uploadImageBtn: document.getElementById('uploadImageBtn'),
            createBlankBtn: document.getElementById('createBlankBtn'),
            imageInput: document.getElementById('imageInput'),
            
            // أزرار التحكم
            zoomInBtn: document.getElementById('zoomInBtn'),
            zoomOutBtn: document.getElementById('zoomOutBtn'),
            fitScreenBtn: document.getElementById('fitScreenBtn'),
            rotateCanvasBtn: document.getElementById('rotateCanvasBtn'),
            
            // التراجع والإعادة
            undoBtn: document.getElementById('undoBtn'),
            redoBtn: document.getElementById('redoBtn'),
            
            // شريط الأدوات
            toolBtns: document.querySelectorAll('.tool-btn'),
            
            // لوحات الأدوات
            textPanel: document.getElementById('textPanel'),
            fontsPanel: document.getElementById('fontsPanel'),
            colorPanel: document.getElementById('colorPanel'),
            effectsPanel: document.getElementById('effectsPanel'),
            shadowPanel: document.getElementById('shadowPanel'),
            strokePanel: document.getElementById('strokePanel'),
            opacityPanel: document.getElementById('opacityPanel'),
            layersPanel: document.getElementById('layersPanel'),
            
            // إدخال النص
            textInput: document.getElementById('textInput'),
            addTextBtn: document.getElementById('addTextBtn'),
            presetBtns: document.querySelectorAll('.preset-btn'),
            
            // الألوان
            colorPicker: document.getElementById('colorPicker'),
            colorPreview: document.getElementById('colorPreview'),
            colorPresets: document.querySelectorAll('.color-preset'),
            
            // الظل
            shadowX: document.getElementById('shadowX'),
            shadowY: document.getElementById('shadowY'),
            shadowBlur: document.getElementById('shadowBlur'),
            shadowColor: document.getElementById('shadowColor'),
            
            // الحدود
            strokeWidth: document.getElementById('strokeWidth'),
            strokeColor: document.getElementById('strokeColor'),
            
            // الشفافية
            opacitySlider: document.getElementById('opacitySlider'),
            opacityValue: document.getElementById('opacityValue'),
            opacityPreviewBox: document.getElementById('opacityPreviewBox'),
            
            // التأثيرات
            effectBtns: document.querySelectorAll('.effect-btn'),
            
            // الطبقات
            layersList: document.getElementById('layersList'),
            
            // الحفظ والتصدير
            saveExportBtn: document.getElementById('saveExportBtn'),
            exportModal: document.getElementById('exportModal'),
            exportFileName: document.getElementById('exportFileName'),
            qualityBtns: document.querySelectorAll('.quality-btn'),
            downloadImage: document.getElementById('downloadImage'),
            shareImage: document.getElementById('shareImage'),
            exportPreviewCanvas: document.getElementById('exportPreviewCanvas'),
            
            // مودال الحجم
            blankSizeModal: document.getElementById('blankSizeModal'),
            sizePresets: document.querySelectorAll('.size-preset'),
            customWidth: document.getElementById('customWidth'),
            customHeight: document.getElementById('customHeight'),
            applyCustomSize: document.getElementById('applyCustomSize'),
            
            // القائمة والسمة
            menuBtn: document.getElementById('menuBtn'),
            sideMenu: document.getElementById('sideMenu'),
            themeToggle: document.getElementById('themeToggle'),
            darkModeToggle: document.getElementById('darkModeToggle'),
            
            // التنقل
            menuItems: document.querySelectorAll('.menu-item'),
            pages: document.querySelectorAll('.page')
        };
        
        this.canvas = this.elements.mainCanvas;
        this.ctx = this.canvas?.getContext('2d');
        this.canvasWrapper = this.elements.canvasWrapper;
    }
    
    /**
     * إعداد Canvas
     */
    setupCanvas() {
        if (!this.canvas || !this.ctx) return;
        
        // إعدادات الرسم
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }
    
    /**
     * ربط جميع الأحداث
     */
    bindEvents() {
        // رفع الصور
        this.elements.uploadImageBtn?.addEventListener('click', () => this.elements.imageInput.click());
        this.elements.imageInput?.addEventListener('change', (e) => this.handleImageUpload(e.target.files[0]));
        
        // تصميم فارغ
        this.elements.createBlankBtn?.addEventListener('click', () => this.openBlankSizeModal());
        
        // أزرار التحكم في Canvas
        this.elements.zoomInBtn?.addEventListener('click', () => this.zoom(1.2));
        this.elements.zoomOutBtn?.addEventListener('click', () => this.zoom(0.8));
        this.elements.fitScreenBtn?.addEventListener('click', () => this.fitToScreen());
        this.elements.rotateCanvasBtn?.addEventListener('click', () => this.rotate(90));
        
        // التراجع والإعادة
        this.elements.undoBtn?.addEventListener('click', () => this.undo());
        this.elements.redoBtn?.addEventListener('click', () => this.redo());
        
        // شريط الأدوات
        this.elements.toolBtns?.forEach(btn => {
            btn.addEventListener('click', () => this.handleToolClick(btn.dataset.tool));
        });

        // ==========================================
        // 🚀 إضافة نص والكتابة الحية
        // ==========================================
        this.elements.addTextBtn?.addEventListener('click', () => {
            if (!this.selectedLayer) this.addText();
            this.elements.textPanel.classList.remove('active');
        });
        
        this.elements.textInput?.addEventListener('input', (e) => {
            const text = e.target.value;
            if (this.selectedLayer) {
                this.selectedLayer.text = text || ' ';
                this.renderTextOverlay();
            } else if (text.trim().length > 0) {
                this.addText();
            }
        });

        this.elements.textInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.elements.textPanel.classList.remove('active');
            }
        });
        
        // نصوص سريعة
        this.elements.presetBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.textInput.value = btn.dataset.text;
                if (this.selectedLayer) {
                    this.selectedLayer.text = btn.dataset.text;
                    this.renderTextOverlay();
                } else {
                    this.addText();
                }
            });
        });
        
        // الألوان والتأثيرات
        this.elements.colorPicker?.addEventListener('input', (e) => this.updateTextColor(e.target.value));
        this.elements.colorPresets?.forEach(preset => {
            preset.addEventListener('click', () => {
                this.updateTextColor(preset.dataset.color);
                this.elements.colorPicker.value = preset.dataset.color;
            });
        });
        
        this.elements.shadowX?.addEventListener('input', (e) => this.updateShadow('x', e.target.value));
        this.elements.shadowY?.addEventListener('input', (e) => this.updateShadow('y', e.target.value));
        this.elements.shadowBlur?.addEventListener('input', (e) => this.updateShadow('blur', e.target.value));
        this.elements.shadowColor?.addEventListener('input', (e) => this.updateShadow('color', e.target.value));
        this.elements.strokeWidth?.addEventListener('input', (e) => this.updateStroke('width', e.target.value));
        this.elements.strokeColor?.addEventListener('input', (e) => this.updateStroke('color', e.target.value));
        this.elements.opacitySlider?.addEventListener('input', (e) => this.updateOpacity(e.target.value));
        this.elements.effectBtns?.forEach(btn => btn.addEventListener('click', () => this.applyEffect(btn.dataset.effect)));
        
        // الحفظ والتصدير
        this.elements.saveExportBtn?.addEventListener('click', () => this.openExportModal());
        this.elements.qualityBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.qualityBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        this.elements.downloadImage?.addEventListener('click', () => this.downloadImage());
        this.elements.shareImage?.addEventListener('click', () => this.shareImage());
        
        this.elements.sizePresets?.forEach(preset => {
            preset.addEventListener('click', () => {
                this.createBlankCanvas(parseInt(preset.dataset.width), parseInt(preset.dataset.height));
                this.closeModal(this.elements.blankSizeModal);
            });
        });
        this.elements.applyCustomSize?.addEventListener('click', () => {
            this.createBlankCanvas(parseInt(this.elements.customWidth.value) || 1080, parseInt(this.elements.customHeight.value) || 1080);
            this.closeModal(this.elements.blankSizeModal);
        });
        
        // ==========================================
        // 🚀 القائمة الجانبية والتنقل (تم استرجاعها)
        // ==========================================
        this.elements.menuBtn?.addEventListener('click', () => {
            this.elements.sideMenu.classList.add('active');
        });
        this.elements.sideMenu?.querySelector('.menu-overlay')?.addEventListener('click', () => {
            this.elements.sideMenu.classList.remove('active');
        });
        
        this.elements.menuItems?.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateToPage(page);
            });
        });
        
        this.elements.themeToggle?.addEventListener('click', () => this.toggleTheme());
        this.elements.darkModeToggle?.addEventListener('change', (e) => this.setTheme(e.target.checked ? 'dark' : 'light'));
        
        // إغلاق المودالات
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(btn.closest('.modal')));
        });
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal);
            });
        });
        document.querySelectorAll('.sheet-close').forEach(btn => {
            btn.addEventListener('click', () => btn.closest('.bottom-sheet').classList.remove('active'));
        });
        
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // تفعيل اللمس على الشاشة بالكامل
        this.bindTouchEvents();
        window.addEventListener('fontSelected', (e) => this.handleFontSelected(e.detail.font));
    }

    /**
     * 🚀 ربط أحداث اللمس (تم تعديلها لالتقاط لمس الخلفية والصورة)
     */
    bindTouchEvents() {
        const wrapper = this.elements.canvasWrapper;
        if (!wrapper) return;
        
        // الماوس
        wrapper.addEventListener('mousedown', (e) => this.handlePointerDown(e));
        document.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        document.addEventListener('mouseup', (e) => this.handlePointerUp(e));
        
        // اللمس
        wrapper.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        wrapper.addEventListener('contextmenu', (e) => e.preventDefault());
    }
        
        // إضافة نص
        this.elements.addTextBtn?.addEventListener('click', () => {
            if (!this.selectedLayer) this.addText();
            this.elements.textPanel.classList.remove('active'); // إغلاق اللوحة
        });
        
        // 🚀 الكتابة الحية والتحديث الفوري (من ابتكار عمر سنجق)
        this.elements.textInput?.addEventListener('input', (e) => {
            const text = e.target.value;
            
            if (this.selectedLayer) {
                // لو في كلمة متحددة، تتغير فوراً مع كل حرف
                this.selectedLayer.text = text || ' ';
                this.renderTextOverlay();
            } else if (text.trim().length > 0) {
                // لو مفيش كلمة متحددة وبدأ يكتب، نضيف كلمة جديدة فوراً
                this.addText();
            }
        });

        // إغلاق اللوحة عند الضغط على Enter
        this.elements.textInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.elements.textPanel.classList.remove('active');
            }
        });

        
        // نصوص سريعة
        this.elements.presetBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.textInput.value = btn.dataset.text;
                this.addText();
            });
        });
        
        // الألوان
        this.elements.colorPicker?.addEventListener('input', (e) => {
            this.updateTextColor(e.target.value);
        });
        
        this.elements.colorPresets?.forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.dataset.color;
                this.updateTextColor(color);
                this.elements.colorPicker.value = color;
            });
        });
        
        // الظل
        this.elements.shadowX?.addEventListener('input', (e) => {
            this.updateShadow('x', e.target.value);
        });
        this.elements.shadowY?.addEventListener('input', (e) => {
            this.updateShadow('y', e.target.value);
        });
        this.elements.shadowBlur?.addEventListener('input', (e) => {
            this.updateShadow('blur', e.target.value);
        });
        this.elements.shadowColor?.addEventListener('input', (e) => {
            this.updateShadow('color', e.target.value);
        });
        
        // الحدود
        this.elements.strokeWidth?.addEventListener('input', (e) => {
            this.updateStroke('width', e.target.value);
        });
        this.elements.strokeColor?.addEventListener('input', (e) => {
            this.updateStroke('color', e.target.value);
        });
        
        // الشفافية
        this.elements.opacitySlider?.addEventListener('input', (e) => {
            this.updateOpacity(e.target.value);
        });
        
        // التأثيرات
        this.elements.effectBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyEffect(btn.dataset.effect);
            });
        });
        
        // الحفظ والتصدير
        this.elements.saveExportBtn?.addEventListener('click', () => {
            this.openExportModal();
        });
        
        this.elements.qualityBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.qualityBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        this.elements.downloadImage?.addEventListener('click', () => {
            this.downloadImage();
        });
        
        this.elements.shareImage?.addEventListener('click', () => {
            this.shareImage();
        });
        
        // مودال الحجم
        this.elements.sizePresets?.forEach(preset => {
            preset.addEventListener('click', () => {
                const width = parseInt(preset.dataset.width);
                const height = parseInt(preset.dataset.height);
                this.createBlankCanvas(width, height);
                this.closeModal(this.elements.blankSizeModal);
            });
        });
        
        this.elements.applyCustomSize?.addEventListener('click', () => {
            const width = parseInt(this.elements.customWidth.value) || 1080;
            const height = parseInt(this.elements.customHeight.value) || 1080;
            this.createBlankCanvas(width, height);
            this.closeModal(this.elements.blankSizeModal);
        });
        
        // القائمة الجانبية
        this.elements.menuBtn?.addEventListener('click', () => {
            this.elements.sideMenu.classList.add('active');
        });
        
        this.elements.sideMenu?.querySelector('.menu-overlay')?.addEventListener('click', () => {
            this.elements.sideMenu.classList.remove('active');
        });
        
        // التنقل بين الصفحات
        this.elements.menuItems?.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateToPage(page);
            });
        });
        
        // السمة
        this.elements.themeToggle?.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        this.elements.darkModeToggle?.addEventListener('change', (e) => {
            this.setTheme(e.target.checked ? 'dark' : 'light');
        });
        
        // إغلاق المودالات
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal(btn.closest('.modal'));
            });
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
        
        // إغلاق اللوحات
        document.querySelectorAll('.sheet-close').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.bottom-sheet').classList.remove('active');
            });
        });
        
        // أحداث لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
        
        // أحداث اللمس على Canvas
        this.bindTouchEvents();
        
        // الاستماع لاختيار الخط
        window.addEventListener('fontSelected', (e) => {
            this.handleFontSelected(e.detail.font);
        });
    }
    
    /**
     * ربط أحداث اللمس
     */
    bindTouchEvents() {
        const overlay = this.elements.textOverlay;
        if (!overlay) return;
        
        // Mouse events
        overlay.addEventListener('mousedown', (e) => this.handlePointerDown(e));
        document.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        document.addEventListener('mouseup', (e) => this.handlePointerUp(e));
        
        // Touch events
        overlay.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // منع القائمة السياقية
        overlay.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * معالجة رفع الصور
     */
    handleImageUpload(file) {
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            showToast('يرجى اختيار ملف صورة', 'error');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                this.loadImage(img);
                showToast('تم تحميل الصورة', 'success');
            };
            
            img.onerror = () => {
                showToast('فشل تحميل الصورة', 'error');
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
        
        // إعادة تعيين
        this.elements.imageInput.value = '';
    }
    
    /**
     * تحميل الصورة
     */
    loadImage(img) {
        this.image = img;
        this.originalWidth = img.width;
        this.originalHeight = img.height;
        this.imageLoaded = true;
        
        // إعداد Canvas
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        
        // رسم الصورة
        this.ctx.drawImage(img, 0, 0);
        
        // إظهار Canvas
        this.elements.emptyState?.classList.add('hidden');
        this.canvasWrapper?.classList.remove('hidden');
        
        // ملاءمة الشاشة
        this.fitToScreen();
        
        // إعادة تعيين الطبقات
        this.textLayers = [];
        this.selectedLayer = null;
        this.renderTextOverlay();
        
        // حفظ في السجل
        this.saveHistory();
    }
    
    /**
     * إنشاء Canvas فارغ
     */
    createBlankCanvas(width, height) {
        this.originalWidth = width;
        this.originalHeight = height;
        this.imageLoaded = true;
        this.image = null;
        
        // إعداد Canvas
        this.canvas.width = width;
        this.canvas.height = height;
        
        // ملء بلون أبيض
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, width, height);
        
        // إظهار Canvas
        this.elements.emptyState?.classList.add('hidden');
        this.canvasWrapper?.classList.remove('hidden');
        
        // ملاءمة الشاشة
        this.fitToScreen();
        
        // إعادة تعيين الطبقات
        this.textLayers = [];
        this.selectedLayer = null;
        this.renderTextOverlay();
        
        showToast('تم إنشاء تصميم جديد', 'success');
        this.saveHistory();
    }
    
    /**
     * التكبير/التصغير
     */
    zoom(factor) {
        this.scale *= factor;
        this.scale = Math.max(0.1, Math.min(5, this.scale));
        this.applyTransform();
    }
    
    /**
     * ملاءمة الشاشة
     */
    fitToScreen() {
        if (!this.canvasWrapper || !this.canvas) return;
        
        const containerWidth = this.elements.canvasArea.clientWidth - 40;
        const containerHeight = this.elements.canvasArea.clientHeight - 40;
        
        const scaleX = containerWidth / this.canvas.width;
        const scaleY = containerHeight / this.canvas.height;
        
        this.scale = Math.min(scaleX, scaleY, 1);
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.applyTransform();
    }
    
    /**
     * التدوير
     */
    rotate(degrees) {
        this.rotation = (this.rotation + degrees) % 360;
        this.applyTransform();
    }
    
    /**
     * تطبيق التحويل
     */
    applyTransform() {
        if (!this.canvasWrapper) return;
        
        this.canvasWrapper.style.transform = `
            translate(${this.offsetX}px, ${this.offsetY}px)
            scale(${this.scale})
            rotate(${this.rotation}deg)
        `;
    }
    
    /**
     * معالجة أدوات شريط الأدوات
     */
    handleToolClick(tool) {
        // إغلاق جميع اللوحات
        document.querySelectorAll('.bottom-sheet').forEach(sheet => {
            sheet.classList.remove('active');
        });
        
        switch (tool) {
            case 'image':
                this.elements.imageInput.click();
                break;
            case 'text':
                this.elements.textPanel.classList.add('active');
                this.elements.textInput.focus();
                break;
            case 'fonts':
                if (window.fontsManager) {
                    window.fontsManager.openFontsPanel();
                }
                break;
            case 'color':
                this.elements.colorPanel.classList.add('active');
                break;
            case 'effects':
                this.elements.effectsPanel.classList.add('active');
                break;
            case 'shadow':
                this.elements.shadowPanel.classList.add('active');
                this.textSettings.shadowEnabled = true;
                break;
            case 'stroke':
                this.elements.strokePanel.classList.add('active');
                break;
            case 'opacity':
                this.elements.opacityPanel.classList.add('active');
                break;
            case 'layers':
                this.elements.layersPanel.classList.add('active');
                this.renderLayersList();
                break;
            case 'stickers':
                showToast('قريباً: الملصقات', 'info');
                break;
        }
    }
    
    /**
     * إضافة نص
     */
    addText() {
        const text = this.elements.textInput?.value;
        if (!text || text.trim() === '') {
            return;
        }
        
        if (!this.imageLoaded) {
            showToast('يرجى تحميل صورة أولاً', 'warning');
            return;
        }
        
        const layer = {
            id: ++this.layerIdCounter,
            type: 'text',
            text: text,
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            ...JSON.parse(JSON.stringify(this.textSettings)),
            rotation: 0,
            scaleX: 1,
            scaleY: 1
        };
        
        // استخدام الخط المحدد
        if (window.fontsManager?.selectedFont) {
            layer.fontFamily = window.fontsManager.selectedFont.fontFamily;
            layer.fontName = window.fontsManager.selectedFont.name;
        }
        
        this.textLayers.push(layer);
        this.selectedLayer = layer;
        
        // تم مسح سطور إغلاق اللوحة ومسح النص بنجاح 🚀
        
        // تحديث العرض
        this.renderTextOverlay();
        this.renderLayersList();
        this.saveHistory();
    }
    
    /**
     * عرض طبقات النص
     */
    renderTextOverlay() {
        if (!this.elements.textOverlay) return;
        
        this.elements.textOverlay.innerHTML = '';
        
        this.textLayers.forEach(layer => {
            const element = this.createTextElement(layer);
            this.elements.textOverlay.appendChild(element);
        });
    }

    
    /**
     * إنشاء عنصر النص
     */
    createTextElement(layer) {
        const div = document.createElement('div');
        div.className = `text-layer ${this.selectedLayer?.id === layer.id ? 'selected' : ''}`;
        div.dataset.layerId = layer.id;
        
        // الموقع
        const scaleRatio = this.scale;
        const x = (layer.x / this.canvas.width) * 100;
        const y = (layer.y / this.canvas.height) * 100;
        
        div.style.cssText = `
            left: ${x}%;
            top: ${y}%;
            transform: translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scaleX}, ${layer.scaleY});
            font-family: '${layer.fontFamily}', Arial, sans-serif;
            font-size: ${layer.fontSize * scaleRatio}px;
            font-weight: ${layer.fontWeight};
            font-style: ${layer.fontStyle};
            color: ${layer.color};
            opacity: ${layer.opacity};
            text-align: ${layer.textAlign};
            letter-spacing: ${layer.letterSpacing}px;
            line-height: ${layer.lineHeight};
            white-space: pre-wrap;
            ${layer.shadowEnabled ? `text-shadow: ${layer.shadowX}px ${layer.shadowY}px ${layer.shadowBlur}px ${layer.shadowColor};` : ''}
            ${layer.strokeEnabled && layer.strokeWidth > 0 ? `-webkit-text-stroke: ${layer.strokeWidth}px ${layer.strokeColor};` : ''}
        `;
        
        div.textContent = layer.text;
        
        // أزرار التحكم
        const controls = document.createElement('div');
        controls.className = 'text-controls';
        controls.innerHTML = `
            <button class="text-control-btn" data-action="edit" title="تعديل">
                <i class="fas fa-pen"></i>
            </button>
            <button class="text-control-btn" data-action="duplicate" title="نسخ">
                <i class="fas fa-copy"></i>
            </button>
            <button class="text-control-btn delete" data-action="delete" title="حذف">
                <i class="fas fa-trash"></i>
            </button>
        `;
        div.appendChild(controls);
        
        // مقبض تغيير الحجم
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle bottom-right';
        div.appendChild(resizeHandle);
        
        // أحداث العنصر
        this.bindTextElementEvents(div, layer);
        
        return div;
    }
    
    /**
     * ربط أحداث عنصر النص
     */
    bindTextElementEvents(element, layer) {
        // اختيار العنصر
        element.addEventListener('click', (e) => {
            if (e.target.closest('.text-control-btn')) return;
            e.stopPropagation();
            this.selectLayer(layer.id);
        });
        
        // أزرار التحكم
        element.querySelectorAll('.text-control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                
                switch (action) {
                    case 'edit':
                        this.editLayer(layer.id);
                        break;
                    case 'duplicate':
                        this.duplicateLayer(layer.id);
                        break;
                    case 'delete':
                        this.deleteLayer(layer.id);
                        break;
                }
            });
        });
        
        // مقبض تغيير الحجم
        const resizeHandle = element.querySelector('.resize-handle');
        resizeHandle?.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startResize(e, layer);
        });
        resizeHandle?.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            this.startResize(e.touches[0], layer);
        }, { passive: false });
    }
    
    /**
     * اختيار طبقة
     */
    selectLayer(layerId) {
        const layer = this.textLayers.find(l => l.id === layerId);
        this.selectedLayer = layer;
        
        // تحديث العرض
        document.querySelectorAll('.text-layer').forEach(el => {
            el.classList.toggle('selected', parseInt(el.dataset.layerId) === layerId);
        });
        
        // تحديث الإعدادات
        if (layer) {
            this.updateSettingsUI(layer);
        }
    }
    
    /**
     * تحديث واجهة الإعدادات
     */
    updateSettingsUI(layer) {
        // اللون
        if (this.elements.colorPicker) {
            this.elements.colorPicker.value = layer.color;
        }
        if (this.elements.colorPreview) {
            this.elements.colorPreview.style.background = layer.color;
        }
        
        // الظل
        if (this.elements.shadowX) this.elements.shadowX.value = layer.shadowX;
        if (this.elements.shadowY) this.elements.shadowY.value = layer.shadowY;
        if (this.elements.shadowBlur) this.elements.shadowBlur.value = layer.shadowBlur;
        if (this.elements.shadowColor) this.elements.shadowColor.value = layer.shadowColor;
        
        // الحدود
        if (this.elements.strokeWidth) this.elements.strokeWidth.value = layer.strokeWidth;
        if (this.elements.strokeColor) this.elements.strokeColor.value = layer.strokeColor;
        
        // الشفافية
        if (this.elements.opacitySlider) {
            this.elements.opacitySlider.value = layer.opacity * 100;
            this.elements.opacityValue.textContent = Math.round(layer.opacity * 100) + '%';
        }
    }
    
    /**
     * تعديل طبقة
     */
    editLayer(layerId) {
        const layer = this.textLayers.find(l => l.id === layerId);
        if (!layer) return;
        
        // فتح لوحة النص السفلية فوراً
        this.elements.textPanel.classList.add('active');
        
        // نقل النص للمربع وتحديده
        if (this.elements.textInput) {
            this.elements.textInput.value = layer.text;
            this.elements.textInput.focus();
        }
    }

    
    /**
     * نسخ طبقة
     */
    duplicateLayer(layerId) {
        const layer = this.textLayers.find(l => l.id === layerId);
        if (!layer) return;
        
        const newLayer = {
            ...JSON.parse(JSON.stringify(layer)),
            id: ++this.layerIdCounter,
            x: layer.x + 20,
            y: layer.y + 20
        };
        
        this.textLayers.push(newLayer);
        this.selectedLayer = newLayer;
        this.renderTextOverlay();
        this.renderLayersList();
        this.saveHistory();
        
        showToast('تم نسخ النص', 'success');
    }
    
    /**
     * حذف طبقة
     */
    deleteLayer(layerId) {
        this.textLayers = this.textLayers.filter(l => l.id !== layerId);
        
        if (this.selectedLayer?.id === layerId) {
            this.selectedLayer = null;
        }
        
        this.renderTextOverlay();
        this.renderLayersList();
        this.saveHistory();
        
        showToast('تم حذف النص', 'success');
    }
    
    /**
     * تحديث لون النص
     */
    updateTextColor(color) {
        this.textSettings.color = color;
        
        if (this.elements.colorPreview) {
            this.elements.colorPreview.style.background = color;
        }
        
        if (this.selectedLayer) {
            this.selectedLayer.color = color;
            this.renderTextOverlay();
            this.saveHistory();
        }
    }
    
    /**
     * تحديث الظل
     */
    updateShadow(prop, value) {
        const updateValue = (prop === 'color') ? value : parseInt(value);
        
        // تحديث العرض
        const valueEl = document.getElementById(`shadow${prop.charAt(0).toUpperCase() + prop.slice(1)}Value`);
        if (valueEl && prop !== 'color') {
            valueEl.textContent = value + 'px';
        }
        
        this.textSettings[`shadow${prop.charAt(0).toUpperCase() + prop.slice(1)}`] = updateValue;
        this.textSettings.shadowEnabled = true;
        
        if (this.selectedLayer) {
            this.selectedLayer[`shadow${prop.charAt(0).toUpperCase() + prop.slice(1)}`] = updateValue;
            this.selectedLayer.shadowEnabled = true;
            this.renderTextOverlay();
        }
    }
    
    /**
     * تحديث الحدود
     */
    updateStroke(prop, value) {
        const updateValue = (prop === 'color') ? value : parseInt(value);
        
        // تحديث العرض
        if (prop === 'width') {
            const valueEl = document.getElementById('strokeWidthValue');
            if (valueEl) valueEl.textContent = value + 'px';
        }
        
        this.textSettings[`stroke${prop.charAt(0).toUpperCase() + prop.slice(1)}`] = updateValue;
        this.textSettings.strokeEnabled = true;
        
        if (this.selectedLayer) {
            this.selectedLayer[`stroke${prop.charAt(0).toUpperCase() + prop.slice(1)}`] = updateValue;
            this.selectedLayer.strokeEnabled = true;
            this.renderTextOverlay();
        }
    }
    
    /**
     * تحديث الشفافية
     */
    updateOpacity(value) {
        const opacity = parseInt(value) / 100;
        
        this.elements.opacityValue.textContent = value + '%';
        this.elements.opacityPreviewBox.style.opacity = opacity;
        
        this.textSettings.opacity = opacity;
        
        if (this.selectedLayer) {
            this.selectedLayer.opacity = opacity;
            this.renderTextOverlay();
        }
    }
    
    /**
     * تطبيق تأثير
     */
    applyEffect(effect) {
        // إزالة التنشيط من جميع الأزرار
        this.elements.effectBtns?.forEach(btn => btn.classList.remove('active'));
        
        // تنشيط الزر المحدد
        document.querySelector(`.effect-btn[data-effect="${effect}"]`)?.classList.add('active');
        
        switch (effect) {
            case 'bold':
                this.textSettings.fontWeight = this.textSettings.fontWeight === 'bold' ? 'normal' : 'bold';
                break;
            case 'italic':
                this.textSettings.fontStyle = this.textSettings.fontStyle === 'italic' ? 'normal' : 'italic';
                break;
            case 'underline':
                // لا يدعم CSS text-decoration على Canvas مباشرة
                break;
            case 'uppercase':
                if (this.selectedLayer) {
                    this.selectedLayer.text = this.selectedLayer.text.toUpperCase();
                }
                break;
            case 'glow':
                this.textSettings.shadowEnabled = true;
                this.textSettings.shadowX = 0;
                this.textSettings.shadowY = 0;
                this.textSettings.shadowBlur = 15;
                this.textSettings.shadowColor = this.textSettings.color;
                break;
            case 'none':
                this.textSettings.fontWeight = 'normal';
                this.textSettings.fontStyle = 'normal';
                this.textSettings.shadowEnabled = false;
                break;
        }
        
        if (this.selectedLayer) {
            Object.assign(this.selectedLayer, {
                fontWeight: this.textSettings.fontWeight,
                fontStyle: this.textSettings.fontStyle,
                shadowEnabled: this.textSettings.shadowEnabled,
                shadowX: this.textSettings.shadowX,
                shadowY: this.textSettings.shadowY,
                shadowBlur: this.textSettings.shadowBlur,
                shadowColor: this.textSettings.shadowColor
            });
            this.renderTextOverlay();
            this.saveHistory();
        }
    }
    
    /**
     * معالجة اختيار الخط
     */
    handleFontSelected(font) {
        this.textSettings.fontFamily = font.fontFamily;
        
        if (this.selectedLayer) {
            this.selectedLayer.fontFamily = font.fontFamily;
            this.selectedLayer.fontName = font.name;
            this.renderTextOverlay();
            this.saveHistory();
        }
    }
    
    /**
     * 🚀 معالجة بدء اللمس (بصباع أو صباعين)
     */
    handleTouchStart(e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            this.isPinching = true;
            this.lastTouchDistance = this.getTouchDistance(e.touches);
            
            // تحديد هل اللمس على النص ولا الخلفية بذكاء
            const target = (e.target && typeof e.target.closest === 'function') ? e.target.closest('.text-layer') : null;
            if (target && this.selectedLayer && parseInt(target.dataset.layerId) === this.selectedLayer.id) {
                this.isPinchingText = true; // تكبير النص
            } else {
                this.isPinchingText = false; // تكبير الصورة
            }
        } else if (e.touches.length === 1) {
            this.handlePointerDown(e.touches[0]);
        }
    }

    
    /**
     * 🚀 معالجة حركة اللمس (السحب أو التكبير) بسرعة البرق
     */
    handleTouchMove(e) {
        if (this.isPinching && e.touches.length === 2) {
            if (e.cancelable) e.preventDefault();
            const distance = this.getTouchDistance(e.touches);
            const scale = distance / this.lastTouchDistance;
            
            if (this.isPinchingText && this.selectedLayer) {
                // تكبير/تصغير النص المحدد بصباعين (سلاسة تامة)
                this.selectedLayer.fontSize *= scale;
                this.selectedLayer.fontSize = Math.max(8, Math.min(500, this.selectedLayer.fontSize));
                
                // تحديث مباشر للـ DOM بدون إعادة رسم
                const el = document.querySelector(`.text-layer[data-layer-id="${this.selectedLayer.id}"]`);
                if (el) {
                    el.style.fontSize = `${this.selectedLayer.fontSize * this.scale}px`;
                }
            } else {
                // تكبير/تصغير الصورة الخلفية
                this.zoom(scale);
            }
            
            this.lastTouchDistance = distance;
        } else if (e.touches.length === 1) {
            // منع التمرير الافتراضي للشاشة أثناء السحب
            if (e.cancelable) e.preventDefault(); 
            this.handlePointerMove(e.touches[0]);
        }
    }
    
    /**
     * معالجة انتهاء اللمس
     */
    handleTouchEnd(e) {
        if (this.isPinching) {
            this.isPinching = false;
            this.isPinchingText = false;
            this.saveHistory();
        }
        this.handlePointerUp(e);
    }
    
    /**
     * حساب المسافة بين نقطتي لمس
     */
    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * 🚀 معالجة بدء السحب بصباع واحد
     */
    handlePointerDown(e) {
        const target = e.target?.closest?.('.text-layer');
        
        if (target) {
            const layerId = parseInt(target.dataset.layerId);
            this.selectLayer(layerId);
            
            this.isDragging = true;
            this.dragStartX = e.clientX || e.touches?.[0]?.clientX;
            this.dragStartY = e.clientY || e.touches?.[0]?.clientY;
        } else {
            // إلغاء الاختيار عند النقر خارج النص وإغلاق اللوحات
            this.selectedLayer = null;
            document.querySelectorAll('.text-layer').forEach(el => el.classList.remove('selected'));
        }
    }
    
    /**
     * 🚀 السحب الناعم: معالجة حركة السحب
     */
    handlePointerMove(e) {
        if (!this.isDragging || !this.selectedLayer) return;
        
        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        
        const dx = clientX - this.dragStartX;
        const dy = clientY - this.dragStartY;
        
        // تحويل الإزاحة إلى إحداثيات Canvas مع مراعاة التكبير (zoom)
        const scaleFactor = 1 / this.scale;
        this.selectedLayer.x += dx * scaleFactor;
        this.selectedLayer.y += dy * scaleFactor;
        
        // تحديث نقطة البداية
        this.dragStartX = clientX;
        this.dragStartY = clientY;
        
        // تحديث مباشر للـ DOM لضمان سلاسة InShot (بدون ريندر كامل)
        const el = document.querySelector(`.text-layer[data-layer-id="${this.selectedLayer.id}"]`);
        if (el) {
            const x = (this.selectedLayer.x / this.canvas.width) * 100;
            const y = (this.selectedLayer.y / this.canvas.height) * 100;
            el.style.left = `${x}%`;
            el.style.top = `${y}%`;
        }
    }
    
    /**
     * معالجة انتهاء السحب
     */
    handlePointerUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.saveHistory();
        }
        this.isResizing = false;
    }
    
    /**
     * 🚀 السحب من الزاوية (المقبض) لتغيير الحجم بنعومة
     */
    startResize(e, layer) {
        this.isResizing = true;
        this.selectedLayer = layer;
        this.dragStartX = e.clientX || e.touches?.[0]?.clientX;
        this.dragStartY = e.clientY || e.touches?.[0]?.clientY;
        
        const moveHandler = (e) => {
            if (!this.isResizing) return;
            if (e.cancelable) e.preventDefault();
            
            const clientX = e.clientX || e.touches?.[0]?.clientX;
            const clientY = e.clientY || e.touches?.[0]?.clientY;
            
            const dx = clientX - this.dragStartX;
            const dy = clientY - this.dragStartY;
            
            const delta = Math.sqrt(dx * dx + dy * dy) * Math.sign(dx + dy);
            
            layer.fontSize += delta * 0.5;
            layer.fontSize = Math.max(8, Math.min(500, layer.fontSize));
            
            this.dragStartX = clientX;
            this.dragStartY = clientY;
            
            // تحديث الحجم مباشرة في الشاشة
            const el = document.querySelector(`.text-layer[data-layer-id="${layer.id}"]`);
            if (el) {
                el.style.fontSize = `${layer.fontSize * this.scale}px`;
            }
        };
        
        const upHandler = () => {
            this.isResizing = false;
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('touchmove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
            document.removeEventListener('touchend', upHandler);
            this.saveHistory();
        };
        
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('touchmove', moveHandler, { passive: false });
        document.addEventListener('mouseup', upHandler);
        document.addEventListener('touchend', upHandler);
    }

    
    /**
     * عرض قائمة الطبقات
     */
    renderLayersList() {
        if (!this.elements.layersList) return;
        
        if (this.textLayers.length === 0) {
            this.elements.layersList.innerHTML = `
                <div class="no-fonts-state">
                    <i class="fas fa-layer-group"></i>
                    <p>لا توجد طبقات</p>
                </div>
            `;
            return;
        }
        
        const html = [...this.textLayers].reverse().map(layer => `
            <div class="layer-item ${this.selectedLayer?.id === layer.id ? 'selected' : ''}" 
                 data-layer-id="${layer.id}">
                <div class="layer-preview" style="font-family: '${layer.fontFamily}'; color: ${layer.color}">
                    ${layer.text.substring(0, 5)}
                </div>
                <div class="layer-info">
                    <div class="layer-name">${layer.text.substring(0, 20)}${layer.text.length > 20 ? '...' : ''}</div>
                    <div class="layer-type">${layer.fontName || 'خط افتراضي'}</div>
                </div>
                <div class="layer-actions">
                    <button class="layer-action" data-action="up" title="للأعلى">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="layer-action" data-action="down" title="للأسفل">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    <button class="layer-action" data-action="delete" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        this.elements.layersList.innerHTML = html;
        
        // ربط الأحداث
        document.querySelectorAll('.layer-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.layer-action')) return;
                const layerId = parseInt(item.dataset.layerId);
                this.selectLayer(layerId);
                this.renderLayersList();
            });
        });
        
        document.querySelectorAll('.layer-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const layerId = parseInt(btn.closest('.layer-item').dataset.layerId);
                const action = btn.dataset.action;
                
                switch (action) {
                    case 'up':
                        this.moveLayerUp(layerId);
                        break;
                    case 'down':
                        this.moveLayerDown(layerId);
                        break;
                    case 'delete':
                        this.deleteLayer(layerId);
                        break;
                }
            });
        });
    }
    
    /**
     * تحريك الطبقة للأعلى
     */
    moveLayerUp(layerId) {
        const index = this.textLayers.findIndex(l => l.id === layerId);
        if (index < this.textLayers.length - 1) {
            [this.textLayers[index], this.textLayers[index + 1]] = 
            [this.textLayers[index + 1], this.textLayers[index]];
            this.renderTextOverlay();
            this.renderLayersList();
            this.saveHistory();
        }
    }
    
    /**
     * تحريك الطبقة للأسفل
     */
    moveLayerDown(layerId) {
        const index = this.textLayers.findIndex(l => l.id === layerId);
        if (index > 0) {
            [this.textLayers[index], this.textLayers[index - 1]] = 
            [this.textLayers[index - 1], this.textLayers[index]];
            this.renderTextOverlay();
            this.renderLayersList();
            this.saveHistory();
        }
    }
    
    /**
     * رسم النص على Canvas
     */
    renderFinalCanvas() {
        // إعادة رسم الصورة الأصلية
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.image) {
            this.ctx.drawImage(this.image, 0, 0);
        } else {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // رسم كل طبقة نص
        this.textLayers.forEach(layer => {
            this.ctx.save();
            
            // الانتقال إلى موقع النص
            this.ctx.translate(layer.x, layer.y);
            this.ctx.rotate(layer.rotation * Math.PI / 180);
            this.ctx.scale(layer.scaleX, layer.scaleY);
            
            // إعداد الخط
            this.ctx.font = `${layer.fontStyle} ${layer.fontWeight} ${layer.fontSize}px '${layer.fontFamily}'`;
            this.ctx.fillStyle = layer.color;
            this.ctx.globalAlpha = layer.opacity;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // الظل
            if (layer.shadowEnabled) {
                this.ctx.shadowOffsetX = layer.shadowX;
                this.ctx.shadowOffsetY = layer.shadowY;
                this.ctx.shadowBlur = layer.shadowBlur;
                this.ctx.shadowColor = layer.shadowColor;
            }
            
            // رسم النص
            const lines = layer.text.split('\n');
            const lineHeight = layer.fontSize * layer.lineHeight;
            const totalHeight = lines.length * lineHeight;
            
            lines.forEach((line, index) => {
                const y = -totalHeight / 2 + index * lineHeight + lineHeight / 2;
                
                // الحدود
                if (layer.strokeEnabled && layer.strokeWidth > 0) {
                    this.ctx.strokeStyle = layer.strokeColor;
                    this.ctx.lineWidth = layer.strokeWidth;
                    this.ctx.strokeText(line, 0, y);
                }
                
                this.ctx.fillText(line, 0, y);
            });
            
            this.ctx.restore();
        });
    }
    
    /**
     * فتح مودال التصدير
     */
    openExportModal() {
        if (!this.imageLoaded) {
            showToast('لا يوجد تصميم للحفظ', 'warning');
            return;
        }
        
        // رسم المعاينة
        this.renderFinalCanvas();
        
        const previewCanvas = this.elements.exportPreviewCanvas;
        const previewCtx = previewCanvas.getContext('2d');
        
        // حساب حجم المعاينة
        const maxSize = 300;
        const ratio = Math.min(maxSize / this.canvas.width, maxSize / this.canvas.height);
        previewCanvas.width = this.canvas.width * ratio;
        previewCanvas.height = this.canvas.height * ratio;
        
        previewCtx.drawImage(this.canvas, 0, 0, previewCanvas.width, previewCanvas.height);
        
        this.elements.exportModal.classList.add('active');
    }
    
    /**
     * تحميل الصورة
     */
    downloadImage() {
        this.renderFinalCanvas();
        
        const quality = parseFloat(document.querySelector('.quality-btn.active')?.dataset.quality || 0.85);
        const fileName = this.elements.exportFileName?.value || 'تصميمي';
        
        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = this.canvas.toDataURL('image/png', quality);
        link.click();
        
        this.closeModal(this.elements.exportModal);
        showToast('تم حفظ الصورة', 'success');
        
        // حفظ في المعرض
        this.saveToGallery();
    }
    
    /**
     * مشاركة الصورة
     */
    async shareImage() {
        if (!navigator.share) {
            showToast('المشاركة غير مدعومة', 'error');
            return;
        }
        
        this.renderFinalCanvas();
        
        try {
            const blob = await new Promise(resolve => {
                this.canvas.toBlob(resolve, 'image/png');
            });
            
            const file = new File([blob], 'design.png', { type: 'image/png' });
            
            await navigator.share({
                files: [file],
                title: 'تصميمي',
                text: 'تم إنشاؤه بواسطة فونت ستوديو'
            });
            
            this.closeModal(this.elements.exportModal);
            showToast('تمت المشاركة', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                showToast('فشلت المشاركة', 'error');
            }
        }
    }
    
    /**
     * حفظ في المعرض
     */
    saveToGallery() {
        const gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
        
        gallery.unshift({
            id: Date.now(),
            thumbnail: this.canvas.toDataURL('image/jpeg', 0.5),
            createdAt: Date.now()
        });
        
        // الاحتفاظ بآخر 50 تصميم
        if (gallery.length > 50) {
            gallery.pop();
        }
        
        localStorage.setItem('gallery', JSON.stringify(gallery));
    }
    
    /**
     * حفظ في السجل
     */
    saveHistory() {
        // إزالة السجلات بعد الموقع الحالي
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // حفظ الحالة الحالية
        const state = {
            textLayers: JSON.parse(JSON.stringify(this.textLayers)),
            imageData: this.image ? this.canvas.toDataURL() : null
        };
        
        this.history.push(state);
        this.historyIndex++;
        
        // تقليم السجل
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.historyIndex--;
        }
        
        this.updateHistoryButtons();
    }
    
    /**
     * التراجع
     */
    undo() {
        if (this.historyIndex <= 0) return;
        
        this.historyIndex--;
        this.restoreState(this.history[this.historyIndex]);
        this.updateHistoryButtons();
        showToast('تم التراجع', 'info');
    }
    
    /**
     * الإعادة
     */
    redo() {
        if (this.historyIndex >= this.history.length - 1) return;
        
        this.historyIndex++;
        this.restoreState(this.history[this.historyIndex]);
        this.updateHistoryButtons();
        showToast('تمت الإعادة', 'info');
    }
    
    /**
     * استعادة الحالة
     */
    restoreState(state) {
        this.textLayers = JSON.parse(JSON.stringify(state.textLayers));
        this.selectedLayer = null;
        this.renderTextOverlay();
        this.renderLayersList();
    }
    
    /**
     * تحديث أزرار السجل
     */
    updateHistoryButtons() {
        if (this.elements.undoBtn) {
            this.elements.undoBtn.disabled = this.historyIndex <= 0;
        }
        if (this.elements.redoBtn) {
            this.elements.redoBtn.disabled = this.historyIndex >= this.history.length - 1;
        }
    }
    
    /**
     * معالجة لوحة المفاتيح
     */
    handleKeyboard(e) {
        // Ctrl/Cmd + Z للتراجع
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
        }
        
        // Ctrl/Cmd + Shift + Z أو Ctrl/Cmd + Y للإعادة
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            this.redo();
        }
        
        // Delete لحذف الطبقة المحددة
        if (e.key === 'Delete' && this.selectedLayer) {
            this.deleteLayer(this.selectedLayer.id);
        }
        
        // Escape لإلغاء الاختيار
        if (e.key === 'Escape') {
            this.selectedLayer = null;
            this.renderTextOverlay();
            document.querySelectorAll('.bottom-sheet.active').forEach(sheet => {
                sheet.classList.remove('active');
            });
        }
    }
    
    /**
     * التنقل بين الصفحات
     */
    navigateToPage(pageName) {
        // تحديث القائمة
        this.elements.menuItems?.forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });
        
        // تحديث الصفحات
        this.elements.pages?.forEach(page => {
            page.classList.toggle('active', page.id === pageName + 'Page');
        });
        
        // إغلاق القائمة
        this.elements.sideMenu?.classList.remove('active');
        
        // تحديث خاص ببعض الصفحات
        if (pageName === 'fonts' && window.fontsManager) {
            window.fontsManager.renderFontsList();
        }
        
        if (pageName === 'gallery') {
            this.loadGallery();
        }
    }
    
    /**
     * تحميل المعرض
     */
    loadGallery() {
        const gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
        const grid = document.getElementById('galleryGrid');
        const empty = document.getElementById('emptyGallery');
        
        if (!grid) return;
        
        if (gallery.length === 0) {
            grid.innerHTML = '';
            empty?.classList.remove('hidden');
            return;
        }
        
        empty?.classList.add('hidden');
        
        grid.innerHTML = gallery.map(item => `
            <div class="gallery-item" data-id="${item.id}">
                <img src="${item.thumbnail}" alt="تصميم">
                <div class="gallery-item-overlay">
                    <div class="gallery-item-actions">
                        <button class="gallery-action" data-action="open" title="فتح">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <button class="gallery-action" data-action="delete" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // ربط الأحداث
        grid.querySelectorAll('.gallery-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.closest('.gallery-item').dataset.id);
                const action = btn.dataset.action;
                
                if (action === 'delete') {
                    this.deleteFromGallery(id);
                }
            });
        });
    }
    
    /**
     * حذف من المعرض
     */
    deleteFromGallery(id) {
        let gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
        gallery = gallery.filter(item => item.id !== id);
        localStorage.setItem('gallery', JSON.stringify(gallery));
        this.loadGallery();
        showToast('تم الحذف', 'success');
    }
    
    /**
     * فتح مودال الحجم
     */
    openBlankSizeModal() {
        this.elements.blankSizeModal?.classList.add('active');
    }
    
    /**
     * إغلاق مودال
     */
    closeModal(modal) {
        modal?.classList.remove('active');
    }
    
    /**
     * تهيئة السمة
     */
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }
    
    /**
     * تبديل السمة
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
    
    /**
     * تعيين السمة
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // تحديث الأيقونة
        const icon = this.elements.themeToggle?.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        // تحديث التوجل
        if (this.elements.darkModeToggle) {
            this.elements.darkModeToggle.checked = theme === 'dark';
        }
    }
    
    /**
     * شاشة البداية
     */
    initSplashScreen() {
        setTimeout(() => {
            this.elements.splashScreen?.classList.add('fade-out');
            this.elements.appContainer?.classList.remove('hidden');
            
            setTimeout(() => {
                this.elements.splashScreen?.remove();
            }, 500);
        }, 2500);
    }
}

// تهيئة المحرر
let editor;

document.addEventListener('DOMContentLoaded', () => {
    editor = new ImageEditor();
    window.editor = editor;
});
