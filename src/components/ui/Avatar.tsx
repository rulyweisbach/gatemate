// Renders a profile photo: an <img> when it's a URL (e.g. a Google picture),
// otherwise a dark placeholder with a person silhouette.
interface AvatarProps {
  photo?: string;
  size: number;
  radius: number;
}

export default function Avatar({ photo, size, radius }: AvatarProps) {
  const isUrl = typeof photo === 'string' && /^https?:\/\//.test(photo);
  return (
    <div
      className="flex items-end justify-center shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        background: isUrl ? 'rgba(255,255,255,0.12)' : 'rgba(7,16,38,0.55)',
        borderRadius: radius,
        border: '1px solid rgba(255,255,255,0.15)',
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
        <svg
          viewBox="0 0 24 24"
          width="78%"
          height="78%"
          fill="rgba(255,255,255,0.3)"
          aria-hidden="true"
          style={{ display: 'block' }}
        >
          <circle cx="12" cy="8.2" r="4.4" />
          <path d="M12 14.2c-4.8 0-8 2.6-8 6.2V24h16v-3.6c0-3.6-3.2-6.2-8-6.2z" />
        </svg>
      )}
    </div>
  );
}
