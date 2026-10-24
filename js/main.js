/* ==========================================================
   Linden Bakery: site behaviour
   ========================================================== */

// Edit hours here. 24h "HH:MM"; use null for a closed day.
// Index 0 = Sunday. Taken from the printed menu.
const HOURS = [
  { open: '08:00', close: '15:00' }, // Sun
  null,                               // Mon
  null,                               // Tue
  { open: '07:30', close: '15:00' }, // Wed
  { open: '07:30', close: '15:00' }, // Thu
  { open: '07:30', close: '15:00' }, // Fri
  { open: '08:00', close: '15:00' }, // Sat
];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMEZONE = 'America/New_York';

/* ---------- helpers ---------- */
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const fmt = (hhmm) => {
  let [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return m ? `${h}:${String(m).padStart(2, '0')}${suffix}` : `${h}${suffix}`;
};
// Current day + minutes in the bakery's timezone, regardless of visitor's location
const bakeryNow = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
};

/* ---------- open / closed status ---------- */
function renderStatus() {
  const { day, minutes } = bakeryNow();
  const today = HOURS[day];
  let open = false;
  let text;

  if (today && minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) {
    open = true;
    text = `Open now · until ${fmt(today.close)}`;
  } else if (today && minutes < toMinutes(today.open)) {
    text = `Opens today at ${fmt(today.open)}`;
  } else {
    // find next open day
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (HOURS[d]) {
        text = `Closed · opens ${i === 1 ? 'tomorrow' : DAY_NAMES[d]} ${fmt(HOURS[d].open)}`;
        break;
      }
    }
  }

  document.querySelectorAll('[data-status]').forEach((el) => {
    el.classList.toggle('is-open', open);
    el.classList.toggle('is-closed', !open);
    el.querySelector('[data-status-text]').textContent = text || 'See hours below';
  });

  const list = document.querySelector('[data-hours]');
  if (list) {
    // Start the week on Monday for display
    const order = [1, 2, 3, 4, 5, 6, 0];
    list.innerHTML = order.map((d) => {
      const h = HOURS[d];
      const time = h ? `${fmt(h.open)} – ${fmt(h.close)}` : 'Closed';
      return `<li class="${d === day ? 'is-today' : ''}"><span>${DAY_NAMES[d]}${d === day ? ' · today' : ''}</span><span>${time}</span></li>`;
    }).join('');
  }
}
renderStatus();
setInterval(renderStatus, 60_000);

/* ---------- nav ---------- */
const nav = document.getElementById('nav');
const toggle = document.getElementById('navToggle');

const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const setMenu = (open) => {
  nav.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.style.overflow = open ? 'hidden' : '';
};
toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
document.querySelectorAll('#navLinks a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

/* ---------- footer year ---------- */
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
