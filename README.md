# GripSim: VisionControlled Robotic Gripper IDE

## Abstract

GripSim is a browserbased integrated development environment (IDE) designed for the prototyping and simulation of visioncontrolled robotic gripper systems. The application leverages realtime hand tracking via Google's MediaPipe Hands framework to extract finger states and wrist rotation data, which are subsequently mapped to servo motor control signals. The system provides an interactive circuit builder for designing Arduinobased servo control circuits, a realtime servo visualisation dashboard, a serial monitor emulator, and a code editor preloaded with reference implementations in both Python and Arduino C++.

## System Architecture

The application is implemented as a singlepage React application comprising four principal panels:

1. **Webcam and Hand Tracking Panel** Realtime video capture with MediaPipe Hands overlay, finger state extraction with temporal smoothing, gesture classification, and emergency stop detection.

2. **Circuit Builder** An interactive SVGbased schematic editor supporting draganddrop component placement, pintopin wiring with automatic colour coding, circuit validation, and reference circuit loading.

3. **Servo Visualiser and Serial Monitor** Animated semicircular gauge displays for gripper and rotation servo angles, an animated gripper claw SVG, and a colourcoded serial monitor emulating Arduino IDE output.

4. **Code Editor** Monaco Editor integration providing syntaxhighlighted, editable reference code for both the Python control script and the Arduino firmware.

## Technical Stack

 **Frontend Framework:** React 18 with functional components and hooks
 **Build System:** Vite
 **Styling:** Tailwind CSS with custom design tokens
 **Hand Tracking:** MediaPipe Hands (loaded via CDN)
 **Code Editor:** Monaco Editor (`@monacoeditor/react`)
 **Graphics:** Custom SVG components for circuit elements and servo visualisation

## Installation and Execution

### Prerequisites

 Node.js (version 18 or later)
 npm (version 9 or later)
 A modern web browser with WebRTC support (Chrome, Edge, or Firefox recommended)

### Setup

```bash
npm install
npm run dev
```

The application will be accessible at `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```

## Usage Instructions

1. **Start Hand Tracking:** Click the "Start Webcam" button in the header to initialise the camera and MediaPipe model.
2. **Build a Circuit:** Drag components from the left tray onto the canvas. Click on pins to draw wires between components. Use "Load Reference" to see the correct wiring.
3. **Validate:** Click "Validate Circuit" to check that all connections are correct.
4. **Observe:** The servo gauges and serial monitor respond in real time to hand gestures detected by the webcam.

## Gesture Mappings

| Gesture     | Finger States       | Gripper Angle |
||||
| Open Hand   | All UP              | 180°          |
| Fist        | All DOWN            | 0°            |
| Peace       | Index + Middle UP   | 90°           |
| Thumbs Up   | Only Thumb UP       | 45°           |
| Custom      | Mixed               | Interpolated  |

## Licence

This project was developed for academic purposes.
