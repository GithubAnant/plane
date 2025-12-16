import { Button } from "../components/Button";
import { useEffect, useRef, useState } from "react";
import { useHaptic } from "use-haptic";
import { normalizeYaw } from "@/utils";
import { usePartyKitStore } from "../../hooks";
import { useGameStore } from "../../store/gameStore";

export const ActiveScreen = () => {
  const calibrationRef = useRef({ alpha: 0, beta: 0, gamma: 0 });
  const latestOrientation = useRef({ alpha: 0, beta: 0, gamma: 0 });
  const { triggerHaptic } = useHaptic();
  const sendData = usePartyKitStore((state) => state.sendData);
  const [debugInfo, setDebugInfo] = useState('');
  const resetGame = useGameStore((state) => state.resetGame);
  
  const handleOrientation = (event) => {
    latestOrientation.current = {
      alpha: normalizeYaw(event.alpha || 0),
      beta: event.beta || 0,
      gamma: event.gamma || 0,
    };
  };

  const handleRecalibrate = () => {
    triggerHaptic();
    calibrationRef.current = { ...latestOrientation.current };
    // Send action to desktop to trigger Restart/Recalibrate there
    sendData({ type: 'button', id: 'A' });
  };

  useEffect(() => {
    // Request permission for iOS 13+ and some Android devices
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            window.addEventListener("deviceorientation", handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      // No permission needed
      window.addEventListener("deviceorientation", handleOrientation);
    }

    const interval = setInterval(() => {
      const raw = latestOrientation.current;
      const calibration = calibrationRef.current;

      const calibrated = {
        alpha: normalizeYaw(raw.alpha - calibration.alpha),
        beta: raw.beta - calibration.beta,
        gamma: raw.gamma - calibration.gamma,
      };

      console.log('📤 Sending orientation:', calibrated); // Debug log
      setDebugInfo(`α:${calibrated.alpha.toFixed(1)} β:${calibrated.beta.toFixed(1)} γ:${calibrated.gamma.toFixed(1)}`);

      sendData({
        type: "orientation",
        ...calibrated,
        timestamp: Date.now(),
      });
    }, 16);

    return () => {
      clearInterval(interval);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [sendData]);
  return (
    <>
      <Button label="A" className={"A-button"} onClick={handleRecalibrate} />
      <p className="explanation">
        Tap the A button to recalibrate the accelerometer.
      <div style={{position: 'fixed', bottom: '20px', left: '20px', background: 'rgba(0,0,0,0.8)', color: 'lime', padding: '10px', fontFamily: 'monospace', fontSize: '14px'}}>
        {debugInfo || 'Waiting for gyro...'}
      </div>
      </p>
    </>
  );
};
