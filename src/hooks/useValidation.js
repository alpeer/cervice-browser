'use client';

import { useState } from 'react';

export function useValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const validateSpec = async (spec) => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spec }),
      });

      const result = await response.json();
      setValidationResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        valid: false,
        errors: [{ message: error.message }],
      };
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateSpec,
    isValidating,
    validationResult,
  };
}
