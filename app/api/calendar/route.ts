import { NextResponse } from "next/server";
import ICAL from "ical.js";

const CALENDAR_URLS = [
  "https://p127-caldav.icloud.com/published/2/MTIwNTc3OTQxMDQxMjA1N8Q6bCpNdmG7Y5GZjUZqJYk16B62yhkZPX7Fc0JlmRB2",
];

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
}

export async function GET() {
  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const events: CalendarEvent[] = [];

    for (const url of CALENDAR_URLS) {
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (!res.ok) continue;
      const text = await res.text();

      const jcal = ICAL.parse(text);
      const comp = new ICAL.Component(jcal);
      const vevents = comp.getAllSubcomponents("vevent");

      for (const vevent of vevents) {
        const ev = new ICAL.Event(vevent);
        const startDt = ev.startDate;
        const endDt = ev.endDate;

        if (!startDt) continue;

        const start = startDt.toJSDate();
        const end = endDt ? endDt.toJSDate() : start;

        if (start >= now && start <= cutoff) {
          events.push({
            id: ev.uid || Math.random().toString(36),
            title: ev.summary || "Untitled",
            start: start.toISOString(),
            end: end.toISOString(),
            allDay: startDt.isDate,
          });
        }
      }
    }

    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return NextResponse.json({ events: events.slice(0, 20) });
  } catch (err) {
    console.error("Calendar fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 500 });
  }
}
