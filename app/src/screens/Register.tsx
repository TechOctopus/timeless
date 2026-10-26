import { useState } from 'react'
import { useApp } from '../ctx'
import { AVATAR_COLORS, AVATAR_EMOJIS } from '../data'
import { CircleWidget } from '../components/Widget'
import { Logo } from '../components/Logo'

export function Register() {
  const { update, now, state, toast } = useApp()
  const [form, setForm] = useState({ name: '', username: '', dob: '', short: '', email: '', phone: '' })
  const [agree, setAgree] = useState(false)
  const [touched, setTouched] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value
    if (k === 'username') v = v.toLowerCase().replace(/[^a-z0-9._]/g, '')
    if (k === 'short') v = v.toUpperCase().slice(0, 5)
    setForm((f) => {
      const next = { ...f, [k]: v }
      // Suggest a short name from the first name until the user types their own.
      if (k === 'name' && (!f.short || f.short === suggestShort(f.name))) next.short = suggestShort(v)
      return next
    })
  }

  const errors = {
    name: form.name.trim().split(/\s+/).length < 2 ? 'Enter name and surname' : '',
    username: form.username.length < 3 ? 'At least 3 characters' : '',
    short: !form.short ? 'Required' : '',
    email: !/^\S+@\S+\.\S+$/.test(form.email) ? 'Valid email required' : '',
    phone: form.phone.replace(/\D/g, '').length < 7 ? 'Valid phone required' : '',
    agree: !agree ? 'Please accept the Terms' : '',
  }
  const valid = Object.values(errors).every((e) => !e)

  const submit = () => {
    setTouched(true)
    if (!valid) return
    const emoji = AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)]
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    update((s) => ({ ...s, stage: 'friends', profile: { ...form, emoji, color, home: s.me } }))
  }

  const err = (k: keyof typeof errors) => touched && errors[k] && <span className="field-err">{errors[k]}</span>

  return (
    <div className="screen register">
      <div className="reg-head">
        <div>
          <h1>Timeless</h1>
          <p className="muted">Know what time it is for the people you love.</p>
        </div>
        <Logo size={52} />
      </div>

      <button className="btn btn-apple" onClick={() => toast('Sign in with Apple — coming later')}>
         Continue with Apple
      </button>
      <div className="divider">
        <span>or create an account</span>
      </div>

      <label className="field">
        <span>Name and Surname</span>
        <input value={form.name} onChange={set('name')} placeholder="Kate Amer" autoComplete="name" />
        <small>Visible to everyone</small>
        {err('name')}
      </label>
      <label className="field">
        <span>Username</span>
        <div className="input-prefix">
          <i>@</i>
          <input value={form.username} onChange={set('username')} placeholder="kate.amer" autoCapitalize="none" />
        </div>
        <small>So friends can find you</small>
        {err('username')}
      </label>
      <label className="field">
        <span>
          Date of birth <em>optional</em>
        </span>
        <input type="date" value={form.dob} onChange={set('dob')} />
      </label>
      <div className="field">
        <label>
          <span>Short name</span>
          <input value={form.short} onChange={set('short')} placeholder="KATE" maxLength={5} />
        </label>
        <div className="short-preview">
          <CircleWidget
            user={{ short: form.short || 'KATE', emoji: '🙂', color: '#f5d90a' }}
            cityId={state.me}
            now={now}
            top="offset"
            colorful={false}
          />
          <small>
            Shown on your friends' lock-screen widgets. <b>{5 - form.short.length}</b> of 5 characters left.
          </small>
        </div>
        {err('short')}
      </div>
      <label className="field">
        <span>Email *</span>
        <input type="email" value={form.email} onChange={set('email')} placeholder="kate@example.com" autoComplete="email" />
        {err('email')}
      </label>
      <label className="field">
        <span>Phone number *</span>
        <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+43 660 123 4567" autoComplete="tel" />
        {err('phone')}
      </label>
      <p className="footnote">* Used to match you with people who already know you — contacts, Facebook, Instagram.</p>

      <label className="check">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>
          I agree to the{' '}
          <a href="#" onClick={(e) => (e.preventDefault(), toast('Terms of Service would open here'))}>
            Terms of Service
          </a>
        </span>
      </label>
      {err('agree')}

      <button className={`btn btn-primary btn-next ${valid ? '' : 'dim'}`} onClick={submit} aria-label="Continue">
        Continue →
      </button>
    </div>
  )
}

function suggestShort(name: string): string {
  return (name.trim().split(/\s+/)[0] ?? '').toUpperCase().slice(0, 5)
}
