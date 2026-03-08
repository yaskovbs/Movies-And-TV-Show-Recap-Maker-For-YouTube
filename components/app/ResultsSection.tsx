"use client"

import { Download, Share2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ResultsSectionProps {
  output: {
    videoUrl: string
    script: string
  }
}

export default function ResultsSection({ output }: ResultsSectionProps) {
  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = output.videoUrl
    a.download = `recap-${Date.now()}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "סיכום הסרט שלי",
          text: "צפו בסיכום שיצרתי!",
          url: output.videoUrl
        })
      } catch (err) {
        console.log("Share cancelled")
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(output.videoUrl)
      alert("הקישור הועתק ללוח!")
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-center mb-6">
        <CheckCircle2 className="h-8 w-8 text-green-400 ml-3" />
        <h2 className="text-2xl font-bold text-white">הסיכום מוכן!</h2>
      </div>

      <div className="mb-6">
        <video 
          src={output.videoUrl} 
          controls 
          className="w-full rounded-lg max-h-80 object-contain bg-black"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={handleDownload}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Download className="h-5 w-5 ml-2" />
          הורד את הסיכום
        </Button>
        
        <Button 
          onClick={handleShare}
          variant="outline"
          className="flex-1 border-gray-600 hover:bg-gray-700"
        >
          <Share2 className="h-5 w-5 ml-2" />
          שתף ברשתות חברתיות
        </Button>
      </div>

      {output.script && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-white font-semibold mb-2">התסריט:</h3>
          <p className="text-gray-300 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
            {output.script}
          </p>
        </div>
      )}
    </div>
  )
}
