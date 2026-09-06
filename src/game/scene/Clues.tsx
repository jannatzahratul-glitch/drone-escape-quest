import type {} from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import * as THREE from "three";
import { CELL_SIZE, cellToWorld, type Maze } from "../maze/generator";
import { SYMBOLS, type Clue } from "../clues/clueSystem";
import { getSymbolTexture } from "./textures";
import { actions, getState, useGame } from "../state/gameStore";
import { playCue, vibrate } from "../audio/AudioManager";
import type { QualityProfile } from "../settings/SettingsManager";

/**
 * Clue stones + hidden-area caches, rendered as part of the world: a carved
 * obelisk with a glowing rune, lit softly so it reads from the drone camera
 * without looking like a UI element.
 *
 * Performance notes (mobile):
 *  - every geometry / material below is module-level and shared by all stones,
 *    so approaching one never allocates GPU resources mid-frame;
 *  - the rune textures are cached and pre-warmed before the level starts;
 *  - proximity checks run on a fixed 10 Hz budget with squared distances and
 *    zero per-frame allocations.
 */
const DISCOVER_RADIUS = CELL_SIZE * 0.8;
const DISCOVER_RADIUS_SQ = DISCOVER_RADIUS * DISCOVER_RADIUS;
const PROXIMITY_INTERVAL = 0.1;

// ---- shared geometry / materials (created once for the whole app) ----
const BASE_GEO = new THREE.CylinderGeometry(0.5, 0.58, 0.24, 8);
const OBELISK_GEO = new THREE.BoxGeometry(0.52, 1.3, 0.32);
const RUNE_GEO = new THREE.PlaneGeometry(0.42, 0.42);
const HALO_GEO = new THREE.CircleGeometry(0.95, 20);
const CACHE_GEO = new THREE.OctahedronGeometry(0.22, 0);

const BASE_MAT = new THREE.MeshStandardMaterial({ color: "#5c544a", roughness: 0.9 });
const OBELISK_MAT = new THREE.MeshStandardMaterial({ color: "#6d6355", roughness: 0.82 });
const HALO_MAT_NEW = new THREE.MeshBasicMaterial({
  color: "#ffc078",
  transparent: true,
  opacity: 0.2,
  depthWrite: false,
});
const HALO_MAT_FOUND = new THREE.MeshBasicMaterial({
  color: "#93c2ff",
  transparent: true,
  opacity: 0.1,
  depthWrite: false,
});
const CACHE_MAT = new THREE.MeshStandardMaterial({
  color: "#dcecff",
  emissive: new THREE.Color("#7fb4ff"),
  emissiveIntensity: 1.5,
  roughness: 0.3,
});
const runeMatCache = new Map<string, THREE.MeshBasicMaterial>();
function runeMaterial(glyph: string, size: number) {
  const key = `${glyph}@${size}`;
  let m = runeMatCache.get(key);
  if (!m) {
    m = new THREE.MeshBasicMaterial({
      map: getSymbolTexture(glyph, size),
      transparent: true,
      toneMapped: false,
    });
    runeMatCache.set(key, m);
  }
  return m;
}

const ClueStone = memo(function ClueStone({
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
  const runeMat = runeMaterial(SYMBOLS[clue.symbol].glyph, Math.min(256, quality.textureSize));

  useFrame((state) => {
    const t = state.clock.elapsedTime + clue.id * 1.7;
    const pulse = 1 + Math.sin(t * 2.2) * 0.35;
    if (glowRef.current) glowRef.current.intensity = (found ? 3 : 5.4) * pulse;
    if (runeRef.current) runeRef.current.rotation.y = Math.sin(t * 0.4) * 0.12;
  });

  return (
    <group position={position}>
      {/* stone base */}
      <mesh
        position={[0, 0.12, 0]}
        geometry={BASE_GEO}
        material={BASE_MAT}
        castShadow={quality.shadows}
        receiveShadow
      />
      {/* obelisk */}
      <mesh
        ref={runeRef}
        position={[0, 0.85, 0]}
        geometry={OBELISK_GEO}
        material={OBELISK_MAT}
        castShadow={quality.shadows}
      />
      {/* carved rune faces */}
      {[0.17, -0.17].map((z, i) => (
        <mesh
          key={i}
          position={[0, 1.0, z]}
          rotation-y={i ? Math.PI : 0}
          geometry={RUNE_GEO}
          material={runeMat}
        />
      ))}
      <pointLight
        ref={glowRef}
        position={[0, 1.1, 0]}
        color={found ? "#a9daff" : "#ffcd85"}
        distance={CELL_SIZE * 3}
        intensity={5}
      />
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0.04, 0]}
        geometry={HALO_GEO}
        material={found ? HALO_MAT_FOUND : HALO_MAT_NEW}
      />
    </group>
  );
});

const SecretCache = memo(function SecretCache({
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
      <mesh
        ref={ref}
        position={[0, 0.55, 0]}
        geometry={CACHE_GEO}
        material={CACHE_MAT}
        castShadow={quality.shadows}
      />
      <pointLight position={[0, 0.6, 0]} color="#a5d0ff" distance={CELL_SIZE * 2} intensity={3.4} />
    </group>
  );
});

export function Clues({
  maze,
  clues,
  hidden,
  tracker,
  quality,
  active,
}: {
  maze: Maze;
  clues: Clue[];
  hidden: Array<{ x: number; y: number }>;
  tracker: THREE.Vector3;
  quality: QualityProfile;
  active: boolean;
}) {
  // subscribing here (rather than in GameScene) keeps a clue pickup from
  // re-rendering the whole 3D scene graph — that re-render was the frame spike
  const discovered = useGame((s) => s.discoveredClueIds);
  const secrets = useGame((s) => s.secretsFound);

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

  const acc = useRef(0);
  useFrame((_, delta) => {
    if (!active) return;
    acc.current += delta;
    if (acc.current < PROXIMITY_INTERVAL) return;
    acc.current = 0;
    const s = getState();
    if (s.phase !== "playing") return;
    const px = tracker.x;
    const pz = tracker.z;
    for (let i = 0; i < clueSpots.length; i++) {
      const spot = clueSpots[i]!;
      if (s.discoveredClueIds.includes(spot.clue.id)) continue;
      const dx = px - spot.pos[0];
      const dz = pz - spot.pos[2];
      if (dx * dx + dz * dz < DISCOVER_RADIUS_SQ) {
        actions.discoverClue(spot.clue);
        playCue("clue");
        vibrate(18);
      }
    }
    for (let i = 0; i < secretSpots.length; i++) {
      const spot = secretSpots[i]!;
      if (s.secretsFound.includes(spot.index)) continue;
      const dx = px - spot.pos[0];
      const dz = pz - spot.pos[2];
      if (dx * dx + dz * dz < DISCOVER_RADIUS_SQ) {
        actions.discoverSecret(spot.index);
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
