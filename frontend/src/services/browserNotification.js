
export function browserNotificationsSupported() {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

export async function requestNotificationPermission() {
  if (!browserNotificationsSupported()) {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  return Notification.requestPermission();
}

export async function showBrowserNotification({
  title,
  body
}) {
  if (!browserNotificationsSupported()) {
    throw new Error(
      "Browser notifications are not supported"
    );
  }

  if (Notification.permission !== "granted") {
    throw new Error(
      "Notification permission has not been granted"
    );
  }

  const registration = await navigator.serviceWorker.ready;

  await registration.showNotification(title, {
    body,
    icon: "/favicon.svg",
    tag: "medictrack-test",
    data: {
      url: "/"
    }
  });
}
    