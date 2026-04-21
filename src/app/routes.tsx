import { createBrowserRouter, Navigate } from 'react-router-dom';
import React from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import { LoadingSpinner, InlineSpinner } from './components/LoadingSpinner';

// Lazy load all page components
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));
const MentorDashboard = React.lazy(() => import('./pages/MentorDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const StudentProjects = React.lazy(() => import('./pages/StudentProjects'));
const StudentMentorship = React.lazy(() => import('./pages/StudentMentorship'));
const StudentTrainings = React.lazy(() => import('./pages/StudentTrainings'));
const StudentNotifications = React.lazy(() => import('./pages/StudentNotifications'));
const StudentProfile = React.lazy(() => import('./pages/StudentProfile'));
const StudentMaterial = React.lazy(() => import('./pages/StudentMaterial'));
const MentorProjects = React.lazy(() => import('./pages/MentorProjects'));
const MentorScheduling = React.lazy(() => import('./pages/MentorScheduling'));
const MentorEvaluations = React.lazy(() => import('./pages/MentorEvaluations'));
const MentorNotifications = React.lazy(() => import('./pages/MentorNotifications'));
const MentorProfile = React.lazy(() => import('./pages/MentorProfile'));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));
const AdminProjects = React.lazy(() => import('./pages/AdminProjects'));
const AdminTrainings = React.lazy(() => import('./pages/AdminTrainings'));
const AdminMaterial = React.lazy(() => import('./pages/AdminMaterial'));
const AdminStatistics = React.lazy(() => import('./pages/AdminStatistics'));
const AdminNotifications = React.lazy(() => import('./pages/AdminNotifications'));

// Fallback for public routes
const FullPageLoader = <LoadingSpinner />;
// Fallback for dashboard routes
const ContentLoader = <InlineSpinner />;

// Component to handle root redirect based on auth status
const RootRedirect = () => {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    return <Navigate to={`/${user.role}`} replace />;
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
    element: <React.Suspense fallback={FullPageLoader}><LoginPage /></React.Suspense>,
  },
  {
    path: '/register',
    element: <React.Suspense fallback={FullPageLoader}><RegisterPage /></React.Suspense>,
  },
  {
    path: '/forgot-password',
    element: <React.Suspense fallback={FullPageLoader}><ForgotPasswordPage /></React.Suspense>,
  },
  {
    path: '/student',
    element: <ProtectedRoute allowedRoles={['student']} />,
    children: [
      { index: true, element: <React.Suspense fallback={null}><StudentDashboard /></React.Suspense> },
      { path: 'projects', element: <React.Suspense fallback={ContentLoader}><StudentProjects /></React.Suspense> },
      { path: 'mentorship', element: <React.Suspense fallback={ContentLoader}><StudentMentorship /></React.Suspense> },
      { path: 'trainings', element: <React.Suspense fallback={ContentLoader}><StudentTrainings /></React.Suspense> },
      { path: 'material', element: <React.Suspense fallback={ContentLoader}><StudentMaterial /></React.Suspense> },
      { path: 'notifications', element: <React.Suspense fallback={ContentLoader}><StudentNotifications /></React.Suspense> },
      { path: 'profile', element: <React.Suspense fallback={ContentLoader}><StudentProfile /></React.Suspense> },
    ],
  },
  {
    path: '/mentor',
    element: <ProtectedRoute allowedRoles={['mentor']} />,
    children: [
      { index: true, element: <React.Suspense fallback={null}><MentorDashboard /></React.Suspense> },
      { path: 'projects', element: <React.Suspense fallback={ContentLoader}><MentorProjects /></React.Suspense> },
      { path: 'scheduling', element: <React.Suspense fallback={ContentLoader}><MentorScheduling /></React.Suspense> },
      { path: 'evaluations', element: <React.Suspense fallback={ContentLoader}><MentorEvaluations /></React.Suspense> },
      { path: 'notifications', element: <React.Suspense fallback={ContentLoader}><MentorNotifications /></React.Suspense> },
      { path: 'profile', element: <React.Suspense fallback={ContentLoader}><MentorProfile /></React.Suspense> },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      { index: true, element: <React.Suspense fallback={null}><AdminDashboard /></React.Suspense> },
      { path: 'users', element: <React.Suspense fallback={ContentLoader}><AdminUsers /></React.Suspense> },
      { path: 'projects', element: <React.Suspense fallback={ContentLoader}><AdminProjects /></React.Suspense> },
      { path: 'trainings', element: <React.Suspense fallback={ContentLoader}><AdminTrainings /></React.Suspense> },
      { path: 'material', element: <React.Suspense fallback={ContentLoader}><AdminMaterial /></React.Suspense> },
      { path: 'statistics', element: <React.Suspense fallback={ContentLoader}><AdminStatistics /></React.Suspense> },
      { path: 'notifications', element: <React.Suspense fallback={ContentLoader}><AdminNotifications /></React.Suspense> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);