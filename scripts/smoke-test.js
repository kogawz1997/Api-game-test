const baseUrl = process.env.GAME_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:4000';
const memberId = process.env.SMOKE_MEMBER_ID || 'member_001';
const providerCode = process.env.SMOKE_PROVIDER_CODE || 'PG';
const gameCode = process.env.SMOKE_GAME_CODE || 'PG-MAHJONG-WAYS';

async function get(path) {
  const res = await fetch(`${baseUrl}${path}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function post(body) {
  const res = await fetch(`${baseUrl}/api/game`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.success === false) throw new Error(`${body.action} failed: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function step(name, fn) {
  const started = Date.now();
  try {
    const data = await fn();
    console.log(`✅ ${name} (${Date.now() - started}ms)`);
    return data;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(error?.message || error);
    process.exitCode = 1;
    throw error;
  }
}

async function main() {
  const suffix = Date.now();
  const roundId = `SMOKE-ROUND-${suffix}`;

  await step('health', () => get('/health'));
  await step('manifest', () => get('/api/game'));
  await step('providers', () => post({ action: 'providers', status: 'active' }));
  await step('games', () => post({ action: 'games', providerCode, status: 'active' }));
  await step('create_player', () => post({ action: 'create_player', providerCode, memberId, username: memberId }));
  await step('balance before', () => post({ action: 'balance', providerCode, memberId }));
  await step('launch', () => post({ action: 'launch', providerCode, memberId, gameCode }));
  await step('callback_bet', () => post({ action: 'callback_bet', providerCode, memberId, gameCode, roundId, amount: 10, transactionId: `SMOKE-BET-${suffix}` }));
  await step('callback_win', () => post({ action: 'callback_win', providerCode, memberId, gameCode, roundId, amount: 15, transactionId: `SMOKE-WIN-${suffix}` }));
  await step('callback_settle', () => post({ action: 'callback_settle', providerCode, memberId, gameCode, roundId, betAmount: 10, winAmount: 15, validBetAmount: 10 }));
  await step('report_summary', () => post({ action: 'report_summary', providerCode, memberId }));
  await step('reconcile', () => post({ action: 'reconcile', providerCode, memberId }));
  await step('cleanup_nonce', () => post({ action: 'cleanup_callback_nonces' }));

  console.log('\nSmoke test completed. Somehow the machines behaved. Suspicious, but acceptable.');
}

main().catch(() => process.exit(1));
