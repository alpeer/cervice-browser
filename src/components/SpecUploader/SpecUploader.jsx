'use client';

import { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
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
          validation.isSwagger || false,
          true,
          []
        );
      } else {
        setSpec(
          parsedSpec,
          validation.version,
          validation.schemaVersion,
          validation.isSwagger || false,
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
