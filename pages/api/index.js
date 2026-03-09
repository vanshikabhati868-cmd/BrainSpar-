import { useState, useRef, useEffect } from "react";

const systemPrompt = `You are BrainSpar — a warm, encouraging study tutor who helps students truly understand their material through friendly Socratic debate.

Your style:
- Friendly, warm, and supportive — like a smart older friend helping you study
- Ask probing questions to test understanding, don't just quiz facts
- When the student answers, dig deeper: "Great! But why does that happen?" or "Can you give me an example?"
- Gently correct mistakes with explanation, never harshly
- Celebrate good reasoning: "Exactly! You've got it."
- Keep responses concise (2-4 sentences max) to keep the conversation flowing
- Use casual, conversational language

Start by greeting the student warmly and picking the most important concept from their notes to explore first.`;

export default function BrainSpar() {
  const [notes, setNotes] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [stage, setStage] = useState("input");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("paste");
  const [pdfName, setPdfName] = useState("");
  const chatEndRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handlePDF = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const arr = new Uint8Array(ev.target.result);
        let raw = "";
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] > 31 && arr[i] < 127) raw += String.fromCharCode(arr[i]);
          else raw += " ";
        }
        const cleaned = raw.replace(/\s+/g, " ").slice(0, 8000);
        setPdfText(cleaned.length > 200 ? cleaned : `PDF: ${file.name} loaded.`);
      } catch {
        setPdfText(`PDF: ${file.name} loaded.`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const callClaude = async (msgs) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs, system: systemPrompt }),
    });
    const data = await res.json();
    return data.content?.map((b) => b.text || "").join("") || "Let's keep going!";
  };

  const startDebate = async () => {
    const content = tab === "paste" ? notes : pdfText;
    if (!content.trim()) return;
    setStage("chat");
    setLoading(true);
    try {
      const reply = await callClaude([{
        role: "user",
        content: `Here are my study notes. Help me truly understand this material through friendly debate:\n\n${content}`,
      }]);
      setMessages([{ role: "assistant", content: reply }]);
    } catch {
      setMessages([{ role: "assistant", content: "Hey! Ready to help you study. What topic should we tackle first?" }]);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    const content = tab === "paste" ? notes : pdfText;
    try {
      const history = [
        { role: "user", content: `Study notes:\n\n${content}` },
        { role: "assistant", content: messages[0]?.content || "" },
        ...newMessages.slice(1),
      ];
      const reply = await callClaude(history);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Oops! Something went wrong. Try again 😊" }]);
    }
    setLoading(false);
  };

  const reset = () => {
    setStage("input"); setMessages([]); setNotes("");
    setPdfText(""); setPdfName(""); setInput("");
  };

  const hasContent = tab === "paste" ? notes.trim() : pdfText.trim();

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0f18; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0f18; }
        ::-webkit-scrollbar-thumb { background: #2a2d3d; border-radius: 4px; }
      `}</style>
      <div style={{ minHeight: "100vh", background: "#0d0f18", color: "#e8e8f0", fontFamily: "'Georgia', serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 40px" }}>
        <div style={{ width: "100%", maxWidth: 660, padding: "32px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: "#f0c040", letterSpacing: -1 }}>Brain</span>
              <span style={{ background: "#f0c040", color: "#111", fontWeight: 800, fontSize: 13, padding: "2px 10px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase" }}>Spar</span>
            </div>
            <div style={{ fontSize: 12, color: "#6b6e8a", marginTop: 3 }}>Your friendly AI study debate partner ⚡</div>
            <div style={{ fontSize: 11, color: "#4a4d69", marginTop: 2 }}>Developed by Vanshika Bhati</div>
          </div>
          {stage === "chat" && (
            <button onClick={reset} style={{ background: "transparent", border: "1px solid #2a2d3d", color: "#6b6e8a", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}>← New Session</button>
          )}
        </div>
        {stage === "input" && (
          <div style={{ width: "100%", maxWidth: 660, marginTop: 36 }}>
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>Paste your notes.<br /><span style={{ color: "#f0c040" }}>We'll debate until you get it.</span></div>
            <div style={{ color: "#6b6e8a", fontSize: 14, marginBottom: 28 }}>BrainSpar challenges your understanding so the material actually sticks.</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 12, background: "#1a1d27", borderRadius: 10, padding: 4, border: "1px solid #2a2d3d" }}>
              {[["paste", "📝 Paste Notes"], ["pdf", "📄 Upload PDF"]].map(([t, label]) => (
                <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 14, fontWeight: tab === t ? 700 : 400, background: tab === t ? "#f0c040" : "transparent", color: tab === t ? "#111" : "#6b6e8a", transition: "all 0.18s" }}>{label}</button>
              ))}
            </div>
            <div style={{ background: "#1a1d27", border: "1px solid #2a2d3d", borderRadius: 14, overflow: "hidden" }}>
              {tab === "paste" ? (
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste your lecture notes, textbook summary, or any study material here..." style={{ width: "100%", minHeight: 260, background: "transparent", border: "none", outline: "none", color: "#e8e8f0", fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.75, padding: 22, resize: "vertical", boxSizing: "border-box" }} />
              ) : (
                <div style={{ padding: 24, minHeight: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
                  <input ref={fileRef} type="file" accept=".pdf" onChange={handlePDF} style={{ display: "none" }} />
                  {!pdfName ? (<><div style={{ fontSize: 44 }}>📄</div><div style={{ color: "#6b6e8a", fontSize: 14, textAlign: "center" }}>Upload a PDF of your notes or textbook</div><button onClick={() => fileRef.current?.click()} style={{ background: "#f0c04018", border: "1px solid #f0c040", color: "#f0c040", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 600 }}>Choose PDF</button></>) : (<><div style={{ fontSize: 44 }}>✅</div><div style={{ color: "#4ade80", fontWeight: 600, fontSize: 15 }}>{pdfName}</div><button onClick={() => fileRef.current?.click()} style={{ background: "transparent", border: "1px solid #2a2d3d", color: "#6b6e8a", borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontSize: 13 }}>Change file</button></>)}
                </div>
              )}
            </div>
            <button onClick={startDebate} disabled={!hasContent} style={{ width: "100%", marginTop: 14, padding: "16px 0", background: hasContent ? "#f0c040" : "#2a2d3d", color: hasContent ? "#111" : "#6b6e8a", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, fontFamily: "Georgia, serif", cursor: hasContent ? "pointer" : "not-allowed", transition: "all 0.2s" }}>Start Debate Session ⚡</button>
            <div style={{ textAlign: "center", color: "#6b6e8a", fontSize: 12, marginTop: 10 }}>Your tutor will question, challenge, and celebrate your understanding.</div>
          </div>
        )}
        {stage === "chat" && (
          <div style={{ width: "100%", maxWidth: 660, marginTop: 24, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 380, maxHeight: "58vh", overflowY: "auto", paddingBottom: 8 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: m.role === "assistant" ? "#f0c040" : "#1e2235", border: m.role === "user" ? "1px solid #f0c04066" : "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{m.role === "assistant" ? "🎓" : "🧑"}</div>
                  <div style={{ maxWidth: "78%", background: m.role === "assistant" ? "#1a1d27" : "#1e1a0d", border: `1px solid ${m.role === "assistant" ? "#2a2d3d" : "#3a3010"}`, borderRadius: m.role === "assistant" ? "4px 14px 14px 14px" : "14px 4px 14px 14px", padding: "12px 16px", fontSize: 14, lineHeight: 1.7, color: "#e8e8f0" }}>{m.content}</div>
                </div>
              ))}
              {loading && (<div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}><div style={{ width: 34, height: 34, borderRadius: "50%", background: "#f0c040", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🎓</div><div style={{ background: "#1a1d27", border: "1px solid #2a2d3d", borderRadius: "4px 14px 14px 14px", padding: "12px 18px", fontSize: 20, color: "#f0c040" }}>···</div></div>)}
              <div ref={chatEndRef} />
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "flex-end", background: "#1a1d27", border: "1px solid #2a2d3d", borderRadius: 14, padding: "10px 14px" }}>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Type your answer or ask a question..." rows={2} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e8e8f0", fontFamily: "Georgia, serif", fontSize: 14, lineHeight: 1.6, resize: "none" }} />
              <button onClick={sendMessage} disabled={!input.trim() || loading} style={{ background: input.trim() && !loading ? "#f0c040" : "#2a2d3d", color: input.trim() && !loading ? "#111" : "#6b6e8a", border: "none", borderRadius: 10, padding: "8px 16px", cursor: input.trim() && !loading ? "pointer" : "not-allowed", fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 14, transition: "all 0.15s", flexShrink: 0 }}>Send ↑</button>
            </div>
            <div style={{ textAlign: "center", color: "#6b6e8a", fontSize: 11, marginTop: 8 }}>Press Enter to send • Shift+Enter for new line</div>
          </div>
        )}
      </div>
    </>
  );
}