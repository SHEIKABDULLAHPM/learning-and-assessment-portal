import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseSchema } from '../../features/instructor/schemas';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import Input from '../../components/ui/Input';

export default function EditCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue, // Used to set form values
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(courseSchema),
  });

  // 1. Load Course Data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await api.get(`/courses/${courseId}`);
        // Populate form
        setValue('title', data.title);
        setValue('category', data.category);
        setValue('description', data.description);
      } catch  {
        toast.error('Failed to load course details');
        navigate('/instructor/courses');
      }
    };
    fetchCourse();
  }, [courseId, setValue, navigate]);

  // 2. Handle Update
  const onSubmit = async (data) => {
    try {
      await api.put(`/courses/${courseId}`, data);
      toast.success('Course updated successfully!');
      navigate('/instructor/courses');
    } catch  {
      toast.error('Failed to update course');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button 
        onClick={() => navigate('/instructor/courses')}
        className="mb-6 flex items-center text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Courses
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Course Settings</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Course Title"
            error={errors.title}
            {...register('title')}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              {...register('category')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="Programming">Programming</option>
              <option value="Data Science">Data Science</option>
              <option value="Web Development">Web Development</option>
              <option value="Design">Design</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={4}
              {...register('description')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
             <button
              type="button"
              onClick={() => navigate('/instructor/courses')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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