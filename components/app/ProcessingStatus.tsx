"use client"

import { Loader2, CheckCircle2, AlertCircle, Cog } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export interface ProcessingStatusType {
  stage: "loading_engine" | "analyzing_video" | "cutting_video" | "saving" | "completed" | "error"
  progress: number
  message: string
  output?: {
    videoUrl: string
    script: string
  }
}

interface ProcessingStatusProps {
  status: ProcessingStatusType
}

export default function ProcessingStatus({ status }: ProcessingStatusProps) {
  const getStageIcon = () => {
    switch (status.stage) {
      case "completed":
        return <CheckCircle2 className="h-12 w-12 text-green-400" />
      case "error":
        return <AlertCircle className="h-12 w-12 text-red-400" />
      default:
        return <Cog className="h-12 w-12 text-blue-400 animate-spin" />
    }
  }

  const getStageColor = () => {
    switch (status.stage) {
      case "completed":
        return "text-green-400"
      case "error":
        return "text-red-400"
      default:
        return "text-blue-400"
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
      <div className="flex flex-col items-center text-center">
        {getStageIcon()}
        
        <h3 className={cn("text-xl font-semibold mt-4 mb-2", getStageColor())}>
          {status.stage === "completed" ? "הסיכום מוכן!" : 
           status.stage === "error" ? "שגיאה בעיבוד" : 
           "מעבד את הווידאו..."}
        </h3>
        
        <p className="text-gray-400 mb-6">{status.message}</p>
        
        {status.stage !== "completed" && status.stage !== "error" && (
          <div className="w-full space-y-2">
            <Progress value={status.progress} className="h-3" />
            <p className="text-sm text-gray-500">{status.progress}% הושלם</p>
          </div>
        )}

        {status.stage === "error" && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
            <p className="text-red-400 text-sm">
              אנא נסה שנית או בדוק את הגדרות הווידאו
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
