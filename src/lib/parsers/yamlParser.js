import yaml from 'js-yaml';

/**
 * Parse YAML string to JavaScript object
 * @param {string} yamlString - YAML content
 * @returns {Object} Parsed object
 */
export function parseYAML(yamlString) {
  try {
    return yaml.load(yamlString);
  } catch (error) {
    throw new Error(`YAML parsing failed: ${error.message}`);
  }
}

/**
 * Convert JavaScript object to YAML string
 * @param {Object} obj - JavaScript object
 * @returns {string} YAML string
 */
export function toYAML(obj) {
  try {
    return yaml.dump(obj);
  } catch (error) {
    throw new Error(`YAML serialization failed: ${error.message}`);
  }
}
