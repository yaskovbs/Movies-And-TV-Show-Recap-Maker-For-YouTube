"use client"

import { useState } from "react"
import { Play, Users, Zap, Shield, Cpu, FileText, Brain } from "lucide-react"
import Header from "@/components/app/Header"
import Footer from "@/components/app/Footer"
import StatsSection from "@/components/app/StatsSection"
import VideoUploader, { VideoFile } from "@/components/app/VideoUploader"
import RecapSettings, { RecapSettingsType } from "@/components/app/RecapSettings"
import ProcessingStatus, { ProcessingStatusType } from "@/components/app/ProcessingStatus"
import ResultsSection from "@/components/app/ResultsSection"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const features = [
  { icon: Zap, title: "עיבוד מהיר", description: "טכנולוגיית AI מתקדמת לעיבוד מהיר ויעיל" },
  { icon: Cpu, title: "מנוע FFmpeg", description: "עיבוד וידאו מתקדם ישירות בדפדפן" },
  { icon: Shield, title: "בטוח ומאובטח", description: "הקבצים שלכם מוגנים והמפתחות לא נשמרים" },
  { icon: Users, title: "קל לשימוש", description: "ממשק פשוט ונוח לכל הגילאים" }
]

export default function HomePage() {
  const [apiKey, setApiKey] = useState("")
  const [selectedFile, setSelectedFile] = useState<VideoFile | null>(null)
  const [settings, setSettings] = useState<RecapSettingsType>({
    duration: 30,
    intervalSeconds: 8,
    captureSeconds: 1,
    script: "",
    apiKey: ""
  })
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType | null>(null)

  const handleCreateRecap = async () => {
    if (!selectedFile) {
      alert("אנא בחר קובץ וידאו")
      return
    }
    if (!settings.script) {
      alert("אנא הכנס תסריט לסיכום")
      return
    }

    // Simulate video processing
    setProcessingStatus({ stage: "analyzing_video", progress: 0, message: "מנתח את הווידאו..." })
    
    // Simulate processing stages
    const stages = [
      { stage: "analyzing_video" as const, message: "מנתח את הווידאו...", time: 1500 },
      { stage: "cutting_video" as const, message: "חותך קטעים מהווידאו...", time: 2000 },
      { stage: "saving" as const, message: "שומר את הסיכום...", time: 1000 },
    ]

    for (const stageInfo of stages) {
      for (let progress = 0; progress <= 100; progress += 10) {
        setProcessingStatus({ 
          stage: stageInfo.stage, 
          progress, 
          message: `${stageInfo.message} ${progress}%` 
        })
        await new Promise(resolve => setTimeout(resolve, stageInfo.time / 10))
      }
    }

    // Complete with demo output
    setProcessingStatus({
      stage: "completed",
      progress: 100,
      message: "הסיכום מוכן!",
      output: {
        videoUrl: selectedFile.preview,
        script: settings.script
      }
    })
  }

  const renderMainPanel = () => {
    if (processingStatus) {
      if (processingStatus.stage === "completed" && processingStatus.output) {
        return <ResultsSection output={processingStatus.output} />
      }
      return <ProcessingStatus status={processingStatus} />
    }
    
    if (!selectedFile) {
      return (
        <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
          <h3 className="text-2xl font-bold text-white mb-6">
            שלב 1: העלאת וידאו
          </h3>
          <VideoUploader
            selectedFile={selectedFile}
            onFileSelect={(file) => setSelectedFile(file)}
            onRemoveFile={() => setSelectedFile(null)}
          />
        </div>
      )
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 text-blue-400 ml-3" />
            <h2 className="text-xl font-semibold text-white">שלב 2: הוספת תסריט</h2>
            <div className="flex items-center mr-auto">
              <Brain className="h-5 w-5 text-purple-400 ml-1" />
              <span className="text-sm text-purple-300">ניתן לנתח את הוידאו עם AI</span>
            </div>
          </div>
          <p className="text-gray-400 mb-4 text-sm">הדבק כאן את התסריט שלך. הקריינות תיווצר על בסיס טקסט זה.</p>
          <Textarea
            value={settings.script}
            onChange={(e) => setSettings(prev => ({ ...prev, script: e.target.value }))}
            placeholder="הדבק כאן את התסריט המלא..."
            className="w-full h-40 bg-gray-700 text-gray-200 border-gray-600 resize-y"
          />
        </div>

        <RecapSettings settings={settings} onSettingsChange={setSettings} />

        <Button
          onClick={handleCreateRecap}
          disabled={!selectedFile || !settings.script}
          className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="h-5 w-5 ml-2" />
          צור סיכום וידאו לרשתות חברתיות
        </Button>
        
        {/* Video Preview */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-3">תצוגה מקדימה:</h3>
          <video 
            src={selectedFile.preview} 
            controls 
            className="w-full rounded-lg max-h-48 object-contain bg-black"
          />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSelectedFile(null)
              setProcessingStatus(null)
            }}
            className="mt-2 text-gray-400 hover:text-red-400"
          >
            החלף וידאו
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header apiKey={apiKey} onApiKeyChange={setApiKey} />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent text-balance">
              יוצר סיכומי וידאו לרשתות החברתיות שלך
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              הפלטפורמה המתקדמת ביותר ליצירת סיכומי וידאו מקצועיים לסרטים וסדרות באמצעות בינה מלאכותית של Google Gemini
            </p>
          </div>
        </section>

        <StatsSection />

        {/* Main Content Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-20">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {renderMainPanel()}
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700 hover:scale-105 transition-transform cursor-default"
                  >
                    <feature.icon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-white text-sm mb-1">{feature.title}</h4>
                    <p className="text-gray-400 text-xs">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
