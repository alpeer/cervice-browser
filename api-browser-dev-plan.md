# AI-Friendly Development Plan: OpenAPI Documentation Viewer

## Project Overview

A Next.js 16 application for viewing and managing OpenAPI specifications with support for multiple versions (3.0.3, 3.1.0, 3.2.0+), featuring dynamic validation, database entity abstraction, and a clean Material UI interface.

## Tech Stack

- **Next.js 16** (App Directory)
- **Material UI** (minimal component usage)
- **SCSS** (styling)
- **JavaScript** (NO TypeScript)
- **Zustand** (state management)

## Project Structure

```
/app
  /validate
    v3.2.0.json                   # OpenAPI validation jsonschemas
  layout.js                       # Root layout with MUI theme
  page.js                         # Main application page
  page.scss                       # Main page styles
  globals.scss                    # Global styles

/ui                               # Generic reusable UI components
  /Button
    Button.jsx
    Button.scss
  /Collapsible
    Collapsible.jsx
    Collapsible.scss
  /Input
    Input.jsx
    Input.scss
  /Tabs
    Tabs.jsx
    Tabs.scss

/components                       # Project-specific components
  /Sidebar
    Sidebar.jsx
    Sidebar.scss
  /EndpointsList
    EndpointsList.jsx
    EndpointsList.scss
    /helpers
      groupByTags.js
  /ObjectsList
    ObjectsList.jsx
    ObjectsList.scss
  /WebhooksList
    WebhooksList.jsx
    WebhooksList.scss
  /EntitiesList
    EntitiesList.jsx
    EntitiesList.scss
  /SpecUploader
    SpecUploader.jsx
    SpecUploader.scss
    /helpers
      parseSpec.js
      validateSpec.js

/lib
  /validators                     # OpenAPI JSON schemas
    openapi-3.0.3-schema.json
    openapi-3.1.0-schema.json
    openapi-3.2.0-schema.json
  /adapters
    /database
      AbstractEntity.js           # Base entity class
      TypeORMAdapter.js          # TypeORM implementation
      SequelizeAdapter.js        # Sequelize implementation
  /parsers
    specParser.js                # OpenAPI spec parser
    yamlParser.js                # YAML to JSON converter

/hooks
  useSpecState.js                # Global spec state management
  useValidation.js               # Validation hook

/utils
  versionDetector.js             # OpenAPI version detection
  schemaLoader.js                # Dynamic schema loading
```

---

## Development Phases

### Phase 1: Foundation Setup

**Goal**: Create basic Next.js structure with Material UI integration

#### Files to Create

**1. `app/layout.js`**

```javascript
'use client';

import { Inter } from 'next/font/google';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './globals.scss';

const inter = Inter({ subsets: ['latin'] });

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**2. `app/globals.scss`**

```scss
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  overflow: hidden;
}

code {
  font-family: 'Courier New', monospace;
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}
```

**3. `lib/parsers/yamlParser.js`**

```javascript
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
```

**4. `lib/parsers/specParser.js`**

```javascript
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
```

---

### Phase 2: Validation System

**Goal**: Implement OpenAPI version detection and validation with dynamic schema loading

#### Files to Create

**1. `utils/versionDetector.js`**

```javascript
import { readdir } from 'fs/promises';
import { join } from 'path';

/**
 * Get all available OpenAPI schema versions by scanning the validators directory
 * @returns {Promise<string[]>} Array of supported versions (e.g., ['3.0.3', '3.1.0', '3.2.0'])
 */
