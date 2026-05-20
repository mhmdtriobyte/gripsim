import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGripSim } from '../../context/GripSimContext';
import ComponentTray from './ComponentTray';
import WireLayer from './WireLayer';
import ValidationPanel from './ValidationPanel';
import HandOverlay from './HandOverlay';
import ArduinoUno, { ARDUINO_PINS } from './components/ArduinoUno';
import RoboticArm, { ROBOTIC_ARM_PINS } from './components/ServoSG90';
import PowerSupply, { POWER_SUPPLY_PINS } from './components/PowerSupply';
import Breadboard, { BREADBOARD_PINS } from './components/Breadboard';
import USBCable from './components/USBCable';

const GRID_SIZE = 20;
const snap = (v) => Math.round(v / GRID_SIZE) * GRID_SIZE;

const PIN_DEFS = {
  arduino: ARDUINO_PINS,
  'robotic-arm': ROBOTIC_ARM_PINS,
  power: POWER_SUPPLY_PINS,
  breadboard: BREADBOARD_PINS,
};

function getAbsolutePin(comp, pinId) {
  const pins = PIN_DEFS[comp.type];
  if (!pins) return { x: comp.x, y: comp.y };
  const pin = pins.find((p) => p.id === pinId);
  if (!pin) return { x: comp.x, y: comp.y };
  return { x: comp.x + pin.x, y: comp.y + pin.y };
}

let nextId = 1;

const COMPONENT_MAP = {
  arduino: ArduinoUno,
  'robotic-arm': RoboticArm,
  power: PowerSupply,
  breadboard: Breadboard,
  usb: USBCable,
};

const COMP_LABELS = { arduino: 'Arduino Uno', 'robotic-arm': 'Robotic Arm', power: 'Power Supply', breadboard: 'Breadboard', usb: 'USB Cable' };

