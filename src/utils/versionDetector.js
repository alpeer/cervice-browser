/**
 * Get all available OpenAPI schema versions
 * @returns {Promise<string[]>} Array of supported versions (e.g., ['3.0.3', '3.1.0', '3.2.0'])
 */
import fs from "fs"
const versions = fs.readdirSync("./src/lib/validators").map(i => i.match(/\d+\.(\d+\.)?\d+/)[0])
export const getAvailableVersions = () => versions
/**
 * Find the best matching schema version for a given OpenAPI spec version
 * @param {string} specVersion - Version from spec.openapi (e.g., "3.1.0", "3.2.1")
 * @returns {string|null} Best matching version or null
 */
export function findBestMatch(specVersion) {
  // Exact match
  if (versions.includes(specVersion)) {
    return specVersion
  }

  // Parse version parts
  const [major, minor] = specVersion.split('.').map(Number)

  // Find closest minor version within same major version
  const candidates = versions
    .filter(v => {
      const [vMajor, vMinor] = v.split('.').map(Number)
      return vMajor === major && vMinor <= minor
    })
    .sort((a, b) => b.localeCompare(a)) // Sort descending

  return candidates[0] || null
}

/**
 * Detect and validate OpenAPI version from spec
 * @param {Object} spec - Parsed OpenAPI specification
 * @returns {Promise<{version: string, schemaVersion: string}>}
 * @throws {Error} If version is unsupported or invalid
 */
export async function detectVersion(spec) {
  if (!(spec.openapi || spec.swagger)) {
    throw new Error('Invalid OpenAPI spec: missing "openapi" field')
  }

  const specVersion = spec.openapi || spec.swagger

  // Validate version format
  if (!/^\d+\.\d+/.test(specVersion)) {
    throw new Error(`Invalid OpenAPI version format: ${specVersion}`)
  }

  if (versions.length === 0) {
    throw new Error('No OpenAPI schema validators found')
  }

  const schemaVersion = findBestMatch(specVersion)

  if (!schemaVersion) {
    throw new Error(
      `Unsupported OpenAPI version: ${specVersion}. ` +
      `Available versions: ${versions.join(', ')}`
    )
  }

  return {
    version: specVersion,      // Original version from spec
    schemaVersion,             // Schema version to use for validation
  }
}

/**
 * Get version info without throwing errors (for UI display)
 * @param {Object} spec - Parsed OpenAPI specification
 * @returns {Promise<Object>}
 */
export async function getVersionInfo(spec) {
  try {
    const result = await detectVersion(spec)

    return {
      ...result,
      isSupported: true,
      availableVersions: versions,
    }
  } catch (error) {
    return {
      version: spec?.openapi || 'unknown',
      schemaVersion: null,
      isSupported: false,
      error: error.message,
      availableVersions: versions,
    }
  }
}
