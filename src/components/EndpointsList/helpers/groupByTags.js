/**
 * Group API endpoints by tags
 * @param {Object} paths - OpenAPI paths object
 * @returns {Object} Grouped endpoints by tag
 */
export function groupByTags(paths) {
  const grouped = {};

  Object.entries(paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, config]) => {
      // Skip non-HTTP methods (like parameters, servers, etc.)
      const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];
      if (!httpMethods.includes(method.toLowerCase())) return;

      const tags = config.tags || ['default'];

      tags.forEach(tag => {
        if (!grouped[tag]) grouped[tag] = [];

        grouped[tag].push({
          path,
          method: method.toUpperCase(),
          summary: config.summary,
          description: config.description,
          operationId: config.operationId,
          deprecated: config.deprecated || false,
        });
      });
    });
  });

  return grouped;
}

/**
 * Get method color class
 * @param {string} method - HTTP method
 * @returns {string} CSS class name
 */
export function getMethodColor(method) {
  const colors = {
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    DELETE: 'delete',
    PATCH: 'patch',
    OPTIONS: 'options',
    HEAD: 'head',
  };
  return colors[method] || 'default';
}
