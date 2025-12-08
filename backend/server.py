# backend/server.py
import serial
import asyncio
from fastapi import FastAPI, WebSocket
import uvicorn

app = FastAPI()

# 시리얼 포트는 환경에 맞게 변경 (Windows: 'COM3' 등)
SERIAL_PORT = "/dev/tty.usbmodem1101"
BAUDRATE = 9600

ser = serial.Serial(SERIAL_PORT, BAUDRATE, timeout=0.1)

@app.websocket("/ws/arduino")
async def arduino_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            if ser.in_waiting:
                line = ser.readline().decode(errors="ignore").strip()
                if line:
                    # 그대로 클라이언트로 전달 (이미 JSON이면 파싱 안 해도 됨)
                    await websocket.send_text(line)
            await asyncio.sleep(0.02)
    except Exception as e:
        print("WebSocket error:", e)

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
