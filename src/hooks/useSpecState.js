'use client';

import { create } from 'zustand';

export const useSpecState = create((set) => ({
  spec: null,
  version: null,
  schemaVersion: null,
  isSwagger: false,
  isValid: false,
  errors: [],
  selectedView: null,
  selectedItem: null,

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
      selectedView: null,
      selectedItem: null
    }),

  setSelectedView: (view) => set({ selectedView: view, selectedItem: null }),
  setSelectedItem: (item) => set({ selectedItem: item }),
}));
