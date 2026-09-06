import type {} from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CELL_SIZE, WALL_HEIGHT, cellToWorld, type Gate, type Maze } from "../maze/generator";
import type { QualityProfile } from "../settings/SettingsManager";
import { getDoorTextures, getSymbolTexture } from "./textures";
import { SYMBOLS, type GateInfo } from "../clues/clueSystem";

/**
 * GateManager (view layer)
 *
 * Stone arch + banded timber door + torches. Real and fake gates are visually
 * IDENTICAL — no colour coding, no marks. The only difference appears after
 * the player touches the real one: its doors swing open onto warm light.
 */
interface ArchProps {
  position: [number, number, number];
  rotation: number;
  opened: boolean;
  seed: number;
  quality: QualityProfile;
  doorMap: THREE.Texture;
  symbolMap: THREE.Texture;
}

function GateArch({ position, rotation, opened, seed, quality, doorMap, symbolMap }: ArchProps) {
  const glow = useRef<THREE.PointLight>(null);
  const exitLight = useRef<THREE.PointLight>(null);
  const doorL = useRef<THREE.Group>(null);
  const doorR = useRef<THREE.Group>(null);
  const nudge = useRef(0);
  const open = useRef(0);
  const dust = useRef<THREE.Points>(null);

  const half = CELL_SIZE / 2;
  const pillarH = WALL_HEIGHT * 1.3;
  const doorW = CELL_SIZE * 0.46;
  const doorH = pillarH * 0.86;

  const dustGeo = useMemo(() => {
    const n = quality.particles;
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(Math.max(1, n) * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * CELL_SIZE;
      arr[i * 3 + 1] = Math.random() * pillarH;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return geo;
  }, [quality.particles, pillarH]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime + seed;
    if (glow.current) {
      glow.current.intensity = 5 + Math.sin(t * 6) * 1.1 + Math.sin(t * 2.3) * 0.7;
    }

    // door swing
    open.current += ((opened ? 1 : 0) - open.current) * (1 - Math.exp(-3.5 * delta));
    const a = open.current * (Math.PI * 0.62);
    // fake gates rattle briefly instead of opening (driven by `nudge`)
    const rattle = nudge.current > 0 ? Math.sin(nudge.current * 40) * 0.05 * nudge.current : 0;
    if (nudge.current > 0) nudge.current = Math.max(0, nudge.current - delta * 1.6);
    if (doorL.current) doorL.current.rotation.y = -a + rattle;
    if (doorR.current) doorR.current.rotation.y = a - rattle;
    if (exitLight.current) {
      exitLight.current.intensity = open.current * (14 + Math.sin(t * 3) * 2);
    }
    if (dust.current) {
      dust.current.rotation.y = t * 0.05;
      dust.current.position.y = Math.sin(t * 0.6) * 0.15;
    }
  });

  return (
    <group position={position} rotation-y={rotation}>
      {/* pillars */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (half - 0.16), 0, 0]}>
          <mesh position={[0, pillarH / 2, 0]} castShadow={quality.shadows} receiveShadow>
            <boxGeometry args={[0.46, pillarH, 0.75]} />
            <meshStandardMaterial color="#4b443a" roughness={0.85} metalness={0.06} />
          </mesh>
          {/* base plinth */}
          <mesh position={[0, 0.14, 0]} castShadow={quality.shadows}>
            <boxGeometry args={[0.62, 0.28, 0.92]} />
            <meshStandardMaterial color="#3d372f" roughness={0.9} />
          </mesh>
          {/* torch sconce */}
          <mesh position={[s * 0.28, pillarH * 0.72, 0.34]}>
            <sphereGeometry args={[0.11, 10, 8]} />
            <meshBasicMaterial color="#ffc073" />
          </mesh>
        </group>
      ))}

      {/* lintel + arch keystone */}
      <mesh position={[0, pillarH + 0.2, 0]} castShadow={quality.shadows}>
        <boxGeometry args={[CELL_SIZE + 0.34, 0.4, 0.9]} />
        <meshStandardMaterial color="#443d34" roughness={0.82} metalness={0.08} />
      </mesh>
      <mesh position={[0, pillarH + 0.52, 0]} castShadow={quality.shadows}>
        <boxGeometry args={[0.5, 0.34, 0.82]} />
        <meshStandardMaterial color="#4f4739" roughness={0.75} metalness={0.12} />
      </mesh>
      {/* carved symbol on the lintel — every gate wears one, none reveal the exit */}
      {[1, -1].map((f) => (
        <mesh key={f} position={[0, pillarH + 0.2, f * 0.46]} rotation-y={f > 0 ? 0 : Math.PI}>
          <planeGeometry args={[0.34, 0.34]} />
          <meshBasicMaterial map={symbolMap} transparent toneMapped={false} />
        </mesh>
      ))}

      {/* carved arch curve under the lintel */}
      <mesh position={[0, pillarH, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[half - 0.1, 0.08, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#584f41" roughness={0.8} />
      </mesh>

      {/* twin timber doors, hinged at the pillars */}
      {[-1, 1].map((s) => (
        <group
          key={`d${s}`}
          ref={s === -1 ? doorL : doorR}
          position={[s * (half - 0.2), 0, 0]}
        >
          <mesh position={[(-s * doorW) / 2, doorH / 2, 0]} castShadow={quality.shadows}>
            <boxGeometry args={[doorW, doorH, 0.14]} />
            <meshStandardMaterial map={doorMap} roughness={0.78} metalness={0.16} color="#b39a7d" />
          </mesh>
          {/* iron ring handle */}
          <mesh
            position={[-s * doorW * 0.85, doorH * 0.5, 0.1]}
            rotation-x={Math.PI / 2}
          >
            <torusGeometry args={[0.07, 0.02, 6, 12]} />
            <meshStandardMaterial color="#2c2a28" metalness={0.75} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* warm glow behind the doors — only visible once they open */}
      <pointLight
        ref={exitLight}
        position={[0, pillarH * 0.5, -0.9]}
        color="#ffd08a"
        distance={CELL_SIZE * 7}
        intensity={0}
      />

      <pointLight
        ref={glow}
        position={[0, pillarH * 0.72, 0.55]}
        color="#ff9a3c"
        distance={CELL_SIZE * 4.5}
        intensity={5}
      />

      {quality.particles > 0 && (
        <points ref={dust} geometry={dustGeo}>
          <pointsMaterial
            size={0.05}
            color="#ffca8a"
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}

export function Gates({
  maze,
  gates,
  quality,
  openGateId,
}: {
  maze: Maze;
  gates: GateInfo[];
  quality: QualityProfile;
  openGateId: number | null;
}) {
  const door = useMemo(() => getDoorTextures(quality.textureSize), [quality.textureSize]);
  const symbolMaps = useMemo(() => {
    const size = Math.min(256, quality.textureSize);
    const out: Record<string, THREE.Texture> = {};
    for (const g of gates) out[g.symbol] ??= getSymbolTexture(SYMBOLS[g.symbol].glyph, size);
    return out;
  }, [gates, quality.textureSize]);
  return (
    <group>
      {gates.map((gate: GateInfo) => {
        const [wx, wz] = cellToWorld(maze, gate.x, gate.y);
        const rotation = gate.side === "E" || gate.side === "W" ? Math.PI / 2 : 0;
        return (
          <GateArch
            key={gate.id}
            position={[wx, 0, wz]}
            rotation={rotation}
            opened={openGateId === gate.id}
            seed={gate.id * 2.7}
            quality={quality}
            doorMap={door.map}
            symbolMap={symbolMaps[gate.symbol]!}
          />
        );
      })}
    </group>
  );
}
