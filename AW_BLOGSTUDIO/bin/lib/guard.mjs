#!/usr/bin/env node

// scripts/guard.mjs
import { readFileSync, appendFileSync, mkdirSync, writeFileSync, renameSync } from "node:fs";
import { join, resolve } from "node:path";
function \uC785\uB825\uC77D\uAE30() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return null;
  }
}
function \uAC70\uC808(\uAE4C\uB2ED) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: \uAE4C\uB2ED
    }
  }));
  process.exit(0);
}
function \uD1B5\uACFC() {
  process.exit(0);
}
function \uC791\uC5C5\uD3F4\uB354(cwd) {
  const \uBC15\uD78C\uAC83 = process.env.AW_WORK_DIR;
  if (\uBC15\uD78C\uAC83) return resolve(cwd ?? ".", \uBC15\uD78C\uAC83);
  return null;
}
function \uC9C4\uD589\uC77D\uAE30(WD2) {
  try {
    return JSON.parse(readFileSync(join(WD2, "_\uC9C4\uD589.json"), "utf8"));
  } catch {
    return null;
  }
}
function \uAE30\uB85D(WD2, \uC904) {
  try {
    mkdirSync(WD2, { recursive: true });
    appendFileSync(join(WD2, "_\uBB38\uC9C0\uAE30.log"), `${(/* @__PURE__ */ new Date()).toISOString()}	${\uC904}
`);
  } catch {
  }
}
var d = \uC785\uB825\uC77D\uAE30();
if (!d) \uD1B5\uACFC();
var \uB3C4\uAD6C = d.tool_name ?? "";
var \uC785\uB825 = d.tool_input ?? {};
var WD = \uC791\uC5C5\uD3F4\uB354(d.cwd);
if (!WD) \uD1B5\uACFC();
var \uBCF4\uD638\uD30C\uC77C = /(_진행\.json|_문지기\.log)/;
if (\uB3C4\uAD6C === "Write" || \uB3C4\uAD6C === "Edit" || \uB3C4\uAD6C === "NotebookEdit") {
  const p = String(\uC785\uB825.file_path ?? \uC785\uB825.notebook_path ?? "");
  if (\uBCF4\uD638\uD30C\uC77C.test(p)) {
    \uAE30\uB85D(WD, `\uAC70\uC808	${\uB3C4\uAD6C}	${p}`);
    \uAC70\uC808("\uC774 \uD30C\uC77C\uC740 \uD504\uB85C\uADF8\uB7A8\uC774 \uC4F0\uB294 \uAC83\uC774\uB77C \uACE0\uCE60 \uC218 \uC5C6\uC5B4\uC694. \uC9C4\uD589 \uC0C1\uD0DC\uB294 dispatch \uAC00 \uC815\uD569\uB2C8\uB2E4.");
  }
  \uD1B5\uACFC();
}
if (\uB3C4\uAD6C === "Bash") {
  const cmd = String(\uC785\uB825.command ?? "");
  if (\uBCF4\uD638\uD30C\uC77C.test(cmd) && /(>|>>|tee|sed -i|rm |mv |cp |truncate|python|node -e)/.test(cmd)) {
    \uAE30\uB85D(WD, `\uAC70\uC808	Bash	${cmd.slice(0, 120)}`);
    \uAC70\uC808("\uC9C4\uD589 \uC0C1\uD0DC \uD30C\uC77C\uC740 \uC9C1\uC811 \uACE0\uCE60 \uC218 \uC5C6\uC5B4\uC694. `dispatch.mjs` \uB97C \uC4F0\uC138\uC694.");
  }
  \uD1B5\uACFC();
}
if (\uB3C4\uAD6C === "Task" || \uB3C4\uAD6C === "Agent") {
  const \uB2F4\uB2F9 = String(\uC785\uB825.subagent_type ?? \uC785\uB825.agent_type ?? "").trim();
  const \uD30C\uC774\uD504\uB77C\uC778 = ["topic-scout", "architect", "researcher", "writer", "polisher"];
  if (!\uD30C\uC774\uD504\uB77C\uC778.includes(\uB2F4\uB2F9)) \uD1B5\uACFC();
  const \uC9C4\uD589 = \uC9C4\uD589\uC77D\uAE30(WD);
  if (!\uC9C4\uD589) {
    \uAE30\uB85D(WD, `\uD1B5\uACFC(\uAE00\uC4F0\uAE30\uBC16)	Task	${\uB2F4\uB2F9}	\uC9C4\uD589\uD30C\uC77C\uC5C6\uC74C`);
    \uD1B5\uACFC();
  }
  if (\uC9C4\uD589.\uB05D\uB0AC\uB098 || \uC9C4\uD589.\uB9CC\uB4E0\uB54C && Date.now() - \uC9C4\uD589.\uB9CC\uB4E0\uB54C > 6 * 60 * 60 * 1e3) {
    \uAE30\uB85D(WD, `\uD1B5\uACFC(\uC9C0\uB09C\uD310)	Task	${\uB2F4\uB2F9}	\uB9CC\uB4E0\uB54C=${\uC9C4\uD589.\uB9CC\uB4E0\uB54C ?? "?"}`);
    \uD1B5\uACFC();
  }
  if (\uC9C4\uD589.\uD5C8\uAC00 !== \uB2F4\uB2F9) {
    \uAE30\uB85D(WD, `\uAC70\uC808	Task	${\uB2F4\uB2F9}	\uD5C8\uAC00=${\uC9C4\uD589.\uD5C8\uAC00 ?? "\uC5C6\uC74C"}`);
    \uAC70\uC808(
      `\uC9C0\uAE08 \uBD80\uB97C \uC218 \uC788\uB294 \uB2F4\uB2F9\uC740 \`${\uC9C4\uD589.\uD5C8\uAC00 ?? "\uC5C6\uC74C"}\` \uC774\uC5D0\uC694. \`${\uB2F4\uB2F9}\` \uC740 \uC548 \uB429\uB2C8\uB2E4.
\uAE4C\uB2ED: ${\uC9C4\uD589.\uAE4C\uB2ED ?? "-"}
\`node bin/lib/dispatch.mjs \uB2E4\uC74C <\uC791\uC5C5\uD3F4\uB354>\` \uAC00 \uC815\uD55C \uB300\uB85C\uB9CC \uAC11\uB2C8\uB2E4.`
    );
  }
  if (\uC9C4\uD589.\uC37C\uB098) {
    \uAE30\uB85D(WD, `\uAC70\uC808	Task	${\uB2F4\uB2F9}	\uC774\uBBF8\uC500`);
    \uAC70\uC808(`\`${\uB2F4\uB2F9}\` \uC740 \uC774\uBC88 \uCC28\uB840\uC5D0 \uC774\uBBF8 \uBD88\uB800\uC5B4\uC694. \uB2E4\uC2DC \uBD80\uB974\uB824\uBA74 \`dispatch.mjs \uB2E4\uC74C\` \uC744 \uBA3C\uC800 \uB3CC\uB9AC\uC138\uC694.`);
  }
  \uAE30\uB85D(WD, `\uD5C8\uC6A9	Task	${\uB2F4\uB2F9}	\uCC28\uC218=${\uC9C4\uD589.\uCC28\uC218 ?? "?"}`);
  try {
    const p = join(WD, "_\uC9C4\uD589.json");
    writeAtomic(p, JSON.stringify({ ...\uC9C4\uD589, \uC37C\uB098: true, \uC4F4\uB54C: Date.now() }, null, 1));
  } catch {
  }
  \uD1B5\uACFC();
}
\uD1B5\uACFC();
function writeAtomic(p, s) {
  const tmp = `${p}.tmp`;
  writeFileSync(tmp, s);
  renameSync(tmp, p);
}