export async function getAvailableVersions() {
  try {
    const validatorsDir = join(process.cwd(), 'lib', 'validators');
    const files = await readdir(validatorsDir);
    
    // Extract versions from filenames like "openapi-3.0.3-schema.json"
    const versions = files
      .filter(file => file.startsWith('openapi-') && file.endsWith('-schema.json'))
      .map(file => {
        const match = file.match(/openapi-(.+)-schema\.json$/);
        return match ? match[1] : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)
    
    return versions;
  } catch (error) {
    console.error('Error scanning validators directory:', error);
    return [];
  }
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
    throw new Error('No OpenAPI schema validators found in lib/validators/');
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
```

**2. `utils/schemaLoader.js`**

```javascript
/**
 * Dynamically load OpenAPI JSON schema for validation
 * @param {string} version - Schema version (e.g., "3.0.3", "3.1.0")
 * @returns {Promise<Object>} JSON Schema object
 */
export async function loadSchema(version) {
  try {
    // Dynamic import based on version
    const schema = await import(
      `@/lib/validators/openapi-${version}-schema.json`
    );
    return schema.default;
  } catch (error) {
    throw new Error(
      `Failed to load schema for OpenAPI ${version}: ${error.message}`
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
```

**3. `app/api/validate/route.js`**

```javascript
import Ajv from 'ajv';
import { detectVersion } from '@/utils/versionDetector';
import { loadSchema } from '@/utils/schemaLoader';

const ajv = new Ajv({ allErrors: true });

export async function POST(request) {
  try {
    const { spec } = await request.json();
    
    if (!spec) {
      return Response.json(
        { valid: false, errors: ['No spec provided'] },
        { status: 400 }
      );
    }

    // Detect version and load appropriate schema
    const { version, schemaVersion } = await detectVersion(spec);
    const schema = await loadSchema(schemaVersion);

    // Validate spec against schema
    const validate = ajv.compile(schema);
    const valid = validate(spec);

    if (!valid) {
      return Response.json({
        valid: false,
        version,
        schemaVersion,
        errors: validate.errors.map(err => ({
          path: err.instancePath,
          message: err.message,
          params: err.params,
        })),
      });
    }

    return Response.json({
      valid: true,
      version,
      schemaVersion,
      errors: [],
    });
  } catch (error) {
    return Response.json(
      { valid: false, errors: [error.message] },
      { status: 500 }
    );
  }
}
```

**4. `hooks/useValidation.js`**

```javascript
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
```

**Note**: Download official OpenAPI JSON schemas from:

- <https://github.com/OAI/OpenAPI-Specification/tree/main/schemas>

Place them in `lib/validators/` with naming convention: `openapi-{version}-schema.json`

---

### Phase 3: UI Components Library

**Goal**: Build reusable generic UI components

#### Files to Create

**1. `ui/Collapsible/Collapsible.jsx`**

```javascript
'use client';

import { useState } from 'react';
import { IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import './Collapsible.scss';

export default function Collapsible({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="collapsible">
      <div className="collapsible__header" onClick={() => setIsOpen(!isOpen)}>
        <IconButton 
          size="small" 
          className={`collapsible__icon ${isOpen ? 'collapsible__icon--rotated' : ''}`}
        >
          <ExpandMoreIcon />
        </IconButton>
        <span className="collapsible__title">{title}</span>
      </div>
      {isOpen && <div className="collapsible__content">{children}</div>}
    </div>
  );
}
```

**2. `ui/Collapsible/Collapsible.scss`**

```scss
.collapsible {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 8px;

  &__header {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    user-select: none;
    background-color: #fafafa;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f5f5f5;
    }
  }

  &__icon {
    transition: transform 0.2s;

    &--rotated {
      transform: rotate(180deg);
    }
  }

  &__title {
    margin-left: 8px;
    font-weight: 500;
    font-size: 14px;
  }

  &__content {
    padding: 16px;
    border-top: 1px solid #e0e0e0;
  }
}
```

**3. `ui/Button/Button.jsx`**

```javascript
'use client';

import { Button as MuiButton } from '@mui/material';
import './Button.scss';

export default function Button({ 
  children, 
  variant = 'contained', 
  color = 'primary',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}) {
  return (
    <MuiButton
      variant={variant}
      color={color}
      fullWidth={fullWidth}
      disabled={disabled}
      onClick={onClick}
      type={type}
      className={`custom-button ${className}`}
    >
      {children}
    </MuiButton>
  );
}
```

**4. `ui/Button/Button.scss`**

```scss
.custom-button {
  text-transform: none !important;
  font-weight: 500;
  padding: 8px 24px;
  border-radius: 4px;
}
```

**5. `ui/Input/Input.jsx`**

```javascript
'use client';

import { TextField } from '@mui/material';
import './Input.scss';

export default function Input({
  label,
  value,
  onChange,
  placeholder,
  error = false,
  helperText,
  multiline = false,
  rows = 1,
  fullWidth = true,
  type = 'text',
}) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      error={error}
      helperText={helperText}
      multiline={multiline}
      rows={rows}
      fullWidth={fullWidth}
      type={type}
      className="custom-input"
      variant="outlined"
    />
  );
}
```

**6. `ui/Input/Input.scss`**

```scss
.custom-input {
  margin-bottom: 16px;
}
```

**7. `ui/Tabs/Tabs.jsx`**

```javascript
'use client';

import { Tabs as MuiTabs, Tab } from '@mui/material';
import './Tabs.scss';

export default function Tabs({ value, onChange, tabs }) {
  return (
    <MuiTabs 
      value={value} 
      onChange={onChange}
      className="custom-tabs"
    >
      {tabs.map((tab) => (
        <Tab 
          key={tab.value} 
          label={tab.label} 
          value={tab.value}
        />
      ))}
    </MuiTabs>
  );
}
```

**8. `ui/Tabs/Tabs.scss`**

```scss
.custom-tabs {
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 24px;
}
```

---

### Phase 4: Spec Upload & State Management

**Goal**: Handle file upload and global spec state

#### Files to Create

**1. `hooks/useSpecState.js`**

```javascript
'use client';

import { create } from 'zustand';

export const useSpecState = create((set) => ({
  spec: null,
  version: null,
  schemaVersion: null,
  isValid: false,
  errors: [],
  
  setSpec: (spec, version, schemaVersion, isValid, errors = []) => 
    set({ spec, version, schemaVersion, isValid, errors }),
  
  clearSpec: () => 
    set({ 
      spec: null, 
      version: null, 
      schemaVersion: null,
      isValid: false, 
      errors: [] 
    }),
}));
```

**2. `components/SpecUploader/helpers/parseSpec.js`**

```javascript
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
```

**3. `components/SpecUploader/helpers/validateSpec.js`**

```javascript
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
```

**4. `components/SpecUploader/SpecUploader.jsx`**

```javascript
'use client';

import { useState } from 'react';
import { CircularProgress } from '@mui/material';
import Button from '@/ui/Button/Button';
import { useSpecState } from '@/hooks/useSpecState';
import { parseUploadedSpec } from './helpers/parseSpec';
import { validateSpec } from './helpers/validateSpec';
import './SpecUploader.scss';

export default function SpecUploader() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setSpec } = useSpecState();

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // Parse file
      const parsedSpec = await parseUploadedSpec(file);

      // Validate spec
      const validation = await validateSpec(parsedSpec);

      if (validation.valid) {
        setSpec(
          parsedSpec,
          validation.version,
          validation.schemaVersion,
          true,
          []
        );
      } else {
        setSpec(
          parsedSpec,
          validation.version,
          validation.schemaVersion,
          false,
          validation.errors
        );
        setError('Spec validation failed. Check errors below.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="spec-uploader">
      <div className="spec-uploader__content">
        <h2>Upload OpenAPI Specification</h2>
        <p>Upload your OpenAPI spec (JSON or YAML format)</p>

        <input
          type="file"
          accept=".json,.yaml,.yml"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="spec-file-input"
          disabled={isLoading}
        />

        <label htmlFor="spec-file-input">
          <Button
            variant="contained"
            component="span"
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? <CircularProgress size={24} /> : 'Choose File'}
          </Button>
        </label>

        {error && (
          <div className="spec-uploader__error">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**5. `components/SpecUploader/SpecUploader.scss`**

```scss
.spec-uploader {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;

  &__content {
    max-width: 500px;
    width: 100%;
    text-align: center;

    h2 {
      margin-bottom: 16px;
      color: #333;
    }

    p {
      margin-bottom: 24px;
      color: #666;
    }
  }

  &__error {
    margin-top: 16px;
    padding: 12px;
    background-color: #ffebee;
    border: 1px solid #ef5350;
    border-radius: 4px;
    color: #c62828;
  }
}
```

---

### Phase 5: Sidebar Navigation

**Goal**: Create two-level menu structure

#### Files to Create

**1. `components/Sidebar/Sidebar.jsx`**

```javascript
'use client';

import { useState } from 'react';
import { List, ListItemButton, ListItemText } from '@mui/material';
import './Sidebar.scss';

const menuItems = [
  { id: 'endpoints', label: 'Endpoints' },
  { id: 'objects', label: 'Objects' },
  { id: 'webhooks', label: 'WebHooks' },
  { id: 'entities', label: 'Entities' },
];

export default function Sidebar({ onSelect }) {
  const [selected, setSelected] = useState('endpoints');

  const handleSelect = (id) => {
    setSelected(id);
    onSelect(id);
  };

  return (
    <nav className="sidebar">
      <div className="sidebar__header">
        <h3>OpenAPI Viewer</h3>
      </div>
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.id}
            selected={selected === item.id}
            onClick={() => handleSelect(item.id)}
            className="sidebar__item"
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </nav>
  );
}
```

**2. `components/Sidebar/Sidebar.scss`**

```scss
.sidebar {
  width: 250px;
  height: 100vh;
  background-color: #fafafa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;

  &__header {
    padding: 20px 16px;
    border-bottom: 1px solid #e0e0e0;

    h3 {
      margin: 0;
      font-size: 18px;
      color: #333;
    }
  }

  &__item {
    &.Mui-selected {
      background-color: #e3f2fd !important;
      border-left: 3px solid #1976d2;
    }
  }
}
```

---

### Phase 6: Endpoints View

**Goal**: Display routes grouped by tags

#### Files to Create

**1. `components/EndpointsList/helpers/groupByTags.js`**

```javascript
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
```

**2. `components/EndpointsList/EndpointsList.jsx`**

```javascript
'use client';

import Collapsible from '@/ui/Collapsible/Collapsible';
import { groupByTags, getMethodColor } from './helpers/groupByTags';
import './EndpointsList.scss';

export default function EndpointsList({ spec }) {
  if (!spec?.paths) {
    return (
      <div className="endpoints-list">
        <p className="endpoints-list__empty">No endpoints found</p>
      </div>
    );
  }

  const grouped = groupByTags(spec.paths);
  const tags = Object.keys(grouped).sort();

  return (
    <div className="endpoints-list">
      <h2>API Endpoints</h2>
      <p className="endpoints-list__info">
        Total: {tags.length} tags, {
          Object.values(grouped).reduce((sum, endpoints) => sum + endpoints.length, 0)
        } endpoints
      </p>

      {tags.map((tag) => (
        <Collapsible key={tag} title={`${tag} (${grouped[tag].length})`}>
          <ul className="endpoints-list__items">
            {grouped[tag].map((endpoint, idx) => (
              <li 
                key={idx} 
                className={`endpoint-item ${endpoint.deprecated ? 'endpoint-item--deprecated' : ''}`}
              >
                <div className="endpoint-item__main">
                  <span className={`method method--${getMethodColor(endpoint.method)}`}>
                    {endpoint.method}
                  </span>
                  <span className="path">{endpoint.path}</span>
                </div>
                {endpoint.summary && (
                  <p className="summary">{endpoint.summary}</p>
                )}
                {endpoint.deprecated && (
                  <span className="deprecated-badge">DEPRECATED</span>
                )}
              </li>
            ))}
          </ul>
        </Collapsible>
      ))}
    </div>
  );
}
```

**3. `components/EndpointsList/EndpointsList.scss`**

```scss
.endpoints-list {
  padding: 24px;

  h2 {
    margin-bottom: 8px;
  }

  &__info {
    color: #666;
    font-size: 14px;
    margin-bottom: 24px;
  }

  &__empty {
    text-align: center;
    color: #999;
    padding: 40px;
  }

  &__items {
    list-style: none;
    padding: 0;
    margin: 0;
  }
}

.endpoint-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;

  &:hover {
    background-color: #fafafa;
  }

  &--deprecated {
    opacity: 0.6;
  }

  &__main {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .method {
    padding: 4px 8px;
    border-radius: 3px;
    font-size: 12px;
    font-weight: 600;
    min-width: 60px;
    text-align: center;

    &--get {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    &--post {
      background-color: #e8f5e9;
      color: #388e3c;
    }

    &--put {
      background-color: #fff3e0;
      color: #f57c00;
    }

    &--delete {
      background-color: #ffebee;
      color: #d32f2f;
    }

    &--patch {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    &--default {
      background-color: #f5f5f5;
      color: #666;
    }
  }

  .path {
    font-family: 'Courier New', monospace;
    font-size: 14px;
    color: #333;
    flex: 1;
  }

  .summary {
    margin: 8px 0 0 76px;
    font-size: 13px;
    color: #666;
  }

  .deprecated-badge {
    display: inline-block;
    margin-left: 76px;
    margin-top: 4px;
    padding: 2px 6px;
    background-color: #ff9800;
    color: white;
    font-size: 10px;
    font-weight: 600;
    border-radius: 3px;
  }
}
```

---

### Phase 7: Objects/Schemas View

**Goal**: Display schema definitions

#### Files to Create

**1. `components/ObjectsList/ObjectsList.jsx`**

```javascript
'use client';

import Collapsible from '@/ui/Collapsible/Collapsible';
import './ObjectsList.scss';

export default function ObjectsList({ spec }) {
  const schemas = spec?.components?.schemas || {};
  const schemaNames = Object.keys(schemas).sort();

  if (schemaNames.length === 0) {
    return (
      <div className="objects-list">
        <p className="objects-list__empty">No schemas found</p>
      </div>
    );
  }

  return (
    <div className="objects-list">
      <h2>Schemas</h2>
      <p className="objects-list__info">Total: {schemaNames.length} schemas</p>

      {schemaNames.map((name) => {
        const schema = schemas[name];
        return (
          <Collapsible key={name} title={name}>
            <div className="schema-details">
              {schema.type && (
                <p className="schema-details__type">
                  <strong>Type:</strong> {schema.type}
                </p>
              )}

              {schema.description && (
                <p className="schema-details__description">
                  {schema.description}
                </p>
              )}

              {schema.properties && (
                <div className="schema-details__properties">
                  <h4>Properties:</h4>
                  <table className="properties-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Required</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(schema.properties).map(([propName, propDetails]) => (
                        <tr key={propName}>
                          <td>
                            <code>{propName}</code>
                          </td>
                          <td>{propDetails.type || 'N/A'}</td>
                          <td>
                            {schema.required?.includes(propName) ? (
                              <span className="badge badge--required">Yes</span>
                            ) : (
                              <span className="badge badge--optional">No</span>
                            )}
                          </td>
                          <td>{propDetails.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {schema.enum && (
                <div className="schema-details__enum">
                  <h4>Enum values:</h4>
                  <ul>
                    {schema.enum.map((value, idx) => (
                      <li key={idx}><code>{JSON.stringify(value)}</code></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
```

**2. `components/ObjectsList/ObjectsList.scss`**

```scss
.objects-list {
  padding: 24px;

  h2 {
    margin-bottom: 8px;
  }

  &__info {
    color: #666;
    font-size: 14px;
    margin-bottom: 24px;
  }

  &__empty {
    text-align: center;
    color: #999;
    padding: 40px;
  }
}

.schema-details {
  &__type {
    margin-bottom: 12px;
    font-size: 14px;
  }

  &__description {
    color: #666;
    font-size: 14px;
    margin-bottom: 16px;
    padding: 12px;
    background-color: #f5f5f5;
    border-radius: 4px;
  }

  &__properties,
  &__enum {
    margin-top: 16px;

    h4 {
      margin-bottom: 8px;
      font-size: 14px;
      color: #333;
    }
  }

  &__enum ul {
    list-style: none;
    padding: 0;

    li {
      padding: 4px 0;
    }
  }
}

.properties-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th {
    text-align: left;
    padding: 8px;
    background-color: #f5f5f5;
    border-bottom: 2px solid #e0e0e0;
    font-weight: 600;
  }

  td {
    padding: 8px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: top;
  }

  code {
    background-color: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 12px;
  }
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;

  &--required {
    background-color: #ffebee;
    color: #d32f2f;
  }

  &--optional {
    background-color: #f5f5f5;
    color: #666;
  }
}
```

---

### Phase 8: Webhooks View (OpenAPI 3.1+)

**Goal**: Display webhooks from spec

#### Files to Create

**1. `components/WebhooksList/WebhooksList.jsx`**

```javascript
'use client';

import Collapsible from '@/ui/Collapsible/Collapsible';
import { getMethodColor } from '@/components/EndpointsList/helpers/groupByTags';
import './WebhooksList.scss';

export default function WebhooksList({ spec }) {
  const webhooks = spec?.webhooks || {};
  const webhookNames = Object.keys(webhooks).sort();

  if (webhookNames.length === 0) {
    return (
      <div className="webhooks-list">
        <div className="webhooks-list__empty">
          <p>No webhooks defined</p>
          <p className="webhooks-list__note">
            Webhooks are supported in OpenAPI 3.1.0 and later
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="webhooks-list">
      <h2>Webhooks</h2>
      <p className="webhooks-list__info">Total: {webhookNames.length} webhooks</p>

      {webhookNames.map((name) => {
        const webhook = webhooks[name];
        const methods = Object.keys(webhook).filter(key => 
          ['get', 'post', 'put', 'delete', 'patch'].includes(key.toLowerCase())
        );

        return (
          <Collapsible key={name} title={name}>
            <div className="webhook-details">
              {methods.map((method) => {
                const details = webhook[method];
                return (
                  <div key={method} className="webhook-method">
                    <div className="webhook-method__header">
                      <span className={`method method--${getMethodColor(method.toUpperCase())}`}>
                        {method.toUpperCase()}
                      </span>
                      {details.summary && (
                        <span className="webhook-method__summary">{details.summary}</span>
                      )}
                    </div>

                    {details.description && (
                      <p className="webhook-method__description">
                        {details.description}
                      </p>
                    )}

                    {details.requestBody && (
                      <div className="webhook-method__request">
                        <h4>Request Body</h4>
                        <p>{details.requestBody.description || 'No description'}</p>
                      </div>
                    )}

                    {details.responses && (
                      <div className="webhook-method__responses">
                        <h4>Responses</h4>
                        <ul>
                          {Object.entries(details.responses).map(([code, response]) => (
                            <li key={code}>
                              <strong>{code}:</strong> {response.description || 'No description'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
```

**2. `components/WebhooksList/WebhooksList.scss`**

```scss
.webhooks-list {
  padding: 24px;

  h2 {
    margin-bottom: 8px;
  }

  &__info {
    color: #666;
    font-size: 14px;
    margin-bottom: 24px;
  }

  &__empty {
    text-align: center;
    color: #999;
    padding: 40px;
  }

  &__note {
    margin-top: 8px;
    font-size: 13px;
    color: #999;
  }
}

.webhook-details {
  .method {
    padding: 4px 8px;
    border-radius: 3px;
    font-size: 12px;
    font-weight: 600;
    min-width: 60px;
    text-align: center;

    &--get {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    &--post {
      background-color: #e8f5e9;
      color: #388e3c;
    }

    &--put {
      background-color: #fff3e0;
      color: #f57c00;
    }

    &--delete {
      background-color: #ffebee;
      color: #d32f2f;
    }

    &--patch {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }
  }
}

.webhook-method {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__summary {
    font-weight: 500;
    color: #333;
  }

  &__description {
    color: #666;
    font-size: 14px;
    margin-bottom: 16px;
    padding: 12px;
    background-color: #f5f5f5;
    border-radius: 4px;
  }

  &__request,
  &__responses {
    margin-top: 16px;

    h4 {
      margin-bottom: 8px;
      font-size: 14px;
      color: #333;
    }

    p {
      font-size: 13px;
      color: #666;
    }

    ul {
      list-style: none;
      padding: 0;

      li {
        padding: 4px 0;
        font-size: 13px;
        color: #666;

        strong {
          color: #333;
        }
      }
    }
  }
}
```

---

### Phase 9: Database Entity System

**Goal**: Create abstract entity structure with adapters

#### Files to Create

**1. `lib/adapters/database/AbstractEntity.js`**

```javascript
/**
 * Abstract base class for database entities
 */
export class AbstractEntity {
  constructor(name, fields, options = {}) {
    this.name = name;
    this.fields = fields; // { fieldName: { type, required, unique, format, etc } }
    this.options = options; // Additional entity options (timestamps, indexes, etc)
  }

  /**
   * Convert to TypeORM EntitySchema format
   * @returns {Object} TypeORM entity schema
   */
  toTypeORM() {
    throw new Error('toTypeORM() must be implemented by adapter');
  }

  /**
   * Convert to Sequelize model definition
   * @returns {Object} Sequelize model definition
   */
  toSequelize() {
    throw new Error('toSequelize() must be implemented by adapter');
  }

  /**
   * Create entity from OpenAPI schema
   * @param {string} schemaName - Schema name
   * @param {Object} schema - OpenAPI schema object
   * @returns {AbstractEntity} Entity instance
   */
  static fromSchema(schemaName, schema) {
    const fields = {};
    
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([name, config]) => {
        fields[name] = {
          type: config.type,
          required: schema.required?.includes(name) || false,
          format: config.format,
          description: config.description,
          enum: config.enum,
          minimum: config.minimum,
          maximum: config.maximum,
          minLength: config.minLength,
          maxLength: config.maxLength,
          pattern: config.pattern,
        };
      });
    }

    const options = {
      description: schema.description,
      timestamps: true, // Add createdAt/updatedAt by default
    };

    return new AbstractEntity(schemaName, fields, options);
  }

  /**
   * Get field names
   * @returns {string[]} Array of field names
   */
  getFieldNames() {
    return Object.keys(this.fields);
  }

  /**
   * Get required fields
   * @returns {string[]} Array of required field names
   */
  getRequiredFields() {
    return Object.entries(this.fields)
      .filter(([, config]) => config.required)
      .map(([name]) => name);
  }
}
```

**2. `lib/adapters/database/TypeORMAdapter.js`**

```javascript
import { AbstractEntity } from './AbstractEntity';

/**
 * TypeORM adapter for AbstractEntity
 */
export class TypeORMAdapter extends AbstractEntity {
  /**
   * Map OpenAPI types to TypeORM column types
   */
  static TYPE_MAPPING = {
    string: 'varchar',
    integer: 'int',
    number: 'decimal',
    boolean: 'boolean',
    array: 'json',
    object: 'json',
  };

  /**
   * Map OpenAPI formats to TypeORM column types
   */
  static FORMAT_MAPPING = {
    'date-time': 'timestamp',
    'date': 'date',
    'email': 'varchar',
    'uuid': 'uuid',
    'uri': 'text',
    'binary': 'bytea',
  };

  /**
   * Convert to TypeORM EntitySchema
   * @returns {Object} TypeORM entity schema
   */
  toTypeORM() {
    const columns = {};

    // Add ID column
    columns.id = {
      type: 'int',
      primary: true,
      generated: true,
    };

    // Add fields from schema
    Object.entries(this.fields).forEach(([name, config]) => {
      const columnDef = {
        type: this.getColumnType(config),
        nullable: !config.required,
      };

      // Add length constraint for strings
      if (config.type === 'string' && config.maxLength) {
        columnDef.length = config.maxLength;
      }

      // Add unique constraint
      if (config.unique) {
        columnDef.unique = true;
      }

      // Add default value
      if (config.default !== undefined) {
        columnDef.default = config.default;
      }

      columns[name] = columnDef;
    });

    // Add timestamp columns if enabled
    if (this.options.timestamps) {
      columns.createdAt = {
        type: 'timestamp',
        createDate: true,
      };
      columns.updatedAt = {
        type: 'timestamp',
        updateDate: true,
      };
    }

    return {
      name: this.name,
      columns,
      options: {
        comment: this.options.description,
      },
    };
  }

  /**
   * Get TypeORM column type from field config
   * @param {Object} config - Field configuration
   * @returns {string} TypeORM column type
   */
  getColumnType(config) {
    // Check format first (more specific)
    if (config.format && TypeORMAdapter.FORMAT_MAPPING[config.format]) {
      return TypeORMAdapter.FORMAT_MAPPING[config.format];
    }

    // Fall back to type mapping
    return TypeORMAdapter.TYPE_MAPPING[config.type] || 'varchar';
  }

  /**
   * Generate TypeORM entity class code (as string)
   * @returns {string} TypeORM entity class code
   */
  generateEntityCode() {
    const schema = this.toTypeORM();
    
    let code = `import { EntitySchema } from 'typeorm';\n\n`;
    code += `export const ${this.name}Entity = new EntitySchema({\n`;
    code += `  name: '${schema.name}',\n`;
    code += `  columns: ${JSON.stringify(schema.columns, null, 4)},\n`;
    code += `});\n`;

    return code;
  }
}
```

**3. `lib/adapters/database/SequelizeAdapter.js`**

```javascript
import { AbstractEntity } from './AbstractEntity';

/**
 * Sequelize adapter for AbstractEntity
 */
export class SequelizeAdapter extends AbstractEntity {
  /**
   * Map OpenAPI types to Sequelize DataTypes
   */
  static TYPE_MAPPING = {
    string: 'STRING',
    integer: 'INTEGER',
    number: 'DECIMAL',
    boolean: 'BOOLEAN',
    array: 'JSON',
    object: 'JSON',
  };

  /**
   * Map OpenAPI formats to Sequelize DataTypes
   */
  static FORMAT_MAPPING = {
    'date-time': 'DATE',
    'date': 'DATEONLY',
    'email': 'STRING',
    'uuid': 'UUID',
    'uri': 'TEXT',
    'binary': 'BLOB',
  };

  /**
   * Convert to Sequelize model definition
   * @returns {Object} Sequelize model definition
   */
  toSequelize() {
    const attributes = {};

    // Add ID attribute
    attributes.id = {
      type: 'INTEGER',
      primaryKey: true,
      autoIncrement: true,
    };

    // Add fields from schema
    Object.entries(this.fields).forEach(([name, config]) => {
      const attributeDef = {
        type: this.getDataType(config),
        allowNull: !config.required,
      };

      // Add unique constraint
      if (config.unique) {
        attributeDef.unique = true;
      }

      // Add default value
      if (config.default !== undefined) {
        attributeDef.defaultValue = config.default;
      }

      // Add validation
      const validate = {};
      
      if (config.minLength) validate.len = [config.minLength, config.maxLength || Infinity];
      if (config.minimum !== undefined) validate.min = config.minimum;
      if (config.maximum !== undefined) validate.max = config.maximum;
      if (config.pattern) validate.is = new RegExp(config.pattern);
      if (config.format === 'email') validate.isEmail = true;
      if (config.format === 'uri') validate.isUrl = true;
      if (config.enum) validate.isIn = [config.enum];

      if (Object.keys(validate).length > 0) {
        attributeDef.validate = validate;
      }

      attributes[name] = attributeDef;
    });

    const options = {
      tableName: this.name.toLowerCase(),
      timestamps: this.options.timestamps || false,
      comment: this.options.description,
    };

    return {
      modelName: this.name,
      attributes,
      options,
    };
  }

  /**
   * Get Sequelize DataType from field config
   * @param {Object} config - Field configuration
   * @returns {string} Sequelize DataType
   */
  getDataType(config) {
    // Check format first (more specific)
    if (config.format && SequelizeAdapter.FORMAT_MAPPING[config.format]) {
      return SequelizeAdapter.FORMAT_MAPPING[config.format];
    }

    // Fall back to type mapping
    let type = SequelizeAdapter.TYPE_MAPPING[config.type] || 'STRING';

    // Add length for strings
    if (type === 'STRING' && config.maxLength) {
      type = `STRING(${config.maxLength})`;
    }

    return type;
  }

  /**
   * Generate Sequelize model code (as string)
   * @returns {string} Sequelize model code
   */
  generateModelCode() {
    const definition = this.toSequelize();
    
    let code = `import { DataTypes } from 'sequelize';\n\n`;
    code += `export function define${this.name}Model(sequelize) {\n`;
    code += `  return sequelize.define('${definition.modelName}', {\n`;
    
    Object.entries(definition.attributes).forEach(([name, config]) => {
      code += `    ${name}: {\n`;
      Object.entries(config).forEach(([key, value]) => {
        if (key === 'type') {
          code += `      type: DataTypes.${value},\n`;
        } else {
          code += `      ${key}: ${JSON.stringify(value)},\n`;
        }
      });
      code += `    },\n`;
    });
    
    code += `  }, ${JSON.stringify(definition.options, null, 4)});\n`;
    code += `}\n`;

    return code;
  }
}
```

**4. `components/EntitiesList/EntitiesList.jsx`**

```javascript
'use client';

import { useState } from 'react';
import Collapsible from '@/ui/Collapsible/Collapsible';
import Tabs from '@/ui/Tabs/Tabs';
import Button from '@/ui/Button/Button';
import { AbstractEntity } from '@/lib/adapters/database/AbstractEntity';
import { TypeORMAdapter } from '@/lib/adapters/database/TypeORMAdapter';
import { SequelizeAdapter } from '@/lib/adapters/database/SequelizeAdapter';
import './EntitiesList.scss';

export default function EntitiesList({ spec }) {
  const [adapter, setAdapter] = useState('typeorm');
  const schemas = spec?.components?.schemas || {};
  const schemaNames = Object.keys(schemas).sort();

  if (schemaNames.length === 0) {
    return (
      <div className="entities-list">
        <p className="entities-list__empty">No schemas found to convert</p>
      </div>
    );
  }

  const handleDownloadAll = () => {
    const entities = schemaNames.map(name => {
      const schema = schemas[name];
      const entity = AbstractEntity.fromSchema(name, schema);
      
      if (adapter === 'typeorm') {
        const typeormEntity = new TypeORMAdapter(entity.name, entity.fields, entity.options);
        return typeormEntity.generateEntityCode();
      } else {
        const sequelizeEntity = new SequelizeAdapter(entity.name, entity.fields, entity.options);
        return sequelizeEntity.generateModelCode();
      }
    }).join('\n\n');

    const blob = new Blob([entities], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entities-${adapter}.js`;
    a.click();
  };

  return (
    <div className="entities-list">
      <h2>Database Entities</h2>
      <p className="entities-list__info">
        Convert OpenAPI schemas to database entities
      </p>

      <div className="entities-list__controls">
        <Tabs
          value={adapter}
          onChange={(e, newValue) => setAdapter(newValue)}
          tabs={[
            { label: 'TypeORM', value: 'typeorm' },
            { label: 'Sequelize', value: 'sequelize' },
          ]}
        />
        <Button onClick={handleDownloadAll}>
          Download All Entities
        </Button>
      </div>

      {schemaNames.map((name) => {
        const schema = schemas[name];
        const entity = AbstractEntity.fromSchema(name, schema);
        
        let adapterEntity;
        let code;
        
        if (adapter === 'typeorm') {
          adapterEntity = new TypeORMAdapter(entity.name, entity.fields, entity.options);
          code = adapterEntity.generateEntityCode();
        } else {
          adapterEntity = new SequelizeAdapter(entity.name, entity.fields, entity.options);
          code = adapterEntity.generateModelCode();
        }

        return (
          <Collapsible key={name} title={name}>
            <div className="entity-details">
              <div className="entity-details__info">
                <p><strong>Fields:</strong> {entity.getFieldNames().length}</p>
                <p><strong>Required:</strong> {entity.getRequiredFields().length}</p>
              </div>

              <div className="entity-details__code">
                <h4>Generated Code:</h4>
                <pre>
                  <code>{code}</code>
                </pre>
              </div>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
```

**5. `components/EntitiesList/EntitiesList.scss`**

```scss
.entities-list {
  padding: 24px;

  h2 {
    margin-bottom: 8px;
  }

  &__info {
    color: #666;
    font-size: 14px;
    margin-bottom: 24px;
  }

  &__empty {
    text-align: center;
    color: #999;
    padding: 40px;
  }

  &__controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 16px;
    background-color: #f5f5f5;
    border-radius: 4px;
  }
}

.entity-details {
  &__info {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;
    padding: 12px;
    background-color: #f5f5f5;
    border-radius: 4px;

    p {
      margin: 0;
      font-size: 13px;
      color: #666;

      strong {
        color: #333;
      }
    }
  }

  &__code {
    h4 {
      margin-bottom: 8px;
      font-size: 14px;
      color: #333;
    }

    pre {
      background-color: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
      line-height: 1.5;

      code {
        background: none;
        padding: 0;
        color: inherit;
      }
    }
  }
}
```

---

### Phase 10: Main App Integration

**Goal**: Wire everything together

#### Files to Create/Update

**1. `app/page.js`**

```javascript
'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import SpecUploader from '@/components/SpecUploader/SpecUploader';
import EndpointsList from '@/components/EndpointsList/EndpointsList';
import ObjectsList from '@/components/ObjectsList/ObjectsList';
import WebhooksList from '@/components/WebhooksList/WebhooksList';
import EntitiesList from '@/components/EntitiesList/EntitiesList';
import { useSpecState } from '@/hooks/useSpecState';
import Button from '@/ui/Button/Button';
import './page.scss';

export default function Home() {
  const [activeView, setActiveView] = useState('endpoints');
  const { spec, version, schemaVersion, isValid, errors, clearSpec } = useSpecState();

  const renderContent = () => {
    if (!spec) {
      return <SpecUploader />;
    }

    if (!isValid) {
      return (
        <div className="validation-errors">
          <h2>Validation Errors</h2>
          <p>Your spec has validation errors:</p>
          <ul>
            {errors.map((error, idx) => (
              <li key={idx}>
                <strong>{error.path || 'root'}:</strong> {error.message}
              </li>
            ))}
          </ul>
          <Button onClick={clearSpec} variant="outlined">
            Upload Different Spec
          </Button>
        </div>
      );
    }

    switch (activeView) {
      case 'endpoints':
        return <EndpointsList spec={spec} />;
      case 'objects':
        return <ObjectsList spec={spec} />;
      case 'webhooks':
        return <WebhooksList spec={spec} />;
      case 'entities':
        return <EntitiesList spec={spec} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <Sidebar onSelect={setActiveView} />
      <main className="content">
        {spec && isValid && (
          <div className="content__header">
            <div className="spec-info">
              <h1>{spec.info?.title || 'OpenAPI Specification'}</h1>
              <p className="spec-info__version">
                OpenAPI {version} (validated against {schemaVersion})
              </p>
              {spec.info?.description && (
                <p className="spec-info__description">{spec.info.description}</p>
              )}
            </div>
            <Button onClick={clearSpec} variant="outlined" size="small">
              Change Spec
            </Button>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}
```

**2. `app/page.scss`**

```scss
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  background-color: #fff;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 24px;
    background-color: #fafafa;
    border-bottom: 1px solid #e0e0e0;
    position: sticky;
    top: 0;
    z-index: 10;
  }
}

.spec-info {
  h1 {
    margin: 0 0 8px 0;
    font-size: 24px;
    color: #333;
  }

  &__version {
    margin: 0 0 8px 0;
    color: #666;
    font-size: 13px;
    font-family: 'Courier New', monospace;
  }

  &__description {
    margin: 0;
    color: #666;
    font-size: 14px;
    max-width: 600px;
  }
}

.validation-errors {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;

  h2 {
    color: #d32f2f;
    margin-bottom: 16px;
  }

  p {
    color: #666;
    margin-bottom: 16px;
  }

  ul {
    list-style: none;
    padding: 0;

    li {
      padding: 12px;
      margin-bottom: 8px;
      background-color: #ffebee;
      border-left: 4px solid #d32f2f;
      border-radius: 4px;

      strong {
        color: #c62828;
        font-family: 'Courier New', monospace;
        font-size: 13px;
      }
    }
  }

  button {
    margin-top: 16px;
  }
}
```

---

## Package Dependencies

**Install required packages:**

```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
npm install zustand
npm install js-yaml
npm install ajv
```

**`package.json` dependencies:**

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@mui/material": "^6.0.0",
    "@mui/icons-material": "^6.0.0",
    "@emotion/react": "^11.13.0",
    "@emotion/styled": "^11.13.0",
    "zustand": "^5.0.0",
    "js-yaml": "^4.1.0",
    "ajv": "^8.17.0"
  }
}
```

---

## AI Assistant Guidelines

### When Creating Components

1. **Always create folder structure first**

   ```
   components/{Name}/
     {Name}.jsx
     {Name}.scss
     helpers/ (if needed)
   ```

2. **Use absolute imports**

   ```javascript
   import Component from '@/components/Component/Component';
   import { helper } from '@/utils/helper';
   ```

3. **Keep SCSS modular**
   - Use BEM naming convention
   - Nest only when necessary
   - Avoid deep nesting (max 3 levels)

4. **State management pattern**
   - Local state: `useState`
   - Global state: Zustand (`useSpecState`)
   - Server state: API routes

### File Creation Order

Follow phases sequentially:

1. Foundation (layouts, parsers)
2. Validation (version detection, schemas)
3. UI components (generic reusables)
4. Feature components (spec uploader, lists)
5. Integration (main app)

### Material UI Usage

**Allowed components:**

- `IconButton`, `Button`
- `List`, `ListItemButton`, `ListItemText`
- `TextField`
- `Tabs`, `Tab`
- `ThemeProvider`, `CssBaseline`
- `CircularProgress`

**Avoid:**

- `Box`, `Grid`, `Container`, `Stack`
- Use plain HTML with SCSS instead

### Common Patterns

**API Route:**

```javascript
export async function POST(request) {
  const data = await request.json();
  return Response.json({ result });
}
```

**Client Component:**

```javascript
'use client';
import { useState } from 'react';
// component code
```

**SCSS Module:**

```scss
.component-name {
  &__element { }
  &__element--modifier { }
}
```

---

## Adding New OpenAPI Versions

To support a new OpenAPI version (e.g., 3.3.0):

1. Download official JSON schema from OpenAPI spec repository
2. Place in `lib/validators/openapi-3.3.0-schema.json`
3. **Done!** No code changes needed - version detector will auto-discover

---

## Testing Checklist

- [ ] Upload JSON OpenAPI spec
- [ ] Upload YAML OpenAPI spec
- [ ] Test version detection (3.0.3, 3.1.0, 3.2.0)
- [ ] Validate invalid spec (should show errors)
- [ ] Navigate all menu items
- [ ] Expand/collapse all collapsibles
- [ ] Test endpoints grouping by tags
- [ ] View schema details
- [ ] Check webhooks (3.1+ only)
- [ ] Generate TypeORM entities
- [ ] Generate Sequelize models
- [ ] Download entity code
- [ ] Change spec (should reset state)

---

## Future Enhancements

1. **Search/Filter**: Add search across endpoints, schemas, webhooks
2. **Export**: Export to Postman collection, Insomnia, etc.
3. **Diff**: Compare two OpenAPI specs
4. **Mock Server**: Generate mock responses
5. **Code Generation**: Client SDKs in multiple languages
6. **Themes**: Dark mode support
7. **Persistence**: Save recently viewed specs
8. **Collaboration**: Share annotations/comments

---

## Project Completion Criteria

✅ All phases completed
✅ All components functional
✅ Validation working for all versions
✅ Entity generation working
✅ No TypeScript used
✅ Material UI usage minimized
✅ SCSS properly structured
✅ File naming conventions followed

---

**End of Development Plan**
