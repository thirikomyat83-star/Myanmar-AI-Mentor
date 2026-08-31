'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

// ==========================================
// 1. TYPESCRIPT INTERFACES (Match Backend)
// ==========================================
interface LearningPathNode {
  type: 'chapter' | 'quiz';
  topic: string;
  reason: string;
  status: string;
  progress: number;
  is_quiz: boolean;
  meta?: {
    celebration?: boolean;   // 🎉 UI sparkles / confetti
    trophy?: boolean;        // 🏆 Trophy for dashboard
    next_chapter_unlock?: boolean;
  };
}

// ==========================================
// 2. ENTERPRISE SVGS (Eco-Theme)
// ==========================================
const Icons = {
  Back: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  Target: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Sparkle: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.5 2L13 9.5L20.5 11L13 12.5L11.5 20L10 12.5L2.5 11L10 9.5L11.5 2Z" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Swords: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Book: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
};

// ==========================================
// 3. 3D CONFETTI PARTICLE SYSTEM (Enhanced)
// ==========================================
const ConfettiEffect = ({ topic }: { topic: string }) => {
  const colors = ['#5F8B7E', '#8A8F4D', '#C9785C', '#F4EBDD', '#FFD700', '#FF6B6B', '#4ECDC4'];
  const particles = Array.from({ length: 120 }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const velocity = 150 + Math.random() * 600;
    return {
      id: i,
      x: Math.cos(angle) * velocity,
      y: Math.sin(angle) * velocity + 200,
      color: colors[i % colors.length],
      size: Math.random() * 12 + 6,
      rotation: Math.random() * 360 + 360,
      delay: Math.random() * 0.3,
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
          animate={{
            opacity: 0,
            x: p.x,
            y: p.y,
            rotate: p.rotation,
            scale: 1,
          }}
          transition={{
            duration: 2.5 + Math.random(),
            ease: 'easeOut',
            delay: p.delay,
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.id % 3 === 0 ? '50%' : '2px',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
          }}
        />
      ))}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 3.5, times: [0, 0.2, 1] }}
        className="absolute text-center"
      >
        <div className="text-8xl mb-4">🏆</div>
        <h2 className="text-4xl md:text-6xl font-black text-white" style={{ WebkitTextStroke: '2px #C9785C' }}>
          {topic} PASSED!
        </h2>
        <p className="text-white font-bold text-lg mt-2 opacity-80">ဂုဏ်ယူပါတယ်! နောက်အခန်းသို့ ဆက်သွားပါ။</p>
      </motion.div>
    </div>
  );
};

