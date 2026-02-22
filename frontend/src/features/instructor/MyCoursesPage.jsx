import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusCircle, BookOpen, Edit, Loader2, Trash2, Settings, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

export default function MyCoursesPage() {
  const queryClient = useQueryClient();

  const { data: courses, isLoading, isError } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const response = await api.get('/courses/mine');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (courseId) => {
      await api.delete(`/courses/${courseId}`);
    },
    onSuccess: () => {
      toast.success('Course deleted');
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
    },
    onError: (error) => {
      toast.error(error.response?.data || 'Failed to delete course');
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure? This will delete all modules and lessons within this course.')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load courses. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500 mt-1">Manage your curriculum and content.</p>
        </div>
        <Link
          to="/instructor/create-course"
          className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Course
        </Link>
      </div>

      {courses?.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Get started by creating your first course."
          action={
            <Link
              to="/instructor/create-course"
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Course
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses?.map((course) => (
            <div
              key={course.courseId}
              className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
            >
              {/* Thumbnail */}
              <div className="relative h-44 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Image className="h-10 w-10 mb-1" />
                    <span className="text-xs">No thumbnail</span>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <Badge variant="blue">{course.category || 'General'}</Badge>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {course.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>
                <div className="mt-3 text-xs text-gray-400">
                  Created {new Date(course.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <Link
                  to={`/instructor/courses/${course.courseId}`}
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 mr-1.5" />
                  Manage
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/instructor/edit-course/${course.courseId}`}
                    className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Edit Settings"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(course.courseId)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Course"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}