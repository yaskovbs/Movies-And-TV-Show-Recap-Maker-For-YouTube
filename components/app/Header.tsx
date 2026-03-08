"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Film, Key, Menu, X, FileText, Shield, HelpCircle, Mic, Settings, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface HeaderProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
}

const menuItems = [
  { path: "/", label: "בית", icon: Film },
  { path: "/voiceover", label: "קריינות אודיו", icon: Mic },
  { path: "/faq", label: "שאלות נפוצות", icon: HelpCircle },
  { path: "/contact", label: "צור קשר", icon: null },
  { path: "/settings", label: "הגדרות", icon: Settings },
  { path: "/terms", label: "תנאי שימוש", icon: FileText },
  { path: "/privacy", label: "מדיניות פרטיות", icon: Shield },
]

export default function Header({ apiKey, onApiKeyChange }: HeaderProps) {
  const [showApiInput, setShowApiInput] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="bg-gray-900 text-white border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:scale-105 transition-transform">
            <Film className="h-8 w-8 text-blue-400 ml-3" />
            <div className="text-right">
              <h1 className="text-xl font-bold">Movies & TV Recaps</h1>
              <p className="text-sm text-gray-400">יוצר סיכומים לרשתות חברתיות</p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.path
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowApiInput(!showApiInput)}
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Key className="h-4 w-4 ml-2" />
              <span className="text-sm">API Key</span>
            </Button>
            
            <a
              href="https://youtube.com/@movies_and_tv_show_recap"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex"
            >
              <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                <Share2 className="h-4 w-4 ml-2" />
                <span className="text-sm">רשתות חברתיות</span>
              </Button>
            </a>

            {/* Mobile Menu Button */}
            <Button
              className="md:hidden"
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* API Key Input */}
        {showApiInput && (
          <div className="pb-4 animate-in slide-in-from-top-2">
            <div className="bg-gray-800 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                מפתח Gemini AI API
              </label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder="הכנס את מפתח ה-API שלך..."
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                dir="ltr"
              />
              <p className="text-xs text-gray-400 mt-1">
                קבל מפתח API בחינם מ-Google AI Studio
              </p>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 animate-in slide-in-from-top-2">
            <div className="bg-gray-800 rounded-lg p-4 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block w-full text-right px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.path
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <a
                href="https://youtube.com/@movies_and_tv_show_recap"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full mt-2 px-3 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Share2 className="h-4 w-4 ml-2" />
                <span className="text-sm">רשתות חברתיות שלנו</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
