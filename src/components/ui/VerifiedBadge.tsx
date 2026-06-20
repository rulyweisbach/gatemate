export default function VerifiedBadge({ small }: { small?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 font-semibold"
      style={{
        background: 'rgba(125, 245, 192, 0.2)',
        border: '1px solid rgba(125, 245, 192, 0.5)',
        borderRadius: 40,
        padding: small ? '2px 8px' : '4px 10px',
        fontSize: small ? 11 : 12,
        color: '#7df5c0',
      }}
    >
      <span>✓</span>
      <span>Verified</span>
    </span>
  );
}
