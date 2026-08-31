'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useSession } from 'next-auth/react'; 

// ==========================================
// 1. HARDCODED ARCHITECTURE DATA
// ==========================================
const grades = [
  { id: 'g10', title: 'Grade 10', label: 'စနစ်သစ် (KG+12)', desc: 'အခြေခံအထက်တန်း ပထမနှစ်' },
  { id: 'g11', title: 'Grade 11', label: 'စနစ်သစ် (KG+12)', desc: 'အခြေခံအထက်တန်း ဒုတိယနှစ်' },
  { id: 'g12', title: 'Grade 12', label: 'စနစ်သစ် (KG+12)', desc: 'တက္ကသိုလ်ဝင်တန်း နောက်ဆုံးနှစ်' }
];

// 🚨 THE FIX: STAMS-1 နှင့် STAMS-2 ဟု နာမည်နှင့် ID များကို အတိအကျ ပြင်ဆင်ထားပါသည် 🚨
const streams = [
  { 
    id: 'steams-1', 
    title: 'STEAMS-1 (သိပ္ပံတွဲ - Bio)', 
    icon: '🧬', 
    desc: 'ဆေးတက္ကသိုလ်၊ သွားဘက်ဆိုင်ရာနှင့် ဇီဝသိပ္ပံပညာရပ်များအတွက် (Physics, Chemistry, Biology)',
  },
  { 
    id: 'steams-2', 
    title: 'STEAMS-2 (သိပ္ပံတွဲ - Eco)', 
    icon: '📊', 
    desc: 'စီးပွားရေးတက္ကသိုလ်၊ ကွန်ပျူတာနှင့် နည်းပညာပညာရပ်များအတွက် (Physics, Chemistry, Economics)',
  },
  { 
    id: 'stams-1', 
    title: 'STAMS-1 (ဝိဇ္ဇာတွဲရိုးရိုး)', 
    icon: '🌍', 
    desc: 'ဝိဇ္ဇာပညာရပ်များ၊ ပညာရေးနှင့် လူမှုရေးသိပ္ပံပညာရပ်များအတွက် (Geography, History, Economics)',
  },
  { 
    id: 'stams-2', 
    title: 'STAMS-2 (စိတ်ကြိုက်မြန်မာစာ ဝိဇ္ဇာတွဲ)', 
    icon: '📜', 
    desc: 'မြန်မာစာပေ၊ ဥပဒေနှင့် နိုင်ငံရေးပညာရပ်များအတွက် (Optional Myanmar, Social Science, Economics)',
  }
];

const learningGoals = [
  { id: 'goal_basic', emoji: '🌱', text: 'အခြေခံမှစတင်ပြီး သေချာနားလည်ချင်ပါတယ်', sub: 'ဖောင်ဒေးရှင်း သေချာပြန်ဆောက်လိုသူများအတွက်' },
  { id: 'goal_exam', emoji: '🎯', text: 'စာမေးပွဲတွင် အမှတ်ကောင်းကောင်းရလိုပါသည်', sub: 'မေးခွန်းဟောင်းများနှင့် Exam Tricks များ လေ့လာရန်' },
  { id: 'goal_ai', emoji: '🤖', text: 'AI ဖြင့် အပြန်အလှန် မေးခွန်းများ လေ့ကျင့်မည်', sub: 'Active Recall နည်းလမ်းဖြင့် မေးခွန်းထုတ်လေ့ကျင့်ရန်' },
  { id: 'goal_revision', emoji: '⚡', text: 'သင်ခန်းစာများကို အချိန်တိုအတွင်း ပြန်နွှေးမည်', sub: 'စာမေးပွဲနီးကပ်ချိန် Crash Course ပုံစံလေ့လာရန်' }
];

