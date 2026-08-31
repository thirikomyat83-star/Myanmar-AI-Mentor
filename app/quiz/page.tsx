'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react'; 
import { useAuthStore } from '@/store/useAuthStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Import LaTeX utility
import { cleanLatex } from '@/utils/latex';

// ==========================================
// 1. ICONS
// ==========================================
const BackIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const SparkleIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.5 2L13 9.5L20.5 11L13 12.5L11.5 20L10 12.5L2.5 11L10 9.5L11.5 2Z" /></svg>;
const BrainIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const CheckCircleIcon = () => <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const XCircleIcon = () => <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
const HeartIcon = () => <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
const ClockIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TrophyIcon = () => <svg className="w-16 h-16 text-[#8A8F4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0H4m8 0h8m-8 0v13m0 13H4m8 0h8" /></svg>;
const UnlockIcon = () => <svg className="w-6 h-6 text-[#5F8B7E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>;
const RocketIcon = () => <svg className="w-16 h-16 text-[#C9785C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const SendIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const TargetIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><circle cx="12" cy="12" r="6" strokeWidth="2" /><circle cx="12" cy="12" r="2" strokeWidth="2" /></svg>;

// ==========================================
// 2. DATA TYPES & CONSTANTS
// ==========================================
interface Question {
  id?: string | number; 
  type?: 'multiple_choice' | 'fill_blank' | 'true_false' | 'matching' | 'mcq' | 'fib' | 'true_false_not_given';
  text?: string;
  question?: string;
  options?: string[];
  correct?: string;
  correct_answer?: string;
  explanation?: string;
  explanation_mm?: string;
  source_location?: string;
  scanning_hint_mm?: string;
  skill?: string;
  topic?: string; 
  difficulty?: string;
}

interface QuizIntent {
  topic: string;
  type: string;
  sourceText?: string;
  quizPassage?: string;
  quizData?: Question[];
  tutorQuizId?: string;
  is_chapter_quiz?: boolean;
  source?: string;
  subject?: string;
  subjects?: string;
  chapter?: string;
  taskId?: number | string; 
}

interface TutorResponse {
  status: 'funnel' | 'success' | 'quiz_active' | 'essay_practice';
  data: string;
  quiz_trigger?: string;
  quiz_id?: string;
  source_text?: string;
  suggestions?: string[];
  quiz_result?: {
    score: number;
    correct_count: number;
    total_questions: number;
    passed: boolean;
    results: any[];
  };
}

const LEVELS = ['Basic', 'Medium', 'High'] as const;
type LevelType = typeof LEVELS[number];
const QUESTIONS_PER_LEVEL = 5;
const TIMER_SECONDS = 30;
const MAX_HEARTS = 5;

const BASE_SCORE_PER_QUESTION = 10;
const BONUS_FAST = 3;
const BONUS_QUICK = 1;

