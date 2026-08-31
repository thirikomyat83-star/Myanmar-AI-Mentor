"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react"; 
import { useAuthStore } from "@/store/useAuthStore";
import { 
  Check, X, RotateCcw, Brain, ArrowRight, Zap, Clock, Target, 
  Flame, Star, Pause, Play, Trophy, Volume2, Heart, Lightbulb, Layers, ArrowLeft, Lock
} from "lucide-react";

// 🚨 Markdown + LaTeX Packages
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Text Format Utility
const processChatText = (text: string) => text; 

// ==========================================
// 🚨 FIX 1: Component အပြင်ဘက်သို့ ထုတ်ထားသော Markdown Renderer (Flicker မဖြစ်စေရန်)
// ==========================================
const renderMarkdownComponents = {
  p: ({node, ...props}: any) => <p className="mb-4 last:mb-0 leading-relaxed" {...props} />, 
  strong: ({node, ...props}: any) => <strong className="font-extrabold text-[#5F8B7E]" {...props} />, 
  ul: ({node, ...props}: any) => <ul className="list-disc ml-6 mb-4 space-y-2 text-left" {...props} />, 
  ol: ({node, ...props}: any) => <ol className="list-decimal ml-6 mb-4 space-y-2 text-left" {...props} />, 
  li: ({node, ...props}: any) => <li className="pl-2" {...props} />, 
  h1: ({node, ...props}: any) => <h1 className="text-2xl font-black text-[#3F4A3C] mb-4 mt-6" {...props} />, 
  h2: ({node, ...props}: any) => <h2 className="text-xl font-bold text-[#3F4A3C] mb-3 mt-5" {...props} />, 
  h3: ({node, ...props}: any) => <h3 className="text-lg font-bold text-[#3F4A3C] mb-2 mt-4" {...props} />,
  code: ({node, inline, className, children, ...props}: any) => { 
    const match = /language-(\w+)/.exec(className || '');
    const isInline = inline !== undefined ? inline : !match;
    return !isInline ? ( 
      <div className="bg-[#3F4A3C] text-[#F4EBDD] p-4 rounded-xl overflow-x-auto text-sm font-mono my-4 shadow-inner text-left w-full">
        <code className={className} {...props}>{children}</code>
      </div> 
    ) : ( 
      <code className="bg-[#F4EBDD]/50 text-[#C9785C] px-1.5 py-0.5 rounded text-[15px] font-mono font-bold break-words" {...props}>
        {children}
      </code> 
    ) 
  }
};

