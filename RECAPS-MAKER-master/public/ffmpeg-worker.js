// FFmpeg Worker - Classic Worker using @ffmpeg/ffmpeg v0.11 createFFmpeg API
// Must be loaded as a classic worker (no { type: 'module' }).
// ffmpegService.ts: new Worker('/ffmpeg-worker.js')  — NO { type: 'module' }

// Step 1: Load the ffmpeg.min.js UMD bundle (exposes createFFmpeg / fetchFile on self.FFmpeg)
importScripts('/ffmpeg.min.js');

// Step 2: Destructure the API
const { createFFmpeg, fetchFile } = self.FFmpeg;

// ─── State ────────────────────────────────────────────────────────────────────
let ffmpeg = null;
let isReady = false;
const pendingMessages = [];

// ─── Message router ───────────────────────────────────────────────────────────
self.onmessage = function (e) {
  if (!isReady && e.data.type !== 'init') {
    pendingMessages.push(e);
    return;
  }
  handleMessage(e.data).catch((err) => {
    self.postMessage({
      type: 'error',
      error: err.message || String(err),
      data: { command: e.data.type, stack: err.stack }
    });
  });
};

async function handleMessage({ type, data }) {
  switch (type) {
    case 'init':          await initFFmpeg(data || {}); break;
    case 'analyze':       await analyzeVideo(data);     break;
    case 'process':       await processVideo(data);     break;
    case 'combine':       await combineClips(data);     break;
    case 'extract-audio': await extractAudio(data);     break;
    case 'generate-voiceover': await generateVoiceover(data); break;
    case 'clean':         await cleanFiles(data);       break;
    default:
      self.postMessage({ type: 'error', error: 'Unknown command: ' + type });
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function initFFmpeg(_config) {
  try {
    if (ffmpeg && ffmpeg.isLoaded()) {
      isReady = true;
      self.postMessage({ type: 'ready' });
      flushPending();
      return;
    }

    ffmpeg = createFFmpeg({
      // Point to locally-served files so no CDN is needed
      corePath: self.location.origin + '/ffmpeg-core.js',
      wasmPath: self.location.origin + '/ffmpeg-core.wasm',
      workerPath: self.location.origin + '/ffmpeg-core.worker.js',
      log: false,
      logger: ({ type: t, message }) => {
        // Forward ffmpeg log lines as status messages (progress parsing happens in service)
        if (t === 'ffout' || t === 'fferr') {
          self.postMessage({ type: 'status', message, progress: -1 });
        }
      },
      progress: ({ ratio }) => {
        const pct = Math.min(Math.round((ratio || 0) * 100), 99);
        self.postMessage({ type: 'progress', progress: pct });
      }
    });

    self.postMessage({ type: 'status', message: 'טוען מנוע FFmpeg...', progress: 5 });

    await ffmpeg.load();

    isReady = true;
    self.postMessage({ type: 'ready' });
    flushPending();
  } catch (err) {
    self.postMessage({ type: 'error', error: 'Failed to initialize FFmpeg: ' + err.message });
  }
}

function flushPending() {
  const msgs = pendingMessages.splice(0);
  for (const e of msgs) {
    handleMessage(e.data).catch((err) => {
      self.postMessage({ type: 'error', error: err.message || String(err) });
    });
  }
}

// ─── Helper: write file into FFmpeg FS ───────────────────────────────────────
async function writeToFS(name, fileOrData) {
  // fetchFile handles File, Blob, ArrayBuffer, Uint8Array, URL strings
  const data = await fetchFile(fileOrData);
  ffmpeg.FS('writeFile', name, data);
}

function readFromFS(name) {
  return ffmpeg.FS('readFile', name);
}

function unlinkFS(name) {
  try { ffmpeg.FS('unlink', name); } catch (_) { /* ignore */ }
}

// ─── Analyze ──────────────────────────────────────────────────────────────────
async function analyzeVideo({ file, fileName }) {
  await writeToFS(fileName, file);

  // Capture log output to extract metadata
  const logs = [];
  const prevLogger = ffmpeg.setLogger;
  ffmpeg.setLogger(({ type: t, message }) => {
    if (t === 'ffout' || t === 'fferr') logs.push(message);
  });

  try {
    // -i only → ffmpeg exits with error code 1, that's expected
    await ffmpeg.run('-i', fileName).catch(() => {});
  } finally {
    // Restore default logger
    ffmpeg.setLogger(({ type: t, message }) => {
      if (t === 'ffout' || t === 'fferr') {
        self.postMessage({ type: 'status', message, progress: -1 });
      }
    });
  }

  const logText = logs.join('\n');
  const durationMatch = logText.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const resMatch      = logText.match(/(\d{2,5})x(\d{2,5})/);

  let duration = null;
  if (durationMatch) {
    duration =
      parseInt(durationMatch[1]) * 3600 +
      parseInt(durationMatch[2]) * 60 +
      parseFloat(durationMatch[3]);
  }

  self.postMessage({
    type: 'analysis-complete',
    metadata: {
      duration,
      width:   resMatch ? parseInt(resMatch[1]) : null,
      height:  resMatch ? parseInt(resMatch[2]) : null,
      success: true
    }
  });

  unlinkFS(fileName);
}

// ─── Process (create recap) ───────────────────────────────────────────────────
async function processVideo({ fileName, settings, videoDuration, voiceoverAudioUrl }) {
  const { duration, intervalSeconds, captureSeconds } = settings;

  self.postMessage({ type: 'status', message: 'מכין קליפים...', progress: 10 });

  const filters      = [];
  const concatInputs = [];
  const numClips     = Math.floor(duration / captureSeconds);

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
        progress: 10 + Math.round((i / numClips) * 30)
      });
    }
  }

  if (concatInputs.length === 0) {
    throw new Error('לא נוצרו קטעים. בדוק את אורך הוידאו והגדרות.');
  }

  const filterComplex =
    `${filters.join(';')};${concatInputs.join('')}concat=n=${concatInputs.length}:v=1:a=0[outv]`;

  self.postMessage({ type: 'status', message: 'מרכיב סיכום...', progress: 40 });

  await ffmpeg.run(
    '-i', fileName,
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
    '-an',
    'output.mp4'
  );

  let outputFile = 'output.mp4';

  if (voiceoverAudioUrl) {
    self.postMessage({ type: 'status', message: 'מוסיף קריינות...', progress: 70 });
    await writeToFS('voiceover.mp3', voiceoverAudioUrl);

    await ffmpeg.run(
      '-i', 'output.mp4',
      '-i', 'voiceover.mp3',
      '-c:v', 'copy', '-c:a', 'aac',
      '-shortest',
      '-map', '0:v:0', '-map', '1:a:0?',
      'final.mp4'
    );
    outputFile = 'final.mp4';
  }

  self.postMessage({ type: 'status', message: 'מסיים...', progress: 90 });

  const videoData = readFromFS(outputFile);
  const result = {
    videoData:   new Uint8Array(videoData.buffer),
    previewData: new Uint8Array(0),
    duration:    captureSeconds * concatInputs.length,
    clips:       concatInputs.length,
    hasVoiceover: !!voiceoverAudioUrl
  };

  // Optional preview frame
  try {
    await ffmpeg.run('-i', outputFile, '-ss', '00:00:02', '-frames:v', '1', 'preview.jpg');
    const previewData  = readFromFS('preview.jpg');
    result.previewData = new Uint8Array(previewData.buffer);
    unlinkFS('preview.jpg');
  } catch (_) { /* preview is optional */ }

  self.postMessage({ type: 'processing-complete', result, progress: 100 });

  unlinkFS(fileName);
  unlinkFS('output.mp4');
  unlinkFS('final.mp4');
  unlinkFS('voiceover.mp3');
}

