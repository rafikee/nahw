"use client";

import { useEffect, useState } from "react";

interface EmailCaptureProps {
  source?: string;
  withComment?: boolean;
}

type Status = "idle" | "submitting" | "success" | "error";

const SUBSCRIBED_KEY = "nahw-subscribed";
const SUBSCRIBED_EMAIL_KEY = "nahw-subscribed-email";

export function EmailCapture({ source, withComment = false }: EmailCaptureProps) {
  const [hidden, setHidden] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    try {
      if (window.localStorage.getItem(SUBSCRIBED_KEY)) return;
    } catch {
      /* ignore */
    }
    setHidden(false);
  }, []);

  if (hidden) return null;

  if (status === "success") {
    return (
      <div className="w-full rounded-2xl border border-success-border bg-success-soft px-5 py-5 text-center">
        <p className="type-body-lg font-bold text-success-text">
          تَمَّ! سَنُخْبِرُكَ قَرِيبًا.
        </p>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");

    const trimmedEmail = email.trim();
    const trimmedComment = comment.trim();

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          name: name.trim() || undefined,
          source,
          website,
        }),
      });
      const json = (await res.json()) as { ok: boolean };
      if (!res.ok || !json.ok) {
        setStatus("error");
        return;
      }
      try {
        window.localStorage.setItem(SUBSCRIBED_KEY, "1");
        window.localStorage.setItem(SUBSCRIBED_EMAIL_KEY, trimmedEmail.toLowerCase());
      } catch {
        /* ignore */
      }

      if (withComment && trimmedComment.length > 0) {
        // Best-effort — feedback failure shouldn't block subscribe success.
        void fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "general",
            comment: trimmedComment,
            email: trimmedEmail.toLowerCase(),
          }),
        });
      }

      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const submitting = status === "submitting";

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl border border-success-border bg-success-soft px-5 py-5 space-y-4 text-right"
    >
      <div className="space-y-1">
        <h3 className="type-body-lg font-bold text-success-text">
          هَلْ تُرِيدُ الْمَزِيدَ؟
        </h3>
        <p className="type-body text-body">
          اِتْرُكْ بَرِيدَكَ وَسَنُخْبِرُكَ عِنْدَ إِضَافَةِ دُرُوسٍ جَدِيدَةٍ.
        </p>
      </div>

      <input
        type="email"
        required
        dir="auto"
        autoComplete="email"
        placeholder="البَرِيدُ الإِلِكْتُرُونِيُّ"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl border border-success-border bg-surface px-4 py-3 type-body-lg text-heading text-right placeholder:text-faint focus:outline-none focus:border-success-strong"
      />

      <input
        type="text"
        maxLength={80}
        autoComplete="given-name"
        dir="auto"
        placeholder="الِاسْمُ (اِخْتِيَارِيٌّ)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border border-success-border bg-surface px-4 py-3 type-body-lg text-heading text-right placeholder:text-faint focus:outline-none focus:border-success-strong"
      />

      {withComment && (
        <textarea
          dir="auto"
          rows={2}
          maxLength={2000}
          placeholder="تَعْلِيقَاتٌ (اِخْتِيَارِيٌّ)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-xl border border-success-border bg-surface px-4 py-3 type-body text-heading text-right placeholder:text-faint focus:outline-none focus:border-success-strong"
        />
      )}

      {/* honeypot — visually hidden, screen readers and bots see it */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-2xl bg-success-strong py-4 type-body-lg font-bold text-on-primary hover:bg-success-strong-hover active:scale-[0.98] transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "..." : "نَعَمْ، أَخْبِرْنِي"}
      </button>

      {status === "error" && (
        <p className="type-body font-semibold text-danger-text text-center">
          حَدَثَ خَطَأٌ، حَاوِلْ مَرَّةً أُخْرَى.
        </p>
      )}
    </form>
  );
}