// ==========================================
// 🌟 INNER COMPONENT (Wrapped in Suspense)
// ==========================================
function FlashcardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const generateTopic = searchParams.get('generate'); 
  const taskId = searchParams.get('taskId'); 
  const fromPlan = searchParams.get('from') === 'study_plan'; 
  
  // 🚨 UI State Management
  const [viewMode, setViewMode] = useState<'vault' | 'review' | 'completed'>('vault');
  const [vaultDecks, setVaultDecks] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // 🚨 Review State
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState(""); // ADVANCED RECALL FEATURE
  
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Syncing Knowledge..."); 
  const [isAnimating, setIsAnimating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); 
  
  // 🚨 Gamification State
  const [streak, setStreak] = useState(0);
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [nextHeartIn, setNextHeartIn] = useState<string>(""); 
  const [earnedTrophy, setEarnedTrophy] = useState(false); 
  
  // 🚨 Stats & Utilities
  const [timeSpent, setTimeSpent] = useState(0);
  const [sessionStats, setSessionStats] = useState({ forgot: 0, hard: 0, good: 0, easy: 0 });
  const [showComboAnim, setShowComboAnim] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // 🚨 Config
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '') + "/api";
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 🚨 User ID Management
  const { data: session } = useSession();
  const { user: storeUser } = useAuthStore(); 
  const [activeStudentId, setActiveStudentId] = useState<string>('');

  useEffect(() => {
    const storedProfileStr = localStorage.getItem('profile');
    let storedProfile: any = {};
    try { if (storedProfileStr) storedProfile = JSON.parse(storedProfileStr); } catch (e) {}

    const mergedUser = {
        ...(session?.user || {}),
        ...(storeUser || {}),
        ...storedProfile
    };

    const realId = mergedUser.id || mergedUser.student_id || localStorage.getItem('student_id');
    setActiveStudentId(realId || 'STU_TEMP');
  }, [session, storeUser]);

  // ==========================================
  // 🚨 FIX 2: Real-time Heart Timer without Loop
  // ==========================================
  useEffect(() => {
    const interval = setInterval(() => {
      setNextHeartIn((prev) => {
        if (!prev || prev === "00:00") return prev;
        
        const [m, s] = prev.split(':').map(Number);
        let totalSeconds = m * 60 + s - 1;
        
        if (totalSeconds <= 0) {
          if (activeStudentId && viewMode === 'vault') fetchVaultDecks(activeStudentId);
          return "00:00";
        } else {
          const nm = Math.floor(totalSeconds / 60);
          const ns = totalSeconds % 60;
          return `${nm.toString().padStart(2, '0')}:${ns.toString().padStart(2, '0')}`;
        }
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeStudentId, viewMode]);

  // ==========================================
  // 📥 FETCH VAULT DECKS OR AUTO-GENERATE
  // ==========================================
  useEffect(() => {
    if (!activeStudentId) return; 

    if (generateTopic && !isGenerating) {
      setIsGenerating(true);
      handleAutoGenerate(generateTopic, activeStudentId);
    } else if (!generateTopic && !isGenerating) {
      fetchVaultDecks(activeStudentId);
    }
  }, [activeStudentId, generateTopic, isGenerating]);

  // 🚨 FIX 3: Resetting `isGenerating` in finally block
  const handleAutoGenerate = async (topic: string, studentId: string) => {
    setLoading(true);
    setLoadingText(`AI က '${topic}' အတွက် Flashcards များ ဖန်တီးပေးနေပါသည်...`);
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      await axios.post(`${API_BASE}/flashcards/generate/${encodeURIComponent(studentId)}`, {
        topic: topic,
        subject: "General", 
        context_type: "general"
      }, { headers });

      router.replace('/flashcards-vault');

    } catch (error) {
      console.error("Auto generate error", error);
      alert("Flashcard အသစ်ဖန်တီးရာတွင် အခက်အခဲရှိနေပါသည်။");
    } finally {
      await fetchVaultDecks(studentId);
      setIsGenerating(false); // FIXED HERE
    }
  };

  const fetchVaultDecks = async (studentId: string) => {
    try {
      setLoading(true);
      setLoadingText("Syncing Knowledge...");
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await axios.get(`${API_BASE}/flashcards/vault/${encodeURIComponent(studentId)}`, { headers });
      if (res.data) {
        if (res.data.vault) setVaultDecks(res.data.vault);
        if (res.data.current_hearts !== undefined) setHearts(res.data.current_hearts);
        if (res.data.next_heart_in !== undefined) setNextHeartIn(res.data.next_heart_in);
        if (res.data.xp !== undefined) setXp(res.data.xp);
      }
    } catch (error) {
      console.error("Vault fetch error", error);
      setVaultDecks([]);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  // ==========================================
  // 🚀 START REVIEW
  // ==========================================
  const startReview = async (topic: string) => {
    setLoading(true);
    setLoadingText("ကတ်များကို ပြင်ဆင်နေပါသည်...");
    setEarnedTrophy(false);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await axios.get(`${API_BASE}/flashcards/due/${encodeURIComponent(activeStudentId)}?topic=${encodeURIComponent(topic)}`, { headers });
      
      let topicCards = [];
      if (res.data && res.data.cards && res.data.cards.length > 0) {
        topicCards = res.data.cards;
      }
      
      if (res.data) {
        if (res.data.current_hearts !== undefined) setHearts(res.data.current_hearts);
        if (res.data.next_heart_in) setNextHeartIn(res.data.next_heart_in);
      }
      
      if (topicCards.length === 0) {
        alert("🎉 ဂုဏ်ယူပါတယ်! ဒီခေါင်းစဉ်အတွက် ဒီနေ့ကျက်မှတ်စရာ ကတ်အသစ်/အဟောင်း မရှိတော့ပါ။ အားလုံးပြီးသွားပါပြီ။");
        setLoading(false);
        return;
      }
      
      setCards(topicCards);
      setSelectedTopic(topic);
      setViewMode('review');
      setCurrentIndex(0);
      setIsFlipped(false);
      setTypedAnswer("");
      setSessionStats({ forgot: 0, hard: 0, good: 0, easy: 0 });
      setTimeSpent(0);
      
      // 🚨 FIX 4: ကတ်များ ပြင်ဆင်ပြီးသွားပါက အဝိုင်းလည်ခြင်းကို မဖြစ်မနေ ပြန်ပိတ်ပေးသည်
      setTimeout(() => setLoading(false), 300);

    } catch (error) {
      console.error("Fetch due cards error", error);
      alert("ကတ်များကို ဆွဲယူရာတွင် အခက်အခဲရှိနေပါသည်။ Backend Server လည်ပတ်နေခြင်း ရှိမရှိ စစ်ဆေးပါ။");
      setLoading(false);
    }
  };

  // ==========================================
  // ⏲️ TIMER & KEYBOARD LISTENERS
  // ==========================================
  useEffect(() => {
    if (viewMode === 'review' && !isPaused && !loading) {
      timerRef.current = setInterval(() => setTimeSpent(prev => prev + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [viewMode, isPaused, loading]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (viewMode !== 'review' || loading || isPaused || isAnimating) return;
    
    // Type answer box မှာ ရိုက်နေရင် Keyboard shortcut ကို ပိတ်ထားမည်
    if (document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT") return;

    if (e.code === "Space") {
      e.preventDefault();
      if (!isFlipped) handleFlip();
    }
    if (isFlipped) {
      switch(e.key) {
        case "1": handleRate(1); break; // Hard
        case "2": handleRate(2); break; // Good
        case "3": handleRate(3); break; // Easy
        default: break;
      }
    }
  }, [isFlipped, loading, viewMode, isPaused, isAnimating]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // ==========================================
  // 🎮 CARD ACTIONS & GAMIFICATION (Optimistic UI)
  // ==========================================
  const handleFlip = () => {
    if (isAnimating || isFlipped) return;
    setIsFlipped(true);
  };

  const handleRate = async (quality: number) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const currentCard = cards[currentIndex];
    let type = quality === 1 ? "hard" : quality === 2 ? "good" : "easy";
    setSessionStats(prev => ({ ...prev, [type]: prev[type as keyof typeof prev] + 1 }));

    // 🚨 EARLY GUARD: အသည်းကုန်နေရင် ချက်ချင်းတားမည်
    if (quality === 1 && hearts <= 0) {
      alert("အသဲ (Hearts) ကုန်သွားပါပြီ။ ၅ မိနစ် စောင့်ပြီးမှ ပြန်လည်ဖြေဆိုပါ။");
      setIsAnimating(false);
      return;
    }

    // 🚨 INSTANT UI UPDATE (Optimistic UI)
    if (quality >= 2) {
      const newCombo = combo + 1;
      setStreak(s => s + 1);
      setCombo(newCombo);
      if (newCombo >= 2) triggerComboAnimation();
      
      // Local State Update
      setXp(prev => prev + (quality === 3 ? 20 : 15));
    } else {
      setStreak(0);
      setCombo(0);
      setHearts(prev => Math.max(0, prev - 1));
      // RE-QUEUE: Hard ဆိုရင် အဆုံးကို ပြန်ပို့မည်
      setCards(prevCards => [...prevCards, currentCard]);
    }

    setIsFlipped(false);
    setShowHint(false);
    setTypedAnswer(""); 

    // ကတ်အသစ်ဆီသို့ ချက်ချင်းသွားမည် (Animation Time ကို 250ms သို့ လျှော့ချထားသည်)
    setTimeout(async () => {
      const nextIndex = currentIndex + 1;
      const totalCards = quality === 1 ? cards.length + 1 : cards.length;
      
      if (nextIndex < totalCards) {
        setCurrentIndex(nextIndex);
      } else {
        setViewMode('completed');
        // နောက်ဆုံးကတ် ပြီးသွားချိန်မှသာ Session Complete API ကို ခေါ်မည်
        try {
          const token = localStorage.getItem('token');
          const res = await axios.post(`${API_BASE}/flashcards/complete-session/${encodeURIComponent(activeStudentId)}`, 
            { topic: selectedTopic }, 
            { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
          );
          if (res.data && res.data.bonus_xp) {
            setXp(prevXp => prevXp + res.data.bonus_xp);
            setEarnedTrophy(true); 
          }
        } catch (e) { console.error(e); }
      }
      setIsAnimating(false);
    }, 250); 

    // 🚨 BACKGROUND API SYNC 
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      axios.post(`${API_BASE}/flashcards/review/${currentCard.id || 1}`, { 
        quality: quality 
      }, { headers }).then(res => {
        if (res.data) {
          // နောက်ကွယ်ကနေ Server Data အတိုင်း ပြန်ချိန်ညှိပေးမည်
          if (res.data.remaining_hearts !== undefined) setHearts(res.data.remaining_hearts);
          if (res.data.next_heart_in) setNextHeartIn(res.data.next_heart_in);
        }
      }).catch(err => console.warn("Background Sync Error", err));
    } catch (error) {
      console.warn("Background API Sync Error");
    }
  };

  const triggerComboAnimation = () => {
    setShowComboAnim(true);
    setTimeout(() => setShowComboAnim(false), 1000);
  };

  const speakText = (text: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
    router.refresh(); 
  };

  const handleBackToVault = () => {
    setViewMode('vault');
    if (activeStudentId) fetchVaultDecks(activeStudentId);
  };

  const handleBackToStudyPlan = () => {
    if (taskId) {
      router.push(`/study-plan?completed_task_id=${taskId}`);
    } else {
      router.push('/study-plan');
    }
  };

  const currentCard = cards[currentIndex];
  
  // ==========================================
  // 🚨 SMART BADGE EXTRACTION LOGIC
  // ==========================================
  let frontText = currentCard?.front || currentCard?.front_text || "No Question Text";
  const backText = currentCard?.back || currentCard?.back_text || "No Answer Text";

  let badgeLabel = currentCard?.concept_name || selectedTopic;
  
  // Text ထဲမှာ 🏷️ [Physics] လို့ ပါလာရင် Badge အဖြစ် ပြောင်းပေးပြီး မူရင်းစာသားထဲကနေ အလိုလို ဖျက်ထုတ်မည်
  // စာကြောင်းအစမှာ Space တွေပါလာရင်တောင် ဖမ်းမိအောင် \s* ကို ထည့်ထားပြီး ^ ကို ဖြုတ်ထားပါသည်
  if (typeof frontText === 'string') {
    const tagMatch = frontText.match(/🏷️\s*\[(.*?)\]/);
    if (tagMatch) {
      badgeLabel = tagMatch[1]; 
      frontText = frontText.replace(tagMatch[0], '').trim(); 
    }
  }

  const progressPercentage = cards.length > 0 ? ((currentIndex) / cards.length) * 100 : 0;
  const accuracy = Math.round(((sessionStats.good + sessionStats.easy) / (currentIndex || 1)) * 100) || 0;

  // ==========================================
  // 🖥️ RENDER LOGIC
  // ==========================================

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#FFFDF8]">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-[#F4EBDD] rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#5F8B7E] rounded-full border-t-transparent animate-spin"></div>
          <Brain className="absolute inset-0 m-auto text-[#5F8B7E] animate-pulse" size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#3F4A3C] tracking-wide text-center px-4 leading-relaxed">{loadingText}</h2>
      </div>
    );
  }

  // 🗃️ VAULT VIEW
  if (viewMode === 'vault') {
    const cardGradients = [
      "from-[#5F8B7E] to-[#4a6d62]",
      "from-[#8A8F4D] to-[#6d723d]",
      "from-[#C9785C] to-[#a86047]",
      "from-[#3F4A3C] to-[#2c342a]",
    ];

    return (
      <div className="min-h-screen bg-[#FFFDF8] text-[#3F4A3C] p-6 md:p-10 font-sans">
        <div className="max-w-7xl mx-auto">
          
          {fromPlan ? (
            <button onClick={handleBackToStudyPlan} className="flex items-center gap-2 text-[#3F4A3C]/70 hover:text-[#5F8B7E] font-bold text-sm mb-8 transition-colors w-fit px-5 py-2.5 bg-white rounded-xl shadow-sm border border-[#F4EBDD]">
              <ArrowLeft size={18} /> Study Plan သို့ ပြန်သွားမည်
            </button>
          ) : (
            <button onClick={handleBackToDashboard} className="flex items-center gap-2 text-[#3F4A3C]/70 hover:text-[#5F8B7E] font-bold text-sm mb-8 transition-colors w-fit px-5 py-2.5 bg-white rounded-xl shadow-sm border border-[#F4EBDD]">
              <ArrowLeft size={18} /> Dashboard သို့ ပြန်သွားမည်
            </button>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#3F4A3C]">Flashcards Vault</h1>
              <p className="text-sm md:text-base font-bold text-[#3F4A3C]/50 mt-2">ကိုယ်လေ့လာထားသော ခေါင်းစဉ်များကို အစုလိုက် ပြန်လည်ကျက်မှတ်ပါ</p>
            </div>
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-[#F4EBDD]">
              <StatusBadge 
                icon={<Heart size={20} fill="currentColor" className="text-[#C9785C]" />} 
                value={hearts} 
                subValue={hearts < 5 && nextHeartIn && nextHeartIn !== "00:00" ? nextHeartIn : undefined}
              />
              <div className="w-[1px] h-8 bg-[#F4EBDD]"></div>
              <StatusBadge icon={<Star size={20} fill="currentColor" className="text-[#8A8F4D]" />} value={xp} />
            </div>
          </div>

          {vaultDecks.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-[#F4EBDD] shadow-sm">
              <Layers size={72} className="mx-auto text-[#3F4A3C]/20 mb-6" />
              <h3 className="text-2xl font-extrabold text-[#3F4A3C]">Flashcards မရှိသေးပါ</h3>
              <p className="text-base text-[#3F4A3C]/50 mt-2">Dashboard မှ Topic ရွေးချယ်ပြီး Flashcards များကို ထုတ်ယူပါ။</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
              {vaultDecks.map((deck, idx) => {
                const gradient = cardGradients[idx % cardGradients.length];
                const isCaughtUp = deck.due_cards === 0;
                
                return (
                  <div 
                    key={idx} 
                    onClick={() => {
                      if (!isCaughtUp) {
                        startReview(deck.topic);
                      }
                    }}
                    className={`relative w-full h-[260px] sm:h-[280px] group ${isCaughtUp ? 'cursor-not-allowed opacity-90 grayscale-[0.3]' : 'cursor-pointer'}`}
                  >
                    <div className="absolute inset-0 bg-[#F4EBDD] rounded-[2rem] transform translate-y-6 scale-[0.85] opacity-60 transition-all duration-300 group-hover:translate-y-8 group-hover:bg-[#e6d8c4] border border-[#F4EBDD] shadow-sm"></div>
                    <div className="absolute inset-0 bg-[#FFFDF8] rounded-[2rem] transform translate-y-3 scale-[0.92] opacity-90 transition-all duration-300 group-hover:translate-y-4 group-hover:bg-[#F4EBDD]/50 border border-[#F4EBDD] shadow-md"></div>
                    
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-[2rem] shadow-xl p-5 md:p-6 flex flex-col justify-between transform transition-all duration-300 ${!isCaughtUp && 'group-hover:-translate-y-2'} border border-white/10 overflow-hidden`}>
                      
                      <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
                      
                      {isCaughtUp && (
                        <div className="absolute top-6 right-6 text-white/50">
                          <Lock size={24} />
                        </div>
                      )}

                      <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center mb-5 shadow-inner border border-white/20">
                          {isCaughtUp ? <Check size={28} /> : <Layers size={28} />}
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-white mb-2 line-clamp-2 drop-shadow-md leading-tight">
                          {deck.topic}
                        </h3>
                      </div>
                      
                      <div className="relative z-10 flex justify-between items-end pt-5 border-t border-white/20 mt-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] md:text-xs font-bold text-white/70 uppercase tracking-widest mb-1">Total Cards</span>
                          <span className="text-2xl font-black text-white">{deck.total_cards}</span>
                        </div>
                        <div className="flex flex-col items-end bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 shadow-inner">
                          <span className="text-[10px] md:text-xs font-bold text-white/90 uppercase tracking-widest mb-1">Due Today</span>
                          <span className={`text-xl font-black drop-shadow-sm ${isCaughtUp ? 'text-[#e2e8b8]' : 'text-white'}`}>
                            {isCaughtUp ? "Caught Up!" : deck.due_cards}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 🏆 COMPLETED VIEW
  if (viewMode === 'completed') {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center py-12 px-4 relative font-sans">
        <div className="max-w-3xl w-full z-10 flex flex-col items-center bg-white p-10 md:p-14 rounded-[2.5rem] shadow-2xl shadow-[#5F8B7E]/10 border border-[#F4EBDD]">
          <div className="w-32 h-32 bg-gradient-to-tr from-[#8A8F4D] to-[#5F8B7E] rounded-full flex items-center justify-center mb-8 relative shadow-lg shadow-[#5F8B7E]/20">
            <Trophy size={64} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#3F4A3C] tracking-tight text-center mb-4">Mastery Achieved!</h1>
          <p className="text-[#3F4A3C]/50 mb-10 text-center text-lg font-medium">'{selectedTopic}' အတွက် ယနေ့ကျက်မှတ်မှု ပြီးဆုံးပါပြီ။</p>
          
          {earnedTrophy && (
            <div className="mb-8 px-6 py-3 bg-[#8A8F4D]/10 text-[#8A8F4D] font-bold rounded-xl flex items-center gap-3 animate-fade-in-up">
              <Trophy size={20} /> <span>အထူးဆု: +50 Bonus XP နှင့် Trophy ၁ ခု ရရှိပါသည်! 🏆</span>
            </div>
          )}

          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
            <StatBox icon={<Star size={28} className="text-[#8A8F4D]" fill="currentColor" />} value={xp} label="XP Earned" />
            <StatBox icon={<Clock size={28} className="text-[#5F8B7E]" />} value={formatTime(timeSpent)} label="Time Spent" />
            <StatBox icon={<Target size={28} className="text-[#8A8F4D]" />} value={`${accuracy}%`} label="Accuracy" />
            <StatBox icon={<Flame size={28} className="text-[#C9785C]" fill="currentColor" />} value={streak} label="Max Streak" />
          </div>
          
          <div className="w-full flex flex-col sm:flex-row gap-4 justify-center">
            {fromPlan ? (
              <>
                <ActionButton label="Back to Vault" onClick={handleBackToVault} variant="secondary" />
                <ActionButton label="✅ ပြီးမြောက်ပါပြီ (Back to Study Plan)" onClick={handleBackToStudyPlan} variant="primary" />
              </>
            ) : (
              <>
                <ActionButton label="Back to Dashboard" onClick={handleBackToDashboard} variant="secondary" />
                <ActionButton label="Back to Vault" onClick={handleBackToVault} variant="primary" />
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 🧠 ACTIVE REVIEW VIEW
  return (
    <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center py-6 px-4 md:px-8 font-sans relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#5F8B7E]/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#8A8F4D]/5 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      {showComboAnim && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-gradient-to-r from-[#C9785C] to-[#8A8F4D] text-white px-6 py-2 rounded-full font-bold text-xl flex items-center gap-2 shadow-2xl animate-bounce">
            <Flame fill="currentColor" size={24} /> {combo}x STREAK
          </div>
        </div>
      )}

      {/* 🧠 HEADER */}
      <div className="w-full max-w-3xl mb-6 z-10">
        <div className="flex items-center justify-between bg-white/60 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-[#F4EBDD] mb-4">
          <div className="flex gap-2">
            <button onClick={handleBackToVault} className="text-[#3F4A3C]/50 hover:text-[#5F8B7E] transition bg-white px-4 py-2.5 rounded-xl shadow-sm border border-[#F4EBDD] font-bold text-sm">
              Back to Vault
            </button>
            <button onClick={() => setIsPaused(!isPaused)} className="text-[#3F4A3C]/50 hover:text-[#5F8B7E] transition bg-white p-2.5 rounded-xl shadow-sm border border-[#F4EBDD]">
              {isPaused ? <Play size={20} fill="currentColor"/> : <Pause size={20} fill="currentColor"/>}
            </button>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <StatusBadge 
              icon={<Heart size={18} fill="currentColor" className="text-[#C9785C]" />} 
              value={hearts} 
              subValue={hearts < 5 && nextHeartIn && nextHeartIn !== "00:00" ? nextHeartIn : undefined}
            />
            <StatusBadge icon={<Flame size={18} fill="currentColor" className="text-[#C9785C]" />} value={streak} />
            <StatusBadge icon={<Star size={18} fill="currentColor" className="text-[#8A8F4D]" />} value={xp} hideMobile />
          </div>
        </div>
        
        <div className="w-full bg-[#F4EBDD] rounded-full h-2 overflow-hidden shadow-inner">
          <div className="bg-[#5F8B7E] h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${progressPercentage}%` }} />
        </div>
      </div>

      {/* 📚 MAIN STAGE */}
      <div className="w-full max-w-3xl flex-1 flex flex-col items-center z-10">
        
        <div className="w-full flex justify-between items-center mb-4 px-2">
          <span className="text-sm font-bold text-[#5F8B7E] bg-[#5F8B7E]/10 px-4 py-1.5 rounded-full tracking-wide shadow-sm border border-[#5F8B7E]/20 truncate max-w-[200px] md:max-w-md">
            Study Mode
          </span>
          <span className="text-sm text-[#3F4A3C]/50 font-bold bg-white/60 px-3 py-1 rounded-full">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>

        {/* 💳 3D FLASHCARD CONTAINER */}
        <div className="w-full h-[55vh] min-h-[450px] max-h-[600px] relative mb-8" style={{ perspective: '2000px' }}>
          <div 
            className="w-full h-full relative"
            style={{ 
              transformStyle: 'preserve-3d', 
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)' 
            }}
          >
            
            {/* ================= FRONT SIDE (QUESTION) ================= */}
            <div 
              className="absolute inset-0 w-full h-full bg-white rounded-[2rem] flex flex-col shadow-xl border border-[#F4EBDD] overflow-hidden group"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {/* 🚨 THE FIX: SMART TOP LEFT BADGE FOR SUBJECT */}
              <div className="absolute top-4 left-4 z-20 max-w-[60%]">
                <span className="inline-block bg-[#F4EBDD]/70 text-[#C9785C] text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm border border-[#C9785C]/20 truncate w-full backdrop-blur-sm">
                  🏷️ {badgeLabel}
                </span>
              </div>

              <div className="absolute top-4 right-4 flex gap-2 z-20">
                <IconButton icon={<Lightbulb size={22} />} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowHint(true); }} color="text-[#8A8F4D]" bg="bg-white/90 hover:bg-[#F4EBDD]" />
                <IconButton icon={<Volume2 size={22} />} onClick={(e) => speakText(frontText, e)} color="text-[#5F8B7E]" bg="bg-white/90 hover:bg-[#F4EBDD]" />
              </div>

              {currentCard?.image_url && (
                <div className="w-full h-2/5 shrink-0 relative overflow-hidden bg-[#F4EBDD]/20 mt-14 rounded-t-3xl">
                  <img src={currentCard.image_url} alt="Study material" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-12 py-8 flex flex-col justify-start items-center relative z-10 w-full">
                <div className="w-full text-left md:text-center text-base md:text-lg font-bold text-[#3F4A3C] leading-relaxed break-words markdown-render my-auto mt-8">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                    components={renderMarkdownComponents}
                  >
                    {processChatText(frontText)}
                  </ReactMarkdown>
                </div>
                
                {/* 🚨 ADVANCED ACTIVE RECALL: Type Answer Box 🚨 */}
                <textarea
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  placeholder="ကိုယ်ပိုင်အဖြေကို စိတ်ထဲမှဖြစ်စေ၊ ဤနေရာတွင် ရိုက်ထည့်၍ဖြစ်စေ ဖြေဆိုကြည့်ပါ..."
                  className="mt-6 w-full bg-[#FFFDF8] border-2 border-[#F4EBDD] rounded-2xl p-4 outline-none resize-none text-[#3F4A3C] font-semibold placeholder:text-[#3F4A3C]/40 focus:border-[#5F8B7E]/50 transition-all shadow-inner"
                  rows={3}
                />

                {showHint && (
                  <div className="mt-6 bg-[#F4EBDD] border border-[#C9785C]/30 text-[#C9785C] text-sm md:text-base font-bold px-6 py-4 rounded-2xl animate-fade-in-up w-full text-center shadow-sm">
                    💡 Hint: သင်လေ့လာခဲ့သော အဓိက အချက်များကို ပြန်လည်စဥ်းစားကြည့်ပါ။
                  </div>
                )}
              </div>
            </div>

            {/* ================= BACK SIDE (ANSWER) ================= */}
            <div 
              className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#FFFDF8] to-white rounded-[2rem] flex flex-col shadow-xl border border-[#F4EBDD] overflow-hidden"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              {/* 🚨 THE FIX: SMART TOP LEFT BADGE FOR SUBJECT */}
              <div className="absolute top-4 left-4 z-20 max-w-[60%]">
                <span className="inline-block bg-[#F4EBDD]/70 text-[#C9785C] text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm border border-[#C9785C]/20 truncate w-full backdrop-blur-sm">
                  🏷️ {badgeLabel}
                </span>
              </div>

              <div className="absolute top-4 right-4 z-20">
                <IconButton icon={<Volume2 size={22} />} onClick={(e) => speakText(backText, e)} color="text-[#5F8B7E]" bg="bg-white/90 hover:bg-[#F4EBDD]" />
              </div>

              {currentCard?.image_url && (
                <div className="absolute inset-0 w-full h-full opacity-5 pointer-events-none mt-14 rounded-t-3xl">
                  <img src={currentCard.image_url} className="w-full h-full object-cover" alt="" />
                </div>
              )}

              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-12 py-10 flex flex-col justify-start items-center relative z-10 w-full mt-8">
                <div className="w-16 h-1.5 bg-[#F4EBDD] rounded-full mb-6 shrink-0 mx-auto"></div>
                
                {/* 🚨 Show Typed Answer for Comparison 🚨 */}
                {typedAnswer && (
                  <div className="w-full bg-[#F4EBDD]/40 border border-[#F4EBDD] rounded-xl p-4 mb-6 relative mt-2">
                    <span className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black uppercase text-[#C9785C] tracking-widest border border-[#F4EBDD] rounded-md">Your Answer</span>
                    <p className="text-sm font-semibold text-[#3F4A3C]/80 italic">"{typedAnswer}"</p>
                  </div>
                )}

                <div className="w-full text-left md:text-center text-base md:text-lg font-bold text-[#3F4A3C] leading-relaxed break-words markdown-render my-auto">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                    components={renderMarkdownComponents}
                  >
                    {processChatText(backText)}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 🎮 🚨 ACTION BUTTONS */}
        <div className="w-full h-20">
          {!isFlipped ? (
            <button 
              onClick={handleFlip}
              className="w-full h-full rounded-[1.5rem] bg-[#5F8B7E] text-white font-extrabold text-xl md:text-2xl uppercase tracking-widest hover:bg-[#4a6d62] transition-all shadow-lg shadow-[#5F8B7E]/30 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <Check size={28} strokeWidth={3} /> Show Answer
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-3 md:gap-4 h-full animate-fade-in-up">
              <RateButton keyNum="1" label="Hard" sub="(မမှတ်မိဘူး)" color="rose" onClick={() => handleRate(1)} />
              <RateButton keyNum="2" label="Good" sub="(မှတ်မိတယ်)" color="amber" onClick={() => handleRate(2)} />
              <RateButton keyNum="3" label="Easy" sub="(အရမ်းလွယ်တယ်)" color="emerald" onClick={() => handleRate(3)} />
            </div>
          )}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #F4EBDD; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Markdown Text Overrides for Flashcards */
        .markdown-render p { margin-bottom: 1rem; }
        .markdown-render p:last-child { margin-bottom: 0; }
        .markdown-render ul, .markdown-render ol { text-align: left; display: inline-block; }
      `}} />
    </div>
  );
}

// ==========================================
// 🧩 WRAPPER COMPONENT (Next.js Suspense Fix)
// ==========================================
export default function UltimateFlashcardPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-screen items-center justify-center bg-[#FFFDF8]">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-[#F4EBDD] rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#5F8B7E] rounded-full border-t-transparent animate-spin"></div>
          <Brain className="absolute inset-0 m-auto text-[#5F8B7E] animate-pulse" size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#3F4A3C] tracking-wide">Loading...</h2>
      </div>
    }>
      <FlashcardContent />
    </Suspense>
  );
}

// ==========================================
// 🧩 SUB-COMPONENTS
// ==========================================

function StatBox({ icon, value, label }: { icon: React.ReactNode, value: string | number, label: string }) {
  return (
    <div className="bg-[#FFFDF8] rounded-2xl p-6 flex flex-col items-center border border-[#F4EBDD] transition-transform hover:-translate-y-1">
      <div className="mb-3 bg-white p-3 rounded-2xl shadow-sm border border-[#F4EBDD]">{icon}</div>
      <span className="text-3xl font-extrabold text-[#3F4A3C]">{value}</span>
      <span className="text-xs font-bold text-[#3F4A3C]/40 mt-2 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function ActionButton({ label, onClick, variant }: { label: string, onClick: () => void, variant: 'primary' | 'secondary' }) {
  const baseClass = "px-10 py-4 rounded-full font-extrabold text-lg transition-all shadow-lg active:translate-y-1 w-full sm:w-auto";
  const variants = {
    primary: "bg-[#5F8B7E] text-white hover:bg-[#4a6d62] shadow-[#5F8B7E]/30",
    secondary: "bg-white text-[#3F4A3C] border-2 border-[#F4EBDD] hover:bg-[#FFFDF8]"
  };
  return (
    <button onClick={onClick} className={`${baseClass} ${variants[variant]}`}>
      {label}
    </button>
  );
}

function StatusBadge({ icon, value, subValue, hideMobile = false }: { icon: React.ReactNode, value: number, subValue?: string, hideMobile?: boolean }) {
  return (
    <div className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl bg-white shadow-sm border border-[#F4EBDD] ${hideMobile ? 'hidden md:flex' : 'flex'}`}>
      {icon} 
      <span className="text-[#3F4A3C]">{value}</span>
      {subValue && <span className="text-[#C9785C] text-[10px] md:text-xs ml-1 bg-[#F4EBDD]/50 px-1.5 py-0.5 rounded-md">{subValue}</span>}
    </div>
  );
}

function IconButton({ icon, onClick, color="text-[#5F8B7E]", bg="bg-white hover:bg-[#F4EBDD]" }: { icon: React.ReactNode, onClick: (e: any) => void, color?: string, bg?: string }) {
  return (
    <button onClick={onClick} className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-sm border border-[#F4EBDD] ${color} ${bg} active:scale-95`}>
      {icon}
    </button>
  );
}

function RateButton({ keyNum, label, sub, color, onClick }: { keyNum: string, label: string, sub: string, color: 'rose' | 'amber' | 'emerald', onClick: () => void }) {
  const colorMap = {
    rose: "border-[#F4EBDD] hover:border-[#C9785C] hover:bg-[#C9785C]/10 text-[#3F4A3C]/70 hover:text-[#C9785C]",
    amber: "border-[#F4EBDD] hover:border-[#8A8F4D] hover:bg-[#8A8F4D]/10 text-[#3F4A3C]/70 hover:text-[#8A8F4D]",
    emerald: "border-[#F4EBDD] hover:border-[#5F8B7E] hover:bg-[#5F8B7E]/10 text-[#3F4A3C]/70 hover:text-[#5F8B7E]",
  };

  return (
    <button 
      onClick={onClick}
      className={`group relative h-full rounded-2xl bg-white border-2 transition-all flex flex-col items-center justify-center shadow-sm hover:shadow-md active:scale-95 ${colorMap[color]}`}
    >
      <span className="font-extrabold text-lg md:text-xl transition-transform group-hover:scale-105">
        {label}
      </span>
      <span className="text-[10px] font-bold text-[#3F4A3C]/40 mt-1 hidden sm:block group-hover:text-current">
        {sub}
      </span>
      <span className="absolute top-2 left-2 text-[10px] font-bold text-[#3F4A3C]/20 bg-[#F4EBDD]/50 px-1.5 rounded group-hover:text-current group-hover:bg-transparent transition-colors hidden md:block">
        {keyNum}
      </span>
    </button>
  );
}