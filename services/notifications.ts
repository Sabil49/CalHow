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
 * Fixed identifier for the one-off "trial ends tomorrow" notification, so
 * it's managed separately from the repeating meal/weight reminders (see
 * syncTrialEndReminder below).
 */
const TRIAL_REMINDER_ID = 'calhow-trial-ending';
/** How long before the trial ends (= the first charge) the reminder fires. */
export const TRIAL_REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;

let syncChain: Promise<void> = Promise.resolve();

/**
 * Serializes every schedule/cancel call in this module — without this, two
 * overlapping calls (e.g. the Reminders screen's Save firing at the same
 * moment app-start's ReminderSync effect re-runs because a Firestore
 * listener delivered a new object reference for the same data) could both
 * cancel-then-reschedule concurrently and leave duplicate notifications
 * behind. Queuing them means each call's cancel is guaranteed to see the
 * previous call's schedule already settled. A failed call doesn't break
 * the queue for the ones after it.
 */
function enqueue(task: () => Promise<void>): Promise<void> {
  const run = syncChain.catch(() => {}).then(task);
  syncChain = run;
  return run;
}

/**
 * Replaces all of CalHow's scheduled meal/weight reminders with ones
 * matching `reminders`. Cancels every scheduled notification except the
 * trial-ending one (which has its own lifecycle, driven by the
 * subscription rather than by these preferences), so it's simple and
 * safe without diffing individual ids.
 *
 * No-ops (schedules nothing, but still clears old ones) if permission
 * isn't currently granted — callers that want reminders to actually fire
 * should request permission first (see the Reminders screen).
 */
export function syncScheduledReminders(reminders: ReminderPreferences | undefined): Promise<void> {
  return enqueue(() => doSyncScheduledReminders(reminders));
}

async function cancelRecurringReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.identifier !== TRIAL_REMINDER_ID)
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

async function doSyncScheduledReminders(reminders: ReminderPreferences | undefined): Promise<void> {
  await cancelRecurringReminders();
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

/** The trial reminder is opt-in — `undefined` (never set) counts as off. */
export function isTrialReminderEnabled(reminders: ReminderPreferences | undefined): boolean {
  return reminders?.trialEndReminderEnabled ?? false;
}

/**
 * Schedules (or clears) the one-off "your free trial ends tomorrow"
 * notification, TRIAL_REMINDER_LEAD_MS before `trialEndsAt` — the moment
 * the store charges for the first period. Pass `trialEndsAt: null` (not in
 * a trial, or already cancelled — see getTrialEndDate in
 * services/purchases.ts) or `enabled: false` to just clear it.
 *
 * Like the other reminders this never prompts for permission itself and
 * silently schedules nothing without it. If the trial ends sooner than the
 * lead time, there's no "day before" left and nothing is scheduled.
 */
export function syncTrialEndReminder({ enabled, trialEndsAt }: { enabled: boolean; trialEndsAt: Date | null }): Promise<void> {
  return enqueue(async () => {
    await Notifications.cancelScheduledNotificationAsync(TRIAL_REMINDER_ID);
    if (!enabled || !trialEndsAt) return;

    const fireAt = trialEndsAt.getTime() - TRIAL_REMINDER_LEAD_MS;
    if (fireAt <= Date.now()) return;
    if (!(await getNotificationPermissionGranted())) return;

    await ensureAndroidChannel();
    const endsLabel = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(trialEndsAt);
    const store = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

    await Notifications.scheduleNotificationAsync({
      identifier: TRIAL_REMINDER_ID,
      content: {
        title: 'Your CalHow Pro trial ends tomorrow',
        body: `Your free trial ends ${endsLabel}, when your subscription starts. To avoid being charged, cancel before then in your ${store} subscriptions.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
  });
}
