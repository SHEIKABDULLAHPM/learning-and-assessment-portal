import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Video, FileText, ChevronDown, ChevronRight, ArrowLeft, File, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';


export default function CourseManagerPage() {
  const { courseId } = useParams();
  const queryClient = useQueryClient();
  
  // Modals state
  const [isModuleModalOpen, setModuleModalOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [lessonModalType, setLessonModalType] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [deletingModule, setDeletingModule] = useState(null);

  // 1. Fetch Course & Modules
  const { data: course, isLoading } = useQuery({
    queryKey: ['course-details', courseId],
    queryFn: async () => {
        const courseRes = await api.get(`/courses/${courseId}`);
        const modulesRes = await api.get(`/courses/${courseId}/modules`);
        
        // Fetch lessons for each module to display hierarchy
        const modulesWithLessons = await Promise.all(modulesRes.data.map(async (mod) => {
            const lessons = await api.get(`/modules/${mod.moduleId}/lessons`);
            return { ...mod, lessons: lessons.data };
        }));

        return { ...courseRes.data, modules: modulesWithLessons };
    }
  });

  if (isLoading) return <div className="p-8">Loading Curriculum...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <Link to="/instructor/courses" className="text-gray-500 hover:text-gray-900 flex items-center mb-4">
            <ArrowLeft className="h-4 w-4 mr-1"/> Back to Courses
        </Link>
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                <p className="text-gray-600 mt-1">{course.category}</p>
            </div>
            <button 
                onClick={() => setModuleModalOpen(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
                <Plus className="h-4 w-4 mr-2" /> Add Module
            </button>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-6">
        {course.modules.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No modules yet. Start by adding one!</p>
            </div>
        ) : (
            course.modules.map((module) => (
                <ModuleCard 
                    key={module.moduleId} 
                    module={module} 
                    onAddLesson={(type) => {
                        setActiveModuleId(module.moduleId);
                        setLessonModalType(type);
                    }}
                    onEdit={() => setEditingModule(module)}
                    onDelete={() => setDeletingModule(module)}
                />
            ))
        )}
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. Add Module Modal */}
      {isModuleModalOpen && (
        <AddModuleModal 
            courseId={courseId}
            onClose={() => setModuleModalOpen(false)}
            onSuccess={() => queryClient.invalidateQueries(['course-details', courseId])}
        />
      )}

      {/* 2. Add Lesson Modal */}
      {lessonModalType && (
        <AddLessonModal
            moduleId={activeModuleId}
            type={lessonModalType}
            onClose={() => {
                setLessonModalType(null);
                setActiveModuleId(null);
            }}
            onSuccess={() => queryClient.invalidateQueries(['course-details', courseId])}
        />
      )}

      {/* 3. Edit Module Modal */}
      {editingModule && (
        <EditModuleModal
            module={editingModule}
            onClose={() => setEditingModule(null)}
            onSuccess={() => queryClient.invalidateQueries(['course-details', courseId])}
        />
      )}

      {/* 4. Delete Module Confirmation */}
      {deletingModule && (
        <DeleteModuleModal
            module={deletingModule}
            onClose={() => setDeletingModule(null)}
            onSuccess={() => queryClient.invalidateQueries(['course-details', courseId])}
        />
      )}
    </div>
  );
}

// --- SUB COMPONENTS ---

