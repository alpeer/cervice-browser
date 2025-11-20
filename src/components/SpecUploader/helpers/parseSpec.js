import { parseSpecFile } from '@/lib/parsers/specParser';

/**
 * Parse uploaded spec file
 * @param {File} file - Uploaded file
 * @returns {Promise<Object>} Parsed spec
 */
export async function parseUploadedSpec(file) {
  if (!file) {
    throw new Error('No file provided');
  }

  const allowedExtensions = ['.json', '.yaml', '.yml'];
  const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];

  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error(
      `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`
    );
  }

  return await parseSpecFile(file);
}
