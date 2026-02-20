import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Award, Clock } from 'lucide-react';

export default function StudentDashboard() {
  const stats = [
    { label: 'Enrolled Courses', value: '0', icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Completed', value: '0', icon: GraduationCap, color: 'bg-green-500' },
    { label: 'In Progress', value: '0', icon: Clock, color: 'bg-yellow-500' },
    { label: 'Certificates', value: '0', icon: Award, color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
              <p className="mt-1 text-gray-500">Here's what's happening with your learning journey</p>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                to="/student/courses"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Courses
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Continue Learning</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-8 text-gray-500">
              <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p>You haven't enrolled in any courses yet.</p>
              <Link
                to="/student/courses"
                className="inline-block mt-4 text-blue-600 hover:text-blue-500 font-medium"
              >
                Explore Courses →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
