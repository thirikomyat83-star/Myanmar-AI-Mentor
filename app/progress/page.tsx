'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

// ==========================================
// 1. ICONS
// ==========================================
const ArrowLeftIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const TrophyIcon = () => <svg className="w-5 h-5 text-[#8A8F4D]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0H4m8 0h8m-8 0v13m0 13H4m8 0h8" /></svg>;
const StarIcon = () => <svg className="w-5 h-5 text-[#8A8F4D]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" /></svg>;
const CandleIcon = () => <svg className="w-5 h-5 text-[#C9785C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 22c2.21 0 4-1.79 4-4V9H8v9c0 2.21 1.79 4 4 4z" fill="currentColor" fillOpacity="0.2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9V7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2c-1.1 2.5-3 4-3 5s1 2 3 2 3-1 3-2-1.9-2.5-3-5z" fill="currentColor" /></svg>;
const TargetIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><circle cx="12" cy="12" r="6" strokeWidth="2" /><circle cx="12" cy="12" r="2" strokeWidth="2" /></svg>;
const QuizIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const ClockIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CheckCircleIcon = () => <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = () => <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BookOpenIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
export default function ProgressPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { user: storeUser } = useAuthStore();
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data States
  const [studentId, setStudentId] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);

  useEffect(() => {
    const currentUser = { ...(session?.user || {}), ...(storeUser || {}) } as any;
    const sId = currentUser.id || currentUser.student_id || localStorage.getItem('student_id');
    setStudentId(sId);
  }, [session, storeUser]);

  // ==========================================
  // Fetch Deep Analytics Data
  // ==========================================
  const fetchAnalytics = useCallback(async (isBackgroundSync = false) => {
    if (!studentId) return;
    
    try {
      const token = localStorage.getItem('token');
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
      
      const [analyticsRes, profileRes] = await Promise.all([
        fetch(`${baseUrl}/api/analytics/deep/${studentId}`, { 
          headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
          cache: 'no-store'
        }),
        fetch(`${baseUrl}/api/knowledge/dashboard?student_id=${studentId}`, { 
          headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
          cache: 'no-store'
        })
      ]);
      
      if (analyticsRes.ok && profileRes.ok) {
        const analyticsData = await analyticsRes.json();
        const profileData = await profileRes.json();
        
        setAnalyticsData(analyticsData);
        setStudentProfile(profileData.profile);
        setError(null);
        setIsOffline(false);
      } else {
        if (!isBackgroundSync) setError("အချက်အလက်များ ရယူရာတွင် အခက်အခဲရှိနေပါသည်။");
        else setIsOffline(true);
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
      if (!isBackgroundSync) setError("ကွန်ရက်ချိတ်ဆက်မှု အခက်အခဲရှိနေပါသည်။");
      else setIsOffline(true);
    } finally {
      setIsInitialLoad(false);
    }
  }, [studentId]);

  // ==========================================
  // Initial Load & Auto-Refresh
  // ==========================================
  useEffect(() => {
    if (studentId) {
      fetchAnalytics(false);
      const interval = setInterval(() => fetchAnalytics(true), 30000); 
      return () => clearInterval(interval);
    }
  }, [studentId, fetchAnalytics]);

  // ==========================================
  // Calculate Derived Stats
  // ==========================================
  const overallProgress = analyticsData?.overall_stats?.overall_progress || 0;
  const subjectStats = analyticsData?.subject_stats || {};
  const quizHistory = analyticsData?.quiz_history || [];
  const weakestConcepts = analyticsData?.weakest_concepts || [];
  const recentActivity = analyticsData?.recent_activity || [];
  
  const quizTrend = quizHistory.slice(0, 20).reverse();
  const correctCount = quizTrend.filter((q: any) => q.is_correct).length;
  const totalCount = quizTrend.length;
  const accuracyRate = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  const subjectEntries = Object.entries(subjectStats);
  const sortedSubjects = subjectEntries.sort((a: any, b: any) => b[1].avg_score - a[1].avg_score);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, type: 'spring', bounce: 0.3 } } }as const;

  // ==========================================
  // UI Rendering
  // ==========================================
  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#3F4A3C] font-sans antialiased tracking-tight relative overflow-x-hidden selection:bg-[#F4EBDD] selection:text-[#5F8B7E] pb-12">
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#F4EBDD] rounded-full filter blur-[120px] opacity-60 pointer-events-none"></div>
      <div className="absolute top-[50%] left-[-10%] w-[500px] h-[500px] bg-[#5F8B7E] rounded-full mix-blend-multiply filter blur-[150px] opacity-5 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-[#8A8F4D] rounded-full mix-blend-multiply filter blur-[120px] opacity-10 pointer-events-none"></div>

      {/* Navigation */}
      <nav className="w-full bg-white/80 backdrop-blur-2xl border-b border-[#F4EBDD] sticky top-0 z-50 shadow-[0_8px_30px_rgb(63,74,60,0.03)]">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2.5 bg-[#F4EBDD] text-[#3F4A3C] rounded-full hover:bg-[#e0d9c8] transition-colors shadow-sm">
              <ArrowLeftIcon />
            </button>
            <div>
              <h1 className="font-extrabold text-2xl tracking-tight text-[#3F4A3C]">Progress Analytics</h1>
              <p className="text-xs font-bold text-[#8A8F4D] uppercase tracking-widest">Real-time Performance Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isOffline ? (
              <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 shadow-sm">⚠️ Offline</span>
            ) : (
              <span className="text-xs font-bold text-[#5F8B7E] bg-[#F4EBDD] px-3 py-1.5 rounded-full animate-pulse shadow-sm">🔄 Live</span>
            )}
            <Link href="/dashboard">
              <button className="px-4 py-2 bg-[#5F8B7E] text-white font-bold text-sm rounded-full hover:bg-[#4a6d62] transition-colors shadow-md">Dashboard</button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 relative z-10 min-h-[70vh]">
        <AnimatePresence mode="wait">
          {isInitialLoad ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center pt-20">
              <div className="w-12 h-12 border-4 border-[#8A8F4D]/30 border-t-[#8A8F4D] rounded-full animate-spin"></div>
              <p className="mt-4 font-bold text-[#5F8B7E]">Loading Progress Data...</p>
            </motion.div>
          ) : error && !analyticsData ? (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center pt-20">
              <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 border border-red-200 shadow-lg text-center max-w-md">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><XCircleIcon /></div>
                <h2 className="text-2xl font-extrabold text-[#3F4A3C] mb-2">အခက်အခဲရှိနေပါသည်</h2>
                <p className="text-sm text-[#3F4A3C]/70 mb-6">{error}</p>
                <button onClick={() => { setIsInitialLoad(true); fetchAnalytics(false); }} className="px-6 py-3 bg-[#5F8B7E] text-white font-extrabold rounded-full hover:bg-[#4a6d62] transition-colors">ပြန်လည်ကြိုးစားမည်</button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="content" variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-8">
              
              {/* 🌟 NEW SECTION: AI INSIGHT (Counselor Message) */}
              {analyticsData?.ai_insight && (
                <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#F4EBDD] to-white rounded-[2rem] p-6 sm:p-8 border border-[#5F8B7E]/20 shadow-sm relative overflow-hidden mb-2">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#5F8B7E]/5 rounded-full filter blur-[40px] pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-[#5F8B7E] text-white rounded-xl flex items-center justify-center text-xl shadow-sm">✨</div>
                      <h3 className="text-xl font-extrabold text-[#3F4A3C] tracking-tight">
                        {analyticsData.ai_insight.insight_title || "AI ၏ သုံးသပ်ချက်"}
                      </h3>
                    </div>
                    <div className="text-[#3F4A3C]/80 leading-relaxed whitespace-pre-line text-sm md:text-base font-medium">
                      {analyticsData.ai_insight.insight_message}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SECTION 1: Overall Stats Cards */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 border border-[#F4EBDD] shadow-sm flex flex-col items-center gap-2">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-[#F4EBDD]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                      <path className="text-[#8A8F4D]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${overallProgress}, 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-extrabold text-2xl text-[#3F4A3C]">{overallProgress}%</div>
                  </div>
                  <p className="text-xs font-bold text-[#3F4A3C]/60 uppercase tracking-wider mt-2">Overall Progress</p>
                </div>

                <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 border border-[#F4EBDD] shadow-sm flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-[#5F8B7E]/10 rounded-full flex items-center justify-center text-[#5F8B7E] text-2xl"><TargetIcon /></div>
                  <div className="text-center">
                    <span className="font-extrabold text-3xl text-[#3F4A3C]">{accuracyRate}%</span>
                    <p className="text-xs font-bold text-[#3F4A3C]/60 uppercase tracking-wider">Quiz Accuracy</p>
                    <p className="text-[10px] text-[#3F4A3C]/40">{correctCount}/{totalCount} correct</p>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 border border-[#F4EBDD] shadow-sm flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-[#8A8F4D]/10 rounded-full flex items-center justify-center text-[#8A8F4D] text-2xl"><StarIcon /></div>
                  <div className="text-center">
                    <span className="font-extrabold text-3xl text-[#3F4A3C]">{analyticsData?.overall_stats?.total_concepts || 0}</span>
                    <p className="text-xs font-bold text-[#3F4A3C]/60 uppercase tracking-wider">Concepts Encountered</p>
                    <p className="text-[10px] text-[#3F4A3C]/40">Total concepts</p>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 border border-[#F4EBDD] shadow-sm flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-[#C9785C]/10 rounded-full flex items-center justify-center text-[#C9785C] text-2xl"><CandleIcon /></div>
                  <div className="text-center">
                    <span className="font-extrabold text-3xl text-[#3F4A3C]">{studentProfile?.streak_count || 0}</span>
                    <p className="text-xs font-bold text-[#3F4A3C]/60 uppercase tracking-wider">Day Streak</p>
                    <p className="text-[10px] text-[#3F4A3C]/40">{studentProfile?.xp || 0} XP earned</p>
                  </div>
                </div>
              </motion.div>

              {/* SECTION 2: Subject Progress & Focus Areas */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Subject Mastery */}
                <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 border border-[#F4EBDD] shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#5F8B7E] text-white rounded-xl flex items-center justify-center"><BookOpenIcon /></div>
                    <div>
                      <h3 className="text-xl font-extrabold text-[#3F4A3C] tracking-tight">ဘာသာရပ်အလိုက် နားလည်ကျွမ်းကျင်မှု</h3>
                      <p className="text-[11px] font-bold text-[#3F4A3C]/50 uppercase tracking-wider">လေ့လာပြီးသော သင်ခန်းစာများအပေါ် ပျမ်းမျှရမှတ်</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {sortedSubjects.length > 0 ? (
                      sortedSubjects.map(([subject, data]: [string, any], index) => {
                        const progress = data.progress_percentage || 0;
                        const isMastered = progress >= 80;
                        const isWeak = progress > 0 && progress < 50;
                        
                        return (
                          <div key={index} className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-[#3F4A3C] flex items-center gap-2">
                                {subject}
                                {isMastered && <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full">Mastered</span>}
                                {isWeak && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">Needs Focus</span>}
                              </span>
                              <span className="font-extrabold text-[#8A8F4D]">{progress}%</span>
                            </div>
                            <div className="w-full h-3 bg-[#F4EBDD] rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
                                className={`h-full rounded-full ${isMastered ? 'bg-emerald-500' : isWeak ? 'bg-red-500' : 'bg-[#5F8B7E]'}`}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-[#3F4A3C]/50">
                              <span>{data.mastered_count} mastered</span>
                              <span>{data.total_concepts} total</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-[#3F4A3C]/50 font-bold">ဘာသာရပ်အလိုက် အချက်အလက်များ မရှိသေးပါ။</div>
                    )}
                  </div>
                </div>

                {/* Focus Areas */}
                <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 border border-[#F4EBDD] shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center"><TargetIcon /></div>
                    <div>
                      <h3 className="text-xl font-extrabold text-[#3F4A3C] tracking-tight">Focus Areas</h3>
                      <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Weakest concepts</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {weakestConcepts.length > 0 ? (
                      weakestConcepts.map((concept: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100">
                          <div>
                            <p className="font-bold text-[#3F4A3C] line-clamp-1">{concept.name}</p>
                            <p className="text-xs text-red-500 font-bold">Score: {concept.score}%</p>
                          </div>
                          <button onClick={() => router.push(`/chat?topic=${encodeURIComponent(concept.name)}`)} className="px-4 py-2 bg-[#5F8B7E] text-white text-xs font-bold rounded-full hover:bg-[#4a6d62] transition-colors shadow-sm shrink-0 ml-2">Study</button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-[#3F4A3C]/50 font-bold flex flex-col items-center gap-2">
                        <span className="text-4xl">🎉</span>
                        <p>အားနည်းသော အပိုင်းများ မရှိသေးပါ။</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* SECTION 3: Quiz Chart & Recent Activity */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Quiz Chart */}
                <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 border border-[#F4EBDD] shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#8A8F4D] text-white rounded-xl flex items-center justify-center"><QuizIcon /></div>
                    <div>
                      <h3 className="text-xl font-extrabold text-[#3F4A3C] tracking-tight">Quiz Performance</h3>
                      <p className="text-xs font-bold text-[#3F4A3C]/50 uppercase tracking-wider">Last 20 quizzes</p>
                    </div>
                  </div>

                  <div className="h-[250px] flex flex-col gap-2 relative">
                    {quizTrend.length > 0 ? (
                      <>
                        <div className="flex-1 flex items-end justify-between gap-1 px-2 h-full">
                          {quizTrend.map((q: any, i: number) => (
                            <div key={i} className="h-full flex flex-col justify-end items-center group relative flex-1 pb-2">
                              <div 
                                className={`w-full max-w-[12px] rounded-t-sm transition-all duration-300 hover:scale-[1.15] origin-bottom ${q.is_correct ? 'bg-emerald-500' : 'bg-red-500'}`} 
                                style={{ height: `${q.is_correct ? 85 : 35}%` }} 
                              />
                              <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[#3F4A3C] text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none shadow-md">
                                {q.is_correct ? '✅ Correct' : '❌ Incorrect'}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-[#3F4A3C]/40 px-2 mt-1">
                          <span>Oldest</span>
                          <span>Newest</span>
                        </div>
                        <div className="flex justify-center gap-6 mt-4 text-xs font-bold text-[#3F4A3C]/60">
                          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-full"></span> Correct</span>
                          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-500 rounded-full"></span> Incorrect</span>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-[#3F4A3C]/40 font-bold text-sm">
                        <QuizIcon />
                        <p className="mt-2">Quiz မှတ်တမ်းများ မရှိသေးပါ</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 border border-[#F4EBDD] shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#C9785C]/20 text-[#C9785C] rounded-xl flex items-center justify-center"><ClockIcon /></div>
                    <div>
                      <h3 className="text-xl font-extrabold text-[#3F4A3C] tracking-tight">Recent Activity</h3>
                      <p className="text-xs font-bold text-[#3F4A3C]/50 uppercase tracking-wider">Completed Study Tasks</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 max-h-[280px] overflow-y-auto custom-scrollbar pr-2">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity: any, index: number) => {
                        const rawDetails = activity.details || '';
                        const isQuiz = rawDetails.toLowerCase().includes('quiz') || rawDetails.includes('ဉာဏ်စမ်း');
                        const isFlashcard = rawDetails.toLowerCase().includes('flashcard') || rawDetails.includes('မှတ်စုကတ်');
                        
                        const parts = rawDetails.split(' : ');
                        const mainAction = parts.length > 1 ? parts[1].trim() : rawDetails;
                        const subtitle = parts.length > 1 ? parts[0].trim() : `Task for ${activity.focus}`;
                        
                        let icon = <CheckCircleIcon />;
                        let color = 'bg-[#5F8B7E] text-white';
                        if (isQuiz) { icon = <QuizIcon />; color = 'bg-[#8A8F4D] text-white'; } 
                        else if (isFlashcard) { icon = <StarIcon />; color = 'bg-[#C9785C] text-white'; }
                        else { icon = <BookOpenIcon />; color = 'bg-[#5F8B7E] text-white'; }

                        const dateObj = new Date(activity.timestamp);
                        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                        return (
                          <div key={index} className="flex items-start gap-4 p-4 bg-[#FFFDF8] border border-[#F4EBDD] rounded-2xl hover:border-[#5F8B7E]/30 transition-all shadow-sm">
                            <div className={`w-10 h-10 mt-0.5 shrink-0 rounded-full flex items-center justify-center ${color} shadow-sm`}>{icon}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[#3F4A3C] text-sm truncate" title={mainAction}>{mainAction}</p>
                              <p className="text-xs text-[#3F4A3C]/70 mt-1 truncate" title={subtitle}>{subtitle}</p>
                              <p className="text-[10px] font-extrabold text-[#8A8F4D] mt-2 tracking-wide uppercase">{dateStr} • {activity.focus}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-10 text-[#3F4A3C]/50 font-bold">လှုပ်ရှားမှု မှတ်တမ်းများ မရှိသေးပါ။</div>
                    )}
                  </div>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}