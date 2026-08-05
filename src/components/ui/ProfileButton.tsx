import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { UserCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

// Header button that opens the profile editor. Shows the signed-in user's
// own photo when they have one (uploaded photo, else their Google picture),
// otherwise the generic user icon.
export default function ProfileButton({ size = 40 }: { size?: number }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const myProfile = useAppStore((s) => s.myProfile);

  const photo =
    myProfile?.photos?.[0] ||
    myProfile?.photo ||
    ((auth.user?.profile?.picture as string) ?? '') ||
    '';
  const isUrl = /^https?:\/\//.test(photo);

  return (
    <button
      onClick={() => navigate('/me')}
      className="flex items-center justify-center rounded-full overflow-hidden shrink-0"
      style={{
        width: size,
        height: size,
        background: 'rgba(125,211,252,0.2)',
        border: '1px solid rgba(125,211,252,0.4)',
      }}
      aria-label="Edit my profile"
    >
      {isUrl ? (
        <img
          src={photo}
          alt=""
          referrerPolicy="no-referrer"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : photo ? (
        <span style={{ fontSize: size * 0.5 }}>{photo}</span>
      ) : (
        <UserCircle size={size * 0.55} style={{ color: '#7dd3fc' }} />
      )}
    </button>
  );
}
