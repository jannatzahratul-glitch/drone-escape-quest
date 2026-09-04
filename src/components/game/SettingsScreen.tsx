import { playCue, vibrate } from "@/game/audio/AudioManager";
import {
  setSetting,
  useSettings,
  type GraphicsQuality,
  type Settings,
} from "@/game/settings/SettingsManager";
import { actions } from "@/game/state/gameStore";
import { MenuButton, Panel, Screen } from "./ui";

function Toggle({ label, name }: { label: string; name: keyof Settings }) {
  const value = useSettings((s) => s[name]) as boolean;
  return (
    <button
      onClick={() => {
        setSetting(name, !value as never);
        playCue("ui");
        if (name === "vibration" && !value) vibrate(30);
      }}
      className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-background/25 px-5 py-3.5 transition-colors hover:bg-background/45"
    >
      <span className="text-xs tracking-[0.22em] text-foreground">{label}</span>
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${
          value ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-background transition-all ${
            value ? "left-[1.4rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

const QUALITIES: GraphicsQuality[] = ["low", "medium", "high"];

export function SettingsScreen() {
  const graphics = useSettings((s) => s.graphics);
  return (
    <Screen dim={62}>
      <Panel>
        <h2 className="font-display text-2xl tracking-[0.3em]">SETTINGS</h2>
        <div className="mt-7 space-y-3 text-left">
          <Toggle label="SOUND" name="sound" />
          <Toggle label="MUSIC" name="music" />
          <Toggle label="VIBRATION" name="vibration" />

          <div className="rounded-2xl border border-border/60 bg-background/25 px-5 py-4">
            <p className="text-xs tracking-[0.22em] text-foreground">GRAPHICS</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {QUALITIES.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setSetting("graphics", q);
                    playCue("ui");
                  }}
                  className={`rounded-xl px-2 py-2 text-[0.6rem] tracking-[0.18em] uppercase transition-colors ${
                    graphics === q
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[0.6rem] text-muted-foreground">
              Lower settings reduce shadows, particles and texture detail for smoother play on
              older phones.
            </p>
          </div>
        </div>

        <div className="mt-7">
          <MenuButton variant="ghost" onClick={actions.mainMenu}>
            BACK
          </MenuButton>
        </div>
      </Panel>
    </Screen>
  );
}
