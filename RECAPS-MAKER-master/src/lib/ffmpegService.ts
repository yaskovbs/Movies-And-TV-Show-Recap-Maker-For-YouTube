import { ProcessingStatus } from '../types';

interface FFmpegConfig {
  logger?: boolean;
  corePath?: string;
}

interface VideoMetadata {
  duration: number | null;
  width: number | null;
  height: number | null;
  success: boolean;
}

interface ProcessingResult {
  videoData: Uint8Array;
  previewData: Uint8Array;
  duration: number;
  clips: number;
}

interface ClipData {
  data: Blob | ArrayBuffer;
  name?: string;
}

interface CombineResult {
  data: Uint8Array;
  name: string;
}

interface AudioResult {
  data: Uint8Array;
  name: string;
}

type ProgressCallback = (progress: number) => void;
type StatusCallback = (status: Partial<ProcessingStatus>) => void;
type ErrorCallback = (error: string) => void;
// CompleteCallback is a utility type kept for potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CompleteCallback<T> = (result: T) => void;

class FFmpegService {
  private static instance: FFmpegService;
  private worker: Worker | null = null;
  private isReady = false;
  private callbacks: Map<string, ((...args: unknown[]) => void)[]> = new Map();
  private activeOperations: Set<string> = new Set();

  private constructor() {
    this.initWorker();
  }

  public static getInstance(): FFmpegService {
    if (!FFmpegService.instance) {
      FFmpegService.instance = new FFmpegService();
    }
    return FFmpegService.instance;
  }

  private initWorker() {
    try {
      this.worker = new Worker(new URL('/ffmpeg-worker.js', import.meta.url), { type: 'module' });
      this.setupWorkerListeners();
    } catch (error) {
      console.error('Failed to initialize FFmpeg worker:', error);
    }
  }

  private setupWorkerListeners() {
    if (!this.worker) return;

    this.worker.onmessage = (event) => {
      const { type, ...data } = event.data;

      switch (type) {
        case 'ready':
          this.isReady = true;
          this.executeCallbacks('ready', []);
          break;

        case 'progress':
          this.executeCallbacks('progress', [data.progress]);
          break;

        case 'status':
          this.executeCallbacks('status', [{
            stage: 'processing',
            progress: data.progress,
            message: data.message
          }]);
          break;

        case 'analysis-complete':
          this.executeCallbacks('analysis-complete', [data.metadata]);
          this.activeOperations.delete('analyze');
          break;

        case 'processing-complete':
          this.executeCallbacks('processing-complete', [data.result]);
          this.activeOperations.delete('process');
          break;

        case 'combine-complete':
          this.executeCallbacks('combine-complete', [data.result]);
          this.activeOperations.delete('combine');
          break;

        case 'audio-extract-complete':
          this.executeCallbacks('audio-extract-complete', [data.result]);
          this.activeOperations.delete('extract-audio');
          break;

        case 'voiceover-status':
          this.executeCallbacks('voiceover-status', [data]);
          this.activeOperations.delete('generate-voiceover');
          break;

        case 'clean-complete':
          this.executeCallbacks('clean-complete', []);
          this.activeOperations.delete('clean');
          break;

        case 'warning':
          console.warn('FFmpeg warning:', data.warning);
          break;

        case 'error':
          console.error('FFmpeg error:', data.error, data.data);
          this.executeCallbacks('error', [data.error]);
          // Clear active operations on error
          this.activeOperations.clear();
          break;

        default:
          console.warn('Unknown message from FFmpeg worker:', type, data);
      }
    };

    this.worker.onerror = (error) => {
      console.error('FFmpeg worker error:', error);
      this.executeCallbacks('error', [error.message || 'Unknown worker error']);
      this.activeOperations.clear();
    };
  }

