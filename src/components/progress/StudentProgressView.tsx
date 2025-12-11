interface StudentProgressViewProps {
  studentId: string | number;
}

export function StudentProgressView({ studentId }: StudentProgressViewProps) {
  return (
    <div className="h-full p-8">
      <h1 className="text-2xl font-bold text-slate-900">
        Progress for Student ID: {studentId}
      </h1>
      <p className="text-slate-600 mt-4">
        Student progress tracking will be implemented here.
      </p>
    </div>
  );
}
