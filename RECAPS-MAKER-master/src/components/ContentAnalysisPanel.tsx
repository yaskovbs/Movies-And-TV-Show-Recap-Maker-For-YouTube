import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, Film, Clock, Sparkles, Tag, AlertCircle, Loader, Copy } from 'lucide-react'
import contentAnalyzer from '../lib/contentAnalyzer'
import type { VideoFile } from '../types'

interface ContentAnalysisPanelProps {
  videoFile: VideoFile | null;
  onScriptGenerated?: (script: string, analysisData?: {
    emotionalTone: string;
    genre: string;
  }) => void;
}

interface AnalysisState {
  isAnalyzing: boolean;
  progress: number;
  error: string | null;
  summary: string | null;
  keyMoments: Array<{
    time: number;
    description: string;
    importance: number;
    emotion?: string;
  }> | null;
  genre: string | null;
  emotionalTone: string | null;
  suggestedTitle: string | null;
  suggestedTags: string[] | null;
  generatedScript: string | null;
}

const ContentAnalysisPanel = ({ videoFile, onScriptGenerated }: ContentAnalysisPanelProps) => {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isAnalyzing: false,
    progress: 0,
    error: null,
    summary: null,
    keyMoments: null,
    genre: null,
    emotionalTone: null,
    suggestedTitle: null,
    suggestedTags: null,
    generatedScript: null
  });
  
  const [scriptStyle, setScriptStyle] = useState<'formal' | 'casual' | 'dramatic'>('casual');
  const [scriptDuration, setScriptDuration] = useState<number>(30);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  
  // Check if API key is available
  useEffect(() => {
    setHasApiKey(contentAnalyzer.hasValidApiKey());
  }, []);
  
  const handleAnalyzeVideo = async () => {
    if (!videoFile) return;
    
    if (!contentAnalyzer.hasValidApiKey()) {
      setAnalysisState({
        ...analysisState,
        error: 'נדרש מפתח API של Gemini. אנא הגדר מפתח בהגדרות.'
      });
      return;
    }
    
    setAnalysisState({
      ...analysisState,
      isAnalyzing: true,
      progress: 0,
      error: null
    });
    
    try {
      const result = await contentAnalyzer.analyzeVideoFrames(
        videoFile.file,
        5, // Number of frames to analyze
        (progress) => {
          setAnalysisState(prev => ({
            ...prev,
            progress
          }));
        }
      );
      
      setAnalysisState({
        isAnalyzing: false,
        progress: 100,
        error: null,
        summary: result.summary,
        keyMoments: result.keyMoments,
        genre: result.genre,
        emotionalTone: result.emotionalTone,
        suggestedTitle: result.suggestedTitle,
        suggestedTags: result.suggestedTags,
        generatedScript: null
      });
    } catch (error) {
      setAnalysisState({
        ...analysisState,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'שגיאה לא ידועה בניתוח הוידאו'
      });
    }
  };
  
  const handleGenerateScript = async () => {
    if (!analysisState.summary) return;
    
    setAnalysisState({
      ...analysisState,
      isAnalyzing: true,
      progress: 0,
      error: null
    });
    
    try {
      const script = await contentAnalyzer.generateVoiceoverScript(
        {
          summary: analysisState.summary,
          keyMoments: analysisState.keyMoments || [],
          genre: analysisState.genre || 'unspecified',
          emotionalTone: analysisState.emotionalTone || 'neutral',
          suggestedTitle: analysisState.suggestedTitle || '',
          suggestedTags: analysisState.suggestedTags || []
        },
        scriptDuration,
        scriptStyle
      );
      
      setAnalysisState({
        ...analysisState,
        isAnalyzing: false,
        progress: 100,
        generatedScript: script
      });
      
      if (onScriptGenerated) {
        // Pass the script and the analysis data to the parent component
        onScriptGenerated(script, {
          emotionalTone: analysisState.emotionalTone || 'neutral',
          genre: analysisState.genre || 'unspecified'
        });
      }
    } catch (error) {
      setAnalysisState({
        ...analysisState,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'שגיאה לא ידועה ביצירת התסריט'
      });
    }
  };
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('הטקסט הועתק ללוח');
      })
      .catch(err => {
        console.error('שגיאה בהעתקה ללוח:', err);
      });
  };
  
  if (!videoFile) {
    return null;
  }
  
  if (!hasApiKey) {
    return (
      <motion.div
        className="bg-gray-800 rounded-lg p-6 border border-gray-700 mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center mb-4">
          <Brain className="w-6 h-6 text-purple-500 mr-2" />
          <h3 className="text-xl font-bold text-white">ניתוח תוכן חכם</h3>
        </div>
        
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-md p-4 mb-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
            <div>
              <p className="text-yellow-200 font-medium">נדרש מפתח API של Gemini</p>
              <p className="text-yellow-300/70 text-sm mt-1">
                כדי להשתמש בניתוח תוכן חכם, אנא הגדר מפתח API של Gemini בהגדרות.
              </p>
              <a 
                href="/settings/api-keys" 
                className="inline-block mt-2 px-3 py-1 bg-purple-700 hover:bg-purple-600 rounded text-sm text-white transition-colors"
              >
                עבור להגדרות API
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      className="bg-gray-800 rounded-lg p-6 border border-gray-700 mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center mb-4">
        <Brain className="w-6 h-6 text-purple-500 mr-2" />
        <h3 className="text-xl font-bold text-white">ניתוח תוכן חכם</h3>
      </div>
      
      {!analysisState.summary && !analysisState.isAnalyzing && !analysisState.error && (
        <div className="text-center py-8">
          <Film className="w-12 h-12 mx-auto text-gray-500 mb-3" />
          <p className="text-gray-300 mb-4">נתח את הוידאו באמצעות AI כדי לקבל תובנות וליצור תסריט</p>
          <button
            onClick={handleAnalyzeVideo}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors"
          >
            נתח וידאו
          </button>
        </div>
      )}
      
      {analysisState.isAnalyzing && (
        <div className="text-center py-6">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <Loader className="w-20 h-20 text-purple-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-medium">{Math.round(analysisState.progress)}%</span>
            </div>
          </div>
          <p className="text-gray-300">מנתח את הוידאו, אנא המתן...</p>
        </div>
      )}
      
      {analysisState.error && (
        <div className="bg-red-900/30 border border-red-600 rounded-md p-4 mb-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <p className="text-red-200 font-medium">שגיאה בניתוח</p>
              <p className="text-red-300/70 text-sm mt-1">{analysisState.error}</p>
              <button 
                onClick={handleAnalyzeVideo}
                className="inline-block mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm text-white transition-colors"
              >
                נסה שוב
              </button>
            </div>
          </div>
        </div>
      )}
      
      {analysisState.summary && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-gray-900 rounded-md p-4">
            <h4 className="text-lg font-medium text-white mb-2">סיכום</h4>
            <p className="text-gray-300">{analysisState.summary}</p>
          </div>
          
          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-md p-4">
              <div className="flex items-center mb-2">
                <Film className="w-4 h-4 text-purple-500 mr-2" />
                <h5 className="font-medium text-white">ז'אנר</h5>
              </div>
              <p className="text-gray-300">{analysisState.genre}</p>
            </div>
            
            <div className="bg-gray-900 rounded-md p-4">
              <div className="flex items-center mb-2">
                <Sparkles className="w-4 h-4 text-purple-500 mr-2" />
                <h5 className="font-medium text-white">טון רגשי</h5>
              </div>
              <p className="text-gray-300">{analysisState.emotionalTone}</p>
            </div>
            
            <div className="bg-gray-900 rounded-md p-4">
              <div className="flex items-center mb-2">
                <Tag className="w-4 h-4 text-purple-500 mr-2" />
                <h5 className="font-medium text-white">כותרת מוצעת</h5>
              </div>
              <p className="text-gray-300">{analysisState.suggestedTitle}</p>
            </div>
          </div>
          
          {/* Key Moments */}
          {analysisState.keyMoments && analysisState.keyMoments.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-white mb-3">רגעים מרכזיים</h4>
              <div className="space-y-3">
                {analysisState.keyMoments.map((moment, index) => (
                  <div key={index} className="bg-gray-900 rounded-md p-3">
                    <div className="flex justify-between mb-1">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-purple-500 mr-2" />
                        <span className="text-gray-400">{formatTime(moment.time)}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900 text-purple-200">
                          חשיבות: {moment.importance}/10
                        </span>
                        {moment.emotion && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900 text-blue-200 mr-2">
                            {moment.emotion}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-300">{moment.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Tags */}
          {analysisState.suggestedTags && analysisState.suggestedTags.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-white mb-3">תגיות מוצעות</h4>
              <div className="flex flex-wrap gap-2">
                {analysisState.suggestedTags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Script Generation */}
          <div className="border-t border-gray-700 pt-6 mt-6">
            <h4 className="text-lg font-medium text-white mb-4">יצירת תסריט לקריינות</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">סגנון</label>
                <select
                  value={scriptStyle}
                  onChange={(e) => setScriptStyle(e.target.value as 'formal' | 'casual' | 'dramatic')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value="casual">יומיומי</option>
                  <option value="formal">רשמי</option>
                  <option value="dramatic">דרמטי</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">אורך (שניות)</label>
                <input
                  type="number"
                  value={scriptDuration}
                  onChange={(e) => setScriptDuration(parseInt(e.target.value))}
                  min={10}
                  max={120}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
              </div>
            </div>
            
            {!analysisState.generatedScript ? (
              <button
                onClick={handleGenerateScript}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors"
                disabled={analysisState.isAnalyzing}
              >
                צור תסריט
              </button>
            ) : (
              <div className="bg-gray-900 rounded-md p-4 relative">
                <h5 className="font-medium text-white mb-2">תסריט שנוצר</h5>
                <p className="text-gray-300 whitespace-pre-line">{analysisState.generatedScript}</p>
                <button
                  onClick={() => copyToClipboard(analysisState.generatedScript || '')}
                  className="absolute top-3 right-3 p-1.5 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
                  title="העתק ללוח"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ContentAnalysisPanel;