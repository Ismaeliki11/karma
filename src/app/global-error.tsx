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
        console.error(error);
    }, [error]);

    return (
        <html>
            <body>
                <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
                    <h2 style={{ color: '#dc2626' }}>Algo salió mal (Global)</h2>
                    <p>Ha ocurrido un error crítico. Por favor, recarga la página.</p>
                    {error && (
                        <div style={{
                            marginTop: '20px',
                            padding: '10px',
                            background: '#fef2f2',
                            borderRadius: '8px',
                            textAlign: 'left',
                            color: '#991b1b',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            overflow: 'auto',
                            maxWidth: '100%'
                        }}>
                            <p><strong>Error:</strong> {error.message}</p>
                            {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
                            {error.stack && <pre>{error.stack}</pre>}
                        </div>
                    )}
                    <button
                        onClick={() => reset()}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            background: '#000',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Intentar de nuevo
                    </button>
                </div>
            </body>
        </html>
    );
}
