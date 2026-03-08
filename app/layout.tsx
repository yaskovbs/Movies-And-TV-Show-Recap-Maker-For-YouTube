import type { Metadata, Viewport } from "next"
import { Rubik } from "next/font/google"
import "./globals.css"

const rubik = Rubik({ 
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
})

export const metadata: Metadata = {
  title: "Movies And TV Shows Recaps Maker For Your Social Media Network",
  description: "הפלטפורמה המתקדמת ביותר ליצירת סיכומי וידאו מקצועיים לסרטים וסדרות באמצעות בינה מלאכותית של Google Gemini",
}

export const viewport: Viewport = {
  themeColor: "#1f2937",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${rubik.variable} font-sans min-h-screen bg-gray-900 flex flex-col antialiased`}>
        {children}
      </body>
    </html>
  )
}
