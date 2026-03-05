// Content Analyzer Service using Gemini API
import { supabase } from './supabase';

interface ContentAnalysisResult {
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

interface FrameAnalysisResult {
  description: string;
  importance: number; // 1-10
  emotion?: string;
}

class ContentAnalyzer {
  private static instance: ContentAnalyzer;
  private apiKey: string | null = null;
  
  private constructor() {
    // Initialize with any key stored in localStorage
    this.apiKey = localStorage.getItem('gemini_api_key');
  }
  
  public static getInstance(): ContentAnalyzer {
    if (!ContentAnalyzer.instance) {
      ContentAnalyzer.instance = new ContentAnalyzer();
    }
    return ContentAnalyzer.instance;
  }
  
  /**
   * Set the Gemini API key
   */
  public setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('gemini_api_key', key);
  }
  
  /**
   * Check if the service has a valid API key
   */
  public hasValidApiKey(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }
  
  /**
   * Analyze a frame from video
   */
  public async analyzeFrame(frame: Blob): Promise<FrameAnalysisResult> {
    if (!this.hasValidApiKey()) {
      throw new Error('No Gemini API key provided. Please set an API key in the settings.');
    }
    
    try {
      // Convert the image to base64
      const base64Image = await this.blobToBase64(frame);
      
      // Prepare the request to Gemini API
      const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent?key=' + this.apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Analyze this frame from a movie or TV show. Describe what's happening, rate its importance to the story on a scale of 1-10, and identify the emotional tone. Format your response as JSON with properties: description, importance (number), and emotion (string)."
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Image.split('base64,')[1]
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 1024,
            responseMimeType: "text/plain"
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract the text from the response
      const text = data.candidates[0].content.parts[0].text;
      
      // Try to parse as JSON
      try {
        // Check if the text contains a JSON object
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const result = JSON.parse(jsonStr);
          return {
            description: result.description || 'No description provided',
            importance: Number(result.importance) || 5,
            emotion: result.emotion || 'neutral'
          };
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response as JSON:', parseError);
      }
      
      // Fallback: Extract information using regex
      const importanceMatch = text.match(/importance[:\s]*([0-9]+)/i);
      const emotionMatch = text.match(/emotion[:\s]*['"]?([a-zA-Z\s]+)['"]?/i);
      
      return {
        description: text.substring(0, 200) + '...',
        importance: importanceMatch ? Number(importanceMatch[1]) : 5,
        emotion: emotionMatch ? emotionMatch[1].trim() : 'neutral'
      };
    } catch (error) {
      console.error('Error analyzing frame with Gemini:', error);
      throw error;
    }
  }
  
  /**
   * Analyze multiple frames from a video
   */
  public async analyzeVideoFrames(
    videoFile: File, 
    numberOfFrames: number = 5,
    onProgress?: (progress: number) => void
  ): Promise<ContentAnalysisResult> {
    if (!this.hasValidApiKey()) {
      throw new Error('No Gemini API key provided. Please set an API key in the settings.');
    }
    
    try {
      // Extract frames from the video
      const frames = await this.extractFramesFromVideo(videoFile, numberOfFrames);
      
      if (frames.length === 0) {
        throw new Error('Failed to extract frames from the video');
      }
      
      // Analyze each frame
      const frameResults: FrameAnalysisResult[] = [];
      
      for (let i = 0; i < frames.length; i++) {
        const result = await this.analyzeFrame(frames[i].blob);
        frameResults.push(result);
        
        // Report progress
        if (onProgress) {
          onProgress((i + 1) / frames.length * 100);
        }
      }
      
      // Generate a summary from the analyzed frames
      const summary = await this.generateSummaryFromAnalysis(frameResults, videoFile.name);
      
      return {
        summary: summary.summary,
        keyMoments: frameResults.map((result, index) => ({
          time: frames[index].timeOffset,
          description: result.description,
          importance: result.importance,
          emotion: result.emotion
        })),
        genre: summary.genre,
        emotionalTone: summary.emotionalTone,
        suggestedTitle: summary.suggestedTitle,
        suggestedTags: summary.suggestedTags
      };
    } catch (error) {
      console.error('Error analyzing video frames:', error);
      throw error;
    }
  }
  
  /**
   * Generate a coherent summary based on individual frame analyses
   */
  private async generateSummaryFromAnalysis(
    frameResults: FrameAnalysisResult[],
    videoFileName: string
  ): Promise<{
    summary: string;
    genre: string;
    emotionalTone: string;
    suggestedTitle: string;
    suggestedTags: string[];
  }> {
    if (!this.hasValidApiKey()) {
      throw new Error('No Gemini API key provided. Please set an API key in the settings.');
    }
    
    try {
      // Create a summary of all the frame analyses
      const framesText = frameResults.map((frame, index) => 
        `Frame ${index + 1}:\n- Description: ${frame.description}\n- Importance: ${frame.importance}/10\n- Emotion: ${frame.emotion || 'neutral'}`
      ).join('\n\n');
      
      const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=' + this.apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Based on these frame analyses from a video titled "${videoFileName}", create a summary of what appears to be happening in the content. Also, determine the likely genre, emotional tone, suggest a title, and provide relevant tags for social media.

${framesText}

Format your response as JSON with the following properties:
- summary: a concise 3-5 sentence description of the content
- genre: a single word or short phrase (e.g., "action", "comedy", "drama", etc.)
- emotionalTone: the dominant emotional feel
- suggestedTitle: a catchy title for a recap video
- suggestedTags: an array of 5-8 relevant tags for social media`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 1024,
            responseMimeType: "text/plain"
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract the text from the response
      const text = data.candidates[0].content.parts[0].text;
      
      // Try to parse as JSON
      try {
        // Check if the text contains a JSON object
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const result = JSON.parse(jsonStr);
          return {
            summary: result.summary || 'No summary available.',
            genre: result.genre || 'unspecified',
            emotionalTone: result.emotionalTone || 'neutral',
            suggestedTitle: result.suggestedTitle || videoFileName,
            suggestedTags: Array.isArray(result.suggestedTags) ? result.suggestedTags : ['recap', 'video', 'summary']
          };
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini summary response as JSON:', parseError);
      }
      
      // Fallback return
      return {
        summary: 'Unable to generate a proper summary. Check the API key and try again.',
        genre: 'unspecified',
        emotionalTone: 'neutral',
        suggestedTitle: videoFileName,
        suggestedTags: ['recap', 'video', 'summary']
      };
    } catch (error) {
      console.error('Error generating summary from frame analyses:', error);
      throw error;
    }
  }
  
  /**
   * Generate voiceover script from video analysis
   */
  public async generateVoiceoverScript(
    analysis: ContentAnalysisResult,
    duration: number,  // Target duration in seconds
    style: 'formal' | 'casual' | 'dramatic' = 'casual'
  ): Promise<string> {
    if (!this.hasValidApiKey()) {
      throw new Error('No Gemini API key provided. Please set an API key in the settings.');
    }
    
    try {
      const styleDescription = style === 'formal' ? 'formal and informative' :
                             style === 'dramatic' ? 'dramatic and intense' :
                             'casual and conversational';
      
      const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=' + this.apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Create a voiceover script for a ${duration} second recap video based on the following content analysis. The script should be ${styleDescription} in tone.

Content Summary: ${analysis.summary}

Genre: ${analysis.genre}
Emotional Tone: ${analysis.emotionalTone}

Key Moments:
${analysis.keyMoments.map(moment => 
  `- Time: ${moment.time} - ${moment.description} (Importance: ${moment.importance}/10, Emotion: ${moment.emotion})`
).join('\n')}

A good voiceover script should:
1. Have a compelling introduction
2. Cover the key moments in a logical order
3. Maintain viewer interest throughout
4. Have a satisfying conclusion
5. Be timed appropriately for a ${duration} second video (about ${Math.floor(duration / 10)} sentences)`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 1024,
            responseMimeType: "text/plain"
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract the text from the response
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error generating voiceover script:', error);
      throw error;
    }
  }

  /**
   * Save analysis results to supabase for later use
   */
  public async saveAnalysisResults(
    videoId: string,
    analysis: ContentAnalysisResult
  ): Promise<void> {
    try {
      const { error } = await supabase.from('content_analyses').insert({
        video_id: videoId,
        summary: analysis.summary,
        key_moments: analysis.keyMoments,
        genre: analysis.genre,
        emotional_tone: analysis.emotionalTone,
        suggested_title: analysis.suggestedTitle,
        suggested_tags: analysis.suggestedTags
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving analysis results:', error);
      throw error;
    }
  }
  
  /**
   * Extract frames from a video file at regular intervals
   */
  private async extractFramesFromVideo(
    videoFile: File,
    numberOfFrames: number
  ): Promise<{ blob: Blob; timeOffset: number }[]> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const frames: { blob: Blob; timeOffset: number }[] = [];
      
      // Create object URL for the video
      const videoURL = URL.createObjectURL(videoFile);
      
      // Setup video element
      video.src = videoURL;
      video.crossOrigin = 'anonymous';
      
      video.onloadedmetadata = async () => {
        // Get video duration
        const duration = video.duration;
        
        if (isNaN(duration) || !isFinite(duration)) {
          URL.revokeObjectURL(videoURL);
          reject(new Error('Could not determine video duration'));
          return;
        }
        
        // Calculate time interval between frames
        const interval = duration / (numberOfFrames + 1); // +1 to exclude start/end
        
        // Create canvas for frame extraction
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          URL.revokeObjectURL(videoURL);
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Extract frames at calculated intervals
        for (let i = 1; i <= numberOfFrames; i++) {
          const timeOffset = interval * i;
          
          try {
            // Seek to the time offset
            video.currentTime = timeOffset;
            
            // Wait for video to seek to the new time
            await new Promise<void>(seekResolve => {
              const seekHandler = () => {
                video.removeEventListener('seeked', seekHandler);
                seekResolve();
              };
              video.addEventListener('seeked', seekHandler);
            });
            
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Draw the current frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert canvas to blob
            const blob = await new Promise<Blob>((canvasResolve, canvasReject) => {
              canvas.toBlob(blob => {
                if (blob) canvasResolve(blob);
                else canvasReject(new Error('Failed to create blob from canvas'));
              }, 'image/jpeg', 0.85); // Use JPEG format with 85% quality
            });
            
            frames.push({ blob, timeOffset });
          } catch (error) {
            console.error(`Error capturing frame at time ${timeOffset}:`, error);
            // Continue with other frames even if one fails
          }
        }
        
        // Clean up
        URL.revokeObjectURL(videoURL);
        
        resolve(frames);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(videoURL);
        reject(new Error('Error loading video for frame extraction'));
      };
    });
  }
  
  /**
   * Convert a Blob to base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export default ContentAnalyzer.getInstance();