import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import Scene from './Scene'
import './App.css'

// ✏️ APNI DETAILS
const profile = {
  name: 'ABDUL MUSAWAR AWAN',
  roles: ['Web Developer', 'React Developer', 'UI Designer', '3D Web Creator'],
  tagline: 'Main aisi websites banata hoon jo dekhne walon ko hairan kar dein.',
  about:
    'Main ek passionate developer hoon jo modern web, animations aur 3D experiences par kaam karta hoon.',
  email: 'abdulmusawarawan0@gmail.com',
  phone: '+92 333 9812013',
  whatsapp: '923339812013', // sirf numbers, + aur space ke baghair
  github: 'https://github.com/abdulmusawar9876-lab',
  location: 'Bannu, Pakistan',
}

const skills = ['React', 'JavaScript', 'Three.js', 'Framer Motion', 'HTML5', 'CSS3', 'Vite', 'Git', 'MongoDB', 'Responsive Design']

const CLOUD_NAME = 'awdbave1'
const UPLOAD_PRESET = 'portfolio_unsigned'

const GRADS = [
  'linear-gradient(135deg,#6c5ce7,#00cec9)',
  'linear-gradient(135deg,#ff6bcb,#6c5ce7)',
  'linear-gradient(135deg,#00cec9,#ffd166)',
  'linear-gradient(135deg,#ff9a3c,#ff6bcb)',
]

// Server na mile (localhost par) to ye sample dikhega
const SAMPLE = [
  {
    id: 'sample',
    title: 'Sample Project',
    desc: 'Online deploy ke baad yahan tumhare asli projects aayenge.',
    details: 'Ye sirf namoona hai.',
    tech: ['React'],
    g: GRADS[0],
    image: '',
    video: '',
    live: '',
    github: '',
  },
]

const toProject = (r, i) => ({
  id: r.id,
  title: r.title || '',
  desc: r.desc || '',
  details: r.details || r.desc || '',
  tech: Array.isArray(r.tech) ? r.tech : [],
  g: GRADS[i % GRADS.length],
  image: r.image || '',
  video: r.video || '',
  live: r.live || '',
  github: r.github || '',
})

const fade = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.7 },
}

function getVideo(url) {
  if (!url) return null
  const yt = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)
  if (yt) return { type: 'yt', src: 'https://www.youtube.com/embed/' + yt[1] }
  return { type: 'file', src: url }
}

function compressImage(file, max = 1000) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * s)
      c.height = Math.round(img.height * s)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.75))
    }
    img.onerror = () => reject(new Error('Image load nahi hui'))
    img.src = url
  })
}

function uploadVideo(file, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', UPLOAD_PRESET)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', 'https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/video/upload')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300 && res.secure_url) resolve(res.secure_url)
        else reject(new Error((res.error && res.error.message) || 'Video upload nahi hui'))
      } catch {
        reject(new Error('Video upload nahi hui'))
      }
    }
    xhr.onerror = () => reject(new Error('Internet ka masla, video upload nahi hui'))
    xhr.send(fd)
  })
}

async function api(method, path, pw, body) {
  const res = await fetch('/api/projects' + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-admin-password': pw || '' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Server error')
  return data
}

function Counter({ to }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!inView || to === 0) return
    let i = 0
    const id = setInterval(() => {
      i += 1
      setV(i)
      if (i >= to) clearInterval(id)
    }, 220)
    return () => clearInterval(id)
  }, [inView, to])
  return <span ref={ref}>{Math.min(v, to)}</span>
}

