
import React, { useState, useCallback, useEffect } from 'react';
import { TrainingStep, NewsArticle, EvaluationResult } from './types';
import { fetchRandomChosunArticle, evaluateSummaries } from './services/geminiService';

const BRAND_COLOR = '#e9460a';
const EXAMPLE_COLOR = '#7cc6ff';

// Precise circumference for r=70: 2 * Math.PI * 70 = 439.82297...
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

  // Countdown timer logic for fetching step
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
    // 1. Reset all relevant states for a fresh start
    setArticle(null);
    setOneSentence('');
    setThreeLines('');
    setFeedback(null);
    setCountdown(10);
    setError(null);
    
    // 2. Switch to Fetching step immediately
    setStep(TrainingStep.FETCHING);
    setLoading(true);

    try {
      const data = await fetchRandomChosunArticle();
      setArticle(data);
      setStep(TrainingStep.READING);
    } catch (err: any) {
      setError("네이버 뉴스에서 기사를 가져오는 중에 오류가 발생했습니다. 다시 시도해 주세요.");
      setStep(TrainingStep.INTRO);
      console.error(err);
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
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 text-white ${
                  isActive ? 'shadow-lg scale-110' : ''
                }`}>
                  {isDone ? '✓' : idx + 1}
                </div>
                <span 
                  style={{ color: isActive ? BRAND_COLOR : '#94a3b8' }}
                  className={`text-xs mt-2 font-bold transition-colors`}>
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div 
                  style={{ backgroundColor: steps.findIndex(x => x.id === step) > idx ? BRAND_COLOR : '#e2e8f0' }}
                  className={`h-1 flex-1 mx-2 rounded opacity-30`} />
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
      {/* Navigation / Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span style={{ color: BRAND_COLOR }}>News</span> 당신의 문해력은 몇 살일까요?
          </h1>
          {step !== TrainingStep.INTRO && step !== TrainingStep.FETCHING && (
            <button 
              onClick={() => {
                if (confirm('현재 진행 상황을 초기화하고 새로운 기사를 가져올까요?')) {
                  startNewSession();
                }
              }}
              style={{ color: BRAND_COLOR, backgroundColor: `${BRAND_COLOR}15` }}
              className="text-sm px-4 py-2 rounded-lg font-semibold transition-colors hover:brightness-95"
            >
              다른 기사 가져오기
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        {/* Step: Intro */}
        {step === TrainingStep.INTRO && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fadeIn py-10">
            <div 
              style={{ backgroundColor: `${BRAND_COLOR}10` }}
              className="p-4 rounded-3xl mb-8"
            >
              <div 
                style={{ backgroundColor: BRAND_COLOR }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-4xl shadow-xl shadow-orange-200"
              >
                📰
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              문해력은 <span style={{ color: BRAND_COLOR }}>근육</span>입니다.<br/>
              매일 하나씩 단련하세요.
            </h2>
            <p className="text-xl text-gray-500 mb-12 max-w-2xl leading-relaxed">
              뉴스를 읽고 핵심을 꿰뚫는 훈련을 시작하세요.<br/>
              아이스크림 AI 코치가 당신의 요약 실력을 정밀하게 분석해 드립니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
              {[
                { icon: "🔍", title: "핵심 파악", desc: "한 문장으로 요점 정리" },
                { icon: "📊", title: "논리적 구조", desc: "기승전결 3줄 요약" },
                { icon: "🤖", title: "AI 피드백", desc: "전문가 수준의 평가" }
              ].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h4 className="font-bold text-gray-800 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={startNewSession}
              style={{ backgroundColor: BRAND_COLOR }}
              className="px-16 py-6 text-white rounded-3xl font-black text-2xl shadow-2xl shadow-orange-200 transition-all hover:scale-105 active:scale-95 hover:brightness-110"
            >
              훈련 시작하기
            </button>
          </div>
        )}

        {renderStepIndicator()}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
            {step === TrainingStep.FETCHING ? (
              <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                {/* Background Circle */}
                <svg viewBox="0 0 160 160" className="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r={RADIUS}
                    stroke="#f1f5f9"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r={RADIUS}
                    stroke={BRAND_COLOR}
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={CIRCUMFERENCE - (CIRCUMFERENCE * countdown) / 10}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-6xl font-black text-gray-800">{countdown}</span>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">sec</span>
                </div>
              </div>
            ) : (
              <div 
                style={{ borderTopColor: 'transparent', borderColor: BRAND_COLOR }}
                className="w-16 h-16 border-4 rounded-full animate-spin mb-8"></div>
            )}
            
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {step === TrainingStep.FETCHING ? '오늘의 뉴스를 선별 중입니다' : 'AI 코치가 요약을 분석 중입니다'}
            </h3>
            <p className="text-gray-500 font-medium max-w-xs leading-relaxed">
              {step === TrainingStep.FETCHING 
                ? '아이스크림 AI 코치가 가장 신선하고 훈련에 적합한 조선일보 기사를 찾고 있습니다.' 
                : '당신의 문해력 점수와 나이를 정밀하게 계산하고 있습니다. 잠시만 기다려주세요.'}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-2xl mb-6 shadow-sm flex flex-col items-center gap-4">
            <p className="font-medium text-center">{error}</p>
            <button 
              onClick={startNewSession} 
              className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              다시 시도하기
            </button>
          </div>
        )}

        {!loading && article && step !== TrainingStep.INTRO && (
          <div className="space-y-6">
            {/* Step: Reading */}
            {step === TrainingStep.READING && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
                <div className="p-8 md:p-12">
                  <div className="flex items-center gap-3 mb-6">
                    <span 
                      style={{ backgroundColor: BRAND_COLOR }}
                      className="text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wider">
                      조선일보
                    </span>
                    <a href={article.url} target="_blank" rel="noreferrer" className="text-sm text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-1">
                      네이버 뉴스 원문 ↗
                    </a>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight serif-text text-gray-900 border-b pb-8 border-gray-100">
                    {article.title}
                  </h2>
                  <div className="prose prose-lg prose-gray max-w-none text-gray-800 leading-relaxed serif-text whitespace-pre-wrap">
                    {article.content}
                  </div>
                </div>
                <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-gray-500 text-sm font-medium italic">
                    기사를 꼼꼼히 읽은 후 요약 버튼을 눌러주세요.
                  </p>
                  <button 
                    onClick={() => setStep(TrainingStep.SUMMARY_ONE)}
                    style={{ backgroundColor: BRAND_COLOR }}
                    className="w-full md:w-auto px-10 py-4 text-white rounded-2xl font-bold shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 hover:brightness-110"
                  >
                    내용 파악 완료 & 요약 시작
                  </button>
                </div>
              </div>
            )}

            {/* Step: Summary One Sentence */}
            {step === TrainingStep.SUMMARY_ONE && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 animate-fadeIn">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    style={{ backgroundColor: `${BRAND_COLOR}15`, color: BRAND_COLOR }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold">1</div>
                  <h3 className="text-2xl font-bold text-gray-800">단 한 문장으로 핵심 찌르기</h3>
                </div>
                <p className="text-gray-500 mb-8 leading-relaxed text-lg">
                  이 기사의 핵심 메시지가 무엇인가요? 사견을 배제하고 팩트 위주로 <strong>가장 핵심적인 한 문장</strong>을 작성해 보세요.
                </p>
                <textarea 
                  value={oneSentence}
                  onChange={(e) => setOneSentence(e.target.value)}
                  placeholder="예: 정부가 내수 경제 활성화를 위해 새로운 금융 지원 대책을 발표했습니다."
                  style={{ borderColor: isOneSentenceValid ? BRAND_COLOR : '#e2e8f0' }}
                  className="w-full h-40 p-6 rounded-2xl border-2 focus:ring-4 focus:ring-orange-100 outline-none transition-all resize-none text-xl leading-normal"
                />
                <p className={`mt-3 text-sm font-medium transition-colors ${isOneSentenceValid ? 'text-green-600' : 'text-gray-400'}`}>
                  {isOneSentenceValid ? '✓ 마침표가 포함되었습니다. 다음 단계로 이동 가능합니다.' : '※ 마침표(.)를 입력해야 버튼이 활성화됩니다.'}
                </p>
                <div className="flex flex-col md:flex-row justify-between mt-10 gap-4 items-center">
                  <button 
                    onClick={() => setStep(TrainingStep.READING)}
                    style={{ color: BRAND_COLOR }}
                    className="px-8 py-4 font-bold hover:bg-orange-50 rounded-2xl transition-colors text-lg"
                  >
                    기사 다시 읽기
                  </button>
                  <button 
                    disabled={!isOneSentenceValid}
                    onClick={() => setStep(TrainingStep.SUMMARY_THREE)}
                    style={{ backgroundColor: !isOneSentenceValid ? '#e2e8f0' : BRAND_COLOR }}
                    className={`px-12 py-4 rounded-2xl font-bold shadow-xl transition-all ${
                      !isOneSentenceValid ? 'text-gray-400 cursor-not-allowed shadow-none' : 'text-white active:scale-95 hover:brightness-110'
                    }`}
                  >
                    다음: 3줄 요약하기
                  </button>
                </div>
              </div>
            )}

            {/* Step: Summary Three Lines */}
            {step === TrainingStep.SUMMARY_THREE && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 animate-fadeIn">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    style={{ backgroundColor: `${BRAND_COLOR}15`, color: BRAND_COLOR }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold">2</div>
                  <h3 className="text-2xl font-bold text-gray-800">흐름에 맞게 3줄 요약하기</h3>
                </div>
                <p className="text-gray-500 mb-8 leading-relaxed text-lg">
                  기사의 <strong>도입(배경), 전개(핵심내용), 결론(영향/전망)</strong>을 각각 한 줄씩 정리해 보세요.
                </p>
                <textarea 
                  value={threeLines}
                  onChange={(e) => setThreeLines(e.target.value)}
                  placeholder="1. ...&#10;2. ...&#10;3. ..."
                  style={{ borderColor: isThreeLinesValid ? BRAND_COLOR : '#e2e8f0' }}
                  className="w-full h-56 p-6 rounded-2xl border-2 focus:ring-4 focus:ring-orange-100 outline-none transition-all resize-none text-xl leading-relaxed"
                />
                <p className={`mt-3 text-sm font-medium transition-colors ${isThreeLinesValid ? 'text-green-600' : 'text-gray-400'}`}>
                  {isThreeLinesValid ? '✓ 마침표가 포함되었습니다. 평가 받기가 가능합니다.' : '※ 마침표(.)를 입력해야 버튼이 활성화됩니다.'}
                </p>
                <div className="flex flex-col md:flex-row justify-between mt-10 gap-4 items-center">
                  <button 
                    onClick={() => setStep(TrainingStep.SUMMARY_ONE)}
                    style={{ color: BRAND_COLOR }}
                    className="px-8 py-4 font-bold hover:bg-orange-50 rounded-2xl transition-colors text-lg"
                  >
                    한 문장 요약 수정
                  </button>
                  <button 
                    disabled={!isThreeLinesValid}
                    onClick={handleEvaluate}
                    style={{ backgroundColor: !isThreeLinesValid ? '#e2e8f0' : BRAND_COLOR }}
                    className={`px-12 py-4 rounded-2xl font-bold shadow-xl transition-all ${
                      !isThreeLinesValid ? 'text-gray-400 cursor-not-allowed shadow-none' : 'text-white active:scale-95 hover:brightness-110'
                    }`}
                  >
                    내 요약 수준 평가받기
                  </button>
                </div>
              </div>
            )}

            {/* Step: Feedback */}
            {step === TrainingStep.FEEDBACK && feedback && (
              <div className="space-y-12 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* One Sentence Feedback Card */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold text-gray-800 tracking-tight">한 문장 요약 평가</h3>
                      <div className="flex flex-col items-end">
                        <span 
                          style={{ color: feedback.oneSentenceFeedback.score >= 80 ? '#16a34a' : BRAND_COLOR }}
                          className={`text-4xl font-black`}>
                          {feedback.oneSentenceFeedback.score}<span className="text-lg">점</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-6 flex-1">
                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-widest">내 요약</p>
                        <p className="text-gray-700 italic font-medium leading-snug">"{oneSentence}"</p>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                          <span style={{ backgroundColor: BRAND_COLOR }} className="w-1.5 h-4 rounded-full"></span> 아이스크림 AI 코치의 피드백
                        </p>
                        <p 
                          style={{ backgroundColor: `${BRAND_COLOR}08`, borderColor: `${BRAND_COLOR}15` }}
                          className="text-gray-600 leading-relaxed text-sm p-5 rounded-2xl border">
                          {feedback.oneSentenceFeedback.comments}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                          <span style={{ backgroundColor: EXAMPLE_COLOR }} className="w-1.5 h-4 rounded-full"></span> 모범 예시
                        </p>
                        <p 
                          style={{ backgroundColor: `${EXAMPLE_COLOR}10`, borderColor: EXAMPLE_COLOR }}
                          className="text-gray-800 p-5 rounded-2xl border font-semibold text-sm leading-snug">
                          {feedback.oneSentenceFeedback.suggestedSummary}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Three Lines Feedback Card */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold text-gray-800 tracking-tight">3줄 요약 평가</h3>
                      <div className="flex flex-col items-end">
                        <span 
                          style={{ color: feedback.threeLinesFeedback.score >= 80 ? '#16a34a' : BRAND_COLOR }}
                          className={`text-4xl font-black`}>
                          {feedback.threeLinesFeedback.score}<span className="text-lg">점</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-6 flex-1">
                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-widest">내 요약</p>
                        <p className="text-gray-700 whitespace-pre-wrap italic font-medium leading-snug text-sm">
                          {threeLines}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                          <span style={{ backgroundColor: BRAND_COLOR }} className="w-1.5 h-4 rounded-full"></span> 아이스크림 AI 코치의 피드백
                        </p>
                        <p 
                          style={{ backgroundColor: `${BRAND_COLOR}08`, borderColor: `${BRAND_COLOR}15` }}
                          className="text-gray-600 leading-relaxed text-sm p-5 rounded-2xl border">
                          {feedback.threeLinesFeedback.comments}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                          <span style={{ backgroundColor: EXAMPLE_COLOR }} className="w-1.5 h-4 rounded-full"></span> 모범 예시
                        </p>
                        <div 
                          style={{ backgroundColor: `${EXAMPLE_COLOR}10`, borderColor: EXAMPLE_COLOR }}
                          className="text-gray-800 p-5 rounded-2xl border whitespace-pre-wrap font-semibold text-sm leading-snug">
                          {feedback.threeLinesFeedback.suggestedSummary}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* New: Literacy Age Section */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[3rem] p-10 text-center shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <span className="text-9xl">🧠</span>
                  </div>
                  <h3 className="text-gray-400 font-bold text-sm tracking-widest uppercase mb-4">AI 문해력 정밀 분석</h3>
                  <p className="text-white text-xl md:text-2xl font-medium mb-6 leading-tight">
                    당신의 문해력 나이는...
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-8">
                     <span className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 animate-pulse">
                      {feedback.estimatedAge}
                    </span>
                    <span className="text-4xl font-bold text-white mt-8">세</span>
                  </div>
                  <div 
                    style={{ backgroundColor: `${BRAND_COLOR}20`, borderColor: `${BRAND_COLOR}30` }}
                    className="inline-block px-8 py-4 rounded-2xl border backdrop-blur-sm max-w-xl"
                  >
                    <p className="text-orange-100 font-semibold italic text-lg leading-relaxed">
                      " {feedback.ageComment} "
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 pt-4 pb-12">
                  <h4 className="text-gray-800 font-bold text-2xl">훈련을 완료했습니다!</h4>
                  <p className="text-gray-500 text-center mb-4">매일 하나의 기사를 요약하는 습관이 문해력의 지름길입니다.</p>
                  <button 
                    onClick={() => {
                      startNewSession();
                    }}
                    style={{ backgroundColor: BRAND_COLOR }}
                    className="px-12 py-5 text-white rounded-2xl font-bold shadow-2xl transition-all hover:scale-105 active:scale-95 hover:brightness-110"
                  >
                    다음 기사로 계속 훈련하기
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 py-4 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center text-xs text-gray-400 font-semibold tracking-wide uppercase">
          <p>© News Comprehension Academy</p>
          <div className="flex gap-6">
            <span style={{ color: BRAND_COLOR }}>조선일보 채널</span>
            <span>Gemini Flash 2.5</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
