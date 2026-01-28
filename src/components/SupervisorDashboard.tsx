import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { MetricCard } from "./MetricCard";
import { localApi } from "@/api/localRoutes";
import { legacyApi } from "@/api/legacyRoutes";
import { Users, FileText, UserCheck, CheckCircle, Plus } from "lucide-react";
import type { DashboardMetrics } from "@/types/models";

export function SupervisorDashboard({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalStudents: 0,
    pendingInvites: 0,
    enrolledStudents: 0,
    programsCreated: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      setIsLoading(true);

      // Fetch data from APIs
      const [roster, assignments, enrollments, programs] = await Promise.all([
        legacyApi.getRoster(),
        localApi.getAssignments(),
        localApi.getEnrollments(),
        localApi.getAllPrograms(),
      ]);

      // Calculate metrics
      const totalStudents = roster.length;

      // Pending invites: students with assignments but no enrollments
      const studentsWithAssignments = new Set(assignments.map((a) => a.learnerId));
      const studentsWithEnrollments = new Set(enrollments.map((e) => e.learnerId));
      const pendingInvites = Array.from(studentsWithAssignments).filter(
        (id) => !studentsWithEnrollments.has(id),
      ).length;

      // Enrolled students: unique students with at least one enrollment
      const enrolledStudents = studentsWithEnrollments.size;

      // Programs created (published only)
      const programsCreated = programs.filter((p) => p.published).length;

      setMetrics({
        totalStudents,
        pendingInvites,
        enrolledStudents,
        programsCreated,
      });
    } catch (error) {
      console.error("Failed to load dashboard metrics:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-full p-8 overflow-y-auto">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-foreground">Supervisor Dashboard</h1>
        <Button size="lg" onClick={() => onNavigate("builder")} className="gap-2">
          <Plus className="h-5 w-5" />
          Create Program
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Students"
          value={metrics.totalStudents}
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <MetricCard
          title="Pending Invites"
          value={metrics.pendingInvites}
          icon={<UserCheck className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
          highlight={metrics.pendingInvites > 0}
        />
        <MetricCard
          title="Enrolled Students"
          value={metrics.enrolledStudents}
          icon={<CheckCircle className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <MetricCard
          title="Programs Created"
          value={metrics.programsCreated}
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      {/* Quick Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline" onClick={() => onNavigate("builder")}>
            Create New Program
          </Button>
          <Button variant="outline" disabled>
            View All Students
          </Button>
          <Button variant="outline" disabled>
            Generate Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
