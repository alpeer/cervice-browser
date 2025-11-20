/**
 * Dynamically load OpenAPI/Swagger JSON schema for validation
 * @param {string} version - Schema version (e.g., "2.0", "3.0.3", "3.1.0")
 * @returns {Promise<Object>} JSON Schema object
 */
export async function loadSchema(version) {
  try {
    let schema;
    // Load Swagger 2.0 schema
    if (version === '2.0') {
      schema = await import(`@/lib/validators/swagger-${version}-schema.json`);
    }
    // Load OpenAPI 3.x schema
    else {
      schema = await import(`@/lib/validators/openapi-${version}-schema.json`);
    }
    return schema.default || schema;
  } catch (error) {
    throw new Error(
      `Failed to load schema for version ${version}: ${error.message}`
    );
  }
}

/**
 * Load all available schemas
 * @returns {Promise<Object>} Map of version to schema
 */
export async function loadAllSchemas() {
  const { getAvailableVersions } = await import('./versionDetector.js');
  const versions = await getAvailableVersions();

  const schemas = {};
  await Promise.all(
    versions.map(async (version) => {
      schemas[version] = await loadSchema(version);
    })
  );

  return schemas;
}

/**
 * Preload schemas for better performance (optional)
 * Call this during app initialization
 */
export async function preloadSchemas() {
  try {
    await loadAllSchemas();
    console.log('✓ OpenAPI schemas preloaded');
  } catch (error) {
    console.error('Failed to preload schemas:', error);
  }
}
