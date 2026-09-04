import type {} from "@react-three/fiber";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { CELL_SIZE, cellToWorld, generateMaze, type Gate } from "../maze/generator";
import { getLevelConfig } from "../levels/levels";
import { DroneCamera } from "./DroneCamera";

const MAZE_CENTER = new THREE.Vector3(0, 0, 0);
import { Gates } from "./Gates";
import { MazeMesh } from "./MazeMesh";
import { Player } from "./Player";
import { Torches } from "./Torches";

interface GameSceneProps {
  level: number;
  paused: boolean;
  /** menu backdrop mode: slow orbit, no player control */
  cinematic?: boolean;
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
  onGate,
  onLeaveGate,
}: GameSceneProps) {
  const maze = useMemo(() => generateMaze(getLevelConfig(level).maze), [level]);
  const tracker = useRef(
    new THREE.Vector3(
      ...(() => {
        const [x, z] = cellToWorld(maze, maze.start.x, maze.start.y);
        return [x, 0, z] as [number, number, number];
      })(),
    ),
  );

  const span = Math.max(maze.width, maze.height) * CELL_SIZE;

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 45, near: 0.5, far: span * 4 }}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={["#0a0a0d"]} />
      <fog attach="fog" args={["#0d0c10", span * 0.55, span * 1.5]} />

      <ambientLight intensity={0.6} color="#9fb0d0" />
      <hemisphereLight args={["#5d6e92", "#2c2319", 0.8]} />
      <directionalLight
        position={[span * 0.4, span * 0.9, span * 0.35]}
        intensity={2.1}
        color="#ffe7c4"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-span * 0.75}
        shadow-camera-right={span * 0.75}
        shadow-camera-top={span * 0.75}
        shadow-camera-bottom={-span * 0.75}
        shadow-camera-far={span * 3}
        shadow-bias={-0.0012}
      />

      <Suspense fallback={null}>
        <Environment resolution={64}>
          <Lightformer intensity={1.2} position={[0, 6, 0]} scale={[12, 12, 1]} color="#5c6a8c" />
          <Lightformer
            intensity={0.6}
            color="#ff9a55"
            position={[-6, 2, 2]}
            rotation-y={Math.PI / 2}
            scale={[20, 2, 1]}
          />
        </Environment>

        <MazeMesh maze={maze} />
        <Gates maze={maze} />
        <Torches maze={maze} />
        {!cinematic && (
          <Player
            maze={maze}
            tracker={tracker.current}
            paused={paused}
            onGate={(g) => onGate?.(g)}
            onLeaveGate={() => onLeaveGate?.()}
          />
        )}
      </Suspense>

      <DroneCamera
        maze={maze}
        target={cinematic ? MAZE_CENTER : tracker.current}
        cinematic={cinematic}
        zoom={cinematic ? 1.9 : 1}
      />
    </Canvas>
  );
}
