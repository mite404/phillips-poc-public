import { useState, useEffect } from "react";
import { contentApi } from "@/api/contentRoutes";

export function TestContentAPI() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTestimonials = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await contentApi.testContentAPI();
      setData(results);
      console.log("Content API Test Results:", results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to test Content API");
      console.error("Error testing Content API:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Content API Test</h2>

      <button
        onClick={fetchTestimonials}
        disabled={loading}
        className="px-4 py-2 bg-phillips-blue text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Loading..." : "Fetch Testimonials"}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <strong>Success!</strong> Fetched {Array.isArray(data) ? data.length : 0}{" "}
          testimonials
          <pre className="mt-2 text-xs overflow-auto max-h-96 bg-white p-2 rounded">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
