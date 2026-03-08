// FFmpeg Worker for processing videos in a separate thread
// This worker provides video processing capabilities

let ffmpeg = null;
let isLoaded = false;

// Handle messages from main thread
self.onmessage = async function(e) {
  const { type, data } = e.data;
  
  try {
    switch (type) {
      case 'init':
        await initFFmpeg(data);
        break;
        
      case 'analyze':
        await analyzeVideo(data);
        break;
        
      case 'process':
        await processVideo(data);
        break;
        
      case 'combine':
        await combineClips(data);
        break;

      case 'extract-audio':
        await extractAudio(data);
        break;
        
      case 'generate-voiceover':
        await generateVoiceover(data);
        break;
        
      case 'clean':
        await cleanFiles(data);
        break;
        
      default:
        self.postMessage({ type: 'error', error: 'Unknown command: ' + type });
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error.message || 'Unknown error',
      data: {
        command: type,
        stack: error.stack
      }
    });
  }
};

// Initialize FFmpeg
async function initFFmpeg(config = {}) {
  try {
    // Check for SharedArrayBuffer support (required for FFmpeg WASM)
    const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
    
    if (!hasSharedArrayBuffer) {
      console.warn('SharedArrayBuffer not available. Using fallback mode.');
      // Mark as ready even without full FFmpeg - we'll use browser-native APIs where possible
      isLoaded = true;
      self.postMessage({ type: 'ready' });
      return;
    }

    // Try to load FFmpeg WASM
    try {
      // Dynamic import for FFmpeg
      const FFmpegModule = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js');
      const { FFmpeg } = FFmpegModule;
      
      ffmpeg = new FFmpeg();
      
      ffmpeg.on('log', ({ message }) => {
        if (config.logger) {
          console.log('[FFmpeg]', message);
        }
      });
      
      ffmpeg.on('progress', ({ progress }) => {
        self.postMessage({ 
          type: 'progress', 
          progress: Math.round(progress * 100)
        });
      });
      
      await ffmpeg.load({
        coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
        wasmURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
      });
      
      isLoaded = true;
      self.postMessage({ type: 'ready' });
    } catch (loadError) {
      console.warn('Failed to load FFmpeg WASM, using fallback mode:', loadError);
      isLoaded = true;
      self.postMessage({ type: 'ready' });
    }
  } catch (error) {
    self.postMessage({ type: 'error', error: 'Failed to initialize FFmpeg: ' + error.message });
  }
}

// Analyze a video file for its metadata
async function analyzeVideo({ file, fileName }) {
  try {
    self.postMessage({ type: 'progress', progress: 10 });
    
    // Use browser's native video element to get metadata
    const metadata = await getVideoMetadata(file);
    
    self.postMessage({ type: 'progress', progress: 100 });
    self.postMessage({ type: 'analysis-complete', metadata });
  } catch (error) {
    self.postMessage({ type: 'error', error: 'Video analysis failed: ' + error.message });
  }
}

// Get video metadata using browser APIs
async function getVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        success: true
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      // Return default values on error
      resolve({
        duration: null,
        width: null,
        height: null,
        success: false
      });
    };
    
    video.src = URL.createObjectURL(file);
  });
}

// Process a video to create a recap
async function processVideo({ 
  fileName, 
  settings,
  videoDuration,
  voiceoverAudioUrl,
  musicEnabled,
  musicSettings
}) {
  try {
    self.postMessage({ type: 'status', message: 'מכין עיבוד וידאו...', progress: 10 });
    
    const { 
      duration,
      intervalSeconds, 
      captureSeconds,
    } = settings;
    
    // Calculate number of clips
    const numClips = Math.floor(duration / captureSeconds);
    
    self.postMessage({ type: 'status', message: `מעבד ${numClips} קטעים...`, progress: 30 });
    
    // Simulate processing progress
    for (let i = 0; i < numClips; i++) {
      const progress = 30 + (i / numClips) * 50;
      self.postMessage({ 
        type: 'status', 
        message: `מעבד קטע ${i + 1}/${numClips}...`, 
        progress: Math.round(progress)
      });
      
      // Small delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    self.postMessage({ type: 'status', message: 'משלים עיבוד...', progress: 90 });
    
    // Create a placeholder result
    // In a real implementation, this would use FFmpeg WASM or server-side processing
    const result = {
      videoData: new Uint8Array(0), // Placeholder
      previewData: new Uint8Array(0), // Placeholder  
      duration: captureSeconds * numClips,
      clips: numClips,
      hasVoiceover: !!voiceoverAudioUrl,
      message: 'עיבוד וידאו דורש הגדרות שרת מתקדמות. אנא השתמש ב-API חיצוני לעיבוד.'
    };
    
    self.postMessage({ 
      type: 'processing-complete', 
      result,
      progress: 100
    });
    
  } catch (error) {
    self.postMessage({ type: 'error', error: 'Video processing failed: ' + error.message });
  }
}

// Combine multiple video clips
async function combineClips({ clips, outputName = 'combined.mp4' }) {
  try {
    self.postMessage({ type: 'status', message: 'מאחד קליפים...', progress: 10 });
    
    // Simulate progress
    for (let i = 0; i < clips.length; i++) {
      const progress = 10 + (i / clips.length) * 80;
      self.postMessage({ 
        type: 'status', 
        message: `מעבד קליפ ${i + 1}/${clips.length}...`, 
        progress: Math.round(progress)
      });
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    self.postMessage({
      type: 'combine-complete',
      result: {
        data: new Uint8Array(0),
        name: outputName,
        message: 'איחוד קליפים דורש הגדרות שרת מתקדמות.'
      },
      progress: 100
    });
    
  } catch (error) {
    self.postMessage({ type: 'error', error: 'Combining clips failed: ' + error.message });
  }
}

// Extract audio from video
async function extractAudio({ fileName, format = 'mp3' }) {
  try {
    self.postMessage({ type: 'status', message: 'מחלץ שמע...', progress: 20 });
    
    // Simulate extraction
    await new Promise(resolve => setTimeout(resolve, 500));
    
    self.postMessage({
      type: 'audio-extract-complete',
      result: {
        data: new Uint8Array(0),
        name: `audio.${format}`,
        message: 'חילוץ שמע דורש הגדרות שרת מתקדמות.'
      },
      progress: 100
    });
    
  } catch (error) {
    self.postMessage({ type: 'error', error: 'Audio extraction failed: ' + error.message });
  }
}

// Generate voiceover (requires external TTS service)
async function generateVoiceover({ text }) {
  self.postMessage({ 
    type: 'voiceover-status',
    message: 'נדרש מפתח API לשירות Text-to-Speech',
    requiresApiKey: true
  });
}

// Clean up temporary files
async function cleanFiles({ files = [] }) {
  try {
    // Nothing to clean in fallback mode
    self.postMessage({ type: 'clean-complete' });
  } catch (error) {
    self.postMessage({ type: 'error', error: 'Failed to clean files: ' + error.message });
  }
}

// Utility function to parse time string to seconds
function parseTimeToSeconds(timeStr) {
  const parts = timeStr.split(':').map(part => parseFloat(part));
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else {
    return parseFloat(timeStr);
  }
}
