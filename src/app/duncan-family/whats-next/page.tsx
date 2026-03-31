export default function WhatsNextPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-linear-to-b from-green-50 via-yellow-50 to-green-50">
      <div className="w-full bg-green-900 px-6 pt-12 pb-8 text-center shadow-lg shadow-green-900/20 sm:pt-16 sm:pb-10">
        <p className="mb-2 text-4xl">&#x1F4E6;</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
          What Happens Next?
        </h1>
      </div>

      <div className="w-full max-w-lg px-6 pt-20 pb-20">
        <div className="space-y-6 text-center">
          {/* Step 1 */}
          <div className="rounded-2xl border-2 border-green-800/10 bg-neutral-200/50 px-6 py-6">
            <div className="mb-2 text-3xl">&#x2705;</div>
            <h2 className="text-xl font-extrabold text-green-900">
              Step 1: Complete
            </h2>
            <p className="mt-2 text-gray-600">
              You solved your crossword and got your secret word and secret
              letter. Nice work.
            </p>
          </div>

          <div className="mx-auto h-6 w-px bg-green-300" />

          {/* Step 2 */}
          <div className="rounded-2xl border-2 border-green-800/10 bg-neutral-200/50 px-6 py-6">
            <div className="mb-2 text-3xl">&#x23F3;</div>
            <h2 className="text-xl font-extrabold text-green-900">
              Step 2: Sit Tight
            </h2>
            <p className="mt-2 text-gray-600">
              Something is in the works. You&apos;ll know when it&apos;s time.
            </p>
          </div>

          <div className="mx-auto h-6 w-px bg-green-300" />

          {/* Step 3 */}
          <div className="rounded-2xl border-2 border-green-800/10 bg-neutral-200/50 px-6 py-6">
            <div className="mb-2 text-3xl">&#x1F513;</div>
            <h2 className="text-xl font-extrabold text-green-900">
              Step 3: Crack the Code
            </h2>
            <p className="mt-2 text-gray-600">
              Your secret letter is one piece of a 6-letter code. You&apos;ll
              need to work together with the rest of the family to figure it
              out.
            </p>
          </div>

          <div className="mx-auto h-6 w-px bg-green-300" />

          {/* The team */}
          <div className="rounded-2xl border-2 border-green-800/10 bg-neutral-200/50 px-6 py-6">
            <h2 className="mb-3 text-xl font-extrabold text-green-900">
              &#x1F46A; Your Team
            </h2>
            <p className="text-s2 mb-4 text-gray-600">
              Each of these people has their own crossword, their own secret
              word, and their own secret letter. You&apos;ll need all 6.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {["Mom", "Dad", "Mimi", "Papa", "Jacque", "Jenna"].map((name) => (
                <span
                  key={name}
                  className="rounded-lg bg-green-700 px-3 py-2 text-center text-sm font-bold text-white"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div className="mx-auto h-6 w-px bg-green-300" />

          {/* Warning */}
          <div className="rounded-2xl border-2 border-green-800/10 bg-neutral-200/50 px-6 py-6">
            <div className="mb-2 text-3xl">&#x1F910;</div>
            <h2 className="text-xl font-extrabold text-green-900">One Rule</h2>
            <p className="mt-2 text-gray-600">
              Don&apos;t share your secret word with anyone yet. You&apos;ll
              each need yours when the time comes. Your letter, however...
              you&apos;ll want to start comparing those.
            </p>
          </div>

          <div className="mx-auto h-6 w-px bg-green-300" />

          {/* Teaser */}
          <div className="rounded-2xl border-2 border-green-800/10 bg-neutral-200/50 px-6 py-6">
            <div className="mb-2 text-3xl">&#x2728;</div>
            <p className="text-lg font-semibold text-green-800">
              Stay tuned! This is just the beginning...
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
