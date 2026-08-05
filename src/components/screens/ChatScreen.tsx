import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { ArrowLeft, Send } from 'lucide-react';
import { useApi } from '../../api/client';
import { content, fmt } from '../../content';
import type { Profile, ApiMessage } from '../../types';
import Avatar from '../ui/Avatar';

const c = content.chat;

export default function ChatScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const api = useApi();
  const myId = auth.user?.profile?.sub;

  const [other, setOther] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.getMessages(id);
      setMessages(res.messages ?? []);
    } catch {
      /* keep existing messages on transient errors */
    }
  }, [api, id]);

  // Load the other user's profile + record the connection (best-effort).
  useEffect(() => {
    if (!id) return;
    api.getUser(id).then((r) => setOther(r.profile)).catch(() => setOther(null));
    api.sayHi(id).catch(() => {});
  }, [api, id]);

  // Initial history + light polling for new messages.
  useEffect(() => {
    loadMessages();
    const t = setInterval(loadMessages, 4000);
    return () => clearInterval(t);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white">{c.userNotFound}</p>
      </div>
    );
  }

  const firstName = other?.name?.split(' ')[0] ?? 'there';

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    // Optimistic append.
    const optimistic: ApiMessage = {
      conversationId: '',
      sentAt: Date.now(),
      messageId: `tmp-${Date.now()}`,
      senderId: myId ?? 'me',
      recipientId: id,
      text: trimmed,
    };
    setMessages((m) => [...m, optimistic]);
    try {
      await api.sendMessage(id, trimmed);
      await loadMessages();
    } catch {
      // Roll back the optimistic message on failure.
      setMessages((m) => m.filter((x) => x.messageId !== optimistic.messageId));
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div
        className="glass-dark flex items-center gap-3 px-5 py-4 sticky top-0 z-10"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-full shrink-0"
          style={{
            width: 36,
            height: 36,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>

        <Avatar photo={other?.photos?.[0] ?? other?.photo} size={40} radius={12} />

        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">{other?.name ?? 'Traveler'}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {other?.distance ? `📍 ${other.distance} · ` : ''}✈️ {other?.gate ?? other?.flight ?? c.atTheAirport}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-12">
            <div className="text-5xl">✈️</div>
            <p className="font-bold text-white">{fmt(c.sayHiTo, { name: firstName })}</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {c.bothAtAirport}
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === myId;
          return (
            <div key={msg.messageId} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className="px-4 py-2.5 max-w-[78%] text-sm font-medium"
                style={{
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMe ? 'rgba(125, 211, 252, 0.35)' : 'rgba(255, 255, 255, 0.13)',
                  border: isMe ? '1px solid rgba(125, 211, 252, 0.45)' : '1px solid rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(12px)',
                  color: 'white',
                  wordBreak: 'break-word',
                }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="px-4 pt-4 glass-dark"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex gap-3 items-center">
          <input
            className="glass-input flex-1"
            placeholder={fmt(c.placeholder, { name: firstName })}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            maxLength={500}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="flex items-center justify-center rounded-full shrink-0 transition-all"
            style={{
              width: 44,
              height: 44,
              background: text.trim() ? '#7dd3fc' : 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: text.trim() ? 'pointer' : 'default',
            }}
            aria-label="Send message"
          >
            <Send size={18} style={{ color: text.trim() ? '#0b1a3b' : 'rgba(255,255,255,0.4)' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
