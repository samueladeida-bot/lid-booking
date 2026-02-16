import React, { useState, useEffect, useRef, useCallback } from "react";

// ── Inject global animations & styles ──
if (!document.getElementById("monjour-styles")) {
  const el = document.createElement("style");
  el.id = "monjour-styles";
  el.textContent = `
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }
    @keyframes fadeSlideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes glassGlow { 0%,100%{box-shadow:0 0 20px rgba(120,100,255,.08)} 50%{box-shadow:0 0 30px rgba(120,100,255,.15)} }
    input::placeholder { color: rgba(60,60,67,.4) !important; }
    .glass-card { animation: fadeSlideUp .35s ease-out both; }
    .glass-card:nth-child(2) { animation-delay:.04s }
    .glass-card:nth-child(3) { animation-delay:.08s }
    .glass-card:nth-child(4) { animation-delay:.12s }
    .glass-card:nth-child(5) { animation-delay:.16s }
    .glass-card:nth-child(6) { animation-delay:.2s }
  `;
  document.head.appendChild(el);
}

// ── Storage ──
const STORAGE_KEY = "monjour_data_v2";
const AUDIO_STORAGE_KEY = "monjour_audios";
const todayStr = () => new Date().toISOString().split("T")[0];

function loadAppData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { days: {}, currentTodos: [], currentNotes: [], lastDate: null };
    return JSON.parse(raw);
  } catch { return { days: {}, currentTodos: [], currentNotes: [], lastDate: null }; }
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

