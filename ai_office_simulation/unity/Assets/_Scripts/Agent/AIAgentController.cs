using System;
using System.Collections;
using AIOffice.Core;
using UnityEngine;
using UnityEngine.AI;

namespace AIOffice.Agent
{
    // Field harus cocok dengan JSON Python (snake_case) agar JsonUtility bisa memetakan.
    [Serializable]
    public class AgentStatePayload
    {
        public string name;
        public int energy;
        public string current_location;
        public string current_task;
        public string mood;
        public string[] pending_tasks;
        public string sim_time;
    }

    [Serializable]
    public class AgentCommand
    {
        public string action;
        public string target_object;
        public string animation;
        public string mood;
        public string thought;
        public int duration;
        public string task_output;
        public string completed_task;
    }

    [RequireComponent(typeof(NavMeshAgent), typeof(AgentNeeds))]
    public class AIAgentController : MonoBehaviour
    {
        public Animator animator;
        public float arriveDistance = 0.4f;
        [Tooltip("Jeda minimum antar keputusan (detik)")] public float retryDelay = 5f;

        public string Thought { get; private set; } = "";
        public event Action<string> ThoughtChanged;

        private NavMeshAgent nav;
        private AgentNeeds needs;
        private static readonly string[] AnimStates = { "Idle", "Walking", "Sitting_Idle", "Typing", "Drinking", "Thinking" };

        void Awake()
        {
            nav = GetComponent<NavMeshAgent>();
            needs = GetComponent<AgentNeeds>();
        }

        void Start() => StartCoroutine(DecisionLoop());

        IEnumerator DecisionLoop()
        {
            var sim = SimulationManager.Instance;
            while (true)
            {
                AgentCommand cmd = null;
                bool failed = false;
                var payload = new AgentStatePayload
                {
                    name = needs.agentName,
                    energy = needs.energy,
                    current_location = needs.location,
                    current_task = needs.currentTask,
                    mood = needs.mood,
                    pending_tasks = needs.pendingTasks.ToArray(),
                    sim_time = sim.SimTime,
                };

                yield return NetworkClient.Post<AgentCommand>(sim.serverUrl, payload,
                    c => cmd = c,
                    err => { Debug.LogWarning("Server AI: " + err); failed = true; });

                if (failed || cmd == null) { yield return new WaitForSeconds(retryDelay); continue; }
                yield return Execute(cmd);
            }
        }

        IEnumerator Execute(AgentCommand cmd)
        {
            needs.mood = cmd.mood;
            needs.currentTask = cmd.action;
            SetThought(cmd.thought);
            needs.NotifyChanged();

            // 1. Jalan ke objek tujuan
            if (SimulationManager.Instance.TryGetPoint(cmd.target_object, out Transform target))
            {
                Play("Walking");
                nav.SetDestination(target.position);
                yield return new WaitUntil(() => !nav.pathPending && nav.remainingDistance <= arriveDistance);
                needs.location = cmd.target_object;
                // Hadapkan agen searah titik tujuan (mis. menghadap meja)
                transform.rotation = target.rotation;
            }
            else Debug.LogWarning($"Objek '{cmd.target_object}' belum terdaftar di SimulationManager.");

            // 2. Lakukan aktivitas selama durasi
            Play(cmd.animation);
            float seconds = Mathf.Max(1, cmd.duration);
            yield return new WaitForSeconds(seconds);

            // 3. Dampak ke energy & tugas
            switch (cmd.action)
            {
                case "RECHARGE": needs.AddEnergy(+30); break;
                case "WORK": needs.AddEnergy(-10); needs.CompleteTask(cmd.completed_task, cmd.task_output); break;
                case "THINK": needs.AddEnergy(-3); break;
                default: needs.AddEnergy(+5); break;
            }
        }

        void Play(string state)
        {
            if (animator && Array.IndexOf(AnimStates, state) >= 0) animator.CrossFade(state, 0.2f);
        }

        void SetThought(string t)
        {
            Thought = t;
            ThoughtChanged?.Invoke(t);
        }
    }
}
