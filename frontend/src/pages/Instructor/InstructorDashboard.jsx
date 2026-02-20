import { Link } from 'react-router-dom';
import { BookOpen, Users, TrendingUp, PlusCircle } from 'lucide-react';

export default function InstructorDashboard() {
  const stats = [
    { label: 'Total Courses', value: '0', icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Total Students', value: '0', icon: Users, color: 'bg-green-500' },
    { label: 'Published', value: '0', icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Drafts', value: '0', icon: BookOpen, color: 'bg-yellow-500' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">Welcome back! Here's an overview of your courses.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-4">
            <Link
              to="/instructor/create-course"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create New Course
            </Link>
            <Link
              to="/instructor/courses"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              View My Courses
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Courses</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p>You haven't created any courses yet.</p>
            <Link
              to="/instructor/create-course"
              className="inline-block mt-4 text-blue-600 hover:text-blue-500 font-medium"
            >
              Create Your First Course →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
