// Renders a profile photo: an <img> when it's a URL (e.g. a Google picture),
// otherwise the emoji/text placeholder.
interface AvatarProps {
  photo?: string;
  size: number;
  radius: number;
}

export default function Avatar({ photo, size, radius }: AvatarProps) {
  const isUrl = typeof photo === 'string' && /^https?:\/\//.test(photo);
  return (
    <div
      className="flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        background: 'rgba(255,255,255,0.12)',
        borderRadius: radius,
        border: '1px solid rgba(255,255,255,0.15)',
        fontSize: size * 0.55,
      }}
    >
      {isUrl ? (
        <img
          src={photo}
          alt=""
          referrerPolicy="no-referrer"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span>{photo || '🧳'}</span>
      )}
    </div>
  );
}
