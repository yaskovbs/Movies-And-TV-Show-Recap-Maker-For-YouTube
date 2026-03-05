export interface VideoFile {
  id: string
  name: string
  size: number
  type: string
  file: File
}

export interface RecapSettings {
  // הגדרות בסיסיות
  duration: number // בשניות
  intervalSeconds: number // כל כמה שניות לחתוך
  captureSeconds: number // כמה שניות לקחת בכל פעם
  script: string
  apiKey: string
  
  // הגדרות מתקדמות
  movieTitle?: string // כותרת הסרט/סדרה
  genre?: string // ז'אנר
  
  // חיפוש באינטרנט
  enableWebSearch?: boolean // הפעלת חיפוש באינטרנט
  googleSearchApiKey?: string // Google Search API Key
  searchEngineId?: string // Search Engine ID (CX)
  
  // למידה מיוטיוב
  enableYoutubeLearning?: boolean // הפעלת למידה מיוטיוב
  youtubeApiKey?: string // YouTube Data API v3 Key
  youtubeChannelLink?: string // קישור לערוץ יוטיוב ללמידה
  
  // למידה מתמשכת
  enableContinuousLearning?: boolean // הפעלת למידה מתמשכת
}

export interface ProcessingStatus {
  stage: 'loading_engine' | 'analyzing_video' | 'extracting_frames' | 'generating_description' | 'cutting_video' | 'generating_script' | 'generating_audio' | 'saving' | 'completed' | 'error'
  progress: number
  message: string
  output?: RecapOutput
}

export interface ContentAnalysis {
  summary: string;
  keyMoments: {
    time: number;
    description: string;
    importance: number; // 1-10
    emotion?: string;
  }[];
  genre: string;
  emotionalTone: string;
  suggestedTitle: string;
  suggestedTags: string[];
}

export interface Stats {
  recapsCreated: number
  activeUsers: number
  uptime: number
  rating: number
}

export interface FAQ {
  question: string
  answer: string
}

export interface RecapOutput {
  videoUrl: string;
  script: string;
}

export interface SavedRecap {
  id: string;
  created_at: string;
  script: string;
  video_path: string;
  description: string | null;
  visitor_id: string | null;
}
