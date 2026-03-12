import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link } from "@tanstack/react-router";

export function RegisterForm() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[380px] animate-in opacity-0">
      <h1 className="font-display text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
        Create an account
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        Start planning your meals in one place.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="register-email" className="block text-sm font-medium" style={{ color: "var(--text)" }}>
            Email
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-1.5 block w-full rounded-[var(--radius)] border bg-[var(--surface)] px-4 py-2.5 text-[var(--text)] transition-colors placeholder:text-[var(--text-faint)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            style={{ borderColor: "var(--border)" }}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="register-password" className="block text-sm font-medium" style={{ color: "var(--text)" }}>
            Password
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="mt-1.5 block w-full rounded-[var(--radius)] border bg-[var(--surface)] px-4 py-2.5 text-[var(--text)] transition-colors placeholder:text-[var(--text-faint)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
        {error && (
          <p className="text-sm font-medium" style={{ color: "var(--error)" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full py-3 text-base font-medium transition-opacity disabled:opacity-60"
          style={{ background: "var(--accent)", color: "white" }}
        >
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        Already have an account?{" "}
        <Link to="/login" className="font-medium underline underline-offset-2" style={{ color: "var(--accent)" }}>
          Log in
        </Link>
      </p>
      <Link to="/" className="mt-4 block text-center text-sm" style={{ color: "var(--text-faint)" }}>
        ← Back to home
      </Link>
    </div>
  );
}
