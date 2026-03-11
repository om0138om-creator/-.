/* ============================================
   🎨 Font Studio Pro - Image Editor
   ============================================
   محرر الصور المتقدم مع Canvas API
   ============================================ */

// ============================================
// 🖼️ فئة محرر الصور الرئيسية
// ============================================

class ImageEditor {
    constructor() {
        // الكانفاس
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // الصورة الأساسية
        this.baseImage = null;
        this.originalImageData = null;
        
        // طبقات النص
        this.textLayers = [];
        this.selectedLayerId = null;
        this.layerIdCounter = 0;
        
        // حالة السحب
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        
        // التكبير/التصغير
        this.zoom = 1;
        this.minZoom = 0.25;
        this.maxZoom = 4;
        
        // التعديلات
        this.adjustments = {
            brightness: 0,
            contrast: 0,
            saturation: 0
        };
        
        // الفلتر الحالي
        this.currentFilter = 'none';
        
        // التراجع والإعادة
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        
        // إعدادات النص الافتراضية
        this.defaultTextSettings = {
            content: 'نص جديد',
            fontFamily: 'Tajawal',
            fontSize: 48,
            color: '#ffffff',
            opacity: 100,
            align: 'center',
            bold: false,
            italic: false,
            underline: false,
            shadow: {
                enabled: false,
                x: 2,
                y: 2,
                blur: 4,
                color: '#000000'
            },
            stroke: {
                enabled: false,
                width: 2,
                color: '#000000'
            },
            rotation: 0,
            letterSpacing: 0,
            lineHeight: 1.2
        };
        
        // عناصر DOM
        this.cacheElements();
        
        // التهيئة
        this.init();
    }

    // تخزين مراجع عناصر DOM
    cacheElements() {
        this.elements = {
            // الكانفاس
            canvasContainer: document.getElementById('canvas-container'),
            canvasPlaceholder: document.getElementById('canvas-placeholder'),
            textControlsLayer: document.getElementById('text-controls-layer'),
            
            // رفع الصور
            uploadImageBtn: document.getElementById('upload-image-btn'),
            uploadPlaceholderBtn: document.getElementById('upload-image-placeholder-btn'),
            imageFileInput: document.getElementById('image-file-input'),
            cameraBtn: document.getElementById('camera-btn'),
            cameraInput: document.getElementById('camera-input'),
            
            // التكبير
            zoomIn: document.getElementById('zoom-in'),
            zoomOut: document.getElementById('zoom-out'),
            zoomFit: document.getElementById('zoom-fit'),
            zoomLevel: document.getElementById('zoom-level'),
            
            // تعديلات الصورة
            brightnessSlider: document.getElementById('brightness-slider'),
            brightnessValue: document.getElementById('brightness-value'),
            contrastSlider: document.getElementById('contrast-slider'),
            contrastValue: document.getElementById('contrast-value'),
            saturationSlider: document.getElementById('saturation-slider'),
            saturationValue: document.getElementById('saturation-value'),
            resetAdjustments: document.getElementById('reset-adjustments'),
            
            // النص
            addTextBtn: document.getElementById('add-text-btn'),
            textContent: document.getElementById('text-content'),
            fontSelect: document.getElementById('font-select'),
            fontSize: document.getElementById('font-size'),
            fontSizeSlider: document.getElementById('font-size-slider'),
            sizeIncrease: document.getElementById('size-increase'),
            sizeDecrease: document.getElementById('size-decrease'),
            textColor: document.getElementById('text-color'),
            textOpacity: document.getElementById('text-opacity'),
            opacityValue: document.getElementById('opacity-value'),
            
            // الظل
            shadowToggle: document.getElementById('shadow-toggle'),
            shadowOptions: document.getElementById('shadow-options'),
            shadowX: document.getElementById('shadow-x'),
            shadowY: document.getElementById('shadow-y'),
            shadowBlur: document.getElementById('shadow-blur'),
            shadowColor: document.getElementById('shadow-color'),
            
            // الحدود
            strokeToggle: document.getElementById('stroke-toggle'),
            strokeOptions: document.getElementById('stroke-options'),
            strokeWidth: document.getElementById('stroke-width'),
            strokeColor: document.getElementById('stroke-color'),
            
            // الدوران
            textRotation: document.getElementById('text-rotation'),
            rotationValue: document.getElementById('rotation-value'),
            
            // التباعد
            letterSpacing: document.getElementById('letter-spacing'),
            letterSpacingValue: document.getElementById('letter-spacing-value'),
            lineHeight: document.getElementById('line-height'),
            lineHeightValue: document.getElementById('line-height-value'),
            
            // الطبقات
            layersList: document.getElementById('layers-list'),
            emptyLayers: document.getElementById('empty-layers'),
            
            // شريط الأدوات
            undoBtn: document.getElementById('undo-btn'),
            redoBtn: document.getElementById('redo-btn'),
            deleteTextBtn: document.getElementById('delete-text-btn'),
            duplicateTextBtn: document.getElementById('duplicate-text-btn'),
            clearCanvasBtn: document.getElementById('clear-canvas-btn'),
            saveBtn: document.getElementById('save-btn'),
            shareBtn: document.getElementById('share-btn'),
            
            // نافذة الحفظ
            saveModal: document.getElementById('save-modal'),
            savePreviewImg: document.getElementById('save-preview-img'),
            saveFilename: document.getElementById('save-filename'),
            saveFormat: document.getElementById('save-format'),
            saveQuality: document.getElementById('save-quality'),
            qualityValue: document.getElementById('quality-value'),
            qualityGroup: document.getElementById('quality-group'),
            downloadBtn: document.getElementById('download-btn'),
            saveToGalleryBtn: document.getElementById('save-to-gallery-btn')
        };
    }

    // التهيئة
    init() {
        this.setupEventListeners();
        this.setupCanvasEvents();
        this.updateToolbarState();
        
        console.log('✅ تم تهيئة محرر الصور');
    }

    // ============================================
    // 🎯 إعداد مستمعي الأحداث
    // ============================================

