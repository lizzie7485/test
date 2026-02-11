
import { GoogleGenAI, Type } from "@google/genai";
import { NewsArticle, EvaluationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Fetches a random article with a single optimized API call.
 * Targeted to finish within 10 seconds by disabling thinking and streamlining output.
 */
export const fetchRandomChosunArticle = async (): Promise<NewsArticle> => {
  // Use a targeted search query to find a direct article URL quickly.
  const prompt = `조선일보(chosun.com)의 오늘자 주요 뉴스 기사 하나를 선정해서 내용을 가져와줘.
  반드시 아래 형식을 지켜서 출력해. 다른 설명이나 '생각' 과정은 생략해.
  
  TITLE: [기사 제목]
  URL: [기사 원문 URL]
  CONTENT: [기사 본문 내용 전체]`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      // Disable thinking budget for immediate response generation
      thinkingConfig: { thinkingBudget: 0 },
      temperature: 0.1, // Low temperature for faster, more deterministic output
    },
  });

  const text = response.text || '';
  
  // Regex parsing is much faster than a second AI call.
  const titleMatch = text.match(/TITLE:\s*(.*)/);
  const urlMatch = text.match(/URL:\s*(.*)/);
  const contentMatch = text.match(/CONTENT:\s*([\s\S]*)/);

  if (titleMatch && urlMatch && contentMatch) {
    return {
      title: titleMatch[1].trim(),
      url: urlMatch[1].trim(),
      content: contentMatch[1].trim(),
      source: "조선일보"
    };
  }

  // Fast fallback with JSON mode if regex fails
  const fallbackResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Extract article info from this text in JSON format (title, content, url): ${text}`,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          url: { type: Type.STRING }
        },
        required: ["title", "content", "url"]
      }
    }
  });

  const result = JSON.parse(fallbackResponse.text || '{}');
  return {
    title: result.title || "기사를 찾을 수 없습니다.",
    content: result.content || "본문 내용을 불러오는 데 실패했습니다.",
    url: result.url || "https://www.chosun.com",
    source: "조선일보"
  };
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
    
    위 요약들을 평가하고 사용자의 '문해력 나이'를 추정해줘. (10세~80세 사이)
    결과는 반드시 JSON으로만 응답해.
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
          estimatedAge: { 
            type: Type.NUMBER
          },
          ageComment: {
            type: Type.STRING
          }
        },
        required: ["oneSentenceFeedback", "threeLinesFeedback", "estimatedAge", "ageComment"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};