  private executeCallbacks(type: string, args: unknown[]) {
    const callbacks = this.callbacks.get(type) || [];
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error executing ${type} callback:`, error);
      }
    });
  }

  private addCallback(type: string, callback: (...args: unknown[]) => void) {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, []);
    }
    this.callbacks.get(type)?.push(callback);
  }

  private removeCallback(type: string, callback: (...args: unknown[]) => void) {
    if (!this.callbacks.has(type)) return;
    
    const callbacks = this.callbacks.get(type) || [];
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  public async init(config: FFmpegConfig = {}): Promise<void> {
    if (this.isReady) return Promise.resolve();

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        this.initWorker();
        if (!this.worker) {
          return reject(new Error('Failed to initialize FFmpeg worker'));
        }
      }

      const onReady = () => {
        resolve();
        this.removeCallback('ready', onReady);
        this.removeCallback('error', onError);
      };

      const onError = (error: string) => {
        reject(new Error(error));
        this.removeCallback('ready', onReady);
        this.removeCallback('error', onError);
      };

      this.addCallback('ready', onReady);
      this.addCallback('error', onError);

      this.worker.postMessage({ type: 'init', data: config });
    });
  }

  public async analyzeVideo(
    file: File,
    onProgress?: ProgressCallback,
    _onError?: ErrorCallback
  ): Promise<VideoMetadata> {
    if (this.activeOperations.has('analyze')) {
      throw new Error('Another analysis operation is already in progress');
    }

    if (!this.isReady) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      this.activeOperations.add('analyze');

      if (onProgress) this.addCallback('progress', onProgress);
      
      const onComplete = (metadata: VideoMetadata) => {
        resolve(metadata);
        this.removeCallback('analysis-complete', onComplete);
        this.removeCallback('error', onErrorCallback);
        if (onProgress) this.removeCallback('progress', onProgress);
      };

      const onErrorCallback = (error: string) => {
        reject(new Error(error));
        this.removeCallback('analysis-complete', onComplete);
        this.removeCallback('error', onErrorCallback);
        if (onProgress) this.removeCallback('progress', onProgress);
      };

      this.addCallback('analysis-complete', onComplete);
      this.addCallback('error', onErrorCallback);

      this.worker?.postMessage({
        type: 'analyze',
        data: {
          file,
          fileName: file.name
        }
      });
    });
  }

  public async processVideo(
    file: File,
    settings: Record<string, unknown>,
    videoDuration: number,
    onProgress?: ProgressCallback,
    onStatus?: StatusCallback,
    _onError?: ErrorCallback
  ): Promise<ProcessingResult> {
    if (this.activeOperations.has('process')) {
      throw new Error('Another processing operation is already in progress');
    }

    if (!this.isReady) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      this.activeOperations.add('process');

      if (onProgress) this.addCallback('progress', onProgress);
      if (onStatus) this.addCallback('status', onStatus);

      const onComplete = (result: ProcessingResult) => {
        resolve(result);
        this.removeCallback('processing-complete', onComplete);
        this.removeCallback('error', onErrorCallback);
        if (onProgress) this.removeCallback('progress', onProgress);
        if (onStatus) this.removeCallback('status', onStatus);
      };

      const onErrorCallback = (error: string) => {
        reject(new Error(error));
        this.removeCallback('processing-complete', onComplete);
        this.removeCallback('error', onErrorCallback);
        if (onProgress) this.removeCallback('progress', onProgress);
        if (onStatus) this.removeCallback('status', onStatus);
      };

      this.addCallback('processing-complete', onComplete);
      this.addCallback('error', onErrorCallback);

      // Check if we have a voiceover audio URL to include
      const includeVoiceover = settings.voiceoverEnabled && settings.voiceoverAudioUrl;
      
      this.worker?.postMessage({
        type: 'process',
        data: {
          fileName: file.name,
          settings,
          videoDuration,
          voiceoverAudioUrl: includeVoiceover ? settings.voiceoverAudioUrl : null,
          musicEnabled: settings.musicEnabled || false,
          musicSettings: settings.musicSettings || null
        }
      });
    });
  }

  public async combineClips(
    clips: ClipData[],
    outputName: string = 'combined.mp4',
    onProgress?: ProgressCallback,
    onStatus?: StatusCallback,
    _onError?: ErrorCallback
  ): Promise<CombineResult> {
    if (this.activeOperations.has('combine')) {
      throw new Error('Another combine operation is already in progress');
    }

    if (!this.isReady) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      this.activeOperations.add('combine');

      if (onProgress) this.addCallback('progress', onProgress);
      if (onStatus) this.addCallback('status', onStatus);

      const onComplete = (result: CombineResult) => {
        resolve(result);
        this.removeCallback('combine-complete', onComplete);
        this.removeCallback('error', onErrorCallback);
        if (onProgress) this.removeCallback('progress', onProgress);
        if (onStatus) this.removeCallback('status', onStatus);
      };

      const onErrorCallback = (error: string) => {
        reject(new Error(error));
        this.removeCallback('combine-complete', onComplete);
        this.removeCallback('error', onErrorCallback);
        if (onProgress) this.removeCallback('progress', onProgress);
        if (onStatus) this.removeCallback('status', onStatus);
      };

      this.addCallback('combine-complete', onComplete);
      this.addCallback('error', onErrorCallback);

      this.worker?.postMessage({
        type: 'combine',
        data: {
          clips,
          outputName
        }
      });
    });
  }

  public async extractAudio(
    file: File,
    format: 'mp3' | 'aac' = 'mp3',
    onProgress?: ProgressCallback,
    onStatus?: StatusCallback,
    _onError?: ErrorCallback
  ): Promise<AudioResult> {
    if (this.activeOperations.has('extract-audio')) {
      throw new Error('Another audio extraction operation is already in progress');
    }

    if (!this.isReady) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      this.activeOperations.add('extract-audio');

      if (onProgress) this.addCallback('progress', onProgress);
      if (onStatus) this.addCallback('status', onStatus);

      const onComplete = (result: AudioResult) => {
        resolve(result);
        this.removeCallback('audio-extract-complete', onComplete);
        this.removeCallback('error', onErrorCallback);
        if (onProgress) this.removeCallback('progress', onProgress);
        if (onStatus) this.removeCallback('status', onStatus);
      };

      const onErrorCallback = (error: string) => {
        reject(new Error(error));
        this.removeCallback('audio-extract-complete', onComplete);
        this.removeCallback('error', onErrorCallback);
        if (onProgress) this.removeCallback('progress', onProgress);
        if (onStatus) this.removeCallback('status', onStatus);
      };

      this.addCallback('audio-extract-complete', onComplete);
      this.addCallback('error', onErrorCallback);

      this.worker?.postMessage({
        type: 'extract-audio',
        data: {
          fileName: file.name,
          format
        }
      });
    });
  }

  public async generateVoiceover(
    text: string,
    onStatus?: StatusCallback,
    _onError?: ErrorCallback
  ): Promise<unknown> {
    if (this.activeOperations.has('generate-voiceover')) {
      throw new Error('Another voiceover generation operation is already in progress');
    }

    if (!this.isReady) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      this.activeOperations.add('generate-voiceover');

      if (onStatus) this.addCallback('status', onStatus);

      const onComplete = (result: unknown) => {
        resolve(result);
        this.removeCallback('voiceover-status', onComplete);
        this.removeCallback('error', onErrorCallback);
        if (onStatus) this.removeCallback('status', onStatus);
      };

      const onErrorCallback = (error: string) => {
        reject(new Error(error));
        this.removeCallback('voiceover-status', onComplete);
        this.removeCallback('error', onErrorCallback);
        if (onStatus) this.removeCallback('status', onStatus);
      };

      this.addCallback('voiceover-status', onComplete);
      this.addCallback('error', onErrorCallback);

      this.worker?.postMessage({
        type: 'generate-voiceover',
        data: {
          text
        }
      });
    });
  }

  public async cleanFiles(
    files: string[] = [],
    _onError?: ErrorCallback
  ): Promise<void> {
    if (!this.isReady) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      this.activeOperations.add('clean');

      const onComplete = () => {
        resolve();
        this.removeCallback('clean-complete', onComplete);
        this.removeCallback('error', onErrorCallback);
      };

      const onErrorCallback = (error: string) => {
        reject(new Error(error));
        this.removeCallback('clean-complete', onComplete);
        this.removeCallback('error', onErrorCallback);
      };

      this.addCallback('clean-complete', onComplete);
      this.addCallback('error', onErrorCallback);

      this.worker?.postMessage({
        type: 'clean',
        data: {
          files
        }
      });
    });
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.callbacks.clear();
      this.activeOperations.clear();
    }
  }
}

export default FFmpegService.getInstance();