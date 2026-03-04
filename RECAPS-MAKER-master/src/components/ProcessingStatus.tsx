import { motion } from 'framer-motion'
import { Loader2, CheckCircle, AlertCircle, Upload, Cog, Wand2, Mic, Search, Save } from 'lucide-react'
import type { ProcessingStatus } from '../types'

interface ProcessingStatusProps {
  status: ProcessingStatus
}

const ProcessingStatusComponent = ({ status }: ProcessingStatusProps) => {
  const getIcon = () => {
    switch (status.stage) {
      case 'loading_engine':
        return <Upload className="h-6 w-6" />
      case 'analyzing_video':
        return <Search className="h-6 w-6" />
      case 'extracting_frames':
        return <Search className="h-6 w-6" />
      case 'generating_description':
        return <Wand2 className="h-6 w-6" />
      case 'cutting_video':
        return <Cog className="h-6 w-6 animate-spin" />
      case 'generating_script':
        return <Wand2 className="h-6 w-6" />
       case 'generating_audio':
        return <Mic className="h-6 w-6" />
      case 'saving':
        return <Save className="h-6 w-6" />
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-400" />
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-400" />
      default:
        return <Loader2 className="h-6 w-6 animate-spin" />
    }
  }

  const getStageText = () => {
    switch (status.stage) {
      case 'loading_engine':
        return 'טוען מנוע וידאו...'
      case 'analyzing_video':
        return 'מנתח את הווידאו...'
      case 'extracting_frames':
        return 'דוגם פריימים מהווידאו...'
      case 'generating_description':
        return 'ה-AI יוצר תקציר...'
      case 'cutting_video':
        return 'מעבד וידאו...'
      case 'generating_script':
        return 'Creating script with AI...'
      case 'generating_audio':
        return 'יוצר קריינות...'
      case 'saving':
        return 'שומר את הסיכום...'
      case 'completed':
        return 'הושלם בהצלחה!'
      case 'error':
        return 'שגיאה בעיבוד'
      default:
        return 'מתחיל עיבוד...'
    }
  }

  const getProgressBarColor = () => {
    switch (status.stage) {
      case 'completed':
        return 'bg-green-600'
      case 'error':
        return 'bg-red-600'
      default:
        return 'bg-blue-600'
    }
  }

  const isIndeterminate = 
    status.stage === 'loading_engine' ||
    status.stage === 'generating_description' || 
    status.stage === 'generating_script';

  return (
    <motion.div 
      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          {getIcon()}
          <div>
            <h3 className="text-lg font-semibold text-white">{getStageText()}</h3>
            <p className="text-gray-400 text-sm">{status.message}</p>
          </div>
        </div>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
        {isIndeterminate ? (
          <div className={`relative w-full h-full ${getProgressBarColor()} overflow-hidden`}>
            <div className="absolute top-0 left-0 h-full bg-white/20 w-1/3 animate-[shimmer_2s_infinite]"/>
          </div>
        ) : (
          <motion.div 
            className={`h-3 rounded-full ${getProgressBarColor()}`}
            initial={{ width: '0%' }}
            animate={{ width: `${status.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        )}
      </div>

      <div className="flex justify-between text-sm text-gray-400">
        <span>
          {status.stage === 'completed' ? 'מוכן' : isIndeterminate ? 'מעבד בקשה...' : 'אנא המתן...'}
        </span>
        {!isIndeterminate && <span>{status.progress}% הושלם</span>}
      </div>

      {status.stage !== 'completed' && status.stage !== 'error' && (
        <div className="mt-6 flex justify-center">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
        </div>
      )}
    </motion.div>
  )
}

export default ProcessingStatusComponent
