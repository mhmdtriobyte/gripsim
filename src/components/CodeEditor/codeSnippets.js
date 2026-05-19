export const MAIN_PY = `import cv2
import mediapipe as mp
import numpy as np
from collections import deque
import serial
import time

# ── Serial Configuration ──────────────────────────────────────────
SERIAL_PORT = 'COM3'
BAUD_RATE = 9600
arduino = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
time.sleep(2)

# ── MediaPipe Setup ───────────────────────────────────────────────
mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils
hands = mp_hands.Hands(
    max_num_hands=2,
    min_detection_confidence=0.85,
    min_tracking_confidence=0.85
)

# ── Smoothing Configuration ───────────────────────────────────────
SMOOTHING_WINDOW = 7
STABILITY_THRESHOLD = 4
TIP_IDS  = [8, 12, 16, 20]
PIP_IDS  = [6, 10, 14, 18]
ALL_IDS  = TIP_IDS + PIP_IDS + [0, 4, 3, 9]
history  = {i: deque(maxlen=SMOOTHING_WINDOW) for i in ALL_IDS}
stable_fingers = [0, 0, 0, 0]
stable_count   = [0, 0, 0, 0]

def get_finger_state(landmarks, tip_id, pip_id):
    history[tip_id].append(landmarks[tip_id].y)
    history[pip_id].append(landmarks[pip_id].y)
    return 1 if np.mean(history[tip_id]) < np.mean(history[pip_id]) else 0

def stabilize(fingers):
    for i, val in enumerate(fingers):
        if val != stable_fingers[i]:
            stable_count[i] += 1
            if stable_count[i] >= STABILITY_THRESHOLD:
                stable_fingers[i] = val
                stable_count[i]   = 0
        else:
            stable_count[i] = 0
    return list(stable_fingers)

def get_wrist_rotation(landmarks):
    wrist = landmarks[0]
    mid_mcp = landmarks[9]
    import math
    angle = math.degrees(math.atan2(mid_mcp.y - wrist.y, mid_mcp.x - wrist.x))
    return int(np.clip((angle + 90) * 2, 0, 180))

def classify_gesture(fingers):
    if fingers == [1, 1, 1, 1]: return "OPEN HAND"
    if fingers == [0, 0, 0, 0]: return "FIST"
    if fingers == [1, 1, 0, 0]: return "PEACE"
    return "CUSTOM"

def fingers_to_gripper_angle(fingers):
    return int((sum(fingers) / 4) * 180)

# ── Main Loop ─────────────────────────────────────────────────────
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
emergency_stop = False

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    rgb.flags.writeable = False
    result = hands.process(rgb)
    rgb.flags.writeable = True

    if result.multi_hand_landmarks:
        if len(result.multi_hand_landmarks) >= 2:
            emergency_stop = True
            cv2.putText(frame, "!! EMERGENCY STOP !!", (50, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 4)
        else:
            emergency_stop = False
            lm      = result.multi_hand_landmarks[0].landmark
            raw     = [get_finger_state(lm, TIP_IDS[i], PIP_IDS[i]) for i in range(4)]
            fingers = stabilize(raw)
            gesture = classify_gesture(fingers)
            gripper = fingers_to_gripper_angle(fingers)
            rotation = get_wrist_rotation(lm)

            if not emergency_stop:
                arduino.write(bytes([gripper, rotation]))

            mp_draw.draw_landmarks(frame, result.multi_hand_landmarks[0],
                                   mp_hands.HAND_CONNECTIONS)
            cv2.putText(frame, f"Gesture: {gesture}", (10, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 200), 2)
            cv2.putText(frame, f"Gripper: {gripper}° | Rotation: {rotation}°",
                        (10, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 200, 255), 2)

    cv2.imshow("GripSim — Vision Controlled Gripper", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
arduino.close()
cv2.destroyAllWindows()`;

export const ARDUINO_INO = `#include <Servo.h>

Servo gripperServo;
Servo rotationServo;

const int GRIPPER_PIN  = 3;
const int ROTATION_PIN = 5;

void setup() {
    Serial.begin(9600);
    gripperServo.attach(GRIPPER_PIN);
    rotationServo.attach(ROTATION_PIN);
    gripperServo.write(0);
    rotationServo.write(90);
}

void loop() {
    if (Serial.available() >= 2) {
        int gripperAngle  = Serial.read();
        int rotationAngle = Serial.read();
        gripperServo.write(constrain(gripperAngle,  0, 180));
        rotationServo.write(constrain(rotationAngle, 0, 180));
    }
}`;
