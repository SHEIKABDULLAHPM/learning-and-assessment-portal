import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import StudentLayout from '../features/student/StudentLayout';
import StudentDashboard from '../pages/Student/StudentDashboard';
import CourseList from '../features/student/CourseList';
import CoursePlayerPage from '../pages/Student/CoursePlayerPage';
import InstructorLayout from '../features/instructor/InstructorLayout';
import InstructorDashboard from '../pages/Instructor/InstructorDashboard';
import MyCoursesPage from '../features/instructor/MyCoursesPage';
import CreateCourseForm from '../pages/Instructor/CreateCourseForm';
import CourseManagerPage from '../pages/Instructor/CourseManagerPage';
import EditCoursePage from '../pages/Instructor/EditCoursePage';
import StudentQuizPage from '../pages/Student/StudentQuizPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Student routes – layout wraps dashboard & course list */}
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="courses" element={<CourseList />} />
      </Route>
      {/* CoursePlayerPage uses its own full-screen layout */}
      <Route path="/student/courses/:courseId/learn" element={<CoursePlayerPage />} />
      {/* Student Quiz Page – full-screen quiz experience */}
      <Route path="/student/courses/:courseId/modules/:moduleId/quiz" element={<StudentQuizPage />} />

      <Route path="/instructor" element={<InstructorLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<InstructorDashboard />} />
        <Route path="courses" element={<MyCoursesPage />} />
        <Route path="courses/:courseId" element={<CourseManagerPage />} />
        <Route path="create-course" element={<CreateCourseForm />} />
        <Route path="edit-course/:courseId" element={<EditCoursePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}