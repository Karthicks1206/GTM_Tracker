// Pure functions that turn stored data into what the page shows.
import { TARGETS, FUNNEL, CONTACT_STATUSES, CHECKPOINT_DATE, TIME_ZONE, BASELINE_DATE } from './config.js';

export function todayIso(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function mondayOf(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  const day = d.getUTCDay(); // 0 Sun .. 6 Sat
  d.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function reachSummary(contacts, now = new Date()) {
  const reached = contacts.filter((c) => c.status && c.status !== 'Not contacted');
  const monday = mondayOf(todayIso(now));
  const thisWeek = reached.filter((c) => c.dateContacted && c.dateContacted >= monday).length;
  const companies = new Set(reached.map((c) => c.company.trim().toLowerCase()).filter(Boolean)).size;
  return { total: reached.length, thisWeek, companies, weekStart: monday };
}

export function funnel(contacts) {
  const steps = FUNNEL.map((s) => ({ label: s.label, count: contacts.filter((c) => s.statuses.includes(c.status)).length }));
  const top = steps[0].count || 0;
  return steps.map((s, i) => ({
    ...s,
    shareOfTop: top ? s.count / top : 0,
    fromPrev: i === 0 ? null : steps[i - 1].count ? s.count / steps[i - 1].count : null,
  }));
}

export function statusCounts(contacts) {
  return CONTACT_STATUSES.map((status) => ({ status, count: contacts.filter((c) => c.status === status).length }));
}

// Weekly rows hold NEW numbers; totals = fixed baseline + everything added since.
export function metricCards(metrics, now = new Date()) {
  const rows = [...metrics].sort((a, b) => (a.week < b.week ? -1 : 1));
  const today = todayIso(now);
  const weeksLeft = Math.max((Date.parse(CHECKPOINT_DATE) - Date.parse(today)) / (7 * 864e5), 1);
  return TARGETS.map((t) => {
    const entries = rows.filter((r) => r[t.key] !== null && r[t.key] !== undefined);
    let running = t.baseline;
    const series = [{ week: BASELINE_DATE, value: t.baseline }];
    for (const r of entries) {
      running += r[t.key];
      series.push({ week: r.week, value: running });
    }
    const latest = running;
    const gained = latest - t.baseline;
    const last = entries[entries.length - 1];
    const neededFromStart = Math.max(t.target - t.baseline, 0);
    const gap = Math.max(t.target - latest, 0);
    return {
      ...t,
      series,
      latest,
      gained,
      lastWeek: last ? { week: last.week, value: last[t.key] } : null,
      pct: latest / t.target,
      progressFromStart: neededFromStart ? gained / neededFromStart : 1,
      neededFromStart,
      gap,
      perWeek: gap / weeksLeft,
    };
  });
}

export function activityRows(activities) {
  return activities.map((a) => ({
    ...a,
    conversion: a.reached && a.converted !== null && a.converted !== undefined ? a.converted / a.reached : null,
  }));
}
