'use client';

import { create } from 'zustand';

export const useSpecState = create((set) => ({
  spec: null,
  version: null,
  schemaVersion: null,
  isValid: false,
  errors: [],

  setSpec: (spec, version, schemaVersion, isValid, errors = []) =>
    set({ spec, version, schemaVersion, isValid, errors }),

  clearSpec: () =>
    set({
      spec: null,
      version: null,
      schemaVersion: null,
      isValid: false,
      errors: []
    }),
}));
