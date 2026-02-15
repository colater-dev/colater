

export function getProxyUrl(url: string | undefined | null): string {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('/')) {
        return url;
    }
    // Use Next.js image optimization as a proxy to avoid CORS issues
    // We request a standard width and high quality
    // Standard Next.js widths include 1080, 1200, 1920, 2048
    return `/_next/image?url=${encodeURIComponent(url)}&w=1200&q=80`;
}

/**
 * Load an image and convert to data URI using canvas
 * Uses Next.js image proxy for cross-origin images (same-origin, no CORS issues)
 */
export async function loadImageAsDataUri(url: string): Promise<string> {
    if (!url) return '';
    if (url.startsWith('data:')) return url;

    // Use Next.js proxy - this is same-origin so no CORS issues
    const proxyUrl = getProxyUrl(url);
    const isProxied = proxyUrl !== url && proxyUrl.startsWith('/');

    return new Promise<string>((resolve) => {
        const img = new Image();
        // Only set crossOrigin for direct external URLs, not for same-origin proxy
        if (!isProxied) {
            img.crossOrigin = "Anonymous";
        }

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(url);
                    return;
                }
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } catch (e) {
                console.warn('Canvas export failed, falling back to URL:', e);
                resolve(url);
            }
        };

        img.onerror = () => {
            // If proxy fails, try original URL with crossOrigin
            if (isProxied) {
                const fallbackImg = new Image();
                fallbackImg.crossOrigin = "Anonymous";

                fallbackImg.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = fallbackImg.width;
                        canvas.height = fallbackImg.height;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            resolve(url);
                            return;
                        }
                        ctx.drawImage(fallbackImg, 0, 0);
                        resolve(canvas.toDataURL('image/png'));
                    } catch (e) {
                        resolve(url);
                    }
                };

                fallbackImg.onerror = () => resolve(url);
                fallbackImg.src = url;
            } else {
                resolve(url);
            }
        };

        img.src = proxyUrl;
    });
}

export async function cropImageToContent(
    imageUrl: string,
    cropDetails?: { x: number; y: number; width: number; height: number }
): Promise<string> {
    try {
        // Convert to data URI first to avoid CORS issues
        const dataUri = await loadImageAsDataUri(imageUrl);

        // If conversion failed (returned original URL), we can't do pixel analysis
        // Just return the original image to avoid CORS errors
        const isDataUri = dataUri.startsWith('data:');
        if (!isDataUri && !cropDetails) {
            console.warn('Could not convert to data URI and no crop details provided, returning original');
            return imageUrl;
        }

        return new Promise((resolve) => {
            const img = new Image();
            // Set crossOrigin if not using data URI (for when we have cropDetails but no data URI)
            if (!isDataUri) {
                img.crossOrigin = "Anonymous";
            }

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        console.error('Could not get canvas context');
                        resolve(imageUrl);
                        return;
                    }
                    ctx.drawImage(img, 0, 0);

                    let minX = canvas.width;
                    let minY = canvas.height;
                    let maxX = 0;
                    let maxY = 0;

                    if (cropDetails) {
                        minX = cropDetails.x;
                        minY = cropDetails.y;
                        // maxX and maxY are not needed if we use width/height directly
                    } else if (isDataUri) {
                        // Only try getImageData if we have a data URI (CORS-safe)
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;

                        let foundContent = false;

                        // Assume top-left pixel is background color
                        const bgR = data[0];
                        const bgG = data[1];
                        const bgB = data[2];
                        const bgA = data[3];

                        // Threshold for difference to consider as content
                        // 30 is a reasonable starting point for "significant difference"
                        const threshold = 50;

                        // Iterate over pixels
                        for (let y = 0; y < canvas.height; y++) {
                            for (let x = 0; x < canvas.width; x++) {
                                const i = (y * canvas.width + x) * 4;
                                const r = data[i];
                                const g = data[i + 1];
                                const b = data[i + 2];
                                const a = data[i + 3];

                                // Skip fully transparent pixels if background is transparent
                                if (bgA === 0 && a === 0) continue;

                                // Calculate difference from background
                                // Using simple Manhattan distance for performance
                                const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB) + Math.abs(a - bgA);

                                if (diff > threshold) {
                                    if (x < minX) minX = x;
                                    if (x > maxX) maxX = x;
                                    if (y < minY) minY = y;
                                    if (y > maxY) maxY = y;
                                    foundContent = true;
                                }
                            }
                        }

                        // If no content found, return original
                        if (!foundContent) {
                            console.log('No content found to crop (uniform color)');
                            resolve(imageUrl);
                            return;
                        }

                        console.log(`Cropping image: Original ${canvas.width}x${canvas.height}, Bounds: [${minX}, ${minY}, ${maxX}, ${maxY}]`);

                        // Add small padding
                        const padding = 20;
                        minX = Math.max(0, minX - padding);
                        minY = Math.max(0, minY - padding);
                        maxX = Math.min(canvas.width, maxX + padding);
                        maxY = Math.min(canvas.height, maxY + padding);
                    }

                    const width = cropDetails ? cropDetails.width : (maxX - minX);
                    const height = cropDetails ? cropDetails.height : (maxY - minY);


                    const cropCanvas = document.createElement('canvas');
                    cropCanvas.width = width;
                    cropCanvas.height = height;
                    const cropCtx = cropCanvas.getContext('2d');
                    if (!cropCtx) {
                        resolve(imageUrl);
                        return;
                    }

                    cropCtx.drawImage(canvas, minX, minY, width, height, 0, 0, width, height);
                    const croppedUrl = cropCanvas.toDataURL();
                    resolve(croppedUrl);
                } catch (e) {
                    console.error('Error during cropping logic:', e);
                    resolve(imageUrl);
                }
            };

            img.onerror = (err) => {
                console.error(`Error loading image for cropping [${imageUrl}]:`, err);
                resolve(imageUrl);
            };

            // Use data URI (no CORS issues)
            img.src = dataUri;

            // Safety timeout to ensure promise always resolves
            setTimeout(() => {
                if (!img.complete || img.naturalWidth === 0) {
                    console.warn(`Crop timeout for ${imageUrl}, resolving with original`);
                    resolve(imageUrl);
                    img.onload = null;
                    img.onerror = null;
                }
            }, 5000);
        });
    } catch (error) {
        console.error('Error in cropImageToContent:', error);
        return imageUrl;
    }
}