function AdminModal({ projects, onClose, onChanged }) {
  const empty = { title: '', desc: '', details: '', tech: '', live: '', github: '', video: '' }
  const saved = sessionStorage.getItem('pf_pw') || ''
  const [pw, setPw] = useState(saved)
  const [authed, setAuthed] = useState(!!saved)
  const [f, setF] = useState(empty)
  const [imgFile, setImgFile] = useState(null)
  const [vidFile, setVidFile] = useState(null)
  const [prog, setProg] = useState(0)
  const [k, setK] = useState(0)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const doLogin = async () => {
    setMsg('')
    setBusy(true)
    try {
      await api('GET', '?check=1', pw)
      sessionStorage.setItem('pf_pw', pw)
      setAuthed(true)
    } catch (e) {
      setMsg('Login nahi hua: ' + e.message)
    }
    setBusy(false)
  }

  const logout = () => {
    sessionStorage.removeItem('pf_pw')
    setPw('')
    setAuthed(false)
  }

  const add = async () => {
    if (!f.title.trim()) return setMsg('Project ka naam likho')
    setBusy(true)
    setMsg('')
    setProg(0)
    try {
      let video = f.video.trim()
      if (vidFile) {
        if (vidFile.size > 100 * 1024 * 1024) throw new Error('Video 100 MB se chhoti honi chahiye')
        video = await uploadVideo(vidFile, setProg)
      }
      const image = imgFile ? await compressImage(imgFile) : ''
      await api('POST', '', pw, { ...f, video, image })
      setF(empty)
      setImgFile(null)
      setVidFile(null)
      setProg(0)
      setK(k + 1)
      await onChanged()
      setMsg('✅ Project add ho gaya!')
    } catch (e) {
      setMsg('Error: ' + e.message)
    }
    setBusy(false)
  }

  const remove = async (id) => {
    if (!window.confirm('Ye project delete karna hai?')) return
    try {
      await api('DELETE', '?id=' + encodeURIComponent(id), pw)
      await onChanged()
    } catch (e) {
      setMsg('Delete nahi hua: ' + e.message)
    }
  }

  return (
    <motion.div className="mback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="mbox glass"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="mclose" onClick={onClose}>✕</button>
        <h3>⚙️ Admin Panel</h3>

        {!authed && (
          <>
            <input
              type="password"
              placeholder="Admin password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doLogin()}
            />
            <button className="btn primary" onClick={doLogin} disabled={busy}>
              {busy ? 'Check ho raha hai...' : 'Login'}
            </button>
          </>
        )}

        {authed && (
          <>
            <h4>Naya Project Add Karo</h4>
            <input placeholder="Project ka naam *" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <input placeholder="Chhoti description (card ke liye)" value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} />
            <textarea rows={4} placeholder="Poori detail (click karne par dikhegi)" value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} />
            <input placeholder="Technologies (comma se alag): React, CSS, MongoDB" value={f.tech} onChange={(e) => setF({ ...f, tech: e.target.value })} />
            <input placeholder="Live website link" value={f.live} onChange={(e) => setF({ ...f, live: e.target.value })} />
            <input placeholder="GitHub link (optional)" value={f.github} onChange={(e) => setF({ ...f, github: e.target.value })} />

            <label className="afile">
              📷 Screenshot (gallery se): {imgFile ? imgFile.name : 'chuno'}
              <input key={'i' + k} type="file" accept="image/*" hidden onChange={(e) => setImgFile(e.target.files[0] || null)} />
            </label>

            <label className="afile">
              🎬 Video (gallery se): {vidFile ? vidFile.name : 'chuno'}
              <input key={'v' + k} type="file" accept="video/*" hidden onChange={(e) => setVidFile(e.target.files[0] || null)} />
            </label>

            <input
              placeholder="Ya YouTube link (agar file nahi chuni)"
              value={f.video}
              onChange={(e) => setF({ ...f, video: e.target.value })}
            />

            {busy && vidFile && (
              <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ width: prog + '%', background: 'linear-gradient(90deg,#6c5ce7,#00cec9)', padding: '4px 8px', fontSize: 12, transition: 'width .2s' }}>
                  Video {prog}%
                </div>
              </div>
            )}

            <button className="btn primary" onClick={add} disabled={busy}>
              {busy ? 'Upload ho raha hai...' : '+ Project Add Karo'}
            </button>

            <h4>Mojooda Projects ({projects.length})</h4>
            <div className="alist">
              {projects.map((p) => (
                <div className="arow" key={p.id}>
                  <span>{p.title}</span>
                  <button onClick={() => remove(p.id)}>🗑 Delete</button>
                </div>
              ))}
            </div>
            <button className="btn" onClick={logout}>Logout</button>
          </>
        )}

        {msg && <p className={msg.startsWith('✅') ? 'ok' : 'bad'}>{msg}</p>}
      </motion.div>
    </motion.div>
  )
}

