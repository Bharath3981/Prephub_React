import { useEffect, useState } from "react";
import { useFetch } from "@/shared/hooks/useFetch";
import { Button } from "@/shared/ui/Button";

/**
 * Development only (/dev/race): the race condition, and the fix.
 * A fake request takes a different time depending on the choice: "slow" 1.5 s, "fast" 0.2 s.
 * Click Slow, then Fast quickly. The answer for Fast arrives first, and the answer for Slow arrives LATER.
 */
const REQUESTS = {
  slow: { label: "SLOW result", ms: 1500 },
  fast: { label: "FAST result", ms: 200 },
};
type Choice = keyof typeof REQUESTS;

/** Like fetch: it can be cancelled with a signal (then it rejects with an AbortError). */
function fakeRequest(choice: Choice, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(REQUESTS[choice].label), REQUESTS[choice].ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

// The first attempt: fetch in an effect, with no cleanup.
function Naive({ choice }: { choice: Choice | null }) {
  const [result, setResult] = useState("nothing yet");

  useEffect(() => {
    if (!choice) return;
    fakeRequest(choice).then(setResult); // the slow answer arrives late and overwrites the fast one
  }, [choice]);

  return <p className="text-lg font-semibold">{result}</p>;
}

// The fix: useFetch aborts the old request and ignores its result.
function Fixed({ choice }: { choice: Choice | null }) {
  const state = useFetch((signal) => (choice ? fakeRequest(choice, signal) : Promise.resolve("nothing yet")), [choice]);

  if (state.status === "loading") return <p className="text-lg text-muted">loading...</p>;
  if (state.status === "error") return <p className="text-lg text-danger">{state.error.message}</p>;
  return <p className="text-lg font-semibold">{state.data}</p>;
}

export function DevRacePage() {
  const [choice, setChoice] = useState<Choice | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Race condition</h1>
      <p className="max-w-2xl text-muted">
        Click <b>Slow</b>, then click <b>Fast</b> within a second. You asked for Fast last, so the screen should end with the Fast result. Wait two
        seconds and compare the two panels.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => setChoice("slow")}>Request slow (1.5 s)</Button>
        <Button onClick={() => setChoice("fast")}>Request fast (0.2 s)</Button>
        <Button variant="ghost" onClick={() => setChoice(null)}>
          Reset
        </Button>
      </div>
      <p>
        Your last choice: <b>{choice ?? "none"}</b>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="space-y-2 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold">Without cleanup (the bug)</h2>
          <Naive choice={choice} />
        </section>
        <section className="space-y-2 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold">With useFetch (the fix)</h2>
          <Fixed choice={choice} />
        </section>
      </div>
    </div>
  );
}
