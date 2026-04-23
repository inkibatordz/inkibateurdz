import { createBrowserRouter, Navigate } from 'react-router-dom';
import React from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import { LoadingSpinner, InlineSpinner } from './components/LoadingSpinner';

// Eagerly load all page components to avoid UI blinking on navigation
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import StudentDashboard from './pages/StudentDashboard';
import MentorDashboard from './pages/MentorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentProjects from './pages/StudentProjects';
import StudentMentorship from './pages/StudentMentorship';
import StudentTrainings from './pages/StudentTrainings';
import StudentNotifications from './pages/StudentNotifications';
import StudentProfile from './pages/StudentProfile';
import StudentMaterial from './pages/StudentMaterial';
import MentorProjects from './pages/MentorProjects';
import MentorScheduling from './pages/MentorScheduling';
import MentorEvaluations from './pages/MentorEvaluations';
import MentorNotifications from './pages/MentorNotifications';
import MentorProfile from './pages/MentorProfile';
import AdminUsers from './pages/AdminUsers';
import AdminProjects from './pages/AdminProjects';
import AdminTrainings from './pages/AdminTrainings';
import AdminMaterial from './pages/AdminMaterial';
import AdminStatistics from './pages/AdminStatistics';
import AdminNotifications from './pages/AdminNotifications';

// Fallback for public routes
const FullPageLoader = <LoadingSpinner />;
// Fallback for dashboard routes
const ContentLoader = <InlineSpinner />;

// Component to handle root redirect based on auth status
const RootRedirect = () => {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      const validRoles = ['student', 'mentor', 'admin'];
      if (user && user.role && validRoles.includes(user.role)) {
        return <Navigate to={`/${user.role}`} replace />;
      } else {
        localStorage.removeItem('currentUser');
      }
    } catch (e) {
      localStorage.removeItem('currentUser');
    }
  }
  return <LoginPage />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <React.Suspense fallback={FullPageLoader}><RootRedirect /></React.Suspense>,
    errorElement: <div className="p-4 text-center">Une erreur est survenue. Veuillez rafraîchir la page.</div>,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/student',
    element: <ProtectedRoute allowedRoles={['student']} />,
    children: [
      { index: true, element: <StudentDashboard /> },
      { path: 'projects', element: <StudentProjects /> },
      { path: 'mentorship', element: <StudentMentorship /> },
      { path: 'trainings', element: <StudentTrainings /> },
      { path: 'material', element: <StudentMaterial /> },
      { path: 'notifications', element: <StudentNotifications /> },
      { path: 'profile', element: <StudentProfile /> },
    ],
  },
  {
    path: '/mentor',
    element: <ProtectedRoute allowedRoles={['mentor']} />,
    children: [
      { index: true, element: <MentorDashboard /> },
      { path: 'projects', element: <MentorProjects /> },
      { path: 'scheduling', element: <MentorScheduling /> },
      { path: 'evaluations', element: <MentorEvaluations /> },
      { path: 'notifications', element: <MentorNotifications /> },
      { path: 'profile', element: <MentorProfile /> },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'projects', element: <AdminProjects /> },
      { path: 'trainings', element: <AdminTrainings /> },
      { path: 'material', element: <AdminMaterial /> },
      { path: 'statistics', element: <AdminStatistics /> },
      { path: 'notifications', element: <AdminNotifications /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);