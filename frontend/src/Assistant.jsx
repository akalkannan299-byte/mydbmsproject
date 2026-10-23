import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { api } from './services/api';

const SUGGESTIONS = ['What are your vegetarian favourites?', 'Suggest a light breakfast', 'What goes well with biryani?'];

/** Floating "Ask NoirBite" chat. The Gemini key lives on the server; this only talks to our own API. */
export default function Assistant({ enabled }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);   // [{ role: 'user' | 'model', text }]
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, busy, open]);

  if (!enabled) return null;

  async function send(text) {
    const message = text.trim();
    if (!message || busy) return;
    // The API expects at most 6 earlier turns, starting with a user turn.
    let history = messages.slice(-6).map(m => ({ role: m.role, text: m.text.slice(0, 1000) }));
    while (history.length && history[0].role !== 'user') history.shift();
    setError(''); setInput(''); setBusy(true);
    setMessages(old => [...old, { role: 'user', text: message }]);
    try {
      const { reply } = await api.chat(message, history);
      setMessages(old => [...old, { role: 'model', text: reply }]);
    } catch (err) {
      // Roll back the question so the conversation keeps alternating user/model.
      setMessages(old => old.slice(0, -1));
      setInput(message);
      setError(err.message);
    } finally { setBusy(false); }
  }

  return <>
    {!open && <button className="assistant-fab" onClick={() => setOpen(true)} aria-label="Ask NoirBite"><MessageCircle size={20}/><span>Ask NoirBite</span></button>}
    {open && <section className="assistant-panel" aria-label="NoirBite concierge">
      <header><span><Sparkles size={15}/> NoirBite concierge</span><button onClick={() => setOpen(false)} aria-label="Close chat"><X size={17}/></button></header>
      <div className="assistant-body">
        <div className="bubble model">Hello! I can help you pick dishes from today's menu. What are you in the mood for?</div>
        {messages.map((m, i) => <div key={i} className={`bubble ${m.role}`}>{m.text}</div>)}
        {busy && <div className="bubble model typing">Thinking…</div>}
        {!messages.length && <div className="chips">{SUGGESTIONS.map(s => <button key={s} onClick={() => send(s)}>{s}</button>)}</div>}
        {error && <p className="form-error">{error}</p>}
        <div ref={endRef}/>
      </div>
      <form onSubmit={e => { e.preventDefault(); send(input); }}>
        <input value={input} onChange={e => setInput(e.target.value)} maxLength={500} placeholder="Ask about our menu…" aria-label="Your question"/>
        <button disabled={busy || !input.trim()} aria-label="Send"><Send size={16}/></button>
      </form>
    </section>}
  </>;
}
