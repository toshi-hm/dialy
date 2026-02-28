'use client';

import dynamic from 'next/dynamic';

// Disable SSR for the home content:
// - All data comes from localStorage (browser-only)
// - Prevents hydration mismatch from date computations that differ between
//   server (UTC) and client (user's local timezone)
const HomeContent = dynamic(() => import('./HomeContent'), { ssr: false });

const Page = () => {
  return <HomeContent />;
};

export default Page;
