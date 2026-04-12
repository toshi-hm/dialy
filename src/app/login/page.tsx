import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export const metadata = {
  title: 'ログイン | Dialy',
};

const LoginPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Dialy</h1>
          <p className="mt-2 text-sm text-gray-600">あなたの日々を記録する</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">ログイン</h2>
          <Suspense fallback={<div className="text-sm text-gray-500">読み込み中...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
