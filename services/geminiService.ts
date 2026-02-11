
import { GoogleGenAI, Type } from "@google/genai";
import { NewsArticle, EvaluationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Fetches a high-quality article for training.
 * Optimized for speed using Google Search grounding + Direct JSON Schema.
 */
export const fetchRandomChosunArticle = async (): Promise<NewsArticle> => {
  // Ultra-optimized prompt to get the full body in one go
  const prompt = `Search for a recent major news article from chosun.com today.
  Provide the result strictly in JSON with title, full article content, and original URL. 
  The content must be the actual news body (at least 3-4 paragraphs). 
  Language: Korean.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for max speed
      temperature: 0.1,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          url: { type: Type.STRING }
        },
        required: ["title", "content", "url"]
      }
    },
  });

  try {
    const result = JSON.parse(response.text || '{}');
    return {
      title: result.title || "기사를 가져올 수 없습니다.",
      content: result.content || "실시간 검색 결과를 가져오는 데 실패했습니다. 다시 시도해 주세요.",
      url: result.url || "https://www.chosun.com",
      source: "조선일보"
    };
  } catch (e) {
    console.error("Fast Fetch Error", e);
    throw new Error("Article data parsing failed.");
  }
};

/**
 * Evaluates summaries and estimates literacy age.
 * Optimized for logic and speed.
 */
export const evaluateSummaries = async (
  article: NewsArticle,
  oneSentence: string,
  threeLines: string
): Promise<EvaluationResult> => {
  const prompt = `
    Article Title: ${article.title}
    Article Content: ${article.content}
    User Summary 1 (1-Sentence): ${oneSentence}
    User Summary 2 (3-Lines): ${threeLines}
    
    Task: Evaluate the summaries above for accuracy, clarity, and depth.
    1. Score each (0-100).
    2. Provide coaching comments in Korean.
    3. Suggest a perfect professional summary in Korean.
    4. Estimate the user's literacy age based on their writing style (10 to 80).
    Return strictly as JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          oneSentenceFeedback: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              comments: { type: Type.STRING },
              suggestedSummary: { type: Type.STRING }
            }
          },
          threeLinesFeedback: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              comments: { type: Type.STRING },
              suggestedSummary: { type: Type.STRING }
            }
          },
          estimatedAge: { type: Type.NUMBER },
          ageComment: { type: Type.STRING }
        },
        required: ["oneSentenceFeedback", "threeLinesFeedback", "estimatedAge", "ageComment"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};
