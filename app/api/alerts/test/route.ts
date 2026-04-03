import { sendTelegramAlert } from '@/server/telegram'

export async function POST() {
  await sendTelegramAlert('JTRUMPHQ monitor test alert ✅')
  return Response.json({ ok: true })
}
