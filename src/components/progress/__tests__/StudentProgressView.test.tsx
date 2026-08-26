import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import type {
  CourseCatalogItem,
  CourseEnrollment,
  LearnerProfile,
  ProgramAssignment,
  SupervisorProgram,
} from "@/types/models";

vi.mock("@/api/legacyRoutes", () => ({
  legacyApi: {
    getRoster: vi.fn(),
    getCatalog: vi.fn(),
  },
}));

vi.mock("@/api/localRoutes", () => ({
  localApi: {
    getAssignments: vi.fn(),
    getEnrollments: vi.fn(),
    getAllPrograms: vi.fn(),
  },
}));

import { legacyApi } from "@/api/legacyRoutes";
import { localApi } from "@/api/localRoutes";
import { StudentProgressView } from "../StudentProgressView";

// Radix's popper measures its trigger; jsdom has no ResizeObserver.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

const LEARNER_ID = "learner-guid-1";

const student: LearnerProfile = {
  learner_Data_Id: 1,
  learnerId: LEARNER_ID,
  learnerName: "Dana Reyes",
  emailId: "dana@example.com",
  location: "Chicago",
  status: "Active",
  currentEnrollment: null,
};

const program: SupervisorProgram = {
  id: "prog-1",
  supervisorId: "sup-1",
  programName: "CNC Fundamentals",
  description: "",
  tags: [],
  courseSequence: [11, 116],
  published: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const catalog: CourseCatalogItem[] = [
  {
    courseId: 11,
    courseTitle: "Haas CNC Maintenance",
    levelName: "Basic",
    trainingTypeName: "ILT",
    totalDays: 5,
    hours: null,
    previewImageUrl: null,
    prices: [{ isFree: true }],
  },
  {
    courseId: 116,
    courseTitle: "Advanced Mill Programming",
    levelName: "Advanced",
    trainingTypeName: "eLearning",
    totalDays: 2,
    hours: null,
    previewImageUrl: null,
    prices: [{ isFree: true }],
  },
];

const assignment: ProgramAssignment = {
  id: "assign-1",
  learnerId: LEARNER_ID,
  programId: "prog-1",
  assignedDate: "2026-01-02T00:00:00.000Z",
  status: "Registered",
};

// Course 11 is enrolled ("Incomplete"), course 116 is not ("Not Enrolled").
const enrollment: CourseEnrollment = {
  id: "enroll-1",
  learnerId: LEARNER_ID,
  programId: "prog-1",
  courseId: 11,
  classId: 900,
  enrolledDate: "2026-01-03T00:00:00.000Z",
};

const mocked = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

// Renders the view and waits for the fetched rows to land in the table.
async function renderView() {
  render(<StudentProgressView studentId={LEARNER_ID} />);
  await screen.findByText("Haas CNC Maintenance");
}

// Reads a MetricCard's number. title -> CardHeader -> Card -> CardContent.
function metricValue(title: string) {
  const card = screen.getByText(title).parentElement?.parentElement;
  return card?.lastElementChild?.textContent;
}

// Opens a Radix dropdown by its trigger name and returns the open menu.
async function openMenu(name: RegExp | string) {
  fireEvent.pointerDown(
    screen.getByRole("button", { name }),
    new MouseEvent("pointerdown", { bubbles: true }),
  );
  return await screen.findByRole("menu");
}

describe("StudentProgressView table", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked(legacyApi.getRoster).mockResolvedValue([student]);
    mocked(legacyApi.getCatalog).mockResolvedValue(catalog);
    mocked(localApi.getAssignments).mockResolvedValue([assignment]);
    mocked(localApi.getEnrollments).mockResolvedValue([enrollment]);
    mocked(localApi.getAllPrograms).mockResolvedValue([program]);
  });

  it("renders one row per assigned course with its status", async () => {
    await renderView();

    expect(screen.getByText("Advanced Mill Programming")).toBeInTheDocument();
    expect(screen.getByText("Incomplete")).toBeInTheDocument();
    expect(screen.getByText("Not Enrolled")).toBeInTheDocument();
  });

  it("shows the filter-specific empty state when nothing matches", async () => {
    await renderView();

    const search = screen.getByPlaceholderText("Filter courses...");
    fireEvent.change(search, { target: { value: "zzz-no-such-course" } });

    expect(await screen.findByText("No courses match your filters")).toBeInTheDocument();
    expect(screen.queryByText("Haas CNC Maintenance")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    expect(await screen.findByText("Haas CNC Maintenance")).toBeInTheDocument();
  });

  it("narrows rows by search text", async () => {
    await renderView();

    fireEvent.change(screen.getByPlaceholderText("Filter courses..."), {
      target: { value: "mill" },
    });

    await waitFor(() =>
      expect(screen.queryByText("Haas CNC Maintenance")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Advanced Mill Programming")).toBeInTheDocument();
  });

  it("hiding a column drops its cells but leaves the rest of the row intact", async () => {
    await renderView();

    const rowFor = (title: string) => screen.getByText(title).closest("tr") as HTMLElement;
    expect(within(rowFor("Haas CNC Maintenance")).getByText("Incomplete")).toBeInTheDocument();

    const menu = await openMenu(/view/i);
    fireEvent.click(within(menu).getByRole("menuitemcheckbox", { name: "Status" }));

    await waitFor(() => expect(screen.queryByText("Incomplete")).not.toBeInTheDocument());

    const row = rowFor("Haas CNC Maintenance");
    expect(within(row).getByText("#11")).toBeInTheDocument();
    expect(within(row).getByText("Basic")).toBeInTheDocument();
    expect(within(row).getByText("CNC Fundamentals")).toBeInTheDocument();
    expect(screen.getByText("Advanced Mill Programming")).toBeInTheDocument();
  });

  it("feeds the Programs Assigned metric from the same filter as the table", async () => {
    // Two programs, and a search only one survives, so a stale predicate here would show.
    const safety: SupervisorProgram = { ...program, id: "prog-2", programName: "Safety Track" };
    const safetyCourse: CourseCatalogItem = {
      ...catalog[0],
      courseId: 300,
      courseTitle: "Lockout Tagout",
    };
    mocked(localApi.getAllPrograms).mockResolvedValue([
      { ...program, courseSequence: [11] },
      { ...safety, courseSequence: [300] },
    ]);
    mocked(localApi.getAssignments).mockResolvedValue([
      assignment,
      { ...assignment, id: "assign-2", programId: "prog-2" },
    ]);
    mocked(legacyApi.getCatalog).mockResolvedValue([catalog[0], safetyCourse]);

    await renderView();

    await waitFor(() => expect(metricValue("Programs Assigned")).toBe("2"));

    fireEvent.change(screen.getByPlaceholderText("Filter courses..."), {
      target: { value: "lockout" },
    });

    await waitFor(() => expect(metricValue("Programs Assigned")).toBe("1"));
  });

  it("sorts by level ascending and descending", async () => {
    await renderView();

    const levelOrder = () =>
      screen
        .getAllByRole("row")
        .slice(1)
        .map((r) => within(r).getByText(/Haas CNC Maintenance|Advanced Mill Programming/).textContent);

    expect(levelOrder()).toEqual(["Haas CNC Maintenance", "Advanced Mill Programming"]);

    const menu = await openMenu(/^level/i);
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Desc" }));

    await waitFor(() =>
      expect(levelOrder()).toEqual(["Advanced Mill Programming", "Haas CNC Maintenance"]),
    );
  });
});
