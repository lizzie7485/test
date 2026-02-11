
import React, { useState, useCallback, useEffect } from 'react';
import { TrainingStep, NewsArticle, EvaluationResult } from './types';
import { fetchRandomChosunArticle, evaluateSummaries } from './services/geminiService';

const BRAND_COLOR = '#e9460a';
const EXAMPLE_COLOR = '#7cc6ff';

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const App: React.FC = () => {
  const [step, setStep] = useState<TrainingStep>(TrainingStep.INTRO);
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [oneSentence, setOneSentence] = useState('');
  const [threeLines, setThreeLines] = useState('');
  const [feedback, setFeedback] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    let timer: number;
    if (step === TrainingStep.FETCHING && countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  const startNewSession = useCallback(async () => {
    setArticle(null);
    setOneSentence('');
    setThreeLines('');
    setFeedback(null);
    setCountdown(10);
    setError(null);
    setStep(TrainingStep.FETCHING);
    setLoading(true);

    try {
      const data = await fetchRandomChosunArticle();
      setArticle(data);
      setStep(TrainingStep.READING);
    } catch (err: any) {
      setError("기사를 가져오는 중에 오류가 발생했습니다. 다시 시도해 주세요.");
      setStep(TrainingStep.INTRO);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEvaluate = async () => {
    if (!article) return;
    setLoading(true);
    try {
      const result = await evaluateSummaries(article, oneSentence, threeLines);
      setFeedback(result);
      setStep(TrainingStep.FEEDBACK);
    } catch (err: any) {
      setError("평가 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    if (step === TrainingStep.INTRO || step === TrainingStep.FETCHING) return null;
    const steps = [
      { id: TrainingStep.READING, label: "기사 읽기" },
      { id: TrainingStep.SUMMARY_ONE, label: "한 문장 요약" },
      { id: TrainingStep.SUMMARY_THREE, label: "3줄 요약" },
      { id: TrainingStep.FEEDBACK, label: "훈련 결과" }
    ];
    return (
      <div className="flex items-center justify-between mb-8 max-w-xl mx-auto w-full px-4">
        {steps.map((s, idx) => {
          const isActive = step === s.id;
          const isDone = steps.findIndex(x => x.id === step) > idx;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center flex-1">
                <div 
                  style={{ backgroundColor: isActive || isDone ? BRAND_COLOR : '#e2e8f0' }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 text-white ${isActive ? 'shadow-lg scale-110' : ''}`}>
                  {isDone ? '✓' : idx + 1}
                </div>
                <span style={{ color: isActive ? BRAND_COLOR : '#94a3b8' }} className="text-xs mt-2 font-bold">{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div style={{ backgroundColor: isDone ? BRAND_COLOR : '#e2e8f0' }} className="h-1 flex-1 mx-2 rounded opacity-30" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const isOneSentenceValid = oneSentence.trim().length >= 10 && oneSentence.includes('.');
  const isThreeLinesValid = threeLines.trim().length >= 20 && threeLines.includes('.');

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span style={{ color: BRAND_COLOR }}>News</span> 당신의 문해력은 몇 살일까요?
          </h1>
          {step !== TrainingStep.INTRO && step !== TrainingStep.FETCHING && (
            <button onClick={startNewSession} style={{ color: BRAND_COLOR, backgroundColor: `${BRAND_COLOR}15` }} className="text-sm px-4 py-2 rounded-lg font-semibold hover:brightness-95">
              다른 기사 가져오기
            </button>
          )}
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 mt-8">
        {step === TrainingStep.INTRO && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fadeIn py-10">
            <div style={{ backgroundColor: `${BRAND_COLOR}10` }} className="p-4 rounded-3xl mb-8">
              <div style={{ backgroundColor: BRAND_COLOR }} className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-4xl shadow-xl shadow-orange-200">📰</div>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">문해력은 <span style={{ color: BRAND_COLOR }}>근육</span>입니다.<br/>매일 하나씩 단련하세요.</h2>
            <p className="text-xl text-gray-500 mb-12 max-w-2xl leading-relaxed">뉴스를 읽고 핵심을 꿰뚫는 훈련을 시작하세요.<br/>아이스크림 AI 코치가 실력을 정밀 분석해 드립니다.</p>
            <button onClick={startNewSession} style={{ backgroundColor: BRAND_COLOR }} className="px-16 py-6 text-white rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all">훈련 시작하기</button>
          </div>
        )}
        {renderStepIndicator()}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
            {step === TrainingStep.FETCHING ? (
              <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                <svg viewBox="0 0 160 160" className="absolute w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r={RADIUS} stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                  <circle cx="80" cy="80" r={RADIUS} stroke={BRAND_COLOR} strokeWidth="12" fill="transparent" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE - (CIRCUMFERENCE * countdown) / 10} strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-6xl font-black text-gray-800">{countdown}</span>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">sec</span>
                </div>
              </div>
            ) : <div style={{ borderTopColor: 'transparent', borderColor: BRAND_COLOR }} className="w-16 h-16 border-4 rounded-full animate-spin mb-8"></div>}
            <h3 className="text-2xl font-bold text-gray-800 mb-3">{step === TrainingStep.FETCHING ? '오늘의 뉴스를 선별 중입니다' : '분석 중입니다'}</h3>
          </div>
        )}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-2xl mb-6 text-center"><p className="mb-4">{error}</p><button onClick={startNewSession} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold">다시 시도</button></div>}
        {!loading && article && step === TrainingStep.READING && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 animate-fadeIn">
            <h2 className="text-3xl font-bold mb-8 serif-text border-b pb-8">{article.title}</h2>
            <div className="prose prose-lg prose-gray max-w-none text-gray-800 serif-text whitespace-pre-wrap mb-10">{article.content}</div>
            <button onClick={() => setStep(TrainingStep.SUMMARY_ONE)} style={{ backgroundColor: BRAND_COLOR }} className="w-full py-4 text-white rounded-2xl font-bold shadow-lg">요약 시작하기</button>
          </div>
        )}
        {!loading && step === TrainingStep.SUMMARY_ONE && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 animate-fadeIn">
            <h3 className="text-2xl font-bold mb-4">1. 한 문장 요약</h3>
            <textarea value={oneSentence} onChange={(e) => setOneSentence(e.target.value)} placeholder="기사의 핵심을 한 문장으로..." className="w-full h-40 p-6 rounded-2xl border-2 focus:ring-4 focus:ring-orange-100 outline-none text-xl transition-all" />
            <div className="flex justify-end mt-8"><button disabled={!isOneSentenceValid} onClick={() => setStep(TrainingStep.SUMMARY_THREE)} style={{ backgroundColor: isOneSentenceValid ? BRAND_COLOR : '#e2e8f0' }} className="px-12 py-4 rounded-2xl font-bold text-white shadow-xl transition-all">다음 단계</button></div>
          </div>
        )}
        {!loading && step === TrainingStep.SUMMARY_THREE && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 animate-fadeIn">
            <h3 className="text-2xl font-bold mb-4">2. 3줄 요약</h3>
            <textarea value={threeLines} onChange={(e) => setThreeLines(e.target.value)} placeholder="1. 배경\n2. 핵심\n3. 전망" className="w-full h-56 p-6 rounded-2xl border-2 focus:ring-4 focus:ring-orange-100 outline-none text-xl transition-all" />
            <div className="flex justify-end mt-8"><button disabled={!isThreeLinesValid} onClick={handleEvaluate} style={{ backgroundColor: isThreeLinesValid ? BRAND_COLOR : '#e2e8f0' }} className="px-12 py-4 rounded-2xl font-bold text-white shadow-xl transition-all">평가 받기</button></div>
          </div>
        )}
        {step === TrainingStep.FEEDBACK && feedback && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "한 문장 평가", data: feedback.oneSentenceFeedback, input: oneSentence },
                { title: "3줄 요약 평가", data: feedback.threeLinesFeedback, input: threeLines }
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-lg">{item.title}</h4>
                    <span style={{ color: BRAND_COLOR }} className="text-3xl font-black">{item.data.score}점</span>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl text-sm italic">"{item.input}"</div>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.data.comments}</p>
                    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50 text-blue-900 text-sm"><strong>모범 예시:</strong><br/>{item.data.suggestedSummary}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-900 rounded-[3rem] p-10 text-center shadow-2xl">
              <h3 className="text-gray-400 font-bold text-sm tracking-widest mb-4">AI 문해력 정밀 분석</h3>
              <p className="text-white text-xl mb-6">당신의 문해력 나이는...</p>
              <div className="flex items-center justify-center gap-2 mb-8">
                <span className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">{feedback.estimatedAge}</span>
                <span className="text-4xl font-bold text-white mt-8">세</span>
              </div>
              <p className="text-orange-100 font-semibold italic text-lg leading-relaxed">"{feedback.ageComment}"</p>
            </div>
            <div className="flex justify-center pb-20"><button onClick={startNewSession} style={{ backgroundColor: BRAND_COLOR }} className="px-12 py-5 text-white rounded-2xl font-bold shadow-2xl hover:scale-105 transition-all">다른 기사 도전</button></div>
          </div>
        )}
      </main>
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 py-4">
        <div className="max-w-4xl mx-auto px-4 flex justify-between text-xs text-gray-400 font-bold">
          <p>© News Comprehension Academy</p>
          <p style={{ color: BRAND_COLOR }}>조선일보 채널</p>
        </div>
      </footer>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
