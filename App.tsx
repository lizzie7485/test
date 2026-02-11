
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

  // Smooth countdown logic for fetching state
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
      setError("실시간 뉴스를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.");
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
      setError("AI 분석 중 오류가 발생했습니다. 다시 시도해 주세요.");
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
      <div className="flex items-center justify-between mb-10 max-w-xl mx-auto w-full px-4">
        {steps.map((s, idx) => {
          const isActive = step === s.id;
          const isDone = steps.findIndex(x => x.id === step) > idx;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center flex-1">
                <div 
                  style={{ backgroundColor: isActive || isDone ? BRAND_COLOR : '#f1f5f9' }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${isActive || isDone ? 'text-white shadow-md scale-105' : 'text-slate-400'}`}>
                  {isDone ? '✓' : idx + 1}
                </div>
                <span style={{ color: isActive ? BRAND_COLOR : '#94a3b8' }} className="text-[10px] md:text-xs mt-2 font-bold whitespace-nowrap">{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div style={{ backgroundColor: isDone ? BRAND_COLOR : '#f1f5f9' }} className="h-0.5 flex-1 mx-2 rounded-full opacity-50" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const isOneSentenceValid = oneSentence.trim().length >= 10 && (oneSentence.includes('.') || oneSentence.includes('?'));
  const isThreeLinesValid = threeLines.trim().length >= 20 && (threeLines.includes('.') || threeLines.includes('?'));

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-100 selection:text-orange-900 pb-20">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span style={{ color: BRAND_COLOR }}>News</span> 문해력 측정기
          </h1>
          {step !== TrainingStep.INTRO && step !== TrainingStep.FETCHING && (
            <button 
              onClick={startNewSession} 
              style={{ color: BRAND_COLOR }} 
              className="text-sm px-4 py-2 rounded-xl font-bold hover:bg-orange-50 transition-colors">
              새로운 기사
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        {step === TrainingStep.INTRO && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fadeIn py-10">
            <div style={{ backgroundColor: `${BRAND_COLOR}10` }} className="p-6 rounded-3xl mb-8">
              <div style={{ backgroundColor: BRAND_COLOR }} className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-4xl shadow-xl shadow-orange-200 animate-bounce">📰</div>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">문해력은<br/><span style={{ color: BRAND_COLOR }}>뇌의 근육</span>입니다.</h2>
            <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl leading-relaxed">매일 하나의 최신 뉴스를 정밀하게 요약하며<br/>당신의 사고 수준을 업그레이드 하세요.</p>
            <button 
              onClick={startNewSession} 
              style={{ backgroundColor: BRAND_COLOR }} 
              className="px-16 py-6 text-white rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all shadow-orange-200">
              지금 바로 시작
            </button>
          </div>
        )}

        {renderStepIndicator()}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
            {step === TrainingStep.FETCHING ? (
              <div className="relative w-48 h-48 mb-10 flex items-center justify-center">
                <svg viewBox="0 0 160 160" className="absolute w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r={RADIUS} stroke="#e2e8f0" strokeWidth="12" fill="transparent" />
                  <circle cx="80" cy="80" r={RADIUS} stroke={BRAND_COLOR} strokeWidth="12" fill="transparent" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE - (CIRCUMFERENCE * countdown) / 10} strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-6xl font-black text-slate-800">{countdown}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Ready</span>
                </div>
              </div>
            ) : <div style={{ borderTopColor: 'transparent', borderColor: BRAND_COLOR }} className="w-16 h-16 border-4 rounded-full animate-spin mb-8"></div>}
            
            <div className="animate-softSway">
              <h3 className="text-2xl font-bold text-slate-800 mb-3">
                {step === TrainingStep.FETCHING ? '오늘의 핫한 뉴스를 찾는 중...' : 'AI가 요약 내용을 분석 중...'}
              </h3>
              <p className="text-slate-400 font-medium">잠시만 기다려주세요. 최적의 훈련 데이터를 구성하고 있습니다.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-8 py-6 rounded-3xl text-center shadow-sm">
            <p className="mb-6 font-bold">{error}</p>
            <button onClick={startNewSession} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100">재시도</button>
          </div>
        )}

        {!loading && article && step === TrainingStep.READING && (
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-14 animate-fadeIn overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-orange-50 text-orange-600 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">Chosun Online</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-10 serif-text leading-tight text-slate-900 border-b border-slate-50 pb-10">{article.title}</h2>
            <div className="prose prose-lg prose-slate max-w-none text-slate-700 serif-text whitespace-pre-wrap mb-12 leading-[1.8]">{article.content}</div>
            <div className="bg-slate-50 -mx-14 -mb-14 p-10 flex justify-center border-t border-slate-100">
              <button onClick={() => setStep(TrainingStep.SUMMARY_ONE)} style={{ backgroundColor: BRAND_COLOR }} className="px-14 py-5 text-white rounded-2xl font-black text-xl shadow-xl shadow-orange-200 hover:scale-105 active:scale-95 transition-all">훈련 1단계: 한 문장 요약</button>
            </div>
          </div>
        )}

        {!loading && step === TrainingStep.SUMMARY_ONE && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 md:p-14 animate-fadeIn">
            <div className="flex items-center gap-4 mb-8">
              <span className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">01</span>
              <h3 className="text-2xl font-bold text-slate-800">핵심을 관통하는 한 문장</h3>
            </div>
            <p className="text-slate-500 mb-8 text-lg">기사의 본질을 단 하나의 문장으로 압축해 보세요. 수식어보다는 팩트 중심의 구조가 좋습니다.</p>
            <textarea 
              value={oneSentence} 
              onChange={(e) => setOneSentence(e.target.value)} 
              placeholder="예: 정부가 내수 경제 활성화를 위한 새로운 금융 지원 정책을 발표했습니다." 
              className="w-full h-48 p-8 rounded-3xl border-2 border-slate-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 focus:bg-orange-50/20 outline-none text-xl transition-all resize-none" />
            <div className="flex justify-between items-center mt-10">
              <span className="text-sm font-bold text-slate-300 italic">* 마침표(.)를 찍으면 활성화됩니다.</span>
              <button disabled={!isOneSentenceValid} onClick={() => setStep(TrainingStep.SUMMARY_THREE)} style={{ backgroundColor: isOneSentenceValid ? BRAND_COLOR : '#f1f5f9' }} className={`px-12 py-5 rounded-2xl font-black text-lg transition-all ${isOneSentenceValid ? 'text-white shadow-xl shadow-orange-200 hover:scale-105' : 'text-slate-300'}`}>다음: 3줄 요약</button>
            </div>
          </div>
        )}

        {!loading && step === TrainingStep.SUMMARY_THREE && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 md:p-14 animate-fadeIn">
             <div className="flex items-center gap-4 mb-8">
              <span className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">02</span>
              <h3 className="text-2xl font-bold text-slate-800">논리적인 3줄 요약</h3>
            </div>
            <p className="text-slate-500 mb-8 text-lg">배경, 사건, 전망의 구조로 나누어 총 3개의 문장을 작성해 보세요.</p>
            <textarea 
              value={threeLines} 
              onChange={(e) => setThreeLines(e.target.value)} 
              placeholder="1. 배경: ...\n2. 핵심: ...\n3. 결론: ..." 
              className="w-full h-64 p-8 rounded-3xl border-2 border-slate-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 focus:bg-orange-50/20 outline-none text-xl transition-all resize-none" />
            <div className="flex justify-between items-center mt-10">
              <button onClick={() => setStep(TrainingStep.SUMMARY_ONE)} className="font-bold text-slate-400 hover:text-slate-600 transition-colors">이전 단계로</button>
              <button disabled={!isThreeLinesValid} onClick={handleEvaluate} style={{ backgroundColor: isThreeLinesValid ? BRAND_COLOR : '#f1f5f9' }} className={`px-12 py-5 rounded-2xl font-black text-lg transition-all ${isThreeLinesValid ? 'text-white shadow-xl shadow-orange-200 hover:scale-105' : 'text-slate-300'}`}>AI 코칭 결과 보기</button>
            </div>
          </div>
        )}

        {step === TrainingStep.FEEDBACK && feedback && (
          <div className="space-y-10 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: "한 문장 요약 분석", data: feedback.oneSentenceFeedback, input: oneSentence, color: '#e9460a' },
                { title: "3줄 요약 분석", data: feedback.threeLinesFeedback, input: threeLines, color: '#0ea5e9' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <h4 className="font-black text-xl text-slate-800">{item.title}</h4>
                    <span style={{ color: item.color }} className="text-4xl font-black">{item.data.score}<span className="text-sm ml-1">점</span></span>
                  </div>
                  <div className="space-y-6 flex-1">
                    <div className="p-5 bg-slate-50 rounded-2xl text-slate-600 text-sm italic font-medium">"{item.input}"</div>
                    <div className="p-6 rounded-2xl bg-slate-900 text-white text-sm leading-relaxed relative">
                      <span className="absolute -top-3 left-6 px-3 py-1 bg-orange-500 text-[10px] font-black rounded-full uppercase">Coaching</span>
                      {item.data.comments}
                    </div>
                    <div className="p-6 rounded-2xl border-2 border-dashed border-slate-100 text-slate-800 text-sm font-bold bg-white">
                      <div className="text-orange-500 text-[10px] mb-2 font-black uppercase tracking-widest">Better Alternative</div>
                      {item.data.suggestedSummary}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-[3.5rem] p-12 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <h3 className="text-slate-500 font-black text-xs tracking-[0.3em] uppercase mb-6 relative z-10">Intelligence Report</h3>
              <p className="text-white text-2xl font-bold mb-8 relative z-10">현재 당신의 문해력 환산 나이는</p>
              <div className="flex items-center justify-center gap-3 mb-10 relative z-10">
                <span className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-red-600 drop-shadow-2xl">{feedback.estimatedAge}</span>
                <span className="text-4xl font-black text-white mt-12 italic">AGE</span>
              </div>
              <div className="max-w-xl mx-auto py-6 px-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 relative z-10">
                <p className="text-orange-100 font-bold italic text-xl leading-relaxed">"{feedback.ageComment}"</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 pb-20">
              <h4 className="text-slate-800 font-black text-2xl">훌륭한 훈련이었습니다!</h4>
              <button onClick={startNewSession} style={{ backgroundColor: BRAND_COLOR }} className="px-20 py-6 text-white rounded-3xl font-black text-xl shadow-2xl shadow-orange-200 hover:scale-105 active:scale-95 transition-all">다음 기사 도전하기</button>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 py-4 z-50">
        <div className="max-w-4xl mx-auto px-4 flex justify-between text-[10px] text-slate-400 font-black tracking-widest uppercase">
          <p>© Comprehension Academy</p>
          <div className="flex gap-4">
            <span style={{ color: BRAND_COLOR }}>Chosun Data</span>
            <span>Gemini 3.0 Pro</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(30px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes softSway {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-3px) rotate(-0.5deg); }
          75% { transform: translateX(3px) rotate(0.5deg); }
        }
        .animate-fadeIn { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-softSway { animation: softSway 2s ease-in-out infinite; }
        .serif-text { font-family: 'Noto Serif KR', serif; }
      `}</style>
    </div>
  );
};

export default App;
