'use client';

import dynamic from 'next/dynamic';

// Disable SSR for HomeContent:
// - startOfDay(new Date()) の結果がサーバー(UTC)とクライアント(ローカル TZ)で異なるため
//   ハイドレーションミスマッチを防ぐ
const HomeContent = dynamic(() => import('./HomeContent'), { ssr: false });

const ClientPage = () => {
  return <HomeContent />;
};

export default ClientPage;
