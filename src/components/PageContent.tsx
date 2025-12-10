export function PageContent(props: {
  userType: "supervisor" | "student";
  setUserType: (userType: "supervisor" | "student" | null) => void;
}) {
  const { userType, setUserType } = props;

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <header className="w-full flex justify-center py-4 border-b border-slate-600">
        <h1 className="text-2xl font-bold">Phillips Education</h1>
      </header>
      <p>Your content here...</p>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 active:bg-blue-600 mx-auto"
        onClick={() => setUserType(null)}
      >
        Back
      </button>
    </main>
  );
}
