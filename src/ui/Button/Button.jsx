'use client'

import MuiButton from '@mui/material/Button'
import clsx from 'clsx'
import styles from './Button.module.scss'

export default function Button({
  children,
  variant = 'contained',
  color = 'primary',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  size,
  component,
}) {
  return (
    <MuiButton
      variant={variant}
      color={color}
      fullWidth={fullWidth}
      disabled={disabled}
      onClick={onClick}
      type={type}
      size={size}
      component={component}
      className={clsx(styles.customButton, className)}
    >
      {children}
    </MuiButton>
  )
}
