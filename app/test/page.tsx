export default function TestPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          OpenWork AI - Test Page
        </h1>
        <p className="text-gray-600 text-lg">
          If you can see this, the server is working correctly!
        </p>
        <div className="mt-8 space-y-2">
          <p className="text-sm text-gray-500">Server Status: ✅ Running</p>
          <p className="text-sm text-gray-500">CSS: ✅ Loaded</p>
          <p className="text-sm text-gray-500">React: ✅ Working</p>
        </div>
        <a 
          href="/unified" 
          className="mt-8 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Main App
        </a>
      </div>
    </div>
  );
}
