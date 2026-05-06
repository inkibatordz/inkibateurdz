import React from 'react';

/** Full-page spinner — used at the top-level App Suspense boundary. */
export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
      <p className="mt-4 text-gray-600 font-medium animate-pulse">Chargement...</p>
    </div>
  );
};

/** Inline spinner — used inside the dashboard content area to avoid a full-screen flash.
 * Added a small delay so it doesn't flicker on very fast navigations. */
export const InlineSpinner: React.FC = () => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShow(true), 250);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return <div className="min-h-[400px]" />;

  return (
    <div className="flex items-center justify-center py-24 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-8 h-8 border-4 border-blue-200 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-8 h-8 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
    </div>
  );
};
