import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

function msUntilNextMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

/**
 * Today's local calendar day as a key that changes at midnight — and when
 * the app returns to the foreground on a new day (timers don't run while
 * it's suspended). Screens that show "today" key their data off this, so
 * an app left open overnight doesn't keep showing yesterday.
 */
export function useLocalDay(): string {
  const [day, setDay] = useState(todayKey);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      // +1s so the timer never fires a hair before midnight.
      timer = setTimeout(() => {
        setDay(todayKey());
        schedule();
      }, msUntilNextMidnight() + 1000);
    };
    schedule();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setDay(todayKey());
        schedule();
      }
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return day;
}
