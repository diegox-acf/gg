import type { StockStatus } from '@/lib/mock-data'

const cfg: Record<StockStatus, { bg: string; color: string; label: string }> = {
  'in-stock':     { bg: 'var(--success-bg)', color: 'var(--success)',  label: 'In Stock' },
  'low-stock':    { bg: 'var(--warning-bg)', color: 'var(--warning)',  label: 'Low Stock' },
  'out-of-stock': { bg: 'var(--danger-bg)',  color: 'var(--danger)',   label: 'Out of Stock' },
}

export function Badge({ stock }: { stock: StockStatus }) {
  const { bg, color, label } = cfg[stock]
  return (
    <span
      className="clip-cyber-xs inline-flex items-center gap-[5px] text-[11px] font-semibold px-[9px] py-[3px] tracking-[0.04em] font-sans"
      style={{ background: bg, color }}
    >
      <span
        className="w-[5px] h-[5px] rounded-full shrink-0"
        style={{
          background: color,
          animation: stock === 'low-stock' ? 'lowStockPulse 1.5s ease-in-out infinite' : 'none',
        }}
      />
      {label}
    </span>
  )
}
