# Virtual AI Office (Unity + FastAPI/LangChain)

## Backend
```powershell
cd ai_office_server
pip install -r requirements.txt
$env:ANTHROPIC_API_KEY = "..."          # kunci sesuai provider
$env:AI_MODEL = "anthropic:claude-sonnet-5-5"   # kosongkan = mode rule-based (tanpa LLM)
uvicorn main:app --host 127.0.0.1 --port 8000
```
Endpoint: `POST /decide`, `WS /ws`, `GET /health`.

## Unity
1. Salin `unity/Assets/_Scripts` ke project Unity (Unity 2021.3+, paket TextMeshPro).
2. Bake NavMesh pada lantai kantor.
3. Objek kosong `SimulationManager`: isi `officeObjects` (id: `Desk_A4`, `Coffee_Machine`, `Lounge_Chair` + titik Transform).
4. Agen: NavMeshAgent + `AgentNeeds` + `AIAgentController` (+ Animator dengan state: Idle, Walking, Sitting_Idle, Typing, Drinking, Thinking).
5. Kamera: jadikan Main Camera anak dari pivot ber-`IsometricCamera` (Q/E rotasi 90°, scroll zoom, klik tengah pan).
6. Canvas: `AgentStatusPanel`, hubungkan referensi TMP_Text/Slider.
