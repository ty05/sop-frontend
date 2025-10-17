'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
          <div className="text-green-600 text-5xl mb-4 text-center">✉️</div>
          <h2 className="text-2xl font-bold mb-4">Check your email</h2>
          <p className="text-gray-600 mb-2">
            We sent a magic link to <strong>{email}</strong>
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4">
            <p className="text-sm text-blue-800 font-medium mb-2">⚠️ Important:</p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Click the link within a few minutes</li>
              <li>The link can only be used once</li>
              <li>If it expires, request a new one</li>
            </ul>
          </div>
          <button
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
            className="mt-4 w-full text-sm text-blue-600 hover:text-blue-700"
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-6">SOP Manual</h1>
        <h2 className="text-xl mb-4">Sign in with email</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full px-4 py-2 border rounded mb-4"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Sending...' : 'Send magic link'}
          </button>
        </form>
      </div>
    </div>
  );
}
