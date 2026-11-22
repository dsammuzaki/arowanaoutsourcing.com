"""Alat yang dipakai agen untuk mengerjakan tugas nyata."""
from __future__ import annotations

import logging

log = logging.getLogger("tools")

TASK_PROMPT = (
    "Kamu karyawan kantor. Kerjakan tugas berikut secara ringkas dan nyata.\n"
    "- Jika tugas berupa coding, tulis kode yang bisa dijalankan dalam satu blok.\n"
    "- Jika tugas berupa ringkasan/riset, tulis maksimal 5 poin.\n\n"
    "Tugas: {task}"
)


def run_task(task: str, llm) -> str:
    """Jalankan tugas via LLM. Tanpa LLM, kembalikan placeholder agar simulasi tetap jalan."""
    if llm is None:
        return f"[simulasi] Tugas '{task}' ditandai selesai (LLM belum dikonfigurasi)."
    try:
        reply = llm.invoke(TASK_PROMPT.format(task=task))
        content = reply.content
        if isinstance(content, list):  # beberapa provider mengembalikan blok konten
            content = "".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in content)
        return content.strip()
    except Exception as exc:
        log.warning("run_task gagal: %s", exc)
        return f"[error] Gagal mengerjakan '{task}': {exc}"
