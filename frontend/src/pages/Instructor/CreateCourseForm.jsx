import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Image, Loader2 } from 'lucide-react';

export default function CreateCourseForm() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();
  const thumbnailUrl = watch('thumbnail');

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/courses', data);
      console.log('Course created:', response.data);
      toast.success('Course created successfully!');
      navigate('/instructor/courses');
    } catch (error) {
      console.error('Failed to create course:', error.response?.data || error.message);
      let errorMsg = 'Failed to create course';
      if (error.response?.data?.message) errorMsg = error.response.data.message;
      else if (error.response?.data?.error) errorMsg = error.response.data.error;
      else if (typeof error.response?.data === 'string') errorMsg = error.response.data;
      toast.error(errorMsg);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/instructor/courses" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Courses
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">Create New Course</h2>
          <p className="text-sm text-gray-500 mt-1">Fill in the details below to create your course.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Thumbnail Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
            <input
              {...register('thumbnail')}
              placeholder="https://example.com/thumbnail.jpg"
              className="block w-full rounded-lg border border-gray-300 shadow-sm p-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <div className="mt-3 h-40 rounded-lg border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <Image className="h-8 w-8 mb-1" />
                  <span className="text-xs">Thumbnail preview</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="block w-full rounded-lg border border-gray-300 shadow-sm p-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              {...register('category')}
              className="block w-full rounded-lg border border-gray-300 shadow-sm p-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="Domain">Domain</option>
              <option value="Programming">Programming</option>
              <option value="Data Structure">Data Structure</option>
              <option value="Web Development">Web Development</option>
              <option value="Data Science">Data Science</option>
              <option value="Design">Design</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={4}
              className="block w-full rounded-lg border border-gray-300 shadow-sm p-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-y"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/instructor/courses')}
              className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              {isSubmitting ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}