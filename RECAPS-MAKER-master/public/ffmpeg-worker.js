// FFmpeg Worker - Classic Worker (no module) using @ffmpeg/ffmpeg v0.11
// Uses importScripts which is only available in classic (non-module) workers.
// ffmpegService.ts must NOT pass { type: 'module' } when creating this worker.

importScripts('/ffmpeg-core.js');

// @ffmpeg/ffmpeg v0.11 exposes createFFmpeg and fetchFile on self after the
// core script is loaded via importScripts.
// However, the bundled ffmpeg.min.js is the one that exposes createFFmpeg.
// We use the UMD build from node_modules that is already copied to /public.

// Re-import the ffmpeg wrapper (UMD) which wraps the core
// The core is already loaded above; now load the wrapper
importScripts('/ffmpeg-core.worker.js');

// Actually, for @ffmpeg/ffmpeg@0.11 the correct approach is:
// 1. Use the CDN or local copy of ffmpeg.min.js (the wrapper)
// 2. It will internally load ffmpeg-core.js
// Let us use the local ffmpeg.min.js from node_modules (copied to public below)
// But since we already have the core files, let's inline the minimal API directly.

// ─── RESET: use only the core directly ───────────────────────────────────────
// The @ffmpeg/core package exposes Module on self after importScripts.
// We build a minimal compatible interface on top of it.

let ffmpegModule = null;
let isReady = false;

// Queue messages that arrive before ffmpeg is ready
const pendingMessages = [];

self.onmessage = function (e) {
  if (!isReady && e.data.type !== 'init') {
    pendingMessages.push(e);
    return;
  }
  handleMessage(e.data);
};

async function handleMessage({ type, data }) {
  try {
    switch (type) {
      case 'init':
        await initFFmpeg(data || {});
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
  } catch (err) {
    self.postMessage({
      type: 'error',
      error: err.message || 'Unknown error',
      data: { command: type, stack: err.stack }
    });
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function initFFmpeg(config = {}) {
  try {
    // ffmpegModule is the Emscripten Module exposed by ffmpeg-core.js
    // After importScripts('/ffmpeg-core.js') it lives on self.Module
    // We wait for it to be ready
    await waitForModule();

    ffmpegModule = self.Module;
    isReady = true;

    self.postMessage({ type: 'ready' });

    // Process any messages that arrived before ready
    for (const pending of pendingMessages) {
      handleMessage(pending.data);
    }
    pendingMessages.length = 0;
  } catch (err) {
    self.postMessage({ type: 'error', error: 'Failed to initialize FFmpeg: ' + err.message });
  }
}

function waitForModule() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('FFmpeg core timed out after 30s')), 30000);

    function check() {
      if (self.Module && self.Module.ccall) {
        clearTimeout(timeout);
        resolve();
      } else {
        setTimeout(check, 100);
      }
    }
    check();
  });
}

// ─── Run ffmpeg command ───────────────────────────────────────────────────────
function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const mod = ffmpegModule;
    if (!mod) return reject(new Error('FFmpeg not initialized'));

    // v0.11 core exposes ccall('main', ...)
    try {
      const result = mod.ccall(
        'main',
        'number',
        ['number', 'number'],
        [args.length, stringArrayToPtr(args, mod)]
      );
      if (result !== 0 && result !== 1) {
        // non-zero may still be OK for -i probe
      }
      resolve(result);
    } catch (e) {
      reject(e);
    }
  });
}

function stringArrayToPtr(arr, mod) {
  const ptrs = arr.map(s => {
    const len = mod.lengthBytesUTF8(s) + 1;
    const ptr = mod._malloc(len);
    mod.stringToUTF8(s, ptr, len);
    return ptr;
  });
  const arrayPtr = mod._malloc(ptrs.length * 4);
  ptrs.forEach((p, i) => mod.setValue(arrayPtr + i * 4, p, 'i32'));
  return arrayPtr;
}

function writeFile(name, data) {
  const mod = ffmpegModule;
  mod.FS_createDataFile('/', name, data, true, true, true);
}

