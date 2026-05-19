import asyncio
import base64
import json
import time
import cv2
import mediapipe as mp
import numpy as np
from collections import deque
from concurrent.futures import ThreadPoolExecutor
import websockets

WS_HOST = "0.0.0.0"
WS_PORT = 8765
JPEG_QUALITY = 50
SEND_WIDTH = 480
TARGET_FPS = 60

mp_hands = mp.solutions.hands

hands = mp_hands.Hands(
    max_num_hands=1,
    model_complexity=0,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7,
)

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
cap.set(cv2.CAP_PROP_FPS, 60)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

clients = set()
executor = ThreadPoolExecutor(max_workers=1)

SMOOTHING = 5
landmark_history = [deque(maxlen=SMOOTHING) for _ in range(21)]
prev_landmarks = None
VELOCITY_SMOOTH = 0.4
encode_param = [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY]


def smooth_landmarks(raw):
    global prev_landmarks

    for i, lm in enumerate(raw):
        landmark_history[i].append((lm.x, lm.y))

    averaged = []
    for i in range(21):
        buf = landmark_history[i]
        n = len(buf)
        weights = np.arange(1, n + 1, dtype=np.float64)
        weights /= weights.sum()
        ax = sum(w * p[0] for w, p in zip(weights, buf))
        ay = sum(w * p[1] for w, p in zip(weights, buf))
        averaged.append((ax, ay))

    if prev_landmarks is not None:
        blended = []
        for i, (cx, cy) in enumerate(averaged):
            px, py = prev_landmarks[i]
            dx, dy = cx - px, cy - py
            dist = (dx * dx + dy * dy) ** 0.5
            alpha = min(1.0, dist * 15) * (1 - VELOCITY_SMOOTH) + VELOCITY_SMOOTH
            bx = px + (cx - px) * alpha
            by = py + (cy - py) * alpha
            blended.append((bx, by))
        prev_landmarks = blended
        return blended

    prev_landmarks = averaged
    return averaged


def process_frame():
    ret, frame = cap.read()
    if not ret:
        return None

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    rgb.flags.writeable = False
    result = hands.process(rgb)

    h, w = frame.shape[:2]
    send_h = int(SEND_WIDTH * h / w)
    small = cv2.resize(frame, (SEND_WIDTH, send_h), interpolation=cv2.INTER_AREA)
    _, jpg = cv2.imencode(".jpg", small, encode_param)
    frame_b64 = base64.b64encode(jpg.tobytes()).decode("ascii")

    landmarks_list = []
    if result.multi_hand_landmarks:
        for hand_lm in result.multi_hand_landmarks:
            smoothed = smooth_landmarks(hand_lm.landmark)
            landmarks_list.append(
                [{"x": round(x, 4), "y": round(y, 4)} for x, y in smoothed]
            )

    return json.dumps({"landmarks": landmarks_list, "frame": frame_b64})


async def handler(ws):
    clients.add(ws)
    print(f"Client connected ({len(clients)} total)")
    try:
        async for _ in ws:
            pass
    finally:
        clients.discard(ws)
        print(f"Client disconnected ({len(clients)} total)")


async def broadcast_loop():
    loop = asyncio.get_event_loop()
    frame_interval = 1.0 / TARGET_FPS

    while True:
        t0 = time.perf_counter()

        if not clients:
            await asyncio.sleep(0.05)
            continue

        payload = await loop.run_in_executor(executor, process_frame)
        if payload is None:
            await asyncio.sleep(0.005)
            continue

        stale = set()
        for ws in clients:
            try:
                await ws.send(payload)
            except websockets.ConnectionClosed:
                stale.add(ws)
        clients.difference_update(stale)

        elapsed = time.perf_counter() - t0
        sleep_time = frame_interval - elapsed
        if sleep_time > 0:
            await asyncio.sleep(sleep_time)
        else:
            await asyncio.sleep(0)


async def main():
    print(f"Starting hand tracker on ws://{WS_HOST}:{WS_PORT}")
    async with websockets.serve(handler, WS_HOST, WS_PORT, max_size=2**22):
        await broadcast_loop()


if __name__ == "__main__":
    asyncio.run(main())
