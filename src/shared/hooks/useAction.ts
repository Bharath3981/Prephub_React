import { useCallback, useState } from "react";

/**
 * A button press that calls the API (create, save, delete). Tracks the three things the screen needs: is it running
 * (disable the button), did it fail (show the message), and gives back the result.
 *
 * `run(...)` never throws: on failure it stores the error and returns undefined, so a handler can write
 *   const saved = await save.run(values); if (saved) close();
 */
export function useAction<Args extends unknown[], Result>(action: (...args: Args) => Promise<Result>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(
    async (...args: Args): Promise<Result | undefined> => {
      setPending(true);
      setError(null);
      try {
        return await action(...args);
      } catch (caught) {
        setError(caught instanceof Error ? caught : new Error(String(caught)));
        return undefined;
      } finally {
        setPending(false);
      }
    },
    // `action` is a new function on every render; the latest one is used because `run` is rebuilt with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action],
  );

  const reset = useCallback(() => setError(null), []);
  return { run, pending, error, reset };
}