// ==========================================
// 4. MAIN COMPONENT
// ==========================================
export default function LearningPathPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTopic = searchParams.get('topic') || '';

  const [targetTopic, setTargetTopic] = useState<string>(urlTopic);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pathData, setPathData] = useState<LearningPathNode[]>([]);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [confettiTopic, setConfettiTopic] = useState<string>('');
  const [trophyCount, setTrophyCount] = useState<number>(0);

  // 🚨 Check for Quiz Success Flag on Load (from Study Plan or Quiz Page)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const confettiFlag = localStorage.getItem('show_confetti');
      const confettiTopicFlag = localStorage.getItem('confetti_topic');
      if (confettiFlag === 'true' && confettiTopicFlag) {
        setShowConfetti(true);
        setConfettiTopic(confettiTopicFlag);
        localStorage.removeItem('show_confetti');
        localStorage.removeItem('confetti_topic');
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  }, []);

  // 🚨 Fetch Learning Path from Backend
  const fetchLearningPath = useCallback(
    async (topic: string) => {
      if (!topic.trim() || topic.length < 2) {
        setError('ကျေးဇူးပြု၍ ခေါင်းစဉ်ကို ပြည့်စုံစွာ ရိုက်ထည့်ပါ။');
        return;
      }

      setLoading(true);
      setError(null);
      setPathData([]);
      setTrophyCount(0);

      try {
        const token = localStorage.getItem('token');
        const studentId = localStorage.getItem('student_id') || 'STU_TEMP';
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');

        const res = await fetch(
          `${baseUrl}/api/generate/learning-path/${studentId}?target_topic=${encodeURIComponent(topic.trim())}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true',
            },
          }
        );

        if (!res.ok) throw new Error('API ချိတ်ဆက်မှု မအောင်မြင်ပါ။');

        const data = await res.json();

        if (!data.learning_path || data.learning_path.length === 0) {
          throw new Error('ဤခေါင်းစဉ်အတွက် လမ်းကြောင်း ရှာမတွေ့ပါ။ အခြားစကားလုံး ပြောင်းသုံးကြည့်ပါ။');
        }

        setPathData(data.learning_path);

        // 🚨 Count Trophies from meta
        let newTrophies = 0;
        data.learning_path.forEach((node: LearningPathNode) => {
          if (node.meta?.trophy) newTrophies++;
        });
        setTrophyCount(newTrophies);

        // 🚨 Auto-trigger confetti if any celebration node exists
        const celebrationNode = data.learning_path.find((node: LearningPathNode) => node.meta?.celebration);
        if (celebrationNode) {
          setShowConfetti(true);
          setConfettiTopic(celebrationNode.topic);
          setTimeout(() => setShowConfetti(false), 5000);
        }

        setTimeout(() => {
          document.getElementById('roadmap-container')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } catch (err: any) {
        console.error('Failed to fetch learning path:', err);
        setError(err.message || 'လမ်းကြောင်း ဖန်တီး၍ မရသေးပါ။');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (urlTopic) {
      fetchLearningPath(urlTopic);
    }
  }, [urlTopic, fetchLearningPath]);

  const handleGeneratePath = async () => {
    if (!targetTopic.trim() || targetTopic.trim().length < 2) {
      setError('ကျေးဇူးပြု၍ ခေါင်းစဉ်ကို ပြည့်စုံစွာ ရိုက်ထည့်ပါ။');
      return;
    }
    await fetchLearningPath(targetTopic.trim());
  };

  const handleAction = (step: LearningPathNode) => {
    if (step.is_quiz) {
      localStorage.setItem(
        'quiz_intent',
        JSON.stringify({
          topic: `${targetTopic} ဘာသာရပ်မှ ${step.topic}`,
          type: 'general',
          is_chapter_quiz: true,
        })
      );
      router.push('/quiz');
    } else {
      router.push(`/study-plan?topic=${encodeURIComponent(step.topic)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#3F4A3C] font-sans relative overflow-x-hidden pb-32">
      {/* 🚨 Confetti Overlay */}
      <AnimatePresence>
        {showConfetti && <ConfettiEffect topic={confettiTopic} />}
      </AnimatePresence>

      {/* Background Blur Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#8A8F4D]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-20%] w-[500px] h-[500px] bg-[#5F8B7E]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header with Trophy Counter */}
      <header className="w-full px-6 py-5 relative z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#FFFDF8]/80 backdrop-blur-md sticky top-0 border-b border-[#F4EBDD]/50">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-3 text-[#3F4A3C]/70 hover:text-[#5F8B7E] font-bold transition-colors group"
        >
          <div className="p-2.5 bg-white rounded-full shadow-sm border border-[#F4EBDD] group-hover:bg-[#5F8B7E] group-hover:text-white transition-all">
            <Icons.Back />
          </div>
          Back to Hub
        </button>

        <div className="flex items-center gap-4">
          {/* 🚨 Trophy Counter */}
          {trophyCount > 0 && (
            <div className="flex items-center gap-1.5 bg-[#F4EBDD] px-3 py-1.5 rounded-full shadow-sm border border-[#E8DCC8]">
              <span className="text-lg">🏆</span>
              <span className="text-sm font-bold text-[#3F4A3C]">{trophyCount}</span>
            </div>
          )}
          <div className="text-xs font-black uppercase tracking-widest text-[#5F8B7E] bg-[#5F8B7E]/10 px-3 py-1.5 rounded-lg border border-[#5F8B7E]/20">
            Progress Tracker
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 relative z-10 pt-6">
        {/* Cross-link to Study Plan */}
        {pathData.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => router.push(`/study-plan?topic=${encodeURIComponent(targetTopic)}`)}
              className="flex items-center gap-2 text-sm font-bold bg-white text-[#8A8F4D] px-5 py-2.5 rounded-xl border-2 border-[#8A8F4D] hover:bg-[#8A8F4D] hover:text-white transition-all shadow-sm"
            >
              <Icons.Calendar /> View 7-Day Action Plan
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="text-center mt-6 mb-20 max-w-2xl mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-[#F4EBDD] text-[#8A8F4D] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-white rotate-3"
          >
            <Icons.Target />
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-[#3F4A3C] leading-tight">
            Design Your <br />
            <span className="text-[#8A8F4D] relative">
              Learning Roadmap
              <svg
                className="absolute w-full h-3 bottom-1 left-0 text-[#8A8F4D]/30"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" />
              </svg>
            </span>
          </h1>

          <p className="text-[#3F4A3C]/60 font-semibold text-lg max-w-lg mx-auto mb-12">
            Study Plan နှင့် ချိတ်ဆက်ထားသော တိုးတက်မှုမြေပုံ။ အခန်းတစ်ခုပြီးတိုင်း ဉာဏ်စမ်းဖြေဆိုရန် ပွင့်လာပါမည်။
          </p>

          {/* Search Input */}
          <div className="relative">
            <div
              className={`bg-white p-2.5 rounded-full border-2 shadow-lg flex items-center transition-all duration-300 ${
                error
                  ? 'border-red-400 shadow-red-500/10'
                  : 'border-[#F4EBDD] focus-within:border-[#5F8B7E] focus-within:shadow-[0_15px_50px_rgb(95,139,126,0.15)]'
              }`}
            >
              <div className="pl-6 text-[#3F4A3C]/30">
                <Icons.Target />
              </div>
              <input
                type="text"
                value={targetTopic}
                onChange={(e) => {
                  setTargetTopic(e.target.value);
                  setError(null);
                }}
                placeholder="ဥပမာ - Geography, Biology..."
                className="flex-1 bg-transparent px-4 py-4 font-black text-lg text-[#3F4A3C] outline-none placeholder:font-medium placeholder:text-[#3F4A3C]/30"
                onKeyDown={(e) => e.key === 'Enter' && handleGeneratePath()}
              />
              <button
                onClick={handleGeneratePath}
                disabled={loading || !targetTopic.trim()}
                className="bg-[#5F8B7E] text-white px-8 py-5 rounded-full font-black text-lg shadow-md hover:bg-[#4a6d62] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shrink-0"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ရှာဖွေနေသည်
                  </>
                ) : (
                  <>
                    <Icons.Sparkle /> Map Route
                  </>
                )}
              </button>
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-8 left-6 text-red-500 font-bold text-sm"
              >
                {error}
              </motion.p>
            )}
          </div>
        </div>

        {/* Roadmap Container */}
        <AnimatePresence>
          {pathData.length > 0 && (
            <motion.div
              id="roadmap-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative max-w-4xl mx-auto pt-10"
            >
              {/* Vertical Timeline Line */}
              <div className="absolute left-8 md:left-1/2 md:-ml-[2px] top-10 bottom-0 w-[4px] bg-gradient-to-b from-[#8A8F4D] via-[#5F8B7E] to-[#e2e8f0] rounded-full opacity-30" />

              {pathData.map((step, index) => {
                const isEven = index % 2 === 0;
                const isCompleted = step.status === 'Completed' || step.progress === 100;
                const isLocked = step.status.includes('Locked');
                const isInProgress = !isCompleted && !isLocked;
                const isQuiz = step.is_quiz;

                const cardBorderColor = isCompleted
                  ? 'border-[#F4EBDD]/60 opacity-60 grayscale-[10%]'
                  : isInProgress
                  ? isQuiz
                    ? 'border-[#C9785C] shadow-[0_15px_50px_rgba(201,120,92,0.2)] ring-4 ring-[#C9785C]/10 scale-[1.02]'
                    : 'border-[#5F8B7E] shadow-[0_15px_50px_rgb(95,139,126,0.15)] ring-4 ring-[#5F8B7E]/10'
                  : 'border-[#F4EBDD] opacity-40 grayscale-[50%]';

                let nodeBgColor = 'bg-[#e2e8f0] text-[#3F4A3C]/40 border-white';
                if (isCompleted) {
                  nodeBgColor = 'bg-[#8A8F4D] text-white border-white opacity-80';
                } else if (isInProgress) {
                  if (isQuiz) {
                    nodeBgColor = 'bg-[#C9785C] text-white border-white ring-8 ring-[#C9785C]/20 animate-pulse';
                  } else {
                    nodeBgColor = 'bg-[#5F8B7E] text-white border-white ring-8 ring-[#5F8B7E]/20 animate-pulse';
                  }
                }

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: index * 0.15,
                      type: 'spring',
                      stiffness: 200,
                      damping: 20,
                    }}
                    onMouseEnter={() => (isInProgress || isCompleted) && setActiveStep(index)}
                    onMouseLeave={() => setActiveStep(null)}
                    className={`relative flex items-center mb-16 w-full ${isEven ? 'md:justify-start' : 'md:justify-end'}`}
                  >
                    {/* Node Marker */}
                    <div
                      className={`absolute left-[1.15rem] md:left-1/2 md:-ml-5 w-10 h-10 rounded-full border-4 flex items-center justify-center font-black shadow-lg z-10 transition-all duration-300 ${
                        !isLocked ? 'hover:scale-110' : ''
                      } ${nodeBgColor} ${activeStep === index && !isCompleted ? 'scale-125' : ''}`}
                    >
                      {isCompleted ? (
                        <Icons.Check />
                      ) : isLocked ? (
                        <Icons.Lock />
                      ) : isQuiz ? (
                        <Icons.Swords />
                      ) : (
                        <Icons.Book />
                      )}
                    </div>

                    {/* Card */}
                    <div
                      className={`w-full pl-24 md:pl-0 md:w-[45%] ${isEven ? 'md:pr-16' : 'md:pl-16'}`}
                    >
                      <div
                        className={`bg-white p-7 md:p-8 rounded-[2rem] border-2 transition-all duration-300 relative overflow-hidden group ${cardBorderColor}`}
                      >
                        {/* Progress Bar */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
                          <div
                            className={`h-full transition-all duration-1000 ${
                              isCompleted
                                ? 'bg-[#8A8F4D]'
                                : isInProgress
                                ? isQuiz
                                  ? 'bg-[#C9785C]'
                                  : 'bg-[#5F8B7E]'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${step.progress || 0}%` }}
                          />
                        </div>

                        {/* Badge */}
                        <div className="flex justify-between items-center mb-4 mt-2">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${
                                isCompleted
                                  ? 'bg-[#8A8F4D]/10 text-[#8A8F4D]'
                                  : isInProgress
                                  ? isQuiz
                                    ? 'bg-[#C9785C]/10 text-[#C9785C]'
                                    : 'bg-[#5F8B7E]/10 text-[#5F8B7E]'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {isQuiz ? 'Chapter Quiz' : `Level ${index + 1}`}
                            </span>
                          </div>
                          {isCompleted && <span className="text-xl">🏆</span>}
                          {isQuiz && !isCompleted && !isLocked && (
                            <span className="text-xl animate-bounce">🔥</span>
                          )}
                        </div>

                        {/* Title & Reason */}
                        <h3
                          className={`text-2xl font-black mb-3 leading-tight ${
                            isLocked
                              ? 'text-[#3F4A3C]/50'
                              : isQuiz && isInProgress
                              ? 'text-[#C9785C]'
                              : 'text-[#3F4A3C]'
                          }`}
                        >
                          {step.topic}
                        </h3>
                        <p
                          className={`text-[15px] font-semibold leading-relaxed mb-6 ${
                            isLocked ? 'text-[#3F4A3C]/40' : 'text-[#3F4A3C]/70'
                          }`}
                        >
                          {step.reason}
                        </p>

                        {/* Action Buttons */}
                        <div className="pt-5 border-t border-[#F4EBDD] flex flex-wrap items-center gap-3">
                          {isLocked && (
                            <span className="text-xs font-bold text-[#3F4A3C]/40 flex items-center gap-1.5">
                              <Icons.Lock /> ယခင်အဆင့်များကို အရင်ကျော်ဖြတ်ပါ
                            </span>
                          )}

                          {isCompleted && (
                            <span className="text-sm font-bold text-[#8A8F4D] flex items-center gap-1.5 w-full mb-2">
                              <span className="bg-[#8A8F4D] text-white p-1 rounded-full">
                                <Icons.Check />
                              </span>
                              အောင်မြင်ပြီးပါပြီ (100%)
                            </span>
                          )}

                          {isInProgress && (
                            <span
                              className={`text-sm font-bold flex items-center gap-1.5 w-full mb-4 ${
                                isQuiz ? 'text-[#C9785C]' : 'text-[#5F8B7E]'
                              }`}
                            >
                              <span className="relative flex h-3 w-3 mr-1">
                                <span
                                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                    isQuiz ? 'bg-[#C9785C]' : 'bg-[#5F8B7E]'
                                  }`}
                                />
                                <span
                                  className={`relative inline-flex rounded-full h-3 w-3 ${
                                    isQuiz ? 'bg-[#C9785C]' : 'bg-[#5F8B7E]'
                                  }`}
                                />
                              </span>
                              {isQuiz
                                ? 'ဉာဏ်စမ်း ဖြေဆိုရန် အဆင်သင့်ဖြစ်နေပါပြီ'
                                : `Study Plan တွင် လေ့လာနေဆဲ (${step.progress}%)`}
                            </span>
                          )}

                          {!isLocked && !isCompleted && (
                            <button
                              onClick={() => handleAction(step)}
                              className={`w-full text-sm font-black flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl transition-transform shadow-md ${
                                isQuiz
                                  ? 'bg-[#C9785C] text-white hover:scale-105'
                                  : 'bg-[#5F8B7E] text-white hover:scale-105'
                              }`}
                            >
                              {isQuiz ? (
                                <>
                                  <Icons.Swords /> Quiz ဖြေမည်
                                </>
                              ) : (
                                <>
                                  <Icons.Calendar /> Study Plan သို့ သွားမည်
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Goal Node */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: pathData.length * 0.15 + 0.5 }}
                className="relative flex justify-center mt-12 z-10 pb-20"
              >
                <div className="bg-gradient-to-r from-[#C9785C] to-[#8A8F4D] text-white px-10 py-5 rounded-[2rem] font-black text-2xl shadow-2xl border-4 border-[#FFFDF8] flex items-center gap-4">
                  <span className="text-4xl">🏆</span> {targetTopic} Goal!
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
