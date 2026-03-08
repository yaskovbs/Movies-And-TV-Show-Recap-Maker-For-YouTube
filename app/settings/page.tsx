"use client"

import { useState } from "react"
import { Settings, Key, HardDrive, Save, AlertCircle } from "lucide-react"
import Header from "@/components/app/Header"
import Footer from "@/components/app/Footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("")
  const [geminiApiKey, setGeminiApiKey] = useState("")
  const [autoSave, setAutoSave] = useState(true)
  const [cloudStorage, setCloudStorage] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  const handleSaveSettings = () => {
    // Save settings to localStorage
    localStorage.setItem("geminiApiKey", geminiApiKey)
    localStorage.setItem("autoSave", String(autoSave))
    localStorage.setItem("cloudStorage", String(cloudStorage))
    
    setSaveStatus("ההגדרות נשמרו בהצלחה!")
    setTimeout(() => setSaveStatus(null), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header apiKey={apiKey} onApiKeyChange={setApiKey} />
      
      <main className="flex-grow py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Settings className="h-12 w-12 text-blue-400 ml-4" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                הגדרות
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              נהל את הגדרות החשבון ומפתחות ה-API שלך
            </p>
          </div>

          <div className="space-y-6">
            {/* API Keys Section */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center mb-6">
                <Key className="h-6 w-6 text-blue-400 ml-3" />
                <h2 className="text-xl font-semibold text-white">מפתחות API</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300 mb-2 block">מפתח Google Gemini API</Label>
                  <Input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="הכנס את מפתח ה-API שלך..."
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    קבל מפתח API בחינם מ-<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>
                  </p>
                </div>

                <div className="p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">שימו לב</p>
                    <p className="text-gray-300 text-sm">
                      מפתח ה-API נשמר באופן מקומי בדפדפן שלך בלבד. אנחנו לא שומרים או שולחים את המפתח לשרתים שלנו.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Settings Section */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center mb-6">
                <HardDrive className="h-6 w-6 text-blue-400 ml-3" />
                <h2 className="text-xl font-semibold text-white">הגדרות אחסון</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">שמירה אוטומטית</Label>
                    <p className="text-gray-400 text-sm">שמור את הסיכומים אוטומטית לאחר יצירה</p>
                  </div>
                  <Switch
                    checked={autoSave}
                    onCheckedChange={setAutoSave}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">אחסון בענן</Label>
                    <p className="text-gray-400 text-sm">שמור את הסיכומים בענן לגישה מכל מכשיר (דורש חשבון)</p>
                  </div>
                  <Switch
                    checked={cloudStorage}
                    onCheckedChange={setCloudStorage}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between">
              {saveStatus && (
                <p className="text-green-400 font-medium">{saveStatus}</p>
              )}
              <Button
                onClick={handleSaveSettings}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 mr-auto"
              >
                <Save className="h-5 w-5 ml-2" />
                שמור הגדרות
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
