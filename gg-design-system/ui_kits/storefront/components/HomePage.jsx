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
      <div style={{ height: 150, background: 'var(--surface-2)', position: 'relative', overflow: 'hidden' }}>
        {/* Real product photo */}
        <img src={imageForProduct(product)} alt={product.name} loading="lazy"
          onError={e => { e.currentTarget.style.display = 'none'; }}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover',
            filter: h && !oos ? 'brightness(1.05) contrast(1.06) saturate(1.15)' : 'brightness(0.85) contrast(1.02) saturate(0.95)',
            transform: h && !oos ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 600ms cubic-bezier(0.16,1,0.3,1), filter 300ms' }} />
        {/* tint overlay using accent */}
        <div style={{ position:'absolute', inset:0, mixBlendMode:'color',
          background: 'var(--primary)', opacity: h && !oos ? 0.15 : 0.05,
          transition:'opacity 300ms', pointerEvents:'none' }} />
        {/* vignette */}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%)', pointerEvents:'none' }} />
        {/* scanline on hover */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity: h && !oos ? 1 : 0, transition:'opacity 200ms',
          backgroundImage:'repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 3px)' }} />
        {/* corner crosshairs */}
        <div style={{ position: 'absolute', top: 6, left: 6, width: 10, height: 10, borderTop: '1px solid var(--primary)', borderLeft: '1px solid var(--primary)', opacity: h ? 0.9 : 0.5, transition:'opacity 150ms' }} />
        <div style={{ position: 'absolute', bottom: 6, right: 6, width: 10, height: 10, borderBottom: '1px solid var(--primary)', borderRight: '1px solid var(--primary)', opacity: h ? 0.9 : 0.5, transition:'opacity 150ms' }} />
        {/* SKU stamp */}
        <div style={{ position:'absolute', top:8, right:10, fontFamily:"'Roboto Mono','Courier New',monospace", fontSize:8, color:'var(--text)', opacity:0.7, letterSpacing:'0.08em' }}>{product.sku}</div>
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

/* 3D tilt card with image, used in Build Gallery */
function TiltCard({ img, eyebrow, title, meta, onClick }) {
  const ref = useRef(null);
  const [t, setT] = useState({ rx: 0, ry: 0, mx: 50, my: 50, hover: false });
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top)  / r.height;
    setT({ rx: (0.5 - y) * 10, ry: (x - 0.5) * 12, mx: x * 100, my: y * 100, hover: true });
  };
  const onLeave = () => setT(s => ({ ...s, rx: 0, ry: 0, hover: false }));
  return (
    <div onClick={onClick} ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ perspective:1000, cursor:'pointer' }}>
      <div style={{
        position:'relative', height:280, overflow:'hidden',
        border:`1px solid ${t.hover ? 'var(--primary)' : 'var(--border)'}`,
        clipPath:'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))',
        transform:`rotateX(${t.rx}deg) rotateY(${t.ry}deg) translateZ(0)`,
        boxShadow: t.hover ? '0 20px 60px rgba(0,0,0,0.6), 0 0 32px var(--primary-glow)' : '0 8px 24px rgba(0,0,0,0.4)',
        transition:'transform 280ms cubic-bezier(0.16,1,0.3,1), border-color 180ms, box-shadow 220ms',
        transformStyle:'preserve-3d', background:'var(--surface)' }}>
        <img src={img} alt={title} loading="lazy"
          onError={e => { e.currentTarget.style.display='none'; }}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover',
            transform: t.hover ? 'scale(1.12)' : 'scale(1.02)',
            filter: t.hover ? 'brightness(0.85) saturate(1.2) contrast(1.1)' : 'brightness(0.65) saturate(0.9)',
            transition:'transform 700ms cubic-bezier(0.16,1,0.3,1), filter 300ms' }}/>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          background:`radial-gradient(circle at ${t.mx}% ${t.my}%, var(--primary-glow) 0%, transparent 45%)`,
          mixBlendMode:'screen', opacity: t.hover ? 1 : 0, transition:'opacity 220ms' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.75) 100%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.5,
          backgroundImage:'repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 3px)' }} />
        <div style={{ position:'absolute', top:10, left:10, width:14, height:14, borderTop:'1.5px solid var(--primary)', borderLeft:'1.5px solid var(--primary)', opacity: t.hover ? 1 : 0.5, transition:'opacity 180ms' }} />
        <div style={{ position:'absolute', bottom:10, right:10, width:14, height:14, borderBottom:'1.5px solid var(--primary)', borderRight:'1.5px solid var(--primary)', opacity: t.hover ? 1 : 0.5, transition:'opacity 180ms' }} />
        <div style={{ position:'absolute', left:18, right:18, bottom:18, transform:`translateZ(40px)` }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:9, fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--primary)', marginBottom:6 }}>{eyebrow}</div>
          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'-0.01em', textTransform:'uppercase', lineHeight:1.1, marginBottom:6 }}>{title}</div>
          <div style={{ fontFamily:"'Roboto Mono','Courier New',monospace", fontSize:10, color:'rgba(255,255,255,0.7)', letterSpacing:'0.04em' }}>{meta}</div>
        </div>
      </div>
    </div>
  );
}

