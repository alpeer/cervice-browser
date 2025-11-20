'use client';

import { useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useSpecState } from '@/hooks/useSpecState';
import './ToastContainer.scss';

export default function ToastContainer() {
  const { toasts, removeToast } = useSpecState();

  useEffect(() => {
    // Auto-remove toasts after their duration
    toasts.forEach((toast) => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [toasts, removeToast]);

  const handleClose = (toastId) => {
    removeToast(toastId);
  };

  return (
    <div className="toast-container">
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          style={{
            top: `${80 + index * 70}px`,
            transition: 'top 0.3s ease'
          }}
        >
          <Alert
            onClose={() => handleClose(toast.id)}
            severity={toast.severity}
            variant="filled"
            sx={{ width: '100%', minWidth: '300px' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </div>
  );
}
