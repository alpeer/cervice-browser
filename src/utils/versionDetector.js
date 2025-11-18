/**
 * Get all available OpenAPI/Swagger schema versions
 * Dynamically scans the validators directory for available schemas
 * @returns {string[]} Array of supported versions (e.g., ['2.0', '3.0.3', '3.1.0', '3.2.0'])
 */
import fs from "fs"
import path from "path"

const versions = fs
  .readdirSync(path.join(process.cwd(), "src/lib/validators"))
  .map(i => {
    const match = i.match(/\d+\.(\d+\.)?\d+/)
    return match ? match[0] : null
  })
  .filter(Boolean) // Remove null values

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
 * Detect and validate OpenAPI/Swagger version from spec
 * @param {Object} spec - Parsed OpenAPI/Swagger specification
 * @returns {Promise<{version: string, schemaVersion: string, isSwagger: boolean}>}
 * @throws {Error} If version is unsupported or invalid
 */
export async function detectVersion(spec) {
  let specVersion;
  let isSwagger = false;

  // Check for Swagger 2.0
  if (spec.swagger) {
    specVersion = spec.swagger;
    isSwagger = true;

    // Validate Swagger version format (2.0)
    if (specVersion !== '2.0') {
      throw new Error(`Unsupported Swagger version: ${specVersion}. Only Swagger 2.0 is supported.`);
    }
  }
  // Check for OpenAPI 3.x
  else if (spec.openapi) {
    specVersion = spec.openapi;

    // Validate OpenAPI version format (3.x.x)
    if (!/^\d+\.\d+\.\d+$/.test(specVersion)) {
      throw new Error(`Invalid OpenAPI version format: ${specVersion}`);
    }
  }
  else {
    throw new Error('Invalid specification: missing "openapi" or "swagger" field');
  }

  if (versions.length === 0) {
    throw new Error('No schema validators found')
  }

  const schemaVersion = findBestMatch(specVersion)

  if (!schemaVersion) {
    throw new Error(
      `Unsupported version: ${specVersion}. ` +
      `Available versions: ${versions.join(', ')}`
    );
  }

  return {
    version: specVersion,      // Original version from spec
    schemaVersion,             // Schema version to use for validation
    isSwagger,                 // Whether this is Swagger 2.0
  };
}

/**
 * Get version info without throwing errors (for UI display)
 * @param {Object} spec - Parsed OpenAPI/Swagger specification
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
      version: spec?.openapi || spec?.swagger || 'unknown',
      schemaVersion: null,
      isSupported: false,
      isSwagger: !!spec?.swagger,
      error: error.message,
      availableVersions: versions,
    }
  }
}
