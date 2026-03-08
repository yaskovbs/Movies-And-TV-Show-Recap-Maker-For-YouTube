import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Download, Copy, Play, Pause, PlayCircle } from 'lucide-react'
import type { RecapOutput } from '../types'

interface ResultsSectionProps {
  output: RecapOutput
}

const ResultsSection = ({ output }: ResultsSectionProps) => {
  const [isCopied, setIsCopied] = useState(false)
  
  // Video state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(output.script);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Video controls
  const handleVideoPlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (isVideoPlaying) {
        video.pause();
      } else {
        video.play();
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handlePlay = () => setIsVideoPlaying(true);
      const handlePause = () => setIsVideoPlaying(false);
      
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handlePause);

      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handlePause);
      };
    }
  }, []);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* 1. Video Recap */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">סיכום וידאו (ללא קול)</h3>
        
        <div className="relative w-full rounded-lg overflow-hidden group mb-4">
          <video 
            ref={videoRef}
            src={output.videoUrl} 
            className="w-full cursor-pointer"
            onClick={handleVideoPlayPause}
          />
          {!isVideoPlaying && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 cursor-pointer transition-opacity duration-300 group-hover:bg-opacity-50"
              onClick={handleVideoPlayPause}
            >
              <PlayCircle size={64} className="text-white opacity-80 hover:opacity-100 transition-opacity drop-shadow-lg" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          <motion.button 
            onClick={handleVideoPlayPause}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {isVideoPlaying ? <Pause size={20} /> : <Play size={20} />}
            <span>{isVideoPlaying ? 'השהה' : 'נגן וידאו'}</span>
          </motion.button>
          <motion.a
            href={output.videoUrl}
            download="recap-video.mp4"
            className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold rounded-lg transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="h-5 w-5" />
            <span>הורד וידאו</span>
          </motion.a>
        </div>
      </div>

      {/* 2. Generated Script */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">תסריט שנוצר</h3>
        <textarea
          readOnly
          value={output.script}
          className="w-full h-48 bg-gray-900 text-gray-300 p-3 rounded-lg border border-gray-600 resize-none"
        />
        <button
          onClick={handleCopy}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
        >
          <Copy className="h-5 w-5 ml-2" />
          {isCopied ? 'הועתק!' : 'העתק תסריט'}
        </button>
      </div>
    </motion.div>
  )
}

export default ResultsSection
