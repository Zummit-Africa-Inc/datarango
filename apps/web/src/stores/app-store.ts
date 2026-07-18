import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  sidebarCollapsed: boolean;
  commandMenuOpen: boolean;
  toggleSidebar: () => void;
  setCommandMenuOpen: (open: boolean) => void;
}

/**
 * Web app-shell UI state (sidebar, command menu). Feature state stays
 * co-located with features per the handoff — only shell chrome lives here.
 *
 * @example const { sidebarCollapsed, toggleSidebar } = useAppStore();
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandMenuOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setCommandMenuOpen: (commandMenuOpen) => set({ commandMenuOpen }),
    }),
    {
      name: "dr.web.shell",
      partialize: ({ sidebarCollapsed }) => ({ sidebarCollapsed }),
    },
  ),
);
