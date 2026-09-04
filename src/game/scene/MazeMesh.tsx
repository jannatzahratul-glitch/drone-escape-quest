import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CELL_SIZE, WALL_HEIGHT, cellToWorld, type Maze } from "../maze/generator";
import { createFloorTexture, createWallTexture } from "./textures";

/** All maze walls drawn with a single InstancedMesh (one draw call). */
export function MazeMesh({ maze }: { maze: Maze }) {
  const wallRef = useRef<THREE.InstancedMesh>(null);
  const wallTex = useMemo(() => createWallTexture(), []);
  const floorTex = useMemo(() => createFloorTexture(), []);

  const positions = useMemo(() => {
    const out: Array<[number, number]> = [];
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        if (maze.cells[y * maze.width + x] === 1) out.push(cellToWorld(maze, x, y));
      }
    }
    return out;
  }, [maze]);

  useLayoutEffect(() => {
    const mesh = wallRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    positions.forEach(([wx, wz], i) => {
      dummy.position.set(wx, WALL_HEIGHT / 2, wz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [positions]);

  const floorW = maze.width * CELL_SIZE + CELL_SIZE * 4;
  const floorH = maze.height * CELL_SIZE + CELL_SIZE * 4;

  useLayoutEffect(() => {
    floorTex.repeat.set(maze.width / 2, maze.height / 2);
    wallTex.repeat.set(1, 1);
  }, [floorTex, wallTex, maze]);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0}>
        <planeGeometry args={[floorW, floorH]} />
        <meshStandardMaterial map={floorTex} roughness={0.95} metalness={0.02} color="#8d8478" />
      </mesh>

      <instancedMesh
        ref={wallRef}
        args={[undefined, undefined, positions.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
        <meshStandardMaterial map={wallTex} roughness={0.9} metalness={0.03} color="#9a9184" />
      </instancedMesh>
    </group>
  );
}
