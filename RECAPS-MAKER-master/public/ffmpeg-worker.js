// FFmpeg Worker for processing videos in a separate thread
importScripts('https://unpkg.com/@ffmpeg/ffmpeg@0.11.0/dist/ffmpeg.min.js');

// Initialize FFmpeg
const { createFFmpeg, fetchFile } = FFmpeg;
let ffmpeg = null;

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
        inputData: data,
        stack: error.stack
      }
    });
  }
};

// Initialize FFmpeg with optional progress callback
async function initFFmpeg(config = {}) {
  try {
    const { logger = true, corePath = 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js' } = config;
    
    ffmpeg = createFFmpeg({ 
      log: logger,
      corePath,
      progress: ({ ratio }) => {
        self.postMessage({ 
          type: 'progress', 
          progress: Math.round(ratio * 100)
        });
      }
    });
    
    await ffmpeg.load();
    self.postMessage({ type: 'ready' });
  } catch (error) {
    self.postMessage({ type: 'error', error: 'Failed to initialize FFmpeg: ' + error.message });
  }
}

// Analyze a video file for its metadata (duration, resolution, etc)
async function analyzeVideo({ file, fileName }) {
  try {
    if (!ffmpeg) throw new Error('FFmpeg not initialized. Call init first.');
    
    // Write the file to ffmpeg's virtual filesystem
    ffmpeg.FS('writeFile', fileName, await fetchFile(file));
    
    // Run ffprobe to get video info
    await ffmpeg.run('-i', fileName);
    
    // Unfortunately, ffmpeg.wasm doesn't have direct ffprobe access,
    // so we'll extract info from the error messages it produces
    
    const logs = ffmpeg.logMessage;
    
    // Parse logs to extract metadata
    const durationMatch = logs.match(/Duration: ([0-9:.]+)/);
    const resolutionMatch = logs.match(/Stream.*Video.*([0-9]{2,})x([0-9]{2,})/);
    
    const metadata = {
      duration: durationMatch ? parseTimeToSeconds(durationMatch[1]) : null,
      width: resolutionMatch ? parseInt(resolutionMatch[1]) : null,
      height: resolutionMatch ? parseInt(resolutionMatch[2]) : null,
      success: true
    };
    
    self.postMessage({ type: 'analysis-complete', metadata });
  } catch (error) {
    self.postMessage({ type: 'error', error: 'Video analysis failed: ' + error.message });
  }
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
    if (!ffmpeg) throw new Error('FFmpeg not initialized. Call init first.');
    
    const { 
      duration,
      intervalSeconds, 
      captureSeconds,
    } = settings;
    
    self.postMessage({ type: 'status', message: 'מכין קליפים...', progress: 10 });
    
    const numClips = Math.floor(duration / captureSeconds);
    const filters = [];
    const concatInputs = [];
    
    for (let i = 0; i < numClips; i++) {
      const startTime = i * intervalSeconds;
      if (startTime + captureSeconds > videoDuration) {
        self.postMessage({ 
          type: 'warning', 
          warning: `Stopping early, video duration of ${videoDuration}s is not enough for all clips.` 
        });
        break;
      }
      
      // Create clip with setpts to reset timestamps
      filters.push(`[0:v]trim=start=${startTime}:end=${startTime + captureSeconds},setpts=PTS-STARTPTS[v${i}]`);
      
      if (i % 5 === 0) {
        self.postMessage({ 
          type: 'status', 
          message: `מחלק סרטון לקטעים (${i}/${numClips})...`, 
          progress: 10 + (i / numClips) * 30 
        });
      }
      
      concatInputs.push(`[v${i}]`);
    }
    
    if (concatInputs.length === 0) {
      throw new Error("לא נוצרו קטעים. בדוק את אורך הווידאו והגדרות הסיכום.");
    }
    
    // Combine all clips with the concat filter
    const filterComplex = `${filters.join(';')};${concatInputs.join('')}concat=n=${concatInputs.length}:v=1:a=0[outv]`;
    
    self.postMessage({ type: 'status', message: 'מרכיב את סרטון הסיכום...', progress: 40 });
    
    // Apply filter complex and create output (video only)
    await ffmpeg.run(
      '-i', fileName,
      '-filter_complex', filterComplex,
      '-map', '[outv]',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-an', // No audio
      'output.mp4'
    );
    
    // If voiceover audio provided, overlay it
    if (voiceoverAudioUrl) {
      self.postMessage({ type: 'status', message: 'מוסיף קריינות...', progress: 70 });
      
      // Fetch voiceover audio
      const audioResponse = await fetch(voiceoverAudioUrl);
      const audioArrayBuffer = await audioResponse.arrayBuffer();
      const audioUint8Array = new Uint8Array(audioArrayBuffer);
      
      ffmpeg.FS('writeFile', 'voiceover.mp3', audioUint8Array);
      
      // Overlay audio on video (stretch audio to match video if needed)
      await ffmpeg.run(
        '-i', 'output.mp4',
        '-i', 'voiceover.mp3',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-shortest',
        '-map', '0:v:0',
        '-map', '1:a:0?',
        'final.mp4'
      );
      
      // Read final video
      const finalData = ffmpeg.FS('readFile', 'final.mp4');
      
      // Extract preview
      self.postMessage({ type: 'status', message: 'יוצר תמונת תצוגה מקדימה...', progress: 95 });
      await ffmpeg.run(
        '-i', 'final.mp4',
        '-ss', '00:00:03',
        '-frames:v', '1',
        'preview.jpg'
      );
      
      const previewData = ffmpeg.FS('readFile', 'preview.jpg');
      
      self.postMessage({ 
        type: 'processing-complete', 
        result: {
          videoData: new Uint8Array(finalData.buffer),
          previewData: new Uint8Array(previewData.buffer),
          duration: captureSeconds * concatInputs.length,
          clips: concatInputs.length,
          hasVoiceover: true
        },
        progress: 100
      });
      
      // Cleanup
      try {
        ffmpeg.FS('unlink', 'voiceover.mp3');
        ffmpeg.FS('unlink', 'final.mp4');
      } catch (e) {}
      
    } else {
      // No voiceover - use original output
      self.postMessage({ type: 'status', message: 'יוצר תמונת תצוגה מקדימה...', progress: 90 });
      
      await ffmpeg.run(
        '-i', 'output.mp4',
        '-ss', '00:00:03',
        '-frames:v', '1',
        'preview.jpg'
      );
      
      const videoData = ffmpeg.FS('readFile', 'output.mp4');
      const previewData = ffmpeg.FS('readFile', 'preview.jpg');
      
      self.postMessage({ 
        type: 'processing-complete', 
        result: {
          videoData: new Uint8Array(videoData.buffer),
          previewData: new Uint8Array(previewData.buffer),
          duration: captureSeconds * concatInputs.length,
          clips: concatInputs.length,
          hasVoiceover: false
        },
        progress: 100
      });
    }
    
  } catch (error) {
    self.postMessage({ type: 'error', error: 'Video processing failed: ' + error.message });
  }
}

