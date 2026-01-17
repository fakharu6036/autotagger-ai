import { FileItem, Metadata, PlatformPreset, ProcessingStatus } from '../types';

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const readFileAsBase64ForAPI = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith('image/')) {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        // Resize to max 1024px for API to reduce payload size
        const maxSize = 1024;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        URL.revokeObjectURL(objectUrl);
        resolve(base64);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        readFileAsBase64(file).then(resolve).catch(reject);
      };
      
      img.src = objectUrl;
    } else {
      readFileAsBase64(file).then(resolve).catch(reject);
    }
  });
};

export const getVideoFrames = (file: File): Promise<{ previewUrl: string, frames: string[] }> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject('Not in browser');
    
    const video = document.createElement('video');
    video.preload = 'auto'; // Changed to 'auto' to ensure video loads properly
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous'; // Help with CORS if needed
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const canvas = document.createElement('canvas');
    const apiCanvas = document.createElement('canvas');
    const frames: string[] = [];
    let previewUrl = '';
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isResolved = false;
    let dimensionRetryCount = 0;
    let seekAttemptCount = 0;
    const maxSeekAttempts = 3;
    
    // Adaptive timeout based on file size: 90s base + 2s per 10MB, max 5 minutes for very large files
    const fileSizeMB = file.size / (1024 * 1024);
    const timeoutDuration = Math.min(90000 + (fileSizeMB * 2000), 300000); // Max 5 minutes for very large files
    
    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      URL.revokeObjectURL(objectUrl);
    };
    
    const proceedCapture = () => {
      const ctx = canvas.getContext('2d', { willReadFrequently: false });
      const apiCtx = apiCanvas.getContext('2d', { willReadFrequently: false });
      
      if (!ctx || !apiCtx) {
        cleanup();
        reject(new Error("Canvas context not available"));
        return;
      }

      // Ensure video has valid dimensions and is ready
      if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
        // Not ready yet, wait a bit more
        setTimeout(() => {
          if (!isResolved) {
            proceedCapture();
          }
        }, 100);
        return;
      }

      // Full size for preview (only capture once)
      if (!previewUrl) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame - ensure we're getting the actual rendered frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        previewUrl = canvas.toDataURL('image/jpeg', 0.85);
      }

      // Small size (512x512 max) for API to reduce payload
      const maxApiSize = 512;
      let apiWidth = video.videoWidth;
      let apiHeight = video.videoHeight;
      
      if (apiWidth > maxApiSize || apiHeight > maxApiSize) {
        const ratio = Math.min(maxApiSize / apiWidth, maxApiSize / apiHeight);
        apiWidth = apiWidth * ratio;
        apiHeight = apiHeight * ratio;
      }

      apiCanvas.width = apiWidth;
      apiCanvas.height = apiHeight;
      
      // Draw video frame for API
      apiCtx.drawImage(video, 0, 0, apiWidth, apiHeight);
      
      // Low quality for API (0.5) to minimize payload size
      const apiDataUrl = apiCanvas.toDataURL('image/jpeg', 0.5);
      frames.push(apiDataUrl.split(',')[1]);

      // All frames captured (we only capture one frame)
      isResolved = true;
      cleanup();
      resolve({ previewUrl, frames });
    };
    
    const captureFrame = () => {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        dimensionRetryCount++;
        if (dimensionRetryCount > 30) { // Increased retries for large files
          cleanup();
          reject(new Error("Video dimensions not available after retries"));
          return;
        }
        // Retry after a delay with exponential backoff, longer for large files
        const baseDelay = fileSizeMB > 100 ? 500 : 300;
        setTimeout(() => {
          if (!isResolved) {
            captureFrame();
          }
        }, Math.min(baseDelay * dimensionRetryCount, 5000));
        return;
      }
      
      proceedCapture();
    };
    
    let tryNextFallback: (() => void) | null = null;
    
    const tryCaptureAtTime = (targetTime: number) => {
      if (isResolved) return;
      
      video.onseeked = () => {
        if (isResolved) return;
        // Wait longer to ensure frame is fully decoded and rendered
        // This is critical to avoid dark/black frames
        let seekRetryCount = 0;
        const tryCapture = () => {
          if (isResolved) return;
          
          // Ensure video has valid dimensions and is ready
          if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            // Use requestVideoFrameCallback if available for more reliable frame capture
            if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
              try {
                (video as any).requestVideoFrameCallback(() => {
                  if (!isResolved) {
                    setTimeout(() => {
                      if (!isResolved) {
                        captureFrame();
                      }
                    }, 100);
                  }
                });
                return;
              } catch (e) {
                // Fall through to regular timeout approach
              }
            }
            
            // Fallback: Additional delay to ensure frame is rendered (fixes dark frame issue)
            setTimeout(() => {
              if (!isResolved) {
                captureFrame();
              }
            }, 400); // Increased to 400ms to ensure frame is fully rendered
          } else {
            seekRetryCount++;
            const maxSeekRetries = fileSizeMB > 100 ? 25 : 15; // More retries for large files
            const seekDelay = fileSizeMB > 100 ? 500 : 300; // Longer delay for large files
            if (seekRetryCount < maxSeekRetries) {
              setTimeout(tryCapture, seekDelay);
            } else {
              // Try next fallback time
              if (tryNextFallback) {
                tryNextFallback();
              }
            }
          }
        };
        // Longer initial delay to ensure video frame is ready
        const initialDelay = fileSizeMB > 100 ? 800 : 500;
        setTimeout(tryCapture, initialDelay);
      };
      
      try {
        video.currentTime = targetTime;
      } catch (e) {
        if (tryNextFallback) {
          tryNextFallback();
        }
      }
    };
    
    const proceedWithCapture = () => {
      const duration = video.duration;
      
      // First, try to capture at current position without seeking (fastest)
      // But wait a bit to ensure frame is rendered (fixes dark frame issue)
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        // Video is already loaded and has dimensions, wait a bit then capture
        // This ensures the frame is properly rendered and not dark
        setTimeout(() => {
          if (!isResolved) {
            try {
              captureFrame();
            } catch (e) {
              // If immediate capture fails, continue with seeking approach
              if (!isResolved) {
                // Continue to seeking approach below
                const timePoints = [0, duration * 0.1, duration * 0.3];
                seekAttemptCount = 0;
                tryCaptureAtTime(timePoints[0]);
              }
            }
          }
        }, 300); // Wait 300ms to ensure frame is rendered
        return; // Exit early, capture will happen in setTimeout
      }
      
      // Check if video is valid
      if (!duration || duration === 0 || isNaN(duration)) {
        // If no duration but we have dimensions, try capturing anyway
        // Wait a bit to ensure frame is rendered
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          setTimeout(() => {
            if (!isResolved) {
              captureFrame();
            }
          }, 300); // Wait to ensure frame is rendered
          return;
        }
        cleanup();
        reject(new Error("Video duration not available"));
        return;
      }
      
      // Try different time points: start (0s), then 10%, then 30%
      const timePoints = [0, duration * 0.1, duration * 0.3];
      
      tryNextFallback = () => {
        if (isResolved) return;
        seekAttemptCount++;
        
        if (seekAttemptCount >= timePoints.length) {
          // All attempts failed, try to capture at current time as last resort
          if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            captureFrame();
          } else {
            cleanup();
            reject(new Error("Video frame capture failed after all attempts"));
          }
          return;
        }
        
        // Try next time point with longer delay for large files
        const delay = fileSizeMB > 100 ? 1000 : 500; // Longer delay for files > 100MB
        setTimeout(() => {
          if (!isResolved) {
            tryCaptureAtTime(timePoints[seekAttemptCount]);
          }
        }, delay);
      };
      
      // Try capturing at the beginning first (fastest), then fallback to other times
      seekAttemptCount = 0;
      tryCaptureAtTime(timePoints[0]);
    };
    
    video.onloadedmetadata = () => {
      if (!isResolved && video.duration > 0 && !isNaN(video.duration)) {
        proceedWithCapture();
      }
    };
    
    video.onloadeddata = () => {
      if (!isResolved) {
        proceedWithCapture();
      }
    };

    video.onerror = (e) => {
      cleanup();
      reject(new Error(`Video load failed: ${video.error?.message || 'Unknown error'}`));
    };
    
    // Also handle canplay event as fallback
    video.oncanplay = () => {
      // If loadeddata hasn't fired, try to proceed
      if (!isResolved && video.duration > 0 && video.duration !== 0 && !isNaN(video.duration)) {
        proceedWithCapture();
      }
    };
    
    // Also try oncanplaythrough for more reliable loading
    video.oncanplaythrough = () => {
      if (!isResolved && video.duration > 0 && !isNaN(video.duration)) {
        proceedWithCapture();
      }
    };

    // Adaptive timeout based on file size
    timeoutId = setTimeout(() => {
      if (!isResolved && frames.length === 0) {
        isResolved = true;
        cleanup();
        reject(new Error("Video frame capture timed out"));
      }
    }, timeoutDuration);
  });
};