    setupEventListeners() {
        // رفع الصور
        this.elements.uploadImageBtn?.addEventListener('click', () => {
            this.elements.imageFileInput.click();
        });

        this.elements.uploadPlaceholderBtn?.addEventListener('click', () => {
            this.elements.imageFileInput.click();
        });

        this.elements.imageFileInput?.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.loadImage(e.target.files[0]);
            }
        });

        // الكاميرا
        this.elements.cameraBtn?.addEventListener('click', () => {
            this.elements.cameraInput.click();
        });

        this.elements.cameraInput?.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.loadImage(e.target.files[0]);
            }
        });

        // التكبير
        this.elements.zoomIn?.addEventListener('click', () => this.zoomIn());
        this.elements.zoomOut?.addEventListener('click', () => this.zoomOut());
        this.elements.zoomFit?.addEventListener('click', () => this.zoomFit());

        // تعديلات الصورة
        this.elements.brightnessSlider?.addEventListener('input', (e) => {
            this.adjustments.brightness = parseInt(e.target.value);
            this.elements.brightnessValue.textContent = e.target.value;
            this.applyAdjustments();
        });

        this.elements.contrastSlider?.addEventListener('input', (e) => {
            this.adjustments.contrast = parseInt(e.target.value);
            this.elements.contrastValue.textContent = e.target.value;
            this.applyAdjustments();
        });

        this.elements.saturationSlider?.addEventListener('input', (e) => {
            this.adjustments.saturation = parseInt(e.target.value);
            this.elements.saturationValue.textContent = e.target.value;
            this.applyAdjustments();
        });

        this.elements.resetAdjustments?.addEventListener('click', () => {
            this.resetAdjustments();
        });

        // الفلاتر
        document.querySelectorAll('.filter-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.filter-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentFilter = item.dataset.filter;
                this.applyAdjustments();
            });
        });

        // إضافة نص
        this.elements.addTextBtn?.addEventListener('click', () => this.addTextLayer());

        // تحديث النص
        this.elements.textContent?.addEventListener('input', (e) => {
            this.updateSelectedLayer({ content: e.target.value });
        });

        // اختيار الخط
        this.elements.fontSelect?.addEventListener('change', (e) => {
            const value = e.target.value;
            let fontFamily = 'Tajawal';
            
            if (value !== 'default' && window.fontsManager) {
                fontFamily = window.fontsManager.getFontFamily(parseInt(value));
            }
            
            this.updateSelectedLayer({ fontFamily });
        });

        // حجم الخط
        this.elements.fontSize?.addEventListener('input', (e) => {
            const size = parseInt(e.target.value) || 48;
            this.elements.fontSizeSlider.value = size;
            this.updateSelectedLayer({ fontSize: size });
        });

        this.elements.fontSizeSlider?.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            this.elements.fontSize.value = size;
            this.updateSelectedLayer({ fontSize: size });
        });

        this.elements.sizeIncrease?.addEventListener('click', () => {
            const current = parseInt(this.elements.fontSize.value) || 48;
            const newSize = Math.min(current + 4, 500);
            this.elements.fontSize.value = newSize;
            this.elements.fontSizeSlider.value = newSize;
            this.updateSelectedLayer({ fontSize: newSize });
        });

        this.elements.sizeDecrease?.addEventListener('click', () => {
            const current = parseInt(this.elements.fontSize.value) || 48;
            const newSize = Math.max(current - 4, 8);
            this.elements.fontSize.value = newSize;
            this.elements.fontSizeSlider.value = newSize;
            this.updateSelectedLayer({ fontSize: newSize });
        });

        // لون النص
        this.elements.textColor?.addEventListener('input', (e) => {
            this.updateSelectedLayer({ color: e.target.value });
        });

        // ألوان مسبقة
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.dataset.color;
                this.elements.textColor.value = color;
                this.updateSelectedLayer({ color });
            });
        });

        // الشفافية
        this.elements.textOpacity?.addEventListener('input', (e) => {
            const opacity = parseInt(e.target.value);
            this.elements.opacityValue.textContent = `${opacity}%`;
            this.updateSelectedLayer({ opacity });
        });

        // الظل
        this.elements.shadowToggle?.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            this.elements.shadowOptions.classList.toggle('hidden', !enabled);
            this.updateSelectedLayer({ 
                shadow: { ...this.getSelectedLayer()?.shadow, enabled } 
            });
        });

        ['shadowX', 'shadowY', 'shadowBlur'].forEach(prop => {
            const element = this.elements[prop];
            const valueElement = document.getElementById(`${prop.replace('shadow', 'shadow-').toLowerCase()}-value`);
            
            element?.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (valueElement) valueElement.textContent = value;
                
                const shadowProp = prop.replace('shadow', '').toLowerCase();
                this.updateSelectedLayer({
                    shadow: { ...this.getSelectedLayer()?.shadow, [shadowProp]: value }
                });
            });
        });

        this.elements.shadowColor?.addEventListener('input', (e) => {
            this.updateSelectedLayer({
                shadow: { ...this.getSelectedLayer()?.shadow, color: e.target.value }
            });
        });

        // الحدود
        this.elements.strokeToggle?.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            this.elements.strokeOptions.classList.toggle('hidden', !enabled);
            this.updateSelectedLayer({
                stroke: { ...this.getSelectedLayer()?.stroke, enabled }
            });
        });

        this.elements.strokeWidth?.addEventListener('input', (e) => {
            const width = parseInt(e.target.value);
            document.getElementById('stroke-width-value').textContent = width;
            this.updateSelectedLayer({
                stroke: { ...this.getSelectedLayer()?.stroke, width }
            });
        });

        this.elements.strokeColor?.addEventListener('input', (e) => {
            this.updateSelectedLayer({
                stroke: { ...this.getSelectedLayer()?.stroke, color: e.target.value }
            });
        });

        // الدوران
        this.elements.textRotation?.addEventListener('input', (e) => {
            const rotation = parseInt(e.target.value);
            this.elements.rotationValue.textContent = `${rotation}°`;
            this.updateSelectedLayer({ rotation });
        });

        document.querySelectorAll('.preset-btn[data-rotation]').forEach(btn => {
            btn.addEventListener('click', () => {
                const rotation = parseInt(btn.dataset.rotation);
                this.elements.textRotation.value = rotation;
                this.elements.rotationValue.textContent = `${rotation}°`;
                this.updateSelectedLayer({ rotation });
            });
        });

        // المحاذاة
        document.querySelectorAll('.align-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateSelectedLayer({ align: btn.dataset.align });
            });
        });

        // التنسيق (عريض، مائل، تحته خط)
        document.getElementById('bold-btn')?.addEventListener('click', (e) => {
            e.target.closest('.format-btn').classList.toggle('active');
            const layer = this.getSelectedLayer();
            this.updateSelectedLayer({ bold: !layer?.bold });
        });

        document.getElementById('italic-btn')?.addEventListener('click', (e) => {
            e.target.closest('.format-btn').classList.toggle('active');
            const layer = this.getSelectedLayer();
            this.updateSelectedLayer({ italic: !layer?.italic });
        });

        document.getElementById('underline-btn')?.addEventListener('click', (e) => {
            e.target.closest('.format-btn').classList.toggle('active');
            const layer = this.getSelectedLayer();
            this.updateSelectedLayer({ underline: !layer?.underline });
        });

        // التباعد
        this.elements.letterSpacing?.addEventListener('input', (e) => {
            const spacing = parseInt(e.target.value);
            this.elements.letterSpacingValue.textContent = spacing;
            this.updateSelectedLayer({ letterSpacing: spacing });
        });

        this.elements.lineHeight?.addEventListener('input', (e) => {
            const height = parseFloat(e.target.value);
            this.elements.lineHeightValue.textContent = height.toFixed(1);
            this.updateSelectedLayer({ lineHeight: height });
        });

        // شريط الأدوات
        this.elements.undoBtn?.addEventListener('click', () => this.undo());
        this.elements.redoBtn?.addEventListener('click', () => this.redo());
        this.elements.deleteTextBtn?.addEventListener('click', () => this.deleteSelectedLayer());
        this.elements.duplicateTextBtn?.addEventListener('click', () => this.duplicateSelectedLayer());
        this.elements.clearCanvasBtn?.addEventListener('click', () => this.clearCanvas());
        this.elements.saveBtn?.addEventListener('click', () => this.openSaveModal());
        this.elements.shareBtn?.addEventListener('click', () => this.shareImage());

        // نافذة الحفظ
        this.elements.saveFormat?.addEventListener('change', (e) => {
            const isPNG = e.target.value === 'png';
            this.elements.qualityGroup.style.display = isPNG ? 'none' : 'block';
        });

        this.elements.saveQuality?.addEventListener('input', (e) => {
            this.elements.qualityValue.textContent = e.target.value;
        });

        this.elements.downloadBtn?.addEventListener('click', () => this.downloadImage());
        this.elements.saveToGalleryBtn?.addEventListener('click', () => this.saveToGallery());

        // اختصارات لوحة المفاتيح
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // الاستماع لاختيار خط من مدير الخطوط
        window.addEventListener('fontSelected', (e) => {
            const { fontId, fontFamily } = e.detail;
            this.elements.fontSelect.value = fontId;
            this.updateSelectedLayer({ fontFamily });
        });
    }

    // ============================================
    // 🖱️ أحداث الكانفاس (السحب والتحريك والتكبير بصباعين)
    // ============================================

    setupCanvasEvents() {
        const container = this.elements.canvasContainer;
        
        // الماوس
        container?.addEventListener('mousedown', (e) => this.handlePointerDown(e));
        document.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        document.addEventListener('mouseup', (e) => this.handlePointerUp(e));
        
        // اللمس المتعدد (للموبايل)
        container?.addEventListener('touchstart', (e) => this.handlePointerDown(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handlePointerMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handlePointerUp(e));
        
        // التكبير بالعجلة للكمبيوتر
        container?.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                this.setZoom(this.zoom + delta);
            }
        }, { passive: false });
    }

    // حساب المسافة بين صباعين
    getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    handlePointerDown(e) {
        if (!this.baseImage) return;
        
        // لو المستخدم حط صباعين على الشاشة (للتكبير والتصغير)
        if (e.touches && e.touches.length === 2) {
            this.isDragging = false; // نوقف السحب
            this.initialPinchDistance = this.getDistance(e.touches[0], e.touches[1]);
            
            const layer = this.getSelectedLayer();
            if (layer) {
                // لو محدد نص، هنحفظ حجمه عشان نكبره
                this.initialFontSize = layer.fontSize;
            } else {
                // لو مش محدد نص، هنحفظ زووم الصورة عشان نكبرها
                this.initialZoom = this.zoom;
            }
            e.preventDefault();
            return;
        }

        // لو صباع واحد (للسحب والتحديد)
        const pos = this.getPointerPosition(e);
        const layer = this.findLayerAtPosition(pos);
        
        if (layer) {
            this.selectLayer(layer.id);
            this.isDragging = true;
            this.dragOffset = {
                x: pos.x - layer.x,
                y: pos.y - layer.y
            };
        } else {
            this.deselectAll();
        }
        
        if (e.cancelable) e.preventDefault();
    }

    handlePointerMove(e) {
        if (!this.baseImage) return;

        // التكبير والتصغير بصباعين (Pinch to Zoom)
        if (e.touches && e.touches.length === 2 && this.initialPinchDistance) {
            const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
            const scale = currentDistance / this.initialPinchDistance;

            const layer = this.getSelectedLayer();
            if (layer && this.initialFontSize) {
                // تكبير وتصغير النص
                let newSize = this.initialFontSize * scale;
                newSize = Math.max(8, Math.min(newSize, 500)); // حدود الحجم
                
                if (this.elements.fontSize) this.elements.fontSize.value = Math.round(newSize);
                if (this.elements.fontSizeSlider) this.elements.fontSizeSlider.value = Math.round(newSize);
                this.updateSelectedLayer({ fontSize: Math.round(newSize) });
            } else if (this.initialZoom) {
                // تكبير وتصغير الصورة الخلفية
                this.setZoom(this.initialZoom * scale);
            }
            e.preventDefault();
            return;
        }

        // السحب بصباع واحد
        if (this.isDragging && this.selectedLayerId) {
            const pos = this.getPointerPosition(e);
            const layer = this.getSelectedLayer();
            
            if (layer) {
                layer.x = pos.x - this.dragOffset.x;
                layer.y = pos.y - this.dragOffset.y;
                this.render();
            }
            e.preventDefault();
        }
    }

    handlePointerUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.saveToHistory();
        }
        
        // إعادة تعيين حسابات الصباعين لو اترفعوا من الشاشة
        if (!e.touches || e.touches.length < 2) {
            this.initialPinchDistance = null;
            this.initialFontSize = null;
            this.initialZoom = null;
        }
    }

    getPointerPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return {
            x: (clientX - rect.left) / this.zoom,
            y: (clientY - rect.top) / this.zoom
        };
    }

    findLayerAtPosition(pos) {
        // البحث من الأعلى للأسفل
        for (let i = this.textLayers.length - 1; i >= 0; i--) {
            const layer = this.textLayers[i];
            const bounds = this.getLayerBounds(layer);
            
            if (pos.x >= bounds.x && pos.x <= bounds.x + bounds.width &&
                pos.y >= bounds.y && pos.y <= bounds.y + bounds.height) {
                return layer;
            }
        }
        return null;
    }

    getLayerBounds(layer) {
        this.ctx.save();
        this.ctx.font = this.buildFontString(layer);
        
        const lines = layer.content.split('\n');
        let maxWidth = 0;
        
        lines.forEach(line => {
            const metrics = this.ctx.measureText(line);
            maxWidth = Math.max(maxWidth, metrics.width);
        });
        
        const lineHeight = layer.fontSize * layer.lineHeight;
        const totalHeight = lineHeight * lines.length;
        
        this.ctx.restore();
        
        // تعديل حسب المحاذاة
        let x = layer.x;
        if (layer.align === 'center') {
            x -= maxWidth / 2;
        } else if (layer.align === 'left') {
            x -= maxWidth;
        }
        
        return {
            x: x - 10,
            y: layer.y - layer.fontSize - 10,
            width: maxWidth + 20,
            height: totalHeight + 20
        };
    }

    // ============================================
    // 🖼️ تحميل الصور
    // ============================================

    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    this.baseImage = img;
                    this.setupCanvas(img.width, img.height);
                    this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                    
                    // إخفاء placeholder
                    this.elements.canvasPlaceholder?.classList.add('hidden');
                    this.elements.textControlsLayer?.classList.remove('hidden');
                    
                    // ملائمة الصورة
                    this.zoomFit();
                    
                    // حفظ في التاريخ
                    this.saveToHistory();
                    
                    showToast('تم تحميل الصورة بنجاح 🖼️', 'success');
                    resolve(img);
                };
                
                img.onerror = () => {
                    showToast('فشل في تحميل الصورة', 'error');
                    reject(new Error('فشل تحميل الصورة'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    setupCanvas(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.render();
    }

    // ============================================
    // 🎨 الرسم والتصيير
    // ============================================

    render() {
        if (!this.baseImage) return;
        
        // مسح الكانفاس
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // رسم الصورة الأساسية
        this.ctx.drawImage(this.baseImage, 0, 0);
        
        // تطبيق الفلاتر
        this.applyFilters();
        
        // رسم طبقات النص
        this.textLayers.forEach(layer => this.renderTextLayer(layer));
        
        // رسم حدود التحديد
        if (this.selectedLayerId) {
            this.renderSelection();
        }
        
        // تحديث قائمة الطبقات
        this.renderLayersList();
    }

    renderTextLayer(layer) {
        this.ctx.save();
        
        // التحريك لموقع النص
        this.ctx.translate(layer.x, layer.y);
        
        // الدوران
        if (layer.rotation) {
            this.ctx.rotate((layer.rotation * Math.PI) / 180);
        }
        
        // الشفافية
        this.ctx.globalAlpha = layer.opacity / 100;
        
        // بناء سلسلة الخط
        this.ctx.font = this.buildFontString(layer);
        this.ctx.textAlign = layer.align;
        this.ctx.textBaseline = 'middle';
        
        // التباعد بين الحروف
        if (layer.letterSpacing) {
            this.ctx.letterSpacing = `${layer.letterSpacing}px`;
        }
        
        const lines = layer.content.split('\n');
        const lineHeight = layer.fontSize * layer.lineHeight;
        const startY = -((lines.length - 1) * lineHeight) / 2;
        
        lines.forEach((line, index) => {
            const y = startY + (index * lineHeight);
            
            // الظل
            if (layer.shadow?.enabled) {
                this.ctx.shadowOffsetX = layer.shadow.x;
                this.ctx.shadowOffsetY = layer.shadow.y;
                this.ctx.shadowBlur = layer.shadow.blur;
                this.ctx.shadowColor = layer.shadow.color;
            }
            
            // الحدود
            if (layer.stroke?.enabled) {
                this.ctx.strokeStyle = layer.stroke.color;
                this.ctx.lineWidth = layer.stroke.width;
                this.ctx.lineJoin = 'round';
                this.ctx.strokeText(line, 0, y);
            }
            
            // النص
            this.ctx.fillStyle = layer.color;
            this.ctx.fillText(line, 0, y);
            
            // إعادة تعيين الظل
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            this.ctx.shadowBlur = 0;
            
            // تحته خط
            if (layer.underline) {
                const metrics = this.ctx.measureText(line);
                const underlineY = y + layer.fontSize * 0.1;
                
                let startX = 0;
                if (layer.align === 'center') {
                    startX = -metrics.width / 2;
                } else if (layer.align === 'right') {
                    startX = 0;
                } else {
                    startX = -metrics.width;
                }
                
                this.ctx.beginPath();
                this.ctx.moveTo(startX, underlineY);
                this.ctx.lineTo(startX + metrics.width, underlineY);
                this.ctx.strokeStyle = layer.color;
                this.ctx.lineWidth = layer.fontSize * 0.05;
                this.ctx.stroke();
            }
        });
        
        this.ctx.restore();
    }

    buildFontString(layer) {
        let style = '';
        if (layer.italic) style += 'italic ';
        if (layer.bold) style += 'bold ';
        return `${style}${layer.fontSize}px "${layer.fontFamily}", "Tajawal", sans-serif`;
    }

    renderSelection() {
        const layer = this.getSelectedLayer();
        if (!layer) return;
        
        const bounds = this.getLayerBounds(layer);
        
        this.ctx.save();
        this.ctx.strokeStyle = '#6366f1';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        
        // مقابض التحجيم
        const handleSize = 10;
        this.ctx.fillStyle = '#6366f1';
        this.ctx.setLineDash([]);
        
        // الزوايا
        const corners = [
            { x: bounds.x, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y },
            { x: bounds.x, y: bounds.y + bounds.height },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height }
        ];
        
        corners.forEach(corner => {
            this.ctx.fillRect(
                corner.x - handleSize / 2,
                corner.y - handleSize / 2,
                handleSize,
                handleSize
            );
        });
        
        this.ctx.restore();
    }

    // ============================================
    // 📝 إدارة طبقات النص
    // ============================================

    addTextLayer(settings = {}) {
        if (!this.baseImage) {
            showToast('يرجى رفع صورة أولاً', 'warning');
            return;
        }
        
        const layer = {
            id: ++this.layerIdCounter,
            ...this.defaultTextSettings,
            ...settings,
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        };
        
        this.textLayers.push(layer);
        this.selectLayer(layer.id);
        this.saveToHistory();
        
        showToast('تمت إضافة نص جديد ✏️', 'success');
    }

    selectLayer(id) {
        this.selectedLayerId = id;
        this.updateTextControls();
        this.updateToolbarState();
        this.render();
    }

    deselectAll() {
        this.selectedLayerId = null;
        this.updateToolbarState();
        this.render();
    }

    getSelectedLayer() {
        return this.textLayers.find(l => l.id === this.selectedLayerId);
    }

    updateSelectedLayer(updates) {
        const layer = this.getSelectedLayer();
        if (!layer) return;
        
        Object.assign(layer, updates);
        this.render();
    }

    deleteSelectedLayer() {
        if (!this.selectedLayerId) return;
        
        this.textLayers = this.textLayers.filter(l => l.id !== this.selectedLayerId);
        this.selectedLayerId = null;
        this.updateToolbarState();
        this.saveToHistory();
        this.render();
        
        showToast('تم حذف النص 🗑️', 'success');
    }

    duplicateSelectedLayer() {
        const layer = this.getSelectedLayer();
        if (!layer) return;
        
        const newLayer = {
            ...JSON.parse(JSON.stringify(layer)),
            id: ++this.layerIdCounter,
            x: layer.x + 30,
            y: layer.y + 30
        };
        
        this.textLayers.push(newLayer);
        this.selectLayer(newLayer.id);
        this.saveToHistory();
        
        showToast('تم تكرار النص 📋', 'success');
    }

    updateTextControls() {
        const layer = this.getSelectedLayer();
        if (!layer) return;
        
        // تحديث عناصر التحكم
        if (this.elements.textContent) this.elements.textContent.value = layer.content;
        if (this.elements.fontSize) this.elements.fontSize.value = layer.fontSize;
        if (this.elements.fontSizeSlider) this.elements.fontSizeSlider.value = layer.fontSize;
        if (this.elements.textColor) this.elements.textColor.value = layer.color;
        if (this.elements.textOpacity) {
            this.elements.textOpacity.value = layer.opacity;
            this.elements.opacityValue.textContent = `${layer.opacity}%`;
        }
        if (this.elements.textRotation) {
            this.elements.textRotation.value = layer.rotation;
            this.elements.rotationValue.textContent = `${layer.rotation}°`;
        }
        
        // الظل
        if (this.elements.shadowToggle) {
            this.elements.shadowToggle.checked = layer.shadow?.enabled;
            this.elements.shadowOptions.classList.toggle('hidden', !layer.shadow?.enabled);
        }
        
        // الحدود
        if (this.elements.strokeToggle) {
            this.elements.strokeToggle.checked = layer.stroke?.enabled;
            this.elements.strokeOptions.classList.toggle('hidden', !layer.stroke?.enabled);
        }
        
        // المحاذاة
        document.querySelectorAll('.align-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.align === layer.align);
        });
        
        // التنسيق
        document.getElementById('bold-btn')?.closest('.format-btn')?.classList.toggle('active', layer.bold);
        document.getElementById('italic-btn')?.closest('.format-btn')?.classList.toggle('active', layer.italic);
        document.getElementById('underline-btn')?.closest('.format-btn')?.classList.toggle('active', layer.underline);
    }

    renderLayersList() {
        const container = this.elements.layersList;
        const emptyState = this.elements.emptyLayers;
        
        if (!container) return;
        
        if (this.textLayers.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        container.innerHTML = this.textLayers.map(layer => `
            <div class="layer-item ${layer.id === this.selectedLayerId ? 'selected' : ''}" 
                 data-layer-id="${layer.id}">
                <div class="layer-icon">
                    <span class="material-symbols-rounded">title</span>
                </div>
                <div class="layer-info">
                    <div class="layer-name">${this.truncateText(layer.content, 20)}</div>
                    <div class="layer-type">طبقة نص</div>
                </div>
                <div class="layer-actions">
                    <button class="layer-action-btn" data-action="visibility" title="إظهار/إخفاء">
                        <span class="material-symbols-rounded">visibility</span>
                    </button>
                    <button class="layer-action-btn delete" data-action="delete" title="حذف">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
        
        // إضافة مستمعي الأحداث
        container.querySelectorAll('.layer-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.layer-action-btn')) return;
                this.selectLayer(parseInt(item.dataset.layerId));
            });
            
            item.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
                this.selectedLayerId = parseInt(item.dataset.layerId);
                this.deleteSelectedLayer();
            });
        });
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // ============================================
    // 🎨 الفلاتر والتعديلات
    // ============================================

    applyAdjustments() {
        if (!this.baseImage) return;
        
        // إعادة رسم الصورة الأصلية
        this.ctx.drawImage(this.baseImage, 0, 0);
        
        // الحصول على بيانات الصورة
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        const brightness = this.adjustments.brightness;
        const contrast = (this.adjustments.contrast + 100) / 100;
        const saturation = (this.adjustments.saturation + 100) / 100;
        
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            
            // السطوع
            r += brightness;
            g += brightness;
            b += brightness;
            
            // التباين
            r = ((r - 128) * contrast) + 128;
            g = ((g - 128) * contrast) + 128;
            b = ((b - 128) * contrast) + 128;
            
            // التشبع
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gray + saturation * (r - gray);
            g = gray + saturation * (g - gray);
            b = gray + saturation * (b - gray);
            
            // تطبيق الفلتر
            [r, g, b] = this.applyFilterToPixel(r, g, b);
            
            // التأكد من النطاق الصحيح
            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        
        // إعادة رسم النصوص
        this.textLayers.forEach(layer => this.renderTextLayer(layer));
        if (this.selectedLayerId) this.renderSelection();
    }

    applyFilterToPixel(r, g, b) {
        switch (this.currentFilter) {
            case 'grayscale':
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                return [gray, gray, gray];
            
            case 'sepia':
                return [
                    Math.min(255, r * 0.393 + g * 0.769 + b * 0.189),
                    Math.min(255, r * 0.349 + g * 0.686 + b * 0.168),
                    Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
                ];
            
            case 'vintage':
                return [
                    Math.min(255, r * 0.9 + 20),
                    Math.min(255, g * 0.8 + 10),
                    Math.min(255, b * 0.7)
                ];
            
            case 'cold':
                return [r * 0.9, g, Math.min(255, b * 1.2)];
            
            case 'warm':
                return [Math.min(255, r * 1.2), g, b * 0.9];
            
            default:
                return [r, g, b];
        }
    }

    applyFilters() {
        // يتم تطبيقها في applyAdjustments
    }

    resetAdjustments() {
        this.adjustments = { brightness: 0, contrast: 0, saturation: 0 };
        this.currentFilter = 'none';
        
        // تحديث واجهة المستخدم
        if (this.elements.brightnessSlider) {
            this.elements.brightnessSlider.value = 0;
            this.elements.brightnessValue.textContent = '0';
        }
        if (this.elements.contrastSlider) {
            this.elements.contrastSlider.value = 0;
            this.elements.contrastValue.textContent = '0';
        }
        if (this.elements.saturationSlider) {
            this.elements.saturationSlider.value = 0;
            this.elements.saturationValue.textContent = '0';
        }
        
        document.querySelectorAll('.filter-item').forEach(item => {
            item.classList.toggle('active', item.dataset.filter === 'none');
        });
        
        this.render();
        showToast('تم إعادة التعيين', 'info');
    }

    // ============================================
    // 🔍 التكبير والتصغير
    // ============================================

    setZoom(value) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, value));
        this.canvas.style.transform = `scale(${this.zoom})`;
        this.elements.zoomLevel.textContent = `${Math.round(this.zoom * 100)}%`;
    }

    zoomIn() {
        this.setZoom(this.zoom + 0.25);
    }

    zoomOut() {
        this.setZoom(this.zoom - 0.25);
    }

    zoomFit() {
        if (!this.baseImage) return;
        
        const container = this.elements.canvasContainer;
        const containerWidth = container.clientWidth - 40;
        const containerHeight = container.clientHeight - 40;
        
        const scaleX = containerWidth / this.canvas.width;
        const scaleY = containerHeight / this.canvas.height;
        
        this.setZoom(Math.min(scaleX, scaleY, 1));
    }

    // ============================================
    // ↩️ التراجع والإعادة
    // ============================================

    saveToHistory() {
        // إزالة التاريخ بعد الموقع الحالي
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // حفظ الحالة الحالية
        const state = {
            textLayers: JSON.parse(JSON.stringify(this.textLayers)),
            adjustments: { ...this.adjustments },
            currentFilter: this.currentFilter
        };
        
        this.history.push(state);
        
        // الحد الأقصى للتاريخ
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
        
        this.updateToolbarState();
    }

    undo() {
        if (this.historyIndex <= 0) return;
        
        this.historyIndex--;
        this.restoreState(this.history[this.historyIndex]);
        this.updateToolbarState();
    }

    redo() {
        if (this.historyIndex >= this.history.length - 1) return;
        
        this.historyIndex++;
        this.restoreState(this.history[this.historyIndex]);
        this.updateToolbarState();
    }

    restoreState(state) {
        this.textLayers = JSON.parse(JSON.stringify(state.textLayers));
        this.adjustments = { ...state.adjustments };
        this.currentFilter = state.currentFilter;
        this.selectedLayerId = null;
        this.render();
    }

    updateToolbarState() {
        if (this.elements.undoBtn) {
            this.elements.undoBtn.disabled = this.historyIndex <= 0;
        }
        if (this.elements.redoBtn) {
            this.elements.redoBtn.disabled = this.historyIndex >= this.history.length - 1;
        }
        if (this.elements.deleteTextBtn) {
            this.elements.deleteTextBtn.disabled = !this.selectedLayerId;
        }
        if (this.elements.duplicateTextBtn) {
            this.elements.duplicateTextBtn.disabled = !this.selectedLayerId;
        }
    }

    // ============================================
    // 💾 الحفظ والتصدير
    // ============================================

    openSaveModal() {
        if (!this.baseImage) {
            showToast('لا توجد صورة للحفظ', 'warning');
            return;
        }
        
        // إلغاء التحديد لعدم ظهور حدود التحديد في الصورة
        const previousSelection = this.selectedLayerId;
        this.selectedLayerId = null;
        this.render();
        
        // إنشاء معاينة
        const previewUrl = this.canvas.toDataURL('image/png');
        this.elements.savePreviewImg.src = previewUrl;
        
        // إعادة التحديد
        this.selectedLayerId = previousSelection;
        this.render();
        
        // تعيين اسم افتراضي
        this.elements.saveFilename.value = `تصميم-${Date.now()}`;
        
        openModal('save-modal');
    }

    async downloadImage() {
        const format = this.elements.saveFormat.value;
        const quality = parseInt(this.elements.saveQuality.value) / 100;
        const filename = this.elements.saveFilename.value || 'تصميم';
        
        // إلغاء التحديد
        const previousSelection = this.selectedLayerId;
        this.selectedLayerId = null;
        this.render();
        
        // إنشاء الصورة
        let mimeType, extension;
        switch (format) {
            case 'jpeg':
                mimeType = 'image/jpeg';
                extension = 'jpg';
                break;
            case 'webp':
                mimeType = 'image/webp';
                extension = 'webp';
                break;
            default:
                mimeType = 'image/png';
                extension = 'png';
        }
        
        const dataUrl = this.canvas.toDataURL(mimeType, quality);
        
        // إعادة التحديد
        this.selectedLayerId = previousSelection;
        this.render();
        
        // تحميل الملف
        const link = document.createElement('a');
        link.download = `${filename}.${extension}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        closeModal('save-modal');
        showToast('تم تحميل الصورة بنجاح 📥', 'success');
    }

    async saveToGallery() {
        // إلغاء التحديد
        const previousSelection = this.selectedLayerId;
        this.selectedLayerId = null;
        this.render();
        
        const dataUrl = this.canvas.toDataURL('image/png');
        
        // إعادة التحديد
        this.selectedLayerId = previousSelection;
        this.render();
        
        // حفظ في localStorage (يمكن ترقيته لـ IndexedDB لاحقاً)
        const gallery = JSON.parse(localStorage.getItem('fontStudioGallery') || '[]');
        
        gallery.unshift({
            id: Date.now(),
            image: dataUrl,
            date: new Date().toISOString(),
            name: this.elements.saveFilename.value || 'تصميم'
        });
        
        // الحد الأقصى 50 صورة
        if (gallery.length > 50) {
            gallery.pop();
        }
        
        localStorage.setItem('fontStudioGallery', JSON.stringify(gallery));
        
        closeModal('save-modal');
        showToast('تم الحفظ في المعرض 🖼️', 'success');
        
        // تحديث صفحة المعرض
        this.loadGallery();
    }

    async shareImage() {
        if (!this.baseImage) {
            showToast('لا توجد صورة للمشاركة', 'warning');
            return;
        }
        
        // إلغاء التحديد
        const previousSelection = this.selectedLayerId;
        this.selectedLayerId = null;
        this.render();
        
        try {
            // تحويل الكانفاس إلى Blob
            const blob = await new Promise(resolve => {
                this.canvas.toBlob(resolve, 'image/png');
            });
            
            // إعادة التحديد
            this.selectedLayerId = previousSelection;
            this.render();
            
            if (navigator.share && navigator.canShare({ files: [new File([blob], 'design.png')] })) {
                const file = new File([blob], 'design.png', { type: 'image/png' });
                
                await navigator.share({
                    title: 'تصميمي من Font Studio',
                    text: 'شاهد تصميمي الجديد!',
                    files: [file]
                });
                
                showToast('تمت المشاركة بنجاح 🚀', 'success');
            } else {
                // Fallback: نسخ للحافظة
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                showToast('تم نسخ الصورة للحافظة 📋', 'success');
            }
        } catch (error) {
            console.error('فشل المشاركة:', error);
            showToast('فشل في المشاركة', 'error');
        }
    }

    clearCanvas() {
        showConfirm('مسح الكل', 'هل أنت متأكد من مسح جميع العناصر؟').then(confirmed => {
            if (confirmed) {
                this.textLayers = [];
                this.selectedLayerId = null;
                this.resetAdjustments();
                this.render();
                this.saveToHistory();
                showToast('تم مسح الكانفاس', 'success');
            }
        });
    }

    // ============================================
    // ⌨️ اختصارات لوحة المفاتيح
    // ============================================

    handleKeyboard(e) {
        // فقط عندما لا يكون هناك حقل نص مفعل
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const ctrl = e.ctrlKey || e.metaKey;
        
        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                if (this.selectedLayerId) {
                    e.preventDefault();
                    this.deleteSelectedLayer();
                }
                break;
            
            case 'z':
                if (ctrl && !e.shiftKey) {
                    e.preventDefault();
                    this.undo();
                } else if (ctrl && e.shiftKey) {
                    e.preventDefault();
                    this.redo();
                }
                break;
            
            case 'y':
                if (ctrl) {
                    e.preventDefault();
                    this.redo();
                }
                break;
            
            case 'd':
                if (ctrl) {
                    e.preventDefault();
                    this.duplicateSelectedLayer();
                }
                break;
            
            case 's':
                if (ctrl) {
                    e.preventDefault();
                    this.openSaveModal();
                }
                break;
            
            case 'Escape':
                this.deselectAll();
                break;
            
            case '+':
            case '=':
                if (ctrl) {
                    e.preventDefault();
                    this.zoomIn();
                }
                break;
            
            case '-':
                if (ctrl) {
                    e.preventDefault();
                    this.zoomOut();
                }
                break;
            
            case '0':
                if (ctrl) {
                    e.preventDefault();
                    this.zoomFit();
                }
                break;
        }
        
        // تحريك النص بالأسهم
        if (this.selectedLayerId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const layer = this.getSelectedLayer();
            const step = e.shiftKey ? 10 : 1;
            
            switch (e.key) {
                case 'ArrowUp':
                    layer.y -= step;
                    break;
                case 'ArrowDown':
                    layer.y += step;
                    break;
                case 'ArrowLeft':
                    layer.x += step; // RTL
                    break;
                case 'ArrowRight':
                    layer.x -= step; // RTL
                    break;
            }
            
            this.render();
        }
    }

    // ============================================
    // 🖼️ تحميل المعرض
    // ============================================

    loadGallery() {
        const gallery = JSON.parse(localStorage.getItem('fontStudioGallery') || '[]');
        const grid = document.getElementById('gallery-grid');
        const emptyState = document.getElementById('empty-gallery');
        
        if (!grid) return;
        
        if (gallery.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        grid.innerHTML = gallery.map(item => `
            <div class="gallery-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" loading="lazy">
                <div class="gallery-item-overlay">
                    <span class="gallery-item-date">${this.formatDate(item.date)}</span>
                </div>
            </div>
        `).join('');
        
        // إضافة مستمعي الأحداث
        grid.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                this.openGalleryPreview(parseInt(item.dataset.id));
            });
        });
    }

    openGalleryPreview(id) {
        const gallery = JSON.parse(localStorage.getItem('fontStudioGallery') || '[]');
        const item = gallery.find(i => i.id === id);
        
        if (!item) return;
        
        const previewImg = document.getElementById('gallery-preview-img');
        previewImg.src = item.image;
        
        openModal('gallery-preview-modal');
        
        // أزرار الإجراءات
        document.getElementById('gallery-download-btn').onclick = () => {
            const link = document.createElement('a');
            link.download = `${item.name}.png`;
            link.href = item.image;
            link.click();
            showToast('تم التحميل', 'success');
        };
        
        document.getElementById('gallery-delete-btn').onclick = async () => {
            const confirmed = await showConfirm('حذف الصورة', 'هل أنت متأكد؟');
            if (confirmed) {
                const newGallery = gallery.filter(i => i.id !== id);
                localStorage.setItem('fontStudioGallery', JSON.stringify(newGallery));
                closeModal('gallery-preview-modal');
                this.loadGallery();
                showToast('تم الحذف', 'success');
            }
        };
        
        document.getElementById('gallery-share-btn').onclick = async () => {
            try {
                const response = await fetch(item.image);
                const blob = await response.blob();
                
                if (navigator.share) {
                    const file = new File([blob], 'design.png', { type: 'image/png' });
                    await navigator.share({ files: [file] });
                }
            } catch (error) {
                showToast('فشل في المشاركة', 'error');
            }
        };
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// ============================================
// 🚀 تهيئة المحرر
// ============================================

let imageEditor;

document.addEventListener('DOMContentLoaded', () => {
    imageEditor = new ImageEditor();
    window.imageEditor = imageEditor;
    
    // تحميل المعرض
    imageEditor.loadGallery();
    
    // مسح المعرض
    document.getElementById('clear-gallery-btn')?.addEventListener('click', async () => {
        const confirmed = await showConfirm('مسح المعرض', 'سيتم حذف جميع الصور. هل أنت متأكد؟');
        if (confirmed) {
            localStorage.removeItem('fontStudioGallery');
            imageEditor.loadGallery();
            showToast('تم مسح المعرض', 'success');
        }
    });
});

// ============================================
// 📐 القوالب الجاهزة
// ============================================

const templates = [
    {
        id: 1,
        name: 'منشور انستقرام',
        category: 'social',
        width: 1080,
        height: 1080,
        icon: 'grid_view',
        gradient: 'linear-gradient(135deg, #667eea, #764ba2)'
    },
    {
        id: 2,
        name: 'ستوري',
        category: 'social',
        width: 1080,
        height: 1920,
        icon: 'stay_current_portrait',
        gradient: 'linear-gradient(135deg, #f093fb, #f5576c)'
    },
    {
        id: 3,
        name: 'غلاف فيسبوك',
        category: 'social',
        width: 820,
        height: 312,
        icon: 'panorama',
        gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)'
    },
    {
        id: 4,
        name: 'اقتباس ملهم',
        category: 'quotes',
        width: 1080,
        height: 1080,
        icon: 'format_quote',
        gradient: 'linear-gradient(135deg, #fa709a, #fee140)'
    },
    {
        id: 5,
        name: 'بطاقة أعمال',
        category: 'business',
        width: 1050,
        height: 600,
        icon: 'badge',
        gradient: 'linear-gradient(135deg, #30cfd0, #330867)'
    },
    {
        id: 6,
        name: 'دعوة شخصية',
        category: 'personal',
        width: 800,
        height: 1200,
        icon: 'celebration',
        gradient: 'linear-gradient(135deg, #a8edea, #fed6e3)'
    }
];

