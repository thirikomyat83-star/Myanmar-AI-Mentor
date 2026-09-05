'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react'; 
import { useAuthStore } from '@/store/useAuthStore';

// Import LaTeX utility
import { processChatText } from '@/utils/latex';

// Markdown & Math (LaTeX) အတွက် Package များ
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; 

// ==========================================
// 1. EXTENSIVE VECTOR ICONS (Eco-Theme)
// ==========================================
const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const AttachIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2.5" 
      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" 
    />
  </svg>
);

const SparkleIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.5 2L13 9.5L20.5 11L13 12.5L11.5 20L10 12.5L2.5 11L10 9.5L11.5 2Z" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2.5" 
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
    />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2.5" 
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2.5" 
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
    />
  </svg>
);

const LikeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2.5" 
      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" 
    />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2.5" 
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" 
    />
  </svg>
);

const QuizIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ==========================================
// 2. DATA TYPES & INTERFACES
// ==========================================
interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document';
  base64?: string; 
}

interface BreakdownData {
  formula_name?: string;
  formula_latex: string;
  section_a_variables: { symbol: string, meaning: string, unit: string }[];
  section_b_concept: string;
  section_c_example: string;
  quiz_trigger_topic?: string;
  key_notes?: string[];
}

interface TutorResponse {
  status: 'funnel' | 'success' | 'quiz_active' | 'essay_practice' | 'error';
  data?: string;
  message?: string;
  quiz_trigger?: string;
  quiz_id?: string;
  source_text?: string;
  suggestions?: string[];
  ocr_extracted_text?: string;
  essay_score?: number;
  grading_data?: GradingData;
  quiz_result?: {
    score: number;
    correct_count: number;
    total_questions: number;
    passed: boolean;
    results: any[];
  };
}

interface GradingData {
  subject: string;
  score: number;
  total_score: number;
  feedback_summary: string;
  corrections: { mistake: string; correction: string; reason: string }[];
  advice: string;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user' | 'system';
  text: string;
  timestamp: string;
  liked?: boolean;
  disliked?: boolean;
  attachments?: Attachment[];
  isError?: boolean;
  persona?: string; 
  suggestions?: string[]; 
  breakdownData?: BreakdownData; 
  svgCode?: string; 
  audioUrl?: string; 
  scriptText?: string;
  isListeningTest?: boolean;
  isTutorQuizReady?: boolean;
  tutorQuizId?: string;
  gradingData?: GradingData;
  essayFeedbackData?: any;
  essayFeedbackText?: string;
  labels?: any[];
}

interface ChatSession {
  id: string;
  title: string;
  folder?: string;
  messages: ChatMessage[];
}

interface DialogueTurn { 
  speaker: string; 
  english_text: string; 
  myanmar_translation: string; 
  audio_url: string; 
}

