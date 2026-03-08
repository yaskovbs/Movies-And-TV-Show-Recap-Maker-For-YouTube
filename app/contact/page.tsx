"use client"

import { useState } from "react"
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from "lucide-react"
import Header from "@/components/app/Header"
import Footer from "@/components/app/Footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const contactInfo = [
  {
    icon: Mail,
    title: "אימייל",
    content: "yaskovbs2502@gmail.com",
    description: "שלחו לנו אימייל ונחזור אליכם תוך 24 שעות"
  },
  {
    icon: Phone,
    title: "טלפון",
    content: "050-818-1948",
    description: "זמינים בימי א-ה, 9:00-18:00"
  },
  {
    icon: MapPin,
    title: "כתובת",
    content: "רחוב רש\"י, אופקים",
    description: "המשרדים שלנו"
  }
]

const workingHours = [
  { day: "ימי א-ה", hours: "9:00-18:00" },
  { day: "שישי", hours: "9:00-14:00" },
  { day: "שבת", hours: "סגור" }
]

export default function ContactPage() {
  const [apiKey, setApiKey] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setSubmitStatus({ type: "success", message: "ההודעה נשלחה בהצלחה! נחזור אליך תוך 24 שעות." })
    setFormData({ name: "", email: "", subject: "", message: "" })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header apiKey={apiKey} onApiKeyChange={setApiKey} />
      
      <main className="flex-grow py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              פרטי קשר
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              נשמח לעמוד לרשותכם ולענות על כל שאלה. צרו קשר איתנו והצוות שלנו יחזור אליכם במהירות
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-white mb-8">צרו קשר איתנו</h2>
              
              <div className="space-y-6 mb-8">
                {contactInfo.map((info, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:scale-[1.02] hover:border-blue-500 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-600 p-3 rounded-lg">
                        <info.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{info.title}</h3>
                        <p className="text-blue-400 font-medium mb-1">{info.content}</p>
                        <p className="text-gray-400 text-sm">{info.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center mb-4">
                  <Clock className="h-6 w-6 text-blue-400 ml-3" />
                  <h3 className="text-xl font-semibold text-white">שעות תמיכה</h3>
                </div>
                <div className="space-y-2">
                  {workingHours.map((time, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-300">{time.day}:</span>
                      <span className="text-blue-400 font-medium">{time.hours}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-600/10 rounded-lg border border-blue-600/20">
                  <p className="text-blue-400 text-sm font-medium">
                    זמן תגובה ממוצע: פחות מ-2 שעות בימי עבודה
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-6">שלחו לנו הודעה</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-300 mb-2 block">שם מלא *</Label>
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 disabled:opacity-50"
                        placeholder="הכניסו את שמכם המלא"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-300 mb-2 block">אימייל *</Label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 disabled:opacity-50"
                        placeholder="your@email.com"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 block">נושא *</Label>
                    <Input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 disabled:opacity-50"
                      placeholder="נושא ההודעה"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 block">הודעה *</Label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      rows={6}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 resize-none disabled:opacity-50"
                      placeholder="כתבו כאן את ההודעה שלכם..."
                    />
                  </div>

                  {submitStatus && (
                    <div className={`p-4 rounded-lg text-center ${
                      submitStatus.type === "success" ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"
                    }`}>
                      {submitStatus.message}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5 ml-2" />
                    )}
                    {isSubmitting ? "שולח..." : "שלח הודעה"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
