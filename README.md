# GripSim

browser based IDE for controlling a robotic gripper arm using hand tracking

uses mediapipe to track your hand through the webcam and maps finger movements to servo angles. has a circuit builder where you can wire up an arduino with servos and a breadboard, and a code editor with the python and arduino code

## how to run

```
npm install
npm run dev
```

opens on localhost:5173

## build

```
npm run build
```

## how it works

you start the webcam and it detects your hand gestures and maps them to gripper open/close and wrist rotation. the circuit builder lets you drag components around and wire them up. theres also a serial monitor that shows whats being sent

## tech

react, vite, tailwind, mediapipe hands, monaco editor

## gestures

open hand = gripper fully open, fist = closed, peace = halfway, and everything else gets interpolated based on how many fingers are up. wrist tilt controls rotation
