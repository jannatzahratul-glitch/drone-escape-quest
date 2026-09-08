import { createFileRoute, Link } from "@tanstack/react-router";
import {
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
  PRIVACY_UPDATED,
} from "@/game/legal/privacy";

const TITLE = "Privacy Policy — Maze Escape";
const DESCRIPTION =
  "Maze Escape collects no personal data. Progress is stored only on your device. No ads, no accounts, no trackers.";
const URL = "https://stonelabyrinth.online/privacy";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-5 py-12">
      <p className="text-[0.6rem] tracking-[0.42em] text-muted-foreground">MAZE ESCAPE</p>
      <h1 className="mt-3 font-display text-3xl tracking-[0.16em] text-foreground">
        Privacy Policy
      </h1>
      <p className="mt-2 text-xs tracking-[0.24em] text-muted-foreground">
        Last updated · {PRIVACY_UPDATED}
      </p>

      <p className="mt-8 leading-relaxed text-muted-foreground">{PRIVACY_INTRO}</p>

      <div className="mt-8 space-y-8">
        {PRIVACY_SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-sm tracking-[0.2em] text-primary">
              {s.title.toUpperCase()}
            </h2>
            {s.body.map((p) => (
              <p key={p} className="mt-3 leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      <Link
        to="/"
        className="mt-12 inline-block text-xs tracking-[0.28em] text-foreground underline underline-offset-4"
      >
        BACK TO GAME
      </Link>
    </main>
  );
}
