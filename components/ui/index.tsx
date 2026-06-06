'use client';

import Link from 'next/link';
import type { Listing } from '@/lib/data';

export function Logo({ size = 1, showWordmark = true }: { size?: number; showWordmark?: boolean }) {
  const w = 200 * size;
  const h = 48 * size;
  return (
    <svg width={w} height={h} viewBox="0 0 216 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="SafeBusineSSSelling">
      <rect x="0" y="20" width="36" height="8" rx="4" fill="#0047FF" />
      <rect x="0" y="8" width="24" height="8" rx="4" fill="#0047FF" opacity="0.5" />
      <rect x="12" y="32" width="24" height="8" rx="4" fill="#0047FF" opacity="0.5" />
      {showWordmark && (
        <text x="48" y="30" fontFamily="var(--font-inter), Inter, sans-serif" fontSize="16" fontWeight="500" fill="currentColor" letterSpacing="-0.3">
          SafeBusineSSSelling
        </text>
      )}
    </svg>
  );
}

export const Icon = {
  Check: ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Star: ({ size = 12, color = 'currentColor', filled = true }: { size?: number; color?: string; filled?: boolean }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Arrow: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  ArrowUpRight: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  ),
  Search: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="20" y1="20" x2="16.65" y2="16.65" />
    </svg>
  ),
  Filter: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Bookmark: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Lock: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Shield: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Sparkle: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  ),
  Upload: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Message: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Doc: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Building: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <path d="M9 22V12h6v10M9 6h.01M15 6h.01M9 10h.01M15 10h.01" />
    </svg>
  ),
  Plus: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  X: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Menu: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Dot: ({ size = 6, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 6 6">
      <circle cx="3" cy="3" r="3" fill={color} />
    </svg>
  ),
};

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg' | 'sm';
  children?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  type = 'button',
  icon,
  iconRight,
  disabled,
  className = '',
  style,
  href,
}: ButtonProps) {
  const sz = size === 'lg' ? 'btn-lg' : size === 'sm' ? 'btn-sm' : '';
  const cls = `btn btn-${variant} ${sz} ${className}`;
  if (href) {
    return (
      <Link href={href} onClick={onClick} className={cls} style={style}>
        {icon}{children}{iconRight}
      </Link>
    );
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cls}
      style={disabled ? { opacity: 0.4, cursor: 'not-allowed', ...style } : style}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

export function VerifiedBadge() {
  return (
    <span className="badge badge-verified">
      <Icon.Check size={10} />
      Verified
    </span>
  );
}

export function PremiumBadge() {
  return (
    <span className="badge badge-premium">
      <Icon.Star size={10} color="#C8922A" filled />
      Premium
    </span>
  );
}

export function ScoreBar({
  score,
  label,
  breakdown,
  compact = false,
}: {
  score: number;
  label?: string;
  breakdown?: { label: string; weight: number; done: boolean }[];
  compact?: boolean;
}) {
  const cls = score >= 80 ? 'high' : score >= 50 ? 'brand' : '';
  return (
    <div style={{ width: '100%' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        {label && <span style={{ fontSize: 12, color: 'var(--subtle)' }}>{label}</span>}
        <span className="tabular" style={{ fontSize: compact ? 12 : 13, fontWeight: 500 }}>
          {score}%
        </span>
      </div>
      <div className="score-bar">
        <div className={`score-fill ${cls}`} style={{ width: `${score}%` }} />
      </div>
      {breakdown && (
        <div className="col gap-2" style={{ marginTop: 12 }}>
          {breakdown.map((b, i) => (
            <div key={i} className="row" style={{ justifyContent: 'space-between', fontSize: 12 }}>
              <span className="row gap-2">
                <span style={{ color: b.done ? 'var(--green)' : 'var(--muted)' }}>
                  {b.done ? (
                    <Icon.Check size={11} />
                  ) : (
                    <span
                      style={{
                        width: 11,
                        height: 11,
                        border: '0.5px solid var(--border-strong)',
                        borderRadius: '50%',
                        display: 'inline-block',
                      }}
                    />
                  )}
                </span>
                <span style={{ color: b.done ? 'var(--fg)' : 'var(--muted)' }}>{b.label}</span>
              </span>
              <span className="tabular muted">{b.weight}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PhaseTracker({
  phases,
  currentPhase = 1,
  compact = false,
}: {
  phases: { title: string; desc?: string; ownership: number }[];
  currentPhase?: number;
  compact?: boolean;
}) {
  return (
    <div className="col gap-4">
      <div className="row gap-2" style={{ alignItems: 'stretch' }}>
        {phases.map((p, i) => {
          const isActive = i + 1 === currentPhase;
          const isDone = i + 1 < currentPhase;
          const fill = isDone ? 1 : isActive ? 0.5 : 0;
          return (
            <div key={i} className="phase">
              <div className="phase-bar">
                <div className="phase-bar-fill" style={{ transform: `scaleX(${fill})` }} />
              </div>
              <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="col" style={{ gap: 2 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Phase {i + 1}
                  </div>
                  <div style={{ fontSize: compact ? 12 : 13, fontWeight: 500, marginTop: 2 }}>{p.title}</div>
                  {!compact && p.desc && <div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 2 }}>{p.desc}</div>}
                </div>
                <div
                  className="tabular"
                  style={{ fontSize: compact ? 12 : 14, fontWeight: 500, color: isActive || isDone ? 'var(--fg)' : 'var(--muted)' }}
                >
                  {p.ownership}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ListingCard({ listing, href }: { listing: Listing; href?: string }) {
  const inner = (
    <>
      <div className="img-ph" style={{ height: 160, borderRadius: 0, borderBottom: '0.5px solid var(--border)' }}>
        <div className="row gap-2" style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
          {listing.verified && <VerifiedBadge />}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            fontSize: 11,
            color: 'var(--subtle)',
            background: 'var(--bg)',
            padding: '3px 8px',
            borderRadius: 4,
            border: '0.5px solid var(--border)',
          }}
        >
          {listing.photos} photos
        </div>
      </div>
      <div className="col gap-3" style={{ padding: 18 }}>
        <div className="col" style={{ gap: 4 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <h4 style={{ flex: 1 }}>{listing.name}</h4>
          </div>
          <div className="row gap-2 muted" style={{ fontSize: 12 }}>
            <span>{listing.sector}</span>
            <Icon.Dot size={3} />
            <span>{listing.location}</span>
          </div>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="col" style={{ gap: 2 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Revenue</div>
            <div className="tabular" style={{ fontSize: 14, fontWeight: 500 }}>
              {listing.revenue}
            </div>
          </div>
          <div className="col" style={{ gap: 2, alignItems: 'flex-end' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Asking</div>
            <div className="tabular" style={{ fontSize: 14, fontWeight: 500 }}>
              {listing.asking}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 4 }}>
          <ScoreBar score={listing.score} label="Listing score" compact />
        </div>
      </div>
    </>
  );

  const className = 'card card-hover col';
  const style = { overflow: 'hidden', cursor: 'pointer', textDecoration: 'none' } as const;

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={className} style={style}>
      {inner}
    </div>
  );
}

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 500 }}>
      {children}
    </div>
  );
}

export function Stat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="col gap-2">
      <div className="stat-num">{value}</div>
      <div style={{ fontSize: 13, color: 'var(--subtle)' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</div>}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="col gap-2" style={{ display: 'flex' }}>
      <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{hint}</span>}
    </label>
  );
}
