import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusCircle, BookOpen, Edit, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function MyCoursesPage() {
  const queryClient = useQueryClient();

  const { data: courses, isLoading, isError } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (courseId) => {
      await api.delete(`/courses/${courseId}`);
    },
    onSuccess: () => {
      toast.success('Course deleted');
      queryClient.invalidateQueries(['courses']);
    },
    onError: (error) => {
      toast.error(error.response?.data || 'Failed to delete course');
    }
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure? This will delete all modules and lessons within this course.")) {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600">Manage your curriculum and content.</p>
        </div>
        <Link
          to="/instructor/create-course"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Course
        </Link>
      </div>

      {courses?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No courses yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first course.</p>
          <div className="mt-6">
            <Link
              to="/instructor/create-course"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Create Course
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course) => (
            <div
              key={course.courseId}
              className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {course.category || 'General'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {course.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {course.description}
                </p>
              </div>

              <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center">
                <Link
                  to={`/instructor/courses/${course.courseId}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-900"
                >
                  Manage Content
                </Link>

                <div className="flex space-x-3">
                  <Link
                    to={`/instructor/edit-course/${course.courseId}`}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Edit Settings"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>

                  <button
                    onClick={() => handleDelete(course.courseId)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Course"
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