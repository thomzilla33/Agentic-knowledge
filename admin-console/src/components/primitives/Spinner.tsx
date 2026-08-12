export function Spinner({ size = 16 }: { size?: number }) {
  const bw = size <= 12 ? 1.5 : size <= 16 ? 2 : 2.5;
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy="true"
      className="spinner-base"
      style={{
        width:             size,
        height:            size,
        borderWidth:       bw,
        borderTopColor:    'var(--spinner-primary-fill)',
        borderRightColor:  'var(--spinner-primary-track)',
        borderBottomColor: 'var(--spinner-primary-track)',
        borderLeftColor:   'var(--spinner-primary-track)',
      }}
    />
  );
}
