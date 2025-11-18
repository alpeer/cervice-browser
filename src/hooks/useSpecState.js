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
}));
