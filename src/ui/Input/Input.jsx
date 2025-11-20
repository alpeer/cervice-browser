'use client';

import TextField from '@mui/material/TextField';
import clsx from 'clsx';
import styles from './Input.module.scss';

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
      className={styles.customInput}
      variant="outlined"
    />
  );
}
