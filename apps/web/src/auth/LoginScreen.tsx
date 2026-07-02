import { LogIn } from "lucide-react";
import { useState } from "react";
import { Button, Card } from "../components/ui";
import { supabase } from "../lib/supabase";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setStatus("");

    const action =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { error: authError } = await action;
    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setStatus(mode === "signup" ? "Cuenta creada. Revisa tu correo si Supabase pide confirmacion." : "Sesion iniciada.");
  }

  return (
    <div className="min-h-screen bg-k7-soft px-4 py-8 text-k7-ink">
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section>
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-k7-orange text-2xl font-black text-white">K7</div>
          <p className="mt-6 text-sm font-bold text-k7-orange">Acceso privado</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-black tracking-normal sm:text-5xl">K7 Product Radar</h1>
          <p className="mt-4 max-w-xl text-base text-gray-600">
            Inicia sesion con Supabase para ver productos, campanas, sincronizacion WooCommerce y metricas operativas.
          </p>
        </section>

        <Card className="w-full">
          <div className="mb-5 flex rounded-xl bg-k7-soft p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`min-h-10 flex-1 rounded-lg text-sm font-bold ${
                mode === "signin" ? "bg-white text-k7-orange shadow-sm" : "text-gray-600"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`min-h-10 flex-1 rounded-lg text-sm font-bold ${
                mode === "signup" ? "bg-white text-k7-orange shadow-sm" : "text-gray-600"
              }`}
            >
              Crear cuenta
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold">
              Email
              <input
                className="mt-1 min-h-11 w-full rounded-xl border border-k7-line px-3 outline-none focus:border-k7-orange focus:ring-2 focus:ring-orange-100"
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-semibold">
              Password
              <input
                className="mt-1 min-h-11 w-full rounded-xl border border-k7-line px-3 outline-none focus:border-k7-orange focus:ring-2 focus:ring-orange-100"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={6}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
            {status && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{status}</p>}

            <Button className="flex w-full items-center justify-center gap-2" disabled={isSubmitting}>
              <LogIn className="h-4 w-4" />
              {isSubmitting ? "Procesando..." : mode === "signin" ? "Entrar" : "Crear cuenta"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
