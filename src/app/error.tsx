'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      padding: '2rem',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#dc2626',
          marginBottom: '0.75rem',
        }}>
          حدث خطأ
        </h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          {error.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'}
        </p>
        <button
          onClick={reset}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1.5rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