// ==========================================
// 3. ULTIMATE AI WORKSPACE COMPONENT
// ==========================================
export default function UltimateChatWorkspace() {
  const router = useRouter();
  
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId');
  const subjectParam = searchParams.get('subject');
  const chapterParam = searchParams.get('chapter');
  const actionParam = searchParams.get('action') || '';
  const detailsParam = searchParams.get('details') || ''; 
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  
  const { data: session, status } = useSession();
  const { user: storeUser } = useAuthStore(); 
  
  const [activeUser, setActiveUser] = useState({
    id: '',
    name: 'Student',
    fullName: '',
    grade: 'Grade 10',
    avatar: '🧑‍🎓'
  });

  useEffect(() => {
    const storedProfileStr = localStorage.getItem('profile');
    let storedProfile: any = {};
    try { if (storedProfileStr) storedProfile = JSON.parse(storedProfileStr); } catch (e) {}

    const mergedUser = {
        ...(session?.user || {}),
        ...(storeUser || {}),
        ...storedProfile
    };

    setActiveUser({
        id: mergedUser.id || mergedUser.student_id || localStorage.getItem('student_id') || 'STU_TEMP',
        name: mergedUser.name || mergedUser.username || 'Student',
        fullName: mergedUser.fullName || mergedUser.name || 'Student',
        grade: mergedUser.grade || localStorage.getItem('grade') || 'Grade 10',
        avatar: mergedUser.avatar || mergedUser.profile_image || mergedUser.avatar_url || '🧑‍🎓'
    });
  }, [session, storeUser]);
  
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const [studyMode, setStudyMode] = useState('Explain Simply');
  const [tutorPersona, setTutorPersonality] = useState('Friendly Teacher');
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  
  const [currentLessonContent, setCurrentLessonContent] = useState<string>("");
  const [currentFeatureType, setCurrentFeatureType] = useState<string>("general");
  
  const [englishTutorQuizId, setEnglishTutorQuizId] = useState<string | null>(null);
  const [englishTutorQuizData, setEnglishTutorQuizData] = useState<any>(null);
  
  const [isEssayPracticeMode, setIsEssayPracticeMode] = useState(false);
  const [essayTopic, setEssayTopic] = useState<string>("");
  const [essayText, setEssayText] = useState<string>("");
  const [essayImages, setEssayImages] = useState<string[]>([]);
  const [essayImagePreviews, setEssayImagePreviews] = useState<string[]>([]);
  
  const [isListeningModalOpen, setIsListeningModalOpen] = useState(false);
  const [isListeningLoading, setIsListeningLoading] = useState(false);
  const [listeningData, setListeningData] = useState<DialogueTurn[] | null>(null);
  const [playingIndex, setPlayingIndex] = useState(-1);
  const [showTranscript, setShowTranscript] = useState(false); 
  
  const [listeningTopics, setListeningTopics] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // 🚨 NEW: Auto-detect if task is Calculation (တွက်စာ) or Theory (ကျက်စာ) - ROCK SOLID LOGIC
 const isCalculationTask = useMemo(() => {
    const chapter = (chapterParam || "").toLowerCase();
    const details = (detailsParam || "").toLowerCase();
    const action = (actionParam || "").toLowerCase();
    const subject = (subjectParam || "").toLowerCase();
    
    // 💡 ပြင်ဆင်ချက်: URL ကလာတဲ့ အချက်အလက်အားလုံးကို တစ်ပေါင်းတည်း စုလိုက်ပါသည်
    const combined = `${chapter} ${details} ${action} ${subject}`.toLowerCase();

    // 🚨 NEW: Action-based detection (အရေးကြီးဆုံး ပြင်ဆင်ချက်)
    const isAfternoonPractice = action.includes('afternoon') || 
                               action.includes('ညနေ') || 
                               action.includes('လေ့ကျင့်') ||
                               action.includes('practice');

    // 1. Explicit Intent (Quiz သို့မဟုတ် Flashcard ပါလာလျှင် ကျက်စာအဖြစ် အရင်ဆုံး သတ်မှတ်မည်)
    // 💡 ပြင်ဆင်ချက်: action ထဲတင်မကဘဲ combined ထဲမှာရှာလိုက်သဖြင့် ဉာဏ်စမ်းဟူသော စကားလုံးကို ၁၀၀% ဖမ်းမိသွားပါမည်
    if (combined.includes('quiz') || combined.includes('ဉာဏ်စမ်း') || combined.includes('flashcard') || combined.includes('မှတ်စုကတ်')) {
        return false;
    }
    
    // 2. Strict Theory Keywords (ဤစကားလုံးများပါလျှင် တွက်စာစနစ်ကို အတင်းပိတ်ချမည်)
    const theoryKeywords = [
        'ကျက်', 'သဘောတရား', 'theory', 'concept', 'definition', 'အဓိပ္ပာယ်', 'explain', 
        'introduction', 'intro', 'meaning', 'types', 'characteristics', 'properties', 
        'history', 'nature', 'uses', 'preparation', 'manufacturing', 'bonding'
    ];
    if (theoryKeywords.some(kw => combined.includes(kw))) return false;

    // 3. Strict Calculation Keywords (Safe from Substring Matching)
    const calcKeywords = [
        'တွက်', 'ပုစ္ဆာ', 'calculate', 'calculation', 'problem', 'solve', 'equation', 'formula', 
        'stoichiometry', 'titration', 'kinematics', 'dynamics', 'mechanics', 'molarity', 'yield', 
        'ph value', 'empirical formula', 'molecular formula', 'concentration', 'boyle', 'charles', 
        'avogadro', 'ideal gas', 'kc', 'kp', 'half-life', 'faraday', 'oxidation number',
        'mole', 'mass', 'volume', 'rate', 'acid', 'base'
    ];
    
    const hasCalcKeyword = calcKeywords.some(kw => {
        if (kw === 'တွက်' || kw === 'ပုစ္ဆာ') {
            return combined.includes(kw);
        }
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        return regex.test(combined);
    });

    if (hasCalcKeyword) return true;

    // 🚨 NEW: Afternoon Practice + Calculation Subject → Calculation Task
    // နေ့လည်ပိုင်း (Afternoon) မှာ Math/Physics ဆိုရင် တွက်စာအဖြစ် သတ်မှတ်မည်
    if (isAfternoonPractice && 
        (subject.includes('math') || subject.includes('physics')||  subject.includes('ရူပ') || subject.includes('သင်္ချာ'))) {
        return true;
    }

    // 4. Subject-level defaults (ဘာသာရပ်အလိုက် မူလသတ်မှတ်ချက်များ)
    if (subject.includes('chemistry') || subject.includes('ဓာတု')) {
        // 🚨 NEW: Chemistry + Afternoon Practice → Calculation Task
        // ဓာတုဗေဒမှာ နေ့လည်ပိုင်း ဆိုရင် တွက်စာအဖြစ် သတ်မှတ်မည် (Stoichiometry, Titration စသည်)
        if (isAfternoonPractice) {
            return true;
        }
        return false; // Chemistry ကို ကျက်စာအဖြစ် Default ထားမည်
    }

    if (subject.includes('math') || subject.includes('physics') || subject.includes('ရူပ') || subject.includes('သင်္ချာ')) {
        return true; // Math နှင့် Physics ကို တွက်စာအဖြစ် Default ထားမည်
    }

    return false;
}, [subjectParam, chapterParam, detailsParam, actionParam]);

  const photoUploadBtnText = '📸 တွက်ချက်ထားသော ဓာတ်ပုံတင်မည်';

  const detectSubject = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('မြန်မာ') || lower.includes('myanmar')) return 'Myanmar';
    const chemistryKeywords = [
        'mole', 'molar', 'molarity', 'molality', 'concentration',
        'ph', 'poh', 'acid', 'base', 'buffer', 'titration',
        'reaction', 'reactant', 'product', 'equilibrium', 'kc', 'kp',
        'oxidation', 'reduction', 'redox', 'electrolysis', 'electrode',
        'anode', 'cathode', 'electrolyte', 'bond', 'covalent', 'ionic',
        'enthalpy', 'entropy', 'gibbs', 'hess', 'calorimetry', 'catalyst',
        'activation energy', 'rate of reaction', 'solution', 'solvent', 'solute',
        'solubility', 'precipitate', 'gas law', 'boyle', 'charles', 'avogadro',
        'ideal gas', 'combined gas', 'dalton', 'periodic table', 'element',
        'compound', 'mixture', 'ion', 'cation', 'anion', 'isotope', 'isomer',
        'orbital', 'electron configuration', 'atomic number', 'mass number',
        'stoichiometry', 'limiting reagent', 'percent yield', 'organic chemistry',
        'alkane', 'alkene', 'alkyne', 'functional group', 'polymer',
        'benzene', 'phenol', 'alcohol', 'ether', 'aldehyde', 'ketone',
        'carboxylic acid', 'ester', 'amine', 'amide', 'pv = nrt', 'p1v1', 'm1v1',
        'molar mass', 'empirical formula', 'oxidation state', 'valency', 'valence',
        'δh', 'δg', 'δs', 'δt', 'q = mc', 'mcδt',
        'ဓာတု', 'ဓာတ်ပြု', 'အက်ဆစ်', 'ဘေ့စ်', 'ကာဗွန်',
        'ဟိုက်ဒရိုဂျင်', 'အောက်ဆီဂျင်', 'နိုက်ထရိုဂျင်',
    ];
    
    const physicsKeywords = [
        'force', 'velocity', 'acceleration', 'momentum', 'energy', 'power',
        'wave', 'electric', 'magnetic', 'gravity', 'newton', 'ohm', 'watt',
        'joule', 'friction', 'pressure', 'density', 'torque', 'frequency',
        'wavelength', 'circuit', 'resistance', 'capacitance', 'kinetic',
        'potential', 'thermodynamic', 'heat', 'light', 'sound', 'nuclear',
        'quantum', 'relativity', 'f = ma', 'f=ma', 'p = mv', 'e = mc',
        'v = ir', 'w = fd', 'impulse', 'work', 'displacement',
    ];
    
    const biologyKeywords = [
        'photosynthesis', 'respiration', 'cell', 'dna', 'rna', 'protein',
        'enzyme', 'gene', 'chromosome', 'mitosis', 'meiosis', 'ecosystem',
        'population', 'evolution', 'mutation', 'heredity', 'genotype',
        'phenotype', 'allele', 'dominant', 'recessive', 'homeostasis',
        'metabolism', 'organ', 'tissue', 'hormone', 'neuron', 'synapse',
        'immune', 'bacteria', 'virus', 'fungi',
    ];
    
    if (chemistryKeywords.some(kw => lower.includes(kw))) return 'Chemistry';
    if (physicsKeywords.some(kw => lower.includes(kw))) return 'Physics';
    if (biologyKeywords.some(kw => lower.includes(kw))) return 'Biology';
    
    if (
      lower.includes('log') || lower.includes('sin') || lower.includes('cos') || 
      lower.includes('tan') || lower.includes('derivative') || lower.includes('integral') || 
      lower.includes('matrix') || lower.includes('vector') || lower.includes('probability') || 
      lower.includes('equation')
    ) {
      return 'Mathematics';
    }
    return '';
  };

  const submitTutorQuizAnswers = async (quizId: string, answers: { question_id: number | string; answer: string }[]) => {
    const token = localStorage.getItem('token');
    const studentId = activeUser.id || localStorage.getItem('student_id') || 'STU_TEMP';
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/+$/, '').replace(/\/docs$/, '');

    try {
      const res = await fetch(`${baseUrl}/api/tutor/english-practice/${encodeURIComponent(studentId)}/submit-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ quiz_id: quizId, answers })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Submit quiz error');
      }

      const data: TutorResponse = await res.json();
      return data;
    } catch (error: unknown) {
      console.error('Submit Quiz Error:', error);
      return {
        status: 'success',
        data: 'အဖြေစစ်ဆေးရာတွင် အခက်အခဲရှိပါသည်။',
        suggestions: ['[English] Reading Passages', '[English] Grammar Patterns']
      } as TutorResponse;
    }
  };

  const handleStartEnglishQuiz = () => {
    if (!englishTutorQuizData) return;

    localStorage.removeItem('quiz_intent');
    localStorage.setItem('quiz_intent', JSON.stringify({
      topic: 'English Practice Quiz',
      type: 'english',
      sourceText: currentLessonContent,
      quizData: englishTutorQuizData.questions || englishTutorQuizData,
      tutorQuizId: englishTutorQuizId
    }));

    const sysMsg: ChatMessage = {
      id: generateId(),
      sender: 'ai',
      persona: tutorPersona,
      text: '✅ Quiz အဆင်သင့်ဖြစ်ပါပြီ! သီးသန့် Quiz Page သို့ ခေါ်ဆောင်သွားနေပါသည်... 🚀',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, sysMsg] } : s));

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      router.push('/quiz');
    }, 1500);
  };

  const getWritingDisplayType = () => {
    if (currentFeatureType === 'check_work_submit') return 'Homework';
    if (currentFeatureType === 'myanmar') return 'မြန်မာစာ';
    if (essayTopic.toLowerCase().includes('letter') || essayTopic.toLowerCase().includes('ပေးစာ')) return 'Letter';
    if (essayTopic.toLowerCase().includes('old q') || essayTopic.toLowerCase().includes('မေးခွန်းဟောင်း')) return 'Old Q Essay';
    return 'Essay';
  };

  const handleEssaySubmit = async () => {
    if (!essayText.trim() && essayImages.length === 0) return;
    
    const token = localStorage.getItem('token');
    const studentId = activeUser.id || localStorage.getItem('student_id') || 'STU_TEMP';
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/+$/, '').replace(/\/docs$/, '');

    const displayType = getWritingDisplayType();

    const userMsg = {
        id: generateId(),
        sender: 'user' as const,
        text: `📝 ${displayType} Submitted: "${essayTopic}"${essayImages.length > 0 ? ` (${essayImages.length} ပုံ)` : ''}`,
        attachments: essayImages.map((img, idx) => ({ 
            id: generateId() + idx, 
            name: `attached_image_${idx + 1}.jpg`, 
            type: 'image' as const, 
            base64: img 
        })),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));
    
    setIsTyping(true);
    setIsEssayPracticeMode(false);
    const essayContent = essayText;
    const imagesToSubmit = [...essayImages];
    setEssayText("");
    setEssayImages([]);
    setEssayImagePreviews([]);

    // 🚨 Check Work API Route 🚨
    if (currentFeatureType === 'check_work_submit') {
        try {
            const checkPrompt = essayContent.trim() ? essayContent.trim() : "ကျွန်တော်တွက်ထားတဲ့ အဖြေကို စစ်ဆေးပေးပါ။ မှားနေတာရှိရင် အဆင့်ဆင့် ထောက်ပြပြီး ပြင်ဆင်ပေးပါ။";
            const res = await fetch(`${baseUrl}/api/tutor/check-work/${encodeURIComponent(studentId)}`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }, 
                body: JSON.stringify({ 
                    image_base64: imagesToSubmit[0] || "",
                    images: imagesToSubmit,
                    message: checkPrompt,
                    topic: chapterParam || subjectParam || ""
                }) 
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                setCurrentLessonContent("Homework Checked"); 
                setCurrentFeatureType("general");
                let aiSuggestions = [];
                if (taskId || actionParam === 'learn') aiSuggestions = ['✅ ပြီးမြောက်ပါပြီ (Return)']; 
                else aiSuggestions = ['🧠 နောက်ထပ် လေ့ကျင့်ခန်း လုပ်မည်'];

                let aiMsg: ChatMessage;
                if (data.grading_data) {
                    aiMsg = { id: generateId(), sender: 'ai', persona: tutorPersona, text: "သင့်ရဲ့ အိမ်စာကို စစ်ဆေးပြီးပါပြီ။ အောက်ပါ Report Card ကို ကြည့်ရှုပါ။ ⬇️", gradingData: data.grading_data, suggestions: getProcessedSuggestions("Homework Checked", aiSuggestions), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                } else {
                    aiMsg = { id: generateId(), sender: 'ai', persona: tutorPersona, text: processChatText(data.feedback || "အဖြေမရရှိပါ"), suggestions: getProcessedSuggestions(data.feedback || "", aiSuggestions), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                }
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
            } else {
                const sysMsg: ChatMessage = { id: generateId(), sender: 'system', isError: true, text: data.message || "Error", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, sysMsg] } : s));
            }
        } catch (error) {
            console.error("Check Work Error:", error);
            const sysMsg: ChatMessage = { id: generateId(), sender: 'system', isError: true, text: "⚠️ အိမ်စာစစ်ဆေးရာတွင် အခက်အခဲရှိနေပါသည်။", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, sysMsg] } : s));
        }
        setIsTyping(false); return;
    }

    const isLetter = essayTopic.toLowerCase().includes('letter') || currentFeatureType === 'letter' || displayType === 'Letter';
    
    let endpoint = `${baseUrl}/api/tutor/english-practice/${encodeURIComponent(studentId)}`;
    if (currentFeatureType === 'myanmar') {
        endpoint = `${baseUrl}/api/tutor/myanmar-practice/${encodeURIComponent(studentId)}`;
    }
    
    let topicPrefix = '[Submit Essay]';
    if (currentFeatureType === 'myanmar') {
        topicPrefix = '[Myanmar Submit]';
    } else if (isLetter) {
        topicPrefix = '[Submit Letter]';
    }

    try {
        const body: any = {
            topic: `${topicPrefix} ${essayTopic}`,
            essay_text: essayContent
        };
        
        if (imagesToSubmit.length > 0) {
            body.images = imagesToSubmit.map(img => `data:image/jpeg;base64,${img}`);
        }
        
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify(body)
        });
        
        const data = await res.json();
        
        if (data.status === 'success') {
            const aiMsg = {
                id: generateId(),
                sender: 'ai' as const,
                persona: tutorPersona,
                text: data.data || '',
                gradingData: data.grading_data, 
                suggestions: data.suggestions || [],
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
        } else if (data.status === 'error') {
            const errorMsg = {
                id: generateId(),
                sender: 'ai' as const,
                persona: tutorPersona,
                text: data.data || '⚠️ တင်သွင်းရာတွင် အခက်အခဲရှိပါသည်။ ထပ်ကြိုးစားပါ။',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
        }
    } catch (error) {
        console.error("Submit Error:", error);
        const errorMsg = {
            id: generateId(),
            sender: 'ai' as const,
            persona: tutorPersona,
            text: '❌ ဆက်သွယ်ရာတွင် အခက်အခဲရှိပါသည်။ အင်တာနက်လိုင်းစစ်ပြီး ထပ်ကြိုးစားပါ။',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
    }
    
    setIsTyping(false);
  };

  const fetchHistory = async (sessionId: string, token: string) => {
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/+$/, '').replace(/\/docs$/, '');
      const res = await fetch(`${baseUrl}/api/chat/history/${encodeURIComponent(sessionId)}`, { 
        headers: { 'Authorization': `Bearer ${token}` , 'ngrok-skip-browser-warning': 'true'} 
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.history && data.history.length > 0) {
           const msgs: ChatMessage[] = data.history.map((h: any, i: number) => ({
              id: `hist_${sessionId}_${i}_${generateId()}`,
              sender: h.role === 'user' ? 'user' : 'ai',
              text: h.content,
              timestamp: new Date(h.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
           }));
           setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: msgs } : s));
        }
      }
    } catch (err) { 
      console.error("Failed to fetch history:", err); 
    }
  };

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    
    if (!token && status === 'unauthenticated') { 
      router.replace('/'); 
      return; 
    }
    
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const loadData = async () => {
       const studentId = activeUser.id || localStorage.getItem('student_id') || 'STU_TEMP';
       const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/+$/, '').replace(/\/docs$/, '');
       
       try {
          const res = await fetch(`${baseUrl}/api/chat/sessions/${encodeURIComponent(studentId)}`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
          });
          
          if (res.ok) {
             const data = await res.json();
             if (data.sessions && data.sessions.length > 0) {
                 const loadedSessions = data.sessions.map((s: any) => ({ 
                   id: s.session_id, 
                   title: s.title, 
                   folder: 'General', 
                   messages: [] 
                 }));
                 setSessions(loadedSessions);
                 setCurrentSessionId(loadedSessions[0].id);
                 fetchHistory(loadedSessions[0].id, token!);
                 return;
             }
          }
       } catch (e) { 
         console.error("Failed to load sessions:", e); 
       }
       
       const initialSessionId = generateId();
       setSessions([{
           id: initialSessionId, 
           title: 'New Conversation', 
           folder: 'General',
           messages: [
             { 
               id: generateId(), 
               sender: 'system', 
               text: `Active Mode: ${studyMode} | Persona: ${tutorPersona}`, 
               timestamp: '' 
             },
             { 
               id: generateId(), 
               sender: 'ai', 
               text: `မင်္ဂလာပါ။ ${activeUser.fullName || activeUser.name || 'သူငယ်ချင်း'}။ ဒီနေ့ ဘာတွေ ဆက်လေ့လာကြမလဲ?`, 
               persona: tutorPersona, 
               timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
             }
           ]
       }]);
       setCurrentSessionId(initialSessionId);
    };

    if (token && sessions.length === 0 && activeUser.id) {
      loadData();
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, [status, router, activeUser.id]);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [sessions, currentSessionId, isTyping, pendingAttachments]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (mounted && currentSessionId) {
       const alertMsg: ChatMessage = { 
         id: generateId(), 
         sender: 'system', 
         text: `Mode Switched: ${studyMode} | Persona: ${tutorPersona}`, 
         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
       };
       setSessions(prev => 
         prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, alertMsg] } : s)
       );
    }
  }, [studyMode, tutorPersona]);

  useEffect(() => {
    const playCurrentTurn = async () => {
      if (playingIndex >= 0 && listeningData && playingIndex < listeningData.length) {
        try {
          const turn = listeningData[playingIndex];
          const token = localStorage.getItem('token');
          const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/+$/, '').replace(/\/docs$/, '');
          
          const response = await fetch(`${baseUrl}/api/chat/listening/tts?text_content=${encodeURIComponent(turn.english_text)}&speaker=${turn.speaker}`, {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true' 
              }
          });
          
          if (!response.ok) {
              throw new Error(`API Error ${response.status}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });

          if (audioBlob.size === 0) {
              handleAudioEnd(); 
              return;
          }

          const objectUrl = URL.createObjectURL(audioBlob);

          if (audioRef.current) {
              audioRef.current.src = objectUrl;
              audioRef.current.load();
              await audioRef.current.play();
          }
        } catch (error) {
          console.error("Audio playback error:", error);
        }
      }
    };

    playCurrentTurn();
  }, [playingIndex, listeningData]);

  const handleAudioEnd = () => {
      if (listeningData && playingIndex < listeningData.length - 1) {
          setPlayingIndex(prev => prev + 1);
      } else {
          setPlayingIndex(-1); 
      }
  };

  const handleReadyForQuiz = () => {
    localStorage.removeItem('listening_quiz_data');
    localStorage.removeItem('quiz_intent');
    localStorage.setItem('quiz_intent', JSON.stringify({
        topic: "Listening Comprehension Test",
        type: "listening",
        sourceText: currentLessonContent
    }));
    setIsListeningModalOpen(false);
    setListeningData(null);
    setPlayingIndex(-1);
    router.push('/quiz');
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentMessages = currentSession?.messages || [];

  const handleStartListening = async (topic: string) => {
      setIsListeningLoading(true);
      setListeningData(null);
      setPlayingIndex(-1);
      setShowTranscript(false); 

      try {
          const token = localStorage.getItem('token');
          const studentId = activeUser.id || 'STU_TEMP';
          const userGrade = activeUser.grade || localStorage.getItem('grade') || 'High School'; 
          const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/+$/, '').replace(/\/docs$/, '');
          
          const res = await fetch(`${baseUrl}/api/chat/listening/generate-dialogue/${encodeURIComponent(studentId)}?topic=${encodeURIComponent(topic)}&grade=${encodeURIComponent(userGrade)}`, {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
              }
          });
          
          if (!res.ok) throw new Error("API Error");
          
          const data = await res.json();
          
          if (data.status === 'success' && data.dialogue) {
              setListeningData(data.dialogue);
              setPlayingIndex(0); 
              const fullScript = data.dialogue.map((d: DialogueTurn) => d.english_text).join(" ");
              setCurrentLessonContent(fullScript);
              setCurrentFeatureType("listening");
          } else {
              alert(`Failed to generate dialogue: ${data.detail || 'Unknown Error'}`);
          }
      } catch (error) {
          console.error("Connection error.", error);
          alert("Connection error. Ensure your backend server is running and accessible.");
      }
      setIsListeningLoading(false);
  };

  const completeTaskAndReturn = async () => {
    if (taskId) {
      const token = localStorage.getItem('token');
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/docs\/?$/, '');
      const studentId = activeUser.id || localStorage.getItem('student_id') || 'STU_TEMP';
      
      try {
        await fetch(`${baseUrl}/api/tutor/complete-task`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
          body: JSON.stringify({
            student_id: studentId,
            task_id: parseInt(taskId)
          })
        });
        
        const profileRes = await fetch(`${baseUrl}/api/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
            const profileData = await profileRes.json();
            localStorage.setItem('profile', JSON.stringify(profileData));
            (useAuthStore.getState()as any).setUser(profileData); 
        }
      } catch (err) {
        console.error("Task completion failed", err);
      }
      window.location.href = `/study-plan?topic=${encodeURIComponent(subjectParam || '')}`;
    } else if (actionParam === 'learn') {
      window.location.href = `/learning-path?topic=${encodeURIComponent(subjectParam || chapterParam || '')}`;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (isEssayPracticeMode) {
        const validFiles = files.filter(f => {
            if (f.size > 5 * 1024 * 1024) { 
                alert(`"${f.name}" သည် 5MB ထက်ကြီးပါသည်။`);
                return false; 
            }
            return true;
        });

        if (essayImages.length + validFiles.length > 5) {
            alert('အများဆုံး ၅ ပုံသာ တင်နိုင်ပါသည်။');
            return;
        }

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                setEssayImages(prev => [...prev, base64String]);
                setEssayImagePreviews(prev => [...prev, URL.createObjectURL(file)]);
            };
        });
    } else {
        const validFiles = files.filter(f => {
            if (f.size > 5 * 1024 * 1024) { 
                alert(`"${f.name}" သည် 5MB ထက်ကြီးပါသည်။`);
                return false; 
            }
            return true;
        });

        if (pendingAttachments.length + validFiles.length > 5) {
            alert('အများဆုံး ၅ ပုံသာ တင်နိုင်ပါသည်။');
            return;
        }

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                const newAttachment: Attachment = { 
                    id: generateId(), 
                    name: file.name, 
                    type: file.type.startsWith('image/') ? 'image' : 'document', 
                    base64: base64String 
                };
                setPendingAttachments(prev => [...prev, newAttachment]);
            };
        });
    }
    
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeEssayImage = (index: number) => {
    setEssayImages(prev => prev.filter((_, i) => i !== index));
    setEssayImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { 
    if (isEssayPracticeMode) return;
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      handleSend(); 
    } 
  };

  const handleNewChat = () => {
    const newId = generateId();
    setSessions(prev => [ 
      { 
        id: newId, 
        title: 'New Conversation', 
        folder: 'General', 
        messages: [{ 
          id: generateId(), 
          sender: 'ai', 
          text: 'ဘာများ ကူညီပေးရမလဲ ခင်ဗျာ?', 
          persona: tutorPersona, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }] 
      }, 
      ...prev 
    ]);
    setCurrentSessionId(newId);
    setCurrentLessonContent("");
    setCurrentFeatureType("general");
    setEnglishTutorQuizId(null);
    setEnglishTutorQuizData(null);
    setIsEssayPracticeMode(false);
    setEssayTopic("");
    setEssayText("");
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleDeleteSession = async (id: string) => {
    const token = localStorage.getItem('token');
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/+$/, '').replace(/\/docs$/, '');
    try { 
      await fetch(`${baseUrl}/api/chat/session/${encodeURIComponent(id)}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } 
      }); 
    } catch (e) { 
      console.error(e); 
    }
    const filtered = sessions.filter(s => s.id !== id);
    if (filtered.length === 0) { 
      handleNewChat(); 
    } else { 
      setSessions(filtered); 
      if (currentSessionId === id) { 
        setCurrentSessionId(filtered[0].id); 
        if (filtered[0].messages.length === 0 && token) { 
          fetchHistory(filtered[0].id, token); 
        } 
      } 
    }
  };

  const removeAttachment = (id: string) => { 
    setPendingAttachments(prev => prev.filter(att => att.id !== id)); 
  };

  const handleMessageAction = (action: string, msgId: string) => {
    if (action === 'delete') { 
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.filter(m => m.id !== msgId) } : s)); 
    } else if (action === 'copy') { 
      const msg = currentMessages.find(m => m.id === msgId); 
      if (msg) navigator.clipboard.writeText(msg.text); 
    } else if (action === 'regenerate') { 
      const msgIndex = currentMessages.findIndex(m => m.id === msgId); 
      if (msgIndex > 0) { 
        const lastUserMsg = currentMessages[msgIndex - 1]; 
        if (lastUserMsg && lastUserMsg.sender === 'user') { 
          setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.filter(m => m.id !== msgId) } : s)); 
          handleSend(lastUserMsg.text); 
        } 
      } 
    }
  };

  // 🚨 THE FIX: getProcessedSuggestions Function
  const getProcessedSuggestions = useCallback((text: string, rawSuggestions: string[] | undefined, actionType: string = "NONE") => {
    const raw = Array.isArray(rawSuggestions) ? rawSuggestions : [];
    
    // မလိုအပ်သော Button များကို ပထမဦးစွာ ဖယ်ထုတ်မည်
    const cleaned = raw.filter((s: string) => 
        !s.includes('Quiz') && !s.includes('ဉာဏ်စမ်း') && 
        !s.includes('Flashcard') && !s.includes('မှတ်စုကတ်') && 
        !s.includes('ပြီးမြောက်ပါပြီ') && !s.includes('Vault') &&
        !s.includes('Check Work') 
    );
    
    const textLower = (text || "").toLowerCase();

    // 💡 ပြင်ဆင်ချက် ၁ - AI ၏ အဖွင့်နှုတ်ဆက်စကားဖြစ်နေပါက Quiz ခလုတ်များ အတင်းမထည့်ဘဲ ရပ်တန့်မည်
    const isGreeting = textLower.includes('မင်္ဂလာပါ') || textLower.includes('ဘာတွေ ဆက်လေ့လာကြမလဲ');
    if (isGreeting) {
        return cleaned;
    }
    
    // 🚨 NEW: Subject/Chapter Selection ဖြစ်နေပါက ဘာမှ ထပ်မထည့်ဘဲ ရပ်တန့်မည်
    const isSubjectSelection = textLower.includes('ရွေးချယ်လိုက်ပါပြီ') || 
                              textLower.includes('လေ့လာလိုသော အခန်း') ||
                              textLower.includes('လေ့လာလိုသော ခေါင်းစဉ်') ||
                              textLower.includes('သင်ခန်းစာများ မတွေ့ရှိသေးပါ') ||
                              textLower.includes('ဘာသာရပ်ကို ရွေးချယ်လိုက်ပါပြီ');
    
    if (isSubjectSelection) {
        return cleaned;
    }
    
    const isMorning = actionParam?.toLowerCase().includes('morning');
    const isAfternoon = actionParam?.toLowerCase().includes('afternoon');
    const isEvening = actionParam?.toLowerCase().includes('evening') || textLower.includes('ညနေ') || textLower.includes('စစ်ဆေး') || textLower.includes('quiz') || actionParam?.toLowerCase().includes('quiz') || actionParam?.toLowerCase().includes('review');
    
    const isGrading = currentFeatureType === 'essay' || currentFeatureType === 'letter' || 
        currentFeatureType === 'myanmar' || currentFeatureType === 'check_work_submit' ||
        textLower.includes('score:') || textLower.includes('အမှတ်:') || textLower.includes('report card') || 
        textLower.includes('အမှားပြင်');
        
    const isFlashcardsDone = textLower.includes('သိမ်းဆည်းလိုက်ပါပြီ') || actionType === 'FLASHCARD_DONE' || text === 'Flashcards Generated';

    // Flashcard ထုတ်ပြီးသွားသော အခြေအနေ
    if (isFlashcardsDone) {
        let vaultSugg = ['📚 Vault သို့ သွားမည်'];
        if (taskId || actionParam === 'learn') vaultSugg.push('✅ ပြီးမြောက်ပါပြီ (Return)');
        return vaultSugg;
    }

    // အိမ်စာ / အမှတ်စစ်ပြီးသွားသော အခြေအနေ
    if (isGrading) {
        return taskId || actionParam === 'learn' ? [...cleaned, '✅ ပြီးမြောက်ပါပြီ (Return)'] : cleaned;
    }

    let finalSuggestions = [...cleaned];

    // 💡 ပြင်ဆင်ချက် ၂ - သင်ခန်းစာ အမှန်တကယ်ပြီးဆုံးသွားမှ သို့မဟုတ် သက်ဆိုင်ရာ အချိန်ဖြစ်မှသာ Task များကို ပြမည်
    const isLessonCompleted = actionType === "SUMMARIZED" || actionType === "TEACH_COMPLETE";

    if (isEvening || isLessonCompleted) {
        if (isCalculationTask) {
            if (!finalSuggestions.includes(photoUploadBtnText)) {
                finalSuggestions.unshift(photoUploadBtnText);
            }
        } else {
            if (!finalSuggestions.includes('🧠 ဉာဏ်စမ်း (Quiz) ဖြေမည်')) {
                finalSuggestions.unshift('🧠 ဉာဏ်စမ်း (Quiz) ဖြေမည်');
            }
        }
    }

    if ((isMorning || isLessonCompleted) && !isCalculationTask) {
        if (!finalSuggestions.includes('🗂️ မှတ်စုကတ် (Flashcards) ပြုလုပ်မည်')) {
            // Quiz ခလုတ် ရှိနေရင် ဒုတိယနေရာမှာထားမည်၊ မရှိရင် ပထမနေရာ
            const insertIndex = finalSuggestions.includes('🧠 ဉာဏ်စမ်း (Quiz) ဖြေမည်') ? 1 : 0;
            finalSuggestions.splice(insertIndex, 0, '🗂️ မှတ်စုကတ် (Flashcards) ပြုလုပ်မည်');
        }
    }

    // Study Plan / Learning Path မှ လာပါက ပြီးမြောက်ပါပြီ ခလုတ်ကို အမြဲထည့်ပေးမည်
    if (taskId || actionParam === 'learn') {
        if (!finalSuggestions.includes('✅ ပြီးမြောက်ပါပြီ (Return)')) {
            finalSuggestions.push('✅ ပြီးမြောက်ပါပြီ (Return)');
        }
    }

    return finalSuggestions; 
  }, [currentFeatureType, taskId, actionParam, isCalculationTask]);

  // 🚨 THE FIX: handleSend Function
  const handleSend = async (overrideText?: string, hiddenSystemPrompt?: string) => {
    if (!overrideText && !hiddenSystemPrompt && !input.trim() && pendingAttachments.length === 0) return;

    const token = localStorage.getItem('token');
    const studentId = activeUser.id || localStorage.getItem('student_id') || 'STU_TEMP';
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/+$/, '').replace(/\/docs$/, '');

    let messageText = '';
    let actualPromptToAI = '';
    let displayUserText = '';
    let attachmentsToSend: Attachment[] = [];

    const userActionText = (hiddenSystemPrompt || overrideText || input || "").toLowerCase();
    
    // -- 💡 Formula Breakdown Handle --
    if (overrideText === '💡 Formula Breakdown' || (overrideText && overrideText.startsWith('[Formula]'))) {
        let formulaToSend = "";
        if (overrideText === '💡 Formula Breakdown') formulaToSend = input.trim();
        else formulaToSend = overrideText.replace('[Formula]', '').trim();

        let imageBase64 = "";
        const imageAttachment = pendingAttachments.find(a => a.type === 'image');
        if (imageAttachment) imageBase64 = imageAttachment.base64 || "";

        const detectedSubject = detectSubject(formulaToSend);
        
        let displayMsg = "💡 Formula Breakdown";
        if (formulaToSend) {
            displayMsg = `💡 Formula Breakdown: ${formulaToSend}`;
        } else if (imageBase64) {
            displayMsg = "💡 Formula Breakdown [ပုံဖြင့် ပေးပို့ထားသည်]";
        }

        const userMsg: ChatMessage = { id: generateId(), sender: 'user', text: displayMsg, attachments: [...pendingAttachments], timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));
        setInput(''); setPendingAttachments([]); setIsTyping(true);

        try {
            const requestBody: any = { formula: formulaToSend, image_base64: imageBase64 };
            if (detectedSubject) requestBody.subject = detectedSubject;
            
            const res = await fetch(`${baseUrl}/api/tutor/formula-breakdown/${encodeURIComponent(studentId)}`, { 
              method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }, body: JSON.stringify(requestBody) 
            });
            
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();
            
            if (data.status === 'funnel' || data.status === 'empty_state') {
                const sysMsg: ChatMessage = { id: generateId(), sender: 'ai', persona: tutorPersona, text: data.message, suggestions: getProcessedSuggestions(data.message, data.suggestions || data.suggested_topics), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, sysMsg] } : s));
            } else if (data.status === 'success') {
                const lessonData = data.data || {};
                setCurrentLessonContent(JSON.stringify(lessonData)); 
                setCurrentFeatureType("formula");
                let quizTriggerTopic = lessonData.quiz_trigger_topic || data.input_formula || formulaToSend || "Formula Practice Quiz";
                if (!quizTriggerTopic || quizTriggerTopic.trim() === '') quizTriggerTopic = "Formula Practice Quiz";
                
                const subjectNames: Record<string, string> = { "Physics": "ရူပဗေဒ", "Chemistry": "ဓာတုဗေဒ", "Mathematics": "သင်္ချာ", "Biology": "ဇီဝဗေဒ" };
                const myanmarSubject = detectedSubject ? (subjectNames[detectedSubject] || detectedSubject) : "";
                const introText = myanmarSubject 
                    ? `${myanmarSubject} ပုံသေနည်း (Formula) ခွဲခြမ်းစိတ်ဖြာချက် အဆင်သင့်ဖြစ်ပါပြီ ⬇️\n\nရှင်းလင်းချက်ကို ဖတ်ရှုပြီးပါက အောက်ပါခလုတ်ကို နှိပ်၍ ဉာဏ်စမ်း ဖြေဆိုနိုင်ပါတယ်။`
                    : `ပေးပို့ထားသော ပုံသေနည်း (Formula) ခွဲခြမ်းစိတ်ဖြာချက် အဆင်သင့်ဖြစ်ပါပြီ ⬇️\n\nရှင်းလင်းချက်ကို ဖတ်ရှုပြီးပါက အောက်ပါခလုတ်ကို နှိပ်၍ ဉာဏ်စမ်း ဖြေဆိုနိုင်ပါတယ်။`;
                
                const sysMsg: ChatMessage = { 
                  id: generateId(), sender: 'ai', persona: tutorPersona, 
                  text: introText, 
                  breakdownData: lessonData, 
                  suggestions: getProcessedSuggestions(introText, [`[Quiz] ${quizTriggerTopic} နှင့်သက်ဆိုင်သော ဉာဏ်စမ်းဖြေမည်`]), 
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, sysMsg] } : s));
            }
        } catch (error: unknown) { 
            const errorMsg: ChatMessage = { id: generateId(), sender: 'system', isError: true, text: `❌ Connection Error`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
        }
        if (textareaRef.current) textareaRef.current.style.height = 'auto'; 
        setIsTyping(false); return;
    }

    // 🚨 CHECK WORK (Upload Photo UI Trigger)
    if (overrideText === '📸 တွက်ချက်ထားသော ဓာတ်ပုံတင်မည်' || overrideText === '📸 ဖြေဆိုထားသော ဓာတ်ပုံတင်မည်' || overrideText === '✅ Check Work' || overrideText === '✅ Check My Work' || (overrideText && overrideText.startsWith('✅ Check Work'))) {
    setIsEssayPracticeMode(true); 
    setCurrentFeatureType("check_work_submit");
    
    // 💡 [ထပ်ဖြည့်ထားသည့်အပိုင်း] Old Q Mode ကနေ ဝင်လာရင် အဖြေမှန်တိုက်စစ်ဖို့ Topic ကို ပြင်ဆင်ပေးမည်
    let topicToSet = "အိမ်စာ / တွက်စာ စစ်ဆေးရန်";
    if (currentFeatureType === "old_q") {
        const qSub = localStorage.getItem("old_q_subject") || "";
        const qYear = localStorage.getItem("old_q_year") || "";
        const qPaper = localStorage.getItem("old_q_paper") || "";
        topicToSet = `[Old Q] ${qSub} ${qYear} ${qPaper}`;
    }
    setEssayTopic(topicToSet);

    const userMsgText = "📸 တွက်ချက်ထားသော ဓာတ်ပုံတင်၍ အဖြေစစ်မည်";
    const userMsg: ChatMessage = { id: generateId(), sender: 'user', text: userMsgText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    
    // 💡 [ထပ်ဖြည့်ထားသည့်အပိုင်း] Old Q ဖြစ်ရင် မေးခွန်းနံပါတ်ပါ ထည့်ရေးဖို့ AI မှ သတိပေးစာလေး ပြင်ဆင်မည်
    let aiReplyText = "အောက်ပါ Box တွင် သင့်အဖြေပုံများ (အများဆုံး ၅ ပုံ) နှင့် လိုအပ်သောစာသားများကို တင်ပေးပါ။ ပြီးလျှင် 'Check Work' ကို နှိပ်ပါ။";
    if (currentFeatureType === "old_q") {
        aiReplyText = "အောက်ပါ Box တွင် သင့်အဖြေပုံများကို တင်ပေးပါ။ (အဖြေမှန် တိုက်စစ်နိုင်ရန် မေးခွန်းနံပါတ် ဥပမာ 'No.3' သို့မဟုတ် '၁(က)' ကိုပါ Text Box တွင် တွဲရေးပေးပါဗျာ) ပြီးလျှင် Submit လုပ်ပါ။";
    }

    const aiMsg: ChatMessage = { id: generateId(), sender: 'ai', persona: tutorPersona, text: aiReplyText, suggestions: [], timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    
    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg, aiMsg] } : s));
    setInput('');
    setPendingAttachments([]);
    setIsTyping(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto'; 
    return;
    }

    // chat.txt ထဲက Diagram Guide Handler ကို ပြင်ဆင်ရန်