function loadTemplates(category = 'all') {
    const grid = document.getElementById('templates-grid');
    if (!grid) return;
    
    const filtered = category === 'all' 
        ? templates 
        : templates.filter(t => t.category === category);
    
    grid.innerHTML = filtered.map(template => `
        <div class="template-item" data-template-id="${template.id}" 
             style="background: ${template.gradient}">
            <div class="template-item-content">
                <span class="material-symbols-rounded">${template.icon}</span>
                <h4>${template.name}</h4>
            </div>
        </div>
    `).join('');
    
    // إضافة مستمعي الأحداث
    grid.querySelectorAll('.template-item').forEach(item => {
        item.addEventListener('click', () => {
            const templateId = parseInt(item.dataset.templateId);
            applyTemplate(templateId);
        });
    });
}

function applyTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template || !imageEditor) return;
    
    // إنشاء كانفاس بحجم القالب
    imageEditor.canvas.width = template.width;
    imageEditor.canvas.height = template.height;
    
    // رسم خلفية متدرجة
    const ctx = imageEditor.ctx;
    const gradient = ctx.createLinearGradient(0, 0, template.width, template.height);
    
    // استخراج ألوان التدرج
    const colors = template.gradient.match(/#[a-fA-F0-9]{6}/g);
    if (colors) {
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1] || colors[0]);
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, template.width, template.height);
    
    // حفظ كصورة أساسية
    const img = new Image();
    img.src = imageEditor.canvas.toDataURL();
    img.onload = () => {
        imageEditor.baseImage = img;
        imageEditor.elements.canvasPlaceholder?.classList.add('hidden');
        imageEditor.zoomFit();
        imageEditor.saveToHistory();
        
        // الانتقال للمحرر
        document.querySelector('[data-page="editor"]')?.click();
        
        showToast(`تم تطبيق قالب "${template.name}" 🎨`, 'success');
    };
}

// تحميل القوالب عند بدء التشغيل
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
    
    // تصفية القوالب
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadTemplates(btn.dataset.category);
        });
    });
});

console.log('✅ تم تحميل editor.js');
