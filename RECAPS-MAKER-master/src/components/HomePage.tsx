import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Users, Zap, Shield, Cpu, FileText } from 'lucide-react'
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'
import VideoUploader from './VideoUploader'
import EnhancedVideoUploader from './EnhancedVideoUploader'
import RecapSettings from './RecapSettings'
import ProcessingStatus from './ProcessingStatus'
import ResultsSection from './ResultsSection'
import StatsSection from './StatsSection'
import { supabase } from '../lib/supabase'
import type { VideoFile, RecapSettings as RecapSettingsType, ProcessingStatus as ProcessingStatusType } from '../types'

const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = function() {
      window.URL.revokeObjectURL(video.src);
      if (video.duration === Infinity) {
        reject('לא ניתן לקבוע את אורך הווידאו. ייתכן שזהו שידור חי או קובץ פגום.');
      }
      resolve(video.duration);
    }

    video.onerror = function() {
      window.URL.revokeObjectURL(video.src);
      reject('שגיאה בקריאת מטא-דאטה של הווידאו. ייתכן שהקובץ פגום.');
    }

    video.src = window.URL.createObjectURL(file);
  });
};

interface HomePageProps {
  apiKey: string;
}

const HomePage = ({ apiKey }: HomePageProps) => {
  const [selectedFile, setSelectedFile] = useState<VideoFile | null>(null)
  const [settings, setSettings] = useState<RecapSettingsType>({
    duration: 30,
    intervalSeconds: 8,
    captureSeconds: 1,
    script: '',
    apiKey: ''
  })
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType | null>(null)
  const ffmpegRef = useRef<any>(null);

  const loadFFmpeg = async () => {
    if (ffmpegRef.current && ffmpegRef.current.isLoaded()) {
      return ffmpegRef.current;
    }
    
    setProcessingStatus({ stage: 'loading_engine', progress: 0, message: 'טוען את מנוע הווידאו...'});
    
    const ffmpeg = createFFmpeg({
      corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
      log: false, // Disable verbose logs in console
    });
    ffmpegRef.current = ffmpeg;

    ffmpeg.setProgress(({ ratio }) => {
      setProcessingStatus(prev => {
          if (prev?.stage === 'cutting_video') {
              return {
                  ...prev,
                  progress: Math.round(ratio * 100),
                  message: `מעבד וידאו...`
              }
          }
          return prev;
      });
    });
    
    setProcessingStatus({ stage: 'loading_engine', progress: 50, message: 'מפעיל את מנוע הווידאו...'});
    await ffmpeg.load();

    setProcessingStatus({ stage: 'loading_engine', progress: 100, message: 'מנוע הווידאו נטען בהצלחה!'});
    await new Promise(resolve => setTimeout(resolve, 500));
    return ffmpeg;
  };

  const handleCreateRecap = async () => {
    if (!selectedFile) {
      alert('אנא בחר קובץ וידאו');
      return;
    }
    if (!settings.script) {
      alert('אנא הכנס תסריט לסיכום');
      return;
    }

    setProcessingStatus({ stage: 'analyzing_video', progress: 0, message: 'קורא מאפייני וידאו...'});
    
    try {
      const videoDuration = await getVideoDuration(selectedFile.file);
      if (!videoDuration || !isFinite(videoDuration)) {
        throw new Error("לא ניתן היה לקבוע את אורך הווידאו. ייתכן שהקובץ פגום.");
      }
      setProcessingStatus({ stage: 'analyzing_video', progress: 100, message: 'ניתוח הושלם!'});
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const ffmpeg = await loadFFmpeg();
      
      ffmpeg.FS('writeFile', selectedFile.name, await fetchFile(selectedFile.file));

      setProcessingStatus({ stage: 'cutting_video', progress: 0, message: 'מרכיב את סרטון הסיכום...' });
      
      const numClips = Math.floor(settings.duration / settings.captureSeconds);
      const filters: string[] = [];
      const concatInputs: string[] = [];

      for (let i = 0; i < numClips; i++) {
        const startTime = i * settings.intervalSeconds;
        if (startTime + settings.captureSeconds > videoDuration) {
          console.warn(`Stopping early, video duration of ${videoDuration}s is not enough for all clips.`);
          break;
        }
        filters.push(`[0:v]trim=start=${startTime}:end=${startTime + settings.captureSeconds},setpts=PTS-STARTPTS[v${i}]`);
        concatInputs.push(`[v${i}]`);
      }

      if (concatInputs.length === 0) {
        throw new Error("לא נוצרו קטעים. בדוק את אורך הווידאו והגדרות הסיכום.");
      }

      const filterComplex = `${filters.join(';')};${concatInputs.join('')}concat=n=${concatInputs.length}:v=1:a=0[outv]`;
      
      const outputFileName = 'recap.mp4';
      await ffmpeg.run(
        '-i', selectedFile.name,
        '-filter_complex', filterComplex,
        '-map', '[outv]',
        '-y',
        outputFileName
      );

      const data = ffmpeg.FS('readFile', outputFileName);
      const videoUrl = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

      setProcessingStatus({ stage: 'saving', progress: 0, message: 'מתחיל שמירה בענן...' });
      const videoBlob = await fetch(videoUrl).then(r => r.blob());
      const visitorId = localStorage.getItem('visitor_id') || 'unknown_visitor';
      const filePath = `recaps/${visitorId}/${Date.now()}.mp4`;

      setProcessingStatus({ stage: 'saving', progress: 33, message: 'מעלה וידאו לאחסון...' });
      const { error: uploadError } = await supabase.storage.from('recaps').upload(filePath, videoBlob);
      if (uploadError) throw new Error(`שגיאה בהעלאת הוידאו: ${uploadError.message}`);

      setProcessingStatus({ stage: 'saving', progress: 66, message: 'שומר נתונים במסד הנתונים...' });
      const { error: dbError } = await supabase.from('generated_recaps').insert({ script: settings.script, video_path: filePath, description: "Script provided by user", visitor_id: visitorId });
      if (dbError) throw new Error(`שגיאה בשמירת נתוני הסיכום: ${dbError.message}`);

      setProcessingStatus({ stage: 'saving', progress: 100, message: 'השמירה הושלמה!' });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcessingStatus({ 
        stage: 'completed', 
        progress: 100, 
        message: 'הסיכום מוכן!',
        output: { videoUrl: videoUrl, script: settings.script }
      });

      supabase.rpc('increment_recaps_created').then(({ error: rpcError }) => {
        if (rpcError) console.error('Failed to increment recap count:', rpcError);
      });

      ffmpeg.FS('unlink', selectedFile.name);
      ffmpeg.FS('unlink', outputFileName);

    } catch (error: any) {
      console.error("An error occurred during recap creation:", error);
      let userMessage = 'שגיאה לא ידועה התרחשה. אנא נסה שוב.';
      
      const errorMessage = typeof error?.message === 'string' ? error.message : "";

      if (processingStatus?.stage === 'loading_engine') {
        userMessage = 'שגיאה קריטית בטעינת מנוע הווידאו. בדוק את חיבור האינטרנט ורענן את הדף.';
      } else if (errorMessage) {
        if (errorMessage.includes('SharedArrayBuffer')) {
          userMessage = 'שגיאת אבטחה: SharedArrayBuffer אינו מוגדר. יש לוודא שהאתר מוגש עם כותרות COOP/COEP.';
        } else {
          userMessage = errorMessage;
        }
      }
      setProcessingStatus({ stage: 'error', progress: 0, message: userMessage });
    }
  }

  const features = [
    { icon: Zap, title: 'עיבוד מהיר', description: 'טכנולוגיית AI מתקדמת לעיבוד מהיר ויעיל' },
    { icon: Cpu, title: 'מנוע FFmpeg', description: 'עיבוד וידאו מתקדם ישירות בדפדפן' },
    { icon: Shield, title: 'בטוח ומאובטח', description: 'הקבצים שלכם מוגנים והמפתחות לא נשמרים' },
    { icon: Users, title: 'קל לשימוש', description: 'ממשק פשוט ונוח לכל הגילאים' }
  ]

  const renderMainPanel = () => {
    if (processingStatus) {
      if (processingStatus.stage === 'completed' && processingStatus.output) {
        return <ResultsSection output={processingStatus.output} />;
      }
      return <ProcessingStatus status={processingStatus} />;
    }
    
    if (!selectedFile) {
      return (
        <motion.div 
          className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700" 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          key="step1"
        >
          <h3 className="text-2xl font-bold text-white mb-6">
            שלב 1: העלאת וידאו
          </h3>
          <EnhancedVideoUploader
            selectedFile={selectedFile}
            onFileSelect={(file) => setSelectedFile(file)}
            onRemoveFile={() => setSelectedFile(null)}
          />
        </motion.div>
      );
    }
    
    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        key="settings"
      >
        <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-blue-400 ml-3" />
                <h2 className="text-xl font-semibold text-white">שלב 2: הוספת תסריט</h2>
            </div>
            <p className="text-gray-400 mb-4 text-sm">הדבק כאן את התסריט שלך. הקריינות תיווצר על בסיס טקסט זה.</p>
            <textarea
                value={settings.script}
                onChange={(e) => setSettings(prev => ({ ...prev, script: e.target.value }))}
                placeholder="הדבק כאן את התסריט המלא..."
                className="w-full h-40 bg-gray-700 text-gray-200 p-3 rounded-lg border border-gray-600 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>

        <RecapSettings settings={settings} onSettingsChange={setSettings} />

        <motion.button
          onClick={handleCreateRecap}
          disabled={!selectedFile || !settings.script}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
            selectedFile && settings.script
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
          whileHover={{ scale: (selectedFile && settings.script) ? 1.02 : 1 }}
          whileTap={{ scale: (selectedFile && settings.script) ? 0.98 : 1 }}
        >
          <Play className="inline-block h-5 w-5 ml-2" />
          צור סיכום וידאו
        </motion.button>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <section className="py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            יוצר סיכומי וידאו
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            הפלטפורמה המתקדמת ביותר ליצירת סיכומי וידאו מקצועיים לסרטים וסדרות באמצעות בינה מלאכותית של Google Gemini
          </p>
        </motion.div>
      </section>

      <StatsSection />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-20">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {renderMainPanel()}
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <feature.icon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-white text-sm mb-1">{feature.title}</h4>
                  <p className="text-gray-400 text-xs">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
