import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dialy - Your Daily Diary',
  description: 'A diary app that lets you see past entries for the same day at a glance',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
