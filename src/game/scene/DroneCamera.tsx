import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CELL_SIZE, WALL_HEIGHT, type Maze } from "../maze/generator";

/**
 * CameraController — drone rig.
 *
 * High above the maze at a cinematic downward angle, trailing the player with
 * a deliberate lag, leading slightly in the direction of travel, and adding a
 * very small hover drift so the shot feels like a flying drone rather than a
 * locked orthographic view. Altitude is always well above wall height, so the
 * camera can never clip through geometry.
 */
interface DroneCameraProps {
  maze: Maze;
  target: THREE.Vector3;
  /** player velocity, used for a subtle look-ahead */
  motion?: THREE.Vector2 | undefined;
  /** >1 pulls the camera further out */
  zoom?: number;
  /** slow orbit used by the menu backdrop */
  cinematic?: boolean;
  /** pushes the camera in slightly, e.g. during the escape beat */
  focus?: boolean;
}

export function DroneCamera({
  maze,
  target,
  motion,
  zoom = 1,
  cinematic = false,
  focus = false,
}: DroneCameraProps) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3().copy(target));
  const lag = useRef(new THREE.Vector3().copy(target));
  const initialised = useRef(false);
  const zoomRef = useRef(zoom);

  const rig = useMemo(() => {
    const span = Math.max(maze.width, maze.height) * CELL_SIZE;
    const portrait = size.height > size.width;
    const aspect = Math.max(0.3, size.width / Math.max(1, size.height));
    const tan = Math.tan((45 / 2) * (Math.PI / 180)); // matches Canvas fov
    // altitude is derived from how many maze cells must stay on screen, so the
    // framing reads the same on a narrow phone and a wide desktop
    const cellsAcross = portrait ? 9 : 13;
    const fromWidth = (cellsAcross * CELL_SIZE) / (2 * tan * aspect);
    // never pull so far back that the void around the maze dominates
    const cap = ((maze.height + 4) * CELL_SIZE) / (2 * tan);
    const height = Math.max(24, Math.min(fromWidth, cap));
    const halfW = (maze.width * CELL_SIZE) / 2;
    const halfH = (maze.height * CELL_SIZE) / 2;
    return { height, back: height * 0.34, span, halfW, halfH };
  }, [maze, size.width, size.height]);


  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;

    // smooth zoom transitions (menu orbit / escape push-in)
    const wantZoom = zoom * (focus ? 0.82 : 1);
    zoomRef.current += (wantZoom - zoomRef.current) * (1 - Math.exp(-2.2 * delta));
    const height = rig.height * zoomRef.current;
    const back = rig.back * zoomRef.current;

    // cinematic lag: the rig chases a trailing copy of the player position
    lag.current.lerp(target, 1 - Math.exp(-(cinematic ? 1.2 : 4.2) * delta));

    // subtle look-ahead in the movement direction
    const leadX = motion ? THREE.MathUtils.clamp(motion.x, -5, 5) * 0.35 : 0;
    const leadZ = motion ? THREE.MathUtils.clamp(motion.y, -5, 5) * 0.35 : 0;

    const angle = cinematic ? t * 0.07 : 0;
    const marginX = Math.max(0, rig.halfW - rig.span * 0.18);
    const marginZ = Math.max(0, rig.halfH - rig.span * 0.18);
    const fx = THREE.MathUtils.clamp(lag.current.x + leadX, -marginX, marginX);
    const fz = THREE.MathUtils.clamp(lag.current.z + leadZ, -marginZ, marginZ);

    // gentle hover drift — controlled, never disorienting
    const hoverX = Math.sin(t * 0.35) * 0.35;
    const hoverY = Math.sin(t * 0.5) * 0.5;
    const hoverZ = Math.cos(t * 0.28) * 0.35;

    const desired = new THREE.Vector3(
      fx + Math.sin(angle) * back + hoverX,
      height + hoverY,
      fz + Math.cos(angle) * back + hoverZ,
    );

    if (!initialised.current) {
      camera.position.copy(desired);
      lag.current.copy(target);
      look.current.set(fx, 0, fz);
      initialised.current = true;
    } else {
      camera.position.lerp(desired, 1 - Math.exp(-3.4 * delta));
      look.current.lerp(new THREE.Vector3(fx, 0, fz), 1 - Math.exp(-5 * delta));
    }

    // never dip near the walls
    camera.position.y = Math.max(camera.position.y, WALL_HEIGHT * 4);
    camera.lookAt(look.current);
  });

  return null;
}
