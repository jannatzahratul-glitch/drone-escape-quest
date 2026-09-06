import type {} from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CELL_SIZE, WALL_HEIGHT, cellToWorld, isWall, type Maze } from "../maze/generator";
import type { QualityProfile } from "../settings/SettingsManager";

/**
 * Wall torches + small environmental props (rubble, moss stones) scattered in
 * dead ends. Light count is budgeted by the graphics setting since lights are
 * the most expensive thing in the scene on mobile GPUs.
 */
// shared across every torch / prop instance — never re-allocated at runtime
const FLAME_GEO = new THREE.SphereGeometry(0.14, 8, 6);
const STICK_GEO = new THREE.CylinderGeometry(0.04, 0.05, 0.4, 6);
const RUBBLE_GEO = new THREE.DodecahedronGeometry(0.16, 0);
const RUBBLE_SMALL_GEO = new THREE.DodecahedronGeometry(0.09, 0);
const FLAME_MAT = new THREE.MeshBasicMaterial({ color: "#ffd08a" });
const STICK_MAT = new THREE.MeshStandardMaterial({ color: "#4a3826", roughness: 0.95 });
const RUBBLE_MAT = new THREE.MeshStandardMaterial({ color: "#6d6558", roughness: 0.95 });
const RUBBLE_MAT_2 = new THREE.MeshStandardMaterial({ color: "#5d564a", roughness: 0.95 });

export function Torches({ maze, quality }: { maze: Maze; quality: QualityProfile }) {
  const lights = useRef<Array<THREE.PointLight | null>>([]);
  const flames = useRef<Array<THREE.Mesh | null>>([]);

  const spots = useMemo(() => {
    const max = quality.torchCount;
    const out: Array<{ pos: [number, number, number] }> = [];
    const open: Array<[number, number]> = [];
    for (let y = 1; y < maze.height - 1; y++) {
      for (let x = 1; x < maze.width - 1; x++) {
        if (!isWall(maze, x, y)) open.push([x, y]);
      }
    }
    const stride = Math.max(1, Math.floor(open.length / max));
    for (let i = 0; i < open.length && out.length < max; i += stride) {
      const [x, y] = open[i]!;
      const [wx, wz] = cellToWorld(maze, x, y);
      out.push({ pos: [wx, WALL_HEIGHT * 0.82, wz] });
    }
    return out;
  }, [maze, quality.torchCount]);

  const props = useMemo(() => {
    if (quality.particles === 0) return [];
    return maze.deadEnds.slice(0, 24).map((d, i) => {
      const [wx, wz] = cellToWorld(maze, d.x, d.y);
      const n = ((i * 37) % 13) / 13;
      return { pos: [wx + (n - 0.5) * 0.8, 0, wz + (n - 0.5) * 0.8] as [number, number, number], n };
    });
  }, [maze, quality.particles]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    lights.current.forEach((l, i) => {
      if (l) l.intensity = 10 + Math.sin(t * 7 + i * 1.7) * 2 + Math.sin(t * 13 + i) * 1;
    });
    flames.current.forEach((f, i) => {
      if (f) {
        const s = 1 + Math.sin(t * 9 + i * 2.1) * 0.16;
        f.scale.set(s, 1 + Math.sin(t * 11 + i) * 0.22, s);
      }
    });
  });

  return (
    <group>
      {spots.map((s, i) => (
        <group key={i} position={s.pos}>
          <mesh
            ref={(el) => {
              flames.current[i] = el;
            }}
            geometry={FLAME_GEO}
            material={FLAME_MAT}
          />
          <mesh position={[0, -0.28, 0]} geometry={STICK_GEO} material={STICK_MAT} />
          <pointLight
            ref={(el) => {
              lights.current[i] = el;
            }}
            color="#ffab5c"
            distance={CELL_SIZE * 6}
            intensity={11}
            castShadow={false}
          />
        </group>
      ))}

      {/* small rubble props to break up empty dead ends */}
      {props.map((p, i) => (
        <group key={`p${i}`} position={p.pos} rotation-y={p.n * Math.PI}>
          <mesh
            position={[0, 0.11, 0]}
            scale={1 + p.n * 0.6}
            geometry={RUBBLE_GEO}
            material={RUBBLE_MAT}
            castShadow={quality.shadows}
            receiveShadow
          />
          <mesh
            position={[0.3, 0.06, 0.15]}
            geometry={RUBBLE_SMALL_GEO}
            material={RUBBLE_MAT_2}
            castShadow={quality.shadows}
          />
        </group>
      ))}
    </group>
  );
}
