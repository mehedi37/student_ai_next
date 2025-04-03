'use client';

import { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function AlertMessage({
  message,
  show,
  onClose,
  type = 'error',
  autoHideDuration = 5000
}) {
  // Return null if not showing
  if (!show || !message) return null;

  // Auto-hide the alert
  useEffect(() => {
    if (show && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [show, autoHideDuration, onClose]);

  let Icon = AlertCircle;
  let alertClass = 'alert-error';

  if (type === 'success') {
    Icon = CheckCircle;
    alertClass = 'alert-success';
  } else if (type === 'info') {
    Icon = Info;
    alertClass = 'alert-info';
  }

  return (
    <div role="alert" className={`alert ${alertClass} shadow-lg fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md`}>
      <Icon className="h-6 w-6" />
      <span>{message}</span>
      {onClose && (
        <button
          className="btn btn-circle btn-ghost btn-sm"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}