'use client';

// Create this as src/app/test-firebase/page.tsx
import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function TestFirebase() {
  const [status, setStatus] = useState('Ready to test');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log(msg);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const testGoogleLogin = async () => {
    setStatus('Testing...');
    setLogs([]);
    
    addLog('🔵 Starting test');
    addLog(`Auth config: ${JSON.stringify({
      apiKey: auth.config.apiKey?.substring(0, 10) + '...',
      authDomain: auth.config.authDomain,
      projectId: auth.config.projectId,
    })}`);

    const provider = new GoogleAuthProvider();
    const startTime = Date.now();

    try {
      addLog('🔵 Calling signInWithPopup...');
      
      const result = await signInWithPopup(auth, provider);
      
      const elapsed = Date.now() - startTime;
      addLog(`🟢 SUCCESS in ${elapsed}ms`);
      addLog(`User: ${result.user.email}`);
      addLog(`UID: ${result.user.uid}`);
      
      setStatus(`✅ Logged in as ${result.user.email}`);
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      addLog(`🔴 FAILED after ${elapsed}ms`);
      addLog(`Error code: ${error.code}`);
      addLog(`Error message: ${error.message}`);
      
      setStatus(`❌ Failed: ${error.code}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-4">Firebase Auth Test</h1>
        
        <div className="mb-6">
          <p className="text-lg font-semibold mb-2">Status:</p>
          <p className="text-gray-700">{status}</p>
        </div>

        <button
          onClick={testGoogleLogin}
          className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mb-6"
        >
          Test Google Sign-In
        </button>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h2 className="font-semibold mb-2">Logs:</h2>
          <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400">No logs yet. Click the button to test.</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-gray-700">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Checklist:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>✓ Firebase config in .env.local</li>
            <li>✓ Google sign-in enabled in Firebase Console</li>
            <li>✓ localhost in authorized domains</li>
            <li>✓ Support email set in Google provider settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}