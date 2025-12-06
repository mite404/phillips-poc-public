/**
 * CatalogColumn Component
 * The "Inventory" view where Supervisors search and select courses
 */

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CourseCard } from '@/components/common/CourseCard';
import { getCatalog } from '@/api/legacyRoutes';
import type { CourseCatalogItem } from '@/types/models';

type LevelFilter = 'All' | 'Basic' | 'Advanced';

export function CatalogColumn() {
  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('All');

  // Fetch courses on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const data = await getCatalog();
        setCourses(data);
        setError(null);
      } catch (err) {
        setError('Failed to load course catalog');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, []);

  // Filter courses based on search and level
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.courseTitle
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesLevel = levelFilter === 'All' || course.levelName === levelFilter;

    return matchesSearch && matchesLevel;
  });

  // Handle add course (placeholder for now)
  const handleAddCourse = (course: CourseCatalogItem) => {
    console.log('Add course to program:', course);
    // TODO: Dispatch to ProgramContext in PR-03
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-phillips-blue mb-2">Course Catalog</h2>
        <p className="text-sm text-muted-foreground">
          Browse and add courses to build your program
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 mb-6">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Level Filter */}
        <div className="flex gap-2">
          <span className="text-sm font-medium self-center mr-2">Level:</span>
          {(['All', 'Basic', 'Advanced'] as LevelFilter[]).map((level) => (
            <Button
              key={level}
              size="sm"
              variant={levelFilter === level ? 'default' : 'outline'}
              onClick={() => setLevelFilter(level)}
              className={levelFilter === level ? 'bg-phillips-blue hover:bg-phillips-blue/90' : ''}
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Course Grid */}
      {!loading && !error && (
        <>
          {/* Results Count */}
          <div className="mb-4 text-sm text-muted-foreground">
            {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} found
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <CourseCard
                  key={course.courseId}
                  course={course}
                  onAdd={handleAddCourse}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No courses found matching your criteria
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
