import type {} from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getMoveVector } from "../input/input";
import {
  CELL_SIZE,
  cellToWorld,
  isWall,
  worldToCell,
  type Gate,
  type Maze,
} from "../maze/generator";
import type { QualityProfile } from "../settings/SettingsManager";

/**
 * PlayerController
 *
 * A hooded explorer: cloaked torso, swinging arms and legs, breathing idle
 * pose, smooth turn-to-face and a soft contact shadow so the figure reads
 * clearly from the drone camera without dominating the frame.
 */
const SPEED = 5.2;
const ACCEL = 14;
const RADIUS = 0.42;

function isFree(maze: Maze, wx: number, wz: number) {
  const corners: Array<[number, number]> = [
    [wx - RADIUS, wz - RADIUS],
    [wx + RADIUS, wz - RADIUS],
    [wx - RADIUS, wz + RADIUS],
    [wx + RADIUS, wz + RADIUS],
  ];
  for (const [cx, cz] of corners) {
    const c = worldToCell(maze, cx, cz);
    if (isWall(maze, c.x, c.y)) return false;
  }
  return true;
}

interface PlayerProps {
  maze: Maze;
  /** shared vector the camera follows */
  tracker: THREE.Vector3;
  /** shared velocity so the camera can lead the movement */
  motion: THREE.Vector2;
  paused: boolean;
  quality: QualityProfile;
  onGate: (gate: Gate) => void;
  onLeaveGate: () => void;
}

