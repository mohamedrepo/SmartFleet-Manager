'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#e2e8f0',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          maxWidth: '500px',
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
          }}>
            🚛
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#f87171',
            marginBottom: '1rem',
          }}>
            SmartFleet Manager
          </h1>
          <p style={{
            color: '#94a3b8',
            marginBottom: '1.5rem',
          }}>
            حدث خطأ أثناء تحميل التطبيق. يرجى المحاولة مرة أخرى.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            إعادة المحاولة
          </button>
          {error.digest && (
            <p style={{
              marginTop: '1rem',
              fontSize: '0.75rem',
              color: '#64748b',
            }}>
              رمز الخطأ: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
