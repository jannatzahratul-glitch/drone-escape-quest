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

const SPEED = 5.2; // units / second
const ACCEL = 14; // how quickly velocity reaches target
const RADIUS = 0.42; // collision radius of the character

/** True when a circle of RADIUS at (wx,wz) does not overlap any wall cell. */
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
  paused: boolean;
  onGate: (gate: Gate) => void;
  onLeaveGate: () => void;
}

export function Player({ maze, tracker, paused, onGate, onLeaveGate }: PlayerProps) {
  const group = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const velocity = useRef(new THREE.Vector2(0, 0));
  const walkPhase = useRef(0);
  const currentGate = useRef<number | null>(null);

  const startWorld = useMemo(() => cellToWorld(maze, maze.start.x, maze.start.y), [maze]);

  useFrame((_, rawDelta) => {
    const g = group.current;
    if (!g) return;
    const delta = Math.min(rawDelta, 0.05);

    if (paused) {
      velocity.current.set(0, 0);
      return;
    }

    const input = getMoveVector();
    const target = new THREE.Vector2(input.x * SPEED, input.y * SPEED);
    velocity.current.lerp(target, 1 - Math.exp(-ACCEL * delta));

    const vx = velocity.current.x * delta;
    const vz = velocity.current.y * delta;

    // axis-separated movement so the player slides along walls instead of sticking
    let px = g.position.x;
    let pz = g.position.z;
    if (isFree(maze, px + vx, pz)) px += vx;
    if (isFree(maze, px, pz + vz)) pz += vz;
    g.position.set(px, 0, pz);
    tracker.set(px, 0, pz);

    // face the direction of travel
    const speed = velocity.current.length();
    if (speed > 0.25) {
      const desired = Math.atan2(velocity.current.x, velocity.current.y);
      const diff = ((desired - g.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
      g.rotation.y += diff * (1 - Math.exp(-12 * delta));
      walkPhase.current += delta * speed * 2.4;
    } else {
      walkPhase.current += delta * 1.2;
    }
    const swing = Math.sin(walkPhase.current * 3) * Math.min(0.7, speed * 0.15);
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;

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

  return (
    <group ref={group} position={[startWorld[0], 0, startWorld[1]]}>
      {/* legs */}
      <mesh ref={legL} position={[-0.16, 0.42, 0]} castShadow>
        <boxGeometry args={[0.2, 0.84, 0.22]} />
        <meshStandardMaterial color="#2b3140" roughness={0.8} />
      </mesh>
      <mesh ref={legR} position={[0.16, 0.42, 0]} castShadow>
        <boxGeometry args={[0.2, 0.84, 0.22]} />
        <meshStandardMaterial color="#2b3140" roughness={0.8} />
      </mesh>
      {/* torso */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.44, 4, 10]} />
        <meshStandardMaterial color="#c8552f" roughness={0.6} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshStandardMaterial color="#e0b48c" roughness={0.7} />
      </mesh>
      {/* soft marker so the character stays readable on small screens */}
      <pointLight position={[0, 1.6, 0]} intensity={4} distance={CELL_SIZE * 3} color="#ffd9a0" />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.7, 24]} />
        <meshBasicMaterial color="#ffca7a" transparent opacity={0.16} />
      </mesh>
    </group>
  );
}
