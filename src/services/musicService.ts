import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface MusicTrack {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  cover: string;
  duration?: string;
}

export const musicService = {
  async searchMusic(query: string): Promise<MusicTrack[]> {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY missing, using fallback results.");
      return [];
    }

    const prompt = `Search for the song or artist: "${query}". 
    Return a JSON array of the top 5 most relevant YouTube music videos.
    Format each object as:
    {
      "videoId": "string (the YouTube video ID)",
      "title": "string (the song title)",
      "artist": "string (the artist name)",
      "thumbnail": "string (https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg)"
    }
    Only return the JSON array.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const text = response.text || "[]";
      const cleanJson = text.replace(/```json|```/g, "").trim();
      const data = JSON.parse(cleanJson);
      
      return data.map((item: any) => ({
        id: item.videoId,
        videoId: item.videoId,
        title: item.title,
        artist: item.artist,
        cover: item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`
      }));
    } catch (error) {
      console.error("Music search failed:", error);
      return [];
    }
  }
};
