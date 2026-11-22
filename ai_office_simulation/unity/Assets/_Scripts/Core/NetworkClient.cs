using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace AIOffice.Core
{
    /// <summary>Pembungkus HTTP POST JSON ke server Python.</summary>
    public static class NetworkClient
    {
        public static IEnumerator Post<TResponse>(string url, object payload,
            Action<TResponse> onSuccess, Action<string> onError = null)
        {
            string json = JsonUtility.ToJson(payload);
            using (var req = new UnityWebRequest(url, "POST"))
            {
                req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");
                req.timeout = 60; // panggilan LLM bisa lambat

                yield return req.SendWebRequest();

                if (req.result != UnityWebRequest.Result.Success)
                {
                    onError?.Invoke(req.error);
                    yield break;
                }

                TResponse parsed;
                try { parsed = JsonUtility.FromJson<TResponse>(req.downloadHandler.text); }
                catch (Exception e) { onError?.Invoke("JSON tidak valid: " + e.Message); yield break; }
                onSuccess?.Invoke(parsed);
            }
        }
    }
}
