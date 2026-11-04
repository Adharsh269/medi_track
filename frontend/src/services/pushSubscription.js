
import { supabase } from "../lib/supabaseClient";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4
  );

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const raw = atob(base64);

  return Uint8Array.from(raw, (char) =>
    char.charCodeAt(0)
  );
}

export async function subscribeToPush() {
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    throw new Error(
      "Push notifications are not supported"
    );
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Notification permission denied");
  }

  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error("Missing VAPID public key");
  }

  const registration = await navigator.serviceWorker.ready;

  let subscription =
    await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(publicKey)
      });
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Please log in again");
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/push/subscribe`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(subscription.toJSON())
    }
  );

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(
      result.error || "Push registration failed"
    );
  }

  return response.json();
}
