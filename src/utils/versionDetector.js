/**
 * Get all available OpenAPI schema versions
 * @returns {Promise<string[]>} Array of supported versions (e.g., ['3.0.3', '3.1.0', '3.2.0'])
 */
export async function getAvailableVersions() {
  // For client-side, we know which versions we support
  // In a real implementation, this could be dynamically loaded
  return ['3.0.3', '3.1.0', '3.2.0'].sort((a, b) => b.localeCompare(a));
}

/**
 * Find the best matching schema version for a given OpenAPI spec version
 * @param {string} specVersion - Version from spec.openapi (e.g., "3.1.0", "3.2.1")
 * @param {string[]} availableVersions - Available schema versions
 * @returns {string|null} Best matching version or null
 */
export function findBestMatch(specVersion, availableVersions) {
  // Exact match
  if (availableVersions.includes(specVersion)) {
    return specVersion;
  }

  // Parse version parts
  const [major, minor] = specVersion.split('.').map(Number);

  // Find closest minor version within same major version
  const candidates = availableVersions
    .filter(v => {
      const [vMajor, vMinor] = v.split('.').map(Number);
      return vMajor === major && vMinor <= minor;
    })
    .sort((a, b) => b.localeCompare(a)); // Sort descending

  return candidates[0] || null;
}

/**
 * Detect and validate OpenAPI version from spec
 * @param {Object} spec - Parsed OpenAPI specification
 * @returns {Promise<{version: string, schemaVersion: string}>}
 * @throws {Error} If version is unsupported or invalid
 */
export async function detectVersion(spec) {
  if (!spec.openapi) {
    throw new Error('Invalid OpenAPI spec: missing "openapi" field');
  }

  const specVersion = spec.openapi;

  // Validate version format
  if (!/^\d+\.\d+\.\d+$/.test(specVersion)) {
    throw new Error(`Invalid OpenAPI version format: ${specVersion}`);
  }

  const availableVersions = await getAvailableVersions();

  if (availableVersions.length === 0) {
    throw new Error('No OpenAPI schema validators found');
  }

  const schemaVersion = findBestMatch(specVersion, availableVersions);

  if (!schemaVersion) {
    throw new Error(
      `Unsupported OpenAPI version: ${specVersion}. ` +
      `Available versions: ${availableVersions.join(', ')}`
    );
  }

  return {
    version: specVersion,      // Original version from spec
    schemaVersion,             // Schema version to use for validation
  };
}

/**
 * Get version info without throwing errors (for UI display)
 * @param {Object} spec - Parsed OpenAPI specification
 * @returns {Promise<Object>}
 */
export async function getVersionInfo(spec) {
  try {
    const result = await detectVersion(spec);
    const availableVersions = await getAvailableVersions();

    return {
      ...result,
      isSupported: true,
      availableVersions,
    };
  } catch (error) {
    return {
      version: spec?.openapi || 'unknown',
      schemaVersion: null,
      isSupported: false,
      error: error.message,
      availableVersions: await getAvailableVersions(),
    };
  }
}
