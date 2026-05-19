import { memo, useMemo, useEffect, useRef, useCallback } from 'react';
import { useGripSim } from '../../context/GripSimContext';

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

const FINGERTIP_IDS = new Set([4, 8, 12, 16, 20]);

const SKELETON_SIZE = 180;
const PADDING = 16;
const LABEL_AREA = 28;
const TOTAL_HEIGHT = SKELETON_SIZE + LABEL_AREA + PADDING * 2;
const TOTAL_WIDTH = SKELETON_SIZE + PADDING * 2;

const GRAVITY = 0.0004;
const BALL_RADIUS = 6;
const MAX_PROJECTILE_AGE = 180;

const HandOverlay = memo(function HandOverlay({ svgWidth, svgHeight }) {
  const { state, dispatch } = useGripSim();
  const { handLandmarks, handDetected, gesture, projectiles } = state;
  const rafRef = useRef(null);
  const projectilesRef = useRef([]);

  useEffect(() => {
    projectilesRef.current = projectiles;
  }, [projectiles]);

  const tick = useCallback(() => {
    const current = projectilesRef.current;
    if (current.length === 0) {
      rafRef.current = null;
      return;
    }
    const next = current
      .map((p) => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + GRAVITY,
        age: (p.age || 0) + 1,
      }))
      .filter((p) => (p.age || 0) < MAX_PROJECTILE_AGE);
    dispatch({ type: 'SET_PROJECTILES', payload: next });
    rafRef.current = requestAnimationFrame(tick);
  }, [dispatch]);

  useEffect(() => {
    if (projectiles.length > 0 && !rafRef.current) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [projectiles.length, tick]);

  const scaledLandmarks = useMemo(() => {
    if (!handLandmarks) return null;
    return handLandmarks.map((p) => ({
      x: (1 - p.x) * SKELETON_SIZE,
      y: p.y * SKELETON_SIZE,
    }));
  }, [handLandmarks]);

  const scaledProjectiles = useMemo(() => {
    return projectiles.map((p) => ({
      ...p,
      sx: (1 - p.x) * svgWidth,
      sy: p.y * svgHeight,
      opacity: Math.max(0, 1 - (p.age || 0) / MAX_PROJECTILE_AGE),
    }));
  }, [projectiles, svgWidth, svgHeight]);

  if (svgWidth === 0 || svgHeight === 0) return null;

  const showHand = handDetected && scaledLandmarks;

  const originX = 8;
  const originY = svgHeight - TOTAL_HEIGHT - 8;

  const gestureLabel = gesture || 'NONE';

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Projectiles — rendered in full SVG space */}
      {scaledProjectiles.map((p) => (
        <g key={p.id}>
          <circle
            cx={p.sx}
            cy={p.sy}
            r={BALL_RADIUS + 4}
            fill="#FF6B00"
            fillOpacity={p.opacity * 0.15}
          />
          <circle
            cx={p.sx}
            cy={p.sy}
            r={BALL_RADIUS}
            fill="#FF6B00"
            fillOpacity={p.opacity * 0.9}
          />
          <circle
            cx={p.sx - 2}
            cy={p.sy - 2}
            r={BALL_RADIUS * 0.4}
            fill="#FFD580"
            fillOpacity={p.opacity * 0.7}
          />
        </g>
      ))}

      {showHand && (
        <g transform={`translate(${originX}, ${originY})`}>
          <rect
            x={0}
            y={0}
            width={TOTAL_WIDTH}
            height={TOTAL_HEIGHT}
            rx={8}
            fill="#0a0a18"
            fillOpacity={0.75}
            stroke="#00FFF0"
            strokeWidth={1}
            strokeOpacity={0.2}
          />

          <line x1={0} y1={8} x2={0} y2={20} stroke="#00FFF0" strokeWidth={1.5} strokeOpacity={0.5} />
          <line x1={8} y1={0} x2={20} y2={0} stroke="#00FFF0" strokeWidth={1.5} strokeOpacity={0.5} />
          <line x1={TOTAL_WIDTH} y1={8} x2={TOTAL_WIDTH} y2={20} stroke="#00FFF0" strokeWidth={1.5} strokeOpacity={0.5} />
          <line x1={TOTAL_WIDTH - 8} y1={0} x2={TOTAL_WIDTH - 20} y2={0} stroke="#00FFF0" strokeWidth={1.5} strokeOpacity={0.5} />

          <text
            x={TOTAL_WIDTH / 2}
            y={12}
            textAnchor="middle"
            fill="#00FFF0"
            fillOpacity={0.5}
            fontFamily="'IBM Plex Mono', monospace"
            fontSize={8}
            letterSpacing={1.5}
          >
            HAND TRACKING
          </text>

          <g transform={`translate(${PADDING}, ${PADDING + 4})`}>
            {HAND_CONNECTIONS.map(([startIdx, endIdx]) => {
              const s = scaledLandmarks[startIdx];
              const e = scaledLandmarks[endIdx];
              if (!s || !e) return null;
              return (
                <line
                  key={`${startIdx}-${endIdx}`}
                  x1={s.x}
                  y1={s.y}
                  x2={e.x}
                  y2={e.y}
                  stroke="#00FFF0"
                  strokeWidth={1.5}
                  strokeOpacity={0.35}
                  strokeLinecap="round"
                />
              );
            })}

            {scaledLandmarks.map((pt, i) => {
              const isTip = FINGERTIP_IDS.has(i);
              const isWrist = i === 0;
              const radius = isTip ? 3.5 : isWrist ? 4 : 2.5;
              const fill = isTip ? '#FF6B00' : isWrist ? '#00FFF0' : '#FF6B00';
              const opacity = isTip ? 0.7 : isWrist ? 0.6 : 0.45;
              return (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={radius}
                  fill={fill}
                  fillOpacity={opacity}
                />
              );
            })}

            {scaledLandmarks
              .filter((_, i) => FINGERTIP_IDS.has(i))
              .map((pt, i) => (
                <circle
                  key={`glow-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={7}
                  fill="#FF6B00"
                  fillOpacity={0.1}
                />
              ))}
          </g>

          <text
            x={TOTAL_WIDTH / 2}
            y={PADDING + SKELETON_SIZE + 18}
            textAnchor="middle"
            fill="#FF6B00"
            fillOpacity={0.7}
            fontFamily="'IBM Plex Mono', monospace"
            fontSize={10}
            fontWeight={600}
            letterSpacing={1}
          >
            {gestureLabel}
          </text>

          <circle
            cx={TOTAL_WIDTH - 12}
            cy={12}
            r={3}
            fill="#00ff88"
            fillOpacity={0.8}
          >
            <animate
              attributeName="fillOpacity"
              values="0.8;0.3;0.8"
              dur="1.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="r"
              values="3;4;3"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      )}
    </g>
  );
});

export default HandOverlay;
