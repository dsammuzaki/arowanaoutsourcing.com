"""Otak agen: LangChain structured output, dengan fallback rule-based bila LLM tidak tersedia."""
from __future__ import annotations

import logging
import os
from typing import Literal, Optional

from pydantic import BaseModel, Field

import tools

log = logging.getLogger("agent_brain")


class AgentState(BaseModel):
    name: str
    energy: int = Field(ge=0, le=100)
    current_location: str = "Office"
    current_task: str = "idle"
    mood: str = "Focused"
    pending_tasks: list[str] = Field(default_factory=list)
    sim_time: str = ""


class AgentDecision(BaseModel):
    action: Literal["WORK", "RECHARGE", "THINK", "IDLE"]
    target_object: str = Field(description="Nama objek kantor tujuan, mis. Desk_A4, Coffee_Machine, Lounge_Chair")
    animation: Literal["Idle", "Walking", "Sitting_Idle", "Typing", "Drinking", "Thinking"]
    mood: Literal["Focused", "Tired", "Stressed", "Relaxed"]
    thought: str = Field(description="Satu kalimat pendek untuk thought bubble")
    duration: int = Field(default=10, description="Lama aksi dalam detik simulasi")
    task_output: Optional[str] = Field(default=None, description="Hasil nyata tugas (ringkasan/kode) bila WORK")
    completed_task: Optional[str] = Field(default=None, description="Tugas yang selesai pada aksi ini")


SYSTEM_PROMPT = """Kamu adalah otak dari karakter kantor virtual bernama {name}.
Putuskan aksi berikutnya berdasarkan status. Aturan:
- energy < 25 -> RECHARGE di Coffee_Machine (animation Drinking, mood Tired).
- ada pending_tasks -> WORK di Desk_A4 (animation Typing, mood Focused).
- tidak ada tugas -> IDLE di Lounge_Chair (animation Idle, mood Relaxed).
- THINK (animation Thinking) bila tugas ambigu atau sulit.
Thought maksimal 1 kalimat Bahasa Indonesia, sudut pandang orang pertama.
Jangan isi task_output; itu diisi sistem."""

_llm = None
_llm_checked = False


def _get_llm():
    """Buat chat model dari env AI_MODEL (mis. 'anthropic:claude-sonnet-5-5', 'openai:gpt-4o')."""
    global _llm, _llm_checked
    if _llm_checked:
        return _llm
    _llm_checked = True
    model = os.getenv("AI_MODEL")
    if not model:
        log.info("AI_MODEL belum di-set -> mode rule-based")
        return None
    try:
        from langchain.chat_models import init_chat_model

        _llm = init_chat_model(model, temperature=0.4)
    except Exception as exc:  # paket/kunci API belum siap
        log.warning("Gagal init LLM (%s) -> mode rule-based", exc)
    return _llm


def rule_based_decision(state: AgentState) -> AgentDecision:
    if state.energy < 25:
        return AgentDecision(
            action="RECHARGE", target_object="Coffee_Machine", animation="Drinking",
            mood="Tired", thought="Energi menipis, butuh kopi dulu...", duration=8,
        )
    if state.pending_tasks:
        return AgentDecision(
            action="WORK", target_object="Desk_A4", animation="Typing",
            mood="Focused", thought=f"Mengerjakan: {state.pending_tasks[0]}", duration=15,
        )
    return AgentDecision(
        action="IDLE", target_object="Lounge_Chair", animation="Idle",
        mood="Relaxed", thought="Semua tugas beres!", duration=10,
    )


def decide(state: AgentState) -> AgentDecision:
    llm = _get_llm()
    if llm is None:
        decision = rule_based_decision(state)
    else:
        try:
            from langchain_core.prompts import ChatPromptTemplate

            prompt = ChatPromptTemplate.from_messages(
                [("system", SYSTEM_PROMPT), ("human", "Status saat ini:\n{state}")]
            )
            chain = prompt | llm.with_structured_output(AgentDecision)
            decision = chain.invoke({"name": state.name, "state": state.model_dump_json()})
        except Exception as exc:
            log.warning("LLM gagal (%s) -> fallback rule-based", exc)
            decision = rule_based_decision(state)

    # Eksekusi tugas nyata (ringkas teks / tulis kode) saat agen WORK
    if decision.action == "WORK" and state.pending_tasks:
        task = state.pending_tasks[0]
        decision.completed_task = task
        decision.task_output = tools.run_task(task, llm)
    return decision
