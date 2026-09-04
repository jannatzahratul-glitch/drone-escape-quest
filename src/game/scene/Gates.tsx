import type {} from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CELL_SIZE, WALL_HEIGHT, cellToWorld, type Gate, type Maze } from "../maze/generator";

/**
 * 3D gate archways. IMPORTANT: real and fake gates look identical — the player
 * must explore to discover which one actually opens.
 */
function GateArch({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  const glow = useRef<THREE.PointLight>(null);
  const seed = useMemo(() => Math.random() * 10, []);

  useFrame((state) => {
    if (glow.current) {
      const t = state.clock.elapsedTime + seed;
      glow.current.intensity = 6 + Math.sin(t * 6) * 1.2 + Math.sin(t * 2.3) * 0.8;
    }
  });

  const half = CELL_SIZE / 2;
  const pillarH = WALL_HEIGHT * 1.25;

  return (
    <group position={position} rotation-y={rotation}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (half - 0.18), pillarH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, pillarH, 0.55]} />
          <meshStandardMaterial color="#3a3128" roughness={0.65} metalness={0.25} />
        </mesh>
      ))}
      {/* lintel */}
      <mesh position={[0, pillarH + 0.18, 0]} castShadow>
        <boxGeometry args={[CELL_SIZE + 0.2, 0.36, 0.7]} />
        <meshStandardMaterial color="#332b23" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* rune band — warm, never a "correct" indicator */}
      <mesh position={[0, pillarH + 0.18, 0.36]}>
        <planeGeometry args={[CELL_SIZE - 0.2, 0.14]} />
        <meshBasicMaterial color="#ffab52" transparent opacity={0.85} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`b${s}`} position={[s * (half - 0.18), pillarH - 0.35, 0.32]}>
          <sphereGeometry args={[0.12, 10, 8]} />
          <meshBasicMaterial color="#ffbe66" />
        </mesh>
      ))}
      <pointLight
        ref={glow}
        position={[0, pillarH - 0.4, 0.5]}
        color="#ff9a3c"
        distance={CELL_SIZE * 4}
        intensity={6}
      />
    </group>
  );
}

export function Gates({ maze }: { maze: Maze }) {
  return (
    <group>
      {maze.gates.map((gate: Gate) => {
        const [wx, wz] = cellToWorld(maze, gate.x, gate.y);
        const rotation = gate.side === "E" || gate.side === "W" ? Math.PI / 2 : 0;
        return <GateArch key={gate.id} position={[wx, 0, wz]} rotation={rotation} />;
      })}
    </group>
  );
}
