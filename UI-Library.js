// ============================================================
// UI-Library.js
// Bibliothèque d'effets UI/UX par Thibaut Lombard
// Modules: Lampe Magique (GenieEffect) & Wobbly Windows (CompizStyle)
// ============================================================

(function(global) {
    'use strict';

    // ============================================================
    // DRAG MANAGER - Gestion du drag & drop fluide
    // ============================================================
    
    function DragManager(element, options) {
        this.element = element;
        this.enabled = options && options.enabled !== false;
        this.onStart = (options && options.onStart) || function() {};
        this.onMove = (options && options.onMove) || function() {};
        this.onEnd = (options && options.onEnd) || function() {};
        
        this._isDragging = false;
        this._offsetX = 0;
        this._offsetY = 0;
        
        this._bindEvents();
    }
    
    DragManager.prototype = {
        _bindEvents: function() {
            this.element.addEventListener('mousedown', this._onMouseDown.bind(this));
            document.addEventListener('mousemove', this._onMouseMove.bind(this));
            document.addEventListener('mouseup', this._onMouseUp.bind(this));
            this.element.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
            document.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
            document.addEventListener('touchend', this._onTouchEnd.bind(this));
        },
        
        _onMouseDown: function(e) {
            if (!this.enabled) return;
            e.preventDefault();
            this._startDrag(e.clientX, e.clientY);
        },
        
        _onTouchStart: function(e) {
            if (!this.enabled || e.touches.length !== 1) return;
            e.preventDefault();
            this._startDrag(e.touches[0].clientX, e.touches[0].clientY);
        },
        
        _startDrag: function(clientX, clientY) {
            this._isDragging = true;
            this.element.classList.add('dragging');
            var rect = this.element.getBoundingClientRect();
            this._offsetX = clientX - rect.left;
            this._offsetY = clientY - rect.top;
            this.element.style.position = 'fixed';
            this.element.style.left = rect.left + 'px';
            this.element.style.top = rect.top + 'px';
            this.element.style.bottom = 'auto';
            this.element.style.right = 'auto';
            this.onStart();
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
            var newLeft = clientX - this._offsetX;
            var newTop = clientY - this._offsetY;
            newLeft = Math.max(5, Math.min(newLeft, window.innerWidth - this.element.offsetWidth - 5));
            newTop = Math.max(5, Math.min(newTop, window.innerHeight - this.element.offsetHeight - 5));
            this.element.style.left = newLeft + 'px';
            this.element.style.top = newTop + 'px';
            this.onMove(newLeft, newTop);
        },
        
        _onMouseUp: function() { this._stopDrag(); },
        _onTouchEnd: function() { this._stopDrag(); },
        
        _stopDrag: function() {
            if (this._isDragging) {
                this._isDragging = false;
                this.element.classList.remove('dragging');
                this.onEnd();
            }
        },
        
        setEnabled: function(enabled) {
            this.enabled = enabled;
            this.element.style.cursor = enabled ? 'grab' : 'pointer';
        },
        
        isDragging: function() { return this._isDragging; }
    };

    // ============================================================
    // POSITION DETECTOR - Détection des directions
    // ============================================================
    
    var PositionDetector = {
        getDirection: function(buttonRect, windowRect) {
            var bcx = buttonRect.left + buttonRect.width / 2;
            var bcy = buttonRect.top + buttonRect.height / 2;
            var wcx = windowRect.left + windowRect.width / 2;
            var wcy = windowRect.top + windowRect.height / 2;
            var dx = bcx - wcx;
            var dy = bcy - wcy;
            return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'bottom' : 'top');
        },
        
        getClipPath: function(direction, progress) {
            var pinch = Math.min(progress * 1.1, 1) * 48;
            switch(direction) {
                case 'top': return 'polygon(' + pinch + '% 0%, ' + (100-pinch) + '% 0%, 100% 100%, 0% 100%)';
                case 'bottom': return 'polygon(0% 0%, 100% 0%, ' + (100-pinch) + '% 100%, ' + pinch + '% 100%)';
                case 'left': return 'polygon(0% ' + pinch + '%, 100% 0%, 100% 100%, 0% ' + (100-pinch) + '%)';
                case 'right': return 'polygon(0% 0%, 100% ' + pinch + '%, 100% ' + (100-pinch) + '%, 0% 100%)';
                default: return 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
            }
        },
        
        getStartPosition: function(buttonRect, targetRect, direction) {
            var centerX = buttonRect.left + buttonRect.width / 2;
            var centerY = buttonRect.top + buttonRect.height / 2;
            switch(direction) {
                case 'top': return { x: centerX - targetRect.width / 2, y: buttonRect.bottom };
                case 'bottom': return { x: centerX - targetRect.width / 2, y: buttonRect.top - targetRect.height };
                case 'left': return { x: buttonRect.right, y: centerY - targetRect.height / 2 };
                case 'right': return { x: buttonRect.left - targetRect.width, y: centerY - targetRect.height / 2 };
                default: return { x: buttonRect.left, y: buttonRect.top };
            }
        },
        
        getSkew: function(direction, intensity, progress) {
            var easing = 1 - Math.pow(progress, 1.2);
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
    // GENIE ANIMATOR - Création des animations CSS
    // ============================================================
    
    function GenieAnimator(config) {
        this.config = config;
        this._activeStyleId = null;
    }
    
    GenieAnimator.prototype = {
        _clean: function() {
            if (this._activeStyleId) {
                var el = document.getElementById(this._activeStyleId);
                if (el) el.remove();
                this._activeStyleId = null;
            }
        },
        
        createMinimizeAnimation: function(buttonCenter, windowRect, direction) {
            this._clean();
            var styleId = 'genie-min-' + Date.now();
            var style = document.createElement('style');
            style.id = styleId;
            
            var startX = windowRect.left + windowRect.width / 2;
            var startY = windowRect.top + windowRect.height / 2;
            var deltaX = buttonCenter.x - startX;
            var deltaY = buttonCenter.y - startY;
            var maxSkew = this.config.skewIntensity;
            
            var keyframes = '@keyframes genieMinimize {\n';
            var steps = [0, 0.08, 0.18, 0.3, 0.42, 0.54, 0.66, 0.77, 0.88, 0.95, 1];
            
            for (var i = 0; i < steps.length; i++) {
                var p = steps[i];
                var percent = Math.round(p * 100);
                var ease = Math.pow(p, 1.4);
                var tx = deltaX * ease;
                var ty = deltaY * ease;
                var sx = Math.max(1 - p * 1.15, 0.01);
                var sy = Math.max(1 - p * 1.35, 0.01);
                var skew = PositionDetector.getSkew(direction, maxSkew, p);
                
                keyframes += ' ' + percent + '% {\n';
                keyframes += '   transform: translate(' + tx.toFixed(1) + 'px, ' + ty.toFixed(1) + 'px) scale(' + sx.toFixed(3) + ', ' + sy.toFixed(3) + ') skew(' + skew.toFixed(1) + 'deg);\n';
                keyframes += '   clip-path: ' + PositionDetector.getClipPath(direction, p) + ';\n';
                keyframes += '   opacity: ' + Math.max(1 - p * 1.2, 0).toFixed(3) + ';\n';
                keyframes += ' }\n';
            }
            keyframes += '}';
            style.textContent = keyframes;
            document.head.appendChild(style);
            this._activeStyleId = styleId;
            return 'genieMinimize';
        },
        
        createRestoreAnimation: function(startCenter, targetRect, direction) {
            this._clean();
            var styleId = 'genie-res-' + Date.now();
            var style = document.createElement('style');
            style.id = styleId;
            
            var targetCenterX = targetRect.left + targetRect.width / 2;
            var targetCenterY = targetRect.top + targetRect.height / 2;
            var deltaX = targetCenterX - startCenter.x;
            var deltaY = targetCenterY - startCenter.y;
            var maxSkew = this.config.skewIntensity;
            
            var keyframes = '@keyframes genieRestore {\n';
            var steps = [0, 0.05, 0.12, 0.23, 0.34, 0.46, 0.58, 0.70, 0.82, 0.92, 1];
            
            for (var i = 0; i < steps.length; i++) {
                var p = steps[i];
                var percent = Math.round(p * 100);
                var ease = Math.pow(p, 1.2);
                var tx = deltaX * ease;
                var ty = deltaY * ease;
                var sx = Math.min(p * 1.15, 1);
                var sy = Math.min(p * 1.35, 1);
                var skew = PositionDetector.getSkew(direction, maxSkew, 1 - p);
                
                keyframes += ' ' + percent + '% {\n';
                keyframes += '   transform: translate(' + tx.toFixed(1) + 'px, ' + ty.toFixed(1) + 'px) scale(' + sx.toFixed(3) + ', ' + sy.toFixed(3) + ') skew(' + skew.toFixed(1) + 'deg);\n';
                keyframes += '   clip-path: ' + PositionDetector.getClipPath(direction, 1 - p) + ';\n';
                keyframes += '   opacity: ' + Math.min(p * 1.3, 1).toFixed(3) + ';\n';
                keyframes += ' }\n';
            }
            keyframes += '}';
            style.textContent = keyframes;
            document.head.appendChild(style);
            this._activeStyleId = styleId;
            return 'genieRestore';
        },
        
        reset: function() { this._clean(); }
    };

    // ============================================================
    // MODULE 1: GENIE EFFECT (Lampe Magique)
    // ============================================================
    
    function GenieEffect(element, options) {
        this.element = element;
        this.options = {
            duration: (options && options.duration) || 700,
            skewIntensity: (options && options.skewIntensity) || 50,
            glassEnabled: (options && options.glassEnabled !== undefined) ? options.glassEnabled : true
        };
        
        this.isMinimized = false;
        this.isAnimating = false;
        this.savedPosition = null;
        this.activeStyleId = null;
        this.button = null;
        this.windowDrag = null;
        this.buttonDrag = null;
        
        this._init();
    }
    
    GenieEffect.prototype = {
        constructor: GenieEffect,
        
        _init: function() {
            this._createButton();
            this._initDrag();
            this._initEvents();
            this._initPosition();
            this._updateGlass();
        },
        
        _createButton: function() {
            var self = this;
            this.button = document.createElement('button');
            this.button.className = 'control-btn';
            this.button.innerHTML = '🪔 Minimiser';
            document.body.appendChild(this.button);
        },
        
        _initDrag: function() {
            var self = this;
            var titleBar = this.element.querySelector('.title-bar');
            
            this.windowDrag = new DragManager(this.element, {
                onMove: function(x, y) {
                    self.savedPosition = {
                        left: x, top: y,
                        width: self.element.offsetWidth,
                        height: self.element.offsetHeight
                    };
                }
            });
            this.windowDrag.setEnabled(true);
            
            this.buttonDrag = new DragManager(this.button, {
                onEnd: function() { self._debug('Bouton repositionné'); }
            });
        },
        
        _initEvents: function() {
            var self = this;
            
            this.button.addEventListener('click', function() {
                if (!self.buttonDrag.isDragging()) {
                    self.toggle();
                }
            });
            
            var minimizeTrigger = this.element.querySelector('.minimize-btn');
            if (minimizeTrigger) {
                minimizeTrigger.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (!self.isMinimized && !self.isAnimating) self.minimize();
                });
            }
            
            var titleBar = this.element.querySelector('.title-bar');
            if (titleBar) {
                titleBar.addEventListener('dblclick', function() {
                    if (!self.isAnimating) self.toggle();
                });
            }
            
            var closeBtn = this.element.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    alert('🧞 La lampe magique vous salue !');
                });
            }
            
            window.addEventListener('resize', this._onResize.bind(this));
        },
        
        _initPosition: function() {
            var left = (window.innerWidth - this.element.offsetWidth) / 2;
            var top = (window.innerHeight - this.element.offsetHeight) / 2;
            this.element.style.left = left + 'px';
            this.element.style.top = top + 'px';
            this.savedPosition = {
                left: left, top: top,
                width: this.element.offsetWidth,
                height: this.element.offsetHeight
            };
        },
        
        _onResize: function() {
            if (!this.isMinimized && !this.isAnimating && this.savedPosition) {
                var left = Math.min(this.savedPosition.left, window.innerWidth - this.savedPosition.width - 10);
                var top = Math.min(this.savedPosition.top, window.innerHeight - this.savedPosition.height - 10);
                this.element.style.left = Math.max(5, left) + 'px';
                this.element.style.top = Math.max(5, top) + 'px';
            }
            if (this.button.style.left) {
                var btnLeft = Math.max(5, Math.min(parseFloat(this.button.style.left), window.innerWidth - this.button.offsetWidth - 5));
                var btnTop = Math.max(5, Math.min(parseFloat(this.button.style.top), window.innerHeight - this.button.offsetHeight - 5));
                this.button.style.left = btnLeft + 'px';
                this.button.style.top = btnTop + 'px';
            }
        },
        
        _getButtonCenter: function() {
            var r = this.button.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        },
        
        _updateGlass: function() {
            document.body.classList.toggle('no-glass', !this.options.glassEnabled);
        },
        
        _cleanAnimation: function() {
            if (this.activeStyleId) {
                var style = document.getElementById(this.activeStyleId);
                if (style) style.remove();
                this.activeStyleId = null;
            }
        },
        
        minimize: function() {
            if (this.isMinimized || this.isAnimating) return;
            this.isAnimating = true;
            
            var winRect = this.element.getBoundingClientRect();
            this.savedPosition = {
                left: winRect.left, top: winRect.top,
                width: winRect.width, height: winRect.height
            };
            
            var btnCenter = this._getButtonCenter();
            var direction = PositionDetector.getDirection(this.button.getBoundingClientRect(), winRect);
            
            this.element.style.position = 'fixed';
            this.element.style.left = winRect.left + 'px';
            this.element.style.top = winRect.top + 'px';
            this.element.style.width = winRect.width + 'px';
            this.element.style.height = winRect.height + 'px';
            this.element.style.zIndex = '1000';
            
            this.windowDrag.setEnabled(false);
            this.buttonDrag.setEnabled(false);
            
            var animator = new GenieAnimator(this.options);
            var animName = animator.createMinimizeAnimation(btnCenter, winRect, direction);
            this.activeStyleId = animator._activeStyleId;
            this.element.style.animation = animName + ' ' + this.options.duration + 'ms cubic-bezier(0.4, 0, 0.2, 1) forwards';
            
            var self = this;
            var onEnd = function() {
                self.element.removeEventListener('animationend', onEnd);
                self.element.style.display = 'none';
                self.element.style.visibility = 'hidden';
                self._cleanAnimation();
                self.isAnimating = false;
                self.isMinimized = true;
                self.button.innerHTML = '✨ Restaurer';
                self.button.classList.add('restore-mode');
                self.buttonDrag.setEnabled(true);
            };
            
            this.element.addEventListener('animationend', onEnd, { once: true });
            setTimeout(function() { if (self.isAnimating) onEnd(); }, this.options.duration + 100);
        },
        
        restore: function() {
            if (!this.isMinimized || this.isAnimating) return;
            this.isAnimating = true;
            
            var btnRect = this.button.getBoundingClientRect();
            var target = this.savedPosition || {
                left: (window.innerWidth - 580) / 2,
                top: (window.innerHeight - 470) / 2,
                width: 580, height: 470
            };
            
            var direction = PositionDetector.getDirection(btnRect, target);
            var startPos = PositionDetector.getStartPosition(btnRect, target, direction);
            var startCenter = {
                x: startPos.x + target.width / 2,
                y: startPos.y + target.height / 2
            };
            
            this.element.style.display = 'block';
            this.element.style.visibility = 'visible';
            this.element.style.position = 'fixed';
            this.element.style.left = startPos.x + 'px';
            this.element.style.top = startPos.y + 'px';
            this.element.style.width = target.width + 'px';
            this.element.style.height = target.height + 'px';
            this.element.style.zIndex = '1000';
            this.element.style.opacity = '0';
            
            void this.element.offsetHeight;
            
            var animator = new GenieAnimator(this.options);
            var animName = animator.createRestoreAnimation(startCenter, target, direction);
            this.activeStyleId = animator._activeStyleId;
            this.element.style.animation = animName + ' ' + this.options.duration + 'ms cubic-bezier(0.23, 1, 0.32, 1) forwards';
            this.element.style.opacity = '1';
            
            var self = this;
            var onEnd = function() {
                self.element.removeEventListener('animationend', onEnd);
                self.element.style.position = '';
                self.element.style.left = target.left + 'px';
                self.element.style.top = target.top + 'px';
                self.element.style.width = '';
                self.element.style.height = '';
                self.element.style.zIndex = '';
                self.element.style.animation = '';
                self.element.style.opacity = '';
                self._cleanAnimation();
                self.isAnimating = false;
                self.isMinimized = false;
                self.windowDrag.setEnabled(true);
                self.buttonDrag.setEnabled(true);
                self.button.innerHTML = '🪔 Minimiser';
                self.button.classList.remove('restore-mode');
            };
            
            this.element.addEventListener('animationend', onEnd, { once: true });
            setTimeout(function() { if (self.isAnimating) onEnd(); }, this.options.duration + 150);
        },
        
        toggle: function() {
            if (!this.isAnimating) {
                this.isMinimized ? this.restore() : this.minimize();
            }
        },
        
        updateOptions: function(options) {
            if (options.duration !== undefined) this.options.duration = options.duration;
            if (options.skewIntensity !== undefined) this.options.skewIntensity = options.skewIntensity;
            if (options.glassEnabled !== undefined) {
                this.options.glassEnabled = options.glassEnabled;
                this._updateGlass();
            }
        },
        
        _debug: function(msg) {
            console.log('[GenieEffect]', msg);
        },
        
        destroy: function() {
            if (this.button && this.button.parentNode) this.button.parentNode.removeChild(this.button);
            this._cleanAnimation();
        }
    };

    // ============================================================
    // MODULE 2: WOBBLY WINDOW (Compiz Style)
    // ============================================================
    
    function WobblyWindow(element, options) {
        this.element = element;
        this.options = {
            intensity: (options && options.intensity) || 1.2,
            springSpeed: (options && options.springSpeed) || 0.14,
            damping: (options && options.damping) || 0.89,
            dragForce: (options && options.dragForce) || 2.0,
            maxSkew: 14,
            maxScale: 0.12
        };
        
        this.isDragging = false;
        this.isMaximized = false;
        this.normalLeft = 0;
        this.normalTop = 0;
        this.normalWidth = 0;
        this.normalHeight = 0;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.windowLeft = 0;
        this.windowTop = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.grabOffsetX = 0;
        this.grabOffsetY = 0;
        
        this.currentSkewX = 0;
        this.currentSkewY = 0;
        this.currentScaleX = 1;
        this.currentScaleY = 1;
        this.currentRotate = 0;
        
        this.skewVelX = 0;
        this.skewVelY = 0;
        this.scaleVelX = 0;
        this.scaleVelY = 0;
        this.rotateVel = 0;
        
        this.animationId = null;
        
        this._init();
    }
    
    WobblyWindow.prototype = {
        constructor: WobblyWindow,
        
        _init: function() {
            this.element.style.transformOrigin = 'center center';
            this.element.style.willChange = 'transform, left, top';
            
            var titlebar = this.element.querySelector('[data-drag-handle]');
            if (titlebar) {
                titlebar.addEventListener('mousedown', this._onMouseDown.bind(this));
            }
            
            var self = this;
            this.element.addEventListener('mousedown', function(e) {
                if (!e.target.closest('.window-btn')) {
                    self.bringToFront();
                }
            });
            
            this._bindButtons();
            this._startAnimation();
        },
        
        _bindButtons: function() {
            var self = this;
            
            var closeBtn = this.element.querySelector('[data-action="close"]');
            if (closeBtn) {
                closeBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    self.element.style.display = 'none';
                });
            }
            
            var minimizeBtn = this.element.querySelector('[data-action="minimize"]');
            if (minimizeBtn) {
                minimizeBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    self.element.style.transform = 'scale(0.95)';
                    setTimeout(function() { self.element.style.transform = ''; }, 250);
                });
            }
            
            var maximizeBtn = this.element.querySelector('[data-action="maximize"]');
            if (maximizeBtn) {
                maximizeBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    self.toggleMaximize();
                });
            }
        },
        
        bringToFront: function() {
            var allWindows = document.querySelectorAll('.wobbly-window');
            var maxZ = 10;
            allWindows.forEach(function(win) {
                var z = parseInt(win.style.zIndex) || 10;
                if (z > maxZ) maxZ = z;
                win.classList.remove('focused');
            });
            this.element.style.zIndex = maxZ + 1;
            this.element.classList.add('focused');
        },
        
        toggleMaximize: function() {
            var self = this;
            if (!this.isMaximized) {
                this.normalLeft = parseFloat(this.element.style.left);
                this.normalTop = parseFloat(this.element.style.top);
                this.normalWidth = this.element.offsetWidth;
                this.normalHeight = this.element.offsetHeight;
                
                this.element.style.left = '0';
                this.element.style.top = '0';
                this.element.style.width = '100%';
                this.element.style.height = '100vh';
                this.element.style.borderRadius = '0';
                var surface = this.element.querySelector('.window-surface');
                if (surface) surface.style.borderRadius = '0';
                this.isMaximized = true;
            } else {
                this.element.style.left = this.normalLeft + 'px';
                this.element.style.top = this.normalTop + 'px';
                this.element.style.width = this.normalWidth + 'px';
                this.element.style.height = this.normalHeight + 'px';
                this.element.style.borderRadius = '24px';
                var surface = this.element.querySelector('.window-surface');
                if (surface) surface.style.borderRadius = '24px';
                this.isMaximized = false;
            }
        },
        
        _onMouseDown: function(e) {
            if (e.target.closest('.window-btn')) return;
            e.preventDefault();
            this.bringToFront();
            this.isDragging = true;
            this.element.classList.add('dragging-active');
            
            var rect = this.element.getBoundingClientRect();
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.windowLeft = rect.left;
            this.windowTop = rect.top;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            
            this.grabOffsetX = (e.clientX - rect.left) / rect.width;
            this.grabOffsetY = (e.clientY - rect.top) / rect.height;
            this.element.style.transformOrigin = (this.grabOffsetX * 100) + '% ' + (this.grabOffsetY * 100) + '%';
            
            this.skewVelX += (Math.random() - 0.5) * 1.5;
            this.skewVelY += (Math.random() - 0.5) * 1.5;
            
            document.addEventListener('mousemove', this._onMouseMove.bind(this));
            document.addEventListener('mouseup', this._onMouseUp.bind(this));
        },
        
        _onMouseMove: function(e) {
            if (!this.isDragging) return;
            e.preventDefault();
            
            var dx = e.clientX - this.dragStartX;
            var dy = e.clientY - this.dragStartY;
            
            var velX = (e.clientX - this.lastMouseX) * 0.8;
            var velY = (e.clientY - this.lastMouseY) * 0.8;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            
            this.element.style.left = (this.windowLeft + dx) + 'px';
            this.element.style.top = (this.windowTop + dy) + 'px';
            
            var intensity = this.options.intensity;
            var force = this.options.dragForce;
            
            var targetSkewX = velY * 0.18 * force * intensity;
            var targetSkewY = velX * 0.18 * force * intensity;
            var targetScaleX = 1 + (Math.abs(velX) * 0.012 * force * intensity);
            var targetScaleY = 1 + (Math.abs(velY) * 0.012 * force * intensity);
            var targetRotate = (velX - velY) * 0.08 * force * intensity;
            
            this.skewVelX += (targetSkewX - this.currentSkewX) * 0.3;
            this.skewVelY += (targetSkewY - this.currentSkewY) * 0.3;
            this.scaleVelX += (targetScaleX - this.currentScaleX) * 0.25;
            this.scaleVelY += (targetScaleY - this.currentScaleY) * 0.25;
            this.rotateVel += (targetRotate - this.currentRotate) * 0.2;
            
            var speed = Math.sqrt(velX * velX + velY * velY);
            if (speed > 3) {
                var now = Date.now();
                var waveX = Math.sin(now * 0.02) * speed * 0.05 * intensity;
                var waveY = Math.cos(now * 0.02) * speed * 0.05 * intensity;
                this.skewVelX += waveX;
                this.skewVelY += waveY;
            }
        },
        
        _onMouseUp: function(e) {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.element.classList.remove('dragging-active');
            document.removeEventListener('mousemove', this._onMouseMove);
            document.removeEventListener('mouseup', this._onMouseUp);
            
            this.element.style.transformOrigin = 'center center';
            
            var bounceX = (Math.random() - 0.5) * 2.5;
            var bounceY = (Math.random() - 0.5) * 2.5;
            this.skewVelX += bounceX;
            this.skewVelY += bounceY;
            this.scaleVelX += (Math.random() - 0.5) * 0.05;
            this.scaleVelY += (Math.random() - 0.5) * 0.05;
            this.rotateVel += (Math.random() - 0.5) * 1.2;
        },
        
        _updatePhysics: function() {
            var spring = this.options.springSpeed;
            var damping = this.options.damping;
            
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
            
            var maxSkew = this.options.maxSkew;
            this.currentSkewX = Math.min(maxSkew, Math.max(-maxSkew, this.currentSkewX));
            this.currentSkewY = Math.min(maxSkew, Math.max(-maxSkew, this.currentSkewY));
            this.currentScaleX = Math.min(1 + this.options.maxScale, Math.max(1 - this.options.maxScale, this.currentScaleX));
            this.currentScaleY = Math.min(1 + this.options.maxScale, Math.max(1 - this.options.maxScale, this.currentScaleY));
            this.currentRotate = Math.min(5, Math.max(-5, this.currentRotate));
            
            var transform = 'translate(0px, 0px) scale(' + this.currentScaleX + ', ' + this.currentScaleY + ') skew(' + this.currentSkewX + 'deg, ' + this.currentSkewY + 'deg) rotate(' + this.currentRotate + 'deg)';
            this.element.style.transform = transform;
        },
        
        _startAnimation: function() {
            var self = this;
            function animate() {
                self._updatePhysics();
                self.animationId = requestAnimationFrame(animate);
            }
            this.animationId = requestAnimationFrame(animate);
        },
        
        updateParams: function(newParams) {
            Object.assign(this.options, newParams);
        }
    };

    // ============================================================
    // EXPORTATION
    // ============================================================
    
    global.UILibrary = {
        DragManager: DragManager,
        GenieEffect: GenieEffect,
        WobblyWindow: WobblyWindow,
        version: '1.0.0'
    };
    
})(typeof window !== 'undefined' ? window : this);
