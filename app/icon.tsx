import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: 'transparent',
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
        <div style={{ width: 20, height: 5, background: '#0047FF', borderRadius: 3, opacity: 0.5 }} />
        <div style={{ width: 28, height: 5, background: '#0047FF', borderRadius: 3 }} />
        <div style={{ width: 20, height: 5, background: '#0047FF', borderRadius: 3, opacity: 0.5, marginLeft: 8 }} />
      </div>
    </div>,
    { ...size }
  );
}
