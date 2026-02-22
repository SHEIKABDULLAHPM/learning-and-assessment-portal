import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Loader2, BookOpen, Image, Users, PlayCircle } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

export default function CourseList() {
  const { data: courses, isLoading, isError } = useQuery({
    queryKey: ['all-courses'],
    queryFn: async () => {
      const res = await api.get('/courses');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500">
        Unable to load courses. Please try again later.
      </div>
    );
  }

  const courseList = courses ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Explore Courses</h1>
              <p className="mt-1 text-gray-500">Browse and start learning from our collection of courses.</p>
            </div>
            <Link
              to="/student/dashboard"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              &larr; Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {courseList.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses available"
            description="Courses will appear here once instructors publish them."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseList.map((course) => (
              <div
                key={course.courseId}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-indigo-50 to-blue-100 overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Image className="h-12 w-12 mb-1" />
                      <span className="text-xs">Course Image</span>
                    </div>
                  )}
                  {/* Category badge overlay */}
                  <div className="absolute top-3 left-3">
                    <Badge variant="purple">{course.category || 'General'}</Badge>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-3 leading-relaxed flex-1">
                    {course.description}
                  </p>

                  {/* Instructor info */}
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                    <Users className="h-3.5 w-3.5" />
                    <span>By {course.instructor?.fullName || 'Instructor'}</span>
                  </div>
                </div>

                {/* Action */}
                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                  <Link
                    to={`/student/courses/${course.courseId}/learn`}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Learning
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