const CircuitCanvas = memo(function CircuitCanvas() {
  const { state, dispatch } = useGripSim();
  const svgRef = useRef(null);
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [wireStart, setWireStart] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [svgSize, setSvgSize] = useState([0, 0]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSvgSize([Math.round(width), Math.round(height)]);
      }
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 5;
  const ZOOM_STEP = 0.1;
  const { x: panX, y: panY, zoom } = view;

  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [ctxMenu]);

  const getSvgPoint = useCallback((clientX, clientY) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panX) / zoom,
      y: (clientY - rect.top - panY) / zoom,
    };
  }, [panX, panY, zoom]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('componentType');
    if (!type) return;
    const w = parseInt(e.dataTransfer.getData('componentWidth')) || 100;
    const h = parseInt(e.dataTransfer.getData('componentHeight')) || 100;
    const pt = getSvgPoint(e.clientX, e.clientY);
    const comp = {
      id: `comp-${nextId++}`,
      type,
      x: snap(pt.x - w / 2),
      y: snap(pt.y - h / 2),
      width: w,
      height: h,
    };
    dispatch({ type: 'ADD_COMPONENT', payload: comp });
  }, [dispatch, getSvgPoint]);

  const handleDragOver = useCallback((e) => e.preventDefault(), []);

  const handleComponentMouseDown = useCallback((e, comp) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setSelectedId(comp.id);
    const pt = getSvgPoint(e.clientX, e.clientY);
    setDragging({
      id: comp.id,
      offsetX: pt.x - comp.x,
      offsetY: pt.y - comp.y,
    });
  }, [getSvgPoint]);

  const handleCanvasMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.target === svgRef.current)) {
      if (wireStart) {
        setWireStart(null);
        return;
      }
      setIsPanning(true);
      panStart.current = { x: e.clientX - panX, y: e.clientY - panY };
      setSelectedId(null);
    }
  }, [panX, panY, wireStart]);

  const handleMouseMove = useCallback((e) => {
    const pt = getSvgPoint(e.clientX, e.clientY);
    setMousePos(pt);

    if (isPanning && panStart.current) {
      const ps = panStart.current;
      setView((v) => ({
        ...v,
        x: e.clientX - ps.x,
        y: e.clientY - ps.y,
      }));
      return;
    }

    if (dragging) {
      dispatch({
        type: 'UPDATE_COMPONENT',
        payload: {
          id: dragging.id,
          x: snap(pt.x - dragging.offsetX),
          y: snap(pt.y - dragging.offsetY),
        },
      });
    }
  }, [isPanning, dragging, dispatch, getSvgPoint]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDragging(null);
    panStart.current = null;
  }, []);

  const handlePinClick = useCallback((componentId, pinId, localX, localY) => {
    const comp = state.components.find((c) => c.id === componentId);
    if (!comp) return;
    const absX = comp.x + localX;
    const absY = comp.y + localY;

    if (!wireStart) {
      setWireStart({ componentId, pinId, x: absX, y: absY });
    } else {
      if (wireStart.componentId === componentId && wireStart.pinId === pinId) {
        setWireStart(null);
        return;
      }
      const wire = {
        id: `wire-${nextId++}`,
        sourceComponentId: wireStart.componentId,
        sourcePinId: wireStart.pinId,
        sourceX: wireStart.x,
        sourceY: wireStart.y,
        targetComponentId: componentId,
        targetPinId: pinId,
        targetX: absX,
        targetY: absY,
      };
      dispatch({ type: 'ADD_WIRE', payload: wire });
      setWireStart(null);
    }
  }, [wireStart, state.components, dispatch]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedId) {
        if (selectedId.startsWith('wire-')) {
          dispatch({ type: 'REMOVE_WIRE', payload: selectedId });
        } else {
          dispatch({ type: 'REMOVE_COMPONENT', payload: selectedId });
        }
        setSelectedId(null);
      }
    }
    if (e.key === 'Escape') {
      setWireStart(null);
      setSelectedId(null);
      setCtxMenu(null);
    }
  }, [selectedId, dispatch]);

  const handleValidate = useCallback(() => {
    const { components, wires } = state;
    const report = [];
    const failedWireIds = [];
    const arduino = components.find((c) => c.type === 'arduino');
    report.push({ label: 'Arduino placed', pass: !!arduino });

    const arms = components.filter((c) => c.type === 'robotic-arm');
    report.push({ label: 'Robotic arm placed', pass: arms.length > 0 });

    const findWireForPin = (compId, pinId) =>
      wires.find(
        (w) =>
          (w.sourceComponentId === compId && w.sourcePinId === pinId) ||
          (w.targetComponentId === compId && w.targetPinId === pinId)
      );

    const getOtherEnd = (wire, compId) =>
      wire.sourceComponentId === compId
        ? { cid: wire.targetComponentId, pid: wire.targetPinId }
        : { cid: wire.sourceComponentId, pid: wire.sourcePinId };

    const isPowerPin = (pid) =>
      pid === '5V' || pid === '+5V' || pid === '3.3V' ||
      pid === 'PWR+' || pid.startsWith('PWR_T+') || pid.startsWith('PWR_B+');

    const isGndPin = (pid) =>
      pid === 'GND' || pid === 'GND1' || pid === 'GND2' ||
      pid === 'PWR-' || pid.startsWith('PWR_T-') || pid.startsWith('PWR_B-');

    const pwmPins = ['D3', 'D5', 'D6', 'D9', 'D10', 'D11'];

    const canReachPin = (startCompId, startPinId, testFn) => {
      const visited = new Set();
      const queue = [{ compId: startCompId, pinId: startPinId }];
      while (queue.length > 0) {
        const { compId, pinId } = queue.shift();
        const key = `${compId}:${pinId}`;
        if (visited.has(key)) continue;
        visited.add(key);
        if (testFn(pinId)) return true;
        const connectedWires = wires.filter(
          (w) =>
            (w.sourceComponentId === compId && w.sourcePinId === pinId) ||
            (w.targetComponentId === compId && w.targetPinId === pinId)
        );
        for (const w of connectedWires) {
          const other = getOtherEnd(w, compId);
          if (testFn(other.pid)) return true;
          queue.push({ compId: other.cid, pinId: other.pid });
        }
      }
      return false;
    };

    // Validate each robotic arm (has 2 servo channels: 1=rotation, 2=gripper)
    arms.forEach((arm, ai) => {
      const servoChannels = [
        { suffix: '1', label: 'Rotation' },
        { suffix: '2', label: 'Gripper' },
      ];

      servoChannels.forEach(({ suffix, label }) => {
        const vccPin = `VCC${suffix}`;
        const gndPin = `GND${suffix}`;
        const sigPin = `SIG${suffix}`;

        // VCC check
        const vccWire = findWireForPin(arm.id, vccPin);
        const vccEnd = vccWire ? getOtherEnd(vccWire, arm.id) : null;
        let vccOk = vccEnd && isPowerPin(vccEnd.pid);
        if (!vccOk && vccWire) {
          vccOk = canReachPin(arm.id, vccPin, isPowerPin);
        }
        if (vccWire && !vccOk) failedWireIds.push(vccWire.id);
        report.push({ label: `${label} VCC → 5V`, pass: !!vccOk });

        // GND check
        const gndWire = findWireForPin(arm.id, gndPin);
        const gndEnd = gndWire ? getOtherEnd(gndWire, arm.id) : null;
        let gndOk = gndEnd && isGndPin(gndEnd.pid);
        if (!gndOk && gndWire) {
          gndOk = canReachPin(arm.id, gndPin, isGndPin);
        }
        if (gndWire && !gndOk) failedWireIds.push(gndWire.id);
        report.push({ label: `${label} GND → GND`, pass: !!gndOk });

        // Signal check
        const sigWire = findWireForPin(arm.id, sigPin);
        const sigEnd = sigWire ? getOtherEnd(sigWire, arm.id) : null;
        const sigOk = sigEnd && pwmPins.includes(sigEnd.pid);
        if (sigWire && !sigOk) failedWireIds.push(sigWire.id);
        report.push({ label: `${label} Signal → PWM pin`, pass: !!sigOk });
      });
    });

    const powerSupply = components.find((c) => c.type === 'power');
    if (powerSupply && arduino) {
      const commonGndWire = wires.find((w) => {
        const src =
          w.sourceComponentId === powerSupply.id
            ? w.sourcePinId
            : w.targetComponentId === powerSupply.id
              ? w.targetPinId
              : null;
        const tgt =
          w.sourceComponentId === arduino.id
            ? w.sourcePinId
            : w.targetComponentId === arduino.id
              ? w.targetPinId
              : null;
        return (
          (src === 'GND' && (tgt === 'GND1' || tgt === 'GND2')) ||
          ((src === 'GND1' || src === 'GND2') && tgt === 'GND')
        );
      });
      const commonGnd = !!commonGndWire;
      report.push({ label: 'Common ground (PSU ↔ Arduino)', pass: commonGnd });
    }

    const valid = report.every((r) => r.pass);
    dispatch({
      type: 'SET_VALIDATION_REPORT',
      payload: { report, valid },
    });
    dispatch({ type: 'SET_FAILED_WIRES', payload: failedWireIds });
    setShowValidation(true);
  }, [state, dispatch]);

  const handleLoadReference = useCallback(() => {
    const refComponents = [
      { id: 'ref-arduino', type: 'arduino', x: 60, y: 40, width: 240, height: 140 },
      { id: 'ref-arm', type: 'robotic-arm', x: 700, y: 20, width: 150, height: 320 },
      { id: 'ref-bb', type: 'breadboard', x: 120, y: 320, width: 260, height: 140 },
      { id: 'ref-power', type: 'power', x: 500, y: 360, width: 100, height: 70 },
    ];
    const compMap = Object.fromEntries(refComponents.map((c) => [c.id, c]));
    const makeWire = (id, srcId, srcPin, tgtId, tgtPin) => {
      const src = getAbsolutePin(compMap[srcId], srcPin);
      const tgt = getAbsolutePin(compMap[tgtId], tgtPin);
      return { id, sourceComponentId: srcId, sourcePinId: srcPin, sourceX: src.x, sourceY: src.y, targetComponentId: tgtId, targetPinId: tgtPin, targetX: tgt.x, targetY: tgt.y };
    };
    const refWires = [
      // Rotation servo signal -> Arduino D5 (maps to rotationAngle)
      makeWire('ref-w1', 'ref-arm', 'SIG1', 'ref-arduino', 'D5'),
      // Gripper servo signal -> Arduino D3 (maps to gripperAngle)
      makeWire('ref-w2', 'ref-arm', 'SIG2', 'ref-arduino', 'D3'),
      // Power: PSU +5V -> breadboard power rail
      makeWire('ref-w3', 'ref-power', '+5V', 'ref-bb', 'PWR_T+'),
      // Power: PSU GND -> breadboard GND rail
      makeWire('ref-w4', 'ref-power', 'GND', 'ref-bb', 'PWR_T-'),
      // Arm VCC1 -> breadboard power
      makeWire('ref-w5', 'ref-arm', 'VCC1', 'ref-bb', 'PWR_T+_R'),
      // Arm GND1 -> breadboard GND
      makeWire('ref-w6', 'ref-arm', 'GND1', 'ref-bb', 'PWR_T-_R'),
      // Arm VCC2 -> breadboard power
      makeWire('ref-w7', 'ref-arm', 'VCC2', 'ref-bb', 'PWR_B+'),
      // Arm GND2 -> breadboard GND
      makeWire('ref-w8', 'ref-arm', 'GND2', 'ref-bb', 'PWR_B-'),
      // Common ground: Arduino GND -> breadboard GND
      makeWire('ref-w9', 'ref-arduino', 'GND1', 'ref-bb', 'PWR_B-_R'),
      // Common ground: PSU GND -> Arduino GND (direct link for validation)
      makeWire('ref-w10', 'ref-power', 'GND', 'ref-arduino', 'GND2'),
    ];
    dispatch({ type: 'SET_COMPONENTS', payload: refComponents });
    dispatch({ type: 'SET_WIRES', payload: refWires });
    nextId = 100;
  }, [dispatch]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = 1 + direction * ZOOM_STEP;

    setView((v) => {
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor));
      const ratio = nextZoom / v.zoom;
      return {
        x: cursorX - (cursorX - v.x) * ratio,
        y: cursorY - (cursorY - v.y) * ratio,
        zoom: nextZoom,
      };
    });
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleZoomIn = useCallback(() => {
    setView((v) => ({ ...v, zoom: Math.min(MAX_ZOOM, v.zoom + ZOOM_STEP) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setView((v) => ({ ...v, zoom: Math.max(MIN_ZOOM, v.zoom - ZOOM_STEP) }));
  }, []);

  const handleZoomSlider = useCallback((e) => {
    setView((v) => ({ ...v, zoom: parseFloat(e.target.value) }));
  }, []);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const pt = getSvgPoint(e.clientX, e.clientY);
    const clickedComp = state.components.find((c) =>
      pt.x >= c.x && pt.x <= c.x + c.width &&
      pt.y >= c.y && pt.y <= c.y + c.height
    );

    const clickedWire = !clickedComp ? state.wires.find((w) => {
      // Resolve pin positions for orthogonal hit test
      const comp1 = state.components.find((c) => c.id === w.sourceComponentId);
      const comp2 = state.components.find((c) => c.id === w.targetComponentId);
      const pins1 = comp1 ? PIN_DEFS[comp1.type] : null;
      const pins2 = comp2 ? PIN_DEFS[comp2.type] : null;
      const p1 = pins1?.find((p) => p.id === w.sourcePinId);
      const p2 = pins2?.find((p) => p.id === w.targetPinId);
      const sx = comp1 ? comp1.x + (p1?.x ?? 0) : w.sourceX;
      const sy = comp1 ? comp1.y + (p1?.y ?? 0) : w.sourceY;
      const tx = comp2 ? comp2.x + (p2?.x ?? 0) : w.targetX;
      const ty = comp2 ? comp2.y + (p2?.y ?? 0) : w.targetY;
      // Check proximity to orthogonal segments
      const dy = ty - sy;
      const dx2 = tx - sx;
      const thr = 12;
      const vertFirst = Math.abs(dy) > Math.abs(dx2);
      if (Math.abs(dy) < 8) {
        const midX = sx + dx2 / 2;
        // 3 segments: horizontal, vertical, horizontal
        if (Math.abs(pt.y - sy) < thr && pt.x >= Math.min(sx, midX) - thr && pt.x <= Math.max(sx, midX) + thr) return true;
        if (Math.abs(pt.x - midX) < thr && pt.y >= Math.min(sy, ty) - thr && pt.y <= Math.max(sy, ty) + thr) return true;
        if (Math.abs(pt.y - ty) < thr && pt.x >= Math.min(midX, tx) - thr && pt.x <= Math.max(midX, tx) + thr) return true;
      } else if (vertFirst) {
        const midY = sy + dy * 0.4;
        if (Math.abs(pt.x - sx) < thr && pt.y >= Math.min(sy, midY) - thr && pt.y <= Math.max(sy, midY) + thr) return true;
        if (Math.abs(pt.y - midY) < thr && pt.x >= Math.min(sx, tx) - thr && pt.x <= Math.max(sx, tx) + thr) return true;
        if (Math.abs(pt.x - tx) < thr && pt.y >= Math.min(midY, ty) - thr && pt.y <= Math.max(midY, ty) + thr) return true;
      } else {
        const midX = sx + dx2 * 0.4;
        if (Math.abs(pt.y - sy) < thr && pt.x >= Math.min(sx, midX) - thr && pt.x <= Math.max(sx, midX) + thr) return true;
        if (Math.abs(pt.x - midX) < thr && pt.y >= Math.min(sy, ty) - thr && pt.y <= Math.max(sy, ty) + thr) return true;
        if (Math.abs(pt.y - ty) < thr && pt.x >= Math.min(midX, tx) - thr && pt.x <= Math.max(midX, tx) + thr) return true;
      }
      return false;
    }) : null;

    if (clickedComp) setSelectedId(clickedComp.id);
    else if (clickedWire) setSelectedId(clickedWire.id);

    const items = [];

    if (clickedComp) {
      items.push({ label: `Delete ${COMP_LABELS[clickedComp.type] || 'Component'}`, shortcut: 'Del', action: 'delete-component', danger: true });
      items.push({ label: 'Duplicate', shortcut: 'D', action: 'duplicate-component' });
      const wireCount = state.wires.filter((w) => w.sourceComponentId === clickedComp.id || w.targetComponentId === clickedComp.id).length;
      if (wireCount > 0) {
        items.push({ label: `Disconnect Wires (${wireCount})`, action: 'disconnect-wires', danger: true });
      }
      items.push({ type: 'separator' });
    } else if (clickedWire) {
      items.push({ label: 'Delete Wire', shortcut: 'Del', action: 'delete-wire', danger: true });
      items.push({ type: 'separator' });
    }

    if (state.components.length > 0 || state.wires.length > 0) {
      items.push({ label: 'Clear All', action: 'clear-all', danger: true });
      items.push({ type: 'separator' });
    }

    items.push({ label: 'Load Reference', action: 'load-reference' });
    items.push({ label: 'Validate Circuit', action: 'validate' });
    items.push({ label: 'Reset View', action: 'reset-view' });

    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      items,
      targetComp: clickedComp,
      targetWire: clickedWire,
    });
  }, [state.components, state.wires, getSvgPoint]);

  const handleCtxAction = useCallback((action) => {
    if (!ctxMenu) return;
    const { targetComp, targetWire } = ctxMenu;
    setCtxMenu(null);

    switch (action) {
      case 'delete-component':
        if (targetComp) {
          dispatch({ type: 'REMOVE_COMPONENT', payload: targetComp.id });
          setSelectedId(null);
        }
        break;
      case 'duplicate-component':
        if (targetComp) {
          const dup = {
            id: `comp-${nextId++}`,
            type: targetComp.type,
            x: targetComp.x + 20,
            y: targetComp.y + 20,
            width: targetComp.width,
            height: targetComp.height,
          };
          dispatch({ type: 'ADD_COMPONENT', payload: dup });
          setSelectedId(dup.id);
        }
        break;
      case 'disconnect-wires':
        if (targetComp) {
          state.wires
            .filter((w) => w.sourceComponentId === targetComp.id || w.targetComponentId === targetComp.id)
            .forEach((w) => dispatch({ type: 'REMOVE_WIRE', payload: w.id }));
        }
        break;
      case 'delete-wire':
        if (targetWire) {
          dispatch({ type: 'REMOVE_WIRE', payload: targetWire.id });
          setSelectedId(null);
        }
        break;
      case 'clear-all':
        dispatch({ type: 'CLEAR_CIRCUIT' });
        setSelectedId(null);
        setWireStart(null);
        break;
      case 'load-reference':
        handleLoadReference();
        break;
      case 'validate':
        handleValidate();
        break;
      case 'reset-view':
        setView({ x: 0, y: 0, zoom: 1 });
        break;
    }
  }, [ctxMenu, state.wires, dispatch, handleLoadReference, handleValidate]);

  // No longer needed - robotic arm gets both angles directly

  const isActive = state.activePanel === 'circuit';

  return (
    <div
      className={`panel h-full flex flex-col ${isActive ? 'panel-active' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={() => dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'circuit' })}
    >
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-[var(--accent-cyan)]">
          CIRCUIT BUILDER
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleLoadReference}
            className="font-mono text-[10px] px-2 py-0.5 rounded border border-[var(--accent-orange)] text-[var(--accent-orange)] hover:bg-[var(--accent-orange)]/10 transition-colors"
          >
            Load Reference
          </button>
          <button
            onClick={handleValidate}
            className="font-mono text-[10px] px-2 py-0.5 rounded border border-[var(--accent-green)] text-[var(--accent-green)] hover:bg-[var(--accent-green)]/10 transition-colors"
          >
            Validate Circuit
          </button>
        </div>
      </div>
      <div className="flex-1 flex min-h-0">
        <ComponentTray />
        <div
          className="flex-1 dot-grid relative overflow-hidden"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <svg
            ref={svgRef}
            className="w-full h-full"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={handleContextMenu}
            style={{ cursor: isPanning ? 'grabbing' : wireStart ? 'crosshair' : 'default' }}
          >
            <g transform={`translate(${panX},${panY}) scale(${zoom})`}>

              {wireStart && mousePos && (() => {
                const sx = wireStart.x, sy = wireStart.y;
                const tx = mousePos.x, ty = mousePos.y;
                const dy = ty - sy, dx = tx - sx;
                let d;
                if (Math.abs(dy) < 8) {
                  const midX = sx + dx / 2;
                  d = `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
                } else if (Math.abs(dy) > Math.abs(dx)) {
                  const midY = sy + dy * 0.4;
                  d = `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
                } else {
                  const midX = sx + dx * 0.4;
                  d = `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
                }
                return (
                  <path
                    d={d}
                    fill="none"
                    stroke="var(--accent-cyan)"
                    strokeWidth="2"
                    strokeDasharray="6 3"
                    strokeLinejoin="round"
                    className="wire-animated"
                    pointerEvents="none"
                  />
                );
              })()}

              {state.components.map((comp) => {
                const Component = COMPONENT_MAP[comp.type];
                if (!Component) return null;
                const isSelected = selectedId === comp.id;
                const extraProps = {};
                if (comp.type === 'robotic-arm') {
                  extraProps.gripperAngle = state.gripperAngle;
                  extraProps.rotationAngle = state.rotationAngle;
                }
                if (comp.type === 'arduino') {
                  const pins = new Set();
                  for (const w of state.wires) {
                    if (w.sourceComponentId === comp.id) pins.add(w.sourcePinId);
                    if (w.targetComponentId === comp.id) pins.add(w.targetPinId);
                  }
                  extraProps.connectedPins = pins;
                }
                return (
                  <g
                    key={comp.id}
                    transform={`translate(${comp.x},${comp.y})`}
                    onMouseDown={(e) => handleComponentMouseDown(e, comp)}
                    style={{ cursor: 'move' }}
                  >
                    {isSelected && (
                      <rect
                        x={-4}
                        y={-4}
                        width={comp.width + 8}
                        height={comp.height + 8}
                        rx={8}
                        fill="none"
                        stroke="var(--accent-cyan)"
                        strokeWidth="2"
                        strokeDasharray="6 3"
                        opacity="0.6"
                      />
                    )}
                    <Component
                      id={comp.id}
                      onPinClick={handlePinClick}
                      {...extraProps}
                    />
                  </g>
                );
              })}

              <WireLayer
                wires={state.wires}
                components={state.components}
                selectedId={selectedId}
                onSelect={setSelectedId}
                failedWireIds={state.failedWireIds}
              />

            </g>

            <HandOverlay svgWidth={svgSize[0]} svgHeight={svgSize[1]} />
          </svg>

          {showValidation && (
            <ValidationPanel
              report={state.validationReport}
              valid={state.circuitValid}
              onClose={() => setShowValidation(false)}
            />
          )}

          {ctxMenu && (
            <div
              className="ctx-menu"
              style={{
                position: 'fixed',
                left: ctxMenu.x,
                top: ctxMenu.y,
                zIndex: 50,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {ctxMenu.items.map((item, i) =>
                item.type === 'separator' ? (
                  <div key={i} className="ctx-sep" />
                ) : (
                  <button
                    key={i}
                    className={`ctx-item ${item.danger ? 'ctx-danger' : ''}`}
                    onClick={() => handleCtxAction(item.action)}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="ctx-shortcut">{item.shortcut}</span>
                    )}
                  </button>
                )
              )}
            </div>
          )}

          <div className="zoom-controls">
            <button className="zoom-btn" onClick={handleZoomOut}>-</button>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={handleZoomSlider}
              className="zoom-slider"
            />
            <button className="zoom-btn" onClick={handleZoomIn}>+</button>
            <span className="zoom-label">{Math.round(zoom * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CircuitCanvas;
