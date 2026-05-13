/**
 * UI-Library - Bibliothèque d'effets UX/UI JavaScript
 * Utilisation de prototypes et classes constructeurs
 * 
 * @author Thibaut Lombard
 * @version 1.0.0
 */

(function(global) {
    'use strict';

    // ============================================================
    // UTILITAIRES
    // ============================================================
    
    const Utils = {
        extend: function(target, source) {
            for (let key in source) {
                if (source.hasOwnProperty(key)) {
                    target[key] = source[key];
                }
            }
            return target;
        },
        
        getCenter: function(element) {
            const rect = element.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        },
        
        pointInRect: function(x, y, rect) {
            return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        },
        
        generateId: function(prefix) {
            return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        },
        
        clamp: function(value, min, max) {
            return Math.min(Math.max(value, min), max);
        },
        
        lerp: function(start, end, t) {
            return start + (end - start) * t;
        }
    };

    // ============================================================
    // GESTIONNAIRE DE DRAG & DROP (Prototype)
    // ============================================================
    
    function DragManager(element, options) {
        this.element = element;
        this.options = Utils.extend({
            enabled: true,
            handle: null,
            onStart: function() {},
            onMove: function(x, y) {},
            onEnd: function() {}
        }, options || {});
        
        this._isDragging = false;
        this._offsetX = 0;
        this._offsetY = 0;
        this._startX = 0;
        this._startY = 0;
        
        this._bindEvents();
    }
    
    DragManager.prototype = {
        constructor: DragManager,
        
        _bindEvents: function() {
            const handle = this.options.handle || this.element;
            
            handle.addEventListener('mousedown', this._onMouseDown.bind(this));
            document.addEventListener('mousemove', this._onMouseMove.bind(this));
            document.addEventListener('mouseup', this._onMouseUp.bind(this));
            
            handle.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
            document.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
            document.addEventListener('touchend', this._onTouchEnd.bind(this));
        },
        
        _onMouseDown: function(e) {
            if (!this.options.enabled) return;
            e.preventDefault();
            this._startDrag(e.clientX, e.clientY);
        },
        
        _onTouchStart: function(e) {
            if (!this.options.enabled || e.touches.length !== 1) return;
            e.preventDefault();
            this._startDrag(e.touches[0].clientX, e.touches[0].clientY);
        },
        
        _startDrag: function(clientX, clientY) {
            this._isDragging = true;
            this.element.classList.add('dragging');
            
            const rect = this.element.getBoundingClientRect();
            this._offsetX = clientX - rect.left;
            this._offsetY = clientY - rect.top;
            this._startX = rect.left;
            this._startY = rect.top;
            
            this.element.style.position = 'fixed';
            this.element.style.left = rect.left + 'px';
            this.element.style.top = rect.top + 'px';
            this.element.style.bottom = 'auto';
            this.element.style.right = 'auto';
            
            this.options.onStart.call(this, rect.left, rect.top);
        },
        
        _onMouseMove: function(e) {
            if (!this._isDragging) return;
            e.preventDefault();
            this._drag(e.clientX, e.clientY);
        },
        
        _onTouchMove: function(e) {
            if (!this._isDragging || e.touches.length !== 1) return;
            e.preventDefault();
            this._drag(e.touches[0].clientX, e.touches[0].clientY);
        },
        
        _drag: function(clientX, clientY) {
            let newLeft = clientX - this._offsetX;
            let newTop = clientY - this._offsetY;
            
            const maxX = window.innerWidth - this.element.offsetWidth;
            const maxY = window.innerHeight - this.element.offsetHeight;
            
            newLeft = Utils.clamp(newLeft, 5, maxX - 5);
            newTop = Utils.clamp(newTop, 5, maxY - 5);
            
            this.element.style.left = newLeft + 'px';
            this.element.style.top = newTop + 'px';
            
            this.options.onMove.call(this, newLeft, newTop);
        },
        
        _onMouseUp: function() {
            this._stopDrag();
        },
        
        _onTouchEnd: function() {
            this._stopDrag();
        },
        
        _stopDrag: function() {
            if (this._isDragging) {
                this._isDragging = false;
                this.element.classList.remove('dragging');
                this.options.onEnd.call(this);
            }
        },
        
        setEnabled: function(enabled) {
            this.options.enabled = enabled;
            this.element.style.cursor = enabled ? 'grab' : 'pointer';
        },
        
        isDragging: function() {
            return this._isDragging;
        },
        
        getPosition: function() {
            const rect = this.element.getBoundingClientRect();
            return { left: rect.left, top: rect.top };
        },
        
        destroy: function() {
            const handle = this.options.handle || this.element;
            handle.removeEventListener('mousedown', this._onMouseDown.bind(this));
            document.removeEventListener('mousemove', this._onMouseMove.bind(this));
            document.removeEventListener('mouseup', this._onMouseUp.bind(this));
        }
    };

    // ============================================================
    // DÉTECTEUR DE POSITION ET DIRECTION (Module singleton)
    // ============================================================
    
    const PositionDetector = {
        getDirection: function(buttonRect, windowRect) {
            const bcx = buttonRect.left + buttonRect.width / 2;
            const bcy = buttonRect.top + buttonRect.height / 2;
            const wcx = windowRect.left + windowRect.width / 2;
            const wcy = windowRect.top + windowRect.height / 2;
            const dx = bcx - wcx;
            const dy = bcy - wcy;
            
            return Math.abs(dx) > Math.abs(dy) 
                ? (dx > 0 ? 'right' : 'left') 
                : (dy > 0 ? 'bottom' : 'top');
        },
        
        getClipPath: function(direction, progress) {
            const pinch = Math.min(progress * 1.1, 1) * 48;
            
            switch(direction) {
                case 'top':
                    return `polygon(${pinch}% 0%, ${100-pinch}% 0%, 100% 100%, 0% 100%)`;
                case 'bottom':
                    return `polygon(0% 0%, 100% 0%, ${100-pinch}% 100%, ${pinch}% 100%)`;
                case 'left':
                    return `polygon(0% ${pinch}%, 100% 0%, 100% 100%, 0% ${100-pinch}%)`;
                case 'right':
                    return `polygon(0% 0%, 100% ${pinch}%, 100% ${100-pinch}%, 0% 100%)`;
                default:
                    return 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
            }
        },
        
        getStartPosition: function(buttonRect, targetRect, direction) {
            const centerX = buttonRect.left + buttonRect.width / 2;
            const centerY = buttonRect.top + buttonRect.height / 2;
            
            switch(direction) {
                case 'top':
                    return { x: centerX - targetRect.width / 2, y: buttonRect.bottom };
                case 'bottom':
                    return { x: centerX - targetRect.width / 2, y: buttonRect.top - targetRect.height };
                case 'left':
                    return { x: buttonRect.right, y: centerY - targetRect.height / 2 };
                case 'right':
                    return { x: buttonRect.left - targetRect.width, y: centerY - targetRect.height / 2 };
                default:
                    return { x: buttonRect.left, y: buttonRect.top };
            }
        },
        
        getSkew: function(direction, intensity, progress) {
            const easing = 1 - Math.pow(progress, 1.2);
            
            switch(direction) {
                case 'right': return intensity * easing;
                case 'left': return -intensity * easing;
                case 'bottom': return intensity * 0.4 * easing;
                case 'top': return -intensity * 0.4 * easing;
                default: return 0;
            }
        }
    };

    // ============================================================
    // CONFIGURATION ANIMATION (Singleton avec prototype)
    // ============================================================
    
    function AnimationConfig() {
        this._duration = 700;
        this._skewIntensity = 50;
        this._glassEnabled = true;
    }
    
    AnimationConfig.prototype = {
        constructor: AnimationConfig,
        
        get duration() { return this._duration; },
        set duration(v) { this._duration = v; },
        
        get skewIntensity() { return this._skewIntensity; },
        set skewIntensity(v) { this._skewIntensity = v; },
        
        get glassEnabled() { return this._glassEnabled; },
        set glassEnabled(v) {
            this._glassEnabled = v;
            if (typeof document !== 'undefined') {
                document.body.classList.toggle('no-glass', !v);
            }
        }
    };
    
    AnimationConfig.getInstance = (function() {
        let instance = null;
        return function() {
            if (!instance) {
                instance = new AnimationConfig();
            }
            return instance;
        };
    })();

    // ============================================================
    // ANIMATEUR GENIE (Prototype)
    // ============================================================
    
    function GenieAnimator(config) {
        this.config = config || AnimationConfig.getInstance();
        this._activeStyleId = null;
    }
    
    GenieAnimator.prototype = {
        constructor: GenieAnimator,
        
        _clean: function() {
            if (this._activeStyleId) {
                const el = document.getElementById(this._activeStyleId);
                if (el) el.remove();
                this._activeStyleId = null;
            }
        },
        
        createMinimizeAnimation: function(buttonCenter, windowRect, direction) {
            this._clean();
            
            const styleId = Utils.generateId('genie-min');
            const style = document.createElement('style');
            style.id = styleId;
            
            const startX = windowRect.left + windowRect.width / 2;
            const startY = windowRect.top + windowRect.height / 2;
            const deltaX = buttonCenter.x - startX;
            const deltaY = buttonCenter.y - startY;
            const maxSkew = this.config.skewIntensity;
            
            let keyframes = '@keyframes genieMinimize {\n';
            const steps = [0, 0.08, 0.18, 0.3, 0.42, 0.54, 0.66, 0.77, 0.88, 0.95, 1];
            
            for (let i = 0; i < steps.length; i++) {
                const p = steps[i];
                const percent = Math.round(p * 100);
                const ease = Math.pow(p, 1.4);
                const tx = deltaX * ease;
                const ty = deltaY * ease;
                const sx = Math.max(1 - p * 1.15, 0.01);
                const sy = Math.max(1 - p * 1.35, 0.01);
                const skew = PositionDetector.getSkew(direction, maxSkew, p);
                
                keyframes += ` ${percent}% {
                    transform: translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${sx.toFixed(3)}, ${sy.toFixed(3)}) skew(${skew.toFixed(1)}deg);
                    clip-path: ${PositionDetector.getClipPath(direction, p)};
                    opacity: ${Math.max(1 - p * 1.2, 0).toFixed(3)};
                }\n`;
            }
            
            keyframes += '}';
            style.textContent = keyframes;
            document.head.appendChild(style);
            this._activeStyleId = styleId;
            
            return 'genieMinimize';
        },
        
        createRestoreAnimation: function(startCenter, targetRect, direction) {
            this._clean();
            
            const styleId = Utils.generateId('genie-res');
            const style = document.createElement('style');
            style.id = styleId;
            
            const targetCenterX = targetRect.left + targetRect.width / 2;
            const targetCenterY = targetRect.top + targetRect.height / 2;
            const deltaX = targetCenterX - startCenter.x;
            const deltaY = targetCenterY - startCenter.y;
            const maxSkew = this.config.skewIntensity;
            
            let keyframes = '@keyframes genieRestore {\n';
            const steps = [0, 0.05, 0.12, 0.23, 0.34, 0.46, 0.58, 0.70, 0.82, 0.92, 1];
            
            for (let i = 0; i < steps.length; i++) {
                const p = steps[i];
                const percent = Math.round(p * 100);
                const ease = Math.pow(p, 1.2);
                const tx = deltaX * ease;
                const ty = deltaY * ease;
                const sx = Math.min(p * 1.15, 1);
                const sy = Math.min(p * 1.35, 1);
                const skew = PositionDetector.getSkew(direction, maxSkew, 1 - p);
                
                keyframes += ` ${percent}% {
                    transform: translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${sx.toFixed(3)}, ${sy.toFixed(3)}) skew(${skew.toFixed(1)}deg);
                    clip-path: ${PositionDetector.getClipPath(direction, 1 - p)};
                    opacity: ${Math.min(p * 1.3, 1).toFixed(3)};
                }\n`;
            }
            
            keyframes += '}';
            style.textContent = keyframes;
            document.head.appendChild(style);
            this._activeStyleId = styleId;
            
            return 'genieRestore';
        },
        
        reset: function() {
            this._clean();
        }
    };

    // ============================================================
    // LAMPE MAGIQUE - CLASSE PRINCIPALE (Prototype)
    // ============================================================
    
    function LampeMagique(containerOrOptions) {
        if (typeof containerOrOptions === 'string') {
            this.container = document.querySelector(containerOrOptions);
            this.options = {};
        } else if (containerOrOptions instanceof HTMLElement) {
            this.container = containerOrOptions;
            this.options = {};
        } else if (typeof containerOrOptions === 'object') {
            this.options = containerOrOptions || {};
            this.container = this.options.container ? 
                (typeof this.options.container === 'string' ? 
                    document.querySelector(this.options.container) : 
                    this.options.container) :
                null;
        }
        
        if (!this.container) {
            console.error('UI-Library LampeMagique: Container requis non trouvé');
            return;
        }
        
        this.config = AnimationConfig.getInstance();
        this.animator = new GenieAnimator(this.config);
        
        this.windowEl = this.container.querySelector('.window') || this.container;
        this.titleBar = this.container.querySelector('.title-bar') || this.windowEl.querySelector('.title-bar');
        this.minimizeBtn = this.container.querySelector('.minimize-btn') || this.container.querySelector('#minimizeTrigger');
        
        this.isMinimized = false;
        this.isAnimating = false;
        this.buttonRect = null;
        this.windowRect = null;
        
        this._init();
    }
    
    LampeMagique.prototype = {
        constructor: LampeMagique,
        
        _init: function() {
            this.dragManager = new DragManager(this.windowEl, {
                handle: this.titleBar,
                onMove: this._onWindowMove.bind(this)
            });
            
            if (this.minimizeBtn) {
                this.minimizeBtn.addEventListener('click', this._onMinimizeClick.bind(this));
            }
            
            this._onWindowMove();
        },
        
        _onWindowMove: function() {
            this.windowRect = this.windowEl.getBoundingClientRect();
            if (this.minimizeBtn) {
                this.buttonRect = this.minimizeBtn.getBoundingClientRect();
            }
        },
        
        _onMinimizeClick: function(e) {
            e.stopPropagation();
            if (this.isAnimating) return;
            
            this.buttonRect = this.minimizeBtn.getBoundingClientRect();
            
            if (!this.isMinimized) {
                this.minimize();
            } else {
                this.restore();
            }
        },
        
        minimize: function() {
            if (this.isAnimating) return;
            this.isAnimating = true;
            
            this.buttonRect = this.minimizeBtn.getBoundingClientRect();
            this.windowRect = this.windowEl.getBoundingClientRect();
            
            const direction = PositionDetector.getDirection(this.buttonRect, this.windowRect);
            const buttonCenter = Utils.getCenter(this.minimizeBtn);
            
            const animationName = this.animator.createMinimizeAnimation(buttonCenter, this.windowRect, direction);
            
            this.windowEl.style.animation = `${animationName} ${this.config.duration}ms cubic-bezier(0.65, 0, 0.35, 1) forwards`;
            
            setTimeout(() => {
                this.windowEl.style.display = 'none';
                this.isMinimized = true;
                this.isAnimating = false;
                this.minimizeBtn.classList.add('restore-mode');
                this.animator.reset();
                this.windowEl.style.animation = '';
            }, this.config.duration);
        },
        
        restore: function() {
            if (this.isAnimating) return;
            this.isAnimating = true;
            
            this.buttonRect = this.minimizeBtn.getBoundingClientRect();
            this.windowEl.style.display = 'block';
            
            const targetRect = {
                width: this.windowEl.offsetWidth,
                height: this.windowEl.offsetHeight,
                left: parseFloat(this.windowEl.style.left) || this.windowEl.offsetLeft,
                top: parseFloat(this.windowEl.style.top) || this.windowEl.offsetTop
            };
            
            const direction = PositionDetector.getDirection(this.buttonRect, targetRect);
            const startCenter = {
                x: this.buttonRect.left + this.buttonRect.width / 2,
                y: this.buttonRect.top + this.buttonRect.height / 2
            };
            
            const animationName = this.animator.createRestoreAnimation(startCenter, targetRect, direction);
            
            this.windowEl.style.animation = `${animationName} ${this.config.duration}ms cubic-bezier(0.35, 0, 0.65, 1) forwards`;
            
            setTimeout(() => {
                this.isMinimized = false;
                this.isAnimating = false;
                this.minimizeBtn.classList.remove('restore-mode');
                this.animator.reset();
                this.windowEl.style.animation = '';
            }, this.config.duration);
        },
        
        setDuration: function(ms) {
            this.config.duration = ms;
        },
        
        setSkewIntensity: function(intensity) {
            this.config.skewIntensity = intensity;
        },
        
        setGlassEnabled: function(enabled) {
            this.config.glassEnabled = enabled;
        },
        
        destroy: function() {
            if (this.dragManager) this.dragManager.destroy();
            this.animator.reset();
        }
    };

    // ============================================================
    // FENÊTRE WOBBLY - CLASSE PRINCIPALE (Prototype)
    // ============================================================
    
    function WobblyWindow(element, options) {
        this.element = element;
        this.options = Utils.extend({
            springSpeed: 0.15,
            damping: 0.85,
            rotationFactor: 0.3,
            titleBarSelector: '.window-titlebar',
            onMaximize: function() {},
            onRestore: function() {},
            onClose: function() {}
        }, options || {});
        
        this.surface = this.element.querySelector('.window-surface') || this.element;
        this.titleBar = this.element.querySelector(this.options.titleBarSelector);
        
        this.isMaximized = false;
        this.normalState = { left: 0, top: 0, width: 0, height: 0 };
        
        this.currentSkewX = 0;
        this.currentSkewY = 0;
        this.currentRotate = 0;
        this.skewVelX = 0;
        this.skewVelY = 0;
        this.rotateVel = 0;
        
        this.dragOffset = { x: 0, y: 0 };
        this.lastPos = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        
        this._init();
    }
    
    WobblyWindow.prototype = {
        constructor: WobblyWindow,
        
        _init: function() {
            this._setupDrag();
            this._setupButtons();
            this._startAnimationLoop();
        },
        
        _setupDrag: function() {
            if (!this.titleBar) return;
            
            const handle = this.titleBar;
            
            handle.addEventListener('mousedown', this._onDragStart.bind(this));
            document.addEventListener('mousemove', this._onDragMove.bind(this));
            document.addEventListener('mouseup', this._onDragEnd.bind(this));
            
            handle.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
            document.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
            document.addEventListener('touchend', this._onDragEnd.bind(this));
        },
        
        _onDragStart: function(e) {
            if (this.isMaximized) return;
            e.preventDefault();
            
            const rect = this.element.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            this.lastPos.x = e.clientX;
            this.lastPos.y = e.clientY;
            this.velocity.x = 0;
            this.velocity.y = 0;
            
            this.element.classList.add('dragging');
        },
        
        _onDragMove: function(e) {
            if (this.isMaximized) return;
            if (!this.dragOffset.x && !this.dragOffset.y) return;
            
            e.preventDefault();
            
            const newX = e.clientX - this.dragOffset.x;
            const newY = e.clientY - this.dragOffset.y;
            
            this.velocity.x = e.clientX - this.lastPos.x;
            this.velocity.y = e.clientY - this.lastPos.y;
            
            this.lastPos.x = e.clientX;
            this.lastPos.y = e.clientY;
            
            this.element.style.left = newX + 'px';
            this.element.style.top = newY + 'px';
            
            this._applyWobble();
        },
        
        _onTouchStart: function(e) {
            if (this.isMaximized || e.touches.length !== 1) return;
            e.preventDefault();
            
            const rect = this.element.getBoundingClientRect();
            this.dragOffset.x = e.touches[0].clientX - rect.left;
            this.dragOffset.y = e.touches[0].clientY - rect.top;
            this.lastPos.x = e.touches[0].clientX;
            this.lastPos.y = e.touches[0].clientY;
            this.velocity.x = 0;
            this.velocity.y = 0;
            
            this.element.classList.add('dragging');
        },
        
        _onTouchMove: function(e) {
            if (this.isMaximized || e.touches.length !== 1) return;
            e.preventDefault();
            
            const newX = e.touches[0].clientX - this.dragOffset.x;
            const newY = e.touches[0].clientY - this.dragOffset.y;
            
            this.velocity.x = e.touches[0].clientX - this.lastPos.x;
            this.velocity.y = e.touches[0].clientY - this.lastPos.y;
            
            this.lastPos.x = e.touches[0].clientX;
            this.lastPos.y = e.touches[0].clientY;
            
            this.element.style.left = newX + 'px';
            this.element.style.top = newY + 'px';
            
            this._applyWobble();
        },
        
        _onDragEnd: function() {
            this.dragOffset.x = 0;
            this.dragOffset.y = 0;
            this.element.classList.remove('dragging');
        },
        
        _setupButtons: function() {
            const buttons = this.element.querySelectorAll('[data-action]');
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.getAttribute('data-action');
                    if (action === 'maximize') {
                        this.toggleMaximize();
                    } else if (action === 'close') {
                        this.options.onClose.call(this);
                    } else if (action === 'minimize') {
                        this.minimize();
                    }
                });
            });
        },
        
        toggleMaximize: function() {
            if (!this.isMaximized) {
                this.normalState = {
                    left: parseFloat(this.element.style.left) || this.element.offsetLeft,
                    top: parseFloat(this.element.style.top) || this.element.offsetTop,
                    width: this.element.offsetWidth,
                    height: this.element.offsetHeight
                };
                
                this.element.style.left = '0';
                this.element.style.top = '0';
                this.element.style.width = '100%';
                this.element.style.height = '100vh';
                this.isMaximized = true;
                
                this.options.onMaximize.call(this);
            } else {
                this.element.style.left = this.normalState.left + 'px';
                this.element.style.top = this.normalState.top + 'px';
                this.element.style.width = this.normalState.width + 'px';
                this.element.style.height = this.normalState.height + 'px';
                this.isMaximized = false;
                
                this.options.onRestore.call(this);
            }
        },
        
        minimize: function() {
            this.element.style.transition = 'all 0.3s ease';
            this.element.style.transform = 'scale(0.8) translateY(100vh)';
            this.element.style.opacity = '0';
            
            setTimeout(() => {
                this.element.style.display = 'none';
                this.element.style.transition = '';
            }, 300);
        },
        
        restore: function() {
            this.element.style.display = 'block';
            this.element.style.transition = 'all 0.3s ease';
            this.element.style.transform = 'scale(1) translateY(0)';
            this.element.style.opacity = '1';
            
            setTimeout(() => {
                this.element.style.transition = '';
            }, 300);
        },
        
        _applyWobble: function() {
            if (this.isMaximized) return;
            
            const vx = this.velocity.x * this.options.rotationFactor;
            const vy = this.velocity.y * this.options.rotationFactor;
            
            this.skewVelX += vx * 0.1;
            this.skewVelY += vy * 0.1;
            this.rotateVel += (vx - vy) * 0.05;
        },
        
        _updatePhysics: function() {
            const spring = this.options.springSpeed;
            const damping = this.options.damping;
            
            this.skewVelX += (0 - this.currentSkewX) * spring;
            this.skewVelY += (0 - this.currentSkewY) * spring;
            this.skewVelX *= damping;
            this.skewVelY *= damping;
            this.currentSkewX += this.skewVelX;
            this.currentSkewY += this.skewVelY;
            
            this.rotateVel += (0 - this.currentRotate) * spring * 0.5;
            this.rotateVel *= damping;
            this.currentRotate += this.rotateVel;
            
            this._render();
        },
        
        _render: function() {
            const transform = `
                skew(${this.currentSkewX.toFixed(2)}deg, ${this.currentSkewY.toFixed(2)}deg)
                rotate(${this.currentRotate.toFixed(2)}deg)
            `.trim();
            
            this.element.style.transform = transform;
        },
        
        _startAnimationLoop: function() {
            const loop = () => {
                this._updatePhysics();
                requestAnimationFrame(loop);
            };
            loop();
        },
        
        setParams: function(params) {
            if (params.springSpeed !== undefined) this.options.springSpeed = params.springSpeed;
            if (params.damping !== undefined) this.options.damping = params.damping;
            if (params.rotationFactor !== undefined) this.options.rotationFactor = params.rotationFactor;
        },
        
        destroy: function() {
            this.element.style.transform = '';
        }
    };

    // ============================================================
    // GESTIONNAIRE DE FENÊTRES WOBBLY (Prototype)
    // ============================================================
    
    function WobblyWindowManager(options) {
        this.options = Utils.extend({
            container: document.body,
            themeToggle: null,
            activePanel: null
        }, options || {});
        
        this.windows = [];
        this.activeWindow = null;
        this.isDarkTheme = true;
        
        this._init();
    }
    
    WobblyWindowManager.prototype = {
        constructor: WobblyWindowManager,
        
        _init: function() {
            this._setupThemeToggle();
            this._setupWindowFocus();
        },
        
        _setupThemeToggle: function() {
            if (!this.options.themeToggle) return;
            
            this.options.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        },
        
        toggleTheme: function() {
            this.isDarkTheme = !this.isDarkTheme;
            document.body.classList.toggle('theme-light', !this.isDarkTheme);
            document.body.classList.toggle('theme-dark', this.isDarkTheme);
            
            if (this.options.themeToggle) {
                this.options.themeToggle.textContent = this.isDarkTheme ? '🌓 THÈME CLAIR' : '🌙 THÈME SOMBRE';
            }
        },
        
        _setupWindowFocus: function() {
            const container = this.options.container;
            container.addEventListener('mousedown', (e) => {
                const windowEl = e.target.closest('.wobbly-window');
                if (windowEl) {
                    this.bringToFront(windowEl);
                }
            });
        },
        
        bringToFront: function(windowEl) {
            this.windows.forEach(w => {
                w.element.style.zIndex = '1';
            });
            
            const win = this.windows.find(w => w.element === windowEl);
            if (win) {
                win.element.style.zIndex = '100';
                this.activeWindow = win;
                
                if (this.options.activePanel) {
                    this.options.activePanel(win.winIndex || 0);
                }
            }
        },
        
        addWindow: function(element, options) {
            const win = new WobblyWindow(element, options);
            win.winIndex = this.windows.length;
            this.windows.push(win);
            return win;
        },
        
        getWindow: function(index) {
            return this.windows[index];
        },
        
        setActiveWindow: function(index) {
            if (this.windows[index]) {
                this.bringToFront(this.windows[index].element);
            }
        },
        
        destroy: function() {
            this.windows.forEach(win => win.destroy());
            this.windows = [];
        }
    };

    // ============================================================
    // EXPORT PUBLIC
    // ============================================================
    
    global.UILibrary = {
        Utils: Utils,
        DragManager: DragManager,
        PositionDetector: PositionDetector,
        AnimationConfig: AnimationConfig,
        GenieAnimator: GenieAnimator,
        LampeMagique: LampeMagique,
        WobblyWindow: WobblyWindow,
        WobblyWindowManager: WobblyWindowManager,
        
        createLampeMagique: function(container, options) {
            return new LampeMagique(Utils.extend({ container: container }, options));
        },
        
        createWobblyWindow: function(element, options) {
            return new WobblyWindow(element, options);
        },
        
        createWobblyWindowManager: function(options) {
            return new WobblyWindowManager(options);
        }
    };

})(typeof window !== 'undefined' ? window : this);
