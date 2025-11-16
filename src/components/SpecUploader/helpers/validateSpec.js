/**
 * Validate spec via API
 * @param {Object} spec - Parsed spec object
 * @returns {Promise<Object>} Validation result
 */
export async function validateSpec(spec) {
  const response = await fetch('/api/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ spec }),
  });

  if (!response.ok) {
    throw new Error('Validation request failed');
  }

  return await response.json();
}
