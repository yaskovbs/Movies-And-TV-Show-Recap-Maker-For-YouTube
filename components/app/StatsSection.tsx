"use client"

import { useState, useEffect } from "react"
import { BarChart3, Users, Zap, Star, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AppStats {
  recaps_created: number
  total_rating_sum: number
  rating_count: number
  active_users: number
}

export default function StatsSection() {
  const [stats, setStats] = useState<AppStats>({
    recaps_created: 1247,
    total_rating_sum: 478,
    rating_count: 89,
    active_users: 342
  })
  const [loading, setLoading] = useState(false)
  const [userRating, setUserRating] = useState<number>(0)
  const [isRating, setIsRating] = useState(false)
  const [hasRated, setHasRated] = useState<boolean>(false)

  useEffect(() => {
    // Check if user has already rated
    const rated = localStorage.getItem("hasRated") === "true"
    setHasRated(rated)
  }, [])

  const handleRating = async (rating: number) => {
    if (hasRated || isRating) return
    setIsRating(true)
    setUserRating(rating)

    // Simulate rating submission
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setStats(prev => ({
      ...prev,
      total_rating_sum: prev.total_rating_sum + rating,
      rating_count: prev.rating_count + 1
    }))
    
    setHasRated(true)
    localStorage.setItem("hasRated", "true")
    setIsRating(false)
  }

  const calculatedRating = stats.rating_count > 0
    ? (stats.total_rating_sum / stats.rating_count).toFixed(1)
    : "0.0"

  const statItems = [
    {
      icon: BarChart3,
      value: stats.recaps_created.toLocaleString(),
      label: "סיכומים נוצרו",
      color: "text-blue-400"
    },
    {
      icon: Users,
      value: stats.active_users.toLocaleString(),
      label: "משתמשים פעילים",
      color: "text-green-400"
    },
    {
      icon: Zap,
      value: "99.9%",
      label: "זמינות השירות",
      color: "text-yellow-400"
    },
    {
      icon: Star,
      value: `${calculatedRating}/5`,
      label: "דירוג משתמשים",
      color: "text-purple-400"
    }
  ]

  if (loading) {
    return (
      <section className="bg-gray-800 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Loader2 className="h-12 w-12 text-blue-400 animate-spin mx-auto" />
          <p className="text-white mt-4">טוען נתונים...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-gray-800 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            המספרים מדברים בעד עצמם
          </h2>
          <p className="text-gray-400 text-lg">
            ההישגים שלנו עד היום
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {statItems.map((item, index) => (
            <div
              key={index}
              className="bg-gray-900 rounded-lg p-6 text-center border border-gray-700 hover:scale-105 transition-transform cursor-default"
            >
              <item.icon className={cn("h-12 w-12 mx-auto mb-4", item.color)} />
              <div className={cn("text-3xl font-bold mb-2", item.color)}>
                {item.value}
              </div>
              <p className="text-gray-400 font-medium">{item.label}</p>
            </div>
          ))}
        </div>

        {!hasRated && (
          <div className="mt-12 bg-gray-700 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              מה דעתכם על השירות שלנו?
            </h3>
            <p className="text-gray-300 mb-6">
              הדירוג שלכם יעזור לנו להשתפר
            </p>
            
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  onClick={() => handleRating(star)}
                  disabled={isRating}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "transition-colors",
                    star <= userRating 
                      ? "text-yellow-400" 
                      : "text-gray-500 hover:text-yellow-400"
                  )}
                >
                  <Star className={cn("h-8 w-8", star <= userRating && "fill-current")} />
                </Button>
              ))}
            </div>
            {isRating && <Loader2 className="h-6 w-6 text-white animate-spin mx-auto" />}
          </div>
        )}

        {hasRated && (
          <div className="mt-12 bg-green-600/10 border border-green-600/20 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  className={cn(
                    "h-6 w-6",
                    (stats.total_rating_sum / stats.rating_count) >= star
                      ? "text-yellow-400 fill-current" 
                      : "text-gray-500"
                  )} 
                />
              ))}
            </div>
            <p className="text-green-400 font-semibold">
              תודה רבה על הדירוג!
            </p>
            <p className="text-gray-300 text-sm mt-1">
              הדירוג שלכם עוזר לנו לשפר את השירות
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