function readFile(name) {
  const mod = ffmpegModule;
  return mod.FS_readFile('/' + name);
}

function unlinkFile(name) {
  try {
    ffmpegModule.FS_unlink('/' + name);
  } catch (_) { /* ignore */ }
}

// Convert File/Blob/ArrayBuffer/Uint8Array to Uint8Array
async function toUint8Array(data) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (data instanceof Blob || data instanceof File) {
    const buf = await data.arrayBuffer();
    return new Uint8Array(buf);
  }
  throw new Error('Unsupported data type for toUint8Array');
}

// ─── Analyze ──────────────────────────────────────────────────────────────────
async function analyzeVideo({ file, fileName }) {
  const data = await toUint8Array(file);
  writeFile(fileName, data);

  // Capture log output
  const logs = [];
  const origPrint = ffmpegModule.print;
  const origPrintErr = ffmpegModule.printErr;
  ffmpegModule.print = (msg) => logs.push(msg);
  ffmpegModule.printErr = (msg) => logs.push(msg);

  try {
    await runFFmpeg(['ffmpeg', '-i', fileName]);
  } catch (_) { /* expected: ffmpeg exits with error for -i probe */ }

  ffmpegModule.print = origPrint;
  ffmpegModule.printErr = origPrintErr;

  const logText = logs.join('\n');
  const durationMatch = logText.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const resMatch = logText.match(/(\d{2,5})x(\d{2,5})/);

  let duration = null;
  if (durationMatch) {
    duration = parseInt(durationMatch[1]) * 3600 +
               parseInt(durationMatch[2]) * 60 +
               parseFloat(durationMatch[3]);
  }

  self.postMessage({
    type: 'analysis-complete',
    metadata: {
      duration,
      width: resMatch ? parseInt(resMatch[1]) : null,
      height: resMatch ? parseInt(resMatch[2]) : null,
      success: true
    }
  });

  unlinkFile(fileName);
}

// ─── Process (create recap) ───────────────────────────────────────────────────
async function processVideo({ fileName, settings, videoDuration, voiceoverAudioUrl }) {
  const { duration, intervalSeconds, captureSeconds } = settings;

  self.postMessage({ type: 'status', message: 'מכין קליפים...', progress: 10 });

  const numClips = Math.floor(duration / captureSeconds);
  const filters = [];
  const concatInputs = [];

  for (let i = 0; i < numClips; i++) {
    const startTime = i * intervalSeconds;
    if (startTime + captureSeconds > videoDuration) {
      self.postMessage({
        type: 'warning',
        warning: `עוצר מוקדם: הוידאו (${videoDuration}s) אינו מספיק לכל הקטעים.`
      });
      break;
    }
    filters.push(
      `[0:v]trim=start=${startTime}:end=${startTime + captureSeconds},setpts=PTS-STARTPTS[v${i}]`
    );
    concatInputs.push(`[v${i}]`);

    if (i % 5 === 0) {
      self.postMessage({
        type: 'status',
        message: `מחלק לקטעים (${i}/${numClips})...`,
        progress: 10 + (i / numClips) * 30
      });
    }
  }

  if (concatInputs.length === 0) {
    throw new Error('לא נוצרו קטעים. בדוק את אורך הוידאו והגדרות.');
  }

  const filterComplex =
    `${filters.join(';')};${concatInputs.join('')}concat=n=${concatInputs.length}:v=1:a=0[outv]`;

  self.postMessage({ type: 'status', message: 'מרכיב סיכום...', progress: 40 });

  await runFFmpeg([
    'ffmpeg', '-i', fileName,
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
    '-an',
    'output.mp4'
  ]);

  let outputFile = 'output.mp4';

  if (voiceoverAudioUrl) {
    self.postMessage({ type: 'status', message: 'מוסיף קריינות...', progress: 70 });
    const audioResp = await fetch(voiceoverAudioUrl);
    const audioData = new Uint8Array(await audioResp.arrayBuffer());
    writeFile('voiceover.mp3', audioData);

    await runFFmpeg([
      'ffmpeg',
      '-i', 'output.mp4',
      '-i', 'voiceover.mp3',
      '-c:v', 'copy', '-c:a', 'aac',
      '-shortest',
      '-map', '0:v:0', '-map', '1:a:0?',
      'final.mp4'
    ]);
    outputFile = 'final.mp4';
  }

  self.postMessage({ type: 'status', message: 'מסיים...', progress: 90 });

  const videoData = readFile(outputFile.replace('/', ''));
  const result = {
    videoData: new Uint8Array(videoData.buffer),
    previewData: new Uint8Array(0),
    duration: captureSeconds * concatInputs.length,
    clips: concatInputs.length,
    hasVoiceover: !!voiceoverAudioUrl
  };

  // Try to get a preview frame
  try {
    await runFFmpeg([
      'ffmpeg', '-i', outputFile,
      '-ss', '00:00:02', '-frames:v', '1',
      'preview.jpg'
    ]);
    const previewData = readFile('preview.jpg');
    result.previewData = new Uint8Array(previewData.buffer);
    unlinkFile('preview.jpg');
  } catch (_) { /* preview is optional */ }

  self.postMessage({ type: 'processing-complete', result, progress: 100 });

  // Cleanup
  unlinkFile(fileName);
  unlinkFile('output.mp4');
  unlinkFile('final.mp4');
  unlinkFile('voiceover.mp3');
}