// Combine multiple video clips into a single file
async function combineClips({ clips, outputName = 'combined.mp4' }) {
  try {
    if (!ffmpeg) throw new Error('FFmpeg not initialized. Call init first.');
    
    // Write each clip to the file system
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      ffmpeg.FS('writeFile', `clip_${i}.mp4`, await fetchFile(clip.data));
      
      self.postMessage({ 
        type: 'status', 
        message: `מכין קליפ ${i+1}/${clips.length}...`,
        progress: Math.round((i / clips.length) * 50)
      });
    }
    
    // Create a file list for concatenation
    let fileContent = '';
    for (let i = 0; i < clips.length; i++) {
      fileContent += `file clip_${i}.mp4\n`;
    }
    ffmpeg.FS('writeFile', 'list.txt', fileContent);
    
    self.postMessage({ type: 'status', message: 'מאחד קליפים...', progress: 50 });
    
    // Concatenate files using the concat demuxer
    await ffmpeg.run(
      '-f', 'concat',
      '-safe', '0',
      '-i', 'list.txt',
      '-c', 'copy',
      outputName
    );
    
    self.postMessage({ type: 'status', message: 'הורדת קובץ משולב...', progress: 90 });
    
    // Return the result
    const outputData = ffmpeg.FS('readFile', outputName);
    self.postMessage({
      type: 'combine-complete',
      result: {
        data: new Uint8Array(outputData.buffer),
        name: outputName
      },
      progress: 100
    });
    
  } catch (error) {
    self.postMessage({ type: 'error', error: 'Combining clips failed: ' + error.message });
  }
}

// Extract audio from a video file
async function extractAudio({ fileName, format = 'mp3' }) {
  try {
    if (!ffmpeg) throw new Error('FFmpeg not initialized. Call init first.');
    
    const outputName = `audio.${format}`;
    
    self.postMessage({ type: 'status', message: 'מחלץ שמע...', progress: 20 });
    
    // Extract audio
    await ffmpeg.run(
      '-i', fileName,
      '-vn', // No video
      '-acodec', format === 'mp3' ? 'libmp3lame' : 'aac',
      outputName
    );
    
    self.postMessage({ type: 'status', message: 'הורדת קובץ שמע...', progress: 80 });
    
    const audioData = ffmpeg.FS('readFile', outputName);
    self.postMessage({
      type: 'audio-extract-complete',
      result: {
        data: new Uint8Array(audioData.buffer),
        name: outputName
      },
      progress: 100
    });
    
  } catch (error) {
    self.postMessage({ type: 'error', error: 'Audio extraction failed: ' + error.message });
  }
}

// Generate a voiceover audio file from text (placeholder)
async function generateVoiceover({ text }) {
  // This would typically connect to a TTS service
  // For now, just return a message that this needs API key
  self.postMessage({ 
    type: 'voiceover-status',
    message: 'נדרש מפתח API לשירות Text-to-Speech',
    requiresApiKey: true
  });
}

// Clean up files from ffmpeg filesystem to free memory
async function cleanFiles({ files = [] }) {
  try {
    if (!ffmpeg) throw new Error('FFmpeg not initialized. Call init first.');
    
    // If no specific files, clean common temporary files
    if (files.length === 0) {
      const commonFiles = ['output.mp4', 'preview.jpg', 'audio.mp3', 'list.txt'];
      
      for (const file of commonFiles) {
        try {
          ffmpeg.FS('unlink', file);
        } catch (e) {
          // Ignore errors for non-existent files
        }
      }
    } else {
      // Delete specific files
      for (const file of files) {
        try {
          ffmpeg.FS('unlink', file);
        } catch (e) {
          self.postMessage({ type: 'warning', warning: `Failed to delete file: ${file}` });
        }
      }
    }
    
    self.postMessage({ type: 'clean-complete' });
  } catch (error) {
    self.postMessage({ type: 'error', error: 'Failed to clean files: ' + error.message });
  }
}

// Utility function to parse time like "00:00:10.00" into seconds
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