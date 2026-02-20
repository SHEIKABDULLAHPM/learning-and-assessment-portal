import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlayCircle, FileText, CheckCircle, Menu } from 'lucide-react';
import clsx from 'clsx';
import api from '../../lib/axios';

export default function CoursePlayerPage() {
  const { courseId } = useParams();
  const [activeLesson, setActiveLesson] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 1. Fetch Course Structure (Modules + Lessons)
  const { data: modules, isLoading } = useQuery({
    queryKey: ['course-content', courseId],
    queryFn: async () => {
      // We need a specific endpoint that returns nested modules -> lessons
      // For now, let's assume we fetch modules and map lessons manually or use a DTO
      const res = await api.get(`/courses/${courseId}/modules`); 
      
      // Fetch lessons for each module (In a real app, use a "CourseStructureDTO" to get all in one call)
      const modulesWithLessons = await Promise.all(res.data.map(async (mod) => {
        const lessons = await api.get(`/modules/${mod.moduleId}/lessons`);
        return { ...mod, lessons: lessons.data };
      }));
      
      return modulesWithLessons;
    },
  });

  // Set first lesson as active on load
  useEffect(() => {
    if (modules?.length && modules[0].lessons?.length && !activeLesson) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveLesson(modules[0].lessons[0]);
    }
  }, [modules, activeLesson]);

  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading Content...</div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* Sidebar - Lesson Navigation */}
      <aside className={clsx(
        "bg-white w-80 border-r border-gray-200 shrink-0 transition-all duration-300 absolute inset-y-0 z-20 md:relative",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:border-none"
      )}>
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-800">Course Content</h2>
        </div>
        <div className="overflow-y-auto h-full pb-20">
          {modules?.map((module, index) => (
            <div key={module.moduleId} className="border-b border-gray-100">
              <div className="p-4 bg-gray-50">
                <div className="font-medium text-sm text-gray-900">Module {index + 1}: {module.title}</div>
                {/* Display Subtitle for Student */}
                {module.subtitle && <div className="text-xs text-gray-500 mt-1">{module.subtitle}</div>}
              </div>
              <div>
                {module.lessons?.map((lesson) => (
                  <button
                    key={lesson.lessonId}
                    onClick={() => setActiveLesson(lesson)}
                    className={clsx(
                      "w-full flex items-center p-3 text-sm hover:bg-blue-50 transition-colors text-left gap-3",
                      activeLesson?.lessonId === lesson.lessonId ? "bg-blue-100 text-blue-700" : "text-gray-600"
                    )}
                  >
                    {lesson.contentType === 'VIDEO' ? <PlayCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    <span className="truncate">{lesson.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Toggle Button for Mobile */}
        <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-4 left-4 z-10 bg-white p-2 rounded-full shadow md:hidden"
        >
            <Menu className="h-5 w-5" />
        </button>

        {/* Player Container */}
        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
          {activeLesson ? (
            <ContentRenderer lesson={activeLesson} />
          ) : (
            <div className="text-white">Select a lesson to start</div>
          )}
        </div>

        {/* Lesson Details Footer */}
        {activeLesson && (
            <div className="h-24 bg-white border-t p-6 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold">{activeLesson.title}</h1>
                    <p className="text-gray-500 text-sm">Module: {activeLesson.module?.title || 'Current Module'}</p>
                </div>
                <button className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Complete
                </button>
            </div>
        )}
      </main>
    </div>
  );
}

// Sub-component to handle Video vs PDF vs Text
function ContentRenderer({ lesson }) {
    // Construct the Streaming URL
    // e.g., http://localhost:8080/api/modules/1/lessons/5/content
    const contentUrl = `http://localhost:8080/api/modules/${lesson.module?.moduleId || 'x'}/lessons/${lesson.lessonId}/content`;

    if (lesson.contentType === 'VIDEO') {
        return (
            <div className="flex flex-col h-full bg-black">
                <video 
                    key={lesson.lessonId}
                    controls 
                    className="w-full h-full max-h-[80vh] outline-none" 
                    src={contentUrl}
                />
                <div className="p-4 bg-gray-900 text-white">
                    <h2 className="text-xl font-semibold">{lesson.title}</h2>
                </div>
            </div>
        );
    }

    // Handle Notes (TEXT)
    if (lesson.contentType === 'TEXT') {
        return (
            <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
                <div className="bg-white shadow-sm border p-8 rounded-xl min-h-[50vh]">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-4">{lesson.title}</h1>
                    <div className="prose prose-blue max-w-none text-gray-700 whitespace-pre-wrap">
                        {lesson.textContent}
                    </div>
                </div>
            </div>
        );
    }

    if (lesson.contentType === 'PDF') {
        return (
            <iframe 
                src={contentUrl} 
                className="w-full h-full" 
                title="PDF Viewer"
            />
        );
    }

    return <div>Unsupported Content</div>;
}