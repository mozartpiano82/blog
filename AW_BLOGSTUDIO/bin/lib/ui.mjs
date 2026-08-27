import{createServer as kn}from"node:http";import{existsSync as y,statSync as gt,realpathSync as yt}from"node:fs";import{createHash as Sn}from"node:crypto";import{hostname as En}from"node:os";import{readFile as B,readdir as it,writeFile as T,appendFile as Tn,mkdir as $,stat as Oe,rename as J,rm as M,cp as _n}from"node:fs/promises";import{join as l,resolve as H,basename as st,sep as mt,dirname as at}from"node:path";import{fileURLToPath as Mn}from"node:url";import{exec as Ut,spawn as Le}from"node:child_process";var Kt=String.raw`<!doctype html>
<html lang="ko"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>블로그 스튜디오</title>
<style>
:root{
  /* 색은 원장님이 주신 프로토타입 팔레트다. 따뜻한 크림 + 테라코타.
     다크였던 것을 뒤집은 것이라 **강조색 위 글자가 밝아야 한다** — 그게 --onkey 다.
     전에는 그 자리에 #0e1012 를 손으로 박아 넣었었다 (여덟 군데). */
  --bg:#F7F4EF; --card:#FFFDF9; --card2:#F2EDE4; --line:#E7E0D5;
  --ink:#23201C; --dim:#6E665C; --dim2:#756A5D;
  --c0:#AE4F2E; --c1:#3F6F8F; --c2:#8E5C15; --c3:#9C5A7A;
  --c4:#3F7F7A; --c5:#6F5FA0; --c6:#B0453A;
  --key:var(--c0); --ok:#3F7F55; --warn:var(--c2); --bad:#B0453A;
  /* 강조색 배경 위에 얹는 글자색. 어느 --a 위에서도 읽힌다 */
  --onkey:#FFFDF9;
  --keysoft:rgba(174,79,46,.12); --keyline:rgba(174,79,46,.30);
  /* 옅게 물든 바탕 위에 얹는 강조 글자. --key 를 그대로 쓰면 4.12 로 미달한다.
     첫 화면에서 제일 중요한 한 줄이 거기 있어서 조금 더 진한 것을 따로 둔다. */
  --keyon:#8F3F23;
}

/*
 * 대비를 재보고 두 가지를 고쳤다. 원장님은 마흔·쉰이시고 창은 좁다.
 *
 *  --dim2  #A79C8E → #756A5D   2.46 → 5.20   (저작권 줄·작은 안내가 안 읽혔다)
 *  --c0    #C2603C → #AE4F2E   4.11 → 5.22   (**주 단추 흰 글자**가 미달이었다)
 *  --c2    #B0721C → #8E5C15   3.92 → 5.60   (경고 줄. --warn 이 여기를 가리킨다)
 *
 * '확인하러 가기'·'고친 글 알려주기' 는 원장님이 제일 많이 누르실 단추인데
 * 그 위 글자가 기준(4.5) 아래였다. 15.5px 은 '큰 글씨' 예외에도 못 든다.
 * 색은 프로토타입에서 받은 테라코타 그대로고 조금 더 진해졌을 뿐이다.
 */

/*
 * 키보드로 옮겨 다닐 때 **지금 어디에 있는지 보이게 한다.**
 *
 * 전에는 아무 표시도 없었다. 마우스가 서툴거나 손이 떨리시는 분은 탭으로
 * 옮기시는데, 어디에 있는지 안 보이면 엉뚱한 것을 누르게 된다.
 * focus-visible 이라 마우스로 누를 때는 안 나온다 — 필요한 사람에게만 보인다.
 */
:focus-visible{outline:3px solid var(--key);outline-offset:2px;border-radius:6px}
*{box-sizing:border-box}
/* 내용이 짧아도 창 아래까지 같은 색이어야 한다.
   body 만 칠하면 내용이 끝나는 자리에서 색이 끊겨 **아래가 잘린 것처럼 보인다.**
   오른쪽 창처럼 세로로 긴 화면에서 특히 도드라진다. */
html{background:var(--bg);min-height:100%}
body{margin:0;min-height:100vh;background:var(--bg);color:var(--ink);-webkit-font-smoothing:antialiased;
 font:16px/1.7 -apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif}
::selection{background:var(--keyline)}

header{background:rgba(255,253,249,.86);backdrop-filter:blur(12px);
 border-bottom:1px solid var(--line);padding:0 20px;position:sticky;top:0;z-index:20}
.hwrap{max-width:920px;margin:0 auto;display:flex;align-items:center;gap:14px;padding:15px 0}
.brand{display:flex;align-items:center;gap:10px}
.brand i{width:11px;height:11px;border-radius:3px;background:var(--c0);display:block}
.brand div{display:flex;flex-direction:column;line-height:1.2}
.brand b{font-size:18px;font-weight:800;letter-spacing:-.3px}
.brand span{font-size:12px;color:var(--dim2);letter-spacing:1.4px;font-weight:600}
nav{display:flex;gap:2px;margin-left:auto;flex-wrap:wrap}
/* 손가락으로 누르는 자리는 **44px 이상**이어야 한다. 그보다 작으면 옆 것이 눌린다.
   원장님은 마우스로 쓰시겠지만 손이 떨리시거나 태블릿을 쓰실 수도 있다.
   글자를 키우지 않고 **누를 수 있는 넓이만** 키운다 — 화면은 그대로 보인다. */
nav button{border:0;background:none;padding:12px 13px;border-radius:9px;cursor:pointer;
 min-height:44px;font-size:15px;color:var(--dim);transition:.15s}
nav button:hover{color:var(--ink)}
nav button.on{background:var(--card2);color:var(--ink);font-weight:600}

.hero{padding:clamp(16px,2.8vw,30px) clamp(12px,2.2vw,20px) clamp(14px,2.4vw,26px);border-bottom:1px solid var(--line)}
.hero .in{max-width:920px;margin:0 auto}
.hero h2{margin:0 0 5px;font-size:26px;font-weight:800;letter-spacing:-.6px;line-height:1.25}
.hero p{margin:0 0 16px;color:var(--dim);font-size:15.5px}
.askrow{display:flex;gap:9px}
.askrow input{flex:1;font-size:16px;padding:15px 17px;border:1px solid var(--line);
 border-radius:13px;background:var(--card);color:var(--ink)}
.askrow input::placeholder{color:var(--dim2)}
.askrow input:focus{outline:none;border-color:var(--c0);background:var(--card2)}
.quick{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}
.quick button{background:var(--card);border:1px solid var(--line);border-radius:22px;
 padding:7px 15px;font-size:14.5px;color:var(--dim);cursor:pointer;transition:.15s}
.quick button:hover{color:var(--ink);border-color:var(--dim2)}

main{max-width:920px;margin:clamp(10px,2vw,22px) auto 0;padding:0 clamp(10px,2vw,18px)}
footer{max-width:920px;margin:clamp(18px,3vw,40px) auto clamp(14px,2vw,40px);padding:clamp(12px,2vw,20px) clamp(10px,2vw,18px);border-top:1px solid var(--line);
 color:var(--dim2);font-size:13.5px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}

.card{background:var(--card);border-radius:16px;padding:clamp(14px,2.2vw,20px) clamp(14px,2.4vw,22px);margin-bottom:clamp(9px,1.4vw,13px);
 position:relative;overflow:hidden}
.card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--a,transparent)}
.card h2{margin:0 0 4px;font-size:16.5px;font-weight:700;display:flex;align-items:center;gap:9px}
.card h2::before{content:'';width:9px;height:9px;border-radius:2.5px;background:var(--a,var(--c0));flex:none}
.card h2.plain::before{display:none}
/* 접어두는 묶음 — 늘 보일 필요 없는 것들. 지운 게 아니라 접은 것이라 보이게 만든다 */
.fold{margin-bottom:13px}
.fold>summary{background:var(--card);border-radius:16px;padding:15px 22px;cursor:pointer;
 font-size:15.5px;font-weight:600;color:var(--dim);display:flex;align-items:center;gap:9px;
 list-style:none;user-select:none}
.fold>summary::-webkit-details-marker{display:none}
.fold>summary::after{content:'▾';margin-left:auto;font-size:13.5px;opacity:.7}
.fold[open]>summary::after{content:'▴'}
.fold>summary:hover{color:var(--ink)}
.fold[open]>summary{border-radius:16px 16px 0 0;margin-bottom:2px}
.fold>div{padding-top:2px}
/* 아이콘이 들어간 제목은 색 점을 뺀다. 점+아이콘이 겹쳐 지저분했다 */
.card h2:has(svg.ic)::before{display:none}
.card h2 svg.ic{color:var(--a,var(--c0))}
.sub{color:var(--dim);font-size:14.5px;margin:0 0 14px;line-height:1.65}
.row{display:flex;gap:9px;flex-wrap:wrap;align-items:center}

.stat{display:flex;gap:30px;flex-wrap:wrap;margin-top:4px}
.stat div{font-size:13px;color:var(--dim2);letter-spacing:.3px}
.stat b{display:block;font-size:32px;font-weight:800;letter-spacing:-1.2px;line-height:1.25;
 color:var(--ink);font-variant-numeric:tabular-nums}

button.act,.chip,summary{min-height:44px}
/* 도는 동안 못 누르는 단추는 **흐리게** 보여야 한다. 멀쩡해 보이는데
   안 눌리면 고장으로 읽힌다. 커서도 바꿔서 "지금은 아니다" 를 알려준다 */
button:disabled{opacity:.45;cursor:not-allowed}
button.act{background:var(--c0);color:var(--onkey);border:0;border-radius:11px;padding:12px 19px;
 font-size:15.5px;cursor:pointer;font-weight:700;transition:.15s}
button.act:hover{filter:brightness(1.08)}
button.act.ghost{background:var(--card2);color:var(--ink);font-weight:600}
button.act.ghost:hover{background:var(--card2)}
/* 작은 단추도 **누르는 넓이는 44px** 로 둔다. 글자만 작고 손가락 자리는 그대로다.
   chip 처럼 여러 개가 붙어 있는 것은 잘못 누르면 엉뚱한 게 돈다. */
button.act.sm{padding:11px 14px;font-size:14.5px;min-height:44px}
input,textarea{width:100%;border:1px solid var(--line);border-radius:11px;padding:12px 14px;
 font:15.5px/1.7 inherit;background:var(--card2);color:var(--ink)}
input::placeholder,textarea::placeholder{color:var(--dim2)}
input:focus,textarea:focus{outline:none;border-color:var(--c0)}
/* 위에서 outline 을 지워버리면 **키보드로 오신 분은 어디에 계신지 못 본다.**
   마우스로 누를 때는 테두리 색만 바뀌는 게 깔끔하니 그대로 두고,
   키보드로 오셨을 때(:focus-visible)만 테를 되살린다. 뒤에 와야 이긴다. */
input:focus-visible,textarea:focus-visible,.askrow input:focus-visible{
 outline:3px solid var(--key);outline-offset:2px}
textarea{min-height:112px;resize:vertical}

.item{background:var(--card2);border-radius:12px;padding:14px 16px;margin-bottom:9px;
 position:relative;overflow:hidden}
.item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--a,var(--line))}
.item h3{margin:0 0 3px;font-size:15.5px;font-weight:650}
.meta{color:var(--dim2);font-size:13.5px;display:flex;gap:9px;flex-wrap:wrap;align-items:center}

.pill{border-radius:6px;padding:3px 10px;font-size:13px;font-weight:700;letter-spacing:.2px;
 color:var(--onkey);background:var(--a,var(--c0));display:inline-block}
.tag{background:var(--card2);border-radius:20px;padding:3px 11px;font-size:13px;color:var(--dim)}
.tag.sig{background:var(--keysoft);color:var(--c0)}
.tag.cli{background:rgba(255,107,107,.14);color:var(--c6)}
.tag.warn{background:rgba(255,149,64,.14);color:var(--c2)}

/* 색 채운 막대 — 사례 사용 현황 */
.usebar{position:relative;height:44px;border-radius:10px;overflow:hidden;
 background:var(--card2);margin-bottom:8px;display:flex;align-items:center}
.usebar i{position:absolute;left:0;top:0;bottom:0;background:var(--a);opacity:.9}
.usebar .lbl{position:relative;padding:0 15px;font-size:15px;font-weight:700;
 letter-spacing:.2px;z-index:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.usebar .lbl small{display:block;font-size:12px;font-weight:600;opacity:.72;letter-spacing:.4px}
.usebar .n{position:relative;margin-left:auto;padding:0 16px;font-size:18px;font-weight:800;
 z-index:1;font-variant-numeric:tabular-nums}
.usebar.dark .lbl,.usebar.dark .n{color:var(--onkey)}

.body{background:var(--card2);border-radius:12px;padding:18px 20px;
 font:15.5px/1.95 inherit;max-height:min(72vh,900px);overflow:auto;white-space:pre-wrap;word-break:break-word}
.body .h{display:block;margin:20px 0 7px;font-size:16.5px;font-weight:750;color:var(--ink)}
.body .h:first-child{margin-top:0}
.body .q{display:block;border-left:2px solid var(--c1);padding-left:12px;color:var(--dim);margin:9px 0}
.body .photo{display:inline-block;background:rgba(76,141,255,.14);color:var(--c1);border-radius:7px;
 padding:4px 10px;font-size:14px;margin:3px 0;font-weight:600}
.body .tags{color:var(--c0);font-size:14.5px}
.body hr{border:0;border-top:1px solid var(--line);margin:16px 0}
pre.term{background:var(--card2);color:var(--dim);border-radius:12px;padding:15px;white-space:pre-wrap;
 word-break:break-word;font:14px/1.65 ui-monospace,Menlo,monospace;max-height:320px;overflow:auto}

.bar{height:5px;border-radius:4px;background:var(--line);margin-top:9px;overflow:hidden}
.bar i{display:block;height:100%;background:var(--a,var(--c0));border-radius:4px}
.ic{flex:none;vertical-align:-3px}
nav button .ic{margin-right:5px;vertical-align:-4px;opacity:.75}
nav button.on .ic{opacity:1}
.card h2 .ic{margin-right:2px}
button.act .ic{margin-right:5px}
.item h3 .ic{margin-right:4px;opacity:.8}
.pick{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 4px}
.pick button{background:var(--card2);border:1px solid var(--line);border-radius:10px;
 padding:9px 13px;font-size:14.5px;color:var(--dim);cursor:pointer;text-align:left;transition:.15s;
 display:flex;flex-direction:column;gap:2px;min-width:96px}
.pick button:hover{border-color:var(--dim2);color:var(--ink)}
.pick button.on{background:var(--a,var(--c0));color:var(--onkey);border-color:transparent;font-weight:700}
.pick button small{font-size:12px;opacity:.72;font-weight:500}
.pick button.done::after{content:'있어요';font-size:11.5px;opacity:.55}
.pick button.gap::after{content:'아직 없어요';font-size:11.5px;color:var(--c2);font-weight:700}
.pick button.on::after{opacity:.7;color:inherit}
.fld2{margin:0 0 13px}
.fld2>b{display:block;font-size:14px;font-weight:700;color:var(--dim);margin:0 0 6px}
.q{display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;
 border-radius:50%;background:var(--card2);color:var(--dim);font-size:12.5px;font-weight:700;
 cursor:pointer;border:1px solid var(--line);vertical-align:1px;margin-left:6px;flex:none;
 transition:.15s;user-select:none}
.q:hover{background:var(--a,var(--c0));color:var(--onkey);border-color:transparent}
.hp h3{margin:18px 0 6px;font-size:15.5px;font-weight:750;color:var(--ink)}
.hp h3:first-child{margin-top:0}
.hp p{margin:0 0 9px;color:var(--dim);font-size:15px;line-height:1.8}
.hp b{color:var(--ink)}
.hp table{width:100%;border-collapse:collapse;margin:4px 0 12px;font-size:14.5px}
.hp td{padding:7px 10px;border-bottom:1px solid var(--line);color:var(--dim);vertical-align:top}
.hp td:first-child{color:var(--ink);font-weight:600;white-space:nowrap;width:1%}
.hp ul{margin:0 0 10px;padding-left:19px;color:var(--dim);font-size:15px;line-height:1.85}
.hp code{background:var(--card2);border-radius:5px;padding:2px 6px;font-size:14px;color:var(--c0)}
.hp .note{background:var(--card2);border-radius:10px;padding:12px 14px;margin:0 0 12px;
 font-size:14.5px;color:var(--dim);line-height:1.8;border-left:3px solid var(--a,var(--c2))}
.steps{counter-reset:s}
.step{background:var(--card);border-radius:16px;padding:20px 22px 22px;margin-bottom:12px;
 position:relative;overflow:hidden;display:flex;gap:18px}
.step::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--a)}
.step .num{flex:none;width:40px;height:40px;border-radius:12px;background:var(--a);color:var(--onkey);
 font-size:19px;font-weight:800;display:flex;align-items:center;justify-content:center;
 font-variant-numeric:tabular-nums}
.step.done .num{background:var(--card2);color:var(--c0);font-size:20px}
.step.wait{opacity:.5}
.step.wait .num{background:var(--card2);color:var(--dim2)}
.step .bd{flex:1;min-width:0}
.step h3{margin:0 0 3px;font-size:17px;font-weight:750}
.step .sub{margin:0 0 12px}
.step.done .bd .fld,.step.done .grid2{display:none}
.stepbar{display:flex;gap:5px;margin:0 0 18px}
.stepbar i{flex:1;height:5px;border-radius:3px;background:var(--line)}
.stepbar i.on{background:var(--c0)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
/* 오른쪽 창에는 옆에 대화창이 있다. 칠 곳이 두 곳이면 원장님은 매번 "어디에 쓰지" 를
   판단하셔야 한다. 그래서 화면의 입력칸은 접고, "왼쪽에 말씀하세요" 를 앞에 낸다.
   **지우는 게 아니라 접는 것**이다 — 아이콘(BlogStudio)으로 여시면 대화창이 없으므로
   이 규칙이 안 걸리고 지금 그대로 다 보인다. */
.tochat{display:none}
body.pane .tochat{display:flex;align-items:center;gap:8px;flex-wrap:wrap;
 padding:0;margin:7px 0 2px;background:none;border:0;
 font-size:13.5px;color:var(--dim);order:2}
body.pane .tochat b{color:var(--dim);font-weight:600}
/* 입력칸이 먼저, 채팅 안내가 뒤.
   .tochat 과 .chatty 는 여섯 군데에서 형제로 나온다. 부모가 카드마다 달라서
   부모에 이름을 붙이는 대신 **차례(order)로 세운다.** 마크업 여섯 군데를
   손대는 것보다 되돌리기 쉽다. */
body.pane .tochat{order:2}
body.pane .chatty{order:1}
/* .tochat 을 **직접 품은 것**을 집는다. 부모가 카드마다 달라서(.card·.bd·#heroAsk)
   하나씩 이름을 적었더니 한 곳이 빠졌다. 나머지 아이들은 order 가 0 이라
   저절로 맨 위에 남는다 — 제목에 따로 규칙을 줄 필요가 없다. */
body.pane *:has(> .tochat){display:flex;flex-direction:column}
/* 화면에서 칠 수 있는데 "여기에 적을게요" 를 또 누르시게 하면 안 된다 */
body.pane .tochat .act{display:none}
body.pane .tochat .t{flex:1;min-width:180px;font-size:15px;line-height:1.55}
/* 전에는 오른쪽 창에서 화면 입력칸을 **접고** "왼쪽 대화창에 말씀하세요" 를
   앞에 냈다. 칠 곳이 두 곳이면 헷갈리신다는 이유였는데, 초보이신 분께는
   **"채팅을 써야 하나 보다"** 로 읽혔다. 화면만으로 일곱 단계가 다 되는데도
   그렇다. 화면이 기준이고 채팅은 하고 싶으실 때 쓰시는 통로다. 순서를 뒤집는다.
   화면 입력칸을 먼저 펴 두고, 채팅은 **한 줄 안내**로 옆에 둔다. */
body.pane .chatty{display:flex;flex-wrap:wrap;gap:8px}
body.pane .chatty.open{display:flex}
@media(max-width:620px){.grid2{grid-template-columns:1fr}.step{flex-direction:column;gap:12px}}
/* 클로드코드 오른쪽 창은 브라우저 창보다 훨씬 좁다. /스튜디오 로 여시면 이게 기본 폭이다.
   그대로 두면 학원 이름이 세 줄로 접히고 차림표가 아래로 밀려서, 첫 화면의 절반을
   머리글이 먹는다. 좁을 땐 이름을 한 줄로 줄이고 부제(AW BLOGSTUDIO)는 감춘다. */
@media(max-width:900px){
 .hwrap{gap:8px;padding:11px 0}
 .brand b{font-size:15.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40vw;display:block}
 .brand span{display:none}
 nav{gap:0}
 nav button{padding:7px 8px;font-size:14px}
 .hero{padding:20px 16px 18px}
 .hero h2{font-size:20.5px;letter-spacing:-.4px}
 .hero p{font-size:14.5px}
 main{padding:0 12px}
 .card{padding:16px 15px}
 .body{padding:14px 13px;font-size:15.5px}
 .askrow{flex-direction:column}
 .askrow input{width:100%}
 footer{flex-direction:column;gap:5px}
}

/* 420px 아래에서는 차림표 넷이 한 줄에 못 들어가 두세 줄로 감긴다. 그러면 학원
   이름이 세로 가운데에 붕 뜨고 잘려서, 고장난 것처럼 보인다. 첫 화면 세로 90px을
   머리글이 먹는데 그 창은 원래 세로가 짧다.
   좁을 땐 **이름 한 줄 · 차림표 한 줄** 로 눕힌다. 감기는 게 아니라 눕는 것이라
   모양이 일정하다. 아이콘은 감춘다 — 글자만으로 뜻이 통하고, 아이콘 자리를
   빼야 넷이 한 줄에 들어간다. */
@media(max-width:560px){
 .hwrap{flex-direction:column;align-items:stretch;gap:9px;padding:10px 0}
 .brand{justify-content:flex-start}
 .brand b{max-width:none;font-size:16px}
 nav{margin-left:0;flex-wrap:nowrap;gap:2px}
 nav{justify-content:space-between}
 nav button{flex:0 1 auto;padding:7px 6px;font-size:13px;white-space:nowrap}
 nav button .ic{display:none}
}
.fld{display:block;margin-bottom:10px}
.fld b{display:block;font-size:14px;font-weight:700;color:var(--dim);margin-bottom:5px}
.drop{border:2px dashed var(--line);border-radius:14px;padding:30px 20px;text-align:center;
 background:var(--card2);transition:.15s;cursor:pointer}
.drop:hover{border-color:var(--dim2)}
.drop.over{border-color:var(--c0);background:var(--keysoft)}
.drop b{display:block;font-size:16px;font-weight:700;margin-bottom:5px}
.drop span{font-size:14.5px;color:var(--dim)}
.drop .ico{font-size:26px;line-height:1;margin-bottom:10px;display:block;opacity:.55}
body.dragging::after{content:'여기에 놓으시면 바로 들어가요';position:fixed;inset:14px;
 border:3px dashed var(--c0);border-radius:20px;background:rgba(247,244,239,.94);z-index:70;
 display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:var(--c0)}
.flist{margin-top:12px}
.empty{color:var(--dim2);text-align:center;padding:30px 0;font-size:15.5px}
.hide{display:none}
.toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:var(--card2);
 color:var(--ink);border:1px solid var(--line);padding:12px 20px;border-radius:26px;font-size:15px;
 opacity:0;transition:.2s;pointer-events:none;z-index:60;box-shadow:0 8px 28px rgba(0,0,0,.5)}
.toast.on{opacity:1}
.spin{display:inline-block;width:13px;height:13px;border:2px solid var(--line);border-top-color:var(--c0);
 border-radius:50%;animation:s .7s linear infinite;vertical-align:-2px}
@keyframes s{to{transform:rotate(360deg)}}
.modal{position:fixed;inset:0;background:rgba(6,7,9,.72);display:flex;align-items:center;
 justify-content:center;z-index:50;padding:20px;backdrop-filter:blur(3px)}
.modal>div{background:var(--card);border-radius:18px;max-width:800px;width:100%;max-height:86vh;
 overflow:auto;padding:24px 26px;border:1px solid var(--line)}
.split{border-top:1px solid var(--line);margin-top:15px;padding-top:16px}
a{color:var(--c1)}
</style>

<header><div class="hwrap">
  <div class="brand"><b id="brand">블로그 스튜디오</b><span>AW BLOGSTUDIO</span></div>
  <nav role="tablist" aria-label="화면 고르기">
    <button data-t="start" class="on" aria-current="page">시작</button>
    <button data-t="write">글쓰기</button>
    <button data-t="learn">자료와 배운 것</button>
    <button data-t="help">도움과 설정</button>
  </nav>
</div></header>

<!-- 재방문 사용자에게 "오늘 여기서 다시 시작하시면 돼요" 를 먼저 말한다.
     아래 시작 탭 카드가 그 다음 한 걸음을 정해준다 -->
<div class="hero"><div class="in">
  <h2 id="heroTitle">오늘 블로그 글, 여기서 다시 시작하세요</h2>
  <p>지난번 하시던 곳부터 이어가시거나, 새 글을 바로 시작하실 수 있어요.</p>
  <div id="heroAsk">
    <div class="tochat"><span class="t">왼쪽 대화창에 <b>말씀하셔도 돼요.</b> 예) 중2 서술형 감점으로 글 써줘</span>
      <button class="act ghost sm" onclick="openChatty(this)">여기에 적을게요</button></div>
    <div class="askrow chatty">
      <input id="ask" placeholder="예) 중2 서술형 감점으로 글 써줘">
      <button class="act" onclick="ask()">시작</button>
    </div>
  </div>
  <div class="quick" id="heroQuick"></div>
</div></div>

<main>
  <!-- 시작 — 재방문했을 때 "지금 뭘 하면 되는지" 하나만 보여준다 -->
  <section id="start">
    <div id="startMain"></div>
  </section>
  <!-- 글쓰기 — 주제 적기부터 완성글까지 -->
  <section id="write" class="hide">
    <div id="writeMain"></div>
    <div id="topics"></div>
    <div id="posts"></div>
  </section>
  <!-- 자료와 배운 것 — 넣는 곳과 반영된 결과 -->
  <section id="learn" class="hide">
    <div id="inputMain"></div>
    <div id="mat"></div>
    <div id="learned"></div>
  </section>
  <!-- 도움과 설정 — 상태 진단이 주역, 나머지는 접어둔다 -->
  <section id="help" class="hide">
    <div id="settingMain"></div>
    <div id="about"></div>
  </section>
</main>

<footer>
  <span>© ANDYWIKI · 저작권자 ANDYWIKI · <b id="ver">v?</b></span>
  <span>수강생 본인의 학원 운영 목적으로만 써주세요</span>
</footer>

<div class="toast" id="toast" role="status" aria-live="polite" aria-atomic="true"></div>
<script>
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
/* 작업 감시(jobPoll)와 화면 갱신(syncPoll)은 **다른 일**이라 변수를 따로 쓴다.
   전에는 하나였다. 그래서 진행 창을 닫으면 clearInterval 만 하고 값을 0 으로 안 되돌려,
   "작업 중" 으로 굳은 채 **화면 자동 갱신이 영영 멈췄다.** 외부 감사가 잡았다. */
let S={},P=[],M={},T=[],jobPoll=0,syncPoll=0;
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),2000)};
/* 만들다 만 기능은 원장님께 안 보여드린다.
   보이면 되는 기능으로 여기고 눌러보시고, 안 되면 고장난 프로그램이 된다.
   기준은 04_Package/기능.json 하나다. 서버가 판정해서 내려준다. */
const 켜짐=k=>!!(S.켜진기능&&S.켜진기능[k]);
const api=async(p,o)=>{
  try{
    const r=await fetch(p,o&&{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(o)});
    let d={}; try{d=await r.json()}catch(e){}
    if(!r.ok&&!d.error)d.error=r.status===404?'그 기능을 못 찾았어요 ('+p+')':'안 됐어요 ('+r.status+')';
    return d;
  }catch(e){ return {error:'프로그램과 연결이 끊겼어요. 창을 닫고 다시 열어주세요'} }
};
/* 눌러서 뭔가 시키는 단추는 전부 이걸로 부른다. 실패하면 반드시 말한다 */
/* 사라지는 알림(2초)은 놓치기 쉽다. **고칠 수 있는 오류는 남겨둔다.**
   원장님이 자리를 비우신 사이에 떴다 사라지면 무엇이 잘못됐는지 알 길이 없다. */
/*
 * **일이 도는 동안에는 다른 단추를 눌러도 소용이 없다.**
 *
 * 서버가 409 로 막긴 하는데, 원장님은 **누르고 나서야** 안 된다는 걸 아신다.
 * 눌러도 안 되는 단추를 그대로 두면 "고장났나" 하신다.
 * 도는 동안에는 눌러도 뜻이 없는 것들을 흐리게 하고 못 누르게 한다.
 *
 * 멈추기·닫기·보기 같은 것은 **막으면 안 된다** — 그때 제일 필요한 단추다.
 */
function 도는중잠그기(도나){
  document.body.classList.toggle('돈다', !!도나);
  $$('button').forEach(function(b){
    const t=(b.textContent||'').trim();
    /* **탭은 절대 막지 않는다.** 막으면 도는 동안 진행 상황을 보러
       가실 수도, 지난 글을 읽으실 수도 없다. 화면 안에 갇히신다. */
    if(b.closest('nav'))return;
    /* 멈추는 길과 보는 길도 열어둔다 — 그때 제일 필요한 단추다 */
    if(/멈추|닫기|알겠|나중에|취소|보기|복사|자세히|고친 글|알려주기/.test(t))return;
    if(b.closest('.modal'))return;
    if(도나){ if(!b.disabled){ b.disabled=true; b.dataset.잠금='1'; } }
    else if(b.dataset.잠금==='1'){ b.disabled=false; delete b.dataset.잠금; }
  });
}

function 오류띠(말){
  let b=$('#errbar');
  if(!말){ if(b)b.remove(); return }
  if(!b){ b=document.createElement('div'); b.id='errbar'; b.setAttribute('role','alert');
    b.style.cssText='position:sticky;top:0;z-index:55;background:var(--bad);color:var(--onkey);'
      +'padding:11px 14px;font-size:14.5px;font-weight:600;display:flex;gap:10px;'
      +'align-items:center;justify-content:center;flex-wrap:wrap';
    document.body.insertBefore(b, document.body.firstChild) }
  b.innerHTML='<span>'+esc(말)+'</span>'
    +'<button class="act ghost sm" style="min-height:34px;padding:6px 12px" '
    +'onclick="오류띠(\'\')">알겠어요</button>';
}

async function post(path,body,okMsg){
  const r=await api(path,body||{});
  if(r&&r.error){오류띠(r.error);return null}
  if(okMsg)toast(okMsg);
  return r;
}
const esc=s=>(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const copy=async(t,m)=>{await navigator.clipboard.writeText(t);toast(m||'복사했어요')};

// 마크다운을 읽기 좋게 그린다. 원장님이 드래그해도 기호가 안 딸려간다
function render(md){
  return esc(md)
    .replace(/^#{1,6}\s*(.+)$/gm,'<b class="h">$1</b>')
    .replace(/^\s*&gt;\s?(.+)$/gm,'<span class="q">$1</span>')
    .replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')
    .replace(/^\s*[-–—]{3,}\s*$/gm,'<hr>')
    .replace(/\[사진 자리([^\]]*)\]/g,'<span class="photo">📷 사진 자리$1</span>')
    .replace(/(#[가-힣A-Za-z0-9_]+(?:\s+#[가-힣A-Za-z0-9_]+)+)/g,'<span class="tags">$1</span>');
}

/* 창(모달)은 화면을 덮는다. 그래서 세 가지를 지켜야 한다.
   1) 이게 창이라는 걸 알려야 한다 — role="dialog" aria-modal
   2) 탭이 창 밖으로 새 나가면 안 된다. 뒤에 가려진 단추로 넘어가면
      원장님은 안 보이는 것을 누르시게 된다
   3) 닫으면 **원래 있던 자리로 초점을 돌려놔야** 한다. 안 그러면 맨 위로 튄다
   전에는 셋 다 없었다. */
function modal(html){
  const 돌아갈곳=document.activeElement;
  const d=document.createElement('div'); d.className='modal';
  d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true');
  d.innerHTML='<div tabindex="-1">'+html+'</div>';
  d.onclick=e=>{if(e.target===d)closeModal()};
  d._돌아갈곳=돌아갈곳;
  document.body.appendChild(d);
  const 안=()=>[...d.querySelectorAll('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')]
    .filter(x=>!x.disabled&&x.offsetParent!==null);
  (안()[0]||d.firstElementChild).focus();
  d.addEventListener('keydown',function(e){
    if(e.key!=='Tab')return;
    const f=안(); if(!f.length)return;
    const 처음=f[0], 마지막=f[f.length-1];
    if(e.shiftKey&&document.activeElement===처음){e.preventDefault();마지막.focus()}
    else if(!e.shiftKey&&document.activeElement===마지막){e.preventDefault();처음.focus()}
  });
  return d;
}
function closeModal(){
  const m=$$('.modal'); if(!m.length)return;
  const d=m[m.length-1]; const 돌아갈곳=d._돌아갈곳;
  d.remove();
  if(돌아갈곳&&document.contains(돌아갈곳))돌아갈곳.focus();
}
addEventListener('keydown',function(e){if(e.key==='Escape')closeModal()});
/* 글쓰기 다섯 단계 — 에이전트가 남기는 산출물과 1:1 이다.
   원장님께는 "topic-scout 실행 중" 이 아니라 사람 말로 보여드린다 */
var STEPS=[['1_기획','주제 정리 중'],['2_목차','글 순서 잡는 중'],['3_조사','필요한 내용 찾는 중'],
           ['4_초안','초안 쓰는 중'],['5_윤문','말투 다듬는 중']];
/* 로그 어디까지 왔는지로 지금 단계를 짚는다. 뒤에서부터 찾으면 가장 앞선 단계가 잡힌다 */
function stepOf(out){
  const t=String(out||'');
  for(let i=STEPS.length-1;i>=0;i--) if(t.includes(STEPS[i][0])) return i+1;
  return 0;
}
/* 원장님이 20~30분 동안 보시는 화면이다. 계기판이 아니라 **얼굴**이어야 한다 —
   지금 무엇을 하고 있는지, 어디까지 왔는지, 막혔으면 어디서 막혔는지.
   stopped 를 주면 그 단계가 멈춘 자리로 표시된다.

   전에는 현재 단계 색으로 var(--fg) 를 썼는데 **그런 토큰이 없다.**
   색이 아예 안 먹어서 지금 단계가 나머지와 구별되지 않았다. */
/* 이번에 몇 단계까지 가는가.
   한번보기 는 1단계에서 멈춰 여쭙는다. 그런데 화면이 다섯 단계를 그려놓고 1에서 끝나면
   **원장님은 고장난 줄 아신다.** 갈 데까지만 그린다. */
function 멈추는단계(){ return MODE==='한번보기'?1:MODE==='꼼꼼히'?2:5 }

function stepBar(n,total,stopped){
  return '<div style="margin:14px 0 4px">'+STEPS.slice(0,total).map(function(s,i){
    const done=i<n-1, now=i===n-1&&!stopped, halt=i===n-1&&stopped;
    const label=done?'완료':halt?'멈춤':now?'진행 중':'대기';
    return '<div style="display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:9px;'+
      'background:'+(now?'var(--keysoft)':halt?'rgba(176,69,58,.10)':'transparent')+'">'+
      '<span style="flex:none;width:18px;height:18px;border-radius:50%;display:flex;'+
      'align-items:center;justify-content:center;font-size:11.5px;'+
      (done?'background:var(--c0);color:var(--onkey)'
        :halt?'background:var(--bad);color:var(--onkey)'
        :now?'border:2px solid var(--c0)':'border:1px solid var(--dim2)')+'">'+
      (done?'✓':halt?'!':'')+'</span>'+
      '<span style="flex:1;font-size:15px;font-weight:'+(now||halt?700:500)+';'+
      'color:'+(now||halt?'var(--ink)':done?'var(--dim)':'var(--dim2)')+'">'+s[1]+'</span>'+
      (now?'<span class="spin"></span>':'')+
      '<span style="flex:none;font-size:12.5px;padding:3px 8px;border-radius:999px;'+
      (now?'background:var(--c0);color:var(--onkey)'
        :halt?'background:var(--bad);color:var(--onkey)'
        :done?'background:var(--card2);color:var(--dim)'
        :'background:transparent;color:var(--dim2)')+'">'+label+'</span></div>'
  }).join('')+'</div>';
}
/* 다 됐을 때 알려드린다. 20~30분을 화면 앞에서 기다리실 이유가 없다.
   소리는 안 낸다 — 밤 늦게 쓰시는 분이 많다 */
/* 다 됐을 때 어떻게 알려드리는가 — **세 가지가 다르다.**
 *
 * ① 오른쪽 창: 브라우저 알림이 **막혀 있다** (권한이 denied 로 나온다).
 *    전에는 "왼쪽 대화창이 알려준다" 고 적어뒀는데 **그건 채팅에서 시작하셨을
 *    때만 맞다.** 화면 단추로 누르시면 claude -p 라는 **딴 프로세스**가 도는
 *    것이라 왼쪽 대화창은 그 일을 아예 모른다. 끝나도 아무 말 안 한다.
 *    그래서 이제 **이 화면이 알려드린다** 고 말한다 — 1.5초마다 보고 있으니
 *    그건 사실이다. 창을 닫으셔도 일은 계속 되고, 돌아오시면 여기 있다.
 * ② 아이콘 모드 + 알림 허용: 화면을 안 보고 계셔도 OS 알림이 뜬다.
 * ③ 아이콘 모드 + 알림 거부/미허용: **아무것도 안 뜬다.**
 *
 * 전에는 셋 다 "끝나면 알려드릴게요" 라고 했다. ①③ 에서는 거짓말이다.
 * 그래서 탭 제목을 바꾸는 것을 **어디서나 되는 바닥**으로 깔았다 —
 * 다른 탭에 계셔도 제목만 보면 안다. */
function 알림가능(){
  try{ return ('Notification' in window) && Notification.permission==='granted' }catch(e){ return false }
}
function notifyDone(ok,label){
  // 탭 제목 — 권한이 없어도 되는 유일한 방법
  try{
    const 원래=document.title.replace(/^[✅⚠] /,'');
    document.title=(ok?'✅ ':'⚠ ')+원래;
    addEventListener('focus',function 되돌리기(){ document.title=원래; removeEventListener('focus',되돌리기) });
  }catch(e){}
  try{
    if(!알림가능())return;
    new Notification(ok?'글이 다 됐어요':'중간에 막혔어요',
      {body:label||'블로그 스튜디오',silent:true});
  }catch(e){}
}
function askNotify(){
  try{
    if(!('Notification' in window))return;
    if(Notification.permission==='default')Notification.requestPermission();
  }catch(e){}
}
async function runPrompt(prompt,label){
  도는중잠그기(true);
  askNotify();
  const 글쓰기=/^\/글쓰기/.test(prompt);
  modal('<h2 style="margin:0 0 4px;font-size:16px">'+esc(label||prompt)+'</h2>'+
    '<p class="sub">'+(글쓰기
      ? '글을 쓰고 있어요. <b>보통 20~30분 걸려요.</b><br>'
        + '담당이 다섯 번 나눠서 맡아요 — 주제 고르고, 순서 잡고, 근거 찾고, 쓰고, 다듬어요.<br>'
        + '마지막 검수는 담당이 아니라 프로그램이 해요 — 그래서 아래 진행 표시가 다섯 칸이에요.'
      : '지금 하고 있어요. 3~5분쯤 걸려요.')+'<br>'+
    (document.body.classList.contains('pane')
      ? '<b>기다리시는 동안 다른 일 하셔도 돼요.</b> 다 되면 <b>이 화면에 바로</b> 나와요.<br>'
        + '이 창을 닫으셔도 일은 계속 돼요. 돌아오시면 여기 그대로 있어요.'
      : 알림가능()
        ? '<b>이 창을 열어두지 않으셔도 돼요.</b> 다 되면 컴퓨터 알림으로 알려드려요.'
        : '<b>이 창을 켜두시면</b> 다 되는 걸 바로 보실 수 있어요. 창 제목에도 표시해드려요.')+'</p>'+
    (글쓰기?'<div id="runSteps">'+stepBar(1,멈추는단계())+'</div>':'')+
    '<p class="sub" id="runElapsed" style="margin:6px 0 0"></p>'+
    '<details style="margin-top:10px"><summary style="cursor:pointer;font-size:14px;color:var(--dim)">자세히 보기</summary>'+
    '<pre class="term" id="runOut" style="margin-top:8px"><span class="spin"></span> 시작해요…</pre></details>'+
    '<div class="row" style="margin-top:12px">'+
    /* "닫기" 는 작업을 멈추는 것처럼 읽힌다. 실제로는 창만 닫히고 클로드는 계속 쓴다.
   그리고 창을 닫아도 화면 자동 갱신이 이어지므로 진행 상황은 오른쪽 카드에 계속 보인다 */
    '<button class="act ghost sm" onclick="this.closest(\'.modal\').remove()">진행창만 닫기</button>'+
    '<button class="act ghost sm hide" id="stopBtn" style="color:var(--c6)">'+ic('stop')+'멈추기</button></div>');
  const r=await api('/api/run',{prompt});
  if(r.error){$('#runOut').textContent=r.error;return}
  const sb=$('#stopBtn');
  if(sb){sb.classList.remove('hide');
    sb.onclick=async function(){ await api('/api/stop',{id:r.id}); toast('멈췄어요') }}
  멈춤(jobPoll); jobPoll=setInterval(async()=>{
    const j=await api('/api/job?id='+r.id);
    const el=$('#runOut'); if(!el)return jobPoll=멈춤(jobPoll);
    el.textContent=j.out||'하고 있어요…';
    el.scrollTop=el.scrollHeight;
    const st=$('#runSteps'); if(st)st.innerHTML=stepBar(Math.max(1,stepOf(j.out)),멈추는단계());
    const ela=$('#runElapsed');
    if(ela&&!j.done)ela.textContent=j.secs+'초 지났어요';
    if(j.done){
      jobPoll=멈춤(jobPoll);
      // 막혔으면 마지막 단계를 '멈춤' 으로 굳혀서 어디였는지 남긴다
      if(!j.ok&&st)st.innerHTML=stepBar(Math.max(1,stepOf(j.out)),멈추는단계(),true);
      if(!j.ok&&ela)ela.textContent='여기서 멈췄어요. 다시 눌러주시면 이어서 해요.';
      toast(j.ok?'다 됐어요':'중간에 막혔어요');
      notifyDone(j.ok,label||prompt);
      await load();
      if(j.ok&&/^\/정리/.test(prompt)){
        closeModal(); goTo('learn','mat'); toast('정리한 내용을 한 번만 확인해주세요');
      } else if(j.ok&&글쓰기){ closeModal(); goTo('write','posts') }
    }
  },1500);
}
function ask(){
  const v=$('#ask').value.trim();
  if(!v)return toast('무엇을 할지 적어주세요');
  $('#ask').value=''; runPrompt(v,v);
}
const LBL={'/제안':'제안 받는 중','/정리':'자료 정리 중','/점검':'점검 중','/시작':'학원 정보 채우기'};
const qk=c=>runPrompt(c,LBL[c]||c);
$('#ask').addEventListener('keydown',e=>{if(e.key==='Enter')ask()});

/* 이 아래는 전부 읽을거리다 — 기능이 아니다.
   원장님은 설정을 자주 안 만지신다. 열두 칸을 늘 펼쳐두면 필요한 걸 못 찾으신다.
   지우지는 않는다. 접어둘 뿐이다. */
function drawAbout(v){
  const 변경=(v&&v.변경)||[];
  $('#about').innerHTML=
  '<details class="fold"><summary>'+ic('about')+'이 프로그램을 더 알고 싶으시면</summary><div>'+
  '<div class="card" style="--a:var(--c0)"><h2>'+ic('about')+'이 프로그램이 하는 일</h2>'+
    '<p class="sub">학원 블로그 글을 <b>원장님 말투로</b> 씁니다. 쓸수록 원장님 글에 가까워져요.</p>'+
    '<table style="width:100%;border-collapse:collapse;font-size:15px">'+
    [['글을 쓴다','주제 한 줄이면 20~30분 만에 한 편'],
     ['말투를 배운다','고치신 걸 알려주시면 다음 글에 반영해요'],
     ['반복을 막는다','같은 사례, 같은 형식, 같은 문장이 겹치지 않게'],
     ['법을 지킨다','"최고", "성적 보장" 같은 표현을 막아요'],
     ['글감을 찾는다','요즘 학부모가 뭘 궁금해하는지 웹에서 가져와요']]
    .map(function(r,i){return '<tr><td style="padding:8px 10px;border-bottom:1px solid var(--line);'+
      'color:var(--c'+(i%7)+');font-weight:700;white-space:nowrap">'+r[0]+'</td>'+
      '<td style="padding:8px 10px;border-bottom:1px solid var(--line);color:var(--dim)">'+r[1]+'</td></tr>'}).join('')+
    '</table></div>'+
  '<div class="card" style="--a:var(--c1)"><h2>지금 쓰시는 판</h2>'+
    '<div class="stat" style="margin-bottom:14px"><div>버전<b style="font-size:26px">'+esc((v&&v.버전)||'?')+'</b></div>'+
    '<div>나온 날<b style="font-size:20px">'+esc((v&&v.날짜)||'-')+'</b></div></div>'+
    (변경.length?'<h3 style="margin:0 0 6px;font-size:15.5px">이번 판에서 달라진 것</h3>'+
      '<ul style="margin:0;padding-left:19px;color:var(--dim);font-size:15px;line-height:1.9">'+
      변경.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>':'')+
    '</div>'+
  '<div class="card" style="--a:var(--c2)"><h2>업데이트는 이렇게 와요</h2>'+
    '<p class="sub">만든 사람이 업데이트 파일을 보내드리면 <b>자료 넣기 화면에 끌어다 놓기만</b> 하시면 돼요.</p>'+
    '<table style="width:100%;border-collapse:collapse;font-size:15px">'+
    [['바뀌는 것','글쓰기 방법, 검수 규칙, 지식 파일, 화면'],
     ['안 바뀌는 것','학원 정보, 사례, 쓰신 글, 배운 말투 — <b>절대 안 건드려요</b>'],
     ['같이 오는 것','새 글감이 실려 오기도 해요. 있던 글감은 안 지워요'],
     ['되돌리기','이전 판은 .이전버전 폴더에 남아요']]
    .map(function(r){return '<tr><td style="padding:8px 10px;border-bottom:1px solid var(--line);'+
      'color:var(--ink);font-weight:600;white-space:nowrap">'+r[0]+'</td>'+
      '<td style="padding:8px 10px;border-bottom:1px solid var(--line);color:var(--dim)">'+r[1]+'</td></tr>'}).join('')+
    '</table>'+
    '<div class="row" style="margin-top:13px"><button class="act ghost" onclick="go(\'learn\')">업데이트 넣으러 가기</button></div></div>'+
  '<div class="card" style="--a:var(--c5)"><h2>원장님 자료는 어디 있나요</h2>'+
    '<p class="sub"><b>이 컴퓨터에만</b> 저장돼요. 저희 서버는 없어요.<br>'+
    '로그인도 비밀번호도 없어요. 다른 사람 자료와 섞일 일이 없어요.<br>'+
    '그래서 <b>컴퓨터가 바뀌면 그대로 사라져요.</b> 가끔 묶어서 옮겨두세요.</p>'+
    '<p class="sub" style="margin-top:9px">다만 <b>글을 쓰는 동안에는</b> 그 글에 쓰이는 '+
    '학원 정보와 사례가 글 쓰는 AI(Claude)로 전송돼요. 인터넷이 필요한 이유예요.<br>'+
    '학생 이름·학교명은 <b>사례로 옮길 때 미리 가려요.</b> 그래도 주민번호·계좌번호 같은 건 '+
    '애초에 넣지 마세요.</p>'+
    '<div class="row"><button class="act" onclick="doExport()">'+ic('backup')+'지금 묶어두기</button></div></div>'+
  '<div class="card" style="--a:var(--c4)"><h2>집과 학원 두 곳에서 쓰려면</h2>'+
    '<p class="sub">이 폴더를 <b>드롭박스·구글드라이브·iCloud</b> 안에 두시면 양쪽에서 쓰실 수 있어요.<br>'+
    '프로그램과 자료가 한 폴더에 다 들어 있어서 그대로 따라가요.</p>'+
    '<table style="width:100%;border-collapse:collapse;font-size:15px">'+
    [['양쪽에 필요한 것','Node.js와 Claude Code. 각 컴퓨터에 한 번씩 설치해주세요'],
     ['꼭 지킬 것','<b>동시에 켜지 마세요.</b> 글과 사례가 꼬여요'],
     ['자동 확인','다른 곳에서 켜져 있으면 저희가 알려드려요'],
     ['옮기고 나서','동기화가 끝난 다음 여시면 안전해요']]
    .map(function(r){return '<tr><td style="padding:8px 10px;border-bottom:1px solid var(--line);'+
      'color:var(--ink);font-weight:600;white-space:nowrap">'+r[0]+'</td>'+
      '<td style="padding:8px 10px;border-bottom:1px solid var(--line);color:var(--dim)">'+r[1]+'</td></tr>'}).join('')+
    '</table></div>'+
  '<div class="card" style="--a:var(--c6)"><h2>안 되는 게 있으세요?</h2>'+
    '<p class="sub">자료 넣기 화면 맨 아래에서 알려주실 수 있어요. 보내기 전에 무엇이 가는지 보여드리고, 고치실 수 있어요.</p>'+
    '<div class="row"><button class="act ghost" onclick="go(\'learn\')">알려주러 가기</button></div></div>'+
  '<div class="card"><h2 class="plain">저작권</h2>'+
    '<p class="sub">© ANDYWIKI. 이 프로그램의 저작권은 ANDYWIKI에 있어요.<br>'+
    '수강생 본인의 학원 운영 목적으로만 써주세요.<br>'+
    '폴더를 다시 나눠주시거나 고쳐 쓰시는 건 안 돼요.</p></div>'+
  '</div></details>';
}

/* 클라우드 폴더에 두시고 두 곳에서 동시에 켜면 자료가 꼬인다 */
async function checkLock(){
  const r=await api('/api/lock');
  if(r&&r.conflict){
    modal('<h2 class="plain" style="margin:0 0 4px;font-size:18px;color:var(--c2)">다른 컴퓨터에서도 켜져 있어요</h2>'+
      '<p class="sub"><b>'+esc(r.other)+'</b> 에서 조금 전까지 쓰고 계셨어요.<br>'+
      '두 곳에서 동시에 쓰시면 <b>쓰신 글과 사례가 꼬일 수 있어요.</b><br>'+
      '클라우드 폴더(드롭박스·구글드라이브 등)에 두셨다면 <b>한 곳에서만</b> 열어주세요.</p>'+
      '<div class="note" style="--a:var(--c2);background:var(--card2);border-radius:10px;padding:12px 14px;'+
      'margin:12px 0;font-size:14.5px;color:var(--dim);border-left:3px solid var(--c2)">'+
      '저쪽 창을 닫으셨다면 그냥 쓰셔도 돼요. 10분 지나면 이 안내가 안 떠요.</div>'+
      '<div class="row"><button class="act" onclick="closeModal()">알겠어요</button></div>');
  }
  setTimeout(checkLock,5*60*1000);
}

async function loadVersion(){
  const v=await api('/api/version');
  FORM_URL=v.오류보고||''; FORM_FIELD=v.오류보고칸||'entry.1';
  const el=$('#ver'); if(el)el.textContent='v'+(v.버전||'?');
  const n=$('#verNow'); if(n)n.textContent='지금 '+(v.버전?'v'+v.버전:'버전 모름')+'을 쓰고 계세요';
  drawAbout(v);
  if(!LOCKED){LOCKED=true;checkLock()}
}
/* 오른쪽 창은 **왼쪽 대화의 거울**이어야 한다.
 *
 * 원장님이 채팅에서 글을 쓰시거나 자료를 정리하셔도 오른쪽은 그걸 모른다.
 * 그러면 두 창이 서로 다른 것을 말하게 되고, 어느 쪽이 맞는지 원장님이 판단하셔야 한다.
 * 그게 창이 둘일 때 생기는 진짜 혼란이다 — 입력창 개수가 아니라.
 *
 * 그래서 **돌아올 때마다** 다시 읽는다. 창을 다시 보실 때, 그리고 조용할 때 이따금.
 * 서버는 로컬이고 /api/state 가 15ms 다 (사례 2,000건 기준). 부담이 아니다.
 */
/* 끄고 **0 을 돌려준다.** clearInterval 만 하면 변수에 옛 번호가 남아
   "아직 도는 중" 으로 읽힌다. 그 한 줄 때문에 화면 갱신이 영영 멈췄다 */
function 멈춤(id){ if(id) clearInterval(id); return 0 }

function 거울(){
  addEventListener('visibilitychange',function(){ load() });
  addEventListener('focus',function(){ load() });
  /* document.hidden 을 보면 안 된다.
     클로드코드 **오른쪽 창은 document.hidden === true 로 뜬다** — 백그라운드 렌더로
     취급된다. visibilityState 도 'hidden', hasFocus() 도 false 다. 재봤다.
     그래서 !document.hidden 조건을 걸면 **폴링이 한 번도 안 돈다.**
     오른쪽 창이 주된 쓰임인데 거기서만 안 도는 셈이었다.
     로컬 서버라 /api/state 가 15ms 다. 그냥 돈다. */
  syncPoll=setInterval(function(){ if(!jobPoll) load() }, 15000);
}

/*
 * 연결이 끊겼을 때 **빈 화면을 보여드리지 않는다.**
 *
 * 전에는 api 가 {error:...} 를 돌려주면 그걸 그대로 상태로 삼았다. 그러면
 * 학원 이름도, 사례도, 글도 다 없는 것으로 그려진다. 원장님은 **자료가
 * 날아간 줄 아신다.** 실제로는 프로그램이 잠깐 꺼진 것뿐인데.
 *
 * 그래서 끊기면 (1) 맨 위에 띠를 띄우고 (2) **직전 화면을 그대로 둔다.**
 * 오래된 화면이 없는 화면보다 낫다. 처음 켤 때 끊겼으면 그때만 안내를 그린다.
 */
function 끊김띠(켜기, 말){
  let b=$('#offline');
  if(!켜기){ if(b)b.remove(); return }
  if(!b){ b=document.createElement('div'); b.id='offline'; b.setAttribute('role','alert');
    b.style.cssText='position:sticky;top:0;z-index:60;background:var(--bad);color:var(--onkey);'
      +'padding:9px 14px;font-size:14.5px;font-weight:600;text-align:center';
    document.body.insertBefore(b, document.body.firstChild) }
  b.textContent=말;
}

async function load(){
  const r=await Promise.all([api('/api/state'),api('/api/posts'),api('/api/materials'),api('/api/topics')]);
  const 끊김=r.find(x=>x&&x.error);
  if(끊김){
    끊김띠(true, 끊김.error);
    if(S&&S.name)return;                     // 보시던 화면을 그대로 둔다
    /* 처음 켤 때부터 끊겼으면 빈 탭들만 남는다. 그 위에 안내를 **얹는다.**
       main 을 갈아치우면 다시 연결돼도 그릴 자리가 없어진다 — 한 번 그랬다. */
    if(!$('#offcard')){
      const m=$('main'); if(!m)return;
      const c=document.createElement('div');
      c.id='offcard'; c.className='card'; c.style.cssText='--a:var(--c6)';
      c.innerHTML='<h2>지금은 연결이 안 돼요</h2>'
        +'<p class="sub">원장님 자료는 그대로 있어요. 사라진 게 아니에요.<br>'
        +'프로그램 창(검은 창)이 닫혔을 수 있어요. 다시 열어주시면 이어서 하실 수 있어요.</p>'
        +'<div class="row" style="margin-top:12px">'
        +'<button class="act" onclick="location.reload()">다시 해보기</button></div>';
      m.insertBefore(c, m.firstChild);
    }
    return;
  }
  끊김띠(false);
  const oc=$('#offcard'); if(oc)oc.remove();
  S=r[0];P=r[1];M=r[2];T=r[3];
  // 오른쪽 창이면 화면의 입력칸을 접는다. 서버가 알려준다
  document.body.classList.toggle('pane', !!S.우측창);
  $('#brand').textContent=(S.name?S.name+' ':'')+'블로그 스튜디오';
  document.title=(S.name?S.name+' · ':'')+'블로그 스튜디오';
  drawStart();drawWrite();drawPosts();drawTopics();drawInput();drawMat();drawLearn();drawSetting();
  /* 그린 뒤에 잠근다 — 그리면서 새로 생긴 단추도 같이 막아야 한다 */
  도는중잠그기(!!(S.unfinished&&S.unfinished.도는중));
  loadVersion();
}

function ac(i){return ' style="--a:var(--c'+(i%7)+')"'}

/* 아이콘 — Tabler Icons (MIT). 굵기 하나, 24×24 한 격자.
   CDN 을 안 쓴다. 패키지가 자립해야 하므로 필요한 것만 심어 뒀다.
   stroke 가 currentColor 라서 항목마다 다른 악센트 색을 그대로 따라간다. */
const ICON={
'tab-start':'<path d="M5 12l-2 0l9 -9l9 9l-2 0" /> <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" /> <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />',
'tab-write':'<path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /> <path d="M13.5 6.5l4 4" />',
'tab-posts':'<path d="M14 3v4a1 1 0 0 0 1 1h4" /> <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" /> <path d="M9 9l1 0" /> <path d="M9 13l6 0" /> <path d="M9 17l6 0" />',
'tab-source':'<path d="M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12" /> <path d="M4 13h3l3 3h4l3 -3h3" />',
'tab-setting':'<path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065" /> <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />',
'topic':'<path d="M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7" /> <path d="M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0 -1 3a2 2 0 0 1 -4 0a3.5 3.5 0 0 0 -1 -3" /> <path d="M9.7 17l4.6 0" />',
'harvest':'<path d="M21 12a9 9 0 1 0 -9 9" /> <path d="M3.6 9h16.8" /> <path d="M3.6 15h7.9" /> <path d="M11.5 3a17 17 0 0 0 0 18" /> <path d="M12.5 3a16.984 16.984 0 0 1 2.574 8.62" /> <path d="M15 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /> <path d="M20.2 20.2l1.8 1.8" />',
'propose':'<path d="M8 9h8" /> <path d="M8 13h6" /> <path d="M14.5 18.5l-2.5 2.5l-3 -3h-3a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v4.5" /> <path d="M19 22v.01" /> <path d="M19 19a2.003 2.003 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" />',
'target':'<path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /> <path d="M12 7a5 5 0 1 0 5 5" /> <path d="M13 3.055a9 9 0 1 0 7.941 7.945" /> <path d="M15 6v3h3l3 -3h-3v-3l-3 3" /> <path d="M15 9l-3 3" />',
'copy':'<path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" /> <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />',
'tags':'<path d="M5 9l14 0" /> <path d="M5 15l14 0" /> <path d="M11 4l-4 16" /> <path d="M17 4l-4 16" />',
'preview':'<path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /> <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />',
'fix':'<path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /> <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415" /> <path d="M16 5l3 3" />',
'teach':'<path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" /> <path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />',
'chart':'<path d="M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -6" /> <path d="M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -10" /> <path d="M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -14" /> <path d="M4 20h14" />',
'views':'<path d="M3 17l6 -6l4 4l8 -8" /> <path d="M14 7l7 0l0 7" />',
'drop':'<path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1" /> <path d="M9 15l3 -3l3 3" /> <path d="M12 12l0 9" />',
'text':'<path d="M4 6l16 0" /> <path d="M4 12l10 0" /> <path d="M4 18l14 0" />',
'link':'<path d="M9 15l6 -6" /> <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" /> <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" />',
'photo':'<path d="M15 8h.01" /> <path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" /> <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" /> <path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />',
'tidy':'<path d="M6 21l15 -15l-3 -3l-15 15l3 3" /> <path d="M15 6l3 3" /> <path d="M9 3a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" /> <path d="M19 13a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" />',
'case':'<path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /> <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /> <path d="M16 3.13a4 4 0 0 1 0 7.75" /> <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />',
'tone':'<path d="M10 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5" /> <path d="M19 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5" />',
'know':'<path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" /> <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" /> <path d="M3 6l0 13" /> <path d="M12 6l0 13" /> <path d="M21 6l0 13" />',
'check-env':'<path d="M7 12l5 5l-1.5 1.5a3.536 3.536 0 1 1 -5 -5l1.5 -1.5" /> <path d="M17 12l-5 -5l1.5 -1.5a3.536 3.536 0 1 1 5 5l-1.5 1.5" /> <path d="M3 21l2.5 -2.5" /> <path d="M18.5 5.5l2.5 -2.5" /> <path d="M10 11l-2 2" /> <path d="M13 14l-2 2" />',
'academy':'<path d="M3 21l18 0" /> <path d="M9 8l1 0" /> <path d="M9 12l1 0" /> <path d="M9 16l1 0" /> <path d="M14 8l1 0" /> <path d="M14 12l1 0" /> <path d="M14 16l1 0" /> <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" />',
'backup':'<path d="M3 6a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2" /> <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-10" /> <path d="M10 12l4 0" />',
'update':'<path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /> <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />',
'bug':'<path d="M9 9v-1a3 3 0 0 1 6 0v1" /> <path d="M8 9h8a6 6 0 0 1 1 3v3a5 5 0 0 1 -10 0v-3a6 6 0 0 1 1 -3" /> <path d="M3 13l4 0" /> <path d="M17 13l4 0" /> <path d="M12 20l0 -6" /> <path d="M4 19l3.35 -2" /> <path d="M20 19l-3.35 -2" /> <path d="M4 7l3.75 2.4" /> <path d="M20 7l-3.75 2.4" />',
'about':'<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /> <path d="M12 9h.01" /> <path d="M11 12h1v4h1" />',
'ok':'<path d="M5 12l5 5l10 -10" />',
'warn':'<path d="M12 9v4" /> <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /> <path d="M12 16h.01" />',
'wait':'<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /> <path d="M12 7v5l3 3" />',
'trash':'<path d="M4 7l16 0" /> <path d="M10 11l0 6" /> <path d="M14 11l0 6" /> <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /> <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />',
'open':'<path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /> <path d="M11 13l9 -9" /> <path d="M15 4h5v5" />',
'help':'<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /> <path d="M12 16v.01" /> <path d="M12 13a2 2 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" />',
'stop':'<path d="M5 7a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2l0 -10" />'
};
function ic(name,size){
  const d=ICON[name]; if(!d)return '';
  return '<svg class="ic" width="'+(size||18)+'" height="'+(size||18)+'" viewBox="0 0 24 24" '+
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '+
    'stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
}

/* 도움말 — 각 기능이 무엇을 보고 어떤 숫자인지 */
const HELP={
'노션':{t:'노션에 쌓기 — 되는 것과 안 되는 것',c:'c1',b:'<h3>무엇이 노션으로 가나요</h3> <table> <tr><td>본문</td><td>소제목·표·인용·목록·구분선이 <b>노션 블록으로</b> 살아서 갑니다</td></tr> <tr><td>제목</td><td>DB의 제목 칸에</td></tr> <tr><td>날짜</td><td>발행 날짜</td></tr> <tr><td>학생군</td><td>중2 · 수학 · 서술형 감점</td></tr> <tr><td>글유형</td><td>설명형 / 비교형 / 사례형 / 상담전환형</td></tr> <tr><td>독자상태</td><td>정보형 / 비교형 / 선택형 / 불안형</td></tr> <tr><td>대표자산</td><td>시작시기 / 비교기준 / …</td></tr> <tr><td>사례</td><td>그 글에 쓴 사례 이름</td></tr> <tr><td>조회수</td><td>네이버 통계를 붙이셨으면</td></tr> </table> <div class="note"><b>노션 앱도, MCP도 설치하지 않으셔도 돼요.</b> 프로그램이 노션에 직접 말을 걸어요. 열쇠 하나만 넣으시면 끝이에요. DB는 목록에서 고르시면 돼요.</div>  <h3>원장님 DB를 함부로 안 바꿔요</h3> <p>프로그램이 <b>칸을 새로 만들지 않아요.</b> 원장님 DB에 <b>있는 칸에만</b> 채우고, 없는 칸은 건너뜁니다. 무엇을 건너뛰었는지 그때마다 알려드려요.</p> <p>칸 이름을 위 표와 똑같이 만드시면 다 채워져요. 안 만드셔도 글은 쌓입니다.</p>  <h3>언제 가나요</h3> <table> <tr><td>자동</td><td><b>안 보내요.</b> 완성된 글에서 단추를 누르실 때만</td></tr> <tr><td>고치셨으면</td><td><b>고친 글</b>을 보내요. 노션에는 실제로 올리신 글이 쌓여야 하니까요</td></tr> <tr><td>실패해도</td><td>글은 프로그램에 그대로 있어요. 나중에 다시 누르시면 돼요</td></tr> </table>  <h3>안 되는 것 — 미리 알려드려요</h3> <table> <tr><td>한 방향만</td><td><b>노션에서 고쳐도 프로그램은 몰라요.</b> 프로그램 → 노션 한 방향이에요</td></tr> <tr><td>사진</td><td>글 안 <code>[사진 자리]</code> 표시는 글자로 갑니다. 사진 자체는 안 올라가요</td></tr> <tr><td>굵게·기울임</td><td>벗겨져요. 구조(소제목·표)는 살리고 서식은 버려요</td></tr> <tr><td>아주 긴 글</td><td>100덩이가 넘으면 자릅니다. 실제 글은 30~47덩이라 닿을 일이 드물어요</td></tr> <tr><td>인터넷</td><td>보낼 때만 필요해요. 글 쓰는 데는 필요 없어요</td></tr> </table>  <h3>가장 많이 막히는 곳</h3> <div class="note">열쇠를 만들고 <b>그 DB 페이지에 \'연결\'을 추가</b>하지 않으면 열쇠가 맞아도 <b>"DB를 못 찾았어요"</b>가 나와요. 노션은 통합에게 페이지를 하나씩 열어줘야 하는 구조예요. 안내 4번이 그것입니다.</div>  <h3>열쇠는 어디 있나요</h3> <p><code>.연결설정.json</code> 한 파일에만 있어요. 이 파일은 <b>자료 내보내기·배포본·고장 신고 어디에도 안 담겨요.</b> 원장님이 자료 zip을 남에게 보내도 노션은 안 열려요.</p> <p>대신 <b>새 컴퓨터에서는 다시 연결</b>해주셔야 해요.</p>'},
'글유형':{t:'글유형 — 어떻게 설명할까',c:'c1',b:'<h3>네 가지뿐입니다</h3> <p>원장님 강의(네이버마스터 2강)에서 정한 그대로예요. <b>많이 아는 것보다 네 가지를 반복해서 잘 쓰는 편이 낫습니다.</b></p> <table> <tr><td>설명형</td><td>기준을 세워 판단을 돕는다<br><small>실패: 아는 걸 순서 없이 나열해 백과사전이 된다</small></td></tr> <tr><td>비교형</td><td>상황별로 어느 쪽이 맞는지 나눈다<br><small>실패: 우리 방식이 낫다는 결론만 남긴다</small></td></tr> <tr><td>사례형</td><td>시작 상태와 변화 과정을 보여준다<br><small>실패: 점수 상승 결과만 자랑한다</small></td></tr> <tr><td>상담전환형</td><td>상담 전 준비 항목을 알려준다<br><small>실패: 문의 주세요만 반복한다</small></td></tr> </table> <h3>유형마다 핵심 장치가 다릅니다</h3> <table> <tr><td>설명형</td><td>기준 목록 · 문제 → 기준 → 적용 → 점검</td></tr> <tr><td>비교형</td><td>비교 표 · 기준 → A → B → 상황별 정리</td></tr> <tr><td>사례형</td><td>변화 과정 · 상태 → 개입 → 변화 → 시사점</td></tr> <tr><td>상담전환형</td><td>준비 체크리스트 · 현상 → 판단 기준 → 준비 항목 → 연결</td></tr> </table> <div class="note">검수기가 유형에 맞는 장치가 있는지 봐요. 비교형인데 표가 없거나, 사례형인데 과정 없이 결과만 있으면 짚어드려요.</div> <h3>★ 과 ☆ 는 뭔가요</h3> <p>위에서 <b>독자 상태</b>를 고르시면 그 상태에 맞는 방식을 표시해요. ★ 은 우선 맞는 방식, ☆ 은 뒤쪽이나 다음 글에 붙이면 좋은 방식이에요. <b>따라야 하는 건 아니에요.</b></p>'},
'대표자산':{t:'대표자산 — 없으면 블로그가 비어 보이는 글',c:'c2',b:'<h3>여섯 자리</h3> <p>한 학생군을 정했으면, 그 학생군을 위해 <b>반드시 있어야 하는 글</b>이 있어요.</p> <table> <tr><td>시작 시기 글</td><td>언제 시작하는 것이 맞는가</td></tr> <tr><td>비교 기준 글</td><td>무엇과 무엇을 어떻게 나누는가</td></tr> <tr><td>성적 문제 글</td><td>떨어졌을 때 무엇부터 보는가</td></tr> <tr><td>사례 글</td><td>실제로 어떻게 달라졌는가</td></tr> <tr><td>상담 준비 글</td><td>상담 전 무엇을 정리하는가</td></tr> <tr><td>FAQ 글</td><td>반복 질문을 한 번에 답한다</td></tr> </table> <div class="note"><b>있으면 좋은 글이 아니라, 없으면 블로그가 비어 보이는 글이에요.</b> 학부모가 그 질문을 했을 때 보여드릴 게 없으면 거기서 나가요.</div> <h3>글유형과 뭐가 다른가요</h3> <table> <tr><td>글유형</td><td><b>어떻게</b> 쓸까 — 한 편 안의 방식</td></tr> <tr><td>대표자산</td><td><b>무엇부터</b> 쓸까 — 순서의 문제</td></tr> </table> <p>대표자산 하나를 네 가지 글유형으로 변주할 수도 있어요. 같은 주제라도 설명형·비교형·사례형·상담전환형으로 각각 한 편씩요. <b>네 편이 서로 링크되면 하나의 주제가 블로그의 기둥이 됩니다.</b></p> <h3>"아직 없어요" 표시</h3> <p>지금까지 쓰신 글에 그 자리가 비어 있으면 알려드려요. <b>거기부터 채우시면 돼요.</b></p>'},
'제안받기':{t:'제안받기 — 내 글을 보고 말을 겁니다',c:'c0',b:'<h3>무엇을 보나요</h3> <p>웹을 보지 않아요. <b>원장님이 이미 쓰신 글만</b> 봐요. 발행 기록을 모아 놓고 한쪽으로 치우친 데를 찾아요.</p> <table> <tr><td>축 균형</td><td>최근 여덟 편이 같은 학년·과목·문제상황에 몰렸는지</td></tr> <tr><td>사례 쿨다운</td><td>한동안 안 쓴 사례가 잠들어 있는지</td></tr> <tr><td>사례 재고</td><td>쓸 수 있는 새 사례가 몇 건 남았는지</td></tr> <tr><td>편집률 추이</td><td>원장님이 고치는 양이 늘고 있는지</td></tr> <tr><td>성과</td><td>어떤 형식이 실제로 많이 읽혔는지</td></tr> <tr><td>연재</td><td>이어서 쓰면 좋을 글이 있는지</td></tr> </table> <h3>왜 아무 말이 없을 때가 있나요</h3> <p>숫자를 보려면 <b>표본이 필요해요.</b> 글 두 편으로 "중2에 몰렸다"고 말하면 그건 우연이지 경향이 아니에요.</p> <table> <tr><td>축 균형</td><td>글 4편부터</td></tr> <tr><td>편집률</td><td>피드백 4번부터</td></tr> <tr><td>성과</td><td>통계 붙은 글 4편부터</td></tr> </table> <div class="note">아무것도 안 걸렸다는 건 <b>지금 균형이 괜찮다</b>는 뜻이에요. 고장이 아니에요. 그때는 무엇을 지켜보고 있는지 화면에 적어드려요.</div> <h3>제안이 마음에 안 들면</h3> <p>무시하셔도 돼요. 제안은 <b>강제가 아니에요.</b> 원장님이 쓰고 싶은 걸 쓰시면 되고, 다만 반복은 검수기가 따로 막아요.</p>'},
'글감수집':{t:'글감 찾아오기 — 웹을 한 바퀴 돌고 옵니다',c:'c4',b:'<h3>제안받기와 뭐가 다른가요</h3> <table> <tr><td>제안받기</td><td><b>내 글</b>을 봐요. 치우친 데를 짚어요</td></tr> <tr><td>글감 찾아오기</td><td><b>웹</b>을 봐요. 요즘 학부모가 뭘 묻는지 가져와요</td></tr> </table> <h3>어떻게 찾나요</h3> <p>다섯 방향으로 훑어요 — 학부모 질문, 시기 이슈(시험·방학·입시 일정), 제도 변화, 검색 수요, 지역 이야기.</p> <h3>지키는 규칙</h3> <ul> <li><b>출처가 없으면 후보로 안 올려요.</b> 지어낸 트렌드가 섞이지 않게요</li> <li><b>글을 자동으로 쓰지 않아요.</b> 찾아서 보여드리기만 해요</li> <li>학원 사례로 답할 수 있는 것을 위로 올려요</li> </ul> <div class="note">찾아온 건 <b>글감 창고</b>에 쌓여요. 오늘 안 쓰셔도 다음 달에 쓰시면 돼요.</div>'},
'편집률':{t:'편집률 — 원장님 말투에 얼마나 가까운가',c:'c1',b:'<h3>어떤 숫자인가요</h3> <p>저희가 쓴 글과 <b>원장님이 고쳐서 올리신 글</b>을 문장 단위로 맞대어 봐요. 그중 <b>몇 %의 문장이 손을 탔는지</b>가 편집률이에요.</p> <div class="note">문장 20개 중 4개를 고치셨다 → <b>편집률 20%</b></div> <h3>어떻게 세나요</h3> <ul> <li>문장을 <b>글자 두 개씩 겹쳐</b> 비교해요. 한국어는 조사가 붙어서 단어로 비교하면 "문장이에요"와 "문장을"이 남남이 돼요</li> <li>지운 문장, 새로 넣은 문장, 손본 문장을 모두 세요</li> <li>순서만 바꾼 건 안 세요</li> </ul> <h3>어떻게 읽어야 하나요</h3> <table> <tr><td>줄어든다</td><td>원장님 말투에 가까워지고 있어요. <b>이게 목표예요</b></td></tr> <tr><td>늘어난다</td><td>말투 기준이 어긋나고 있어요. 제안받기가 알려드려요</td></tr> <tr><td>30% 넘음</td><td>사실상 다시 쓰신 거예요. 말투 자료를 더 주시면 좋아요</td></tr> <tr><td>5% 아래</td><td>거의 그대로 쓰셨다는 뜻이에요</td></tr> </table> <div class="note"><b>정답 숫자는 없어요.</b> 중요한 건 값이 아니라 <b>방향</b>이에요. 15%에서 12%로 내려가는 게, 8%에 머무는 것보다 좋은 신호예요.</div> <h3>어떻게 낮추나요</h3> <p>글을 고치신 다음 <b>완성된 글 → 고친 걸 알려주기</b>에 붙여넣어 주세요. 지우신 표현은 안 쓰고, 넣으신 표현은 시그니처로 등록해요.</p>'},
'사례사용':{t:'사례 사용 현황 — 같은 아이 이야기만 나오지 않게',c:'c2',b:'<h3>왜 이걸 보나요</h3> <p>같은 학생 이야기가 매주 나오면 학부모는 이렇게 생각해요.</p> <div class="note">"이 학원엔 저 학생밖에 없나?"</div> <p>사례는 글의 <b>근거</b>예요. 근거가 하나뿐인 학원은 작아 보여요.</p> <h3>막대를 어떻게 읽나요</h3> <table> <tr><td>막대가 짧다</td><td>덜 쓴 사례. <b>지금 쓰기 좋아요</b></td></tr> <tr><td>막대가 길다</td><td>최근에 많이 쓴 사례. 한동안 쉬어가야 해요</td></tr> <tr><td>오른쪽 숫자</td><td>지금까지 몇 편에 등장했는지</td></tr> </table> <p><b>위에 있는 것부터</b> 쓰시면 돼요. 덜 쓴 순으로 정렬돼 있어요.</p> <h3>검수기가 막는 것</h3> <table> <tr><td><code>R1</code></td><td>최근 다섯 편에 나온 사례를 또 쓰면 막아요</td></tr> <tr><td><code>R2</code></td><td>한 사례가 전체 글의 25%를 넘으면 경고해요</td></tr> <tr><td><code>R6</code></td><td>쓸 사례가 2건 이하로 떨어지면 미리 알려드려요</td></tr> </table> <div class="note"><b>블로그가 멈추는 진짜 이유는 글재주가 아니라 쓸 이야기가 떨어져서예요.</b> 일주일에 한 번, 5분만 사례를 채워주세요.</div>'},
'완성글':{t:'완성된 글 — 무엇을 보여주고 무엇을 하면 되나',c:'c3',b:'<h3>화면에 보이는 것</h3> <p>학부모가 읽게 될 <b>본문 그대로</b>예요. 마크다운 기호는 지우고 보여드려요.</p> <h3>단추 다섯 개</h3> <table> <tr><td>본문 복사</td><td>기호 없이 <b>글자만</b> 복사돼요. 네이버에 그대로 붙여넣으세요</td></tr> <tr><td>해시태그 복사</td><td>태그만 따로 복사돼요</td></tr> <tr><td>미리보기</td><td>블로그에서 보이는 모습을 브라우저로 열어요</td></tr> <tr><td>고쳐주세요</td><td>어디가 마음에 안 드는지 말로 하시면 저희가 고쳐요</td></tr> <tr><td>고친 걸 알려주기</td><td><b>원장님이 직접 고치신 글</b>을 붙여넣으면 말투를 배워요</td></tr> </table> <h3>네이버에 올리실 때 세 가지</h3> <ul> <li>글 안 <code>[사진 자리 ①]</code> 표시에 <b>직접 찍으신 사진</b>을 넣어주세요</li> <li>맨 아래 "이 글은 이렇게 썼습니다"는 <b>원장님만 보시는 메모</b>예요. 빼고 올리세요</li> <li>학생 이름과 얼굴은 반드시 가려주세요</li> </ul> <div class="note"><b>자동 발행은 일부러 안 만들었어요.</b> 네이버는 자동 발행을 매크로로 보고 제재해요. 몇 년 쌓으신 블로그를 5분과 바꿀 수 없어요.</div>'},
'통계':{t:'네이버 통계 — 무엇이 실제로 읽혔나',c:'c1',b:'<h3>왜 필요한가요</h3> <p>편집률은 <b>"말투가 맞아가나"</b>를 봐요. 이건 <b>"장사가 되나"</b>를 봐요. 다른 숫자예요.</p> <h3>어디서 가져오나요</h3> <ul> <li>네이버 블로그 관리 → <b>통계</b> → <b>게시물별 조회수</b></li> <li>표를 <b>드래그해서 복사</b> (Ctrl+C 또는 ⌘C)</li> <li>여기에 붙여넣고 "이어 붙이기"</li> </ul> <h3>어떻게 맞추나요</h3> <p>제목이 들어간 줄을 찾아 <b>그 줄에서 가장 큰 숫자</b>를 조회수로 봐요. 네이버가 제목을 잘라 보여줘도 앞 12자로 다시 찾아요.</p> <div class="note">숫자가 잘못 붙었으면 <b>내 자료</b>에서 직접 고치실 수 있어요. 억지로 정확하려 들지 않고, 틀리면 고칠 수 있게 열어뒀어요.</div> <h3>붙이면 무엇이 달라지나요</h3> <p>글 <b>4편에 통계가 붙으면</b> 제안받기가 이렇게 말해요.</p> <div class="note">"사례형 글이 비교형보다 훨씬 많이 읽혔어요. 다음 글도 사례형으로 가볼까요?"</div>'},
'말투':{t:'내 말투 — 프로그램이 원장님한테 배운 것',c:'c0',b:'<h3>여기 있는 세 가지</h3> <table> <tr><td>시그니처</td><td>원장님이 직접 넣으셨거나 <b>지우지 않고 남기신</b> 표현. 브랜딩 문장으로 써요</td></tr> <tr><td>안 쓰는 표현</td><td>원장님이 <b>지우신</b> 표현. 앞으로 안 써요</td></tr> <tr><td>편집률 추이</td><td>고치시는 양이 줄고 있는지</td></tr> </table> <h3>반복이 다 나쁜 건 아니에요</h3> <p>같은 문장이 자꾸 나오면 보통 <b>클리셰</b>라고 해요. 그런데 원장님이 즐겨 쓰시는 말은 클리셰가 아니라 <b>시그니처</b>예요. 학부모가 알아보는 그 학원의 말투요.</p> <div class="note">저희는 이걸 <b>스스로 판단하지 않아요.</b> 원장님이 <b>지우면 클리셰, 남기면 시그니처</b>로 배워요. 판단은 원장님이 하세요.</div> <h3>어떻게 쌓이나요</h3> <p><b>완성된 글 → 고친 걸 알려주기</b>에 고치신 글을 붙여넣을 때마다 쌓여요. 한 번으로 확정하지 않아요. <b>같은 패턴이 두 번 이상</b> 나와야 반영해요.</p>'},
'글감창고':{t:'글감 창고 — 쓸 거리를 모아두는 곳',c:'c4',b:'<h3>어디서 온 글감인가요</h3> <table> <tr><td>🔎 찾아온 것</td><td>글감 찾아오기로 <b>웹에서</b> 가져온 것. 출처 링크가 붙어 있어요</td></tr> <tr><td>✍️ 직접 넣은 것</td><td>원장님이 스크랩하거나 적어두신 것</td></tr> <tr><td>📦 함께 온 것</td><td>업데이트에 실려 온 것. 만든 사람이 모아 보낸 글감이에요</td></tr> </table> <h3>어떻게 쓰나요</h3> <p>마음에 드는 걸 골라 <b>"이걸로 글 쓰기"</b>를 누르시면 돼요. 학원 사례가 붙어 있는 글감은 근거까지 이어서 써요.</p> <h3>사례가 없는 글감은요</h3> <p><b>원론적인 글</b>이 나와요. 학부모는 원론에 반응하지 않아요. 그런 글감은 관련 사례를 먼저 하나 넣어주시면 훨씬 좋아져요.</p> <div class="note">쓴 글감은 <b>기록으로 남겨둬요.</b> 같은 주제를 또 쓰지 않게요.</div>'},
'텔레그램':{t:'손전화로 글감 보내기 — 되는 것과 안 되는 것',c:'c4',b:'<h3>왜 필요한가요</h3> <p>상담을 끝내고 나오면서 떠오른 이야기가 <b>가장 좋은 글감</b>이에요. 컴퓨터를 켤 때까지 기다리면 잊어버려요.</p> <h3>무엇을 보낼 수 있나요</h3> <table> <tr><td>짧은 글 (200자 이하)</td><td><b>글감 창고</b>로 가요. 나중에 골라서 쓰시면 돼요</td></tr> <tr><td>긴 글 (200자 넘음)</td><td><b>사례와 소식</b>으로 가요. 정리하기를 누르시면 읽어드려요</td></tr> <tr><td>링크 하나만</td><td><b>스크랩 소재</b>로 가요</td></tr> <tr><td>사진·파일</td><td><b>여기에 넣으세요</b> 폴더로 가요. 정리하기가 읽어드려요</td></tr> <tr><td>음성 메시지</td><td><b>아직 못 알아들어요.</b> 글로 보내주세요</td></tr> </table> <h3>남이 못 넣게 막아요</h3> <div class="note">봇 주소는 공개라서 아무나 말을 걸 수 있어요. 그래서 <b>원장님 손전화와 짝을 지어</b> 그 번호에서 온 것만 받아요. 다른 사람이 보낸 건 안 담고, 몇 건이 왔는지만 알려드려요.</div> <h3>자동으로 가져오나요</h3> <p><b>아니요.</b> 설정에서 <b>보내신 것 가져오기</b>를 누르실 때만 가져와요. 프로그램이 꺼져 있어도 텔레그램이 <b>24시간</b> 보관해요. 그 안에 켜시면 밀린 게 다 들어와요.</p> <div class="note">글감이 들어와도 <b>글을 자동으로 쓰지는 않아요.</b> 창고에 쌓아둘 뿐이에요.</div> <h3>열쇠는 어디 있나요</h3> <p>노션 열쇠와 같은 파일에 있어요. <b>자료 내보내기·배포본·고장 신고 어디에도 안 담겨요.</b></p>'},
'자료넣기':{t:'자료 넣기 — 무엇을 넣으면 되나',c:'c1',b:'<h3>뭘 넣어도 되나요</h3> <p>네. <b>사례인지 학원 자료인지 저희가 나눠 담아요.</b> 원장님이 분류하지 않으셔도 돼요.</p> <table> <tr><td>사례</td><td>있었던 일. 상담·수업·시험 이야기 → 글의 <b>근거</b>가 돼요</td></tr> <tr><td>학원 자료</td><td>소개서, 안내문, 운영 원칙 → 학원을 설명할 때 써요</td></tr> <tr><td>말투 자료</td><td>예전 블로그 글, 카톡 내보내기 → <b>원장님 문체를 여기서 배워요</b></td></tr> <tr><td>스크랩</td><td>기사·유튜브 링크 → 글감 재료로 써요</td></tr> </table> <h3>카톡은 왜 말투로만 쓰나요</h3> <div class="note">카톡과 블로그는 <b>같은 말투가 아니에요.</b> 카톡에서는 <b>쓰는 낱말과 높임말</b>만 배우고, 문장 구조는 안 가져와요. 안 그러면 블로그 글이 카톡처럼 뚝뚝 끊겨요.</div> <h3>넣은 다음</h3> <p><b>정리하기</b>를 누르면 읽어보고 제자리에 넣어드려요. 3~5분쯤 걸려요. 끝나면 <b>확인 화면</b>이 떠요. 저희가 읽고 정리한 거라 <b>사실과 다를 수 있어요.</b> 한 번만 봐주세요.</p>'},
'검수':{t:'검수기 — AI가 아니라 계산이 막습니다',c:'c6',b:'<h3>왜 AI가 채점하지 않나요</h3> <div class="note">AI가 자기 글을 채점하면 <b>봐줘요.</b> 그래서 검수기는 AI가 아니라 <b>정규식과 계산</b>으로만 돌아가요. 봐주는 법이 없어요.</div> <h3>무엇을 막나요</h3> <table> <tr><td>위험할 수 있는 말</td><td>"최고", "1등", "성적 보장", "3개월 만에 30점"</td></tr> <tr><td>학생 개인정보</td><td>실명, 학교명이 그대로 나가는 것</td></tr> <tr><td>AI 티</td><td>상투구, 번역투, 문장 길이가 다 똑같은 것</td></tr> <tr><td>같은 글 반복</td><td>지난 글과 세 글자 단위로 겹치는 비율</td></tr> <tr><td>같은 사례 반복</td><td>최근 다섯 편에 나온 사례</td></tr> <tr><td>근거 없는 문장</td><td>학원 위키에 없는 숫자나 발화</td></tr> <tr><td>AI 인용 가능성</td><td>표가 있는지, 질문형 소제목이 있는지</td></tr> <tr><td>마무리</td><td>읽고 나서 뭘 하면 되는지 적혀 있는지</td></tr> </table> <div class="note"><b>법률 판단을 해드리는 건 아니에요.</b> 학원 광고에서 문제가 됐던 표현을 모아 미리 걸러드리는 거예요. 걸렀다고 안전하다는 보증은 아니에요. 규칙은 <b>보수적으로</b> 잡혀 있어서, 걸린 표현을 빼도 글이 나빠지지 않아요.</div> <h3>판정 세 가지</h3> <table> <tr><td>반려</td><td>고치기 전에는 안 나가요</td></tr> <tr><td>경고</td><td>고치는 게 좋지만 나갈 수는 있어요</td></tr> <tr><td>확인</td><td>원장님이 판단하실 일이에요</td></tr> </table>'},
'입력창':{t:'맨 위 입력창 — 무엇을 칠 수 있나',c:'c0',b:'<h3>일반 AI 채팅이 아니에요</h3> <p>여기 치신 말은 <b>명령으로 바뀌어</b> 실행돼요. 잡담이나 질문에 답하는 곳이 아니에요.</p> <table> <tr><td>"중2 서술형으로 글 써줘"</td><td>글쓰기가 돌아요</td></tr> <tr><td>"글감 찾아줘"</td><td>웹에서 글감을 모아와요</td></tr> <tr><td>"뭐 쓸까"</td><td>제안을 드려요</td></tr> <tr><td>"자료 정리해줘"</td><td>넣어두신 자료를 정리해요</td></tr> </table> <h3>가장 많이 쓰시는 건</h3> <p><b>주제 한 줄</b>이에요. "중2 서술형 감점"처럼 적으시면 그걸로 글을 써요.</p> <div class="note">명령어를 외우지 않으셔도 돼요. 하고 싶은 걸 편하게 적으시면 알아들어요. 아래 회색 단추들은 자주 쓰는 것들을 미리 놔둔 거예요.</div>'},
'준비확인':{t:'준비 확인 — 이 컴퓨터에 필요한 것',c:'c4',b:'<h3>세 가지가 필요해요</h3> <table> <tr><td>Node.js</td><td>프로그램이 도는 바탕. <b>한 번만</b> 설치하면 돼요</td></tr> <tr><td>Claude Code</td><td>글을 쓰는 엔진. 버튼으로 설치돼요</td></tr> <tr><td>Claude 로그인</td><td>터미널에서 <b>한 번만</b> 하시면 돼요</td></tr> </table> <h3>따로 깔 스킬이나 설정은요</h3> <div class="note"><b>없어요.</b> 글쓰기 방법, 검수 규칙, 지식 파일이 <b>이 폴더 안에</b> 다 들어 있어요. 원장님 컴퓨터의 다른 설정과 상관없이 똑같이 돌아요.</div> <h3>왜 Node.js는 버튼이 없나요</h3> <p>설치할 때 <b>컴퓨터 비밀번호</b>가 필요해요. 저희가 대신 칠 수 없고, 쳐서도 안 돼요. 받는 곳과 순서를 자세히 알려드릴게요.</p>'},
};
function q(key){
  return HELP[key]?'<span class="q" onclick="showHelp(\''+key+'\');event.stopPropagation()" title="이게 뭔가요?">'+ic('help',15)+'</span>':''
}
function showHelp(key){
  const h=HELP[key]; if(!h)return;
  modal('<div style="--a:var(--'+h.c+')">'+
    '<h2 class="plain" style="margin:0 0 16px;font-size:18px;font-weight:800;letter-spacing:-.3px">'+h.t+'</h2>'+
    '<div class="hp">'+h.b+'</div>'+
    '<div class="row" style="margin-top:18px"><button class="act" onclick="closeModal()">알겠어요</button></div></div>');
}
var ENV=null;
async function checkEnv(){
  const box=$('#envBox'); if(box)box.innerHTML='<p class="sub"><span class="spin"></span> 이 컴퓨터를 살펴보는 중…</p>';
  ENV=await api('/api/env');
  drawEnv();
}
function drawEnv(){
  const box=$('#envBox'); if(!box)return;
  if(!ENV)return box.innerHTML='<div class="row"><button class="act" onclick="checkEnv()">준비됐는지 확인하기</button></div>';
  const win=ENV.osKey==='win32';
  const line=function(color,title,val,body){
    return '<div class="item" style="--a:var(--'+color+')">'+
      '<div class="row" style="justify-content:space-between">'+
      '<h3 style="margin:0">'+title+'</h3>'+
      '<span class="meta" style="display:flex;align-items:center;gap:5px">'+
        (color==='c0'?ic('ok',15):color==='c6'?ic('warn',15):ic('wait',15))+esc(val)+'</span></div>'+
      (body?'<div style="margin-top:10px">'+body+'</div>':'')+'</div>'};
  const step=function(n,txt){return '<div style="display:flex;gap:10px;margin-bottom:8px">'+
    '<b style="flex:none;width:19px;height:19px;border-radius:6px;background:var(--card);color:var(--dim);'+
    'font-size:12.5px;display:flex;align-items:center;justify-content:center">'+n+'</b>'+
    '<span style="font-size:14.5px;color:var(--dim);line-height:1.65">'+txt+'</span></div>'};

  box.innerHTML=
    '<p class="sub" style="margin:0 0 12px">지금 <b>'+esc(ENV.os)+'</b> 를 쓰고 계세요. 그에 맞춰 알려드릴게요.</p>'+

    line(ENV.nodeOk?'c0':'c6','1. Node.js', ENV.nodeOk?('있어요 · '+ENV.node):'없거나 너무 오래됐어요',
      ENV.nodeOk?'':
      '<p class="sub" style="margin:0 0 10px">프로그램이 도는 바탕이에요. <b>한 번만</b> 설치하시면 돼요.<br>'+
      '설치할 때 컴퓨터 비밀번호를 물어봐요. 그래서 <b>저희가 대신 못 해요.</b></p>'+
      (win
        ? step(1,'아래 단추를 누르면 받는 곳이 열려요')
          +step(2,'초록색 <b>LTS</b> 단추를 누르면 <code>.msi</code> 파일이 받아져요')
          +step(3,'받은 파일을 <b>더블클릭</b>하고 <b>Next</b> 만 계속 누르시면 돼요')
          +step(4,'다 되면 <b>이 창을 닫고</b> 프로그램을 다시 켜주세요')
        : step(1,'아래 단추를 누르면 받는 곳이 열려요')
          +step(2,'초록색 <b>LTS</b> 단추를 누르면 <code>.pkg</code> 파일이 받아져요')
          +step(3,'받은 파일을 <b>더블클릭</b>하고 <b>계속</b> 만 누르시면 돼요. 중간에 맥 비밀번호를 물어봐요')
          +step(4,'다 되면 <b>이 창을 닫고</b> 프로그램을 다시 켜주세요'))
      +'<a class="act sm" style="text-decoration:none;display:inline-block;margin-top:6px" '+
      'href="https://nodejs.org/ko/download" target="_blank">Node.js 받으러 가기</a>')+

    line(ENV.claudeOk?'c0':(ENV.nodeOk?'c2':'dim2'),'2. Claude Code',
      ENV.claudeOk?('있어요 · '+ENV.claude):(ENV.nodeOk?'아직 없어요':'Node.js 먼저 깔아주세요'),
      ENV.claudeOk?'':(ENV.nodeOk
        ? '<p class="sub" style="margin:0 0 10px">글을 쓰는 엔진이에요. <b>이건 단추 하나로 깔려요.</b><br>'+
          '아래 명령을 저희가 대신 실행해요. 1~3분쯤 걸려요.</p>'+
          '<pre class="term" style="margin:0 0 10px">npm install -g @anthropic-ai/claude-code</pre>'+
          '<button class="act sm" onclick="installClaude()">설치하기</button>'
        : '<p class="sub" style="margin:0">위 Node.js 를 먼저 설치하셔야 이게 깔려요.</p>'))+

    line(ENV.claudeOk?'c1':'dim2','3. Claude 로그인','한 번만 하시면 돼요',
      ENV.claudeOk
      ? '<p class="sub" style="margin:0 0 10px">로그인은 <b>검은 명령 창에서만</b> 돼요. 저희가 대신 못 해요.<br>'+
        'Claude Pro 또는 Max 구독이 있으셔야 해요.</p>'+
        step(1,'아래 <b>창 열기</b>를 누르면 검은 창이 떠요')
        +step(2,'거기에 <code>claude</code> 라고 치고 <b>엔터</b>')
        +step(3,'브라우저가 열리면 Claude 계정으로 로그인하세요')
        +step(4,'"Login successful" 이 뜨면 그 검은 창을 닫으셔도 돼요')
        +step(5,'돌아와서 <b>연결됐는지 확인</b>을 눌러보세요')
        +'<div class="row" style="margin-top:6px">'+
        '<button class="act sm ghost" onclick="post(\'/api/terminal\',{},\'창을 열었어요\')">'+
        (win?'명령 창 열기':'터미널 열기')+'</button>'+
        '<button class="act sm ghost" onclick="probe()">연결됐는지 확인</button></div>'
      : '<p class="sub" style="margin:0">위 두 가지를 먼저 하셔야 해요.</p>')+

    '<div class="row" style="margin-top:12px">'+
    '<button class="act ghost sm" onclick="ENV=null;checkEnv()">다시 확인</button>'+
    (ENV.nodeOk&&ENV.claudeOk?'<span class="sub" style="margin:0;color:var(--c0)">'+
      ((S.setup&&S.setup.basics&&S.setup.wiki)
        ? '이 컴퓨터는 준비가 다 됐어요'
        : '준비는 끝났어요. 아래 1단계부터 하시면 돼요')+'</span>':'')+'</div>'+
    /* 프로그램 자신이 온전한지. 지시서가 등록이 안 돼도 글은 나와서
       원장님은 알 방법이 없다 — 그래서 여기서 대신 본다.
       이상 없을 땐 한 줄로 조용히, 이상할 때만 크게 말한다 */
    (ENV.속 ? (ENV.속.온전
      ? '<p class="sub" style="margin:10px 0 0;color:var(--c0)">'+ic('ok',14)+
        ' 프로그램도 이상 없어요 — 글 쓰는 담당 '+ENV.속.담당+'명 다 있어요</p>'
      : '<div class="note" style="--a:var(--c6);background:var(--card2);border-radius:10px;'+
        'padding:12px 14px;margin:12px 0 0;font-size:14.5px;border-left:3px solid var(--c6)">'+
        '<b>'+ic('warn',14)+' 프로그램에 빠진 게 있어요</b><br>'+
        '<span style="color:var(--dim)">글 쓰는 담당이 '+ENV.속.담당+'명이에요 (6명이어야 해요)'+
        (ENV.속.안닫힘&&ENV.속.안닫힘.length
          ? '<br>그중 '+ENV.속.안닫힘.length+'명은 파일이 깨져서 <b>불러도 안 와요</b>' : '')+
        '<br>이대로도 글은 나오지만 <b>제대로 나눠서 쓰지 않아요.</b><br>'+
        '만든 사람에게 <b>업데이트 파일</b>을 다시 받아 넣어주세요.</span></div>'
      ) : '');
}
function installClaude(){
  modal('<h2 style="margin:0 0 4px;font-size:16px">Claude Code 설치하는 중</h2>'+
    '<p class="sub">1~3분쯤 걸려요. 창을 닫으셔도 계속 해요.</p>'+
    '<pre class="term" id="runOut"><span class="spin"></span> 시작해요…</pre>'+
    '<div class="row" style="margin-top:12px"><button class="act ghost sm" onclick="closeModal()">닫기</button></div>');
  watch('/api/install');
}
function probe(){
  modal('<h2 style="margin:0 0 4px;font-size:16px">연결 확인하는 중</h2>'+
    '<p class="sub">Claude에게 간단한 걸 하나 물어봐요. 답이 오면 준비 끝이에요.</p>'+
    '<pre class="term" id="runOut"><span class="spin"></span> 물어보는 중…</pre>'+
    '<div class="row" style="margin-top:12px"><button class="act ghost sm" onclick="closeModal()">닫기</button></div>');
  watch('/api/probe');
}
async function watch(path){
  const r=await api(path,{});
  if(r.error){const e=$('#runOut'); if(e)e.textContent=r.error; return}
  멈춤(jobPoll); jobPoll=setInterval(async function(){
    const j=await api('/api/job?id='+r.id);
    const el=$('#runOut'); if(!el)return jobPoll=멈춤(jobPoll);
    el.textContent=(j.out||'하고 있어요…')+(j.done?'':'\n\n… '+j.secs+'초 경과');
    el.scrollTop=el.scrollHeight;
    if(j.done){jobPoll=멈춤(jobPoll); toast(j.ok?'됐어요':'안 됐어요'); ENV=null; checkEnv()}
  },1500);
}

function drawSetting(){ /* → #settingMain */
  const u=S.setup||{}, ok=function(b){return b?'done':''};
  const n=[u.basics,u.material,u.wiki,u.wrote].filter(Boolean).length;
  const st=function(i,cls,color,title,sub,body){
    return '<div class="step '+cls+'" style="--a:var(--c'+color+')">'+
      '<div class="num">'+(cls==='done'?'✓':i)+'</div>'+
      '<div class="bd"><h3>'+title+'</h3><p class="sub">'+sub+'</p>'+(body||'')+'</div></div>'};
  /* 준비가 끝나면 온보딩은 접는다. 다 끝낸 단계를 매번 펼쳐 보여드릴 이유가 없다.
     아직 하시는 중이면 펼쳐둔다 — 그때는 이게 이 화면의 전부다 */
  const 준비끝=u.basics&&u.wiki;
  const 온보딩=준비끝
    ? ['<details class="fold"><summary>'+ic('academy')+'처음 준비 다시 보기 (다 끝내셨어요)</summary><div>','</div></details>']
    : ['',''];
  $('#settingMain').innerHTML=
    '<div class="card" style="--a:var(--c4)"><h2>'+ic('check-env')+'지금 상태'+q('준비확인')+'</h2>'+
      '<p class="sub">이 컴퓨터에 필요한 게 다 있는지 한 번 봐요. 없는 건 여기서 채우시면 돼요.</p>'+
      '<div id="envBox"></div></div>'+
    온보딩[0]+
    '<div class="card" style="--a:var(--c0)"><h2>'+ic('academy')+(준비끝?'처음 준비한 네 단계':'그다음 네 단계')+'</h2>'+
      '<p class="sub">'+(준비끝?'다 끝내셨어요. 고치실 게 있으면 여기서 하시면 돼요.':'30분이면 끝나요. 순서대로 하나씩 하시면 돼요.')+'</p>'+
      '<div class="stepbar">'+[0,1,2,3].map(function(i){
        return '<i class="'+(i<n?'on':'')+'"></i>'}).join('')+'</div>'+
      '<div class="stat"><div>끝낸 단계<b>'+n+'</b></div><div>남은 단계<b style="color:var(--c2)">'+(4-n)+'</b></div></div>'+
    '</div>'+
    '<div class="steps">'+
    st(1,ok(u.basics),0,'학원 정보 알려주기',
      u.basics?'다 적어주셨어요. 고치실 게 생기면 <b>내 자료</b> 탭에서 언제든 고치실 수 있어요.'
              :'이름만 있어도 시작할 수 있어요. 나머지는 나중에 채우셔도 돼요.',
      u.basics
      ? '<div class="row"><button class="act ghost" onclick="goTo(\'learn\',\'mat\')">적어주신 내용 보기</button></div>'
      : '<div class="grid2">'+
        '<label class="fld"><b>학원 이름 *</b><input id="s_name" placeholder="○○수학 △△센터"></label>'+
        '<label class="fld"><b>지역</b><input id="s_area" placeholder="○○시 ○○구 ○○동"></label>'+
        '<label class="fld"><b>과목</b><input id="s_subject" placeholder="수학"></label>'+
        '<label class="fld"><b>대상 학년</b><input id="s_grade" placeholder="중1~고1"></label>'+
      '</div>'+
      '<label class="fld"><b>학부모가 어디로 문의하시나요</b><input id="s_channel" placeholder="네이버 톡톡, 전화, 카카오톡 채널"></label>'+
      '<label class="fld"><b>다른 학원과 다르게 하시는 게 뭔가요</b>'+
        '<textarea id="s_unique" style="min-height:80px" placeholder="숙제를 안 해오면 남겨서 시키는 대신, 왜 못 했는지부터 물어봐요"></textarea></label>'+
      '<label class="fld"><b>학부모에게 자주 듣는 질문</b>'+
        '<textarea id="s_questions" style="min-height:70px" placeholder="한 줄에 하나씩 적어주세요"></textarea></label>'+
      /* 여기 둘이 **글의 주제와 논리**를 정한다. 없으면 말투만 원장님이고
         생각은 일반 학원 블로그가 된다. 채팅 /시작 은 이걸 여쭙는데 화면은
         안 여쭤봤다 — 화면만 쓰시는 분이 손해를 보고 계셨다. */
      '<div class="item" style="--a:var(--c5);margin:12px 0 4px"><h3 style="margin:0 0 3px">여기부터는 원장님 생각이에요</h3>'+
        '<p class="sub" style="margin:0">글의 <b>주제와 논리</b>를 원장님 생각대로 짜려고 여쭤요. '+
        '말투만 비슷하고 생각이 다르면 원장님 글이 아니거든요.<br>'+
        '지금 잘 안 떠오르시면 비워두셔도 돼요. 나중에 사례가 쌓이면 저절로 드러나요.</p></div>'+
      '<label class="fld"><b>아이 성적이 안 오를 때, 무엇부터 보세요?</b>'+
        '<textarea id="s_first" style="min-height:70px" placeholder="숙제부터 봐요. 개념보다 습관을 먼저 의심해요"></textarea></label>'+
      '<label class="fld"><b>학부모님께 <u>자신 있게</u> 말씀하시는 것</b>'+
        '<textarea id="s_sure" style="min-height:60px" placeholder="왜 틀렸는지 설명하게 시키면 늡니다"></textarea></label>'+
      '<label class="fld"><b>반대로 <u>조심스럽게</u> 말씀하시는 것</b>'+
        '<textarea id="s_careful" style="min-height:60px" placeholder="몇 점 오른다는 말은 안 해요"></textarea></label>'+
      '<label class="fld"><b>블로그에 안 다루실 것</b>'+
        '<textarea id="s_never" style="min-height:60px" placeholder="다른 학원 비교, 입시 결과 자랑"></textarea></label>'+
      '<div class="row"><button class="act" onclick="saveSetup()">저장하고 다음으로</button></div>')+
    st(2,u.basics?ok(u.material):'wait',1,'자료 넣기',
      u.material?'자료를 받았어요. 다음 단계로 가시면 돼요.'
      :'예전 블로그 글, 학원 소개서, 안내문, 상담 기록, 카톡 내보내기 — 뭐든 괜찮아요.<br>'+
       '<b>많을수록 원장님 말투를 정확히 배워요.</b> 없으셔도 다음으로 넘어가실 수 있어요.',
      '<div class="row"><button class="act" onclick="go(\'learn\')">자료 넣으러 가기</button>'+
      '<span class="sub" style="margin:0">창 아무 데나 파일을 끌어다 놓으셔도 돼요</span></div>')+
    st(3,u.material?ok(u.wiki):'wait',2,'정리하기',
      u.wiki?'정리했어요. 이제 글을 쓰실 수 있어요.'
      :'넣어주신 자료를 읽어보고 사례인지 학원 자료인지 알아서 나눠 담아요.<br>말투도 여기서 배워요. 3~5분쯤 걸려요.',
      '<div class="row"><button class="act" onclick="qk(\'/정리\')">'+ic('tidy')+'정리하기</button></div>')+
    st(4,u.wiki?ok(u.wrote):'wait',3,'첫 글 쓰기',
      u.wrote?'벌써 쓰셨네요. 이제 마법사는 안 보여드릴게요.'
      :'여기까지 오시면 준비 끝이에요. 주제를 적어주시거나 글감을 찾아보세요.',
      '<div class="tochat"><span class="t">왼쪽 대화창에 <b>말씀하셔도 돼요.</b> 예) 중2 서술형 감점으로 글 써줘</span>'+
      '<button class="act ghost sm" onclick="openChatty(this)">여기에 적을게요</button></div>'+
      /* 이름이 겹치면 안 된다. 글쓰기 탭에도 id="topic" 이 있어서
         여기서 글을 쓰려 하면 **숨겨진 저쪽 입력칸을 읽고** 늘 비어 있다고 했다.
         화면에 같은 이름이 둘이면 브라우저는 먼저 나온 것만 준다. 외부 감사가 잡았다. */
      '<div class="row chatty"><input id="setupTopic" placeholder="예: 중2 서술형 감점" style="flex:1;min-width:180px">'+
      '<button class="act" onclick="setupWrite()">'+ic('topic')+'글 쓰기</button>'+
      '<button class="act ghost" onclick="harvest()">'+ic('harvest')+'글감 찾아오기</button></div>'+
      '<div id="cmdOut" style="margin-top:12px"></div>')+
    '</div>'+
    온보딩[1]+

  /* 자료 지키기·업데이트는 자주 안 만지신다. 필요할 때만 펴시게 접어둔다 */
  '<details class="fold"><summary>'+ic('backup')+'자료 옮기기 · 프로그램 새 판 받기</summary><div>'+
  '<div class="card" style="--a:var(--c5)"><h2>'+ic('backup')+'자료 옮기기 · 되살리기</h2>'+
    '<p class="sub">원장님 자료는 <b>이 컴퓨터에만</b> 저장돼요. 저희 서버는 없어요.<br>'+
    '그래서 <b>컴퓨터가 바뀌면 그대로 사라져요.</b> 가끔 묶어서 USB나 메일에 옮겨두세요.<br>'+
    '새 컴퓨터에서는 그 zip을 <b>자료와 배운 것</b> 탭에 끌어다 놓으면 되살아나요.</p>'+
    '<div class="row"><button class="act" onclick="doExport()">지금 묶어두기</button></div></div>'+

  '<div class="card" style="--a:var(--c2)"><h2>'+ic('update')+'프로그램 새 판 받기</h2>'+
    '<p class="sub">만든 사람이 보내준 업데이트 파일을 넣으면 <b>뭐가 달라졌는지</b> 알려드려요.<br>'+
    '학원 자료와 쓰신 글은 <b>건드리지 않아요.</b></p>'+
    '<div class="row"><button class="act ghost" onclick="$(\'#upick\').click()">업데이트 파일 고르기</button>'+
    '<span class="sub" style="margin:0" id="verNow"></span></div>'+
    '<input type="file" id="upick" accept=".zip" class="hide" onchange="if(this.files[0])doUpdate(this.files[0]);this.value=\'\'"></div>'+
  '</div></details>'+

  /* 노션 — 완성된 글을 원장님 노션 DB 로. **다 만들어 검증한 뒤에만** 보여드린다 */
  (켜짐('노션')?
  '<details class="fold"><summary>'+ic('link')+'노션에 쌓기'+'</summary><div>'+
  '<div class="card" style="--a:var(--c1)"><h2>'+ic('link')+'노션에 쌓기'+q('노션')+'</h2>'+
    '<div id="notionBox"><p class="sub"><span class="spin"></span> 확인 중…</p></div></div>'+
  '</div></details>':'')+

  /* 텔레그램 — 손전화에서 글감 넣기. 실동작 검증 전까지는 감춘다 */
  (켜짐('텔레그램')?
  '<details class="fold"><summary>'+ic('topic')+'손전화로 글감 보내기'+'</summary><div>'+
  '<div class="card" style="--a:var(--c4)"><h2>'+ic('topic')+'손전화로 글감 보내기'+q('텔레그램')+'</h2>'+
    '<div id="tgLink"><p class="sub"><span class="spin"></span> 확인 중…</p></div></div>'+
  '</div></details>':'')+

  /* 제안 카드를 놓치셨어도 여기서 언제든 돌리실 수 있게 */
  '<details class="fold"><summary>'+ic('tone')+'말투 다시 배우기</summary><div>'+
  '<div class="card" style="--a:var(--c0)"><h2>'+ic('tone')+'말투 다시 배우기</h2>'+
    '<p class="sub">고쳐주신 글과 새로 넣으신 자료를 다시 읽고 말투 기준을 새로 잡아요.<br>'+
    '<b>20~30분쯤 걸려요.</b> 자주 하실 필요는 없고, 글이 예전 같지 않다 싶을 때 하시면 돼요.<br>'+
    '때가 되면 <b>시작</b> 화면에서 먼저 여쭤봐요.</p>'+
    '<div class="row"><button class="act ghost" onclick="relearn(\'now\')">지금 다시 배우기</button></div></div>'+
  '</div></details>'+

  '<details class="fold"><summary>'+ic('bug')+'안 되는 게 있으세요?</summary><div>'+
  '<div class="card" style="--a:var(--c6)"><h2>'+ic('bug')+'고장 신고하기</h2>'+
    '<p class="sub">눌렀는데 아무것도 안 되거나, 엉뚱한 결과가 나왔을 때 알려주세요. 고쳐요.<br>'+
    '<b>학원 이름·전화번호·이메일은 지우고</b> 보내요. 학생 이름은 다 못 찾을 수 있어서, 보내기 전에 보여드리고 <b>직접 고치실 수 있게</b> 해드려요.</p>'+
    '<textarea id="errNote" style="min-height:76px" placeholder="글 쓰기를 눌렀는데 3분 기다려도 아무것도 안 나왔어요"></textarea>'+
    '<div class="row" style="margin-top:10px"><button class="act ghost" onclick="report()">무슨 내용이 가는지 보기</button></div></div>'+
  '</div></details>';

  if(ENV)drawEnv(); else checkEnv();
  if(켜짐('노션'))drawNotion();
  if(켜짐('텔레그램'))drawTelegram();
}

/* ── 노션 ── */
var LINKS=null;
async function drawNotion(){
  const box=$('#notionBox'); if(!box)return;
  if(!LINKS)LINKS=await api('/api/links');
  const on=LINKS&&LINKS.노션&&LINKS.노션.연결;
  const step=function(n,txt){return '<div style="display:flex;gap:10px;margin-bottom:7px">'+
    '<b style="flex:none;width:19px;height:19px;border-radius:6px;background:var(--card);color:var(--dim);'+
    'font-size:12.5px;display:flex;align-items:center;justify-content:center">'+n+'</b>'+
    '<span style="font-size:14.5px;color:var(--dim);line-height:1.65">'+txt+'</span></div>'};

  box.innerHTML= on
  ? '<p class="sub">'+ic('ok',15)+' 연결됐어요 · 열쇠 '+esc(LINKS.노션.끝자리)+'<br>'+
    '완성된 글에서 <b>노션에 보내기</b>를 누르면 쌓여요. 자동으로는 안 보내요.</p>'+
    '<div class="row"><button class="act ghost sm" onclick="notionOff()">연결 끊기</button>'+
    '<button class="act ghost sm" onclick="LINKS=null;drawNotion()">다시 확인</button></div>'

  : '<p class="sub">완성된 글을 원장님 노션 DB에 한 줄씩 쌓아요. 제목·날짜·글유형·조회수까지요.<br>'+
    '<b>노션 앱이나 MCP를 따로 설치하지 않으셔도 돼요.</b> 열쇠 하나만 넣으시면 돼요.<br>'+
    '한 번만 하시면 되고 5분쯤 걸려요.</p>'+
    step(1,'노션 → <b>설정</b> → <b>연결</b> → <b>내 연결</b> → <b>새 API 통합 만들기</b>')+
    step(2,'이름은 아무거나. 나온 <code>ntn_...</code> 또는 <code>secret_...</code> 을 복사')+
    step(3,'글을 쌓을 <b>데이터베이스 페이지</b>를 노션에 하나 만들기 (표 형태)')+
    step(4,'<b style="color:var(--c2)">그 페이지에서 ⋯ → 연결 → 방금 만든 통합을 선택</b><br>'+
      '<span style="color:var(--c2)">← 이걸 빠뜨리면 열쇠가 있어도 안 돼요. 가장 많이 놓치는 단계예요</span>')+
    '<label class="fld"><b>열쇠</b><input id="nToken" placeholder="ntn_... 또는 secret_..."></label>'+
    '<div class="row"><button class="act" onclick="notionListDbs()">다음</button>'+
    '<span class="sub" style="margin:0">열쇠가 볼 수 있는 DB 목록을 가져와요</span></div>'+
    '<div id="nDbPick"></div>'+
    '<div class="note" style="--a:var(--c5);background:var(--card2);border-radius:10px;padding:11px 13px;'+
    'margin:12px 0 0;font-size:14px;color:var(--dim);border-left:3px solid var(--c5)">'+
    '<b>이 열쇠는 자료 내보내기에 안 담겨요.</b> 새 컴퓨터에서는 다시 연결해주세요.</div>';
}
async function notionListDbs(){
  const tk=$('#nToken').value.trim();
  if(!tk)return toast('열쇠를 넣어주세요');
  const pick=$('#nDbPick');
  pick.innerHTML='<p class="sub"><span class="spin"></span> 통합이 볼 수 있는 DB를 찾는 중…</p>';
  const r=await api('/api/notion-dbs',{토큰:tk});
  if(r.error){ pick.innerHTML='<p class="sub" style="color:var(--c6)">'+ic('warn',15)+' '+esc(r.error)+'</p>'; return }
  if(!r.dbs||!r.dbs.length){
    pick.innerHTML='<p class="sub" style="color:var(--c6)">'+ic('warn',15)+' 이 열쇠가 볼 수 있는 DB가 없어요. 3~4번을 다시 확인해주세요.</p>';
    return
  }
  pick.innerHTML='<label class="fld"><b>DB 선택</b><select id="nDbSel">'+
    r.dbs.map(function(d){return '<option value="'+esc(d.id)+'">'+esc(d.title)+'</option>'}).join('')+
    '</select></label>'+
    '<div class="row"><button class="act" onclick="notionSave()">연결하기</button></div>';
}
async function notionSave(){
  const tk=$('#nToken').value.trim(), sel=$('#nDbSel'), db=sel?sel.value:'';
  if(!tk||!db)return toast('DB를 골라주세요');
  const box=$('#notionBox');
  box.innerHTML='<p class="sub"><span class="spin"></span> 노션에 물어보는 중…</p>';
  const r=await api('/api/notion-save',{토큰:tk,DB주소:db});
  if(r.error){ LINKS=null; await drawNotion();
    box.insertAdjacentHTML('afterbegin','<p class="sub" style="color:var(--c6)">'+ic('warn',15)+' '+esc(r.error)+'</p>');
    return }
  LINKS=null; await drawNotion();
  modal('<h2 class="plain" style="margin:0 0 4px;font-size:18px">노션에 연결했어요</h2>'+
    '<p class="sub">DB 이름: <b>'+esc(r.DB이름||'(제목 없음)')+'</b></p>'+
    (r.채울칸&&r.채울칸.length?'<div class="item" style="--a:var(--c0)"><h3 style="margin:0">채울 칸 '+r.채울칸.length+'개</h3>'+
      '<p class="sub" style="margin:4px 0 0">'+r.채울칸.map(esc).join(' · ')+'</p></div>':'')+
    (r.없는칸&&r.없는칸.length?'<div class="item" style="--a:var(--c2)"><h3 style="margin:0">없어서 건너뛸 칸 '+r.없는칸.length+'개</h3>'+
      '<p class="sub" style="margin:4px 0 0">'+r.없는칸.map(esc).join(' · ')+'<br>'+
      '노션 DB에 이 이름으로 칸을 만드시면 다음부터 채워요. 안 만드셔도 글은 쌓여요.</p></div>':'')+
    '<div class="row" style="margin-top:13px"><button class="act" onclick="closeModal()">알겠어요</button></div>');
}
/* ── 텔레그램 ──
   상담 끝나고 나오면서 떠오른 걸 그 자리에서 넣으시라고 있는 것이다.
   컴퓨터를 켤 때까지 기다리면 잊으신다. */
async function drawTelegram(){
  const box=$('#tgLink'); if(!box)return;
  if(!LINKS)LINKS=await api('/api/links');
  const t=LINKS&&LINKS.텔레그램;
  const step=function(n,txt){return '<div style="display:flex;gap:10px;margin-bottom:7px">'+
    '<b style="flex:none;width:19px;height:19px;border-radius:6px;background:var(--card);color:var(--dim);'+
    'font-size:12.5px;display:flex;align-items:center;justify-content:center">'+n+'</b>'+
    '<span style="font-size:14.5px;color:var(--dim);line-height:1.65">'+txt+'</span></div>'};

  if(t&&t.연결){
    box.innerHTML='<p class="sub">'+ic('ok',15)+' 연결됐어요 · 봇 열쇠 '+esc(t.끝자리)+'<br>'+
      '손전화에서 그 봇에게 보내시면 여기로 가져와요. <b>자동으로는 안 가져와요</b> — 아래를 눌러주세요.</p>'+
      '<div class="row"><button class="act" onclick="tgFetch()">보내신 것 가져오기</button>'+
      '<button class="act ghost sm" onclick="tgOff()">연결 끊기</button></div>'+
      '<div id="tgOut" style="margin-top:10px"></div>';
    return;
  }
  if(t&&t.봇있음){
    box.innerHTML='<p class="sub">봇 열쇠는 받았어요. 이제 <b>원장님 손전화와 짝을 지어야</b> 해요.<br>'+
      '남이 봇 주소를 알아도 못 넣게 하는 단계예요.</p>'+
      step(1,'손전화 텔레그램에서 <b>방금 만드신 봇</b>을 찾아 열어주세요')+
      step(2,'아무 말이나 한 번 보내주세요 (예: 안녕)')+
      step(3,'돌아와서 아래를 눌러주세요')+
      '<div class="row"><button class="act" onclick="tgPair()">보냈어요, 짝 짓기</button>'+
      '<button class="act ghost sm" onclick="tgOff()">처음부터 다시</button></div>';
    return;
  }
  box.innerHTML='<p class="sub">상담 끝나고 떠오른 이야기를 <b>그 자리에서</b> 보내두세요. '+
    '글감 창고에 쌓아뒀다가 나중에 글로 쓰실 수 있어요.<br>'+
    '<b>자동으로 글을 쓰지는 않아요.</b> 5분이면 돼요.</p>'+
    step(1,'손전화 텔레그램에서 <b>@BotFather</b> 를 찾아 열기')+
    step(2,'<code>/newbot</code> 이라고 보내고, 시키는 대로 이름을 정하기')+
    step(3,'나온 열쇠(<code>1234:AAA…</code>)를 복사해서 아래에 넣기')+
    '<label class="fld"><b>봇 열쇠</b><input id="tgToken" placeholder="1234567:AAE..."></label>'+
    '<div class="row"><button class="act" onclick="tgCheck()">다음</button>'+
    '<span class="sub" style="margin:0">열쇠가 맞는지 먼저 확인해요</span></div>'+
    '<div class="note" style="--a:var(--c5);background:var(--card2);border-radius:10px;padding:11px 13px;'+
    'margin:12px 0 0;font-size:14px;color:var(--dim);border-left:3px solid var(--c5)">'+
    '<b>이 열쇠도 자료 내보내기에 안 담겨요.</b> 새 컴퓨터에서는 다시 연결해주세요.</div>';
}
async function tgCheck(){
  const v=$('#tgToken').value.trim();
  if(!v)return toast('봇 열쇠를 넣어주세요');
  const box=$('#tgLink');
  box.innerHTML='<p class="sub"><span class="spin"></span> 열쇠를 확인하는 중…</p>';
  const r=await api('/api/tg-check',{봇토큰:v});
  LINKS=null; await drawTelegram();
  if(r.error)box.insertAdjacentHTML('afterbegin','<p class="sub" style="color:var(--c6)">'+ic('warn',15)+' '+esc(r.error)+'</p>');
  else toast('봇을 찾았어요 — '+(r.봇이름||''));
}
async function tgPair(){
  const box=$('#tgLink');
  box.innerHTML='<p class="sub"><span class="spin"></span> 보내신 메시지를 찾는 중…</p>';
  const r=await api('/api/tg-pair',{});
  LINKS=null; await drawTelegram();
  if(r.error)box.insertAdjacentHTML('afterbegin','<p class="sub" style="color:var(--c6)">'+ic('warn',15)+' '+esc(r.error)+'</p>');
  else toast('짝을 지었어요. 이제 손전화에서 보내시면 돼요');
}
async function tgOff(){
  if(!confirm('텔레그램 연결을 끊을까요?\n\n이미 가져온 글감은 그대로 남아요.'))return;
  await post('/api/tg-off',{},'연결을 끊었어요');
  LINKS=null; drawTelegram();
}
async function tgFetch(){
  const out=$('#tgOut');
  out.innerHTML='<p class="sub"><span class="spin"></span> 가져오는 중…</p>';
  const r=await api('/api/tg-fetch',{});
  if(r.error){out.innerHTML='<p class="sub" style="color:var(--c6)">'+ic('warn',15)+' '+esc(r.error)+'</p>';return}
  const 센것=[['글감',r.글감],['자료',r.자료],['스크랩',r.스크랩],['사진',r.사진]]
    .filter(function(x){return x[1]>0});
  out.innerHTML= 센것.length
    ? '<p class="sub" style="color:var(--c0)">'+ic('ok',15)+' '+
      센것.map(function(x){return x[0]+' '+x[1]+'개'}).join(' · ')+' 가져왔어요.'+
      (r.사진?' 사진은 <b>정리하기</b>를 누르시면 읽어드려요.':'')+'</p>'
    : '<p class="sub">새로 온 게 없어요.'+(r.음성?' 음성은 아직 못 알아들어요.':'')+'</p>';
  if(r.남의것)out.insertAdjacentHTML('beforeend',
    '<p class="sub" style="color:var(--c2)">모르는 분이 보낸 '+r.남의것+'건은 안 담았어요.</p>');
  load();
}
async function notionOff(){
  if(!confirm('노션 연결을 끊을까요?\n\n이미 노션에 쌓인 글은 그대로 남아요.'))return;
  await post('/api/notion-off',{},'연결을 끊었어요');
  LINKS=null; drawNotion();
}
async function notionPush(i){
  const p=P[i];
  const r=await api('/api/notion-push',{dir:p.name});
  if(r.error)return toast(r.error);
  toast('노션에 보냈어요');
  if(r.missing&&r.missing.length)
    modal('<h2 class="plain" style="margin:0 0 4px;font-size:18px">보냈어요</h2>'+
      '<p class="sub">보낸 것: <b>'+esc(r.보낸것||'최종.md')+'</b></p>'+
      '<div class="item" style="--a:var(--c2)"><h3 style="margin:0">없어서 건너뛴 칸</h3>'+
      '<p class="sub" style="margin:4px 0 0">'+r.missing.map(esc).join(' · ')+'</p></div>'+
      '<div class="row" style="margin-top:13px">'+
      (r.url?'<a class="act" style="text-decoration:none" href="'+esc(r.url)+'" target="_blank">노션에서 보기</a>':'')+
      '<button class="act ghost" onclick="closeModal()">닫기</button></div>');
}

async function saveSetup(){
  const v=function(id){const e=$('#'+id);return e?e.value.trim():''};
  if(!v('s_name'))return toast('학원 이름을 적어주세요');
  const r=await api('/api/setup',{name:v('s_name'),area:v('s_area'),subject:v('s_subject'),
    grade:v('s_grade'),channel:v('s_channel'),unique:v('s_unique'),questions:v('s_questions'),
    first:v('s_first'),sure:v('s_sure'),careful:v('s_careful'),never:v('s_never')});
  if(r&&r.error)return toast(r.error);
  toast('저장했어요. 이제 자료를 넣어주세요'); await load();
}

/* ── 시작 탭 ──
   원장님은 여기 매일 오시지 않는다. 주 1~3회, 그 사이에 무엇을 하던 중이었는지 잊는다.
   그래서 이 화면은 메뉴가 아니라 **딱 한 걸음**을 제안한다.
   카드 순서 = 급한 순서다. 위에서부터 읽다 멈추셔도 되게. */
function drawStart(){
  const u=S.setup||{};
  const done=[u.basics,u.material,u.wiki,u.wrote].filter(Boolean).length;
  /* 맨 위 문구는 상황에 맞춰 바뀐다. 처음 오신 분께 "다시 시작하세요" 는 말이 안 된다 */
  const h=$('#heroTitle'), hs=h&&h.nextElementSibling;
  if(h){
    if(!(u.basics&&u.wiki)){
      h.textContent='처음 한 번만 준비하면 돼요';
      /* 남은 단계를 숫자로 말한다. "준비하세요" 만으로는 얼마나 남았는지 모르신다 */
      if(hs)hs.textContent=(done?('지금 '+done+'/4 단계까지 하셨어요. 이어서 하시면 돼요.')
        :'학원 이야기를 한 번만 넣어주시면, 그다음부터는 주제만 적으시면 돼요.')
        +' 30분이면 끝나요.';
    }else if(S.unfinished){
      h.textContent='지난번 하시던 글이 있어요';
      if(hs)hs.textContent='이어서 하시거나, 새 글을 시작하실 수 있어요.';
    }else{
      h.textContent='오늘 블로그 글, 여기서 다시 시작하세요';
      if(hs)hs.textContent='지난번 하시던 곳부터 이어가시거나, 새 글을 바로 시작하실 수 있어요.';
    }
  }
  맨위(u);
  if(!(u.basics&&u.wiki)){
    /* 준비 중이어도 **안 된 일은 먼저 말씀드린다.** 준비하다 막히신 것일 수도 있고,
       그때가 오히려 알려주셔야 할 때다. 준비 카드보다 위에 둔다. */
    $('#startMain').innerHTML= 알림카드() +
      '<div class="card" style="--a:var(--c2)"><h2>'+ic('target')+'먼저 준비를 마쳐주세요'+q('입력창')+'</h2>'+
      '<p class="sub">처음 한 번만 하시면 돼요. 30분이면 끝나요.<br>'+
      '지금 <b>'+done+'/4</b> 단계까지 하셨어요.</p>'+
      '<div class="stepbar">'+[0,1,2,3].map(function(i){
        return '<i class="'+(i<done?'on':'')+'"></i>'}).join('')+'</div>'+
      '<div class="row" style="margin-top:14px"><button class="act" onclick="go(\'help\')">이어서 하기</button></div></div>';
    return;
  }
  const fresh=S.cases.filter(c=>c.used===0).length;
  const last=P[0], need=last&&!last.edited;
  const r=S.editRates;
  $('#startMain').innerHTML=
  (확인카드()||resumeCard())
  +알림카드()+정비카드()+relearnCard()
  +(S.fresh?'<div class="card" style="--a:var(--c2)"><h2>'+ic('warn')+'방금 정리한 '+S.fresh+'건, 한 번만 봐주세요</h2>'+
    '<p class="sub">저희가 읽고 정리한 거라 사실과 다를 수 있어요. 틀린 게 있으면 지금 고쳐주세요.</p>'+
    '<button class="act" onclick="goTo(\'learn\',\'mat\')">확인하러 가기</button></div>':'')
  +(S.inbox?'<div class="card" style="--a:var(--c1)"><h2>'+ic('tidy')+'넣어두신 자료 '+S.inbox+'개를 정리하면 바로 쓸 수 있어요</h2>'+
    '<p class="sub">읽어보고 사례인지 학원 자료인지 알아서 나눠 담아요.</p>'+
    '<button class="act" onclick="qk(\'/정리\')">정리하기</button></div>':'')
  +(need?'<div class="card" style="--a:var(--c3)"><h2>'+ic('fix')+'지난 글, 고치신 데 있으세요?</h2>'+
    '<p class="sub">"'+esc(last.title)+'" — 알려주시면 다음 글부터 반영해요.<br>'+
    '고치신 양이 줄어들수록 원장님 글에 가까워지고 있다는 뜻이에요.</p>'+
    '<button class="act" onclick="goTo(\'write\',\'posts\')">고친 글 알려주기</button></div>':'')
  +'<div class="card" style="--a:var(--c0)"><h2>'+ic('topic')+'오늘 바로 시작</h2>'+
    '<p class="sub">주제가 떠오르셨으면 바로 적으시고, 아니면 골라 쓰셔도 돼요.</p>'+
    '<div class="tochat"><span class="t">왼쪽 대화창에 <b>말씀하셔도 돼요.</b> 예) 중2 서술형 감점으로 글 써줘</span>'+
    '<button class="act ghost sm" onclick="openChatty(this)">여기에 적을게요</button></div>'+
    '<div class="row chatty"><input id="startTopic" placeholder="예: 중2 서술형에서 답은 맞는데 점수가 깎여요" style="flex:1;min-width:220px">'+
    '<button class="act" onclick="startWrite()">이 주제로 글 쓰기</button></div>'+
    '<div class="row" style="margin-top:10px">'+
    '<button class="act ghost sm" onclick="propose()">'+ic('propose')+'뭘 쓸지 제안받기</button>'+
    (S.topics?'<button class="act ghost sm" onclick="goTo(\'write\',\'topics\')">'+ic('topic')+'모아둔 글감 '+S.topics+'개</button>':
      '<button class="act ghost sm" onclick="harvest()">'+ic('topic')+'글감 찾아오기</button>')+
    '</div><div id="startOut" style="margin-top:12px"></div></div>'
  +'<div class="card" style="--a:var(--c5)"><h2>'+ic('chart')+'지금 상태</h2><div class="stat">'+
    '<div>쓴 글<b>'+S.posts+'</b></div>'+
    '<div>사례<b>'+S.cases.length+'</b></div>'+
    '<div>안 쓴 사례<b style="color:'+(fresh<=2?'var(--warn)':'var(--c0)')+'">'+fresh+'</b></div>'+
    '<div>편집률<b style="color:var(--c1)">'+(r.length?r[r.length-1]+'%':'—')+'</b></div></div>'+
    (fresh<=2?'<p class="sub" style="color:var(--warn);margin-top:14px">이번 주 있었던 일을 하나만 넣어주시면 다음 글감이 생겨요.</p>':'')+
    '</div>';
}
/* 말투 다시 배우기 — 프로그램 업데이트 알림과 같은 자리다.
   매번 배우면 느리고 비싸다. 영영 안 배우면 원장님 말투에서 멀어진다.
   그래서 쌓이면 제안만 하고, **돌릴지는 원장님이 정하신다.**
   20~30분짜리라 "오늘 밤에" 를 고르실 수 있어야 한다. */
/* 안 된 일이 쌓였을 때 시작 화면에서 먼저 여쭙는다.
   원장님이 "알려주는 자리" 를 찾아가실 이유가 없다 — 여기서 바로 하시게 한다. */
/*
 * 자료 정비 제안함.
 *
 * **고치지 않는다. 보여드리고 여쭙는다** (헌장 4번).
 * 근거를 같이 낸다 — "왜 이게 문제인지" 를 모르시면 판단하실 수가 없다.
 * 무엇을 하시면 되는지도 한 줄로 적는다. "정리가 필요합니다" 만으로는
 * 무엇을 어떻게 하라는 건지 모르신다.
 *
 * 급한 것 두 개까지만 낸다. 다섯 개를 한꺼번에 내면 하나도 안 하신다.
 */
var 정비접기 = {};
function 정비카드(){
  const 것들 = (S.자료건강 || []).filter(function(x){ return !정비접기[x.무엇] });
  if(!것들.length) return '';
  const 아이콘 = {오래됨:'warn', 겹침:'tags', 안쓰임:'tidy', 빈칸:'warn', 안맞음:'warn'};
  return 것들.slice(0,2).map(function(x){
    return '<div class="card" style="--a:var(--c'+(x.급함===1?'6':x.급함===2?'2':'1')+')">'+
      '<h2>'+ic(아이콘[x.종류]||'warn')+esc(x.무엇)+'</h2>'+
      '<p class="sub">'+esc(x.까닭)+'</p>'+
      '<div class="meta" style="margin:9px 0">'+
        x.대상.slice(0,6).map(function(t){return '<span class="tag">'+esc(t)+'</span>'}).join('')+
        (x.대상.length>6?'<span class="tag">외 '+(x.대상.length-6)+'건</span>':'')+
      '</div>'+
      '<p class="sub" style="color:var(--ink)"><b>'+esc(x.뭐하면되나)+'</b></p>'+
      '<div class="row" style="margin-top:11px">'+
      '<button class="act" onclick="go(\'learn\')">자료 보러 가기</button>'+
      '<button class="act ghost sm" onclick="정비접기[\''+esc(x.무엇).replace(/'/g,"")+'\']=1;drawStart()">나중에</button>'+
      '</div></div>';
  }).join('');
}

function 알림카드(){
  const a=S.알릴것;
  if(!a||ALERT_HIDE)return '';
  return '<div class="card" style="--a:var(--c6)">'+
    '<h2>'+ic('warn')+'안 된 일이 '+a.수+'건 있어요</h2>'+
    '<p class="sub">저희가 알아서 모아뒀어요. <b>만든 사람에게 알려주시면 고칠 수 있어요.</b><br>'+
    '무엇이 가는지 먼저 보여드리고, 원장님이 고쳐서 보내실 수 있어요. '+
    '글 내용은 한 글자도 안 가요.<br>'+
    '<span style="color:var(--dim2)">가장 최근: '+esc(a.최근)+'</span></p>'+
    '<div class="row" style="margin-top:12px">'+
    '<button class="act" onclick="report()">무엇이 가는지 보기</button>'+
    '<button class="act ghost sm" onclick="ALERT_HIDE=true;drawStart()">나중에</button></div></div>';
}
var ALERT_HIDE=false;

function relearnCard(){
  const r=S.재학습;
  if(!r||RELEARN_HIDE)return '';
  return '<div class="card" style="--a:var(--'+(r.급함?'c2':'c5')+')">'+
    /* 못 배우고 있을 때는 제목부터 다르게 말씀드린다. "다시 배울까요?" 는
       잘 되고 있다는 뜻으로 읽힌다. 열 편을 45%씩 고치고 계신데 그러면 안 된다. */
    '<h2>'+ic('tone')+(r.못배움?'제가 잘 못 배우고 있어요':'말투를 다시 배울까요?')+'</h2>'+
    '<p class="sub">'+esc(r.이유)+'.'+
    (r.새글?' 새 글 '+r.새글+'편':'')+(r.새피드백?' · 고쳐주신 것 '+r.새피드백+'건':'')+
    '이 쌓였어요.<br>'+
    (r.못배움
      ? '고쳐주신 걸 배우고 있는데 <b>고치시는 양이 안 줄고 있어요.</b> '
        + '제가 엉뚱한 걸 배우고 있을 수 있어요.<br>'
        + '다시 배우면 나아질 수 있고, 그래도 그대로면 알려주세요 — 만든 사람이 봐야 할 문제예요. '
      : '다시 배우면 다음 글이 원장님 말투에 더 가까워져요. ')+
    '<b>20~30분쯤 걸려요</b> — 그동안 다른 일 하셔도 돼요.</p>'+
    '<div class="row" style="margin-top:12px">'+
    '<button class="act" onclick="relearn(\'now\')">지금 할게요</button>'+
    '<button class="act ghost" onclick="relearn(\'night\')">밤에 하려면?</button>'+
    '<button class="act ghost sm" onclick="relearn(\'later\')">나중에</button></div>'+
    '<div id="relearnOut" style="margin-top:10px"></div></div>';
}
var RELEARN_HIDE=false;
function relearn(when){
  if(when==='later'){ RELEARN_HIDE=true; drawStart(); return toast('다음에 다시 여쭤볼게요') }
  if(when==='night'){
    RELEARN_HIDE=true; drawStart();
    return modal('<h2 class="plain" style="margin:0 0 4px;font-size:18px">오늘 밤에 하려면</h2>'+
      '<p class="sub">프로그램이 꺼져 있으면 혼자 못 해요. 서버가 없거든요.<br>'+
      '<b>주무시기 전에 이 창을 열어두고 <span style="color:var(--c0)">지금 할게요</span>를 눌러주세요.</b><br>'+
      '20~30분 걸리고, 끝나면 알림으로 알려드려요. 창은 닫으셔도 돼요.</p>'+
      '<div class="row" style="margin-top:13px">'+
      '<button class="act" onclick="closeModal();RELEARN_HIDE=false;drawStart()">알겠어요</button></div>');
  }
  /* 전에는 /정리 를 불렀다. 그건 **새 자료를 분류하는** 명령이라
     화면이 약속한 "고쳐주신 걸 다시 배운다" 와 하는 일이 달랐다. */
  runPrompt('/말투재학습','말투 다시 배우는 중');
}

/* 쓰다 만 글 — 없으면 아무것도 안 그린다.
   원장님이 "지난번에 뭐 했더라"에 답을 못 찾는 게 이 제품의 가장 큰 이탈 지점이었다 */
function resumeCard(){
  const w=S.unfinished;
  if(!w)return '';
  return '<div class="card" style="--a:var(--c3)"><h2>'+ic('fix')+'지난번 쓰시던 글이 남아 있어요</h2>'+
    '<p class="sub"><b>"'+esc(w.title)+'"</b><br>'+
    esc(w.step)+'까지 하다 멈췄어요'+(w.ago?' · '+esc(w.ago):'')+'</p>'+
    '<div class="row" style="margin-top:12px">'+
    '<button class="act" onclick="qk(\'/글쓰기\')">이어서 쓰기</button>'+
    '<button class="act ghost" onclick="go(\'write\')">새 글로 시작</button></div></div>';
}
/* 시작 탭에서 주제를 적으면 글쓰기 탭으로 넘겨준다. 입력을 두 번 시키지 않는다 */
/* 준비 마법사에서 쓰는 첫 글 시작. 글쓰기 탭의 입력칸과 이름이 겹치면 안 된다 */
function setupWrite(){
  const v=$('#setupTopic').value.trim();
  if(!v)return toast('무엇에 대해 쓸지 한 줄만 적어주세요');
  go('write');
  setTimeout(function(){ const t=$('#topic'); if(t){t.value=v; writeNow()} },120);
}

function startWrite(){
  const v=$('#startTopic').value.trim();
  if(!v)return toast('무엇에 대해 쓸지 한 줄만 적어주세요');
  go('write');
  setTimeout(function(){ const t=$('#topic'); if(t){t.value=v; writeNow()} },120);
}

/* ── 글쓰기 탭 ── */
function drawWrite(){
  const u=S.setup||{};
  if(!(u.basics&&u.wiki)){
    $('#writeMain').innerHTML='<div class="card" style="--a:var(--c2)"><h2>'+ic('target')+'준비를 먼저 마쳐주세요</h2>'+
      '<p class="sub">학원 정보가 있어야 글에 근거를 댈 수 있어요.</p>'+
      '<div class="row"><button class="act" onclick="go(\'help\')">준비하러 가기</button></div></div>';
    return;
  }
  $('#writeMain').innerHTML=확인카드()+
  '<div class="card" style="--a:var(--c0)"><h2>'+ic('topic')+'무슨 글을 쓸까요'+q('입력창')+'</h2>'+
    '<p class="sub">주제를 한 줄로 적어주세요. 나머지는 알아서 정해요.<br>'+
    '<b>누구에게 쓸지도 여기에 같이 적으시면 돼요</b> — 학년, 학교, 시기, 상황 아무거나요.</p>'+
    '<div class="tochat"><span class="t">왼쪽 대화창에 <b>말씀하셔도 돼요.</b> 아래 단추로 고르신 건 그대로 반영돼요</span>'+
    '<button class="act ghost sm" onclick="openChatty(this)">여기에 적을게요</button></div>'+
    '<div class="row chatty"><input id="topic" placeholder="예: 중2 서술형 감점 / 백석중 2학기 기말 대비 / 예비중1 겨울방학" style="flex:1;min-width:200px">'+
    '<button class="act" onclick="writeNow()">글 쓰기</button></div>'+
    '<div class="row" style="margin-top:8px;gap:6px;flex-wrap:wrap">'+
    ['중1','중2','중3','초5','초6','예비중1','기말 대비','겨울방학','상담 앞두고']
      .map(function(w){return '<button class="act ghost sm" style="padding:3px 10px;font-size:13.5px" '+
        'onclick="addWord(\''+w+'\')">'+w+'</button>'}).join('')+
    '<span class="sub" style="margin:0;font-size:13.5px">눌러서 덧붙이셔도 돼요</span></div>'+
    모드고르기()+
    '<div class="row" style="margin-top:10px">'+
    '<button class="act ghost sm" onclick="harvest()">글감 찾아오기</button>'+
    '<button class="act ghost sm" onclick="propose()">'+ic('propose')+'제안받기</button></div>'+
    '<div class="row" style="margin-top:10px">'+
      '<button class="act ghost sm" onclick="togTarget()" id="tgBtn">'+ic('target')+'글의 방식을 직접 고르고 싶다면 ▾</button>'+
      '<span class="sub" style="margin:0">안 고르셔도 돼요. 그러면 알아서 정해요</span></div>'+
    '<div id="tgBox" class="hide split" style="margin-top:4px"></div>'+
    '<div id="cmdOut" style="margin-top:12px"></div></div>'
  +useBars();
}
function useBars(){
  if(!S.cases.length)return '';
  const max=Math.max(4,...S.cases.map(function(c){return c.used}));
  /* 정렬: 적게 쓴 것 먼저, 같으면 **오래전에 쓴 것** 먼저.
     검수기(suggestCases)가 쓰는 순서와 같게 맞춘다 — 화면과 검수기가 다른 말을 하면 안 된다.
     전에는 화면이 횟수만 봐서, 어제 쓴 사례와 반년 전 사례가 같은 자리에 있었다. */
  const rows=S.cases.slice().sort(function(a,b){
    if(a.used!==b.used)return a.used-b.used;
    const A=(a.전==null?9999:a.전), B=(b.전==null?9999:b.전);
    return B-A;                                   // 오래전에 쓴 것(전이 큰 것)이 위로
  }).slice(0,8);
  const 언제=function(c){
    if(c.used===0)return '아직 안 썼어요 · 지금 쓰기 좋아요';
    if(c.전===0)return c.used+'번 · <b style="color:var(--c6)">바로 지난 글에 썼어요</b>';
    if(c.전!=null&&c.전<5)return c.used+'번 · '+c.전+'편 전에 썼어요 — 지금 쓰면 막혀요';
    if(c.전!=null)return c.used+'번 · '+c.전+'편 전에 썼어요 · 이제 다시 쓰셔도 돼요';
    return c.used+'번 썼어요';
  };
  return '<div class="card" style="--a:var(--c2)"><h2>'+ic('case')+'사례 사용 현황'+q('사례사용')+'</h2>'+
    '<p class="sub">위쪽부터 쓰시면 돼요. <b>최근 5편에 나온 사례는 검수기가 막아요</b> — '+
    '같은 아이 이야기가 이어지면 학원이 좁아 보이거든요.</p>'+
    rows.map(function(c,i){
      const w=Math.round(22+c.used/max*78);
      const dark=w>=50;
      const 뜨거움=(c.전!=null&&c.전<5);
      return '<div class="usebar'+(dark?' dark':'')+'"'+ac(i)+
        (뜨거움?' style="opacity:.55"':'')+'>'+
        '<i style="width:'+w+'%"></i>'+
        '<span class="lbl">'+esc(c.name)+'<small>'+언제(c)+'</small></span>'+
        '<span class="n">'+c.used+'</span></div>'}).join('')+
    (S.cases.length>8?'<p class="sub" style="margin-top:10px">…그리고 '+(S.cases.length-8)+'건 더 있어요. '+
      '<b>내 자료</b>에서 다 보실 수 있어요.</p>':'')+
    '</div>';
}
/* 타겟 지정 — 강의의 독자상태 × 글유형 × 대표자산.
   아무것도 안 고르면 지금과 똑같이 돈다. 고르고 싶은 분만 편다 */
var TX=null, PICK={reader:'',template:'',asset:''};
async function togTarget(){
  const box=$('#tgBox'), btn=$('#tgBtn');
  const opening=box.classList.contains('hide');
  box.classList.toggle('hide');
  btn.textContent=opening?'글의 방식을 직접 고르고 싶다면 ▴':'글의 방식을 직접 고르고 싶다면 ▾';
  if(!opening)return;
  if(!TX){box.innerHTML='<p class="sub"><span class="spin"></span> 불러오는 중…</p>'; TX=await api('/api/taxonomy')}
  drawTarget();
}
function pickBtn(kind,x,i,label,sub,mark){
  const on=PICK[kind]===x.id;
  return '<button class="'+(on?'on ':'')+(mark||'')+'" style="--a:var(--c'+(i%7)+')" '+
    'onclick="setPick(\''+kind+'\',\''+x.id+'\')">'+
    '<span>'+esc(label)+'</span>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</button>';
}
function drawTarget(){
  const box=$('#tgBox'); if(!box||!TX)return;
  const r=(TX.readers||[]).find(function(x){return x.id===PICK.reader});
  box.innerHTML=
    '<p class="sub" style="margin:0 0 10px">여기는 <b>글을 어떻게 쓸지</b>를 고르는 곳이에요.<br>'+
    '학년·학교·시기처럼 <b>누구에게</b> 쓸지는 위 주제칸에 적어주세요.</p>'+
    '<div class="fld2"><b>이 글을 읽을 학부모는 지금 어떤 상태인가요</b>'+
      '<div class="pick">'+(TX.readers||[]).map(function(x,i){
        return pickBtn('reader',x,i,x.id,x.gist,x.done?'done':'gap')}).join('')+'</div>'+
      (r?'<p class="sub" style="margin:6px 0 0;font-size:14px">'+esc(r.why)+'<br>'+
        '제목은 <b>'+esc(r.title)+'</b> — '+esc(r.titleForm)+'</p>':'')+'</div>'+
    '<div class="fld2"><b>어떻게 설명할까요'+q('글유형')+'</b>'+
      '<div class="pick">'+(TX.templates||[]).map(function(x,i){
        const rec=r&&(r.first===x.id||r.second===x.id);
        return pickBtn('template',x,i,x.label+(rec?(r.first===x.id?' ★':' ☆'):''),x.gist,x.done?'done':'gap')}).join('')+'</div>'+
      (r?'<p class="sub" style="margin:6px 0 0;font-size:14px">★ 이 상태에 우선 맞는 방식 · ☆ 보완하는 방식</p>':'')+'</div>'+
    '<div class="fld2"><b>블로그의 어떤 자리를 채울까요'+q('대표자산')+'</b>'+
      '<div class="pick">'+(TX.assets||[]).map(function(x,i){
        return pickBtn('asset',x,i,x.label,x.q,x.done?'done':'gap')}).join('')+'</div></div>'+
    '<div class="row"><button class="act ghost sm" onclick="clearPick()">고른 것 지우기</button>'+
      '<span class="sub" style="margin:0" id="pickSum"></span></div>';
  const sum=[PICK.reader,PICK.template,PICK.asset].filter(Boolean);
  const el=$('#pickSum'); if(el)el.textContent=sum.length?sum.join(' · ')+' 로 씁니다':'아직 아무것도 안 고르셨어요';
}
function setPick(kind,id){
  PICK[kind]=PICK[kind]===id?'':id;
  // 독자 상태를 고르면 맞는 글유형을 미리 넣어둔다. 바꾸셔도 된다
  if(kind==='reader'&&PICK.reader&&!PICK.template){
    const r=(TX.readers||[]).find(function(x){return x.id===PICK.reader});
    if(r)PICK.template=r.first;
  }
  drawTarget();
}
function clearPick(){PICK={reader:'',template:'',asset:''};drawTarget()}

function writeNow(){
  const v=$('#topic').value.trim();
  if(!v)return toast('주제를 적어주세요');
  const opt=[
    PICK.reader?'독자상태='+PICK.reader:'',
    PICK.template?'글유형='+PICK.template:'',
    PICK.asset?'대표자산='+PICK.asset:'',
    '모드='+MODE,                       // 어디서 멈춰 여쭐지. 지시서가 이 값을 읽는다
  ].filter(Boolean).join(' ');
  runPrompt('/글쓰기 '+v+(opt?(' — '+opt):''),'글 쓰는 중: '+v);
}
/* 지금 보이는 탭의 출력칸을 찾는다.
   같은 단추가 시작 탭에도 글쓰기 탭에도 있는데, 출력칸 이름은 서로 다르다.
   한 이름만 보고 쓰면 다른 탭에서는 대상이 없어 **아무 일도 안 일어난다** —
   오류도 안 뜬다. 실제로 시작 탭의 '뭘 쓸지 제안받기' 가 그렇게 죽어 있었다. */
function outSlot(){
  const 보이는곳=['#startOut','#cmdOut'].map(function(s){return $$(s)}).flat()
    .filter(function(el){ return el.offsetParent!==null });   // 숨은 탭 안은 제외
  return 보이는곳[0] || $('#startOut') || $('#cmdOut');
}
async function propose(){
  const box=outSlot();
  if(!box)return toast('결과를 보여드릴 자리를 못 찾았어요');
  box.innerHTML='<p class="sub"><span class="spin"></span> 지난 글을 훑어보는 중…</p>';
  const list=await api('/api/propose');
  if(list&&list.error){box.innerHTML='<p class="sub">'+esc(list.error)+'</p>';return}
  box.innerHTML=list.length?
    ('<h3 style="margin:4px 0 9px;font-size:15px;font-weight:700;color:var(--dim)">'+
     '지난 글을 보고 드리는 말씀'+q('제안받기')+'</h3>')+
    list.slice(0,3).map(function(p,i){return '<div class="item"'+ac(i)+'><h3>'+esc(p.headline)+'</h3>'+
    '<p class="sub" style="margin:3px 0">'+esc(p.detail)+'</p>'+
    (p.ask?'<p style="font-size:15px;color:var(--a);margin:0">'+esc(p.ask)+'</p>':'')+'</div>'}).join('')
    : '<p class="sub">지금은 짚어드릴 게 없어요. 균형이 괜찮다는 뜻이에요.'+q('제안받기')+'</p>';
}

function harvest(){
  const k=($('#topic')&&$('#topic').value.trim())||'';
  runPrompt('/글감수집 '+k, k?('글감 찾는 중: '+k):'요즘 뭘 궁금해하는지 찾는 중');
}

const FROM={'찾아옴':'🔎 웹에서 찾아온 것','직접':'✍️ 직접 넣으신 것','함께옴':'📦 업데이트로 온 것'};
function drawTopics(){
  const live=T.filter(function(x){return !x.used}), done=T.filter(function(x){return x.used});
  const by=function(k){return live.filter(function(x){return (x.from||'찾아옴')===k}).length};
  const card=function(x,i,k){return '<div class="card"'+ac(k)+'>'+
    '<div class="meta" style="margin-bottom:8px"><span class="pill">'+esc(x.date||'새 글감')+'</span></div>'+
    '<h3 style="margin:0 0 6px;font-size:17px;font-weight:700">'+esc(x.topic)+'</h3>'+
    '<div class="meta">'+
      (x.case?'<span class="tag sig">'+esc(x.case.replace(/\.md$/,''))+' 사례로 쓸 수 있어요</span>':'<span class="tag warn">사례 없이 일반론</span>')+
      (x.used?'<span class="tag">이미 썼어요</span>':'')+'</div>'+
    (x.why?'<p class="sub" style="margin:9px 0 0"><b>왜 지금</b> · '+esc(x.why)+'</p>':'')+
    (x.angle?'<p class="sub" style="margin:4px 0 0"><b>이렇게</b> · '+esc(x.angle)+'</p>':'')+
    ((x.sources&&x.sources.length)?'<p class="sub" style="margin:6px 0 0">'+
      x.sources.slice(0,3).map(function(s,i){return '<a href="'+esc(s)+'" target="_blank">출처'+(i+1)+'</a>'}).join(' · ')+'</p>':'')+
    '<div class="row" style="margin-top:12px">'+
      (x.used?'':'<button class="act sm" onclick="writeTopic('+i+')">이걸로 글 쓰기</button>')+
      '<button class="act ghost sm" style="color:var(--c6)" onclick="delTopic('+i+')">'+ic('trash')+'지우기</button></div>'+
    '</div>'};
  /* 글감은 "지금 쓸 것"이 아니라 "쌓아두는 것"이다.
     쌓인 게 있으면 펼쳐두고, 없으면 접어둔다 — 빈 창고 설명이 글쓰기 입력을 밀어내면 안 된다 */
  $('#topics').innerHTML=
    '<details class="fold"'+(live.length?' open':'')+'><summary>'+ic('harvest')+'쓸 거리 창고'+
      (live.length?' <span style="font-weight:400;color:var(--dim)">— '+live.length+'개 쌓여 있어요</span>'
                  :' <span style="font-weight:400;color:var(--dim)">— 아직 비어 있어요</span>')+'</summary><div>'+
    '<div class="card" style="--a:var(--c4)"><h2>'+ic('harvest')+'글감 찾아오기'+q('글감수집')+'</h2>'+
      '<p class="sub">요즘 학부모들이 뭘 궁금해하는지 한 바퀴 돌고 와서 알려드려요. 자동으로 글을 쓰지는 않아요.</p>'+
      '<div class="tochat"><span class="t">왼쪽 대화창에 <b>말씀하셔도 돼요.</b> 예) 겨울방학 글감 좀 찾아줘</span>'+
      '<button class="act ghost sm" onclick="openChatty(this)">여기에 적을게요</button></div>'+
      '<div class="row chatty"><input id="hkey" placeholder="관심 키워드 (비워두시면 학원 정보 기준으로 찾아요)" style="flex:1;min-width:220px">'+
      '<button class="act" onclick="harvestKey()">찾아오기</button></div>'+
      (live.length?'<div class="stat" style="margin-top:16px">'+
        '<div>웹에서 찾아온 것<b style="color:var(--c4)">'+by('찾아옴')+'</b></div>'+
        '<div>직접 넣으신 것<b style="color:var(--c0)">'+by('직접')+'</b></div>'+
        '<div>업데이트로 온 것<b style="color:var(--c2)">'+by('함께옴')+'</b></div></div>':'')+
      '</div>'+
    '<div class="card" style="--a:var(--c0)"><h2>'+ic('topic')+'쓰고 싶은 주제가 떠오르셨으면'+q('글감창고')+'</h2>'+
      '<p class="sub">한 줄로 적어두세요. 지금 안 쓰셔도 남아 있어요.<br>'+
      '<b>책 요약·세미나 정리·기사처럼 긴 자료는 여기가 아니라 <a href="#" onclick="go(\'learn\');return false">자료 넣기</a>에 주세요.</b> 읽어보고 알아서 나눠 담아요.</p>'+
      '<div class="row"><input id="myTopic" placeholder="예: 겨울방학 선행, 얼마나 나가야 하나요" style="flex:1;min-width:220px">'+
      '<button class="act" onclick="addTopic()">한 줄 적어두기</button></div></div>'+
    (live.length?live.map(function(x,k){return card(x,T.indexOf(x),k)}).join('')
      :'<div class="card" style="--a:var(--c2)"><h2>'+ic('propose')+'창고가 비어 있어요</h2>'+
        '<p class="sub">여기는 <b>쓸 거리를 모아두는 곳</b>이에요. 세 군데서 들어와요.</p>'+
        '<div class="item" style="--a:var(--c4)"><h3 style="margin:0">🔎 웹에서 찾아온 것</h3>'+
          '<p class="sub" style="margin:4px 0 0">위 <b>찾아오기</b>를 누르시면 요즘 학부모가 뭘 묻는지 가져와요. 출처 링크가 붙어요.</p></div>'+
        '<div class="item" style="--a:var(--c0)"><h3 style="margin:0">✍️ 직접 넣으신 것</h3>'+
          '<p class="sub" style="margin:4px 0 0">떠오른 주제를 적어두세요. 기사나 유튜브 링크는 <b>자료 넣기</b>에서 주시면 돼요.</p></div>'+
        '<div class="item" style="--a:var(--c2)"><h3 style="margin:0">📦 업데이트로 온 것</h3>'+
          '<p class="sub" style="margin:4px 0 0">만든 사람이 모아 보낸 글감이 업데이트에 실려 오기도 해요.</p></div>'+
        '</div>')+
    (done.length?'<div class="card"><h2 class="plain">이미 쓴 글감 '+done.length+'개</h2>'+
      '<p class="sub">기록으로 남겨둬요. 같은 주제를 또 쓰지 않게요.</p>'+
      done.map(function(x){return '<div class="item"><h3 style="margin:0">'+esc(x.topic)+'</h3></div>'}).join('')+'</div>':'')+
    '</div></details>';
}
async function addTopic(){
  const v=$('#myTopic').value.trim();
  if(!v)return toast('쓰고 싶은 주제를 적어주세요');
  const r=await post('/api/topic-add',{topic:v},'창고에 넣었어요');
  if(r){$('#myTopic').value=''; load()}
}
async function delTopic(i){
  const x=T[i];
  if(!confirm('"'+x.topic+'"\n\n이 글감을 지울까요?'))return;
  await api('/api/topic-remove',{topic:x.topic});
  toast('지웠어요'); load();
}
function harvestKey(){
  const k=$('#hkey').value.trim();
  runPrompt('/글감수집 '+k, k?('글감 찾는 중: '+k):'요즘 뭘 궁금해하는지 찾는 중');
}
async function writeTopic(i){
  const x=T[i];
  await api('/api/topic-used',{topic:x.topic});
  runPrompt('/글쓰기 '+x.topic+(x.case?(' — '+x.case+' 사례를 근거로'):'')+
    (x.angle?(' — 각도: '+x.angle):''),'글 쓰는 중: '+x.topic);
}

/* 맨 위 자리는 **지금 하실 수 있는 것**만 놓는다.
 *
 * 준비가 안 됐는데 "중2 서술형 감점으로 글 써줘" 를 제일 크게 보여주면,
 * 원장님은 그걸 눌러보고 안 되는 걸 겪으신다. 그리고 그게 첫 경험이 된다.
 * 빠른 단추 넷도 마찬가지였다 — 사례가 0건이면 글감수집도 제안도 헛돈다.
 *
 * 글쓰기 탭은 이미 "준비를 먼저 마쳐주세요" 로 막는다. 시작 탭만 안 막고 있었다.
 */
function 맨위(u){
  const 준비됨 = u.basics && u.wiki;
  const ask = $('#heroAsk'), quick = $('#heroQuick');
  if (ask) { ask.dataset.준비안됨 = 준비됨 ? '' : '1'; ask.classList.toggle('hide', !준비됨); }
  if (!quick) return;
  quick.innerHTML = (준비됨
    ? [['harvest()','글감 수집하기'],
       ["qk('/제안')",'뭘 쓸지 제안받기'],
       ["qk('/정리')",'넣어둔 자료 정리하기'],
       ["qk('/점검')",'지금 상태 점검']]
    /* 준비 중에는 준비에 쓰이는 것만. 순서도 하실 순서대로 */
    : [["go('learn')",'학원 이야기 넣기'],
       ["qk('/정리')",'넣어둔 자료 정리하기'],
       ["qk('/설치')",'프로그램 점검']]
  ).map(function(b){ return '<button onclick="'+b[0]+'">'+b[1]+'</button>' }).join('');
}
/* 지금까지 쓴 글이 어디에 몰렸는지 — 숫자로 보여준다 */
function postDash(){
  if(P.length<2)return '';
  const tally=function(get){
    const m={};
    P.forEach(function(p){const v=get(p); if(v)m[v]=(m[v]||0)+1});
    return Object.keys(m).map(function(k){return {k:k,n:m[k]}}).sort(function(a,b){return b.n-a.n});
  };
  const bars=function(title,rows,note){
    if(!rows.length)return '';
    const max=Math.max.apply(null,rows.map(function(r){return r.n}));
    return '<h3 style="margin:16px 0 8px;font-size:15px;font-weight:700;color:var(--dim)">'+title+'</h3>'+
      rows.slice(0,6).map(function(r,i){
        const w=Math.round(20+r.n/max*80), dark=w>=50;
        return '<div class="usebar'+(dark?' dark':'')+'" style="height:36px;--a:var(--c'+(i%7)+')">'+
          '<i style="width:'+w+'%"></i>'+
          '<span class="lbl" style="font-size:14.5px">'+esc(r.k)+'</span>'+
          '<span class="n" style="font-size:16px">'+r.n+'</span></div>'}).join('')+
      (note?'<p class="sub" style="margin:6px 0 0;font-size:14px">'+note+'</p>':'');
  };
  const grade=tally(function(p){return p.axes&&p.axes.학년});
  const trouble=tally(function(p){return p.axes&&p.axes.문제상황});
  const tpl=tally(function(p){return p.template});
  const withStat=P.filter(function(p){return p.views});
  const totalViews=withStat.reduce(function(a,p){return a+p.views},0);
  const skew=grade.length&&grade[0].n/P.length>=0.6?grade[0].k:'';

  return '<div class="card" style="--a:var(--c5)"><h2>'+ic('chart')+'지금까지 쓰신 글'+q('완성글')+q('검수')+'</h2>'+
    '<div class="stat">'+
      '<div>글<b>'+P.length+'</b></div>'+
      '<div>다룬 학년<b style="color:var(--c1)">'+grade.length+'</b></div>'+
      '<div>쓴 형식<b style="color:var(--c0)">'+tpl.length+'/4</b></div>'+
      (withStat.length?'<div>총 조회수<b style="color:var(--c2)">'+totalViews.toLocaleString()+'</b></div>':'')+
      '<div>피드백 준 글<b style="color:var(--c3)">'+P.filter(function(p){return p.edited}).length+'</b></div>'+
    '</div>'+
    (skew?'<p class="sub" style="margin:14px 0 0;color:var(--warn)">글의 '+
      Math.round(grade[0].n/P.length*100)+'%가 <b>'+esc(skew)+'</b>에 몰려 있어요. '+
      '다른 학년도 하나쯤 있으면 학원이 넓어 보여요.</p>':'')+
    bars('학년',grade)+
    bars('문제 상황',trouble)+
    bars('글 형식',tpl, tpl.length<3?'형식이 두세 가지로 굳으면 블로그 전체가 한 톤으로 보여요.':'')+
    (withStat.length<2?'<p class="sub" style="margin:14px 0 0">'+
      '<b>네이버 통계를 붙이시면</b> 어떤 글이 실제로 읽혔는지까지 보여드려요. '+
      '<a href="#" onclick="go(\'learn\');return false">붙이러 가기</a></p>':'')+
    '</div>';
}

function statsCard(){
  return '<div class="card" style="--a:var(--c1)"><h2>'+ic('views')+'어떤 글이 읽혔나요'+q('통계')+'</h2>'+
    '<p class="sub"><b>네이버 블로그 관리 → 통계 → 게시물별 조회수</b> 에서 표를 드래그해 복사한 다음 '+
    '아래에 붙여넣으세요. 엑셀로 받으셨으면 <b>CSV로 저장</b>해서 자료 탭에 끌어다 놓으셔도 돼요.<br>'+
    '제목이 잘려 있어도 알아서 찾아 이어요.</p>'+
    '<textarea id="statBox" style="min-height:96px;font:14.5px/1.7 ui-monospace,Menlo,monospace" '+
    'placeholder="제목&#9;조회수&#9;유입경로&#10;중2 서술형 감점 왜 생기나요&#9;1,240&#9;네이버 검색"></textarea>'+
    '<div class="row" style="margin-top:10px"><button class="act" onclick="saveStats()">이어 붙이기</button>'+
    '<span class="sub" style="margin:0">붙이면 어떤 글유형이 잘 읽혔는지 알려드려요</span></div>'+
    '<div id="statOut" style="margin-top:12px"></div></div>';
}

/* 이 글에 반영된 말투 — 원장님이 "내 말투가 들어갔구나" 를 보시는 자리.
   말투를 배운다고 말만 하고 결과를 안 보여주면 원장님은 믿을 근거가 없다.
   배운 게 아직 없으면 어떻게 하면 쌓이는지 알려드린다 — 빈 칸은 고장으로 읽힌다 */
function 배운말투(){
  const sig=(S.signature||[]).slice(0,3), cli=(S.cliche||[]).slice(0,2);
  const rates=S.editRates||[];
  const 줄=[];
  if(sig.length) 줄.push('원장님이 자주 쓰시는 말 — '+sig.map(function(x){
    return '<b>"'+esc(typeof x==='string'?x:(x.phrase||x))+'"</b>'}).join(' · '));
  if(cli.length) 줄.push('빼기로 하신 말 — '+cli.map(function(x){
    return '<span style="text-decoration:line-through;opacity:.7">"'+esc(typeof x==='string'?x:(x.phrase||x))+'"</span>'}).join(' · '));
  if(rates.length){
    const 끝=rates[rates.length-1];
    줄.push('최근 편집률 <b>'+끝+'%</b>'+(rates.length>1?(rates[0]>끝?' — 줄고 있어요. 원장님 글에 가까워지는 중이에요':(rates[0]<끝?' — 늘었어요. 말투를 다시 배울 때가 됐어요':'')):''));
  }
  if(!줄.length) return '<div class="split"><h3 style="margin:0 0 3px;font-size:15.5px">'+ic('teach')+'이 글에 반영된 말투</h3>'+
    '<p class="sub" style="margin:0">아직 배운 말투가 없어요. 아래에서 <b>얼마나 고치셨는지</b>만 눌러주셔도 다음 글부터 달라져요.</p></div>';
  return '<div class="split"><h3 style="margin:0 0 6px;font-size:15.5px">'+ic('teach')+'이 글에 반영된 말투</h3>'+
    줄.map(function(l){return '<p class="sub" style="margin:0 0 4px">'+l+'</p>'}).join('')+'</div>';
}
/* 붙여넣은 뒤 얼마나 고치셨는지 — **늘 보이게** 둔다.
   전에는 '고친 걸 알려주기' 를 눌러야 펼쳐졌다. 접혀 있으면 아무도 안 누르고,
   그러면 편집률이 안 쌓여서 말투를 영영 못 배운다. 이 제품의 북극성 지표가 그것이다 */
function 피드백띠(i,p){
  if(p.edited) return '<div class="split" style="background:var(--keysoft);border-radius:12px;padding:13px 15px">'+
    '<p class="sub" style="margin:0">'+ic('teach')+' <b>알려주셔서 고마워요.</b> 이 글에서 배운 건 다음 글에 반영해요.</p></div>';
  return '<div class="split" style="background:var(--keysoft);border-radius:12px;padding:13px 15px">'+
    '<p style="margin:0 0 3px;font-size:15.5px;font-weight:700">네이버에 붙여넣으신 뒤, 어느 정도 손보셨어요?</p>'+
    '<p class="sub" style="margin:0 0 9px">한 번만 눌러주셔도 다음 글이 달라져요. 30초도 안 걸려요.</p>'+
    '<div class="row">'+
      '<button class="act sm" onclick="quickFb('+i+',3)">거의 그대로</button>'+
      '<button class="act ghost sm" onclick="quickFb('+i+',15)">조금 고쳤어요</button>'+
      '<button class="act ghost sm" onclick="quickFb('+i+',40)">많이 고쳤어요</button>'+
      '<button class="act ghost sm" onclick="tog(\'f'+i+'\')">'+ic('teach')+'고친 글 붙여넣기</button>'+
    '</div></div>';
}
/* 검수 모드 — 어디까지 원장님 확인 없이 갈지.
   글쓰기.md 의 표와 같은 값이어야 한다. 한쪽만 바꾸면 지시서가 못 알아듣는다 */
var MODES=[['한번보기','한 번 보기','주제를 정하면 한 번 보여드려요','1분 30초'],
           ['꼼꼼히','꼼꼼히','주제와 글 순서를 각각 보여드려요','1분 30초'],
           ['맡기기','맡길게요','안 멈추고 끝까지 써요','20~30분']];
var MODE=localStorage.getItem('aw_mode')||'한번보기';
function setMode(m){MODE=m;try{localStorage.setItem('aw_mode',m)}catch(e){};drawWrite();drawStart()}
function 모드고르기(){
  return '<div class="split"><h3 style="margin:0 0 3px;font-size:15.5px">'+ic('ok')+'중간에 여쭤볼까요?</h3>'+
    '<p class="sub" style="margin:0 0 8px">글 쓰는 데 20~30분이 걸려요. 주제가 어긋났으면 <b>1분 30초에</b> 아시는 게 나아요.</p>'+
    '<div class="pick">'+MODES.map(function(m){
      return '<button class="'+(MODE===m[0]?'on':'')+'" onclick="setMode(\''+m[0]+'\')">'+esc(m[1])+'</button>'}).join('')+'</div>'+
    '<p class="sub" style="margin:7px 0 0">'+esc((MODES.find(function(m){return m[0]===MODE})||MODES[0])[2])+
    ' · 첫 결과까지 <b>'+esc((MODES.find(function(m){return m[0]===MODE})||MODES[0])[3])+'</b></p></div>';
}
/* 멈춰서 여쭙는 자리.
   "3단계에서 멈췄어요" 만 보여드리면 원장님이 판단하실 수 없다. **무엇을 정했는지**
   보셔야 이대로 갈지 고칠지 정하신다. 그게 검수 모드의 전부다 */
/* 채팅에서 시작한 글쓰기가 도는 중일 때 보여드리는 것.
   화면에서 누르면 1.5초마다 단계가 보이는데, 채팅에서 시키시면 화면이 그걸 몰랐다.
   20~30분 동안 오른쪽 창이 아무 말도 안 했다 — 원장님은 "5분 기다리다 창을 닫는 분" 이다.
   단계 파일이 하나씩 늘어나는 것을 15초마다 읽어서 어디까지 왔는지 보여드린다. */
function 도는중카드(){
  const u=S.unfinished; if(!u||!u.도는중)return '';
  const 이름=['주제 정리 중','글 순서 잡는 중','필요한 내용 찾는 중','초안 쓰는 중','말투 다듬는 중'];
  const n=Math.max(1,u.done||1);
  return '<div class="card" style="--a:var(--c0)"><h2>'+ic('topic')+'글을 쓰고 있어요'+
    ' <span class="spin" style="margin-left:6px"></span></h2>'+
    '<p class="sub">"'+esc(u.title)+'" · 보통 20~30분 걸려요. 창을 닫으셔도 계속 써요.</p>'+
    이름.map(function(s,i){
      const 됨=i<n-1, 지금=i===n-1;
      return '<div style="display:flex;align-items:center;gap:10px;padding:6px 10px;border-radius:9px;'+
        'background:'+(지금?'var(--keysoft)':'transparent')+'">'+
        '<span style="flex:none;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;'+
        'justify-content:center;font-size:11.5px;'+
        (됨?'background:var(--c0);color:var(--onkey)':지금?'border:2px solid var(--c0)':'border:1px solid var(--dim2)')+
        '">'+(됨?'✓':'')+'</span>'+
        '<span style="flex:1;font-size:14.5px;font-weight:'+(지금?700:500)+';color:'+
        (지금?'var(--ink)':됨?'var(--dim)':'var(--dim2)')+'">'+s+'</span>'+
        (지금?'<span class="spin"></span>':'')+'</div>'}).join('')+
    '<p class="sub" style="margin:10px 0 0">'+u.지난초+'초 전에 '+esc(u.step)+' 까지 끝났어요.</p></div>';
}

function 확인카드(){
  const u=S.unfinished; if(!u||!u.기획)return '';
  if(u.도는중)return 도는중카드();     // 아직 도는 중이면 끼어들지 않는다
  const g=u.기획, 목차=u.목차;
  const 줄=function(k,v){return v?'<div style="display:flex;gap:12px;padding:4px 0"><span class="sub" style="margin:0;flex:none;width:64px">'+k+'</span><span style="font-size:15px">'+v+'</span></div>':''};
  const 유형말={'설명형':'기준을 세워드리는 글','비교형':'무엇과 무엇을 나누는 글','사례형':'실제로 달라진 이야기','상담전환형':'상담 전 준비를 알려드리는 글'};
  return '<div class="card" style="--a:var(--c0)"><h2>'+ic('ok')+
      (목차?'글 순서까지 잡았어요. 이대로 갈까요?':'쓸 주제를 이렇게 잡았어요')+'</h2>'+
    줄('질문','<b>'+esc(g.질문)+'</b>')+
    줄('글 종류',esc(g.글유형)+(유형말[g.글유형]?' — '+유형말[g.글유형]:''))+
    줄('근거',g.사례.length?g.사례.map(function(c){return '<span class="tag">'+esc(String(c).replace(/\.md$/,''))+'</span>'}).join(' '):'')+
    줄('읽는 분',esc(g.독자상태||'')+(g.학생군?' · '+esc(g.학생군):''))+
    (목차?'<h3 style="margin:14px 0 6px;font-size:15.5px">글 순서</h3>'+
      목차.map(function(x,n){return '<div style="display:flex;gap:10px;padding:3px 0;font-size:15px">'+
        '<span class="sub" style="margin:0;flex:none;width:18px">'+(n+1)+'</span><span>'+esc(x.제목)+
        (x.근거&&x.근거!=='없음'?' <span class="sub" style="margin:0">← '+esc(x.근거.replace(/\.md$/,''))+'</span>':'')+
        '</span></div>'}).join(''):'')+
    '<div class="row" style="margin-top:14px">'+
      '<button class="act" onclick="이어가기()">'+ic('topic')+'이대로 갈게요</button>'+
      '<button class="act ghost" onclick="tog(\'fixplan\')">'+ic('fix')+'고칠 데가 있어요</button></div>'+
    '<div class="hide split" id="fixplan">'+
      '<div class="tochat"><span class="t">왼쪽 대화창에 <b>말씀하셔도 돼요.</b> 예) 질문을 초6 말고 예비중1로 바꿔줘</span>'+
      '<button class="act ghost sm" onclick="openChatty(this)">여기에 적을게요</button></div>'+
      '<div class="chatty"><input id="planFix" placeholder="예: 질문을 예비중1로 바꿔주세요">'+
      '<div class="row" style="margin-top:9px"><button class="act sm" onclick="계획고치기()">고쳐달라기</button></div></div>'+
    '</div></div>';
}
function 이어가기(){ runPrompt('/글쓰기 이어서 — 확인했어요. 그대로 진행해주세요','이어서 쓰는 중') }
function 계획고치기(){
  const v=$('#planFix').value.trim();
  if(!v)return toast('무엇을 고칠지 적어주세요');
  runPrompt('/글쓰기 이어서 — 이렇게 고쳐주세요: '+v,'고쳐서 이어가는 중');
}
/* 글 한 편의 본문을 받아온다. 한 번 받으면 그 화면이 살아 있는 동안 다시 안 받는다 */
var 본문캐시={};
async function 글받기(i){
  const name=P[i]&&P[i].name; if(!name)return null;
  if(본문캐시[name])return 본문캐시[name];
  const r=await api('/api/post?name='+encodeURIComponent(name));
  if(r&&r.error){오류띠(r.error);return null}
  본문캐시[name]=r; return r;
}
async function 본문펴기(i){
  const 칸=$('#b'+i), 단추=$('#bb'+i);
  if(단추)단추.textContent='불러오는 중…';
  const r=await 글받기(i);
  if(!r){if(단추)단추.textContent='다시 해보기';return}
  if(칸)칸.innerHTML=render(r.reader);
  if(단추)단추.remove();
}
async function 복사본문(i){ const r=await 글받기(i); if(r)copy(r.plain,'복사했어요. 네이버 본문에 그대로 붙여넣으세요') }
async function 복사태그(i){ const r=await 글받기(i); if(r)copy(r.tags,'해시태그를 복사했어요') }

function drawPosts(){
  $('#posts').innerHTML = (P.length? postDash():'') + (P.length? statsCard():'') + (P.length? P.map(function(p,i){return '<div class="card"'+ac(i)+'>'+
      '<div class="meta" style="margin-bottom:8px"><span class="pill">'+p.date+'</span></div>'+
      '<h3 style="margin:0 0 7px;font-size:17.5px;font-weight:700">'+esc(p.title)+'</h3>'+
      '<div class="meta">'+
        p.cases.map(function(c){return '<span class="tag">'+esc(c)+'</span>'}).join('')+
        (p.template?'<span class="tag">'+esc(p.template)+'</span>':'')+
        (p.edited?'<span class="tag sig">피드백 완료</span>':'<span class="tag warn">피드백 대기</span>')+
      '</div>'+
      '<div class="row" style="margin:13px 0">'+
        '<button class="act sm" onclick="복사본문('+i+')">'+ic('copy')+'본문 복사</button>'+
        (p.tags?'<button class="act ghost sm" onclick="복사태그('+i+')">'+ic('tags')+'해시태그 복사</button>':'')+
        (p.hasHtml?'<button class="act ghost sm" onclick="post(\'/api/open\',{path:\'20_완성글/'+p.name+'/최종.html\'})">'+ic('preview')+'미리보기</button>':'')+
        '<button class="act ghost sm" onclick="tog(\'e'+i+'\')">'+ic('fix')+'고쳐주세요</button>'+
        ((켜짐('노션')&&LINKS&&LINKS.노션&&LINKS.노션.연결)?
          '<button class="act ghost sm" onclick="notionPush('+i+')">'+ic('link')+'노션에 보내기</button>':'')+
      '</div>'+
      /* 본문은 **여실 때 받아온다.** 목록에 다 실으면 100편에 1.3MB 가 되고
         화면이 그걸 15초마다 다시 받는다. 미리보기 몇 줄만 먼저 보여드린다. */
      '<div class="body" id="b'+i+'">'+esc(p.미리||'')+'…</div>'+
      '<div class="row" style="margin-top:8px">'+
        '<button class="act ghost sm" id="bb'+i+'" onclick="본문펴기('+i+')">'+ic('preview')+'글 전체 보기 ('+
        (p.글자수||0).toLocaleString()+'자)</button></div>'+
      '<p class="sub" style="margin:8px 0 0">위 내용이 학부모가 읽는 글이에요. '+
        '위 <b>본문 복사</b>를 누르시면 기호 없이 깨끗한 글자만 복사돼요.</p>'+
      배운말투()+
      피드백띠(i,p)+
      '<div class="hide split" id="e'+i+'">'+
        '<h3 style="margin:0 0 3px;font-size:15.5px">어디를 고칠까요?</h3>'+
        '<p class="sub">위의 글을 보시면서 말씀해 주세요. 고친 뒤 검수까지 해요.</p>'+
        '<div class="tochat"><span class="t">왼쪽 대화창에 <b>말씀하셔도 돼요.</b> 어느 글인지는 안 쓰셔도 돼요</span>'+
        '<button class="act ghost sm" onclick="openChatty(this)">여기에 적을게요</button></div>'+
        '<div class="chatty"><input id="et'+i+'" placeholder="예: 세 번째 문단이 딱딱해요. 좀 더 편하게 바꿔주세요">'+
        '<div class="row" style="margin-top:9px"><button class="act sm" onclick="revise('+i+')">고쳐달라기</button></div></div>'+
      '</div>'+
      /* 붙여넣기만 받으면 아무도 안 한다 — 그러면 말투를 못 배우고 편집률이 안 내려간다.
         한 번 누르는 것만으로도 방향은 남는다. 정밀한 학습은 붙여넣기에서만 하고,
         버튼은 "얼마나 고쳤나"만 기록한다 */
      '<div class="hide split" id="f'+i+'">'+
        '<h3 style="margin:0 0 3px;font-size:15.5px">고치신 글을 주시면 더 정확해요</h3>'+
        '<p class="sub">블로그에 올리신 <b>최종본을 그대로</b> 붙여넣어 주세요. '+
        '어떤 표현을 빼셨는지까지 읽고 배워요.</p>'+
        '<textarea id="ft'+i+'" placeholder="고치신 글 전체를 붙여넣으세요"></textarea>'+
        '<div class="row" style="margin-top:9px"><button class="act sm" onclick="sendFb('+i+')">배우기</button></div>'+
        '<pre class="term hide" id="fr'+i+'" style="margin-top:10px"></pre>'+
      '</div>'+
    '</div>'}).join('') : '<div class="card" style="--a:var(--c2)"><h2>'+ic('tab-posts')+'아직 완성된 글이 없어요</h2>'+
    '<p class="sub">여기는 <b>다 쓴 글</b>이 쌓이는 곳이에요. 글을 쓰시면 학부모가 읽을 본문이 그대로 보이고, '+
    '네이버에 붙여넣을 수 있게 <b>기호 없는 복사</b>도 여기서 하세요.<br>'+
    '글이 쌓이면 어떤 학년·어떤 형식에 몰렸는지도 여기서 보여드려요.</p>'+
    '<div class="row"><button class="act" onclick="go(\'write\')">글 쓰러 가기</button>'+
    '<button class="act ghost" onclick="goTo(\'write\',\'topics\')">글감부터 보기</button></div></div>');
}
/* "여기에 적을게요" — 접어둔 입력칸을 그 자리에서만 편다. 설정은 안 바꾼다 */
function openChatty(btn){
  const box=btn.closest('.tochat'); if(!box)return;
  let n=box.nextElementSibling;
  while(n&&!n.classList.contains('chatty'))n=n.nextElementSibling;
  if(n){n.classList.add('open'); box.style.display='none';
    const f=n.querySelector('input,textarea'); if(f)f.focus()}
}
function tog(id){const e=$('#'+id);e.classList.toggle('hide');
  if(!e.classList.contains('hide'))e.scrollIntoView({behavior:'smooth',block:'nearest'})}
function revise(i){
  const v=$('#et'+i).value.trim();
  if(!v)return toast('어떻게 고칠지 적어주세요');
  runPrompt('20_완성글/'+P[i].name+'/최종.md 를 이렇게 고쳐줘: '+v+
    ' — 고친 뒤 node bin/lib/checker.mjs 로 다시 검수하고 통과하면 최종.md 를 덮어써줘.','글 고치는 중');
}
/* 버튼 하나로 알려주기. 표현까지는 못 배우지만 편집률 방향은 남는다 */
async function quickFb(i,rate){
  const r=await api('/api/feedback-rough',{dir:P[i].name,rate:rate});
  if(r.error)return toast(r.error);
  toast(rate<=3?'그대로 쓰셨군요. 잘 맞아가고 있어요'
       :rate<=15?'알려주셔서 고마워요. 다음 글에 반영해요'
       :'많이 고치셨군요. 고치신 글을 붙여넣어 주시면 무엇을 바꿔야 할지 알 수 있어요');
  load();
}
async function sendFb(i){
  const t=$('#ft'+i).value.trim();
  if(!t)return toast('고치신 글을 붙여넣어 주세요');
  toast('읽는 중…');
  const r=await api('/api/feedback',{dir:P[i].name,edited:t});
  const o=$('#fr'+i); o.textContent=r.out; o.classList.remove('hide'); load();
}

function drawInput(){
  const n=(S.inbox||0);
  $('#inputMain').innerHTML=

  /* ── 문 하나 ── */
  '<div class="card" style="--a:var(--c0)"><h2>'+ic('drop')+'여기 하나로 다 넣으세요'+q('자료넣기')+'</h2>'+
    '<p class="sub" style="font-size:15.5px">글자든 파일이든 사진이든 링크든 <b>구분하지 마세요.</b><br>'+
    '넣어주시면 <b>읽고 나눠서</b> 사례·말투·글감·학원정보로 각자 자리에 담아요.<br>'+
    '<b>요약하지 마세요.</b> 원본이 나아요 — 원장님 말투가 거기 살아 있거든요.</p>'+

    '<div class="drop" id="dz" onclick="$(\'#fpick\').click()">'+
      '<span class="ico">📥</span><b>여기로 끌어다 놓으세요</b>'+
      '<span>또는 눌러서 고르세요 · 창 아무 데나 떨어뜨려도 돼요</span></div>'+
    '<input type="file" id="fpick" multiple class="hide" onchange="pick(this)">'+
    '<div class="flist" id="flist"></div>'+

    '<div style="margin-top:14px">'+
      '<textarea id="matText" style="min-height:96px" '+
      'placeholder="적어서 넣으셔도 돼요 — 지난주에 지훈이가 서술형에서 조건을 계속 놓쳐서 밑줄 긋는 연습을 2주 시켰더니 감점이 절반으로 줄었어요&#10;&#10;링크를 붙이셔도 돼요 — https://..."></textarea>'+
      '<div class="row" style="margin-top:9px"><button class="act" onclick="saveMat()">넣기</button>'+
      '<span class="sub" style="margin:0">엔터로 줄바꿈, 여러 개를 한 번에 넣으셔도 돼요</span></div>'+
    '</div>'+

    '<table style="width:100%;border-collapse:collapse;font-size:14.5px;margin-top:16px">'+
    [[ic('text')+'넣을 수 있는 것','상담 기록 · 예전 블로그 글 · 학원 안내문 · 카톡 내보내기 · 책 요약 · 기사 링크 · 네이버 통계'],
     [ic('photo')+'읽는 파일','글자 · PDF · 워드 · 한글 · 엑셀 · <b>사진과 캡처 이미지</b>'],
     [ic('link')+'안 하셔도 되는 것','분류 · 요약 · 파일 이름 정하기']]
    .map(function(r,i){return '<tr><td style="padding:7px 10px;border-bottom:1px solid var(--line);'+
      'color:var(--c'+(i%7)+');font-weight:700;white-space:nowrap;vertical-align:top">'+r[0]+'</td>'+
      '<td style="padding:7px 10px;border-bottom:1px solid var(--line);color:var(--dim)">'+r[1]+'</td></tr>'}).join('')+
    '</table>'+
  '</div>'+

  /* ── 기다리는 사람을 위한 자리 ── */
  (n?'<div class="card" style="--a:var(--c2)"><h2>'+ic('tidy')+'넣어두신 게 '+n+'개 있어요</h2>'+
    '<p class="sub">아직 안 읽었어요. <b>정리하기</b>를 누르시면 읽어보고 제자리에 담아드려요.<br>'+
    '3~5분쯤 걸려요. 다 되면 <b>무엇이 어디로 갔는지</b> 보여드려요.</p>'+
    '<div class="row"><button class="act" onclick="runTidy()">정리하기</button>'+
    '<button class="act ghost" onclick="post(\'/api/open\',{path:\'_여기에_넣으세요\'})">'+ic('open')+'넣은 것 열어보기</button></div>'+
    '</div>':'')+
  '<div id="intakeBox"></div>';

  drawIntake();
}

/* 정리 — 기다리는 동안 무슨 일이 일어나는지 보여준다 */
function runTidy(){
  modal('<h2 class="plain" style="margin:0 0 4px;font-size:18px">자료를 읽고 있어요</h2>'+
    '<p class="sub">3~5분쯤 걸려요. 창을 닫으셔도 계속 해요.</p>'+
    '<div id="tidySteps" style="margin:14px 0"></div>'+
    '<pre class="term" id="runOut" style="max-height:200px"><span class="spin"></span> 시작해요…</pre>'+
    '<div class="row" style="margin-top:12px">'+
    '<button class="act ghost sm" onclick="closeModal()">닫기</button>'+
    '<button class="act ghost sm hide" id="stopBtn" style="color:var(--c6)">멈추기</button></div>');
  drawTidySteps(0);
  runPrompt('/정리','자료 정리하는 중');
}
function drawTidySteps(at){
  const box=$('#tidySteps'); if(!box)return;
  const steps=['넣어주신 걸 하나씩 읽어요','사례인지 말투인지 글감인지 가려요',
               '학생 이름은 가려요','각자 자리에 담아요','무엇이 어디로 갔는지 정리해요'];
  box.innerHTML=steps.map(function(s,i){
    const st=i<at?'done':i===at?'now':'';
    return '<div style="display:flex;gap:10px;align-items:center;margin-bottom:7px;'+
      (st===''?'opacity:.4':'')+'">'+
      '<b style="flex:none;width:19px;height:19px;border-radius:6px;font-size:12.5px;'+
      'display:flex;align-items:center;justify-content:center;'+
      (st==='done'?'background:var(--c0);color:var(--onkey)':st==='now'?'background:var(--c2);color:var(--onkey)':'background:var(--card2);color:var(--dim2)')+
      '">'+(st==='done'?'✓':(i+1))+'</b>'+
      '<span style="font-size:15px;color:'+(st==='now'?'var(--ink)':'var(--dim)')+'">'+s+
      (st==='now'?' <span class="spin"></span>':'')+'</span></div>'}).join('');
}

/* 정리 결과 — 그래서 어디로 갔는지 */
async function drawIntake(){
  const box=$('#intakeBox'); if(!box)return;
  const r=await api('/api/intake');
  if(r.error||!r.buckets||!r.buckets.length){box.innerHTML='';return}
  box.innerHTML=
    '<div class="card" style="--a:var(--c0)"><h2>'+ic('know')+'방금 이렇게 담았어요</h2>'+
    '<p class="sub">저희가 읽고 나눈 거라 <b>틀릴 수 있어요.</b> 아래에서 열어 고치실 수 있어요.</p>'+
    r.buckets.map(function(b,i){
      return '<div class="item" style="--a:var(--c'+(i%7)+')">'+
        '<div class="row" style="justify-content:space-between">'+
        '<h3 style="margin:0">'+esc(b.label)+' <span class="pill">'+b.count+'</span></h3>'+
        '<span class="meta">'+esc(b.hint)+'</span></div>'+
        '<p class="sub" style="margin:5px 0 0">'+b.files.slice(0,3).map(esc).join(' · ')+
        (b.files.length>3?(' 외 '+(b.files.length-3)+'개'):'')+'</p></div>'}).join('')+
    ((r.left&&r.left.length)?'<p class="sub" style="margin:10px 0 0;color:var(--warn)">'+
      '아직 안 읽은 게 '+r.left.length+'개 남아 있어요. 정리하기를 한 번 더 눌러주세요.</p>':'')+
    '<div class="row" style="margin-top:12px">'+
    '<button class="act ghost sm" onclick="document.getElementById(\'mat\').scrollIntoView({behavior:\'smooth\'})">담긴 것 자세히 보기</button>'+
    '</div></div>';
}

/* 파일 고르기와 끌어다 놓기가 같은 길로 간다 */
function pick(el){ send(el.files); el.value='' }

function b64(f){return new Promise(function(res,rej){
  const r=new FileReader();
  r.onload=function(){res(String(r.result).split(',')[1])};
  r.onerror=function(){rej(new Error('읽기 실패'))};
  r.readAsDataURL(f)})}

async function send(files){
  const list=[...files]; if(!list.length)return;
  // 업데이트 꾸러미와 되살리기 파일은 다른 길로 보낸다
  const up=list.find(function(f){return /업데이트.*\.zip$/i.test(f.name)});
  if(up)return doUpdate(up);
  const back=list.find(function(f){return /자료_\d{4}-\d{2}-\d{2}\.zip$/i.test(f.name)});
  if(back)return doImport(back);
  const st=list.find(function(f){return /\.(csv|tsv)$/i.test(f.name)||/통계|블로그.*조회/i.test(f.name)});
  if(st)return dropStats(st);
  const box=$('#flist'); let done=0, fail=[];
  const draw=function(msg){ if(box) box.innerHTML=msg };
  draw('<p class="sub"><span class="spin"></span> '+list.length+'개를 넣는 중이에요…</p>');
  for(const f of list){
    try{
      if(f.size>30*1024*1024){ fail.push(f.name+' (30MB 넘어요)'); continue }
      const data=await b64(f);
      const r=await api('/api/upload',{name:f.name,data:data});
      if(r&&r.error){ fail.push(f.name+' ('+r.error+')') } else { done++ }
    }catch(e){ fail.push(f.name) }
    draw('<p class="sub"><span class="spin"></span> '+(done+fail.length)+'/'+list.length+' 넣는 중…</p>');
  }
  draw(
    (done?'<div class="item" style="--a:var(--c0)"><h3 style="margin:0">'+done+'개를 넣었어요</h3>'+
      '<p class="sub" style="margin:4px 0 0">정리하기를 누르시면 읽어보고 제자리에 넣어드려요.</p></div>':'')+
    (fail.length?'<div class="item" style="--a:var(--c6)"><h3 style="margin:0">'+fail.length+'개는 못 넣었어요</h3>'+
      '<p class="sub" style="margin:4px 0 0">'+fail.map(esc).join('<br>')+'</p></div>':''));
  if(done){ toast(done+'개를 넣었어요'); load() }
}

/* 창 아무 데나 떨어뜨려도 받는다 */
(function(){
  let depth=0;
  const isFile=function(e){ return [...(e.dataTransfer&&e.dataTransfer.types||[])].indexOf('Files')>=0 };
  addEventListener('dragenter',function(e){ if(!isFile(e))return; e.preventDefault();
    if(++depth===1)document.body.classList.add('dragging') });
  addEventListener('dragover',function(e){ if(isFile(e))e.preventDefault() });
  addEventListener('dragleave',function(e){ if(!isFile(e))return;
    if(--depth<=0){ depth=0; document.body.classList.remove('dragging') } });
  addEventListener('drop',function(e){
    if(!isFile(e))return;
    e.preventDefault(); depth=0; document.body.classList.remove('dragging');
    go('learn');
    setTimeout(function(){ send(e.dataTransfer.files) },0);
  });
})();

/* 통계 파일을 그대로 받는다. 엑셀은 CSV 로 저장하신 것만 글자를 읽을 수 있다 */
async function dropStats(f){
  if(/\.xlsx?$/i.test(f.name)){
    go('learn');
    return modal('<h2 class="plain" style="margin:0 0 4px;font-size:18px">엑셀 파일은 한 단계만 더 필요해요</h2>'+
      '<p class="sub">받으신 <b>'+esc(f.name)+'</b> 는 엑셀 파일이라 그대로는 글자를 못 읽어요.<br>'+
      '둘 중 편한 쪽으로 해주세요.</p>'+
      '<div class="item" style="--a:var(--c0)"><h3 style="margin:0">방법 1 — 열어서 복사 (제일 빨라요)</h3>'+
      '<p class="sub" style="margin:5px 0 0">엑셀에서 파일을 열고 → 제목과 조회수가 있는 칸을 드래그 → 복사 → '+
      '아래 네모 칸에 붙여넣기</p></div>'+
      '<div class="item" style="--a:var(--c1)"><h3 style="margin:0">방법 2 — CSV로 저장</h3>'+
      '<p class="sub" style="margin:5px 0 0">엑셀에서 <b>다른 이름으로 저장 → CSV</b> 로 저장하신 다음 '+
      '그 파일을 여기로 끌어다 놓으세요</p></div>'+
      '<div class="row" style="margin-top:13px"><button class="act" onclick="closeModal();go(\'learn\');'+
      'setTimeout(function(){var e=$(\'#statBox\');if(e)e.focus()},200)">붙여넣으러 가기</button></div>');
  }
  const text=await f.text();
  go('learn');
  const box=$('#statBox'); if(box)box.value=text;
  saveStats();
}

async function saveStats(){
  const v=$('#statBox').value.trim();
  if(!v)return toast('네이버 통계 화면을 복사해 붙여넣어 주세요');
  $('#statOut').innerHTML='<p class="sub"><span class="spin"></span> 이어 붙이는 중…</p>';
  const r=await api('/api/stats',{pasted:v});
  if(r.error){$('#statOut').innerHTML='';return toast(r.error)}
  $('#statOut').innerHTML='<pre class="term">'+esc((r.out||'').trim())+'</pre>'+
    '<p class="sub" style="margin:8px 0 0">숫자가 잘못 붙었으면 <b>내 자료</b>에서 고치실 수 있어요.</p>';
  toast('이어 붙였어요'); load();
}
async function doExport(){
  toast('묶는 중이에요…');
  const r=await api('/api/export',{});
  if(r.error)return toast(r.error);
  modal('<h2 class="plain" style="margin:0 0 4px;font-size:18px">자료를 묶었어요</h2>'+
    '<p class="sub"><b>'+esc(r.file)+'</b> ('+r.size+'KB)<br>'+
    '이 파일 하나에 학원 정보, 사례, 완성된 글, 배운 것이 전부 들어 있어요.<br>'+
    '<b>USB나 메일로 옮겨두세요.</b> 컴퓨터가 바뀌어도 그대로 되살릴 수 있어요.</p>'+
    '<div class="row" style="margin-top:12px">'+
    '<button class="act" onclick="post(\'/api/open\',{path:\'.\'});closeModal()">폴더 열기</button>'+
    '<button class="act ghost" onclick="closeModal()">닫기</button></div>');
}
async function doImport(f){
  if(!confirm('"'+f.name+'"에 들어 있는 자료로 되살릴까요?\n\n'+
    '지금 자료는 지우지 않고 .이전자료 폴더에 옮겨둬요.'))return;
  toast('되살리는 중이에요…');
  const r=await api('/api/import',{data:await b64(f)});
  if(r.error)return toast(r.error);
  toast('되살렸어요'); load(); goTo('learn','mat');
}
async function doUpdate(f){
  if(!confirm('"'+f.name+'"으로 프로그램을 업데이트할까요?\n\n'+
    '학원 자료와 쓰신 글은 건드리지 않아요. 프로그램만 새것으로 바뀌어요.'))return;
  toast('업데이트하는 중이에요…');
  const r=await api('/api/update',{data:await b64(f)});
  if(r.error)return toast(r.error);
  modal('<h2 class="plain" style="margin:0 0 4px;font-size:18px">'+esc(r.from)+' → '+esc(r.to)+' 로 바뀌었어요</h2>'+
    '<p class="sub">달라진 건 이거예요.</p>'+
    (r.변경&&r.변경.length?'<ul style="margin:0 0 12px;padding-left:20px;line-height:1.9">'+
      r.변경.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>':'')+
    (r.topics?'<div class="item" style="--a:var(--c4)"><h3 style="margin:0">글감 '+r.topics+'개가 새로 들어왔어요</h3>'+
      '<p class="sub" style="margin:4px 0 0">글감 창고에서 보실 수 있어요.</p></div>':'')+
    '<p class="sub" style="margin:12px 0 0">이 창을 닫고 <b>프로그램을 껐다 다시 켜주세요.</b> 그래야 새것으로 돕니다.</p>'+
    '<div class="row" style="margin-top:12px"><button class="act" onclick="closeModal()">알겠어요</button></div>');
}
async function report(){
  const note=$('#errNote')?$('#errNote').value.trim():'';
  const r=await api('/api/report',{note:note});
  /* 미리보기를 **고칠 수 있게** 한다. 전에는 읽기만 되는 상자였다.
     저희가 다 못 가리는데 고칠 길까지 없으면, 원장님은 보시고도
     지울 수가 없다. 보내는 것은 이 상자에 있는 그대로다. */
  const 소식말 = r.소식수 ? '<b>그동안 있었던 일 '+r.소식수+'건</b>도 같이 담았어요. '
    +'저희가 알아서 모아둔 거예요 — 원장님이 적으실 필요 없어요.<br>' : '';
  modal('<h2 class="plain" style="margin:0 0 4px;font-size:18px">이 내용이 전달돼요</h2>'+
    '<p class="sub">'+소식말+
    '<b>학원 이름·전화번호·이메일은 저희가 지웠어요.</b><br>'+
    '학생 이름은 저희가 다 찾아내지 못해요. <b>아래를 한 번 읽어보시고 이름이 남아 있으면 지워주세요.</b><br>'+
    '아래 상자를 직접 고치실 수 있어요. 고치신 그대로 나가요.</p>'+
    '<textarea id="reportBox" style="width:100%;min-height:200px;max-height:280px;font-family:ui-monospace,monospace;'+
    'font-size:13px;line-height:1.55;padding:11px;border:1px solid var(--line);border-radius:10px;'+
    'background:var(--card2);color:var(--ink)" oninput="REPORT=this.value">'+esc(r.body)+'</textarea>'+
    '<div id="reportOut" style="margin-top:9px"></div>'+
    '<div class="row" style="margin-top:12px">'+
    /* 보낼 곳이 없으면 **보내기 단추를 안 보여드린다.** 눌러도 안 가는 단추는
       고장으로 보인다. 대신 파일로 받으시는 길을 앞에 낸다. */
    (r.보낼곳
      ? '<button class="act" onclick="sendReport()">보내기</button>'
      : '<button class="act" onclick="saveReport()">파일로 받기</button>')+
    '<button class="act ghost" onclick="copy(REPORT,\'복사했어요\')">복사만 하기</button>'+
    '<button class="act ghost" onclick="closeModal()">닫기</button></div>'+
    (r.보낼곳 ? '' :
      '<p class="sub" style="margin-top:8px">받은 파일을 만든 사람에게 메일이나 카톡으로 보내주세요.</p>'));
  REPORT_IDS = r.ids || [];
  REPORT=r.body;
}
var REPORT='', REPORT_IDS=[], FORM_URL='', FORM_FIELD='', LOCKED=false;
/* 단추 하나로 끝난다. 창이 하나 더 뜨지 않고, 제출을 또 누르실 필요도 없다.
   전에는 구글 폼 주소를 열어드렸는데 거기서 그만두시면 아무것도 안 왔다. */
async function sendReport(){
  const box=$('#reportBox'); if(box)REPORT=box.value;
  const out=$('#reportOut');
  if(out)out.innerHTML='<p class="sub">보내는 중이에요…</p>';
  const r=await api('/api/report-send',{body:REPORT, ids:REPORT_IDS});
  if(!out)return;
  if(r&&r.보냄){
    out.innerHTML='<p class="sub" style="color:var(--ok)">✓ 보냈어요. 고맙습니다.</p>';
    setTimeout(closeModal,1400);
    return;
  }
  /* 못 보냈을 때 — 기록은 그대로 있다고 분명히 말씀드리고, 파일로도 받으시게 한다 */
  out.innerHTML='<p class="sub" style="color:var(--c6)">'+ic('warn',15)+' '+
    esc((r&&r.안내)||'지금은 못 보냈어요.').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')+'</p>'+
    '<div class="row" style="margin-top:7px">'+
    '<button class="act ghost sm" onclick="copy(REPORT,\'복사했어요\')">복사하기</button>'+
    '<button class="act ghost sm" onclick="saveReport()">파일로 받기</button></div>';
}

/* 인터넷이 안 되는 자리에서도 원장님이 전할 방법은 있어야 한다 */
function saveReport(){
  const b=new Blob([REPORT],{type:'text/plain;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(b);
  a.download='블로그스튜디오_알림_'+new Date().toISOString().slice(0,10)+'.txt';
  document.body.appendChild(a); a.click(); a.remove();
  toast('파일로 받았어요. 메일이나 카톡으로 보내주세요');
}

async function saveMat(){
  const t=$('#matText').value.trim();
  if(!t)return toast('내용을 적어주세요');
  await api('/api/material',{text:t});
  $('#matText').value=''; toast('넣었어요. 정리하기를 누르시면 제자리로 가요'); load();
}
function scrap(){
  const v=$('#scrapUrl').value.trim();
  if(!v)return toast('링크를 넣어주세요');
  runPrompt('/스크랩 '+v,'링크 읽는 중');
}

/* 사례가 많아지면 60건만 그린다. 찾으실 땐 **전체에서** 걸러 다시 그린다 —
   화면에 있는 60건 안에서만 찾으면 "없다" 고 말하게 되는데 그건 거짓말이다 */
var CASEQ='';
function findCase(q){
  CASEQ=String(q||'').trim();
  drawMat();
  const el=$('#caseFind');
  if(el){ el.value=CASEQ; el.focus(); }
}

/* 주제칸에 단어를 덧붙인다. 원장님이 직접 치시는 것보다 빠르고,
   "이런 걸 적어도 되는구나" 를 보여주는 안내이기도 하다 */
function addWord(w){
  const el=$('#topic'); if(!el)return;
  const v=el.value.trim();
  el.value=v?(v.indexOf(w)>=0?v:v+' '+w):w;
  el.focus();
}

/* 말투 사전 손보기 */
async function phraseSet(표현,어디){
  const r=await api('/api/phrase-set',{표현:표현,어디:어디});
  if(r.error)return toast(r.error);
  toast(어디==='지움'?'뺐어요':어디==='시그니처'?'앞으로 이 표현을 써요':'앞으로 이 표현은 안 써요');
  load();
}
async function phraseAdd(어디){
  const el=$(어디==='시그니처'?'#sigNew':'#cliNew');
  const v=el.value.trim();
  if(!v)return toast('표현을 적어주세요');
  const r=await api('/api/phrase-set',{표현:v,어디:어디});
  if(r.error)return toast(r.error);
  el.value='';
  toast(어디==='시그니처'?'앞으로 이 표현을 써요':'앞으로 이 표현은 안 써요');
  load();
}

function drawMat(){
  const used={}; S.cases.forEach(function(c){used[c.name]=c.used});
  /* 찾는 말이 있으면 전체에서 걸러내고, 없으면 덜 쓴 순으로 60건만 그린다 */
  const 걸러낸사례=(M.cases||[]).filter(function(c){
    return !CASEQ || c.name.indexOf(CASEQ)>=0;
  }).sort(function(a,b){return (used[a.name]||0)-(used[b.name]||0)});
  const 보여줄사례=걸러낸사례.slice(0,60);
  const all=[].concat(M.cases||[],M.basics||[],M.raw||[],M.style||[],M.scraps||[],M.tone?[M.tone]:[]);
  const fresh=all.filter(function(f){return f.fresh});
  var bx=0;

  // 고치기 / 지우기 단추
  const tools=function(f){return '<div class="row" style="margin-top:9px">'+
    '<button class="act ghost sm" onclick="openFile('+JSON.stringify(f.path).replace(/"/g,'&quot;')+')">열어서 고치기</button>'+
    '<button class="act ghost sm" onclick="delFile('+JSON.stringify(f.path).replace(/"/g,'&quot;')+','+
      JSON.stringify(f.name).replace(/"/g,'&quot;')+')" style="color:var(--c6)">지우기</button></div>'};

  const box=function(title,sub,items,fmt){return '<div class="card"'+ac(bx++)+'><h2>'+title+
    ' <span class="sub" style="display:inline;margin:0">'+items.length+'건</span></h2>'+
    '<p class="sub">'+sub+'</p>'+
    (items.length?items.map(fmt).join(''):'<p class="empty">여기는 아직 비어 있어요.</p>')+'</div>'};

  const plain=function(f,i){return '<div class="item"'+ac(i)+'>'+
    '<h3 style="margin:0">'+esc(f.name)+(f.fresh?' <span class="tag warn">방금 정리했어요</span>':'')+'</h3>'+
    tools(f)+'</div>'};

  $('#mat').innerHTML=
  /* '방금 정리한' 카드는 위 '방금 이렇게 담았어요' 와 같은 말이라 없앴다.
     같은 걸 두 번 말하면 원장님이 둘 다 봐야 하는 줄 안다. */
  '<div class="card" style="--a:var(--c5)"><h2>'+ic('academy')+'학원 정보 고치기</h2>'+
    '<p class="sub">이름이 바뀌었거나 잘못 적으셨으면 여기서 고치세요. 글에 바로 반영돼요.</p>'+
    ((M.basics&&M.basics.length)
      ? M.basics.map(function(f,i){return '<div class="item"'+ac(i)+'>'+
          '<h3 style="margin:0">'+esc(f.name)+'</h3>'+tools(f)+'</div>'}).join('')
      : '<p class="empty">아직 학원 정보가 없어요. 오늘 할 일에서 채워주세요.</p>')+
    '</div>'
  /* 사례는 계속 쌓인다. 주 1회씩만 넣으셔도 10년이면 수백 건이다.
     서버는 2000건에도 60ms 로 버티지만 **화면이 카드 2000장을 그리면 느려진다.**
     덜 쓴 순으로 60건만 그리고, 찾으실 땐 검색으로 간다 */
  + box('사례','글의 근거가 되는 이야기예요. 사실과 다르면 꼭 고쳐주세요.'
      + (CASEQ
         ? '<br><b>"'+esc(CASEQ)+'" 로 찾은 것만 보여드려요</b> ('+걸러낸사례.length+'건)'
         : (M.cases||[]).length>60
           ? '<br><b>덜 쓰신 60건만 보여드려요</b> (전체 '+M.cases.length+'건). 찾으실 게 있으면 아래 칸에 적어주세요.'
           : '')
      + ((M.cases||[]).length>60||CASEQ
         ? '<div class="row" style="margin-top:8px"><input id="caseFind" placeholder="사례 이름으로 찾기" '
           + 'value="'+esc(CASEQ)+'" style="flex:1;min-width:180px" '
           + 'onchange="findCase(this.value)">'
           + (CASEQ?'<button class="act ghost sm" onclick="findCase(\'\')">전체 보기</button>':'')
           + '</div>'
         : ''),
      보여줄사례,
      function(c,i){return '<div class="item"'+ac(i)+'>'+
        '<div class="row" style="justify-content:space-between">'+
        '<h3 style="margin:0">'+esc(c.name)+(c.fresh?' <span class="tag warn">방금</span>':'')+'</h3>'+
        '<span class="meta">'+(used[c.name]||0)+'회 사용 · 발화 '+c.quotes+'개</span></div>'+
        '<p class="sub" style="margin:5px 0 0">'+esc(c.first)+(c.first.length>=80?'…':'')+'</p>'+
        '<div class="bar"><i style="width:'+Math.min((used[c.name]||0)*25,100)+'%"></i></div>'+
        tools(c)+'</div>'})
  + (M.tone? box('말투 기준','저희가 원장님 글에서 뽑아낸 숫자예요. 어긋난다 싶으면 고치셔도 돼요.',[M.tone],plain):'')
  /* 아직 정리 안 된 건 지금 하실 일이라 항상 보인다. 나머지 원본 더미는 접는다 —
     넣고 나면 다시 볼 일이 드물고, 늘 펼쳐두면 위쪽 사례가 안 보인다 */
  + ((M.inbox&&M.inbox.length)? box('아직 정리 안 된 것','정리하기를 누르시면 제자리로 가요. 잘못 넣으신 건 여기서 지우세요.',
      M.inbox, plain):'')
  + '<details class="fold"><summary>'+ic('know')+'넣어주신 원본 자료 다시 보기 ('
    + ((M.raw||[]).length+(M.style||[]).length+(M.scraps||[]).length+(M.knowledge||[]).length)+'건)</summary><div>'
  + box('넣어주신 이야기','원장님이 직접 적어주신 사례와 소식이에요.', M.raw||[], plain)
  + box('말투 자료','원장님 문체를 여기서 배워요.', M.style||[], plain)
  + box('스크랩 소재','원장님이 모아주신 외부 자료예요.', M.scraps||[], plain)
  + box(ic('know')+'참고지식','책·세미나·마케팅 자료처럼 <b>배우신 것</b>이에요. '
      + '글을 <b>어떻게 설명할지</b>에만 써요. '
      + '<b>학원 사실로는 안 나가요</b> — 근거를 댈 수 없는 숫자는 학부모가 물었을 때 답할 수 없거든요.',
      M.knowledge||[], plain)
  + '</div></details>';
}

/* 파일 열어서 고치기 */
var EDIT=null;
async function openFile(path){
  const r=await api('/api/file?path='+encodeURIComponent(path));
  if(r.error)return toast(r.error);
  EDIT=path;
  modal('<h2 class="plain" style="margin:0 0 4px;font-size:18px">'+esc(path.split('/').pop())+'</h2>'+
    '<p class="sub">고치신 다음 저장을 누르세요. 원래대로 두시려면 닫기를 누르시면 돼요.</p>'+
    '<textarea id="edbox" style="min-height:340px;font:15px/1.75 ui-monospace,Menlo,monospace">'+
      esc(r.text)+'</textarea>'+
    '<div class="row" style="margin-top:13px">'+
      '<button class="act" onclick="saveFile()">저장하기</button>'+
      '<button class="act ghost" onclick="closeModal()">닫기</button></div>');
}
async function saveFile(){
  const r=await api('/api/file',{path:EDIT,text:$('#edbox').value});
  if(r.error)return toast(r.error);
  closeModal(); toast('고친 내용을 저장했어요'); load();
}
async function delFile(path,name){
  if(!confirm('"'+name+'"을(를) 지울까요?\n\n되살릴 수 있게 휴지통으로 옮겨둬요.'))return;
  const r=await api('/api/file',{path:path,remove:true});
  if(r.error)return toast(r.error);
  toast('지웠어요'); load();
}

function drawLearn(){
  /* 표현마다 빼기·옮기기 단추를 붙인다. 잘못 배운 걸 못 고치면 그 말투가 계속 글에 나간다.
     판단은 원장님이 하시는 게 맞다 — 저희는 지우신 걸 클리셰, 남기신 걸 시그니처로 볼 뿐이다 */
  const chips=function(arr,cls,none,어디){return arr.length?arr.map(function(p){
    const q=JSON.stringify(p).replace(/"/g,'&quot;');
    const 반대=어디==='시그니처'?'클리셰':'시그니처';
    return '<div class="tag '+cls+'" style="display:flex;align-items:center;gap:8px;'+
      'margin-bottom:6px;padding:9px 13px">'+
      '<span style="flex:1">'+esc(p)+'</span>'+
      /* 두 단추가 다른 일을 한다 —
         '안 쓸래요' 는 금지 목록에 넣어 앞으로 이 표현이 나오면 검수기가 잡게 한다.
         '잘못 배웠어요' 는 판단 자체를 지워서, 다시 나와도 아무 말 안 하게 한다.
         전에는 '빼기' 라고만 적어서 둘이 같아 보였다. */
      '<button class="act ghost sm" style="padding:3px 9px;font-size:13px" '+
        'title="'+(어디==='시그니처'?'앞으로 이 표현이 나오면 걸러드려요':'다시 쓰시겠다는 뜻이에요')+'" '+
        'onclick="phraseSet('+q+',\''+반대+'\')">'+(어디==='시그니처'?'안 쓸래요':'쓸래요')+'</button>'+
      '<button class="act ghost sm" style="padding:3px 9px;font-size:13px;color:var(--dim)" '+
        'title="이 표현에 대한 판단을 지워요. 앞으로 아무 말 안 해요" '+
        'onclick="phraseSet('+q+',\'지움\')">잘못 배웠어요</button>'+
      '</div>'}).join('')
    :'<p class="empty">'+none+'</p>'};
  /* 접혀 있어도 요약줄만으로 "우리가 원장님을 배우고 있다"가 보이게 한다.
     이 제품이 파는 게 그거라서, 숫자를 감추면 안 된다 */
  const r=S.editRates||[];
  const 요약=[ (S.signature||[]).length?'시그니처 '+S.signature.length+'개':'',
               (S.cliche||[]).length?'안 쓰는 표현 '+S.cliche.length+'개':'',
               r.length?'편집률 '+r[r.length-1]+'%':'' ].filter(Boolean).join(' · ');
  $('#learned').innerHTML=
  '<details class="fold"><summary>'+ic('tone')+'저희가 원장님한테서 배운 것'+
    (요약?' <span style="font-weight:400;color:var(--dim)">— '+요약+'</span>':'')+'</summary><div>'+
  '<div class="card" style="--a:var(--c0)"><h2>'+ic('tone')+'원장님 시그니처'+q('말투')+'</h2>'+
    '<p class="sub">직접 넣으시거나 남겨두신 표현이에요. 앞으로 브랜딩 문장으로 써요.<br>'+
    '<b>안 쓸래요</b>는 앞으로 걸러드리고, <b>잘못 배웠어요</b>는 판단을 지워요.</p>'+
    chips(S.signature,'sig','글을 고치시고 알려주시면 여기에 쌓여요.','시그니처')+
    '<div class="row" style="margin-top:10px">'+
    '<input id="sigNew" placeholder="즐겨 쓰시는 표현을 적어주세요" style="flex:1;min-width:200px">'+
    '<button class="act sm" onclick="phraseAdd(\'시그니처\')">이 표현 쓸게요</button></div></div>'+
  '<div class="card" style="--a:var(--c6)"><h2>'+ic('teach')+'안 쓰는 표현</h2>'+
    '<p class="sub">원장님이 지우신 표현이에요. 앞으로 이 표현은 빼고 써요.<br><b>쓸래요</b>를 누르시면 다시 써요.</p>'+
    chips(S.cliche,'cli','고치신 표현이 생기면 여기에 모여요.','클리셰')+
    '<div class="row" style="margin-top:10px">'+
    '<input id="cliNew" placeholder="안 쓰셨으면 하는 표현을 적어주세요" style="flex:1;min-width:200px">'+
    '<button class="act sm" onclick="phraseAdd(\'클리셰\')">이 표현 빼주세요</button></div></div>'+
  '<div class="card" style="--a:var(--c1)"><h2>'+ic('views')+'편집률 추이'+q('편집률')+'</h2>'+
    '<p class="sub">낮을수록 원장님 글에 가까워요. 줄어들면 잘 맞아가고 있는 거예요.</p>'+
    (r.length?'<div class="row" style="align-items:flex-end;gap:6px;height:120px;margin-top:10px">'+
      r.map(function(v,i){return '<div style="flex:1;text-align:center">'+
        '<div style="background:var(--c'+(i%7)+');border-radius:6px 6px 0 0;height:'+Math.max(v*2,5)+'px"></div>'+
        '<div class="sub" style="margin:5px 0 0;font-size:13.5px;font-weight:700;color:var(--c'+(i%7)+')">'+v+'%</div></div>'}).join('')+'</div>'
      :'<p class="empty">고친 글을 알려주시면 여기에 그려져요.</p>')+'</div>'+
  '</div></details>';
}

/* 옛 탭들은 이제 다른 탭 안의 한 칸이다. 탭을 열고 그 자리로 데려간다 */
function goTo(tab,id){
  go(tab);
  if(id)setTimeout(function(){
    const el=document.getElementById(id);
    if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
  },80);
}
/* 자리표시(placeholder)만 있으면 소리로 읽으시는 분은 그 칸이 뭔지 모른다.
   글자를 넣기 시작하면 자리표시가 사라져서 눈으로 보셔도 잊게 된다.
   칸마다 label 을 붙이는 대신 **한 곳에서 자리표시를 이름으로도 달아준다.** */
function 칸이름붙이기(){
  $$('input,textarea,select').forEach(function(i){
    if(i.getAttribute('aria-label')||i.closest('label'))return;
    if(document.querySelector('label[for="'+i.id+'"]'))return;
    const 이름=i.placeholder||i.getAttribute('title')||'';
    if(이름)i.setAttribute('aria-label',이름);
  });
}

/*
 * **큰 머리(hero)는 시작 화면에만 둔다.**
 *
 * 전에는 네 탭 모두 같은 머리를 이고 있었다. "오늘 블로그 글, 여기서 다시
 * 시작하세요" 가 **글 목록 위에도, 설정 위에도** 떠 있었다. 그 탭에서 하실 일과
 * 아무 상관이 없는 말이라, 지금 어느 화면인지 흐려진다.
 * 좁은 창에서는 그 자리가 화면의 절반이다.
 */
var 탭머리={
  write:['써두신 글', '완성된 글을 보시고, 고치신 데를 알려주시면 다음 글이 나아져요.'],
  learn:['자료와 배운 것', '넣어주신 자료와 저희가 배운 말투가 여기 쌓여요.'],
  help:['도움과 설정', '연결·업데이트·자료 지키기. 평소에는 안 오셔도 돼요.'],
};
function 머리맞추기(t){
  const h=$('#heroTitle'), p=h&&h.nextElementSibling, ask=$('#heroAsk'), q=$('#heroQuick');
  const 딴탭=탭머리[t];
  if(ask)ask.classList.toggle('hide', !!딴탭 || ask.dataset.준비안됨==='1');
  if(q)q.classList.toggle('hide', !!딴탭);
  if(!h)return;
  if(딴탭){ h.dataset.원래=h.dataset.원래||h.textContent;
    if(p)p.dataset.원래=p.dataset.원래||p.textContent;
    h.textContent=딴탭[0]; if(p)p.textContent=딴탭[1]; }
  else if(h.dataset.원래){ h.textContent=h.dataset.원래; if(p&&p.dataset.원래)p.textContent=p.dataset.원래; }
}

function go(t){$$('nav button').forEach(function(b){
    const 여기=b.dataset.t===t;
    b.classList.toggle('on',여기);
    /* 색만으로 알려드리면 소리로 읽으시는 분은 지금 어디인지 모른다 */
    if(여기)b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
  });
  ['start','write','learn','help'].forEach(function(x){$('#'+x).classList.toggle('hide',x!==t)});
  칸이름붙이기();
  머리맞추기(t);
  window.scrollTo({top:0,behavior:'smooth'})}
/* 탭 아이콘은 화면이 뜬 뒤 붙인다. 정적 HTML 에서는 ic() 를 못 쓴다 */
var TABIC={start:'tab-start',write:'tab-write',learn:'tab-source',help:'tab-setting'};
$$('nav button').forEach(function(b){
  b.onclick=function(){go(b.dataset.t)};
  const k=TABIC[b.dataset.t];
  if(k)b.innerHTML=ic(k)+b.textContent;
});
load();
거울();
</script>
</html>`;var Gt=[{id:"\uC124\uBA85\uD615",label:"\uC124\uBA85\uD615",gist:"\uAE30\uC900\uC744 \uC138\uC6CC \uD310\uB2E8\uC744 \uB3D5\uB294\uB2E4",fail:"\uC544\uB294 \uAC83\uC744 \uC21C\uC11C \uC5C6\uC774 \uAE38\uAC8C \uB098\uC5F4\uD55C\uB2E4 (\uBC31\uACFC\uC0AC\uC804)",firstLine:"\uACB0\uB860\uACFC \uAE30\uC900\uC744 \uC608\uACE0\uD55C\uB2E4",flow:"\uBB38\uC81C \xB7 \uAE30\uC900 \xB7 \uC801\uC6A9 \xB7 \uC810\uAC80",device:"\uAE30\uC900 \uBAA9\uB85D"},{id:"\uBE44\uAD50\uD615",label:"\uBE44\uAD50\uD615",gist:"\uC0C1\uD669\uBCC4\uB85C \uC5B4\uB290 \uCABD\uC774 \uB9DE\uB294\uC9C0 \uB098\uB208\uB2E4",fail:"\uC6B0\uB9AC \uBC29\uC2DD\uC774 \uB0AB\uB2E4\uB294 \uACB0\uB860\uB9CC \uB0A8\uAE34\uB2E4 (\uC2B9\uD328)",firstLine:"\uAC08\uB9AC\uB294 \uC9C0\uC810\uC744 \uC81C\uC2DC\uD55C\uB2E4",flow:"\uAE30\uC900 \xB7 A \xB7 B \xB7 \uC0C1\uD669\uBCC4 \uC815\uB9AC",device:"\uBE44\uAD50 \uD45C"},{id:"\uC0AC\uB840\uD615",label:"\uC0AC\uB840\uD615",gist:"\uC2DC\uC791 \uC0C1\uD0DC\uC640 \uBCC0\uD654 \uACFC\uC815\uC744 \uBCF4\uC5EC\uC900\uB2E4",fail:"\uC810\uC218 \uC0C1\uC2B9 \uACB0\uACFC\uB9CC \uC790\uB791\uD55C\uB2E4",firstLine:"\uBCC0\uD654\uC758 \uD575\uC2EC\uC744 \uD55C \uC904\uB85C \uC5F0\uB2E4",flow:"\uC0C1\uD0DC \xB7 \uAC1C\uC785 \xB7 \uBCC0\uD654 \xB7 \uC2DC\uC0AC\uC810",device:"\uBCC0\uD654 \uACFC\uC815 \uD750\uB984"},{id:"\uC0C1\uB2F4\uC804\uD658\uD615",label:"\uC0C1\uB2F4\uC804\uD658\uD615",gist:"\uC0C1\uB2F4 \uC804 \uC900\uBE44 \uD56D\uBAA9\uC744 \uC54C\uB824\uC900\uB2E4",fail:"\uBB38\uC758 \uC8FC\uC138\uC694\uB9CC \uBC18\uBCF5\uD55C\uB2E4",firstLine:"\uD589\uB3D9 \uD310\uB2E8\uC744 \uC5F0\uB2E4",flow:"\uD604\uC0C1 \xB7 \uD310\uB2E8 \uAE30\uC900 \xB7 \uC900\uBE44 \uD56D\uBAA9 \xB7 \uC5F0\uACB0",device:"\uC900\uBE44 \uCCB4\uD06C\uB9AC\uC2A4\uD2B8"}];var Vt=[{id:"\uC815\uBCF4\uD615",gist:"\uC544\uC9C1 \uD310\uB2E8 \uC804\uC774\uB2E4",first:"\uC124\uBA85\uD615",second:"\uC0AC\uB840\uD615",why:"\uAE30\uC900\uC744 \uC138\uC6B4 \uB4A4 \uC0AC\uB840\uB85C \uC2E0\uB8B0\uB97C \uBCF4\uAC15\uD55C\uB2E4",title:"\uAE30\uC900 \uC81C\uC2DC\uD615",titleForm:"\uB300\uC0C1 + \uC0C1\uD669 + \uBA3C\uC800 \uBD10\uC57C \uD560 \uAE30\uC900 N\uAC00\uC9C0"},{id:"\uBE44\uAD50\uD615",gist:"\uB450 \uAC00\uC9C0\uB97C \uB193\uACE0 \uACAC\uC900\uB2E4",first:"\uBE44\uAD50\uD615",second:"\uC124\uBA85\uD615",why:"\uC120\uD0DD \uAE30\uC900\uC744 \uC900 \uB4A4 \uBC30\uACBD\uC744 \uC124\uBA85\uD55C\uB2E4",title:"\uBE44\uAD50 \uC120\uD0DD\uD615",titleForm:"A vs B + \uC5B4\uB5A4 \uD559\uC0DD\uC5D0\uAC8C \uB9DE\uB294\uAC00"},{id:"\uC120\uD0DD\uD615",gist:"\uACB0\uC815 \uC9C1\uC804\uC774\uB2E4",first:"\uC0C1\uB2F4\uC804\uD658\uD615",second:"\uBE44\uAD50\uD615",why:"\uACB0\uC815 \uC9C1\uC804\uC774\uBBC0\uB85C \uB2E4\uC74C \uD589\uB3D9\uC744 \uC5F4\uC5B4 \uC900\uB2E4",title:"\uBE44\uAD50 \uC120\uD0DD\uD615",titleForm:"A vs B + \uC5B4\uB5A4 \uD559\uC0DD\uC5D0\uAC8C \uB9DE\uB294\uAC00"},{id:"\uBD88\uC548\uD615",gist:"\uB2A6\uC5C8\uC744\uAE4C \uAC71\uC815\uD55C\uB2E4",first:"\uC124\uBA85\uD615",second:"\uC0AC\uB840\uD615",why:"\uC548\uC2EC\uC758 \uAE30\uC900\uC744 \uC8FC\uACE0 \uBE44\uC2B7\uD55C \uC0AC\uB840\uB85C \uD655\uC778\uC2DC\uD0A8\uB2E4",title:"\uBD88\uC548 \uD574\uC18C\uD615",titleForm:"\uC9C0\uAE08 \uC0C1\uD669 + \uB2A6\uC5C8\uC744\uAE4C + \uBA3C\uC800 \uD655\uC778\uD560 N\uAC00\uC9C0"}],qt=[{id:"\uC2DC\uC791\uC2DC\uAE30",label:"\uC2DC\uC791 \uC2DC\uAE30 \uAE00",q:"\uC5B8\uC81C \uC2DC\uC791\uD558\uB294 \uAC83\uC774 \uB9DE\uB294\uAC00",type:"\uC124\uBA85\uD615"},{id:"\uBE44\uAD50\uAE30\uC900",label:"\uBE44\uAD50 \uAE30\uC900 \uAE00",q:"\uBB34\uC5C7\uACFC \uBB34\uC5C7\uC744 \uC5B4\uB5BB\uAC8C \uB098\uB204\uB294\uAC00",type:"\uBE44\uAD50\uD615"},{id:"\uC131\uC801\uBB38\uC81C",label:"\uC131\uC801 \uBB38\uC81C \uAE00",q:"\uB5A8\uC5B4\uC84C\uC744 \uB54C \uBB34\uC5C7\uBD80\uD130 \uBCF4\uB294\uAC00",type:"\uC124\uBA85\uD615"},{id:"\uC0AC\uB840",label:"\uC0AC\uB840 \uAE00",q:"\uC2E4\uC81C\uB85C \uC5B4\uB5BB\uAC8C \uB2EC\uB77C\uC84C\uB294\uAC00",type:"\uC0AC\uB840\uD615"},{id:"\uC0C1\uB2F4\uC900\uBE44",label:"\uC0C1\uB2F4 \uC900\uBE44 \uAE00",q:"\uC0C1\uB2F4 \uC804 \uBB34\uC5C7\uC744 \uC815\uB9AC\uD558\uB294\uAC00",type:"\uC0C1\uB2F4\uC804\uD658\uD615"},{id:"FAQ",label:"FAQ \uAE00",q:"\uBC18\uBCF5 \uC9C8\uBB38\uC744 \uD55C \uBC88\uC5D0 \uB2F5\uD55C\uB2E4",type:"\uC124\uBA85\uD615"}];function tt(t,e,r=""){let n=t??[];return n.find(s=>s.slug&&s.slug===e)??n.find(s=>s.slug&&s.slug!=="\uCD5C\uC885"&&e.includes(s.slug))??(r?n.find(s=>s.title&&r.includes(s.title)):void 0)??n.find(s=>s.slug==="\uCD5C\uC885"&&s.date&&e.startsWith(s.date))}var Ue=[/^#{2,4}\s*이 글은 이렇게 썼습니다/m,/^#{2,4}\s*올리시기 전에/m,/^#{2,4}\s*해시태그/m];function et(t){let e=t,r=Ue.map(o=>e.search(o)).filter(o=>o>=0);r.length&&(e=e.slice(0,Math.min(...r)));let n=e.match(/^[^\n]*제목\s*후보[^\n]*\n/m);if(n&&e.indexOf(n[0])<200){let o=e.slice(e.indexOf(n[0])+n[0].length),i=o.search(/^\s*[-–—]{3,}\s*$/m);if(i>=0)e=o.slice(o.indexOf(`
`,i)+1);else{let c=o.split(`
`),u=0;for(;u<c.length&&(c[u].trim()===""||/^\s*\d+\.\s/.test(c[u]));)u++;e=c.slice(u).join(`
`)}}let s=e.split(`
`),d=0;for(;d<s.length;){let o=s[d].trim();if(o===""||o.startsWith("#")||o.startsWith(">")||/^-{3,}$/.test(o)){d++;continue}break}e=s.slice(d).join(`
`).trim();let p=o=>{let i=o.trim();if(!i||/^[-–—*_]{3,}$/.test(i))return!0;let c=i.replace(/[*_`]/g,"").trim();return!!/^(#[^\s#]+)(\s+#[^\s#]+)*$/.test(c)},a=e.split(/\n\s*\n/);for(;a.length&&p(a[a.length-1]);)a.pop();return a.join(`

`).trim()}function Je(t){return t.replace(/^#{1,6}\s*/gm,"").replace(/^\s*>\s?/gm,"").replace(/\*\*(.+?)\*\*/g,"$1").replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g,"$1").replace(/^\s*[-*]\s+/gm,"\xB7 ").replace(/^\s*\d+\.\s+/gm,e=>e.trim()+" ").replace(/`([^`]+)`/g,"$1").replace(/^\s*[-–—]{3,}\s*$/gm,"").split(`
`).map(e=>/^\s*\|.*\|\s*$/.test(e)?/^\s*\|[\s|:\-–—]+\|\s*$/.test(e)?"":e.replace(/^\s*\|/,"").replace(/\|\s*$/,"").split("|").map(n=>n.trim()).filter(Boolean).join("  \xB7  "):e).filter((e,r,n)=>e!==""||n[r-1]!=="").join(`
`).replace(/\n{3,}/g,`

`).trim()}var St=/^[^\n]*#[가-힣A-Za-z0-9_]+(?:\s+#[가-힣A-Za-z0-9_]+)+\s*$/m;function Et(t){let e=et(t).replace(St,"").replace(/\n{3,}/g,`

`).replace(/(\n\s*-{3,}\s*)+$/,"");return Je(e)}var Xt=10;function He(t,e){return t.phrases.find(r=>r.phrase===e)}function We(t,e){let r=He(t,e);return r||(r={phrase:e,score:0,seen:0,kept:0,removed:0,added:0,lastPostIndex:-1},t.phrases.push(r)),r}function Yt(t,e,r){let n=We(t,e);return n.score=r==="\uC2DC\uADF8\uB2C8\uCC98"?Xt:-Xt,n}var Ke="https://api.notion.com/v1",Ge="2022-06-28";function ct(t){let r=String(t??"").trim().match(/([0-9a-f]{8})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{12})/i);return r?`${r[1]}-${r[2]}-${r[3]}-${r[4]}-${r[5]}`.toLowerCase():""}function lt(t){let e=String(t??"").trim();return e?/^[\x20-\x7e]+$/.test(e)?e.length<20?"\uC5F4\uC1E0\uAC00 \uB108\uBB34 \uC9E7\uC544\uC694. \uD1B5\uC9F8\uB85C \uBCF5\uC0AC\uB418\uC168\uB294\uC9C0 \uD655\uC778\uD574\uC8FC\uC138\uC694":/\s/.test(e)?"\uC5F4\uC1E0 \uC548\uC5D0 \uBE48\uCE78\uC774 \uC788\uC5B4\uC694. \uC55E\uB4A4\uB97C \uC798\uB77C\uB0B4\uACE0 \uB123\uC5B4\uC8FC\uC138\uC694":"":"\uC5F4\uC1E0\uC5D0 \uD55C\uAE00\uC774\uB098 \uC774\uC0C1\uD55C \uAE00\uC790\uAC00 \uC11E\uC600\uC5B4\uC694. \uB178\uC158\uC5D0\uC11C \uBCF5\uC0AC\uD55C \uADF8\uB300\uB85C \uB123\uC5B4\uC8FC\uC138\uC694":"\uC5F4\uC1E0\uB97C \uB123\uC5B4\uC8FC\uC138\uC694"}async function Tt(t,e,r,n){let s=lt(t.\uD1A0\uD070);if(s)return{ok:!1,status:-1,data:null,text:s};try{let d=await fetch(Ke+e,{method:r,headers:{authorization:`Bearer ${t.\uD1A0\uD070}`,"notion-version":Ge,"content-type":"application/json"},body:n?JSON.stringify(n):void 0}),p=await d.text(),a=null;try{a=JSON.parse(p)}catch{}return{ok:d.ok,status:d.status,data:a,text:p}}catch(d){return{ok:!1,status:0,data:null,text:d.message}}}function _t(t,e){return t===-1?e??"\uC5F4\uC1E0\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694":t===401?"\uC5F4\uC1E0\uAC00 \uC548 \uB9DE\uC544\uC694. \uC124\uC815\uC5D0\uC11C \uB2E4\uC2DC \uB123\uC5B4\uC8FC\uC138\uC694":t===404?"\uADF8 DB\uB97C \uBABB \uCC3E\uC558\uC5B4\uC694. \uB178\uC158\uC5D0\uC11C \uADF8 \uD398\uC774\uC9C0\uC5D0 **\uC5F0\uACB0\uC744 \uCD94\uAC00**\uD558\uC168\uB098\uC694? (\uC548\uB0B4 4\uBC88)":t===400?"\uB178\uC158\uC774 \uB0B4\uC6A9\uC744 \uBABB \uBC1B\uC558\uC5B4\uC694. DB \uCE78 \uC774\uB984\uC774 \uC548\uB0B4\uC640 \uB2E4\uB97C \uC218 \uC788\uC5B4\uC694":t===429?"\uB178\uC158\uC774 \uC7A0\uAE50 \uC26C\uB77C\uACE0 \uD574\uC694. 1\uBD84 \uB4A4\uC5D0 \uB2E4\uC2DC \uB20C\uB7EC\uC8FC\uC138\uC694":t===0?"\uC778\uD130\uB137\uC774 \uC548 \uB2FF\uC544\uC694. \uAE00\uC740 \uADF8\uB300\uB85C \uC788\uC5B4\uC694. \uB098\uC911\uC5D0 \uB2E4\uC2DC \uB20C\uB7EC\uC8FC\uC138\uC694":`\uB178\uC158\uC774 \uAC70\uC808\uD588\uC5B4\uC694 (${t})`+(e?` \u2014 ${e.slice(0,120)}`:"")}async function Mt(t){let e=ct(t.DB\uC8FC\uC18C);if(!e)return{ok:!1,status:400,fields:{},error:"DB \uC8FC\uC18C\uB97C \uBABB \uC77D\uC5C8\uC5B4\uC694"};let r=await Tt(t,`/databases/${e}`,"GET");if(!r.ok)return{ok:!1,status:r.status,fields:{},error:_t(r.status,r.text)};let n={};for(let[s,d]of Object.entries(r.data?.properties??{}))n[s]=d?.type;return{ok:!0,status:200,fields:n,title:r.data?.title?.[0]?.plain_text??""}}async function Qt(t){let e=lt(t);if(e)return{ok:!1,dbs:[],error:e};let r=await Tt({\uD1A0\uD070:t,DB\uC8FC\uC18C:""},"/search","POST",{filter:{property:"object",value:"database"},page_size:100});return r.ok?{ok:!0,dbs:(r.data?.results??[]).map(s=>({id:s.id,title:s.title?.[0]?.plain_text||"(\uC81C\uBAA9 \uC5C6\uC74C)"})),error:""}:{ok:!1,dbs:[],error:_t(r.status,r.data?.message??r.text)}}var A=t=>[{type:"text",text:{content:t.slice(0,1900)}}];function Ve(t){let e=[],r=t.replace(/\r/g,"").split(`
`),n=0,s=d=>d.replace(/\*\*(.+?)\*\*/g,"$1").replace(/`([^`]+)`/g,"$1").replace(/\[([^\]]*)\]\([^)]*\)/g,"$1").trim();for(;n<r.length;){let p=r[n].trim();if(!p){n++;continue}if(/^\|.*\|$/.test(p)&&/^\|[\s|:\-–—]+\|$/.test((r[n+1]??"").trim())){let u=m=>m.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(x=>s(x)),b=u(p),g=[];for(n+=2;n<r.length&&/^\|.*\|$/.test(r[n].trim());)g.push(u(r[n])),n++;let h=Math.max(b.length,...g.map(m=>m.length)),v=m=>Array.from({length:h},(x,_)=>A(m[_]??""));e.push({object:"block",type:"table",table:{table_width:h,has_column_header:!0,has_row_header:!1,children:[b,...g].map(m=>({object:"block",type:"table_row",table_row:{cells:v(m)}}))}});continue}let a=p.match(/^(#{1,3})\s+(.+)$/);if(a){let u=["heading_1","heading_2","heading_3"][a[1].length-1];e.push({object:"block",type:u,[u]:{rich_text:A(s(a[2]))}}),n++;continue}if(/^>\s?/.test(p)){e.push({object:"block",type:"quote",quote:{rich_text:A(s(p.replace(/^>\s?/,"")))}}),n++;continue}if(/^[-–—*]{3,}$/.test(p)){e.push({object:"block",type:"divider",divider:{}}),n++;continue}let o=p.match(/^\d+[.)]\s+(.+)$/);if(o){e.push({object:"block",type:"numbered_list_item",numbered_list_item:{rich_text:A(s(o[1]))}}),n++;continue}let i=p.match(/^[-*]\s+(.+)$/);if(i){e.push({object:"block",type:"bulleted_list_item",bulleted_list_item:{rich_text:A(s(i[1]))}}),n++;continue}let c=[];for(;n<r.length&&r[n].trim()&&!/^([#>|]|[-*]\s|\d+[.)]\s|[-–—*]{3,}$)/.test(r[n].trim());)c.push(r[n].trim()),n++;c.length?e.push({object:"block",type:"paragraph",paragraph:{rich_text:A(s(c.join(" ")))}}):n++}if(e.length>100){let d=e.slice(0,99);return d.push({object:"block",type:"paragraph",paragraph:{rich_text:A(`(\uAE00\uC774 \uAE38\uC5B4\uC11C \uC5EC\uAE30\uAE4C\uC9C0\uB9CC \uC62E\uACBC\uC5B4\uC694. \uC804\uCCB4\uB294 \uD504\uB85C\uADF8\uB7A8\uC758 \uC644\uC131\uB41C \uAE00\uC5D0 \uC788\uC5B4\uC694 \u2014 \uC6D0\uB798 ${e.length}\uB369\uC774)`)}}),d}return e}function qe(t,e){let r={},n=(a,o)=>{let i=e[a];if(!i)return;let c=o(i);c!==void 0&&(r[a]=c)},s=Object.entries(e).find(([,a])=>a==="title")?.[0];s&&(r[s]={title:A(t.\uC81C\uBAA9)}),n("\uB0A0\uC9DC",()=>t.\uB0A0\uC9DC?{date:{start:t.\uB0A0\uC9DC}}:void 0);let d=a=>a?{rich_text:A(a)}:void 0,p=a=>a?{select:{name:a}}:void 0;return n("\uD559\uC0DD\uAD70",a=>a==="select"?p(t.\uD559\uC0DD\uAD70):d(t.\uD559\uC0DD\uAD70)),n("\uAE00\uC720\uD615",a=>a==="select"?p(t.\uAE00\uC720\uD615):d(t.\uAE00\uC720\uD615)),n("\uB3C5\uC790\uC0C1\uD0DC",a=>a==="select"?p(t.\uB3C5\uC790\uC0C1\uD0DC):d(t.\uB3C5\uC790\uC0C1\uD0DC)),n("\uB300\uD45C\uC790\uC0B0",a=>a==="select"?p(t.\uB300\uD45C\uC790\uC0B0):d(t.\uB300\uD45C\uC790\uC0B0)),n("\uC0AC\uB840",a=>{let o=(t.\uC0AC\uB840??[]).join(", ");if(o)return a==="multi_select"?{multi_select:(t.\uC0AC\uB840??[]).map(i=>({name:i}))}:{rich_text:A(o)}}),n("\uC870\uD68C\uC218",()=>t.\uC870\uD68C\uC218!=null?{number:t.\uC870\uD68C\uC218}:void 0),n("\uD3B8\uC9D1\uB960",()=>t.\uD3B8\uC9D1\uB960!=null?{number:t.\uD3B8\uC9D1\uB960}:void 0),r}async function Zt(t,e,r){let n=ct(t.DB\uC8FC\uC18C);if(!n)return{ok:!1,error:"DB \uC8FC\uC18C\uB97C \uBABB \uC77D\uC5C8\uC5B4\uC694. \uB178\uC158 \uD398\uC774\uC9C0 \uC8FC\uC18C\uB97C \uB2E4\uC2DC \uBCF5\uC0AC\uD574\uC8FC\uC138\uC694"};let s=await Mt(t);if(!s.ok)return{ok:!1,error:s.error};let d=await Tt(t,"/pages","POST",{parent:{database_id:n},properties:qe(e,s.fields),children:Ve(r)});if(!d.ok)return{ok:!1,error:_t(d.status,d.data?.message??d.text)};let a=["\uB0A0\uC9DC","\uD559\uC0DD\uAD70","\uAE00\uC720\uD615","\uB3C5\uC790\uC0C1\uD0DC","\uB300\uD45C\uC790\uC0B0","\uC0AC\uB840","\uC870\uD68C\uC218","\uD3B8\uC9D1\uB960"].filter(o=>!s.fields[o]);return{ok:!0,url:d.data?.url,pageId:d.data?.id,missing:a}}var Xe=t=>`https://api.telegram.org/bot${t}`;function te(t){return String(t??"").replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,200)}function Ye(t){return String(t??"").trim().length>200}function Qe(t){let e=String(t??"").trim();return e?/^[\x20-\x7e]+$/.test(e)?/\s/.test(e)?"\uC5F4\uC1E0 \uC548\uC5D0 \uBE48\uCE78\uC774 \uC788\uC5B4\uC694. \uC55E\uB4A4\uB97C \uC798\uB77C\uB0B4\uACE0 \uB123\uC5B4\uC8FC\uC138\uC694":e.includes(":")?/^\d{5,}:[A-Za-z0-9_-]{20,}$/.test(e)?"":"\uC5F4\uC1E0 \uBAA8\uC591\uC774 \uB2EC\uB77C\uC694. \uD1B5\uC9F8\uB85C \uBCF5\uC0AC\uB418\uC168\uB294\uC9C0 \uD655\uC778\uD574\uC8FC\uC138\uC694":"\uC5F4\uC1E0 \uBAA8\uC591\uC774 \uB2EC\uB77C\uC694. @BotFather \uAC00 \uC900 \uAC74 \uC22B\uC790\uC640 : \uB85C \uC2DC\uC791\uD574\uC694":"\uC5F4\uC1E0\uC5D0 \uD55C\uAE00\uC774\uB098 \uC774\uC0C1\uD55C \uAE00\uC790\uAC00 \uC11E\uC600\uC5B4\uC694. \uBC1B\uC740 \uADF8\uB300\uB85C \uB123\uC5B4\uC8FC\uC138\uC694":"\uBD07 \uC5F4\uC1E0\uB97C \uB123\uC5B4\uC8FC\uC138\uC694"}function dt(t,e){return t===-1?e??"\uBD07 \uC5F4\uC1E0\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694":t===401?"\uBD07 \uC5F4\uC1E0\uAC00 \uC548 \uB9DE\uC544\uC694. @BotFather \uC5D0\uC11C \uBC1B\uC740 \uAC78 \uB2E4\uC2DC \uB123\uC5B4\uC8FC\uC138\uC694":t===404?"\uADF8 \uBD07\uC744 \uBABB \uCC3E\uC558\uC5B4\uC694. \uC5F4\uC1E0\uB97C \uB2E4\uC2DC \uD655\uC778\uD574\uC8FC\uC138\uC694":t===409?"\uB2E4\uB978 \uACF3\uC5D0\uC11C \uAC19\uC740 \uBD07\uC744 \uC4F0\uACE0 \uC788\uC5B4\uC694. \uD55C \uACF3\uC5D0\uC11C\uB9CC \uCF1C\uC8FC\uC138\uC694":t===0?"\uC778\uD130\uB137\uC774 \uC548 \uB2FF\uC544\uC694":`\uD154\uB808\uADF8\uB7A8\uC774 \uAC70\uC808\uD588\uC5B4\uC694 (${t})`+(e?` \u2014 ${e.slice(0,100)}`:"")}async function nt(t,e,r){let n=Qe(t);if(n)return{ok:!1,status:-1,data:null,desc:n};try{let s=await fetch(`${Xe(t)}/${e}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(r??{})}),d=await s.json().catch(()=>null);return{ok:s.ok&&d?.ok!==!1,status:s.status,data:d?.result,desc:d?.description}}catch(s){return{ok:!1,status:0,data:null,desc:s.message}}}async function ee(t){let e=await nt(t,"getMe");return e.ok?{ok:!0,name:e.data?.username}:{ok:!1,error:dt(e.status,e.desc)}}function ne(t){let e=t?.message??t?.edited_message;if(!e)return null;let r={chatId:e.chat?.id,updateId:t.update_id,from:e.from?.username??e.from?.first_name??""};if(e.voice||e.audio||e.video_note)return{...r,kind:"\uC74C\uC131"};if(e.photo?.length){let s=e.photo[e.photo.length-1];return{...r,kind:"\uC0AC\uC9C4",fileId:s.file_id,text:te(e.caption)}}if(e.document)return{...r,kind:"\uC0AC\uC9C4",fileId:e.document.file_id,fileName:e.document.file_name};let n=e.text??e.caption??"";return String(n).trim()?/^https?:\/\/\S+$/.test(String(n).trim())?{...r,kind:"\uB9C1\uD06C",text:String(n).trim().slice(0,500)}:Ye(n)?{...r,kind:"\uAE34\uAE00",text:String(n).slice(0,2e4)}:{...r,kind:"\uAE00\uAC10",text:te(n)}:{...r,kind:"\uBB34\uC2DC"}}async function re(t,e=0){let r=await nt(t.\uBD07\uD1A0\uD070,"getUpdates",{offset:(t.\uB9C8\uC9C0\uB9C9??0)+1,timeout:e,allowed_updates:["message","edited_message"]});if(!r.ok)return{ok:!1,error:dt(r.status,r.desc)};let n=Array.isArray(r.data)?r.data:[],s=t.\uB9C8\uC9C0\uB9C9??0,d=[],p=new Set;for(let a of n){typeof a.update_id=="number"&&a.update_id>s&&(s=a.update_id);let o=ne(a);if(o){if(t.\uB0B4chat_id&&String(o.chatId)!==String(t.\uB0B4chat_id)){p.add(o.chatId);continue}o.kind!=="\uBB34\uC2DC"&&d.push(o)}}return{ok:!0,items:d,last:s,strangers:[...p],seen:n.length}}async function se(t){let e=await nt(t,"getUpdates",{timeout:0,limit:10});if(!e.ok)return{ok:!1,error:dt(e.status,e.desc)};let r=Array.isArray(e.data)?e.data:[];for(let n of r.reverse()){let s=ne(n);if(s?.chatId)return{ok:!0,chatId:String(s.chatId),from:s.from,last:n.update_id}}return{ok:!1,error:"\uC544\uC9C1 \uBA54\uC2DC\uC9C0\uAC00 \uC5C6\uC5B4\uC694. \uB9CC\uB4DC\uC2E0 \uBD07\uC5D0\uAC8C \uC544\uBB34 \uB9D0\uC774\uB098 \uD55C \uBC88 \uBCF4\uB0B4\uC8FC\uC138\uC694"}}async function Nt(t,e,r){await nt(t.\uBD07\uD1A0\uD070,"sendMessage",{chat_id:e,text:r,disable_web_page_preview:!0})}async function ae(t,e){let r=await nt(t,"getFile",{file_id:e});if(!r.ok||!r.data?.file_path)return{ok:!1,error:dt(r.status,r.desc)};let n=r.data.file_path;try{let s=await fetch(`https://api.telegram.org/file/bot${t}/${n}`);if(!s.ok)return{ok:!1,error:`\uD30C\uC77C\uC744 \uBABB \uBC1B\uC558\uC5B4\uC694 (${s.status})`};let d=Buffer.from(await s.arrayBuffer());return d.length>20*1024*1024?{ok:!1,error:"\uD30C\uC77C\uC774 \uB108\uBB34 \uCEE4\uC694"}:{ok:!0,buf:d,name:n.split("/").pop()??"\uBC1B\uC740\uD30C\uC77C"}}catch(s){return{ok:!1,error:s.message}}}function P(t=new Date){return t.toLocaleDateString("sv-SE")}import{deflateRawSync as Ze,inflateRawSync as tn}from"node:zlib";import{readdirSync as en,readFileSync as nn,mkdirSync as rn,writeFileSync as sn}from"node:fs";import{join as rt,relative as an,dirname as on,sep as cn}from"node:path";var ln=(()=>{let t=new Uint32Array(256);for(let e=0;e<256;e++){let r=e;for(let n=0;n<8;n++)r=r&1?3988292384^r>>>1:r>>>1;t[e]=r>>>0}return t})();function dn(t){let e=4294967295;for(let r=0;r<t.length;r++)e=ln[(e^t[r])&255]^e>>>8;return(e^4294967295)>>>0}function ie(t,e=t,r=[]){for(let n of en(e,{withFileTypes:!0})){let s=rt(e,n.name);n.isDirectory()?ie(t,s,r):n.isFile()&&r.push(an(t,s))}return r}var pn=t=>t.split(cn).join("/").normalize("NFC");function oe({\uBFCC\uB9AC:t,\uD3F4\uB354\uB4E4:e}){let r=[],n=[],s=0;for(let o of e){let i=rt(t,o),c;try{c=ie(i)}catch{continue}for(let u of c){let b=pn(rt(o,u)),g=Buffer.from(b,"utf8"),h=nn(rt(i,u)),v=Ze(h,{level:6}),m=v.length<h.length,x=m?v:h,_=m?8:0,q=dn(h),O=Buffer.alloc(30);O.writeUInt32LE(67324752,0),O.writeUInt16LE(20,4),O.writeUInt16LE(2048,6),O.writeUInt16LE(_,8),O.writeUInt16LE(0,10),O.writeUInt16LE(0,12),O.writeUInt32LE(q,14),O.writeUInt32LE(x.length,18),O.writeUInt32LE(h.length,22),O.writeUInt16LE(g.length,26),O.writeUInt16LE(0,28),r.push(O,g,x);let E=Buffer.alloc(46);E.writeUInt32LE(33639248,0),E.writeUInt16LE(20,4),E.writeUInt16LE(20,6),E.writeUInt16LE(2048,8),E.writeUInt16LE(_,10),E.writeUInt16LE(0,12),E.writeUInt16LE(0,14),E.writeUInt32LE(q,16),E.writeUInt32LE(x.length,20),E.writeUInt32LE(h.length,24),E.writeUInt16LE(g.length,28),E.writeUInt16LE(0,30),E.writeUInt16LE(0,32),E.writeUInt16LE(0,34),E.writeUInt16LE(0,36),E.writeUInt32LE(0,38),E.writeUInt32LE(s,42),n.push(E,g),s+=30+g.length+x.length}}let d=Buffer.concat(n),p=Buffer.alloc(22),a=n.length/2;return p.writeUInt32LE(101010256,0),p.writeUInt16LE(0,4),p.writeUInt16LE(0,6),p.writeUInt16LE(a,8),p.writeUInt16LE(a,10),p.writeUInt32LE(d.length,12),p.writeUInt32LE(s,16),p.writeUInt16LE(0,20),Buffer.concat([...r,d,p])}function un(t){let e=-1;for(let d=t.length-22;d>=0&&d>t.length-22-65536;d--)if(t.readUInt32LE(d)===101010256){e=d;break}if(e<0)throw new Error("\uC555\uCD95 \uD30C\uC77C \uBAA8\uC591\uC774 \uC544\uB2C8\uC5D0\uC694");let r=t.readUInt16LE(e+10),n=t.readUInt32LE(e+16),s=[];for(let d=0;d<r&&t.readUInt32LE(n)===33639248;d++){let p=t.readUInt16LE(n+8),a=t.readUInt16LE(n+10),o=t.readUInt32LE(n+20),i=t.readUInt16LE(n+28),c=t.readUInt16LE(n+30),u=t.readUInt16LE(n+32),b=t.readUInt32LE(n+42),g=t.subarray(n+46,n+46+i);n+=46+i+c+u;let h=g.toString("utf8").normalize("NFC");if(h.endsWith("/")||h.includes("..")||h.startsWith("/")||/^[a-zA-Z]:/.test(h)||h.includes("\0")||t.readUInt32LE(b)!==67324752)continue;let v=t.readUInt16LE(b+26),m=t.readUInt16LE(b+28),x=b+30+v+m,_=t.subarray(x,x+o);s.push({\uC774\uB984:h,\uBAB8:a===8?tn(_):Buffer.from(_)})}return s}function $t(t,e){let r=un(t);for(let{\uC774\uB984:n,\uBAB8:s}of r){let d=rt(e,n);rn(on(d),{recursive:!0}),sn(d,s)}return r.length}function Ot(t){let e=0,r=0,n=-1;for(let p=t.length-22;p>=0&&p>t.length-22-65536;p--)if(t.readUInt32LE(p)===101010256){n=p;break}if(n<0)return{\uAC1C\uC218:0,\uBC14\uC774\uD2B8:0};let s=t.readUInt16LE(n+10),d=t.readUInt32LE(n+16);for(let p=0;p<s&&t.readUInt32LE(d)===33639248;p++)r+=t.readUInt32LE(d+24),e++,d+=46+t.readUInt16LE(d+28)+t.readUInt16LE(d+30)+t.readUInt16LE(d+32);return{\uAC1C\uC218:e,\uBC14\uC774\uD2B8:r}}import{readdir as fn,stat as bn,readFile as Lt}from"node:fs/promises";import{join as pt}from"node:path";import{existsSync as It}from"node:fs";var ce=t=>Math.floor((Date.now()-t)/864e5);function hn(t,e){let r=p=>{let a=p.match(/[가-힣A-Za-z0-9]+/g)??[],o=new Set;for(let i=0;i+5<=a.length;i++)o.add(a.slice(i,i+5).join(" "));return o},n=r(t),s=r(e);if(!n.size||!s.size)return 0;let d=0;for(let p of n)s.has(p)&&d++;return Math.round(d*100/Math.min(n.size,s.size))}async function le(t){let e=[],r=pt(t,"10_\uD559\uC6D0\uC704\uD0A4","\uC0AC\uB840"),n=[];if(It(r))for(let i of(await fn(r)).filter(c=>c.endsWith(".md"))){let c=pt(r,i);n.push({\uC774\uB984:i.replace(/\.md$/,""),\uAE00:await Lt(c,"utf8").catch(()=>""),\uC190\uB304\uB0A0:(await bn(c)).mtimeMs})}let s=n.filter(i=>ce(i.\uC190\uB304\uB0A0)>180);s.length&&e.push({\uC885\uB958:"\uC624\uB798\uB428",\uBB34\uC5C7:`${s.length}\uAC74\uC774 \uC5EC\uC12F \uB2EC \uB118\uAC8C \uADF8\uB300\uB85C\uC608\uC694`,\uAE4C\uB2ED:"\uC0AC\uB840\uC5D0 \uC801\uD78C \uAE30\uAC04\xB7\uC810\uC218\uAC00 \uC9C0\uAE08\uB3C4 \uB9DE\uB294\uC9C0 \uD655\uC778\uC774 \uD544\uC694\uD574\uC694. \uC624\uB798\uB41C \uC22B\uC790\uB97C \uADF8\uB300\uB85C \uC4F0\uBA74 \uD559\uBD80\uBAA8\uAED8 \uC0AC\uC2E4\uACFC \uB2E4\uB978 \uB9D0\uC744 \uD558\uAC8C \uB3FC\uC694.",\uB300\uC0C1:s.map(i=>i.\uC774\uB984),\uAE09\uD568:2,\uBB50\uD558\uBA74\uB418\uB098:"\uD55C \uBC88 \uC77D\uC5B4\uBCF4\uC2DC\uACE0 \uC9C0\uAE08\uB3C4 \uB9DE\uC73C\uBA74 \uADF8\uB300\uB85C \uB450\uC154\uB3C4 \uB3FC\uC694. \uC5F4\uC5B4\uBCF4\uAE30\uB9CC \uD574\uB3C4 \uB0A0\uC9DC\uAC00 \uC0C8\uB85C \uC7A1\uD600\uC694."});let d=[];for(let i=0;i<n.length;i++)for(let c=i+1;c<n.length;c++)hn(n[i].\uAE00,n[c].\uAE00)>=55&&d.push(`${n[i].\uC774\uB984} \u2194 ${n[c].\uC774\uB984}`);d.length&&e.push({\uC885\uB958:"\uACB9\uCE68",\uBB34\uC5C7:`\uB0B4\uC6A9\uC774 \uB9CE\uC774 \uB2EE\uC740 \uC0AC\uB840\uAC00 ${d.length}\uC9DD \uC788\uC5B4\uC694`,\uAE4C\uB2ED:"\uAE00\uB9C8\uB2E4 \uB2E4\uB978 \uC0AC\uB840\uCC98\uB7FC \uC4F0\uC774\uB294\uB370 \uD559\uBD80\uBAA8\uAC00 \uBCF4\uAE30\uC5D4 \uAC19\uC740 \uC774\uC57C\uAE30\uC608\uC694. \uAC19\uC740 \uC544\uC774 \uC774\uC57C\uAE30\uAC00 \uBC18\uBCF5\uB418\uBA74 '\uC774 \uD559\uC6D0\uC5D4 \uC800 \uD559\uC0DD\uBC16\uC5D0 \uC5C6\uB098' \uC0DD\uAC01\uD558\uC138\uC694.",\uB300\uC0C1:d,\uAE09\uD568:2,\uBB50\uD558\uBA74\uB418\uB098:"\uD558\uB098\uB85C \uD569\uCE58\uC2DC\uAC70\uB098, \uB2E4\uB978 \uC810\uC774 \uB4DC\uB7EC\uB098\uAC8C \uD55C\uCABD\uC744 \uACE0\uCCD0\uC8FC\uC138\uC694."});let p=n.filter(i=>i.\uAE00.replace(/[#\s]/g,"").length<60);p.length&&e.push({\uC885\uB958:"\uBE48\uCE78",\uBB34\uC5C7:`\uB0B4\uC6A9\uC774 \uAC70\uC758 \uC5C6\uB294 \uC0AC\uB840\uAC00 ${p.length}\uAC74 \uC788\uC5B4\uC694`,\uAE4C\uB2ED:"\uAE00\uC5D0 \uADFC\uAC70\uB85C \uBABB \uC368\uC694. \uAC80\uC218\uAE30\uAC00 '\uC9C0\uC5B4\uB0B8 \uC0AC\uB840' \uB85C \uBCFC \uC218\uB3C4 \uC788\uC5B4\uC694.",\uB300\uC0C1:p.map(i=>i.\uC774\uB984),\uAE09\uD568:1,\uBB50\uD558\uBA74\uB418\uB098:"\uC0C1\uD669\xB7\uBB34\uC5C7\uC744 \uD588\uB098\xB7\uACB0\uACFC \uC138 \uC904\uB9CC \uCC44\uC6CC\uC8FC\uC2DC\uBA74 \uBC14\uB85C \uC4F8 \uC218 \uC788\uC5B4\uC694."});let a=pt(t,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC","06_\uAE00\uAC10\uCC3D\uACE0","_\uBAA9\uB85D.json");if(It(a)){let u=(JSON.parse(await Lt(a,"utf8").catch(()=>"{}")).items??[]).filter(b=>!b.used).filter(b=>b.date&&ce(new Date(b.date).getTime())>90);u.length>=8&&e.push({\uC885\uB958:"\uC548\uC4F0\uC784",\uBB34\uC5C7:`\uC11D \uB2EC \uB118\uAC8C \uC548 \uC4F0\uC2E0 \uAE00\uAC10\uC774 ${u.length}\uAC1C \uC313\uC600\uC5B4\uC694`,\uAE4C\uB2ED:"\uCCA0 \uC9C0\uB09C \uAC83\uC774 \uC11E\uC5EC \uC788\uC73C\uBA74 \uACE0\uB974\uC2E4 \uB54C \uB354 \uD5F7\uAC08\uB824\uC694. \uACA8\uC6B8\uBC29\uD559 \uAE00\uAC10\uC774 \uBD04\uC5D0\uB3C4 \uB0A8\uC544 \uC788\uB294 \uC2DD\uC774\uC5D0\uC694.",\uB300\uC0C1:u.slice(0,6).map(b=>String(b.topic??"")),\uAE09\uD568:3,\uBB50\uD558\uBA74\uB418\uB098:"\uC9C0\uAE08 \uC548 \uC4F0\uC2E4 \uAC83\uB9CC \uACE8\uB77C \uC9C0\uC6B0\uC2DC\uBA74 \uB098\uBA38\uC9C0\uAC00 \uC798 \uBCF4\uC5EC\uC694."})}let o=pt(t,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC","01_\uAE30\uCD08\uC815\uBCF4","\uD559\uC6D0\uC815\uBCF4.md");if(It(o)&&n.length>=2){let c=((await Lt(o,"utf8").catch(()=>"")).match(/##\s*과목\s*\n+([^\n#]+)/)??[])[1]?.trim()??"";c&&n.filter(b=>!b.\uAE00.includes(c)).length===n.length&&e.push({\uC885\uB958:"\uC548\uB9DE\uC74C",\uBB34\uC5C7:`\uD559\uC6D0 \uACFC\uBAA9\uC740 "${c}" \uC778\uB370 \uC0AC\uB840\uC5D0 \uADF8 \uB9D0\uC774 \uD55C \uBC88\uB3C4 \uC548 \uB098\uC640\uC694`,\uAE4C\uB2ED:"\uAE00\uC5D0 \uD559\uC6D0 \uC774\uC57C\uAE30\uB97C \uB123\uC744 \uADFC\uAC70\uAC00 \uC5C6\uC5B4\uC838\uC694. \uADFC\uAC70 \uC5C6\uB294 \uBB38\uC7A5\uC740 \uAD11\uACE0\uBC95\uC5D0 \uAC78\uB824\uC11C \uC544\uC608 \uBABB \uC368\uC694.",\uB300\uC0C1:[c],\uAE09\uD568:1,\uBB50\uD558\uBA74\uB418\uB098:"\uD559\uC6D0 \uC815\uBCF4\uC758 \uACFC\uBAA9\uC774 \uB9DE\uB294\uC9C0 \uBCF4\uC2DC\uAC70\uB098, \uADF8 \uACFC\uBAA9 \uC0AC\uB840\uB97C \uD558\uB098\uB9CC \uB123\uC5B4\uC8FC\uC138\uC694."})}return e.sort((i,c)=>i.\uAE09\uD568-c.\uAE09\uD568)}import{DatabaseSync as de}from"node:sqlite";import{existsSync as gn,mkdirSync as mn,renameSync as vn}from"node:fs";import{join as pe,dirname as xn}from"node:path";var I=null,C="",yn=[{\uC774\uB984:"1-\uC791\uC5C5\uB300\uC7A5",sql:`
      CREATE TABLE IF NOT EXISTS \uC791\uC5C5 (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        \uBA85\uB839       TEXT NOT NULL,
        \uD3F4\uB354       TEXT,
        \uC0C1\uD0DC       TEXT NOT NULL,          -- \uB3C4\uB294\uC911 | \uB05D\uB0A8 | \uC2E4\uD328 | \uBA48\uCDA4 | \uB04A\uAE40
        \uC2DC\uC791       INTEGER NOT NULL,       -- epoch ms
        \uB05D         INTEGER,
        \uB2E8\uACC4        TEXT,
        \uAE30\uB85D       TEXT,                   -- \uD654\uBA74\uC5D0 \uBCF4\uC5EC\uB4DC\uB9B0 \uAE00
        pid        INTEGER
      );
      CREATE INDEX IF NOT EXISTS \uC791\uC5C5_\uC0C1\uD0DC ON \uC791\uC5C5(\uC0C1\uD0DC, \uC2DC\uC791 DESC);

      CREATE TABLE IF NOT EXISTS \uC2E4\uD589\uAC12 (
        \uC791\uC5C5       INTEGER PRIMARY KEY REFERENCES \uC791\uC5C5(id) ON DELETE CASCADE,
        \uB0A0\uC9DC       TEXT NOT NULL,
        \uB410\uB098       INTEGER NOT NULL,
        \uB4E4\uC778\uCD08     INTEGER, \uD134 INTEGER,
        \uC785\uB825       INTEGER, \uCD9C\uB825 INTEGER, \uCE90\uC2DC\uC77D\uAE30 INTEGER, \uCE90\uC2DC\uC4F0\uAE30 INTEGER,
        \uB2EC\uB7EC       REAL
      );

      -- \uD55C \uBC88\uC5D0 \uD558\uB098\uB9CC \uB3CC\uAC8C \uD55C\uB2E4. \uC5C5\uB370\uC774\uD2B8\xB7\uB418\uC0B4\uB9AC\uAE30\uAC00 \uAE00\uC4F0\uAE30 \uC911\uC5D0 \uB07C\uC5B4\uB4E4\uBA74
      -- \uBC18\uCBE4 \uBC14\uB010 \uD504\uB85C\uADF8\uB7A8\uC774 \uAE00\uC744 \uB9C8\uC800 \uC4F0\uAC8C \uB41C\uB2E4.
      CREATE TABLE IF NOT EXISTS \uC7A0\uAE08 (
        \uBB34\uC5C7       TEXT PRIMARY KEY,
        \uB204\uAC00       TEXT,
        \uC5B8\uC81C       INTEGER NOT NULL
      );
    `},{\uC774\uB984:"2-\uC18C\uC2DD",sql:`
      -- \uC6D0\uC7A5\uB2D8 \uCEF4\uD4E8\uD130\uC5D0\uC11C \uBB34\uC2A8 \uC77C\uC774 \uC788\uC5C8\uB098. **\uBCF4\uB0B4\uAE30 \uC804\uAE4C\uC9C0 \uC5EC\uAE30 \uC313\uC778\uB2E4.**
      -- \uAE00 \uB0B4\uC6A9\uC740 \uC808\uB300 \uC548 \uB2F4\uB294\uB2E4. \uBB34\uC2A8 \uBA85\uB839\uC774 \uC5B8\uC81C \uC5B4\uB5BB\uAC8C \uC548 \uB410\uB294\uC9C0\uB9CC \uB2F4\uB294\uB2E4.
      CREATE TABLE IF NOT EXISTS \uC18C\uC2DD (
        id     INTEGER PRIMARY KEY AUTOINCREMENT,
        \uC5B8\uC81C   INTEGER NOT NULL,
        \uAC08\uB798   TEXT NOT NULL,          -- \uC624\uB958 | \uB9C9\uD798 | \uC4F0\uC784
        \uBB34\uC5C7   TEXT NOT NULL,
        \uC790\uC138\uD788 TEXT,
        \uBCF4\uB0C4   INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS \uC18C\uC2DD_\uC548\uBCF4\uB0C4 ON \uC18C\uC2DD(\uBCF4\uB0C4, \uC5B8\uC81C);
    `},{\uC774\uB984:"3-\uB2E8\uACC4\uAC12",sql:`
      -- \uC5B4\uB290 \uB2E8\uACC4\uC5D0\uC11C \uC5BC\uB9C8\uB098 \uC37C\uB098. "\uAE00 \uD55C \uD3B8\uC5D0 34\uB9CC" \uB9CC\uC73C\uB85C\uB294
      -- \uC5B4\uB514\uB97C \uC904\uC5EC\uC57C \uD560\uC9C0 \uBAA8\uB978\uB2E4.
      CREATE TABLE IF NOT EXISTS \uB2E8\uACC4\uAC12 (
        \uC791\uC5C5   INTEGER NOT NULL REFERENCES \uC791\uC5C5(id) ON DELETE CASCADE,
        \uB2E8\uACC4   TEXT NOT NULL,
        \uD1A0\uD070   INTEGER, \uD134 INTEGER, \uCD08 INTEGER,
        PRIMARY KEY (\uC791\uC5C5, \uB2E8\uACC4)
      );
    `}];function N(t){if(I&&C===pe(t,"data","blogstudio.db"))return I;C=pe(t,"data","blogstudio.db"),mn(xn(C),{recursive:!0});try{I=new de(C),I.exec("PRAGMA journal_mode = WAL"),I.exec("PRAGMA busy_timeout = 4000"),I.exec("PRAGMA foreign_keys = ON"),ue(I)}catch{if(gn(C))try{vn(C,`${C}.\uAE68\uC9D0.${Date.now()}`)}catch{}I=new de(C),I.exec("PRAGMA journal_mode = WAL"),ue(I)}return I}function ue(t){t.exec("CREATE TABLE IF NOT EXISTS \uD310 (\uC774\uB984 TEXT PRIMARY KEY, \uC5B8\uC81C INTEGER)");let e=t.prepare("SELECT 1 FROM \uD310 WHERE \uC774\uB984 = ?"),r=t.prepare("INSERT INTO \uD310 (\uC774\uB984, \uC5B8\uC81C) VALUES (?, ?)");for(let n of yn)e.get(n.\uC774\uB984)||(t.exec(n.sql),r.run(n.\uC774\uB984,Date.now()))}function fe(t,e,r){let s=N(t).prepare("INSERT INTO \uC791\uC5C5 (\uBA85\uB839, \uC0C1\uD0DC, \uC2DC\uC791, pid) VALUES (?, '\uB3C4\uB294\uC911', ?, ?)").run(e,Date.now(),r??null);return Number(s.lastInsertRowid)}function be(t,e,r){let n=N(t),s=Object.keys(r).filter(d=>r[d]!==void 0);s.length&&n.prepare(`UPDATE \uC791\uC5C5 SET ${s.map(d=>`${d} = ?`).join(", ")} WHERE id = ?`).run(...s.map(d=>r[d]),e)}function he(t){let e=N(t),r=e.prepare("UPDATE \uC791\uC5C5 SET \uC0C1\uD0DC = '\uB04A\uAE40', \uB05D = ? WHERE \uC0C1\uD0DC = '\uB3C4\uB294\uC911'").run(Date.now()).changes;return e.prepare("DELETE FROM \uC7A0\uAE08").run(),Number(r)}function ge(t,e,r){N(t).prepare(`INSERT OR REPLACE INTO \uC2E4\uD589\uAC12
    (\uC791\uC5C5, \uB0A0\uC9DC, \uB410\uB098, \uB4E4\uC778\uCD08, \uD134, \uC785\uB825, \uCD9C\uB825, \uCE90\uC2DC\uC77D\uAE30, \uCE90\uC2DC\uC4F0\uAE30, \uB2EC\uB7EC)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(e,r.\uB0A0\uC9DC,r.\uB410\uB098?1:0,r.\uB4E4\uC778\uCD08,r.\uD134,r.\uC785\uB825,r.\uCD9C\uB825,r.\uCE90\uC2DC\uC77D\uAE30,r.\uCE90\uC2DC\uC4F0\uAE30,r.\uB2EC\uB7EC)}function me(t,e,r){try{let s=N(t).prepare("INSERT OR REPLACE INTO \uB2E8\uACC4\uAC12 (\uC791\uC5C5, \uB2E8\uACC4, \uD1A0\uD070, \uD134, \uCD08) VALUES (?,?,?,?,?)");for(let[d,p]of Object.entries(r))s.run(e,d,p.\uD1A0\uD070,p.\uD134,p.\uCD08)}catch{}}function ut(t,e,r=""){let n=N(t);try{return n.prepare("INSERT INTO \uC7A0\uAE08 (\uBB34\uC5C7, \uB204\uAC00, \uC5B8\uC81C) VALUES (?, ?, ?)").run(e,r,Date.now()),!0}catch{return!1}}function Rt(t,e){N(t).prepare("DELETE FROM \uC7A0\uAE08 WHERE \uBB34\uC5C7 = ?").run(e)}function ft(t){let e=N(t).prepare("SELECT \uBB34\uC5C7 FROM \uC7A0\uAE08 ORDER BY \uC5B8\uC81C LIMIT 1").get();return e?String(e.\uBB34\uC5C7):null}function ve(t){try{N(t).exec("PRAGMA wal_checkpoint(TRUNCATE)")}catch{}}function U(t,e,r,n=""){try{N(t).prepare("INSERT INTO \uC18C\uC2DD (\uC5B8\uC81C, \uAC08\uB798, \uBB34\uC5C7, \uC790\uC138\uD788) VALUES (?,?,?,?)").run(Date.now(),e,r.slice(0,200),n.slice(0,1500))}catch{}}function xe(t,e,r,n=""){try{let s=Date.now()-864e5;N(t).prepare("SELECT 1 FROM \uC18C\uC2DD WHERE \uAC08\uB798 = ? AND \uBB34\uC5C7 = ? AND \uC5B8\uC81C > ?").get(e,r.slice(0,200),s)||U(t,e,r,n)}catch{}}function Pt(t,e=60){try{return N(t).prepare("SELECT id, \uC5B8\uC81C, \uAC08\uB798, \uBB34\uC5C7, \uC790\uC138\uD788 FROM \uC18C\uC2DD WHERE \uBCF4\uB0C4 = 0 ORDER BY \uC5B8\uC81C DESC LIMIT ?").all(e)}catch{return[]}}function ye(t,e){if(e.length)try{let n=N(t).prepare("UPDATE \uC18C\uC2DD SET \uBCF4\uB0C4 = 1 WHERE id = ?");for(let s of e)n.run(s)}catch{}}function we(){try{I?.close()}catch{}I=null,C=""}var f=H(process.argv[2]??"."),K=at(Mn(import.meta.url)),Bt=Number(process.env.PORT??4321);async function G(t){try{return await Oe(t),!0}catch{return!1}}async function k(t,e=""){return await G(t)?B(t,"utf8"):e}async function Nn(t,e){try{return await _n(t,e,{recursive:!0,force:!0}),{ok:!0,out:""}}catch(r){return{ok:!1,out:r.message}}}function S(t,e){try{let r=JSON.parse(t);return r&&typeof r=="object"?r:e}catch{return e}}var At=null;async function Ie(){if(At)return At;let t=process.env.AW_SHOW_ALL==="1",e=S(await k(l(f,"\uAE30\uB2A5.json")),{\uAE30\uB2A5:{}}),r={};for(let[n,s]of Object.entries(e.\uAE30\uB2A5??{}))r[n]=t||!!s?.\uACF5\uAC1C;return At=r}var wt=t=>!/^(이 폴더 설명|\.여기는 비워두세요)/.test(t);async function L(t,e){return await G(t)?(await it(t)).filter(r=>!r.startsWith(".")&&(!e||r.endsWith(e))).sort():[]}var vt={\uBD84:Number(process.env.AW_MAX_MIN??70),\uD1A0\uD070:Number(process.env.AW_MAX_TOKENS??15e6),\uD134:Number(process.env.AW_MAX_TURNS??400)},$n={"1 \uC8FC\uC81C":{\uD134:30,\uD1A0\uD070:8e5,\uBD84:3},"2 \uBAA9\uCC28":{\uD134:35,\uD1A0\uD070:12e5,\uBD84:8},"3 \uC870\uC0AC":{\uD134:45,\uD1A0\uD070:15e5,\uBD84:15},"4 \uCD08\uC548":{\uD134:40,\uD1A0\uD070:18e5,\uBD84:9},"5 \uC724\uBB38":{\uD134:20,\uD1A0\uD070:6e5,\uBD84:5}},V=[],Re=0;function Ct(){return V.some(t=>!t.done)}function ke(t,e){return(r,n)=>{try{Rt(f,t)}catch{}return e(r,n)}}function jt(t){return t?t==="\uAE00\uC4F0\uAE30"?"\uC9C0\uAE08 \uAE00\uC744 \uC4F0\uACE0 \uC788\uC5B4\uC694. \uB05D\uB098\uACE0 \uD574\uC8FC\uC138\uC694.":t==="\uC5C5\uB370\uC774\uD2B8"?"\uC9C0\uAE08 \uD504\uB85C\uADF8\uB7A8\uC744 \uC0C8\uB85C \uBC1B\uB294 \uC911\uC774\uC5D0\uC694. \uB05D\uB098\uACE0 \uD574\uC8FC\uC138\uC694.":"\uC9C0\uAE08 \uC790\uB8CC\uB97C \uB418\uC0B4\uB9AC\uB294 \uC911\uC774\uC5D0\uC694. \uB05D\uB098\uACE0 \uD574\uC8FC\uC138\uC694.":""}function Se(t,e){let r={id:++Re,cmd:e,out:"",done:!1,ok:!1,started:Date.now()};V.push(r);let n=r.proc=Le(t,{cwd:f,shell:!0});return n.stdout?.on("data",s=>r.out+=s),n.stderr?.on("data",s=>r.out+=s),n.on("error",s=>{r.out+=`
\uC548 \uB410\uC5B4\uC694: ${s.message}`,r.done=!0}),n.on("close",s=>{r.done=!0,r.ok=s===0}),r}function Ee(t){return t.split(`
`).filter(e=>!/no stdin data received|redirect stdin explicitly|DeprecationWarning|ExperimentalWarning|--trace-deprecation/.test(e)).join(`
`)}function Te(t,e){let r=e.trim();if(!r.startsWith("{"))return;let n;try{n=JSON.parse(r)}catch{return}if(n?.type==="assistant"){let i=n.message?.usage??{},c=b=>typeof b=="number"&&Number.isFinite(b)?b:0,u=c(i.input_tokens)+c(i.output_tokens)+c(i.cache_read_input_tokens)+c(i.cache_creation_input_tokens);t.\uC313\uC778\uD1A0\uD070=(t.\uC313\uC778\uD1A0\uD070??0)+u,t.\uC313\uC778\uD134=(t.\uC313\uC778\uD134??0)+1,On(t,r,u),Pe(t);return}if(n?.type!=="result")return;typeof n.result=="string"&&n.result&&(t.out+=n.result);let s=n.usage??{},d=i=>typeof i=="number"&&Number.isFinite(i)?i:0,p=d(s.input_tokens)+d(s.output_tokens)+d(s.cache_read_input_tokens)+d(s.cache_creation_input_tokens),a=Math.max(p,t.\uC313\uC778\uD1A0\uD070??0),o=p>0?a/p:1;t.\uAC12={\uB4E4\uC778\uCD08:Math.round(d(n.duration_ms)/1e3),\uD134:Math.max(d(n.num_turns),t.\uC313\uC778\uD134??0),\uC785\uB825:d(s.input_tokens),\uCD9C\uB825:d(s.output_tokens),\uCE90\uC2DC\uC77D\uAE30:Math.round(d(s.cache_read_input_tokens)*o),\uCE90\uC2DC\uC4F0\uAE30:Math.round(d(s.cache_creation_input_tokens)*o),\uB2EC\uB7EC:d(n.total_cost_usd),\uB2EC\uB7EC\uC124\uBA85:o>1.05?"API \uD658\uC0B0 \uCD94\uC815. `result` \uAC12 \uADF8\uB300\uB85C\uB77C \uB2F4\uB2F9(\uC11C\uBE0C\uC5D0\uC774\uC804\uD2B8) \uBAAB\uC774 \uBE60\uC838 \uC788\uC744 \uC218 \uC788\uB2E4":"API \uD658\uC0B0 \uCD94\uC815. \uC815\uC561\uC81C\uBA74 \uC2E4\uC81C \uCCAD\uAD6C\uC561\uC774 \uC544\uB2C8\uB2E4",\uB2F4\uB2F9\uBC30\uC218:Math.round(o*100)/100}}function Q(t,e=!1){let r=t.proc;if(!r?.pid)return;let n=e?"SIGKILL":"SIGTERM";try{process.platform==="win32"?Ut(`taskkill /PID ${r.pid} /T${e?" /F":""}`,()=>{}):process.kill(-r.pid,n)}catch{try{r.kill(n)}catch{}}}var Dt=[["1_\uAE30\uD68D","\u2460 \uC8FC\uC81C \uACE0\uB974\uAE30"],["2_\uBAA9\uCC28","\u2461 \uC21C\uC11C \uC7A1\uAE30"],["3_\uC870\uC0AC","\u2462 \uADFC\uAC70 \uCC3E\uAE30"],["4_\uCD08\uC548","\u2463 \uC4F0\uAE30"],["5_\uC724\uBB38","\u2464 \uB2E4\uB4EC\uAE30"]];function On(t,e,r){for(let s=Dt.length-1;s>=0;s--)if(e.includes(Dt[s][0])){let d=Dt[s][1];if(t.\uB2E8\uACC4!==d){let p=t.\uB2E8\uACC4&&t.\uB2E8\uACC4\uBCC4?.[t.\uB2E8\uACC4];p&&(p.\uCD08=Math.round((Date.now()-p.\uC2DC\uC791)/1e3)),t.\uB2E8\uACC4=d}break}let n=t.\uB2E8\uACC4??"\uC2DC\uC791 \uC804";t.\uB2E8\uACC4\uBCC4??={},t.\uB2E8\uACC4\uBCC4[n]??={\uD1A0\uD070:0,\uD134:0,\uC2DC\uC791:Date.now(),\uCD08:0},t.\uB2E8\uACC4\uBCC4[n].\uD1A0\uD070+=r,t.\uB2E8\uACC4\uBCC4[n].\uD134+=1,t.\uB2E8\uACC4\uBCC4[n].\uCD08=Math.round((Date.now()-t.\uB2E8\uACC4\uBCC4[n].\uC2DC\uC791)/1e3)}function Ln(t){let e=t.\uB2E8\uACC4;if(!e)return"";let r=$n[e],n=t.\uB2E8\uACC4\uBCC4?.[e];return!r||!n?"":n.\uD1A0\uD070>r.\uD1A0\uD070?`${e} \uB2E8\uACC4\uAC00 \uD63C\uC790 \uB108\uBB34 \uB9CE\uC774 \uC368\uC11C`:n.\uD134>r.\uD134?`${e} \uB2E8\uACC4\uAC00 \uAC19\uC740 \uC77C\uC744 ${n.\uD134}\uBC88 \uB418\uD480\uC774\uD574\uC11C`:n.\uCD08>r.\uBD84*60?`${e} \uB2E8\uACC4\uAC00 ${Math.round(n.\uCD08/60)}\uBD84\uC744 \uB118\uACA8\uC11C`:""}function Pe(t){if(t.done||t.\uB04A\uC74C)return;let e=(Date.now()-t.started)/6e4,r=e>vt.\uBD84?`${Math.round(e)}\uBD84\uC774 \uB118\uC5B4\uC11C`:(t.\uC313\uC778\uD1A0\uD070??0)>vt.\uD1A0\uD070?"\uC4F0\uB294 \uC591\uC774 \uB108\uBB34 \uB9CE\uC544\uC11C":(t.\uC313\uC778\uD134??0)>vt.\uD134?"\uAC19\uC740 \uC77C\uC744 \uB108\uBB34 \uC5EC\uB7EC \uBC88 \uB418\uD480\uC774\uD574\uC11C":Ln(t);if(r){t.\uB04A\uC74C=r,t.out+=`

${r} \uC5EC\uAE30\uC11C \uBA48\uCDC4\uC5B4\uC694.
\uC5EC\uAE30\uAE4C\uC9C0 \uB098\uC628 \uAC83\uC740 \uADF8\uB300\uB85C \uC788\uC5B4\uC694 \u2014 \uB2E4\uC2DC \uB204\uB974\uC2DC\uBA74 **\uC774\uC5B4\uC11C** \uD574\uC694.
\uC790\uAFB8 \uC774\uB7EC\uBA74 \uB9CC\uB4E0 \uC0AC\uB78C\uC5D0\uAC8C \uC54C\uB824\uC8FC\uC138\uC694.`,Q(t),setTimeout(()=>{t.proc&&!t.proc.killed&&Q(t,!0)},2e3).unref();try{U(f,"\uB9C9\uD798",`${kt(t.cmd)} \uC0C1\uD55C\uC5D0\uC11C \uB04A\uAE40`,`${r} \xB7 ${Math.round(e)}\uBD84 \xB7 ${(t.\uC313\uC778\uD1A0\uD070??0).toLocaleString()}\uD1A0\uD070 \xB7 ${t.\uC313\uC778\uD134??0}\uD134`)}catch{}}}function In(t){let e={id:++Re,cmd:t,out:"",done:!1,ok:!1,started:Date.now()};V.push(e);try{e.\uB300\uC7A5\uBC88\uD638=fe(f,kt(t))}catch{}let r=setInterval(()=>{if(e.done){clearInterval(r);return}Pe(e)},3e4);r.unref();let n=e.proc=Le(`claude -p --output-format stream-json --verbose --permission-mode acceptEdits --setting-sources project --strict-mcp-config --no-chrome --max-turns ${vt.\uD134} --allowedTools "Bash Read Write Edit Glob Grep Task Agent"`,{cwd:f,shell:!0,stdio:["pipe","pipe","pipe"],env:{...process.env,AW_WORK_DIR:l(f,"20_\uC644\uC131\uAE00")},detached:process.platform!=="win32"});n.stdin?.write(t),n.stdin?.end();let s="",d="";return n.stdout.on("data",p=>{d+=p,s+=p;let a=s.split(`
`);s=a.pop()??"";for(let o of a)Te(e,o)}),n.stderr.on("data",p=>e.out+=Ee(String(p))),n.on("error",p=>{e.out+=/ENOENT/.test(p.message)?`

Claude Code\uB97C \uBABB \uCC3E\uC558\uC5B4\uC694.
\uC624\uB298 \uD560 \uC77C \uD654\uBA74 \uB9E8 \uC704 '\uC900\uBE44 \uD655\uC778'\uC5D0\uC11C \uC124\uCE58\uD558\uC2E4 \uC218 \uC788\uC5B4\uC694.`:`

\uC548 \uB410\uC5B4\uC694: ${p.message}`,e.done=!0}),n.on("close",p=>{s.trim()&&Te(e,s),!e.out.trim()&&d.trim()&&(e.out=Ee(d)),e.done=!0,e.ok=p===0;try{e.\uB300\uC7A5\uBC88\uD638&&be(f,e.\uB300\uC7A5\uBC88\uD638,{\uC0C1\uD0DC:e.ok?"\uB05D\uB0A8":"\uC2E4\uD328",\uB05D:Date.now(),\uAE30\uB85D:e.out.slice(-4e3)}),Rt(f,"\uAE00\uC4F0\uAE30"),e.ok||U(f,"\uC624\uB958",`${kt(e.cmd)} \uC2E4\uD328`,`\uAC78\uB9B0\uC2DC\uAC04 ${Math.round((Date.now()-e.started)/1e3)}\uCD08
`+e.out.slice(-900))}catch{}Rn(e)}),e}async function Rn(t){if(t.\uAC12)try{let e=l(f,"20_\uC644\uC131\uAE00");await $(e,{recursive:!0});let r=JSON.stringify({\uB0A0\uC9DC:P(),\uBA85\uB839:kt(t.cmd),\uB410\uB098:t.ok,...t.\uAC12});await Tn(l(e,"_\uC2E4\uD589\uAE30\uB85D.jsonl"),r+`
`,"utf8"),t.\uB300\uC7A5\uBC88\uD638&&ge(f,t.\uB300\uC7A5\uBC88\uD638,{\uB0A0\uC9DC:P(),\uB410\uB098:t.ok,...t.\uAC12}),t.\uB300\uC7A5\uBC88\uD638&&t.\uB2E8\uACC4\uBCC4&&me(f,t.\uB300\uC7A5\uBC88\uD638,t.\uB2E8\uACC4\uBCC4)}catch{}}function kt(t){let e=t.match(/\/[가-힣A-Za-z]+/);return e?e[0]:t.split(`
`)[0].slice(0,40)}function Ae(t){let e=t.match(St);return e?e[0].trim():""}function Pn(t,e=""){let r=(t.match(/^#\s+(.+)$/m)??[])[1]?.trim()??"";if(/제목\s*후보/.test(r)){let n=(t.match(/^\s*1[.)]\s+(.+)$/m)??[])[1]?.trim();if(n)return n.replace(/\s*[—-]\s*$/,"")}return r||e}async function An(){let t=l(f,"20_\uC644\uC131\uAE00");if(!await G(t))return[];let e=(await it(t,{withFileTypes:!0})).filter(n=>n.isDirectory()).map(n=>n.name).sort().reverse().filter(n=>y(l(t,n,"\uCD5C\uC885.md"))),r=S(await k(l(t,"_\uBC1C\uD589\uB300\uC7A5.json")),{posts:[]});return Promise.all(e.map(async n=>{let s=await k(l(t,n,"\uCD5C\uC885.md")),d=tt(r.posts,n,s);return{name:n,title:Pn(s,n),\uBBF8\uB9AC:et(s).slice(0,160),\uAE00\uC790\uC218:et(s).length,tags:Ae(s),hasHtml:await G(l(t,n,"\uCD5C\uC885.html")),edited:await G(l(t,n,"\uD3B8\uC9D1\uBCF8.md"))||await G(l(t,n,".\uB300\uCDA9\uD53C\uB4DC\uBC31")),cases:d?.cases??[],template:d?.template??"",axes:d?.axes??{},views:d?.stat?.views??0,date:d?.date??n.slice(0,10)}}))}var ot=2700*1e3;async function Z(t){try{return(await Oe(t)).mtimeMs}catch{return 0}}async function W(t,e,r){return Promise.all((await L(t,r)).map(async n=>({name:n,path:`${e}/${n}`,fresh:Date.now()-await Z(l(t,n))<ot})))}async function Cn(){let t=n=>l(f,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC",n),e=await L(l(f,"10_\uD559\uC6D0\uC704\uD0A4","\uC0AC\uB840"),".md");return{cases:await Promise.all(e.map(async n=>{let s=l(f,"10_\uD559\uC6D0\uC704\uD0A4","\uC0AC\uB840",n),d=await k(s);return{name:n.replace(/\.md$/,""),path:`10_\uD559\uC6D0\uC704\uD0A4/\uC0AC\uB840/${n}`,fresh:Date.now()-await Z(s)<ot,first:(d.split(`
`).filter(p=>p.trim().startsWith("-"))[0]??"").replace(/^-\s*/,"").slice(0,80),quotes:(d.match(/"[^"]{3,}"/g)??[]).length}})),basics:await W(t("01_\uAE30\uCD08\uC815\uBCF4"),"00_\uB0B4\uD559\uC6D0\uC790\uB8CC/01_\uAE30\uCD08\uC815\uBCF4"),raw:await W(t("02_\uC0AC\uB840\uC640\uC18C\uC2DD"),"00_\uB0B4\uD559\uC6D0\uC790\uB8CC/02_\uC0AC\uB840\uC640\uC18C\uC2DD"),style:await W(t("03_\uB0B4\uAC00\uC4F4\uAE00_\uB300\uD654"),"00_\uB0B4\uD559\uC6D0\uC790\uB8CC/03_\uB0B4\uAC00\uC4F4\uAE00_\uB300\uD654"),scraps:await W(t("05_\uC2A4\uD06C\uB7A9\uC18C\uC7AC"),"00_\uB0B4\uD559\uC6D0\uC790\uB8CC/05_\uC2A4\uD06C\uB7A9\uC18C\uC7AC"),knowledge:await W(t("07_\uCC38\uACE0\uC9C0\uC2DD"),"00_\uB0B4\uD559\uC6D0\uC790\uB8CC/07_\uCC38\uACE0\uC9C0\uC2DD"),inbox:(await W(l(f,"_\uC5EC\uAE30\uC5D0_\uB123\uC73C\uC138\uC694"),"_\uC5EC\uAE30\uC5D0_\uB123\uC73C\uC138\uC694")).filter(n=>wt(n.name)),tone:await G(l(f,"10_\uD559\uC6D0\uC704\uD0A4","\uD1A4\uAC00\uC774\uB4DC.md"))?{name:"\uD1A4\uAC00\uC774\uB4DC.md",path:"10_\uD559\uC6D0\uC704\uD0A4/\uD1A4\uAC00\uC774\uB4DC.md",fresh:Date.now()-await Z(l(f,"10_\uD559\uC6D0\uC704\uD0A4","\uD1A4\uAC00\uC774\uB4DC.md"))<ot}:null}}async function Ft(){let t=l(f,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC","01_\uAE30\uCD08\uC815\uBCF4");for(let e of await L(t,".md")){let r=await k(l(t,e)),n=r.match(/학원\s*명?\s*[:：]\s*(.+)/)??r.match(/^#[ \t]+([^#\n].*)$/m);if(n)return n[1].trim().replace(/\s*[-–—].*$/,"")}return""}function Jt(t){return String(t??"").replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,200)}var Ce=()=>l(f,".\uC5F0\uACB0\uC124\uC815.json");async function D(){return S(await k(Ce()),{})}async function Y(t){await T(Ce(),JSON.stringify(t,null,2),"utf8")}function jn(t){let e=r=>r&&r.length>6?"\u2026"+r.slice(-4):"";return{\uB178\uC158:{\uC5F0\uACB0:!!(t.\uB178\uC158?.\uD1A0\uD070&&t.\uB178\uC158?.DB\uC8FC\uC18C),\uB05D\uC790\uB9AC:e(t.\uB178\uC158?.\uD1A0\uD070),DB:t.\uB178\uC158?.DB\uC8FC\uC18C?"\uC124\uC815\uB428":""},\uD154\uB808\uADF8\uB7A8:{\uC5F0\uACB0:!!(t.\uD154\uB808\uADF8\uB7A8?.\uBD07\uD1A0\uD070&&t.\uD154\uB808\uADF8\uB7A8?.\uB0B4chat_id),\uBD07\uC788\uC74C:!!t.\uD154\uB808\uADF8\uB7A8?.\uBD07\uD1A0\uD070,\uB05D\uC790\uB9AC:e(t.\uD154\uB808\uADF8\uB7A8?.\uBD07\uD1A0\uD070)}}}var Dn=0;function bt(){let t=new Date,e=(r,n=2)=>String(r).padStart(n,"0");return`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())}_${e(t.getHours())}${e(t.getMinutes())}${e(t.getSeconds())}${e(++Dn%100)}`}async function _e(t,e="\uC9C1\uC811",r=""){let n=Jt(t);if(!n)return!1;let s=l(f,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC","06_\uAE00\uAC10\uCC3D\uACE0","_\uBAA9\uB85D.json");await $(at(s),{recursive:!0});let d=S(await k(s),{items:[]});return(d.items??[]).some(p=>p.topic===n)?!1:(d.items.unshift({date:P(),topic:n,why:r,angle:"",sources:[],used:!1,from:e}),await T(s,JSON.stringify(d,null,2),"utf8"),!0)}var zn=/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i;function je(t){let e=String(t??"").trim();return!e||e.length>120||/[\\/\0]/.test(e)||e==="."||e===".."||e.startsWith(".")||/^[a-zA-Z]:/.test(e)||zn.test(e)||/[\x00-\x1f]/.test(e)?null:e}function ht(t,e){let r=je(e);if(!r)return null;let n=l(t,r);try{let s=y(n)?yt(n):n,d=y(t)?yt(t):t;if(s!==d&&!s.startsWith(d+mt))return null}catch{return null}return n}async function Me(t,e,r){let n=l(f,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC",t);await $(n,{recursive:!0}),await T(l(n,e),r,"utf8")}async function De(){let t=l(f,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC","06_\uAE00\uAC10\uCC3D\uACE0","_\uBAA9\uB85D.json");try{return(S(await k(t),{items:[]}).items??[]).map(r=>({...r,topic:Jt(r.topic),from:r.from??"\uCC3E\uC544\uC634"})).filter(r=>r.topic).reverse()}catch{return[]}}async function Bn(){let t=l(f,".claude"),e=async(i,c=".md")=>(await L(l(t,i),c)).length,r=await L(l(t,"agents"),".md"),n=[];for(let i of r){let c=await k(l(t,"agents",i));/^---\n[\s\S]{0,400}?\n---\n/.test(c)||n.push(i.replace(/\.md$/,""))}let s=await e("\uC9C0\uC2DD\uCE35")+await e("\uC9C0\uC2DD\uCE35/\uC9C0\uC2DD\uD329"),d=await e("commands"),p=S(await k(l(t,"\uBB34\uACB0\uC131.json")),null),a=[];if(p?.\uD30C\uC77C)for(let i of p.\uD30C\uC77C){let c=l(f,i);(!y(c)||gt(c).size===0)&&a.push(i)}return{\uC628\uC804:p?.\uD30C\uC77C?a.length===0&&n.length===0:n.length===0,\uB2F4\uB2F9:r.length,\uBA85\uB839:d,\uC9C0\uC2DD:s,\uC548\uB2EB\uD798:n,\uBE60\uC9C4\uAC83:a,\uBAA9\uB85D\uC788\uC74C:!!p?.\uD30C\uC77C}}async function Fn(){let t=await L(l(f,"10_\uD559\uC6D0\uC704\uD0A4","\uC0AC\uB840"),".md"),e=S(await k(l(f,"20_\uC644\uC131\uAE00","_\uBC1C\uD589\uB300\uC7A5.json")),{posts:[],editRates:[]}),r=S(await k(l(f,"10_\uD559\uC6D0\uC704\uD0A4","\uD45C\uD604\uC0AC\uC804.json")),{phrases:[]}),n=new Map,s=new Map;(e.posts??[]).forEach((a,o)=>{for(let i of a.cases??[])n.set(i,(n.get(i)??0)+1),s.set(i,o)});let d=(e.posts??[]).length,p=a=>a.score>=2?"\uC2DC\uADF8\uB2C8\uCC98":a.score<=-2?"\uD074\uB9AC\uC170":"\uBBF8\uD310\uC815";return{name:await Ft(),ready:(await L(l(f,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC","01_\uAE30\uCD08\uC815\uBCF4"))).length>0,cases:t.map(a=>{let o=a.replace(/\.md$/,""),i=s.get(o);return{name:o,used:n.get(o)??0,\uC804:i==null?null:d-1-i}}),posts:(e.posts??[]).length,editRates:e.editRates??[],signature:(r.phrases??[]).filter(a=>p(a)==="\uC2DC\uADF8\uB2C8\uCC98").map(a=>a.phrase),cliche:(r.phrases??[]).filter(a=>p(a)==="\uD074\uB9AC\uC170").map(a=>a.phrase),inbox:(await L(l(f,"_\uC5EC\uAE30\uC5D0_\uB123\uC73C\uC138\uC694"))).filter(wt).length,setup:{basics:(await L(l(f,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC","01_\uAE30\uCD08\uC815\uBCF4"),".md")).length>0,material:(await L(l(f,"_\uC5EC\uAE30\uC5D0_\uB123\uC73C\uC138\uC694"))).filter(wt).length>0||(await L(l(f,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC","02_\uC0AC\uB840\uC640\uC18C\uC2DD"),".md")).length>0||(await L(l(f,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC","03_\uB0B4\uAC00\uC4F4\uAE00_\uB300\uD654"))).length>0,wiki:t.length>0,wrote:(e.posts??[]).length>0},topics:(await De()).filter(a=>!a.used).length,fresh:(await Promise.all(t.map(a=>Z(l(f,"10_\uD559\uC6D0\uC704\uD0A4","\uC0AC\uB840",a))))).filter(a=>Date.now()-a<ot).length,unfinished:await Jn(),\uC54C\uB9B4\uAC83:(()=>{try{let o=Pt(f,200).filter(i=>i.\uAC08\uB798==="\uC624\uB958"||i.\uAC08\uB798==="\uB9C9\uD798");return o.length<2?null:{\uC218:o.length,\uCD5C\uADFC:String(o[0]?.\uBB34\uC5C7??"")}}catch{return null}})(),\uC790\uB8CC\uAC74\uAC15:await le(f).catch(()=>[]),\uB04A\uAE34\uC77C:(()=>{try{return N(f).prepare("SELECT id, \uBA85\uB839, \uC2DC\uC791 FROM \uC791\uC5C5 WHERE \uC0C1\uD0DC = '\uB04A\uAE40' ORDER BY \uC2DC\uC791 DESC LIMIT 1").get()??null}catch{return null}})(),\uC7AC\uD559\uC2B5:await Un(e),\uCF1C\uC9C4\uAE30\uB2A5:await Ie(),\uC6B0\uCE21\uCC3D:!!process.env.AW_NO_OPEN}}async function Un(t){let e=l(f,"10_\uD559\uC6D0\uC704\uD0A4","\uD1A4\uAC00\uC774\uB4DC.md");if(!y(e))return null;let r=await Z(e),n=Math.floor((Date.now()-r)/864e5),s=(t.posts??[]).filter(u=>{if(u.rough==null&&u.editRate==null)return!1;let b=u.editedAt??u.date;return b?new Date(b).getTime()>r:!1}).length,d=(t.posts??[]).filter(u=>u.date&&new Date(u.date).getTime()>r).length,p=t.editRates??[],a=u=>u.length?u.reduce((b,g)=>b+g,0)/u.length:0,o=p.length>=4&&a(p.slice(-2))>a(p.slice(0,2))+5,i=p.length>=6&&a(p.slice(-3))>20&&a(p.slice(-3))>a(p.slice(0,3))-5,c=o?"\uD3B8\uC9D1\uB960\uC774 \uC624\uB974\uACE0 \uC788\uC5B4\uC694":i?`${p.length}\uD3B8\uC9F8 \uACE0\uCE58\uC2DC\uB294 \uC591\uC774 \uC548 \uC904\uACE0 \uC788\uC5B4\uC694`:d>=5?`\uBC30\uC6B4 \uB4A4\uB85C \uAE00\uC744 ${d}\uD3B8 \uC4F0\uC168\uC5B4\uC694`:n>=30?`\uB9D0\uD22C\uB97C \uBC30\uC6B4 \uC9C0 ${Math.floor(n/30)}\uB2EC \uB410\uC5B4\uC694`:"";return c?{\uC774\uC720:c,\uC9C0\uB09C\uB0A0:n,\uC0C8\uAE00:d,\uC0C8\uD53C\uB4DC\uBC31:s,\uAE09\uD568:o||i,\uBABB\uBC30\uC6C0:i}:null}async function Jn(){let t=[["1_\uAE30\uD68D.json","\uC8FC\uC81C \uC815\uD558\uAE30"],["2_\uBAA9\uCC28.md","\uAE00 \uC21C\uC11C \uC7A1\uAE30"],["3_\uC870\uC0AC.md","\uD544\uC694\uD55C \uB0B4\uC6A9 \uCC3E\uAE30"],["4_\uCD08\uC548.md","\uCD08\uC548 \uC4F0\uAE30"],["5_\uC724\uBB38.md","\uB9D0\uD22C \uB2E4\uB4EC\uAE30"]],e=l(f,"20_\uC644\uC131\uAE00");if(!y(e))return null;let r=(await it(e,{withFileTypes:!0})).filter(i=>i.isDirectory()).map(i=>i.name),n=null;for(let i of r){let c=l(e,i,"\uC791\uC5C5");if(!y(c)||y(l(e,i,"\uCD5C\uC885.md")))continue;let u="",b=0,g=0;for(let[h,v]of t){let m=l(c,h);if(!y(m))break;u=v,g++,b=Math.max(b,await Z(m))}u&&(!n||b>n.at)&&(n={title:i.replace(/^\d{4}-\d{2}-\d{2}_/,"").replace(/_/g," "),step:u,ago:Hn(b),at:b,dir:i,done:g})}if(!n)return null;let s=l(e,n.dir,"\uC791\uC5C5"),d=async i=>{let c=await k(l(s,i)),u=c.indexOf("{"),b=c.lastIndexOf("}");if(u<0||b<u)return null;try{return JSON.parse(c.slice(u,b+1))}catch{return null}},p=await d("1_\uAE30\uD68D.json"),a=await d("2_\uBAA9\uCC28.md"),o=Math.round((Date.now()-n.at)/1e3);return{title:n.title,step:n.step,ago:n.ago,done:n.done,dir:n.dir,\uC9C0\uB09C\uCD08:o,\uB3C4\uB294\uC911:o<240,\uAE30\uD68D:p&&{\uC9C8\uBB38:p.\uC9C8\uBB38??"",\uAE00\uC720\uD615:p.\uAE00\uC720\uD615??"",\uB3C5\uC790\uC0C1\uD0DC:p.\uB3C5\uC790\uC0C1\uD0DC??"",\uC0AC\uB840:Array.isArray(p.\uCD94\uCC9C\uC0AC\uB840)?p.\uCD94\uCC9C\uC0AC\uB840:[],\uD559\uC0DD\uAD70:p.\uD559\uC0DD\uAD70??""},\uBAA9\uCC28:Array.isArray(a?.\uBAA9\uCC28)?a.\uBAA9\uCC28.map(i=>({\uC81C\uBAA9:String(i.\uC81C\uBAA9??""),\uADFC\uAC70:String(i.\uADFC\uAC70\uC0AC\uB840??"")})):null}}function Hn(t){let e=Math.floor((Date.now()-t)/864e5);return e<=0?"\uC624\uB298":e===1?"\uC5B4\uC81C":e<7?`${e}\uC77C \uC804`:e<30?`${Math.floor(e/7)}\uC8FC \uC804`:`${Math.floor(e/30)}\uB2EC \uC804`}var ze=[l(K,"checker.mjs"),l(K,"lib","checker.mjs"),l(K,"..","cli.ts")],xt=ze.find(t=>y(t));xt||(console.error("  \u26A0\uFE0F  \uAC80\uC218\uAE30\uB97C \uBABB \uCC3E\uC558\uC5B4\uC694. \uD53C\uB4DC\uBC31\xB7\uC81C\uC548\uC774 \uC548 \uB3CC\uC544\uC694."),console.error(`     \uCC3E\uC544\uBCF8 \uACF3: ${ze.join(" \xB7 ")}`));var zt=xt?`"${process.execPath}" --no-warnings${/\.ts$/.test(xt)?" --experimental-strip-types":""} "${xt}" --ws "${f}"`:"";function Wn(){return{ok:!1,out:"\uAC80\uC218\uAE30\uB97C \uBABB \uCC3E\uC558\uC5B4\uC694. \uD504\uB85C\uADF8\uB7A8\uC744 \uB2E4\uC2DC \uBC1B\uC544 \uC124\uCE58\uD574\uC8FC\uC138\uC694."}}function z(t){return!t.trim()||t.startsWith(" ")?Promise.resolve(Wn()):new Promise(e=>Ut(t,{cwd:f,maxBuffer:8<<20},(r,n,s)=>e({ok:!r,out:(n||"")+(s||"")})))}var Ne=kn(async(t,e)=>{let r=new URL(t.url??"/","http://x"),n=(a,o,i="application/json")=>(e.writeHead(a,{"content-type":i+"; charset=utf-8"}),e.end(o)),s=n,d=()=>{let a=t.headers.origin;if(!a)return!1;try{let o=new URL(a).hostname;return!(o==="localhost"||o==="127.0.0.1"||o==="[::1]"||o==="::1")}catch{return!0}};if(t.method!=="GET"&&t.method!=="HEAD"&&d())return s(403,JSON.stringify({error:"\uB2E4\uB978 \uACF3\uC5D0\uC11C \uC628 \uC694\uCCAD\uC774\uB77C \uB9C9\uC558\uC5B4\uC694"}));let p=()=>new Promise(a=>{let o="",i=!1;t.on("data",c=>{o+=c,o.length>4e7&&!i&&(i=!0,t.destroy(),a({tooBig:!0}))}),t.on("end",()=>{if(!i)try{a(JSON.parse(o))}catch{a({})}})});try{{let o=[["/api/notion","\uB178\uC158"],["/api/tg-","\uD154\uB808\uADF8\uB7A8"],["/api/image","\uB300\uD45C\uC774\uBBF8\uC9C0"],["/api/card","\uCE74\uB4DC\uB274\uC2A4"],["/api/insta","\uC778\uC2A4\uD0C0\uAE00"],["/api/shorts","\uC9E7\uC740\uC601\uC0C1"]].find(([i])=>r.pathname.startsWith(i));if(o&&!(await Ie())[o[1]])return s(404,JSON.stringify({error:"\uC544\uC9C1 \uC900\uBE44 \uC911\uC778 \uAE30\uB2A5\uC774\uC5D0\uC694"}))}switch(r.pathname){case"/":return s(200,Kt,"text/html");case"/api/state":return s(200,JSON.stringify(await Fn()));case"/api/posts":return s(200,JSON.stringify(await An()));case"/api/post":{let a=ht(l(f,"20_\uC644\uC131\uAE00"),r.searchParams.get("name"));if(!a||!y(a))return s(404,'{"error":"\uADF8 \uAE00\uC744 \uBABB \uCC3E\uC558\uC5B4\uC694"}');let o=await k(l(a,"\uCD5C\uC885.md"));return o?s(200,JSON.stringify({body:o,reader:et(o),plain:Et(o),tags:Ae(o)})):s(404,'{"error":"\uADF8 \uAE00\uC744 \uBABB \uCC3E\uC558\uC5B4\uC694"}')}case"/api/materials":return s(200,JSON.stringify(await Cn()));case"/api/topics":return s(200,JSON.stringify(await De()));case"/api/topic-used":{if(t.method!=="POST")break;let{topic:a}=await p(),o=l(f,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC","06_\uAE00\uAC10\uCC3D\uACE0","_\uBAA9\uB85D.json"),i=S(await k(o),{items:[]});for(let c of i.items??[])c.topic===a&&(c.used=!0);return await T(o,JSON.stringify(i,null,2),"utf8"),s(200,"{}")}case"/api/topic-add":{if(t.method!=="POST")break;let a=await p(),o=Jt(a.topic);return o?String(a.topic??"").trim().length>200?s(400,'{"error":"\uC8FC\uC81C\uAC00 \uB108\uBB34 \uAE38\uC5B4\uC694. \uD55C \uC904\uB85C \uC904\uC5EC\uC8FC\uC138\uC694"}'):await _e(o,"\uC9C1\uC811",String(a.why??"").trim())?s(200,JSON.stringify({added:!0})):s(409,'{"error":"\uC774\uBBF8 \uCC3D\uACE0\uC5D0 \uC788\uB294 \uAE00\uAC10\uC774\uC5D0\uC694"}'):s(400,'{"error":"\uC4F0\uACE0 \uC2F6\uC740 \uC8FC\uC81C\uB97C \uC801\uC5B4\uC8FC\uC138\uC694"}')}case"/api/topic-remove":{if(t.method!=="POST")break;let{topic:a}=await p(),o=l(f,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC","06_\uAE00\uAC10\uCC3D\uACE0","_\uBAA9\uB85D.json"),i=S(await k(o),{items:[]});return i.items=(i.items??[]).filter(c=>c.topic!==a),await T(o,JSON.stringify(i,null,2),"utf8"),s(200,"{}")}case"/api/stats":{if(t.method!=="POST")break;let{pasted:a}=await p();if(!String(a??"").trim())return s(400,'{"error":"\uBD99\uC5EC\uB123\uC740 \uB0B4\uC6A9\uC774 \uBE44\uC5B4 \uC788\uC5B4\uC694"}');let o=l(f,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC","04_\uB124\uC774\uBC84\uD1B5\uACC4");await $(o,{recursive:!0});let i=l(o,`${P()}.txt`);await T(i,String(a),"utf8");let c=await z(`${zt} stats "${i}"`);return s(200,JSON.stringify({out:c.out,ok:c.ok}))}case"/api/lock":{let a=l(f,".\uC0AC\uC6A9\uC911.json"),o=En(),i=S(await k(a),null),c=i&&Date.now()-(i.at??0)<600*1e3;return await T(a,JSON.stringify({host:o,at:Date.now()}),"utf8"),s(200,JSON.stringify({conflict:!!(c&&i.host&&i.host!==o),other:c?i.host:""}))}case"/api/intake":{let a=v=>l(f,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC",v),o=ot,i=[{id:"\uC0AC\uB840",label:"\uC0AC\uB840",hint:"\uAE00\uC758 \uADFC\uAC70\uAC00 \uB3FC\uC694",dir:l(f,"10_\uD559\uC6D0\uC704\uD0A4","\uC0AC\uB840")},{id:"\uAE30\uCD08\uC815\uBCF4",label:"\uD559\uC6D0 \uC815\uBCF4",hint:"\uD559\uC6D0\uC744 \uC124\uBA85\uD560 \uB54C \uC368\uC694",dir:a("01_\uAE30\uCD08\uC815\uBCF4")},{id:"\uC18C\uC2DD",label:"\uB123\uC5B4\uC8FC\uC2E0 \uC774\uC57C\uAE30",hint:"\uC0AC\uB840 \uC7AC\uB8CC\uC608\uC694",dir:a("02_\uC0AC\uB840\uC640\uC18C\uC2DD")},{id:"\uB9D0\uD22C",label:"\uB9D0\uD22C \uC790\uB8CC",hint:"\uC6D0\uC7A5\uB2D8 \uBB38\uCCB4\uB97C \uBC30\uC6CC\uC694",dir:a("03_\uB0B4\uAC00\uC4F4\uAE00_\uB300\uD654")},{id:"\uD1B5\uACC4",label:"\uB124\uC774\uBC84 \uD1B5\uACC4",hint:"\uC5B4\uB5A4 \uAE00\uC774 \uC77D\uD614\uB294\uC9C0",dir:a("04_\uB124\uC774\uBC84\uD1B5\uACC4")},{id:"\uC2A4\uD06C\uB7A9",label:"\uC2A4\uD06C\uB7A9",hint:"\uAE00\uAC10 \uC7AC\uB8CC\uC608\uC694",dir:a("05_\uC2A4\uD06C\uB7A9\uC18C\uC7AC")},{id:"\uCC38\uACE0\uC9C0\uC2DD",label:"\uCC38\uACE0\uC9C0\uC2DD",hint:"\uC124\uBA85 \uBC29\uC2DD\uC5D0\uB9CC \uC368\uC694",dir:a("07_\uCC38\uACE0\uC9C0\uC2DD")}],c=[];for(let v of i){let x=(await W(v.dir,v.id)).filter(_=>_.fresh);x.length&&c.push({...v,count:x.length,files:x.map(_=>_.name),paths:x.map(_=>_.path)})}let u=l(f,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC","06_\uAE00\uAC10\uCC3D\uACE0","_\uBAA9\uB85D.json"),g=(S(await k(u),{items:[]}).items??[]).filter(v=>v.date===P()&&!v.used);g.length&&c.push({id:"\uAE00\uAC10",label:"\uAE00\uAC10",hint:"\uC4F8 \uAC70\uB9AC\uB85C \uC313\uC600\uC5B4\uC694",dir:"",count:g.length,files:g.map(v=>v.topic)});let h=(await L(l(f,"_\uC5EC\uAE30\uC5D0_\uB123\uC73C\uC138\uC694"))).filter(wt);return s(200,JSON.stringify({buckets:c,left:h,since:Math.round(o/6e4)}))}case"/api/links":return s(200,JSON.stringify(jn(await D())));case"/api/notion-dbs":{if(t.method!=="POST")break;let a=await p(),o=await Qt(String(a.\uD1A0\uD070??"").trim());return o.ok?s(200,JSON.stringify({dbs:o.dbs})):s(400,JSON.stringify({error:o.error}))}case"/api/notion-save":{if(t.method!=="POST")break;let a=await p(),o={\uD1A0\uD070:String(a.\uD1A0\uD070??"").trim(),DB\uC8FC\uC18C:String(a.DB\uC8FC\uC18C??"").trim()},i=lt(o.\uD1A0\uD070);if(i)return s(400,JSON.stringify({error:i}));if(!ct(o.DB\uC8FC\uC18C))return s(400,JSON.stringify({error:"DB \uC8FC\uC18C\uB97C \uBABB \uC77D\uC5C8\uC5B4\uC694. \uB178\uC158 \uD398\uC774\uC9C0 \uC8FC\uC18C\uB97C \uD1B5\uC9F8\uB85C \uBCF5\uC0AC\uD574 \uB123\uC5B4\uC8FC\uC138\uC694"}));let c=await Mt(o);if(!c.ok)return s(400,JSON.stringify({error:c.error}));let u=await D();u.\uB178\uC158=o,await Y(u);let b=Object.keys(c.fields),g=["\uB0A0\uC9DC","\uD559\uC0DD\uAD70","\uAE00\uC720\uD615","\uB3C5\uC790\uC0C1\uD0DC","\uB300\uD45C\uC790\uC0B0","\uC0AC\uB840","\uC870\uD68C\uC218","\uD3B8\uC9D1\uB960"];return s(200,JSON.stringify({saved:!0,DB\uC774\uB984:c.title,\uCC44\uC6B8\uCE78:g.filter(h=>b.includes(h)),\uC5C6\uB294\uCE78:g.filter(h=>!b.includes(h)),\uC81C\uBAA9\uCE78:Object.entries(c.fields).find(([,h])=>h==="title")?.[0]??""}))}case"/api/tg-check":{if(t.method!=="POST")break;let a=await p(),o=String(a.\uBD07\uD1A0\uD070??"").trim(),i=await ee(o);if(!i.ok)return s(400,JSON.stringify({error:i.error}));let c=await D();return c.\uD154\uB808\uADF8\uB7A8={...c.\uD154\uB808\uADF8\uB7A8??{},\uBD07\uD1A0\uD070:o},await Y(c),s(200,JSON.stringify({\uBD07\uC774\uB984:i.name}))}case"/api/tg-pair":{if(t.method!=="POST")break;let a=await D();if(!a.\uD154\uB808\uADF8\uB7A8?.\uBD07\uD1A0\uD070)return s(400,JSON.stringify({error:"\uBA3C\uC800 \uBD07 \uC5F4\uC1E0\uB97C \uB123\uC5B4\uC8FC\uC138\uC694"}));let o=await se(a.\uD154\uB808\uADF8\uB7A8.\uBD07\uD1A0\uD070);return o.ok?(a.\uD154\uB808\uADF8\uB7A8.\uB0B4chat_id=o.chatId,a.\uD154\uB808\uADF8\uB7A8.\uB9C8\uC9C0\uB9C9=o.last,await Y(a),await Nt(a.\uD154\uB808\uADF8\uB7A8,o.chatId,"\uC5F0\uACB0\uB410\uC5B4\uC694. \uC774\uC81C \uC5EC\uAE30\uB85C \uBCF4\uB0B4\uC8FC\uC2DC\uBA74 \uAE00\uAC10 \uCC3D\uACE0\uC5D0 \uC313\uC544\uB458\uAC8C\uC694."),s(200,JSON.stringify({\uB204\uAD6C:o.from??""}))):s(400,JSON.stringify({error:o.error}))}case"/api/tg-off":{if(t.method!=="POST")break;let a=await D();return delete a.\uD154\uB808\uADF8\uB7A8,await Y(a),s(200,"{}")}case"/api/tg-fetch":{if(t.method!=="POST")break;let a=await D();if(!a.\uD154\uB808\uADF8\uB7A8?.\uBD07\uD1A0\uD070||!a.\uD154\uB808\uADF8\uB7A8?.\uB0B4chat_id)return s(400,JSON.stringify({error:"\uBA3C\uC800 \uC124\uC815\uC5D0\uC11C \uD154\uB808\uADF8\uB7A8\uC744 \uC5F0\uACB0\uD574\uC8FC\uC138\uC694"}));let o=await re(a.\uD154\uB808\uADF8\uB7A8);if(!o.ok)return s(400,JSON.stringify({error:o.error}));let i={\uAE00\uAC10:0,\uC790\uB8CC:0,\uC2A4\uD06C\uB7A9:0,\uC0AC\uC9C4:0,\uC74C\uC131:0};for(let u of o.items)try{if(u.kind==="\uAE00\uAC10"&&u.text)await _e(u.text,"\uC9C1\uC811"),i.\uAE00\uAC10++;else if(u.kind==="\uB9C1\uD06C"&&u.text)await Me("05_\uC2A4\uD06C\uB7A9\uC18C\uC7AC",`\uB9C1\uD06C_${bt()}.md`,u.text),i.\uC2A4\uD06C\uB7A9++;else if(u.kind==="\uAE34\uAE00"&&u.text)await Me("02_\uC0AC\uB840\uC640\uC18C\uC2DD",`\uC190\uC804\uD654_${bt()}.md`,u.text),i.\uC790\uB8CC++;else if(u.kind==="\uC0AC\uC9C4"&&u.fileId){let b=await ae(a.\uD154\uB808\uADF8\uB7A8.\uBD07\uD1A0\uD070,u.fileId);if(b.ok){let g=u.fileName||b.name;await $(l(f,"_\uC5EC\uAE30\uC5D0_\uB123\uC73C\uC138\uC694"),{recursive:!0});let h=je(`${bt()}_${g}`)??`${bt()}_\uBC1B\uC740\uD30C\uC77C`;await T(l(f,"_\uC5EC\uAE30\uC5D0_\uB123\uC73C\uC138\uC694",h),b.buf),i.\uC0AC\uC9C4++}}else u.kind==="\uC74C\uC131"&&i.\uC74C\uC131++}catch{}a.\uD154\uB808\uADF8\uB7A8.\uB9C8\uC9C0\uB9C9=o.last,await Y(a);let c=Object.entries(i).filter(([,u])=>u>0);return c.length&&await Nt(a.\uD154\uB808\uADF8\uB7A8,a.\uD154\uB808\uADF8\uB7A8.\uB0B4chat_id,"\uBC1B\uC558\uC5B4\uC694 \u2014 "+c.map(([u,b])=>`${u} ${b}\uAC1C`).join(", ")+(i.\uC74C\uC131?`
(\uC74C\uC131\uC740 \uC544\uC9C1 \uBABB \uC54C\uC544\uB4E4\uC5B4\uC694. \uAE00\uB85C \uBCF4\uB0B4\uC8FC\uC2DC\uBA74 \uB3FC\uC694)`:"")),s(200,JSON.stringify({...i,\uB0A8\uC758\uAC83:o.strangers.length}))}case"/api/phrase-set":{if(t.method!=="POST")break;let a=await p(),o=String(a.\uD45C\uD604??"").trim().slice(0,200),i=String(a.\uC5B4\uB514??"");if(!o)return s(400,'{"error":"\uD45C\uD604\uC744 \uC801\uC5B4\uC8FC\uC138\uC694"}');if(!["\uC2DC\uADF8\uB2C8\uCC98","\uD074\uB9AC\uC170","\uC9C0\uC6C0"].includes(i))return s(400,'{"error":"\uC5B4\uB514\uC5D0 \uB123\uC744\uC9C0 \uC54C \uC218 \uC5C6\uC5B4\uC694"}');let c=l(f,"10_\uD559\uC6D0\uC704\uD0A4","\uD45C\uD604\uC0AC\uC804.json"),u=S(await k(c),{phrases:[]});return i==="\uC9C0\uC6C0"?u.phrases=(u.phrases??[]).filter(b=>b.phrase!==o):Yt(u,o,i),await $(at(c),{recursive:!0}),await T(c,JSON.stringify(u,null,2),"utf8"),s(200,JSON.stringify({\uD45C\uD604:o,\uC5B4\uB514:i}))}case"/api/notion-off":{if(t.method!=="POST")break;let a=await D();return delete a.\uB178\uC158,await Y(a),s(200,"{}")}case"/api/notion-push":{if(t.method!=="POST")break;let{dir:a}=await p(),o=await D();if(!o.\uB178\uC158?.\uD1A0\uD070)return s(400,JSON.stringify({error:"\uBA3C\uC800 \uC124\uC815\uC5D0\uC11C \uB178\uC158\uC744 \uC5F0\uACB0\uD574\uC8FC\uC138\uC694"}));let i=ht(l(f,"20_\uC644\uC131\uAE00"),a);if(!i||!y(i))return s(404,JSON.stringify({error:"\uADF8 \uAE00\uC744 \uBABB \uCC3E\uC558\uC5B4\uC694"}));let c=l(i,"\uD3B8\uC9D1\uBCF8.md"),u=l(i,"\uCD5C\uC885.md"),b=y(c)?c:u;if(!y(b))return s(404,JSON.stringify({error:"\uAE00 \uD30C\uC77C\uC774 \uC5C6\uC5B4\uC694"}));let g=S(await k(l(f,"20_\uC644\uC131\uAE00","_\uBC1C\uD589\uB300\uC7A5.json")),{posts:[]}),h=tt(g.posts,String(a)),v=await B(b,"utf8"),m=await Zt(o.\uB178\uC158,{\uC81C\uBAA9:h?.title??String(a),\uB0A0\uC9DC:h?.date??P(),\uD559\uC0DD\uAD70:h?.cohort,\uAE00\uC720\uD615:h?.template,\uB3C5\uC790\uC0C1\uD0DC:h?.reader,\uB300\uD45C\uC790\uC0B0:h?.asset,\uC0AC\uB840:h?.cases,\uC870\uD68C\uC218:h?.stat?.views},Et(v));return m.ok?(h&&(h.notion={pageId:m.pageId,url:m.url,at:P()},await T(l(f,"20_\uC644\uC131\uAE00","_\uBC1C\uD589\uB300\uC7A5.json"),JSON.stringify(g,null,2),"utf8")),s(200,JSON.stringify({url:m.url,missing:m.missing,\uBCF4\uB0B8\uAC83:st(b)}))):s(502,JSON.stringify({error:m.error}))}case"/api/taxonomy":{let a=S(await k(l(f,"20_\uC644\uC131\uAE00","_\uBC1C\uD589\uB300\uC7A5.json")),{posts:[]}),o={asset:new Set,reader:new Set,template:new Set};for(let i of a.posts??[])i.asset&&o.asset.add(i.asset),i.reader&&o.reader.add(i.reader),i.template&&o.template.add(i.template);return s(200,JSON.stringify({templates:Gt.map(i=>({...i,done:o.template.has(i.id)})),readers:Vt.map(i=>({...i,done:o.reader.has(i.id)})),assets:qt.map(i=>({...i,done:o.asset.has(i.id)}))}))}case"/api/version":return s(200,JSON.stringify(S(await k(l(K,"..","..","\uBC84\uC804.json")),{\uBC84\uC804:"?",\uBCC0\uACBD:[]})));case"/api/export":{if(t.method!=="POST")break;let a=P(),o=(await Ft()).replace(/[^가-힣A-Za-z0-9 _-]/g,"").trim()||"\uB0B4\uD559\uC6D0",i=l(f,`${o}_\uC790\uB8CC_${a}.zip`);try{ve(f)}catch{}let c=["00_\uB0B4\uD559\uC6D0\uC790\uB8CC","10_\uD559\uC6D0\uC704\uD0A4","20_\uC644\uC131\uAE00","_\uC5EC\uAE30\uC5D0_\uB123\uC73C\uC138\uC694","data"].filter(u=>y(l(f,u)));if(!c.length)return s(400,'{"error":"\uC544\uC9C1 \uB0B4\uBCF4\uB0BC \uC790\uB8CC\uAC00 \uC5C6\uC5B4\uC694"}');y(i)&&await M(i,{force:!0});try{await T(i,oe({\uBFCC\uB9AC:f,\uD3F4\uB354\uB4E4:c}))}catch(u){return s(500,JSON.stringify({error:"\uBB36\uB294 \uB370 \uC2E4\uD328\uD588\uC5B4\uC694: "+u.message.slice(0,200)}))}return y(i)?s(200,JSON.stringify({file:st(i),size:Math.round(gt(i).size/1024),\uC8FC\uC758:""})):s(500,JSON.stringify({error:"\uBB36\uB294 \uB370 \uC2E4\uD328\uD588\uC5B4\uC694"}))}case"/api/import":{if(t.method!=="POST")break;{let x=jt(ft(f));if(x)return n(409,JSON.stringify({error:x}));try{ut(f,"\uB418\uC0B4\uB9AC\uAE30")}catch{}}let a=ke("\uB418\uC0B4\uB9AC\uAE30",n),o=await p();if(o.tooBig)return a(413,'{"error":"\uD30C\uC77C\uC774 \uB108\uBB34 \uCEE4\uC694"}');if(!o.data)return a(400,'{"error":"\uD30C\uC77C\uC744 \uC77D\uC9C0 \uBABB\uD588\uC5B4\uC694"}');let i=l(f,".\uB418\uC0B4\uB9AC\uAE30\uC784\uC2DC");await M(i,{recursive:!0,force:!0}),await $(i,{recursive:!0});let c=l(i,"pack.zip");await T(c,Buffer.from(String(o.data),"base64"));try{let x=Ot(await B(c));if(x.\uAC1C\uC218>2e4||x.\uBC14\uC774\uD2B8>2e9)return await M(i,{recursive:!0,force:!0}),a(400,'{"error":"\uD30C\uC77C\uC774 \uB108\uBB34 \uB9CE\uAC70\uB098 \uCEE4\uC694. \uC790\uB8CC \uD30C\uC77C\uC774 \uB9DE\uB294\uC9C0 \uD655\uC778\uD574\uC8FC\uC138\uC694"}');$t(await B(c),i)}catch{return await M(i,{recursive:!0,force:!0}),a(400,'{"error":"\uC555\uCD95\uC744 \uBABB \uD480\uC5C8\uC5B4\uC694. \uC790\uB8CC \uD30C\uC77C\uC774 \uB9DE\uB294\uC9C0 \uD655\uC778\uD574\uC8FC\uC138\uC694"}')}let u="";for(let x of[i,...(await it(i)).map(_=>l(i,_))])if(y(l(x,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC"))||y(l(x,"10_\uD559\uC6D0\uC704\uD0A4"))){u=x;break}if(!u)return await M(i,{recursive:!0,force:!0}),a(400,'{"error":"\uC790\uB8CC \uAFB8\uB7EC\uBBF8\uAC00 \uC544\uB2C8\uC5D0\uC694. \uB0B4\uBCF4\uB0B4\uAE30\uB85C \uB9CC\uB4E0 zip\uC744 \uB123\uC5B4\uC8FC\uC138\uC694"}');let b=["00_\uB0B4\uD559\uC6D0\uC790\uB8CC","10_\uD559\uC6D0\uC704\uD0A4","20_\uC644\uC131\uAE00","_\uC5EC\uAE30\uC5D0_\uB123\uC73C\uC138\uC694","data"].filter(x=>y(l(u,x)));if(b.includes("data"))try{we()}catch{}let g=l(f,".\uC774\uC804\uC790\uB8CC",String(Date.now())),h=[];for(let x of b)y(l(f,x))&&(await $(g,{recursive:!0}),await J(l(f,x),l(g,x)),h.push(x));let v="";for(let x of b)if(!(await Nn(l(u,x),l(f,x))).ok){v=x;break}let m=()=>{if(b.includes("data"))try{N(f)}catch{}};if(v){for(let x of h)await M(l(f,x),{recursive:!0,force:!0}),await J(l(g,x),l(f,x));return m(),await M(i,{recursive:!0,force:!0}),a(500,'{"error":"\uC62E\uAE30\uB2E4 \uC2E4\uD328\uD574\uC11C \uC6D0\uB798\uB300\uB85C \uB3CC\uB824\uB1A8\uC5B4\uC694. \uC790\uB8CC\uB294 \uADF8\uB300\uB85C \uC788\uC5B4\uC694"}')}return m(),await M(i,{recursive:!0,force:!0}),a(200,JSON.stringify({restored:!0,moved:h.length}))}case"/api/update":{if(t.method!=="POST")break;{let w=jt(ft(f));if(w)return n(409,JSON.stringify({error:w}));try{ut(f,"\uC5C5\uB370\uC774\uD2B8")}catch{}}let a=ke("\uC5C5\uB370\uC774\uD2B8",n),o=await p();if(o.tooBig)return a(413,'{"error":"\uD30C\uC77C\uC774 \uB108\uBB34 \uCEE4\uC694"}');if(!o.data)return a(400,'{"error":"\uD30C\uC77C\uC744 \uC77D\uC9C0 \uBABB\uD588\uC5B4\uC694"}');let i=H(K,"..",".."),c=l(i,".\uC5C5\uB370\uC774\uD2B8\uC784\uC2DC");await M(c,{recursive:!0,force:!0}),await $(c,{recursive:!0});let u=l(c,"pack.zip");await T(u,Buffer.from(String(o.data),"base64"));try{let w=Ot(await B(u));if(w.\uAC1C\uC218>2e4||w.\uBC14\uC774\uD2B8>2e9)return await M(c,{recursive:!0,force:!0}),a(400,'{"error":"\uBC1B\uC73C\uC2E0 \uD30C\uC77C\uC774 \uB108\uBB34 \uCEE4\uC694. \uC5C5\uB370\uC774\uD2B8 \uD30C\uC77C\uC774 \uB9DE\uB294\uC9C0 \uD655\uC778\uD574\uC8FC\uC138\uC694"}');$t(await B(u),c)}catch{return await M(c,{recursive:!0,force:!0}),a(400,'{"error":"\uC555\uCD95\uC744 \uBABB \uD480\uC5C8\uC5B4\uC694. \uBC1B\uC73C\uC2E0 \uD30C\uC77C\uC774 \uC628\uC804\uD55C\uC9C0 \uD655\uC778\uD574\uC8FC\uC138\uC694"}')}let b="";for(let w of[c,...(await it(c)).map(R=>l(c,R))])if(y(l(w,"\uC5C5\uB370\uC774\uD2B8.json"))){b=w;break}let g=b?S(await k(l(b,"\uC5C5\uB370\uC774\uD2B8.json")),null):null;if(!g?.\uBC84\uC804)return await M(c,{recursive:!0,force:!0}),a(400,'{"error":"\uC5C5\uB370\uC774\uD2B8 \uAFB8\uB7EC\uBBF8\uAC00 \uC544\uB2C8\uC5D0\uC694. \uC790\uB8CC \uD30C\uC77C\uC774\uBA74 \uC790\uB8CC \uB123\uAE30\uC5D0 \uB123\uC5B4\uC8FC\uC138\uC694"}');let h=S(await k(l(i,"\uBC84\uC804.json")),{\uBC84\uC804:"0"}),v=[".claude","bin","CLAUDE.md","\uC2DC\uC791\uD558\uAE30.md","\uBC84\uC804.json","\uAE30\uB2A5.json","BlogStudio.bat","BlogStudio.command"].filter(w=>y(l(b,w))&&w!=="data");if(!v.includes("\uBC84\uC804.json")||!v.includes(".claude"))return await M(c,{recursive:!0,force:!0}),a(400,JSON.stringify({error:"\uC5C5\uB370\uC774\uD2B8 \uAFB8\uB7EC\uBBF8\uAC00 \uC628\uC804\uD558\uC9C0 \uC54A\uC544\uC694. \uB2E4\uC2DC \uBC1B\uC544\uC8FC\uC138\uC694"}));let m="";{let w=S(await k(l(b,".claude","\uBB34\uACB0\uC131.json")),null);if(!w?.\uD30C\uC77C)m="\uBC1B\uC73C\uC2E0 \uD30C\uC77C\uC5D0 \uBAA9\uB85D\uC774 \uC5C6\uC5B4\uC694";else{let R=w.\uD30C\uC77C.filter(j=>{let F=l(b,j);return!y(F)||gt(F).size===0});if(R.length&&(m="\uBE60\uC9C4 \uD30C\uC77C "+R.length+"\uAC1C: "+R.slice(0,3).join(", ")),!m&&w.\uD574\uC2DC){let j=[];for(let[F,X]of Object.entries(w.\uD574\uC2DC)){let Wt=l(b,F);if(!y(Wt))continue;Sn("sha256").update(await B(Wt)).digest("hex").slice(0,32)!==X&&j.push(F)}j.length&&(m="\uB0B4\uC6A9\uC774 \uC5B4\uAE0B\uB09C \uD30C\uC77C "+j.length+"\uAC1C: "+j.slice(0,3).join(", "))}}}if(m)return await M(c,{recursive:!0,force:!0}),a(400,JSON.stringify({error:"\uBC1B\uC73C\uC2E0 \uD30C\uC77C\uC774 \uC628\uC804\uD558\uC9C0 \uC54A\uC544\uC11C \uADF8\uB300\uB85C \uB480\uC5B4\uC694. \uD504\uB85C\uADF8\uB7A8\uC740 \uC544\uBB34 \uAC83\uB3C4 \uC548 \uBC14\uB00C\uC5C8\uC5B4\uC694.",\uAE4C\uB2ED:m}));let x=l(i,".\uC774\uC804\uBC84\uC804",String(h.\uBC84\uC804??"0"));await M(x,{recursive:!0,force:!0}),await $(x,{recursive:!0});let _=[],q="";for(let w of v)try{y(l(i,w))&&await J(l(i,w),l(x,w)),await J(l(b,w),l(i,w)),_.push(w)}catch(R){q=`${w} (${R.message.slice(0,70)})`;break}if(q){for(let w of _)try{await M(l(i,w),{recursive:!0,force:!0}),y(l(x,w))&&await J(l(x,w),l(i,w))}catch{}return await M(c,{recursive:!0,force:!0}),a(500,JSON.stringify({error:"\uC5C5\uB370\uC774\uD2B8\uB97C \uD558\uB2E4 \uBA48\uCDB0\uC11C \uC6D0\uB798\uB300\uB85C \uB418\uB3CC\uB838\uC5B4\uC694. \uD504\uB85C\uADF8\uB7A8\uC740 \uADF8\uB300\uB85C \uC4F0\uC2E4 \uC218 \uC788\uC5B4\uC694.",\uAE4C\uB2ED:q}))}let O=_,E=0,Ht=l(b,"\uAE00\uAC10","_\uBAA9\uB85D.json");if(y(Ht)){let w=l(f,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC","06_\uAE00\uAC10\uCC3D\uACE0","_\uBAA9\uB85D.json");await $(at(w),{recursive:!0});let R=S(await k(w),{items:[]}),j=S(await k(Ht),{items:[]}),F=new Set((R.items??[]).map(X=>X.topic));for(let X of j.items??[])F.has(X.topic)||(R.items.push({...X,from:"\uD568\uAED8\uC634"}),E++);await T(w,JSON.stringify(R,null,2),"utf8")}return await M(c,{recursive:!0,force:!0}),process.platform!=="win32"&&await z(`chmod +x "${i}/bin/check" "${i}/bin/ui" 2>/dev/null || true`),a(200,JSON.stringify({from:h.\uBC84\uC804??"?",to:g.\uBC84\uC804,\uBCC0\uACBD:g.\uBCC0\uACBD??[],files:O,topics:E}))}case"/api/report":{if(t.method!=="POST")break;let{note:a}=await p(),o=S(await k(l(K,"..","..","\uBC84\uC804.json")),{\uBC84\uC804:"?"}),i=V.filter(v=>v.done&&!v.ok).slice(-1)[0],c=await Ft(),u="\uAE40|\uC774|\uBC15|\uCD5C|\uC815|\uAC15|\uC870|\uC724|\uC7A5|\uC784|\uD55C|\uC624|\uC11C|\uC2E0|\uAD8C|\uD669|\uC548|\uC1A1|\uB958|\uC720|\uC804|\uD64D|\uACE0|\uBB38|\uC591|\uC190|\uBC30|\uBC31|\uD5C8|\uB0A8|\uC2EC|\uB178|\uD558|\uACFD|\uC131|\uCC28|\uC8FC|\uC6B0|\uAD6C|\uBBFC|\uB098|\uC9C0|\uC5C4|\uCC44|\uC6D0|\uCC9C|\uBC29|\uACF5|\uD604|\uD568|\uBCC0|\uC5FC|\uC5EC|\uCD94|\uB3C4|\uC18C|\uC11D",b=v=>{let m=String(v??"");return c&&(m=m.split(c).join("\u25CB\u25CB\uD559\uC6D0")),m=m.replace(/01[016-9][-. ]?\d{3,4}[-. ]?\d{4}/g,"010-****-****"),m=m.replace(/\d{2,3}[-. ]\d{3,4}[-. ]\d{4}/g,"***-****-****"),m=m.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g,"\u25CB\u25CB\u25CB@\u25CB\u25CB\u25CB"),m=m.replace(/\d{6}[-\s]?[1-4]\d{6}/g,"******-*******"),m=m.replace(new RegExp("(?<![\uAC00-\uD7A3])(?:"+u+")[\uAC00-\uD7A3]{1,2}\\s*(?:\uD559\uC0DD|\uAD70|\uC591|\uC5B4\uBA38\uB2D8|\uC544\uBC84\uB2D8)","g"),"\u25CB\u25CB \uD559\uC0DD"),m=m.replace(/[가-힣]{2,6}(초등학교|중학교|고등학교)/g,"\u25CB\u25CB$1"),m},g=[`\uBC84\uC804: ${o.\uBC84\uC804}${o.\uBE4C\uB4DC?` (${o.\uBE4C\uB4DC})`:""}`,`\uCEF4\uD4E8\uD130: ${process.platform} \xB7 node ${process.versions.node}`,`\uC0AC\uB840 ${(await L(l(f,"10_\uD559\uC6D0\uC704\uD0A4","\uC0AC\uB840"),".md")).length}\uAC74`,"","[\uC6D0\uC7A5\uB2D8 \uB9D0\uC500]",b(String(a??"")).slice(0,1500)||"(\uC5C6\uC74C)","","[\uB9C8\uC9C0\uB9C9\uC73C\uB85C \uC548 \uB41C \uC77C]",i?`${b(i.cmd)}
${b(i.out).slice(-1500)}`:"(\uC5C6\uC74C)"],h=Pt(f);if(h.length){g.push("",`[\uADF8\uB3D9\uC548 \uC788\uC5C8\uB358 \uC77C ${h.length}\uAC74]`);for(let v of h.slice(0,40)){let m=new Date(Number(v.\uC5B8\uC81C)).toISOString().slice(0,16).replace("T"," ");g.push(`\xB7 ${m} [${v.\uAC08\uB798}] ${b(String(v.\uBB34\uC5C7))}`);let x=b(String(v.\uC790\uC138\uD788??"")).trim();x&&g.push(`    ${x.split(`
`).slice(0,4).join(" / ").slice(0,300)}`)}}return s(200,JSON.stringify({body:g.join(`
`),\uC18C\uC2DD\uC218:h.length,ids:h.map(v=>Number(v.id)),\uBCF4\uB0BC\uACF3:!!o.\uC624\uB958\uBCF4\uACE0}))}case"/api/report-send":{if(t.method!=="POST")break;return s(200,JSON.stringify({\uBCF4\uB0C4:!1,\uC548\uB0B4:"\uC9C0\uAE08 \uD310\uC5D0\uC11C\uB294 **\uC790\uB3D9\uC73C\uB85C \uBCF4\uB0B4\uC9C0 \uC54A\uC544\uC694.** \uC544\uB798 **[\uD30C\uC77C\uB85C \uBC1B\uAE30]** \uB97C \uB204\uB974\uC2DC\uACE0, \uADF8 \uD30C\uC77C\uC744 \uBA54\uC77C\uC774\uB098 \uCE74\uD1A1\uC73C\uB85C \uBCF4\uB0B4\uC8FC\uC138\uC694."}))}case"/api/env":{let a=await z(process.platform==="win32"?"claude --version":"claude --version 2>/dev/null"),o=await z("npm --version");return s(200,JSON.stringify({node:process.versions.node,nodeOk:Number(process.versions.node.split(".")[0])>=18,npm:o.ok?o.out.trim().split(`
`).pop():"",npmOk:o.ok,claude:a.ok?a.out.trim().split(`
`).pop():"",claudeOk:a.ok,os:process.platform==="win32"?"\uC708\uB3C4\uC6B0":process.platform==="darwin"?"\uB9E5":"\uB9AC\uB205\uC2A4",osKey:process.platform,\uC18D:await Bn()}))}case"/api/install":{if(t.method!=="POST")break;if(Ct())return s(409,'{"error":"\uBA3C\uC800 \uC2DC\uD0A8 \uC77C\uC774 \uC544\uC9C1 \uB05D\uB098\uC9C0 \uC54A\uC558\uC5B4\uC694"}');let a=Se("npm install -g @anthropic-ai/claude-code","Claude Code \uC124\uCE58\uD558\uB294 \uC911");return s(200,JSON.stringify({id:a.id}))}case"/api/probe":{if(t.method!=="POST")break;if(Ct())return s(409,'{"error":"\uBA3C\uC800 \uC2DC\uD0A8 \uC77C\uC774 \uC544\uC9C1 \uB05D\uB098\uC9C0 \uC54A\uC558\uC5B4\uC694"}');let a=Se('claude -p "1 \uB354\uD558\uAE30 1\uC740?"',"\uC5F0\uACB0 \uD655\uC778\uD558\uB294 \uC911");return s(200,JSON.stringify({id:a.id}))}case"/api/terminal":{if(t.method!=="POST")break;let a=f.replace(/"/g,'\\"');return await z(process.platform==="win32"?`start cmd /K "cd /d ${a}"`:process.platform==="darwin"?`open -a Terminal "${a}"`:`x-terminal-emulator --working-directory="${a}" || true`),s(200,"{}")}case"/api/propose":{let a=await z(`${zt} propose --json`);return s(200,a.out.trim().startsWith("[")?a.out:"[]")}case"/api/run":{if(t.method!=="POST")break;let{prompt:a}=await p();if(!a?.trim())return s(400,'{"error":"\uBA85\uB839\uC774 \uBE44\uC5C8\uC2B5\uB2C8\uB2E4"}');if(Ct())return s(409,'{"error":"\uBA3C\uC800 \uC2DC\uD0A8 \uC77C\uC774 \uC544\uC9C1 \uB05D\uB098\uC9C0 \uC54A\uC558\uC5B4\uC694. \uB05D\uB098\uBA74 \uB20C\uB7EC\uC8FC\uC138\uC694"}');let o=jt(ft(f));if(o)return s(409,JSON.stringify({error:o}));try{ut(f,"\uAE00\uC4F0\uAE30")}catch{}let i=In(a.trim());return s(200,JSON.stringify({id:i.id}))}case"/api/job":{let a=V.find(o=>o.id===Number(r.searchParams.get("id")));return a?s(200,JSON.stringify({out:a.out,done:a.done,ok:a.ok,secs:Math.round((Date.now()-a.started)/1e3)})):s(404,"{}")}case"/api/stop":{if(t.method!=="POST")break;let{id:a}=await p(),o=V.find(i=>i.id===Number(a));return!o||o.done?s(200,"{}"):(Q(o),setTimeout(()=>{o.proc&&!o.proc.killed&&Q(o,!0)},2e3).unref(),o.out+=`

\uC6D0\uC7A5\uB2D8\uC774 \uBA48\uCD94\uC168\uC5B4\uC694.`,o.done=!0,o.ok=!1,s(200,JSON.stringify({stopped:!0})))}case"/api/open":{if(t.method!=="POST")break;let{path:a}=await p(),o=H(f,String(a??""));if(o!==H(f)&&!o.startsWith(H(f)+mt))return s(403,"{}");if(!y(o))return s(404,'{"error":"\uC544\uC9C1 \uADF8 \uD30C\uC77C\uC774 \uC5C6\uC5B4\uC694"}');let i=o.replace(/"/g,'\\"');return await z(process.platform==="win32"?`start "" "${i}"`:process.platform==="darwin"?`open "${i}"`:`xdg-open "${i}"`),s(200,"{}")}case"/api/material":{if(t.method!=="POST")break;let{text:a}=await p();if(!a?.trim())return s(400,'{"error":"\uB0B4\uC6A9\uC774 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4"}');let o=l(f,"_\uC5EC\uAE30\uC5D0_\uB123\uC73C\uC138\uC694");await $(o,{recursive:!0});let i=P();return await T(l(o,`${i}_${Date.now()%1e5}.md`),a,"utf8"),s(200,JSON.stringify({saved:!0}))}case"/api/upload":{if(t.method!=="POST")break;let a=await p();if(a.tooBig)return s(413,'{"error":"\uD30C\uC77C\uC774 \uB108\uBB34 \uCEE4\uC694. 30MB \uC544\uB798\uB85C \uBD80\uD0C1\uB4DC\uB824\uC694"}');let i=(String(a.name??"").split(/[/\\]/).pop()??"").replace(/[\u0000-\u001f]/g,"").replace(/^\.+/,"").trim();if(!i||!a.data)return s(400,'{"error":"\uD30C\uC77C\uC744 \uC77D\uC9C0 \uBABB\uD588\uC5B4\uC694"}');let c=Buffer.from(String(a.data),"base64");if(!c.length)return s(400,'{"error":"\uBE48 \uD30C\uC77C\uC774\uC5D0\uC694"}');let u=l(f,"_\uC5EC\uAE30\uC5D0_\uB123\uC73C\uC138\uC694");await $(u,{recursive:!0});let b=l(u,i);if(y(b)){let g=i.lastIndexOf("."),h=g>0?i.slice(0,g):i,v=g>0?i.slice(g):"";b=l(u,`${h}_${Date.now()%1e5}${v}`)}return await T(b,c),s(200,JSON.stringify({saved:st(b)}))}case"/api/setup":{if(t.method!=="POST")break;let a=await p(),o=String(a.name??"").trim();if(!o)return s(400,'{"error":"\uD559\uC6D0 \uC774\uB984\uC744 \uC801\uC5B4\uC8FC\uC138\uC694"}');if(o.length>60)return s(400,'{"error":"\uD559\uC6D0 \uC774\uB984\uC774 \uB108\uBB34 \uAE38\uC5B4\uC694"}');if(!/[가-힣A-Za-z]/.test(o))return s(400,'{"error":"\uD559\uC6D0 \uC774\uB984\uC5D0 \uAE00\uC790\uAC00 \uC5C6\uC5B4\uC694. \uC22B\uC790\uB9CC\uC73C\uB85C\uB294 \uC548 \uB3FC\uC694"}');let i=(h,v)=>{let m=String(v??"").trim();return m?`## ${h}
${m}

`:""},c=[String(a.first??"").trim(),String(a.sure??"").trim()?`\uC790\uC2E0 \uC788\uAC8C: ${String(a.sure).trim()}`:"",String(a.careful??"").trim()?`\uC870\uC2EC\uC2A4\uB7FD\uAC8C: ${String(a.careful).trim()}`:""].filter(Boolean).join(`
`),u=`# ${o}

`+i("\uC9C0\uC5ED",a.area)+i("\uACFC\uBAA9",a.subject)+i("\uB300\uC0C1 \uD559\uB144",a.grade)+i("\uD559\uBD80\uBAA8 \uBB38\uC758 \uCC3D\uAD6C",a.channel)+i("\uB2E4\uB978 \uD559\uC6D0\uACFC \uB2E4\uB974\uAC8C \uD558\uB294 \uAC83",a.unique)+i("\uC790\uC8FC \uB4E3\uB294 \uC9C8\uBB38",a.questions)+i("\uC0DD\uAC01",c)+i("\uC548 \uB2E4\uB8E8\uB294 \uAC83",a.never)+i("\uADF8 \uBC16\uC5D0",a.etc),b=l(f,"00_\uB0B4\uD559\uC6D0\uC790\uB8CC","01_\uAE30\uCD08\uC815\uBCF4");await $(b,{recursive:!0});let g=l(b,"\uD559\uC6D0\uC815\uBCF4.md");if(y(g)){let h=l(b,`\uD559\uC6D0\uC815\uBCF4_\uC774\uC804_${P()}.md`);y(h)||await J(g,h)}return await T(g,u,"utf8"),s(200,JSON.stringify({saved:!0}))}case"/api/file":{let a=["00_\uB0B4\uD559\uC6D0\uC790\uB8CC/","10_\uD559\uC6D0\uC704\uD0A4/","_\uC5EC\uAE30\uC5D0_\uB123\uC73C\uC138\uC694/"],o=u=>{let b=String(u??"").replace(/\\/g,"/");if(!a.some(v=>b.startsWith(v))||b.includes("\0"))return null;let g=H(f,b),h=H(f);if(g!==h&&!g.startsWith(h+mt))return null;try{let v=y(g)?g:at(g);if(y(v)){let m=yt(v),x=yt(h);if(m!==x&&!m.startsWith(x+mt))return null}}catch{return null}return g};if(t.method!=="POST"){let u=o(r.searchParams.get("path")??"");if(!u)return s(403,'{"error":"\uC5F4 \uC218 \uC5C6\uB294 \uD30C\uC77C\uC774\uC5D0\uC694"}');if(!y(u))return s(404,'{"error":"\uD30C\uC77C\uC774 \uC5C6\uC5B4\uC694"}');if(gt(u).size>2e6)return s(413,'{"error":"\uB108\uBB34 \uCEE4\uC11C \uC5EC\uAE30\uC11C\uB294 \uBABB \uC5F4\uC5B4\uC694. \uBBF8\uB9AC\uBCF4\uAE30\uB85C \uC5F4\uC5B4\uC8FC\uC138\uC694"}');let b=await B(u);return b.includes(0)?s(415,'{"error":"\uAE00\uC790 \uD30C\uC77C\uC774 \uC544\uB2C8\uB77C \uC5EC\uAE30\uC11C\uB294 \uBABB \uACE0\uCCD0\uC694"}'):s(200,JSON.stringify({text:b.toString("utf8")}))}let i=await p();if(i.tooBig)return s(413,'{"error":"\uB0B4\uC6A9\uC774 \uB108\uBB34 \uAE38\uC5B4\uC694"}');let c=o(i.path);if(!c)return s(403,'{"error":"\uC190\uB308 \uC218 \uC5C6\uB294 \uD30C\uC77C\uC774\uC5D0\uC694"}');if(!y(c))return s(404,'{"error":"\uD30C\uC77C\uC774 \uC5C6\uC5B4\uC694"}');if(i.remove){let u=l(f,".\uD734\uC9C0\uD1B5");return await $(u,{recursive:!0}),await J(c,l(u,`${Date.now()}_${st(c)}`)),s(200,JSON.stringify({removed:!0}))}return typeof i.text!="string"?s(400,'{"error":"\uB0B4\uC6A9\uC774 \uBE44\uC5C8\uC5B4\uC694"}'):(await T(c,i.text,"utf8"),s(200,JSON.stringify({saved:!0})))}case"/api/feedback":{if(t.method!=="POST")break;let{dir:a,edited:o}=await p();if(!a||typeof o!="string"||!o.trim())return s(400,JSON.stringify({error:"\uACE0\uCE58\uC2E0 \uAE00\uC744 \uBABB \uC77D\uC5C8\uC5B4\uC694"}));let i=ht(l(f,"20_\uC644\uC131\uAE00"),a);if(!i||!y(i))return s(404,JSON.stringify({error:"\uADF8 \uAE00\uC744 \uBABB \uCC3E\uC558\uC5B4\uC694"}));let c=st(i);await T(l(i,"\uD3B8\uC9D1\uBCF8.md"),o,"utf8");let u=await z(`${zt} feedback "${i}/\uCD5C\uC885.md" "${i}/\uD3B8\uC9D1\uBCF8.md"`),b=null;try{let g=l(f,"20_\uC644\uC131\uAE00","_\uBC1C\uD589\uB300\uC7A5.json"),h=S(await k(g),{posts:[]}),v=tt(h.posts,c);typeof v?.editRate=="number"&&(b=v.editRate)}catch{}return s(200,JSON.stringify({out:u.out,rate:b}))}case"/api/feedback-rough":{if(t.method!=="POST")break;let{dir:a,rate:o}=await p(),i=Number(o);if(!Number.isFinite(i)||i<0||i>100)return s(400,JSON.stringify({error:"\uACE0\uCE58\uC2E0 \uC815\uB3C4\uB97C \uBABB \uC77D\uC5C8\uC5B4\uC694"}));let c=ht(l(f,"20_\uC644\uC131\uAE00"),a);if(!c||!y(c))return s(404,JSON.stringify({error:"\uADF8 \uAE00\uC744 \uBABB \uCC3E\uC558\uC5B4\uC694"}));let u=l(f,"20_\uC644\uC131\uAE00","_\uBC1C\uD589\uB300\uC7A5.json"),b=S(await k(u),{posts:[],editRates:[],roughRates:[]}),g=tt(b.posts,String(a));return g?.editRate!==void 0?s(200,JSON.stringify({rate:g.editRate,\uC774\uBBF8:!0})):(g&&(g.rough=i),b.roughRates=[...b.roughRates??[],i].slice(-12),await T(u,JSON.stringify(b,null,2),"utf8"),await T(l(c,".\uB300\uCDA9\uD53C\uB4DC\uBC31"),String(i),"utf8"),s(200,JSON.stringify({rate:i})))}}s(404,"{}")}catch(a){s(500,JSON.stringify({error:a.message}))}});function Be(t,e=12){Ne.once("error",r=>{if(r.code==="EADDRINUSE"&&e>0)return Be(t+1,e-1);console.log(`
  \uD654\uBA74\uC744 \uC5F4\uC9C0 \uBABB\uD588\uC5B4\uC694: ${r.message}
`),process.exit(1)}),Ne.listen(t,"127.0.0.1",()=>{let r=`http://localhost:${t}`;console.log(`
  \uD654\uBA74\uC744 \uC5F4\uC5C8\uC5B4\uC694 \u2014 ${r}`),t!==Bt&&console.log(`  (${Bt}\uBC88\uC774 \uC4F0\uC774\uACE0 \uC788\uC5B4\uC11C ${t}\uBC88\uC73C\uB85C \uC5F4\uC5C8\uC5B4\uC694)`),console.log(`  \uB2EB\uC73C\uC2DC\uB824\uBA74 \uC774 \uCC3D\uC5D0\uC11C Ctrl+C\uB97C \uB204\uB974\uC138\uC694
`),!process.env.AW_NO_OPEN&&Ut(process.platform==="win32"?`start "" "${r}"`:process.platform==="darwin"?`open ${r}`:`xdg-open ${r}`,n=>{n&&console.log(`  \uBE0C\uB77C\uC6B0\uC800\uAC00 \uC548 \uC5F4\uB9AC\uBA74 \uC8FC\uC18C\uCC3D\uC5D0 ${r} \uB97C \uB123\uC5B4\uC8FC\uC138\uC694
`)})})}!y(l(f,"\uBC84\uC804.json"))&&!y(l(f,"CLAUDE.md"))&&(console.log(`
  \uC5EC\uAE30\uB294 \uD504\uB85C\uADF8\uB7A8 \uD3F4\uB354\uAC00 \uC544\uB2CC \uAC83 \uAC19\uC544\uC694: ${f}`),console.log(`  'BlogStudio' \uB97C \uB20C\uB7EC\uC11C \uC5EC\uC2DC\uBA74 \uC54C\uC544\uC11C \uB9DE\uB294 \uACF3\uC744 \uCC3E\uC544\uC694.
`),process.exit(1));var $e=!1;function Fe(t){if($e)return;$e=!0;let e=V.filter(r=>!r.done&&r.proc);if(e.length){console.log(`
  \uB3CC\uB358 \uC77C ${e.length}\uAC74\uC744 \uBA48\uCDC4\uC5B4\uC694. \uB2E4\uC2DC \uCF1C\uC2DC\uBA74 \uC774\uC5B4\uC11C \uD574\uC694.`);for(let r of e)Q(r),r.done=!0,r.ok=!1,r.out+=`

\uD504\uB85C\uADF8\uB7A8\uC774 \uB2EB\uD600\uC11C \uC5EC\uAE30\uC11C \uBA48\uCDC4\uC5B4\uC694. \uB2E4\uC2DC \uCF1C\uC2DC\uBA74 \uC774\uC5B4\uC11C \uD574\uC694.`;setTimeout(()=>{for(let r of e)Q(r,!0);process.exit(t==="SIGINT"?130:0)},1500).unref();return}process.exit(t==="SIGINT"?130:0)}process.on("uncaughtException",t=>{try{U(f,"\uC624\uB958","\uD504\uB85C\uADF8\uB7A8\uC774 \uAC11\uC790\uAE30 \uBA48\uCDA4",String(t?.stack??t).slice(0,900))}catch{}console.error(`
  \uC608\uC0C1 \uBABB \uD55C \uBB38\uC81C\uB85C \uBA48\uCDC4\uC5B4\uC694. \uB2E4\uC2DC \uC5F4\uC5B4\uC8FC\uC138\uC694.`),Fe("SIGTERM")});process.on("unhandledRejection",t=>{try{U(f,"\uC624\uB958","\uC548\uC5D0\uC11C \uCC98\uB9AC \uBABB \uD55C \uBB38\uC81C",String(t?.stack??t).slice(0,900))}catch{}});for(let t of["SIGINT","SIGTERM","SIGHUP"])process.on(t,()=>Fe(t));try{xe(f,"\uC4F0\uC784",`\uCF1C\uC9D0 ${process.platform}`,`node ${process.versions.node} \xB7 ${process.arch}`);let t=he(f);t&&console.log(`  \uC9C0\uB09C\uBC88\uC5D0 \uD558\uC2DC\uB358 \uC77C ${t}\uAC74\uC774 \uC911\uAC04\uC5D0 \uBA48\uCDB0 \uC788\uC5C8\uC5B4\uC694. \uD654\uBA74\uC5D0\uC11C \uC774\uC5B4\uC11C \uD558\uC2E4 \uC218 \uC788\uC5B4\uC694.`)}catch{}Be(Bt);export{Ae as tagsOf,Pn as titleOf};
