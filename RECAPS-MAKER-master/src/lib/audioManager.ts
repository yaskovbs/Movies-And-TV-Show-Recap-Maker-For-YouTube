// Audio Manager service for handling music and voiceover

// Emotion to music mapping
interface EmotionTrack {
  name: string;
  src: string;
  intensity: number; // 1-10
  emotion: string;
  genre?: string;
  duration: number; // seconds
}

// Voice settings
export interface VoiceSettings {
  voice: string; // voice name
  rate: number; // 0.1 - 10
  pitch: number; // 0 - 2
  volume: number; // 0 - 1
  apiProvider?: 'browser' | 'google' | 'elevenlabs'; // which API to use
  apiKey?: string; // optional API key for external services
}

class AudioManager {
  private static instance: AudioManager;
  private musicLibrary: EmotionTrack[] = [];
  private cachedAudio: Map<string, AudioBuffer> = new Map();
  private audioContext: AudioContext | null = null;
  
  private constructor() {
    this.initMusicLibrary();
  }
  
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }
  
  /**
   * Initialize music library with default tracks
   * In a production environment, this would load from a database or API
   */
  private initMusicLibrary() {
    // Define base URL for the music tracks
    const baseUrl = '/audio/';
    
    // Define emotion tracks - in production these would be stored in a database
    this.musicLibrary = [
      // Epic/Action tracks
      {
        name: "Epic Battle",
        src: baseUrl + "epic-battle.mp3",
        intensity: 10,
        emotion: "action",
        genre: "action",
        duration: 120
      },
      {
        name: "Heroic Adventure",
        src: baseUrl + "heroic-adventure.mp3",
        intensity: 9,
        emotion: "action",
        genre: "adventure",
        duration: 135
      },
      
      // Dramatic tracks
      {
        name: "Emotional Journey",
        src: baseUrl + "emotional-journey.mp3",
        intensity: 8,
        emotion: "dramatic",
        genre: "drama",
        duration: 180
      },
      {
        name: "Tragic Moment",
        src: baseUrl + "tragic-moment.mp3",
        intensity: 7,
        emotion: "sad",
        genre: "drama",
        duration: 150
      },
      
      // Suspense tracks
      {
        name: "Mystery Unfolds",
        src: baseUrl + "mystery-unfolds.mp3",
        intensity: 6,
        emotion: "suspense",
        genre: "thriller",
        duration: 165
      },
      {
        name: "Tense Situation",
        src: baseUrl + "tense-situation.mp3",
        intensity: 8,
        emotion: "suspense",
        genre: "thriller",
        duration: 140
      },
      
      // Romantic tracks
      {
        name: "Love Theme",
        src: baseUrl + "love-theme.mp3",
        intensity: 5,
        emotion: "romantic",
        genre: "romance",
        duration: 200
      },
      
      // Comedy tracks
      {
        name: "Lighthearted Fun",
        src: baseUrl + "lighthearted-fun.mp3",
        intensity: 4,
        emotion: "happy",
        genre: "comedy",
        duration: 110
      },
      
      // Neutral tracks
      {
        name: "Ambient Background",
        src: baseUrl + "ambient-background.mp3",
        intensity: 3,
        emotion: "neutral",
        genre: "documentary",
        duration: 240
      },
      {
        name: "Gentle Piano",
        src: baseUrl + "gentle-piano.mp3",
        intensity: 2,
        emotion: "calm",
        genre: "documentary",
        duration: 180
      }
    ];
    
    // For now, we'll use fallback URLs for the initial version
    // since we don't have actual audio files yet
    this.musicLibrary.forEach(track => {
      // Use reliable free music sources
      const freeMusicUrls = [
        'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
        'https://cdn.pixabay.com/audio/2022/03/10/audio_6d4c8f7a9f.mp3',
        'https://cdn.pixabay.com/audio/2022/03/15/audio_8f7c5d2b3e.mp3',
        'https://freesound.org/data/previews/316/316847_4939433-lq.mp3'
      ];
      track.src = freeMusicUrls[Math.floor(Math.random() * freeMusicUrls.length)];
    });
  }
  
  /**
   * Initialize AudioContext (must be called after user interaction)
   */
  private initAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    }
    return this.audioContext;
  }
  
  /**
   * Find music that matches the given emotion and intensity
   */
  public findMatchingMusic(
    emotion: string,
    intensity: number = 5,
    genre?: string
  ): EmotionTrack | null {
    try {
      // Initialize audio context if needed
      this.initAudioContext();
      
      // First try to match both emotion and genre
      if (genre) {
        const genreMatches = this.musicLibrary.filter(
          track => track.genre?.toLowerCase() === genre.toLowerCase()
        );
        
        if (genreMatches.length > 0) {
          // Sort by how close the intensity matches
          genreMatches.sort((a, b) => 
            Math.abs(a.intensity - intensity) - Math.abs(b.intensity - intensity)
          );
          return genreMatches[0];
        }
      }
      
      // If no genre match or no genre provided, match by emotion
      const emotionMatches = this.musicLibrary.filter(
        track => track.emotion.toLowerCase() === emotion.toLowerCase()
      );
      
      if (emotionMatches.length > 0) {
        // Sort by how close the intensity matches
        emotionMatches.sort((a, b) => 
          Math.abs(a.intensity - intensity) - Math.abs(b.intensity - intensity)
        );
        return emotionMatches[0];
      }
      
      // If no direct match, try to find by similar emotions
      const similarEmotions: {[key: string]: string[]} = {
        'action': ['suspense', 'dramatic'],
        'dramatic': ['sad', 'action', 'suspense'],
        'sad': ['dramatic', 'romantic'],
        'happy': ['romantic', 'neutral'],
        'suspense': ['action', 'dramatic'],
        'romantic': ['happy', 'sad'],
        'neutral': ['calm', 'happy'],
        'calm': ['neutral', 'romantic']
      };
      
      const targetSimilar = similarEmotions[emotion.toLowerCase()] || [];
      
      if (targetSimilar.length > 0) {
        const similarMatches = this.musicLibrary.filter(
          track => targetSimilar.includes(track.emotion.toLowerCase())
        );
        
        if (similarMatches.length > 0) {
          similarMatches.sort((a, b) => 
            Math.abs(a.intensity - intensity) - Math.abs(b.intensity - intensity)
          );
          return similarMatches[0];
        }
      }
      
      // If all else fails, return a neutral track with medium intensity
      const fallbackTracks = this.musicLibrary.filter(
        track => track.emotion.toLowerCase() === 'neutral' || track.intensity === 5
      );
      
      return fallbackTracks.length > 0 ? fallbackTracks[0] : this.musicLibrary[0];
    } catch (error) {
      console.error('Error finding matching music:', error);
      return null;
    }
  }
  
  /**
   * Generate speech from text using the browser's Web Speech API
   */
  public async generateSpeech(
    text: string,
    voiceSettings: VoiceSettings,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    if (voiceSettings.apiProvider === 'google' || voiceSettings.apiProvider === 'elevenlabs') {
      if (!voiceSettings.apiKey) {
        throw new Error(`API key required for ${voiceSettings.apiProvider} Text-to-Speech`);
      }
      
      // Use external API for speech generation
      return this.generateSpeechWithExternalApi(text, voiceSettings, onProgress);
    } else {
      // Use browser's Speech Synthesis API
      return this.generateSpeechWithBrowser(text, voiceSettings, onProgress);
    }
  }
  
  /**
   * Generate speech using the browser's Web Speech API
   */
  private async generateSpeechWithBrowser(
    _text: string,
    _voiceSettings: VoiceSettings,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      if (onProgress) onProgress(10);

      // Use Google Translate TTS hack for reliable Hebrew TTS (no API key needed)
      // Split long text into chunks (Google limit ~100 chars per request)
      const chunks = _text.match(/.{1,90}/g) || [_text];
      const audioBlobs: Blob[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=iw&client=tw-ob&q=${encodeURIComponent(chunk)}`;
        
        if (onProgress) onProgress(20 + (i / chunks.length) * 70);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`TTS request failed: ${response.status}`);
        }
        const blob = await response.blob();
        audioBlobs.push(blob);
      }

      if (onProgress) onProgress(95);

      // Combine blobs into single audio
      const combinedBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(combinedBlob);

      if (onProgress) onProgress(100);

      return audioUrl;
    } catch (error) {
      console.error('Browser TTS failed:', error);
      throw new Error(`Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Generate speech using an external API (Google Cloud Text-to-Speech or ElevenLabs)
   */
  private async generateSpeechWithExternalApi(
    _text: string,
    _voiceSettings: VoiceSettings,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Signal start of progress
      if (onProgress) {
        onProgress(10);
      }
      
      if (_voiceSettings.apiProvider === 'google') {
        // Implement Google Cloud Text-to-Speech API call
        // This is a placeholder - in a production app, you would make an API request
        // to Google Cloud Text-to-Speech
        
        if (onProgress) {
          onProgress(50);
        }
        
        const _googleApiKey = _voiceSettings.apiKey;
        void _googleApiKey;
        
        // Create a mock response for demonstration purposes
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (onProgress) {
          onProgress(100);
        }
        
        return `https://storage.googleapis.com/your-bucket/generated-speech-${Date.now()}.mp3`;
      } else if (_voiceSettings.apiProvider === 'elevenlabs') {
        // Implement ElevenLabs API call
        // This is a placeholder - in a production app, you would make an API request
        // to ElevenLabs API
        
        if (onProgress) {
          onProgress(50);
        }
        
        const _elevenLabsApiKey = _voiceSettings.apiKey;
        void _elevenLabsApiKey;
        
        // Create a mock response for demonstration purposes
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (onProgress) {
          onProgress(100);
        }
        
        return `https://api.elevenlabs.io/speech/${Date.now()}.mp3`;
      } else {
        throw new Error(`Unsupported API provider: ${_voiceSettings.apiProvider}`);
      }
    } catch (error) {
      console.error('Error generating speech with external API:', error);
      throw error;
    }
  }
  
  /**
   * Get all available voices from the browser
   */
  public getBrowserVoices(): SpeechSynthesisVoice[] {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported in this browser');
      return [];
    }
    
    return speechSynthesis.getVoices();
  }
  
  /**
   * Save audio settings to localStorage
   */
  public saveAudioSettings(settings: Record<string, unknown>): void {
    localStorage.setItem('audio_settings', JSON.stringify(settings));
  }
  
  /**
   * Load audio settings from localStorage
   */
  public loadAudioSettings(): Record<string, unknown> | null {
    const settings = localStorage.getItem('audio_settings');
    return settings ? JSON.parse(settings) : null;
  }
  
  /**
   * Combine audio tracks (voice + music) and return a blob URL
   * This is a placeholder for a more complete implementation that would
   * actually mix the audio tracks with Web Audio API
   */
  public async combineAudioTracks(
    voiceUrl: string,
    musicUrl: string,
    musicVolume: number = 0.3
  ): Promise<string> {
    try {
      // Use Web Audio API to mix voice + music for preview
      const audioContext = this.initAudioContext();
      
      // Load voice
      const voiceResponse = await fetch(voiceUrl);
      const voiceBuffer = await voiceResponse.arrayBuffer();
      const voiceDecoded = await audioContext.decodeAudioData(voiceBuffer);
      
      // Load music and loop/stretch to match voice duration
      const musicResponse = await fetch(musicUrl);
      const musicBuffer = await musicResponse.arrayBuffer();
      const musicDecoded = await audioContext.decodeAudioData(musicBuffer);
      
      // Create offline context matching voice duration
      const voiceDuration = voiceDecoded.duration;
      const offlineContext = new OfflineAudioContext(2, audioContext.sampleRate * voiceDuration, audioContext.sampleRate);
      
      // Voice source
      const voiceSource = offlineContext.createBufferSource();
      voiceSource.buffer = voiceDecoded;
      
      // Music source - loop if shorter
      const musicSource = offlineContext.createBufferSource();
      musicSource.buffer = musicDecoded;
      musicSource.loop = true;
      
      // Music gain
      const musicGain = offlineContext.createGain();
      musicGain.gain.setValueAtTime(musicVolume, 0);
      
      // Connect
      voiceSource.connect(offlineContext.destination);
      musicSource.connect(musicGain).connect(offlineContext.destination);
      
      // Render
      const mixedBuffer = await offlineContext.startRendering();
      
      // Export to WAV blob (simple encoder)
      const wavBlob = this.encodeWav(mixedBuffer);
      return URL.createObjectURL(wavBlob);
    } catch (error) {
      console.error('Audio mixing failed:', error);
      // Fallback to voice only
      return voiceUrl;
    }
  }

  private encodeWav(buffer: AudioBuffer): Blob {
    // Simple WAV encoder for stereo 16-bit PCM
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length * numChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    // Write samples
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }
}

export default AudioManager.getInstance();