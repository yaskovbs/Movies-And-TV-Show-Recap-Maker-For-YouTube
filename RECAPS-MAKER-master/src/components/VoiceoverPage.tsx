import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Play, Pause, Square, Loader2, Info, Mic } from 'lucide-react';

const VoiceoverPage = () => {
  const [text, setText] = useState('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [allVoices, setAllVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length === 0) return;

      setAllVoices(availableVoices);

      const uniqueLangs = [...new Set(availableVoices.map(v => v.lang))].sort();
      setLanguages(uniqueLangs);

      const defaultLang = uniqueLangs.find(lang => lang.startsWith('en')) || uniqueLangs[0];
      setSelectedLanguage(defaultLang || '');
    };
    
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  useEffect(() => {
    if (selectedLanguage) {
      const voicesForLang = allVoices.filter(v => v.lang === selectedLanguage);
      setFilteredVoices(voicesForLang);
      setSelectedVoice(voicesForLang[0] || null);
    }
  }, [selectedLanguage, allVoices]);

  const handleAudioPlayPause = () => {
    if (!text) {
      alert('אנא הכנס טקסט להקראה.');
      return;
    }
    if (isAudioPlaying) {
      window.speechSynthesis.pause();
      setIsAudioPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        utterance.onend = () => setIsAudioPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
      setIsAudioPlaying(true);
    }
  };

  const handleAudioStop = () => {
    window.speechSynthesis.cancel();
    setIsAudioPlaying(false);
  };

  const handleDownloadAudio = async () => {
    if (!text || !selectedVoice) {
      alert('אנא הכנס טקסט ובחר קול תחילה.');
      return;
    }
    if (isDownloading) return;

    setIsDownloading(true);

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      if (displayStream.getAudioTracks().length === 0) {
        displayStream.getTracks().forEach(track => track.stop());
        throw new Error('שיתוף שמע נדרש להורדת הקריינות. אנא נסה שוב והפעל את "שתף שמע מכרטיסייה".');
      }

      const recorder = new MediaRecorder(displayStream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'voice-over.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        displayStream.getTracks().forEach(track => track.stop());
        setIsDownloading(false);
      };

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      utterance.onend = () => {
        setTimeout(() => {
          if (recorder.state === 'recording') recorder.stop();
        }, 500);
      };
      
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        if (recorder.state === 'recording') recorder.stop();
        throw new Error('אירעה שגיאה במהלך יצירת הדיבור.');
      }

      recorder.start();
      window.speechSynthesis.speak(utterance);

    } catch (error: any) {
      console.error('Error downloading audio:', error);
      alert(error.message || 'הורדת האודיו נכשלה או בוטלה.');
      setIsDownloading(false);
    }
  };

  const getDisplayLanguage = (langCode: string) => {
    try {
      const languageName = new Intl.DisplayNames(['en'], { type: 'language' }).of(langCode.split('-')[0]);
      return `${languageName} (${langCode})`;
    } catch (e) {
      return langCode;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-6">
            <Mic className="h-12 w-12 text-blue-400 ml-4" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              קריינות אודיו עם AI
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            הפכו כל טקסט לקובץ שמע מקצועי במגוון קולות ושפות.
          </p>
        </motion.div>

        <motion.div
          className="bg-gray-800 rounded-lg p-8 border border-gray-700 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div>
            <label className="text-lg font-semibold text-white mb-2 block">הדבק כאן את הטקסט שלך:</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="כתוב או הדבק את התסריט כאן..."
              className="w-full h-48 bg-gray-700 text-gray-200 p-4 rounded-lg border border-gray-600 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-400 block mb-2">בחר שפה:</label>
              <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                  {languages.map(lang => (
                      <option key={lang} value={lang}>{getDisplayLanguage(lang)}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">בחר קול:</label>
              <select 
                  value={selectedVoice?.name || ''}
                  onChange={(e) => setSelectedVoice(allVoices.find(v => v.name === e.target.value) || null)}
                  disabled={filteredVoices.length === 0}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                  {filteredVoices.map(voice => (
                      <option key={voice.name} value={voice.name}>{voice.name}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button onClick={handleAudioPlayPause} className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors font-semibold">
                  {isAudioPlaying ? <Pause size={20} /> : <Play size={20} />}
                  <span>{isAudioPlaying ? 'השהה' : 'נגן'}</span>
              </button>
              <button onClick={handleAudioStop} className="flex items-center gap-2 px-6 py-3 bg-red-600 rounded-lg text-white hover:bg-red-700 transition-colors font-semibold">
                  <Square size={20} />
                  <span>עצור</span>
              </button>
              <motion.button
                onClick={handleDownloadAudio}
                disabled={isDownloading || !selectedVoice || !text}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: (isDownloading || !text) ? 1 : 1.05 }}
                whileTap={{ scale: (isDownloading || !text) ? 1 : 0.98 }}
              >
                {isDownloading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                <span>{isDownloading ? 'מקליט...' : 'הורד אודיו'}</span>
              </motion.button>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-400 bg-gray-700/50 p-4 rounded-lg border border-gray-600 flex items-start gap-3">
            <Info size={24} className="text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-200 mb-1">הוראות להורדת האודיו:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>לחצו על כפתור "הורד אודיו".</li>
                <li>בחלון שיקפוץ, בחרו את הכרטיסייה הנוכחית.</li>
                <li>ודאו שהאפשרות <strong>"שתף שמע מכרטיסייה" (Share tab audio)</strong> מסומנת.</li>
                <li>ההקלטה תתחיל והקובץ ירד אוטומטית בסיום.</li>
              </ol>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VoiceoverPage;
