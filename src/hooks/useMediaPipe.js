import { useEffect, useRef, useCallback } from 'react';
import { useGripSim } from '../context/GripSimContext';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const SMOOTHING_WINDOW = 15;
const STABILITY_THRESHOLD = 3;
const TIP_IDS = [8, 12, 16, 20];
const PIP_IDS = [6, 10, 14, 18];

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export default function useMediaPipe() {
  const { state, dispatch, addSerialLog } = useGripSim();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const historyRef = useRef({});
  const stableRef = useRef({ fingers: [0, 0, 0, 0], counts: [0, 0, 0, 0] });
  const fpsRef = useRef({ frames: 0, lastTime: Date.now() });
  const lastLogRef = useRef(0);
  const runningRef = useRef(false);
  const shootRef = useRef({ prevWristY: null, cooldown: 0, prevGesture: 'NONE' });


  const getFingerState = useCallback((landmarks, tipId, pipId) => {
    if (!historyRef.current[tipId]) historyRef.current[tipId] = [];
    if (!historyRef.current[pipId]) historyRef.current[pipId] = [];
    historyRef.current[tipId].push(landmarks[tipId].y);
    historyRef.current[pipId].push(landmarks[pipId].y);
    if (historyRef.current[tipId].length > SMOOTHING_WINDOW)
      historyRef.current[tipId].shift();
    if (historyRef.current[pipId].length > SMOOTHING_WINDOW)
      historyRef.current[pipId].shift();
    return mean(historyRef.current[tipId]) < mean(historyRef.current[pipId])
      ? 1
      : 0;
  }, []);

  const stabilize = useCallback((rawFingers) => {
    const stable = stableRef.current;
    for (let i = 0; i < 4; i++) {
      if (rawFingers[i] !== stable.fingers[i]) {
        stable.counts[i]++;
        if (stable.counts[i] >= STABILITY_THRESHOLD) {
          stable.fingers[i] = rawFingers[i];
          stable.counts[i] = 0;
        }
      } else {
        stable.counts[i] = 0;
      }
    }
    return [...stable.fingers];
  }, []);

  const classifyGesture = useCallback((fingers, landmarks) => {
    const allCurled = fingers[0] === 0 && fingers[1] === 0 && fingers[2] === 0 && fingers[3] === 0;
    const thumbUp = landmarks[4].y < landmarks[3].y && landmarks[3].y < landmarks[2].y;

    if (fingers[0] === 1 && fingers[1] === 1 && fingers[2] === 1 && fingers[3] === 1)
      return 'OPEN HAND';
    if (fingers[0] === 1 && fingers[1] === 0 && fingers[2] === 0 && fingers[3] === 0 && thumbUp)
      return 'GUN';
    if (allCurled && thumbUp)
      return 'LIKE';
    if (allCurled)
      return 'FIST';
    if (fingers[0] === 1 && fingers[1] === 1 && fingers[2] === 0 && fingers[3] === 0)
      return 'PEACE';
    return 'CUSTOM';
  }, []);

  const fingersToGripperAngle = useCallback((fingers) => {
    return Math.round((fingers.reduce((a, b) => a + b, 0) / 4) * 180);
  }, []);

  const getWristRotation = useCallback((landmarks) => {
    const wrist = landmarks[0];
    const midMcp = landmarks[9];
    const dx = -(midMcp.x - wrist.x);
    const dy = midMcp.y - wrist.y;
    const raw = Math.atan2(dx, -dy) * (180 / Math.PI);
    const clamped = clamp(raw, -70, 70);
    return clamp(Math.round((clamped / 70) * 90 + 90), 0, 180);
  }, []);

  const getThumbState = useCallback((landmarks) => {
    if (!historyRef.current[4]) historyRef.current[4] = [];
    if (!historyRef.current[3]) historyRef.current[3] = [];
    historyRef.current[4].push(landmarks[4].x);
    historyRef.current[3].push(landmarks[3].x);
    if (historyRef.current[4].length > SMOOTHING_WINDOW)
      historyRef.current[4].shift();
    if (historyRef.current[3].length > SMOOTHING_WINDOW)
      historyRef.current[3].shift();
    return Math.abs(mean(historyRef.current[4]) - mean(historyRef.current[3])) > 0.05
      ? 1
      : 0;
  }, []);

  const drawLandmarks = useCallback((ctx, landmarks, width, height, ox = 0, oy = 0) => {
    ctx.strokeStyle = '#00FFF0';
    ctx.lineWidth = 2;
    for (const [start, end] of HAND_CONNECTIONS) {
      const s = landmarks[start];
      const e = landmarks[end];
      ctx.beginPath();
      ctx.moveTo(ox + s.x * width, oy + s.y * height);
      ctx.lineTo(ox + e.x * width, oy + e.y * height);
      ctx.stroke();
    }
    for (const lm of landmarks) {
      ctx.fillStyle = '#FF6B00';
      ctx.beginPath();
      ctx.arc(ox + lm.x * width, oy + lm.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, []);

  useEffect(() => {
    if (!state.webcamActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      runningRef.current = false;
      return;
    }

    let cancelled = false;
    let rafId = null;

    async function init() {
      let video = document.getElementById('webcam-video');
      let canvas = document.getElementById('webcam-canvas');

      if (!video || !canvas) {
        await new Promise((resolve) => {
          const observer = new MutationObserver(() => {
            video = document.getElementById('webcam-video');
            canvas = document.getElementById('webcam-canvas');
            if (video && canvas) {
              observer.disconnect();
              resolve();
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
        });
      }

      if (cancelled) return;
      videoRef.current = video;
      canvasRef.current = canvas;

      const videoConstraints = { width: 640, height: 480, frameRate: { ideal: 60 } };
      if (state.selectedCameraId) {
        videoConstraints.deviceId = { exact: state.selectedCameraId };
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
      } catch (err) {
        addSerialLog(`ERROR: Camera access denied — ${err.message}`, 'error');
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      video.srcObject = stream;
      await video.play();
      addSerialLog('Camera stream active', 'info');

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((d) => d.kind === 'videoinput');
        dispatch({
          type: 'SET_AVAILABLE_CAMERAS',
          payload: cameras.map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${i + 1}`,
          })),
        });
      } catch {
        // not critical
      }

      addSerialLog('Loading MediaPipe Tasks Vision...', 'info');

      let handLandmarker;
      const hadDefine = 'define' in window;
      const savedDefine = window.define;
      try {
        delete window.define;
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
            delegate: 'GPU',
          },
          numHands: 1,
          runningMode: 'VIDEO',
          minHandDetectionConfidence: 0.4,
          minHandPresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
      } catch (err) {
        addSerialLog(`ERROR: Failed to load hand landmarker — ${err.message}`, 'error');
        return;
      } finally {
        if (hadDefine) window.define = savedDefine;
      }

      if (cancelled) {
        handLandmarker.close();
        return;
      }

      landmarkerRef.current = handLandmarker;
      addSerialLog('Hand landmarker model loaded (GPU)', 'info');

      let lastTimestamp = -1;

      function processFrame() {
        if (cancelled || !landmarkerRef.current) return;

        const now = performance.now();
        if (video.readyState >= 2 && now !== lastTimestamp) {
          lastTimestamp = now;

          const results = landmarkerRef.current.detectForVideo(video, now);

          const ctx = canvas.getContext('2d');
          const rect = canvas.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          const displayW = Math.round(rect.width * dpr);
          const displayH = Math.round(rect.height * dpr);
          if (canvas.width !== displayW || canvas.height !== displayH) {
            canvas.width = displayW;
            canvas.height = displayH;
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const videoAspect = video.videoWidth / video.videoHeight;
          const canvasAspect = rect.width / rect.height;
          let drawW, drawH, offsetX, offsetY;
          if (videoAspect > canvasAspect) {
            drawH = rect.height;
            drawW = rect.height * videoAspect;
            offsetX = (rect.width - drawW) / 2;
            offsetY = 0;
          } else {
            drawW = rect.width;
            drawH = rect.width / videoAspect;
            offsetX = 0;
            offsetY = (rect.height - drawH) / 2;
          }
          offsetX *= dpr;
          offsetY *= dpr;
          drawW *= dpr;
          drawH *= dpr;

          fpsRef.current.frames++;
          const wallNow = Date.now();
          if (wallNow - fpsRef.current.lastTime >= 1000) {
            dispatch({
              type: 'UPDATE_HAND_TRACKING',
              payload: { fps: fpsRef.current.frames },
            });
            fpsRef.current.frames = 0;
            fpsRef.current.lastTime = wallNow;
          }

          const handCount = results.landmarks ? results.landmarks.length : 0;

          if (handCount >= 1) {
            const lm = results.landmarks[0];

            drawLandmarks(ctx, lm, drawW, drawH, offsetX, offsetY);

            const rawFingers = TIP_IDS.map((tipId, i) =>
              getFingerState(lm, tipId, PIP_IDS[i])
            );
            const fingers = stabilize(rawFingers);
            const thumbState = getThumbState(lm);
            const gesture = classifyGesture(fingers, lm);
            const gripperAngle = fingersToGripperAngle(fingers);
            const rotationAngle = getWristRotation(lm);

            dispatch({
              type: 'UPDATE_HAND_TRACKING',
              payload: {
                fingerStates: fingers,
                thumbState,
                gesture,
                handDetected: true,
              },
            });
            dispatch({
              type: 'SET_SERVO_ANGLES',
              payload: { gripperAngle, rotationAngle },
            });
            dispatch({
              type: 'SET_HAND_LANDMARKS',
              payload: lm.map((p) => ({ x: p.x, y: p.y })),
            });

            const shoot = shootRef.current;
            if (shoot.cooldown > 0) shoot.cooldown--;
            const wristY = lm[0].y;
            if (gesture === 'GUN' && shoot.prevWristY !== null && shoot.cooldown === 0) {
              const dy = shoot.prevWristY - wristY;
              if (dy > 0.025) {
                shoot.cooldown = 30;
                const tip = lm[8];
                const mcp = lm[5];
                const dirX = tip.x - mcp.x;
                const dirY = tip.y - mcp.y;
                const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
                dispatch({
                  type: 'ADD_PROJECTILE',
                  payload: {
                    id: Date.now() + Math.random(),
                    x: tip.x,
                    y: tip.y,
                    vx: (dirX / len) * 0.015,
                    vy: (dirY / len) * 0.015,
                    age: 0,
                  },
                });
                addSerialLog('SHOOT! Ball fired', 'gesture');
              }
            }
            shoot.prevWristY = wristY;
            shoot.prevGesture = gesture;

            if (wallNow - lastLogRef.current >= 100) {
              lastLogRef.current = wallNow;
              addSerialLog(
                `Fingers: [${fingers.join(',')}] -> Gripper: ${gripperAngle}° | Rotation: ${rotationAngle}°`,
                'tx'
              );
              addSerialLog(`Gesture: ${gesture}`, 'gesture');
              addSerialLog(
                `TX >> bytes: [${gripperAngle}, ${rotationAngle}] @ 9600 baud -> COM3`,
                'tx'
              );
              dispatch({ type: 'SET_HIGHLIGHT_LINE', payload: { line: 72, ts: wallNow } });
            }
          } else {
            dispatch({
              type: 'UPDATE_HAND_TRACKING',
              payload: { handDetected: false, gesture: 'NONE' },
            });
            dispatch({ type: 'SET_HAND_LANDMARKS', payload: null });
            const wallNow2 = Date.now();
            if (wallNow2 - lastLogRef.current >= 2000) {
              lastLogRef.current = wallNow2;
              addSerialLog('WARNING: No hand detected', 'warning');
            }
          }
        }

        rafId = requestAnimationFrame(processFrame);
      }

      runningRef.current = true;
      rafId = requestAnimationFrame(processFrame);
      addSerialLog('MediaPipe Hand Landmarker initialized — webcam active', 'info');
    }

    init().catch((err) => addSerialLog(`ERROR: init failed — ${err.message}`, 'error'));

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      runningRef.current = false;
    };
  }, [
    state.webcamActive,
    state.selectedCameraId,
    dispatch,
    addSerialLog,
    getFingerState,
    getThumbState,
    stabilize,
    classifyGesture,
    fingersToGripperAngle,
    getWristRotation,
    drawLandmarks,
  ]);

  return { videoRef, canvasRef };
}
