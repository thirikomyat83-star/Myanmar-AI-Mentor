'use client'

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // 🚨 Sign Up ဖြစ်နေလျှင် Password နှစ်ခု တူမတူ စစ်ဆေးမည်
    if (!isLogin) {
      const confirmPassword = formData.get('confirmPassword') as string;
      if (password !== confirmPassword) {
        setError('❌ Password နှစ်ခု မတူညီပါ။ ကျေးဇူးပြု၍ ပြန်စစ်ပါ။');
        return;
      }
    }

    setLoading(true);

    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');

    try {
      if (isLogin) {
        // ==========================================
        // 🔹 LOGIN FLOW (ULTIMATE FIX)
        // ==========================================
        const res = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({ email: email, password: password })
        });
        
        const data = await res.json();

        if (!res.ok) {
          setError(`❌ ${data.detail || 'Email သို့မဟုတ် Password မှားနေပါသည်။'}`);
          setLoading(false);
          return;
        } 
        
        const token = data.access_token || data.token;
        const studentId = data.student_id || data.user?.id; 
        
        localStorage.setItem('token', token);
        if (studentId) {
          localStorage.setItem('student_id', studentId);
        }

        // 🚨 Backend မှ Dashboard Profile အချက်အလက်များကို ချက်ချင်း လှမ်းဆွဲပါမည်
        try {
          const profileRes = await fetch(`${baseUrl}/api/knowledge/dashboard?student_id=${studentId}`, {
            headers: { 
              'Authorization': `Bearer ${token}`, 
              'ngrok-skip-browser-warning': 'true'
            }
          });
          
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const p = profileData.profile || profileData; 

            localStorage.setItem('name', p.username || p.name || 'Student');
            localStorage.setItem('username', p.username || p.name || 'Student');
            localStorage.setItem('grade', p.grade || 'Pending');
            localStorage.setItem('avatar', p.avatar || '🧑‍🎓');
            localStorage.setItem('subject_combo', p.subject_combo || '');
            localStorage.setItem('weak_subjects', JSON.stringify(p.weak_subjects || []));

            localStorage.setItem('user', JSON.stringify(p));
            localStorage.setItem('profile', JSON.stringify(p));
            localStorage.setItem('student_profile', JSON.stringify(p));

            if (p.grade && p.grade !== "Pending" && p.grade.trim() !== "") {
              router.push('/dashboard'); 
            } else {
              router.push('/profile-setup'); 
            }
          } else {
            router.push('/profile-setup');
          }
        } catch (err) {
          console.error("Profile စစ်ဆေး၍မရပါ:", err);
          router.push('/dashboard'); 
        }

      } else {
        // ==========================================
        // 🔹 SIGNUP FLOW
        // ==========================================
        const fullName = email.split('@')[0];

        const res = await fetch(`${baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'ngrok-skip-browser-warning': 'true' 
          },
          body: JSON.stringify({ email: email, password: password, full_name: fullName })
        });

        const data = await res.json();

        if (!res.ok) {
          setError(`❌ ${data.detail || 'အကောင့်ဖွင့်၍မရပါ'}`);
          setLoading(false);
          return;
        } 
        
        const token = data.access_token || data.token;
        const studentId = data.student_id;
        
        localStorage.setItem('token', token);
        if (studentId) {
          localStorage.setItem('student_id', studentId);
        }

        router.push('/profile-setup');
      }
    } catch (err) {
      setError('❌ ဆက်သွယ်မှု ပြတ်တောက်သွားပါသည်။ Server URL မှန်/မမှန် စစ်ဆေးပါ။');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log("Google Login button clicked!");
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error("Google Login Error:", error);
      setError('❌ Google အကောင့်ဖြင့် ဝင်ရောက်၍မရပါ။ နောက်တစ်ကြိမ် ကြိုးစားကြည့်ပါ။');
    }
  };

  const openAuth = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setError('');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* --- Navbar (Clean & Solid) --- */}
      <nav className="w-full bg-white border-b-2 border-gray-100 px-6 py-3.5 flex justify-between items-center fixed top-0 z-40">
        <div className="text-2xl font-bold text-teal-800 flex items-center gap-2">
          <span className="text-3xl">🎓</span> Myanmar AI Mentor
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => openAuth(true)}
            className="text-teal-700 font-bold hover:bg-teal-50 transition px-5 py-2.5 rounded-xl"
          >
            Log In
          </button>
          {/* Duolingo Style Button (Professional) */}
          <button 
            onClick={() => openAuth(false)}
            className="bg-teal-700 text-white px-6 py-2.5 rounded-xl font-bold border-b-4 border-teal-900 hover:brightness-110 active:border-b-0 active:translate-y-[4px] transition-all"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 mt-32 md:mt-40 z-10">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.25] mb-6 max-w-4xl">
          သင့်အတွက် အထူးပြုလုပ်ထားသော <br />
          <span className="text-teal-700">ဉာဏ်ရည်တု လမ်းညွှန်ဆရာ</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed font-medium">
          Cross-Lingual Transfer Learning နှင့် Vector Embeddings နည်းပညာများကို အသုံးပြု၍ Grade 10, 11, 12 ကျောင်းသားများအတွက် အကောင်းဆုံး သင်ယူမှုအတွေ့အကြုံကို ဖန်တီးပေးထားပါသည်။
        </p>
        
        <button 
          onClick={() => openAuth(false)}
          className="bg-teal-700 text-white text-lg md:text-xl px-10 py-4 rounded-2xl font-bold border-b-4 border-teal-900 hover:brightness-110 active:border-b-0 active:translate-y-[4px] transition-all flex items-center gap-3"
        >
          စတင်လေ့လာမည် <span className="text-2xl">🚀</span>
        </button>
      </main>

      {/* --- Features Section (Structured Cards) --- */}
      <section className="pb-24 px-6 mt-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          
          <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-8 text-left shadow-[0_4px_0_rgb(219,234,254)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(219,234,254)] transition-all">
            <div className="w-14 h-14 bg-white border-2 border-blue-100 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm">📚</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">အတန်းစုံ၊ ဘာသာစုံ</h3>
            <p className="text-gray-600 font-medium leading-relaxed">Grade 10 မှ 12 အထိ (Bio/Eco) မိမိသင်ယူနေသော အတန်းနှင့် ဘာသာရပ်များကို စိတ်ကြိုက်ရွေးချယ် သင်ယူနိုင်ပါသည်။</p>
          </div>

          <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-8 text-left shadow-[0_4px_0_rgb(220,252,231)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(220,252,231)] transition-all">
            <div className="w-14 h-14 bg-white border-2 border-green-100 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm">🤖</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">AI Chatbot အကူအညီ</h3>
            <p className="text-gray-600 font-medium leading-relaxed">နားမလည်သော သင်ခန်းစာများကို မြန်မာလို မေးမြန်းနိုင်ပြီး AI မှ ချက်ချင်း အသေးစိတ် ရှင်းပြပေးပါမည်။</p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-100 rounded-2xl p-8 text-left shadow-[0_4px_0_rgb(243,232,255)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(243,232,255)] transition-all">
            <div className="w-14 h-14 bg-white border-2 border-purple-100 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm">📈</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">ကိုယ်ပိုင် မှတ်တမ်း</h3>
            <p className="text-gray-600 font-medium leading-relaxed">သင်ယူမှု တိုးတက်မှု အခြေအနေများကို Dashboard တွင် ရှင်းလင်းစွာ ခြေရာခံ ကြည့်ရှုနိုင်ပါသည်။</p>
          </div>

        </div>
      </section>

      {/* --- Auth Modal (Crisp & Tactile) --- */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}></div>
          
          <div className="bg-white border-2 border-gray-100 rounded-3xl w-full max-w-md p-8 relative z-10 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            {/* Pill Toggle Tabs */}
            <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8 mt-2">
              <button
                onClick={() => { setIsLogin(true); setError(''); }}
                type="button"
                className={`w-1/2 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${isLogin ? 'bg-white text-teal-800 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Log In
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(''); }}
                type="button"
                className={`w-1/2 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${!isLogin ? 'bg-white text-teal-800 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Sign Up
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-gray-500 font-medium text-sm">
                {isLogin ? 'သင့်အကောင့်သို့ ဝင်ရောက်ပြီး ဆက်လက်လေ့လာပါ။' : 'အကောင့်သစ်ဖွင့်ပြီး စတင်လေ့လာပါ။'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-100 text-red-600 p-3.5 rounded-xl mb-6 text-sm font-semibold flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  required
                  className="w-full bg-gray-50 border-2 border-gray-200 focus:border-teal-700 focus:bg-white rounded-xl px-4 py-3.5 outline-none transition-all text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-50 border-2 border-gray-200 focus:border-teal-700 focus:bg-white rounded-xl px-4 py-3.5 outline-none transition-all text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>

              {/* 🚨 Sign Up ဖြစ်မှသာ Confirm Password ကို ထည့်သွင်းပြသမည် */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-50 border-2 border-gray-200 focus:border-teal-700 focus:bg-white rounded-xl px-4 py-3.5 outline-none transition-all text-gray-900 placeholder-gray-400 font-medium"
                  />
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-700 text-white font-bold py-4 rounded-xl mt-6 border-b-4 border-teal-900 hover:brightness-110 active:border-b-0 active:translate-y-[4px] transition-all disabled:opacity-70 disabled:active:border-b-4 disabled:active:translate-y-0"
              >
                {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}