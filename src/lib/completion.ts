import type { CourseEnrollment } from "@/types/models";

/**
 * True when every course in `courseSequence` has at least one enrollment
 * for this learner marked `"Completed"`.
 *
 * @param courseSequence - the program's required course ids, in order
 * @param enrollments - the learner's enrollments, already filtered to one program
 */
export function isProgramComplete(
  courseSequence: number[],
  enrollments: CourseEnrollment[],
): boolean {
  // An empty sequence is not a completed program - a program with no courses
  // has not been "finished" in any sense a learner would recognise.
  if (courseSequence.length === 0) return false;

  return courseSequence.every((courseId) =>
    enrollments.some(
      (e) => e.courseId === courseId && e.status === "Completed",
    ),
  );
}
