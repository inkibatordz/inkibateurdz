import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { LoadingSpinner } from './components/LoadingSpinner';

export default function App() {
  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </AuthProvider>
    </React.Suspense>
  );
}