// ─── Combine clips ────────────────────────────────────────────────────────────
async function combineClips({ clips, outputName = 'combined.mp4' }) {
  for (let i = 0; i < clips.length; i++) {
    await writeToFS(`clip_${i}.mp4`, clips[i].data);
    self.postMessage({
      type: 'status',
      message: `מכין קליפ ${i + 1}/${clips.length}...`,
      progress: Math.round((i / clips.length) * 50)
    });
  }

  const listContent = clips.map((_, i) => `file 'clip_${i}.mp4'`).join('\n');
  ffmpeg.FS('writeFile', 'list.txt', new TextEncoder().encode(listContent));

  self.postMessage({ type: 'status', message: 'מאחד קליפים...', progress: 55 });

  await ffmpeg.run('-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', outputName);

  const outData = readFromFS(outputName);
  self.postMessage({
    type: 'combine-complete',
    result: { data: new Uint8Array(outData.buffer), name: outputName },
    progress: 100
  });

  for (let i = 0; i < clips.length; i++) unlinkFS(`clip_${i}.mp4`);
  unlinkFS('list.txt');
}

// ─── Extract audio ────────────────────────────────────────────────────────────
async function extractAudio({ fileName, format = 'mp3' }) {
  self.postMessage({ type: 'status', message: 'מחלץ שמע...', progress: 20 });
  const outName = `audio.${format}`;
  const codec   = format === 'mp3' ? 'libmp3lame' : 'aac';

  await ffmpeg.run('-i', fileName, '-vn', '-acodec', codec, outName);

  const audioData = readFromFS(outName);
  self.postMessage({
    type: 'audio-extract-complete',
    result: { data: new Uint8Array(audioData.buffer), name: outName },
    progress: 100
  });
  unlinkFS(outName);
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

  for (const f of targets) unlinkFS(f);
  self.postMessage({ type: 'clean-complete' });
}
