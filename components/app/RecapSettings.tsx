"use client"

import { Settings2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

export interface RecapSettingsType {
  duration: number
  intervalSeconds: number
  captureSeconds: number
  script: string
  apiKey: string
  emotionalTone?: string
  genre?: string
}

interface RecapSettingsProps {
  settings: RecapSettingsType
  onSettingsChange: (settings: RecapSettingsType) => void
}

export default function RecapSettings({ settings, onSettingsChange }: RecapSettingsProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center mb-6">
        <Settings2 className="h-6 w-6 text-blue-400 ml-3" />
        <h2 className="text-xl font-semibold text-white">שלב 3: הגדרות הסיכום</h2>
      </div>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-gray-300">אורך הסיכום הסופי</Label>
            <span className="text-blue-400 font-medium">{settings.duration} שניות</span>
          </div>
          <Slider
            value={[settings.duration]}
            onValueChange={([value]) => onSettingsChange({ ...settings, duration: value })}
            min={15}
            max={180}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>15 שניות</span>
            <span>3 דקות</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-gray-300">מרווח בין קטעים</Label>
            <span className="text-blue-400 font-medium">{settings.intervalSeconds} שניות</span>
          </div>
          <Slider
            value={[settings.intervalSeconds]}
            onValueChange={([value]) => onSettingsChange({ ...settings, intervalSeconds: value })}
            min={3}
            max={30}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>3 שניות</span>
            <span>30 שניות</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-gray-300">אורך כל קטע</Label>
            <span className="text-blue-400 font-medium">{settings.captureSeconds} שניות</span>
          </div>
          <Slider
            value={[settings.captureSeconds]}
            onValueChange={([value]) => onSettingsChange({ ...settings, captureSeconds: value })}
            min={1}
            max={5}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 שנייה</span>
            <span>5 שניות</span>
          </div>
        </div>
      </div>
    </div>
  )
}
