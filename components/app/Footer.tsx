"use client"

import Link from "next/link"
import { Film, Youtube, Instagram, Facebook } from "lucide-react"

const navLinks = [
  { path: "/", label: "בית" },
  { path: "/contact", label: "צור קשר" },
  { path: "/faq", label: "שאלות נפוצות" },
]

const legalLinks = [
  { path: "/terms", label: "תנאי שימוש" },
  { path: "/privacy", label: "מדיניות פרטיות" },
]

export default function Footer() {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and About */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <Film className="h-8 w-8 text-blue-400 ml-3" />
              <div className="text-right">
                <h2 className="text-xl font-bold">Movies & TV Recaps</h2>
                <p className="text-sm text-gray-400">יוצר סיכומים לרשתות חברתיות</p>
              </div>
            </Link>
            <p className="text-gray-400 text-sm max-w-xs">
              הפלטפורמה המובילה ליצירת סיכומי וידאו חכמים באמצעות טכנולוגיית AI מתקדמת.
            </p>
          </div>

          {/* Links */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">ניווט</h3>
              <ul className="mt-4 space-y-2">
                {navLinks.map(link => (
                  <li key={link.path}>
                    <Link
                      href={link.path}
                      className="text-base text-gray-300 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">משפטי</h3>
              <ul className="mt-4 space-y-2">
                {legalLinks.map(link => (
                  <li key={link.path}>
                    <Link
                      href={link.path}
                      className="text-base text-gray-300 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">צור קשר</h3>
              <ul className="mt-4 space-y-2 text-base text-gray-300">
                <li>yaskovbs2502@gmail.com</li>
                <li>050-818-1948</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">עקבו אחרינו</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href="https://youtube.com/@movies_and_tv_show_recap"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-gray-300 hover:text-white transition-colors flex items-center"
                  >
                    <Youtube className="h-5 w-5 ml-2" />
                    <span>יוטיוב</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-gray-300 hover:text-white transition-colors flex items-center"
                  >
                    <Instagram className="h-5 w-5 ml-2" />
                    <span>אינסטגרם</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-gray-300 hover:text-white transition-colors flex items-center"
                  >
                    <Facebook className="h-5 w-5 ml-2" />
                    <span>פייסבוק</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-base text-gray-400 order-2 md:order-1 mt-4 md:mt-0">
            &copy; {new Date().getFullYear()} Movies & TV Recaps Maker For Your Social Media Network. כל הזכויות שמורות.
          </p>
          <div className="flex gap-4 order-1 md:order-2">
            <a 
              href="https://youtube.com/@movies_and_tv_show_recap"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="ערוץ היוטיוב שלנו"
            >
              <Youtube className="h-6 w-6" />
            </a>
            <a 
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="אינסטגרם"
            >
              <Instagram className="h-6 w-6" />
            </a>
            <a 
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="פייסבוק"
            >
              <Facebook className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