// ── Day rollover logic (extracted for reuse) ──
function performDayRollover(data) {
  const today = todayStr();
  const lastDate = data.lastDate;

  if (lastDate && lastDate !== today) {
    // Archive previous day
    const dayEntry = {
      todos: data.currentTodos || [],
      notes: data.currentNotes || [],
    };
    if (dayEntry.todos.length > 0 || dayEntry.notes.length > 0) {
      data.days[lastDate] = dayEntry;
    }
    // Carry over only uncompleted todos
    const carried = (data.currentTodos || [])
      .filter(t => !t.done)
      .map(t => ({ ...t, carried: true }));
    data.currentTodos = carried;
    // Notes do NOT carry over - new day, fresh notes
    data.currentNotes = [];
    data.lastDate = today;
    // Save immediately to localStorage
    saveAppData(data);
    return { data, todos: carried, notes: [], changed: true };
  }

  data.lastDate = today;
  return { data, todos: data.currentTodos || [], notes: data.currentNotes || [], changed: false };
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
    const result = performDayRollover(data);
    setAppData(result.data);
    setTodos(result.todos);
    setNotes(result.notes);
    setAudios(loadAudios());
  }, []);

  // ── Detect day change when app comes back to foreground ──
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const data = loadAppData();
        const today = todayStr();
        if (data.lastDate && data.lastDate !== today) {
          const result = performDayRollover(data);
          setAppData(result.data);
          setTodos(result.todos);
          setNotes(result.notes);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // ── Save on change ──
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
  const progress = todos.length ? (completedCount / todos.length) * 100 : 0;

  // ── History ──
  const historyDays = appData
    ? Object.entries(appData.days || {}).sort(([a], [b]) => b.localeCompare(a))
    : [];

  if (!appData) return null;

  // ── Tab config ──
  const tabs = [
    { key: "todos", label: "Taches", emoji: "\u2705" },
    { key: "notes", label: "Notes", emoji: "\ud83d\udcdd" },
    { key: "audio", label: "Audio", emoji: "\ud83c\udfa4" },
    { key: "history", label: "Historique", emoji: "\ud83d\udcc5" },
  ];

  return (
    <div style={S.container}>
      {/* Background mesh gradient */}
      <div style={S.bgMesh} />

      {/* Header */}
      <div style={S.header}>
        <div style={S.headerGlass} />
        <div style={S.headerContent}>
          <div style={S.greeting}>{getGreeting()}</div>
          <div style={S.dateText}>{formatDateLong(todayStr())}</div>
          {todos.length > 0 && (
            <div style={S.progressWrap}>
              <div style={S.progressBar}>
                <div style={{ ...S.progressFill, width: `${progress}%` }} />
              </div>
              <span style={S.progressText}>{completedCount}/{todos.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Tab Bar - Liquid Glass */}
      <div style={S.bottomBar}>
        {tabs.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={active ? S.bottomTabActive : S.bottomTab}
            >
              <span style={{ fontSize: 22, transition: "transform .2s ease", transform: active ? "scale(1.15)" : "scale(1)" }}>{tab.emoji}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, marginTop: 2,
                transition: "color .2s ease",
              }}>{tab.label}</span>
              {active && <div style={S.tabIndicator} />}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div style={S.content}>

        {/* ── TODOS TAB ── */}
        {activeTab === "todos" && (
          <>
            <div style={S.inputRow}>
              <div style={S.inputGlass}>
                <input
                  ref={todoInputRef}
                  type="text"
                  placeholder="Ajouter une tache..."
                  value={newTodo}
                  onChange={e => setNewTodo(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTodo()}
                  style={S.input}
                />
              </div>
              <button onClick={addTodo} style={S.addBtn} disabled={!newTodo.trim()}>+</button>
            </div>
            <div style={S.list}>
              {sortedTodos.length === 0 && (
                <div style={S.empty}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>&#10024;</div>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>Rien pour l'instant</div>
                  <div style={{ fontSize: 13, color: "rgba(60,60,67,.5)", marginTop: 6 }}>Ajoute tes taches du jour</div>
                </div>
              )}
              {sortedTodos.map(todo => (
                <div key={todo.id} className="glass-card" style={{ ...S.glassCard, opacity: todo.done ? 0.55 : 1 }}>
                  <button onClick={() => toggleTodo(todo.id)} style={S.checkbox}>
                    <div style={todo.done ? S.checked : S.unchecked}>{todo.done && "\u2713"}</div>
                  </button>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{
                      textDecoration: todo.done ? "line-through" : "none",
                      color: todo.done ? "rgba(60,60,67,.4)" : "#1c1c1e",
                      fontSize: 16, lineHeight: 1.4, fontWeight: 500,
                    }}>{todo.text}</span>
                    {todo.carried && !todo.done && <span style={S.carriedBadge}>reporte</span>}
                  </div>
                  <div style={S.actions}>
                    <button onClick={() => togglePriority(todo.id)}
                      style={{ ...S.actionBtn, color: todo.priority ? "#ff9f0a" : "rgba(60,60,67,.2)" }}>
                      {todo.priority ? "\u2605" : "\u2606"}
                    </button>
                    <button onClick={() => deleteTodo(todo.id)} style={{ ...S.actionBtn, color: "#ff453a" }}>&times;</button>
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
              <div style={S.inputGlass}>
                <input
                  ref={noteInputRef}
                  type="text"
                  placeholder="Noter quelque chose..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addNote()}
                  style={S.input}
                />
              </div>
              <button onClick={addNote} style={S.addBtn} disabled={!newNote.trim()}>+</button>
            </div>
            <div style={S.list}>
              {notes.length === 0 && (
                <div style={S.empty}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>&#128221;</div>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>Aucune note</div>
                  <div style={{ fontSize: 13, color: "rgba(60,60,67,.5)", marginTop: 6 }}>Capture une info a retenir</div>
                </div>
              )}
              {notes.map(note => (
                <div key={note.id} className="glass-card" style={S.glassCard}>
                  {editingNote === note.id ? (
                    <div style={{ flex: 1, display: "flex", gap: 8 }}>
                      <div style={{ ...S.inputGlass, flex: 1 }}>
                        <input type="text" value={editNoteText} onChange={e => setEditNoteText(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && saveEditNote()} style={S.input} autoFocus />
                      </div>
                      <button onClick={saveEditNote} style={{ ...S.addBtn, background: "linear-gradient(135deg, #30d158, #28b94e)" }}>{"\u2713"}</button>
                      <button onClick={() => setEditingNote(null)} style={{ ...S.addBtn, background: "rgba(60,60,67,.2)" }}>&times;</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, color: "#1c1c1e", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word", fontWeight: 500 }}>{note.text}</div>
                        <div style={{ fontSize: 12, color: "rgba(60,60,67,.4)", marginTop: 5, fontWeight: 600 }}>{note.time}</div>
                      </div>
                      <div style={S.actions}>
                        <button onClick={() => startEditNote(note)} style={{ ...S.actionBtn, color: "#5e5ce6" }}>{"\u270e"}</button>
                        <button onClick={() => deleteNote(note.id)} style={{ ...S.actionBtn, color: "#ff453a" }}>&times;</button>
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
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(60,60,67,.4)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1.5 }}>
                  {isRecording ? "Enregistrement en cours" : "Pret a enregistrer"}
                </div>
                <div style={{
                  fontSize: 48, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                  color: isRecording ? "#ff453a" : "#1c1c1e",
                  transition: "color .3s ease",
                }}>
                  {formatDuration(recordingTime)}
                </div>
                {isRecording && <div style={S.recordingDot} />}
              </div>

              <div style={S.inputGlass}>
                <input
                  type="text"
                  placeholder="Label (ex: Brief reunion...)"
                  value={audioLabel}
                  onChange={e => setAudioLabel(e.target.value)}
                  style={{ ...S.input, textAlign: "center" }}
                  disabled={isRecording}
                />
              </div>

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
                  <div style={{ fontSize: 44, marginBottom: 12 }}>&#127908;</div>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>Aucun enregistrement</div>
                  <div style={{ fontSize: 13, color: "rgba(60,60,67,.5)", marginTop: 6 }}>Enregistre ce que ton boss te dit</div>
                </div>
              )}
              {audios.map(audio => (
                <div key={audio.id} className="glass-card" style={S.glassCard}>
                  {editingAudio === audio.id ? (
                    <div style={{ flex: 1, display: "flex", gap: 8 }}>
                      <div style={{ ...S.inputGlass, flex: 1 }}>
                        <input type="text" value={editAudioLabel} onChange={e => setEditAudioLabel(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && saveEditAudio()} style={S.input} autoFocus />
                      </div>
                      <button onClick={saveEditAudio} style={{ ...S.addBtn, background: "linear-gradient(135deg, #30d158, #28b94e)" }}>{"\u2713"}</button>
                      <button onClick={() => setEditingAudio(null)} style={{ ...S.addBtn, background: "rgba(60,60,67,.2)" }}>&times;</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => playAudio(audio)} style={S.playBtn}>
                        {playingId === audio.id ? "\u23F8" : "\u25B6"}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "#1c1c1e" }}>{audio.label}</div>
                        <div style={{ fontSize: 12, color: "rgba(60,60,67,.4)", marginTop: 3, fontWeight: 500 }}>
                          {formatDate(audio.date)} {audio.time} &middot; {formatDuration(audio.duration)}
                        </div>
                      </div>
                      <div style={S.actions}>
                        <button onClick={() => startEditAudio(audio)} style={{ ...S.actionBtn, color: "#5e5ce6" }}>{"\u270e"}</button>
                        <button onClick={() => deleteAudio(audio.id)} style={{ ...S.actionBtn, color: "#ff453a" }}>&times;</button>
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
                <div style={{ fontSize: 44, marginBottom: 12 }}>&#128197;</div>
                <div style={{ fontSize: 17, fontWeight: 600 }}>Pas encore d'historique</div>
                <div style={{ fontSize: 13, color: "rgba(60,60,67,.5)", marginTop: 6 }}>Tes journees passees apparaitront ici</div>
              </div>
            )}
            {historyDays.map(([date, day]) => {
              const done = (day.todos || []).filter(t => t.done);
              const notDone = (day.todos || []).filter(t => !t.done);
              const total = day.todos?.length || 0;
              const pct = total > 0 ? Math.round((done.length / total) * 100) : 0;
              return (
                <div key={date} className="glass-card" style={S.historyDay}>
                  <div style={S.historyDateRow}>
                    <div>
                      <span style={S.historyDate}>{formatDateLong(date)}</span>
                    </div>
                    <span style={{
                      ...S.historyStats,
                      background: pct === 100 ? "rgba(48,209,88,.12)" : "rgba(94,92,230,.1)",
                      color: pct === 100 ? "#28a745" : "#5e5ce6",
                    }}>
                      {done.length}/{total}
                    </span>
                  </div>

                  {/* Mini progress */}
                  {total > 0 && (
                    <div style={{ marginTop: 10, height: 3, background: "rgba(60,60,67,.06)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        width: `${pct}%`,
                        background: pct === 100 ? "linear-gradient(90deg, #30d158, #28b94e)" : "linear-gradient(90deg, #5e5ce6, #bf5af2)",
                        transition: "width .4s ease",
                      }} />
                    </div>
                  )}

                  {done.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      {done.map(t => (
                        <div key={t.id} style={S.historyItem}>
                          <span style={{ color: "#30d158", marginRight: 8, fontWeight: 700, fontSize: 13 }}>{"\u2713"}</span>
                          <span style={{ color: "rgba(60,60,67,.45)", textDecoration: "line-through", fontSize: 14 }}>{t.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {notDone.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      {notDone.map(t => (
                        <div key={t.id} style={S.historyItem}>
                          <span style={{ color: "#ff9f0a", marginRight: 8, fontSize: 12 }}>{"\u25CB"}</span>
                          <span style={{ color: "#3a3a3c", fontSize: 14 }}>{t.text}</span>
                          <span style={{ ...S.carriedBadge, marginLeft: 8, fontSize: 10 }}>non fait</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(day.notes || []).length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(60,60,67,.06)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(60,60,67,.35)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Notes</div>
                      {day.notes.map(n => (
                        <div key={n.id} style={{ fontSize: 14, color: "#3a3a3c", padding: "3px 0", lineHeight: 1.5 }}>
                          <span style={{ color: "rgba(60,60,67,.3)", fontSize: 12, marginRight: 6, fontWeight: 600 }}>{n.time}</span>
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

// ── Liquid Glass Styles ──
const S = {
  container: {
    maxWidth: 430, margin: "0 auto", minHeight: "100vh",
    paddingTop: "env(safe-area-inset-top, 0)",
    paddingBottom: 100,
    position: "relative",
    overflow: "hidden",
  },

  // Background mesh gradient
  bgMesh: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: `
      radial-gradient(ellipse at 20% 0%, rgba(94,92,230,.08) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(191,90,242,.06) 0%, transparent 40%),
      radial-gradient(ellipse at 40% 80%, rgba(100,210,255,.05) 0%, transparent 40%),
      #f5f5f7
    `,
    zIndex: -1,
  },

  // Header - Liquid Glass
  header: {
    position: "relative",
    borderRadius: "0 0 28px 28px",
    overflow: "hidden",
    margin: "0 0 4px",
  },
  headerGlass: {
    position: "absolute", inset: 0,
    background: "linear-gradient(135deg, rgba(94,92,230,.85) 0%, rgba(191,90,242,.8) 50%, rgba(94,92,230,.75) 100%)",
    backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
  },
  headerContent: {
    position: "relative", zIndex: 1,
    padding: "52px 22px 26px",
  },
  greeting: {
    fontSize: 30, fontWeight: 700, color: "#fff",
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,.75)",
    marginTop: 2,
  },
  progressWrap: { display: "flex", alignItems: "center", gap: 10, marginTop: 18 },
  progressBar: {
    flex: 1, height: 5,
    background: "rgba(255,255,255,.18)",
    borderRadius: 3, overflow: "hidden",
  },
  progressFill: {
    height: "100%", borderRadius: 3,
    background: "rgba(255,255,255,.9)",
    transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
  },
  progressText: { fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.85)" },

  // Bottom tab bar - Frosted Glass
  bottomBar: {
    position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
    width: "100%", maxWidth: 430,
    display: "flex", justifyContent: "space-around",
    background: "rgba(255,255,255,.65)",
    backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)",
    borderTop: "1px solid rgba(60,60,67,.08)",
    paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))", paddingTop: 8,
    zIndex: 100,
  },
  bottomTab: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
    border: "none", background: "transparent", color: "rgba(60,60,67,.4)",
    cursor: "pointer", padding: "4px 16px", fontSize: 10,
    position: "relative", transition: "color .2s ease",
  },
  bottomTabActive: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
    border: "none", background: "transparent", color: "#5e5ce6",
    cursor: "pointer", padding: "4px 16px", fontSize: 10,
    position: "relative", transition: "color .2s ease",
  },
  tabIndicator: {
    position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
    width: 20, height: 3, borderRadius: 2,
    background: "linear-gradient(90deg, #5e5ce6, #bf5af2)",
  },

  // Content
  content: { padding: "16px 14px 20px" },

  // Glass Input
  inputRow: { display: "flex", gap: 10, marginBottom: 16 },
  inputGlass: {
    flex: 1,
    background: "rgba(255,255,255,.55)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.6)",
    boxShadow: "0 1px 4px rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.6)",
    overflow: "hidden",
  },
  input: {
    width: "100%", padding: "14px 16px", border: "none", borderRadius: 16,
    background: "transparent", fontSize: 16, color: "#1c1c1e", outline: "none",
    fontFamily: "inherit", fontWeight: 500,
  },
  addBtn: {
    width: 50, height: 50, borderRadius: 16, border: "none",
    background: "linear-gradient(135deg, #5e5ce6 0%, #bf5af2 100%)",
    color: "#fff", fontSize: 24, fontWeight: 600,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    boxShadow: "0 4px 14px rgba(94,92,230,.3)",
    transition: "transform .15s ease, box-shadow .15s ease",
  },

  // Glass Cards
  list: { display: "flex", flexDirection: "column", gap: 8 },
  glassCard: {
    display: "flex", alignItems: "center", gap: 12,
    background: "rgba(255,255,255,.55)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    padding: "14px 16px", borderRadius: 16,
    border: "1px solid rgba(255,255,255,.6)",
    boxShadow: "0 1px 4px rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.5)",
    transition: "transform .15s ease, box-shadow .15s ease",
  },
  empty: {
    textAlign: "center", padding: "52px 20px", color: "#3a3a3c", fontSize: 16, fontWeight: 500,
    background: "rgba(255,255,255,.35)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderRadius: 20, border: "1px solid rgba(255,255,255,.4)",
  },

  // Checkbox
  checkbox: { border: "none", background: "transparent", padding: 0, cursor: "pointer", flexShrink: 0 },
  unchecked: {
    width: 24, height: 24, borderRadius: 12,
    border: "2px solid rgba(60,60,67,.15)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, color: "#fff", transition: "all 0.25s ease",
  },
  checked: {
    width: 24, height: 24, borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #30d158, #28b94e)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, color: "#fff", fontWeight: 700, transition: "all 0.25s ease",
    boxShadow: "0 2px 8px rgba(48,209,88,.3)",
  },
  carriedBadge: {
    fontSize: 11, fontWeight: 600, color: "#ff9f0a",
    background: "rgba(255,159,10,.1)",
    padding: "2px 9px", borderRadius: 8, alignSelf: "flex-start",
  },
  actions: { display: "flex", gap: 2, flexShrink: 0 },
  actionBtn: {
    border: "none", background: "transparent", fontSize: 20, cursor: "pointer",
    padding: "4px 6px", borderRadius: 8, lineHeight: 1,
    transition: "transform .15s ease",
  },

  // Audio recorder - Glass
  recorderCard: {
    background: "rgba(255,255,255,.55)",
    backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
    borderRadius: 24, padding: "30px 22px",
    border: "1px solid rgba(255,255,255,.6)",
    boxShadow: "0 2px 16px rgba(0,0,0,.05), inset 0 1px 0 rgba(255,255,255,.5)",
    textAlign: "center",
  },
  recordingDot: {
    width: 10, height: 10, borderRadius: 5, background: "#ff453a",
    margin: "10px auto 0", animation: "pulse 1s ease-in-out infinite",
    boxShadow: "0 0 12px rgba(255,69,58,.4)",
  },
  recordBtn: {
    width: "100%", padding: "16px 0", border: "none", borderRadius: 16,
    background: "linear-gradient(135deg, #ff453a, #ff2d55)",
    color: "#fff", fontSize: 17, fontWeight: 700,
    cursor: "pointer", letterSpacing: 0.5, marginTop: 16,
    boxShadow: "0 4px 14px rgba(255,69,58,.3)",
    transition: "transform .15s ease",
  },
  stopBtn: {
    width: "100%", padding: "16px 0", border: "none", borderRadius: 16,
    background: "linear-gradient(135deg, #1c1c1e, #2c2c2e)",
    color: "#fff", fontSize: 17, fontWeight: 700,
    cursor: "pointer", letterSpacing: 0.5, marginTop: 16,
    boxShadow: "0 4px 14px rgba(0,0,0,.2)",
    transition: "transform .15s ease",
  },
  playBtn: {
    width: 44, height: 44, borderRadius: 22, border: "none",
    background: "linear-gradient(135deg, #5e5ce6, #bf5af2)",
    color: "#fff", fontSize: 18, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    boxShadow: "0 3px 10px rgba(94,92,230,.3)",
    transition: "transform .15s ease",
  },

  // History - Glass
  historyDay: {
    display: "block",
    background: "rgba(255,255,255,.55)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderRadius: 18, padding: "16px 18px",
    border: "1px solid rgba(255,255,255,.6)",
    boxShadow: "0 1px 4px rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.5)",
    marginBottom: 4,
  },
  historyDateRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  historyDate: { fontSize: 16, fontWeight: 700, color: "#1c1c1e" },
  historyStats: {
    fontSize: 13, fontWeight: 700, padding: "4px 12px", borderRadius: 10,
  },
  historyItem: {
    display: "flex", alignItems: "center", padding: "4px 0", fontSize: 14,
  },
};