// ─── Combine clips ────────────────────────────────────────────────────────────
async function combineClips({ clips, outputName = 'combined.mp4' }) {
  for (let i = 0; i < clips.length; i++) {
    const data = await toUint8Array(clips[i].data);
    writeFile(`clip_${i}.mp4`, data);
    self.postMessage({
      type: 'status',
      message: `מכין קליפ ${i + 1}/${clips.length}...`,
      progress: Math.round((i / clips.length) * 50)
    });
  }

  let listContent = '';
  for (let i = 0; i < clips.length; i++) listContent += `file '/clip_${i}.mp4'\n`;
  writeFile('list.txt', new TextEncoder().encode(listContent));

  self.postMessage({ type: 'status', message: 'מאחד קליפים...', progress: 55 });

  await runFFmpeg([
    'ffmpeg', '-f', 'concat', '-safe', '0',
    '-i', 'list.txt', '-c', 'copy', outputName
  ]);

  const outData = readFile(outputName);
  self.postMessage({
    type: 'combine-complete',
    result: { data: new Uint8Array(outData.buffer), name: outputName },
    progress: 100
  });

  for (let i = 0; i < clips.length; i++) unlinkFile(`clip_${i}.mp4`);
  unlinkFile('list.txt');
}

// ─── Extract audio ────────────────────────────────────────────────────────────
async function extractAudio({ fileName, format = 'mp3' }) {
  self.postMessage({ type: 'status', message: 'מחלץ שמע...', progress: 20 });
  const outName = `audio.${format}`;
  const codec = format === 'mp3' ? 'libmp3lame' : 'aac';

  await runFFmpeg([
    'ffmpeg', '-i', fileName,
    '-vn', '-acodec', codec,
    outName
  ]);

  const audioData = readFile(outName);
  self.postMessage({
    type: 'audio-extract-complete',
    result: { data: new Uint8Array(audioData.buffer), name: outName },
    progress: 100
  });
  unlinkFile(outName);
}

// ─── Voiceover (placeholder) ──────────────────────────────────────────────────
async function generateVoiceover(_data) {
  self.postMessage({
    type: 'voiceover-status',
    message: 'נדרש מפתח API לשירות TTS',
    requiresApiKey: true
  });
}

// ─── Clean ────────────────────────────────────────────────────────────────────
async function cleanFiles({ files = [] }) {
  const targets = files.length > 0
    ? files
    : ['output.mp4', 'final.mp4', 'preview.jpg', 'audio.mp3', 'list.txt', 'voiceover.mp3'];

  for (const f of targets) unlinkFile(f);
  self.postMessage({ type: 'clean-complete' });
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function parseTimeToSeconds(timeStr) {
  const parts = timeStr.split(':').map(parseFloat);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parseFloat(timeStr);
}
