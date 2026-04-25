// GG Gaming — Home Page (cyborg redesign)
const { useState, useEffect, useRef } = React;

function ProductCard({ product, onNavigate, onAddToCart }) {
  const [h, setH] = useState(false);
  const oos = product.stock === 'out-of-stock';
  return (
    <div className={`cyber-card${oos ? ' oos' : ''}`}
      onClick={() => onNavigate('product', product.id)}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: 'var(--surface)', cursor: 'pointer',
        border: `1px solid ${h && !oos ? 'var(--primary)' : 'var(--border)'}`,
        clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
        transform: h && !oos ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: h && !oos ? '0 8px 32px var(--primary-glow)' : 'none',
        opacity: oos ? 0.55 : 1,
        transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
        position: 'relative', overflow: 'hidden', animation: 'fadeInUp 400ms both' }}>

      {/* HUD corners */}
      <span className={`hud-corner hud-tl${h && !oos ? ' visible' : ''}`} />
      <span className={`hud-corner hud-br${h && !oos ? ' visible' : ''}`} />

      {/* Scan sweep */}
      <div className={`scan-sweep${h && !oos ? ' active' : ''}`} />

      {/* Image area */}
      <div style={{ height: 130, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: 64, height: 64, background: 'var(--border)', clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        </div>
        {/* corner crosshairs */}
        <div style={{ position: 'absolute', top: 6, left: 6, width: 10, height: 10, borderTop: '1px solid var(--border-bright)', borderLeft: '1px solid var(--border-bright)', opacity: 0.6 }} />
        <div style={{ position: 'absolute', bottom: 6, right: 6, width: 10, height: 10, borderBottom: '1px solid var(--border-bright)', borderRight: '1px solid var(--border-bright)', opacity: 0.6 }} />
      </div>

      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}>{product.brand}</div>
        <div style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 600, fontSize: 13, color: 'var(--text)', lineHeight: 1.3, marginBottom: 10, minHeight: 34 }}>{product.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: 17, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <Badge stock={product.stock} />
        </div>
        <button onClick={e => { e.stopPropagation(); if (!oos) onAddToCart(product); }}
          style={{ width: '100%', padding: '9px 0', background: oos ? 'var(--border)' : 'var(--primary)',
            color: oos ? 'var(--text-subtle)' : 'var(--fg-inverse)', border: 'none',
            fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: oos ? 'not-allowed' : 'pointer',
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            transition: 'all 150ms' }}>
          {oos ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

function CategoryChip({ cat, onNavigate }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={() => onNavigate('category', cat.id)}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: h ? 'var(--primary-subtle)' : 'var(--surface)',
        border: `1px solid ${h ? 'var(--primary)' : 'var(--border)'}`,
        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
        padding: '14px 12px', cursor: 'pointer', textAlign: 'center',
        transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
        color: h ? 'var(--primary)' : 'var(--text-muted)',
        fontFamily: "'Roboto', sans-serif", fontSize: 12, fontWeight: 500,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
        boxShadow: h ? '0 4px 16px var(--primary-glow)' : 'none' }}>
      <span style={{ fontSize: 18 }}>{cat.icon}</span>
      {cat.label}
    </button>
  );
}

function ArrowCTA({ label1, label2, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: h ? '#e8ff1a' : 'var(--primary)', color: 'var(--fg-inverse)',
        border: 'none', width: 100, height: 88, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '14px 16px',
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)',
        transform: h ? 'translateY(-2px)' : 'none',
        boxShadow: h ? '0 8px 32px var(--primary-glow)' : 'none',
        transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)' }}>
      <span style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 900, fontSize: 13, lineHeight: 1.1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label1}<br />{label2}
      </span>
      <span style={{ alignSelf: 'flex-end', fontSize: 20, lineHeight: 1, transform: h ? 'translate(2px, 2px)' : 'none', transition: 'transform 200ms' }}>↘</span>
    </button>
  );
}

function HeroScanLine() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      <div style={{ position: 'absolute', left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent 0%, var(--primary) 20%, var(--primary) 80%, transparent 100%)',
        opacity: 0.35, animation: 'heroScan 6s ease-in-out infinite' }} />
    </div>
  );
}

