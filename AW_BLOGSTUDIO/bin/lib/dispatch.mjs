#!/usr/bin/env node

// scripts/dispatch.mjs
import { readFileSync, writeFileSync, renameSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// src/checks/route.ts
var \uBD84\uB958\uD45C = [
  /* 국소·표현 — 문장 한두 개를 바꾸면 끝난다.
     법규(L*)는 🔴 이지만 대개 낱말 하나다. "달라집니다" → "달라지는 편이에요". */
  { \uC774\uB984: "\uAD6D\uC18C\xB7\uD45C\uD604", \uADDC\uCE59: /^(L[0-9]|P-)/, \uAE30\uBCF8: "\uC218\uB9AC", hit\uC0C1\uD55C: 8 },
  /* 국소·구조 — 문단 하나를 손보면 된다. 마무리 CTA·소제목 답 위치 같은 것. */
  { \uC774\uB984: "\uAD6D\uC18C\xB7\uAD6C\uC870", \uADDC\uCE59: /^(CTA-|G[0-9]|T[12]$)/, \uAE30\uBCF8: "\uC218\uB9AC", hit\uC0C1\uD55C: 3 },
  /* 전면·말투 — 어미 비율·문장 길이 분포는 **글 전체의 성질**이다.
     여기 걸린 것을 polisher 에게 주면 이번 사고가 그대로 재현된다. */
  { \uC774\uB984: "\uC804\uBA74\xB7\uB9D0\uD22C", \uADDC\uCE59: /^TG-[1-5]$/, \uAE30\uBCF8: "\uC7AC\uC791\uC131" },
  /* 근거 부재 — 없는 근거는 고쳐 넣을 수 없다. 사례를 다시 골라야 한다.
     polisher 가 여기서 문장을 지어내면 그게 바로 "없던 경험의 발명"이다. */
  { \uC774\uB984: "\uADFC\uAC70 \uBD80\uC7AC", \uADDC\uCE59: /^(K[0-9]|D[0-9]|T3$)/, \uAE30\uBCF8: "\uC7AC\uC791\uC131" },
  /* 길이 — 늘리는 것은 polisher 일이 아니다. 글자 수를 채우려 늘리는 것이
     이 단계가 막으려는 바로 그 행위다. */
  { \uC774\uB984: "\uAE38\uC774", \uADDC\uCE59: /^(M0|M1)/, \uAE30\uBCF8: "\uC7AC\uC791\uC131" },
  /* 반복 — 다른 사례를 골라야 한다. 문장을 바꿔서 될 일이 아니다. */
  { \uC774\uB984: "\uBC18\uBCF5", \uADDC\uCE59: /^(R[0-9]|S[0-9]|C[0-9])/, \uAE30\uBCF8: "\uC7AC\uC791\uC131" },
  { \uC774\uB984: "\uBE48 \uAE00", \uADDC\uCE59: /^EMPTY$/, \uAE30\uBCF8: "\uC7AC\uC791\uC131" }
];
var \uBBF8\uBD84\uB958 = { \uC774\uB984: "\uBBF8\uBD84\uB958", \uADDC\uCE59: /.^/, \uAE30\uBCF8: "\uC7AC\uC791\uC131" };
function \uBD84\uB958\uD558\uAE30(id) {
  return \uBD84\uB958\uD45C.find((c) => c.\uADDC\uCE59.test(id)) ?? \uBBF8\uBD84\uB958;
}
function \uC608\uC0C1\uD3B8\uC9D1\uB960(findings, \uBB38\uC7A5\uC218) {
  if (\uBB38\uC7A5\uC218 <= 0) return 0;
  const \uC790\uB9AC = /* @__PURE__ */ new Set();
  for (const f of findings) {
    for (const h of f.hits) \uC790\uB9AC.add(h.trim());
    if (f.hits.length === 0 && f.count > 0) \uC790\uB9AC.add(`${f.id}#${f.count}`);
  }
  return Math.round(\uC790\uB9AC.size / \uBB38\uC7A5\uC218 * 1e3) / 10;
}
function \uAE09\uD55C\uC21C(a, b) {
  const \uAE09 = (id) => /^L[0-9]/.test(id) ? 0 : /^(K[0-9]|D[0-9])/.test(id) ? 1 : /^(R|S|C)[0-9]/.test(id) ? 2 : /^(M[01]|G|CTA|T[0-9])/.test(id) ? 3 : 4;
  return \uAE09(a.id) - \uAE09(b.id);
}
function route(\uC785\uB825) {
  const { findings, \uBB38\uC7A5\uC218 } = \uC785\uB825;
  const \uC7AC\uC791\uC131\uC774\uB825 = \uC785\uB825.\uC7AC\uC791\uC131\uC774\uB825 ?? 0;
  const \uACE0\uCE60\uAC83 = findings.filter((f) => f.severity !== "\uD655\uC778");
  const \uB960 = \uC608\uC0C1\uD3B8\uC9D1\uB960(\uACE0\uCE60\uAC83, \uBB38\uC7A5\uC218);
  if (\uACE0\uCE60\uAC83.length === 0) {
    return { \uB2E4\uC74C: "\uD1B5\uACFC", \uAE4C\uB2ED: "\uACE0\uCE60 \uC9C0\uC801\uC774 \uC5C6\uB2E4", \uC218\uB9AC\uB300\uC0C1: [], \uC7AC\uC791\uC131\uC0AC\uC720: [], \uC608\uC0C1\uD3B8\uC9D1\uB960: \uB960 };
  }
  const \uC7AC\uC791\uC131\uC0AC\uC720 = [];
  const \uC218\uB9AC\uB300\uC0C1 = [];
  for (const f of \uACE0\uCE60\uAC83) {
    const c = \uBD84\uB958\uD558\uAE30(f.id);
    const \uB118\uCE68 = c.hit\uC0C1\uD55C != null && f.count > c.hit\uC0C1\uD55C;
    if (c.\uAE30\uBCF8 === "\uC7AC\uC791\uC131" || \uB118\uCE68) {
      \uC7AC\uC791\uC131\uC0AC\uC720.push(f);
    } else {
      \uC218\uB9AC\uB300\uC0C1.push(f);
    }
  }
  if (\uC7AC\uC791\uC131\uC0AC\uC720.length === 0 && \uB960 > 30) {
    \uC7AC\uC791\uC131\uC0AC\uC720.push(...\uC218\uB9AC\uB300\uC0C1);
    \uC218\uB9AC\uB300\uC0C1.length = 0;
  }
  if (\uC7AC\uC791\uC131\uC0AC\uC720.length > 0) {
    if (\uC7AC\uC791\uC131\uC774\uB825 >= 1) {
      return {
        \uB2E4\uC74C: "\uBA48\uCDA4",
        \uAE4C\uB2ED: `\uB450 \uBC88\uC9F8 \uC7AC\uC791\uC131 \uD310\uC815 \u2014 ${\uC694\uC57D(\uC7AC\uC791\uC131\uC0AC\uC720)}`,
        \uC218\uB9AC\uB300\uC0C1: [],
        \uC7AC\uC791\uC131\uC0AC\uC720,
        \uC608\uC0C1\uD3B8\uC9D1\uB960: \uB960
      };
    }
    return {
      \uB2E4\uC74C: "\uC7AC\uC791\uC131",
      \uAE4C\uB2ED: \uC694\uC57D(\uC7AC\uC791\uC131\uC0AC\uC720) + (\uB960 > 30 ? ` \xB7 \uC608\uC0C1 \uD3B8\uC9D1\uB960 ${\uB960}%` : ""),
      \uC218\uB9AC\uB300\uC0C1: [],
      \uC7AC\uC791\uC131\uC0AC\uC720,
      \uC608\uC0C1\uD3B8\uC9D1\uB960: \uB960
    };
  }
  return {
    \uB2E4\uC74C: "\uC218\uB9AC",
    \uAE4C\uB2ED: \uC694\uC57D(\uC218\uB9AC\uB300\uC0C1) + ` \xB7 \uC608\uC0C1 \uD3B8\uC9D1\uB960 ${\uB960}%`,
    \uC218\uB9AC\uB300\uC0C1: \uC218\uB9AC\uB300\uC0C1.sort(\uAE09\uD55C\uC21C),
    \uC7AC\uC791\uC131\uC0AC\uC720: [],
    \uC608\uC0C1\uD3B8\uC9D1\uB960: \uB960
  };
}
function \uC694\uC57D(fs) {
  return fs.slice(0, 3).map((f) => `${f.id}(${\uBD84\uB958\uD558\uAE30(f.id).\uC774\uB984}${f.count > 1 ? ` ${f.count}\uACF3` : ""})`).join(" \xB7 ") + (fs.length > 3 ? ` \uC678 ${fs.length - 3}\uAC74` : "");
}

// scripts/dispatch.mjs
var [, , \uBA85\uB839, \uC791\uC5C5\uD3F4\uB354, ...\uB098\uBA38\uC9C0] = process.argv;
if (!\uBA85\uB839 || !\uC791\uC5C5\uD3F4\uB354) {
  console.error("\uC4F0\uB294 \uBC95: dispatch.mjs <\uC2DC\uC791|\uB2E4\uC74C|\uB05D\uB0C4|\uB05D|\uB300\uC870> <\uC791\uC5C5\uD3F4\uB354> [...]");
  process.exit(2);
}
var \uC9C4\uD589\uACBD\uB85C = join(\uC791\uC5C5\uD3F4\uB354, "_\uC9C4\uD589.json");
var \uB85C\uADF8\uACBD\uB85C = join(\uC791\uC5C5\uD3F4\uB354, "_\uBB38\uC9C0\uAE30.log");
function \uC77D\uAE30() {
  try {
    return JSON.parse(readFileSync(\uC9C4\uD589\uACBD\uB85C, "utf8"));
  } catch {
    return null;
  }
}
function \uC4F0\uAE30(o) {
  mkdirSync(\uC791\uC5C5\uD3F4\uB354, { recursive: true });
  const tmp = `${\uC9C4\uD589\uACBD\uB85C}.tmp`;
  writeFileSync(tmp, JSON.stringify(o, null, 1));
  renameSync(tmp, \uC9C4\uD589\uACBD\uB85C);
}
function \uAE30\uB85D(\uC904) {
  try {
    mkdirSync(\uC791\uC5C5\uD3F4\uB354, { recursive: true });
    appendFileSync(\uB85C\uADF8\uACBD\uB85C, `${(/* @__PURE__ */ new Date()).toISOString()}	${\uC904}
`);
  } catch {
  }
}
function \uB0B4\uB193\uAE30(o) {
  process.stdout.write(JSON.stringify(o, null, 1) + "\n");
}
var \uC21C\uC11C = ["topic-scout", "architect", "researcher", "writer", "polisher"];
switch (\uBA85\uB839) {
  /* ── 시작 ─────────────────────────────────────────────── */
  case "\uC2DC\uC791": {
    const \uCC98\uC74C = {
      \uB9CC\uB4E0\uB54C: Date.now(),
      \uD5C8\uAC00: "topic-scout",
      \uAE4C\uB2ED: "\uCCAB \uB2E8\uACC4",
      \uCC28\uC218: 1,
      \uC37C\uB098: false,
      writer\uD69F\uC218: 0,
      polisher\uD69F\uC218: 0,
      \uB2E8\uACC4\uAE30\uB85D: []
    };
    \uC4F0\uAE30(\uCC98\uC74C);
    \uAE30\uB85D("\uC2DC\uC791	-	-");
    \uB0B4\uB193\uAE30({ \uB2E4\uC74C: "topic-scout", \uAE4C\uB2ED: "\uCCAB \uB2E8\uACC4", \uD5C8\uAC00: true });
    break;
  }
  /* ── 끝냄 ─ 담당 하나가 끝났다. 시각을 박는다 ────────────── */
  case "\uB05D\uB0C4": {
    const \uB2F4\uB2F9 = \uB098\uBA38\uC9C0[0] ?? "";
    const s = \uC77D\uAE30();
    if (!s) {
      console.error("\uC9C4\uD589 \uD30C\uC77C\uC774 \uC5C6\uC5B4\uC694. `\uC2DC\uC791` \uBD80\uD130 \uD558\uC138\uC694.");
      process.exit(1);
    }
    s.\uB2E8\uACC4\uAE30\uB85D = s.\uB2E8\uACC4\uAE30\uB85D ?? [];
    s.\uB2E8\uACC4\uAE30\uB85D.push({ \uB2F4\uB2F9, \uB05D\uB09C\uB54C: Date.now() });
    if (\uB2F4\uB2F9 === "writer") s.writer\uD69F\uC218 = (s.writer\uD69F\uC218 ?? 0) + 1;
    if (\uB2F4\uB2F9 === "polisher") s.polisher\uD69F\uC218 = (s.polisher\uD69F\uC218 ?? 0) + 1;
    s.\uD5C8\uAC00 = null;
    s.\uAE4C\uB2ED = `${\uB2F4\uB2F9} \uB05D\uB0A8 \u2014 \uB2E4\uC74C\uC740 dispatch \uAC00 \uC815\uD55C\uB2E4`;
    s.\uC37C\uB098 = false;
    \uC4F0\uAE30(s);
    \uAE30\uB85D(`\uB05D\uB0C4	${\uB2F4\uB2F9}	-`);
    \uB0B4\uB193\uAE30({ \uB05D\uB0C4: \uB2F4\uB2F9, writer\uD69F\uC218: s.writer\uD69F\uC218, polisher\uD69F\uC218: s.polisher\uD69F\uC218 });
    break;
  }
  /* ── 다음 ─ 검수 결과를 읽고 갈림길을 정한다 ─────────────── */
  case "\uB2E4\uC74C": {
    const s = \uC77D\uAE30();
    if (!s) {
      console.error("\uC9C4\uD589 \uD30C\uC77C\uC774 \uC5C6\uC5B4\uC694. `\uC2DC\uC791` \uBD80\uD130 \uD558\uC138\uC694.");
      process.exit(1);
    }
    const \uB2E4\uC74C\uB2E8\uACC4 = \uB098\uBA38\uC9C0[0];
    if (\uB2E4\uC74C\uB2E8\uACC4 === "writer" || \uB2E4\uC74C\uB2E8\uACC4 === "polisher") {
      console.error(
        `\`${\uB2E4\uC74C\uB2E8\uACC4}\` \uB294 \uCC28\uB840\uB85C \uBD80\uB97C \uC218 \uC5C6\uC5B4\uC694. \uAC80\uC218 \uACB0\uACFC\uB97C \uB118\uAE30\uC138\uC694:
  node bin/lib/dispatch.mjs \uB2E4\uC74C <\uC791\uC5C5\uD3F4\uB354> <\uAC80\uC218JSON> <\uBB38\uC7A5\uC218>`
      );
      process.exit(2);
    }
    if (\uB2E4\uC74C\uB2E8\uACC4 === "\uCD08\uC548") {
      if ((s.writer\uD69F\uC218 ?? 0) >= 1) {
        console.error("\uCD08\uC548\uC740 \uC774\uBBF8 \uB098\uC654\uC5B4\uC694. \uB2E4\uC2DC \uC4F0\uB824\uBA74 \uAC80\uC218 \uACB0\uACFC\uB97C \uB118\uAE30\uC138\uC694.");
        process.exit(2);
      }
      s.\uD5C8\uAC00 = "writer";
      s.\uAE4C\uB2ED = "\uCCAB \uCD08\uC548";
      s.\uC37C\uB098 = false;
      s.\uCC28\uC218 = (s.\uCC28\uC218 ?? 0) + 1;
      \uC4F0\uAE30(s);
      \uB0B4\uB193\uAE30({ \uB2E4\uC74C: "writer", \uAE4C\uB2ED: "\uCCAB \uCD08\uC548", \uD5C8\uAC00: true });
      break;
    }
    if (\uB2E4\uC74C\uB2E8\uACC4 && \uC21C\uC11C.includes(\uB2E4\uC74C\uB2E8\uACC4)) {
      s.\uD5C8\uAC00 = \uB2E4\uC74C\uB2E8\uACC4;
      s.\uAE4C\uB2ED = "\uCC28\uB840";
      s.\uC37C\uB098 = false;
      s.\uCC28\uC218 = (s.\uCC28\uC218 ?? 0) + 1;
      \uC4F0\uAE30(s);
      \uB0B4\uB193\uAE30({ \uB2E4\uC74C: \uB2E4\uC74C\uB2E8\uACC4, \uAE4C\uB2ED: "\uCC28\uB840", \uD5C8\uAC00: true });
      break;
    }
    const [\uAC80\uC218\uACBD\uB85C, \uBB38\uC7A5\uC218S] = \uB098\uBA38\uC9C0;
    if (!\uAC80\uC218\uACBD\uB85C || !existsSync(\uAC80\uC218\uACBD\uB85C)) {
      console.error("\uAC80\uC218 \uACB0\uACFC JSON \uC774 \uD544\uC694\uD574\uC694: dispatch.mjs \uB2E4\uC74C <\uC791\uC5C5\uD3F4\uB354> <\uAC80\uC218JSON> <\uBB38\uC7A5\uC218>");
      process.exit(2);
    }
    const findings = JSON.parse(readFileSync(\uAC80\uC218\uACBD\uB85C, "utf8"));
    const \uBB38\uC7A5\uC218 = Number(\uBB38\uC7A5\uC218S) || 0;
    const r = route({
      findings: Array.isArray(findings) ? findings : findings.findings ?? [],
      \uBB38\uC7A5\uC218,
      \uC7AC\uC791\uC131\uC774\uB825: s.writer\uD69F\uC218 > 1 ? 1 : 0
      // 첫 writer 는 재작성이 아니다
    });
    if (r.\uB2E4\uC74C === "\uC218\uB9AC" && (s.polisher\uD69F\uC218 ?? 0) >= 2) {
      s.\uD5C8\uAC00 = null;
      s.\uAE4C\uB2ED = "polisher \uB97C \uC774\uBBF8 \uB450 \uBC88 \uBD88\uB800\uB2E4";
      s.\uC37C\uB098 = false;
      \uC4F0\uAE30(s);
      \uAE30\uB85D("\uBA48\uCDA4	polisher\uC0C1\uD55C	-");
      \uB0B4\uB193\uAE30({ \uB2E4\uC74C: "\uBA48\uCDA4", \uAE4C\uB2ED: s.\uAE4C\uB2ED, \uD5C8\uAC00: false });
      break;
    }
    const \uB2F4\uB2F9 = r.\uB2E4\uC74C === "\uC218\uB9AC" ? "polisher" : r.\uB2E4\uC74C === "\uC7AC\uC791\uC131" ? "writer" : null;
    s.\uD5C8\uAC00 = \uB2F4\uB2F9;
    s.\uAE4C\uB2ED = r.\uAE4C\uB2ED;
    s.\uC37C\uB098 = false;
    s.\uCC28\uC218 = (s.\uCC28\uC218 ?? 0) + 1;
    s.\uB9C8\uC9C0\uB9C9\uD310\uC815 = { \uB2E4\uC74C: r.\uB2E4\uC74C, \uC608\uC0C1\uD3B8\uC9D1\uB960: r.\uC608\uC0C1\uD3B8\uC9D1\uB960 };
    \uC4F0\uAE30(s);
    \uAE30\uB85D(`\uD310\uC815	${r.\uB2E4\uC74C}	${r.\uAE4C\uB2ED.slice(0, 80)}`);
    \uB0B4\uB193\uAE30({
      \uB2E4\uC74C: r.\uB2E4\uC74C,
      \uB2F4\uB2F9,
      \uAE4C\uB2ED: r.\uAE4C\uB2ED,
      \uC608\uC0C1\uD3B8\uC9D1\uB960: r.\uC608\uC0C1\uD3B8\uC9D1\uB960,
      \uD5C8\uAC00: \uB2F4\uB2F9 != null,
      \uC218\uB9AC\uB300\uC0C1: r.\uC218\uB9AC\uB300\uC0C1.map((f) => ({ id: f.id, \uC2EC\uAC01\uB3C4: f.severity, \uAC78\uB9B0\uACF3: f.hits, \uACE0\uCE68: f.fix })),
      \uC7AC\uC791\uC131\uC0AC\uC720: r.\uC7AC\uC791\uC131\uC0AC\uC720.map((f) => ({ id: f.id, \uC2EC\uAC01\uB3C4: f.severity, \uBB34\uC5C7: f.what, \uACE0\uCE68: f.fix }))
    });
    break;
  }
  /* ── 끝 ─ 글쓰기 한 편이 끝났다. 문지기가 손을 떼게 표시한다 ── */
  case "\uB05D": {
    const s = \uC77D\uAE30() ?? {};
    s.\uB05D\uB0AC\uB098 = true;
    s.\uB05D\uB09C\uB54C = Date.now();
    s.\uD5C8\uAC00 = null;
    s.\uC37C\uB098 = false;
    \uC4F0\uAE30(s);
    \uAE30\uB85D("\uB05D	-	-");
    \uB0B4\uB193\uAE30({ \uB05D: true, writer\uD69F\uC218: s.writer\uD69F\uC218 ?? 0, polisher\uD69F\uC218: s.polisher\uD69F\uC218 ?? 0 });
    break;
  }
  /* ── 대조 ─ 문지기 기록과 허가 내역이 맞나 ────────────────── */
  case "\uB300\uC870": {
    const s = \uC77D\uAE30() ?? {};
    let \uB85C\uADF8 = "";
    try {
      \uB85C\uADF8 = readFileSync(\uB85C\uADF8\uACBD\uB85C, "utf8");
    } catch {
    }
    const \uD5C8\uC6A9 = [...\uB85C\uADF8.matchAll(/\t허용\tTask\t([^\t\n]+)/g)].map((m) => m[1]);
    const \uAC70\uC808 = [...\uB85C\uADF8.matchAll(/\t거절\tTask\t([^\t\n]+)/g)].map((m) => m[1]);
    const w = \uD5C8\uC6A9.filter((x) => x === "writer").length;
    const p = \uD5C8\uC6A9.filter((x) => x === "polisher").length;
    const \uC5B4\uAE0B\uB0A8 = [];
    if (w !== (s.writer\uD69F\uC218 ?? 0)) \uC5B4\uAE0B\uB0A8.push(`writer \uAE30\uB85D ${w} vs \uC148 ${s.writer\uD69F\uC218 ?? 0}`);
    if (p !== (s.polisher\uD69F\uC218 ?? 0)) \uC5B4\uAE0B\uB0A8.push(`polisher \uAE30\uB85D ${p} vs \uC148 ${s.polisher\uD69F\uC218 ?? 0}`);
    if (p > 2) \uC5B4\uAE0B\uB0A8.push(`polisher ${p}\uD68C \u2014 \uC0C1\uD55C 2`);
    if (w > 2) \uC5B4\uAE0B\uB0A8.push(`writer ${w}\uD68C \u2014 \uC0C1\uD55C 2`);
    \uB0B4\uB193\uAE30({ \uB9DE\uB098: \uC5B4\uAE0B\uB0A8.length === 0, \uC5B4\uAE0B\uB0A8, \uD5C8\uC6A9, \uAC70\uC808, writer\uD69F\uC218: w, polisher\uD69F\uC218: p });
    if (\uC5B4\uAE0B\uB0A8.length) process.exit(1);
    break;
  }
  default:
    console.error(`\uBAA8\uB974\uB294 \uBA85\uB839: ${\uBA85\uB839}`);
    process.exit(2);
}
