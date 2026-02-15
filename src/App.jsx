import React, { useState, useEffect, useRef, useCallback } from "react";

// ── Storage ──
const STORAGE_KEY = "monjour_data_v2";
const AUDIO_STORAGE_KEY = "monjour_audios";
const todayStr = () => new Date().toISOString().split("T")[0];

function loadAppData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { days: {}, currentTodos: [], currentNotes: [] };
    return JSON.parse(raw);
  } catch { return { days: {}, currentTodos: [], currentNotes: [] }; }
}

function saveAppData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadAudios() {
  try {
    const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

function saveAudios(audios) {
  localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(audios));
}

// ── Helpers ──
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon aprem";
  return "Bonsoir";
}

function formatDate(iso) {
  const d = new Date(iso + "T12:00:00");
  const jours = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const mois = ["jan", "fev", "mars", "avr", "mai", "juin", "juil", "aout", "sep", "oct", "nov", "dec"];
  return `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]}`;
}

function formatDateLong(iso) {
  const d = new Date(iso + "T12:00:00");
  const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const mois = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
  return `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]}`;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── App ──
export default function App() {
  const [appData, setAppData] = useState(null);
  const [todos, setTodos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [audios, setAudios] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [newNote, setNewNote] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteText, setEditNoteText] = useState("");
  const todoInputRef = useRef(null);
  const noteInputRef = useRef(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLabel, setAudioLabel] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [playingId, setPlayingId] = useState(null);
  const audioElRef = useRef(null);
  const [editingAudio, setEditingAudio] = useState(null);
  const [editAudioLabel, setEditAudioLabel] = useState("");

  // ── Init: load data, handle day rollover ──
  useEffect(() => {
    const data = loadAppData();
    const today = todayStr();
    const lastDate = data.lastDate;

    if (lastDate && lastDate !== today) {
      // Day changed: archive previous day
      const dayEntry = {
        todos: data.currentTodos || [],
        notes: data.currentNotes || [],
      };
      if (dayEntry.todos.length > 0 || dayEntry.notes.length > 0) {
        data.days[lastDate] = dayEntry;
      }
      // Carry over uncompleted todos
      const carried = (data.currentTodos || [])
        .filter(t => !t.done)
        .map(t => ({ ...t, carried: true }));
      setTodos(carried);
      setNotes(data.currentNotes || []);
    } else {
      setTodos(data.currentTodos || []);
      setNotes(data.currentNotes || []);
    }

    data.lastDate = today;
    setAppData(data);
    setAudios(loadAudios());
  }, []);

  // Save on change
  useEffect(() => {
    if (!appData) return;
    const updated = {
      ...appData,
      currentTodos: todos,
      currentNotes: notes,
      lastDate: todayStr(),
    };
    saveAppData(updated);
    setAppData(updated);
  }, [todos, notes]);

  useEffect(() => {
    saveAudios(audios);
  }, [audios]);

  // ── Todo actions ──
  const addTodo = () => {
    const text = newTodo.trim();
    if (!text) return;
    setTodos(prev => [...prev, { id: uid(), text, done: false, priority: false, carried: false }]);
    setNewTodo("");
    todoInputRef.current?.focus();
  };

  const toggleTodo = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const togglePriority = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, priority: !t.priority } : t));
  };

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  // ── Note actions ──
  const addNote = () => {
    const text = newNote.trim();
    if (!text) return;
    setNotes(prev => [{ id: uid(), text, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) }, ...prev]);
    setNewNote("");
    noteInputRef.current?.focus();
  };

  const deleteNote = (id) => setNotes(prev => prev.filter(n => n.id !== id));

  const startEditNote = (note) => { setEditingNote(note.id); setEditNoteText(note.text); };

  const saveEditNote = () => {
    if (!editNoteText.trim()) return;
    setNotes(prev => prev.map(n => n.id === editingNote ? { ...n, text: editNoteText.trim() } : n));
    setEditingNote(null);
    setEditNoteText("");
  };

  // ── Audio recording ──
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result;
          const newAudio = {
            id: uid(),
            label: audioLabel.trim() || "Enregistrement",
            data: base64,
            date: todayStr(),
            time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            duration: recordingTime,
          };
          setAudios(prev => [newAudio, ...prev]);
          setAudioLabel("");
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Impossible d'acceder au micro. Verifie les permissions.");
    }
  }, [audioLabel, recordingTime]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
  }, []);

  const playAudio = (audio) => {
    if (playingId === audio.id) {
      audioElRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioElRef.current) audioElRef.current.pause();
    const el = new Audio(audio.data);
    audioElRef.current = el;
    el.onended = () => setPlayingId(null);
    el.play();
    setPlayingId(audio.id);
  };

  const deleteAudio = (id) => {
    if (playingId === id) {
      audioElRef.current?.pause();
      setPlayingId(null);
    }
    setAudios(prev => prev.filter(a => a.id !== id));
  };

  const startEditAudio = (audio) => { setEditingAudio(audio.id); setEditAudioLabel(audio.label); };

  const saveEditAudio = () => {
    if (!editAudioLabel.trim()) return;
    setAudios(prev => prev.map(a => a.id === editingAudio ? { ...a, label: editAudioLabel.trim() } : a));
    setEditingAudio(null);
    setEditAudioLabel("");
  };

  // ── Sorted todos ──
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.priority !== b.priority) return a.priority ? -1 : 1;
    return 0;
  });

  const completedCount = todos.filter(t => t.done).length;

  // ── History ──
  const historyDays = appData
    ? Object.entries(appData.days || {}).sort(([a], [b]) => b.localeCompare(a))
    : [];

  if (!appData) return null;

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.greeting}>{getGreeting()}</div>
        <div style={S.dateText}>{formatDateLong(todayStr())}</div>
        {todos.length > 0 && (
          <div style={S.progressWrap}>
            <div style={S.progressBar}>
              <div style={{ ...S.progressFill, width: `${todos.length ? (completedCount / todos.length) * 100 : 0}%` }} />
            </div>
            <span style={S.progressText}>{completedCount}/{todos.length}</span>
          </div>
        )}
      </div>

      {/* Bottom Tab Bar (iOS style) */}
      <div style={S.bottomBar}>
        {[
          { key: "todos", icon: "checkmark.circle", label: "Taches", emoji: "\u2705" },
          { key: "notes", icon: "note.text", label: "Notes", emoji: "\ud83d\udcdd" },
          { key: "audio", icon: "mic", label: "Audio", emoji: "\ud83c\udfa4" },
          { key: "history", icon: "clock", label: "Historique", emoji: "\ud83d\udcc5" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={activeTab === tab.key ? S.bottomTabActive : S.bottomTab}
          >
            <span style={{ fontSize: 22 }}>{tab.emoji}</span>
            <span style={{ fontSize: 10, fontWeight: 600, marginTop: 2 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content area */}
      <div style={S.content}>

        {/* ── TODOS TAB ── */}
        {activeTab === "todos" && (
          <>
            <div style={S.inputRow}>
              <input
                ref={todoInputRef}
                type="text"
                placeholder="Ajouter une tache..."
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTodo()}
                style={S.input}
              />
              <button onClick={addTodo} style={S.addBtn} disabled={!newTodo.trim()}>+</button>
            </div>
            <div style={S.list}>
              {sortedTodos.length === 0 && (
                <div style={S.empty}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>&#10024;</div>
                  <div>Rien pour l'instant</div>
                  <div style={{ fontSize: 13, color: "#8e8e93", marginTop: 4 }}>Ajoute tes taches du jour</div>
                </div>
              )}
              {sortedTodos.map(todo => (
                <div key={todo.id} style={{ ...S.card, opacity: todo.done ? 0.5 : 1 }}>
                  <button onClick={() => toggleTodo(todo.id)} style={S.checkbox}>
                    <div style={todo.done ? S.checked : S.unchecked}>{todo.done && "\u2713"}</div>
                  </button>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{
                      textDecoration: todo.done ? "line-through" : "none",
                      color: todo.done ? "#8e8e93" : "#1c1c1e",
                      fontSize: 16, lineHeight: 1.4,
                    }}>{todo.text}</span>
                    {todo.carried && !todo.done && <span style={S.carriedBadge}>reporte</span>}
                  </div>
                  <div style={S.actions}>
                    <button onClick={() => togglePriority(todo.id)}
                      style={{ ...S.actionBtn, color: todo.priority ? "#ff9500" : "#c7c7cc" }}>
                      {todo.priority ? "\u2605" : "\u2606"}
                    </button>
                    <button onClick={() => deleteTodo(todo.id)} style={{ ...S.actionBtn, color: "#ff3b30" }}>&times;</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── NOTES TAB ── */}
        {activeTab === "notes" && (
          <>
            <div style={S.inputRow}>
              <input
                ref={noteInputRef}
                type="text"
                placeholder="Noter quelque chose..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addNote()}
                style={S.input}
              />
              <button onClick={addNote} style={S.addBtn} disabled={!newNote.trim()}>+</button>
            </div>
            <div style={S.list}>
              {notes.length === 0 && (
                <div style={S.empty}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>&#128221;</div>
                  <div>Aucune note</div>
                  <div style={{ fontSize: 13, color: "#8e8e93", marginTop: 4 }}>Capture une info a retenir</div>
                </div>
              )}
              {notes.map(note => (
                <div key={note.id} style={S.card}>
                  {editingNote === note.id ? (
                    <div style={{ flex: 1, display: "flex", gap: 8 }}>
                      <input type="text" value={editNoteText} onChange={e => setEditNoteText(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && saveEditNote()} style={{ ...S.input, flex: 1 }} autoFocus />
                      <button onClick={saveEditNote} style={{ ...S.addBtn, background: "#34c759" }}>{"\u2713"}</button>
                      <button onClick={() => setEditingNote(null)} style={{ ...S.addBtn, background: "#8e8e93" }}>&times;</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, color: "#1c1c1e", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{note.text}</div>
                        <div style={{ fontSize: 12, color: "#8e8e93", marginTop: 4, fontWeight: 500 }}>{note.time}</div>
                      </div>
                      <div style={S.actions}>
                        <button onClick={() => startEditNote(note)} style={{ ...S.actionBtn, color: "#007aff" }}>{"\u270e"}</button>
                        <button onClick={() => deleteNote(note.id)} style={{ ...S.actionBtn, color: "#ff3b30" }}>&times;</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── AUDIO TAB ── */}
        {activeTab === "audio" && (
          <>
            {/* Recorder */}
            <div style={S.recorderCard}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#8e8e93", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                  {isRecording ? "Enregistrement en cours..." : "Pret a enregistrer"}
                </div>
                <div style={{ fontSize: 42, fontWeight: 700, color: isRecording ? "#ff3b30" : "#1c1c1e", fontVariantNumeric: "tabular-nums" }}>
                  {formatDuration(recordingTime)}
                </div>
                {isRecording && (
                  <div style={S.recordingDot} />
                )}
              </div>

              <input
                type="text"
                placeholder="Label (ex: Brief reunion, Consigne boss...)"
                value={audioLabel}
                onChange={e => setAudioLabel(e.target.value)}
                style={{ ...S.input, marginBottom: 12, textAlign: "center" }}
                disabled={isRecording}
              />

              <button
                onClick={isRecording ? stopRecording : startRecording}
                style={isRecording ? S.stopBtn : S.recordBtn}
              >
                {isRecording ? "\u25A0  Arreter" : "\u25CF  Enregistrer"}
              </button>
            </div>

            {/* Audio list */}
            <div style={{ ...S.list, marginTop: 16 }}>
              {audios.length === 0 && !isRecording && (
                <div style={S.empty}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>&#127908;</div>
                  <div>Aucun enregistrement</div>
                  <div style={{ fontSize: 13, color: "#8e8e93", marginTop: 4 }}>Enregistre ce que ton boss te dit</div>
                </div>
              )}
              {audios.map(audio => (
                <div key={audio.id} style={S.card}>
                  {editingAudio === audio.id ? (
                    <div style={{ flex: 1, display: "flex", gap: 8 }}>
                      <input type="text" value={editAudioLabel} onChange={e => setEditAudioLabel(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && saveEditAudio()} style={{ ...S.input, flex: 1 }} autoFocus />
                      <button onClick={saveEditAudio} style={{ ...S.addBtn, background: "#34c759" }}>{"\u2713"}</button>
                      <button onClick={() => setEditingAudio(null)} style={{ ...S.addBtn, background: "#8e8e93" }}>&times;</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => playAudio(audio)} style={S.playBtn}>
                        {playingId === audio.id ? "\u23F8" : "\u25B6"}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "#1c1c1e" }}>{audio.label}</div>
                        <div style={{ fontSize: 12, color: "#8e8e93", marginTop: 2 }}>
                          {formatDate(audio.date)} {audio.time} &middot; {formatDuration(audio.duration)}
                        </div>
                      </div>
                      <div style={S.actions}>
                        <button onClick={() => startEditAudio(audio)} style={{ ...S.actionBtn, color: "#007aff" }}>{"\u270e"}</button>
                        <button onClick={() => deleteAudio(audio.id)} style={{ ...S.actionBtn, color: "#ff3b30" }}>&times;</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === "history" && (
          <div style={S.list}>
            {historyDays.length === 0 && (
              <div style={S.empty}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>&#128197;</div>
                <div>Pas encore d'historique</div>
                <div style={{ fontSize: 13, color: "#8e8e93", marginTop: 4 }}>Tes journees passees apparaitront ici</div>
              </div>
            )}
            {historyDays.map(([date, day]) => {
              const done = (day.todos || []).filter(t => t.done);
              const notDone = (day.todos || []).filter(t => !t.done);
              return (
                <div key={date} style={S.historyDay}>
                  <div style={S.historyDateRow}>
                    <span style={S.historyDate}>{formatDateLong(date)}</span>
                    <span style={S.historyStats}>
                      {done.length}/{day.todos?.length || 0} faites
                    </span>
                  </div>

                  {done.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {done.map(t => (
                        <div key={t.id} style={S.historyItem}>
                          <span style={{ color: "#34c759", marginRight: 8, fontWeight: 700 }}>{"\u2713"}</span>
                          <span style={{ color: "#8e8e93", textDecoration: "line-through" }}>{t.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {notDone.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      {notDone.map(t => (
                        <div key={t.id} style={S.historyItem}>
                          <span style={{ color: "#ff9500", marginRight: 8 }}>{"\u25CB"}</span>
                          <span style={{ color: "#3a3a3c" }}>{t.text}</span>
                          <span style={{ ...S.carriedBadge, marginLeft: 8 }}>non fait</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(day.notes || []).length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #f2f2f7" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Notes</div>
                      {day.notes.map(n => (
                        <div key={n.id} style={{ fontSize: 14, color: "#3a3a3c", padding: "2px 0", lineHeight: 1.4 }}>
                          <span style={{ color: "#8e8e93", fontSize: 12, marginRight: 6 }}>{n.time}</span>
                          {n.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ──
const S = {
  container: {
    maxWidth: 430, margin: "0 auto", minHeight: "100vh",
    background: "#f2f2f7", paddingTop: "env(safe-area-inset-top, 0)",
    paddingBottom: 90,
  },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "48px 20px 24px", borderRadius: "0 0 24px 24px", color: "#fff",
  },
  greeting: { fontSize: 28, fontWeight: 700, marginBottom: 2 },
  dateText: { fontSize: 15, fontWeight: 500, opacity: 0.85 },
  progressWrap: { display: "flex", alignItems: "center", gap: 10, marginTop: 16 },
  progressBar: { flex: 1, height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", background: "#fff", borderRadius: 3, transition: "width 0.4s ease" },
  progressText: { fontSize: 13, fontWeight: 600, opacity: 0.9 },

  // Bottom tab bar
  bottomBar: {
    position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
    width: "100%", maxWidth: 430,
    display: "flex", justifyContent: "space-around",
    background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderTop: "1px solid #e5e5ea",
    paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))", paddingTop: 6,
    zIndex: 100,
  },
  bottomTab: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
    border: "none", background: "transparent", color: "#8e8e93",
    cursor: "pointer", padding: "4px 16px", fontSize: 10,
  },
  bottomTabActive: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
    border: "none", background: "transparent", color: "#667eea",
    cursor: "pointer", padding: "4px 16px", fontSize: 10,
  },

  // Content
  content: { padding: "16px 16px 20px" },

  // Input
  inputRow: { display: "flex", gap: 8, marginBottom: 16 },
  input: {
    flex: 1, padding: "14px 16px", border: "none", borderRadius: 14,
    background: "#fff", fontSize: 16, color: "#1c1c1e", outline: "none",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)", fontFamily: "inherit",
  },
  addBtn: {
    width: 48, height: 48, borderRadius: 14, border: "none",
    background: "#667eea", color: "#fff", fontSize: 24, fontWeight: 600,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },

  // Cards
  list: { display: "flex", flexDirection: "column", gap: 8 },
  card: {
    display: "flex", alignItems: "center", gap: 12,
    background: "#fff", padding: "14px 16px", borderRadius: 14,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  empty: { textAlign: "center", padding: "48px 20px", color: "#3a3a3c", fontSize: 16, fontWeight: 500 },

  // Checkbox
  checkbox: { border: "none", background: "transparent", padding: 0, cursor: "pointer", flexShrink: 0 },
  unchecked: {
    width: 24, height: 24, borderRadius: 12, border: "2px solid #d1d1d6",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, color: "#fff", transition: "all 0.2s",
  },
  checked: {
    width: 24, height: 24, borderRadius: 12, border: "2px solid #34c759", background: "#34c759",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, color: "#fff", fontWeight: 700, transition: "all 0.2s",
  },
  carriedBadge: {
    fontSize: 11, fontWeight: 600, color: "#ff9500", background: "#fff3e0",
    padding: "2px 8px", borderRadius: 6, alignSelf: "flex-start",
  },
  actions: { display: "flex", gap: 4, flexShrink: 0 },
  actionBtn: {
    border: "none", background: "transparent", fontSize: 20, cursor: "pointer",
    padding: "4px 6px", borderRadius: 8, lineHeight: 1,
  },

  // Audio recorder
  recorderCard: {
    background: "#fff", borderRadius: 20, padding: "28px 20px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)", textAlign: "center",
  },
  recordingDot: {
    width: 10, height: 10, borderRadius: 5, background: "#ff3b30",
    margin: "8px auto 0", animation: "pulse 1s ease-in-out infinite",
  },
  recordBtn: {
    width: "100%", padding: "16px 0", border: "none", borderRadius: 14,
    background: "#ff3b30", color: "#fff", fontSize: 17, fontWeight: 700,
    cursor: "pointer", letterSpacing: 0.5,
  },
  stopBtn: {
    width: "100%", padding: "16px 0", border: "none", borderRadius: 14,
    background: "#1c1c1e", color: "#fff", fontSize: 17, fontWeight: 700,
    cursor: "pointer", letterSpacing: 0.5,
  },
  playBtn: {
    width: 44, height: 44, borderRadius: 22, border: "none",
    background: "#667eea", color: "#fff", fontSize: 18, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },

  // History
  historyDay: {
    background: "#fff", borderRadius: 14, padding: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 4,
  },
  historyDateRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  historyDate: { fontSize: 16, fontWeight: 700, color: "#1c1c1e" },
  historyStats: { fontSize: 13, fontWeight: 600, color: "#667eea", background: "#667eea15", padding: "3px 10px", borderRadius: 8 },
  historyItem: {
    display: "flex", alignItems: "center", padding: "4px 0", fontSize: 14,
  },
};
