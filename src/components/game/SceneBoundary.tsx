import { Component, type ReactNode } from "react";
import { actions } from "@/game/state/gameStore";
import { MenuButton, Panel, Screen } from "./ui";

interface Props {
  children: ReactNode;
}
interface State {
  failed: boolean;
}

/**
 * Last-resort safety net around the 3D layer: a WebGL / scene failure returns
 * the player to the level map instead of leaving a blank screen. Progress,
 * coins and XP are already persisted, so nothing is lost.
 */
export class SceneBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Screen dim={70}>
        <Panel>
          <h2 className="font-display text-xl tracking-[0.24em]">LEVEL INTERRUPTED</h2>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            The maze could not be displayed on this device. Your coins, XP and progress are safe.
          </p>
          <div className="mt-6 space-y-3">
            <MenuButton
              onClick={() => {
                this.setState({ failed: false });
                actions.openLevels();
              }}
            >
              LEVEL MAP
            </MenuButton>
            <MenuButton
              variant="ghost"
              onClick={() => {
                this.setState({ failed: false });
                actions.mainMenu();
              }}
            >
              MAIN MENU
            </MenuButton>
          </div>
        </Panel>
      </Screen>
    );
  }
}
