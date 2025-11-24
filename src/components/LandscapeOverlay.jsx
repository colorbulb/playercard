import { useLandscape } from '../hooks/useLandscape';
import './LandscapeOverlay.css';

function LandscapeOverlay() {
  const isLandscape = useLandscape();

  if (isLandscape) {
    return null;
  }

  return (
    <div className="landscape-overlay">
      <div className="landscape-overlay-content">
        <div className="landscape-icon">📱</div>
        <h2>Please Rotate Your Device</h2>
        <p>This game requires landscape orientation</p>
        <div className="landscape-arrow">↻</div>
      </div>
    </div>
  );
}

export default LandscapeOverlay;

