import type {} from "@react-three/fiber";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { CELL_SIZE, cellToWorld, generateMaze, type Gate } from "../maze/generator";
import { getLevelConfig } from "../levels/levels";
import { setJoystick } from "../input/input";
import { getQuality, useSettings, QUALITY } from "../settings/SettingsManager";
import { DroneCamera } from "./DroneCamera";
import { Gates } from "./Gates";
import { MazeMesh } from "./MazeMesh";
import { Player } from "./Player";
import { Torches } from "./Torches";

const MAZE_CENTER = new THREE.Vector3(0, 0, 0);

interface GameSceneProps {
  level: number;
  paused: boolean;
  /** menu backdrop mode: slow orbit, no player control */
  cinematic?: boolean;
  /** gate currently swinging open (the real exit) */
  openGateId?: number | null;
  onGate?: (gate: Gate) => void;
  onLeaveGate?: () => void;
}

/**
 * The 3D engine layer. It knows nothing about the HUD — everything it needs
 * comes in as props and it reports gameplay events through callbacks.
 */
export function GameScene({
  level,
  paused,
  cinematic = false,
  openGateId = null,
  onGate,
  onLeaveGate,
}: GameSceneProps) {
  const graphics = useSettings((s) => s.graphics);
  const quality = QUALITY[graphics] ?? getQuality();
  const maze = useMemo(() => generateMaze(getLevelConfig(level).maze), [level]);
  const tracker = useRef(
    new THREE.Vector3(
      ...(() => {
        const [x, z] = cellToWorld(maze, maze.start.x, maze.start.y);
        return [x, 0, z] as [number, number, number];
      })(),
    ),
  );
  const motion = useRef(new THREE.Vector2(0, 0));

  const span = Math.max(maze.width, maze.height) * CELL_SIZE;

  // Dev-only bridge used by automated gameplay tests.
  if (import.meta.env.DEV && typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>)["__mazeDebug"] = {
      maze,
      tracker: tracker.current,
      setJoystick,
    };
  }

  return (
    <Canvas
      shadows={quality.shadows}
      dpr={quality.dpr}
      gl={{ antialias: quality.antialias, powerPreference: "high-performance" }}
      camera={{ fov: 45, near: 0.5, far: span * 4 }}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={["#08080b"]} />
      <fog
        attach="fog"
        args={["#0c0b10", span * (0.85 * quality.fogTightness), span * 2.3]}
      />

      <ambientLight intensity={0.95} color="#8fa2c4" />
      <hemisphereLight args={["#59688a", "#2a2119", 0.95]} />
      {/* cool moonlight key so the stone reads dark but never unreadable */}
      <directionalLight
        position={[span * 0.4, span * 0.95, span * 0.35]}
        intensity={2.6}
        color="#d8e2ff"
        castShadow={quality.shadows}
        shadow-mapSize-width={quality.shadowMapSize}
        shadow-mapSize-height={quality.shadowMapSize}
        shadow-camera-left={-span * 0.75}
        shadow-camera-right={span * 0.75}
        shadow-camera-top={span * 0.75}
        shadow-camera-bottom={-span * 0.75}
        shadow-camera-far={span * 3}
        shadow-bias={-0.0012}
      />
      {/* warm bounce from the torches below */}
      <directionalLight
        position={[-span * 0.3, span * 0.4, -span * 0.4]}
        intensity={0.8}
        color="#ffb066"
      />

      <Suspense fallback={null}>
        <Environment resolution={64}>
          <Lightformer intensity={1.1} position={[0, 6, 0]} scale={[14, 14, 1]} color="#54628a" />
          <Lightformer
            intensity={0.7}
            color="#ff9a55"
            position={[-6, 2, 2]}
            rotation-y={Math.PI / 2}
            scale={[22, 2, 1]}
          />
          <Lightformer
            intensity={0.5}
            color="#6d86c4"
            position={[6, 3, -3]}
            rotation-y={-Math.PI / 2}
            scale={[22, 3, 1]}
          />
        </Environment>

        <MazeMesh maze={maze} quality={quality} />
        <Gates maze={maze} quality={quality} openGateId={openGateId} />
        <Torches maze={maze} quality={quality} />
        {!cinematic && (
          <Player
            maze={maze}
            tracker={tracker.current}
            motion={motion.current}
            paused={paused}
            quality={quality}
            onGate={(g) => onGate?.(g)}
            onLeaveGate={() => onLeaveGate?.()}
          />
        )}
      </Suspense>

      <DroneCamera
        maze={maze}
        target={cinematic ? MAZE_CENTER : tracker.current}
        motion={cinematic ? undefined : motion.current}
        cinematic={cinematic}
        focus={openGateId !== null}
        zoom={cinematic ? 1.55 : 1}
      />
    </Canvas>
  );
}
