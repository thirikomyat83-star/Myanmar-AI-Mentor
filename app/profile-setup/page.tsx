'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useSession } from 'next-auth/react'; 

// ==========================================
// 1. DATA DEFINITIONS & ICONS
// ==========================================
const avatars = [
  { id: '1', emoji: '🧑‍🎓', tag: 'Male Student' },
  { id: '2', emoji: '👩‍🎓', tag: 'Female Student' },
  { id: '3', emoji: '👨‍💻', tag: 'Dev Boy' },
  { id: '4', emoji: '👩‍💻', tag: 'Dev Girl' },
  { id: '5', emoji: '🦊', tag: 'Smart Fox' },
  { id: '6', emoji: '🦉', tag: 'Wise Owl' },
  { id: '7', emoji: '🐼', tag: 'Chill Panda' },
  { id: '8', emoji: '🦁', tag: 'Brave Lion' },
];

const CameraIcon = () => (
  <svg className="w-5 h-5 text-[#5F8B7E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <circle cx="12" cy="13" r="3" strokeWidth="2" />
  </svg>
);

// ==========================================
// 2. MAIN COMPONENT (Eco-Premium Theme)
// ==========================================
export default function ProfileSetupPage() {
  const router = useRouter();
  
  // NextAuth (Google Login) နှင့် Store ဒေတာ
  const { data: session, status } = useSession();
  const { user: storeUser, updateProfile } = useAuthStore(); 
  
  const combinedUser = { ...(session?.user || {}), ...(storeUser || {}) };

  const [isReady, setIsReady] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedAvatar, setSelectedAvatar] = useState('1');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  
  const [errors, setErrors] = useState({ name: '', username: '' });
  const [loading, setLoading] = useState(false);

  // Authentication & Route Guard
  useEffect(() => {
    // ၁။ Python ကပေးတဲ့ Token ကို အရင်ရှာပါမည်
    const pyToken = localStorage.getItem('token');

    // ၂။ Token ရှိနေရင် (Python နဲ့ ဝင်ထားရင်) အဆင်ပြေပါတယ်၊ ဆက်သွားခွင့်ပေးပါမည်။
    if (pyToken) {
      setIsReady(true);
      return;
    }

    // ၃။ Token လည်းမရှိဘူး၊ Google လည်း မဝင်ထားဘူးဆိုမှသာ Home ကို ပြန်ကန်ချပါမည်။
    if (!pyToken && status === 'unauthenticated') {
      window.location.href = '/'; 
      return;
    }

    // ၄။ Google နဲ့ ဝင်ထားရင်လည်း ဆက်သွားခွင့်ပေးပါမည်။
    if (status === 'authenticated') {
      setIsReady(true);
    }
  }, [status]); 

  const handleValidationCheck = () => {
    let passed = true;
    const currentErrors = { name: '', username: '' };

    if (fullName.trim().length < 3) {
      currentErrors.name = 'နာမည်သည် အနည်းဆုံး စာလုံး ၃ လုံး ရှိရပါမည်။';
      passed = false;
    }
    
    // Strict Regex: Alphanumeric and underscores only, 3-15 chars
    const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
    if (!usernameRegex.test(username)) {
      currentErrors.username = 'Username သည် ၃ လုံးမှ ၁၅ လုံးအတွင်း (အင်္ဂလိပ်စာလုံး/ဂဏန်း) ပဲဖြစ်ရပါမည်။';
      passed = false;
    }

    setErrors(currentErrors);
    if (passed) setStep(2);
  };

  // ==========================================
  // 🚀 3. API INTEGRATION (Modified for Backend)
  // ==========================================
  const handleUploadProfile = async () => {
    setLoading(true);
    try {
      const avatarEmoji = avatars.find(a => a.id === selectedAvatar)?.emoji || '🧑‍🎓';
      const token = localStorage.getItem('token');
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
      
      // 🌟 Student ID ကို Generate လုပ်ခြင်း သို့မဟုတ် Session မှယူခြင်း
      const studentId = combinedUser?.id || localStorage.getItem('student_id') || `STU_${Date.now()}`;
      localStorage.setItem('student_id', studentId); // အခြား Page များအတွက် သိမ်းထားမည်
      
      // 🚨 Python Backend ရှိ /api/student/register သို့ လှမ်းပို့ပါမည်
      // မှတ်ချက်: Onboarding မရောက်သေးသဖြင့် ကျန်သော Data များကို "Pending" ဟု ယာယီထည့်ထားပါသည်
      const res = await fetch(`${baseUrl}/api/student/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true' 
        },
        body: JSON.stringify({
          student_id: studentId,
          name: fullName,
          grade: "Pending",           // Onboarding တွင် ထပ်ဖြည့်မည်
          subject_combo: "Pending",   // Onboarding တွင် ထပ်ဖြည့်မည်
          goal: bio.trim() || "Pending", // Bio ကို Goal အဖြစ် ယာယီသိမ်းထားနိုင်သည်
          weak_subjects: []           // Onboarding တွင် ထပ်ဖြည့်မည်
        })
      });

      if (res.ok) {
        // 🚨 Database သိမ်းတာ အောင်မြင်ရင် Frontend (Zustand) ကိုပါ Update လုပ်မည်
        updateProfile({
          fullName,
          username: username.toLowerCase(),
          bio: bio.trim(),
          avatar: avatarEmoji,
          hasProfile: true
        });
        
        // Onboarding သို့ ဆက်ပို့မည်
        router.replace('/onboarding');
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Profile သိမ်းဆည်းခြင်း မအောင်မြင်ပါ။", errorData);
        alert(`❌ Error: ${errorData.detail?.[0]?.msg || 'Profile သိမ်းဆည်း၍မရပါ'}`);
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert('❌ ဆက်သွယ်မှု ပြတ်တောက်သွားပါသည်။ ပြန်လည်ကြိုးစားပါ။');
    } finally {
      setLoading(false);
    }
  };

  // Loading ပြနေချိန်တွင် White Screen မဖြစ်စေရန်
  if (!isReady || (status === 'loading' && !localStorage.getItem('token'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF8] text-[#5F8B7E] font-bold">
        Loading Setup...
      </div>
    );
  }

  // Animation Matrix
  const cardVariants = {
    initial: { opacity: 0, scale: 0.97, y: 15 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.97, y: -15, transition: { duration: 0.3 } }
  };

  return (
    // Base Background: Off-White/Cream (#FFFDF8) with Dark Charcoal text (#3F4A3C)
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFDF8] text-[#3F4A3C] p-6 font-sans antialiased tracking-tight relative overflow-hidden selection:bg-[#F4EBDD] selection:text-[#5F8B7E]">
      
      {/* Soft Eco Ambient Layers */}
      <div className="absolute top-[-5%] right-[-5%] w-[450px] h-[450px] bg-[#C9785C] rounded-full mix-blend-multiply filter blur-[140px] opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[550px] h-[550px] bg-[#5F8B7E] rounded-full mix-blend-multiply filter blur-[150px] opacity-10 animate-pulse pointer-events-none"></div>

      {/* Header Segment */}
      <div className="w-full max-w-2xl mb-8 z-10 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full bg-white border border-[#F4EBDD] text-[#8A8F4D] font-extrabold text-xs mb-4 shadow-sm tracking-widest uppercase">
          PROFILE STEP {step} / 2
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-[#3F4A3C] tracking-tighter">ကိုယ်ရေးအကျဉ်း ဖြည့်စွက်ပါ</h1>
        <p className="text-base font-semibold text-[#3F4A3C]/60">AI System မှ သင့်ကို မှတ်မိနိုင်ရန် ဒေတာများ ထည့်သွင်းပေးပါ။</p>
      </div>

      {/* Main Glassmorphism Card */}
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_rgb(63,74,60,0.06)] border border-[#F4EBDD] p-6 md:p-10 z-10">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: AVATAR & UNIQUE IDENTIFIERS */}
          {step === 1 && (
            <motion.div key="s1" variants={cardVariants} initial="initial" animate="animate" exit="exit" className="w-full">
              
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-6 group cursor-pointer">
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-[#F4EBDD]/50 shadow-md flex items-center justify-center text-6xl transition-transform group-hover:scale-105 duration-300">
                    {avatars.find(a => a.id === selectedAvatar)?.emoji}
                  </div>
                  <div className="absolute bottom-0 right-1 w-10 h-10 bg-white rounded-full border-2 border-[#F4EBDD] flex items-center justify-center shadow-sm">
                    <CameraIcon />
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2.5 bg-[#FFFDF8] p-3 rounded-3xl border border-[#F4EBDD] max-w-md shadow-inner">
                  {avatars.map((a) => (
                    <button key={a.id} onClick={() => setSelectedAvatar(a.id)} className={`text-2xl w-11 h-11 rounded-full flex items-center justify-center transition-all ${selectedAvatar === a.id ? 'bg-[#5F8B7E]/10 shadow-sm scale-110 border-2 border-[#5F8B7E]' : 'opacity-50 hover:opacity-100 hover:scale-105 hover:bg-white'}`}>
                      {a.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-extrabold text-[#3F4A3C]/80 mb-2 pl-1">နာမည်အပြည့်အစုံ</label>
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={e => { setFullName(e.target.value); setErrors({...errors, name: ''}); }} 
                    placeholder="ဥပမာ - မောင်မောင်" 
                    className={`w-full p-4 bg-[#FFFDF8] border-2 rounded-2xl text-base font-bold text-[#3F4A3C] outline-none transition-all placeholder:text-[#3F4A3C]/30 ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-[#F4EBDD] focus:border-[#5F8B7E] focus:shadow-[0_0_0_4px_rgb(95,139,126,0.1)]'}`} 
                  />
                  {errors.name && <p className="text-[#C9785C] text-xs font-extrabold mt-2 pl-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-[#3F4A3C]/80 mb-2 pl-1">Username (အင်္ဂလိပ်စာလုံး)</label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={e => { setUsername(e.target.value.replace(/\s/g, '')); setErrors({...errors, username: ''}); }} 
                    placeholder="ဥပမာ - mgmg_123" 
                    className={`w-full p-4 bg-[#FFFDF8] border-2 rounded-2xl text-base font-bold text-[#3F4A3C] outline-none transition-all placeholder:text-[#3F4A3C]/30 ${errors.username ? 'border-red-400 focus:border-red-500' : 'border-[#F4EBDD] focus:border-[#5F8B7E] focus:shadow-[0_0_0_4px_rgb(95,139,126,0.1)]'}`} 
                  />
                  {errors.username && <p className="text-[#C9785C] text-xs font-extrabold mt-2 pl-1">{errors.username}</p>}
                </div>
              </div>

              <button onClick={handleValidationCheck} className="mt-8 w-full py-4 bg-[#5F8B7E] text-white rounded-full font-extrabold text-lg shadow-[0_8px_20px_rgb(95,139,126,0.3)] hover:bg-[#4a6d62] transition-all flex justify-center items-center gap-2">
                နောက်တစ်ဆင့် သို့ →
              </button>
            </motion.div>
          )}

          {/* STEP 2: BIO BIOGRAPHY META DATA */}
          {step === 2 && (
            <motion.div key="s2" variants={cardVariants} initial="initial" animate="animate" exit="exit" className="w-full">
              <button onClick={() => setStep(1)} className="mb-6 font-bold text-sm text-[#8A8F4D] hover:text-[#5F8B7E] transition-colors">← ရှေ့ဆင့်သို့ ပြန်ပြင်ရန်</button>

              <div className="bg-[#FFFDF8] border border-[#F4EBDD] rounded-3xl p-5 flex items-center gap-5 mb-8 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-white border border-[#F4EBDD] flex items-center justify-center text-4xl shadow-sm">{avatars.find(a => a.id === selectedAvatar)?.emoji}</div>
                <div>
                  <h4 className="text-xl font-extrabold leading-none mb-1.5 text-[#3F4A3C]">{fullName}</h4>
                  <p className="text-xs font-bold text-[#5F8B7E] uppercase tracking-wider">@{username.toLowerCase()}</p>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-extrabold text-[#3F4A3C]/80 mb-2 pl-1">ကိုယ်ရေးအကျဉ်း (Bio) <span className="opacity-50 font-semibold">(Optional)</span></label>
                <textarea 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  placeholder="သင့်အကြောင်း သို့မဟုတ် ဝါသနာများကို အနည်းငယ် ရေးသားနိုင်ပါသည်..." 
                  rows={4} 
                  className="w-full p-5 bg-[#FFFDF8] border-2 border-[#F4EBDD] rounded-2xl text-base font-bold text-[#3F4A3C] outline-none focus:border-[#5F8B7E] focus:shadow-[0_0_0_4px_rgb(95,139,126,0.1)] transition-all resize-none placeholder:text-[#3F4A3C]/30" 
                />
              </div>

              <button onClick={handleUploadProfile} disabled={loading} className="w-full py-4 bg-[#5F8B7E] text-white rounded-full font-extrabold text-lg shadow-[0_8px_20px_rgb(95,139,126,0.3)] hover:bg-[#4a6d62] disabled:opacity-70 transition-all flex justify-center items-center">
                {loading ? (
                  <div className="flex gap-1.5 items-center"><span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce"></span><span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce delay-75"></span><span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce delay-150"></span></div>
                ) : (
                  'အကောင့်တည်ဆောက်မှု အတည်ပြုမည် 🚀'
                )}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}