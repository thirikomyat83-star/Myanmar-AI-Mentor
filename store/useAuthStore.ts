import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 🚨 လော့ဂ်အင် (Email, ID) တွေကို NextAuth က ကိုင်တွယ်သွားပြီဖြစ်၍ 
// ဤနေရာတွင် User ဖြည့်စွက်ထားသော အချက်အလက်များကိုသာ ထားရှိပါမည်။
export interface UserData {
  hasProfile: boolean;
  isOnboarded: boolean;
  fullName?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  grade?: string;
  stream?: string;
  subjects?: string[];
  goal?: string;
}

interface AuthState {
  user: UserData | null;
  
  // Flow Actions (Profile & Onboarding အတွက်သာ)
  updateProfile: (data: Partial<UserData>) => void;
  completeOnboarding: (data: Partial<UserData>) => void;
  clearStore: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // အစပိုင်းတွင် Data အလွတ်ဖြစ်နေမည်
      user: null,

      // Profile Setup ပြီးဆုံးသွားသည့်အခါ သိမ်းမည့် Function
      updateProfile: (data) => set((state) => ({
        user: { 
          ...(state.user || { hasProfile: false, isOnboarded: false }), 
          ...data, 
          hasProfile: true 
        } as UserData
      })),

      // Onboarding ပြီးဆုံးသွားသည့်အခါ သိမ်းမည့် Function
      completeOnboarding: (data) => set((state) => ({
        user: { 
          ...(state.user || { hasProfile: false, isOnboarded: false }), 
          ...data, 
          isOnboarded: true 
        } as UserData
      })),

      // NextAuth ဘက်က Logout လုပ်သည့်အခါ ဒီထဲက Data များကိုပါ ဖျက်ရန်
      clearStore: () => {
        set({ user: null });
      },
    }),
    { 
      name: 'myanmar-ai-mentor-db' // 🚨 Browser ရဲ့ LocalStorage ထဲမှာ အသေမှတ်ထားပေးမည့် နာမည်
    }
  )
);