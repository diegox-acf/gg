// GG Gaming — Nav, Logo, Btn, Badge (cyborg redesign)
const { useState, useEffect, useRef } = React;

function Logo({ onClick }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, userSelect: 'none' }}>
      <div style={{
        background: 'var(--primary)', color: 'var(--fg-inverse)',
        fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 14,
        padding: '5px 10px', letterSpacing: '0.12em',
        clipPath: 'polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px))',
        boxShadow: h ? '0 0 16px var(--primary-glow)' : 'none',
        transition: 'box-shadow 200ms',
      }}>GG</div>
      <span style={{
        fontFamily: "'Roboto', sans-serif", fontWeight: 500, fontSize: 12,
        letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text)',
        transition: 'color 200ms',
      }}>GAMING</span>
      <div style={{ width: 60, height: 18, opacity: 0.2, backgroundImage:
        'repeating-linear-gradient(90deg, var(--text-muted) 0, var(--text-muted) 1.5px, transparent 1.5px, transparent 4px, var(--text-muted) 4px, var(--text-muted) 5.5px, transparent 5.5px, transparent 9px)',
        flexShrink: 0 }} />
    </div>
  );
}

function NavLink({ children, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: "'Roboto', sans-serif", fontWeight: 500, fontSize: 12,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: h ? 'var(--primary)' : 'var(--text-muted)',
        padding: '4px 0', position: 'relative', transition: 'color 150ms', display: 'flex', flexDirection: 'column' }}>
      {children}
      <span style={{ height: 1, background: 'var(--primary)', transform: h ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left', transition: 'transform 200ms cubic-bezier(0.16,1,0.3,1)', marginTop: 2 }} />
    </button>
  );
}

function Btn({ children, variant = 'primary', size = 'md', onClick, disabled, style: extStyle = {} }) {
  const [h, setH] = useState(false);
  const [p, setP] = useState(false);
  const clip = 'polygon(0 0, calc(100% - 9px) 0, 100% 9px, 100% 100%, 9px 100%, 0 calc(100% - 9px))';
  const sz = { sm: { padding: '8px 16px', fontSize: 11 }, md: { padding: '11px 22px', fontSize: 12 }, lg: { padding: '14px 28px', fontSize: 13 } }[size];
  const variants = {
    primary: { background: disabled ? 'var(--border-bright)' : h ? '#e8ff1a' : 'var(--primary)', color: 'var(--fg-inverse)', clipPath: clip, boxShadow: h && !disabled ? '0 4px 24px var(--primary-glow)' : 'none' },
    secondary: { background: h ? 'var(--primary-subtle)' : 'transparent', color: h ? 'var(--primary)' : 'var(--text)', border: `1px solid ${h ? 'var(--primary)' : 'var(--border-bright)'}`, clipPath: clip },
    ghost: { background: 'transparent', color: h ? 'var(--text)' : 'var(--text-muted)' },
    danger: { background: 'var(--danger)', color: '#fff', clipPath: clip },
  }[variant] || {};
  return (
    <button disabled={disabled} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => { setH(false); setP(false); }}
      onMouseDown={() => setP(true)} onMouseUp={() => setP(false)}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
        transform: p ? 'scale(0.96)' : h && !disabled ? 'translateY(-1px)' : 'none',
        transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
        ...sz, ...variants, ...extStyle }}>
      {children}
    </button>
  );
}

function Badge({ stock }) {
  const cfg = {
    'in-stock':     { bg: 'var(--success-bg)', color: 'var(--success)',  label: 'In Stock' },
    'low-stock':    { bg: 'var(--warning-bg)', color: 'var(--warning)',  label: 'Low Stock' },
    'out-of-stock': { bg: 'var(--danger-bg)',  color: 'var(--danger)',   label: 'Out of Stock' },
  };
  const { bg, color, label } = cfg[stock] || cfg['in-stock'];
  return (
    <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '3px 9px',
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: "'Roboto', sans-serif", letterSpacing: '0.04em',
      clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0,
        animation: stock === 'low-stock' ? 'lowStockPulse 1.5s ease-in-out infinite' : 'none' }} />
      {label}
    </span>
  );
}

