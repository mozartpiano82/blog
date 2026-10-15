#!/usr/bin/env node
// 학원생 성장파일 — 영상을 넣으면 학생별로 정리하고, 학생마다 성장파일 한 장을 만든다.
//
//   node bin/growth.mjs           화면을 열고, 넣는 곳을 계속 지켜본다
//   node bin/growth.mjs 정리      한 번만 정리하고 끝낸다 (화면 없이)
//   node bin/growth.mjs --no-open 화면을 띄우되 브라우저는 열지 않는다
//
// 외부 패키지 없이 Node 22 만으로 돈다. 영상은 이 컴퓨터 밖으로 나가지 않는다.

import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DROP = path.join(ROOT, '_여기에_영상넣기');
const STU = path.join(ROOT, '학생');
const TRASH = path.join(ROOT, '.휴지통');
const UPLOADING = path.join(ROOT, '.올리는중');
const PORT = Number(process.env.PORT) || 4870;
const POLL_MS = 4000;

const VIDEO = new Set(['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm', '.3gp', '.wmv', '.mts']);
const MIME = {
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
  '.mkv': 'video/x-matroska', '.avi': 'video/x-msvideo', '.3gp': 'video/3gpp', '.wmv': 'video/x-ms-wmv',
  '.mts': 'video/mp2t', '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
};

// ───────────────────────────── 이름과 날짜

// 맥 Finder 는 한글 파일 이름을 자모로 풀어서(NFD) 넘긴다. 비교는 항상 NFC 로 한다.
const nfc = (s) => String(s ?? '').normalize('NFC');

function safeName(s) {
  const n = nfc(s).replace(/[\/\\:*?"<>|\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
  if (!n || n.startsWith('.') || n.startsWith('_')) return '';
  return n;
}

const pad = (n) => String(n).padStart(2, '0');
const fmtStamp = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmtFile = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
const today = () => fmtStamp(new Date()).slice(0, 10);

function sane(d) {
  if (!(d instanceof Date) || isNaN(d)) return null;
  if (d.getFullYear() < 2005 || d.getTime() > Date.now() + 86400000) return null;
  return d;
}

// KakaoTalk_20260915_143022.mp4, 20260915_143022.mp4, 2026-09-15 14.30.22.mov, Screen Recording 2026-09-15 …
function dateFromName(name) {
  const m = nfc(name).match(/(?:^|\D)(20\d{2})[-_.]?(0[1-9]|1[0-2])[-_.]?(0[1-9]|[12]\d|3[01])(?:[ _\-T.]?([01]\d|2[0-3])[-_.:]?([0-5]\d))?/);
  if (!m) return null;
  return sane(new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 12), +(m[5] ?? 0)));
}

// MP4·MOV 안의 mvhd 상자에 적힌 촬영 시각. 아이폰 IMG_1234.MOV 처럼 이름에 날짜가 없을 때 쓴다.
function mp4Date(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const size = fs.fstatSync(fd).size;
    const buf = Buffer.alloc(16);
    const find = (start, end, type) => {
      let pos = start;
      while (pos + 8 <= end) {
        buf.fill(0);
        fs.readSync(fd, buf, 0, 16, pos);
        let len = buf.readUInt32BE(0);
        const t = buf.toString('latin1', 4, 8);
        let hdr = 8;
        if (len === 1) { len = Number(buf.readBigUInt64BE(8)); hdr = 16; }
        else if (len === 0) len = end - pos;
        if (len < hdr) return null;
        if (t === type) return { pos, hdr, len };
        pos += len;
      }
      return null;
    };
    const moov = find(0, size, 'moov');
    if (!moov) return null;
    const mvhd = find(moov.pos + moov.hdr, moov.pos + moov.len, 'mvhd');
    if (!mvhd) return null;
    const b = Buffer.alloc(12);
    fs.readSync(fd, b, 0, 12, mvhd.pos + mvhd.hdr);
    const secs = b[0] === 1 ? Number(b.readBigUInt64BE(4)) : b.readUInt32BE(4);
    return sane(new Date((secs - 2082844800) * 1000)); // 1904-01-01 기준
  } catch {
    return null;
  } finally {
    if (fd !== undefined) try { fs.closeSync(fd); } catch {}
  }
}

