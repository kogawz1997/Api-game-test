# Frontend Usage

```ts
export async function getProviders() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mock-provider/providers`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load providers');
  return res.json();
}

export async function getGames(providerCode?: string) {
  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/mock-provider/games`);
  if (providerCode) url.searchParams.set('providerCode', providerCode);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load games');
  return res.json();
}

export async function launchGame(input: { memberId: string; providerCode: string; gameCode: string }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mock-provider/launch`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error('Failed to launch game');
  return res.json();
}
```
