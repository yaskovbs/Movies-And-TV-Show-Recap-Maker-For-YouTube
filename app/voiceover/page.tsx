"use client"

import { useState, useEffect } from "react"
import { Download, Play, Pause, Square, Loader2, Info, Mic } from "lucide-react"
import Header from "@/components/app/Header"
import Footer from "@/components/app/Footer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function VoiceoverPage() {
  const [apiKey, setApiKey] = useState("")
  const [text, setText] = useState("")
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [allVoices, setAllVoices] = useState<SpeechSynthesisVoice[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [filteredVoices, setFilteredVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>("")
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      if (availableVoices.length === 0) return

      setAllVoices(availableVoices)

      const uniqueLangs = [...new Set(availableVoices.map(v => v.lang))].sort()
      setLanguages(uniqueLangs)

      const defaultLang = uniqueLangs.find(lang => lang.startsWith("en")) || uniqueLangs[0]
      setSelectedLanguage(defaultLang || "")
    }
    
    window.speechSynthesis.onvoiceschanged = loadVoices
    loadVoices()
  }, [])

  useEffect(() => {
    if (selectedLanguage) {
      const voicesForLang = allVoices.filter(v => v.lang === selectedLanguage)
      setFilteredVoices(voicesForLang)
      setSelectedVoice(voicesForLang[0] || null)
    }
  }, [selectedLanguage, allVoices])

  const handleAudioPlayPause = () => {
    if (!text) {
      alert("אנא הכנס טקסט להקראה.")
      return
    }
    if (isAudioPlaying) {
      window.speechSynthesis.pause()
      setIsAudioPlaying(false)
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      } else {
        const utterance = new SpeechSynthesisUtterance(text)
        if (selectedVoice) {
          utterance.voice = selectedVoice
        }
        utterance.onend = () => setIsAudioPlaying(false)
        window.speechSynthesis.speak(utterance)
      }
      setIsAudioPlaying(true)
    }
  }

  const handleAudioStop = () => {
    window.speechSynthesis.cancel()
    setIsAudioPlaying(false)
  }

  const handleDownloadAudio = async () => {
    if (!text || !selectedVoice) {
      alert("אנא הכנס טקסט ובחר קול תחילה.")
      return
    }
    if (isDownloading) return

    setIsDownloading(true)

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      if (displayStream.getAudioTracks().length === 0) {
        displayStream.getTracks().forEach(track => track.stop())
        throw new Error("שיתוף שמע נדרש להורדת הקריינות. אנא נסה שוב והפעל את \"שתף שמע מכרטיסייה\".")
      }

      const recorder = new MediaRecorder(displayStream, { mimeType: "audio/webm" })
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "voice-over.webm"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        displayStream.getTracks().forEach(track => track.stop())
        setIsDownloading(false)
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = selectedVoice
      utterance.onend = () => {
        setTimeout(() => {
          if (recorder.state === "recording") recorder.stop()
        }, 500)
      }
      
      utterance.onerror = () => {
        if (recorder.state === "recording") recorder.stop()
        throw new Error("אירעה שגיאה במהלך יצירת הדיבור.")
      }

      recorder.start()
      window.speechSynthesis.speak(utterance)

    } catch (error: unknown) {
      console.error("Error downloading audio:", error)
      const message = error instanceof Error ? error.message : "הורדת האודיו נכשלה או בוטלה."
      alert(message)
      setIsDownloading(false)
    }
  }

  const getDisplayLanguage = (langCode: string) => {
    try {
      const languageName = new Intl.DisplayNames(["en"], { type: "language" }).of(langCode.split("-")[0])
      return `${languageName} (${langCode})`
    } catch {
      return langCode
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header apiKey={apiKey} onApiKeyChange={setApiKey} />
      
      <main className="flex-grow py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Mic className="h-12 w-12 text-blue-400 ml-4" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                קריינות אודיו עם AI
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              הפכו כל טקסט לקובץ שמע מקצועי במגוון קולות ושפות.
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 space-y-6">
            <div>
              <Label className="text-lg font-semibold text-white mb-2 block">הדבק כאן את הטקסט שלך:</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="כתוב או הדבק את התסריט כאן..."
                className="w-full h-48 bg-gray-700 text-gray-200 border-gray-600 resize-y"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm text-gray-400 block mb-2">בחר שפה:</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="בחר שפה" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang} value={lang}>{getDisplayLanguage(lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-gray-400 block mb-2">בחר קול:</Label>
                <Select 
                  value={selectedVoice?.name || ""} 
                  onValueChange={(name) => setSelectedVoice(allVoices.find(v => v.name === name) || null)}
                  disabled={filteredVoices.length === 0}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white disabled:opacity-50">
                    <SelectValue placeholder="בחר קול" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredVoices.map(voice => (
                      <SelectItem key={voice.name} value={voice.name}>{voice.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-6">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button 
                  onClick={handleAudioPlayPause} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isAudioPlaying ? <Pause className="h-5 w-5 ml-2" /> : <Play className="h-5 w-5 ml-2" />}
                  <span>{isAudioPlaying ? "השהה" : "נגן"}</span>
                </Button>
                <Button 
                  onClick={handleAudioStop} 
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Square className="h-5 w-5 ml-2" />
                  <span>עצור</span>
                </Button>
                <Button
                  onClick={handleDownloadAudio}
                  disabled={isDownloading || !selectedVoice || !text}
                  className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 disabled:opacity-50"
                >
                  {isDownloading ? (
                    <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5 ml-2" />
                  )}
                  <span>{isDownloading ? "מקליט..." : "הורד אודיו"}</span>
                </Button>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-400 bg-gray-700/50 p-4 rounded-lg border border-gray-600 flex items-start gap-3">
              <Info className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-200 mb-1">הוראות להורדת האודיו:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>לחצו על כפתור &quot;הורד אודיו&quot;.</li>
                  <li>בחלון שיקפוץ, בחרו את הכרטיסייה הנוכחית.</li>
                  <li>ודאו שהאפשרות <strong>&quot;שתף שמע מכרטיסייה&quot; (Share tab audio)</strong> מסומנת.</li>
                  <li>ההקלטה תתחיל והקובץ ירד אוטומטית בסיום.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