export default function App() {
  const [menu, setMenu] = useState(false)
  const [role, setRole] = useState(0)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/projects')
      const type = res.headers.get('content-type') || ''
      if (!res.ok || !type.includes('json')) throw new Error('api')
      const data = await res.json()
      setProjects(data.map(toProject))
    } catch {
      setProjects(SAMPLE)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const id = setInterval(() => setRole((r) => (r + 1) % profile.roles.length), 2200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const move = (e) => {
      document.documentElement.style.setProperty('--mx', e.clientX + 'px')
      document.documentElement.style.setProperty('--my', e.clientY + 'px')
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  useEffect(() => {
    document.body.style.overflow = selected !== null || adminOpen ? 'hidden' : ''
    const esc = (e) => {
      if (e.key === 'Escape') {
        setSelected(null)
        setAdminOpen(false)
      }
    }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [selected, adminOpen])

  const links = ['about', 'skills', 'projects', 'contact']

  const send = async () => {
    if (!form.name.trim() || !form.message.trim() || !form.email.trim()) {
      setStatus('missing')
      return
    }
    setStatus('sending')
    try {
      const res = await fetch('https://formsubmit.co/ajax/' + profile.email, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message,
          _subject: 'Portfolio par naya message: ' + form.name,
          _template: 'table',
        }),
      })
      if (!res.ok) throw new Error('fail')
      setStatus('ok')
      setForm({ name: '', email: '', phone: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  const sel = selected !== null ? projects.find((p) => p.id === selected) : null
  const vid = sel ? getVideo(sel.video) : null

  return (
    <>
      <Scene />
      <div className="glow" />

      <div className="page">
        <motion.header className="nav" initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.8 }}>
          <a href="#top" className="logo">{profile.name.split(' ')[0]}<span>.</span></a>
          <nav className={menu ? 'links open' : 'links'}>
            {links.map((l) => (
              <a key={l} href={'#' + l} onClick={() => setMenu(false)}>{l}</a>
            ))}
          </nav>
          <button className="burger" onClick={() => setMenu(!menu)}>☰</button>
        </motion.header>

        <section id="top" className="hero">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }}>
            <p className="hi">👋 Assalam o Alaikum, main hoon</p>
            <h1>{profile.name}</h1>
            <h2 key={role} className="role">{profile.roles[role]}</h2>
            <p className="tag">{profile.tagline}</p>
            <div className="cta">
              <a href="#projects" className="btn primary">Mere Projects</a>
              <a href="#contact" className="btn">Rabta Karein</a>
            </div>
          </motion.div>
          <div className="scroll">Scroll ↓</div>
        </section>

        <section className="sec">
          <motion.div {...fade} className="stats">
            <div className="glass stat"><b><Counter to={loading ? 0 : projects.length} /></b><span>Projects</span></div>
            <div className="glass stat"><b><Counter to={skills.length} /></b><span>Skills</span></div>
            <div className="glass stat"><b>100%</b><span>Dedication</span></div>
          </motion.div>
        </section>

        <section id="about" className="sec">
          <motion.div {...fade} className="glass box">
            <h3 className="title">About Me</h3>
            <p className="about">{profile.about}</p>
            <p className="loc">📍 {profile.location}</p>
          </motion.div>
        </section>

        <section id="skills" className="sec">
          <motion.div {...fade}>
            <h3 className="title">Skills</h3>
            <div className="marquee">
              <div className="track">
                {[...skills, ...skills].map((s, i) => (
                  <span key={i} className="pill">{s}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section id="projects" className="sec">
          <h3 className="title">Projects ({projects.length})</h3>
          {loading && <p className="about">Loading...</p>}
          {!loading && projects.length === 0 && <p className="about">Abhi koi project nahi hai.</p>}
          <div className="pgrid">
            {projects.map((p, i) => (
              <motion.div
                key={p.id}
                className="glass pcard clickable"
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                whileHover={{ y: -10 }}
                onClick={() => setSelected(p.id)}
              >
                <div
                  className="thumb"
                  style={{ background: p.image ? 'url(' + p.image + ') center / cover' : p.g }}
                >
                  {p.video && <span className="play">▶</span>}
                </div>
                <h4>{p.title}</h4>
                <p>{p.desc}</p>
                <div className="tech">{p.tech.map((t) => <span key={t}>{t}</span>)}</div>
                <span className="more">Detail dekho →</span>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="contact" className="sec">
          <motion.div {...fade} className="glass box contact">
            <h3 className="title">Contact</h3>

            <div className="quick">
              <a href={'tel:' + profile.phone.replace(/\s/g, '')} className="btn">📞 {profile.phone}</a>
              <a href={'https://wa.me/' + profile.whatsapp} target="_blank" rel="noreferrer" className="btn">💬 WhatsApp</a>
              <a href={'mailto:' + profile.email} className="btn">✉️ {profile.email}</a>
            </div>

            <input placeholder="Aapka naam *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input type="email" placeholder="Aapki email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input placeholder="Aapka phone number (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <textarea rows={4} placeholder="Aapka message *" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            <button className="btn primary" onClick={send} disabled={status === 'sending'}>
              {status === 'sending' ? 'Bhej raha hoon...' : 'Message Bhejo'}
            </button>
            {status === 'ok' && <p className="ok">✅ Message bhej diya gaya! Jald jawab milega.</p>}
            {status === 'missing' && <p className="bad">Naam, email aur message zaroori hain.</p>}
            {status === 'error' && <p className="bad">Message nahi gaya. Dobara try karo ya WhatsApp use karo.</p>}

            <div className="social">
              <a href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
            </div>
          </motion.div>
        </section>

        <footer className="footer">
          © {new Date().getFullYear()} {profile.name} ·{' '}
          <button className="adminlink" onClick={() => setAdminOpen(true)}>Admin</button>
        </footer>
      </div>

      <AnimatePresence>
        {sel && (
          <motion.div className="mback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div
              className="mbox glass"
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="mclose" onClick={() => setSelected(null)}>✕</button>
              <h3>{sel.title}</h3>

              {vid && vid.type === 'yt' && (
                <div className="video">
                  <iframe src={vid.src} title={sel.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowFullScreen />
                </div>
              )}
              {vid && vid.type === 'file' && (
                <div className="video"><video src={vid.src} controls playsInline /></div>
              )}
              {!vid && sel.image && <img className="bigimg" src={sel.image} alt={sel.title} />}
              {!vid && !sel.image && <div className="thumb big" style={{ background: sel.g }} />}

              <p className="mdesc">{sel.details}</p>
              <div className="tech">{sel.tech.map((t) => <span key={t}>{t}</span>)}</div>

              <div className="mbtns">
                {sel.live && <a className="btn primary" href={sel.live} target="_blank" rel="noreferrer">Live Website 🔗</a>}
                {sel.github && <a className="btn" href={sel.github} target="_blank" rel="noreferrer">GitHub Code</a>}
              </div>
            </motion.div>
          </motion.div>
        )}
        {adminOpen && <AdminModal projects={projects} onClose={() => setAdminOpen(false)} onChanged={load} />}
      </AnimatePresence>
    </>
  )
}