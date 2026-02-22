import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Plus, UploadCloud, Video, FileText, ArrowLeft, File, Edit2, Trash2, Eye, Loader2,
  PlayCircle, Download, GripVertical, HelpCircle,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import Accordion from '../../components/ui/Accordion';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import YouTubeEmbed, { getYouTubeThumbnail } from '../../components/ui/YouTubeEmbed';
import QuizModal from '../../components/ui/QuizModal';

/** Convert a Google Drive share URL to an embeddable preview URL */
function getGoogleDriveEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  return null;
}

/** Generate & download a sample CSV template */
function downloadCSVTemplate() {
  const headers = 'ModuleTitle,LessonTitle,LessonType,LessonContent';
  const sampleRows = [
    'Introduction to Java,What is Java?,VIDEO,https://www.youtube.com/watch?v=example1',
    'Introduction to Java,Java History,TEXT,Java was developed by Sun Microsystems in 1995.',
    'Introduction to Java,Java Setup Guide,PDF,https://drive.google.com/file/d/xxx/view?usp=sharing',
    'Data Types & Variables,Primitive Types,VIDEO,https://www.youtube.com/watch?v=example2',
    'Data Types & Variables,Type Casting Notes,TEXT,Implicit and explicit type casting in Java.',
  ];
  const csvContent = [headers, ...sampleRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'course_content_template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export default function CourseManagerPage() {
  const { courseId } = useParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  // Modal state
  const [isModuleModalOpen, setModuleModalOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [lessonModalType, setLessonModalType] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [deletingModule, setDeletingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [deletingLesson, setDeletingLesson] = useState(null);
  const [previewLesson, setPreviewLesson] = useState(null);
  const [quizModule, setQuizModule] = useState(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['course-details', courseId] });

  /** CSV bulk upload handler */
  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploadingCSV(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/courses/${courseId}/bulk-upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Course content uploaded successfully!');
      invalidate();
    } catch (error) {
      const msg = error.response?.data || 'Failed to upload CSV. Please check the format.';
      toast.error(typeof msg === 'string' ? msg : 'Failed to upload CSV.');
    } finally {
      setIsUploadingCSV(false);
      event.target.value = null;
    }
  };

  // Fetch course + modules + lessons
  const { data: course, isLoading } = useQuery({
    queryKey: ['course-details', courseId],
    queryFn: async () => {
      const courseRes = await api.get(`/courses/${courseId}`);
      const modulesRes = await api.get(`/courses/${courseId}/modules`);
      return { ...courseRes.data, modules: modulesRes.data };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        <span className="ml-3 text-gray-500">Loading curriculum...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-8">
        <Link to="/instructor/courses" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Courses
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="blue">{course.category}</Badge>
              <span className="text-sm text-gray-400">
                {course.modules.length} module{course.modules.length !== 1 ? 's' : ''} &middot;{' '}
                {course.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)} lesson
                {course.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Download CSV Template */}
            <button
              onClick={downloadCSVTemplate}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              <Download className="h-4 w-4 mr-2" /> CSV Template
            </button>

            {/* Hidden file input */}
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleCSVUpload}
              className="hidden"
            />

            {/* Bulk Upload Button */}
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={isUploadingCSV}
              className="inline-flex items-center px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm shadow-sm"
            >
              {isUploadingCSV ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <UploadCloud className="h-4 w-4 mr-2" />
              )}
              {isUploadingCSV ? 'Uploading...' : 'Bulk Upload CSV'}
            </button>

            {/* Add Module Button */}
            <button
              onClick={() => setModuleModalOpen(true)}
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Module
            </button>
          </div>
        </div>
      </div>

      {/* Modules (Accordion) */}
      <div className="space-y-4">
        {course.modules.length === 0 ? (
          <EmptyState
            icon={File}
            title="No modules yet"
            description="Start building your curriculum by adding a module or uploading a CSV file."
            action={
              <div className="flex gap-3">
                <button
                  onClick={downloadCSVTemplate}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" /> Download CSV Template
                </button>
                <button
                  onClick={() => setModuleModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add First Module
                </button>
              </div>
            }
          />
        ) : (
          course.modules.map((module, idx) => (
            <Accordion
              key={module.moduleId}
              title={`Module ${idx + 1}: ${module.title}`}
              badge={`${module.lessons?.length || 0} lessons`}
              defaultOpen={idx === 0}
              actions={
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setActiveModuleId(module.moduleId); setLessonModalType('VIDEO'); }}
                    className="inline-flex items-center px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md hover:bg-blue-50 text-blue-600 font-medium"
                  >
                    <Video className="h-3 w-3 mr-1" /> Video
                  </button>
                  <button
                    onClick={() => { setActiveModuleId(module.moduleId); setLessonModalType('PDF'); }}
                    className="inline-flex items-center px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md hover:bg-orange-50 text-orange-600 font-medium"
                  >
                    <File className="h-3 w-3 mr-1" /> PDF
                  </button>
                  <button
                    onClick={() => { setActiveModuleId(module.moduleId); setLessonModalType('TEXT'); }}
                    className="inline-flex items-center px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md hover:bg-green-50 text-green-600 font-medium"
                  >
                    <FileText className="h-3 w-3 mr-1" /> Note
                  </button>
                  <button
                    onClick={() => setQuizModule(module)}
                    className="inline-flex items-center px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md hover:bg-purple-50 text-purple-600 font-medium"
                  >
                    <HelpCircle className="h-3 w-3 mr-1" /> Quiz
                  </button>
                  <div className="w-px h-6 bg-gray-200 mx-1" />
                  <button
                    onClick={() => setEditingModule(module)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    title="Edit Module"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingModule(module)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete Module"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              }
            >
              {(() => {
                const videos = (module.lessons || []).filter((l) => l.contentType === 'VIDEO');
                const notes  = (module.lessons || []).filter((l) => l.contentType === 'PDF' || l.contentType === 'TEXT');

                if (videos.length === 0 && notes.length === 0) {
                  return (
                    <div className="p-6 text-center text-sm text-gray-400 italic">
                      No lessons yet. Add a video, PDF, or note above.
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-gray-100">
                    {/* Videos Section */}
                    <div>
                      <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-50/60 border-b border-blue-100">
                        <Video className="h-4 w-4 text-blue-500" />
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Videos</span>
                        <span className="text-xs text-blue-400 ml-auto">{videos.length}</span>
                      </div>
                      {videos.length === 0 ? (
                        <div className="px-5 py-3 text-xs text-gray-400 italic">No videos added</div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {videos.map((lesson) => (
                            <LessonRow
                              key={lesson.lessonId}
                              lesson={lesson}
                              moduleId={module.moduleId}
                              onPreview={() => setPreviewLesson({ ...lesson, moduleId: module.moduleId })}
                              onEdit={() => setEditingLesson({ ...lesson, moduleId: module.moduleId })}
                              onDelete={() => setDeletingLesson({ ...lesson, moduleId: module.moduleId })}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Notes & Resources Section */}
                    <div>
                      <div className="flex items-center gap-2 px-5 py-2.5 bg-green-50/60 border-b border-green-100">
                        <FileText className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Notes &amp; Resources</span>
                        <span className="text-xs text-green-400 ml-auto">{notes.length}</span>
                      </div>
                      {notes.length === 0 ? (
                        <div className="px-5 py-3 text-xs text-gray-400 italic">No notes or PDFs added</div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {notes.map((lesson) => (
                            <LessonRow
                              key={lesson.lessonId}
                              lesson={lesson}
                              moduleId={module.moduleId}
                              onPreview={() => setPreviewLesson({ ...lesson, moduleId: module.moduleId })}
                              onEdit={() => setEditingLesson({ ...lesson, moduleId: module.moduleId })}
                              onDelete={() => setDeletingLesson({ ...lesson, moduleId: module.moduleId })}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </Accordion>
          ))
        )}
      </div>

      {/* ===== MODALS ===== */}

      {isModuleModalOpen && (
        <AddModuleModal
          courseId={courseId}
          onClose={() => setModuleModalOpen(false)}
          onSuccess={invalidate}
        />
      )}

      {lessonModalType && (
        <AddLessonModal
          moduleId={activeModuleId}
          type={lessonModalType}
          onClose={() => { setLessonModalType(null); setActiveModuleId(null); }}
          onSuccess={invalidate}
        />
      )}

      {editingModule && (
        <EditModuleModal
          module={editingModule}
          onClose={() => setEditingModule(null)}
          onSuccess={invalidate}
        />
      )}

      {deletingModule && (
        <DeleteModuleModal
          module={deletingModule}
          onClose={() => setDeletingModule(null)}
          onSuccess={invalidate}
        />
      )}

      {editingLesson && (
        <EditLessonModal
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSuccess={invalidate}
        />
      )}

      {deletingLesson && (
        <DeleteLessonConfirm
          lesson={deletingLesson}
          onClose={() => setDeletingLesson(null)}
          onSuccess={invalidate}
        />
      )}

      <LessonPreviewModal
        lesson={previewLesson}
        onClose={() => setPreviewLesson(null)}
      />

      {quizModule && (
        <QuizModal
          moduleId={quizModule.moduleId}
          moduleTitle={quizModule.title}
          onClose={() => setQuizModule(null)}
        />
      )}
    </div>
  );
}

// ─── Lesson Row ──────────────────────────────────────────────────────────────

function LessonRow({ lesson, moduleId, onPreview, onEdit, onDelete }) {
  const typeConfig = {
    VIDEO: { icon: PlayCircle, bg: 'bg-blue-50', text: 'text-blue-600', label: 'Video' },
    PDF:   { icon: File,       bg: 'bg-orange-50', text: 'text-orange-600', label: 'PDF' },
    TEXT:  { icon: FileText,   bg: 'bg-green-50', text: 'text-green-600', label: 'Note' },
  };
  const config = typeConfig[lesson.contentType] || typeConfig.TEXT;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/80 transition-colors group">
      <GripVertical className="h-4 w-4 text-gray-300 shrink-0 opacity-0 group-hover:opacity-100 cursor-grab" />

      <div className={cn('p-2 rounded-lg shrink-0', config.bg, config.text)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-800 truncate block">{lesson.title}</span>
        {lesson.contentType === 'VIDEO' && lesson.videoPath && (
          <span className="text-xs text-gray-400 truncate block mt-0.5">{lesson.videoPath}</span>
        )}
        {lesson.contentType === 'PDF' && lesson.pdfPath && (
          <span className="text-xs text-gray-400 truncate block mt-0.5">Google Drive link</span>
        )}
      </div>

      {lesson.contentType === 'VIDEO' && lesson.videoPath && (
        <img
          src={getYouTubeThumbnail(lesson.videoPath)}
          alt=""
          className="h-10 w-16 rounded object-cover shrink-0 border border-gray-200"
        />
      )}

      <Badge variant={lesson.contentType === 'VIDEO' ? 'blue' : lesson.contentType === 'PDF' ? 'orange' : 'green'}>
        {config.label}
      </Badge>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onPreview} className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="Preview">
          <Eye className="h-4 w-4" />
        </button>
        <button onClick={onEdit} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700" title="Edit">
          <Edit2 className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600" title="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Lesson Preview Modal ────────────────────────────────────────────────────

function LessonPreviewModal({ lesson, onClose }) {
  if (!lesson) return null;

  return (
    <Modal isOpen={!!lesson} onClose={onClose} title={`Preview: ${lesson.title}`} size="2xl">
      {lesson.contentType === 'VIDEO' && (
        <YouTubeEmbed url={lesson.videoPath} title={lesson.title} className="aspect-video rounded-lg" />
      )}
      {lesson.contentType === 'PDF' && (
        <div className="space-y-4">
          {(() => {
            const embedUrl = getGoogleDriveEmbedUrl(lesson.pdfPath);
            if (embedUrl) {
              return (
                <>
                  <iframe
                    src={embedUrl}
                    className="w-full rounded-lg border border-gray-200"
                    style={{ height: '60vh' }}
                    title="PDF Preview"
                    allow="autoplay"
                  />
                  <a
                    href={lesson.pdfPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Download className="h-4 w-4 mr-2" /> Open in Google Drive
                  </a>
                </>
              );
            }
            return (
              <a
                href={lesson.pdfPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Download className="h-4 w-4 mr-2" /> Open Link
              </a>
            );
          })()}
        </div>
      )}
      {lesson.contentType === 'TEXT' && (
        <div className="bg-gray-50 p-6 rounded-lg whitespace-pre-wrap text-gray-800 leading-relaxed max-h-[60vh] overflow-y-auto">
          {lesson.textContent}
        </div>
      )}
    </Modal>
  );
}

// ─── Add Module Modal ────────────────────────────────────────────────────────

function AddModuleModal({ courseId, onClose, onSuccess }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await api.post(`/courses/${courseId}/modules`, { title: data.title, moduleOrder: 1 });
      toast.success('Module added successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add module');
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Add New Module">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Module Title</label>
          <input
            {...register('title', { required: true })}
            placeholder="e.g., Introduction to Java"
            className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save Module'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Add Lesson Modal ────────────────────────────────────────────────────────

function AddLessonModal({ moduleId, type, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    const params = new URLSearchParams();
    params.append('title', title);
    params.append('type', type);
    if (type === 'VIDEO') params.append('videoUrl', videoUrl);
    else if (type === 'PDF') params.append('pdfUrl', pdfUrl);
    else params.append('textContent', textContent);

    try {
      await api.post(`/modules/${moduleId}/lessons`, params);
      toast.success('Lesson added successfully!');
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to add lesson');
    } finally {
      setUploading(false);
    }
  };

  const typeLabels = { VIDEO: 'Video', PDF: 'PDF', TEXT: 'Note' };

  return (
    <Modal isOpen onClose={onClose} title={`Add ${typeLabels[type]} Lesson`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        {type === 'VIDEO' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Link</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            {videoUrl && (
              <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                <YouTubeEmbed url={videoUrl} className="aspect-video" />
              </div>
            )}
          </div>
        )}

        {type === 'PDF' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive Link</label>
            <input
              type="url"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Paste a publicly shared Google Drive link. Make sure the file is set to &ldquo;Anyone with the link can view&rdquo;.
            </p>
          </div>
        )}

        {type === 'TEXT' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note Content</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={8}
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
              required
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button type="submit" disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {uploading ? 'Saving...' : 'Add Lesson'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Edit Module Modal ───────────────────────────────────────────────────────

function EditModuleModal({ module, onClose, onSuccess }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { title: module.title },
  });

  const onSubmit = async (data) => {
    try {
      await api.put(`/modules/${module.moduleId}`, { title: data.title });
      toast.success('Module updated!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update module');
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit Module">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Module Title</label>
          <input
            {...register('title', { required: true })}
            className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Delete Module Modal ─────────────────────────────────────────────────────

function DeleteModuleModal({ module, onClose, onSuccess }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/modules/${module.moduleId}`);
      toast.success('Module deleted!');
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
    <Modal isOpen onClose={onClose} title="Delete Module">
      <p className="text-gray-600 mb-6">
        Are you sure you want to delete &ldquo;<span className="font-semibold">{module.title}</span>&rdquo;?
        This will also delete all lessons within this module. This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} disabled={isDeleting} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          Cancel
        </button>
        <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
          {isDeleting ? 'Deleting...' : 'Delete Module'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Edit Lesson Modal ───────────────────────────────────────────────────────

function EditLessonModal({ lesson, onClose, onSuccess }) {
  const [title, setTitle] = useState(lesson.title);
  const [videoUrl, setVideoUrl] = useState(lesson.videoPath || '');
  const [textContent, setTextContent] = useState(lesson.textContent || '');
  const [pdfUrl, setPdfUrl] = useState(lesson.pdfPath || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const params = new URLSearchParams();
    params.append('title', title);
    params.append('type', lesson.contentType);
    if (lesson.contentType === 'VIDEO') params.append('videoUrl', videoUrl);
    else if (lesson.contentType === 'PDF') params.append('pdfUrl', pdfUrl);
    else if (lesson.contentType === 'TEXT') params.append('textContent', textContent);

    try {
      await api.put(`/modules/${lesson.moduleId}/lessons/${lesson.lessonId}`, params);
      toast.success('Lesson updated!');
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to update lesson');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Edit Lesson: ${lesson.title}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
        </div>

        {lesson.contentType === 'VIDEO' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Link</label>
            <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
            {videoUrl && (
              <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                <YouTubeEmbed url={videoUrl} className="aspect-video" />
              </div>
            )}
          </div>
        )}

        {lesson.contentType === 'PDF' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive Link</label>
            <input type="url" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://drive.google.com/file/d/.../view?usp=sharing" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
            <p className="text-xs text-gray-400 mt-1.5">
              Paste a publicly shared Google Drive link.
            </p>
          </div>
        )}

        {lesson.contentType === 'TEXT' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note Content</label>
            <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={8} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y" required />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Delete Lesson Confirm ───────────────────────────────────────────────────

function DeleteLessonConfirm({ lesson, onClose, onSuccess }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/modules/${lesson.moduleId}/lessons/${lesson.lessonId}`);
      toast.success('Lesson deleted!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete lesson');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Delete Lesson">
      <p className="text-gray-600 mb-6">
        Are you sure you want to delete &ldquo;<span className="font-semibold">{lesson.title}</span>&rdquo;?
        This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} disabled={isDeleting} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
        <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
          {isDeleting ? 'Deleting...' : 'Delete Lesson'}
        </button>
      </div>
    </Modal>
  );
}
