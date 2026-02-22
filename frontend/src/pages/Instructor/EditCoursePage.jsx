import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseSchema } from '../../features/instructor/schemas';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { Save, Loader2, ArrowLeft, Image } from 'lucide-react';
import Input from '../../components/ui/Input';

export default function EditCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(courseSchema),
  });

  const thumbnailUrl = watch('thumbnail');

  // Load Course Data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await api.get(`/courses/${courseId}`);
        setValue('title', data.title);
        setValue('category', data.category);
        setValue('description', data.description);
        setValue('thumbnail', data.thumbnail || '');
      } catch {
        toast.error('Failed to load course details');
        navigate('/instructor/courses');
      }
    };
    fetchCourse();
  }, [courseId, setValue, navigate]);

  const onSubmit = async (data) => {
    try {
      await api.put(`/courses/${courseId}`, data);
      toast.success('Course updated successfully!');
      navigate('/instructor/courses');
    } catch {
      toast.error('Failed to update course');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/instructor/courses')}
        className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Courses
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Edit Course Settings</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Thumbnail */}
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

          <Input label="Course Title" error={errors.title} {...register('title')} />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              {...register('category')}
              className="block w-full rounded-lg border border-gray-300 shadow-sm p-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="Programming">Programming</option>
              <option value="Data Science">Data Science</option>
              <option value="Web Development">Web Development</option>
              <option value="Design">Design</option>
              <option value="Domain">Domain</option>
              <option value="Data Structure">Data Structure</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={4}
              {...register('description')}
              className="block w-full rounded-lg border border-gray-300 shadow-sm p-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-sm resize-y outline-none"
            />
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
              {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}