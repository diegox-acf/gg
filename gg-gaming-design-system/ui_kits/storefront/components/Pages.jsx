// GG Gaming — All Pages (cyborg redesign)
const { useState, useEffect } = React;

/* ── Shared UI helpers ── */
function CyberInput({ label, placeholder, defaultValue, span2 }) {
  return (
    <div style={{ gridColumn: span2 ? 'span 2' : undefined }}>
      <label style={{ display: 'block', fontFamily: "'Orbitron',sans-serif", fontSize: 9, fontWeight: 600,
        letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</label>
      <input defaultValue={defaultValue} placeholder={placeholder}
        style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
          padding: '10px 14px', color: 'var(--text)', fontFamily: "'Roboto',sans-serif", fontSize: 14,
          outline: 'none', transition: 'border-color 150ms',
          clipPath: 'polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 0 100%)' }}
        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'} />
    </div>
  );
}

function Breadcrumb({ items }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28,
      fontFamily: "'Roboto',sans-serif", fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: 'var(--border-bright)', fontSize: 10 }}>›</span>}
          {item.onClick
            ? <span onClick={item.onClick} style={{ cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 150ms' }}
                onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>{item.label}</span>
            : <span style={{ color: 'var(--text)', fontWeight: 500 }}>{item.label}</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 3, height: 16, background: 'var(--primary)', flexShrink: 0 }} />
      <span style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: 13,
        color: 'var(--text)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{children}</span>
    </div>
  );
}

