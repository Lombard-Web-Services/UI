// ============================================================
// UI-Library.js
// Bibliothèque d'effets UI/UX par Thibaut Lombard
// Modules: Lampe Magique (GenieEffect) & Wobbly Windows (CompizStyle)
// Basée sur les principes de "Secrets of the JavaScript Ninja"
// ============================================================

(function(global) {
    'use strict';

    // ============================================================
    // MODULE 1: LAMPE MAGIQUE (GenieEffect)
    // Effet de minimisation/restauration avec déformation directionnelle
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
        this.minimizeTrigger = null;
        
        this._init();
    }
    
    GenieEffect.prototype = {
        constructor: GenieEffect,
        
        _init: function() {
            this._createButton();
            this._setupDrag();
            this._saveInitialPosition();
        },
        
        _createButton: function() {
            var self = this;
            this.button = document.createElement('button');
            this.button.className = 'ui-control-btn';
            this.button.innerHTML = '🪔 Minimiser';
            this.button.style.cssText = 'position:fixed;bottom:40px;right:40px;padding:14px 32px;background:rgba(255,189,46,0.25);backdrop-filter:blur(16px);color:#ffbd2e;border:1px solid rgba(255,189,46,0.5);border-radius:60px;font-size:15px;font-weight:700;cursor:grab;z-index:100;font-family:monospace;user-select:none;transition:all 0.3s;';
            
            this.button.addEventListener('click', function() {
                if (!self._isDragging) {
                    self.toggle();
                }
            });
            
            document.body.appendChild(this.button);
            this._setupButtonDrag();
        },
        
        _setupButtonDrag: function() {
            var self = this;
            var isDragging = false;
            var offsetX, offsetY;
            
            this.button.addEventListener('mousedown', function(e) {
                isDragging = true;
                self._isDragging = true;
                offsetX = e.clientX - self.button.offsetLeft;
                offsetY = e.clientY - self.button.offsetTop;
                self.button.style.position = 'fixed';
                self.button.style.cursor = 'grabbing';
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', function(e) {
                if (!isDragging) return;
                var left = e.clientX - offsetX;
                var top = e.clientY - offsetY;
                left = Math.max(5, Math.min(left, window.innerWidth - self.button.offsetWidth - 5));
                top = Math.max(5, Math.min(top, window.innerHeight - self.button.offsetHeight - 5));
                self.button.style.left = left + 'px';
                self.button.style.top = top + 'px';
                self.button.style.bottom = 'auto';
                self.button.style.right = 'auto';
            });
            
            document.addEventListener('mouseup', function() {
                if (isDragging) {
                    isDragging = false;
                    self._isDragging = false;
                    self.button.style.cursor = 'grab';
                }
            });
        },
        
        _setupDrag: function() {
            var self = this;
            var titleBar = this.element.querySelector('.title-bar');
            if (!titleBar) return;
            
            var isDragging = false;
            var offsetX, offsetY;
            
            titleBar.addEventListener('mousedown', function(e) {
                if (self.isAnimating) return;
                isDragging = true;
                var rect = self.element.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                self.element.style.position = 'fixed';
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', function(e) {
                if (!isDragging) return;
                var left = e.clientX - offsetX;
                var top = e.clientY - offsetY;
                left = Math.max(5, Math.min(left, window.innerWidth - self.element.offsetWidth - 5));
                top = Math.max(5, Math.min(top, window.innerHeight - self.element.offsetHeight - 5));
                self.element.style.left = left + 'px';
                self.element.style.top = top + 'px';
                self.savedPosition = { left: left, top: top, width: self.element.offsetWidth, height: self.element.offsetHeight };
            });
            
            document.addEventListener('mouseup', function() {
                isDragging = false;
            });
        },
        
        _saveInitialPosition: function() {
            var rect = this.element.getBoundingClientRect();
            this.savedPosition = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        },
        
        _getDirection: function(buttonRect, windowRect) {
            var bcx = buttonRect.left + buttonRect.width / 2;
            var bcy = buttonRect.top + buttonRect.height / 2;
            var wcx = windowRect.left + windowRect.width / 2;
            var wcy = windowRect.top + windowRect.height / 2;
            var dx = bcx - wcx;
            var dy = bcy - wcy;
            return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'bottom' : 'top');
        },
        
        _getClipPath: function(direction, progress) {
            var pinch = Math.min(progress * 1.1, 1) * 48;
            switch(direction) {
                case 'top': return 'polygon(' + pinch + '% 0%, ' + (100-pinch) + '% 0%, 100% 100%, 0% 100%)';
                case 'bottom': return 'polygon(0% 0%, 100% 0%, ' + (100-pinch) + '% 100%, ' + pinch + '% 100%)';
                case 'left': return 'polygon(0% ' + pinch + '%, 100% 0%, 100% 100%, 0% ' + (100-pinch) + '%)';
                case 'right': return 'polygon(0% 0%, 100% ' + pinch + '%, 100% ' + (100-pinch) + '%, 0% 100%)';
                default: return 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
            }
        },
        
        _getStartPosition: function(buttonRect, targetRect, direction) {
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
        
        _getSkew: function(direction, intensity, progress) {
            var easing = 1 - Math.pow(progress, 1.2);
            switch(direction) {
                case 'right': return intensity * easing;
                case 'left': return -intensity * easing;
                case 'bottom': return intensity * 0.4 * easing;
                case 'top': return -intensity * 0.4 * easing;
                default: return 0;
            }
        },
        
        _createAnimationKeyframes: function(isMinimize, buttonCenter, windowRect, direction) {
            if (this.activeStyleId) {
                var oldStyle = document.getElementById(this.activeStyleId);
                if (oldStyle) oldStyle.remove();
            }
            
            var styleId = 'genie-anim-' + Date.now();
            var style = document.createElement('style');
            style.id = styleId;
            
            var startX = windowRect.left + windowRect.width / 2;
            var startY = windowRect.top + windowRect.height / 2;
            var deltaX = buttonCenter.x - startX;
            var deltaY = buttonCenter.y - startY;
            var maxSkew = this.options.skewIntensity;
            var duration = this.options.duration;
            
            var keyframes = '@keyframes genieAnimation {\n';
            var steps = [0, 0.08, 0.18, 0.3, 0.42, 0.54, 0.66, 0.77, 0.88, 0.95, 1];
            
            for (var i = 0; i < steps.length; i++) {
                var p = steps[i];
                var percent = Math.round(p * 100);
                var ease = Math.pow(p, isMinimize ? 1.4 : 1.2);
                var tx = deltaX * ease;
                var ty = deltaY * ease;
                var sx = Math.max(isMinimize ? 1 - p * 1.15 : Math.min(p * 1.15, 1), 0.01);
                var sy = Math.max(isMinimize ? 1 - p * 1.35 : Math.min(p * 1.35, 1), 0.01);
                var skew = this._getSkew(direction, maxSkew, isMinimize ? p : 1 - p);
                var clipPath = this._getClipPath(direction, isMinimize ? p : 1 - p);
                var opacity = isMinimize ? Math.max(1 - p * 1.2, 0) : Math.min(p * 1.3, 1);
                
                keyframes += ' ' + percent + '% {\n';
                keyframes += '   transform: translate(' + tx.toFixed(1) + 'px, ' + ty.toFixed(1) + 'px) scale(' + sx.toFixed(3) + ', ' + sy.toFixed(3) + ') skew(' + skew.toFixed(1) + 'deg);\n';
                keyframes += '   clip-path: ' + clipPath + ';\n';
                keyframes += '   opacity: ' + opacity.toFixed(3) + ';\n';
                keyframes += ' }\n';
            }
            
            keyframes += '}';
            style.textContent = keyframes;
            document.head.appendChild(style);
            this.activeStyleId = styleId;
            return 'genieAnimation';
        },
        
        minimize: function() {
            if (this.isMinimized || this.isAnimating) return;
            this.isAnimating = true;
            
            var winRect = this.element.getBoundingClientRect();
            this.savedPosition = {
                left: winRect.left,
                top: winRect.top,
                width: winRect.width,
                height: winRect.height
            };
            
            var buttonRect = this.button.getBoundingClientRect();
            var buttonCenter = { x: buttonRect.left + buttonRect.width / 2, y: buttonRect.top + buttonRect.height / 2 };
            var direction = this._getDirection(buttonRect, winRect);
            
            this.element.style.position = 'fixed';
            this.element.style.left = winRect.left + 'px';
            this.element.style.top = winRect.top + 'px';
            this.element.style.width = winRect.width + 'px';
            this.element.style.height = winRect.height + 'px';
            this.element.style.zIndex = '1000';
            
            var animName = this._createAnimationKeyframes(true, buttonCenter, winRect, direction);
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
            };
            
            this.element.addEventListener('animationend', onEnd, { once: true });
            setTimeout(function() { if (self.isAnimating) onEnd(); }, this.options.duration + 100);
        },
        
        restore: function() {
            if (!this.isMinimized || this.isAnimating) return;
            this.isAnimating = true;
            
            var buttonRect = this.button.getBoundingClientRect();
            var target = this.savedPosition || {
                left: (window.innerWidth - 580) / 2,
                top: (window.innerHeight - 470) / 2,
                width: 580,
                height: 470
            };
            
            var direction = this._getDirection(buttonRect, target);
            var startPos = this._getStartPosition(buttonRect, target, direction);
            var startCenter = { x: startPos.x + target.width / 2, y: startPos.y + target.height / 2 };
            
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
            
            var animName = this._createAnimationKeyframes(false, startCenter, target, direction);
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
                self.button.innerHTML = '🪔 Minimiser';
                self.button.classList.remove('restore-mode');
            };
            
            this.element.addEventListener('animationend', onEnd, { once: true });
            setTimeout(function() { if (self.isAnimating) onEnd(); }, this.options.duration + 150);
        },
        
        _cleanAnimation: function() {
            if (this.activeStyleId) {
                var style = document.getElementById(this.activeStyleId);
                if (style) style.remove();
                this.activeStyleId = null;
            }
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
                document.body.classList.toggle('no-glass', !options.glassEnabled);
            }
        },
        
        destroy: function() {
            if (this.button && this.button.parentNode) this.button.parentNode.removeChild(this.button);
            this._cleanAnimation();
        }
    };
    
    
    // ============================================================
    // MODULE 2: WOBBLY WINDOWS (CompizStyle)
    // Effet de déformation élastique lors du déplacement
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
            
            var grabOffsetX = (e.clientX - rect.left) / rect.width;
            var grabOffsetY = (e.clientY - rect.top) / rect.height;
            this.element.style.transformOrigin = (grabOffsetX * 100) + '% ' + (grabOffsetY * 100) + '%';
            
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
            this.dragVelocityX = velX;
            this.dragVelocityY = velY;
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
                var waveX = Math.sin(Date.now() * 0.02) * speed * 0.05 * intensity;
                var waveY = Math.cos(Date.now() * 0.02) * speed * 0.05 * intensity;
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
            
            this.currentSkewX = Math.min(this.options.maxSkew, Math.max(-this.options.maxSkew, this.currentSkewX));
            this.currentSkewY = Math.min(this.options.maxSkew, Math.max(-this.options.maxSkew, this.currentSkewY));
            this.currentScaleX = Math.min(1 + this.options.maxScale, Math.max(1 - this.options.maxScale, this.currentScaleX));
            this.currentScaleY = Math.min(1 + this.options.maxScale, Math.max(1 - this.options.maxScale, this.currentScaleY));
            this.currentRotate = Math.min(5, Math.max(-5, this.currentRotate));
        },
        
        _applyTransform: function() {
            var transform = 'translate(0px, 0px) scale(' + this.currentScaleX + ', ' + this.currentScaleY + ') skew(' + this.currentSkewX + 'deg, ' + this.currentSkewY + 'deg) rotate(' + this.currentRotate + 'deg)';
            this.element.style.transform = transform;
        },
        
        _startAnimation: function() {
            var self = this;
            function animate() {
                self._updatePhysics();
                self._applyTransform();
                requestAnimationFrame(animate);
            }
            requestAnimationFrame(animate);
        },
        
        updateOptions: function(options) {
            if (options.intensity !== undefined) this.options.intensity = options.intensity;
            if (options.springSpeed !== undefined) this.options.springSpeed = options.springSpeed;
            if (options.damping !== undefined) this.options.damping = options.damping;
            if (options.dragForce !== undefined) this.options.dragForce = options.dragForce;
        }
    };
    
    // ============================================================
    // EXPORTATION
    // ============================================================
    
    global.UILibrary = {
        GenieEffect: GenieEffect,
        WobblyWindow: WobblyWindow,
        version: '1.0.0'
    };
    
})(typeof window !== 'undefined' ? window : this);
