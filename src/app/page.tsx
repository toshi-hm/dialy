export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="text-center p-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Welcome to Dialy</h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          A diary app that lets you see past entries for the same day at a glance
        </p>
      </main>
    </div>
  );
}
