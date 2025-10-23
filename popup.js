class ScreenshotEditor {
    constructor() {
        this.canvas = document.getElementById('previewCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.originalImage = null;
        this.currentBackgroundColor = '#f3f4f6';
        this.currentBackgroundType = 'solid';
        this.currentAspectRatio = 'original';
        this.currentPadding = 20;
        this.currentBorderRadius = 0;
        this.currentBlurSize = 20;
        this.blurAreas = [];
        this.isBlurMode = false;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const bgColorInput = document.getElementById('bgColor');
        const colorValue = document.querySelector('.color-value');
        const downloadBtn = document.getElementById('downloadBtn');
        const resetBtn = document.getElementById('resetBtn');
        const paddingSlider = document.getElementById('paddingSlider');
        const sliderValue = document.querySelector('.slider-value');
        const borderRadiusSlider = document.getElementById('borderRadiusSlider');
        const radiusValue = document.querySelector('.radius-value');
        const aspectBtns = document.querySelectorAll('.aspect-btn');
        const colorPresets = document.querySelectorAll('.color-preset');
        const toolBtns = document.querySelectorAll('.tool-btn');
        const optionContents = document.querySelectorAll('.option-content');
        const blurSizeSlider = document.getElementById('blurSizeSlider');
        const blurSizeValue = document.querySelector('.blur-size-value');
        const clearBlursBtn = document.getElementById('clearBlursBtn');

        // Drag and drop events
        dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        dropZone.addEventListener('drop', this.handleDrop.bind(this));
        
        // Click to browse
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Tool buttons
        toolBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                
                // Remove active class from all tool buttons
                toolBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.currentTarget.classList.add('active');
                
                // Hide all option contents
                optionContents.forEach(content => content.classList.remove('active'));
                
                // Show corresponding option content
                const targetOption = document.getElementById(`${tool}-options`);
                if (targetOption) {
                    targetOption.classList.add('active');
                }
                
                // Handle blur mode
                this.isBlurMode = (tool === 'blur');
                const previewContainer = document.querySelector('.preview-container');
                if (this.isBlurMode) {
                    previewContainer.classList.add('blur-mode');
                } else {
                    previewContainer.classList.remove('blur-mode');
                }
            });
        });

        // Color presets
        colorPresets.forEach(preset => {
            preset.addEventListener('click', (e) => {
                // Remove active class from all presets
                colorPresets.forEach(p => p.classList.remove('active'));
                // Add active class to clicked preset
                e.currentTarget.classList.add('active');
                
                this.currentBackgroundType = e.currentTarget.dataset.type;
                this.currentBackgroundColor = e.currentTarget.dataset.value;
                

                
                this.updatePreview();
            });
        });

        // Padding slider
        paddingSlider.addEventListener('input', (e) => {
            this.currentPadding = parseInt(e.target.value);
            sliderValue.textContent = `${this.currentPadding}px`;
            this.updatePreview();
        });

        // Border radius slider
        borderRadiusSlider.addEventListener('input', (e) => {
            this.currentBorderRadius = parseInt(e.target.value);
            radiusValue.textContent = `${this.currentBorderRadius}%`;
            this.updatePreview();
        });

        // Blur size slider
        blurSizeSlider.addEventListener('input', (e) => {
            this.currentBlurSize = parseInt(e.target.value);
            blurSizeValue.textContent = `${this.currentBlurSize}px`;
        });

        // Clear blurs button
        clearBlursBtn.addEventListener('click', () => {
            this.blurAreas = [];
            this.updatePreview();
        });

        // Canvas click for blur
        this.canvas.addEventListener('click', (e) => {
            if (!this.isBlurMode || !this.originalImage) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Convert to actual canvas coordinates
            const canvasX = (x / this.canvas.clientWidth) * this.canvas.width;
            const canvasY = (y / this.canvas.clientHeight) * this.canvas.height;
            
            this.addBlurArea(canvasX, canvasY);
        });

        // Aspect ratio buttons
        aspectBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                aspectBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                
                this.currentAspectRatio = e.target.dataset.ratio;
                this.updatePreview();
            });
        });

        // Action buttons
        downloadBtn.addEventListener('click', this.downloadImage.bind(this));
        resetBtn.addEventListener('click', this.reset.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.setupCanvas();
                this.updatePreview();
                this.showPreview();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    setupCanvas() {
        if (!this.originalImage) return;

        const maxWidth = 460;
        const maxHeight = 300;
        
        let canvasWidth, canvasHeight;
        
        // Calculate canvas dimensions based on aspect ratio
        if (this.currentAspectRatio === 'original') {
            canvasWidth = this.originalImage.width;
            canvasHeight = this.originalImage.height;
        } else {
            const [ratioW, ratioH] = this.currentAspectRatio.split(':').map(Number);
            
            // Use a standard base size for consistency
            const baseSize = 1000;
            canvasWidth = baseSize * ratioW;
            canvasHeight = baseSize * ratioH;
            
            // Normalize to reasonable dimensions
            if (ratioW > ratioH) {
                canvasHeight = canvasWidth * (ratioH / ratioW);
            } else {
                canvasWidth = canvasHeight * (ratioW / ratioH);
            }
        }
        
        // Scale down for preview if too large
        let displayWidth = canvasWidth;
        let displayHeight = canvasHeight;
        
        if (displayWidth > maxWidth || displayHeight > maxHeight) {
            const ratio = Math.min(maxWidth / displayWidth, maxHeight / displayHeight);
            displayWidth *= ratio;
            displayHeight *= ratio;
        }

        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
        
        // Store actual dimensions for download
        this.actualCanvasWidth = canvasWidth;
        this.actualCanvasHeight = canvasHeight;
    }

    updatePreview() {
        if (!this.originalImage) return;

        this.setupCanvas();
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Fill background
        this.fillBackground(this.ctx, this.canvas.width, this.canvas.height);

        // Calculate padding in preview scale
        const scaleX = this.canvas.width / this.actualCanvasWidth;
        const paddingScaled = this.currentPadding * scaleX;

        // Calculate available space for image after padding
        const availableWidth = this.canvas.width - (paddingScaled * 2);
        const availableHeight = this.canvas.height - (paddingScaled * 2);

        // IMPORTANT: Always maintain original image aspect ratio
        const imgAspectRatio = this.originalImage.width / this.originalImage.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;

        // Fit image within available space while preserving aspect ratio
        if (availableWidth / imgAspectRatio <= availableHeight) {
            // Width is the limiting factor
            drawWidth = availableWidth;
            drawHeight = availableWidth / imgAspectRatio;
        } else {
            // Height is the limiting factor
            drawHeight = availableHeight;
            drawWidth = availableHeight * imgAspectRatio;
        }

        // Center the image within the available space
        offsetX = paddingScaled + (availableWidth - drawWidth) / 2;
        offsetY = paddingScaled + (availableHeight - drawHeight) / 2;

        // Use high-quality image rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Apply border radius to image if specified
        if (this.currentBorderRadius > 0) {
            this.ctx.save();
            this.createRoundedPath(this.ctx, offsetX, offsetY, drawWidth, drawHeight, this.currentBorderRadius);
            this.ctx.clip();
        }
        
        this.ctx.drawImage(this.originalImage, offsetX, offsetY, drawWidth, drawHeight);
        
        if (this.currentBorderRadius > 0) {
            this.ctx.restore();
        }

        // Apply blur areas
        this.applyBlurAreas();
    }

    addBlurArea(x, y) {
        const scaleX = this.canvas.width / this.actualCanvasWidth;
        const blurRadius = this.currentBlurSize * scaleX;
        
        this.blurAreas.push({
            x: x,
            y: y,
            radius: blurRadius
        });
        
        this.updatePreview();
    }

    applyBlurAreas() {
        this.blurAreas.forEach(blur => {
            // Get image data for the blur area
            const imageData = this.ctx.getImageData(
                blur.x - blur.radius,
                blur.y - blur.radius,
                blur.radius * 2,
                blur.radius * 2
            );
            
            // Apply blur effect
            this.blurImageData(imageData, 10);
            
            // Create a circular mask
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(blur.x, blur.y, blur.radius, 0, Math.PI * 2);
            this.ctx.clip();
            
            // Put the blurred image data back
            this.ctx.putImageData(imageData, blur.x - blur.radius, blur.y - blur.radius);
            this.ctx.restore();
        });
    }

    blurImageData(imageData, strength) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // Simple box blur algorithm
        for (let i = 0; i < strength; i++) {
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = (y * width + x) * 4;
                    
                    // Average with surrounding pixels
                    let r = 0, g = 0, b = 0;
                    let count = 0;
                    
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nidx = ((y + dy) * width + (x + dx)) * 4;
                            r += data[nidx];
                            g += data[nidx + 1];
                            b += data[nidx + 2];
                            count++;
                        }
                    }
                    
                    data[idx] = r / count;
                    data[idx + 1] = g / count;
                    data[idx + 2] = b / count;
                }
            }
        }
    }

    showPreview() {
        document.getElementById('dropZone').style.display = 'none';
        document.getElementById('previewSection').style.display = 'block';
        document.querySelector('.header').style.display = 'none';
    }



    downloadImage() {
        if (!this.originalImage) return;

        // Create a temporary canvas with actual dimensions
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = this.actualCanvasWidth;
        tempCanvas.height = this.actualCanvasHeight;

        // Fill background
        this.fillBackground(tempCtx, tempCanvas.width, tempCanvas.height);

        // Calculate available space for image after padding
        const availableWidth = tempCanvas.width - (this.currentPadding * 2);
        const availableHeight = tempCanvas.height - (this.currentPadding * 2);

        // IMPORTANT: Always maintain original image aspect ratio
        const imgAspectRatio = this.originalImage.width / this.originalImage.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;

        // Fit image within available space while preserving aspect ratio
        if (availableWidth / imgAspectRatio <= availableHeight) {
            // Width is the limiting factor
            drawWidth = availableWidth;
            drawHeight = availableWidth / imgAspectRatio;
        } else {
            // Height is the limiting factor
            drawHeight = availableHeight;
            drawWidth = availableHeight * imgAspectRatio;
        }

        // Center the image within the available space
        offsetX = this.currentPadding + (availableWidth - drawWidth) / 2;
        offsetY = this.currentPadding + (availableHeight - drawHeight) / 2;

        // Use high-quality rendering for download
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        
        // Apply border radius to image if specified
        if (this.currentBorderRadius > 0) {
            tempCtx.save();
            this.createRoundedPath(tempCtx, offsetX, offsetY, drawWidth, drawHeight, this.currentBorderRadius);
            tempCtx.clip();
        }
        
        tempCtx.drawImage(this.originalImage, offsetX, offsetY, drawWidth, drawHeight);
        
        if (this.currentBorderRadius > 0) {
            tempCtx.restore();
        }

        // Apply blur areas for download
        this.applyBlurAreasToCanvas(tempCtx, tempCanvas.width, tempCanvas.height);

        // Download with high quality
        const link = document.createElement('a');
        link.download = `screenshot-edited-${Date.now()}.png`;
        link.href = tempCanvas.toDataURL('image/png', 1.0); // Maximum quality
        link.click();
    }

    applyBlurAreasToCanvas(ctx, canvasWidth, canvasHeight) {
        // Scale blur areas to actual canvas size
        const scaleX = canvasWidth / this.canvas.width;
        const scaleY = canvasHeight / this.canvas.height;
        
        this.blurAreas.forEach(blur => {
            const actualX = blur.x * scaleX;
            const actualY = blur.y * scaleY;
            const actualRadius = blur.radius * scaleX;
            
            // Get image data for the blur area
            const imageData = ctx.getImageData(
                Math.max(0, actualX - actualRadius),
                Math.max(0, actualY - actualRadius),
                Math.min(canvasWidth, actualRadius * 2),
                Math.min(canvasHeight, actualRadius * 2)
            );
            
            // Apply blur effect
            this.blurImageData(imageData, 15);
            
            // Create a circular mask
            ctx.save();
            ctx.beginPath();
            ctx.arc(actualX, actualY, actualRadius, 0, Math.PI * 2);
            ctx.clip();
            
            // Put the blurred image data back
            ctx.putImageData(imageData, actualX - actualRadius, actualY - actualRadius);
            ctx.restore();
        });
    }

    createRoundedPath(ctx, x, y, width, height, radiusPercent) {
        const radius = Math.min(width, height) * (radiusPercent / 100) * 0.5;
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    fillBackground(ctx, width, height) {
        if (this.currentBackgroundType === 'solid') {
            ctx.fillStyle = this.currentBackgroundColor;
            ctx.fillRect(0, 0, width, height);
        } else if (this.currentBackgroundType === 'gradient') {
            // Parse gradient string and create gradient
            const gradientMatch = this.currentBackgroundColor.match(/linear-gradient\(([^)]+)\)/);
            if (gradientMatch) {
                const gradientParts = gradientMatch[1].split(',');
                const angle = gradientParts[0].trim();
                
                // Convert angle to radians and calculate gradient direction
                let angleInDegrees = 135; // default
                if (angle.includes('deg')) {
                    angleInDegrees = parseInt(angle.replace('deg', ''));
                }
                
                const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
                const x1 = Math.cos(angleInRadians) * width / 2 + width / 2;
                const y1 = Math.sin(angleInRadians) * height / 2 + height / 2;
                const x2 = width - x1;
                const y2 = height - y1;
                
                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                
                // Add color stops
                for (let i = 1; i < gradientParts.length; i++) {
                    const part = gradientParts[i].trim();
                    if (part.includes('%')) {
                        const colorMatch = part.match(/(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|\w+)\s+(\d+)%/);
                        if (colorMatch) {
                            const color = colorMatch[1];
                            const position = parseInt(colorMatch[2]) / 100;
                            gradient.addColorStop(position, color);
                        }
                    }
                }
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            }
        }
    }

    reset() {
        this.originalImage = null;
        this.currentBackgroundColor = '#f3f4f6';
        this.currentBackgroundType = 'solid';
        this.currentAspectRatio = 'original';
        this.currentPadding = 20;
        this.currentBorderRadius = 0;
        this.currentBlurSize = 20;
        this.blurAreas = [];
        this.isBlurMode = false;
        

        document.getElementById('paddingSlider').value = '20';
        document.querySelector('.slider-value').textContent = '20px';
        document.getElementById('borderRadiusSlider').value = '0';
        document.querySelector('.radius-value').textContent = '0%';
        document.getElementById('blurSizeSlider').value = '20';
        document.querySelector('.blur-size-value').textContent = '20px';
        document.getElementById('fileInput').value = '';
        
        // Reset aspect ratio buttons
        document.querySelectorAll('.aspect-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.ratio === 'original') {
                btn.classList.add('active');
            }
        });
        
        // Reset color presets
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.classList.remove('active');
            if (preset.dataset.value === '#f3f4f6') {
                preset.classList.add('active');
            }
        });
        
        // Reset to aspect ratio tool
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tool === 'aspect') {
                btn.classList.add('active');
            }
        });
        
        // Show aspect ratio options
        document.querySelectorAll('.option-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById('aspect-options').classList.add('active');
        
        // Reset blur mode
        document.querySelector('.preview-container').classList.remove('blur-mode');
        
        this.hidePreview();
    }

    hidePreview() {
        document.getElementById('previewSection').style.display = 'none';
        document.getElementById('dropZone').style.display = 'block';
        document.querySelector('.header').style.display = 'block';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ScreenshotEditor();
});
