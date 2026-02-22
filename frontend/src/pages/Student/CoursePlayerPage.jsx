import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PlayCircle, FileText, File, CheckCircle, Menu, X, ChevronDown,
  ChevronLeft, ChevronRight, Download, ArrowLeft, BookOpen, Video, HelpCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../lib/axios';
import YouTubeEmbed from '../../components/ui/YouTubeEmbed';
import Modal from '../../components/ui/Modal';

/** Convert a Google Drive share URL to an embeddable preview URL */
function getGoogleDriveEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  return null;
}

export default function CoursePlayerPage() {
  const { courseId } = useParams();
  const [activeLesson, setActiveLesson] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});

  // Fetch course structure
  const { data: course, isLoading } = useQuery({
    queryKey: ['course-player', courseId],
    queryFn: async () => {
      const courseRes = await api.get(`/courses/${courseId}`);
      const modulesRes = await api.get(`/courses/${courseId}/modules`);
      // Modules already include lessons via JPA @OneToMany, no extra fetch needed
      return { ...courseRes.data, modules: modulesRes.data };
    },
  });

  // Flatten all lessons for prev/next navigation
  const allLessons = useMemo(() => {
    if (!course?.modules) return [];
    return course.modules.flatMap((mod) =>
      (mod.lessons || []).map((lesson) => ({ ...lesson, moduleName: mod.title, moduleId: mod.moduleId }))
    );
  }, [course]);

  const currentIndex = allLessons.findIndex((l) => l.lessonId === activeLesson?.lessonId);

  // Set first lesson active on load & expand all modules
  useEffect(() => {
    if (course?.modules?.length && !activeLesson) {
      const initial = {};
      course.modules.forEach((m) => { initial[m.moduleId] = true; });
      setExpandedModules(initial);
      if (course.modules[0].lessons?.length) {
        const first = course.modules[0].lessons[0];
        setActiveLesson({ ...first, moduleName: course.modules[0].title, moduleId: course.modules[0].moduleId });
      }
    }
  }, [course, activeLesson]);

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const navigateLesson = (direction) => {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < allLessons.length) {
      setActiveLesson(allLessons[newIndex]);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <BookOpen className="h-10 w-10 text-blue-600 mx-auto animate-pulse mb-3" />
          <p className="text-gray-500">Loading course content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* ─── Sidebar ─── */}
      <aside
        className={cn(
          'bg-white border-r border-gray-200 flex flex-col shrink-0 transition-all duration-300',
          'absolute inset-y-0 z-30 md:relative',
          sidebarOpen ? 'w-80 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-none'
        )}
      >
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900 truncate text-sm">{course?.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{allLessons.length} lessons</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1 rounded hover:bg-gray-200 md:hidden">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Module accordion list */}
        <div className="flex-1 overflow-y-auto">
          {course?.modules?.map((module, idx) => (
            <div key={module.moduleId} className="border-b border-gray-100">
              {/* Module header */}
              <button
                onClick={() => toggleModule(module.moduleId)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="min-w-0">
                  <span className="text-xs font-medium text-blue-600">MODULE {idx + 1}</span>
                  <p className="text-sm font-semibold text-gray-800 truncate">{module.title}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">{module.lessons?.length || 0}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-gray-400 transition-transform',
                      expandedModules[module.moduleId] && 'rotate-180'
                    )}
                  />
                </div>
              </button>

              {/* Lessons – split into Videos & Notes */}
              {expandedModules[module.moduleId] && (
                <div className="bg-gray-50/50">
                  {module.lessons?.length === 0 ? (
                    <div className="px-4 py-2 text-xs text-gray-400 italic">No lessons</div>
                  ) : (
                    (() => {
                      const videos = (module.lessons || []).filter((l) => l.contentType === 'VIDEO');
                      const notes  = (module.lessons || []).filter((l) => l.contentType === 'PDF' || l.contentType === 'TEXT');
                      return (
                        <div className="divide-y divide-gray-100">
                          {/* Videos */}
                          {videos.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50/70">
                                <Video className="h-3.5 w-3.5 text-blue-500" />
                                <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Videos</span>
                                <span className="text-[11px] text-blue-400 ml-auto">{videos.length}</span>
                              </div>
                              {videos.map((lesson) => {
                                const isActive = activeLesson?.lessonId === lesson.lessonId;
                                return (
                                  <button
                                    key={lesson.lessonId}
                                    onClick={() => setActiveLesson({ ...lesson, moduleName: module.title, moduleId: module.moduleId })}
                                    className={cn(
                                      'w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors text-left',
                                      isActive
                                        ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                                        : 'text-gray-600 hover:bg-gray-100 border-l-2 border-transparent'
                                    )}
                                  >
                                    <PlayCircle className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{lesson.title}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Notes & Resources */}
                          {notes.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 px-4 py-1.5 bg-green-50/70">
                                <FileText className="h-3.5 w-3.5 text-green-500" />
                                <span className="text-[11px] font-semibold text-green-600 uppercase tracking-wide">Notes &amp; Resources</span>
                                <span className="text-[11px] text-green-400 ml-auto">{notes.length}</span>
                              </div>
                              {notes.map((lesson) => {
                                const isActive = activeLesson?.lessonId === lesson.lessonId;
                                return (
                                  <button
                                    key={lesson.lessonId}
                                    onClick={() => setActiveLesson({ ...lesson, moduleName: module.title, moduleId: module.moduleId })}
                                    className={cn(
                                      'w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors text-left',
                                      isActive
                                        ? 'bg-green-50 text-green-700 border-l-2 border-green-600'
                                        : 'text-gray-600 hover:bg-gray-100 border-l-2 border-transparent'
                                    )}
                                  >
                                    {lesson.contentType === 'PDF' ? (
                                      <File className="h-4 w-4 shrink-0" />
                                    ) : (
                                      <FileText className="h-4 w-4 shrink-0" />
                                    )}
                                    <span className="truncate">{lesson.title}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Quiz button */}
                          <div className="px-4 py-3">
                            <Link
                              to={`/student/courses/${courseId}/modules/${module.moduleId}/quiz`}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
                            >
                              <HelpCircle className="h-4 w-4" />
                              Take Quiz
                            </Link>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Back link */}
        <div className="p-3 border-t border-gray-200 shrink-0">
          <Link
            to="/student/courses"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> All Courses
          </Link>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Mobile toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-3 left-3 z-20 bg-white p-2 rounded-lg shadow-md border border-gray-200 md:hidden"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>

        {/* Content area */}
        <div className="flex-1 overflow-auto bg-gray-900">
          {activeLesson ? (
            <ContentRenderer lesson={activeLesson} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <BookOpen className="h-12 w-12 mb-2" />
              <p>Select a lesson to begin</p>
            </div>
          )}
        </div>

        {/* Bottom bar: lesson info + navigation */}
        {activeLesson && (
          <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">{activeLesson.title}</h2>
              <p className="text-sm text-gray-400">{activeLesson.moduleName}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Notes button (for lessons with notes/PDF) */}
              {(activeLesson.contentType === 'TEXT' || activeLesson.contentType === 'PDF') && (
                <button
                  onClick={() => setNotesModalOpen(true)}
                  className="inline-flex items-center px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  {activeLesson.contentType === 'PDF' ? 'View PDF' : 'View Notes'}
                </button>
              )}

              {/* Prev / Next */}
              <button
                onClick={() => navigateLesson(-1)}
                disabled={currentIndex <= 0}
                className="inline-flex items-center px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </button>
              <button
                onClick={() => navigateLesson(1)}
                disabled={currentIndex >= allLessons.length - 1}
                className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Notes Modal */}
      {activeLesson && (
        <NotesDownloadModal
          isOpen={notesModalOpen}
          onClose={() => setNotesModalOpen(false)}
          lesson={activeLesson}
        />
      )}
    </div>
  );
}

// ─── Content Renderer ────────────────────────────────────────────────────────

function ContentRenderer({ lesson }) {
  if (lesson.contentType === 'VIDEO') {
    return (
      <div className="flex items-center justify-center h-full w-full bg-black">
        <YouTubeEmbed url={lesson.videoPath} title={lesson.title} className="w-full h-full" />
      </div>
    );
  }

  if (lesson.contentType === 'PDF') {
    const embedUrl = getGoogleDriveEmbedUrl(lesson.pdfPath);
    if (embedUrl) {
      return <iframe src={embedUrl} className="w-full h-full" title="PDF Viewer" allow="autoplay" />;
    }
    // Fallback: open link directly
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-4">
        <File className="h-12 w-12" />
        <a href={lesson.pdfPath} target="_blank" rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          Open in Google Drive
        </a>
      </div>
    );
  }

  if (lesson.contentType === 'TEXT') {
    return (
      <div className="h-full overflow-y-auto bg-gray-50 p-6 sm:p-10">
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl max-w-4xl mx-auto p-8 min-h-[50vh]">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">
            {lesson.title}
          </h1>
          <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {lesson.textContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full text-gray-400">
      Unsupported content type
    </div>
  );
}

// ─── Notes / PDF Download Modal ──────────────────────────────────────────────

function NotesDownloadModal({ isOpen, onClose, lesson }) {
  if (!lesson) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={lesson.title} size="2xl">
      {lesson.contentType === 'TEXT' && (
        <div className="bg-gray-50 p-6 rounded-lg whitespace-pre-wrap text-gray-800 leading-relaxed max-h-[60vh] overflow-y-auto">
          {lesson.textContent}
        </div>
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
                    className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
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
                className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <Download className="h-4 w-4 mr-2" /> Open Link
              </a>
            );
          })()}
        </div>
      )}
    </Modal>
  );
}