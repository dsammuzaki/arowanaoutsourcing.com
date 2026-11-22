"""Server FastAPI: REST /decide dan WebSocket /ws.

Jalankan:  uvicorn main:app --host 127.0.0.1 --port 8000
"""
import asyncio

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from agent_brain import AgentDecision, AgentState, decide

app = FastAPI(title="AI Office Brain")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/decide", response_model=AgentDecision)
async def decide_endpoint(state: AgentState):
    # decide() sinkron (panggilan LLM), jadi dijalankan di thread agar server tidak terblokir
    return await asyncio.to_thread(decide, state)


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            state = AgentState.model_validate_json(await ws.receive_text())
            decision = await asyncio.to_thread(decide, state)
            await ws.send_text(decision.model_dump_json())
    except WebSocketDisconnect:
        pass