/* ── Category Page ── */
function CategoryPage({ categoryId, onNavigate, onAddToCart }) {
  const catName = CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
  const products = PRODUCTS.filter(p => p.category === categoryId);
  const display = products.length ? products : PRODUCTS;

  return (
    <div style={{ minHeight: '100vh', padding: '32px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Breadcrumb items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: catName }]} />
        <div style={{ display: 'flex', gap: 32 }}>
          {/* Sidebar */}
          <div style={{ width: 210, flexShrink: 0 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
              clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
              padding: 20, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text)', textTransform: 'uppercase' }}>Filters</span>
              </div>
              {[['Price Range', [['Under $250','under-250'],['$250–$500','250-500'],['$500–$1,000','500-1k'],['Over $1,000','over-1k']]],
                ['Brand', [['ASUS ROG','asus'],['MSI','msi'],['Gigabyte','giga'],['Sapphire','sap'],['XFX','xfx']]]].map(([title, opts]) => (
                <div key={title} style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, fontWeight: 600,
                    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em',
                    marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 1, background: 'var(--primary)' }} />{title}
                  </div>
                  {opts.map(([l, v]) => (
                    <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                      cursor: 'pointer', fontFamily: "'Roboto',sans-serif", fontSize: 12, color: 'var(--text-muted)' }}>
                      <input type="checkbox" style={{ accentColor: 'var(--primary)', width: 13, height: 13 }} /> {l}
                    </label>
                  ))}
                </div>
              ))}
              <Btn size="sm" style={{ width: '100%', justifyContent: 'center' }}>Apply</Btn>
            </div>
          </div>

          {/* Grid */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 900, fontSize: 22, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{catName}</h1>
                <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{display.length} products</div>
              </div>
              <select style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontFamily: "'Roboto',sans-serif", fontSize: 12,
                padding: '8px 12px', cursor: 'pointer', outline: 'none',
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}>
                <option>Sort: Relevance</option>
                <option>Price: Low → High</option>
                <option>Price: High → Low</option>
                <option>Newest</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="product-grid">
              {display.map(p => <ProductCard key={p.id} product={p} onNavigate={onNavigate} onAddToCart={onAddToCart} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Product Detail Page ── */
function ProductPage({ productId, onNavigate, onAddToCart }) {
  const product = PRODUCTS.find(p => p.id === productId) || PRODUCTS[0];
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const catName = CATEGORIES.find(c => c.id === product.category)?.label || product.category;
  const oos = product.stock === 'out-of-stock';

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '32px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Breadcrumb items={[
          { label: 'Home', onClick: () => onNavigate('home') },
          { label: catName, onClick: () => onNavigate('category', product.category) },
          { label: product.name }
        ]} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }} className="product-detail-grid">
          {/* Gallery */}
          <div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', height: 360,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
              clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
              position: 'relative', overflow: 'hidden' }}>
              {/* HUD overlay */}
              <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
                <div style={{ width: 12, height: 12, borderTop: '1px solid var(--primary)', borderLeft: '1px solid var(--primary)', opacity: 0.6 }} />
                <div style={{ width: 12, height: 12, borderTop: '1px solid var(--primary)', borderRight: '1px solid var(--primary)', opacity: 0.6 }} />
              </div>
              <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
                <div style={{ width: 12, height: 12, borderBottom: '1px solid var(--primary)', borderLeft: '1px solid var(--primary)', opacity: 0.6 }} />
                <div style={{ width: 12, height: 12, borderBottom: '1px solid var(--primary)', borderRight: '1px solid var(--primary)', opacity: 0.6 }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 96, height: 96, background: 'var(--surface-2)', margin: '0 auto 10px',
                  clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                </div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: 'var(--text-subtle)', letterSpacing: '0.1em' }}>PRODUCT IMAGE</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0, 1, 2].map(i => (
                <div key={i} onClick={() => setActiveImg(i)}
                  style={{ width: 80, height: 60, background: 'var(--surface)', cursor: 'pointer',
                    border: `1px solid ${activeImg === i ? 'var(--primary)' : 'var(--border)'}`,
                    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'border-color 150ms' }}>
                  <div style={{ width: 24, height: 24, background: 'var(--border)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>{product.brand}</div>
            <h1 style={{ fontFamily: "'Roboto',sans-serif", fontWeight: 700, fontSize: 24, color: 'var(--text)', lineHeight: 1.2, marginBottom: 10 }}>{product.name}</h1>
            <div style={{ fontFamily: "'Roboto Mono','Courier New',monospace", fontSize: 11, color: 'var(--text-subtle)', marginBottom: 20, letterSpacing: '0.06em' }}>SKU: {product.sku}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <span style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 900, fontSize: 36, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <Badge stock={product.stock} />
            </div>

            {/* Qty + Add */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 28, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  style={{ width: 38, height: 42, background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'color 150ms' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>−</button>
                <span style={{ width: 40, textAlign: 'center', fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{qty}</span>
                <button onClick={() => setQty(qty + 1)}
                  style={{ width: 38, height: 42, background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'color 150ms' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>+</button>
              </div>
              <Btn size="lg" onClick={handleAdd} disabled={oos} style={{ flex: 1, justifyContent: 'center' }}>
                {added ? '✓ Added' : 'Add to Cart'}
              </Btn>
            </div>

            {/* Specs */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <SectionLabel>Specifications</SectionLabel>
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ width: 140, fontFamily: "'Roboto',sans-serif", fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</span>
                  <span style={{ fontFamily: "'Roboto Mono','Courier New',monospace", fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Cart Drawer ── */
function CartDrawer({ onClose, onNavigate }) {
  const [items, setItems] = useState([]);
  useEffect(() => cartStore.subscribe(setItems), []);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const shipping = 9.99, tax = subtotal * 0.08;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(7,7,7,0.82)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 200 }} />
      <div style={{ position: 'fixed', right: 0, top: 0, height: '100vh', width: 420,
        background: 'var(--surface)', borderLeft: '1px solid var(--border)', zIndex: 201,
        display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 48px rgba(0,0,0,0.9)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 18, background: 'var(--primary)' }} />
            <span style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Your Cart</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 6, transition: 'color 150ms' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="1.25" style={{ marginBottom: 14, opacity: 0.5 }} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Your cart is empty — browse categories to get started.</div>
              <Btn variant="secondary" size="sm" onClick={() => { onClose(); onNavigate('category', 'gpus'); }}>Browse Categories</Btn>
            </div>
          ) : items.map(({ product, qty }) => (
            <div key={product.id} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 56, height: 56, background: 'var(--surface-2)', border: '1px solid var(--border)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}>
                <div style={{ width: 28, height: 28, background: 'var(--border)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: 'var(--text-subtle)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{product.brand}</div>
                <div style={{ fontFamily: "'Roboto',sans-serif", fontWeight: 500, fontSize: 12, color: 'var(--text)', lineHeight: 1.3, marginBottom: 8 }}>{product.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)' }}>
                    <button onClick={() => cartStore.update(product.id, qty - 1)}
                      style={{ width: 26, height: 24, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, transition: 'color 150ms' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>−</button>
                    <span style={{ width: 26, textAlign: 'center', fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{qty}</span>
                    <button onClick={() => cartStore.update(product.id, qty + 1)}
                      style={{ width: 26, height: 24, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, transition: 'color 150ms' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>+</button>
                  </div>
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>${(product.price * qty).toFixed(2)}</span>
                  <button onClick={() => cartStore.remove(product.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', display: 'flex', padding: 4, transition: 'color 150ms' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subtle)'}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '18px 24px', borderTop: '1px solid var(--border)' }}>
            {[['Subtotal', `$${subtotal.toFixed(2)}`], ['Shipping', '$9.99'], ['Tax (8%)', `$${tax.toFixed(2)}`]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontFamily: "'Roboto',sans-serif", fontSize: 13, color: 'var(--text-muted)' }}>
                <span>{l}</span><span style={{ color: 'var(--text)' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingTop: 12, borderTop: '1px solid var(--border)', fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>
              <span>Total</span><span style={{ color: 'var(--primary)' }}>${(subtotal + shipping + tax).toFixed(2)}</span>
            </div>
            <Btn style={{ width: '100%', justifyContent: 'center' }} size="lg" onClick={() => { onClose(); onNavigate('checkout'); }}>Proceed to Checkout →</Btn>
            <button onClick={() => { onClose(); onNavigate('category', 'gpus'); }}
              style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontFamily: "'Roboto',sans-serif", fontSize: 12, padding: 8,
                letterSpacing: '0.06em', transition: 'color 150ms' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Checkout Page ── */
function CheckoutPage({ onNavigate }) {
  const [step, setStep] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => cartStore.subscribe(setItems), []);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const total = subtotal + 9.99 + subtotal * 0.08;

  const handlePlace = () => {
    setLoading(true);
    setTimeout(() => { cartStore.clear(); onNavigate('confirmation'); }, 2200);
  };

  const steps = ['Shipping', 'Review', 'Payment'];

  return (
    <div style={{ minHeight: '100vh', padding: '32px 48px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: i <= step ? 1 : 0.35, transition: 'opacity 300ms' }}>
                <div style={{ width: 26, height: 26, background: i <= step ? 'var(--primary)' : 'transparent',
                  border: `1px solid ${i <= step ? 'var(--primary)' : 'var(--border-bright)'}`,
                  clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 800,
                  color: i <= step ? 'var(--fg-inverse)' : 'var(--text-muted)',
                  transition: 'all 300ms' }}>
                  {i < step ? '✓' : `0${i + 1}`}
                </div>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: i === step ? 'var(--text)' : 'var(--text-muted)' }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? 'var(--primary)' : 'var(--border)', margin: '0 16px', transition: 'background 300ms' }} />}
            </React.Fragment>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28 }} className="checkout-grid">
          {/* Main */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)', padding: 28 }}>

            {step === 0 && (
              <div>
                <SectionLabel>Shipping Address</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                  <CyberInput label="First Name" placeholder="John" />
                  <CyberInput label="Last Name" placeholder="Doe" />
                  <CyberInput label="Address Line 1" placeholder="123 Main St" span2 />
                  <CyberInput label="Address Line 2" placeholder="Apt 4B" span2 />
                  <CyberInput label="City" placeholder="Austin" />
                  <CyberInput label="State" placeholder="TX" />
                  <CyberInput label="ZIP Code" placeholder="78701" />
                  <CyberInput label="Country" placeholder="United States" />
                </div>
                <Btn size="lg" onClick={() => setStep(1)}>Continue to Review →</Btn>
              </div>
            )}

            {step === 1 && (
              <div>
                <SectionLabel>Order Review</SectionLabel>
                {items.map(({ product, qty }) => (
                  <div key={product.id} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 52, height: 52, background: 'var(--surface-2)', flexShrink: 0, clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Roboto',sans-serif", fontWeight: 500, fontSize: 13, color: 'var(--text)' }}>{product.name}</div>
                      <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Qty: {qty}</div>
                    </div>
                    <span style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>${(product.price * qty).toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ marginTop: 18, padding: 14, background: 'var(--surface-2)', border: '1px solid var(--border)', fontFamily: "'Roboto',sans-serif", fontSize: 13, color: 'var(--text-muted)' }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, letterSpacing: '0.15em', color: 'var(--primary)', marginBottom: 6 }}>SHIP TO</div>
                  123 Main St, Apt 4B · Austin, TX 78701
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  <Btn variant="secondary" onClick={() => setStep(0)}>← Back</Btn>
                  <Btn size="lg" onClick={() => setStep(2)}>Continue to Payment →</Btn>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <SectionLabel>Payment</SectionLabel>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: 20, marginBottom: 20,
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)' }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, letterSpacing: '0.15em', color: 'var(--primary)', marginBottom: 16 }}>STRIPE PAYMENT ELEMENT</div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <CyberInput label="Card Number" placeholder="4242 4242 4242 4242" span2 />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <CyberInput label="Expiry" placeholder="MM / YY" />
                      <CyberInput label="CVC" placeholder="•••" />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Btn variant="secondary" onClick={() => setStep(1)}>← Back</Btn>
                  <Btn size="lg" onClick={handlePlace} style={{ flex: 1, justifyContent: 'center' }}>
                    {loading
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <svg style={{ animation: 'spin 0.7s linear infinite' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                          Processing…
                        </span>
                      : 'Place Order →'}
                  </Btn>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
            padding: 20, height: 'fit-content' }}>
            <SectionLabel>Order Summary</SectionLabel>
            {items.map(({ product, qty }) => (
              <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontFamily: "'Roboto',sans-serif", fontSize: 12 }}>
                <span style={{ flex: 1, color: 'var(--text)', lineHeight: 1.3, marginRight: 8 }}>{product.name} ×{qty}</span>
                <span style={{ color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' }}>${(product.price * qty).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
              {[['Subtotal', `$${subtotal.toFixed(2)}`], ['Shipping', '$9.99'], ['Tax (8%)', `$${(subtotal * 0.08).toFixed(2)}`]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontFamily: "'Roboto',sans-serif", fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>{l}</span><span style={{ color: 'var(--text)' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)', fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: 16 }}>
                <span style={{ color: 'var(--text)' }}>Total</span>
                <span style={{ color: 'var(--primary)' }}>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Order Confirmation ── */
function ConfirmationPage({ onNavigate }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center', animation: 'fadeInUp 500ms both' }}>
        {/* Success icon */}
        <div style={{ width: 80, height: 80, margin: '0 auto 28px',
          background: 'var(--success-bg)', border: '1px solid var(--success)',
          clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(22,199,122,0.25)' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>

        <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)', letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 10 }}>Order Confirmed</h1>
        <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 14, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>Your order has been placed. We'll send a confirmation email shortly.</p>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px 28px',
          clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
          marginBottom: 28, textAlign: 'left' }}>
          {[
            ['Order Number', <span style={{ fontFamily: "'Roboto Mono','Courier New',monospace", color: 'var(--primary)', fontWeight: 600 }}>GMR-2026-00042</span>],
            ['Estimated Delivery', 'Apr 25 – Apr 27, 2026'],
            ['Status', <span style={{ background: 'var(--success-bg)', color: 'var(--success)', fontSize: 10, fontWeight: 700, padding: '2px 10px', fontFamily: "'Orbitron',sans-serif", letterSpacing: '0.1em' }}>CONFIRMED</span>],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</span>
              <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, color: 'var(--text)' }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Btn onClick={() => onNavigate('account')}>View Order</Btn>
          <Btn variant="secondary" onClick={() => onNavigate('home')}>Continue Shopping</Btn>
        </div>
      </div>
    </div>
  );
}

/* ── Account — Order History ── */
function AccountPage({ onNavigate }) {
  const ORDERS = [
    { id: 'GMR-2026-00042', date: 'Apr 20, 2026', status: 'confirmed', total: 1849.98, items: 2 },
    { id: 'GMR-2026-00031', date: 'Mar 14, 2026', status: 'confirmed', total: 429.99, items: 1 },
    { id: 'GMR-2026-00018', date: 'Feb 2, 2026',  status: 'failed',    total: 0,       items: 1 },
    { id: 'GMR-2026-00009', date: 'Jan 18, 2026', status: 'confirmed', total: 239.98, items: 2 },
  ];
  const statusCfg = {
    confirmed: { bg: 'var(--success-bg)', color: 'var(--success)' },
    pending:   { bg: 'var(--warning-bg)', color: 'var(--warning)' },
    failed:    { bg: 'var(--danger-bg)',  color: 'var(--danger)'  },
  };

  return (
    <div style={{ minHeight: '100vh', padding: '32px 48px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <Breadcrumb items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Order History' }]} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 3, height: 24, background: 'var(--primary)' }} />
          <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 900, fontSize: 22, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Orders</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ORDERS.map((order, i) => {
            const { bg, color } = statusCfg[order.status];
            return (
              <div key={order.id} className="cyber-card anim-fadeup"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                  clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
                  padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer',
                  animationDelay: `${i * 60}ms`, transition: 'border-color 150ms, box-shadow 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Roboto Mono','Courier New',monospace", fontSize: 13, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>{order.id}</div>
                  <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 12, color: 'var(--text-muted)' }}>{order.date} · {order.items} item{order.items > 1 ? 's' : ''}</div>
                </div>
                <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, padding: '3px 10px', fontFamily: "'Orbitron',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase',
                  clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))' }}>{order.status}</span>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--text)', minWidth: 80, textAlign: 'right' }}>
                  {order.status === 'failed' ? '—' : '$' + order.total.toFixed(2)}
                </div>
                <button style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
                  fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '7px 14px', cursor: 'pointer',
                  clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                  transition: 'all 150ms', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                  View →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CategoryPage, ProductPage, CartDrawer, CheckoutPage, ConfirmationPage, AccountPage });
