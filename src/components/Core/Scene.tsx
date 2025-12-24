import { CameraManager } from '../Cameras/CameraManager';
import { PlaneSwitcher } from '../Cameras/PlaneSwitcher';
import { Player } from '../Player/Player';
import { Floor } from '../World/Floor';

export function Scene() {
  return (
    <>
      <CameraManager />
      <PlaneSwitcher />
      <Floor />
      <Player />
    </>
  );
}