// "김민지_엘리제를위하여_20260915.mp4" → "엘리제를위하여". 이름·날짜·폰이 붙인 말을 걷어낸다.
function guessTitle(orig, student) {
  let s = nfc(path.parse(orig).name);
  if (student) s = s.split(student).join(' ');
  s = s
    .replace(/20\d{2}[-_.]?\d{2}[-_.]?\d{2}([ _\-T.]?\d{2}[-_.:]?\d{2}([-_.:]?\d{2,})?)?/g, ' ')
    .replace(/[_\-.]+/g, ' ')
    .replace(/(^|\s)(IMG|VID|MOV|MVI|PXL|DSC|DJI|GOPR|KakaoTalk|video|Screen ?Recording|화면 ?기록|녹화|trim|복사본|copy)(?=\s|$|\d)/gi, ' ')
    .replace(/\(\d+\)/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return /[가-힣A-Za-z]{2,}/.test(s) ? s : '';
}

// ───────────────────────────── 학생 기록

const isVideo = (f) => VIDEO.has(path.extname(f).toLowerCase());
const studentDir = (n) => path.join(STU, n);
const studentFile = (n) => path.join(studentDir(n), '학생.json');

function ensureDirs() {
  for (const d of [DROP, STU]) fs.mkdirSync(d, { recursive: true });
}

function loadStudent(name) {
  try {
    const s = JSON.parse(fs.readFileSync(studentFile(name), 'utf8'));
    s.이름 = name;
    s.영상 = Array.isArray(s.영상) ? s.영상 : [];
    return s;
  } catch {
    return null;
  }
}

function writeJson(file, data) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

function saveStudent(s) {
  s.영상.sort((a, b) => a.날짜.localeCompare(b.날짜));
  writeJson(studentFile(s.이름), s);
  writeGrowthPage(s);
  bump();
}

function ensureStudent(name, extra = {}) {
  let s = loadStudent(name);
  if (s) return s;
  fs.mkdirSync(path.join(studentDir(name), '영상'), { recursive: true });
  s = { 이름: name, 학년: '', 시작일: '', 메모: '', 만든날: today(), 영상: [], ...extra };
  saveStudent(s);
  fs.mkdirSync(path.join(DROP, name), { recursive: true });
  return s;
}

function listStudentNames() {
  try {
    return fs.readdirSync(STU, { withFileTypes: true })
      .filter((e) => e.isDirectory() && safeName(e.name))
      .map((e) => nfc(e.name))
      .sort((a, b) => a.localeCompare(b, 'ko'));
  } catch {
    return [];
  }
}

const listStudents = () => listStudentNames().map((n) => loadStudent(n) ?? ensureStudent(n));

async function move(src, dst) {
  await fsp.mkdir(path.dirname(dst), { recursive: true });
  try {
    await fsp.rename(src, dst);
  } catch (e) {
    if (e.code !== 'EXDEV') throw e;
    await fsp.copyFile(src, dst);
    await fsp.unlink(src);
  }
}

function uniquePath(p) {
  if (!fs.existsSync(p)) return p;
  const { dir, name, ext } = path.parse(p);
  for (let i = 2; ; i++) {
    const q = path.join(dir, `${name}_${i}${ext}`);
    if (!fs.existsSync(q)) return q;
  }
}

async function importVideo(name, src, origName) {
  const s = ensureStudent(name);
  const orig = nfc(origName ?? path.basename(src));
  const st = await fsp.stat(src);
  const when = dateFromName(orig) ?? mp4Date(src) ?? sane(st.mtime) ?? new Date();
  const target = uniquePath(path.join(studentDir(name), '영상', fmtFile(when) + path.extname(orig).toLowerCase()));
  await move(src, target);
  s.영상.push({
    id: crypto.randomBytes(5).toString('hex'),
    파일: path.basename(target),
    날짜: fmtStamp(when),
    곡: guessTitle(orig, name),
    메모: '',
    원본이름: orig,
    넣은날: today(),
  });
  saveStudent(s);
  log(`  ✓ ${name} ← ${orig}`);
  return path.basename(target);
}

// 학생 폴더 안 영상과 기록을 맞춘다. 손으로 직접 넣은 영상도 기록에 올라가고, 지운 영상은 빠진다.
function reconcile(s) {
  const dir = path.join(studentDir(s.이름), '영상');
  let files = [];
  try { files = fs.readdirSync(dir).filter((f) => isVideo(f) && !f.startsWith('.')); } catch {}
  const onDisk = new Set(files.map(nfc));
  const known = new Map(s.영상.map((v) => [nfc(v.파일), v]));
  let changed = false;
  for (const v of s.영상) if (!onDisk.has(nfc(v.파일))) changed = true;
  s.영상 = s.영상.filter((v) => onDisk.has(nfc(v.파일)));
  for (const f of files) {
    if (known.has(nfc(f))) continue;
    const full = path.join(dir, f);
    const when = dateFromName(f) ?? mp4Date(full) ?? sane(fs.statSync(full).mtime) ?? new Date();
    s.영상.push({ id: crypto.randomBytes(5).toString('hex'), 파일: f, 날짜: fmtStamp(when), 곡: guessTitle(f, s.이름), 메모: '', 원본이름: f, 넣은날: today() });
    changed = true;
  }
  if (changed) saveStudent(s);
  else if (!fs.existsSync(path.join(studentDir(s.이름), '성장파일.html'))) writeGrowthPage(s);
}

// ───────────────────────────── 넣는 곳 정리

const lastSize = new Map(); // 복사가 끝났는지 보려고, 지난번에 본 크기를 기억한다
let organizing = null;
let lastReport = { unmatched: [], waiting: [] };

function organize(opts) {
  organizing ??= doOrganize(opts).finally(() => { organizing = null; });
  return organizing;
}

async function doOrganize({ waitStable = false } = {}) {
  ensureDirs();
  const names = listStudentNames();
  for (const n of names) {
    fs.mkdirSync(path.join(DROP, n), { recursive: true });
    const s = loadStudent(n) ?? ensureStudent(n);
    reconcile(s);
  }
  const candidates = [];
  const unmatched = [];
  for (const e of fs.readdirSync(DROP, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(DROP, e.name);
    if (e.isDirectory()) {
      const name = safeName(e.name);
      if (!name) continue;
      if (!names.includes(name)) ensureStudent(name); // 넣는 곳에 이름 폴더를 직접 만들어도 학생이 생긴다
      for (const f of fs.readdirSync(full)) {
        if (!f.startsWith('.') && isVideo(f)) candidates.push({ name, src: path.join(full, f) });
      }
    } else if (e.isFile() && isVideo(e.name)) {
      const fname = nfc(e.name);
      const match = names.filter((n) => fname.includes(n)).sort((a, b) => b.length - a.length)[0];
      if (match) candidates.push({ name: match, src: full });
      else unmatched.push({ 파일: fname, 크기: fs.statSync(full).size });
    }
  }
  const moved = [];
  const waiting = [];
  for (const c of candidates) {
    if (waitStable) {
      const size = fs.statSync(c.src).size;
      const prev = lastSize.get(c.src);
      lastSize.set(c.src, size);
      if (size === 0 || prev !== size) { waiting.push(nfc(path.basename(c.src))); continue; }
    }
    try {
      await importVideo(c.name, c.src);
      lastSize.delete(c.src);
      moved.push({ 학생: c.name, 파일: nfc(path.basename(c.src)) });
    } catch (err) {
      log(`  ! ${nfc(path.basename(c.src))} 를 옮기지 못했어요: ${err.message}`);
    }
  }
  const report = { moved, unmatched, waiting };
  if (JSON.stringify([unmatched, waiting]) !== JSON.stringify([lastReport.unmatched, lastReport.waiting])) bump();
  lastReport = report;
  return report;
}

// ───────────────────────────── 성장파일 (학생마다 한 장, 더블클릭으로 열린다)

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const encPath = (f) => f.split('/').map(encodeURIComponent).join('/');

function monthsBetween(a, b) {
  const [ay, am, ad] = a.slice(0, 10).split('-').map(Number);
  const [by, bm, bd] = b.slice(0, 10).split('-').map(Number);
  return Math.max(0, (by - ay) * 12 + (bm - am) - (bd < ad ? 1 : 0));
}

function sinceLabel(start, date) {
  const m = monthsBetween(start, date);
  if (m >= 12) return `${Math.floor(m / 12)}년${m % 12 ? ` ${m % 12}개월` : ''}째`;
  return m === 0 ? '첫 달' : `${m + 1}개월째`;
}

const prettyDate = (d) => {
  const [y, m, dd] = d.slice(0, 10).split('-').map(Number);
  return `${y}년 ${m}월 ${dd}일`;
};

function growthPage(s) {
  const vids = [...s.영상].sort((a, b) => a.날짜.localeCompare(b.날짜));
  const start = s.시작일 || vids[0]?.날짜 || today();
  const first = vids[0];
  const last = vids[vids.length - 1];
  const span = first && last ? monthsBetween(first.날짜, last.날짜) : 0;
  const src = (v) => `영상/${encPath(v.파일)}#t=0.1`;
  const card = (v, label) => `
      <figure class="card">
        <video src="${src(v)}" controls preload="metadata" playsinline></video>
        <figcaption>
          <div class="meta"><span class="date">${esc(prettyDate(v.날짜))}</span><span class="since">${esc(label ?? sinceLabel(start, v.날짜))}</span></div>
          ${v.곡 ? `<div class="title">${esc(v.곡)}</div>` : ''}
          ${v.메모 ? `<p class="note">${esc(v.메모).replace(/\n/g, '<br>')}</p>` : ''}
        </figcaption>
      </figure>`;

  const months = new Map();
  for (const v of vids) {
    const k = v.날짜.slice(0, 7);
    if (!months.has(k)) months.set(k, []);
    months.get(k).push(v);
  }
  const timeline = [...months].map(([k, list]) => {
    const [y, m] = k.split('-').map(Number);
    return `
    <section class="month">
      <h3>${y}년 ${m}월 <small>${list.length}개</small></h3>
      <div class="grid">${list.map((v) => card(v)).join('')}</div>
    </section>`;
  }).join('');

  const compare = vids.length >= 2 ? `
    <section class="compare">
      <h2>처음과 지금</h2>
      <div class="pair">
        <div><div class="tag">처음</div>${card(first)}</div>
        <div><div class="tag now">지금</div>${card(last)}</div>
      </div>
    </section>` : '';

  const facts = [
    s.학년 && `<span>${esc(s.학년)}</span>`,
    s.시작일 && `<span>${esc(prettyDate(s.시작일))} 시작</span>`,
    `<span>영상 ${vids.length}개</span>`,
    vids.length >= 2 && `<span>${span ? `${span}개월` : '한 달'} 동안의 기록</span>`,
  ].filter(Boolean).join('');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(s.이름)} 성장파일</title>
<style>
  :root { --bg:#faf8f4; --surface:#ffffff; --ink:#1f1d1a; --muted:#6f6a62; --line:#e7e2d8; --accent:#8a5a2b; --accent-soft:#f3e9dc; }
  @media (prefers-color-scheme: dark) { :root { --bg:#171513; --surface:#211e1b; --ink:#f1ece4; --muted:#a59d91; --line:#36312b; --accent:#e0a96d; --accent-soft:#3a2e22; } }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.6 -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif; }
  main { max-width:1040px; margin:0 auto; padding:40px 16px 64px; }
  header { border-bottom:1px solid var(--line); padding-bottom:24px; margin-bottom:32px; }
  .eyebrow { color:var(--accent); font-weight:600; font-size:14px; letter-spacing:.04em; }
  h1 { font-size:34px; margin:4px 0 12px; line-height:1.25; }
  .facts { display:flex; flex-wrap:wrap; gap:8px; }
  .facts span { background:var(--accent-soft); color:var(--ink); border-radius:999px; padding:4px 12px; font-size:14px; }
  .about { margin:16px 0 0; color:var(--muted); white-space:pre-wrap; }
  h2 { font-size:22px; margin:0 0 16px; }
  h3 { font-size:18px; margin:0 0 12px; }
  h3 small { color:var(--muted); font-weight:400; font-size:14px; margin-left:6px; }
  .compare { margin-bottom:48px; }
  .pair { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .tag { display:inline-block; font-size:13px; font-weight:700; color:var(--muted); margin-bottom:6px; }
  .tag.now { color:var(--accent); }
  .month { margin-bottom:36px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:16px; }
  .card { margin:0; background:var(--surface); border:1px solid var(--line); border-radius:14px; overflow:hidden; }
  video { display:block; width:100%; aspect-ratio:16/10; object-fit:contain; background:#000; }
  figcaption { padding:12px 14px 14px; }
  .meta { display:flex; justify-content:space-between; gap:8px; font-size:14px; color:var(--muted); }
  .since { color:var(--accent); font-weight:600; }
  .title { font-weight:700; margin-top:4px; }
  .note { margin:6px 0 0; font-size:15px; }
  .empty { color:var(--muted); padding:48px 0; text-align:center; }
  footer { margin-top:48px; color:var(--muted); font-size:13px; text-align:center; }
  @media (max-width:640px) { h1 { font-size:28px; } .pair { grid-template-columns:1fr; } }
  @media print { video { display:none; } .card { break-inside:avoid; } body { background:#fff; } }
</style>
</head>
<body>
<main>
  <header>
    <div class="eyebrow">성장파일</div>
    <h1>${esc(s.이름)}</h1>
    <div class="facts">${facts}</div>
    ${s.메모 ? `<p class="about">${esc(s.메모)}</p>` : ''}
  </header>
  ${vids.length ? compare + `<h2>지나온 길</h2>` + timeline : `<p class="empty">아직 영상이 없어요. 영상을 넣으시면 여기에 차곡차곡 쌓여요.</p>`}
  <footer>${esc(today())}에 만들었어요 · 학원생 성장파일</footer>
</main>
</body>
</html>
`;
}

function writeGrowthPage(s) {
  try {
    fs.writeFileSync(path.join(studentDir(s.이름), '성장파일.html'), growthPage(s));
  } catch (e) {
    log(`  ! ${s.이름} 성장파일을 만들지 못했어요: ${e.message}`);
  }
}

// ───────────────────────────── 화면 서버

let version = 1;
function bump() { version++; }
function log(...a) { console.log(...a); }

function send(res, code, body, type = 'application/json; charset=utf-8') {
  const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(data);
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { return {}; }
}

function inside(base, p) {
  const rel = path.relative(base, p);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function serveFile(req, res, file) {
  let st;
  try { st = fs.statSync(file); } catch { return send(res, 404, { 오류: '없어요' }); }
  if (!st.isFile()) return send(res, 404, { 오류: '없어요' });
  const type = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && (range[1] || range[2])) {
    let start = range[1] ? +range[1] : Math.max(0, st.size - +range[2]);
    let end = range[1] && range[2] ? Math.min(+range[2], st.size - 1) : st.size - 1;
    if (start >= st.size || start > end) {
      res.writeHead(416, { 'content-range': `bytes */${st.size}` });
      return res.end();
    }
    res.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${st.size}`, 'content-length': end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': st.size, 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}

function openPath(target) {
  const [cmd, args] = process.platform === 'darwin' ? ['open', [target]]
    : process.platform === 'win32' ? ['explorer', [target]]
    : ['xdg-open', [target]];
  try { spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref(); } catch {}
}

function openBrowser(url) {
  if (process.platform === 'win32') {
    try { spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref(); } catch {}
  } else openPath(url);
}

function state() {
  return {
    version,
    students: listStudents().map((s) => ({ ...s, 영상: [...s.영상].sort((a, b) => b.날짜.localeCompare(a.날짜)) })),
    unmatched: lastReport.unmatched,
    waiting: lastReport.waiting,
  };
}

async function api(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean).map((p) => nfc(decodeURIComponent(p)));
  const [, what, nameRaw, sub, id] = parts; // ['api', what, …]
  const m = req.method;

  if (what === 'version' && m === 'GET') return send(res, 200, { version });
  if (what === 'state' && m === 'GET') return send(res, 200, state());
  if (what === 'organize' && m === 'POST') { await organize(); return send(res, 200, state()); }

  if (what === 'students' && m === 'POST' && !nameRaw) {
    const b = await readBody(req);
    const name = safeName(b.이름);
    if (!name) return send(res, 400, { 오류: '이름을 적어주세요' });
    if (loadStudent(name)) return send(res, 409, { 오류: '이미 있는 이름이에요' });
    const s = ensureStudent(name, { 학년: String(b.학년 ?? '').slice(0, 30), 시작일: /^\d{4}-\d{2}-\d{2}$/.test(b.시작일) ? b.시작일 : '' });
    await organize(); // 넣는 곳에 이 이름이 들어간 영상이 기다리고 있었을 수 있다
    return send(res, 200, loadStudent(name) ?? s);
  }

  const name = safeName(nameRaw);
  const s = name ? loadStudent(name) : null;

  if (what === 'students' && s && m === 'PATCH' && !sub) {
    const b = await readBody(req);
    if (typeof b.학년 === 'string') s.학년 = b.학년.slice(0, 30);
    if (typeof b.메모 === 'string') s.메모 = b.메모.slice(0, 2000);
    if (typeof b.시작일 === 'string') s.시작일 = /^\d{4}-\d{2}-\d{2}$/.test(b.시작일) ? b.시작일 : '';
    saveStudent(s);
    return send(res, 200, s);
  }

  if (what === 'students' && s && sub === 'videos' && id) {
    const v = s.영상.find((x) => x.id === id);
    if (!v) return send(res, 404, { 오류: '영상을 찾지 못했어요' });
    if (m === 'PATCH') {
      const b = await readBody(req);
      if (typeof b.곡 === 'string') v.곡 = b.곡.slice(0, 120);
      if (typeof b.메모 === 'string') v.메모 = b.메모.slice(0, 2000);
      if (typeof b.날짜 === 'string' && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(b.날짜)) v.날짜 = b.날짜.replace('T', ' ');
      saveStudent(s);
      return send(res, 200, v);
    }
    if (m === 'DELETE') {
      const src = path.join(studentDir(name), '영상', v.파일);
      if (fs.existsSync(src)) await move(src, uniquePath(path.join(TRASH, `${today()}_${name}_${v.파일}`)));
      s.영상 = s.영상.filter((x) => x.id !== id);
      saveStudent(s);
      return send(res, 200, { ok: true });
    }
  }

  // 화면에 끌어다 놓은 영상. 넣는 곳을 거치지 않고 곧장 학생에게 들어간다.
  if (what === 'upload' && s && m === 'PUT') {
    const orig = nfc(url.searchParams.get('filename') ?? 'video.mp4');
    if (!isVideo(orig)) { req.resume(); return send(res, 400, { 오류: '영상 파일만 넣을 수 있어요' }); }
    fs.mkdirSync(UPLOADING, { recursive: true });
    const tmp = path.join(UPLOADING, `${Date.now()}_${crypto.randomBytes(3).toString('hex')}${path.extname(orig).toLowerCase()}`);
    try {
      await new Promise((ok, fail) => {
        const out = fs.createWriteStream(tmp);
        req.pipe(out);
        out.on('finish', ok);
        out.on('error', fail);
        req.on('error', fail);
      });
      const mtime = Number(url.searchParams.get('mtime'));
      if (mtime > 0) fs.utimesSync(tmp, new Date(), new Date(mtime));
      const file = await importVideo(name, tmp, orig);
      return send(res, 200, { 파일: file });
    } catch (e) {
      try { fs.unlinkSync(tmp); } catch {}
      return send(res, 500, { 오류: `올리지 못했어요: ${e.message}` });
    }
  }

  // 이름을 못 알아본 영상을 학생에게 붙인다
  if (what === 'assign' && m === 'POST') {
    const b = await readBody(req);
    const target = safeName(b.이름);
    const src = path.join(DROP, path.basename(nfc(b.파일 ?? '')));
    if (!target || !inside(DROP, src) || !fs.existsSync(src)) return send(res, 400, { 오류: '파일이나 학생을 찾지 못했어요' });
    await importVideo(target, src);
    await organize();
    return send(res, 200, state());
  }

  if (what === 'open' && m === 'POST') {
    const b = await readBody(req);
    if (b.곳 === '넣는곳') { ensureDirs(); openPath(DROP); }
    else if (b.곳 === '학생' && loadStudent(safeName(b.이름))) openPath(studentDir(safeName(b.이름)));
    else if (b.곳 === '성장파일' && loadStudent(safeName(b.이름))) openPath(path.join(studentDir(safeName(b.이름)), '성장파일.html'));
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { 오류: '없는 요청이에요' });
}

function serve({ open }) {
  const server = http.createServer(async (req, res) => {
    // 이 컴퓨터에서 연 화면만 받는다
    const host = (req.headers.host ?? '').replace(/:\d+$/, '');
    if (!['localhost', '127.0.0.1'].includes(host)) return send(res, 403, { 오류: '이 컴퓨터에서만 열 수 있어요' });
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname.startsWith('/api/')) return await api(req, res, url);
      if (url.pathname === '/' || url.pathname === '/index.html') return serveFile(req, res, path.join(HERE, 'ui.html'));
      if (url.pathname.startsWith('/학생/') || url.pathname.startsWith('/%ED%95%99%EC%83%9D/')) {
        const rel = nfc(decodeURIComponent(url.pathname)).replace(/^\/학생\//, '');
        const file = path.join(STU, rel);
        if (!inside(STU, file)) return send(res, 403, { 오류: '열 수 없어요' });
        return serveFile(req, res, file);
      }
      send(res, 404, { 오류: '없어요' });
    } catch (e) {
      log('  ! ', e);
      if (!res.headersSent) send(res, 500, { 오류: e.message });
    }
  });
  const url = `http://localhost:${PORT}/`;
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      log(`\n  이미 켜져 있어요. 브라우저에서 ${url} 로 열어드릴게요.\n`);
      if (open) openBrowser(url);
      process.exit(0);
    }
    throw e;
  });
  server.listen(PORT, '127.0.0.1', () => {
    log(`\n  학원생 성장파일을 켰어요 → ${url}`);
    log('  이 창을 닫으면 화면도 꺼져요. 쓰시는 동안은 열어두세요.\n');
    if (open) openBrowser(url);
  });
  const tick = () => organize({ waitStable: true }).catch((e) => log('  ! ', e.message)).finally(() => setTimeout(tick, POLL_MS));
  tick();
}

// ───────────────────────────── 시작

const args = process.argv.slice(2);
ensureDirs();
if (args.includes('정리') || args.includes('organize')) {
  const r = await organize();
  log(`\n  ${r.moved.length}개를 정리했어요.`);
  if (r.unmatched.length) log(`  누구 영상인지 모르는 게 ${r.unmatched.length}개 있어요: ${r.unmatched.map((u) => u.파일).join(', ')}`);
  log(`  학생 ${listStudentNames().length}명의 성장파일을 새로 만들었어요.\n`);
} else {
  serve({ open: !args.includes('--no-open') });
}
