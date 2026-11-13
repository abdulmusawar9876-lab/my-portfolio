import { MongoClient, ObjectId } from 'mongodb'

let client

async function getCol() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
  }
  return client.db('portfolio').collection('projects')
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const str = (v, max) => String(v || '').slice(0, max)

export default async (req) => {
  try {
    const url = new URL(req.url)
    const isAdmin =
      !!process.env.ADMIN_PASSWORD &&
      req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD

    if (req.method === 'GET' && url.searchParams.get('check')) {
      return isAdmin ? json({ ok: true }) : json({ error: 'Password ghalat hai' }, 401)
    }

    const col = await getCol()

    if (req.method === 'GET') {
      const rows = await col.find({}).sort({ createdAt: -1 }).toArray()
      return json(rows.map((r) => ({ ...r, id: String(r._id), _id: undefined })))
    }

    if (!isAdmin) return json({ error: 'Password ghalat hai' }, 401)

    if (req.method === 'POST') {
      const b = await req.json()
      if (!b.title || !String(b.title).trim()) return json({ error: 'Project ka naam zaroori hai' }, 400)
      await col.insertOne({
        title: str(b.title, 120),
        desc: str(b.desc, 300),
        details: str(b.details, 4000),
        tech: str(b.tech, 300)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        live: str(b.live, 300),
        github: str(b.github, 300),
        video: str(b.video, 400),
        image: str(b.image, 1500000),
        createdAt: new Date(),
      })
      return json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id')
      await col.deleteOne({ _id: new ObjectId(id) })
      return json({ ok: true })
    }

    return json({ error: 'Ye method allowed nahi' }, 405)
  } catch (e) {
    return json({ error: e.message || 'Server error' }, 500)
  }
}

export const config = { path: '/api/projects' }