export const calculateOverlap = (a: string[], b: string[]): number => {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a.map(k => k.toLowerCase()));
  const setB = new Set(b.map(k => k.toLowerCase()));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  return intersection.size;
};

export const generateFilename = (title: string, originalFilename: string): string => {
  if (!title || title.trim() === '') return originalFilename;
  
  // Convert title to filename-friendly format
  let filename = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // Get extension from original filename
  const ext = originalFilename.includes('.') 
    ? originalFilename.substring(originalFilename.lastIndexOf('.'))
    : '';
  
  // Limit length to 200 chars (including extension)
  const maxLength = 200 - ext.length;
  if (filename.length > maxLength) {
    filename = filename.substring(0, maxLength);
  }
  
  return filename + ext;
};

export const calculateReadinessScore = (metadata: Metadata, rejectionRisks: string[]): number => {
  let score = 100;
  
  // Deduct points for rejection risks
  score -= rejectionRisks.length * 5;
  
  // Deduct points if title is too short
  if (metadata.title.length < 20) {
    score -= 10;
  }
  
  // Deduct points if keywords are insufficient
  if (metadata.keywords.length < 10) {
    score -= 15;
  }
  
  return Math.max(0, Math.min(100, score));
};

export const downloadCsv = (files: FileItem[], preset: PlatformPreset) => {
  const csvContent = generateCsvContent(files, preset);
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pitagger_${preset.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generateCsvContent = (files: FileItem[], preset: PlatformPreset): string => {
  // Adobe Stock format: Filename,Title,Keywords,Category,Releases
  const headers = 'Filename,Title,Keywords,Category,Releases\n';
  const rows = files
    .filter(f => f.status === ProcessingStatus.COMPLETED && f.metadata)
    .map(f => generateCsvRow(f, preset))
    .join('\n');
  return headers + rows;
};

export const generateCsvRow = (file: FileItem, preset: PlatformPreset): string => {
  const filename = `"${file.newFilename || file.fileName}"`;
  const title = `"${(file.metadata.title || '').replace(/"/g, '""')}"`;
  const keywords = `"${(file.metadata.keywords || []).join(', ')}"`;
  const category = `"${(file.metadata.category || '').replace(/"/g, '""')}"`;
  const releases = `"${(file.metadata.releases || '').replace(/"/g, '""')}"`;
  
  return `${filename},${title},${keywords},${category},${releases}`;
};

export const parseCsvContent = (content: string): Array<{ filename: string; title: string; keywords: string; category: string; releases: string }> => {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const rows: Array<{ filename: string; title: string; keywords: string; category: string; releases: string }> = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const fields = parseCsvLine(line);
    // Be flexible with older CSV versions if possible, but prioritize new format
    if (fields.length >= 3) {
      if (fields.length >= 5) {
        // New format: Filename,Title,Keywords,Category,Releases
        rows.push({
          filename: fields[0].replace(/^"|"$/g, ''),
          title: fields[1].replace(/^"|"$/g, ''),
          keywords: fields[2].replace(/^"|"$/g, ''),
          category: fields[3].replace(/^"|"$/g, ''),
          releases: fields[4].replace(/^"|"$/g, '')
        });
      } else if (fields.length === 4) {
         // Old format: Filename,Title,Tags,Suggestions
         // Map old format to new structure
         rows.push({
          filename: fields[0].replace(/^"|"$/g, ''),
          title: fields[1].replace(/^"|"$/g, ''),
          keywords: fields[2].replace(/^"|"$/g, ''),
          category: '', // Missing in old format
          releases: '' // Missing in old format
        });
      }
    }
  }
  
  return rows;
};

const parseCsvLine = (line: string): string[] => {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      if (inQuotes && line[j + 1] === '"') {
        currentField += '"';
        j++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField); // Add last field
  return fields;
};

export const downloadAllFiles = async (files: FileItem[]) => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  files.forEach(file => {
    if (file.file && file.metadata) {
      zip.file(file.newFilename || file.file.name, file.file);
    }
  });
  
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pitagger_export_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
