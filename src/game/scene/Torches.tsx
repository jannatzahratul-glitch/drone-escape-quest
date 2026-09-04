import type {} from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CELL_SIZE, WALL_HEIGHT, cellToWorld, isWall, type Maze } from "../maze/generator";

/**
 * A handful of flickering wall torches. Count is capped for mobile GPUs —
 * lights are the most expensive thing in this scene.
 */
const MAX_TORCHES = 5;

export function Torches({ maze }: { maze: Maze }) {
  const lights = useRef<Array<THREE.PointLight | null>>([]);

  const spots = useMemo(() => {
    const out: Array<{ pos: [number, number, number] }> = [];
    const stride = Math.max(2, Math.floor((maze.width * maze.height) / (MAX_TORCHES * 6)));
    let counter = 0;
    for (let y = 1; y < maze.height - 1 && out.length < MAX_TORCHES; y++) {
      for (let x = 1; x < maze.width - 1 && out.length < MAX_TORCHES; x++) {
        if (isWall(maze, x, y)) continue;
        if (counter++ % stride !== 0) continue;
        const [wx, wz] = cellToWorld(maze, x, y);
        out.push({ pos: [wx, WALL_HEIGHT * 0.8, wz] });
      }
    }
    return out;
  }, [maze]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    lights.current.forEach((l, i) => {
      if (l) l.intensity = 9 + Math.sin(t * 7 + i * 1.7) * 2 + Math.sin(t * 13 + i) * 1;
    });
  });

  return (
    <group>
      {spots.map((s, i) => (
        <group key={i} position={s.pos}>
          <mesh>
            <sphereGeometry args={[0.13, 8, 6]} />
            <meshBasicMaterial color="#ffc06a" />
          </mesh>
          <pointLight
            ref={(el) => {
              lights.current[i] = el;
            }}
            color="#ff9840"
            distance={CELL_SIZE * 6}
            intensity={9}
            castShadow={false}
          />
        </group>
      ))}
    </group>
  );
}