if (overrideText === '🎨 Diagram Guide' || (overrideText && overrideText.startsWith('[Diagram]'))) {
    let topicToSend = "";
    if (overrideText === '🎨 Diagram Guide') topicToSend = input.trim();
    else topicToSend = overrideText.replace('[Diagram]', '').trim(); 
    
    const displayMsg = topicToSend ? `🎨 Diagram Guide: ${topicToSend}` : "🎨 ဖတ်စာအုပ်ပါ ပုံဆွဲနည်း လမ်းညွှန်ပြပေးပါ";

    const userMsg: ChatMessage = { 
        id: generateId(), 
        sender: 'user', 
        text: displayMsg, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));
    setInput(''); 
    setIsTyping(true);

    try {
        const res = await fetch(`${baseUrl}/api/tutor/diagram-guide/${encodeURIComponent(studentId)}`, { 
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}`, 
                'ngrok-skip-browser-warning': 'true' 
            }, 
            body: JSON.stringify({ topic: topicToSend }) 
        });
        
        // 🚨 THE FIX: Response status စစ်ဆေးခြင်း
        if (!res.ok) {
            throw new Error(`API Error: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.status === 'empty_state') {
            const sysText = data.message;
            const sysMsg: ChatMessage = { 
                id: generateId(), 
                sender: 'ai', 
                persona: tutorPersona, 
                text: sysText, 
                suggestions: getProcessedSuggestions(sysText, data.suggestions), 
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            };
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, sysMsg] } : s));
        } else if (data.status === 'success') {
            setCurrentLessonContent(data.data || ""); 
            setCurrentFeatureType("diagram");
            const aiText = data.data || "";
            const suggestionsList = data.quiz_trigger ? [`[Quiz] ${data.quiz_trigger} နှင့်သက်ဆိုင်သော ဉာဏ်စမ်းဖြေမည်`] : [];
            
            // 🚨 THE FIX: ပုံပါလာပါက တိုက်ရိုက် ပြသမည်
            if (data.image_found && data.reference_image) {
                const aiMsg: ChatMessage = { 
                    id: generateId(), 
                    sender: 'ai', 
                    persona: tutorPersona, 
                    text: processChatText(aiText), 
                    svgCode: data.svg_code,
                    attachments: [{
                        id: generateId(),
                        name: `textbook_diagram.jpg`,
                        type: 'image',
                        base64: data.reference_image.split(',')[1]
                    }],
                    labels: data.labels || [],
                    suggestions: getProcessedSuggestions(aiText, suggestionsList), 
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
            } else {
                // ပုံမပါပါက ပုံမှန် SVG + Markdown ပြသမည်
                const aiMsg: ChatMessage = { 
                    id: generateId(), 
                    sender: 'ai', 
                    persona: tutorPersona, 
                    text: processChatText(aiText), 
                    svgCode: data.svg_code, 
                    suggestions: getProcessedSuggestions(aiText, suggestionsList), 
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
            }
        }
    } catch (error) {
        console.error("Diagram Guide Error:", error);
        const errorMsg: ChatMessage = { 
            id: generateId(), 
            sender: 'system', 
            isError: true, 
            text: '❌ Diagram Guide ထုတ်ပေးရာတွင် အခက်အခဲရှိနေပါသည်။ အင်တာနက်လိုင်း စစ်ဆေးပြီး ထပ်ကြိုးစားပါ။', 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
    }
    
    if (textareaRef.current) textareaRef.current.style.height = 'auto'; 
    setIsTyping(false); 
    return;
}


    // 🚨 NEW: Handle Subject Selection Buttons ("ကို လေ့လာမည်")
    if (overrideText && overrideText.includes('ကို လေ့လာမည်')) {
        // Clean subject name
        const subjectName = overrideText.replace('📘', '').replace('ကို လေ့လာမည်', '').trim();
        
        const userMsg: ChatMessage = { 
            id: generateId(), 
            sender: 'user', 
            text: overrideText, 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));
        setInput(''); 
        setIsTyping(true);
        
        // Call the tutor ask API directly
        try {
            const res = await fetch(`${baseUrl}/api/tutor/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({
                    student_id: studentId,
                    session_id: currentSessionId,
                    question: overrideText, // "Myanmar ကို လေ့လာမည်"
                    study_mode: studyMode,
                    persona: tutorPersona,
                    subject: detectSubject(subjectName) || subjectName
                })
            });
            
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();
            const aiReply = data.answer || data.reply || data.response || "";
            
            const aiSuggestions = getProcessedSuggestions(aiReply, data.suggestions, data.action);
            
            const aiMsg: ChatMessage = { 
                id: generateId(), 
                sender: 'ai', 
                persona: tutorPersona, 
                text: processChatText(aiReply), 
                suggestions: aiSuggestions, 
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            };
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
        } catch (error) {
            console.error("Subject Selection Error:", error);
        }
        
        if (textareaRef.current) textareaRef.current.style.height = 'auto'; 
        setIsTyping(false);
        return;
    }

    // Handle "Write / Practice" Intent (Old Q)
    if (userActionText.includes('လမ်းညွှန်ချက်အတိုင်း ရေးကြည့်မယ်') || userActionText.includes('ရေးကြည့်မယ်') || userActionText.includes('ကိုယ်တိုင်ရေး')) {
        const lastSubject = localStorage.getItem("old_q_subject") || "";
        const isMyanmar = lastSubject.toLowerCase().includes("myanmar") || lastSubject.includes("မြန်မာ") || currentFeatureType === "myanmar";
        
        setCurrentFeatureType(isMyanmar ? "myanmar" : "english");
        setEssayTopic(isMyanmar ? "မေးခွန်းဟောင်း စာစီစာကုံး လေ့ကျင့်ခန်း" : (userActionText.includes('letter') ? "Old Question Letter Practice" : "Old Question Essay Practice")); 
        
        setIsEssayPracticeMode(true); 
        
        const userMsg: ChatMessage = { 
            id: generateId(), sender: 'user', text: overrideText || input.trim() || "လမ်းညွှန်ချက်အတိုင်း ရေးကြည့်မယ်", 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        const aiMsg: ChatMessage = { 
            id: generateId(), sender: 'ai', persona: tutorPersona, 
            text: `✍️ ကောင်းပါပြီ! သင့်ရဲ့ ${isMyanmar ? 'စာစီစာကုံး' : 'Writing'} ကို အောက်ပါ ဘောက်စ်ထဲမှာ ရိုက်ထည့်ပါ (သို့မဟုတ်) စာရွက်ပေါ်ရေးထားတဲ့ ပုံကို Upload (အများဆုံး ၅ ပုံ) တင်ပြီး အမှတ်စစ်ဆေးနိုင်ပါပြီဗျာ။ 💯`, 
            suggestions: getProcessedSuggestions("", []), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg, aiMsg] } : s));
        setInput('');
        setIsTyping(false);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        return; 
    }

    // Handle Myanmar Practice
    const cleanText = (overrideText || input).trim();
    if (cleanText === '[Myanmar]' || cleanText === 'မြန်မာစာစီစာကုံး' ||
        cleanText.includes('[Myanmar') || cleanText.toLowerCase().includes('myanmar category') ||
        cleanText.toLowerCase().includes('myanmar type') || cleanText.toLowerCase().includes('myanmar sample')) {
        try {
            const res = await fetch(`${baseUrl}/api/tutor/myanmar-practice/${encodeURIComponent(studentId)}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({ topic: cleanText === 'မြန်မာစာစီစာကုံး' ? '[Myanmar]' : cleanText })
            });
            const data = await res.json();
            
            let userDisplay = cleanText;
            if (cleanText === '[Myanmar]') {
                userDisplay = input.trim() ? `[Myanmar] ${input.trim()}` : "မြန်မာစာ စာစီစာကုံး / အချေအဆို လေ့ကျင့်ချင်ပါတယ်";
            } else if (cleanText.includes('|')) {
                userDisplay = cleanText.split('|')[1];
            } else if (cleanText.includes(']')) {
                userDisplay = cleanText.split(']')[1].trim();
            }

            const userMsg: ChatMessage = { id: generateId(), sender: 'user', text: userDisplay, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));
            setInput(''); setIsTyping(true);
             
            if (data.status === 'funnel') {
                const sysText = data.message || data.data || '';
                const sysMsg: ChatMessage = { id: generateId(), sender: 'ai', persona: tutorPersona, text: sysText, suggestions: getProcessedSuggestions(sysText, data.suggestions), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, sysMsg] } : s));
            } else if (data.status === 'success') {
                setCurrentLessonContent(data.data || data.source_text || ""); 
                setCurrentFeatureType("myanmar");
                const aiText = data.data || '';
                const aiMsg: ChatMessage = { id: generateId(), sender: 'ai', persona: tutorPersona, text: aiText, gradingData: data.grading_data, suggestions: getProcessedSuggestions(aiText, data.suggestions), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
            } else if (data.status === 'essay_practice') {
                setCurrentFeatureType("myanmar"); 
                setEssayTopic(data.source_text || "မြန်မာစာ လေ့ကျင့်ခန်း"); 
                setIsEssayPracticeMode(true);
                const aiText = data.data || '';
                const aiMsg: ChatMessage = { id: generateId(), sender: 'ai', persona: tutorPersona, text: aiText, suggestions: getProcessedSuggestions(aiText, data.suggestions), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
            }
        } catch (error) { console.error("Myanmar Practice API Error:", error); setIsTyping(false); return; }
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        setIsTyping(false); return;
    }

    // Handle Flashcards
    if (overrideText === '🗂️ မှတ်စုကတ် (Flashcards) ပြုလုပ်မည်') {
        const displayMsg = "🗂️ ယခုလေ့လာခဲ့သော သင်ခန်းစာကို မှတ်စုကတ် (Flashcards) အဖြစ် ပြောင်းလဲပေးပါ။";
        const userMsg: ChatMessage = { id: generateId(), sender: 'user', text: displayMsg, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));
        setInput(''); setIsTyping(true);

        const sysMsgLoading: ChatMessage = { id: generateId(), sender: 'ai', persona: tutorPersona, text: "⚙️ သင်ခန်းစာ အနှစ်ချုပ်များကို Flashcard အဖြစ် ဖန်တီးနေပါပြီ... ခဏစောင့်ပါ။", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, sysMsgLoading] } : s));

        try {
            const flashcardTopic = chapterParam || subjectParam || "General Topic";
            const res = await fetch(`${baseUrl}/api/flashcards/generate/${encodeURIComponent(studentId)}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({ topic: flashcardTopic, context_type: taskId ? "study_plan" : "chat", source_text: currentLessonContent || "Extract key concepts" })
            });

            if (!res.ok) throw new Error("Flashcard generation failed");
            const data = await res.json();
            let flashcardSuggestions = ['📚 Vault သို့ သွားမည်'];
            if (taskId || actionParam === 'learn') flashcardSuggestions.push('✅ ပြီးမြောက်ပါပြီ (Return)');
            
            const sysMsgReady: ChatMessage = { 
              id: generateId(), 
              sender: 'ai', 
              persona: tutorPersona, 
              text: `🎉 ${data.flashcards?.length || 5} ကတ်ကို အောင်မြင်စွာ ဖန်တီးပြီး Vault ထဲသို့ သိမ်းဆည်းလိုက်ပါပြီ!\n\nVault ထဲသို့ ဝင်ရောက် ကျက်မှတ်နိုင်ပါသည်။`, 
              suggestions: getProcessedSuggestions("Flashcards Generated", flashcardSuggestions, "FLASHCARD_DONE"),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            };
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, sysMsgReady] } : s));
        } catch (error) {
            console.error("Flashcard Error:", error);
            const errorMsg: ChatMessage = { id: generateId(), sender: 'system', isError: true, text: `❌ Flashcard ဖန်တီးရာတွင် အခက်အခဲရှိနေပါသည်။`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
        }
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        setIsTyping(false); return;
    }

    // Handle Vault or Return
    if (overrideText === '📚 Vault သို့ သွားမည်') { router.push('/flashcards-vault'); return; }
    if (overrideText === '✅ ပြီးမြောက်ပါပြီ (Return)') { completeTaskAndReturn(); return; }

    // Handle Quiz Intent
    if (overrideText && overrideText.startsWith('[Quiz]')) {
        if (currentFeatureType === "english" && englishTutorQuizData) { handleStartEnglishQuiz(); return; }
        
        let quizTopic = "";
        let quizType = "general";
        if (currentFeatureType === "formula" && currentLessonContent) {
            quizType = "formula";
            try { const parsed = JSON.parse(currentLessonContent); quizTopic = parsed.quiz_trigger_topic || parsed.formula_name || ""; } catch (e) {}
        } else if (currentFeatureType === "english") {
            quizType = "english"; quizTopic = "English Practice Quiz";
        } else if (currentFeatureType === "listening") {
            quizType = "listening"; quizTopic = "Listening Comprehension Test";
        } else if (currentFeatureType === "diagram") { quizType = "general"; }
        
        if (!quizTopic && currentLessonContent) {
            if (currentLessonContent.includes('Reading Passage') || currentLessonContent.includes('Grammar Pattern')) {
                quizType = "english"; quizTopic = "English Practice Quiz";
            } else if (currentLessonContent.includes('formula_latex') || currentLessonContent.includes('section_a_variables')) {
                quizType = "formula";
                try { const parsed = JSON.parse(currentLessonContent); quizTopic = parsed.quiz_trigger_topic || parsed.formula_name || "Formula Practice Quiz"; } 
                catch (e) { quizTopic = "Formula Practice Quiz"; }
            }
        }
        
        if (!quizTopic) {
            const cleanedText = overrideText.replace('[Quiz]', '').replace(/နှင့်သက်ဆိုင်သော.*$/, '').replace(/အတွက်.*$/, '').trim();
            quizTopic = cleanedText;
        }
        
        if (!quizTopic || quizTopic === 'undefined' || quizTopic.trim() === '' || quizTopic === 'Recent Lesson') {
            if (quizType === "formula") quizTopic = "Formula Practice Quiz";
            else if (quizType === "english") quizTopic = "English Practice Quiz";
            else if (quizType === "listening") quizTopic = "Listening Comprehension Test";
            else if (currentLessonContent && currentLessonContent.length > 50) quizTopic = "Recent Summarized Lesson"; 
            else quizTopic = "General Knowledge Quiz";
        }

        localStorage.removeItem('quiz_topic'); localStorage.removeItem('auto_diagnose'); localStorage.removeItem('listening_quiz_data'); localStorage.removeItem('quiz_intent');
        localStorage.setItem('quiz_intent', JSON.stringify({ topic: quizTopic, type: quizType, sourceText: currentLessonContent || "" }));

        const sysMsg: ChatMessage = { id: generateId(), sender: 'ai', persona: tutorPersona, text: `✅ "${quizTopic}" နဲ့ ပတ်သက်တဲ့ ဉာဏ်စမ်းများကို ပြင်ဆင်နေပါတယ်... ခဏစောင့်ပါဗျာ။ 🚀`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, sysMsg] } : s));
        
        setIsTyping(true);
        setTimeout(() => { setIsTyping(false); router.push('/quiz'); }, 1500); return;
    }

    // Handle Simple Quiz
    if (overrideText === '🧠 ဉာဏ်စမ်း (Quiz) ဖြေမည်') { 
      const topicToQuiz = chapterParam || subjectParam || "Recent Lesson";
      handleSend(`[Quiz] ${topicToQuiz}`); 
      return; 
    }

    // Handle Diagnostic Check
    if (overrideText === '🎯 ကျွန်တော့်အားနည်းချက်ကို စစ်ဆေးပေးပါ') {
        const displayMsg = "🎯 ကျွန်တော့်အားနည်းချက်ကို စစ်ဆေးပေးပါ";
        const userMsg: ChatMessage = { id: generateId(), sender: 'user', text: displayMsg, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));
        setInput(''); setIsTyping(true);

        const sysMsgLoading: ChatMessage = { id: generateId(), sender: 'ai', persona: tutorPersona, text: "🔍 သင်၏ အားနည်းချက်များကို စစ်ဆေးနေပါပြီ... ခဏစောင့်ပေးပါ။", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, sysMsgLoading] } : s));

        try {
            const res = await fetch(`${baseUrl}/api/tutor/diagnostic-quiz/${encodeURIComponent(studentId)}`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } });
            if (!res.ok) throw new Error("Diagnostic failed");
            const data = await res.json();
            localStorage.removeItem('quiz_intent');
            localStorage.setItem('quiz_intent', JSON.stringify({ topic: "Diagnostic Assessment", type: "diagnostic", quizData: data.quiz }));
            const sysMsgReady: ChatMessage = { id: generateId(), sender: 'ai', persona: tutorPersona, text: "🎉 စစ်ဆေးမှု မေးခွန်းများ အဆင်သင့်ဖြစ်ပါပြီ! သီးသန့် Quiz Page သို့ ခေါ်ဆောင်သွားနေပါသည်... 🚀", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, sysMsgReady] } : s));
            setTimeout(() => { setIsTyping(false); router.push('/quiz'); }, 1500);
        } catch (error) {
            console.error("Diagnostic Error:", error);
            const errorMsg: ChatMessage = { id: generateId(), sender: 'system', isError: true, text: `❌ အားနည်းချက်စစ်ဆေးသည့် မေးခွန်းများ ထုတ်ယူရာတွင် အခက်အခဲရှိနေပါသည်။`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
            setIsTyping(false);
        }
        if (textareaRef.current) textareaRef.current.style.height = 'auto'; 
        return;
    }

    // Handle English Listening
    if (overrideText === '🎧 English Listening') {
        setIsListeningModalOpen(true); setIsLoadingTopics(true);
        const userGrade = activeUser.grade || localStorage.getItem('grade') || 'High School'; 
        try {
            const res = await fetch(`${baseUrl}/api/chat/listening/topics/${encodeURIComponent(studentId)}`, { headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } });
            if (res.ok) {
                const data = await res.json();
                setListeningTopics(data.topics && data.topics.length > 0 ? data.topics : [`❌ Topic မရှိသေးပါ`]);
            }
        } catch (error) { setListeningTopics([`❌ Connection Error`]); }
        setIsLoadingTopics(false); return;
    }

    // Handle Submit Quiz Answers
    if (overrideText === '[Submit Quiz Answers]' && englishTutorQuizId && englishTutorQuizData) {
        setIsTyping(true);
        const response = await submitTutorQuizAnswers(englishTutorQuizId, []);
        const aiMsg: ChatMessage = { id: generateId(), sender: 'ai', persona: tutorPersona, text: response.data || 'Quiz Result', suggestions: getProcessedSuggestions(response.data || '', response.suggestions || []), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
        setEnglishTutorQuizId(null); setEnglishTutorQuizData(null); setIsTyping(false); return;
    }

    // Handle English Practice
    const textToCheck = (overrideText || input).trim();
    const englishTextLower= textToCheck.toLowerCase();
    // Handle English Practice
   
    const isEnglishIntent = textToCheck === '🇬🇧 English Practice' || 
        textToCheck.startsWith('[English]') || 
        textToCheck.startsWith('[Grammar]') || 
        textToCheck.startsWith('[Reading]') || 
        textToCheck.startsWith('[Essay') || 
        textToCheck.startsWith('[Practice Essay]') || 
        textToCheck.startsWith('[Submit Essay]') || 
        textToCheck.startsWith('[Start Quiz]') || 
        textToCheck.startsWith('[Letter Type]') || 
        textToCheck.startsWith('[Write Letter]') || 
        textToCheck.startsWith('[Submit Letter]') || 
        textToCheck === '[Submit Quiz Answers]' || 
        textToCheck.startsWith('reading') || 
        textToCheck.startsWith('grammar') || 
        textToCheck.startsWith('essay') || 
        textToCheck.startsWith('writing') || 
        textToCheck.startsWith('letter');
    
    if (isEnglishIntent) {
        let topicToSend = textToCheck;
        if (topicToSend === '🇬🇧 English Practice') topicToSend = input.trim();
        else if (topicToSend.startsWith('[English]')) topicToSend = topicToSend.replace('[English]', '').trim();

        const displayMsg = topicToSend ? `🇬🇧 English Practice: ${topicToSend}` : "🇬🇧 English စာ လေ့ကျင့်ချင်ပါတယ်";
        const userMsg: ChatMessage = { 
            id: generateId(), 
            sender: 'user', 
            text: displayMsg, 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));
        setInput(''); 
        setIsTyping(true);

        try {
            const res = await fetch(`${baseUrl}/api/tutor/english-practice/${encodeURIComponent(studentId)}`, { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}`, 
                    'ngrok-skip-browser-warning': 'true' 
                }, 
                body: JSON.stringify({ 
                    topic: topicToSend, 
                    essay_text: input.trim() || '' 
                }) 
            });

            // 🚨 THE FIX: Response status ကို စစ်ဆေးမည်
            if (!res.ok) {
                const errorText = await res.text();
                console.error("English Practice API Error:", res.status, errorText);
                
                const errorMsg: ChatMessage = { 
                    id: generateId(), 
                    sender: 'ai', 
                    persona: tutorPersona, 
                    text: `❌ ဆက်သွယ်ရာတွင် အခက်အခဲရှိပါသည်။ (Error ${res.status})\n\nကျေးဇူးပြု၍ ထပ်မံကြိုးစားပါ။`, 
                    suggestions: ['🇬🇧 English Practice', '📝 Summarize Topic'], 
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
                setIsTyping(false);
                return;
            }
            
            const data: TutorResponse = await res.json();
            
            if (data.status === 'funnel') {
                const sysText = data.message || data.data || '';
                const sysMsg: ChatMessage = { 
                    id: generateId(), 
                    sender: 'ai', 
                    persona: tutorPersona, 
                    text: sysText, 
                    suggestions: getProcessedSuggestions(sysText, data.suggestions), 
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, sysMsg] } : s));
            } else if (data.status === 'success') {
                setCurrentLessonContent(data.data || data.source_text || ""); 
                setCurrentFeatureType("english");
                const aiText = data.data || '';
                const aiMsg: ChatMessage = { 
                    id: generateId(), 
                    sender: 'ai', 
                    persona: tutorPersona, 
                    text: processChatText(aiText), 
                    gradingData: data.grading_data, 
                    suggestions: getProcessedSuggestions(aiText, data.suggestions), 
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
            } else if (data.status === 'quiz_active') {
                setCurrentLessonContent(data.data || ''); 
                setCurrentFeatureType("english");
                if (data.quiz_trigger) {
                    try {
                        const quizData = JSON.parse(data.quiz_trigger);
                        localStorage.removeItem('quiz_intent');
                        localStorage.setItem('quiz_intent', JSON.stringify({ 
                            topic: 'English Practice Quiz', 
                            type: 'english', 
                            sourceText: data.source_text || currentLessonContent, 
                            quizData: quizData.questions || [], 
                            tutorQuizId: data.quiz_id 
                        }));
                    } catch (e) { 
                        console.error('Failed to parse quiz_trigger:', e); 
                    }
                }
                const aiMsg: ChatMessage = { 
                    id: generateId(), 
                    sender: 'ai', 
                    persona: tutorPersona, 
                    text: processChatText(data.data || ''), 
                    suggestions: getProcessedSuggestions(data.data || '', data.suggestions), 
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
                setIsTyping(false); 
                setTimeout(() => router.push('/quiz'), 800); 
                return;
            } else if (data.status === 'essay_practice') {
                setCurrentLessonContent(data.data || ''); 
                setCurrentFeatureType("english");
                setEssayTopic(data.source_text || (topicToSend.toLowerCase().includes('letter') ? "Letter Writing" : "Essay Writing")); 
                setIsEssayPracticeMode(true);
                const aiText = data.data || '';
                const aiMsg: ChatMessage = { 
                    id: generateId(), 
                    sender: 'ai', 
                    persona: tutorPersona, 
                    text: processChatText(aiText), 
                    suggestions: getProcessedSuggestions(aiText, data.suggestions), 
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
            } else if (data.status === 'error') {
                // 🚨 THE FIX: Backend မှ error status ပြန်လာရင် ကိုင်တွယ်မည်
                const errorMsg: ChatMessage = { 
                    id: generateId(), 
                    sender: 'ai', 
                    persona: tutorPersona, 
                    text: data.data || data.message || '⚠️ အမှားအယွင်းတစ်ခုခု ဖြစ်ပွားနေပါသည်။ ပြန်ကြိုးစားပါ။', 
                    suggestions: ['🇬🇧 English Practice', '📝 Summarize Topic'], 
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
            }
        } catch (error) { 
            console.error("English Practice Error:", error);
            const errorMsg: ChatMessage = { 
                id: generateId(), 
                sender: 'system', 
                isError: true, 
                text: '❌ English Practice တွင် အခက်အခဲရှိနေပါသည်။ အင်တာနက်လိုင်း စစ်ဆေးပြီး ထပ်မံကြိုးစားပါ။', 
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            };
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
        }
        if (textareaRef.current) textareaRef.current.style.height = 'auto'; 
        setIsTyping(false); 
        return;
    }

    // Handle Summarize Topic
    if (overrideText === '📝 Summarize Topic' && !input.trim() && pendingAttachments.length === 0) {
        setIsTyping(true);
        try {
            const queryParams = new URLSearchParams();
            if (subjectParam) queryParams.append('subject', subjectParam);
            if (chapterParam) queryParams.append('chapter', chapterParam);
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

            const res = await fetch(`${baseUrl}/api/tutor/summarize-suggestions/${encodeURIComponent(studentId)}${queryString}`, { 
                headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } 
            });
            const data = await res.json();
            const sysText = data.message || "အောက်ပါတို့ကို လေ့လာကြည့်မလား?";
            
            // 🚨 THE FIX: Suggested topics တွေက Subject Selection ဖြစ်နေရင် "NONE" action သုံးမည်
            const actionType = data.suggested_topics?.some((s: string) => s.includes('ကို လေ့လာမည်')) ? "NONE" : "SUMMARIZED";
            
            const sysMsg: ChatMessage = { 
              id: generateId(), sender: 'ai', persona: tutorPersona, text: sysText, 
              
              suggestions: getProcessedSuggestions(sysText, data.suggested_topics, actionType),
              
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            };
            
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, sysMsg] } : s));
        } catch (error) {}
        setIsTyping(false); return;
    }    

    // Handle Grade 12 Old Qs
    if (overrideText === '🎓 Grade 12 Old Qs' || cleanText.startsWith('[Old Q]')) {
        let subjectToSend = ''; let yearToSend = ''; let paperToSend = '';
        const userTypedQuestion = input.trim();
        let messageToSend = userTypedQuestion;
        
        if (overrideText && overrideText !== '🎓 Grade 12 Old Qs') {
            const cleanTextOldQ = overrideText.replace('[Old Q]', '').trim();
            const yearMatch = cleanTextOldQ.match(/20\d{2}/);
            const paperMatch = cleanTextOldQ.match(/paper_?\d/i);
            
            if (yearMatch) {
                yearToSend = yearMatch[0];
                const subjectPart = cleanTextOldQ.split(yearMatch[0])[0].trim();
                if (subjectPart) subjectToSend = subjectPart;
            } else { subjectToSend = cleanTextOldQ.split(' ')[0]; }
            
            if (paperMatch) paperToSend = paperMatch[0].replace(/_/g, '').replace(/paper/i, 'Paper_');
            
            if (!messageToSend && cleanTextOldQ) {
                let remainingText = cleanTextOldQ;
                if (subjectToSend) remainingText = remainingText.replace(subjectToSend, '');
                if (yearToSend) remainingText = remainingText.replace(yearToSend, '');
                if (paperMatch) remainingText = remainingText.replace(paperMatch[0], '');
                remainingText = remainingText.replace(/မေးခွန်းတွေ ပြန်ကြည့်မယ်/g, '').replace(/မေးခွန်းဟောင်း/g, '').replace(/မေးခွန်း/g, '').trim();
                messageToSend = remainingText;
            }
        } else { subjectToSend = userTypedQuestion; }

        const displayMsg = userTypedQuestion || (overrideText === '🎓 Grade 12 Old Qs' ? (subjectToSend || "🎓 Grade 12 မေးခွန်းဟောင်း") : overrideText.replace('[Old Q]', '').trim());
        const userMsg: ChatMessage = { id: generateId(), sender: 'user', text: displayMsg, attachments: [...pendingAttachments], timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));
        setInput(''); setPendingAttachments([]); setIsTyping(true);

        try {
            const requestBody: any = { message: messageToSend };
            if (subjectToSend) requestBody.subject = subjectToSend;
            if (yearToSend) requestBody.year = yearToSend;
            if (paperToSend) requestBody.paper = paperToSend;
            
            const res = await fetch(`${baseUrl}/api/tutor/grade12-strategy/${encodeURIComponent(studentId)}`, { 
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }, 
                body: JSON.stringify(requestBody) 
            });
            const data = await res.json();
            
            if (data.status === 'funnel') {
                const sysText = data.message;
                const sysMsg: ChatMessage = { id: generateId(), sender: 'ai', persona: tutorPersona, text: sysText, suggestions: getProcessedSuggestions(sysText, data.suggestions), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, sysMsg] } : s));
            } else if (data.status === 'success') {
                setCurrentLessonContent(data.message || data.explanation || data.guide || ""); 
                setCurrentFeatureType("old_q");
                if (data.subject) localStorage.setItem("old_q_subject", data.subject);
                if (data.year) localStorage.setItem("old_q_year", data.year);
                if (data.paper) localStorage.setItem("old_q_paper", data.paper);
                
                if (data.intent === 'EXPLAIN' && data.explanation) {
                    const aiText = data.explanation;
                    const aiMsg: ChatMessage = { id: generateId(), sender: 'ai', persona: tutorPersona, text: processChatText(aiText), suggestions: getProcessedSuggestions(aiText, data.suggestions), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
                } else if (data.intent === 'GUIDE' && data.guide) {
                    const aiText = data.guide;
                    const aiMsg: ChatMessage = { id: generateId(), sender: 'ai', persona: tutorPersona, text: processChatText(aiText), suggestions: getProcessedSuggestions(aiText, data.suggestions), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
                } else if (data.images && data.images.length > 0) {
                    const imageAttachments: Attachment[] = [];
                    for (let i = 0; i < data.images.length; i++) {
                        const img = data.images[i];
                        if (img && img.data && img.data.length > 100) {
                            let base64Only = img.data;
                            if (base64Only.includes('base64,')) base64Only = base64Only.split('base64,')[1];
                            if (base64Only && base64Only.length > 50) imageAttachments.push({ id: generateId(), name: img.filename || `Question_${i + 1}.jpg`, type: 'image', base64: base64Only });
                        }
                    }
                    const aiText = data.message || `📚 မေးခွန်းဟောင်း ${data.total_images_found} ပုံ တွေ့ပါသည်။`;
                    const aiMsg: ChatMessage = { id: generateId(), sender: 'ai', persona: tutorPersona, text: aiText, attachments: imageAttachments.length > 0 ? imageAttachments : undefined, suggestions: getProcessedSuggestions(aiText, data.suggestions), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
                } else if (data.message) {
                    const aiText = data.message;
                    const aiMsg: ChatMessage = { id: generateId(), sender: 'ai', persona: tutorPersona, text: aiText, suggestions: getProcessedSuggestions(aiText, data.suggestions), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
                }
            } else if (data.status === 'error') {
                const sysMsg: ChatMessage = { id: generateId(), sender: 'system', isError: true, text: data.message || "Error", timestamp: '' };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, sysMsg] } : s));
            }
        } catch (error) {}
        if (textareaRef.current) textareaRef.current.style.height = 'auto'; 
        setIsTyping(false); return;
    }

    // -------- Fallback: General Chat --------
    messageText = (overrideText || input).trim();
    
    // 🚨 NEW: "ကို လေ့လာမည်" ပါလာရင် SYSTEM DIRECTIVE မထည့်ဘဲ တိုက်ရိုက် ပို့မည်
    const isSubjectSelectionButton = messageText.includes('ကို လေ့လာမည်');
    
    actualPromptToAI = hiddenSystemPrompt || messageText;
    displayUserText = hiddenSystemPrompt ? (overrideText || messageText) : messageText;
    attachmentsToSend = [...pendingAttachments]; 

    const newUserMsg: ChatMessage = { 
      id: generateId(), sender: 'user', text: displayUserText, attachments: [...pendingAttachments], 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
         const newTitle = (s.title === 'New Conversation' && displayUserText) ? displayUserText.substring(0, 30) + (displayUserText.length > 30 ? '...' : '') : s.title;
         return { ...s, title: newTitle, messages: [...s.messages, newUserMsg] };
      }
      return s;
    }));
    
    if (!overrideText && !hiddenSystemPrompt) setInput('');
    setPendingAttachments([]);
    setIsTyping(true); 
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      let finalPromptToAI = actualPromptToAI;

      // 🚨 NEW: "ကို လေ့လာမည်" ပါလာရင် SYSTEM DIRECTIVE မထည့်ဘဲ တိုက်ရိုက် ပို့မည်
      if (isSubjectSelectionButton) {
          finalPromptToAI = messageText; // မူလစာသားအတိုင်း ပို့မည်
      } else if (taskId && actionParam && !hiddenSystemPrompt) {
        const userTextLower = actualPromptToAI.toLowerCase();
        const actLower = actionParam.toLowerCase();
        const combinedTask = `${actionParam} ${detailsParam}`.toLowerCase();

        if (userTextLower.includes("လေ့ကျင့်") || userTextLower.includes("ပုစ္ဆာ") || userTextLower.includes("တွက်") || userTextLower.includes("practice")) {
          finalPromptToAI = `[SYSTEM DIRECTIVE: YOU ARE IN PRACTICE MODE. NEVER EXPLAIN THEORY. Output ONLY a practice question for the student to solve.]\nStudent says: ${actualPromptToAI}`;
        } else if (userTextLower.includes("အဖြေတိုက်") || userTextLower.includes("စစ်ပေး") || userTextLower.includes("check")) {
          finalPromptToAI = `[SYSTEM DIRECTIVE: YOU ARE IN GRADING MODE. JUST CHECK THE ANSWER AND POINT OUT MISTAKES. DO NOT EXPLAIN THEORY.]\nStudent says: ${actualPromptToAI}`;
        } else if (userTextLower.includes("သီအိုရီ") || userTextLower.includes("ရှင်းပြ") || userTextLower.includes("explain") || userTextLower.includes("နံနက်")) {
          finalPromptToAI = `[SYSTEM DIRECTIVE: YOU ARE IN THEORY MODE. EXPLAIN CLEARLY. DO NOT GIVE QUIZ QUESTIONS YET.]\nStudent says: ${actualPromptToAI}`;
        } else {
          if (actLower.includes("evening") || combinedTask.includes("ပြန်လည်သုံးသပ်") || combinedTask.includes("အဖြေတိုက်") || combinedTask.includes("အမှားပြင်") || combinedTask.includes("စစ်ဆေး") || combinedTask.includes("quiz") || combinedTask.includes("ဉာဏ်စမ်း") || combinedTask.includes("review")) {
            if (isCalculationTask) {
                finalPromptToAI = `[SYSTEM DIRECTIVE: GRADING MODE (CALCULATION). STRICTLY CHECK MATH/CALCULATION WORK.]\nStudent says: ${actualPromptToAI}`;
            } else {
                finalPromptToAI = `[SYSTEM DIRECTIVE: EVENING REVIEW (THEORY). Tell the student to click the '🧠 ဉာဏ်စမ်း (Quiz) ဖြေမည်' button below to start the test. DO NOT ask them to upload any photos or type answers.]\nStudent says: ${actualPromptToAI}`;
            }
          } else if (actLower.includes("afternoon") || combinedTask.includes("လေ့ကျင့်ခန်း") || combinedTask.includes("တွက်ချက်") || combinedTask.includes("ဖြေဆို")) {
            finalPromptToAI = isCalculationTask 
              ? `[SYSTEM DIRECTIVE: PRACTICE MODE (CALCULATION). Output ONLY ONE calculation problem.]\nStudent says: ${actualPromptToAI}`
              : `[SYSTEM DIRECTIVE: PRACTICE MODE (THEORY). Output ONLY ONE short conceptual question.]\nStudent says: ${actualPromptToAI}`;
          } else {
            finalPromptToAI = `[SYSTEM DIRECTIVE: THEORY MODE. EXPLAIN CLEARLY. DO NOT GIVE QUIZ QUESTIONS YET.]\nStudent says: ${actualPromptToAI}`;
          }
        }
      }

      const textForCheckAsk = actualPromptToAI.toLowerCase();
      const isPastPaperQuestion = textForCheckAsk.includes("စာမျက်နှာ") || textForCheckAsk.includes("မေးခွန်းဟောင်း") || textForCheckAsk.includes("past paper");

      let endpoint = `${baseUrl}/api/tutor/ask`;
      let payload: any = { 
        student_id: studentId, session_id: currentSessionId, question: finalPromptToAI, 
        study_mode: studyMode, persona: tutorPersona, is_old_question: isPastPaperQuestion, 
        subject: detectSubject(actualPromptToAI) || "Mathematics" 
      };
      
      const imageAttachment = attachmentsToSend.find(a => a.type === 'image');
      if (imageAttachment && imageAttachment.base64) {
        endpoint = `${baseUrl}/api/tutor/ask-with-image/${encodeURIComponent(studentId)}`; 
        const formData = new FormData();
        const byteCharacters = atob(imageAttachment.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
        const file = new Blob([new Uint8Array(byteNumbers)], { type: 'image/jpeg' });
        
        formData.append("image", file, imageAttachment.name);
        
        const isEveningTask = actionParam.toLowerCase().includes("evening") || actionParam.includes("ပြန်လည်သုံးသပ်") || actionParam.includes("ညနေပိုင်း");
        const defaultImagePrompt = isEveningTask ? "ကျွန်တော်တွက်ထားတဲ့ အဖြေကို စစ်ဆေးပေးပါ။ မှားနေတာရှိရင် အဆင့်ဆင့် ထောက်ပြပြီး ပုံသေနည်းကို ပြန်ရှင်းပြပေးပါ။" : "ဒီပုံထဲက အကြောင်းအရာကို မြန်မာလို ရှင်းပြပေးပါ။";

        formData.append("question", actualPromptToAI || defaultImagePrompt);
        
        const response = await fetch(endpoint, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        
        setCurrentLessonContent(data.answer || "");
        setCurrentFeatureType("general");
        
        const aiText = data.answer || "အဖြေမရရှိပါ။";
        const aiSuggestions = getProcessedSuggestions(aiText, data.suggestions || data.suggested_topics, data.action);
        
        const aiMsg: ChatMessage = { id: generateId(), sender: 'ai', text: processChatText(aiText), persona: tutorPersona, suggestions: aiSuggestions, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
        setIsTyping(false); return;
      }

      const response = await fetch(endpoint, { 
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }, 
        body: JSON.stringify(payload) 
      });

      if (!response.ok) throw new Error("API Error");
      const data = await response.json();
      const aiReply = data.answer || data.reply || data.response || "ဆောရီးပါ။ အဖြေရှာမရဖြစ်နေပါတယ်။";
      const action = data.action || "NONE";
      let topicFromAI = data.topic && data.topic !== "General Syllabus" ? data.topic : "";

      let finalType = currentFeatureType;
      let finalTopic = topicFromAI;
      let finalSourceText = currentLessonContent;

      if (action === "START_QUIZ") {
          if (finalType === "formula" || (finalSourceText && finalSourceText.includes("formula_latex"))) {
              finalType = "formula";
              try { const parsed = JSON.parse(finalSourceText); finalTopic = parsed.quiz_trigger_topic || parsed.formula_name || "Formula Quiz"; } catch(e) {}
          } else if (finalType === "english" || (finalSourceText && finalSourceText.includes("Reading Passage"))) {
              finalType = "english"; finalTopic = finalTopic || "English Practice Quiz";
          } else if (finalType === "listening") {
              finalType = "listening"; finalTopic = "Listening Comprehension";
          } else {
              finalType = "general"; finalTopic = finalTopic || "General Knowledge Quiz";
          }
      } else {
          setCurrentLessonContent(aiReply); setCurrentFeatureType("general");
      }

      setIsTyping(false);
      
      const aiSuggestions = getProcessedSuggestions(aiReply, data.suggestions, action);

      const aiMsg: ChatMessage = { id: generateId(), sender: 'ai', text: processChatText(aiReply), persona: tutorPersona, suggestions: aiSuggestions, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));

      if (action === "START_QUIZ") {
          if (actualPromptToAI.includes("အားနည်းချက်")) { localStorage.setItem('auto_diagnose', 'true'); } 
          else { localStorage.setItem('quiz_intent', JSON.stringify({ topic: finalTopic, type: finalType, sourceText: finalSourceText })); }
          setTimeout(() => router.push(`/quiz`), 1500); 
      } else if (action === "GENERATE_PLANNER") {
          setTimeout(() => router.push(`/study-plan`), 1500);
      } else if (action === "CREATE_FLASHCARDS") {
          setTimeout(() => router.push(`/flashcards-vault`), 1500);
      }

    } catch (error: unknown) {
        console.error("Chat Action Error:", error); 
        setIsTyping(false);
        const errorMsg: ChatMessage = { 
          id: generateId(), 
          sender: 'system', 
          isError: true, 
          text: `❌ Error: ${error instanceof Error ? error.message : "Connection Error"}`, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
    }
  };

  // 🚨 NEW useEffect: DEDICATED STUDY PLAN API CALL 🚨
  useEffect(() => {
    if (taskId && subjectParam && chapterParam && actionParam && !hasAutoStarted && currentSessionId) {
      setHasAutoStarted(true);

      const actLower = actionParam.toLowerCase();

      // Handle simple re-routes first
      if (actLower === 'quiz') {
        handleSend(`[Quiz] ${chapterParam}`);
        return;
      }
      if (actLower === 'check_work') {
        handleSend('✅ Check Work');
        return;
      }
      if (actLower === 'flashcard') {
        router.push('/flashcards-vault');
        return;
      }

      // 🚨 REAL-WORLD STUDY PLAN EXECUTION API CALL 🚨
      const executeStudyPlanLesson = async () => {
        const token = localStorage.getItem('token');
        const studentId = activeUser.id || localStorage.getItem('student_id') || 'STU_TEMP';
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace(/\/+$/, '').replace(/\/docs$/, '');
        
        setIsTyping(true);
        
        const displayPrompt = `🚀 '${chapterParam}' ကို လေ့လာချင်ပါတယ်။`;
        const userMsg: ChatMessage = { 
            id: generateId(), 
            sender: 'user', 
            text: displayPrompt, 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));

        try {
        // 🚨 NEW: Proper task_category calculation
        let taskCategory = actionParam;
        const actLower = actionParam.toLowerCase();
        const subjectLower = (subjectParam || "").toLowerCase();
        const isCalcSubject = subjectLower.includes('math') || 
                              subjectLower.includes('physics') || 
                              subjectLower.includes('ရူပ') || 
                              subjectLower.includes('သင်္ချာ') ||
                              subjectLower.includes('chemistry') ||
                              subjectLower.includes('ဓာတု');

        // 🚨 Evening + Calculation Subject → Check Work
        if (actLower.includes('evening') && isCalcSubject) {
            taskCategory = 'check_work';
        }
        // 🚨 Afternoon + Calculation Subject → Practice Problem
        else if (actLower.includes('afternoon') && isCalcSubject) {
            taskCategory = 'calculation_practice';
        }
        // 🚨 Morning + Calculation Subject → Theory
        else if (actLower.includes('morning') && isCalcSubject) {
            taskCategory = 'calculation';
        }
            const res = await fetch(`${baseUrl}/api/tutor/study-plan-execute/${encodeURIComponent(studentId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({
                    subject: subjectParam,
                    topic: chapterParam,
                    task_category: taskCategory,
                    session_id: currentSessionId
                })
            });
            
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();
            
            if (data.status === 'success') {
                setCurrentLessonContent(data.reply || "");
                
                // Track feature type logically
                if (actLower.includes("english")) setCurrentFeatureType("english");
                else if (actLower.includes("myanmar")) setCurrentFeatureType("myanmar");
                else setCurrentFeatureType("general");

                const aiMsg: ChatMessage = { 
                    id: generateId(), 
                    sender: 'ai', 
                    persona: tutorPersona, 
                    text: processChatText(data.reply || ""), 
                    
                    scriptText: data.scriptText || "", 
                    
                    suggestions: getProcessedSuggestions(data.reply || "", data.suggestions), 
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s));
            } else {
                throw new Error("Invalid response");
            }
        } catch (error) {
            console.error("Study Plan API Error:", error);
            const errorMsg: ChatMessage = { id: generateId(), sender: 'system', isError: true, text: `❌ သင်ခန်းစာ ထုတ်ယူရာတွင် အခက်အခဲရှိနေပါသည်။`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
        }
        setIsTyping(false);
      };

      executeStudyPlanLesson();
    }
  }, [taskId, subjectParam, chapterParam, actionParam, detailsParam, hasAutoStarted, currentSessionId]);

  useEffect(() => {
    if (!taskId && actionParam === 'learn' && chapterParam && !hasAutoStarted && currentSessionId) {
      const displayPrompt = `🚀 '${chapterParam}' ကို စတင်လေ့လာချင်ပါတယ်။`;
      const systemPrompt = `SYSTEM DIRECTIVE: ကျောင်းသားသည် '${chapterParam}' ကို လေ့လာရန် ရောက်ရှိလာပါသည်။ လိုအပ်သည်များကို သင်ကြားပေးပါ။`;
      
      setHasAutoStarted(true);
      handleSend(displayPrompt, systemPrompt);
    }
  }, [taskId, actionParam, chapterParam, hasAutoStarted, currentSessionId]);

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex items-center justify-center text-[#5F8B7E] font-bold">
        Loading Chat Space...
      </div>
    );
  }

  const renderMarkdownComponents = {
    p: ({node, ...props}: any) => <div className="mb-3 last:mb-0 leading-relaxed text-[15px]" {...props} />, 
    
    // Bold စာသားများကို Highlight အရောင်လေးခံပြီး ပြသရန်
    strong: ({node, ...props}: any) => <strong className="font-extrabold text-[#5F8B7E] bg-[#5F8B7E]/10 px-1.5 py-0.5 rounded-md" {...props} />, 
    
    ul: ({node, ...props}: any) => <ul className="list-none mb-4 space-y-2 text-[#3F4A3C]/90" {...props} />, 
    ol: ({node, ...props}: any) => <ol className="list-decimal ml-5 mb-4 space-y-2 text-[#3F4A3C]/90 font-semibold" {...props} />, 
    
    // Bullet Point လေးများကို Custom Design ပြောင်းရန်
    li: ({node, ...props}: any) => <li className="flex items-start gap-2"><span className="text-[#8A8F4D] mt-0.5">✦</span><div className="flex-1" {...props} /></li>, 
    
    // ခေါင်းစဉ်များကို အရောင်နှင့် အောက်ခံမျဉ်းများဖြင့် အလှဆင်ရန်
    h1: ({node, ...props}: any) => <h1 className="text-2xl font-black text-[#3F4A3C] mb-4 mt-6 border-b-2 border-[#F4EBDD] pb-2" {...props} />, 
    h2: ({node, ...props}: any) => <h2 className="text-xl font-extrabold text-[#5F8B7E] mb-3 mt-5 flex items-center gap-2" {...props} />, 
    h3: ({node, ...props}: any) => <h3 className="text-md font-bold text-[#8A8F4D] bg-[#F4EBDD]/40 px-3 py-1.5 rounded-lg mb-2 mt-4 uppercase tracking-wide inline-block" {...props} />,
    
    // အပိုင်းတစ်ခုနှင့်တစ်ခု ခြားသည့် မျဉ်းကြောင်း (---) ကို အလှဆင်ရန်
    hr: ({node, ...props}: any) => <hr className="border-t-2 border-dashed border-[#F4EBDD] my-6" {...props} />,
    
    // မှတ်သားဖွယ်ရာ Quote စာသားများကို ကတ်လေးသဖွယ်ပြသရန်
    blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-[#C9785C] pl-4 py-3 my-4 bg-[#F4EBDD]/30 rounded-r-xl italic text-[#3F4A3C]/80 font-medium" {...props} />,
    
    img: ({node, src, ...props}: any) => {
      if (!src || src === '' || src.trim() === '') return null;
      return <img className="rounded-2xl max-w-full md:max-w-md h-auto my-5 shadow-[0_10px_30px_rgb(0,0,0,0.08)] border-4 border-white mx-auto block bg-white" src={src} {...props} />;
    },
    code: ({node, inline, className, children, ...props}: any) => { 
      const match = /language-(\w+)/.exec(className || '');
      const isInline = inline !== undefined ? inline : !match;
      return !isInline ? ( 
        <div className="bg-[#3F4A3C] text-[#F4EBDD] p-4 rounded-2xl overflow-x-auto text-sm font-mono my-4 shadow-inner">
          <code className={className} {...props}>{children}</code>
        </div> 
      ) : ( 
        // 🚨 ဤနေရာရှိ text-[#C9785C] ကို text-[#5F8B7E] သို့ ပြောင်းလိုက်ပါ 🚨
        <code className="bg-[#F4EBDD] text-[#5F8B7E] px-1.5 py-0.5 rounded-md text-[13px] font-mono font-bold break-words" {...props}>
          {children}
        </code> 
      ) 
    }
  };

  return (
    <div className="h-screen w-full flex bg-[#FFFDF8] text-[#3F4A3C] font-sans antialiased selection:bg-[#F4EBDD] selection:text-[#5F8B7E] overflow-hidden">
      
      <AnimatePresence>
        {isListeningModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-[#3F4A3C]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }} 
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-5 border-b border-[#F4EBDD] flex justify-between items-center bg-[#FFFDF8]">
                <h3 className="font-extrabold text-lg text-[#5F8B7E] flex items-center gap-2">🎧 English Listening Practice</h3>
                <button onClick={() => setIsListeningModalOpen(false)} className="p-2 text-[#3F4A3C]/50 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><CloseIcon /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-[#FFFDF8]/30 scrollbar-hide">
                {!listeningData && !isListeningLoading && (
                  <div className="space-y-4">
                    <p className="text-[#3F4A3C]/80 font-bold mb-4">လေ့လာလိုသော သင်ခန်းစာ ခေါင်းစဉ်ကို ရွေးချယ်ပါ -</p>
                    {isLoadingTopics ? (
                        <div className="flex justify-center py-6"><div className="w-8 h-8 border-4 border-[#F4EBDD] border-t-[#5F8B7E] rounded-full animate-spin"></div></div>
                    ) : (
                        listeningTopics.map(topic => (
                          <button key={topic} onClick={() => handleStartListening(topic)} className="w-full text-left p-4 rounded-xl border border-[#F4EBDD] hover:border-[#5F8B7E] hover:bg-[#5F8B7E]/5 font-extrabold text-[#3F4A3C] transition-all flex justify-between items-center group">
                            {topic} <span className="opacity-0 group-hover:opacity-100 text-[#5F8B7E] transition-opacity">Start ➡️</span>
                          </button>
                        ))
                    )}
                  </div>
                )}
                {isListeningLoading && (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                     <div className="w-10 h-10 border-4 border-[#F4EBDD] border-t-[#5F8B7E] rounded-full animate-spin"></div>
                     <p className="font-bold text-[#5F8B7E]">AI is generating dialogue and audio...</p>
                  </div>
                )}
                {listeningData && !isListeningLoading && (
                  <div className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-[#F4EBDD] text-center shadow-sm">
                       <p className="text-[#3F4A3C] font-extrabold mb-2 text-lg">{playingIndex >= 0 ? `🔊 Playing Audio... (${playingIndex + 1}/${listeningData.length})` : "✅ Audio Playback Completed"}</p>
                       {playingIndex >= 0 ? (
                         <div className="mt-2 flex flex-col items-center w-full">
                           <audio ref={audioRef} controls autoPlay onEnded={handleAudioEnd} className="w-full h-12 outline-none rounded-full shadow-sm"/>
                           <p className="text-xs text-[#C9785C] mt-3 font-bold">* အသံအလိုအလျောက် မထွက်ပါက Play ခလုတ်ကို နှိပ်ပေးပါ။</p>
                         </div>
                       ) : (
                         <p className="text-sm text-[#3F4A3C]/50 font-medium">အောက်ပါ ခလုတ်ကို နှိပ်၍ Quiz ဖြေဆိုနိုင်ပါပြီ.</p>
                       )}
                    </div>
                    <button onClick={() => setShowTranscript(!showTranscript)} className="w-full py-3 mt-4 bg-[#F4EBDD]/40 hover:bg-[#F4EBDD] text-[#5F8B7E] font-extrabold rounded-xl border border-[#5F8B7E]/20 transition-all flex items-center justify-center gap-2">
                      {showTranscript ? "🙈 စာသားကို ဖျောက်ရန် (Hide Transcript)" : "👁️ စာသားနှင့် ဘာသာပြန်ကို ကြည့်ရန် (View Transcript)"}
                    </button>
                    {showTranscript && (
                        <div className="space-y-5 mt-4">
                          {listeningData.map((turn, idx) => {
                            const isPlaying = idx === playingIndex;
                            const isMale = turn.speaker === "Male";
                            return (
                              <div key={idx} className={`flex ${isMale ? 'justify-start' : 'justify-end'} gap-3 w-full`}>
                                {isMale && <div className="w-8 h-8 rounded-full bg-[#5F8B7E] flex items-center justify-center text-white text-xs mt-1 shadow-sm">M</div>}
                                <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm border transition-all ${isPlaying ? 'ring-2 ring-[#5F8B7E] bg-white scale-[1.02]' : 'bg-[#FFFDF8] border-[#F4EBDD]'}`}>
                                   <p className={`font-bold text-[15px] ${isPlaying ? 'text-[#3F4A3C]' : 'text-[#3F4A3C]/70'}`}>{turn.english_text}</p>
                                   <div className="w-full h-[1px] bg-[#F4EBDD] my-2"></div>
                                   <p className="text-[13px] font-medium text-[#C9785C] leading-relaxed">{turn.myanmar_translation}</p>
                                </div>
                                {!isMale && <div className="w-8 h-8 rounded-full bg-[#8A8F4D] flex items-center justify-center text-white text-xs mt-1 shadow-sm">F</div>}
                              </div>
                            )
                          })}
                        </div>
                    )}
                    {playingIndex === -1 && (
                        <button onClick={handleReadyForQuiz} className="w-full mt-4 bg-[#5F8B7E] text-white py-3.5 rounded-xl font-extrabold text-sm hover:bg-[#4a6d62] hover:shadow-md transition-all active:scale-[0.98]">
                          ✅ နားထောင်ပြီးပါပြီ (Ready for Quiz)
                        </button>
                    )}
                  </div>
                )}
              </div>
              {listeningData && !isListeningLoading && (
                <div className="p-4 border-t border-[#F4EBDD] bg-white text-center">
                  <button onClick={() => { setListeningData(null); setPlayingIndex(-1); setShowTranscript(false); }} className="text-xs font-bold text-[#3F4A3C]/50 hover:text-[#C9785C] transition-colors underline">Choose Another Topic</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewImage(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 cursor-pointer">
            <motion.img initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }} src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}/>
            <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"><CloseIcon /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {isMobile && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-[#3F4A3C]/30 backdrop-blur-sm z-40" />}
            <motion.aside initial={{ x: -320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -320, opacity: 0 }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }} className={`fixed lg:relative flex flex-col w-[300px] h-full bg-[#FFFDF8] border-r border-[#F4EBDD] z-50 flex-shrink-0 shadow-2xl lg:shadow-none`}>
              <div className="p-4 flex flex-col gap-4 border-b border-[#F4EBDD]">
                <div className="flex items-center justify-between">
                  <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-[#3F4A3C]/50 hover:text-[#5F8B7E] font-bold text-xs bg-[#F4EBDD]/50 px-3 py-1.5 rounded-lg transition-colors">← Dashboard</button>
                  {isMobile && <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 bg-[#F4EBDD] rounded-full text-[#3F4A3C]/50"><CloseIcon /></button>}
                </div>
                <button onClick={handleNewChat} className="w-full flex items-center justify-between px-5 py-4 bg-[#5F8B7E] rounded-2xl shadow-[0_8px_20px_rgb(95,139,126,0.2)] text-[#FFFDF8] font-extrabold text-sm hover:bg-[#4a6d62] transition-all group">
                  Start New Chat <span className="bg-white/20 p-1 rounded-md group-hover:rotate-90 transition-transform"><PlusIcon /></span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 scrollbar-hide">
                <div>
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#3F4A3C]/40 uppercase tracking-widest mb-2 px-1"><FolderIcon /> History</div>
                  {sessions.map(session => (
                    <div key={session.id} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all mb-1 group ${currentSessionId === session.id ? 'bg-[#5F8B7E]/10 text-[#5F8B7E] border border-[#5F8B7E]/20' : 'text-[#3F4A3C]/70 hover:bg-[#F4EBDD]'}`}>
                      <button onClick={() => { setCurrentSessionId(session.id); if (session.messages.length === 0) fetchHistory(session.id, localStorage.getItem('token')!); if (isMobile) setIsSidebarOpen(false); }} className="flex-1 text-left text-sm font-bold truncate pr-2">{session.title}</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"><TrashIcon /></button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-white shadow-[-10px_0_30px_rgb(0,0,0,0.02)]">
        <header className="h-[70px] flex-shrink-0 flex items-center justify-between px-4 lg:px-6 border-b border-[#F4EBDD] bg-[#FFFDF8]/90 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 text-[#3F4A3C]/70 hover:bg-[#F4EBDD] rounded-full mr-1 transition-colors border border-[#F4EBDD]"><MenuIcon /></button>}
            <div className="hidden sm:flex items-center gap-2">
              <select value={studyMode} onChange={e => setStudyMode(e.target.value)} className="bg-[#FFFDF8] border border-[#F4EBDD] text-[#3F4A3C] text-xs font-extrabold rounded-xl px-3 py-2 outline-none hover:border-[#5F8B7E]/50 transition-colors shadow-sm cursor-pointer appearance-none">
                <option>Explain Simply</option><option>Exam Mode</option><option>Quiz Mode</option><option>Step-by-Step Solving</option>
              </select>
              <select value={tutorPersona} onChange={e => setTutorPersonality(e.target.value)} className="bg-[#5F8B7E]/10 border border-[#5F8B7E]/20 text-[#5F8B7E] text-xs font-extrabold rounded-xl px-3 py-2 outline-none hover:border-[#5F8B7E]/50 transition-colors shadow-sm cursor-pointer appearance-none">
                <option>Friendly Teacher</option><option>Strict Examiner</option><option>Motivational Coach</option>
              </select>
            </div>
            <span className="sm:hidden font-extrabold text-[#3F4A3C] text-sm">{currentSession?.title}</span>
          </div>
          <div className="flex items-center gap-3">
            {taskId && <button onClick={completeTaskAndReturn} className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#5F8B7E] hover:bg-[#4a6d62] text-white rounded-lg text-xs font-extrabold transition-all shadow-md active:scale-[0.98]">✅ ပြီးမြောက်ပါပြီ (Return)</button>}
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F4EBDD]/50 rounded-lg text-[10px] font-extrabold text-[#8A8F4D] uppercase tracking-widest"><SparkleIcon /> Model: AI Mentor</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-6 md:px-8 relative bg-[#FFFDF8]/30">
          <div className="max-w-4xl mx-auto space-y-8 pb-4">
            <AnimatePresence initial={false}>
              {currentMessages.map((msg) => {
                if (msg.sender === 'system') {
                  return (
                    <div key={msg.id} className="text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${msg.isError ? 'bg-red-50 text-red-500' : 'bg-[#F4EBDD]/50 text-[#8A8F4D]'}`}>{msg.text}</span>
                    </div>
                  );
                }
                
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 md:gap-4 group ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="flex-shrink-0 mt-1">
                      {msg.sender === 'ai' ? (
                        <div className="w-10 h-10 bg-[#5F8B7E] rounded-full flex items-center justify-center text-[#FFFDF8] shadow-sm"><SparkleIcon /></div>
                      ) : (
                        <div className="w-10 h-10 bg-white border border-[#F4EBDD] rounded-full flex items-center justify-center shadow-sm text-lg">{activeUser.avatar || '🧑‍🎓'}</div>
                      )}
                    </div>
                    <div className={`max-w-[85%] md:max-w-[80%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} w-full`}>
                      <div className={`flex items-center gap-3 mb-1.5 px-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[11px] font-extrabold text-[#3F4A3C]/50">{msg.sender === 'ai' ? (msg.persona || tutorPersona) : (activeUser.fullName || activeUser.name || 'Student')}</span>
                        <span className="text-[10px] font-bold text-[#3F4A3C]/30">{msg.timestamp}</span>
                      </div>
                      <div className={`flex flex-col gap-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'} w-full`}>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className={`flex flex-wrap gap-2 mb-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                            {msg.attachments.map(att => (
                              att.type === 'image' && att.base64 ? (
                                <img 
                                  key={att.id} 
                                  src={`data:image/jpeg;base64,${att.base64}`} 
                                  alt={att.name} 
                                  onClick={() => setPreviewImage(`data:image/jpeg;base64,${att.base64}`)} 
                                  className={`rounded-xl object-cover shadow-sm border border-white/20 cursor-pointer hover:opacity-90 transition-opacity ${msg.attachments && msg.attachments.length > 1 ? 'w-24 h-24' : 'max-w-full h-auto max-h-[300px]'}`} 
                                />
                              ) : (
                                <div key={att.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#F4EBDD] shadow-sm w-fit">
                                  <span className="text-[#5F8B7E]"><MenuIcon /></span>
                                  <span className="text-xs font-bold text-[#3F4A3C] truncate max-w-[100px]">{att.name}</span>
                                </div>
                              )
                            ))}
                          </div>
                        )}
                        <div className={`px-5 py-4 text-[15px] md:text-base font-medium leading-relaxed tracking-tight overflow-hidden ${msg.sender === 'user' ? 'bg-[#F4EBDD] text-[#3F4A3C] rounded-[2rem] rounded-tr-sm' : 'bg-white text-[#3F4A3C] rounded-[2rem] rounded-tl-sm shadow-sm border border-[#F4EBDD] w-full'}`}>
                          <div className="break-words w-full">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, errorColor: '#3F4A3C' }]]} components={renderMarkdownComponents}>
                              {processChatText(msg.text)}
                            </ReactMarkdown>
                          </div>
                          
                          {msg.svgCode && (
                            <div className="mt-5 mb-2 bg-[#FFFDF8] border-2 border-[#5F8B7E]/20 rounded-2xl p-6 shadow-inner flex flex-col items-center">
                                <span className="text-xs font-extrabold text-[#5F8B7E] bg-[#5F8B7E]/10 px-3 py-1 rounded-full mb-4 uppercase tracking-widest">AI Structural Blueprint</span>
                                <div dangerouslySetInnerHTML={{ __html: msg.svgCode }} className="w-full max-w-sm h-auto text-[#3F4A3C] opacity-90 transition-all hover:opacity-100"/>
                                <p className="text-[11px] font-bold text-[#3F4A3C]/40 mt-4 text-center">အထက်ပါပုံကြမ်းသည် အချိုးအစားနှင့် မျဉ်းကြောင်းများဆွဲရန် လမ်းညွှန်ချက် (Blueprint) ဖြစ်ပါသည်။</p>
                            </div>
                          )}
                          {msg.isTutorQuizReady && msg.tutorQuizId && (
                            <div className="mt-5"><button onClick={handleStartEnglishQuiz} className="w-full py-3.5 bg-[#5F8B7E] text-white rounded-xl font-extrabold text-sm hover:bg-[#4a6d62] transition-all flex items-center justify-center gap-2 shadow-md"><QuizIcon /> Start Quiz</button></div>
                          )}
                          {msg.breakdownData && (
                            <div className="mt-5 bg-[#FFFDF8] border border-[#F4EBDD] rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
                               <div className="bg-white rounded-xl p-5 text-center overflow-x-auto border border-[#F4EBDD] shadow-inner mb-4"><div className="text-2xl md:text-3xl font-extrabold text-[#3F4A3C]"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, errorColor: '#3F4A3C' }]]}>{processChatText(msg.breakdownData.formula_latex)}</ReactMarkdown></div></div>
                               <div>
                                 <h4 className="font-extrabold text-[#5F8B7E] mb-3 border-b border-[#F4EBDD] pb-2 flex items-center gap-2"><span className="bg-[#5F8B7E] text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">A</span> တန်ဖိုးတစ်ခုချင်းစီ၏ အဓိပ္ပာယ်</h4>
                                 <ul className="space-y-2.5">{msg.breakdownData.section_a_variables.map((v, i) => ( 
                                     <li key={i} className="text-sm bg-white p-3 rounded-xl border border-[#F4EBDD]/60 flex flex-wrap items-center gap-2">
                                       <div className="font-extrabold text-lg"><span className="inline-block"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, errorColor: '#3F4A3C' }]]}>{processChatText(v.symbol)}</ReactMarkdown></span></div>
                                       <span className="text-[#3F4A3C]/40 font-bold">=</span><span className="font-bold text-[#3F4A3C]">{v.meaning}</span>
                                       {v.unit && <span className="ml-auto text-xs font-black bg-[#F4EBDD] text-[#C9785C] px-2 py-1 rounded-md tracking-wider">{v.unit}</span>}
                                     </li> 
                                   ))}</ul>
                               </div>
                               <div><h4 className="font-extrabold text-[#5F8B7E] mb-3 border-b border-[#F4EBDD] pb-2 flex items-center gap-2"><span className="bg-[#5F8B7E] text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">B</span> အခြေခံသဘောတရား</h4><p className="text-[15px] leading-relaxed font-semibold text-[#3F4A3C]/90 bg-white p-4 rounded-xl border border-[#F4EBDD]/60">{msg.breakdownData.section_b_concept}</p></div>
                               <div><h4 className="font-extrabold text-[#5F8B7E] mb-3 border-b border-[#F4EBDD] pb-2 flex items-center gap-2"><span className="bg-[#5F8B7E] text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">C</span> တွက်ချက်မှု နမူနာ</h4><div className="text-[15px] leading-relaxed font-semibold text-[#3F4A3C]/90 bg-[#5F8B7E]/5 p-5 rounded-xl border border-[#5F8B7E]/20"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, errorColor: '#3F4A3C' }]]}>{processChatText(msg.breakdownData.section_c_example)}</ReactMarkdown></div></div>
                            </div>
                          )}
                          {msg.gradingData && (
                            <div className="mt-5 overflow-hidden bg-[#FFFDF8] border-2 border-[#F4EBDD] rounded-3xl shadow-[0_10px_40px_rgb(95,139,126,0.08)] flex flex-col">
                               <div className="bg-gradient-to-br from-[#5F8B7E] to-[#4a6d62] p-6 text-white text-center relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                                  <h4 className="text-white/80 text-xs font-black uppercase tracking-widest mb-1 relative z-10">
                                    {(msg.gradingData.subject.toLowerCase().includes('english') && (msg.text.toLowerCase().includes('letter') || msg.gradingData.feedback_summary?.toLowerCase().includes('letter'))) ? 'English (Letter)' : msg.gradingData.subject}
                                  </h4>
                                  <div className="flex items-end justify-center gap-1 mt-2 relative z-10"><span className="text-5xl font-black">{msg.gradingData.score}</span><span className="text-xl font-bold text-white/60 mb-1">/{msg.gradingData.total_score}</span></div>
                                  <p className="text-sm font-bold mt-2 text-white/90 relative z-10">{msg.gradingData.score >= (msg.gradingData.total_score * 0.8) ? '🎉 အရမ်းတော်တယ်! ဆက်ကြိုးစားပါ' : '💪 လိုအပ်တာလေးတွေ ပြင်လိုက်ရင် အကောင်းဆုံးဖြစ်သွားမယ်'}</p>
                               </div>
                               <div className="p-5 md:p-6 space-y-5">
                                 <div className="bg-white p-4 rounded-2xl border border-[#F4EBDD] shadow-sm"><div className="text-[14px] font-semibold text-[#3F4A3C]/80 leading-relaxed"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, errorColor: '#3F4A3C' }]]} components={renderMarkdownComponents}>{processChatText(msg.gradingData.feedback_summary)}</ReactMarkdown></div></div>
                                 {msg.gradingData.corrections && msg.gradingData.corrections.length > 0 && (
                                   <div><h5 className="text-sm font-extrabold text-[#8A8F4D] flex items-center gap-2 mb-3"><SparkleIcon /> အမှားပြင်ဆင်ချက်များ</h5>
                                     <div className="space-y-3">{msg.gradingData.corrections.map((corr, idx) => (
                                         <div key={idx} className="bg-white border border-[#F4EBDD] rounded-2xl overflow-hidden shadow-sm text-sm">
                                            <div className="bg-red-50/50 p-3 border-b border-[#F4EBDD] flex gap-3 items-start"><span className="text-[#C9785C] font-bold mt-0.5">❌</span><div className="text-[#3F4A3C]/70 font-medium overflow-x-auto scrollbar-hide w-full"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, errorColor: '#3F4A3C' }]]} components={renderMarkdownComponents}>{processChatText(corr.mistake)}</ReactMarkdown></div></div>
                                            <div className="bg-green-50/50 p-3 border-b border-[#F4EBDD] flex gap-3 items-start"><span className="text-[#5F8B7E] font-bold mt-0.5">✅</span><div className="text-[#3F4A3C] font-bold overflow-x-auto scrollbar-hide w-full"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, errorColor: '#3F4A3C' }]]} components={renderMarkdownComponents}>{processChatText(corr.correction)}</ReactMarkdown></div></div>
                                            <div className="p-3 bg-white flex gap-3 items-start"><span className="text-[#8A8F4D] font-bold mt-0.5">💡</span><div className="text-[#3F4A3C]/80 font-medium text-[13px] leading-relaxed overflow-x-auto scrollbar-hide w-full"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, errorColor: '#3F4A3C' }]]} components={renderMarkdownComponents}>{processChatText(corr.reason)}</ReactMarkdown></div></div>
                                         </div>
                                       ))}</div>
                                   </div>
                                 )}
                                 {msg.gradingData.advice && (
                                   <div className="bg-[#F4EBDD]/40 border border-[#F4EBDD] p-4 rounded-2xl flex items-start gap-3"><span className="text-xl">👩‍🏫</span><div className="w-full"><h6 className="text-[#8A8F4D] font-extrabold text-xs uppercase tracking-widest mb-1">Teacher's Advice</h6><div className="text-[14px] font-semibold text-[#3F4A3C]/80 leading-relaxed overflow-x-auto scrollbar-hide"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, errorColor: '#3F4A3C' }]]} components={renderMarkdownComponents}>{processChatText(msg.gradingData.advice)}</ReactMarkdown></div></div></div>
                                 )}
                               </div>
                            </div>
                          )}
                          {msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="mt-5 flex flex-col gap-2.5">
                              {msg.suggestions.map((suggestion, idx) => {
                                let btnClass = 'bg-[#F4EBDD]/40 hover:bg-[#F4EBDD] text-[#5F8B7E] border-[#5F8B7E]/20';
                                if (suggestion.includes('✅ Check Work')) btnClass = 'bg-[#F4EBDD] hover:bg-[#e6d8c4] text-[#C9785C] border-[#C9785C]/30';
                                else if (suggestion.includes('ပြီးမြောက်ပါပြီ')) btnClass = 'bg-[#5F8B7E] hover:bg-[#4a6d62] text-white border-[#5F8B7E] shadow-sm';
                                else if (suggestion.includes('ဉာဏ်စမ်း')) btnClass = 'bg-[#8A8F4D]/10 hover:bg-[#8A8F4D]/20 text-[#8A8F4D] border-[#8A8F4D]/30';
                                else if (suggestion.includes('Flashcard') || suggestion.includes('Vault')) btnClass = 'bg-[#3F4A3C] hover:bg-[#2c342a] text-[#F4EBDD] border-[#3F4A3C]';
                                return (
                                  <button key={idx} onClick={() => handleSend(suggestion)} className={`text-left font-extrabold px-5 py-3 rounded-xl border transition-all active:scale-[0.98] ${btnClass}`}>
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, errorColor: '#3F4A3C' }]]}>{suggestion}</ReactMarkdown>
                                  </button> 
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {msg.sender === 'ai' ? ( 
                          <> 
                            <button onClick={() => handleMessageAction('copy', msg.id)} className="p-1.5 text-[#3F4A3C]/40 hover:text-[#5F8B7E] hover:bg-[#F4EBDD] rounded-lg transition-colors"><CopyIcon /></button> 
                            <button onClick={() => handleMessageAction('regenerate', msg.id)} className="p-1.5 text-[#3F4A3C]/40 hover:text-[#5F8B7E] hover:bg-[#F4EBDD] rounded-lg transition-colors" title="Regenerate"><RefreshIcon /></button> 
                            <div className="w-[1px] h-4 bg-[#F4EBDD] mx-1"></div> 
                            <button className="p-1.5 text-[#3F4A3C]/40 hover:text-[#5F8B7E] hover:bg-[#F4EBDD] rounded-lg transition-colors"><LikeIcon /></button> 
                          </> 
                        ) : ( 
                          <button onClick={() => handleMessageAction('delete', msg.id)} className="p-1.5 text-[#3F4A3C]/40 hover:text-[#C9785C] hover:bg-red-50 rounded-lg transition-colors"><TrashIcon /></button> 
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="w-10 h-10 bg-[#5F8B7E] rounded-full flex items-center justify-center text-[#FFFDF8] shadow-sm mt-1"><SparkleIcon /></div>
                <div>
                  <span className="text-[11px] font-extrabold text-[#3F4A3C]/40 mb-1.5 px-1 block">{tutorPersona} is analyzing...</span>
                  <div className="bg-white px-5 py-4 rounded-[2rem] rounded-tl-sm border border-[#F4EBDD] shadow-sm flex items-center gap-1.5 w-max">
                    <span className="w-2.5 h-2.5 bg-[#5F8B7E] rounded-full animate-bounce"></span>
                    <span className="w-2.5 h-2.5 bg-[#8A8F4D] rounded-full animate-bounce delay-75"></span>
                    <span className="w-2.5 h-2.5 bg-[#C9785C] rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        <div className="w-full flex-shrink-0 bg-gradient-to-t from-[#FFFDF8] via-[#FFFDF8] to-transparent pt-2 pb-6 px-4 md:px-8 z-10">
          <div className="max-w-4xl mx-auto">
            {isEssayPracticeMode ? (
              <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(63,74,60,0.08)] border-2 border-[#5F8B7E]/30 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-[#5F8B7E] text-lg">📝 {getWritingDisplayType()} Writing: <span className="text-[#3F4A3C]">{essayTopic}</span></h3>
                  <button onClick={() => setIsEssayPracticeMode(false)} className="p-2 text-[#3F4A3C]/50 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><CloseIcon /></button>
                </div>
                <textarea value={essayText} onChange={(e) => setEssayText(e.target.value)} placeholder="သင့်အဖြေကို ဒီမှာ ရိုက်ထည့်ပါ..." className="w-full h-48 bg-[#FFFDF8] border border-[#F4EBDD] rounded-xl p-4 outline-none resize-none font-semibold text-[#3F4A3C]" />
                
                {essayImagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2 mb-2 p-2 bg-[#F4EBDD]/30 rounded-xl border border-[#F4EBDD]">
                    {essayImagePreviews.map((src, idx) => (
                      <div key={idx} className="relative w-20 h-20 border border-[#F4EBDD] rounded-xl overflow-hidden shadow-sm">
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                        <button onClick={() => removeEssayImage(idx)} className="absolute top-1 right-1 bg-white/80 hover:bg-red-500 hover:text-white text-red-500 rounded-full p-1 shadow-md transition-colors">
                          <CloseIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-[#F4EBDD]/50 hover:bg-[#F4EBDD] text-[#5F8B7E] font-extrabold text-sm rounded-xl transition-colors border border-[#F4EBDD]">
                      <AttachIcon /> Upload Image ({essayImages.length}/5)
                    </button>
                    <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setIsEssayPracticeMode(false); setEssayText(""); setEssayImages([]); setEssayImagePreviews([]); }} className="px-5 py-2.5 bg-[#F4EBDD] text-[#3F4A3C] font-extrabold text-sm rounded-xl">Cancel</button>
                    <button onClick={handleEssaySubmit} disabled={(!essayText.trim() && essayImages.length === 0) || isTyping} className="px-6 py-2.5 bg-[#5F8B7E] text-white font-extrabold text-sm rounded-xl disabled:opacity-30 flex items-center gap-2">
                      <SendIcon /> {currentFeatureType === 'check_work_submit' ? 'Check Work' : 'Submit'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
                  {[
                    '📝 Summarize Topic',  
                     
                    '🧠 ဉာဏ်စမ်း (Quiz) ဖြေမည်', 
                    '🇬🇧 English Practice', 
                    '🎧 English Listening', 
                    '💡 Formula Breakdown', 
                    '✅ Check Work', 
                     '🎨 Diagram Guide', 
                    '[Myanmar]',
                    ...(activeUser?.grade === 'Grade 12' || activeUser?.grade?.includes('12') ? ['🎓 Grade 12 Old Qs'] : [])
                  ].filter(chip => {
                    const actParamLower = actionParam?.toLowerCase() || '';
                    const isEveningTask = actParamLower.includes('evening') || actParamLower.includes('quiz') || actParamLower.includes('စစ်ဆေး') || actParamLower.includes('review');
                    
                    if (chip === photoUploadBtnText) {
                        if (!isCalculationTask || !isEveningTask) return false;
                    }
                    if (chip === '🧠 ဉာဏ်စမ်း (Quiz) ဖြေမည်') {
                        if (isCalculationTask || !isEveningTask) return false; 
                    }
                    if (chip === '🗂️ မှတ်စုကတ် (Flashcards) ပြုလုပ်မည်') {
                        if (isCalculationTask) return false; 
                    }
                    return true;
                  }).map(chip => ( 
                    <button key={chip} onClick={() => handleSend(chip)} className={`flex-shrink-0 px-4 py-2 bg-white border border-[#F4EBDD] rounded-full text-xs font-extrabold transition-all shadow-sm ${
                      chip === photoUploadBtnText ? 'text-[#C9785C] border-[#C9785C]/30 hover:bg-[#C9785C]/10' 
                      : chip === '🗂️ မှတ်စုကတ် (Flashcards) ပြုလုပ်မည်' ? 'bg-[#3F4A3C] text-[#F4EBDD] hover:bg-[#2c342a] border-[#3F4A3C]' 
                      : chip === '🧠 ဉာဏ်စမ်း (Quiz) ဖြေမည်' ? 'text-[#8A8F4D] border-[#8A8F4D]/30 hover:bg-[#8A8F4D]/10' 
                      : 'text-[#3F4A3C]/70 hover:text-[#5F8B7E] hover:border-[#5F8B7E]/30'
                    }`}>{chip}</button> 
                  ))}
                </div>
                <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(63,74,60,0.06)] border border-[#F4EBDD] flex flex-col focus-within:border-[#5F8B7E]/50 transition-all">
                  
                  {/* 🚨 CHECK WORK MULTI-IMAGE PREVIEW UI (Up to 5 images) 🚨 */}
                  {pendingAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-4 pt-4 pb-1">
                      {pendingAttachments.map(att => ( 
                        <div key={att.id} className="relative w-20 h-20 border border-[#F4EBDD] rounded-xl overflow-hidden shadow-sm bg-slate-50 flex items-center justify-center">
                          {att.type === 'image' && att.base64 ? (
                            <img src={`data:image/jpeg;base64,${att.base64}`} alt={att.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-[#3F4A3C] p-2 truncate">{att.name}</span>
                          )}
                          <button onClick={() => removeAttachment(att.id)} className="absolute top-1 right-1 bg-white/80 hover:bg-red-500 hover:text-white text-red-500 rounded-full p-1 shadow-md transition-colors">
                            <CloseIcon />
                          </button>
                        </div> 
                      ))}
                    </div>
                  )}

                  <textarea ref={textareaRef} rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Message AI Mentor, paste a formula, or upload up to 5 worksheets..." className="w-full bg-transparent px-6 pt-4 pb-2 outline-none resize-none font-semibold text-[#3F4A3C] placeholder:text-[#3F4A3C]/30 scrollbar-hide text-[15px] leading-relaxed" style={{ minHeight: pendingAttachments.length > 0 ? '40px' : '60px', maxHeight: '200px' }} />
                  <div className="flex items-center justify-between px-4 pb-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-[#3F4A3C]/40 hover:text-[#5F8B7E] hover:bg-[#F4EBDD]/50 rounded-full transition-colors flex items-center gap-1.5 text-xs font-bold">
                        <AttachIcon /> {pendingAttachments.length > 0 ? `(${pendingAttachments.length}/5)` : ''}
                      </button>
                      <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </div>
                    <button onClick={() => handleSend()} disabled={(!input.trim() && pendingAttachments.length === 0) || isTyping} className="p-3 bg-[#5F8B7E] text-white rounded-full hover:bg-[#4a6d62] transition-colors disabled:opacity-30 disabled:bg-[#3F4A3C]/20 shadow-md"><SendIcon /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
