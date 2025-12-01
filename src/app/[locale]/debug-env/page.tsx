'use client';

export default function DebugEnvPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'NOT SET - falling back to localhost:8000';

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variable Debug</h1>
      <p><strong>NEXT_PUBLIC_API_URL:</strong> {apiUrl}</p>
      <p><strong>Expected:</strong> https://sop-backend-production.up.railway.app</p>
      <hr />
      <p>If the value above shows "NOT SET" or "localhost:8000", then the environment variable is not being embedded during build.</p>
    </div>
  );
}
