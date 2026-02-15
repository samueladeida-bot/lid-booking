import React, { useState, useEffect, useRef } from "react";

// ── Helpers ──
const STORAGE_KEY = "monjour_data";
const today = () => new Date().toISOString().split("T")[0];

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function formatDate(iso) {
  const d = new Date(iso + "T12:00:00");
  const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]}`;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── App ──
export default function App() {
  const [currentDate, setCurrentDate] = useState(today());
  const [todos, setTodos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [newNote, setNewNote] = useState("");
  const [activeTab, setActiveTab] = useState("todos"); // "todos" | "notes"
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteText, setEditNoteText] = useState("");
  const todoInputRef = useRef(null);
  const noteInputRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    const data = loadData();
    if (data && data.date === today()) {
      setTodos(data.todos || []);
      setNotes(data.notes || []);
    } else if (data) {
      // New day: carry over uncompleted todos, keep notes
      const carried = (data.todos || [])
        .filter(t => !t.done)
        .map(t => ({ ...t, carried: true }));
      setTodos(carried);
      setNotes(data.notes || []);
    }
  }, []);

  // Save on every change
  useEffect(() => {
    saveData({ date: today(), todos, notes });
  }, [todos, notes]);

  // Navigate days
  const changeDay = (offset) => {
    const d = new Date(currentDate + "T12:00:00");
    d.setDate(d.getDate() + offset);
    setCurrentDate(d.toISOString().split("T")[0]);
  };

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

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const startEditNote = (note) => {
    setEditingNote(note.id);
    setEditNoteText(note.text);
  };

  const saveEditNote = () => {
    if (!editNoteText.trim()) return;
    setNotes(prev => prev.map(n => n.id === editingNote ? { ...n, text: editNoteText.trim() } : n));
    setEditingNote(null);
    setEditNoteText("");
  };

  // Sort: priority first, then uncompleted, then completed
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.priority !== b.priority) return a.priority ? -1 : 1;
    return 0;
  });

  const completedCount = todos.filter(t => t.done).length;
  const isToday = currentDate === today();

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.greeting}>{getGreeting()} ☀️</div>
        <div style={styles.dateRow}>
          <button onClick={() => changeDay(-1)} style={styles.dateArrow}>‹</button>
          <div style={styles.dateText}>{formatDate(currentDate)}</div>
          <button onClick={() => changeDay(1)} style={styles.dateArrow}>›</button>
        </div>
        {!isToday && (
          <button onClick={() => setCurrentDate(today())} style={styles.todayBtn}>
            Aujourd'hui
          </button>
        )}

        {/* Progress */}
        {todos.length > 0 && (
          <div style={styles.progressWrap}>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${(completedCount / todos.length) * 100}%` }} />
            </div>
            <span style={styles.progressText}>{completedCount}/{todos.length}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("todos")}
          style={activeTab === "todos" ? styles.tabActive : styles.tab}
        >
          Tâches {todos.length > 0 && <span style={styles.badge}>{todos.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          style={activeTab === "notes" ? styles.tabActive : styles.tab}
        >
          Notes {notes.length > 0 && <span style={styles.badge}>{notes.length}</span>}
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === "todos" ? (
          <>
            {/* Add todo */}
            <div style={styles.inputRow}>
              <input
                ref={todoInputRef}
                type="text"
                placeholder="Ajouter une tâche..."
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTodo()}
                style={styles.input}
              />
              <button onClick={addTodo} style={styles.addBtn} disabled={!newTodo.trim()}>+</button>
            </div>

            {/* Todo list */}
            <div style={styles.list}>
              {sortedTodos.length === 0 && (
                <div style={styles.empty}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>✨</div>
                  <div>Rien pour l'instant</div>
                  <div style={{ fontSize: 13, color: "#8e8e93", marginTop: 4 }}>Ajoute tes tâches du jour</div>
                </div>
              )}
              {sortedTodos.map(todo => (
                <div key={todo.id} style={{ ...styles.todoItem, opacity: todo.done ? 0.5 : 1 }}>
                  <button onClick={() => toggleTodo(todo.id)} style={styles.checkbox}>
                    <div style={todo.done ? styles.checkboxChecked : styles.checkboxUnchecked}>
                      {todo.done && "✓"}
                    </div>
                  </button>
                  <div style={styles.todoContent}>
                    <span style={{
                      textDecoration: todo.done ? "line-through" : "none",
                      color: todo.done ? "#8e8e93" : "#1c1c1e",
                      fontSize: 16,
                      lineHeight: 1.4,
                    }}>
                      {todo.text}
                    </span>
                    {todo.carried && !todo.done && (
                      <span style={styles.carriedBadge}>reporté</span>
                    )}
                  </div>
                  <div style={styles.todoActions}>
                    <button
                      onClick={() => togglePriority(todo.id)}
                      style={{ ...styles.actionBtn, color: todo.priority ? "#ff9500" : "#c7c7cc" }}
                    >
                      {todo.priority ? "★" : "☆"}
                    </button>
                    <button onClick={() => deleteTodo(todo.id)} style={{ ...styles.actionBtn, color: "#ff3b30" }}>
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Add note */}
            <div style={styles.inputRow}>
              <input
                ref={noteInputRef}
                type="text"
                placeholder="Noter quelque chose..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addNote()}
                style={styles.input}
              />
              <button onClick={addNote} style={styles.addBtn} disabled={!newNote.trim()}>+</button>
            </div>

            {/* Notes list */}
            <div style={styles.list}>
              {notes.length === 0 && (
                <div style={styles.empty}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📝</div>
                  <div>Aucune note</div>
                  <div style={{ fontSize: 13, color: "#8e8e93", marginTop: 4 }}>Capture une info à retenir</div>
                </div>
              )}
              {notes.map(note => (
                <div key={note.id} style={styles.noteItem}>
                  {editingNote === note.id ? (
                    <div style={{ flex: 1, display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        value={editNoteText}
                        onChange={e => setEditNoteText(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && saveEditNote()}
                        style={{ ...styles.input, flex: 1 }}
                        autoFocus
                      />
                      <button onClick={saveEditNote} style={{ ...styles.addBtn, background: "#34c759" }}>✓</button>
                      <button onClick={() => setEditingNote(null)} style={{ ...styles.addBtn, background: "#8e8e93" }}>×</button>
                    </div>
                  ) : (
                    <>
                      <div style={styles.noteContent}>
                        <div style={styles.noteText}>{note.text}</div>
                        <div style={styles.noteTime}>{note.time}</div>
                      </div>
                      <div style={styles.todoActions}>
                        <button onClick={() => startEditNote(note)} style={{ ...styles.actionBtn, color: "#007aff" }}>
                          ✎
                        </button>
                        <button onClick={() => deleteNote(note.id)} style={{ ...styles.actionBtn, color: "#ff3b30" }}>
                          ×
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Styles (iOS-native feel) ──
const styles = {
  container: {
    maxWidth: 430,
    margin: "0 auto",
    minHeight: "100vh",
    background: "#f2f2f7",
    paddingTop: "env(safe-area-inset-top, 0)",
  },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "48px 20px 24px",
    borderRadius: "0 0 24px 24px",
    color: "#fff",
  },
  greeting: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 4,
  },
  dateRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 500,
    opacity: 0.9,
    flex: 1,
    textAlign: "center",
  },
  dateArrow: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "#fff",
    fontSize: 22,
    fontWeight: 700,
    width: 36,
    height: 36,
    borderRadius: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  todayBtn: {
    marginTop: 8,
    background: "rgba(255,255,255,0.25)",
    border: "none",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    padding: "6px 16px",
    borderRadius: 20,
    cursor: "pointer",
  },
  progressWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  progressBar: {
    flex: 1,
    height: 6,
    background: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#fff",
    borderRadius: 3,
    transition: "width 0.4s ease",
  },
  progressText: {
    fontSize: 13,
    fontWeight: 600,
    opacity: 0.9,
  },

  // Tabs
  tabs: {
    display: "flex",
    margin: "16px 16px 0",
    background: "#e5e5ea",
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    background: "transparent",
    color: "#8e8e93",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    borderRadius: 10,
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tabActive: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    background: "#fff",
    color: "#1c1c1e",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    borderRadius: 10,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  badge: {
    background: "#667eea",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: 10,
    minWidth: 20,
    textAlign: "center",
  },

  // Content
  content: {
    padding: "12px 16px 100px",
  },

  // Input
  inputRow: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    padding: "14px 16px",
    border: "none",
    borderRadius: 14,
    background: "#fff",
    fontSize: 16,
    color: "#1c1c1e",
    outline: "none",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    fontFamily: "inherit",
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    border: "none",
    background: "#667eea",
    color: "#fff",
    fontSize: 24,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // List
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  empty: {
    textAlign: "center",
    padding: "48px 20px",
    color: "#3a3a3c",
    fontSize: 16,
    fontWeight: 500,
  },

  // Todo item
  todoItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#fff",
    padding: "14px 16px",
    borderRadius: 14,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    transition: "opacity 0.3s",
  },
  checkbox: {
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    flexShrink: 0,
  },
  checkboxUnchecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    border: "2px solid #d1d1d6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    color: "#fff",
    transition: "all 0.2s",
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    border: "2px solid #34c759",
    background: "#34c759",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    color: "#fff",
    fontWeight: 700,
    transition: "all 0.2s",
  },
  todoContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  carriedBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: "#ff9500",
    background: "#fff3e0",
    padding: "2px 8px",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  todoActions: {
    display: "flex",
    gap: 4,
    flexShrink: 0,
  },
  actionBtn: {
    border: "none",
    background: "transparent",
    fontSize: 20,
    cursor: "pointer",
    padding: "4px 6px",
    borderRadius: 8,
    lineHeight: 1,
  },

  // Note item
  noteItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    background: "#fff",
    padding: "14px 16px",
    borderRadius: 14,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  noteContent: {
    flex: 1,
  },
  noteText: {
    fontSize: 16,
    color: "#1c1c1e",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  noteTime: {
    fontSize: 12,
    color: "#8e8e93",
    marginTop: 4,
    fontWeight: 500,
  },
};
