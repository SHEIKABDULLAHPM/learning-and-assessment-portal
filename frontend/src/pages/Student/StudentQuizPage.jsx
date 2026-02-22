import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  HelpCircle, CheckCircle, XCircle, ArrowLeft, Trophy, RotateCcw,
  Loader2, Clock, BookOpen, AlertCircle,
} from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export default function StudentQuizPage() {
  const { courseId, moduleId } = useParams();
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerRef, setTimerRef] = useState(null);

  // Fetch a randomized quiz from the question pool for this module
  const { data: quiz, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-quiz-random', moduleId],
    queryFn: async () => {
      const res = await api.get(`/modules/${moduleId}/quizzes/random`, {
        params: { numQuestions: 10 },
      });
      // If the server returns an error object instead of a quiz
      if (res.data?.error) return null;
      return res.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const questions = quiz?.questions || [];
  const hasQuiz = questions.length > 0;

  const startQuiz = () => {
    setQuizStarted(true);
    setSelectedAnswers({});
    setSubmitted(false);
    setResult(null);
    setTimeElapsed(0);
    const interval = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    setTimerRef(interval);
  };

  const handleSelect = (questionId, option) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      toast.error('Please answer all questions before submitting.');
      return;
    }
    if (timerRef) clearInterval(timerRef);
    setSubmitting(true);

    try {
      // Evaluate client-side (options are randomized per attempt, so
      // the correctOption in the response already reflects shuffled order)
      let correctCount = 0;
      const questionResults = questions.map((q) => {
        const selectedOption = selectedAnswers[q.questionId] || '';
        const isCorrect = q.correctOption?.toUpperCase() === selectedOption?.toUpperCase();
        if (isCorrect) correctCount++;
        return {
          questionId: q.questionId,
          questionText: q.questionText,
          selectedOption,
          correctOption: q.correctOption,
          correct: isCorrect,
        };
      });

      const total = questions.length;
      const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

      setResult({
        score: correctCount,
        totalQuestions: total,
        percentage: pct,
        passed: pct >= 50,
        questionResults,
      });
      setSubmitted(true);

      if (pct >= 80) toast.success(`Excellent! You scored ${pct}%`);
      else if (pct >= 50) toast('Good effort! Keep practicing.', { icon: '💪' });
      else toast('Keep studying and try again!', { icon: '📖' });
    } catch (error) {
      console.error('Quiz evaluation error:', error);
      toast.error('Failed to evaluate quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setResult(null);
    setTimeElapsed(0);
    const interval = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    setTimerRef(interval);
    // Refetch a fresh randomized quiz so each retry has new questions/order
    refetch();
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const score = result?.score ?? null;
  const percentage = result?.percentage ?? null;
  const questionResults = result?.questionResults || [];

  // Build a lookup: questionId -> { selectedOption, correctOption, correct }
  const resultMap = {};
  for (const qr of questionResults) {
    resultMap[qr.questionId] = qr;
  }

  const getOptionClasses = (questionId, optKey) => {
    const base = 'w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium flex items-center gap-3';
    if (!submitted) {
      return selectedAnswers[questionId] === optKey
        ? `${base} border-green-500 bg-green-50 text-green-800 shadow-sm`
        : `${base} border-gray-200 hover:border-green-300 hover:bg-green-50/50 text-gray-700`;
    }
    const qr = resultMap[questionId];
    const isCorrect = qr?.correctOption === optKey;
    const isSelected = qr?.selectedOption === optKey;
    if (isCorrect) return `${base} border-green-500 bg-green-50 text-green-800`;
    if (isSelected && !isCorrect) return `${base} border-red-400 bg-red-50 text-red-700`;
    return `${base} border-gray-100 text-gray-400 opacity-60`;
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // ─── Error / No quiz available ────────────────────────────────────────────
  if (isError || !hasQuiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10">
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-5" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Quiz Available</h2>
            <p className="text-gray-500 text-sm mb-6">
              The instructor hasn&apos;t created a quiz for this module yet. Check back later!
            </p>
            <Link
              to={`/student/courses/${courseId}/learn`}
              className="inline-flex items-center px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Course
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Quiz Intro (before starting) ────────────────────────────────────────
  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Gradient header */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-center text-white">
              <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold">{quiz.title || 'Module Quiz'}</h1>
              <p className="text-green-100 mt-2 text-sm">{quiz.description || 'Test your knowledge'}</p>
            </div>

            {/* Quiz info */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <BookOpen className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-800">{questions.length}</p>
                  <p className="text-xs text-gray-500">Questions</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Clock className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-800">~{questions.length * 2}</p>
                  <p className="text-xs text-gray-500">Minutes</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-amber-800 mb-2">Instructions</h3>
                <ul className="text-xs text-amber-700 space-y-1.5">
                  <li>• Read each question carefully before selecting an answer.</li>
                  <li>• You must answer all questions before submitting.</li>
                  <li>• Results will be shown immediately after submission.</li>
                  <li>• You can retry the quiz as many times as you want.</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <Link
                  to={`/student/courses/${courseId}/learn`}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-center text-sm transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 inline mr-1" /> Back
                </Link>
                <button
                  onClick={startQuiz}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-sm transition-colors"
                >
                  Start Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Results Screen ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Link
              to={`/student/courses/${courseId}/learn`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Course
            </Link>
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatTime(timeElapsed)}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* Score card */}
          <div className={`rounded-2xl p-8 text-center mb-8 ${
            percentage >= 80
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
              : percentage >= 50
              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
              : 'bg-gradient-to-br from-red-500 to-rose-600 text-white'
          }`}>
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-90" />
            <p className="text-lg font-medium opacity-90 mb-1">Your Score</p>
            <p className="text-5xl font-black">{percentage}%</p>
            <p className="text-lg opacity-80 mt-2">{score} out of {questions.length} correct</p>
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-sm transition-colors"
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Retry
              </button>
              <Link
                to={`/student/courses/${courseId}/learn`}
                className="inline-flex items-center px-5 py-2.5 bg-white text-gray-800 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
              >
                Continue Learning
              </Link>
            </div>
          </div>

          {/* Review answers */}
          <h3 className="text-lg font-bold text-gray-800 mb-4">Review Answers</h3>
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const qr = resultMap[q.questionId] || {};
              const isCorrect = qr.correct;
              return (
                <div
                  key={q.questionId}
                  className={`bg-white rounded-xl border-2 p-5 ${
                    isCorrect ? 'border-green-200' : 'border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="text-xs text-gray-400 font-medium">Question {idx + 1}</span>
                      <p className="text-gray-800 font-medium">{q.questionText}</p>
                    </div>
                  </div>
                  <div className="grid gap-2 pl-8">
                    {['A', 'B', 'C', 'D'].map((optKey) => {
                      const value = q[`option${optKey}`];
                      if (!value) return null;
                      const isThisCorrect = qr.correctOption === optKey;
                      const isThisSelected = qr.selectedOption === optKey;
                      let classes = 'px-3 py-2 rounded-lg text-sm border ';
                      if (isThisCorrect) classes += 'bg-green-50 border-green-300 text-green-800 font-medium';
                      else if (isThisSelected) classes += 'bg-red-50 border-red-300 text-red-700';
                      else classes += 'bg-gray-50 border-gray-100 text-gray-500';
                      return (
                        <div key={optKey} className={classes}>
                          <span className="font-bold mr-2">{optKey}.</span>
                          {value}
                          {isThisCorrect && <CheckCircle className="inline h-4 w-4 ml-2 text-green-600" />}
                          {isThisSelected && !isThisCorrect && <XCircle className="inline h-4 w-4 ml-2 text-red-500" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Quiz In Progress ─────────────────────────────────────────────────────
  const answeredCount = Object.keys(selectedAnswers).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top bar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={`/student/courses/${courseId}/learn`}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-gray-800">{quiz.title || 'Module Quiz'}</h1>
              <p className="text-xs text-gray-400">{answeredCount} of {questions.length} answered</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatTime(timeElapsed)}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-3xl mx-auto mt-2">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {questions.map((q, idx) => (
          <div
            key={q.questionId}
            className={`bg-white rounded-xl border-2 p-6 transition-all duration-200 ${
              selectedAnswers[q.questionId] ? 'border-green-200 shadow-sm' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${
                selectedAnswers[q.questionId]
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {idx + 1}
              </span>
              <p className="text-gray-800 font-medium leading-relaxed pt-1">{q.questionText}</p>
            </div>

            <div className="grid gap-2.5 pl-11">
              {['A', 'B', 'C', 'D'].map((optKey) => {
                const value = q[`option${optKey}`];
                if (!value) return null;
                return (
                  <button
                    key={optKey}
                    onClick={() => handleSelect(q.questionId, optKey)}
                    className={getOptionClasses(q.questionId, optKey)}
                  >
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-gray-600 font-bold text-xs shrink-0">
                      {optKey}
                    </span>
                    <span className="flex-1">{value}</span>
                    {selectedAnswers[q.questionId] === optKey && (
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky submit bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {answeredCount === questions.length
              ? <span className="text-green-600 font-medium">All questions answered!</span>
              : `${questions.length - answeredCount} question${questions.length - answeredCount > 1 ? 's' : ''} remaining`}
          </p>
          <button
            onClick={handleSubmit}
            disabled={answeredCount < questions.length || submitting}
            className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <><Loader2 className="inline animate-spin h-4 w-4 mr-2" />Submitting...</>
            ) : (
              `Submit Quiz (${answeredCount}/${questions.length})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