// ==========================================
// 2. REUSABLE CARDS & COMPONENTS
// ==========================================
const ProgressStep = ({ num, active, label }: { num: number; active: boolean; label: string }) => (
  <div className="flex flex-col items-center flex-1">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold transition-all duration-500 border-2 ${
      active ? 'bg-[#5F8B7E] border-[#5F8B7E] text-white shadow-md scale-110' : 'bg-white text-[#3F4A3C]/40 border-[#F4EBDD]'
    }`}>
      {num}
    </div>
    <span className={`text-[11px] font-bold mt-2 hidden md:block tracking-wide transition-colors ${active ? 'text-[#5F8B7E]' : 'text-[#3F4A3C]/40'}`}>{label}</span>
  </div>
);

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user: storeUser, updateProfile } = useAuthStore();
  
  const combinedUser = { ...(session?.user || {}), ...(storeUser || {}) } as any;

  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const pyToken = localStorage.getItem('token');
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');

      if (!pyToken && status === 'unauthenticated') {
        window.location.href = '/';
        return;
      }

      if (pyToken) {
        try {
          const res = await fetch(`${baseUrl}/api/knowledge/dashboard`, {
            headers: { 'Authorization': `Bearer ${pyToken}`, 'ngrok-skip-browser-warning': 'true'}
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data?.profile?.grade && data.profile.grade !== "Not set" && data.profile.grade !== "Pending") {
              window.location.href = '/dashboard';
              return;
            }
          }
          setIsMounted(true); 
        } catch (error) {
          setIsMounted(true);
        }
      } else if (status === 'authenticated') {
        setIsMounted(true);
      }
    };

    checkOnboardingStatus();
  }, [status]);

  const getStreamTitle = (streamId: string) => {
    return streams.find(s => s.id === streamId)?.title || streamId;
  };

  const handleFinishOnboarding = async () => {
    if (!selectedGrade || !selectedStream || !selectedGoal) return;
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
      
      const studentId = combinedUser?.id || localStorage.getItem('student_id') || `STU_${Date.now()}`;
      const studentName = combinedUser?.fullName || combinedUser?.name || "Student";
      
      const subjectComboText = getStreamTitle(selectedStream);

      const res = await fetch(`${baseUrl}/api/student/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          student_id: studentId,
          name: studentName,
          grade: selectedGrade,
          subject_combo: subjectComboText,
          goal: selectedGoal
        })
      });

      if (res.ok) {
        updateProfile({ 
          grade: selectedGrade, 
          stream: selectedStream, 
          goal: selectedGoal,
          isOnboarded: true
        });
        router.replace('/dashboard');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`❌ Error: ${errorData.detail?.[0]?.msg || 'သိမ်းဆည်း၍မရပါ'}`);
      }
    } catch (error) {
      alert('❌ ဆက်သွယ်မှု ပြတ်တောက်သွားပါသည်။ ပြန်လည်ကြိုးစားပါ။');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isMounted || (status === 'loading' && !localStorage.getItem('token'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF8] text-[#5F8B7E] font-bold">
        Loading Setup...
      </div>
    );
  }

  const containerVariants = {
    initial: { opacity: 0, x: 50, filter: "blur(4px)" },
    animate: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -50, filter: "blur(4px)", transition: { duration: 0.3, ease: "easeIn" } }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFDF8] text-[#3F4A3C] p-4 md:p-8 font-sans antialiased tracking-tight relative overflow-hidden selection:bg-[#F4EBDD] selection:text-[#5F8B7E]">
      
      <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] bg-[#5F8B7E] rounded-full mix-blend-multiply filter blur-[150px] opacity-10 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-12%] right-[-10%] w-[600px] h-[600px] bg-[#C9785C] rounded-full mix-blend-multiply filter blur-[150px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-xl rounded-full p-4 md:p-6 shadow-[0_8px_30px_rgb(63,74,60,0.04)] border border-[#F4EBDD] mb-6 flex items-center justify-between z-10">
        <ProgressStep num={1} active={step >= 1} label="အတန်း" />
        <div className={`h-1 flex-1 rounded-full transition-colors duration-500 ${step >= 2 ? 'bg-[#5F8B7E]' : 'bg-[#F4EBDD]'}`}></div>
        <ProgressStep num={2} active={step >= 2} label="ဘာသာတွဲ" />
        <div className={`h-1 flex-1 rounded-full transition-colors duration-500 ${step >= 3 ? 'bg-[#5F8B7E]' : 'bg-[#F4EBDD]'}`}></div>
        <ProgressStep num={3} active={step >= 3} label="ရည်မှန်းချက်" />
        <div className={`h-1 flex-1 rounded-full transition-colors duration-500 ${step >= 4 ? 'bg-[#5F8B7E]' : 'bg-[#F4EBDD]'}`}></div>
        <ProgressStep num={4} active={step >= 4} label="အတည်ပြုချက်" />
      </div>

      <div className="w-full max-w-3xl bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_rgb(63,74,60,0.06)] border border-[#F4EBDD] p-6 md:p-12 z-10 min-h-[550px] flex flex-col justify-between">
        
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div key="step1" variants={containerVariants} initial="initial" animate="animate" exit="exit" className="w-full">
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-5xl font-extrabold text-[#3F4A3C] tracking-tighter mb-4">ဘယ်အတန်းကို တက်ရောက်မှာလဲ?</h1>
                <p className="font-semibold text-[#3F4A3C]/60 text-lg">သင်ယူမည့် အတန်းပညာရေးအဆင့်ကို အရင်ဆုံး ရွေးချယ်ပေးပါ။</p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {grades.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => { setSelectedGrade(g.title); setStep(2); }}
                    className={`p-6 rounded-3xl text-center border-2 transition-all duration-300 ${
                      selectedGrade === g.title 
                      ? 'border-[#5F8B7E] bg-[#F4EBDD]/50 shadow-md scale-105' 
                      : 'border-[#F4EBDD] bg-white hover:bg-[#F4EBDD]/30 hover:border-[#8A8F4D]'
                    }`}
                  >
                    <span className="text-5xl block mb-4">🎓</span>
                    <h3 className="font-extrabold text-xl text-[#3F4A3C]">{g.title}</h3>
                    <p className="text-xs font-bold text-[#8A8F4D] mt-1.5 tracking-wider uppercase">{g.label}</p>
                    <p className="text-sm text-[#3F4A3C]/50 mt-3 font-medium">{g.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={containerVariants} initial="initial" animate="animate" exit="exit" className="w-full">
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-5xl font-extrabold text-[#3F4A3C] tracking-tighter mb-4">ဘာသာတွဲ ရွေးချယ်ပါ</h1>
                <p className="font-semibold text-[#3F4A3C]/60 text-lg">{selectedGrade} အတွက် တက်ရောက်မည့် မေဂျာလိုင်းကို ရွေးချယ်ပေးပါ။</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {streams.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedStream(s.id); setStep(3); }}
                    className={`p-6 rounded-3xl text-center border-2 transition-all duration-300 flex flex-col items-center justify-center ${
                      selectedStream === s.id 
                      ? 'border-[#5F8B7E] bg-[#F4EBDD]/50 shadow-md scale-105' 
                      : 'border-[#F4EBDD] bg-white hover:bg-[#F4EBDD]/30 hover:border-[#8A8F4D]'
                    }`}
                  >
                    <span className="text-5xl mb-3">{s.icon}</span>
                    <h2 className="text-xl font-extrabold mb-2 text-[#3F4A3C]">{s.title}</h2>
                    <p className="text-sm font-medium text-[#3F4A3C]/60 leading-relaxed">{s.desc}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="mt-8 font-bold text-sm text-[#8A8F4D] hover:text-[#5F8B7E] transition-colors">← အတန်းပြန်ရွေးရန်</button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={containerVariants} initial="initial" animate="animate" exit="exit" className="w-full">
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-5xl font-extrabold text-[#3F4A3C] tracking-tighter mb-4">သင်၏ ရည်မှန်းချက် 🌟</h1>
                <p className="font-semibold text-[#3F4A3C]/60 text-lg">ယခုပညာသင်နှစ်တွင် AI Mentor နှင့်အတူ မည်သည့်အရာကို အဓိကရယူချင်ပါသလဲ?</p>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto mb-8">
                {learningGoals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => { setSelectedGoal(g.text); setStep(4); }}
                    className={`w-full p-5 text-left rounded-3xl border-2 flex items-center gap-5 transition-all ${
                      selectedGoal === g.text 
                      ? 'border-[#5F8B7E] bg-[#F4EBDD]/50 shadow-md' 
                      : 'border-[#F4EBDD] bg-white hover:bg-[#F4EBDD]/30'
                    }`}
                  >
                    <span className="text-3xl p-3 bg-white rounded-2xl shadow-sm border border-[#F4EBDD]">{g.emoji}</span>
                    <div>
                      <h4 className="font-extrabold text-lg text-[#3F4A3C]">{g.text}</h4>
                      <p className="text-sm font-medium text-[#3F4A3C]/60 mt-1">{g.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="font-bold text-sm text-[#8A8F4D] hover:text-[#5F8B7E] transition-colors">← ဘာသာတွဲပြန်ရွေးရန်</button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" variants={containerVariants} initial="initial" animate="animate" exit="exit" className="w-full text-center">
              <div className="w-24 h-24 bg-[#F4EBDD] rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner border border-[#8A8F4D]/20 animate-bounce">
                🌱
              </div>
              <h1 className="text-4xl font-extrabold mb-3 text-[#3F4A3C] tracking-tighter">အားလုံး အဆင်သင့်ပါပဲ!</h1>
              <p className="font-medium text-[#3F4A3C]/60 mb-8 text-lg">သင်ရွေးချယ်ထားသော အချက်အလက်များ မှန်ကန်ပါက Dashboard သို့ ဝင်ရောက်နိုင်ပါပြီ။</p>

              <div className="max-w-md mx-auto bg-[#FFFDF8] border border-[#F4EBDD] rounded-3xl p-6 text-left space-y-4 shadow-sm mb-10 font-bold text-base">
                <div className="flex justify-between border-b border-[#F4EBDD] pb-3"><span className="text-[#3F4A3C]/50">အတန်း:</span><span className="text-[#3F4A3C]">{selectedGrade}</span></div>
                <div className="flex justify-between border-b border-[#F4EBDD] pb-3"><span className="text-[#3F4A3C]/50">ဘာသာတွဲ:</span><span className="text-[#5F8B7E]">{getStreamTitle(selectedStream)}</span></div>
                <div className="flex justify-between pb-1"><span className="text-[#3F4A3C]/50">ရည်မှန်းချက်:</span><span className="text-[#3F4A3C] text-right max-w-[200px] line-clamp-1">{selectedGoal}</span></div>
              </div>

              <div className="flex justify-between items-center max-w-md mx-auto">
                <button onClick={() => setStep(3)} className="font-bold text-sm text-[#8A8F4D] hover:text-[#5F8B7E] transition-colors">← ပြန်ပြင်ရန်</button>
                <button
                  onClick={handleFinishOnboarding}
                  disabled={submitting}
                  className="px-10 py-4 bg-[#5F8B7E] text-[#FFFDF8] font-bold text-lg rounded-full shadow-[0_8px_20px_rgb(95,139,126,0.3)] hover:bg-[#4a6d62] disabled:opacity-70 transition-all"
                >
                  {submitting ? 'စနစ်ပြင်ဆင်နေပါသည်...' : 'Launch Dashboard 🚀'}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}