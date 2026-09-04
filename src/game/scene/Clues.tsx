import type {} from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CELL_SIZE, cellToWorld, type Maze } from "../maze/generator";
import { SYMBOLS, type Clue } from "../clues/clueSystem";
import { createSymbolTexture } from "./textures";
import { actions, getState } from "../state/gameStore";
import { playCue, vibrate } from "../audio/AudioManager";
import type { QualityProfile } from "../settings/SettingsManager";

/**
 * Clue stones + hidden-area caches, rendered as part of the world: a carved
 * obelisk with a glowing rune, lit softly so it reads from the drone camera
 * without looking like a UI element.
 */
const DISCOVER_RADIUS = CELL_SIZE * 0.8;

function ClueStone({
  clue,
  position,
  found,
  quality,
}: {
  clue: Clue;
  position: [number, number, number];
  found: boolean;
  quality: QualityProfile;
}) {
  const glowRef = useRef<THREE.PointLight>(null);
  const runeRef = useRef<THREE.Mesh>(null);
  const map = useMemo(
    () => createSymbolTexture(SYMBOLS[clue.symbol].glyph, Math.min(256, quality.textureSize)),
    [clue.symbol, quality.textureSize],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime + clue.id * 1.7;
    const pulse = 1 + Math.sin(t * 2.2) * 0.35;
    if (glowRef.current) glowRef.current.intensity = (found ? 2.4 : 4.2) * pulse;
    if (runeRef.current) runeRef.current.rotation.y = Math.sin(t * 0.4) * 0.12;
  });

  return (
    <group position={position}>
      {/* stone base */}
      <mesh position={[0, 0.12, 0]} castShadow={quality.shadows} receiveShadow>
        <cylinderGeometry args={[0.5, 0.58, 0.24, 8]} />
        <meshStandardMaterial color="#463f36" roughness={0.92} />
      </mesh>
      {/* obelisk */}
      <mesh ref={runeRef} position={[0, 0.85, 0]} castShadow={quality.shadows}>
        <boxGeometry args={[0.52, 1.3, 0.32]} />
        <meshStandardMaterial color="#544b3f" roughness={0.85} />
      </mesh>
      {/* carved rune faces */}
      {[0.17, -0.17].map((z, i) => (
        <mesh key={i} position={[0, 1.0, z]} rotation-y={i ? Math.PI : 0}>
          <planeGeometry args={[0.42, 0.42]} />
          <meshBasicMaterial map={map} transparent toneMapped={false} />
        </mesh>
      ))}
      <pointLight
        ref={glowRef}
        position={[0, 1.1, 0]}
        color={found ? "#9fd4ff" : "#ffc46a"}
        distance={CELL_SIZE * 2.6}
        intensity={4}
      />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}>
        <circleGeometry args={[0.95, 20]} />
        <meshBasicMaterial
          color={found ? "#7fb6ff" : "#ffb45e"}
          transparent
          opacity={found ? 0.08 : 0.16}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function SecretCache({
  position,
  found,
  quality,
}: {
  position: [number, number, number];
  found: boolean;
  quality: QualityProfile;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s, d) => {
    if (!ref.current) return;
    ref.current.rotation.y += d * 0.9;
    ref.current.position.y = 0.55 + Math.sin(s.clock.elapsedTime * 1.6) * 0.08;
  });
  if (found) return null;
  return (
    <group position={position}>
      <mesh ref={ref} position={[0, 0.55, 0]} castShadow={quality.shadows}>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial
          color="#cfe6ff"
          emissive="#6ea8ff"
          emissiveIntensity={1.4}
          roughness={0.3}
        />
      </mesh>
      <pointLight position={[0, 0.6, 0]} color="#8ec2ff" distance={CELL_SIZE * 1.8} intensity={3} />
    </group>
  );
}

export function Clues({
  maze,
  clues,
  hidden,
  tracker,
  quality,
  discovered,
  secrets,
  active,
}: {
  maze: Maze;
  clues: Clue[];
  hidden: Array<{ x: number; y: number }>;
  tracker: THREE.Vector3;
  quality: QualityProfile;
  discovered: number[];
  secrets: number[];
  active: boolean;
}) {
  const clueSpots = useMemo(
    () =>
      clues.map((c) => {
        const [x, z] = cellToWorld(maze, c.cell.x, c.cell.y);
        return { clue: c, pos: [x, 0, z] as [number, number, number] };
      }),
    [clues, maze],
  );
  const secretSpots = useMemo(
    () =>
      hidden.map((h, i) => {
        const [x, z] = cellToWorld(maze, h.x, h.y);
        return { index: i, pos: [x, 0, z] as [number, number, number] };
      }),
    [hidden, maze],
  );

  useFrame(() => {
    if (!active || getState().phase !== "playing") return;
    for (const s of clueSpots) {
      if (getState().discoveredClueIds.includes(s.clue.id)) continue;
      const d = Math.hypot(tracker.x - s.pos[0], tracker.z - s.pos[2]);
      if (d < DISCOVER_RADIUS) {
        actions.discoverClue(s.clue);
        playCue("clue");
        vibrate(18);
      }
    }
    for (const s of secretSpots) {
      if (getState().secretsFound.includes(s.index)) continue;
      const d = Math.hypot(tracker.x - s.pos[0], tracker.z - s.pos[2]);
      if (d < DISCOVER_RADIUS) {
        actions.discoverSecret(s.index);
        playCue("clue");
        vibrate(12);
      }
    }
  });

  return (
    <group>
      {clueSpots.map((s) => (
        <ClueStone
          key={s.clue.id}
          clue={s.clue}
          position={s.pos}
          found={discovered.includes(s.clue.id)}
          quality={quality}
        />
      ))}
      {secretSpots.map((s) => (
        <SecretCache
          key={s.index}
          position={s.pos}
          found={secrets.includes(s.index)}
          quality={quality}
        />
      ))}
    </group>
  );
}
