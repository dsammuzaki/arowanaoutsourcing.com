using System;
using System.Collections.Generic;
using UnityEngine;

namespace AIOffice.Agent
{
    /// <summary>Data status agen: energy, mood, daftar tugas, dan hasil tugas.</summary>
    public class AgentNeeds : MonoBehaviour
    {
        public string agentName = "Zayn";
        [Range(0, 100)] public int energy = 80;
        public string mood = "Focused";
        public string currentTask = "idle";
        public string location = "Office";
        public List<string> pendingTasks = new List<string> { "Coding API" };
        public List<string> completedOutputs = new List<string>();

        public event Action Changed;

        public void AddEnergy(int delta)
        {
            energy = Mathf.Clamp(energy + delta, 0, 100);
            NotifyChanged();
        }

        public void CompleteTask(string task, string output)
        {
            if (string.IsNullOrEmpty(task)) return;
            pendingTasks.Remove(task);
            if (!string.IsNullOrEmpty(output)) completedOutputs.Add($"[{task}] {output}");
            NotifyChanged();
        }

        public void NotifyChanged() => Changed?.Invoke();
    }
}
