import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useGripSim } from '../../context/GripSimContext';
import ComponentTray from './ComponentTray';
import WireLayer from './WireLayer';
import ValidationPanel from './ValidationPanel';
import HandOverlay from './HandOverlay';
import ArduinoUno, { ARDUINO_PINS } from './components/ArduinoUno';
import ServoSG90, { SERVO_PINS } from './components/ServoSG90';
import PowerSupply, { POWER_SUPPLY_PINS } from './components/PowerSupply';
import Breadboard, { BREADBOARD_PINS } from './components/Breadboard';
import USBCable from './components/USBCable';

const GRID_SIZE = 20;
const snap = (v) => Math.round(v / GRID_SIZE) * GRID_SIZE;

const PIN_DEFS = {
  arduino: ARDUINO_PINS,
  servo: SERVO_PINS,
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
  servo: ServoSG90,
  power: PowerSupply,
  breadboard: Breadboard,
  usb: USBCable,
};

const COMP_LABELS = { arduino: 'Arduino Uno', servo: 'SG90 Servo', power: 'Power Supply', breadboard: 'Breadboard', usb: 'USB Cable' };

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

    const servos = components.filter((c) => c.type === 'servo');
    report.push({ label: 'At least one servo placed', pass: servos.length > 0 });

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

    const canReachPin = (startCompId, startPinId, targetPinIds) => {
      const visited = new Set();
      const queue = [{ compId: startCompId, pinId: startPinId }];
      while (queue.length > 0) {
        const { compId, pinId } = queue.shift();
        const key = `${compId}:${pinId}`;
        if (visited.has(key)) continue;
        visited.add(key);
        if (targetPinIds.some((t) => t.pid === pinId || (t.cid && components.find((c) => c.id === compId)?.type === 'breadboard' && isBusMatch(pinId, t)))) {
          return true;
        }
        const connectedWires = wires.filter(
          (w) =>
            (w.sourceComponentId === compId && w.sourcePinId === pinId) ||
            (w.targetComponentId === compId && w.targetPinId === pinId)
        );
        for (const w of connectedWires) {
          const other = getOtherEnd(w, compId);
          const otherComp = components.find((c) => c.id === other.cid);
          if (otherComp?.type === 'breadboard') {
            const busPins = other.pid === 'PWR+' ? ['PWR+'] : other.pid === 'PWR-' ? ['PWR-'] : [];
            for (const bp of busPins) {
              queue.push({ compId: other.cid, pinId: bp });
            }
          }
          if (targetPinIds.some((t) => t.pid === other.pid)) return true;
          queue.push({ compId: other.cid, pinId: other.pid });
        }
      }
      return false;
    };

    const isBusMatch = () => false;

    servos.forEach((servo, i) => {
      const vccWire = findWireForPin(servo.id, 'VCC');
      const otherEnd = vccWire ? getOtherEnd(vccWire, servo.id) : null;
      const vccOk =
        otherEnd &&
        (otherEnd.pid === '5V' || otherEnd.pid === '+5V' || otherEnd.pid === 'PWR+');
      if (vccWire && !vccOk) failedWireIds.push(vccWire.id);
      report.push({
        label: `Servo ${i + 1} VCC → 5V`,
        pass: !!vccOk,
      });

      const gndWire = findWireForPin(servo.id, 'GND');
      const gndEnd = gndWire ? getOtherEnd(gndWire, servo.id) : null;
      const gndOk =
        gndEnd &&
        (gndEnd.pid === 'GND' ||
          gndEnd.pid === 'GND1' ||
          gndEnd.pid === 'GND2' ||
          gndEnd.pid === 'PWR-');
      if (gndWire && !gndOk) failedWireIds.push(gndWire.id);
      report.push({ label: `Servo ${i + 1} GND → GND`, pass: !!gndOk });

      const sigWire = findWireForPin(servo.id, 'Signal');
      const sigEnd = sigWire ? getOtherEnd(sigWire, servo.id) : null;
      const pwmPins = ['D3', 'D5', 'D6', 'D9', 'D10', 'D11'];
      const sigOk = sigEnd && pwmPins.includes(sigEnd.pid);
      if (sigWire && !sigOk) failedWireIds.push(sigWire.id);
      report.push({
        label: `Servo ${i + 1} Signal → PWM pin`,
        pass: !!sigOk,
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

    // Breadboard bus validation: check if servo pins reach power through breadboard
    const breadboard = components.find((c) => c.type === 'breadboard');
    if (breadboard) {
      servos.forEach((servo, i) => {
        const vccReport = report.find((r) => r.label === `Servo ${i + 1} VCC → 5V`);
        if (vccReport && !vccReport.pass) {
          const reachable = canReachPin(servo.id, 'VCC', [{ pid: '5V' }, { pid: '+5V' }]);
          if (reachable) {
            vccReport.pass = true;
            const idx = failedWireIds.indexOf(findWireForPin(servo.id, 'VCC')?.id);
            if (idx !== -1) failedWireIds.splice(idx, 1);
          }
        }
        const gndReport = report.find((r) => r.label === `Servo ${i + 1} GND → GND`);
        if (gndReport && !gndReport.pass) {
          const reachable = canReachPin(servo.id, 'GND', [{ pid: 'GND' }, { pid: 'GND1' }, { pid: 'GND2' }]);
          if (reachable) {
            gndReport.pass = true;
            const idx = failedWireIds.indexOf(findWireForPin(servo.id, 'GND')?.id);
            if (idx !== -1) failedWireIds.splice(idx, 1);
          }
        }
      });
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
      { id: 'ref-arduino', type: 'arduino', x: 200, y: 100, width: 240, height: 140 },
      { id: 'ref-servo1', type: 'servo', x: 100, y: 300, width: 80, height: 90 },
      { id: 'ref-servo2', type: 'servo', x: 300, y: 300, width: 80, height: 90 },
      { id: 'ref-power', type: 'power', x: 500, y: 150, width: 100, height: 70 },
    ];
    const compMap = Object.fromEntries(refComponents.map((c) => [c.id, c]));
    const makeWire = (id, srcId, srcPin, tgtId, tgtPin) => {
      const src = getAbsolutePin(compMap[srcId], srcPin);
      const tgt = getAbsolutePin(compMap[tgtId], tgtPin);
      return { id, sourceComponentId: srcId, sourcePinId: srcPin, sourceX: src.x, sourceY: src.y, targetComponentId: tgtId, targetPinId: tgtPin, targetX: tgt.x, targetY: tgt.y };
    };
    const refWires = [
      makeWire('ref-w1', 'ref-servo1', 'Signal', 'ref-arduino', 'D3'),
      makeWire('ref-w2', 'ref-servo2', 'Signal', 'ref-arduino', 'D5'),
      makeWire('ref-w3', 'ref-servo1', 'VCC', 'ref-power', '+5V'),
      makeWire('ref-w4', 'ref-servo2', 'VCC', 'ref-power', '+5V'),
      makeWire('ref-w5', 'ref-servo1', 'GND', 'ref-arduino', 'GND1'),
      makeWire('ref-w6', 'ref-servo2', 'GND', 'ref-arduino', 'GND2'),
      makeWire('ref-w7', 'ref-power', 'GND', 'ref-arduino', 'GND1'),
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
      const steps = 10;
      for (let t = 0; t <= 1; t += 1 / steps) {
        const u = 1 - t;
        const dx = w.targetX - w.sourceX;
        const cx1 = w.sourceX + dx * 0.4;
        const cx2 = w.targetX - dx * 0.4;
        const bx = u * u * u * w.sourceX + 3 * u * u * t * cx1 + 3 * u * t * t * cx2 + t * t * t * w.targetX;
        const by = u * u * u * w.sourceY + 3 * u * u * t * w.sourceY + 3 * u * t * t * w.targetY + t * t * t * w.targetY;
        if (Math.abs(pt.x - bx) < 12 && Math.abs(pt.y - by) < 12) return true;
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

  const getServoAngle = useCallback((servoId) => {
    const sigWire = state.wires.find(
      (w) =>
        (w.sourceComponentId === servoId && w.sourcePinId === 'Signal') ||
        (w.targetComponentId === servoId && w.targetPinId === 'Signal')
    );
    if (!sigWire) return state.gripperAngle;
    const pin = sigWire.sourceComponentId === servoId ? sigWire.targetPinId : sigWire.sourcePinId;
    if (pin === 'D5') return state.rotationAngle;
    return state.gripperAngle;
  }, [state.wires, state.gripperAngle, state.rotationAngle]);

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
              <WireLayer
                wires={state.wires}
                components={state.components}
                selectedId={selectedId}
                onSelect={setSelectedId}
                failedWireIds={state.failedWireIds}
              />

              {wireStart && mousePos && (
                <line
                  x1={wireStart.x}
                  y1={wireStart.y}
                  x2={mousePos.x}
                  y2={mousePos.y}
                  stroke="var(--accent-cyan)"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                  className="wire-animated"
                  pointerEvents="none"
                />
              )}

              {state.components.map((comp) => {
                const Component = COMPONENT_MAP[comp.type];
                if (!Component) return null;
                const isSelected = selectedId === comp.id;
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
                      angle={comp.type === 'servo' ? getServoAngle(comp.id) : undefined}
                    />
                  </g>
                );
              })}

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
