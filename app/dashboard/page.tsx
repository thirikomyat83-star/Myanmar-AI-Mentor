'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react'; 
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

// ==========================================
// 1. ICONS
// ==========================================
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const SettingsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" strokeWidth="2" /></svg>;
const BookOpenIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const TrophyIcon = () => <svg className="w-5 h-5 text-[#8A8F4D]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0H4m8 0h8m-8 0v13m0 13H4m8 0h8" /></svg>;
const RocketIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const QuizIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const CandleIcon = () => <svg className="w-5 h-5 text-[#C9785C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 22c2.21 0 4-1.79 4-4V9H8v9c0 2.21 1.79 4 4 4z" fill="currentColor" fillOpacity="0.2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9V7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2c-1.1 2.5-3 4-3 5s1 2 3 2 3-1 3-2-1.9-2.5-3-5z" fill="currentColor" /></svg>;
const StarIcon = () => <svg className="w-5 h-5 text-[#8A8F4D]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" /></svg>;
const HeartIcon = () => <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
const PlayIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>;
const MapIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>;
const CalendarIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const LayersIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const CloseIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const TargetIcon = () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><circle cx="12" cy="12" r="6" strokeWidth="2" /><circle cx="12" cy="12" r="2" strokeWidth="2" /></svg>;
const ArrowRightIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user: storeUser, clearStore } = useAuthStore(); 
  
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [gamification, setGamification] = useState({ xp: 0, level: 0, streak_days: 0, trophies: 0, hearts: 5 }); 
  const [nextHeartIn, setNextHeartIn] = useState<string>(""); 
  const [currentPathNode, setCurrentPathNode] = useState<any>(null);
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [timeGreeting, setTimeGreeting] = useState('');
  
  // 🚨 THE ABSOLUTE FIX: Local Avatar State (Always prioritized over backend's default)
  const [userAvatar, setUserAvatar] = useState<string>('🧑‍🎓');

  // Loading State
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'quiz' | 'flashcard'>('quiz');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topicsData, setTopicsData] = useState<any[]>([]);
  const [isFetchingTopics, setIsFetchingTopics] = useState(false);

  const [assessmentState, setAssessmentState] = useState({
    is_pretest_done: false, 
    needs_retest: false,
    pretest_scores: {} as Record<string, { percentage: number }>,
    current_scores: {} as Record<string, { percentage: number }>
  });

  const [isGeneratingPretest, setIsGeneratingPretest] = useState(false);

  // 🚨 NEW: Analytics Widget State (Progress Ring & Strengths/Weaknesses)
  const [analyticsData, setAnalyticsData] = useState({
    overall_progress: 0,
    strengths: [] as { name: string; score: number }[],
    weaknesses: [] as { name: string; score: number }[],
    today_task_progress: { completed: 0, total: 0 },
    student_info: { xp: 0, trophies: 0, streak_count: 0 }
  });

  // Load avatar on mount to prevent flashing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedStr = localStorage.getItem('profile');
      let pAv = null;
      if (storedStr) {
        try { pAv = JSON.parse(storedStr).avatar; } catch(e){}
      }
      const flatAv = localStorage.getItem('avatar');
      const stAv = storeUser?.avatar;
      const sessAv = (session?.user as any)?.avatar;

      const chosen = flatAv || pAv || stAv || sessAv || "🧑‍🎓";
      setUserAvatar(chosen);
    }
  }, [storeUser, session]);

  const currentUser = { ...(session?.user || {}), ...(storeUser || {}) } as any;
  const finalStudentId = currentUser.id || currentUser.student_id || (typeof window !== 'undefined' ? localStorage.getItem('student_id') : null);

  const handleStartPretest = async () => {
    setIsGeneratingPretest(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
      
      const res = await fetch(`${baseUrl}/api/tutor/diagnostic-quiz/${finalStudentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('diagnostic_quiz_data', JSON.stringify(data));
        router.push('/quiz?type=diagnostic'); 
      } else {
        console.error("Failed to generate quiz");
        alert("မေးခွန်းထုတ်ပေးရာတွင် အခက်အခဲရှိနေပါသည်။");
      }
    } catch (error) {
      console.error("Diagnostic Quiz Error:", error);
      alert("ကွန်ရက်ချိတ်ဆက်မှု အခက်အခဲရှိနေပါသည်။");
    } finally {
      setIsGeneratingPretest(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    
    if (!token && status === 'unauthenticated') {
      router.replace('/');
      return;
    }
  }, [status, router]);

  useEffect(() => {
    if (finalStudentId) {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
        const token = localStorage.getItem('token');

        if (!token) return;

        fetch(`${baseUrl}/api/knowledge/dashboard?student_id=${finalStudentId}`, { 
          headers: { 'Authorization': `Bearer ${token}`,'ngrok-skip-browser-warning': 'true' },
          cache: 'no-store'
        })
        .then(res => res.ok ? res.json() : null)
        .then(knowledgeData => {
          
          if (knowledgeData?.status === "redirect_to_pretest") {
            setAssessmentState(prev => ({ ...prev, is_pretest_done: false }));
            setIsDashboardLoading(false);
          } else if (knowledgeData && knowledgeData.profile) {
            if (knowledgeData.profile.grade === "Not set" || !knowledgeData.profile.grade) {
              router.replace('/profile-setup');
              return;
            }

            const weakSubs = knowledgeData.profile.weak_subjects || [];

            // 🚨 THE ABSOLUTE FIX: 
            // Backend က ပို့တဲ့ Avatar က "🧑‍🎓" အသေကြီး ဖြစ်နေခဲ့ရင်၊ လုံးဝမသုံးဘဲ User ရွေးထားတဲ့ userAvatar ကိုပဲ ဆက်သုံးမယ်။
            const localAvatar = localStorage.getItem('avatar');
            if (localAvatar) {
                setUserAvatar(localAvatar);
            } else {
                const apiAvatar = knowledgeData.profile.avatar;
                if (apiAvatar && apiAvatar !== "🧑‍🎓" && apiAvatar !== "null" && apiAvatar.trim() !== "") {
                    setUserAvatar(apiAvatar);
                    localStorage.setItem('avatar', apiAvatar);
                    
                    // Profile Object အဟောင်းရှိပါက အသစ်နှင့် Update လုပ်ပေးပါ
                    const storedStr = localStorage.getItem('profile');
                    if (storedStr) {
                        try { 
                            const p = JSON.parse(storedStr);
                            p.avatar = apiAvatar;
                            localStorage.setItem('profile', JSON.stringify(p));
                        } catch(e){}
                    }
                }
            }

            setDbProfile({
              name: knowledgeData.profile.name || "Student",
              username: knowledgeData.profile.username || "student",
              grade: knowledgeData.profile.grade,
              weakSubjects: weakSubs,
              goal: knowledgeData.profile.goal,
            });

            setGamification({
              xp: knowledgeData.profile.xp || 0,
              level: Math.floor((knowledgeData.profile.xp || 0) / 100), 
              streak_days: knowledgeData.profile.streak_count || 0, 
              trophies: knowledgeData.profile.trophies || 0,
              hearts: knowledgeData.profile.hearts !== undefined ? knowledgeData.profile.hearts : 5
            });

            if (knowledgeData.profile.next_heart_in) {
              setNextHeartIn(knowledgeData.profile.next_heart_in);
            }

            const isDone = Boolean(knowledgeData.profile.is_pretest_done === true && weakSubs.length > 0);

            setAssessmentState({
              is_pretest_done: isDone,
              needs_retest: knowledgeData.needs_retest ?? false,
              pretest_scores: knowledgeData.progress_data?.pretest || {},
              current_scores: knowledgeData.progress_data?.current || {}
            });

            if (isDone) {
              Promise.all([
                fetch(`${baseUrl}/api/generate/learning-path/${finalStudentId}?target_topic=General`, { headers: { 'Authorization': `Bearer ${token}`,'ngrok-skip-browser-warning': 'true' }, cache: 'no-store' }).then(res => res.ok ? res.json() : null),
                fetch(`${baseUrl}/api/tutor/daily-planner/${finalStudentId}`, { headers: { 'Authorization': `Bearer ${token}`,'ngrok-skip-browser-warning': 'true' }, cache: 'no-store' }).then(res => res.ok ? res.json() : null),
                
                // 🚨 NEW: Fetch Widget Analytics Data
                fetch(`${baseUrl}/api/analytics/widget/${finalStudentId}`, { headers: { 'Authorization': `Bearer ${token}`,'ngrok-skip-browser-warning': 'true' }, cache: 'no-store' }).then(res => res.ok ? res.json() : null)
              ])
              .then(([pathData, planData, analyticsRes]) => {
                if (pathData && pathData.learning_path) {
                  const activeNode = pathData.learning_path.find((n: any) => n.status.includes('Unlocked')) || pathData.learning_path[0];
                  setCurrentPathNode(activeNode);
                }
                if (planData && planData.daily_plan) {
                  setDailyTasks(planData.daily_plan); 
                }

                // 🚨 NEW: Update Analytics State
                if (analyticsRes && analyticsRes.status === 'success') {
                  setAnalyticsData({
                    overall_progress: analyticsRes.overall_progress || 0,
                    strengths: analyticsRes.strengths || [],
                    weaknesses: analyticsRes.weaknesses || [],
                    today_task_progress: analyticsRes.today_task_progress || { completed: 0, total: 0 },
                    student_info: analyticsRes.student_info || { xp: 0, trophies: 0, streak_count: 0 }
                  });
                }
              })
              .finally(() => {
                setIsDashboardLoading(false);
              });
            } else {
              setIsDashboardLoading(false);
            }
          } else {
            setIsDashboardLoading(false);
          }
        })
        .catch(err => {
            console.error("Failed to fetch dashboard data", err);
            setIsDashboardLoading(false);
        });
    } else {
        setIsDashboardLoading(false);
    }

    const currentHour = new Date().getHours();
    if (currentHour < 12) setTimeGreeting('မင်္ဂလာနံနက်ခင်းပါ');
    else if (currentHour < 18) setTimeGreeting('မင်္ဂလာနေ့လယ်ခင်းပါ');
    else setTimeGreeting('မင်္ဂလာညချမ်းပါ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalStudentId, router]);

  useEffect(() => {
    if (nextHeartIn && nextHeartIn !== "00:00") {
      const interval = setInterval(() => {
        const [m, s] = nextHeartIn.split(':').map(Number);
        let totalSeconds = m * 60 + s - 1;
        
        if (totalSeconds <= 0) {
          setNextHeartIn("00:00");
          clearInterval(interval);
          setGamification(prev => ({ ...prev, hearts: Math.min(5, prev.hearts + 1) }));
        } else {
          const nm = Math.floor(totalSeconds / 60);
          const ns = totalSeconds % 60;
          setNextHeartIn(`${nm.toString().padStart(2, '0')}:${ns.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [nextHeartIn]);

  const openTopicModal = async (subject: string, type: 'quiz' | 'flashcard') => {
    setSelectedSubject(subject);
    setModalType(type);
    setIsModalOpen(true);
    setIsFetchingTopics(true);
    setTopicsData([]);

    try {
      const token = localStorage.getItem('token');
      const studentId = finalStudentId || "STU_TEMP";
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
      
      const res = await fetch(`${baseUrl}/api/syllabus/topics/${studentId}?subject=${encodeURIComponent(subject)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTopicsData(data.topics || []);
      }
    } catch (e) {
      console.error("Topics fetch error", e);
    } finally {
      setIsFetchingTopics(false);
    }
  };

 const handleSelectTopic = (topic: string) => {
    setIsModalOpen(false);
    if (modalType === 'quiz') {
      // 🚨 THE FIX: Quiz Page က ချက်ချင်းသိပြီး တန်းစသွားစေရန် LocalStorage ထဲ ထည့်ပေးမည်
      localStorage.removeItem('quiz_intent');
      localStorage.setItem('quiz_intent', JSON.stringify({ 
        topic: topic, 
        type: 'general',
        sourceText: '' 
      }));
      
      router.push(`/quiz?topic=${encodeURIComponent(topic)}`);
    } else {
      router.push(`/flashcards-vault?generate=${encodeURIComponent(topic)}`);
    }
  };

  const handleLogOutSystem = async () => {
    localStorage.clear();
    clearStore(); 
    await signOut({ callbackUrl: '/' }); 
  };

  if (!mounted || status === 'loading' || isDashboardLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex items-center justify-center text-[#5F8B7E] font-bold">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#8A8F4D]/30 border-t-[#8A8F4D] rounded-full animate-spin"></div>
          <p>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // 🚨 Display User ကို ဖွဲ့စည်းရာတွင် userAvatar (State) ကို အမြဲတမ်း ဦးစားပေး အသုံးပြုပါသည်
  const displayUser = {
    fullName: dbProfile?.name || currentUser.fullName || currentUser.name || "Student",
    username: dbProfile?.username || currentUser.username || "student",
    avatar: userAvatar, // 👈 THE ABSOLUTE FIX
    grade: dbProfile?.grade || currentUser.grade || "Not set",
    subjects: dbProfile?.weakSubjects || [], 
    goal: dbProfile?.goal,
  };

  const mainGridVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const genericItemVariants = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, type: 'spring', bounce: 0.3 } } };

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#3F4A3C] font-sans antialiased tracking-tight relative overflow-x-hidden selection:bg-[#F4EBDD] selection:text-[#5F8B7E] pb-12">
      
      {/* 🚨 TOPIC SELECTOR MODAL 🚨 */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#3F4A3C]/40 backdrop-blur-sm z-[100]" 
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-[#FFFDF8] rounded-[2rem] border-2 border-[#F4EBDD] shadow-[0_20px_70px_rgba(63,74,60,0.15)] z-[101] overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-[#F4EBDD] flex justify-between items-center bg-white">
                <div>
                  <h3 className="text-xl font-extrabold text-[#3F4A3C] flex items-center gap-2">
                    {modalType === 'quiz' ? <><QuizIcon /> Quiz Generator</> : <><LayersIcon /> Flashcard Creator</>}
                  </h3>
                  <p className="text-xs font-bold text-[#8A8F4D] mt-1 uppercase tracking-widest">{selectedSubject} လေ့လာရန် ခေါင်းစဉ်ရွေးပါ</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#F4EBDD] text-[#3F4A3C]/50 hover:text-[#3F4A3C] rounded-full transition-colors"><CloseIcon /></button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
                {isFetchingTopics ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-60">
                    <div className="w-8 h-8 border-4 border-[#8A8F4D]/30 border-t-[#8A8F4D] rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-sm">ခေါင်းစဉ်များ ရှာဖွေနေပါသည်...</p>
                  </div>
                ) : topicsData.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {topicsData.map((t, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleSelectTopic(t.topic)}
                        className="group flex flex-col bg-white border border-[#F4EBDD] p-4 rounded-2xl cursor-pointer hover:border-[#5F8B7E] hover:shadow-md transition-all active:scale-[0.98]"
                      >
                        <span className="text-[10px] font-bold text-[#8A8F4D] mb-1">{t.chapter}</span>
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-[#3F4A3C] text-lg">{t.topic}</span>
                          <span className="text-[#5F8B7E] opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 font-bold">ရွေးမည် &rarr;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 opacity-50 font-bold text-sm">ဒီဘာသာရပ်အတွက် ခေါင်းစဉ်များ မရှိသေးပါ။</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-[#F4EBDD] rounded-full filter blur-[100px] opacity-60 pointer-events-none"></div>
      <div className="absolute top-[40%] left-[-10%] w-[600px] h-[600px] bg-[#5F8B7E] rounded-full mix-blend-multiply filter blur-[150px] opacity-5 pointer-events-none"></div>

      <nav className="w-full bg-white/80 backdrop-blur-2xl border-b border-[#F4EBDD] sticky top-0 z-50 shadow-[0_8px_30px_rgb(63,74,60,0.03)]">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5F8B7E] rounded-xl flex items-center justify-center text-[#FFFDF8] font-black text-lg shadow-md border border-[#8A8F4D]/20">AI</div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight leading-none text-[#3F4A3C]">Mentor Portal</h1>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A8F4D]">Student Dashboard</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2.5 bg-[#FFFDF8] border border-[#F4EBDD] px-4 py-1.5 rounded-full shadow-sm font-bold text-sm text-[#3F4A3C]">
              <span className="text-xl">{displayUser.avatar}</span>
              <span className="opacity-80">@{displayUser.username}</span>
            </div>
            <button className="p-2.5 bg-white text-[#3F4A3C]/70 rounded-full border border-[#F4EBDD] hover:bg-[#F4EBDD] hover:text-[#3F4A3C] transition-all shadow-sm"><SettingsIcon /></button>
            <button onClick={handleLogOutSystem} className="p-2.5 bg-red-50 text-[#C9785C] rounded-full border border-red-100 hover:bg-[#C9785C] hover:text-white transition-all shadow-sm" title="Logout"><LogoutIcon /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 relative z-10">
        <motion.div variants={mainGridVariants} initial="hidden" animate="show" className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* ============================================================== */}
          {/* LEFT SIDEBAR: Profile, Gamification & Navigation Tabs */}
          {/* ============================================================== */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            
            {/* 1. Profile & Gamification Stats */}
            <motion.div variants={genericItemVariants} className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-[#F4EBDD] shadow-[0_20px_60px_rgb(63,74,60,0.04)] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#F4EBDD]/60 to-transparent"></div>
              <div className="w-24 h-24 rounded-full border-4 border-white bg-[#F4EBDD] flex items-center justify-center text-5xl mx-auto shadow-md relative z-10 mt-4 mb-4">
                {displayUser.avatar}
              </div>
              <p className="text-xs font-bold text-[#C9785C] uppercase tracking-widest mb-1">{timeGreeting}</p>
              <h2 className="text-2xl font-extrabold leading-tight text-[#3F4A3C]">{displayUser.fullName}</h2>
              <p className="text-sm font-medium text-[#3F4A3C]/50 mb-6">{displayUser.grade}</p>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex flex-col items-center bg-[#FFFDF8] border border-[#F4EBDD] p-3 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1"><TrophyIcon /><span className="font-extrabold text-[#3F4A3C]">{gamification.trophies}</span></div>
                  <span className="text-[10px] text-[#3F4A3C]/50 font-bold uppercase tracking-wider">Trophies</span>
                </div>
                <div className="flex flex-col items-center bg-[#FFFDF8] border border-[#F4EBDD] p-3 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1"><HeartIcon /><span className="font-extrabold text-[#3F4A3C]">{gamification.hearts}/5</span></div>
                  <span className="text-[10px] text-[#3F4A3C]/50 font-bold uppercase tracking-wider">
                    {gamification.hearts < 5 && nextHeartIn && nextHeartIn !== "00:00" ? <span className="text-[#C9785C]">{nextHeartIn}</span> : "Hearts"}
                  </span>
                </div>
                <div className="flex flex-col items-center bg-[#FFFDF8] border border-[#F4EBDD] p-3 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1"><StarIcon /><span className="font-extrabold text-[#3F4A3C]">Lvl {gamification.level}</span></div>
                  <span className="text-[10px] text-[#3F4A3C]/50 font-bold uppercase tracking-wider">{gamification.xp} XP</span>
                </div>
                <div className="flex flex-col items-center bg-[#FFFDF8] border border-[#F4EBDD] p-3 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1"><CandleIcon /><span className="font-extrabold text-[#3F4A3C]">{gamification.streak_days}</span></div>
                  <span className="text-[10px] text-[#3F4A3C]/50 font-bold uppercase tracking-wider">Learning</span>
                </div>
              </div>
            </motion.div>

            {/* 2. Sidebar Navigation Tabs */}
            <motion.div variants={genericItemVariants} className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-4 border border-[#F4EBDD] shadow-[0_10px_40px_rgb(63,74,60,0.03)] flex flex-col gap-2">
              <Link href="/dashboard" className="flex items-center gap-3 p-4 bg-[#5F8B7E] text-white rounded-xl font-bold shadow-md transition-all">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><BookOpenIcon /></div>
                <span>Dashboard</span>
              </Link>
              <Link href="/learning-path" className="flex items-center gap-3 p-4 hover:bg-[#F4EBDD]/50 text-[#3F4A3C]/80 hover:text-[#3F4A3C] rounded-xl font-bold transition-all">
                <div className="w-8 h-8 bg-[#F4EBDD] text-[#8A8F4D] rounded-lg flex items-center justify-center"><MapIcon /></div>
                <span>Learning Paths</span>
              </Link>
              <Link href="/study-plan" className="flex items-center gap-3 p-4 hover:bg-[#F4EBDD]/50 text-[#3F4A3C]/80 hover:text-[#3F4A3C] rounded-xl font-bold transition-all">
                <div className="w-8 h-8 bg-[#F4EBDD] text-[#C9785C] rounded-lg flex items-center justify-center"><CalendarIcon /></div>
                <span>Study Calendar</span>
              </Link>
              <Link href="/flashcards-vault" className="flex items-center gap-3 p-4 hover:bg-[#F4EBDD]/50 text-[#3F4A3C]/80 hover:text-[#3F4A3C] rounded-xl font-bold transition-all">
                <div className="w-8 h-8 bg-[#F4EBDD] text-[#5F8B7E] rounded-lg flex items-center justify-center"><LayersIcon /></div>
                <span>Flashcards Vault</span>
              </Link>
            </motion.div>

            {/* 3. Ask AI Mentor CTA */}
            <motion.div variants={genericItemVariants} className="bg-[#5F8B7E] text-[#FFFDF8] rounded-[2rem] p-6 shadow-xl relative overflow-hidden group cursor-pointer border border-[#3F4A3C]/10" onClick={() => router.push('/chat')}>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-inner"><RocketIcon /></div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">Ask AI Mentor</h3>
                  <p className="text-xs font-medium text-white/80">၂၄ နာရီ မေးမြန်းရန်</p>
                </div>
              </div>
            </motion.div>
            
          </div>

          {/* ============================================================== */}
          {/* RIGHT MAIN AREA: Action-Oriented Sections */}
          {/* ============================================================== */}
          <div className="xl:col-span-3 flex flex-col gap-8">
            
            {/* 🚨 PRETEST / RETEST BANNER 🚨 */}
            {(!assessmentState.is_pretest_done || assessmentState.needs_retest || !displayUser.subjects || displayUser.subjects.length === 0) && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border-2 
                  ${!assessmentState.is_pretest_done || !displayUser.subjects || displayUser.subjects.length === 0
                    ? 'bg-gradient-to-r from-red-50 to-[#FFFDF8] border-red-200' 
                    : 'bg-gradient-to-r from-blue-50 to-[#FFFDF8] border-blue-200'}`}
              >
                <div className="z-10 relative flex items-center gap-6">
                  <div className={`w-16 h-16 shrink-0 rounded-full flex items-center justify-center text-white shadow-lg text-2xl
                    ${!assessmentState.is_pretest_done || !displayUser.subjects || displayUser.subjects.length === 0 ? 'bg-[#C9785C]' : 'bg-[#5F8B7E]'}`}>
                    <TargetIcon />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#3F4A3C] tracking-tight mb-2">
                      {!assessmentState.is_pretest_done || !displayUser.subjects || displayUser.subjects.length === 0 ? "အရည်အချင်းစစ် Pretest ဖြေဆိုရန်" : "၅ ရက်မြောက် တိုးတက်မှုစစ်ဆေးရန် (Retest)"}
                    </h2>
                    <p className="text-sm font-bold text-[#3F4A3C]/70 max-w-lg leading-relaxed">
                      {!assessmentState.is_pretest_done || !displayUser.subjects || displayUser.subjects.length === 0
                        ? "သင့်အတွက် အသင့်တော်ဆုံး Study Plan ဆွဲပေးနိုင်ရန် App ကိုမသုံးခင် ဘာသာရပ်များ၏ အခြေခံကို စစ်ဆေးပေးပါ။" 
                        : "သင် ၅ ရက်တိတိ လေ့လာပြီးသွားပါပြီ! သင့်ရဲ့ ရမှတ်တွေ ဘယ်လောက်တိုးတက်လာလဲဆိုတာကို အခုပဲ စမ်းသပ်ကြည့်လိုက်ပါ။"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleStartPretest} 
                  disabled={isGeneratingPretest}
                  className={`w-full md:w-auto px-8 py-4 text-white font-extrabold rounded-full shadow-md transition-transform whitespace-nowrap z-10 disabled:opacity-70 disabled:cursor-not-allowed
                    ${!assessmentState.is_pretest_done || !displayUser.subjects || displayUser.subjects.length === 0 ? 'bg-[#C9785C] hover:bg-[#b0674d]' : 'bg-[#5F8B7E] hover:bg-[#4d7266]'}
                    ${!isGeneratingPretest && 'hover:scale-105'}`}
                >
                  {isGeneratingPretest 
                    ? "မေးခွန်းများ ပြင်ဆင်နေပါသည်... ⏳" 
                    : (!assessmentState.is_pretest_done || !displayUser.subjects || displayUser.subjects.length === 0 ? "Pretest စတင်မည် 🚀" : "Retest ဖြေဆိုမည် 📈")}
                </button>
              </motion.div>
            )}

            {/* 🎯 Section 1: The Core Progress (Resume Study + Progress Widget) */}
           {/* 🎯 Section 1: The Core Progress (Progress Widget Only) */}
           {/* 🎯 Section 1: The Core Progress (Progress Widget Only) */}
            <motion.div variants={genericItemVariants} className="bg-gradient-to-br from-[#8A8F4D] to-[#6d7239] text-[#FFFDF8] rounded-[2.5rem] p-8 md:p-10 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="z-10 relative flex-1">
                <h4 className="text-sm font-bold text-white/80 uppercase tracking-widest mb-2">My Target Goal</h4>
                
                {/* 🚨 THE FIX: User ရွေးထားတဲ့ Goal ကိုပဲ အသေပြမည် */}
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
                  {displayUser.goal || "Matriculation Exam"}
                </h2>
                
                <p className="text-sm text-white/90 max-w-md">
                  သင်ရွေးချယ်ထားသော ပန်းတိုင်ဆီသို့ လေ့လာမှု တိုးတက်မှု အခြေအနေ
                </p>
              </div>
              
              {/* 🚨 Progress Ring Widget */}
              <div className="z-10 flex items-center gap-6 bg-white/10 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-white/20">
                
                {/* Circular Progress Ring */}
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    {/* Background Circle */}
                    <path className="text-white/20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    {/* Progress Circle */}
                    <path className="text-[#FFFDF8]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${analyticsData.overall_progress}, 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-extrabold text-lg tracking-tight">
                    {analyticsData.overall_progress}%
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-white/80">
                    <span className="flex items-center gap-1"><TrophyIcon /> {analyticsData.student_info.trophies}</span>
                    <span className="flex items-center gap-1"><CandleIcon /> {analyticsData.student_info.streak_count}</span>
                    <span className="flex items-center gap-1"><StarIcon /> {analyticsData.student_info.xp} XP</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-white/60">
                    <span>Today: {analyticsData.today_task_progress.completed}/{analyticsData.today_task_progress.total} done</span>
                  </div>
                  
                  {/* Top Strengths / Weaknesses */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {analyticsData.strengths.slice(0, 1).map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-emerald-500/30 text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/50">
                        ✅ {s.name}
                      </span>
                    ))}
                    {analyticsData.weaknesses.slice(0, 1).map((w, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-red-500/30 text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-red-500/50">
                        ⚠️ {w.name}
                      </span>
                    ))}
                    {(analyticsData.strengths.length > 0 || analyticsData.weaknesses.length > 0) && (
                      <span className="text-[9px] font-bold text-white/50 mt-0.5 cursor-pointer hover:text-white transition-colors" onClick={() => router.push('/progress')}>
                        + See All
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* ✅ Section 2: Today's Study Plan (Checklist) */}
              <motion.div variants={genericItemVariants} className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 border border-[#F4EBDD] shadow-sm flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#F4EBDD] text-[#C9785C] rounded-xl flex items-center justify-center shadow-inner"><CalendarIcon /></div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#3F4A3C] tracking-tight">Today's Study Plan</h3>
                    <p className="text-xs font-bold text-[#3F4A3C]/50">ဒီနေ့အတွက် ပြီးမြောက်ရမည့် အလုပ်များ</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4 flex-1 overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
                  {dailyTasks && dailyTasks.length > 0 ? (
                    dailyTasks.map((task, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 bg-[#FFFDF8] border border-[#F4EBDD] rounded-2xl">
                        <input type="checkbox" className="mt-1 w-5 h-5 rounded border-[#8A8F4D] text-[#8A8F4D] focus:ring-[#8A8F4D]" checked={task.completed} readOnly />
                        <div>
                          <h4 className="font-bold text-[#3F4A3C]">{task.focus}</h4>
                          <p className="text-xs text-[#3F4A3C]/70 mt-1">{task.task}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#F4EBDD] rounded-2xl h-full">
                      <p className="text-sm font-bold text-[#3F4A3C]/60 mb-3">ဒီနေ့အတွက် Plan မဆွဲရသေးပါ။</p>
                      <button onClick={() => router.push('/study-plan')} className="text-xs font-bold bg-[#F4EBDD] text-[#5F8B7E] px-4 py-2 rounded-lg">Plan ရယူမည်</button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* ⚡ Section 3: FOCUS AREAS (WEAK SUBJECTS < 50%) */}
              <motion.div variants={genericItemVariants} className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 border border-[#F4EBDD] shadow-sm flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shadow-inner">
                    <TargetIcon />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#3F4A3C] tracking-tight">Your Focus Areas</h3>
                    <p className="text-xs font-bold text-red-500">Pretest တွင် ၅၀% အောက် ရရှိထားသော ဘာသာရပ်များ</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto pr-2 max-h-[350px] custom-scrollbar">
                  {assessmentState.is_pretest_done && !assessmentState.needs_retest && displayUser.subjects && displayUser.subjects.length > 0 ? (
                    displayUser.subjects.map((sub: string, index: number) => {
                      const score = assessmentState.current_scores[sub]?.percentage || 0;
                      return (
                      <div key={index} className="p-5 bg-[#FFFDF8] rounded-2xl border border-red-100 shadow-sm flex flex-col gap-4 group hover:border-[#5F8B7E] transition-all">
                        
                        {/* Subject Title & Score */}
                        <div className="flex justify-between items-center">
                          <h4 className="font-extrabold text-[#3F4A3C] text-lg">{sub}</h4>
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-black bg-[#F4EBDD] text-[#3F4A3C] px-2 py-1 rounded-md">Score: {score}%</span>
                             <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded-md uppercase tracking-wider">Weak</span>
                          </div>
                        </div>
                        
                        {/* Cross-link Buttons (Learning Path & Study Plan) */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button 
                            onClick={() => router.push(`/learning-path?topic=${encodeURIComponent(sub)}`)}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#5F8B7E] text-white py-2.5 rounded-xl text-[11px] font-bold shadow hover:bg-[#4a6d62] transition-colors"
                          >
                            <MapIcon /> Learning Path
                          </button>
                          <button 
                            onClick={() => router.push(`/study-plan?topic=${encodeURIComponent(sub)}`)}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-[#8A8F4D] text-[#8A8F4D] py-2.5 rounded-xl text-[11px] font-bold hover:bg-[#8A8F4D] hover:text-white transition-colors"
                          >
                            <CalendarIcon /> 7-Day Plan
                          </button>
                        </div>

                        {/* Secondary Practice Buttons */}
                        <div className="flex gap-2 pt-2 border-t border-[#F4EBDD]">
                          <button 
                            onClick={() => openTopicModal(sub, 'quiz')} 
                            className="flex-1 flex items-center justify-center gap-1.5 text-[#3F4A3C]/60 hover:text-[#5F8B7E] py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                          >
                            <QuizIcon /> Quick Quiz
                          </button>
                          <button 
                            onClick={() => openTopicModal(sub, 'flashcard')} 
                            className="flex-1 flex items-center justify-center gap-1.5 text-[#3F4A3C]/60 hover:text-[#5F8B7E] py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                          >
                            <LayersIcon /> Flashcards
                          </button>
                        </div>

                      </div>
                    )})
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#F4EBDD] rounded-2xl h-full">
                      <p className="text-sm font-bold text-[#3F4A3C]/60 mb-3">Diagnostic Pretest ဖြေဆိုပြီးပါက အားနည်းသောဘာသာရပ်များ ဤနေရာတွင် ပေါ်လာပါမည်။</p>
                    </div>
                  )}
                </div>
              </motion.div>
              
            </div>

          </div>
        </motion.div>
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
