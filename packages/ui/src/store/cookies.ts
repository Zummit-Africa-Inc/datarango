import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CookiePreference {
  analytics: boolean;
  essential: boolean;
  functional: boolean;
  marketing: boolean;
}

interface CookiePreferenceState {
  onPreferenceChange: (preference: Partial<CookiePreference>) => void;
  preferences: CookiePreference;
}

const initialPreferences: CookiePreference = {
  analytics: false,
  essential: true,
  functional: false,
  marketing: false,
};

export const useCookiePreferences = create<CookiePreferenceState>()(
  persist(
    (set) => ({
      onPreferenceChange: (preference) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...preference,
            essential: true,
          },
        })),
      preferences: initialPreferences,
    }),
    {
      name: "cookie-preferences",
      partialize: (state) => ({ preferences: state.preferences }),
    },
  ),
);