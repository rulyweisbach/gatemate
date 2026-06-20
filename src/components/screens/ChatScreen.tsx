import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { mockUsers, autoReplies } from '../../data/mockUsers';
import { useAppStore } from '../../store/useAppStore';
import type { Message } from '../../types';

const ME = 'me';

function generateId() {
  return Math.random().toString(36).slice(2);
}

export default function ChatScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addMessage, getMessages } = useAppStore();
  const user = mockUsers.find((u) => u.id === id);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = id ? getMessages(id) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user || !id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white">User not found</p>
      </div>
    );
  }

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: generateId(), senderId: ME, text: trimmed, timestamp: Date.now() };
    addMessage(id, userMsg);
    setText('');

    setTimeout(() => {
      const reply: Message = {
        id: generateId(),
        senderId: id,
        text: autoReplies[Math.floor(Math.random() * autoReplies.length)],
        timestamp: Date.now(),
      };
      addMessage(id, reply);
    }, 900 + Math.random() * 800);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

        <div
          className="flex items-center justify-center text-2xl shrink-0"
          style={{
            width: 40,
            height: 40,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.18)',
          }}
        >
          {user.photo}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">{user.name}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            📍 {user.distance} · ✈️ {user.gate}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-12">
            <div className="text-5xl">✈️</div>
            <p className="font-bold text-white">Say hi to {user.name.split(' ')[0]}!</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              You're both at the airport ✈️
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === ME;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="px-4 py-2.5 max-w-[78%] text-sm font-medium"
                style={{
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMe
                    ? 'rgba(125, 211, 252, 0.35)'
                    : 'rgba(255, 255, 255, 0.13)',
                  border: isMe
                    ? '1px solid rgba(125, 211, 252, 0.45)'
                    : '1px solid rgba(255,255,255,0.18)',
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
            placeholder={`Message ${user.name.split(' ')[0]}...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            maxLength={500}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
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