function ModuleCard({ module, onAddLesson, onEdit, onDelete }) {
    const [isOpen, setIsOpen] = useState(true); // Default open

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Module Header */}
            <div className="p-4 bg-gray-50 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <ChevronDown className="h-5 w-5 text-gray-500"/> : <ChevronRight className="h-5 w-5 text-gray-500"/>}
                    <div>
                        <h3 className="font-semibold text-gray-900">{module.title}</h3>
                        {module.subtitle && <p className="text-sm text-gray-500">{module.subtitle}</p>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onAddLesson('VIDEO')} className="flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 text-blue-600">
                        <Video className="h-3 w-3 mr-1.5" /> Video
                    </button>
                    <button onClick={() => onAddLesson('PDF')} className="flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 text-orange-600">
                        <File className="h-3 w-3 mr-1.5" /> PDF
                    </button>
                    <button onClick={() => onAddLesson('TEXT')} className="flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 text-green-600">
                        <FileText className="h-3 w-3 mr-1.5" /> Note
                    </button>
                    <div className="border-l border-gray-300 mx-1"></div>
                    <button onClick={onEdit} className="flex items-center px-2 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-600" title="Edit Module">
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={onDelete} className="flex items-center px-2 py-1.5 text-sm bg-white border border-red-300 rounded hover:bg-red-50 text-red-600" title="Delete Module">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Lessons List */}
            {isOpen && (
                <div className="divide-y divide-gray-100">
                    {module.lessons.length === 0 ? (
                        <div className="p-4 text-sm text-gray-400 italic text-center">No content in this module yet.</div>
                    ) : (
                        module.lessons.map(lesson => (
                            <div key={lesson.lessonId} className="p-3 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className={clsx(
                                        "p-2 rounded-lg",
                                        lesson.contentType === 'VIDEO' && "bg-blue-100 text-blue-600",
                                        lesson.contentType === 'PDF' && "bg-orange-100 text-orange-600",
                                        lesson.contentType === 'TEXT' && "bg-green-100 text-green-600"
                                    )}>
                                        {lesson.contentType === 'VIDEO' && <Video className="h-4 w-4" />}
                                        {lesson.contentType === 'PDF' && <File className="h-4 w-4" />}
                                        {lesson.contentType === 'TEXT' && <FileText className="h-4 w-4" />}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{lesson.title}</span>
                                </div>
                                <span className="text-xs text-gray-400 uppercase tracking-wider">{lesson.contentType}</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// --- FORM MODALS ---

function AddModuleModal({ courseId, onClose, onSuccess }) {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm();

    const onSubmit = async (data) => {
        try {
            // Prepare payload matching Backend DTO
            const payload = {
                title: data.title,
                subtitle: data.subtitle,     // Matches 'subtitle' in ModuleRequest DTO
                moduleOrder: 1 // Backend auto-generates if needed
            };

            // Send POST request to /api/courses/{id}/modules
            await api.post(`/courses/${courseId}/modules`, payload);
            
            toast.success('Module added successfully!');
            onSuccess(); // Refetch the list
            onClose();   // Close modal
        } catch (error) {
            console.error(error);
            toast.error('Failed to add module');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Add New Module</h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Title Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Module Title</label>
                        <input 
                            {...register('title', { required: true })} 
                            placeholder="e.g., Introduction to Java" 
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                    </div>

                    {/* Subtitle Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                        <input 
                            {...register('subtitle')} 
                            placeholder="e.g., Basics and Setup" 
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Module'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AddLessonModal({ moduleId, type, onClose, onSuccess }) {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [textContent, setTextContent] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('type', type);
        
        if (type === 'VIDEO' || type === 'PDF') {
            formData.append('file', file);
        } else {
            formData.append('textContent', textContent);
        }

        try {
            await api.post(`/modules/${moduleId}/lessons`, formData);
            toast.success('Content added!');
            onSuccess();
            onClose();
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const getModalTitle = () => {
        switch (type) {
            case 'VIDEO': return 'Video Lesson';
            case 'PDF': return 'PDF Document';
            case 'TEXT': return 'Note';
            default: return 'Content';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">Add {getModalTitle()}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border p-2 rounded" required />
                    </div>

                    {type === 'VIDEO' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Video File (MP4)</label>
                            <input type="file" accept="video/mp4" onChange={e => setFile(e.target.files[0])} className="w-full border p-2 rounded" required />
                        </div>
                    )}

                    {type === 'PDF' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">PDF File</label>
                            <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} className="w-full border p-2 rounded" required />
                        </div>
                    )}

                    {type === 'TEXT' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Note Content</label>
                            <textarea value={textContent} onChange={e => setTextContent(e.target.value)} rows={6} className="w-full border p-2 rounded" placeholder="Write your notes here..." required />
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600">Cancel</button>
                        <button type="submit" disabled={uploading} className="px-4 py-2 bg-green-600 text-white rounded">
                            {uploading ? 'Saving...' : 'Add Content'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EditModuleModal({ module, onClose, onSuccess }) {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm({
        defaultValues: {
            title: module.title,
            subtitle: module.subtitle || ''
        }
    });

    const onSubmit = async (data) => {
        try {
            await api.put(`/modules/${module.moduleId}`, {
                title: data.title,
                subtitle: data.subtitle
            });
            toast.success('Module updated successfully!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update module');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Edit Module</h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Module Title</label>
                        <input 
                            {...register('title', { required: true })} 
                            placeholder="e.g., Introduction to Java" 
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                        <input 
                            {...register('subtitle')} 
                            placeholder="e.g., Basics and Setup" 
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DeleteModuleModal({ module, onClose, onSuccess }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/modules/${module.moduleId}`);
            toast.success('Module deleted successfully!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete module');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-2 text-gray-900">Delete Module</h2>
                <p className="text-gray-600 mb-4">
                    Are you sure you want to delete "<span className="font-semibold">{module.title}</span>"? 
                    This will also delete all lessons within this module. This action cannot be undone.
                </p>

                <div className="flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Module'}
                    </button>
                </div>
            </div>
        </div>
    );
}