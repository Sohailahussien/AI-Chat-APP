'use client';

export default function CSSDebugPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">CSS Debug Page</h1>
        
        {/* Test 1: Tailwind Classes */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Test 1: Tailwind CSS</h2>
          <div className="bg-blue-500 text-white p-4 rounded-lg">
            This should be blue background with white text (Tailwind)
          </div>
        </div>

        {/* Test 2: Custom CSS Class */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Test 2: Custom CSS Class</h2>
          <div className="debug-css-test">
            This should be red background with white text (Custom CSS)
          </div>
        </div>

        {/* Test 3: Inline Styles */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Test 3: Inline Styles</h2>
          <div style={{
            backgroundColor: 'green',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            This should be green background with white text (Inline CSS)
          </div>
        </div>

        {/* Test 4: CSS Variables */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Test 4: CSS Variables</h2>
          <div style={{
            backgroundColor: 'var(--background-start-rgb)',
            color: 'var(--foreground-rgb)',
            padding: '20px',
            border: '2px solid purple'
          }}>
            This should use CSS variables (purple border)
          </div>
        </div>

        {/* Test 5: Gradient */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Test 5: Gradient</h2>
          <div style={{
            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            This should be a colorful gradient
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-100 border border-yellow-400 p-4 rounded-lg">
          <h3 className="font-bold text-yellow-800 mb-2">Troubleshooting Steps:</h3>
          <ol className="list-decimal list-inside text-yellow-700 space-y-1">
            <li>If you see colored boxes above, CSS is working</li>
            <li>If you see plain text, try hard refresh (Ctrl+F5)</li>
            <li>If still not working, try incognito/private mode</li>
            <li>Check browser developer tools (F12) for errors</li>
            <li>Try a different browser</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
