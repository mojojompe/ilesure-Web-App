import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function GoogleAuthProxyPage() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.ilesure.com/api'; 

  useEffect(() => {
    if (redirect) {
      window.location.href = `${apiUrl.replace('/api', '')}/auth/google/login?redirect=${encodeURIComponent(redirect)}`;
    }
  }, [redirect, apiUrl]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-amber-800"></div>
        <p className="text-sm font-medium text-gray-500">Redirecting to Google...</p>
      </div>
    </div>
  );
}
