/**
 * ProgramContext
 * Manages the state for building a supervisor program (draft mode)
 */

import { createContext, useContext, useReducer, ReactNode } from "react";
import type { CourseCatalogItem } from "@/types/models";

interface SelectedCourse extends CourseCatalogItem {
  sequenceOrder: number;
}

interface ProgramState {
  title: string;
  description: string;
  selectedCourses: SelectedCourse[];
}

type ProgramAction =
  | { type: "SET_TITLE"; payload: string }
  | { type: "SET_DESCRIPTION"; payload: string }
  | { type: "ADD_COURSE"; payload: CourseCatalogItem }
  | { type: "REMOVE_COURSE"; payload: number } // courseId
  | { type: "REORDER_COURSES"; payload: { fromIndex: number; toIndex: number } }
  | { type: "RESET" };

interface ProgramContextType {
  state: ProgramState;
  dispatch: React.Dispatch<ProgramAction>;
  // Computed values
  totalDuration: number;
  totalHours: number;
}

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

const initialState: ProgramState = {
  title: "Untitled Program",
  description: "",
  selectedCourses: [],
};

function programReducer(state: ProgramState, action: ProgramAction): ProgramState {
  switch (action.type) {
    case "SET_TITLE":
      return { ...state, title: action.payload };

    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };

    case "ADD_COURSE": {
      // Check if course already exists
      if (state.selectedCourses.some((c) => c.courseId === action.payload.courseId)) {
        return state;
      }

      const newCourse: SelectedCourse = {
        ...action.payload,
        sequenceOrder: state.selectedCourses.length + 1,
      };

      return {
        ...state,
        selectedCourses: [...state.selectedCourses, newCourse],
      };
    }

    case "REMOVE_COURSE": {
      const filtered = state.selectedCourses.filter(
        (c) => c.courseId !== action.payload
      );

      // Re-index sequence order
      const reindexed = filtered.map((course, index) => ({
        ...course,
        sequenceOrder: index + 1,
      }));

      return {
        ...state,
        selectedCourses: reindexed,
      };
    }

    case "REORDER_COURSES": {
      const { fromIndex, toIndex } = action.payload;
      const courses = [...state.selectedCourses];
      const [movedCourse] = courses.splice(fromIndex, 1);
      courses.splice(toIndex, 0, movedCourse);

      // Re-index sequence order
      const reindexed = courses.map((course, index) => ({
        ...course,
        sequenceOrder: index + 1,
      }));

      return {
        ...state,
        selectedCourses: reindexed,
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export function ProgramProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(programReducer, initialState);

  // Calculate total duration (days for ILT courses)
  const totalDuration = state.selectedCourses.reduce((sum, course) => {
    return course.trainingTypeName === "ILT" ? sum + course.totalDays : sum;
  }, 0);

  // Calculate total hours (for eLearning courses)
  const totalHours = state.selectedCourses.reduce((sum, course) => {
    return course.trainingTypeName === "eLearning" && course.hours
      ? sum + course.hours
      : sum;
  }, 0);

  return (
    <ProgramContext.Provider value={{ state, dispatch, totalDuration, totalHours }}>
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgram() {
  const context = useContext(ProgramContext);
  if (!context) {
    throw new Error("useProgram must be used within a ProgramProvider");
  }
  return context;
}
