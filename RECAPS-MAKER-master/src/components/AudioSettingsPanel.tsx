import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Music, Mic, Volume2, Settings, Play, Pause, Save, AlertCircle, CheckCircle } from 'lucide-react'
import audioManager, { VoiceSettings } from '../lib/audioManager'
import contentAnalyzer from '../lib/contentAnalyzer'

interface AudioSettingsPanelProps {
  script: string;
  emotionalTone?: string;
  genre?: string;
  onVoiceoverGenerated?: (audioUrl: string) => void;
}

interface AudioSettings {
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  apiProvider: 'browser' | 'google' | 'elevenlabs';
  musicEnabled: boolean;
  musicVolume: number;
  musicEmotion: string;
  musicIntensity: number;
}

const AudioSettingsPanel = ({ 
  script, 
  emotionalTone = 'neutral', 
  genre = 'drama',
  onVoiceoverGenerated 
}: AudioSettingsPanelProps) => {
  const [settings, setSettings] = useState<AudioSettings>({
    voice: '',
    rate: 1,
    pitch: 1,
    volume: 1,
    apiProvider: 'browser',
    musicEnabled: true,
    musicVolume: 0.3,
    musicEmotion: emotionalTone,
    musicIntensity: 5
  });
  
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = audioManager.getBrowserVoices();
      setAvailableVoices(voices);
      
      // Set default voice (prefer Hebrew if available)
      const hebrewVoice = voices.find(voice => voice.lang.includes('he'));
      const defaultVoice = hebrewVoice || voices[0];
      
      if (defaultVoice) {
        setSettings(prev => ({
          ...prev,
          voice: defaultVoice.name
        }));
      }
    };
    
    // Load saved settings if available
    const savedSettings = audioManager.loadAudioSettings();
    if (savedSettings) {
      setSettings(prev => ({
        ...prev,
        ...savedSettings
      }));
    }
    
    // Set emotional tone and genre from props
    setSettings(prev => ({
      ...prev,
      musicEmotion: emotionalTone
    }));
    
    // Load voices
    if (window.speechSynthesis) {
      const voices = audioManager.getBrowserVoices();
      
      if (voices.length > 0) {
        loadVoices();
      } else {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
    
    // Cleanup
    return () => {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.src = '';
      }
    };
  }, [emotionalTone, genre]);
  
  // Handle voice change
  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({
      ...settings,
      voice: e.target.value
    });
  };
  
  // Handle API provider change
  const handleApiProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({
      ...settings,
      apiProvider: e.target.value as 'browser' | 'google' | 'elevenlabs'
    });
  };
  
  // Handle slider changes
  const handleSliderChange = (name: string, value: number) => {
    setSettings({
      ...settings,
      [name]: value
    });
  };
  
  // Generate preview
  const handleGeneratePreview = async () => {
    if (!script) {
      setError('אנא הכנס תסריט לפני יצירת קריינות');
      return;
    }
    
    try {
      setIsGenerating(true);
      setProgress(0);
      setError(null);
      
      // Stop any playing audio
      if (previewAudio) {
        previewAudio.pause();
        setIsPlaying(false);
      }
      
      // Generate speech
      const voiceSettings: VoiceSettings = {
        voice: settings.voice,
        rate: settings.rate,
        pitch: settings.pitch,
        volume: settings.volume,
        apiProvider: settings.apiProvider,
        apiKey: settings.apiProvider !== 'browser' ? 
          localStorage.getItem(`${settings.apiProvider}_api_key`) || undefined : 
          undefined
      };
      
      const audioUrl = await audioManager.generateSpeech(
        script,
        voiceSettings,
        (progress) => setProgress(progress)
      );
      
      // Find matching music if enabled
      let finalAudioUrl = audioUrl;
      
      if (settings.musicEnabled) {
        const matchingMusic = audioManager.findMatchingMusic(
          settings.musicEmotion,
          settings.musicIntensity,
          genre
        );
        
        if (matchingMusic) {
          // In a real implementation, we would combine the audio here
          // For now, we'll just use the voice audio
          finalAudioUrl = await audioManager.combineAudioTracks(
            audioUrl,
            matchingMusic.src,
            settings.musicVolume
          );
        }
      }
      
      // Create audio element for preview
      const audio = new Audio(finalAudioUrl);
      setPreviewAudio(audio);
      setGeneratedAudioUrl(finalAudioUrl);
      
      // Save settings
      audioManager.saveAudioSettings(settings);
      
      // Show success message
      setSuccess('הקריינות נוצרה בהצלחה!');
      setTimeout(() => setSuccess(null), 3000);
      
      // Notify parent component
      if (onVoiceoverGenerated) {
        onVoiceoverGenerated(finalAudioUrl);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setError(error instanceof Error ? error.message : 'שגיאה ביצירת קריינות');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Play/pause preview
  const togglePlayback = () => {
    if (!previewAudio) return;
    
    if (isPlaying) {
      previewAudio.pause();
    } else {
      previewAudio.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle audio ended event
  useEffect(() => {
    if (previewAudio) {
      const handleEnded = () => setIsPlaying(false);
      previewAudio.addEventListener('ended', handleEnded);
      
      return () => {
        previewAudio.removeEventListener('ended', handleEnded);
      };
    }
  }, [previewAudio]);
  
  // Check if API key is available for selected provider
  const hasRequiredApiKey = () => {
    if (settings.apiProvider === 'browser') return true;
    
    const apiKey = localStorage.getItem(`${settings.apiProvider}_api_key`);
    return !!apiKey;
  };
  
  return (
    <motion.div
      className="bg-gray-800 rounded-lg p-6 border border-gray-700 mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center mb-4">
        <Mic className="w-6 h-6 text-blue-500 mr-2" />
        <h3 className="text-xl font-bold text-white">הגדרות קריינות ומוזיקה</h3>
      </div>
      
      {/* Voice Settings */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-white mb-3">הגדרות קול</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">ספק קריינות</label>
            <select
              value={settings.apiProvider}
              onChange={handleApiProviderChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
            >
              <option value="browser">דפדפן (מקומי)</option>
              <option value="google">Google Cloud TTS</option>
              <option value="elevenlabs">ElevenLabs</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">קול</label>
            {settings.apiProvider === 'browser' ? (
              <select
                value={settings.voice}
                onChange={handleVoiceChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
              >
                {availableVoices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={settings.voice}
                onChange={(e) => setSettings({...settings, voice: e.target.value})}
                placeholder={`שם הקול ב-${settings.apiProvider === 'google' ? 'Google' : 'ElevenLabs'}`}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
              />
            )}
          </div>
        </div>
        
        {/* Voice Parameters */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-400">מהירות</label>
              <span className="text-sm text-gray-400">{settings.rate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.rate}
              onChange={(e) => handleSliderChange('rate', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-400">גובה</label>
              <span className="text-sm text-gray-400">{settings.pitch.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.pitch}
              onChange={(e) => handleSliderChange('pitch', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-400">עוצמה</label>
              <span className="text-sm text-gray-400">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(e) => handleSliderChange('volume', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        {/* API Key Warning */}
        {settings.apiProvider !== 'browser' && !hasRequiredApiKey() && (
          <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-600 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="text-sm text-yellow-300">
              נדרש מפתח API עבור {settings.apiProvider === 'google' ? 'Google Cloud TTS' : 'ElevenLabs'}. 
              <a href="/settings/api-keys" className="underline ml-1">הגדר מפתח</a>
            </span>
          </div>
        )}
      </div>
      
      {/* Music Settings */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-medium text-white">הגדרות מוזיקת רקע</h4>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={settings.musicEnabled}
              onChange={(e) => setSettings({...settings, musicEnabled: e.target.checked})}
              className="form-checkbox h-5 w-5 text-blue-600 rounded"
            />
            <span className="ml-2 text-gray-300">הפעל מוזיקת רקע</span>
          </label>
        </div>
        
        {settings.musicEnabled && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-400">עוצמת מוזיקה</label>
                <span className="text-sm text-gray-400">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => handleSliderChange('musicVolume', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">טון רגשי</label>
                <select
                  value={settings.musicEmotion}
                  onChange={(e) => setSettings({...settings, musicEmotion: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value="action">אקשן</option>
                  <option value="dramatic">דרמטי</option>
                  <option value="suspense">מתח</option>
                  <option value="sad">עצוב</option>
                  <option value="romantic">רומנטי</option>
                  <option value="happy">שמח</option>
                  <option value="neutral">ניטרלי</option>
                  <option value="calm">רגוע</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">עוצמה</label>
                <select
                  value={settings.musicIntensity}
                  onChange={(e) => setSettings({...settings, musicIntensity: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <option key={value} value={value}>
                      {value} {value < 4 ? '(נמוכה)' : value > 7 ? '(גבוהה)' : '(בינונית)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Generate Button */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleGeneratePreview}
          disabled={isGenerating || (settings.apiProvider !== 'browser' && !hasRequiredApiKey())}
          className={`px-4 py-2 rounded-md text-white flex items-center ${
            isGenerating || (settings.apiProvider !== 'browser' && !hasRequiredApiKey())
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
              יוצר קריינות... {progress}%
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 mr-2" />
              צור קריינות
            </>
          )}
        </button>
        
        {generatedAudioUrl && (
          <button
            onClick={togglePlayback}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white" />
            )}
          </button>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mt-4 p-2 bg-red-900/30 border border-red-600 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}
      
      {/* Success Message */}
      {success && (
        <div className="mt-4 p-2 bg-green-900/30 border border-green-600 rounded-md flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <span className="text-sm text-green-300">{success}</span>
        </div>
      )}
    </motion.div>
  );
};

export default AudioSettingsPanel;