const MOTIVATIONAL_QUOTES = [
  "ခက်ခဲတဲ့အရာတိုင်းက သင့်ကိုပိုတော်လာစေဖို့ပါ 💪",
  "နည်းနည်းချင်း ကြိုးစားမှုကနေ ကြီးမားတဲ့အောင်မြင်မှုတွေ ဖြစ်လာတာပါ 🌟",
  "မှားသွားလည်း ကိစ္စမရှိဘူး၊ အမှားကနေ သင်ယူကြမယ် 🧠",
  "မင်းလုပ်နိုင်ပါတယ်၊ ဆက်ပြီး ကြိုးစားလိုက်ပါ 🚀",
  "ဇွဲလုံးဝမလျှော့ပါနဲ့၊ ပန်းတိုင်က နီးနေပါပြီ 🎯",
  "ဒီနေ့ကြိုးစားမှုက မနက်ဖြန်အတွက် အကောင်းဆုံးရင်းနှီးမြှုပ်နှံမှုပါ 💎",
  "စာမေးပွဲဆိုတာ ကိုယ့်ကိုယ်ကို စမ်းသပ်ဖို့ အခွင့်အရေးတစ်ခုပါ 🎓"
];

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function QuizGeneratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const { data: session } = useSession();
  const { user: storeUser } = useAuthStore(); 
  const combinedUser = { ...(session?.user || {}), ...(storeUser || {}) } as any;

  // App States
  const [stage, setStage] = useState<'setup' | 'loading' | 'quiz' | 'level_complete' | 'level_up' | 'calculating' | 'result' | 'chat' | 'tutor_quiz'>('setup');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [topic, setTopic] = useState('');
  
  const [currentQuizType, setCurrentQuizType] = useState<string>("general");
  const [currentSourceText, setCurrentSourceText] = useState<string>("");
  const [quizPassage, setQuizPassage] = useState<string>("");
  
  // Level System
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [allQuestions, setAllQuestions] = useState<Record<LevelType, Question[]>>({ Basic: [], Medium: [], High: [] });
  const [currentLevelQuestions, setCurrentLevelQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);

  // UI States for Transitions
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [pendingNextIndex, setPendingNextIndex] = useState(0);
  const [randomQuote, setRandomQuote] = useState(MOTIVATIONAL_QUOTES[0]);

  // Diagnostic Specific State
  const [diagnosticScores, setDiagnosticScores] = useState<Record<string, {correct: number, total: number}>>({});
  const [diagnosticResultMsg, setDiagnosticResultMsg] = useState("");
  const [diagnosticOptions, setDiagnosticOptions] = useState<any[]>([]);
  
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, any[]>>({});
  
  // Mistakes Tracking for Flashcards
  const [wrongAnswersList, setWrongAnswersList] = useState<{question: string, correct_answer: string}[]>([]);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [fibInput, setFibInput] = useState<string>('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCurrentlyCorrect, setIsCurrentlyCorrect] = useState(false);
  
  // Scoring & Hearts
  const [totalScore, setTotalScore] = useState(0);
  const [levelScore, setLevelScore] = useState(0);
  const [levelCorrectCount, setLevelCorrectCount] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  const [totalCorrectAnswers, setTotalCorrectAnswers] = useState(0);
  
  // Timer
  const [timerSeconds, setTimerSeconds] = useState(TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const [timeBonus, setTimeBonus] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Rewards
  const [xpGained, setXpGained] = useState(0);
  const [flashcardsGenerated, setFlashcardsGenerated] = useState(false); 
  const [earnedTrophy, setEarnedTrophy] = useState(false);
  const [earnedHeart, setEarnedHeart] = useState(false);
  const [unlockedNext, setUnlockedNext] = useState(false);
  
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);

  // Tutor/Chat States
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; content: string; suggestions?: string[]; quizTrigger?: string; quizId?: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [tutorQuizId, setTutorQuizId] = useState<string | null>(null);
  const [tutorQuizData, setTutorQuizData] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [navigationSource, setNavigationSource] = useState<'dashboard' | 'learning-path' | 'chat' | 'study-plan' | 'unknown'>('unknown');
  const [learningPathParams, setLearningPathParams] = useState<{subject?: string; subjects?: string; chapter?: string}>({});

  const currentQ = stage === 'tutor_quiz' 
    ? tutorQuizData?.questions?.[questionIndex] 
    : currentLevelQuestions[questionIndex];
  const currentLevel = currentQuizType === 'diagnostic' ? (currentQ?.difficulty || 'Medium') : LEVELS[currentLevelIndex];

  // ==========================================
  // SAVE QUIZ SCORE FOR ANALYTICS GRAPH
  // ==========================================
  const saveQuizScoreToDB = async (finalScore: number, totalQuestions: number, currentTopic: string) => {
    try {
      const activeToken = token || localStorage.getItem('token');
      const studentId = combinedUser?.id || localStorage.getItem('student_id') || 'STU_TEMP';
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
      
      await fetch(`${baseUrl}/api/analytics/save-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          student_id: studentId,
          topic: currentTopic || "General",
          score: finalScore,
          total_questions: totalQuestions
        })
      });
    } catch (error) {
      console.error("❌ Failed to save quiz score:", error);
    }
  };

  // ==========================================
  // DETECT NAVIGATION SOURCE
  // ==========================================
  const detectNavigationSource = useCallback(() => {
    const sourceParam = searchParams.get('source') || searchParams.get('from');
    const subjectParam = searchParams.get('subject');
    const subjectsParam = searchParams.get('subjects');
    const chapterParam = searchParams.get('chapter');
    const taskIdParam = searchParams.get('taskId'); 
    
    if (sourceParam === 'study_plan') {
      setNavigationSource('study-plan');
      localStorage.setItem('quiz_nav_source', 'study-plan');
      if (taskIdParam) localStorage.setItem('quiz_nav_task_id', taskIdParam);
      return;
    }
    
    if (sourceParam === 'learning-path' || subjectParam || subjectsParam) {
      setNavigationSource('learning-path');
      setLearningPathParams({
        subject: subjectParam || undefined,
        subjects: subjectsParam || undefined,
        chapter: chapterParam || undefined
      });
      localStorage.setItem('quiz_nav_source', 'learning-path');
      if (subjectParam) localStorage.setItem('quiz_nav_subject', subjectParam);
      if (subjectsParam) localStorage.setItem('quiz_nav_subjects', subjectsParam);
      if (chapterParam) localStorage.setItem('quiz_nav_chapter', chapterParam);
      return;
    }
    
    if (sourceParam === 'chat') {
      setNavigationSource('chat');
      localStorage.setItem('quiz_nav_source', 'chat');
      return;
    }
    
    const intentStr = localStorage.getItem('quiz_intent');
    if (intentStr) {
      try {
        const intent: QuizIntent = JSON.parse(intentStr);
        
        if (intent.source === 'study_plan' || intent.taskId) {
          setNavigationSource('study-plan');
          localStorage.setItem('quiz_nav_source', 'study-plan');
          if (intent.taskId) localStorage.setItem('quiz_nav_task_id', intent.taskId.toString());
          return;
        }

        if (intent.source === 'learning-path' || intent.subject || intent.subjects) {
          setNavigationSource('learning-path');
          setLearningPathParams({
            subject: intent.subject || searchParams.get('subject') || undefined,
            subjects: intent.subjects || searchParams.get('subjects') || undefined,
            chapter: intent.chapter || searchParams.get('chapter') || undefined
          });
          localStorage.setItem('quiz_nav_source', 'learning-path');
          if (intent.subject) localStorage.setItem('quiz_nav_subject', intent.subject);
          if (intent.subjects) localStorage.setItem('quiz_nav_subjects', intent.subjects);
          if (intent.chapter) localStorage.setItem('quiz_nav_chapter', intent.chapter);
          return;
        }
        if (intent.source === 'chat') {
          setNavigationSource('chat');
          localStorage.setItem('quiz_nav_source', 'chat');
          return;
        }
      } catch(e) {
        console.error("Failed to parse quiz_intent for nav source:", e);
      }
    }
    
    const savedSource = localStorage.getItem('quiz_nav_source');
    if (savedSource === 'study-plan') {
      setNavigationSource('study-plan');
      return;
    }
    if (savedSource === 'learning-path') {
      setNavigationSource('learning-path');
      setLearningPathParams({
        subject: localStorage.getItem('quiz_nav_subject') || undefined,
        subjects: localStorage.getItem('quiz_nav_subjects') || undefined,
        chapter: localStorage.getItem('quiz_nav_chapter') || undefined
      });
      return;
    }
    if (savedSource === 'chat') {
      setNavigationSource('chat');
      return;
    }
    
    if (typeof window !== 'undefined' && window.document?.referrer) {
      const referrer = window.document.referrer;
      if (referrer.includes('/learning-path')) {
        setNavigationSource('learning-path');
        localStorage.setItem('quiz_nav_source', 'learning-path');
        return;
      }
      if (referrer.includes('/chat')) {
        setNavigationSource('chat');
        localStorage.setItem('quiz_nav_source', 'chat');
        return;
      }
      if (referrer.includes('/study-plan')) {
        setNavigationSource('study-plan');
        localStorage.setItem('quiz_nav_source', 'study-plan');
        return;
      }
    }
    
    setNavigationSource('dashboard');
  }, [searchParams]);

  // ==========================================
  // TIMER LOGIC
  // ==========================================
  const startTimer = useCallback(() => {
    setTimerSeconds(TIMER_SECONDS);
    setTimerActive(true);
    setTimeBonus(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setTimerActive(false);
  }, []);

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  useEffect(() => {
    if (chatEndRef.current && stage === 'chat') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, stage]);

  const getQuestionText = (q: Question): string => q?.text || q?.question || q?.statement || '';
  const getCorrectAnswer = (q: Question): string => q?.correct || q?.correct_answer || '';
  const getOptions = (q: Question): string[] => q?.options || [];
  const getExplanation = (q: Question): string => q?.explanation || q?.explanation_mm || `အဖြေမှန်မှာ ${getCorrectAnswer(q)} ဖြစ်ပါသည်။`;
  const getQuestionType = (q: Question): string => {
    if (q?.type === 'fib' || q?.type === 'fill_blank') return 'fib';
    if (q?.type === 'true_false' || q?.type === 'true_false_not_given') return 'true_false';
    return 'mcq';
  };

  const updateRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setRandomQuote(MOTIVATIONAL_QUOTES[randomIndex]);
  };

  // ==========================================
  // API: Generate Flashcards from Mistakes
  // ==========================================
  const generateMistakeFlashcards = async (mistakes: {question: string, correct_answer: string}[]) => {
    if (mistakes.length === 0) return;
    
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
    const studentId = combinedUser?.id || localStorage.getItem('student_id') || 'STU_TEMP';
    const activeToken = token || localStorage.getItem('token');
    
    const sourceText = mistakes.map(m => `Q: ${m.question} \nA: ${m.correct_answer}`).join("\n\n");
    
    try {
      const res = await fetch(`${baseUrl}/api/flashcards/generate/${encodeURIComponent(studentId)}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeToken}`,
              'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({ 
              topic: "Review Mistakes",
              context_type: "mistake",
              source_text: sourceText
          })
      });
      if (res.ok) {
        setFlashcardsGenerated(true);
      }
    } catch (error) {
      console.error("Mistake Flashcard Error:", error);
    }
  };

  // ==========================================
  // API: Fetch Diagnostic Quiz from Backend
  // ==========================================
  const fetchDiagnosticQuiz = async () => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
    const studentId = combinedUser?.id || localStorage.getItem('student_id') || 'STU_TEMP';
    const activeToken = token || localStorage.getItem('token');

    setLoadingMessage('ဘာသာရပ် (၆) ခုလုံးအတွက် အရည်အချင်းစစ် မေးခွန်းများ ပြင်ဆင်နေပါသည်... ⏳');
    setStage('loading');

    try {
      const res = await fetch(`${baseUrl}/api/tutor/diagnostic-quiz/${encodeURIComponent(studentId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate diagnostic quiz');
      }

      const data = await res.json();

      if (data.status === 'success' && data.subjects && data.subjects.length > 0) {
        const allQuestionsFlat: Question[] = [];
        
        data.subjects.forEach((subjectData: any) => {
          if (subjectData.questions && subjectData.questions.length > 0) {
            subjectData.questions.forEach((q: any) => {
              allQuestionsFlat.push({
                ...q,
                topic: subjectData.subject,
                difficulty: q.difficulty || 'Medium',
                question: q.question || q.text || '',
                options: q.options || [],
                correct_answer: q.correct_answer || q.correct || '',
                explanation: q.explanation || '',
                type: q.type || 'mcq'
              });
            });
          }
        });

        if (allQuestionsFlat.length > 0) {
          setTopic('Diagnostic Pretest');
          setCurrentQuizType('diagnostic');
          setCurrentLevelQuestions(allQuestionsFlat);
          setQuestionIndex(0);
          setHearts(MAX_HEARTS);
          setTotalScore(0);
          setTotalCorrectAnswers(0);
          setTotalQuestionsAnswered(0);
          setDiagnosticScores({});
          setDiagnosticAnswers({});
          setWrongAnswersList([]);
          setSelectedAnswer(null);
          setFibInput('');
          setIsAnswered(false);
          setIsCurrentlyCorrect(false);
          setStage('quiz');
          setQuestionStartTime(Date.now());
          updateRandomQuote();
          startTimer();
        } else {
          throw new Error('မေးခွန်းများ ရရှိမှု မရှိပါ။');
        }
      } else {
        throw new Error(data.detail || 'မေးခွန်းများ ရရှိမှု မရှိပါ။');
      }
    } catch (error: any) {
      console.error('Diagnostic Quiz Error:', error);
      alert(`❌ ${error.message || 'မေးခွန်းထုတ်ပေးရာတွင် အခက်အခဲရှိနေပါသည်။ ခေတ္တစောင့်ပြီး ထပ်မံကြိုးစားပါ။'}`);
      router.push('/dashboard');
    }
  };

  // ==========================================
  // API: Submit Diagnostic Result to Backend
  // ==========================================
  const submitDiagnosticResult = async (finalScores: Record<string, {correct: number, total: number}>) => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
    const studentId = combinedUser?.id || localStorage.getItem('student_id') || 'STU_TEMP';
    const activeToken = token || localStorage.getItem('token');

    const payload = {
        quiz_results: Object.keys(finalScores).map(sub => ({
            subject: sub,
            answers: diagnosticAnswers[sub] || []
        }))
    };

    try {
      const res = await fetch(`${baseUrl}/api/tutor/diagnostic-result/${encodeURIComponent(studentId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload) 
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to submit diagnostic result');
      }

      const data = await res.json();
      setDiagnosticResultMsg(data.message || '');
      setDiagnosticOptions(data.options || []);
      return data;
    } catch (error: any) {
      console.error('Diagnostic Result Error:', error);
      setDiagnosticResultMsg('အမှတ်တွက်ချက်ရာတွင် အခက်အခဲရှိပါသည်။ သို့သော် သင့်ရဲ့ ရလဒ်များကို အောက်တွင် ကြည့်ရှုနိုင်ပါသည်။');
      setDiagnosticOptions([]);
      return null;
    }
  };

  const handleDiagnosticAction = (action: any) => {
    if (action.action === 'single_subject') {
      router.push(`/study-plan?subject=${encodeURIComponent(action.subject)}`);
    } else if (action.action === 'all_subjects') {
      const subjects = action.subjects?.join(',') || '';
      router.push(`/study-plan?subjects=${encodeURIComponent(subjects)}`);
    }
  };

  // ==========================================
  // API: Fetch Quiz for Specific Level
  // ==========================================
  const fetchQuizLevel = async (targetTopic: string, quizType: string, sourceText: string, level: LevelType, customToken?: string) => {
    const levelNames: Record<LevelType, string> = { Basic: 'အခြေခံ', Medium: 'အလယ်အလတ်', High: 'အဆင့်မြင့်' };
    setLoadingMessage(`${levelNames[level]} Level အတွက် မေးခွန်းများ ပြင်ဆင်နေပါသည်...`);
    setStage('loading');
    
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
      const studentId = combinedUser?.id || localStorage.getItem('student_id') || 'STU_TEMP';
      const activeToken = customToken || token; 

      const body: any = { 
        student_id: studentId, 
        concept: targetTopic, 
        quiz_type: quizType, 
        source_text: sourceText, 
        count: QUESTIONS_PER_LEVEL 
      };

      // ✅ Reading/Grammar အတွက် difficulty မထည့်ပါနဲ့ - Level ခွဲစနစ်ကို ကျော်ဖြတ်မည်
      if (quizType !== 'reading' && quizType !== 'grammar') {
        body.difficulty = level;
      }

      const res = await fetch(`${baseUrl}/api/generate/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeToken}`, 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(body) 
      });

      if (!res.ok) { const errorData = await res.json().catch(() => ({})); throw new Error(errorData.detail || 'Failed to generate quiz'); }
      const data = await res.json();
      
      if (data.quiz && data.quiz.length > 0) {
        setAllQuestions(prev => ({ ...prev, [level]: data.quiz }));
        return data.quiz;
      } else {
        throw new Error('မေးခွန်းများ ရှာမတွေ့ပါ။');
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message || 'Network error'}`);
      setStage('setup');
      return [];
    }
  };

  const startLevel = async (levelIndex: number) => {
    setCurrentLevelIndex(levelIndex);
    const level = LEVELS[levelIndex];
    let questions = allQuestions[level];
    
    // ✅ Reading/Grammar အတွက် Level မခွဲဘဲ မေးခွန်းများကို တိုက်ရိုက်ယူမည်
    if (currentQuizType === 'reading' || currentQuizType === 'grammar') {
      setLoadingMessage('မေးခွန်းများ ပြင်ဆင်နေပါသည်...');
      setStage('loading');
      
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
        const studentId = combinedUser?.id || localStorage.getItem('student_id') || 'STU_TEMP';
        const activeToken = token;

        const res = await fetch(`${baseUrl}/api/generate/quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeToken}`, 'ngrok-skip-browser-warning': 'true' },
          body: JSON.stringify({ 
            student_id: studentId, 
            concept: topic, 
            quiz_type: currentQuizType, 
            source_text: currentSourceText, 
            difficulty: 'N/A', // 🚨 Level မပို့ပါ
            count: 10 // 🚨 ၁၀ ပုဒ် အတိအကျ
          }) 
        });

        if (!res.ok) { 
          const errorData = await res.json().catch(() => ({})); 
          throw new Error(errorData.detail || 'Failed to generate quiz'); 
        }
        const data = await res.json();
        
        if (data.quiz && data.quiz.length > 0) {
          setCurrentLevelQuestions(data.quiz);
          setQuizPassage(data.quiz_passage || ''); // ✅ ဒါကို ထည့်ထားရပါမယ်
          setCurrentSourceText(data.quiz_passage || ''); // ✅ ဒါကို ထည့်ထားရပါမယ် // 🚨 Passage ကို မှန်ကန်စွာ ပြသရန်
          setQuestionIndex(0);
          setLevelScore(0);
          setLevelCorrectCount(0);
          setSelectedAnswer(null);
          setFibInput('');
          setIsAnswered(false);
          setIsCurrentlyCorrect(false);
          setQuestionStartTime(Date.now());
          updateRandomQuote();
          setStage('quiz');
          startTimer();
          return;
        } else {
          throw new Error('မေးခွန်းများ ရှာမတွေ့ပါ။');
        }
      } catch (error: any) {
        alert(`❌ Error: ${error.message || 'Network error'}`);
        setStage('setup');
        return;
      }
    }
    
    // ✅ ကျန်တဲ့ Quiz တွေအတွက် မူလအတိုင်း Level စနစ် ဆက်သုံးမည်
    if (questions.length === 0) {
      questions = await fetchQuizLevel(topic, currentQuizType, currentSourceText, level);
      if (questions.length === 0) return;
    }
    
    setCurrentLevelQuestions(questions);
    setQuestionIndex(0);
    setLevelScore(0);
    setLevelCorrectCount(0);
    setSelectedAnswer(null);
    setFibInput('');
    setIsAnswered(false);
    setIsCurrentlyCorrect(false);
    setQuestionStartTime(Date.now());
    updateRandomQuote();
    setStage('quiz');
    startTimer();
  };

  // ==========================================
  // TUTOR CHAT FUNCTIONS
  // ==========================================
  const callTutorAPI = async (userMessage: string) => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
    const studentId = combinedUser?.id || localStorage.getItem('student_id') || 'STU_TEMP';
    try {
      const res = await fetch(`${baseUrl}/api/tutor/english-practice/${encodeURIComponent(studentId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ topic: userMessage })
      });
      if (!res.ok) throw new Error('Tutor API error');
      return await res.json();
    } catch (error) {
      return { status: 'success', data: 'ကျေးဇူးပြု၍ ထပ်မံကြိုးစားပါ။', suggestions: ['[English] Reading Passages'] } as TutorResponse;
    }
  };

  const submitTutorQuiz = async (quizId: string, answers: { question_id: number | string; answer: string }[]) => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
    const studentId = combinedUser?.id || localStorage.getItem('student_id') || 'STU_TEMP';
    try {
      const res = await fetch(`${baseUrl}/api/tutor/english-practice/${encodeURIComponent(studentId)}/submit-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ quiz_id: quizId, answers })
      });
      if (!res.ok) throw new Error('Submit quiz error');
      return await res.json();
    } catch (error) {
      return { status: 'success', data: 'အဖြေစစ်ဆေးရာတွင် အခက်အခဲရှိပါသည်။' } as TutorResponse;
    }
  };

  const handleTutorChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    if (userMsg === '[Submit Quiz Answers]' && tutorQuizId && tutorQuizData) {
      setCurrentLevelQuestions(tutorQuizData.questions);
      setQuestionIndex(0);
      setLevelScore(0);
      setLevelCorrectCount(0);
      setSelectedAnswer(null);
      setFibInput('');
      setIsAnswered(false);
      setIsCurrentlyCorrect(false);
      setHearts(MAX_HEARTS);
      setTotalQuestionsAnswered(0);
      setTotalCorrectAnswers(0);
      setWrongAnswersList([]);
      setStage('tutor_quiz');
      setQuestionStartTime(Date.now());
      startTimer();
      return;
    }

    const response = await callTutorAPI(userMsg);
    if (response.status === 'quiz_active' && response.quiz_trigger) {
      try {
        const quizData = JSON.parse(response.quiz_trigger);
        setTutorQuizId(response.quiz_id || '');
        setTutorQuizData(quizData);
        setChatMessages(prev => [...prev, { role: 'ai', content: response.data, suggestions: response.suggestions, quizTrigger: response.quiz_trigger, quizId: response.quiz_id }]);
      } catch (e) {
        setChatMessages(prev => [...prev, { role: 'ai', content: response.data, suggestions: response.suggestions }]);
      }
    } else {
      setChatMessages(prev => [...prev, { role: 'ai', content: response.data, suggestions: response.suggestions }]);
    }
  };

  const handleStartTutorQuiz = () => {
    if (!tutorQuizData) return;
    setCurrentLevelQuestions(tutorQuizData.questions);
    setQuestionIndex(0);
    setLevelScore(0);
    setLevelCorrectCount(0);
    setSelectedAnswer(null);
    setFibInput('');
    setIsAnswered(false);
    setIsCurrentlyCorrect(false);
    setHearts(MAX_HEARTS);
    setTotalQuestionsAnswered(0);
    setTotalCorrectAnswers(0);
    setWrongAnswersList([]);
    // ✅ ပြင်ဆင်ချက်: Quiz Passage ကို သေချာသတ်မှတ်ရန်
    if (tutorQuizData.quiz_passage) {
      setCurrentSourceText(tutorQuizData.quiz_passage);
      setQuizPassage(tutorQuizData.quiz_passage);
    }
    setStage('tutor_quiz');
    setQuestionStartTime(Date.now());
    startTimer();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setChatInput(suggestion);
    handleTutorChatSendWithMessage(suggestion);
  };

  const handleTutorChatSendWithMessage = async (message: string) => {
    setChatMessages(prev => [...prev, { role: 'user', content: message }]);
    const response = await callTutorAPI(message);
    if (response.status === 'quiz_active' && response.quiz_trigger) {
      try {
        const quizData = JSON.parse(response.quiz_trigger);
        setTutorQuizId(response.quiz_id || '');
        setTutorQuizData(quizData);
        // ✅ ပြင်ဆင်ချက်: quiz_intent ကို update လုပ်ပြီး quizPassage ကို မှန်ကန်စွာ သိမ်းဆည်းရန်
        const intentStr = localStorage.getItem('quiz_intent');
        if (intentStr) {
          try {
            const intent = JSON.parse(intentStr);
            intent.quizPassage = quizData.quiz_passage || intent.quizPassage || '';
            intent.quizData = quizData.questions || intent.quizData || [];
            intent.tutorQuizId = response.quiz_id || intent.tutorQuizId || '';
            localStorage.setItem('quiz_intent', JSON.stringify(intent));
          } catch (e) {}
        }
        setChatMessages(prev => [...prev, { role: 'ai', content: response.data, suggestions: response.suggestions, quizTrigger: response.quiz_trigger, quizId: response.quiz_id }]);
      } catch (e) {
        setChatMessages(prev => [...prev, { role: 'ai', content: response.data, suggestions: response.suggestions }]);
      }
    } else {
      setChatMessages(prev => [...prev, { role: 'ai', content: response.data, suggestions: response.suggestions }]);
    }
  };

  const handleSubmitTutorQuiz = async () => {
    if (!tutorQuizId || !tutorQuizData) return;
    stopTimer();
    const answers = tutorQuizData.questions.map((q: Question, idx: number) => ({
      question_id: q.id || idx + 1,
      answer: selectedAnswer || fibInput || ''
    }));
    
    if (wrongAnswersList.length > 0) {
      generateMistakeFlashcards(wrongAnswersList);
    }
    
    setLoadingMessage('အဖြေများ စစ်ဆေးနေပါသည်...');
    setStage('loading');
    const response = await submitTutorQuiz(tutorQuizId, answers);
    setChatMessages(prev => [...prev, { role: 'ai', content: response.data, suggestions: response.suggestions }]);
    setTutorQuizId(null);
    setTutorQuizData(null);
    setSelectedAnswer(null);
    setFibInput('');
    setIsAnswered(false);
    setStage('chat');
  };

  // ==========================================
  // INITIALIZATION
  // ==========================================
  useEffect(() => {
    setMounted(true);
    const storedToken = localStorage.getItem('token');
    if (!storedToken) { router.replace('/'); return; }
    setToken(storedToken);

    detectNavigationSource();

    const checkInitialState = async () => {
      const type = searchParams.get('type');
      if (type === 'diagnostic') {
          await fetchDiagnosticQuiz();
          return; 
      }

      const intentStr = localStorage.getItem('quiz_intent');
      if (intentStr) {
        try {
          const intent: QuizIntent = JSON.parse(intentStr);
          
          if (intent.source === 'study_plan' || intent.taskId) {
            setNavigationSource('study-plan');
            localStorage.setItem('quiz_nav_source', 'study-plan');
            if (intent.taskId) localStorage.setItem('quiz_nav_task_id', intent.taskId.toString());
          } else if (intent.source === 'learning-path' || intent.subject || intent.subjects) {
            setNavigationSource('learning-path');
            setLearningPathParams({
              subject: intent.subject || undefined,
              subjects: intent.subjects || undefined,
              chapter: intent.chapter || undefined
            });
            localStorage.setItem('quiz_nav_source', 'learning-path');
            if (intent.subject) localStorage.setItem('quiz_nav_subject', intent.subject);
            if (intent.subjects) localStorage.setItem('quiz_nav_subjects', intent.subjects);
            if (intent.chapter) localStorage.setItem('quiz_nav_chapter', intent.chapter);
          }
          
          setTopic(intent.topic);
          setCurrentQuizType(intent.type || "general");
          setCurrentSourceText(intent.sourceText || "");
          if (intent.quizPassage) setQuizPassage(intent.quizPassage);

          // ✅ ပြင်ဆင်ချက်: Reading/Grammar/English အတွက် quizData ရှိလျှင် tutor_quiz အဖြစ် စတင်ရန်
          if ((intent.type === "english" || intent.type === "reading") && intent.quizData && intent.quizData.length > 0) {
              const mappedQuestions: Question[] = intent.quizData.map((q: any) => ({
                  id: q.id?.toString() || '',
                  type: q.type === 'fill_blank' ? 'fib' : q.type === 'true_false_not_given' ? 'true_false' : q.type === 'error_correction' ? 'fib' : 'mcq',
                  question: q.text || q.question || q.statement || '',
                  options: q.options || (q.type === 'true_false_not_given' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : []),
                  correct_answer: q.correct || q.correct_answer || '',
                  explanation: q.explanation_mm || q.explanation || '',
                  topic: q.skill || intent.topic || 'English Practice',
                  difficulty: 'Medium'
              }));
              
              setCurrentLevelQuestions(mappedQuestions);
              setTutorQuizId(intent.tutorQuizId || null);
              
              // ✅ THE FIX: Reading အတွက် quizPassage ရှိလျှင် tutorQuizData ထဲမှာ ထည့်မည်
              if (intent.quizPassage) {
                setTutorQuizData({ questions: mappedQuestions, quiz_passage: intent.quizPassage });
                setCurrentSourceText(intent.quizPassage);
                setQuizPassage(intent.quizPassage);
              } else {
                setTutorQuizData({ questions: mappedQuestions });
              }
              
              setStage('tutor_quiz');
              setHearts(MAX_HEARTS);
              setTotalScore(0);
              setTotalCorrectAnswers(0);
              setCurrentLevelIndex(0);
              setQuestionIndex(0);
              setWrongAnswersList([]);
              setQuestionStartTime(Date.now());
              updateRandomQuote();
              startTimer();
              return;
          }

          // ✅ THE FIX: Reading အတွက် quizData မရှိရင် startLevel(0) ကို တိုက်ရိုက်ခေါ်မည်
          if (intent.type === "reading") {
            await startLevel(0);
            return;
          }


          if (intent.type === "diagnostic" && intent.quizData && intent.quizData.length > 0) {
            setCurrentLevelQuestions(intent.quizData);
            setStage('quiz');
            setHearts(MAX_HEARTS);
            setTotalScore(0);
            setTotalCorrectAnswers(0);
            setDiagnosticScores({});
            setDiagnosticAnswers({});
            setWrongAnswersList([]);
            setQuestionStartTime(Date.now());
            updateRandomQuote();
            startTimer();
            return;
          }

          const questions = await fetchQuizLevel(intent.topic, intent.type || "general", intent.sourceText || "", "Basic", storedToken);
          if (questions.length > 0) {
            setCurrentLevelQuestions(questions);
            setAllQuestions(prev => ({ ...prev, Basic: questions }));
            setStage('quiz');
            setCurrentLevelIndex(0);
            setHearts(MAX_HEARTS);
            setTotalScore(0);
            setTotalCorrectAnswers(0);
            setWrongAnswersList([]);
            setQuestionStartTime(Date.now());
            updateRandomQuote();
            startTimer();
          }
          return;
        } catch (e) { console.error("Failed to parse quiz intent", e); }
      }

      const savedListeningQuiz = localStorage.getItem('listening_quiz_data');
      if (savedListeningQuiz) {
        try {
          const parsedData = JSON.parse(savedListeningQuiz);
          setCurrentLevelQuestions(parsedData);
          setTopic('Listening Comprehension Test');
          setCurrentQuizType('listening');
          setStage('quiz');
          setWrongAnswersList([]);
          updateRandomQuote();
          startTimer();
          localStorage.removeItem('listening_quiz_data');
          return; 
        } catch (error) { console.error("Error parsing listening quiz data:", error); }
      }
    };
    checkInitialState();
  }, [router, combinedUser?.id, searchParams, detectNavigationSource]); 

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) return;
    setCurrentQuizType('general');
    setCurrentSourceText('');
    const q = await fetchQuizLevel(topic, "general", "", "Basic");
    if (q.length > 0) {
      setCurrentLevelQuestions(q);
      setAllQuestions(prev => ({ ...prev, Basic: q }));
      setStage('quiz');
      setCurrentLevelIndex(0);
      setHearts(MAX_HEARTS);
      setTotalScore(0);
      setTotalCorrectAnswers(0);
      setWrongAnswersList([]);
      updateRandomQuote();
      startTimer();
    }
  };

  // ==========================================
  // Answer Selection & Mistake Tracking
  // ==========================================
  const handleSelectAnswer = (option: string) => {
    if (hearts <= 0 && currentQuizType !== 'diagnostic') {
      alert("💔 သင့်ရဲ့ အသဲ (Hearts) ကုန်သွားပါပြီ! အချိန်ခဏစောင့်ပါ သို့မဟုတ် သင်ခန်းစာများကို ပြန်လည်ဖတ်ရှုပါ။");
      return; 
    }

    if (isAnswered || !timerActive) return;
    stopTimer();
    setSelectedAnswer(option);
    setIsAnswered(true);

    const timeTaken = TIMER_SECONDS - timerSeconds;
    const correctAnswer = getCorrectAnswer(currentQ).trim().toLowerCase();
    const selectedClean = option.trim().toLowerCase();
    const isCorrect = selectedClean === correctAnswer;

    if (isCorrect) {
      const bonus = timeTaken <= 10 ? BONUS_FAST : timeTaken <= 20 ? BONUS_QUICK : 0;
      setTimeBonus(bonus);
      setLevelScore(prev => prev + BASE_SCORE_PER_QUESTION + bonus);
      setLevelCorrectCount(prev => prev + 1);
      setTotalCorrectAnswers(prev => prev + 1);
      setIsCurrentlyCorrect(true);
    } else {
      setTimeBonus(0);
      setHearts(prev => Math.max(0, prev - 1));
      setIsCurrentlyCorrect(false);
      setWrongAnswersList(prev => [...prev, {
        question: getQuestionText(currentQ), 
        correct_answer: getCorrectAnswer(currentQ)
      }]);
    }
  };

  const handleSubmitFib = () => {
    if (hearts <= 0 && currentQuizType !== 'diagnostic') {
      alert("💔 သင့်ရဲ့ အသဲ (Hearts) ကုန်သွားပါပြီ! အချိန်ခဏစောင့်ပါ သို့မဟုတ် သင်ခန်းစာများကို ပြန်လည်ဖတ်ရှုပါ။");
      return; 
    }

    if (isAnswered || !fibInput.trim() || !timerActive) return;
    stopTimer();
    setIsAnswered(true);

    const timeTaken = TIMER_SECONDS - timerSeconds;
    const correctAnswer = getCorrectAnswer(currentQ).trim().toLowerCase();
    const isCorrect = fibInput.trim().toLowerCase() === correctAnswer;

    if (isCorrect) {
      const bonus = timeTaken <= 10 ? BONUS_FAST : timeTaken <= 20 ? BONUS_QUICK : 0;
      setTimeBonus(bonus);
      setLevelScore(prev => prev + BASE_SCORE_PER_QUESTION + bonus);
      setLevelCorrectCount(prev => prev + 1);
      setTotalCorrectAnswers(prev => prev + 1);
      setIsCurrentlyCorrect(true);
    } else {
      setTimeBonus(0);
      setHearts(prev => Math.max(0, prev - 1));
      setIsCurrentlyCorrect(false);
      setWrongAnswersList(prev => [...prev, {
        question: getQuestionText(currentQ), 
        correct_answer: getCorrectAnswer(currentQ)
      }]);
    }
  };

  // ==========================================
  // Next Question & Transitions
  // ==========================================
  const handleNextQuestion = async () => {
    const studentId = combinedUser?.id || localStorage.getItem('student_id') || 'STU_TEMP';
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
    const timeSpentMs = Date.now() - questionStartTime;
    const questionTopic = currentQ?.topic || topic;
    
    fetch(`${baseUrl}/api/tracing/quiz`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` , 'ngrok-skip-browser-warning': 'true'},
      body: JSON.stringify({ student_id: studentId, concept: questionTopic, is_correct: isCurrentlyCorrect ? 1 : 0, response_time_ms: timeSpentMs })
    }).catch(err => console.error("Tracing API Error:", err));

    if (currentQuizType === 'diagnostic') {
        const subjectTopic = currentQ?.topic || "General";
        setDiagnosticAnswers(prev => ({
            ...prev,
            [subjectTopic]: [
                ...(prev[subjectTopic] || []),
                {
                    question: getQuestionText(currentQ),
                    selected_answer: selectedAnswer || fibInput || '',
                    correct_answer: getCorrectAnswer(currentQ)
                }
            ]
        }));
        
        setDiagnosticScores(prev => ({
            ...prev,
            [subjectTopic]: {
                correct: (prev[subjectTopic]?.correct || 0) + (isCurrentlyCorrect ? 1 : 0),
                total: (prev[subjectTopic]?.total || 0) + 1
            }
        }));
    }

    const newTotalAnswered = totalQuestionsAnswered + 1;
    setTotalQuestionsAnswered(newTotalAnswered);
    const nextQIndex = questionIndex + 1;

    // 🚨 END OF QUIZ CHECK 🚨
    if (nextQIndex >= currentLevelQuestions.length) {
      setTotalScore(prev => prev + levelScore);
      
      if (currentQuizType === 'diagnostic') {
          calculateResults(newTotalAnswered, "Medium");
          return;
      }

      // ✅ Reading/Grammar အတွက် Level မခွဲဘဲ တိုက်ရိုက် Result ထုတ်ပေးမည်
      if (currentQuizType === 'reading' || currentQuizType === 'grammar') {
          calculateResults(newTotalAnswered, "Practice");
          return;
      }

      // ကျန်သော Topic အားလုံး Basic -> Medium -> High အတိုင်းသွားမည်
      if (currentLevelIndex === LEVELS.length - 1) {
        calculateResults(newTotalAnswered, "High");
      } else {
        setShowLevelModal(true);
      }
      return;
    }

    // 🚨 Hearts ကုန်သွားရင် Quiz အဆုံးသတ်မည် (Diagnostic/Reading/Grammar မှလွဲ၍)
    if (hearts <= 0 && !isCurrentlyCorrect && currentQuizType !== 'diagnostic' && currentQuizType !== 'reading' && currentQuizType !== 'grammar') {
      setTotalScore(prev => prev + levelScore);
      calculateResults(newTotalAnswered, currentLevel);
      return;
    }

    const nextQ = currentLevelQuestions[nextQIndex];

    // 🚨 Diagnostic Quiz အတွက် Subject ပြောင်းလဲမှု စစ်ဆေးခြင်း
    if (currentQuizType === 'diagnostic') {
        if (currentQ.topic !== nextQ.topic) {
            setPendingNextIndex(nextQIndex);
            setShowSubjectModal(true); 
            return;
        }
    } 
    // ✅ Reading/Grammar အတွက် Level ခွဲစနစ်ကို လုံးဝကျော်ဖြတ်မည်
    else if (currentQuizType === 'reading' || currentQuizType === 'grammar') {
        // ဘာမှမလုပ်ပါ၊ နောက်မေးခွန်းကို ဆက်သွားမည်
    }
    // ကျန်သော Topic အားလုံး (၅) ပုဒ်ပြည့်တိုင်း Level Modal ပြမည်
    else {
        if (nextQIndex % QUESTIONS_PER_LEVEL === 0) {
            setPendingNextIndex(nextQIndex);
            setShowLevelModal(true); 
            return;
        }
    }
    
    proceedToNextQuestion(nextQIndex);
  };

  const proceedToNextQuestion = (idx: number) => {
    setQuestionIndex(idx);
    setSelectedAnswer(null);
    setFibInput('');
    setIsAnswered(false);
    setIsCurrentlyCorrect(false);
    setQuestionStartTime(Date.now());
    updateRandomQuote();
    startTimer();
  };

  const calculateResults = async (finalAttempted: number, stoppedLevel: string = "Basic") => {
    setLoadingMessage('အမှတ်များ တွက်ချက်နေပါသည်... 🧮');
    setShowLevelModal(false);
    setShowSubjectModal(false);
    setStage('calculating');
    stopTimer();

    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
    const studentId = combinedUser?.id || localStorage.getItem('student_id') || 'STU_TEMP';

    if (wrongAnswersList.length > 0) {
      generateMistakeFlashcards(wrongAnswersList);
    }

    if (currentQuizType === 'english' || currentQuizType === 'grammar') {
        try {
            let actualTutorQuizId = tutorQuizId;
            if (!actualTutorQuizId) {
                const intentStr = localStorage.getItem('quiz_intent');
                if (intentStr) {
                    try {
                        const intent = JSON.parse(intentStr);
                        actualTutorQuizId = intent.tutorQuizId || '';
                    } catch(e) {}
                }
            }
            
            if (actualTutorQuizId) {
                const answers = currentLevelQuestions.map((q, idx) => ({
                    question_id: q.id || idx + 1,
                    answer: selectedAnswer || fibInput || ''
                }));
                
                fetch(`${baseUrl}/api/tutor/english-practice/${encodeURIComponent(studentId)}/submit-quiz`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
                    body: JSON.stringify({ quiz_id: actualTutorQuizId, answers })
                }).catch(e => console.error("Tutor quiz submit error", e));
            }
        } catch(e) {}
    }

    if (currentQuizType === 'diagnostic') {
        try {
            const subjectTopic = currentQ?.topic || "General";
            const finalScores = { ...diagnosticScores };
            if (!finalScores[subjectTopic]) finalScores[subjectTopic] = { correct: 0, total: 0 };
            finalScores[subjectTopic].correct += (isCurrentlyCorrect ? 1 : 0);
            finalScores[subjectTopic].total += 1;

            await submitDiagnosticResult(finalScores);
        } catch(e) { console.error('Diagnostic error:', e); }
        setTimeout(() => setStage('result'), 1500);
        return;
    }

    // 🚨 NEW: SAVE TO ANALYTICS DATABASE FOR PROGRESS PAGE 🚨
    await saveQuizScoreToDB(totalCorrectAnswers, finalAttempted, topic || currentQ?.topic || "General");

    // ✅ Reading/Grammar အတွက် XP စနစ် ပြင်ဆင်ခြင်း
    let earnedXP = 0;
    if (currentQuizType === 'reading' || currentQuizType === 'grammar') {
        earnedXP = totalCorrectAnswers * 10;
    } else if (stoppedLevel === "Basic") earnedXP = totalCorrectAnswers * 5;
    else if (stoppedLevel === "Medium") earnedXP = totalCorrectAnswers * 10;
    else if (stoppedLevel === "High") earnedXP = totalCorrectAnswers * 15;

    try {
      const completeRes = await fetch(`${baseUrl}/api/quiz/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          student_id: studentId, topic: topic, difficulty: stoppedLevel, completed_level: stoppedLevel,
          total_questions: finalAttempted, correct_answers: totalCorrectAnswers, quiz_type: currentQuizType,
          lost_hearts: MAX_HEARTS - hearts 
        })
      });

      if (completeRes.ok) {
        const completeData = await completeRes.json();
        setXpGained(completeData.earned_xp || earnedXP);
        if (completeData.flashcards_generated) setFlashcardsGenerated(true); 
        setEarnedTrophy(completeData.earned_trophy || false);
        setEarnedHeart(completeData.refilled_hearts || completeData.earned_heart);
        setUnlockedNext(completeData.unlocked_next_path || false);

        const quizIntentStr = localStorage.getItem('quiz_intent');
        let isChapterQuiz = false;
        if (quizIntentStr) {
           try {
             const intent = JSON.parse(quizIntentStr);
             isChapterQuiz = intent.is_chapter_quiz === true;
           } catch(e) {}
        }

        if (isChapterQuiz && (totalCorrectAnswers / finalAttempted) >= 0.5) {
            localStorage.setItem('show_confetti', 'true');
        }

        if (completeData.refilled_hearts || completeData.unlocked_next_path) {
          alert(`🎉 ဂုဏ်ယူပါတယ်! သင် ၈၀% အထက် ရရှိသွားပါပြီ!\n\n🏆 နောက်တစ်ဆင့် (Level) သို့ ကူးပြောင်းသွားသလို၊ သင့်ရဲ့ အသဲ (၅) ခုလည်း အပြည့်ပြန်လည်ရရှိသွားပါပြီ!`);
          setHearts(MAX_HEARTS); 
        }
      } else {
        setXpGained(earnedXP);
      }
    } catch (err) {
      setXpGained(earnedXP);
    }
    
    setTimeout(() => setStage('result'), 1500);
  };

  // NAVIGATION FUNCTION: Go back to the original source
  const handleNavigateBack = () => {
    stopTimer();
    
    localStorage.removeItem('quiz_intent');
    
    switch (navigationSource) {
      case 'study-plan': 
        const savedTaskId = searchParams.get('taskId') || localStorage.getItem('quiz_nav_task_id');
        localStorage.removeItem('quiz_nav_source');
        localStorage.removeItem('quiz_nav_task_id');
        
        if (savedTaskId) {
          router.push(`/study-plan?completed_task_id=${savedTaskId}`);
        } else {
          router.push('/study-plan');
        }
        router.refresh();
        break;

      case 'learning-path':
        const subject = learningPathParams.subject || localStorage.getItem('quiz_nav_subject');
        const subjects = learningPathParams.subjects || localStorage.getItem('quiz_nav_subjects');
        const chapter = learningPathParams.chapter || localStorage.getItem('quiz_nav_chapter');
        
        localStorage.removeItem('quiz_nav_source');
        localStorage.removeItem('quiz_nav_subject');
        localStorage.removeItem('quiz_nav_subjects');
        localStorage.removeItem('quiz_nav_chapter');
        
        let pathUrl = '/learning-path';
        const queryParams = new URLSearchParams();
        if (subject) queryParams.append('subject', subject);
        if (subjects) queryParams.append('subjects', subjects);
        if (chapter) queryParams.append('chapter', chapter);
        queryParams.append('from_quiz', 'true');
        
        const queryString = queryParams.toString();
        router.push(queryString ? `${pathUrl}?${queryString}` : pathUrl);
        router.refresh();
        break;
        
      case 'chat':
        localStorage.removeItem('quiz_nav_source');
        localStorage.removeItem('quiz_nav_subject');
        localStorage.removeItem('quiz_nav_subjects');
        localStorage.removeItem('quiz_nav_chapter');
        router.push('/chat');
        router.refresh();
        break;
        
      case 'dashboard':
      default:
        localStorage.removeItem('quiz_nav_source');
        localStorage.removeItem('quiz_nav_subject');
        localStorage.removeItem('quiz_nav_subjects');
        localStorage.removeItem('quiz_nav_chapter');
        router.push('/dashboard');
        router.refresh();
        break;
    }
  };

  const handleContinueToNextLevelModal = () => {
    setShowLevelModal(false);
    const nextLevelIndex = currentLevelIndex + 1;
    setStage('level_up');
    setTimeout(() => { startLevel(nextLevelIndex); }, 2000);
  };

  const handleRetryQuiz = () => {
    setAllQuestions({ Basic: [], Medium: [], High: [] });
    setTotalScore(0);
    setTotalCorrectAnswers(0);
    setHearts(MAX_HEARTS);
    setTotalQuestionsAnswered(0);
    setWrongAnswersList([]);
    startLevel(0);
  };

  const getBackButtonLabel = (): string => {
    switch (navigationSource) {
      case 'study-plan':
        return 'Study Plan သို့';
      case 'learning-path':
        return 'Learning Path သို့';
      case 'chat':
        return 'Chat သို့';
      case 'dashboard':
      default:
        return 'Dashboard သို့';
    }
  };

  const renderMessage = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold">$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      formatted = formatted.replace(/```(.*?)```/gs, '<code class="bg-gray-100 px-2 py-0.5 rounded text-sm">$1</code>');
      formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');
      if (line.startsWith('### ')) {
        formatted = `<span class="text-lg font-extrabold text-[#3F4A3C]">${formatted.replace('### ', '')}</span>`;
      } else if (line.startsWith('## ')) {
        formatted = `<span class="text-xl font-black text-[#3F4A3C]">${formatted.replace('## ', '')}</span>`;
      }
      return <span key={i} dangerouslySetInnerHTML={{ __html: formatted }} className="block" />;
    });
  };

  // ✨ 🚨 THE FIX: Reading/Grammar အတွက် sourceText (quiz_passage) ကို တိုက်ရိုက်သုံးမည် 🚨 ✨
  const displayPassage = tutorQuizData?.quiz_passage || quizPassage || currentSourceText;
  const hasPassage = (currentQuizType === 'english' || currentQuizType === 'reading' || currentQuizType === 'grammar') && displayPassage && displayPassage.length > 100;
  if (!mounted || !token) return null;

  // ==========================================
  // 🚀 RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#3F4A3C] font-sans antialiased tracking-tight relative overflow-hidden selection:bg-[#F4EBDD] selection:text-[#5F8B7E]">
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#8A8F4D] rounded-full filter blur-[150px] opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#C9785C] rounded-full mix-blend-multiply filter blur-[150px] opacity-5 pointer-events-none"></div>

      <nav className="w-full px-6 py-5 relative z-20">
        <button onClick={handleNavigateBack} className="flex items-center gap-2 text-[#3F4A3C]/60 hover:text-[#5F8B7E] font-bold transition-colors">
          <div className="p-2 bg-white rounded-full shadow-sm border border-[#F4EBDD]"><BackIcon /></div>
          {getBackButtonLabel()}
        </button>
      </nav>

      {/* ✨ 🚨 THE FIX: Adjust max-width dynamically for split screen 🚨 ✨ */}
      <main className={`mx-auto px-4 py-8 relative z-10 min-h-[80vh] flex flex-col justify-center ${hasPassage && (stage === 'quiz' || stage === 'tutor_quiz') ? 'max-w-7xl w-full' : 'max-w-4xl'}`}>
        
        <AnimatePresence mode="wait">
          
          {/* SETUP */}
          {stage === 'setup' && searchParams.get('type') !== 'diagnostic' && (
            <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="w-20 h-20 bg-[#5F8B7E] text-[#FFFDF8] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#5F8B7E]/20 rotate-3"><BrainIcon /></div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tighter text-[#3F4A3C]">AI Quiz Generator</h1>
              <p className="text-[#3F4A3C]/60 font-medium mb-10 max-w-md mx-auto">သင်လေ့လာလိုသော ခေါင်းစဉ်ကို ရိုက်ထည့်ပါ။ Level ၃ ဆင့် (Basic → Medium → High) ဖြင့် စစ်ဆေးပါမည်။</p>
              <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgb(63,74,60,0.04)] border border-[#F4EBDD]">
                <div className="text-left mb-6">
                  <label className="block text-sm font-bold text-[#3F4A3C]/70 mb-2 pl-2">ခေါင်းစဉ် (Topic)</label>
                  <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateQuiz(); }} placeholder="ဥပမာ - English Grammar, Newton's Laws..." className="w-full bg-[#FFFDF8] border-2 border-[#F4EBDD] rounded-2xl px-6 py-4 outline-none focus:border-[#5F8B7E] focus:shadow-[0_0_0_4px_rgb(95,139,126,0.1)] transition-all font-bold text-[#3F4A3C] placeholder:font-medium placeholder:text-[#3F4A3C]/30" />
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-8">
                  {['English Grammar', 'Biology Cells', 'Algebra', 'World War 2'].map(s => (
                    <button key={s} onClick={() => setTopic(s)} className="flex-shrink-0 px-4 py-2 bg-[#FFFDF8] border border-[#F4EBDD] rounded-full text-xs font-bold text-[#3F4A3C]/60 hover:border-[#5F8B7E]/50 hover:text-[#5F8B7E] transition-colors">{s}</button>
                  ))}
                </div>
                <button onClick={handleGenerateQuiz} disabled={!topic.trim()} className="w-full py-4 bg-[#5F8B7E] text-white rounded-full font-extrabold text-lg shadow-[0_8px_20px_rgb(95,139,126,0.3)] hover:bg-[#4a6d62] transition-all disabled:opacity-50 flex items-center justify-center gap-2"><SparkleIcon /> မေးခွန်းများ ဖန်တီးမည်</button>
              </div>
            </motion.div>
          )}

          {/* LOADING / CALCULATING */}
          {(stage === 'loading' || stage === 'calculating') && (
            <motion.div key={stage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
              <div className="relative w-24 h-24 mb-8"><div className="absolute inset-0 border-4 border-[#F4EBDD] rounded-full"></div><div className="absolute inset-0 border-4 border-[#5F8B7E] rounded-full border-t-transparent animate-spin"></div><div className="absolute inset-0 flex items-center justify-center text-[#5F8B7E]"><SparkleIcon /></div></div>
              <h2 className="text-xl font-extrabold text-[#3F4A3C] mb-2">{loadingMessage}</h2>
              <p className="text-sm font-bold text-[#3F4A3C]/40">ခေတ္တစောင့်ပါ...</p>
            </motion.div>
          )}

          {/* LEVEL UP TOAST / TRANSITION */}
          {stage === 'level_up' && (
            <motion.div key="levelup" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-32 h-32 bg-gradient-to-tr from-[#8A8F4D] to-[#C9785C] rounded-full flex items-center justify-center shadow-2xl mb-6 animate-bounce"><RocketIcon /></div>
              <h2 className="text-5xl font-black text-[#5F8B7E] mb-3 tracking-tighter">LEVEL UP! 🚀</h2>
              <p className="text-lg font-bold text-[#3F4A3C]/60 bg-[#F4EBDD] px-6 py-2 rounded-full">ပိုမိုခက်ခဲသော မေးခွန်းများ စတင်ပါတော့မည်...</p>
            </motion.div>
          )}

          {/* CHAT INTERFACE (for Tutor) */}
          {stage === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full h-full flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[60vh] min-h-[300px] bg-white/50 rounded-2xl p-4 border border-[#F4EBDD]">
                {chatMessages.length === 0 && (
                  <div className="text-center py-10 text-[#3F4A3C]/40 font-bold">
                    <BrainIcon />
                    <p className="mt-3">English Tutor မှ ကြိုဆိုပါတယ်။ အောက်က Topic တစ်ခုကို ရွေးချယ်ပါ။</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {['[English] Reading Passages', '[English] Grammar Patterns', '[English] Essay Writing'].map(s => (
                        <button key={s} onClick={() => handleSuggestionClick(s)} className="px-3 py-1.5 bg-[#5F8B7E]/10 text-[#5F8B7E] rounded-full text-xs font-bold hover:bg-[#5F8B7E]/20 transition-colors">{s}</button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-[#5F8B7E] text-white' : 'bg-[#F4EBDD] text-[#3F4A3C]'}`}>
                      <div className="text-sm font-medium whitespace-pre-wrap">{renderMessage(msg.content)}</div>
                      {msg.quizTrigger && (
                        <button onClick={handleStartTutorQuiz} className="mt-3 w-full py-3 bg-[#5F8B7E] text-white rounded-xl font-extrabold text-sm hover:bg-[#4a6d62] transition-all flex items-center justify-center gap-2">
                          <SparkleIcon /> Start Quiz
                        </button>
                      )}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {msg.suggestions.filter(s => s !== '[Submit Quiz Answers]').map((s, si) => (
                            <button key={si} onClick={() => handleSuggestionClick(s)} className="px-3 py-1.5 bg-white/60 text-[#3F4A3C] rounded-full text-xs font-bold hover:bg-white transition-colors border border-[#F4EBDD]">{s}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-3">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleTutorChatSend(); }} placeholder="Type your topic or select from suggestions..." className="flex-1 bg-white border-2 border-[#F4EBDD] rounded-2xl px-5 py-4 outline-none focus:border-[#5F8B7E] transition-all font-bold text-[#3F4A3C] placeholder:text-[#3F4A3C]/30" />
                <button onClick={handleTutorChatSend} disabled={!chatInput.trim()} className="px-5 py-4 bg-[#5F8B7E] text-white rounded-2xl font-extrabold disabled:opacity-50 hover:bg-[#4a6d62] transition-all"><SendIcon /></button>
              </div>
            </motion.div>
          )}

          {/* TUTOR QUIZ */}
          {stage === 'tutor_quiz' && currentQ && (
            <motion.div key={`tq-${questionIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full">
              
              {/* ✨ 🚨 THE FIX: SPLIT SCREEN FOR TUTOR QUIZ PASSAGE 🚨 ✨ */}
              <div className={`flex flex-col ${hasPassage ? 'lg:flex-row lg:items-start' : ''} gap-6 md:gap-10 w-full`}>
                
                {/* PASSAGE SIDE */}
                {hasPassage && (
                  <div className="lg:w-1/2 flex flex-col w-full h-[40vh] lg:h-[80vh] lg:sticky lg:top-8 order-1">
                    <div className="bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(63,74,60,0.04)] border border-[#F4EBDD] flex-1 overflow-y-auto scrollbar-hide">
                      <div className="sticky top-0 bg-white/90 backdrop-blur-md pb-4 mb-4 border-b border-[#F4EBDD] z-10 flex items-center justify-between">
                        <h3 className="text-lg font-extrabold text-[#5F8B7E] flex items-center gap-2">
                          <SparkleIcon /> Reading Passage
                        </h3>
                      </div>
                      <div className="text-[15px] leading-relaxed text-[#3F4A3C]/80 font-medium whitespace-pre-wrap">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {cleanLatex(displayPassage)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}

                {/* QUIZ SIDE */}
                <div className={`${hasPassage ? 'lg:w-1/2' : 'w-full'} flex flex-col w-full order-2`}>
                  <div className="mb-6">
                    <div className="flex justify-between items-center text-xs font-bold text-[#3F4A3C]/50 mb-2 uppercase tracking-widest">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 rounded-full text-white text-[11px] font-extrabold bg-[#5F8B7E]">Practice Quiz</span>
                        <span>Q: {questionIndex + 1} / {currentLevelQuestions.length}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-0.5">{Array.from({ length: MAX_HEARTS }).map((_, i) => (<span key={i} className={i < hearts ? 'opacity-100' : 'opacity-20'}><HeartIcon /></span>))}</div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-extrabold text-sm ${timerSeconds <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : timerSeconds <= 20 ? 'bg-amber-100 text-amber-700' : 'bg-[#F4EBDD] text-[#3F4A3C]'}`}><ClockIcon /> {timerSeconds}s</div>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[#F4EBDD] rounded-full overflow-hidden">
                      <motion.div initial={{ width: `${(questionIndex / currentLevelQuestions.length) * 100}%` }} animate={{ width: `${((questionIndex + 1) / currentLevelQuestions.length) * 100}%` }} className="h-full bg-[#5F8B7E] rounded-full" />
                    </div>
                  </div>

                  <div className="bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-[#F4EBDD] mb-8">
                    <h2 className="text-xl md:text-2xl font-extrabold text-[#3F4A3C] leading-relaxed mb-8">
                      <span className="text-xs font-black bg-[#F4EBDD] px-3 py-1 rounded-md text-[#5F8B7E] uppercase block w-max mb-4">{currentQ?.topic || currentQ?.skill || 'Practice'}</span>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {cleanLatex(getQuestionText(currentQ))}
                      </ReactMarkdown>
                    </h2>

                    {getQuestionType(currentQ) === 'fib' ? (
                      <div className="space-y-4">
                        <input type="text" value={fibInput} onChange={(e) => setFibInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitFib(); }} disabled={isAnswered || !timerActive} placeholder="Type your answer here..." className={`w-full p-5 rounded-2xl border-2 font-bold transition-all outline-none text-lg ${isAnswered ? (isCurrentlyCorrect ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800') : 'bg-[#FFFDF8] border-[#F4EBDD] text-[#3F4A3C] focus:border-[#5F8B7E]/50'}`} />
                        {!isAnswered && timerActive && (<button onClick={handleSubmitFib} disabled={!fibInput.trim()} className="w-full py-4 bg-[#5F8B7E] text-white rounded-xl font-extrabold disabled:opacity-50 hover:bg-[#4a6d62] transition-all">အဖြေတင်သွင်းမည်</button>)}
                        {isAnswered && (
                          <div className="flex items-center gap-2 mt-2 px-2 font-bold">
                            {isCurrentlyCorrect ? <><CheckCircleIcon /> <span className="text-green-600">အဖြေမှန်! {timeBonus > 0 && <span className="text-amber-600">(+{timeBonus} Bonus)</span>}</span></> : <><XCircleIcon /> <span className="text-red-600">မှားပါသည်။ အဖြေမှန်: <span className="text-gray-800 bg-gray-100 px-2 py-0.5 rounded font-mono">{getCorrectAnswer(currentQ)}</span></span></>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getOptions(currentQ).map((option, idx) => {
                          const isSelected = selectedAnswer === option;
                          const correctAnswer = getCorrectAnswer(currentQ).trim().toLowerCase();
                          const isCorrect = option.trim().toLowerCase() === correctAnswer;
                          let btnStyle = "bg-[#FFFDF8] border-[#F4EBDD] text-[#3F4A3C] hover:border-[#5F8B7E]/40";
                          if (isAnswered) {
                            if (isCorrect) btnStyle = "bg-green-50 border-green-200 text-green-800 shadow-sm";
                            else if (isSelected && !isCorrect) btnStyle = "bg-red-50 border-red-200 text-red-800";
                            else btnStyle = "bg-[#FFFDF8] border-[#F4EBDD] text-[#3F4A3C]/40 opacity-50";
                          } else if (isSelected) { btnStyle = "bg-[#5F8B7E]/10 border-[#5F8B7E] text-[#5F8B7E]"; }
                          return (
                            <button key={idx} onClick={() => handleSelectAnswer(option)} disabled={isAnswered || !timerActive} className={`w-full p-5 text-left rounded-2xl border-2 font-bold transition-all flex items-center justify-between ${btnStyle}`}>
                              <span>
                                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                      {cleanLatex(option)}
                                  </ReactMarkdown>
                              </span>
                              {isAnswered && isCorrect && <CheckCircleIcon />}
                              {isAnswered && isSelected && !isCorrect && <XCircleIcon />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {!timerActive && !isAnswered && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-center"><p className="font-bold text-red-600">⏰ အချိန်ကုန်သွားပါပြီ!</p></div>
                    )}

                    <AnimatePresence>
                      {isAnswered && (
                        <motion.div key="explanation-box" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 p-5 bg-[#F4EBDD]/50 border border-[#F4EBDD] rounded-2xl overflow-hidden">
                          <div className="flex items-center gap-2 mb-2 text-sm font-extrabold text-[#8A8F4D]"><SparkleIcon /> AI Explanation</div>
                          <div className="text-sm font-medium text-[#3F4A3C]/80 leading-relaxed">
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {cleanLatex(getExplanation(currentQ))}
                              </ReactMarkdown>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={handleSubmitTutorQuiz} disabled={!isAnswered && timerActive} className={`px-8 py-4 bg-[#3F4A3C] text-white rounded-full font-extrabold shadow-lg hover:bg-[#2a3228] transition-all disabled:opacity-30 flex items-center gap-2`}>
                      Tutor အဖြေတင်သွင်းမည် →
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ACTIVE QUIZ (Original + Diagnostic) */}
          {stage === 'quiz' && currentQ && !showLevelModal && !showSubjectModal && (
            <motion.div key={`q-${currentLevel}-${questionIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full">
              
              {/* ✨ 🚨 THE FIX: SPLIT SCREEN FOR REGULAR QUIZ PASSAGE 🚨 ✨ */}
              <div className={`flex flex-col ${hasPassage ? 'lg:flex-row lg:items-start' : ''} gap-6 md:gap-10 w-full`}>
                
                {/* PASSAGE SIDE */}
                {hasPassage && (
                  <div className="lg:w-1/2 flex flex-col w-full h-[40vh] lg:h-[80vh] lg:sticky lg:top-8 order-1">
                    <div className="bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(63,74,60,0.04)] border border-[#F4EBDD] flex-1 overflow-y-auto scrollbar-hide">
                      <div className="sticky top-0 bg-white/90 backdrop-blur-md pb-4 mb-4 border-b border-[#F4EBDD] z-10 flex items-center justify-between">
                        <h3 className="text-lg font-extrabold text-[#5F8B7E] flex items-center gap-2">
                          <SparkleIcon /> Reading Passage
                        </h3>
                      </div>
                      <div className="text-[15px] leading-relaxed text-[#3F4A3C]/80 font-medium whitespace-pre-wrap">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {cleanLatex(displayPassage)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}

                {/* QUIZ SIDE */}
                <div className={`${hasPassage ? 'lg:w-1/2' : 'w-full'} flex flex-col w-full order-2`}>
                  <div className="mb-6">
                    <div className="flex justify-between items-center text-xs font-bold text-[#3F4A3C]/50 mb-2 uppercase tracking-widest">
                      <div className="flex items-center gap-3">
                        {/* ✅ THE FIX: Reading/Grammar အတွက် Level Label ပြင်ဆင်ခြင်း */}
                        <span className={`px-3 py-1.5 rounded-full text-white text-[11px] font-extrabold ${currentQuizType === 'diagnostic' ? 'bg-[#C9785C]' : currentQuizType === 'reading' ? 'bg-[#8A8F4D]' : currentQuizType === 'grammar' ? 'bg-[#5F8B7E]' : currentLevel === 'High' ? 'bg-[#C9785C]' : currentLevel === 'Medium' ? 'bg-[#8A8F4D]' : 'bg-[#5F8B7E]'}`}>
                          {currentQuizType === 'diagnostic' ? (currentQ?.topic || 'Diagnostic') : currentQuizType === 'reading' ? '📖 Reading' : currentQuizType === 'grammar' ? '📚 Grammar' : `${currentLevel} Level`}
                        </span>
                        <span>Q: {questionIndex + 1} / {currentLevelQuestions.length}</span>
                        <span className="px-2 py-1 rounded-md bg-[#3F4A3C]/10 text-[#3F4A3C] text-[10px]">
                          {currentQuizType === 'diagnostic' ? '🩺' : currentQuizType === 'reading' ? '📖' : currentQuizType === 'grammar' ? '📚' : currentQuizType === 'formula' ? '📐' : currentQuizType === 'english' ? '🇬🇧' : currentQuizType === 'listening' ? '🎧' : '📝'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-0.5">{Array.from({ length: MAX_HEARTS }).map((_, i) => (<span key={i} className={i < hearts ? 'opacity-100' : 'opacity-20'}><HeartIcon /></span>))}</div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-extrabold text-sm ${timerSeconds <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : timerSeconds <= 20 ? 'bg-amber-100 text-amber-700' : 'bg-[#F4EBDD] text-[#3F4A3C]'}`}><ClockIcon /> {timerSeconds}s</div>
                      </div>
                    </div>
                    
                    <div className="w-full h-2 bg-[#F4EBDD] rounded-full overflow-hidden mt-3">
                      <motion.div initial={{ width: `${(questionIndex / currentLevelQuestions.length) * 100}%` }} animate={{ width: `${((questionIndex + 1) / currentLevelQuestions.length) * 100}%` }} className="h-full bg-[#5F8B7E] rounded-full" />
                    </div>
                  </div>

                  <div className="bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-[#F4EBDD] mb-8">
                    
                    <div className="mb-6 text-center">
                      <span className="text-[13px] font-bold text-[#C9785C] bg-[#C9785C]/10 px-4 py-1.5 rounded-full inline-block mb-4">
                        ✨ {randomQuote}
                      </span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-extrabold text-[#3F4A3C] leading-relaxed mb-8">
                      <span className="text-xs font-black bg-[#F4EBDD] px-3 py-1 rounded-md text-[#5F8B7E] uppercase block w-max mb-4">{currentQ?.topic || topic}</span>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {cleanLatex(getQuestionText(currentQ))}
                      </ReactMarkdown>
                    </h2>

                    {getQuestionType(currentQ) === 'fib' ? (
                      <div className="space-y-4">
                        <input type="text" value={fibInput} onChange={(e) => setFibInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitFib(); }} disabled={isAnswered || !timerActive} placeholder="Type your answer here..." className={`w-full p-5 rounded-2xl border-2 font-bold transition-all outline-none text-lg ${isAnswered ? (isCurrentlyCorrect ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800') : 'bg-[#FFFDF8] border-[#F4EBDD] text-[#3F4A3C] focus:border-[#5F8B7E]/50'}`} />
                        {!isAnswered && timerActive && (<button onClick={handleSubmitFib} disabled={!fibInput.trim()} className="w-full py-4 bg-[#5F8B7E] text-white rounded-xl font-extrabold disabled:opacity-50 hover:bg-[#4a6d62] transition-all">အဖြေတင်သွင်းမည်</button>)}
                        {isAnswered && (
                          <div className="flex items-center gap-2 mt-2 px-2 font-bold">
                            {isCurrentlyCorrect ? <><CheckCircleIcon /> <span className="text-green-600">အဖြေမှန်! {timeBonus > 0 && <span className="text-amber-600">(+{timeBonus} Bonus)</span>}</span></> : <><XCircleIcon /> <span className="text-red-600">မှားပါသည်။ အဖြေမှန်: <span className="text-gray-800 bg-gray-100 px-2 py-0.5 rounded font-mono">{getCorrectAnswer(currentQ)}</span></span></>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getOptions(currentQ).map((option, idx) => {
                          const isSelected = selectedAnswer === option;
                          const correctAnswer = getCorrectAnswer(currentQ).trim().toLowerCase();
                          const isCorrect = option.trim().toLowerCase() === correctAnswer;
                          let btnStyle = "bg-[#FFFDF8] border-[#F4EBDD] text-[#3F4A3C] hover:border-[#5F8B7E]/40";
                          if (isAnswered) {
                            if (isCorrect) btnStyle = "bg-green-50 border-green-200 text-green-800 shadow-sm";
                            else if (isSelected && !isCorrect) btnStyle = "bg-red-50 border-red-200 text-red-800";
                            else btnStyle = "bg-[#FFFDF8] border-[#F4EBDD] text-[#3F4A3C]/40 opacity-50";
                          } else if (isSelected) { btnStyle = "bg-[#5F8B7E]/10 border-[#5F8B7E] text-[#5F8B7E]"; }
                          return (
                            <button key={idx} onClick={() => handleSelectAnswer(option)} disabled={isAnswered || !timerActive} className={`w-full p-5 text-left rounded-2xl border-2 font-bold transition-all flex items-center justify-between ${btnStyle}`}>
                              <span>
                                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                      {cleanLatex(option)}
                                  </ReactMarkdown>
                              </span>
                              {isAnswered && isCorrect && <CheckCircleIcon />}
                              {isAnswered && isSelected && !isCorrect && <XCircleIcon />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {!timerActive && !isAnswered && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-center"><p className="font-bold text-red-600">⏰ အချိန်ကုန်သွားပါပြီ!</p></div>
                    )}

                    <AnimatePresence>
                      {isAnswered && (
                        <motion.div key="explanation-box" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 p-5 bg-[#F4EBDD]/50 border border-[#F4EBDD] rounded-2xl overflow-hidden">
                          <div className="flex items-center gap-2 mb-2 text-sm font-extrabold text-[#8A8F4D]"><SparkleIcon /> AI Explanation</div>
                          <div className="text-sm font-medium text-[#3F4A3C]/80 leading-relaxed">
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {cleanLatex(getExplanation(currentQ))}
                              </ReactMarkdown>
                          </div>
                          {currentQ?.source_location && <p className="text-xs font-bold text-[#5F8B7E] mt-2">📍 {currentQ.source_location}</p>}
                          {currentQ?.scanning_hint_mm && <p className="text-xs font-bold text-[#C9785C] mt-1">🔍 {currentQ.scanning_hint_mm}</p>}
                          {timeBonus > 0 && <p className="text-xs font-bold text-amber-600 mt-2">⚡ အချိန်စောဖြေနိုင်သဖြင့် +{timeBonus} Bonus ရရှိပါသည်!</p>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={handleNextQuestion} disabled={!isAnswered && timerActive} className={`px-8 py-4 bg-[#3F4A3C] text-white rounded-full font-extrabold shadow-lg hover:bg-[#2a3228] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2`}>
                      {currentQuizType === 'diagnostic' 
                        ? (questionIndex === currentLevelQuestions.length - 1 ? 'Diagnostic အဆုံးသတ်မည် →' : 'ဆက်သွားမည် →')
                        : currentQuizType === 'reading' || currentQuizType === 'grammar'
                          ? (questionIndex === currentLevelQuestions.length - 1 ? 'Quiz ပြီးဆုံးမည် →' : 'ဆက်သွားမည် →')
                          : (questionIndex === currentLevelQuestions.length - 1 ? 'Level ပြီးဆုံးမည် →' : 'ဆက်သွားမည် →')
                      }
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* 🚨 STUNNING RESULT CARD WITH DYNAMIC NAVIGATION 🚨 */}
          {stage === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl mx-auto">
              
              <div className="text-center bg-white rounded-[3rem] shadow-[0_30px_60px_rgb(63,74,60,0.08)] border border-[#F4EBDD] overflow-hidden">
                <div className="bg-gradient-to-br from-[#5F8B7E] to-[#4a6d62] p-10 text-white relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg">
                      {earnedTrophy || currentQuizType === 'diagnostic' ? <TrophyIcon /> : <TargetIcon />}
                    </div>
                  </div>
                  
                  <h2 className="text-4xl font-black mb-2 tracking-tight">Quiz ပြီးဆုံးပါပြီ!</h2>
                  <p className="text-white/80 font-medium">"{topic}"</p>
                </div>

                <div className="p-8 md:p-12 bg-slate-50/50">
                  {/* DIAGNOSTIC CUSTOM RESULT UI */}
                  {currentQuizType === 'diagnostic' ? (
                    <div className="mb-8 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
                      {/* Subject Scores Grid */}
                      {Object.keys(diagnosticScores).length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-lg font-extrabold text-[#3F4A3C] mb-4 flex items-center gap-2">
                            <TargetIcon /> ဘာသာရပ်အလိုက် ရမှတ်များ
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(diagnosticScores).map(([subject, score]) => {
                              const percent = Math.round((score.correct / score.total) * 100) || 0;
                              let colorClass = 'bg-[#5F8B7E]';
                              let textClass = 'text-[#5F8B7E]';
                              let bgLightClass = 'bg-[#5F8B7E]/10';
                              if (percent < 50) { colorClass = 'bg-red-400'; textClass = 'text-red-500'; bgLightClass = 'bg-red-50'; }
                              else if (percent < 80) { colorClass = 'bg-[#8A8F4D]'; textClass = 'text-[#8A8F4D]'; bgLightClass = 'bg-[#8A8F4D]/10'; }

                              return (
                                <div key={subject} className="bg-white rounded-[1.5rem] p-4 border border-[#F4EBDD] shadow-sm flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform">
                                  <span className="text-[11px] font-extrabold text-[#3F4A3C]/50 uppercase tracking-wider mb-2 line-clamp-1">{subject}</span>
                                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${bgLightClass} ${textClass} font-black text-xl mb-2`}>
                                    {percent}%
                                  </div>
                                  <span className="text-[10px] font-bold text-[#3F4A3C]/40">{score.correct} / {score.total} Correct</span>
                                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full ${colorClass} rounded-full`} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* AI Analysis Box */}
                      {diagnosticResultMsg && (
                        <div className="bg-gradient-to-br from-[#F4EBDD]/40 to-white p-6 md:p-8 rounded-[2rem] border border-[#F4EBDD] shadow-sm relative overflow-hidden mb-8">
                          <div className="absolute top-[-20px] right-[-20px] text-8xl opacity-5"><BrainIcon /></div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-[#5F8B7E] text-white rounded-lg flex items-center justify-center"><SparkleIcon /></div>
                            <h3 className="text-lg font-extrabold text-[#3F4A3C]">AI သုံးသပ်ချက်</h3>
                          </div>
                          <div className="text-[15px] text-[#3F4A3C]/80 font-medium leading-relaxed whitespace-pre-wrap relative z-10">
                            {diagnosticResultMsg}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div>
                        <h3 className="text-sm font-extrabold text-[#3F4A3C]/50 uppercase tracking-widest text-center mb-4">Recommended Actions</h3>
                        {diagnosticOptions && diagnosticOptions.length > 0 ? (
                          <div className="flex flex-col gap-3 justify-center">
                            {diagnosticOptions.map((opt, i) => (
                              <button key={i} onClick={() => handleDiagnosticAction(opt)} className="group relative w-full bg-white border-2 border-[#5F8B7E]/20 text-[#5F8B7E] py-4 px-6 rounded-2xl font-extrabold shadow-sm hover:border-[#5F8B7E] hover:bg-[#5F8B7E] hover:text-white transition-all flex items-center justify-between overflow-hidden">
                                <span className="relative z-10">{opt.label}</span>
                                <span className="relative z-10 opacity-50 group-hover:opacity-100 transition-opacity">→</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3 justify-center">
                            <button onClick={handleNavigateBack} className="w-full bg-[#5F8B7E] text-white py-4 rounded-2xl font-extrabold shadow-sm hover:bg-[#4a6d62] transition-all">
                              {navigationSource === 'study-plan' ? '✅ ပြီးမြောက်ပါပြီ (Back to Study Plan)' : getBackButtonLabel()}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                          <div className="bg-white border border-[#F4EBDD] rounded-3xl p-5 text-center shadow-sm flex flex-col justify-center">
                            <span className="text-[10px] font-black text-[#3F4A3C]/40 uppercase tracking-widest mb-1">Total Score</span>
                            <span className="text-3xl font-black text-[#5F8B7E]">{totalScore}</span>
                          </div>
                          <div className="bg-gradient-to-br from-[#8A8F4D] to-[#71753f] border border-[#8A8F4D]/50 rounded-3xl p-5 text-center shadow-md text-white flex flex-col justify-center">
                            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">XP Gained</span>
                            <span className="text-3xl font-black">+{xpGained}</span>
                          </div>
                          <div className="bg-white border border-[#F4EBDD] rounded-3xl p-5 text-center shadow-sm flex flex-col justify-center">
                            <span className="text-[10px] font-black text-[#3F4A3C]/40 uppercase tracking-widest mb-1">Accuracy</span>
                            <span className="text-2xl font-black text-[#3F4A3C] mt-1">{totalCorrectAnswers}/{totalQuestionsAnswered}</span>
                          </div>
                          <div className="bg-white border border-[#F4EBDD] rounded-3xl p-5 text-center shadow-sm flex flex-col items-center justify-center">
                            <span className="text-[10px] font-black text-[#3F4A3C]/40 uppercase tracking-widest mb-2">Hearts</span>
                            <div className="flex gap-0.5 justify-center">
                              {Array.from({ length: MAX_HEARTS }).map((_, i) => (<span key={i} className={i < hearts ? 'opacity-100 scale-110' : 'opacity-20'}><HeartIcon /></span>))}
                            </div>
                          </div>
                        </div>

                        {/* Badges / Rewards */}
                        <div className="flex flex-wrap justify-center gap-3 mb-10">
                          {earnedTrophy && <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-200 text-yellow-900 px-5 py-2.5 rounded-full font-bold shadow-sm text-sm border border-yellow-300">🏆 Mastery Trophy ရရှိပါသည်!</div>}
                          {earnedHeart && <div className="flex items-center gap-2 bg-red-100 text-red-600 px-5 py-2.5 rounded-full font-bold shadow-sm text-sm border border-red-200">❤️ အသဲ (၁) ခု ပြန်လည်ရရှိပါသည်!</div>}
                          {unlockedNext && <div className="flex items-center gap-2 bg-[#5F8B7E]/10 text-[#5F8B7E] px-5 py-2.5 rounded-full font-bold shadow-sm border border-[#5F8B7E]/20 text-sm"><UnlockIcon /> နောက် Level ပွင့်သွားပါပြီ!</div>}
                        </div>
                        
                        {/* 🚨 FLASHCARDS GENERATION TOAST NOTIFICATION 🚨 */}
                        {flashcardsGenerated && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 bg-[#FFFDF8] border-2 border-[#C9785C]/30 p-6 rounded-3xl flex items-start gap-4 text-left shadow-sm">
                            <div className="text-[#C9785C] mt-1 p-3 bg-[#C9785C]/10 rounded-2xl"><BrainIcon /></div>
                            <div>
                                <h4 className="font-extrabold text-[#C9785C] text-lg mb-1">Flashcards အသစ် ဖန်တီးထားပါသည်!</h4>
                                <p className="text-sm font-medium text-[#3F4A3C]/70 leading-relaxed mb-4">
                                    သင်မှားယွင်းခဲ့သော မေးခွန်းများမှ မှတ်စုကတ် (Flashcards) များကို AI မှ အလိုအလျောက် ပြင်ဆင်ပေးထားပါတယ်။
                                </p>
                                <button onClick={() => router.push('/flashcards-vault')} className="text-sm font-extrabold bg-[#C9785C] text-white px-5 py-2.5 rounded-full hover:bg-[#b36348] transition-colors shadow-sm">
                                    Vault သို့သွားမည် →
                                </button>
                            </div>
                          </motion.div>
                        )}
                        
                        {/* 🚨 DYNAMIC NAVIGATION BUTTONS BASED ON SOURCE 🚨 */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full mt-4">
                          <button onClick={handleRetryQuiz} className="flex-1 py-4 bg-white text-[#3F4A3C] border-2 border-[#F4EBDD] rounded-2xl font-bold hover:bg-[#F4EBDD] hover:border-[#F4EBDD] transition-all shadow-sm">ဒီခေါင်းစဉ် ပြန်ဖြေမည်</button>
                          <button onClick={() => { stopTimer(); setStage('setup'); setTopic(''); setCurrentQuizType('general'); setCurrentSourceText(''); setAllQuestions({ Basic: [], Medium: [], High: [] }); router.replace('/quiz'); }} className="flex-1 py-4 bg-white text-[#3F4A3C] border-2 border-[#F4EBDD] rounded-2xl font-bold hover:bg-[#F4EBDD] hover:border-[#F4EBDD] transition-all shadow-sm">အခြားခေါင်းစဉ် ဖြေမည်</button>
                          
                          {/* 🚨 PRIMARY BUTTON: Go back to source (Learning Path / Chat / Dashboard / Study Plan) 🚨 */}
                          <button onClick={handleNavigateBack} className="flex-1 py-4 bg-[#5F8B7E] text-white rounded-2xl font-extrabold shadow-md hover:bg-[#4a6d62] transition-all">
                            {navigationSource === 'study-plan' ? '✅ ပြီးမြောက်ပါပြီ (Back to Study Plan)' : getBackButtonLabel()}
                          </button>
                        </div>
                      </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* 🌟 LEVEL TRANSITION MODAL (For Normal Quizzes) */}
        <AnimatePresence>
          {showLevelModal && (
            <motion.div key="level-modal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -50 }} className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 rounded-3xl shadow-2xl z-50 border border-[#F4EBDD]">
              <div className="text-7xl mb-4 animate-bounce">🏆</div>
              <h2 className="text-3xl md:text-4xl font-black text-[#5F8B7E] mb-3 tracking-tighter">{currentLevel} Level အောင်မြင်ပါပြီ!</h2>
              <p className="text-[#3F4A3C]/70 mb-8 text-center font-medium max-w-md">ယခုအမှတ်ဖြင့် ရပ်တန့်ပြီး အမှတ် (XP) ရယူမလား? သို့မဟုတ် ပိုမိုခက်ခဲသော <span className="font-bold text-[#C9785C]">{LEVELS[currentLevelIndex + 1]} Level</span> သို့ ကူးပြောင်းပြီး XP ပိုယူမလား?</p>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button onClick={() => calculateResults(totalQuestionsAnswered, currentLevel)} className="px-8 py-4 border-2 border-[#5F8B7E] text-[#5F8B7E] font-bold rounded-xl hover:bg-[#F4EBDD]">🛑 ဒီမှာပဲ ရပ်ပြီး အမှတ်ယူမည်</button>
                <button onClick={handleContinueToNextLevelModal} className="px-8 py-4 bg-[#5F8B7E] text-white font-extrabold rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">🚀 နောက်တစ်ဆင့်သို့ ကူးမည်</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🌟 SUBJECT TRANSITION MODAL (For Diagnostic Quizzes) */}
        <AnimatePresence>
          {showSubjectModal && (
            <motion.div key="subject-modal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -50 }} className="absolute inset-0 bg-gradient-to-br from-[#C9785C] to-[#e89a7e] flex flex-col items-center justify-center p-8 rounded-3xl shadow-2xl z-50 text-white text-center">
              <div className="text-7xl mb-6">🎯</div>
              <h2 className="text-3xl md:text-4xl font-black mb-3">{currentQ?.topic} ဘာသာရပ် ပြီးဆုံးပါပြီ!</h2>
              <p className="mb-8 font-medium text-white/90 max-w-md">အရမ်းတော်တယ်! မေးခွန်းတွေ အများကြီး ဖြေဆိုနိုင်ခဲ့ပြီ။ ဆက်လက်ကြိုးစားလိုက်ရအောင်!</p>
              <div className="p-4 bg-white/20 rounded-2xl mb-8 border border-white/30 backdrop-blur-sm">
                <p className="text-base font-bold">👉 နောက်ထပ် <b className="text-yellow-200">{currentLevelQuestions[pendingNextIndex]?.topic}</b> ဘာသာရပ်ကို ဆက်သွားကြမယ်!</p>
              </div>
              <button onClick={() => { setShowSubjectModal(false); proceedToNextQuestion(pendingNextIndex); }} className="px-10 py-5 bg-white text-[#C9785C] font-extrabold text-lg rounded-full shadow-lg hover:scale-105 transition-transform">
                အဆင်သင့်ပဲ! ဆက်သွားမည် 🚀
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
