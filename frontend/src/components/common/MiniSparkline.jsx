export default function MiniSparkline({ values = [], color = '#2563eb' }) {
  const safeValues = values.length ? values : [0, 0, 0, 0];
  const max = Math.max(...safeValues, 1);
  const points = safeValues
    .map((value, index) => {
      const x = (index / Math.max(safeValues.length - 1, 1)) * 100;
      const y = 32 - (Number(value || 0) / max) * 28;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="h-10 w-28" viewBox="0 0 100 36" role="img" aria-label="Mini trend">
      <polyline fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}
