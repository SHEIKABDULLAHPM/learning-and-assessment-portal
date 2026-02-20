import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function AddModuleModal({ courseId, onClose, onSuccess }) {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm();

    const onSubmit = async (data) => {
        try {
            // Sends data to: POST /api/courses/{courseId}/modules
            await api.post(`/courses/${courseId}/modules`, {
                title: data.title,
                subtitle: data.subtitle
            });
            
            toast.success('Module added successfully!');
            onSuccess(); // Triggers the parent page to refresh the list
            onClose();   // Closes the modal
        } catch (error) {
            console.error(error);
            toast.error('Failed to create module');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Module</h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Module Title</label>
                        <input 
                            {...register('title', { required: true })} 
                            placeholder="e.g., Introduction to Java" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Subtitle (Optional)</label>
                        <input 
                            {...register('subtitle')} 
                            placeholder="e.g., Setting up the environment" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
                        >
                            {isSubmitting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                            Create Module
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}