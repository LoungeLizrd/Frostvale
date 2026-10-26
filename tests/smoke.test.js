// Headless smoke test for Frostvale.
// Runs the game's script in Node with a stubbed browser, simulates a day, and checks core systems.
// Usage: node tests/smoke.test.js   (no dependencies needed)
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'www', 'index.html'), 'utf8');
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];

// --- minimal browser stubs ---
const mk = () => new Proxy(function () {}, { get: (t, k) => k === 'style' ? {} : k === 'classList' ? { toggle() {}, remove() {}, add() {} } : k === 'dataset' ? {} : k === 'files' ? [] : k === Symbol.toPrimitive ? () => 0 : k === 'width' || k === 'height' ? 16 : k === 'getContext' ? () => mk() : k === 'addEventListener' ? () => {} : k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'querySelectorAll' ? () => [] : mk(), set: () => true, apply: () => mk() });
const els = {};
global.document = { getElementById: id => els[id] || (els[id] = new Proxy({ style: {}, classList: { toggle() {}, remove() {}, add() {} }, dataset: {}, firstChild: { style: {} }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }), addEventListener() {}, setPointerCapture() {}, querySelectorAll: () => [], appendChild() {}, append() {}, click() {} }, { get: (t, k) => k in t ? t[k] : mk(), set: (t, k, v) => { t[k] = v; return true } })), createElement: () => mk(), querySelectorAll: () => [], addEventListener() {}, hidden: false };
global.window = global; global.innerWidth = 390; global.innerHeight = 800; global.devicePixelRatio = 2; global.addEventListener = () => {};
const store = {}; global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k], clear: () => { for (const k in store) delete store[k] } };
global.performance = { now: () => 0 }; global.requestAnimationFrame = () => {}; global.setInterval = () => 0;
global.Image = function () {}; global.FileReader = function () {};
global.btoa = s => Buffer.from(s).toString('base64'); global.atob = s => Buffer.from(s, 'base64').toString();

let failed = 0;
global.check = (name, ok, info = '') => { console.log((ok ? '  ✓ ' : '  ✗ ') + name + (info ? '  (' + info + ')' : '')); if (!ok) failed++ };

eval(src + `;
console.log('Frostvale smoke test');
tutGo(99); placeNPCs(); genProps();

// 1. Plowing pays and every lot can be completed
S.foot=false;S.x=12.5;S.y=96.5;S.plow=true;S.dx=1;S.dy=0;S.ang=0;const m0=S.money;
for(let i=0;i<120;i++){jx=1;jy=0;step(.05)}jx=0;
check('plowing Main St earns money', S.money>m0, '+$'+(S.money-m0).toFixed(2));
let paid=0;LOTS.forEach(l=>{const m=S.money;l.tiles.forEach(([x,y])=>clearTile(x,y));if(l.st===2&&(S.money>m||l.home))paid++});
check('every parking lot can be plowed', paid===LOTS.length, paid+'/'+LOTS.length);

// 2. A full day of town life (clear weather, so no new snow blocks the roads)
for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(road[y][x]==1)snow[y][x]=0;
S.slp1=1;S.sc=99;$('dlg').style.display='none';S.plow=false;S.foot=true;S.tx=S.x;S.ty=S.y;S.ta=0;S.x=START[0];S.y=START[1];
S.wx='clear';S.min=6*60;placeNPCs();let maxc=0;const idle={},worst={};while(S.min<23*60){step(.05);maxc=Math.max(maxc,CARS.length);NP.forEach(n=>{idle[n.n]=n.goal&&!n.path.length?(idle[n.n]||0)+.05:0;worst[n.n]=Math.max(worst[n.n]||0,idle[n.n])});if($('dlg').style.display==='flex')$('dlg').style.display='none'}
check('town traffic spawns', maxc>0, maxc+' cars');
const stk=Object.entries(worst).filter(([k,v])=>v>20).map(([k,v])=>k+' '+v.toFixed(0)+'s');check('no NPC gets stuck on the way somewhere', !stk.length, stk.length?stk.join(', '):'longest pause '+Math.max(...Object.values(worst)).toFixed(1)+'s');

// 3. Buildings can be entered and exited
let ent=0,open=0;S.min=12*60;for(const id in D){S.x=D[id][0];S.y=D[id][1];if(!isOpen(id))continue;open++;talk();if(S.in===id){ent++;S.x=6;S.y=12.4;jy=1;for(let i=0;i<80;i++)step(.05);jy=0;if(S.in){S.in=null;ent--}}}
check('open buildings can be entered and exited', ent===open, ent+'/'+open);

// 4. Drawing works across the map, day and night
let drew=true;try{for(const [x,y] of [[30,100],[84,92],[60,68],[18,50],[55,22]])for(const m of [12*60,22*60]){S.min=m;S.x=x;S.y=y;S.cx=x;S.cy=y;draw()}}catch(e){drew=false}
check('renders day and night without errors', drew);

// 5. Early mail schedule
S.day=1;S.mailQ=[];S.mailR=[];S.mailP=[];S.rv.intro=0;const got={};for(let d=2;d<=5;d++){const b=S.mailQ.length;newDay();got[S.day]=S.mailQ.slice(b).filter(x=>!x.includes('|')&&x!=='arch')}
check('mail arrives on the right days', JSON.stringify(got)==='{"2":["welcome","radio"],"3":["fishing"],"4":["dispatch"],"5":["revival"]}', JSON.stringify(got));

// 6. Closed ski hill lot never fills up
const SL=LOTS.find(l=>l.n==='Ski Hill Lot');S.rv.open=0;let mx=0;for(let i=0;i<50;i++)mx=Math.max(mx,lotFillT(SL));
check('closed Ski Hill Lot holds at most 2 cars', mx<=2, 'max '+mx);

// 7. Save and load round trip
S.money=4321;saveGame();S.money=0;applySave(JSON.parse(localStorage.getItem(KEY)));
check('save and load round trip', S.money===4321);
`);
console.log(failed ? '\n' + failed + ' check(s) failed' : '\nAll checks passed');
process.exit(failed ? 1 : 0);
