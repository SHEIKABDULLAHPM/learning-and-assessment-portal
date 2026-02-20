import { useForm } from 'react-hook-form';
import api from '../../lib/axios'; // Your Axios instance
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function CreateCourseForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/courses', data);
      console.log('Course created:', response.data);
      toast.success('Course created successfully!');
      navigate('/instructor/courses');
    } catch (error) {
      console.error('Failed to create course:', error.response?.data || error.message);
      let errorMsg = 'Failed to create course';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (typeof error.response?.data === 'string') {
        errorMsg = error.response.data;
      }
      toast.error(errorMsg);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Create New Course</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Course Title</label>
          <input 
            {...register("title", { required: "Title is required" })} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
          {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select {...register("category")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
            <option value="Domain">Domain</option>
            <option value="Programming">Programming</option>
            <option value="Data Structure">Data Structure</option>
            
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea 
            {...register("description", { required: "Description is required" })} 
            rows="4"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create Course'}
        </button>
      </form>
    </div>
  );
}