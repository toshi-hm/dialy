import ClientPage from './ClientPage';

// page.tsx はサーバーコンポーネントとして維持する。
// 'use client' をここに置くと Turbopack が layout.tsx をクライアントバンドルに
// 誤って含め、SyntaxError が発生する場合があるため ClientPage に分離した。
const Page = () => {
  return <ClientPage />;
};

export default Page;
