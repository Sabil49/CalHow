import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { ReminderPreferences } from '@/types/models';

/**
 * Local (on-device) reminder scheduling — no push/remote notifications, no
 * server involvement. `expo-notifications` hands these directly to the OS,
 * so once scheduled they persist and fire even if the app is closed;
 * nothing needs to keep running for them to go off.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const ANDROID_CHANNEL_ID = 'reminders';

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

/** Reads current permission status WITHOUT prompting the OS dialog. */
export async function getNotificationPermissionGranted(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  return settings.granted;
}

/** Prompts the OS permission dialog (iOS only asks once per install — repeat calls just report the existing decision). */
export async function requestNotificationPermission(): Promise<boolean> {
  await ensureAndroidChannel();
  const settings = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return settings.granted;
}

const MEAL_KEYS = ['breakfastTime', 'lunchTime', 'dinnerTime'] as const;
const MEAL_LABELS: Record<(typeof MEAL_KEYS)[number], string> = {
  breakfastTime: 'Breakfast',
  lunchTime: 'Lunch',
  dinnerTime: 'Dinner',
};

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
}

/**
 * Replaces ALL of CalHow's scheduled reminder notifications with ones
 * matching `reminders`. This app only ever schedules reminder
 * notifications, so cancelling everything first (rather than diffing
 * individual ids) is simple and safe.
 *
 * No-ops (schedules nothing, but still clears old ones) if permission
 * isn't currently granted — callers that want reminders to actually fire
 * should request permission first (see the Reminders screen).
 */
let syncChain: Promise<void> = Promise.resolve();

/**
 * Serializes calls against `doSyncScheduledReminders` — without this, two
 * overlapping calls (e.g. the Reminders screen's Save firing at the same
 * moment app-start's ReminderSync effect re-runs because a Firestore
 * listener delivered a new object reference for the same data) could both
 * cancel-then-reschedule concurrently and leave duplicate notifications
 * behind. Queuing them means each call's cancel is guaranteed to see the
 * previous call's schedule already settled.
 */
export function syncScheduledReminders(reminders: ReminderPreferences | undefined): Promise<void> {
  syncChain = syncChain.then(() => doSyncScheduledReminders(reminders));
  return syncChain;
}

async function doSyncScheduledReminders(reminders: ReminderPreferences | undefined): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!reminders) return;
  if (!(await getNotificationPermissionGranted())) return;

  await ensureAndroidChannel();

  if (reminders.mealRemindersEnabled) {
    for (const key of MEAL_KEYS) {
      const time = reminders[key];
      if (!time) continue;
      const { hour, minute } = parseTime(time);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${MEAL_LABELS[key]} time`,
          body: `Don't forget to log your ${MEAL_LABELS[key].toLowerCase()} in CalHow.`,
        },
        // DAILY (not CALENDAR, which is iOS-only) — cross-platform, implicitly repeating.
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: ANDROID_CHANNEL_ID,
        },
      });
    }
  }

  if (reminders.weightReminderEnabled && reminders.weightReminderTime && reminders.weightReminderDay != null) {
    const { hour, minute } = parseTime(reminders.weightReminderTime);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weigh-in day',
        body: "It's time to log your weight in CalHow.",
      },
      // WEEKLY (not CALENDAR, which is iOS-only) — cross-platform, implicitly repeating.
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        // expo-notifications numbers weekdays 1 (Sunday) - 7 (Saturday);
        // our model stores 0 (Sunday) - 6 (Saturday), so shift by one.
        weekday: reminders.weightReminderDay + 1,
        hour,
        minute,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
  }
}
