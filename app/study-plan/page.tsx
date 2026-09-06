'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from "react";
// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================
interface StudyTask {
  id: number;
  time?: string;
  task: string;
  details?: string;
  focus: string;
  completed: boolean;
  action_type?: string; // 🚨 NEW: From Backend (chat, flashcard, quiz, practice)
}

interface DayPlan {
  day_label: string;
  date: string;
  is_today: boolean;
  tasks: StudyTask[];
}

interface PlannerResponse {
  daily_plan: StudyTask[];
  weekly_plan?: DayPlan[];
  sm2_due_count: number;
  all_done_today?: boolean;
  available_topics?: string[];
  current_topic?: string;
  subject_type?: string; // 🚨 NEW: From Backend (CALC or THEORY)
}

// 🚨 NEW: Learning Path Node Interface
interface LearningPathNode {
  type: 'chapter' | 'quiz';
  topic: string;
  reason: string;
  status: string;
  progress: number;
  is_quiz: boolean;
  meta?: {
    celebration?: boolean;
    trophy?: boolean;
    next_chapter_unlock?: boolean;
  };
}

// ==========================================
// 2. ENTERPRISE SVGS (Optimized for performance)
// ==========================================
const Icons = {
  Back: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  Sun: () => (
    <svg className="w-6 h-6 text-[#C9785C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Sunset: () => (
    <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 21h16M12 18v3" />
    </svg>
  ),
  Moon: () => (
    <svg className="w-6 h-6 text-[#5F8B7E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Path: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  EmptyBox: () => (
    <svg className="w-24 h-24 text-[#8A8F4D]/30 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Upload: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
};

// ==========================================
// 🚨 HELPER FUNCTION: Prevent Timezone offset issues
// ==========================================
const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
function StudyPlanContent(){
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTopic, setActiveTopic] = useState(searchParams.get('topic') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planData, setPlanData] = useState<PlannerResponse | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<number>>(new Set());
  
  // 🚨 NEW: Learning Path & Trophy State
  const [learningPath, setLearningPath] = useState<LearningPathNode[]>([]);
  const [trophyCount, setTrophyCount] = useState(0);
  const [completedTaskTexts, setCompletedTaskTexts] = useState<string[]>([]);

  // Fetch plan function
  const fetchPlan = useCallback(async (topicToFetch: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const studentId = localStorage.getItem('student_id') || 'STU_TEMP';
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');

      const res = await fetch(
        `${baseUrl}/api/tutor/daily-planner/${studentId}${topicToFetch ? `?topic=${encodeURIComponent(topicToFetch)}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      if (!res.ok) throw new Error('API ချိတ်ဆက်မှု မအောင်မြင်ပါ။');

      const data: PlannerResponse = await res.json();
      setPlanData(data);

      if (!topicToFetch && data.current_topic) {
        setActiveTopic(data.current_topic);
      }

      const completedIds = new Set<number>();
      const completedTexts: string[] = [];
      if (data.weekly_plan) {
        data.weekly_plan.forEach((day) =>
          day.tasks.forEach((task) => {
            if (task.completed) {
              completedIds.add(task.id);
              completedTexts.push(task.task.toLowerCase());
            }
          })
        );
      }
      setCompletedTaskIds(completedIds);
      setCompletedTaskTexts(completedTexts);
    } catch (err: any) {
      setError(err.message || 'အစီအစဉ်ဆွဲရာတွင် အခက်အခဲရှိနေပါသည်။');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan(activeTopic);
  }, [activeTopic, fetchPlan]);

  // 🚨 UI FIX: Backend က plan ပြန်ပို့ပေးလိုက်တာနဲ့ အလိုအလျောက် လက်ရှိ 'Today' ရက်စွဲကို ရွေးပေးထားမည်
  useEffect(() => {
    if (planData && planData.weekly_plan) {
      const todayIndex = planData.weekly_plan.findIndex(day => day.is_today);
      if (todayIndex !== -1) {
        setSelectedDayIdx(todayIndex);
      }
    }
  }, [planData]);

  // 🚨 NEW: Handle returning from Flashcard or Quiz page after completion
  useEffect(() => {
    const completedTaskId = searchParams.get('completed_task_id');
    if (completedTaskId) {
      const tid = parseInt(completedTaskId, 10);
      
      setCompletedTaskIds((prev) => {
        if (!isNaN(tid) && !prev.has(tid)) {
          const newSet = new Set(prev);
          newSet.add(tid);
          
          // Sync with backend immediately
          const token = localStorage.getItem('token');
          const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
          fetch(`${baseUrl}/api/tutor/tasks/${tid}/complete`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true',
            },
          })
          .then(() => fetchPlan(activeTopic)) // 🔥 Refresh plan after checking from URL
          .catch((err) => console.error('Failed to auto-sync returned task', err));
          
          return newSet;
        }
        return prev;
      });

      // Remove the parameter from URL to prevent re-triggering
      const currentTopic = searchParams.get('topic');
      router.replace(
        currentTopic 
          ? `${window.location.pathname}?topic=${encodeURIComponent(currentTopic)}` 
          : window.location.pathname,
        { scroll: false }
      );
    }
  }, [searchParams, router, activeTopic, fetchPlan]);

  // 🚨 NEW: Fetch Learning Path (Sync with Study Plan)
  const fetchLearningPath = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const studentId = localStorage.getItem('student_id') || 'STU_TEMP';
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
      
      const res = await fetch(
        `${baseUrl}/api/generate/learning-path/${studentId}?target_topic=${encodeURIComponent(activeTopic)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      if (!res.ok) throw new Error('Learning Path API ချိတ်ဆက်မှု မအောင်မြင်ပါ။');
      
      const data = await res.json();
      setLearningPath(data.learning_path || []);
      
      // Count trophies from learning path
      let newTrophies = 0;
      data.learning_path?.forEach((node: LearningPathNode) => {
        if (node.meta?.trophy) newTrophies++;
      });
      setTrophyCount(newTrophies);
      
      // If any celebration node exists, trigger UI celebration
      const celebrationNode = data.learning_path?.find((node: LearningPathNode) => node.meta?.celebration);
      if (celebrationNode) {
        // You can trigger confetti / celebration modal here
        console.log('🎉 Celebration triggered for:', celebrationNode.topic);
      }
      
    } catch (err) {
      console.error('Failed to fetch learning path:', err);
    }
  }, [activeTopic]);

  // 🚨 FIX: Toggle task completion with exact UI refresh and sync logic
  const toggleTaskCompletion = async (taskId: number) => {
    const isCurrentlyCompleted = completedTaskIds.has(taskId);
    
    // 1. Optimistic Update (UI တွင် အမှန်ခြစ် ချက်ချင်း ပေါ်စေရန်)
    setCompletedTaskIds((prev) => {
      const newSet = new Set(prev);
      isCurrentlyCompleted ? newSet.delete(taskId) : newSet.add(taskId);
      return newSet;
    });

    const token = localStorage.getItem('token');
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
    const actionEndpoint = isCurrentlyCompleted ? 'undo' : 'complete';

    try {
      await fetch(`${baseUrl}/api/tutor/tasks/${taskId}/${actionEndpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      // 2. Refresh Syncs
      await fetchLearningPath();
      
      // 🚨 ADDED LOGIC: UI ကို Backend က Data အတိုင်း လုံးဝ မှန်ကန်စေရန် အတင်းပြန်ခေါ်ပေးခြင်း
      await fetchPlan(activeTopic); 
      
    } catch (err) {
      console.error('Failed to sync task status with DB', err);
      // ပြဿနာတက်လျှင် UI တွင် အမှန်ခြစ်ကို မူလအတိုင်း ပြန်ထားမည်
      setCompletedTaskIds((prev) => {
        const newSet = new Set(prev);
        isCurrentlyCompleted ? newSet.add(taskId) : newSet.delete(taskId);
        return newSet;
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] px-6 py-10 max-w-3xl mx-auto animate-pulse">
        <div className="w-16 h-16 bg-slate-200 rounded-full mb-8" />
        <div className="h-10 bg-slate-200 rounded-xl w-3/4 mb-4" />
        <div className="h-4 bg-slate-200 rounded-full w-1/2 mb-10" />
        <div className="flex gap-3 mb-10 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-28 w-20 bg-slate-200 rounded-2xl shrink-0" />
          ))}
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-6">
              <div className="w-14 h-14 bg-slate-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-4 bg-slate-200 rounded-full w-1/4" />
                <div className="h-6 bg-slate-200 rounded-xl w-3/4" />
                <div className="h-20 bg-slate-200 rounded-2xl w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error / Empty state
  if (error || !planData?.weekly_plan || planData.weekly_plan.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center justify-center p-6 text-center">
        <Icons.EmptyBox />
        <h2 className="text-2xl font-extrabold text-[#3F4A3C] mb-3">
          {error || 'အစီအစဉ် မရှိသေးပါ'}
        </h2>
        <p className="text-[#3F4A3C]/60 mb-8 font-medium">
          Dashboard သို့မဟုတ် Pre-test သို့ ပြန်သွားပြီး လေ့လာမည့်ဘာသာရပ်ကို ရွေးချယ်ပါ။
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-[#8A8F4D] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-[#6f733e] transition-colors"
        >
          Dashboard သို့
        </button>
      </div>
    );
  }

  const currentDayPlan = planData.weekly_plan[selectedDayIdx] || planData.weekly_plan[0];
  const currentTasks = currentDayPlan?.tasks || [];
  const isAllDone = currentTasks.length > 0 && currentTasks.every((t) => completedTaskIds.has(t.id));

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#3F4A3C] font-sans relative overflow-hidden pb-32">
      {/* Background blur effects */}
      <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-[#C9785C]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-10%] w-[500px] h-[500px] bg-[#5F8B7E]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar with Subject Switcher & 🚨 Trophy Badge */}
      <header className="w-full px-6 py-5 relative z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#FFFDF8]/80 sticky top-0 border-b border-[#F4EBDD]/50 backdrop-blur-md">
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
          
          {/* Subject Switcher */}
          {planData.available_topics && planData.available_topics.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
              {planData.available_topics.map((sub, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveTopic(sub);
                    setSelectedDayIdx(0);
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border-2 ${
                    activeTopic === sub
                      ? 'border-[#5F8B7E] bg-[#5F8B7E] text-white shadow-sm'
                      : 'border-[#F4EBDD] bg-white text-[#3F4A3C]/60 hover:bg-[#F4EBDD]/50'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-6 relative z-10">
        {/* Cross-link button to Learning Path */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => router.push(`/learning-path?topic=${encodeURIComponent(activeTopic)}`)}
            className="flex items-center gap-2 text-sm font-bold bg-white text-[#5F8B7E] px-5 py-2.5 rounded-xl border-2 border-[#5F8B7E] hover:bg-[#5F8B7E] hover:text-white transition-all shadow-sm"
          >
            <Icons.Path /> View Full Milestone Path
          </button>
        </div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-[#F4EBDD] text-[#8A8F4D] rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner border border-white rotate-3">
            <Icons.Calendar />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            7-Day Study <span className="text-[#8A8F4D]">Calendar</span>
          </h1>
          <p className="text-[#3F4A3C]/60 font-semibold text-lg max-w-lg">
            {activeTopic
              ? `"${activeTopic}" ဘာသာရပ်အတွက် `
              : 'သင့်အတွက် '}{' '}
            AI မှ အထူးရေးဆွဲပေးထားသော တစ်ပတ်စာ ပြက္ခဒိန် အချိန်ဇယား။ ရက်စွဲတစ်ခုချင်းစီကို နှိပ်၍ လေ့လာပါ။
          </p>
        </motion.div>

        {/* 7-Day Calendar Strip */}
        <div className="flex overflow-x-auto gap-3 pb-6 mb-8 -mx-6 px-6 no-scrollbar snap-x">
          {planData.weekly_plan.map((day, idx) => {
            const isActive = selectedDayIdx === idx;
            // 🚨 FIXED: Use parseLocalDate instead of new Date() to prevent timezone offset
            const dateObj = parseLocalDate(day.date);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = dateObj.getDate();
            const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });

            const allTasksDone =
              day.tasks.length > 0 && day.tasks.every((t) => completedTaskIds.has(t.id));

            return (
              <button
                key={idx}
                onClick={() => setSelectedDayIdx(idx)}
                className={`snap-start shrink-0 w-[5.5rem] h-[6.5rem] rounded-[1.75rem] border-2 transition-all duration-300 flex flex-col items-center justify-center gap-0.5 relative group ${
                  isActive
                    ? 'border-[#8A8F4D] bg-[#8A8F4D] text-white shadow-xl shadow-[#8A8F4D]/30 scale-105 z-10'
                    : 'border-[#F4EBDD] bg-white text-[#3F4A3C]/70 hover:border-[#8A8F4D]/50 hover:bg-[#FFFDF8]'
                }`}
              >
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${
                    isActive ? 'text-white/90' : 'text-[#8A8F4D]'
                  }`}
                >
                  {day.is_today ? 'Today' : dayName}
                </span>
                <span className="text-2xl font-black tracking-tight">{dayNum}</span>
                <span
                  className={`text-[11px] font-bold ${
                    isActive ? 'text-white/80' : 'text-[#3F4A3C]/40'
                  }`}
                >
                  {monthName}
                </span>
                {allTasksDone && (
                  <span className="absolute -top-2 -right-2 bg-[#5F8B7E] text-white p-1 rounded-full border-2 border-white shadow-md">
                    <Icons.Check />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Banner */}
        <motion.div
          key={selectedDayIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-white p-6 rounded-3xl border-2 border-[#F4EBDD] flex flex-wrap items-center justify-between gap-4 shadow-sm"
        >
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#8A8F4D] bg-[#F4EBDD]/60 px-3 py-1 rounded-lg">
              {currentDayPlan.day_label} {currentDayPlan.is_today && '• Today'}
            </span>
            <h2 className="text-2xl font-black text-[#3F4A3C] mt-2">
              {/* 🚨 FIXED: Use parseLocalDate to display the correct unshifted date */}
              {parseLocalDate(currentDayPlan.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h2>
          </div>
          <div className="text-sm font-bold text-[#3F4A3C]/60 bg-[#FFFDF8] px-4 py-2 rounded-xl border border-[#F4EBDD]">
            Total Tasks: <span className="text-[#5F8B7E] font-black">{currentTasks.length}</span>
          </div>
        </motion.div>

        {/* Timeline Tasks List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDayIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 relative"
          >
            {currentTasks.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-[#F4EBDD]">
                <p className="text-[#3F4A3C]/50 font-bold text-lg">
                  ဤနေ့အတွက် သတ်မှတ်ထားသော တာဝန်များ မရှိသေးပါ။
                </p>
              </div>
            ) : (
              currentTasks.map((plan, index) => {
                const isCompleted = completedTaskIds.has(plan.id);
                const actionType = plan.action_type || 'chat';

                // Parse task string
                const parts = plan.task.split(' | ');
                const headerParts = parts[0].split(' - ');
                const timeLabel =
                  headerParts[0]?.trim() ||
                  (index === 0
                    ? 'Morning Focus'
                    : index === 1
                    ? 'Afternoon Practice'
                    : 'Evening Review');
                const fullActionTitle = headerParts.slice(1).join(' - ')?.trim() || plan.task;
                const details = parts[1]?.trim() || plan.details || '';

                // Extract chapter and action
                const actionSplit = fullActionTitle.split(' : ');
                const exactChapter =
                  actionSplit.length > 1 ? actionSplit[0].trim() : plan.focus;
                const exactAction =
                  actionSplit.length > 1 ? actionSplit.slice(1).join(' : ').trim() : fullActionTitle;

                const isMorning = timeLabel.toLowerCase().includes('morning');
                const isAfternoon = timeLabel.toLowerCase().includes('afternoon');
                const TimeIcon = isMorning ? Icons.Sun : isAfternoon ? Icons.Sunset : Icons.Moon;

                // 🚨 THE FIX: Completely rely on the Backend's action_type to determine button behavior.
                // If actionType is chat AND it is an evening task, we assume it's the upload/check phase.
                const isCheckWorkTask = actionType === 'chat' && timeLabel.toLowerCase().includes('evening');

                return (
                  <div key={plan.id} className="flex gap-4 md:gap-8 relative group mb-6">
                    {/* Vertical Timeline Line */}
                    {index !== currentTasks.length - 1 && (
                      <div
                        className={`absolute left-[1.6rem] md:left-[1.85rem] top-16 bottom-[-2rem] w-[2px] transition-colors duration-300 ${
                          isCompleted ? 'bg-[#5F8B7E]' : 'bg-[#F4EBDD]'
                        }`}
                      />
                    )}

                    {/* Icon Marker */}
                    <div className="flex flex-col items-center z-10 pt-1">
                      <button
                        onClick={() => toggleTaskCompletion(plan.id)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-[#FFFDF8] shadow-md transition-all duration-300 ${
                          isCompleted
                            ? 'bg-[#5F8B7E] text-white rotate-12 scale-110'
                            : isMorning
                            ? 'bg-[#F4EBDD] text-[#C9785C] hover:bg-[#ebdccc]'
                            : isAfternoon
                            ? 'bg-[#F4EBDD] text-amber-500 hover:bg-[#ebdccc]'
                            : 'bg-[#5F8B7E]/10 text-[#5F8B7E] hover:bg-[#5F8B7E]/20'
                        }`}
                      >
                        {isCompleted ? <Icons.Check /> : <TimeIcon />}
                      </button>
                    </div>

                    {/* Task Card */}
                    <div
                      className={`flex-1 bg-white rounded-3xl p-6 md:p-8 border-2 transition-all duration-300 ${
                        isCompleted
                          ? 'border-[#5F8B7E]/30 bg-[#5F8B7E]/5 opacity-70'
                          : 'border-[#F4EBDD] shadow-[0_10px_40px_rgb(63,74,60,0.04)] hover:border-[#8A8F4D]/50 hover:shadow-[0_15px_50px_rgb(63,74,60,0.08)]'
                      }`}
                    >
                      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                        <span
                          className={`text-xs font-black uppercase tracking-widest ${
                            isCompleted ? 'text-[#5F8B7E]' : 'text-[#8A8F4D]'
                          }`}
                        >
                          {timeLabel}
                        </span>
                        <span className="px-3 py-1.5 bg-[#FFFDF8] border border-[#F4EBDD] text-[#3F4A3C]/70 rounded-lg text-[11px] font-bold shadow-sm">
                          {plan.focus}
                        </span>
                      </div>

                      <h3
                        className={`text-xl md:text-2xl font-black mb-4 transition-colors ${
                          isCompleted
                            ? 'line-through text-[#3F4A3C]/40'
                            : 'text-[#3F4A3C]'
                        }`}
                      >
                        {fullActionTitle}
                      </h3>

                      {details && (
                        <div className="flex items-start gap-3 bg-[#FFFDF8] p-4 rounded-2xl border border-[#F4EBDD] mb-4">
                          <div className="mt-0.5 text-[#5F8B7E] shrink-0">
                            <Icons.Check />
                          </div>
                          <p className="text-[#3F4A3C]/85 font-semibold text-sm leading-relaxed">
                            {details}
                          </p>
                        </div>
                      )}

                      {/* 🚨 UPDATED ACTION BUTTON LOGIC (Follows Backend Exact action_type) */}
                      <div className="mt-4 flex flex-col md:flex-row justify-end gap-3">
                        {isCompleted ? (
                          <button
                            onClick={() => toggleTaskCompletion(plan.id)}
                            className="text-sm font-black px-6 py-2.5 rounded-xl transition-all shadow-sm bg-[#3F4A3C]/10 text-[#3F4A3C]/60 hover:bg-[#3F4A3C]/20"
                          >
                            ✅ ပြီးမြောက်ပါပြီ (Undo)
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              // Priority 1: Quiz (Exact Match)
                              if (actionType === 'quiz') {
                                localStorage.setItem(
                                  'quiz_intent',
                                  JSON.stringify({
                                    topic: `${activeTopic} ဘာသာရပ်မှ ${exactChapter}`,
                                    type: 'general',
                                    is_chapter_quiz: true,
                                    taskId: plan.id
                                  })
                                );
                                router.push(`/quiz?taskId=${plan.id}&from=study_plan`);
                              } 
                              // Priority 2: Flashcards (Exact Match)
                              else if (actionType === 'flashcard') {
                                router.push(`/flashcards-vault?taskId=${plan.id}&from=study_plan`);
                              } 
                              // Priority 3: Evening Check (If it's chat AND an evening task)
                              else if (isCheckWorkTask) {
                                router.push(
                                  `/chat?taskId=${plan.id}&subject=${encodeURIComponent(activeTopic)}&chapter=${encodeURIComponent(exactChapter)}&action=${encodeURIComponent(timeLabel + " - " + exactAction)}&details=${encodeURIComponent(details)}&mode=check`
                                );
                              } 
                              // Priority 4: Default Morning/Afternoon Chat Learning
                              else {
                                router.push(
                                  `/chat?taskId=${plan.id}&subject=${encodeURIComponent(activeTopic)}&chapter=${encodeURIComponent(exactChapter)}&action=${encodeURIComponent(timeLabel + " - " + exactAction)}&details=${encodeURIComponent(details)}`
                                );
                              }
                            }}
                            className="flex items-center justify-center gap-2 text-sm font-black px-6 py-2.5 rounded-xl transition-all shadow-md bg-[#5F8B7E] text-white hover:bg-[#4d7065] hover:-translate-y-0.5"
                          >
                            <Icons.Sparkles />{' '}
                            {(() => {
                              if (actionType === 'quiz') return 'Mini Quiz ဖြေဆိုမည်';
                              if (actionType === 'flashcard') return 'Flashcards လေ့ကျင့်မည်';
                              if (isCheckWorkTask) {
                                return (
                                  <span className="flex items-center gap-2">
                                    <Icons.Upload /> ပုံတင်ပြီး စစ်ဆေးမည်
                                  </span>
                                );
                              }
                              return 'AI ဖြင့် စတင်လေ့လာမည်';
                            })()}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>

        {/* All Done Celebration Banner */}
        {isAllDone && currentTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 p-8 text-center bg-[#8A8F4D] text-white rounded-3xl shadow-xl"
          >
            <h2 className="text-3xl font-black mb-2">🎉 ဤနေ့အတွက် အားလုံးပြီးစီးပါပြီ!</h2>
            <p className="font-medium text-white/90 text-lg">
              ရွေးချယ်ထားသော နေ့အတွက် သတ်မှတ်ထားသည့် လေ့လာမှု တာဝန်အားလုံးကို အောင်မြင်စွာ ပြီးမြောက်သွားပါပြီ။ ဂုဏ်ယူပါတယ်။
            </p>
          </motion.div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` }} />
    </div>
  );
}
export default function StudyPlanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFDF8] flex items-center justify-center text-[#5F8B7E] font-bold">
          Loading Study Plan...
        </div>
      }
    >
      <StudyPlanContent />
    </Suspense>
  );
}