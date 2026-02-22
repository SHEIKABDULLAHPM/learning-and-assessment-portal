import { useState, useRef, useCallback } from 'react';
import {
  Loader2, CheckCircle, XCircle, HelpCircle, Save, Upload,
  FileText, Trash2, AlertCircle, Download, Eye,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';

const MAX_UPLOAD_SIZE_MB = 50;
const SUPPORTED_EXTENSIONS = ['pdf', 'docx'];

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function downloadSampleFile() {
  const sampleContent = `Quiz Questions - Sample Format

1. What is the primary purpose of the Java Virtual Machine (JVM)?
A) To compile Java source code into machine code
B) To provide a platform-independent execution environment
C) To manage database connections
D) To design user interfaces
Answer: B

2. Which of the following is NOT a primitive data type in Java?
A) int
B) String
C) boolean
D) double
Answer: B

3. What does the 'static' keyword mean in Java?
A) The variable cannot be changed
B) The member belongs to the class rather than any instance
C) The method runs at compile time
D) The class cannot be extended
Answer: B

4. Which access modifier makes a member accessible only within the same class?
A) public
B) protected
C) private
D) default
Answer: C

5. What is the output of: System.out.println(10 + 20 + "Hello")?
A) 1020Hello
B) 30Hello
C) Hello1020
D) Hello30
Answer: B
`;

  const blob = new Blob([sampleContent], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'quiz_questions_template.txt';
  link.click();
  URL.revokeObjectURL(url);
}

export default function QuizModal({ moduleId, moduleTitle, onClose }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState('Module Quiz');
  const [description, setDescription] = useState('Uploaded Quiz');
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [existingQuizzes, setExistingQuizzes] = useState([]);
  const [showExisting, setShowExisting] = useState(false);
  const fileInputRef = useRef(null);

  const isOverSizeLimit = uploadedFile && (uploadedFile.size / (1024 * 1024)) > MAX_UPLOAD_SIZE_MB;

  const handleFileSelected = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setErrorMessage(`Unsupported file type: .${ext}. Only PDF and DOCX files are supported.`);
      e.target.value = '';
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`File size (${formatFileSize(file.size)}) exceeds the ${MAX_UPLOAD_SIZE_MB} MB limit.`);
      e.target.value = '';
      return;
    }

    setUploadedFile(file);
    setErrorMessage('');
    setQuestions([]);
    setSaved(false);
    setShowResults(false);
    setSelectedAnswers({});
    e.target.value = '';
  }, []);

  const clearFile = () => {
    setUploadedFile(null);
    setErrorMessage('');
    setQuestions([]);
    setSaved(false);
  };

  const handlePreview = async () => {
    if (!uploadedFile) {
      setErrorMessage('Please select a file first.');
      return;
    }

    setIsPreviewing(true);
    setErrorMessage('');
    const toastId = toast.loading('Parsing quiz questions from file...');

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const { data } = await api.post(`/modules/${moduleId}/quizzes/upload/preview`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      if (data.error) {
        setErrorMessage(data.error);
        toast.error('Failed to parse questions.', { id: toastId });
        return;
      }

      setQuestions(data.questions || []);
      toast.success(`Parsed ${data.questionsCount} questions! Review below.`, { id: toastId });
    } catch (error) {
      console.error('Preview error:', error);
      const msg = error.response?.data?.error || 'Failed to parse questions from file.';
      setErrorMessage(msg);
      toast.error('Failed to parse questions.', { id: toastId });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleUploadAndSave = async () => {
    if (!uploadedFile) {
      setErrorMessage('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    const toastId = toast.loading('Uploading and saving quiz questions...');

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('title', title);
      formData.append('description', description);

      const { data } = await api.post(`/modules/${moduleId}/quizzes/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      if (data.error) {
        setErrorMessage(data.error);
        toast.error('Upload failed.', { id: toastId });
        return;
      }

      setSaved(true);
      setQuestions(data.quiz?.questions || []);
      toast.success(data.message || 'Quiz uploaded successfully!', { id: toastId });
    } catch (error) {
      console.error('Upload error:', error);
      const msg = error.response?.data?.error || 'Failed to upload quiz.';
      setErrorMessage(msg);
      toast.error('Upload failed.', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavePreviewedQuiz = async () => {
    if (questions.length === 0) return;
    setIsSaving(true);
    try {
      await api.post(`/modules/${moduleId}/quizzes`, {
        title,
        description,
        questions: questions.map((q) => ({
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
        })),
      });
      setSaved(true);
      toast.success('Quiz saved successfully! Students can now take this quiz.');
    } catch (error) {
      console.error('Save quiz error:', error);
      toast.error('Failed to save quiz.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAnswer = (questionIndex, option) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  const handleSubmitPreview = () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      toast.error('Please answer all questions before submitting.');
      return;
    }
    setShowResults(true);
    const correct = questions.filter((q, i) => selectedAnswers[i] === q.correctOption).length;
    toast.success(`Preview Score: ${correct} / ${questions.length}`);
  };

  const handleReset = () => {
    setQuestions([]);
    setUploadedFile(null);
    setSaved(false);
    setShowResults(false);
    setSelectedAnswers({});
    setErrorMessage('');
  };

  const loadExistingQuizzes = async () => {
    try {
      const { data } = await api.get(`/modules/${moduleId}/quizzes`);
      setExistingQuizzes(data || []);
      setShowExisting(true);
    } catch {
      toast.error('Failed to load existing quizzes.');
    }
  };

  const deleteQuiz = async (quizId) => {
    try {
      await api.delete(`/modules/${moduleId}/quizzes/${quizId}`);
      toast.success('Quiz deleted.');
      setExistingQuizzes((prev) => prev.filter((q) => q.quizId !== quizId));
    } catch {
      toast.error('Failed to delete quiz.');
    }
  };

  const getOptionStyle = (questionIndex, optionKey) => {
    const base = 'w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium';
    if (!showResults) {
      return selectedAnswers[questionIndex] === optionKey
        ? `${base} border-indigo-500 bg-indigo-50 text-indigo-700`
        : `${base} border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700`;
    }
    const isCorrect = questions[questionIndex].correctOption === optionKey;
    const isSelected = selectedAnswers[questionIndex] === optionKey;
    if (isCorrect) return `${base} border-green-500 bg-green-50 text-green-700`;
    if (isSelected && !isCorrect) return `${base} border-red-400 bg-red-50 text-red-600`;
    return `${base} border-gray-200 text-gray-400`;
  };

  const score = showResults
    ? questions.filter((q, i) => selectedAnswers[i] === q.correctOption).length
    : null;

  const totalExistingQuestions = existingQuizzes.reduce(
    (sum, q) => sum + (q.questions?.length || 0), 0
  );

  return (
    <Modal isOpen onClose={onClose} title={`Quiz — ${moduleTitle}`} size="2xl">
      <div className="space-y-6">

        {/* UPLOAD SECTION (shown when no questions parsed yet) */}
        {!isPreviewing && !isUploading && questions.length === 0 && (
          <div className="space-y-5">

            {/* Quiz Title & Description */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* File Upload Area */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                <Upload className="inline h-4 w-4 mr-1" />
                Upload Quiz Questions File
                <span className="text-gray-400 font-normal ml-1">(PDF or DOCX, max {MAX_UPLOAD_SIZE_MB} MB)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileSelected}
                className="hidden"
              />

              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium">
                  Click to select a PDF or DOCX file
                </p>
                <p className="text-xs text-gray-400 mt-1.5">
                  File should contain questions with options A-D and correct answers
                </p>
              </div>

              {uploadedFile && (
                <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <span className="text-sm text-indigo-700 font-medium truncate flex-1 mr-3">
                    <FileText className="inline h-4 w-4 mr-1.5 text-indigo-500" />
                    {uploadedFile.name}
                    <span className="text-indigo-400 ml-1.5">({formatFileSize(uploadedFile.size)})</span>
                  </span>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-indigo-400 hover:text-red-500 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Format Guide */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-800 mb-2">Expected File Format</h4>
              <div className="text-xs text-amber-700 space-y-1">
                <p>Each question should follow this pattern:</p>
                <pre className="bg-amber-100 rounded p-2 mt-1 text-xs leading-relaxed">
{`1. What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid
Answer: B`}
                </pre>
                <p className="mt-2">
                  Supported patterns: <code>1.</code>, <code>Q1:</code>, <code>Q:</code> for questions;{' '}
                  <code>A)</code>, <code>A.</code>, <code>(A)</code> for options.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadSampleFile}
                className="mt-3 inline-flex items-center text-xs font-medium text-amber-700 hover:text-amber-900"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download sample format file
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePreview}
                disabled={!uploadedFile || isPreviewing}
                className="flex-1 inline-flex justify-center items-center px-4 py-3 bg-white border-2 border-indigo-500 text-indigo-600 rounded-xl hover:bg-indigo-50 font-medium text-sm disabled:opacity-50 transition-all"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Questions
              </button>
              <button
                type="button"
                onClick={handleUploadAndSave}
                disabled={!uploadedFile || isUploading || isOverSizeLimit}
                className="flex-1 inline-flex justify-center items-center px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-medium text-sm disabled:opacity-50 shadow-sm transition-all"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload & Save
              </button>
            </div>

            {/* View Existing Quizzes */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={loadExistingQuizzes}
                className="text-sm text-gray-500 hover:text-indigo-600 font-medium"
              >
                View existing uploaded quizzes for this module →
              </button>

              {showExisting && (
                <div className="mt-3 space-y-2">
                  {existingQuizzes.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No quizzes uploaded yet.</p>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500">
                        {existingQuizzes.length} quiz(zes) · {totalExistingQuestions} total questions in pool
                      </p>
                      {existingQuizzes.map((q) => (
                        <div key={q.quizId} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-gray-700">{q.title}</span>
                            <span className="text-xs text-gray-400 ml-2">
                              ({q.questions?.length || 0} questions)
                            </span>
                          </div>
                          <button
                            onClick={() => deleteQuiz(q.quizId)}
                            className="text-gray-400 hover:text-red-500"
                            title="Delete quiz"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* LOADING STATE */}
        {(isPreviewing || isUploading) && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Loader2 className="animate-spin h-10 w-10 text-indigo-500 mb-4" />
            <p className="text-sm font-medium">
              {isPreviewing ? 'Parsing questions from file...' : 'Uploading and saving quiz...'}
            </p>
            <p className="text-xs text-gray-400 mt-1">This may take a few seconds.</p>
          </div>
        )}

        {/* SCORE BANNER */}
        {showResults && (
          <div className={`p-4 rounded-lg text-center font-semibold text-lg ${
            score === questions.length
              ? 'bg-green-50 text-green-700 border border-green-200'
              : score >= questions.length / 2
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            Preview Score: {score} / {questions.length}
            {score === questions.length && ' — Perfect! 🎉'}
          </div>
        )}

        {/* QUESTIONS */}
        {!isPreviewing && !isUploading && questions.length > 0 && (
          <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-4 py-2">
              <span className="text-sm font-medium text-indigo-700">
                {questions.length} question{questions.length !== 1 ? 's' : ''} parsed
              </span>
              {saved && (
                <span className="inline-flex items-center text-sm text-green-600 font-medium">
                  <CheckCircle className="h-4 w-4 mr-1" /> Saved to database
                </span>
              )}
            </div>

            {questions.map((q, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-gray-800 font-medium leading-relaxed">{q.questionText}</p>
                </div>

                <div className="grid gap-2 pl-10">
                  {['A', 'B', 'C', 'D'].map((optKey) => {
                    const optionValue = q[`option${optKey}`];
                    if (!optionValue) return null;
                    return (
                      <button
                        key={optKey}
                        onClick={() => handleSelectAnswer(idx, optKey)}
                        className={getOptionStyle(idx, optKey)}
                        disabled={showResults}
                      >
                        <span className="font-bold mr-2">{optKey}.</span>
                        {optionValue}
                        {showResults && q.correctOption === optKey && (
                          <CheckCircle className="inline h-4 w-4 ml-2 text-green-600" />
                        )}
                        {showResults && selectedAnswers[idx] === optKey && q.correctOption !== optKey && (
                          <XCircle className="inline h-4 w-4 ml-2 text-red-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACTIONS */}
        {!isPreviewing && !isUploading && questions.length > 0 && (
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
            >
              ← Upload Another
            </button>
            {!saved && (
              <button
                onClick={handleSavePreviewedQuiz}
                disabled={isSaving}
                className="inline-flex items-center px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50"
              >
                {isSaving ? (
                  <><Loader2 className="animate-spin h-4 w-4 mr-2" />Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Save Quiz</>
                )}
              </button>
            )}
            {saved && (
              <span className="inline-flex items-center px-5 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium text-sm">
                <CheckCircle className="h-4 w-4 mr-2" /> Saved
              </span>
            )}
            {!showResults ? (
              <button
                onClick={handleSubmitPreview}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
              >
                Preview Quiz
              </button>
            ) : (
              <button
                onClick={() => { setShowResults(false); setSelectedAnswers({}); }}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
              >
                Retry Preview
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
