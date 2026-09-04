import { AudioManager, playCue } from "@/game/audio/AudioManager";
import { haptics } from "@/game/haptics/HapticManager";
import {
  setSetting,
  useSettings,
  type GraphicsQuality,
  type Settings,
} from "@/game/settings/SettingsManager";
import { actions } from "@/game/state/gameStore";
import { MenuButton, Panel, Screen } from "./ui";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="pt-2 text-[0.55rem] tracking-[0.35em] text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Toggle({ label, name }: { label: string; name: keyof Settings }) {
  const value = useSettings((s) => s[name]) as boolean;
  return (
    <button
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => {
        const next = !value;
        setSetting(name, next as never);
        playCue("ui");
        if (name === "music") AudioManager.toggleMusic(next);
        if (name === "sound") AudioManager.toggleSFX();
        if (name === "vibration" && next) haptics.medium();
      }}
      className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-border/60 bg-background/25 px-5 py-3.5 transition-colors hover:bg-background/45"
    >
      <span className="text-xs tracking-[0.22em] text-foreground">{label}</span>
      <span className="flex items-center gap-3">
        {/* text state, so locked/enabled is never colour-only */}
        <span className="text-[0.55rem] tracking-[0.28em] text-muted-foreground">
          {value ? "ON" : "OFF"}
        </span>
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
      </span>
    </button>
  );
}

function Slider({
  label,
  name,
  min = 0,
  max = 1,
  step = 0.05,
  format,
  disabled = false,
  onCommit,
}: {
  label: string;
  name: keyof Settings;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  disabled?: boolean;
  onCommit?: () => void;
}) {
  const value = useSettings((s) => s[name]) as number;
  const shown = format ? format(value) : `${Math.round(value * 100)}%`;
  return (
    <div
      className={`rounded-2xl border border-border/60 bg-background/25 px-5 py-4 ${
        disabled ? "opacity-45" : ""
      }`}
    >
      <div className="flex items-baseline justify-between">
        <label htmlFor={`set-${name}`} className="text-xs tracking-[0.22em] text-foreground">
          {label}
        </label>
        <span className="font-display text-xs tabular-nums text-primary">{shown}</span>
      </div>
      <input
        id={`set-${name}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => setSetting(name, Number(e.target.value) as never)}
        onPointerUp={() => {
          playCue("ui");
          onCommit?.();
        }}
        className="mt-3 h-8 w-full cursor-pointer accent-[var(--primary)]"
      />
    </div>
  );
}

const QUALITIES: GraphicsQuality[] = ["low", "medium", "high"];

export function SettingsScreen() {
  const graphics = useSettings((s) => s.graphics);
  const music = useSettings((s) => s.music);
  const sound = useSettings((s) => s.sound);

  return (
    <Screen dim={62}>
      <Panel wide>
        <h2 className="font-display text-2xl tracking-[0.3em]">SETTINGS</h2>

        <div className="mt-5 space-y-3 text-left">
          <Section title="AUDIO">
            <Toggle label="MUSIC" name="music" />
            <Toggle label="SOUND EFFECTS" name="sound" />
            <Slider label="MASTER VOLUME" name="masterVolume" />
            <Slider
              label="MUSIC VOLUME"
              name="musicVolume"
              disabled={!music}
              onCommit={() => AudioManager.setMusicVolume(0)}
            />
            <Slider
              label="SFX VOLUME"
              name="sfxVolume"
              disabled={!sound}
              onCommit={() => playCue("coin")}
            />
          </Section>

          <Section title="HAPTIC">
            <Toggle label="HAPTIC FEEDBACK" name="vibration" />
          </Section>

          <Section title="GAMEPLAY">
            <Slider
              label="CAMERA SENSITIVITY"
              name="cameraSensitivity"
              min={0.5}
              max={1.5}
              step={0.05}
              format={(v) => `${v.toFixed(2)}x`}
            />
            <Slider
              label="JOYSTICK SENSITIVITY"
              name="joystickSensitivity"
              min={0.5}
              max={1.5}
              step={0.05}
              format={(v) => `${v.toFixed(2)}x`}
            />
            <Toggle label="HINT PROMPTS" name="hintPrompts" />
          </Section>

          <Section title="GRAPHICS">
            <div className="rounded-2xl border border-border/60 bg-background/25 px-5 py-4">
              <div className="grid grid-cols-3 gap-2">
                {QUALITIES.map((q) => (
                  <button
                    key={q}
                    aria-pressed={graphics === q}
                    onClick={() => {
                      setSetting("graphics", q);
                      playCue("ui");
                    }}
                    className={`min-h-11 rounded-xl px-2 text-[0.6rem] tracking-[0.18em] uppercase transition-colors ${
                      graphics === q
                        ? "bg-primary font-display text-primary-foreground"
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
          </Section>
        </div>

        <div className="mt-7">
          <MenuButton variant="ghost" onClick={actions.closeSettings}>
            BACK
          </MenuButton>
        </div>
      </Panel>
    </Screen>
  );
}
