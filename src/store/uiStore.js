import { create } from 'zustand';
import { generateId, generateRandomName } from '../lib/ids.js';
import { getRandomPresenceColor } from '../lib/colors.js';

export const useUIStore = create((set, get) => ({
  // Active tool state
  tool: 'select',
  setTool: (tool) => set({ tool }),

  // Selection list
  selectedIds: [],
  setSelectedIds: (selectedIds) => {
    // If we clear selection, clear editing state too
    const update = { selectedIds };
    if (selectedIds.length === 0) {
      update.editingId = null;
    }
    set(update);
  },

  // Inline element editing state (text / sticky Note id)
  editingId: null,
  setEditingId: (editingId) => set({ editingId }),

  // Viewport transforms (Zoom & Pan)
  zoom: 1.0,
  pan: { x: 0, y: 0 },
  setZoom: (zoom) => {
    // Clamp zoom between 5% (0.05) and 400% (4.0)
    const clamped = Math.max(0.05, Math.min(4.0, zoom));
    set({ zoom: clamped });
  },
  setPan: (pan) => set({ pan }),

  // Visitor profile state
  user: {
    id: generateId(),
    name: generateRandomName(),
    color: getRandomPresenceColor(),
  },
  setUser: (user) => set({ user }),

  // Toast status alert
  toast: null,
  showToast: (message) => {
    const id = generateId();
    set({ toast: { id, message } });
    setTimeout(() => {
      const current = get().toast;
      if (current && current.id === id) {
        set({ toast: null });
      }
    }, 3000);
  },
  clearToast: () => set({ toast: null }),
}));