export function Player({
  maze,
  tracker,
  motion,
  paused,
  quality,
  onGate,
  onLeaveGate,
}: PlayerProps) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const armL = useRef<THREE.Mesh>(null);
  const armR = useRef<THREE.Mesh>(null);
  const velocity = useRef(new THREE.Vector2(0, 0));
  const walkPhase = useRef(0);
  const idlePhase = useRef(0);
  const currentGate = useRef<number | null>(null);

  const startWorld = useMemo(() => cellToWorld(maze, maze.start.x, maze.start.y), [maze]);

  // Dev-only teleport used by automated gameplay tests.
  if (import.meta.env.DEV && typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>)["__mazeWarp"] = (x: number, y: number) => {
      const [wx, wz] = cellToWorld(maze, x, y);
      group.current?.position.set(wx, 0, wz);
      currentGate.current = null;
    };
  }

  useFrame((_, rawDelta) => {
    const g = group.current;
    if (!g) return;
    const delta = Math.min(rawDelta, 0.05);

    if (paused) {
      velocity.current.set(0, 0);
      motion.set(0, 0);
      return;
    }

    const input = getMoveVector();
    const target = new THREE.Vector2(input.x * SPEED, input.y * SPEED);
    velocity.current.lerp(target, 1 - Math.exp(-ACCEL * delta));

    const vx = velocity.current.x * delta;
    const vz = velocity.current.y * delta;

    // axis-separated movement so the player slides along walls
    let px = g.position.x;
    let pz = g.position.z;
    if (isFree(maze, px + vx, pz)) px += vx;
    if (isFree(maze, px, pz + vz)) pz += vz;
    g.position.set(px, 0, pz);
    tracker.set(px, 0, pz);
    motion.set(velocity.current.x, velocity.current.y);

    const speed = velocity.current.length();
    if (speed > 0.25) {
      const desired = Math.atan2(velocity.current.x, velocity.current.y);
      const diff = ((desired - g.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
      g.rotation.y += diff * (1 - Math.exp(-12 * delta));
      walkPhase.current += delta * speed * 2.6;
    }
    idlePhase.current += delta;

    const walkAmount = Math.min(1, speed / SPEED);
    const swing = Math.sin(walkPhase.current * 3) * 0.75 * walkAmount;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing * 0.7;
    if (armR.current) armR.current.rotation.x = swing * 0.7;

    if (body.current) {
      // walk bob + idle breathing
      const bob = Math.abs(Math.sin(walkPhase.current * 3)) * 0.07 * walkAmount;
      const breathe = Math.sin(idlePhase.current * 2) * 0.02 * (1 - walkAmount);
      body.current.position.y = bob + breathe;
      body.current.rotation.z = Math.sin(walkPhase.current * 3) * 0.05 * walkAmount;
      body.current.rotation.x = walkAmount * 0.09;
    }

    // gate detection (real exit vs fake gate)
    const cell = worldToCell(maze, px, pz);
    const gate = maze.gates.find((gt) => gt.x === cell.x && gt.y === cell.y);
    if (gate) {
      if (currentGate.current !== gate.id) {
        currentGate.current = gate.id;
        onGate(gate);
      }
    } else if (currentGate.current !== null) {
      currentGate.current = null;
      onLeaveGate();
    }
  });

  const cast = quality.shadows;

  return (
    <group ref={group} position={[startWorld[0], 0, startWorld[1]]}>
      <group ref={body}>
        {/* legs */}
        <mesh ref={legL} position={[-0.14, 0.38, 0]} castShadow={cast}>
          <capsuleGeometry args={[0.09, 0.5, 3, 8]} />
          <meshStandardMaterial color="#2a2f3b" roughness={0.85} />
        </mesh>
        <mesh ref={legR} position={[0.14, 0.38, 0]} castShadow={cast}>
          <capsuleGeometry args={[0.09, 0.5, 3, 8]} />
          <meshStandardMaterial color="#2a2f3b" roughness={0.85} />
        </mesh>
        {/* boots */}
        <mesh position={[-0.14, 0.06, 0.04]}>
          <boxGeometry args={[0.19, 0.12, 0.3]} />
          <meshStandardMaterial color="#1d2028" roughness={0.9} />
        </mesh>
        <mesh position={[0.14, 0.06, 0.04]}>
          <boxGeometry args={[0.19, 0.12, 0.3]} />
          <meshStandardMaterial color="#1d2028" roughness={0.9} />
        </mesh>

        {/* torso */}
        <mesh position={[0, 0.95, 0]} castShadow={cast}>
          <capsuleGeometry args={[0.23, 0.4, 4, 12]} />
          <meshStandardMaterial color="#b4502c" roughness={0.7} />
        </mesh>
        {/* cloak */}
        <mesh position={[0, 0.82, -0.05]} castShadow={cast}>
          <coneGeometry args={[0.36, 0.86, 12, 1, true]} />
          <meshStandardMaterial
            color="#7a2f22"
            roughness={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* arms */}
        <mesh ref={armL} position={[-0.29, 1.06, 0]} castShadow={cast}>
          <capsuleGeometry args={[0.07, 0.36, 3, 8]} />
          <meshStandardMaterial color="#8f3f26" roughness={0.8} />
        </mesh>
        <mesh ref={armR} position={[0.29, 1.06, 0]} castShadow={cast}>
          <capsuleGeometry args={[0.07, 0.36, 3, 8]} />
          <meshStandardMaterial color="#8f3f26" roughness={0.8} />
        </mesh>

        {/* head + hood */}
        <mesh position={[0, 1.36, 0]} castShadow={cast}>
          <sphereGeometry args={[0.19, 16, 12]} />
          <meshStandardMaterial color="#d9ab84" roughness={0.75} />
        </mesh>
        <mesh position={[0, 1.42, -0.04]} castShadow={cast}>
          <sphereGeometry args={[0.23, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshStandardMaterial color="#6d2a1f" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        {/* lantern the character carries — keeps them readable in the dark */}
        <mesh position={[0.34, 0.9, 0.12]}>
          <sphereGeometry args={[0.08, 10, 8]} />
          <meshBasicMaterial color="#ffd79a" />
        </mesh>
      </group>

      <pointLight
        position={[0.34, 1.0, 0.12]}
        intensity={5}
        distance={CELL_SIZE * 3.4}
        color="#ffd2a0"
      />
      {/* soft contact shadow */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.42, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.38} depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.025, 0]}>
        <circleGeometry args={[0.85, 24]} />
        <meshBasicMaterial color="#ffb867" transparent opacity={0.1} depthWrite={false} />
      </mesh>
    </group>
  );
}
