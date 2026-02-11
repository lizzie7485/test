
import { GoogleGenAI, Type } from "@google/genai";
import { NewsArticle, EvaluationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Fetches a random article with high performance.
 * Uses direct JSON mode to minimize parsing time and latency.
 */
export const fetchRandomChosunArticle = async (): Promise<NewsArticle> => {
  const prompt = `조선일보(chosun.com)의 오늘자 최신 뉴스 기사 중 하나를 선정해서 제목, URL, 본문 내용을 가져와줘. 
  반드시 JSON 형식으로만 응답해야 해.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
      temperature: 0.2,
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
      title: result.title || "기사를 찾을 수 없습니다.",
      content: result.content || "본문 내용을 불러오는 데 실패했습니다.",
      url: result.url || "https://www.chosun.com",
      source: "조선일보"
    };
  } catch (e) {
    console.error("JSON Parsing Error", e);
    return {
      title: "오류 발생",
      content: "기사 데이터를 파싱하는 중 오류가 발생했습니다.",
      url: "https://www.chosun.com",
      source: "조선일보"
    };
  }
};

/**
 * Evaluates summaries and estimates literacy age.
 */
export const evaluateSummaries = async (
  article: NewsArticle,
  oneSentence: string,
  threeLines: string
): Promise<EvaluationResult> => {
  const prompt = `
    기사: ${article.title}
    본문: ${article.content}
    사용자 요약1(한문장): ${oneSentence}
    사용자 요약2(3줄): ${threeLines}
    
    위 요약들을 분석해서 문해력 점수와 추정 나이(10~80세)를 JSON으로 알려줘.
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
