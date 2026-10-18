import { useState } from "react";

export function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">PrepHub React</h1>
      <p className="text-slate-600">React 19, TypeScript and Tailwind, with no other libraries yet.</p>
      <button
        className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
        onClick={() => setCount((c) => c + 1)}
      >
        Clicked {count} times
      </button>
    </main>
  );
}
