import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type Health = { ok: boolean; version: string };

/**
 * Placeholder home. It exists to prove the web app reaches the API through the
 * same origin; the real Hoje screen is T12.
 */
function Home() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/health", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<Health>;
      })
      .then(setHealth)
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "falha desconhecida");
      });

    return () => controller.abort();
  }, []);

  return (
    <>
      <h1 className="text-2xl font-bold">Pulse</h1>
      <p className="mt-2 text-sm" data-testid="health">
        {error !== null
          ? `API indisponível: ${error}`
          : health === null
            ? "Consultando a API…"
            : `API ok · versão ${health.version}`}
      </p>
    </>
  );
}

export const Route = createFileRoute("/")({ component: Home });
