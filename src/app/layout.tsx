import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dialy - Your Daily Diary',
  description: 'A diary app that lets you see past entries for the same day at a glance',
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
