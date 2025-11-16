import { parseYAML } from './yamlParser';

/**
 * Detect if content is JSON or YAML
 * @param {string} content - File content
 * @returns {string} 'json' or 'yaml'
 */
export function detectFormat(content) {
  const trimmed = content.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[') ? 'json' : 'yaml';
}

/**
 * Parse OpenAPI spec from string (JSON or YAML)
 * @param {string} content - Spec content
 * @returns {Object} Parsed spec object
 */
export function parseSpec(content) {
  const format = detectFormat(content);

  try {
    if (format === 'json') {
      return JSON.parse(content);
    } else {
      return parseYAML(content);
    }
  } catch (error) {
    throw new Error(`Failed to parse ${format.toUpperCase()}: ${error.message}`);
  }
}

/**
 * Read and parse spec from File object
 * @param {File} file - File object from input
 * @returns {Promise<Object>} Parsed spec
 */
export async function parseSpecFile(file) {
  const content = await file.text();
  return parseSpec(content);
}
