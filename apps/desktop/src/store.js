import { create } from "zustand";

export const useOverlayStore = create((set) => ({
  overlayVisible: false,
  overlayState: "Idle",
  plan: null,
  approvalId: null,
  setOverlayVisible: (overlayVisible) => set({ overlayVisible }),
  setOverlayState: (overlayState) => set({ overlayState }),
  setPlan: (plan) => set({ plan }),
  setApprovalId: (approvalId) => set({ approvalId })
}));
