import { Controller, Get, Header } from '@nestjs/common';

const pageShell = (title: string, body: string) => `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root { color-scheme: dark; --bg:#0b1020; --card:#141b34; --muted:#94a3b8; --line:#26304f; --text:#e5e7eb; --brand:#60a5fa; --ok:#22c55e; --bad:#ef4444; }
    * { box-sizing: border-box; } body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: radial-gradient(circle at top, #1e293b, var(--bg)); color:var(--text); }
    a { color: var(--brand); text-decoration: none; } .wrap { max-width: 1180px; margin: 0 auto; padding: 24px; }
    .nav { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:20px; } .nav a { padding:10px 12px; border:1px solid var(--line); border-radius:12px; background:rgba(20,27,52,.75); }
    .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px; } .card { background:rgba(20,27,52,.9); border:1px solid var(--line); border-radius:18px; padding:16px; box-shadow: 0 20px 60px rgba(0,0,0,.25); }
    h1 { margin: 0 0 8px; font-size: 28px; } h2 { margin: 0 0 12px; font-size: 18px; } p { color:var(--muted); } label { display:block; font-size:13px; color:var(--muted); margin:10px 0 6px; }
    input, select, textarea { width:100%; padding:11px 12px; border-radius:12px; border:1px solid var(--line); background:#0f172a; color:var(--text); outline:none; }
    textarea { min-height:92px; } button { cursor:pointer; border:0; border-radius:12px; padding:11px 14px; color:white; background:#2563eb; font-weight:700; margin:8px 6px 0 0; }
    button.secondary { background:#334155; } button.danger { background:#dc2626; } button.ok { background:#16a34a; }
    pre { white-space:pre-wrap; overflow:auto; background:#020617; border:1px solid var(--line); border-radius:14px; padding:12px; color:#bfdbfe; max-height:420px; }
    .row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; } .pill { display:inline-flex; align-items:center; gap:6px; padding:5px 9px; border-radius:999px; background:#172554; border:1px solid #1d4ed8; color:#bfdbfe; font-size:12px; }
    .game { border:1px solid var(--line); border-radius:14px; padding:12px; background:#0f172a; } .game strong { display:block; margin-bottom:4px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="nav">
      <a href="/admin/credentials">Credential</a><a href="/member/games">Member Games</a><a href="/admin/reports">Reports</a><a href="/mock-game/play">Mock Play</a><a href="/api/game">API Manifest</a>
    </div>
    ${body}
  </div>
</body>
</html>`;

const clientScript = `
const API = '/api/game';
const out = (id, data) => document.getElementById(id).textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
async function call(body) {
  const res = await fetch(API, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({ success:false, error:'Invalid JSON response' }));
  return data;
}
`;

@Controller()
export class StaticPagesController {
  @Get('admin/credentials')
  @Header('content-type', 'text/html; charset=utf-8')
  credentials() {
    return pageShell('Admin Credential Settings', `
      <h1>Admin Credential Settings</h1><p>บันทึก API Base URL, Key, Secret, walletMode แล้วทดสอบการต่อ provider ได้จากหน้านี้</p>
      <div class="grid"><div class="card"><h2>Provider Config</h2>
        <label>Provider</label><select id="providerCode"><option>PG</option><option>JILI</option><option>PP</option><option>EVO</option><option>SPADE</option><option>FC</option><option>CQ9</option><option>KINGMAKER</option><option>SABA</option><option>BTI</option></select>
        <label>API Base URL</label><input id="apiBaseUrl" value="https://mock-pg.provider.test/api" />
        <label>Merchant ID</label><input id="merchantId" value="merchant_001" />
        <label>Agent ID</label><input id="agentId" value="agent_001" />
        <label>API Key</label><input id="apiKey" value="api_key_here" />
        <label>Secret Key</label><input id="secretKey" value="secret_key_here" />
        <label>Webhook Secret</label><input id="webhookSecret" value="webhook_secret_here" />
        <label>IP Whitelist comma separated</label><input id="ipWhitelist" value="127.0.0.1" />
        <label>Wallet Mode</label><select id="walletMode"><option value="transfer">transfer mock ภายใน</option><option value="external">external provider</option><option value="seamless">seamless callback</option></select>
        <div class="row"><button onclick="saveConfig()">Save</button><button class="secondary" onclick="loadConfigs()">Load All</button><button class="ok" onclick="testConfig()">Test</button></div>
      </div><div class="card"><h2>Result</h2><pre id="result">พร้อมรับคำสั่ง</pre></div></div>
      <script>${clientScript}
      async function saveConfig(){ const body={ action:'upsert_provider_config', providerCode:providerCode.value, apiBaseUrl:apiBaseUrl.value, merchantId:merchantId.value, agentId:agentId.value, apiKey:apiKey.value, secretKey:secretKey.value, webhookSecret:webhookSecret.value, ipWhitelist:ipWhitelist.value.split(',').map(x=>x.trim()).filter(Boolean), walletMode:walletMode.value, currency:'THB', language:'th', status:'active', changedBy:'admin-ui' }; out('result', await call(body)); }
      async function loadConfigs(){ out('result', await call({ action:'provider_configs' })); }
      async function testConfig(){ out('result', await call({ action:'test_provider_config', providerCode:providerCode.value })); }
      loadConfigs();</script>`);
  }

