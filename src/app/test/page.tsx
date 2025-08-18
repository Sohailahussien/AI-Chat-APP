'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          🧪 App Test Page
        </h1>
        
        <div className="space-y-6">
          {/* CSS Test */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">CSS Test</h2>
            <div className="css-loading-test">
              🎨 CSS LOADING TEST - If you see this in red with white text, CSS is working!
            </div>
            <div className="debug-css-test mt-4">
              CSS Debug Test - If you see this in red with white text, CSS is working!
            </div>
          </div>
          
          {/* Tailwind Test */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Tailwind CSS Test</h2>
            <div className="space-y-4">
              <button className="btn-primary">
                Primary Button (Blue)
              </button>
              <button className="btn-secondary">
                Secondary Button (Gray)
              </button>
              <input 
                type="text" 
                placeholder="Test input field" 
                className="input-field w-full"
              />
            </div>
          </div>
          
          {/* API Test */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">API Test</h2>
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/mcp/health');
                  const data = await response.json();
                  alert(`API Status: ${JSON.stringify(data)}`);
                } catch (error) {
                  alert(`API Error: ${error}`);
                }
              }}
              className="btn-primary"
            >
              Test MCP API
            </button>
          </div>
          
          {/* Status */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">App Status</h2>
            <div className="space-y-2 text-green-600">
              <div>✅ Next.js App Router</div>
              <div>✅ Tailwind CSS</div>
              <div>✅ TypeScript</div>
              <div>✅ Custom CSS Classes</div>
              <div>✅ API Routes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 