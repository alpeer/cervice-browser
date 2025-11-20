'use client';

import { create } from 'zustand';

export const useSpecState = create((set) => ({
  spec: null,
  version: null,
  schemaVersion: null,
  isSwagger: false,
  isValid: false,
  errors: [],

  // Navigation state
  selectedSection: 'endpoints', // endpoints, objects, webhooks, entities
  selectedTag: null,            // For endpoints: the tag selected
  selectedItem: null,           // The actual item (endpoint, object, webhook)

  // Collapsible states
  openSections: { endpoints: true },

  // Entity state
  entities: {},        // Map of entity name to entity object
  relations: [],       // Array of relation objects
  focusedEntity: null, // Entity name that's being hovered in sidebar

  // Sidebar configuration (programmatic)
  sidebarConfig: {
    primary: {
      items: [], // Array of { id, label, collapsible, active, children: [] }
    },
    secondary: {
      title: null,
      subtitle: null,
      items: [], // Array of { id, label, subtitle, onClick, onHover, selected }
    },
  },

  setSpec: (spec, version, schemaVersion, isSwagger, isValid, errors = []) =>
    set({ spec, version, schemaVersion, isSwagger, isValid, errors }),

  clearSpec: () =>
    set({
      spec: null,
      version: null,
      schemaVersion: null,
      isSwagger: false,
      isValid: false,
      errors: [],
      selectedSection: 'endpoints',
      selectedTag: null,
      selectedItem: null,
      openSections: { endpoints: true },
      sidebarConfig: {
        primary: { items: [] },
        secondary: { title: null, subtitle: null, items: [] },
      },
    }),

  setSelectedSection: (section) =>
    set({ selectedSection: section, selectedTag: null, selectedItem: null }),

  setSelectedTag: (tag) =>
    set({ selectedTag: tag, selectedItem: null }),

  setSelectedItem: (item) =>
    set({ selectedItem: item }),

  toggleSection: (section) =>
    set((state) => ({
      openSections: {
        ...state.openSections,
        [section]: !state.openSections[section],
      },
    })),

  // Entity management
  setEntities: (entities, relations) =>
    set({ entities, relations }),

  clearEntities: () =>
    set({ entities: {}, relations: [], focusedEntity: null }),

  setFocusedEntity: (entityName) =>
    set({ focusedEntity: entityName }),

  // Sidebar configuration management
  setSidebarPrimary: (items) =>
    set((state) => ({
      sidebarConfig: {
        ...state.sidebarConfig,
        primary: { items },
      },
    })),

  setSidebarSecondary: (title, subtitle, items) =>
    set((state) => ({
      sidebarConfig: {
        ...state.sidebarConfig,
        secondary: { title, subtitle, items },
      },
    })),

  clearSidebarSecondary: () =>
    set((state) => ({
      sidebarConfig: {
        ...state.sidebarConfig,
        secondary: { title: null, subtitle: null, items: [] },
      },
    })),

  // Toast notification management
  toasts: [],

  addToast: (message, severity = 'info', duration = 5000) =>
    set((state) => {
      const id = Date.now() + Math.random();
      const toast = { id, message, severity, duration };
      return { toasts: [...state.toasts, toast] };
    }),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  clearToasts: () =>
    set({ toasts: [] }),
}));
