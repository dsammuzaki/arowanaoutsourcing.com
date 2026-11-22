using AIOffice.Agent;
using AIOffice.Core;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace AIOffice.UI
{
    /// <summary>Panel "Agent Status" di sisi kanan; update real-time dari AgentNeeds.</summary>
    public class AgentStatusPanel : MonoBehaviour
    {
        public AgentNeeds needs;
        public AIAgentController controller;

        [Header("UI")]
        public TMP_Text nameText;
        public TMP_Text statusText;
        public TMP_Text taskText;
        public TMP_Text moodText;
        public TMP_Text energyText;
        public TMP_Text locationText;
        public TMP_Text simTimeText;
        public TMP_Text thoughtText;
        public Slider energyBar;
        public Image plumbob;   // indikator mood di panel (opsional)

        void OnEnable()
        {
            if (needs) needs.Changed += Refresh;
            if (controller) controller.ThoughtChanged += OnThought;
            Refresh();
        }

        void OnDisable()
        {
            if (needs) needs.Changed -= Refresh;
            if (controller) controller.ThoughtChanged -= OnThought;
        }

        void Update()
        {
            // jam simulasi jalan terus, tidak menunggu event
            if (simTimeText && SimulationManager.Instance) simTimeText.text = SimulationManager.Instance.SimTime;
        }

        void OnThought(string t) { if (thoughtText) thoughtText.text = t; }

        void Refresh()
        {
            if (!needs) return;
            Set(nameText, needs.agentName.ToUpper());
            Set(statusText, needs.currentTask);
            Set(taskText, needs.pendingTasks.Count > 0 ? needs.pendingTasks[0] : "-");
            Set(moodText, needs.mood);
            Set(energyText, needs.energy + "%");
            Set(locationText, needs.location);
            if (energyBar) energyBar.value = needs.energy / 100f;
            if (plumbob) plumbob.color = MoodColor(needs.mood, needs.energy);
        }

        static void Set(TMP_Text t, string v) { if (t) t.text = v; }

        public static Color MoodColor(string mood, int energy)
        {
            if (mood == "Stressed") return Color.red;
            if (mood == "Tired" || energy < 25) return Color.yellow;
            return new Color(0.2f, 0.9f, 0.3f); // hijau = fokus/normal
        }
    }
}
