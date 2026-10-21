import { getData } from '../lib/store.js';
import { reachSummary, funnel, metricCards, activityRows } from '../lib/compute.js';
import { CHECKPOINT_LABEL, TARGETS } from '../lib/config.js';
import Uploader from '../components/Uploader.js';
import ContactsTable from '../components/ContactsTable.js';
import SignOut from '../components/SignOut.js';
import { RowDelete, ClearData } from '../components/DeleteControls.js';

export const dynamic = 'force-dynamic';

const int = new Intl.NumberFormat('en-US');
const pct = (x, d = 0) => `${(x * 100).toFixed(d)}%`;
const oneDec = (x) => (Math.round(x * 10) / 10).toLocaleString('en-US', { maximumFractionDigits: 1 });
const fmtDay = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const fmtStamp = (iso) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' });
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z]+/g, '-');

function Sparkline({ series }) {
  if (!series.length) return <div className="spark" />;
  const w = 160, h = 36, p = 4;
  const vals = series.map((s) => s.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const x = (i) => (series.length === 1 ? w / 2 : p + (i * (w - 2 * p)) / (series.length - 1));
  const y = (v) => (max === min ? h / 2 : h - p - ((v - min) * (h - 2 * p)) / (max - min));
  const d = series.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(s.value).toFixed(1)}`).join(' ');
  const last = series.length - 1;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-label={`Trend over ${series.length} week(s)`}>
      {series.length > 1 && <path d={d} className="spark-line" vectorEffect="non-scaling-stroke" />}
      <circle cx={x(last)} cy={y(series[last].value)} r="3" className="spark-dot" />
    </svg>
  );
}

function MetricCard({ m }) {
  return (
    <div className="card metric">
      <div className="label">{m.label}</div>
      <div className="muted small">{m.definition}</div>
      <div className="big">
        <span className="num">{m.latest === null ? '—' : int.format(m.latest)}</span>
        <span className="muted small">of {int.format(m.target)} by {CHECKPOINT_LABEL}</span>
      </div>
      <div className="bar"><div style={{ width: `${Math.min((m.pct ?? 0) * 100, 100)}%` }} /></div>
      {m.latest !== null ? (
        <div className="muted small meta">
          <div>
            {pct(m.pct)} of target ·{' '}
            {m.change === null ? 'first week tracked' : `${m.change > 0 ? '+' : ''}${int.format(m.change)} vs last week`}
          </div>
          <div>{m.gap === 0 ? `${CHECKPOINT_LABEL} target reached` : `Need ${int.format(m.gap)} more · ~${oneDec(m.perWeek)} a week`}</div>
          <div>Spring: {int.format(m.spring)} by {m.springBy}</div>
        </div>
      ) : (
        <div className="muted small">Add a row on the Weekly metrics sheet.</div>
      )}
      <Sparkline series={m.series} />
    </div>
  );
}

export default async function Home() {
  const data = await getData();
  const reach = reachSummary(data.contacts);
  const steps = funnel(data.contacts);
  const cards = metricCards(data.metrics);
  const acts = activityRows(data.activities);
  const weeks = [...data.metrics].sort((a, b) => (a.week < b.week ? 1 : -1));
  const tracked = cards.filter((c) => c.latest !== null);
  const worst = [...tracked].sort((a, b) => a.pct - b.pct)[0];
  const biggestDrop = steps
    .slice(1)
    .filter((s) => s.fromPrev !== null)
    .sort((a, b) => a.fromPrev - b.fromPrev)[0];

  return (
    <main className="page">
      <header className="head">
        <div>
          <h1 className="title">Talon GTM scorecard</h1>
          <p className="muted">
            {data.uploadedAt ? `Last updated ${fmtStamp(data.uploadedAt)} from ${data.fileName}` : 'No data yet. Download the template, fill it in and upload it.'}
          </p>
          {worst && (
            <p className="takeaway">
              Week of {fmtDay(worst.latestWeek)}. Furthest from target: {worst.label.toLowerCase()}, {int.format(worst.latest)} of{' '}
              {int.format(worst.target)}. About {oneDec(worst.perWeek)} a week needed to hit {CHECKPOINT_LABEL}.
            </p>
          )}
        </div>
        <div className="head-actions">
          <a className="button" href="/Talon_GTM_Tracker_Template.xlsx" download>Download template</a>
          <SignOut />
        </div>
      </header>

      {data.storageMissing && (
        <p className="card error">Storage isn&apos;t connected. Add the Upstash Redis integration to this project in Vercel, then redeploy.</p>
      )}

      <div className="upload-row">
        <Uploader />
        <ClearData />
      </div>

      <section>
        <h2 className="h2">Outreach</h2>
        <div className="grid">
          <div className="card metric reach">
            <div className="label">People reached out</div>
            <div className="muted small">Contacts with any status past &ldquo;Not contacted&rdquo;</div>
            <div className="big"><span className="num">{int.format(reach.total)}</span><span className="muted small">all time</span></div>
            <div className="muted small meta">
              <div><strong>{int.format(reach.thisWeek)}</strong> this week (since {fmtDay(reach.weekStart)})</div>
              <div>{int.format(reach.companies)} companies</div>
            </div>
          </div>
          <div className="card funnel">
            <div className="label">Outreach funnel</div>
            <div className="muted small">
              {biggestDrop ? `Biggest drop-off: into ${biggestDrop.label.toLowerCase()} (${pct(biggestDrop.fromPrev)} carry over)` : 'Each stage counts contacts that reached it.'}
            </div>
            <div className="funnel-rows">
              {steps.map((s) => (
                <div className="funnel-row" key={s.label}>
                  <span className="funnel-label">{s.label}</span>
                  <div className="funnel-track">
                    <div className={`funnel-fill${biggestDrop?.label === s.label ? ' drop' : ''}`} style={{ width: `${s.shareOfTop * 100}%` }} />
                  </div>
                  <span className="funnel-num">
                    {int.format(s.count)}
                    {s.fromPrev !== null && <span className="muted"> · {pct(s.fromPrev)}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="h2">North-star metrics · {CHECKPOINT_LABEL} checkpoint</h2>
        <div className="grid">
          {cards.map((m) => <MetricCard key={m.key} m={m} />)}
        </div>
        {weeks.length > 0 && (
          <details className="card weeks">
            <summary className="label">Weekly entries ({weeks.length})</summary>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Week</th>
                    {TARGETS.map((t) => <th key={t.key} className="num-col">{t.label}</th>)}
                    <th aria-label="Delete" />
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((w, i) => (
                    <tr key={w.id ?? `${w.week}-${i}`}>
                      <td>{fmtDay(w.week)}</td>
                      {TARGETS.map((t) => <td key={t.key} className="num-col">{w[t.key] === null ? '—' : int.format(w[t.key])}</td>)}
                      <td><RowDelete part="metrics" id={w.id} label={`week of ${fmtDay(w.week)}`} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </section>

      <section>
        <h2 className="h2">Contacts</h2>
        <ContactsTable contacts={data.contacts} />
      </section>

      <section>
        <h2 className="h2">What we tried</h2>
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Activity</th><th>When</th><th className="hide-narrow">Side</th>
                  <th className="num-col">Reached</th><th className="num-col">Converted</th><th className="num-col">Conversion</th>
                  <th className="hide-narrow">Result</th><th>Status</th><th aria-label="Delete" />
                </tr>
              </thead>
              <tbody>
                {acts.map((a, i) => (
                  <tr key={a.id ?? `${a.activity}-${i}`}>
                    <td>{a.activity}</td>
                    <td>{a.when || '—'}</td>
                    <td className="hide-narrow">{a.side || '—'}</td>
                    <td className="num-col">{a.reached === null ? '—' : int.format(a.reached)}</td>
                    <td className="num-col">{a.converted === null ? '—' : int.format(a.converted)}</td>
                    <td className="num-col">{a.conversion === null ? '—' : pct(a.conversion, 1)}</td>
                    <td className="hide-narrow">{a.result || '—'}</td>
                    <td>{a.status ? <span className={`chip a-${slug(a.status)}`}>{a.status}</span> : '—'}</td>
                    <td><RowDelete part="activities" id={a.id} label={a.activity} /></td>
                  </tr>
                ))}
                {!acts.length && <tr><td colSpan={9} className="muted">No activities yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
