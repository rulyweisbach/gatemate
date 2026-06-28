import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { ArrowLeft, Send, Users } from 'lucide-react';
import { useApi } from '../../api/client';
import type { Group, ApiMessage } from '../../types';
import { groupCategoryMeta } from '../../data/groupMeta';
import Avatar from '../ui/Avatar';

export default function GroupChatScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const api = useApi();
  const myId = auth.user?.profile?.sub;

  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [denied, setDenied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.getGroupMessages(id);
      setMessages(res.messages ?? []);
    } catch (e) {
      if (e instanceof Error && e.message.includes('403')) setDenied(true);
    }
  }, [api, id]);

  useEffect(() => {
    if (!id) return;
    api.getGroup(id).then((r) => setGroup(r.group)).catch(() => setGroup(null));
  }, [api, id]);

  useEffect(() => {
    loadMessages();
    const t = setInterval(loadMessages, 4000);
    return () => clearInterval(t);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!id) {
    return <div className="flex items-center justify-center min-h-screen"><p className="text-white">Group not found</p></div>;
  }

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    const optimistic: ApiMessage = {
      conversationId: '', sentAt: Date.now(), messageId: `tmp-${Date.now()}`,
      senderId: myId ?? 'me', senderName: 'You', text: trimmed,
    };
    setMessages((m) => [...m, optimistic]);
    try {
      await api.sendGroupMessage(id, trimmed);
      await loadMessages();
    } catch {
      setMessages((m) => m.filter((x) => x.messageId !== optimistic.messageId));
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
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
          style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div
          className="flex items-center justify-center text-xl shrink-0"
          style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}
        >
          {group ? groupCategoryMeta[group.category].emoji : '💬'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">{group?.title ?? 'Group chat'}</p>
          <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Users size={11} /> {group?.members?.length ?? 0}/{group?.maxMembers ?? '-'} members
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-2.5">
        {denied && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-12">
            <div className="text-5xl">🔒</div>
            <p className="font-bold text-white">Join the group to chat</p>
            <button onClick={() => navigate('/groups')} className="btn-glass mt-2" style={{ width: 'auto', padding: '10px 24px' }}>
              Back to groups
            </button>
          </div>
        )}

        {!denied && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-12">
            <div className="text-5xl">👋</div>
            <p className="font-bold text-white">Start the conversation</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Say hi to your group!</p>
          </div>
        )}

        {!denied && messages.map((msg, idx) => {
          const isMe = msg.senderId === myId;
          // Show sender name/avatar only for others, and only when the sender changes.
          const prev = messages[idx - 1];
          const showSender = !isMe && (!prev || prev.senderId !== msg.senderId);
          return (
            <div key={msg.messageId} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {showSender && (
                <div className="flex items-center gap-1.5 mb-0.5 ml-1">
                  <Avatar photo={msg.senderPhoto} size={18} radius={6} />
                  <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {msg.senderName?.split(' ')[0] ?? 'Traveler'}
                  </span>
                </div>
              )}
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

      {/* Input */}
      {!denied && (
        <div
          className="px-4 pt-4 glass-dark"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex gap-3 items-center">
            <input
              className="glass-input flex-1"
              placeholder="Message the group…"
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
                width: 44, height: 44,
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
      )}
    </div>
  );
}