function HomePage({ onNavigate, onAddToCart }) {
  const heroRef = useRef(null);
  const [heroParallax, setHeroParallax] = useState({ x: 0, y: 0 });
  const onHeroMove = (e) => {
    const r = heroRef.current?.getBoundingClientRect(); if (!r) return;
    setHeroParallax({
      x: ((e.clientX - r.left) / r.width  - 0.5) * 2,
      y: ((e.clientY - r.top)  / r.height - 0.5) * 2,
    });
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ── HERO ── */}
      <div ref={heroRef} onMouseMove={onHeroMove}
        style={{ position: 'relative', overflow: 'hidden', padding: '88px 48px 80px',
          borderBottom: '1px solid var(--border)', minHeight: 520 }}>

        {/* Full-bleed background image with parallax */}
        <div style={{ position:'absolute', inset:-40, zIndex:0,
          backgroundImage:`url(${IMG.hero})`, backgroundSize:'cover', backgroundPosition:'center right',
          transform:`translate3d(${heroParallax.x * 18}px, ${heroParallax.y * 12}px, 0) scale(1.06)`,
          transition:'transform 500ms cubic-bezier(0.16,1,0.3,1)',
          filter:'brightness(0.55) contrast(1.1) saturate(0.85)' }} />
        <div style={{ position:'absolute', inset:0, zIndex:0, mixBlendMode:'color',
          background:'var(--primary)', opacity:0.12, pointerEvents:'none' }} />
        <div style={{ position:'absolute', inset:0, zIndex:1,
          background:'linear-gradient(90deg, var(--bg) 0%, color-mix(in srgb, var(--bg) 85%, transparent) 35%, color-mix(in srgb, var(--bg) 30%, transparent) 75%, transparent 100%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', inset:0, zIndex:1,
          background:'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 100%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none', opacity:0.4,
          backgroundImage:'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize:'48px 48px' }} />

        <HeroScanLine />

        <div style={{ position: 'absolute', right: -60, top: 0, bottom: 0, width: 120, background: 'var(--primary-subtle)', transform: 'skewX(-8deg)', pointerEvents: 'none', zIndex: 1 }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 24, height: 1, background: 'var(--primary)' }} />
                <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--primary)' }}>
                  Gaming Hardware / Est. 2026
                </span>
              </div>

              <h1 className="hero-glitch" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900,
                fontSize: 'clamp(44px, 7vw, 88px)', lineHeight: 0.95, textTransform: 'uppercase',
                letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 16,
                textShadow:'0 2px 20px rgba(0,0,0,0.6)' }}>
                MAX FPS.<br />
                <span style={{ color: 'var(--primary)', display: 'inline-block', textShadow:'0 0 24px var(--primary-glow)' }}>ZERO</span><br />
                COMPROMISE.
              </h1>

              <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 15, color: 'var(--text)',
                opacity: 0.78, maxWidth: 440, lineHeight: 1.7, marginBottom: 36 }}>
                Gaming PC hardware for enthusiasts who demand the best. GPUs, CPUs, peripherals — everything your next build needs.
              </p>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
                <ArrowCTA label1="SHOP" label2="NOW" onClick={() => onNavigate('category', 'gpus')} />
                <Btn variant="secondary" size="lg" onClick={() => onNavigate('category', 'cpus')}>
                  Explore CPUs
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Btn>
              </div>

              <div style={{ display: 'flex', gap: 32, marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                {[['200+','Products'],['8','Categories'],['1–3d','Ships Fast']].map(([n, l]) => (
                  <div key={l}>
                    <div style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: 20, color: 'var(--primary)', letterSpacing: '-0.02em' }}>{n}</div>
                    <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }} className="hero-deco">
              <div style={{ position:'relative', width: 240, height: 180, overflow:'hidden',
                border:'1px solid var(--primary)',
                clipPath:'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)',
                boxShadow:'0 12px 40px rgba(0,0,0,0.6), 0 0 28px var(--primary-glow)' }}>
                <img src={IMG.heroAlt} alt="Featured build" loading="lazy"
                  onError={e => { e.currentTarget.style.display='none'; }}
                  style={{ width:'100%', height:'100%', objectFit:'cover',
                    filter:'brightness(0.7) saturate(1.15) contrast(1.1)',
                    transform: `translate3d(${heroParallax.x * -8}px, ${heroParallax.y * -6}px, 0) scale(1.08)`,
                    transition:'transform 500ms cubic-bezier(0.16,1,0.3,1)' }} />
                <div style={{ position:'absolute', inset:0, mixBlendMode:'color', background:'var(--primary)', opacity:0.18, pointerEvents:'none' }} />
                <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.6,
                  backgroundImage:'repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 3px)' }} />
                <div style={{ position:'absolute', left:10, bottom:10, fontFamily:"'Orbitron',sans-serif", fontSize:9, letterSpacing:'0.2em', color:'var(--primary)', textTransform:'uppercase' }}>▼ Featured Rig</div>
                <div style={{ position:'absolute', top:8, right:10, fontFamily:"'Roboto Mono','Courier New',monospace", fontSize:9, color:'#fff', opacity:0.8 }}>REC ●</div>
              </div>
              <div style={{ background: 'color-mix(in srgb, var(--surface) 88%, transparent)', backdropFilter:'blur(8px)', border: '1px solid var(--border-bright)',
                clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
                padding: '14px 18px', width: 240 }}>
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

        {/* ── BUILD GALLERY (tilt-cards) ── */}
        <div style={{ marginBottom: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 3, height: 20, background: 'var(--primary)' }} />
            <h2 style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Build Gallery</h2>
            <span style={{ marginLeft:'auto', fontFamily:"'Roboto Mono','Courier New',monospace", fontSize:11, color:'var(--text-muted)', letterSpacing:'0.08em' }}>// hover to inspect</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="product-grid">
            <TiltCard img={IMG.gallery1} eyebrow="Apex · Build 04"
              title="Liquid-Cooled Beast" meta="i9-14900K // RTX 4090 // 64GB DDR5"
              onClick={() => onNavigate('category', 'cpus')} />
            <TiltCard img={IMG.gallery2} eyebrow="Streamer · Build 02"
              title="RGB Performance Tower" meta="R9 7950X // RTX 4080S // 32GB DDR5"
              onClick={() => onNavigate('category', 'gpus')} />
            <TiltCard img={IMG.gallery3} eyebrow="Compact · Build 07"
              title="SFF Battlestation" meta="R7 7800X3D // RX 7900 XT // 32GB"
              onClick={() => onNavigate('category', 'cases')} />
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