  @Get('member/games')
  @Header('content-type', 'text/html; charset=utf-8')
  games() {
    return pageShell('Member Game Lobby', `
      <h1>Member Game Lobby</h1><p>ดึงค่าย, ดึงเกม, สร้าง player และ launch เกมผ่าน POST /api/game</p>
      <div class="card row"><span class="pill">memberId</span><input id="memberId" value="member_001" style="max-width:220px"/><span class="pill">provider</span><select id="providerCode" style="max-width:150px"></select><button onclick="loadGames()">Load Games</button><button class="secondary" onclick="getBalance()">Balance</button></div>
      <div class="grid" id="games"></div><div class="card"><h2>Result</h2><pre id="result"></pre></div>
      <script>${clientScript}
      async function init(){ const r=await call({action:'providers',status:'active'}); providerCode.innerHTML=(r.data||[]).map(p=>'<option>'+p.code+'</option>').join(''); await loadGames(); }
      async function loadGames(){ const r=await call({action:'games',providerCode:providerCode.value,status:'active'}); games.innerHTML=(r.data||[]).map(g=>'<div class="game"><strong>'+g.name+'</strong><span class="pill">'+g.gameCode+'</span><p>'+g.category+'</p><button onclick="launchGame(\''+g.providerCode+'\',\''+g.gameCode+'\')">Launch</button></div>').join(''); out('result', r); }
      async function launchGame(p,g){ await call({action:'create_player',providerCode:p,memberId:memberId.value,username:memberId.value}); const r=await call({action:'launch',providerCode:p,memberId:memberId.value,gameCode:g}); out('result', r); const url=r?.data?.launchUrl || r?.data?.providerResponse?.launchUrl; if(url) location.href=url; }
      async function getBalance(){ out('result', await call({action:'balance',providerCode:providerCode.value,memberId:memberId.value})); }
      init();</script>`);
  }

  @Get('mock-game/play')
  @Header('content-type', 'text/html; charset=utf-8')
  play() {
    return pageShell('Mock Game Play', `
      <h1>Mock Game Play</h1><p>หน้าเล่นเกมจำลอง กด bet/win/settle เพื่อสร้าง callback, transaction และ round</p>
      <div class="grid"><div class="card"><h2>Session</h2>
        <label>Member ID</label><input id="memberId" />
        <label>Provider Code</label><input id="providerCode" />
        <label>Game Code</label><input id="gameCode" />
        <label>Round ID</label><input id="roundId" />
        <label>Amount</label><input id="amount" type="number" value="10" />
        <div class="row"><button onclick="bet()">Bet</button><button class="ok" onclick="win()">Win</button><button class="secondary" onclick="settle()">Settle</button><button class="danger" onclick="cancelRound()">Cancel</button></div>
      </div><div class="card"><h2>Result</h2><pre id="result"></pre></div></div>
      <script>${clientScript}
      const qs=new URLSearchParams(location.search); memberId.value=qs.get('memberId')||'member_001'; providerCode.value=qs.get('providerCode')||'PG'; gameCode.value=qs.get('gameCode')||'PG-MAHJONG-WAYS'; roundId.value='ROUND-'+Date.now();
      async function bet(){ out('result', await call({action:'callback_bet',providerCode:providerCode.value,memberId:memberId.value,gameCode:gameCode.value,roundId:roundId.value,amount:Number(amount.value),transactionId:'BET-'+Date.now()})); }
      async function win(){ out('result', await call({action:'callback_win',providerCode:providerCode.value,memberId:memberId.value,gameCode:gameCode.value,roundId:roundId.value,amount:Number(amount.value)*2,transactionId:'WIN-'+Date.now()})); }
      async function settle(){ out('result', await call({action:'callback_settle',providerCode:providerCode.value,memberId:memberId.value,gameCode:gameCode.value,roundId:roundId.value,betAmount:Number(amount.value),winAmount:Number(amount.value)*2,validBetAmount:Number(amount.value)})); }
      async function cancelRound(){ out('result', await call({action:'callback_cancel',providerCode:providerCode.value,roundId:roundId.value})); }</script>`);
  }

  @Get('admin/reports')
  @Header('content-type', 'text/html; charset=utf-8')
  reports() {
    return pageShell('Admin Reports', `
      <h1>Admin Reports</h1><p>ดู logs, rounds, summary, reconcile จากระบบ provider mock</p>
      <div class="card row"><input id="memberId" value="member_001" style="max-width:220px"/><select id="providerCode" style="max-width:150px"><option>PG</option><option>JILI</option><option>PP</option><option>EVO</option></select><button onclick="summary()">Summary</button><button onclick="rounds()">Rounds</button><button onclick="logs()">Api Logs</button><button onclick="reconcile()">Reconcile</button></div>
      <div class="card"><pre id="result"></pre></div>
      <script>${clientScript}
      async function summary(){ out('result', await call({action:'report_summary',providerCode:providerCode.value,memberId:memberId.value})); }
      async function rounds(){ out('result', await call({action:'report_rounds',providerCode:providerCode.value,memberId:memberId.value,limit:50})); }
      async function logs(){ out('result', await call({action:'provider_api_logs',providerCode:providerCode.value,limit:50})); }
      async function reconcile(){ out('result', await call({action:'reconcile',providerCode:providerCode.value,memberId:memberId.value})); }
      summary();</script>`);
  }
}
