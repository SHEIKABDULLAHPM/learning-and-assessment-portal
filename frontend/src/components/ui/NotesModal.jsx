import Modal from './Modal';

export default function NotesModal({ isOpen, onClose, lesson }) {
  if (!lesson) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={lesson.title} size="2xl">
      <div className="prose max-w-none">
        {lesson.contentType === 'TEXT' && (
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {lesson.textContent}
          </div>
        )}

        {lesson.contentType === 'PDF' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              PDF document attached to this lesson.
            </p>
            <a
              href={`http://localhost:8081/api/modules/${lesson.module?.moduleId || '_'}/lessons/${lesson.lessonId}/content`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium no-underline"
            >
              View / Download PDF
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
}
