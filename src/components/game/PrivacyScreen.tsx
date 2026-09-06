import { actions } from "@/game/state/gameStore";
import { PRIVACY_INTRO, PRIVACY_SECTIONS, PRIVACY_UPDATED } from "@/game/legal/privacy";
import { MenuButton, Panel, Screen } from "./ui";

/** In-app privacy policy — mirrors the public /privacy page. */
export function PrivacyScreen() {
  return (
    <Screen>
      <Panel wide>
        <h2 className="font-display text-2xl tracking-[0.22em] text-foreground">PRIVACY POLICY</h2>
        <p className="mt-2 text-[0.55rem] tracking-[0.32em] text-muted-foreground">
          LAST UPDATED · {PRIVACY_UPDATED.toUpperCase()}
        </p>

        <p className="mt-5 text-left text-sm leading-relaxed text-muted-foreground">
          {PRIVACY_INTRO}
        </p>

        <div className="mt-5 space-y-5 text-left">
          {PRIVACY_SECTIONS.map((s) => (
            <section key={s.title}>
              <h3 className="font-display text-xs tracking-[0.22em] text-primary">
                {s.title.toUpperCase()}
              </h3>
              {s.body.map((p) => (
                <p key={p} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-7">
          <MenuButton variant="ghost" onClick={actions.closePrivacy}>
            BACK
          </MenuButton>
        </div>
      </Panel>
    </Screen>
  );
}
