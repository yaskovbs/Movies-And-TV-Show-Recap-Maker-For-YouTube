import { motion } from 'framer-motion'
import { Settings, Clock, Scissors, Globe, Youtube, Zap, ChevronDown, Mic, Music } from 'lucide-react'
import { useState } from 'react'
import type { RecapSettings } from '../types'
import AudioSettingsPanel from './AudioSettingsPanel'

interface RecapSettingsProps {
  settings: RecapSettings;
  onSettingsChange: (settings: RecapSettings) => void;
}

const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedHours = String(hours).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
};

const RecapSettingsComponent = ({ 
  settings, 
  onSettingsChange 
}: RecapSettingsProps) => {
  const [expandAdvanced, setExpandAdvanced] = useState(false)
  const [expandAudio, setExpandAudio] = useState(false)
  
  const handleChange = (field: keyof RecapSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [field]: value
    })
  }
  
  const handleVoiceoverGenerated = (audioUrl: string) => {
    handleChange('voiceoverAudioUrl', audioUrl);
  }

  const handleDurationChange = (part: 'hours' | 'minutes' | 'seconds', value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    const currentHours = Math.floor(settings.duration / 3600);
    const currentMinutes = Math.floor((settings.duration % 3600) / 60);
    const currentSeconds = settings.duration % 60;

    let newHours = currentHours;
    let newMinutes = currentMinutes;
    let newSeconds = currentSeconds;

    if (part === 'hours') newHours = numValue;
    if (part === 'minutes') newMinutes = numValue;
    if (part === 'seconds') newSeconds = numValue;

    let newTotalSeconds = (newHours * 3600) + (newMinutes * 60) + newSeconds;

    if (newTotalSeconds > 10800) newTotalSeconds = 10800; // 3 hours max
    if (newTotalSeconds < 1) newTotalSeconds = 1;

    handleChange('duration', newTotalSeconds);
  };

  const durationHours = Math.floor(settings.duration / 3600);
  const durationMinutes = Math.floor((settings.duration % 3600) / 60);
  const durationSeconds = settings.duration % 60;

  const intervalMinutes = Math.floor(settings.intervalSeconds / 60);
  const intervalRemainingSeconds = settings.intervalSeconds % 60;

  const handleIntervalChange = (part: 'minutes' | 'seconds', value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    let newMinutes = intervalMinutes;
    let newSeconds = intervalRemainingSeconds;

    if (part === 'minutes') newMinutes = numValue;
    if (part === 'seconds') newSeconds = numValue;
    
    let newTotalSeconds = (newMinutes * 60) + newSeconds;
    
    if (newTotalSeconds < 1) newTotalSeconds = 1;

    handleChange('intervalSeconds', newTotalSeconds);
  };

  return (
    <motion.div 
      className="bg-gray-800 rounded-lg p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center mb-6">
        <Settings className="h-6 w-6 text-blue-400 ml-3" />
        <h2 className="text-xl font-semibold text-white">שלב 3: הגדרות סיכום</h2>
      </div>

      <div className="space-y-6">
        {/* אורך הסיכום */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
            <Clock className="h-4 w-4 ml-2" />
            אורך הסיכום (עד 3 שעות)
          </label>
          <div className="flex items-start space-x-2 space-x-reverse">
            <div className="flex-1">
              <input
                type="number"
                min="0"
                max="3"
                value={String(durationHours).padStart(2, '0')}
                onChange={(e) => handleDurationChange('hours', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 text-center mt-1">שעות</p>
            </div>
            <span className="text-xl font-bold text-gray-400 pt-2">:</span>
            <div className="flex-1">
              <input
                type="number"
                min="0"
                max="59"
                value={String(durationMinutes).padStart(2, '0')}
                onChange={(e) => handleDurationChange('minutes', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 text-center mt-1">דקות</p>
            </div>
            <span className="text-xl font-bold text-gray-400 pt-2">:</span>
            <div className="flex-1">
              <input
                type="number"
                min="0"
                max="59"
                value={String(durationSeconds).padStart(2, '0')}
                onChange={(e) => handleDurationChange('seconds', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 text-center mt-1">שניות</p>
            </div>
          </div>
        </div>

        {/* תדירות חיתוך */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
            <Scissors className="h-4 w-4 ml-2" />
            חתוך כל (דקות : שניות)
          </label>
          <div className="flex items-center space-x-2 space-x-reverse">
            <input
              type="number"
              min="0"
              max="59"
              value={String(intervalMinutes).padStart(2, '0')}
              onChange={(e) => handleIntervalChange('minutes', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xl font-bold text-gray-400">:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={String(intervalRemainingSeconds).padStart(2, '0')}
              onChange={(e) => handleIntervalChange('seconds', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            כל {settings.intervalSeconds} שניות ייחתך קטע של {settings.captureSeconds} שנייה.
          </p>
        </div>

        {/* הגדרות קריינות ומוזיקה */}
        <button
          type="button"
          onClick={() => setExpandAudio(!expandAudio)}
          className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-3 rounded-lg flex items-center justify-center space-x-2 space-x-reverse transition-colors"
        >
          <Music className="h-4 w-4" />
          <span>🎵 הגדרות קריינות ומוזיקה</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${expandAudio ? 'rotate-180' : ''}`} />
        </button>
        
        {expandAudio && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <AudioSettingsPanel 
              script={settings.script || ''} 
              emotionalTone={settings.emotionalTone || 'neutral'} 
              genre={settings.genre}
              onVoiceoverGenerated={handleVoiceoverGenerated}
            />
          </motion.div>
        )}
        
        {/* הגדרות מתקדמות */}
        <button
          type="button"
          onClick={() => setExpandAdvanced(!expandAdvanced)}
          className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-3 rounded-lg flex items-center justify-center space-x-2 space-x-reverse transition-colors"
        >
          <Zap className="h-4 w-4" />
          <span>⚙️ הגדרות סיכום מתקדמות</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${expandAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {expandAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 space-y-4"
          >
            {/* שדות בסיסיים */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center">
                <span className="inline-block w-2 h-2 bg-blue-400 rounded-full ml-2"></span>
                פרטי הסדרה / הסרט
              </h3>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  कותרת הסרט / סדרה *
                </label>
                <input
                  type="text"
                  placeholder="זן את שם הסרט או הסדרה"
                  value={settings.movieTitle || ''}
                  onChange={(e) => handleChange('movieTitle', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  ז'אנר
                </label>
                <select
                  value={settings.genre || ''}
                  onChange={(e) => handleChange('genre', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">בחר ז'אנר</option>
                  <option value="action">אקשן</option>
                  <option value="drama">דרמה</option>
                  <option value="comedy">קומדיה</option>
                  <option value="horror">אימה</option>
                  <option value="thriller">תריller</option>
                  <option value="fantasy">פנטזיה</option>
                  <option value="scifi">מדע בדיון</option>
                  <option value="romance">רומנטיקה</option>
                  <option value="animation">אנימציה</option>
                </select>
              </div>
            </div>

            {/* חיפוש באינטרנט */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center">
                <Globe className="h-4 w-4 ml-2" />
                חיפוש באינטרנט
              </h3>

              <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableWebSearch || false}
                  onChange={(e) => handleChange('enableWebSearch', e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-xs text-gray-300">
                  אסוף מידע נוסף לשיפור הדיוק
                </span>
              </label>

              {settings.enableWebSearch && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2 pt-2"
                >
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Google Search API Key
                    </label>
                    <input
                      type="password"
                      placeholder="הזן את מפתח ה-API של Google Search"
                      value={settings.googleSearchApiKey || ''}
                      onChange={(e) => handleChange('googleSearchApiKey', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <a
                      href="https://developers.google.com/custom-search/v1/overview"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
                    >
                      איך להשיג מפתח API?
                    </a>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Search Engine ID
                    </label>
                    <input
                      type="password"
                      placeholder="הזן את מזהה מנוע החיפוש"
                      value={settings.searchEngineId || ''}
                      onChange={(e) => handleChange('searchEngineId', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* למידה מיוטיוב */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center">
                <Youtube className="h-4 w-4 ml-2" />
                למידה מיוטיוב
              </h3>

              <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableYoutubeLearning || false}
                  onChange={(e) => handleChange('enableYoutubeLearning', e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-xs text-gray-300">
                  שיפור הסגנון על בסיס ערוצים מצליחים
                </span>
              </label>

              {settings.enableYoutubeLearning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2 pt-2"
                >
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      מפתח YouTube Data API v3 (אופציונלי)
                    </label>
                    <input
                      type="password"
                      placeholder="הזן מפתח YouTube Data API v3..."
                      value={settings.youtubeApiKey || ''}
                      onChange={(e) => handleChange('youtubeApiKey', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <a 
                      href="https://console.cloud.google.com/apis/enable?project=_" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
                    >
                      איך להשיג מפתח API?
                    </a>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      קישור ליוטיוב (אופציונלי)
                    </label>
                    <input
                      type="url"
                      placeholder="הדבק כאן קישור לערוץ היוטיוב..."
                      value={settings.youtubeChannelLink || ''}
                      onChange={(e) => handleChange('youtubeChannelLink', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      המערכת תלמד מהסגנון של הערוץ לשיפור איכות הסיכום
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* למידה מתמשכת */}
            <div className="space-y-3 pt-2 border-t border-gray-600">
              <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableContinuousLearning || false}
                  onChange={(e) => handleChange('enableContinuousLearning', e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-xs text-gray-300">
                  למידה מתמשכת פעילה
                </span>
              </label>
              <p className="text-xs text-gray-500 pl-6">
                המערכת לומדת מכל סיכום שנוצר ומשתפרת עם הזמן
              </p>
            </div>
          </motion.div>
        )}

        {/* סיכום הגדרות */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">סיכום הגדרות:</h3>
          <div className="text-sm text-gray-400 space-y-1">
            <p>• אורך סיכום: {formatDuration(settings.duration)}</p>
            <p>• חיתוך כל: {formatDuration(settings.intervalSeconds)}</p>
            <p>• קטעים כוללים: ~{settings.intervalSeconds > 0 ? Math.floor(settings.duration / settings.captureSeconds) : 0} קטעים</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default RecapSettingsComponent
