
export interface NewsArticle {
  title: string;
  content: string;
  url: string;
  source: string;
}

export interface SummaryFeedback {
  score: number;
  comments: string;
  suggestedSummary: string;
}

export interface EvaluationResult {
  oneSentenceFeedback: SummaryFeedback;
  threeLinesFeedback: SummaryFeedback;
  estimatedAge: number;
  ageComment: string;
}

export enum TrainingStep {
  INTRO = 'INTRO',
  FETCHING = 'FETCHING',
  READING = 'READING',
  SUMMARY_ONE = 'SUMMARY_ONE',
  SUMMARY_THREE = 'SUMMARY_THREE',
  FEEDBACK = 'FEEDBACK'
}
