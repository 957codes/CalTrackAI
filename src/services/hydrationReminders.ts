import * as Notifications from "expo-notifications";
import { getWaterSettings, getDailyWaterLog } from "../utils/waterStorage";
import { WaterSettings } from "../types";

const REMINDER_CHANNEL_ID = "hydration-reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleHydrationReminders(): Promise<void> {
  const settings = await getWaterSettings();
  if (!settings.remindersEnabled) {
    await cancelHydrationReminders();
    return;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  // Cancel existing reminders before rescheduling
  await cancelHydrationReminders();

  const { reminderStartHour, reminderEndHour, reminderIntervalHours } =
    settings;

  // Schedule repeating reminders for each time slot during waking hours
  for (
    let hour = reminderStartHour;
    hour < reminderEndHour;
    hour += reminderIntervalHours
  ) {
    const waterLog = await getDailyWaterLog();
    const glasses = Math.floor(waterLog.totalOz / 8);
    const goalGlasses = Math.ceil(settings.dailyGoalOz / 8);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to hydrate! 💧",
        body:
          glasses > 0
            ? `${glasses}/${goalGlasses} glasses today — keep going!`
            : "Start your water intake for the day!",
        data: { type: "hydration_reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
      identifier: `hydration-${hour}`,
    });
  }
}

export async function cancelHydrationReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.identifier.startsWith("hydration-")) {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier
      );
    }
  }
}
