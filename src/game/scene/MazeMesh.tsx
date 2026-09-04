import type {} from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CELL_SIZE, WALL_HEIGHT, cellToWorld, type Maze } from "../maze/generator";
import type { QualityProfile } from "../settings/SettingsManager";
import { createFloorTextures, createWallTextures } from "./textures";

/**
 * All maze walls drawn with a single InstancedMesh (one draw call).
 * Per-instance colour + height jitter keeps the stonework from reading as a
 * repeating flat block wall.
 */
export function MazeMesh({ maze, quality }: { maze: Maze; quality: QualityProfile }) {
  const wallRef = useRef<THREE.InstancedMesh>(null);
  const capRef = useRef<THREE.InstancedMesh>(null);
  const wall = useMemo(() => createWallTextures(quality.textureSize), [quality.textureSize]);
  const floor = useMemo(() => createFloorTextures(quality.textureSize), [quality.textureSize]);

  const positions = useMemo(() => {
    const out: Array<[number, number, number]> = [];
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        if (maze.cells[y * maze.width + x] === 1) {
          const [wx, wz] = cellToWorld(maze, x, y);
          // deterministic jitter from the grid coords
          const n = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
          out.push([wx, wz, n]);
        }
      }
    }
    return out;
  }, [maze]);

  useLayoutEffect(() => {
    const mesh = wallRef.current;
    const caps = capRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const colour = new THREE.Color();
    positions.forEach(([wx, wz, n], i) => {
      const h = 1 + (n - 0.5) * 0.14;
      dummy.position.set(wx, (WALL_HEIGHT * h) / 2, wz);
      dummy.scale.set(1, h, 1);
      dummy.rotation.y = (n - 0.5) * 0.05;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      colour.setHSL(0.09, 0.07, 0.44 + (n - 0.5) * 0.16);
      mesh.setColorAt(i, colour);

      if (caps) {
        dummy.position.set(wx, WALL_HEIGHT * h + 0.06, wz);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        caps.setMatrixAt(i, dummy.matrix);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    if (caps) {
      caps.instanceMatrix.needsUpdate = true;
      caps.computeBoundingSphere();
    }
  }, [positions]);

  const floorW = maze.width * CELL_SIZE + CELL_SIZE * 20;
  const floorH = maze.height * CELL_SIZE + CELL_SIZE * 20;

  useLayoutEffect(() => {
    const r = [floorW / (CELL_SIZE * 2), floorH / (CELL_SIZE * 2)] as const;
    floor.map.repeat.set(r[0], r[1]);
    floor.bumpMap.repeat.set(r[0], r[1]);
    wall.map.repeat.set(1, 1);
    wall.bumpMap.repeat.set(1, 1);
  }, [floor, wall, floorW, floorH]);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0}>
        <planeGeometry args={[floorW, floorH]} />
        <meshStandardMaterial
          map={floor.map}
          bumpMap={floor.bumpMap}
          bumpScale={0.6}
          roughness={0.96}
          metalness={0.02}
          color="#8a8175"
        />
      </mesh>

      <instancedMesh
        ref={wallRef}
        args={[undefined, undefined, positions.length]}
        castShadow={quality.shadows}
        receiveShadow={quality.shadows}
      >
        <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
        <meshStandardMaterial
          map={wall.map}
          bumpMap={wall.bumpMap}
          bumpScale={0.9}
          roughness={0.92}
          metalness={0.04}
        />
      </instancedMesh>

      {/* darker coping stone along every wall top — reads as real thickness */}
      <instancedMesh ref={capRef} args={[undefined, undefined, positions.length]} receiveShadow>
        <boxGeometry args={[CELL_SIZE + 0.12, 0.12, CELL_SIZE + 0.12]} />
        <meshStandardMaterial color="#4a453d" roughness={0.85} />
      </instancedMesh>
    </group>
  );
}
