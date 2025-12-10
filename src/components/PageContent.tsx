export function PageContent(props: {
  userType: "supervisor" | "student";
  setUserType: (userType: "supervisor" | "student" | null) => void;
}) {
  const { userType, setUserType } = props;

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <h1>Phillips Dashboard</h1>
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
