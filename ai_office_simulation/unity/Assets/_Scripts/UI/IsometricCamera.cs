using UnityEngine;

namespace AIOffice.UI
{
    /// <summary>
    /// Kamera isometrik: zoom (scroll), pan (klik tengah), rotasi 90° (Q/E).
    /// Pasang pada GameObject "pivot"; kamera orthographic jadi anak pivot.
    /// Memakai Input Manager lama (Project Settings > Player > Active Input Handling: Both/Old).
    /// </summary>
    public class IsometricCamera : MonoBehaviour
    {
        public Camera cam;
        public float pitch = 35.264f;      // sudut isometrik klasik
        public float startYaw = 45f;
        public float panSpeed = 1f;
        public float zoomSpeed = 2f;
        public Vector2 zoomRange = new Vector2(3f, 15f);
        public float rotateSmooth = 8f;
        public Vector2 panLimitX = new Vector2(-20, 20);
        public Vector2 panLimitZ = new Vector2(-20, 20);
        public float cameraDistance = 40f;

        private float targetYaw, yaw;

        void Start()
        {
            if (!cam) cam = GetComponentInChildren<Camera>();
            cam.orthographic = true;
            targetYaw = yaw = startYaw;
            cam.transform.localPosition = new Vector3(0, 0, -cameraDistance);
            cam.transform.localRotation = Quaternion.identity;
            ApplyRotation();
        }

        void Update()
        {
            HandleZoom();
            HandlePan();
            HandleRotate();
        }

        void HandleZoom()
        {
            float scroll = Input.mouseScrollDelta.y;
            if (Mathf.Approximately(scroll, 0)) return;
            cam.orthographicSize = Mathf.Clamp(cam.orthographicSize - scroll * zoomSpeed, zoomRange.x, zoomRange.y);
        }

        void HandlePan()
        {
            if (!Input.GetMouseButton(2)) return;
            // Geser di bidang tanah, searah yaw kamera
            Quaternion flat = Quaternion.Euler(0, yaw, 0);
            Vector3 delta = flat * new Vector3(-Input.GetAxis("Mouse X"), 0, -Input.GetAxis("Mouse Y"));
            // skala dengan ukuran zoom agar terasa konsisten
            Vector3 p = transform.position + delta * panSpeed * cam.orthographicSize * 0.2f;
            p.x = Mathf.Clamp(p.x, panLimitX.x, panLimitX.y);
            p.z = Mathf.Clamp(p.z, panLimitZ.x, panLimitZ.y);
            transform.position = p;
        }

        void HandleRotate()
        {
            if (Input.GetKeyDown(KeyCode.E)) targetYaw += 90f;
            if (Input.GetKeyDown(KeyCode.Q)) targetYaw -= 90f;
            yaw = Mathf.LerpAngle(yaw, targetYaw, Time.deltaTime * rotateSmooth);
            ApplyRotation();
        }

        void ApplyRotation() => transform.rotation = Quaternion.Euler(pitch, yaw, 0);
    }
}
