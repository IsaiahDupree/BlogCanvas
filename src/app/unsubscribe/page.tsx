'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      setStatus('success');
      setMessage('You have been successfully unsubscribed from this newsletter.');
    } else if (error) {
      setStatus('error');
      switch (error) {
        case 'missing_token':
          setMessage('Missing unsubscribe token. Please use the link from your email.');
          break;
        case 'invalid_token':
          setMessage('Invalid unsubscribe token. Please contact support if you continue to receive emails.');
          break;
        case 'expired':
          setMessage('This unsubscribe link has expired. Please use the link from a recent email or contact support.');
          break;
        case 'not_found':
          setMessage('Recipient not found. You may already be unsubscribed.');
          break;
        case 'server_error':
          setMessage('An error occurred while processing your request. Please try again later.');
          break;
        default:
          setMessage('An unexpected error occurred. Please try again later.');
      }
    } else {
      setStatus('loading');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              BlogCanvas
            </h1>
            <h2 className="text-2xl font-semibold text-gray-900">
              Newsletter Preferences
            </h2>
          </div>

          {/* Status Message */}
          {status === 'loading' ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent mb-4"></div>
              <p className="text-gray-600">Processing your request...</p>
            </div>
          ) : status === 'success' ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <p className="text-green-800 font-medium text-lg">{message}</p>
              </div>
              <div className="text-gray-600 space-y-3">
                <p>
                  We&apos;re sorry to see you go! You will no longer receive newsletters from this campaign.
                </p>
                <p>
                  If you unsubscribed by mistake, please contact the sender to be added back to the list.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">⚠️</div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <p className="text-red-800 font-medium text-lg">{message}</p>
              </div>
              <div className="text-gray-600">
                <p>
                  If you continue to experience issues, please contact the newsletter sender directly
                  or reply to one of their emails.
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Powered by BlogCanvas Newsletter System</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
