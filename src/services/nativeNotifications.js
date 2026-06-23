/**
 * nativeNotifications — one small wrapper around Capacitor's
 * @capacitor/local-notifications so the rest of the app can fire real
 * phone-tray notifications without caring about the platform.
 *
 * On a device (Android via Capacitor) it uses LocalNotifications, which show
 * in the system tray even when the app is backgrounded. In a plain browser it
 * falls back to the Web Notification API so the same code still works during
 * `npm start` development.
 *
 * Why local (not push): our backend doesn't send FCM. Instead the app polls
 * the existing /Notification feed and *itself* raises a local notification for
 * anything new — see NativeNotificationManager. Overdue / due-today are also
 * computed on-device, so local notifications cover all three triggers without
 * any backend or Firebase work.
 */
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const isNative = Capacitor.isNativePlatform();
const ANDROID_CHANNEL_ID = "crm-leads";

let permissionGranted = false;
let initialised = false;

// LocalNotification ids must fit in a 32-bit signed int. Hash any string key
// (e.g. a notification's `number`) into that range so re-firing the same item
// reuses one tray slot instead of stacking duplicates.
const toNotificationId = (key) => {
  const s = String(key);
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2147483647 || 1;
};

/**
 * Ask for notification permission and prepare the Android channel.
 * Safe to call multiple times — the work only happens once. Returns true if
 * notifications can be shown.
 */
export const ensureNotificationPermission = async () => {
  if (initialised) return permissionGranted;
  initialised = true;

  try {
    if (isNative) {
      const status = await LocalNotifications.requestPermissions();
      permissionGranted = status.display === "granted";

      // Android 8+ requires a channel; create one so sound/importance apply.
      if (permissionGranted && Capacitor.getPlatform() === "android") {
        await LocalNotifications.createChannel({
          id: ANDROID_CHANNEL_ID,
          name: "Lead alerts",
          description: "New leads, follow-ups and overdue reminders",
          importance: 5, // IMPORTANCE_HIGH — heads-up + sound
          visibility: 1,
        });
      }
    } else if ("Notification" in window) {
      if (Notification.permission === "default") {
        const res = await Notification.requestPermission();
        permissionGranted = res === "granted";
      } else {
        permissionGranted = Notification.permission === "granted";
      }
    }
  } catch {
    permissionGranted = false;
  }
  return permissionGranted;
};

/**
 * Fire a notification now.
 * @param {{key:string|number, title:string, body:string, extra?:object}} opts
 *   `key` dedupes/replaces an existing notification; `extra` is returned to the
 *   tap listener so it can route (e.g. { leadId }).
 */
export const showNativeNotification = async ({ key, title, body, extra = {} }) => {
  if (!permissionGranted) {
    const ok = await ensureNotificationPermission();
    if (!ok) return;
  }

  if (isNative) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: toNotificationId(key ?? title),
            title,
            body,
            channelId: ANDROID_CHANNEL_ID,
            extra,
          },
        ],
      });
    } catch {
      /* notification failed — non-fatal, in-app surfaces still show it */
    }
    return;
  }

  // Web fallback (browser dev / PWA).
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      const n = new Notification(title, { body, tag: String(key ?? title) });
      n.onclick = () => {
        window.focus();
        window.dispatchEvent(
          new CustomEvent("native-notification-tap", { detail: extra }),
        );
        n.close();
      };
    }
  } catch {
    /* ignore */
  }
};

/**
 * Register a handler for notification taps. Returns an unsubscribe function.
 * The handler receives the `extra` object passed to showNativeNotification.
 */
export const addNotificationTapListener = (handler) => {
  if (isNative) {
    const sub = LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (event) => handler(event?.notification?.extra || {}),
    );
    // addListener returns a promise<PluginListenerHandle>; unwrap on cleanup.
    return () => {
      Promise.resolve(sub).then((h) => h?.remove?.()).catch(() => {});
    };
  }

  const webHandler = (e) => handler(e.detail || {});
  window.addEventListener("native-notification-tap", webHandler);
  return () => window.removeEventListener("native-notification-tap", webHandler);
};

export const notificationsAreNative = isNative;
