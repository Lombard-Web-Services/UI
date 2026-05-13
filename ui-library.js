/**
 * UI-Library - Bibliothèque d'effets UX/UI JavaScript
 * Utilisation de prototypes et classes constructeurs
 * Lampe magique et windows wobble effects
 * @author Thibaut Lombard
 * @version 1.0.0
 */

(function(global) {
    'use strict';

    // ============================================================
    // UTILITAIRES NINJA
    // ============================================================
    
    const NinjaUtils = {
        // Étendre un objet avec un autre (shallow merge)
        extend: function(target, source) {
            for (let key in source) {
                if (source.hasOwnProperty(key)) {
                    target[key] = source[key];
                }
            }
            return target;
        },
        
        // Obtenir le centre d'un élément
        getCenter: function(element) {
            const rect = element.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        },
        
        // Vérifier si un point est dans un rectangle
        pointInRect: function(x, y, rect) {
            return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        },
        
        // Générer un ID unique
        generateId: function(prefix) {
            return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        },
        
        // Normaliser une valeur entre min et max
        clamp: function(value, min, max) {
            return Math.min(Math.max(value, min), max);
        },
        
        // Interpolation linéaire
        lerp: function(start, end, t) {
            return start + (end - start) * t;
        }
    };

    // ============================================================
    // GESTIONNAIRE DE DRAG & DROP (Prototype)
    // ============================================================
    
    function DragManager(element, options) {
        this.element = element;
        this.options = NinjaUtils.extend({
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
            
            // Limites de la fenêtre
            const maxX = window.innerWidth - this.element.offsetWidth;
            const maxY = window.innerHeight - this.element.offsetHeight;
            
            newLeft = NinjaUtils.clamp(newLeft, 5, maxX - 5);
            newTop = NinjaUtils.clamp(newTop, 5, maxY - 5);
            
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
    
    // Instance singleton
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
            
            const styleId = NinjaUtils.generateId('genie-min');
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
            
            const styleId = NinjaUtils.generateId('genie-res');
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
        // Support constructeur flexible
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
                document.body;
        } else {
            this.container = document.body;
            this.options = {};
        }
        
        // Configuration par défaut
        this.options = NinjaUtils.extend({
            duration: 700,
            skewIntensity: 50,
            glassEnabled: true,
            onMinimize: function() {},
            onRestore: function() {},
            debug: false
        }, this.options);
        
        this.window = null;
        this.button = null;
        this.isMinimized = false;
        this.isAnimating = false;
        this.savedPosition = null;
        
        this.config = AnimationConfig.getInstance();
        this.config.duration = this.options.duration;
        this.config.skewIntensity = this.options.skewIntensity;
        this.config.glassEnabled = this.options.glassEnabled;
        
        this.animator = new GenieAnimator(this.config);
        
        this._init();
    }
    
    LampeMagique.prototype = {
        constructor: LampeMagique,
        
        _init: function() {
            this.window = this.container.querySelector('.magic-window') || this.container;
            this.button = this.container.querySelector('.magic-button');
            this.debugEl = this.container.querySelector('.debug-info');
            
            if (!this.button) {
                console.warn('LampeMagique: Bouton non trouvé');
                return;
            }
            
            this._initDrag();
            this._initEvents();
            this._initWindowPosition();
            
            if (this.options.debug) {
                this._debug('✅ Lampe Magique initialisée');
            }
        },
        
        _initDrag: function() {
            const titleBar = this.window.querySelector('.title-bar') || this.window;
            
            this.windowDrag = new DragManager(this.window, {
                handle: titleBar,
                onMove: function(x, y) {
                    this.savedPosition = {
                        left: x, 
                        top: y,
                        width: this.window.offsetWidth,
                        height: this.window.offsetHeight
                    };
                }.bind(this)
            });
            this.windowDrag.setEnabled(true);
            
            this.buttonDrag = new DragManager(this.button, {
                onEnd: function() {
                    if (this.options.debug) this._debug('✅ Bouton repositionné');
                }.bind(this)
            });
        },
        
        _initEvents: function() {
            this.button.addEventListener('click', function(e) {
                if (this.buttonDrag.isDragging()) return;
                this.toggle();
            }.bind(this));
            
            const minimizeTrigger = this.window.querySelector('.minimize-trigger');
            if (minimizeTrigger) {
                minimizeTrigger.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (!this.isMinimized && !this.isAnimating) this.minimize();
                }.bind(this));
            }
            
            const titleBar = this.window.querySelector('.title-bar');
            if (titleBar) {
                titleBar.addEventListener('dblclick', function() {
                    if (!this.isAnimating) this.toggle();
                }.bind(this));
            }
            
            const closeBtn = this.window.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    if (this.options.onClose) {
                        this.options.onClose.call(this);
                    }
                }.bind(this));
            }
            
            window.addEventListener('resize', this._onResize.bind(this));
        },
        
        _initWindowPosition: function() {
            if (!this.savedPosition) {
                const left = (window.innerWidth - this.window.offsetWidth) / 2;
                const top = (window.innerHeight - this.window.offsetHeight) / 2;
                this.window.style.left = left + 'px';
                this.window.style.top = top + 'px';
                this.savedPosition = { 
                    left: left, 
                    top: top, 
                    width: this.window.offsetWidth, 
                    height: this.window.offsetHeight 
                };
            }
        },
        
        _onResize: function() {
            if (!this.isMinimized && !this.isAnimating && this.savedPosition) {
                const left = Math.min(this.savedPosition.left, window.innerWidth - this.savedPosition.width - 10);
                const top = Math.min(this.savedPosition.top, window.innerHeight - this.savedPosition.height - 10);
                this.window.style.left = Math.max(5, left) + 'px';
                this.window.style.top = Math.max(5, top) + 'px';
            }
        },
        
        _getButtonCenter: function() {
            const r = this.button.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        },
        
        minimize: function() {
            if (this.isMinimized || this.isAnimating) return;
            this.isAnimating = true;
            
            const winRect = this.window.getBoundingClientRect();
            this.savedPosition = {
                left: winRect.left, 
                top: winRect.top,
                width: winRect.width, 
                height: winRect.height
            };
            
            const btnCenter = this._getButtonCenter();
            const btnRect = this.button.getBoundingClientRect();
            const direction = PositionDetector.getDirection(btnRect, winRect);
            
            if (this.options.debug) {
                this._debug(`🧞 Minimisation direction: ${direction.toUpperCase()}`);
            }
            
            this.window.style.position = 'fixed';
            this.window.style.left = winRect.left + 'px';
            this.window.style.top = winRect.top + 'px';
            this.window.style.width = winRect.width + 'px';
            this.window.style.height = winRect.height + 'px';
            this.window.style.zIndex = '1000';
            
            this.windowDrag.setEnabled(false);
            this.buttonDrag.setEnabled(false);
            
            const animName = this.animator.createMinimizeAnimation(btnCenter, winRect, direction);
            this.window.style.animation = `${animName} ${this.config.duration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`;
            
            const onEnd = function() {
                this.window.removeEventListener('animationend', onEnd);
                this.window.style.display = 'none';
                this.window.style.visibility = 'hidden';
                this.animator.reset();
                this.isAnimating = false;
                this.isMinimized = true;
                
                if (this.options.onMinimize) {
                    this.options.onMinimize.call(this);
                }
                
                if (this.options.debug) {
                    this._debug(`✅ Minimisé - Direction: ${direction.toUpperCase()}`);
                }
            }.bind(this);
            
            this.window.addEventListener('animationend', onEnd, { once: true });
            setTimeout(function() { 
                if (this.isAnimating) onEnd(); 
            }.bind(this), this.config.duration + 100);
        },
        
        restore: function() {
            if (!this.isMinimized || this.isAnimating) return;
            this.isAnimating = true;
            
            const btnRect = this.button.getBoundingClientRect();
            const target = this.savedPosition || {
                left: (window.innerWidth - this.window.offsetWidth) / 2,
                top: (window.innerHeight - this.window.offsetHeight) / 2,
                width: this.window.offsetWidth, 
                height: this.window.offsetHeight
            };
            
            const direction = PositionDetector.getDirection(btnRect, target);
            const startPos = PositionDetector.getStartPosition(btnRect, target, direction);
            const startCenter = {
                x: startPos.x + target.width / 2,
                y: startPos.y + target.height / 2
            };
            
            if (this.options.debug) {
                this._debug(`✨ Restauration ${direction.toUpperCase()} - Départ bord opposé`);
            }
            
            this.window.style.display = 'block';
            this.window.style.visibility = 'visible';
            this.window.style.position = 'fixed';
            this.window.style.left = startPos.x + 'px';
            this.window.style.top = startPos.y + 'px';
            this.window.style.width = target.width + 'px';
            this.window.style.height = target.height + 'px';
            this.window.style.zIndex = '1000';
            this.window.style.opacity = '0';
            
            void this.window.offsetHeight; // Force reflow
            
            const animName = this.animator.createRestoreAnimation(startCenter, target, direction);
            this.window.style.animation = `${animName} ${this.config.duration}ms cubic-bezier(0.23, 1, 0.32, 1) forwards`;
            this.window.style.opacity = '1';
            
            const onEnd = function() {
                this.window.removeEventListener('animationend', onEnd);
                
                this.window.style.position = '';
                this.window.style.left = target.left + 'px';
                this.window.style.top = target.top + 'px';
                this.window.style.width = '';
                this.window.style.height = '';
                this.window.style.zIndex = '';
                this.window.style.animation = '';
                this.window.style.opacity = '';
                
                this.animator.reset();
                this.isAnimating = false;
                this.isMinimized = false;
                
                this.windowDrag.setEnabled(true);
                this.buttonDrag.setEnabled(true);
                
                if (this.options.onRestore) {
                    this.options.onRestore.call(this);
                }
                
                if (this.options.debug) {
                    this._debug(`✅ Restauré ${direction.toUpperCase()}`);
                }
            }.bind(this);
            
            this.window.addEventListener('animationend', onEnd, { once: true });
            setTimeout(function() { 
                if (this.isAnimating) onEnd(); 
            }.bind(this), this.config.duration + 150);
        },
        
        toggle: function() {
            if (this.isAnimating) return;
            if (this.isMinimized) {
                this.restore();
            } else {
                this.minimize();
            }
        },
        
        setDuration: function(duration) {
            this.config.duration = duration;
            return this;
        },
        
        setSkewIntensity: function(intensity) {
            this.config.skewIntensity = intensity;
            return this;
        },
        
        setGlassEnabled: function(enabled) {
            this.config.glassEnabled = enabled;
            return this;
        },
        
        _debug: function(msg) {
            console.log('[LampeMagique]', msg);
            if (this.debugEl) {
                this.debugEl.textContent = msg;
                setTimeout(function() {
                    if (this.debugEl && this.debugEl.textContent === msg) {
                        this.debugEl.textContent = '✅ Prêt';
                    }
                }.bind(this), 2500);
            }
        },
        
        destroy: function() {
            if (this.windowDrag) this.windowDrag.destroy();
            if (this.buttonDrag) this.buttonDrag.destroy();
            this.animator.reset();
        }
    };

    // ============================================================
    // FENÊTRE WOBBLY - CLASSE (Prototype)
    // ============================================================
    
    function WobblyWindow(element, options) {
        this.element = typeof element === 'string' ? 
            document.querySelector(element) : element;
        
        if (!this.element) {
            console.warn('WobblyWindow: Élément non trouvé');
            return;
        }
        
        this.options = NinjaUtils.extend({
            intensity: 1.2,
            springSpeed: 0.14,
            damping: 0.89,
            dragForce: 2.0,
            maxSkew: 14,
            maxScale: 0.12,
            handle: null,
            onDragStart: function() {},
            onDragEnd: function() {}
        }, options || {});
        
        this.isDragging = false;
        this.isMaximized = false;
        this.normalState = { left: 0, top: 0, width: 0, height: 0 };
        
        // État physique
        this.currentSkewX = 0;
        this.currentSkewY = 0;
        this.currentScaleX = 1;
        this.currentScaleY = 1;
        this.currentRotate = 0;
        
        // Vélocités
        this.skewVelX = 0;
        this.skewVelY = 0;
        this.scaleVelX = 0;
        this.scaleVelY = 0;
        this.rotateVel = 0;
        
        // Drag state
        this.dragState = {
            startX: 0,
            startY: 0,
            windowLeft: 0,
            windowTop: 0,
            lastMouseX: 0,
            lastMouseY: 0,
            velocityX: 0,
            velocityY: 0,
            grabOffsetX: 0.5,
            grabOffsetY: 0.5
        };
        
        this.animationId = null;
        this.titlebar = this.options.handle || this.element.querySelector('[data-drag-handle]') || this.element;
        
        this._init();
    }
    
    WobblyWindow.prototype = {
        constructor: WobblyWindow,
        
        _init: function() {
            this.element.style.transformOrigin = 'center center';
            this.element.style.willChange = 'transform, left, top';
            
            this.titlebar.addEventListener('mousedown', this._onMouseDown.bind(this));
            this.element.addEventListener('mousedown', this._onFocus.bind(this));
            
            this._setupControls();
            this.startAnimation();
        },
        
        _setupControls: function() {
            const closeBtn = this.element.querySelector('[data-action="close"]');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.close();
                });
            }
            
            const minimizeBtn = this.element.querySelector('[data-action="minimize"]');
            if (minimizeBtn) {
                minimizeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.minimize();
                });
            }
            
            const maximizeBtn = this.element.querySelector('[data-action="maximize"]');
            if (maximizeBtn) {
                maximizeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleMaximize();
                });
            }
        },
        
        _onFocus: function(e) {
            if (!e.target.closest('.window-btn')) {
                this.bringToFront();
            }
        },
        
        bringToFront: function() {
            const allWindows = document.querySelectorAll('.wobbly-window, .magic-window');
            let maxZ = 10;
            
            allWindows.forEach(win => {
                const z = parseInt(window.getComputedStyle(win).zIndex) || 10;
                if (z > maxZ) maxZ = z;
                win.classList.remove('focused');
            });
            
            this.element.style.zIndex = maxZ + 1;
            this.element.classList.add('focused');
        },
        
        _onMouseDown: function(e) {
            if (e.target.closest('.window-btn')) return;
            e.preventDefault();
            
            this.bringToFront();
            this.isDragging = true;
            this.element.classList.add('dragging-active');
            
            const rect = this.element.getBoundingClientRect();
            this.dragState.startX = e.clientX;
            this.dragState.startY = e.clientY;
            this.dragState.windowLeft = rect.left;
            this.dragState.windowTop = rect.top;
            this.dragState.lastMouseX = e.clientX;
            this.dragState.lastMouseY = e.clientY;
            
            // Calculer l'origine de transformation dynamique
            this.dragState.grabOffsetX = (e.clientX - rect.left) / rect.width;
            this.dragState.grabOffsetY = (e.clientY - rect.top) / rect.height;
            this.element.style.transformOrigin = `${this.dragState.grabOffsetX * 100}% ${this.dragState.grabOffsetY * 100}%`;
            
            // Impulsion initiale aléatoire
            this.skewVelX += (Math.random() - 0.5) * 1.5;
            this.skewVelY += (Math.random() - 0.5) * 1.5;
            
            document.addEventListener('mousemove', this._onMouseMove.bind(this));
            document.addEventListener('mouseup', this._onMouseUp.bind(this));
            
            if (this.options.onDragStart) {
                this.options.onDragStart.call(this);
            }
        },
        
        _onMouseMove: function(e) {
            if (!this.isDragging) return;
            e.preventDefault();
            
            const dx = e.clientX - this.dragState.startX;
            const dy = e.clientY - this.dragState.startY;
            
            // Calcul vélocité
            const velX = (e.clientX - this.dragState.lastMouseX) * 0.8;
            const velY = (e.clientY - this.dragState.lastMouseY) * 0.8;
            this.dragState.velocityX = velX;
            this.dragState.velocityY = velY;
            this.dragState.lastMouseX = e.clientX;
            this.dragState.lastMouseY = e.clientY;
            
            // Déplacer la fenêtre
            this.element.style.left = (this.dragState.windowLeft + dx) + 'px';
            this.element.style.top = (this.dragState.windowTop + dy) + 'px';
            
            // Appliquer effet wobble
            const intensity = this.options.intensity;
            const force = this.options.dragForce;
            
            const targetSkewX = velY * 0.18 * force * intensity;
            const targetSkewY = velX * 0.18 * force * intensity;
            const targetScaleX = 1 + (Math.abs(velX) * 0.012 * force * intensity);
            const targetScaleY = 1 + (Math.abs(velY) * 0.012 * force * intensity);
            const targetRotate = (velX - velY) * 0.08 * force * intensity;
            
            // Appliquer forces avec inertie
            this.skewVelX += (targetSkewX - this.currentSkewX) * 0.3;
            this.skewVelY += (targetSkewY - this.currentSkewY) * 0.3;
            this.scaleVelX += (targetScaleX - this.currentScaleX) * 0.25;
            this.scaleVelY += (targetScaleY - this.currentScaleY) * 0.25;
            this.rotateVel += (targetRotate - this.currentRotate) * 0.2;
            
            // Effet d'ondulation à haute vitesse
            const speed = Math.sqrt(velX * velX + velY * velY);
            if (speed > 3) {
                const waveX = Math.sin(Date.now() * 0.02) * speed * 0.05 * intensity;
                const waveY = Math.cos(Date.now() * 0.02) * speed * 0.05 * intensity;
                this.skewVelX += waveX;
                this.skewVelY += waveY;
            }
        },
        
        _onMouseUp: function(e) {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.element.classList.remove('dragging-active');
            this.element.style.transformOrigin = 'center center';
            
            document.removeEventListener('mousemove', this._onMouseMove.bind(this));
            document.removeEventListener('mouseup', this._onMouseUp.bind(this));
            
            // Rebond élastique
            this.skewVelX += (Math.random() - 0.5) * 2.5;
            this.skewVelY += (Math.random() - 0.5) * 2.5;
            this.scaleVelX += (Math.random() - 0.5) * 0.05;
            this.scaleVelY += (Math.random() - 0.5) * 0.05;
            this.rotateVel += (Math.random() - 0.5) * 1.2;
            
            if (this.options.onDragEnd) {
                this.options.onDragEnd.call(this);
            }
        },
        
        updatePhysics: function() {
            const spring = this.options.springSpeed;
            const damping = this.options.damping;
            
            // Retour vers état neutre
            this.skewVelX += (0 - this.currentSkewX) * spring;
            this.skewVelY += (0 - this.currentSkewY) * spring;
            this.skewVelX *= damping;
            this.skewVelY *= damping;
            this.currentSkewX += this.skewVelX;
            this.currentSkewY += this.skewVelY;
            
            this.scaleVelX += (1 - this.currentScaleX) * spring;
            this.scaleVelY += (1 - this.currentScaleY) * spring;
            this.scaleVelX *= damping;
            this.scaleVelY *= damping;
            this.currentScaleX += this.scaleVelX;
            this.currentScaleY += this.scaleVelY;
            
            this.rotateVel += (0 - this.currentRotate) * spring;
            this.rotateVel *= damping;
            this.currentRotate += this.rotateVel;
            
            // Limites
            this.currentSkewX = NinjaUtils.clamp(this.currentSkewX, -this.options.maxSkew, this.options.maxSkew);
            this.currentSkewY = NinjaUtils.clamp(this.currentSkewY, -this.options.maxSkew, this.options.maxSkew);
            this.currentScaleX = NinjaUtils.clamp(this.currentScaleX, 1 - this.options.maxScale, 1 + this.options.maxScale);
            this.currentScaleY = NinjaUtils.clamp(this.currentScaleY, 1 - this.options.maxScale, 1 + this.options.maxScale);
            this.currentRotate = NinjaUtils.clamp(this.currentRotate, -5, 5);
        },
        
        applyTransform: function() {
            const transform = `translate(0px, 0px) scale(${this.currentScaleX}, ${this.currentScaleY}) skew(${this.currentSkewX}deg, ${this.currentSkewY}deg) rotate(${this.currentRotate}deg)`;
            this.element.style.transform = transform;
        },
        
        animate: function() {
            this.updatePhysics();
            this.applyTransform();
            this.animationId = requestAnimationFrame(this.animate.bind(this));
        },
        
        startAnimation: function() {
            if (this.animationId) cancelAnimationFrame(this.animationId);
            this.animationId = requestAnimationFrame(this.animate.bind(this));
        },
        
        stopAnimation: function() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        },
        
        toggleMaximize: function() {
            if (!this.isMaximized) {
                this.normalState.left = parseFloat(this.element.style.left) || 0;
                this.normalState.top = parseFloat(this.element.style.top) || 0;
                this.normalState.width = this.element.offsetWidth;
                this.normalState.height = this.element.offsetHeight;
                
                this.element.style.left = '0';
                this.element.style.top = '0';
                this.element.style.width = '100%';
                this.element.style.height = '100vh';
                this.element.style.borderRadius = '0';
                
                const surface = this.element.querySelector('.window-surface');
                if (surface) surface.style.borderRadius = '0';
                
                this.isMaximized = true;
            } else {
                this.element.style.left = this.normalState.left + 'px';
                this.element.style.top = this.normalState.top + 'px';
                this.element.style.width = this.normalState.width + 'px';
                this.element.style.height = this.normalState.height + 'px';
                this.element.style.borderRadius = '24px';
                
                const surface = this.element.querySelector('.window-surface');
                if (surface) surface.style.borderRadius = '24px';
                
                this.isMaximized = false;
            }
        },
        
        minimize: function() {
            this.element.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.element.style.transform = '';
            }, 250);
        },
        
        close: function() {
            this.element.style.display = 'none';
            this.stopAnimation();
        },
        
        updateParams: function(newParams) {
            NinjaUtils.extend(this.options, newParams);
            return this;
        },
        
        setIntensity: function(value) {
            this.options.intensity = value;
            return this;
        },
        
        setSpringSpeed: function(value) {
            this.options.springSpeed = value;
            return this;
        },
        
        setDamping: function(value) {
            this.options.damping = value;
            return this;
        },
        
        setDragForce: function(value) {
            this.options.dragForce = value;
            return this;
        },
        
        destroy: function() {
            this.stopAnimation();
            this.element.style.transform = '';
        }
    };

    // ============================================================
    // MANAGER DE FENÊTRES WOBBLY (Singleton)
    // ============================================================
    
    function WobblyWindowManager() {
        this.windows = [];
        this.activeWindow = null;
    }
    
    WobblyWindowManager.prototype = {
        constructor: WobblyWindowManager,
        
        register: function(element, options) {
            const win = new WobblyWindow(element, options);
            this.windows.push(win);
            
            if (!this.activeWindow) {
                this.activeWindow = win;
            }
            
            return win;
        },
        
        setActive: function(indexOrElement) {
            let win;
            
            if (typeof indexOrElement === 'number') {
                win = this.windows[indexOrElement];
            } else {
                win = this.windows.find(w => w.element === indexOrElement);
            }
            
            if (win) {
                this.activeWindow = win;
                win.bringToFront();
            }
            
            return win;
        },
        
        getActive: function() {
            return this.activeWindow;
        },
        
        getAll: function() {
            return this.windows;
        },
        
        applyToAll: function(params) {
            this.windows.forEach(win => win.updateParams(params));
            return this;
        },
        
        resetAll: function() {
            const defaults = {
                intensity: 1.2,
                springSpeed: 0.14,
                damping: 0.89,
                dragForce: 2.0,
                maxSkew: 14,
                maxScale: 0.12
            };
            this.applyToAll(defaults);
            return this;
        }
    };
    
    // Instance singleton globale
    WobblyWindowManager.getInstance = (function() {
        let instance = null;
        return function() {
            if (!instance) {
                instance = new WobblyWindowManager();
            }
            return instance;
        };
    })();

    // ============================================================
    // EXPORTS GLOBAUX
    // ============================================================
    
    global.NinjaUI = {
        // Version
        version: '1.0.0',
        
        // Classes principales
        LampeMagique: LampeMagique,
        WobblyWindow: WobblyWindow,
        WobblyWindowManager: WobblyWindowManager,
        
        // Classes utilitaires
        DragManager: DragManager,
        GenieAnimator: GenieAnimator,
        AnimationConfig: AnimationConfig,
        
        // Modules
        PositionDetector: PositionDetector,
        Utils: NinjaUtils,
        
        // Initialisation automatique des fenêtres wobbly
        initWobblyWindows: function(selector, options) {
            const manager = WobblyWindowManager.getInstance();
            const elements = document.querySelectorAll(selector || '.wobbly-window');
            
            elements.forEach((el, idx) => {
                manager.register(el, options);
            });
            
            return manager;
        },
        
        // Helper pour créer une lampe magique
        createMagicLamp: function(container, options) {
            return new LampeMagique(container, options);
        }
    };
    
    // Export CommonJS/AMD si disponible
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = global.NinjaUI;
    }
    
    if (typeof define === 'function' && define.amd) {
        define(function() { return global.NinjaUI; });
    }

})(typeof window !== 'undefined' ? window : this);