function IconBtn({ onClick, badge, children }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: h ? 'var(--primary-subtle)' : 'transparent', border: 'none', cursor: 'pointer',
        color: h ? 'var(--primary)' : 'var(--text-muted)', padding: 8, borderRadius: 0,
        display: 'flex', alignItems: 'center', position: 'relative',
        transition: 'all 150ms', clipPath: h ? 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))' : 'none' }}>
      {children}
      {badge > 0 && (
        <span style={{ position: 'absolute', top: 2, right: 2, background: 'var(--primary)',
          color: 'var(--fg-inverse)', fontSize: 9, fontWeight: 900, fontFamily: "'Orbitron',sans-serif",
          width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

function ColorPickerBtn({ primaryColor, setPrimaryColor }) {
  const [open, setOpen] = useState(false);
  const [h, setH] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', off);
    return () => window.removeEventListener('mousedown', off);
  }, [open]);

  const apply = (c) => {
    setPrimaryColor(c);
    document.documentElement.style.setProperty('--primary', c);
    document.documentElement.style.setProperty('--primary-glow', hexToGlow(c, 0.22));
    document.documentElement.style.setProperty('--primary-subtle', hexToGlow(c, 0.08));
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        title="Accent color"
        style={{ background: open || h ? 'var(--primary-subtle)' : 'transparent', border: 'none', cursor: 'pointer',
          padding: 8, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 150ms',
          clipPath: (open||h) ? 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))' : 'none' }}>
        {/* Color swatch chip */}
        <span style={{ width: 13, height: 13, background: primaryColor,
          boxShadow: `0 0 8px ${primaryColor}`,
          clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))' }} />
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={open||h ? 'var(--primary)' : 'var(--text-muted)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition:'transform 200ms', transform: open ? 'rotate(180deg)':'rotate(0)' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, width:240,
          background:'var(--surface)', border:'1px solid var(--border-bright)',
          boxShadow:'0 12px 48px rgba(0,0,0,0.75)',
          clipPath:'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)',
          padding:'16px 18px 18px',
          animation:'tweakIn 200ms var(--ease-cyber) both',
          zIndex: 200 }}>

          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>
            <div style={{ width:3, height:11, background:'var(--primary)' }}/>
            <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'var(--text)', textTransform:'uppercase' }}>Accent Color</span>
            <span style={{ marginLeft:'auto', fontFamily:"'Roboto Mono','Courier New',monospace", fontSize:10, color:'var(--text-muted)', textTransform:'uppercase' }}>{primaryColor}</span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:12 }}>
            {COLOR_PRESETS.map(({ label, value }) => {
              const sel = primaryColor.toLowerCase() === value.toLowerCase();
              return (
                <button key={value} onClick={() => apply(value)} title={label}
                  style={{ position:'relative', aspectRatio:'1/1', background:value,
                    border: sel ? '2px solid var(--text)' : '2px solid transparent',
                    cursor:'pointer', padding:0,
                    boxShadow: sel ? `0 0 14px ${value}` : 'none',
                    clipPath:'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
                    transition:'transform 150ms, box-shadow 150ms',
                    transform: sel ? 'scale(1.08)' : 'scale(1)' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                  onMouseLeave={e => e.currentTarget.style.transform = sel ? 'scale(1.08)' : 'scale(1)'}>
                  {sel && <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--fg-inverse)', fontWeight:900, fontSize:12 }}>✓</span>}
                </button>
              );
            })}
          </div>

          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:8, fontWeight:600, letterSpacing:'0.18em', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:6 }}>Custom Hex</div>
          <input defaultValue={primaryColor} placeholder="#d4ff00" maxLength={7}
            onChange={e => { const v=e.target.value.trim(); if (/^#[0-9a-f]{6}$/i.test(v)) apply(v); }}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
            style={{ width:'100%', background:'var(--surface-2)', border:'1px solid var(--border)',
              padding:'8px 12px', color:'var(--text)', fontFamily:"'Roboto Mono','Courier New',monospace",
              fontSize:12, outline:'none', textTransform:'uppercase',
              clipPath:'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
        </div>
      )}
    </div>
  );
}

function Nav({ onNavigate, cartCount, theme, setTheme, primaryColor, setPrimaryColor }) {
  const navItems = [['GPUs','gpus'],['CPUs','cpus'],['Peripherals','peripherals'],['Storage','storage'],['Cases','cases']];
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100,
      background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border)', height: 60,
      display: 'flex', alignItems: 'center', padding: '0 32px', gap: 0 }}>

      <Logo onClick={() => onNavigate('home')} />

      {/* Desktop nav */}
      <div className="nav-links" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 32 }}>
        {navItems.map(([lbl, id]) => <NavLink key={id} onClick={() => onNavigate('category', id)}>{lbl}</NavLink>)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <ColorPickerBtn primaryColor={primaryColor} setPrimaryColor={setPrimaryColor} />
        <IconBtn onClick={() => onNavigate('account')}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </IconBtn>
        <IconBtn onClick={() => onNavigate('cart')} badge={cartCount}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </IconBtn>
        <IconBtn onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark'
            ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </IconBtn>
        {/* mobile hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>

      {menuOpen && (
        <div style={{ position: 'absolute', top: 60, left: 0, right: 0, background: 'var(--surface)',
          borderBottom: '1px solid var(--border)', padding: '16px 32px', display: 'flex', flexDirection: 'column', gap: 4, zIndex: 200 }}>
          {navItems.map(([lbl, id]) => (
            <button key={id} onClick={() => { onNavigate('category', id); setMenuOpen(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'Roboto',sans-serif", fontSize: 14, fontWeight: 500,
                color: 'var(--text)', textAlign: 'left', padding: '10px 0',
                borderBottom: '1px solid var(--border)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {lbl}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

Object.assign(window, { Logo, NavLink, Btn, Badge, IconBtn, Nav, ColorPickerBtn });
