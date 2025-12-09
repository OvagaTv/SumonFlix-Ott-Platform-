import { GoogleGenAI, Type } from "@google/genai";
import { MOCK_CONTENT } from '../constants';

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const getGeminiRecommendation = async (userQuery: string, language: 'en' | 'bn', currentContext?: string) => {
  if (!apiKey) {
    console.warn("API Key is missing. Returning fallback response.");
    if (language === 'bn') {
       return "দুঃখিত, এই মুহূর্তে আমি কাজ করছি না (API Key নেই), তবে আমি 'Cyber Chronicles' দেখার পরামর্শ দিচ্ছি!";
    }
    return "I can't access my brain right now (API Key missing), but I recommend checking out 'Cyber Chronicles'!";
  }

  try {
    const model = 'gemini-2.5-flash';
    const contentList = MOCK_CONTENT.map(c => `${c.title} (${c.category}): ${c.description}`).join('\n');
    
    const langInstruction = language === 'bn' 
      ? "You must reply in Bangla (Bengali) language. Use a helpful, friendly, and polite tone." 
      : "You must reply in English language. Use a helpful, friendly, and polite tone.";

    const prompt = `
      You are an intelligent assistant for a streaming service called "sumonflix.net".
      
      ${langInstruction}

      Available Content Library:
      ${contentList}
      
      User Context: ${currentContext ? `User is currently watching: ${currentContext}` : 'Browsing home page'}
      User Query: "${userQuery}"
      
      Task: Recommend content from the library based on the query. If the query is general chat, answer politely as a helpful assistant in the requested language.
      Keep it brief (under 50 words) and exciting.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    if (!response.text) {
        return language === 'bn' 
            ? "আমি বিশেষ কিছু খুঁজে পাইনি, তবে আমাদের ট্রেন্ডিং সেকশনটি ঘুরে দেখতে পারেন!"
            : "I couldn't find anything specifically for that, but take a look at our Trending section!";
    }

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === 'bn' 
        ? "রেকমেন্ডেশন ইঞ্জিনে সংযোগ করতে সমস্যা হচ্ছে। কিছুক্ষণ পর আবার চেষ্টা করুন।"
        : "I'm having trouble connecting to the recommendation engine. Try again in a moment.";
  }
};