function HomePage({ onNavigate, onAddToCart }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ── HERO ── */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '80px 48px 72px',
        borderBottom: '1px solid var(--border)' }}>
        <HeroScanLine />
        {/* bg accent */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, var(--primary-subtle) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />
        {/* diagonal stripe */}
        <div style={{ position: 'absolute', right: -60, top: 0, bottom: 0, width: 120, background: 'var(--primary-subtle)', transform: 'skewX(-8deg)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'center' }}>
            <div>
              {/* eyebrow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 24, height: 1, background: 'var(--primary)' }} />
                <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--primary)' }}>
                  Gaming Hardware / Est. 2026
                </span>
              </div>

              <h1 className="hero-glitch" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900,
                fontSize: 'clamp(44px, 7vw, 88px)', lineHeight: 0.95, textTransform: 'uppercase',
                letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 16 }}>
                MAX FPS.<br />
                <span style={{ color: 'var(--primary)', display: 'inline-block' }}>ZERO</span><br />
                COMPROMISE.
              </h1>

              <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 15, color: 'var(--text-muted)',
                maxWidth: 440, lineHeight: 1.7, marginBottom: 36 }}>
                Gaming PC hardware for enthusiasts who demand the best. GPUs, CPUs, peripherals — everything your next build needs.
              </p>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
                <ArrowCTA label1="SHOP" label2="NOW" onClick={() => onNavigate('category', 'gpus')} />
                <Btn variant="secondary" size="lg" onClick={() => onNavigate('category', 'cpus')}>
                  Explore CPUs
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Btn>
              </div>

              {/* stats row */}
              <div style={{ display: 'flex', gap: 32, marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                {[['200+','Products'],['8','Categories'],['1–3d','Ships Fast']].map(([n, l]) => (
                  <div key={l}>
                    <div style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: 20, color: 'var(--primary)', letterSpacing: '-0.02em' }}>{n}</div>
                    <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero side decoration */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }} className="hero-deco">
              {/* HUD panel */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
                padding: '18px 20px', width: 200 }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, letterSpacing: '0.15em', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 10 }}>Featured Drop</div>
                {PRODUCTS.slice(0, 3).map(p => (
                  <div key={p.id} onClick={() => onNavigate('product', p.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '7px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                      transition: 'color 150ms' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = ''}>
                    <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: 'var(--text-muted)', flex: 1, paddingRight: 8, lineHeight: 1.2 }}>{p.name.substring(0, 22)}…</span>
                    <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>${p.price.toFixed(0)}</span>
                  </div>
                ))}
              </div>
              {/* barcode block */}
              <div style={{ width: 200, height: 36, opacity: 0.12, backgroundImage:
                'repeating-linear-gradient(90deg, var(--text) 0, var(--text) 2px, transparent 2px, transparent 5px, var(--text) 5px, var(--text) 7px, transparent 7px, transparent 12px)' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 48px' }}>
        {/* ── CATEGORIES ── */}
        <div style={{ marginBottom: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 3, height: 20, background: 'var(--primary)' }} />
            <h2 style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Shop by Category</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }} className="cat-grid">
            {CATEGORIES.map(cat => <CategoryChip key={cat.id} cat={cat} onNavigate={onNavigate} />)}
          </div>
        </div>

        {/* ── PROMO BANNER ── */}
        <div style={{ background: 'var(--primary)', marginBottom: 52, padding: '20px 28px',
          clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--fg-inverse)', opacity: 0.7, marginBottom: 4 }}>Flash Sale — Ends Tonight</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: 17, color: 'var(--fg-inverse)', letterSpacing: '0.02em' }}>Up to 15% off select GPUs &amp; peripherals</div>
          </div>
          <button onClick={() => onNavigate('category', 'gpus')}
            style={{ background: 'var(--fg-inverse)', color: 'var(--primary)',
              fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
              border: 'none', padding: '10px 22px', cursor: 'pointer',
              clipPath: 'polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px))',
              transition: 'opacity 150ms', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Shop Sale →
          </button>
        </div>

        {/* ── FEATURED PRODUCTS ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 3, height: 20, background: 'var(--primary)' }} />
              <h2 style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Featured Products</h2>
            </div>
            <button onClick={() => onNavigate('category', 'gpus')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                fontFamily: "'Roboto',sans-serif", fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'color 150ms' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              View all
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="product-grid">
            {PRODUCTS.map(p => <ProductCard key={p.id} product={p} onNavigate={onNavigate} onAddToCart={onAddToCart} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProductCard, HomePage });
