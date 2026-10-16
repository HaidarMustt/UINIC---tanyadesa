"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MAX_ASPIRATION_LENGTH, MIN_ASPIRATION_LENGTH } from "../constants";
import { TurnstileWidget } from "./turnstile-widget";

interface AspirationFormProps {
  slug: string;
  dusuns: { name: string; rts: string[] }[];
  turnstileSiteKey: string | null; // null = CAPTCHA turned off (local development)
}

const FIELD = "w-full rounded-xl border border-line bg-surface px-4 py-3";

export function AspirationForm({ slug, dusuns, turnstileSiteKey }: AspirationFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [dusun, setDusun] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const waitingForCaptcha = turnstileSiteKey !== null && captchaToken === null;

  const rts = dusuns.find((item) => item.name === dusun)?.rts ?? [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch(`/api/v1/desa/${slug}/aspirations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: form.get("content"),
          dusun: form.get("dusun"),
          rt: form.get("rt"),
          senderName: form.get("senderName"),
          contact: form.get("contact"),
          turnstileToken: captchaToken,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "Aspirasi belum terkirim. Coba lagi.");

      // The tracking page is the confirmation: the resident sees the code right away.
      router.push(`/desa/${slug}/aspirasi/${body.trackingCode}?baru=1`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Aspirasi belum terkirim. Coba lagi.");
      setIsSending(false);
      setCaptchaReset((count) => count + 1); // a token works once, so ask for a new one
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-surface p-5 sm:p-6">
      <div className="space-y-1.5">
        <label htmlFor="content" className="font-bold">
          Apa yang ingin kamu sampaikan?
        </label>
        <textarea
          id="content"
          name="content"
          rows={5}
          required
          minLength={MIN_ASPIRATION_LENGTH}
          maxLength={MAX_ASPIRATION_LENGTH}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          aria-describedby="content-hint"
          className={`${FIELD} resize-y`}
        />
        <p id="content-hint" className="text-sm text-muted">
          Ceritakan apa, di mana, dan sejak kapan. {content.length}/{MAX_ASPIRATION_LENGTH}
        </p>
      </div>

      <div className="flex gap-3">
        <div className="flex-[2] space-y-1.5">
          <label htmlFor="dusun" className="font-bold">
            Dusun
          </label>
          <select id="dusun" name="dusun" value={dusun} onChange={(event) => setDusun(event.target.value)} className={FIELD}>
            <option value="">Seluruh desa / tidak tahu</option>
            {dusuns.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-1.5">
          <label htmlFor="rt" className="font-bold">
            RT
          </label>
          <select id="rt" name="rt" disabled={rts.length === 0} className={`${FIELD} disabled:opacity-50`}>
            <option value="">-</option>
            {rts.map((rt) => (
              <option key={rt} value={rt}>
                {rt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="space-y-3 rounded-xl border border-dashed border-line p-4">
        <legend className="px-1.5 font-bold">Identitas (boleh dikosongkan)</legend>
        <div className="space-y-1.5">
          <label htmlFor="senderName" className="text-sm font-semibold">
            Nama
          </label>
          <input id="senderName" name="senderName" maxLength={80} placeholder="Tanpa nama" className={FIELD} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="contact" className="text-sm font-semibold">
            Nomor WA atau email
          </label>
          <input
            id="contact"
            name="contact"
            maxLength={100}
            placeholder="Supaya desa bisa menghubungimu"
            aria-describedby="contact-hint"
            className={FIELD}
          />
          <p id="contact-hint" className="text-sm text-muted">
            Hanya bisa dilihat perangkat desa dan BPD, tidak pernah ditampilkan ke publik.
          </p>
        </div>
      </fieldset>

      {turnstileSiteKey && (
        <TurnstileWidget siteKey={turnstileSiteKey} onToken={setCaptchaToken} resetSignal={captchaReset} />
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-kunyit-soft px-4 py-3 text-sm text-kunyit-ink">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSending || waitingForCaptcha}
        className="w-full rounded-full bg-stamp py-3.5 text-lg font-extrabold text-surface disabled:opacity-60"
      >
        {isSending ? "Mengirim…" : waitingForCaptcha ? "Memeriksa keamanan…" : "Kirim aspirasi"}
      </button>
    </form>
  );
}
