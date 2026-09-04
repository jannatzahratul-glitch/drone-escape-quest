import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CELL_SIZE, type Maze } from "../maze/generator";

/**
 * Drone camera rig: a high, angled view that smoothly trails the player while
 * keeping enough of the maze on screen to stay readable on a phone.
 * Zoom / rotation / cinematic modes can later be layered on the same rig by
 * animating `zoom` and `orbit`.
 */
interface DroneCameraProps {
  maze: Maze;
  target: THREE.Vector3;
  /** >1 pulls the camera further out */
  zoom?: number;
  /** slow orbit used by the menu backdrop */
  cinematic?: boolean;
}

export function DroneCamera({ maze, target, zoom = 1, cinematic = false }: DroneCameraProps) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3().copy(target));
  const initialised = useRef(false);

  const rig = useMemo(() => {
    const span = Math.max(maze.width, maze.height) * CELL_SIZE;
    // portrait phones need more altitude to keep the maze readable
    const portrait = size.height > size.width;
    const height = Math.max(22, span * (portrait ? 0.95 : 0.6)) * zoom;
    const halfW = (maze.width * CELL_SIZE) / 2;
    const halfH = (maze.height * CELL_SIZE) / 2;
    return { height, back: height * 0.3, span, halfW, halfH };
  }, [maze, zoom, size.width, size.height]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;

    const angle = cinematic ? t * 0.08 : 0;
    // keep the framing inside the maze so the dark void beyond it never fills
    // the screen
    const marginX = Math.max(0, rig.halfW - rig.span * 0.22);
    const marginZ = Math.max(0, rig.halfH - rig.span * 0.22);
    const fx = THREE.MathUtils.clamp(target.x, -marginX, marginX);
    const fz = THREE.MathUtils.clamp(target.z, -marginZ, marginZ);
    const desired = new THREE.Vector3(
      fx + Math.sin(angle) * rig.back,
      rig.height,
      fz + Math.cos(angle) * rig.back,
    );

    if (!initialised.current) {
      camera.position.copy(desired);
      look.current.set(fx, 0, fz);
      initialised.current = true;
    } else {
      // frame-rate independent smoothing
      const k = 1 - Math.exp(-3.2 * delta);
      camera.position.lerp(desired, k);
      look.current.lerp(new THREE.Vector3(fx, 0, fz), 1 - Math.exp(-5 * delta));
    }

    // camera always stays above the maze walls
    camera.position.y = Math.max(camera.position.y, rig.height * 0.8);
    camera.lookAt(look.current);
  });

  return null;
}
