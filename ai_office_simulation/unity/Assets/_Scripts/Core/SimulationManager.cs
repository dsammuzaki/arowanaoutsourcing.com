using System;
using System.Collections.Generic;
using UnityEngine;

namespace AIOffice.Core
{
    [Serializable]
    public class OfficeObject
    {
        public string id;          // harus cocok dengan target_object dari Python, mis. "Desk_A4"
        public Transform point;    // titik berdiri/duduk agen
    }

    /// <summary>Registry objek kantor, jam simulasi, dan alamat server.</summary>
    public class SimulationManager : MonoBehaviour
    {
        public static SimulationManager Instance { get; private set; }

        public string serverUrl = "http://127.0.0.1:8000/decide";
        [Tooltip("Menit simulasi per detik nyata")] public float simMinutesPerSecond = 1f;
        public int startHour = 9;
        public List<OfficeObject> officeObjects = new List<OfficeObject>();

        private readonly Dictionary<string, Transform> lookup = new Dictionary<string, Transform>();
        private float simMinutes;

        public string SimTime => $"{(int)(simMinutes / 60) % 24:00}:{(int)simMinutes % 60:00}";

        void Awake()
        {
            Instance = this;
            simMinutes = startHour * 60;
            foreach (var o in officeObjects) if (o.point) lookup[o.id] = o.point;
        }

        void Update() => simMinutes += Time.deltaTime * simMinutesPerSecond;

        public bool TryGetPoint(string id, out Transform t) => lookup.TryGetValue(id, out t);
    }
}
