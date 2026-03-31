export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 via-yellow-50 to-green-50 text-gray-800">
      <div className="text-center">
        <p className="mb-4 text-4xl">&#x1F476;</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-green-700 sm:text-5xl">
          Something special is coming...
        </h1>
        <p className="mt-4 text-lg text-green-500">Stay tuned!</p>
      </div>
    </main>
  );
}
