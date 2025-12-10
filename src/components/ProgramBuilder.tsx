export function ProgramBuilder() {
  return (
    <div className="flex h-full gap-4">
      {/* Left Column - My Program (60%) */}
      <div className="flex-[0.6] flex flex-col border border-slate-300 rounded-lg">
        {/* Header */}
        <div className="p-4 border-b border-slate-300">
          <input
            type="text"
            placeholder="My Program (Click to rename...)"
            className="w-full text-xl font-semibold bg-transparent border-none outline-none focus:ring-0"
          />
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-center h-full text-slate-400 text-lg">
            Insert Courses Here...
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="p-4 border-t border-slate-300 bg-white">
          <button className="bg-phillips-blue text-white px-6 py-2 rounded hover:bg-blue-700">
            Save Draft
          </button>
        </div>
      </div>

      {/* Right Column - Course Catalog (40%) */}
      <div className="flex-[0.4] flex flex-col border border-slate-300 rounded-lg">
        {/* Header */}
        <div className="p-4 border-b border-slate-300 space-y-3">
          <h2 className="text-xl font-semibold">Course Catalog</h2>
          <input
            type="text"
            placeholder="Search courses..."
            className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-phillips-blue"
          />
          <div className="flex gap-2">
            {/* Placeholder for filter buttons */}
            <div className="text-sm text-slate-400">Filter buttons here...</div>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-center h-full text-slate-400">
            Course list will appear here...
          </div>
        </div>
      </div>
    </div>
  );
}
