import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:3001/api";

const LANGUAGES = [
  "plaintext","javascript","typescript","python","rust","go","java",
  "c","cpp","csharp","php","ruby","swift","kotlin","html","css",
  "json","yaml","bash","sql","markdown"
];

// ─── API HELPERS ──────────────────────────────────────────────────────────────

const api = async (path, opts = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(API + path, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error");
  return data;
};

// ─── SYNTAX HIGHLIGHT (simple) ────────────────────────────────────────────────

function highlight(code, lang) {
  const escape = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  if (lang === "plaintext" || lang === "markdown") return escape(code);

  let h = escape(code);

  // strings
  h = h.replace(/(&#x27;.*?&#x27;|&quot;.*?&quot;|`[^`]*`)/g,
    '<span style="color:#98c379">$1</span>');

  // keywords
  const kw = /\b(const|let|var|function|return|if|else|for|while|import|export|from|class|new|async|await|try|catch|def|print|self|None|True|False|fn|pub|use|struct|impl|int|string|bool|interface|type)\b/g;
  h = h.replace(kw, '<span style="color:#c678dd">$1</span>');

  // numbers
  h = h.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#d19a66">$1</span>');

  // comments
  h = h.replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span style="color:#5c6370;font-style:italic">$1</span>');

  return h;
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: type === "error" ? "#e06c75" : "#98c379",
      color: "#0d1117", padding: "10px 18px", borderRadius: 8,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
      fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,.4)",
      animation: "slideUp .2s ease"
    }}>
      {msg}
    </div>
  );
}

function Navbar({ user, page, setPage, onLogout }) {
  return (
    <nav style={{
      background: "#0d1117", borderBottom: "1px solid #1c2128",
      padding: "0 24px", height: 56, display: "flex",
      alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 100
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20, cursor: "pointer" }}
          onClick={() => setPage("home")}>⟨/⟩</span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          color: "#e6edf3", fontWeight: 700, fontSize: 16, cursor: "pointer"
        }} onClick={() => setPage("home")}>
          codeshare
        </span>
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {[{ id: "home", label: "⌂ home" }, { id: "explore", label: "# explore" }].map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            background: page === n.id ? "#1c2128" : "transparent",
            border: page === n.id ? "1px solid #30363d" : "1px solid transparent",
            color: page === n.id ? "#58a6ff" : "#8b949e",
            padding: "5px 14px", borderRadius: 6, cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, transition: "all .15s"
          }}>{n.label}</button>
        ))}

        {user ? (
          <>
            <button onClick={() => setPage("new")} style={{
              background: "#238636", border: "1px solid #2ea043",
              color: "#fff", padding: "5px 14px", borderRadius: 6,
              cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12, fontWeight: 600
            }}>+ new</button>
            <button onClick={() => setPage("profile")} style={{
              background: "#1c2128", border: "1px solid #30363d",
              color: "#e6edf3", padding: "5px 14px", borderRadius: 6,
              cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 12
            }}>@{user.username}</button>
            <button onClick={onLogout} style={{
              background: "transparent", border: "1px solid #30363d",
              color: "#8b949e", padding: "5px 10px", borderRadius: 6,
              cursor: "pointer", fontSize: 12
            }}>×</button>
          </>
        ) : (
          <button onClick={() => setPage("login")} style={{
            background: "#238636", border: "1px solid #2ea043",
            color: "#fff", padding: "5px 14px", borderRadius: 6,
            cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 12
          }}>login</button>
        )}
      </div>
    </nav>
  );
}

function SnippetCard({ snippet, onClick }) {
  const lines = snippet.code.split("\n").length;
  return (
    <div onClick={onClick} style={{
      background: "#0d1117", border: "1px solid #1c2128",
      borderRadius: 10, padding: "16px 20px", cursor: "pointer",
      transition: "border-color .15s, transform .1s",
      fontFamily: "'JetBrains Mono', monospace"
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#30363d"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1c2128"; e.currentTarget.style.transform = ""; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "#58a6ff", fontWeight: 700, fontSize: 14 }}>{snippet.title}</span>
        <span style={{
          background: "#1c2128", color: "#8b949e", padding: "2px 8px",
          borderRadius: 4, fontSize: 11
        }}>{snippet.language}</span>
      </div>
      {snippet.description && (
        <p style={{ color: "#8b949e", fontSize: 12, margin: "0 0 10px", lineHeight: 1.5 }}>
          {snippet.description.slice(0, 80)}{snippet.description.length > 80 ? "…" : ""}
        </p>
      )}
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#484f58" }}>
        <span>@{snippet.author?.username}</span>
        <span>{lines} lines</span>
        <span>{snippet.views} views</span>
        <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

// ─── PAGES ────────────────────────────────────────────────────────────────────

function HomePage({ setPage, setViewSlug, toast }) {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/snippets?limit=12")
      .then(d => setSnippets(d.snippets))
      .catch(e => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <h1 style={{
          fontFamily: "'JetBrains Mono', monospace",
          color: "#e6edf3", fontSize: 42, fontWeight: 800,
          margin: "0 0 12px", letterSpacing: -1
        }}>share your <span style={{ color: "#58a6ff" }}>code</span></h1>
        <p style={{ color: "#8b949e", fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>
          simple, fast, permanent code snippets
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#484f58", fontFamily: "'JetBrains Mono', monospace" }}>loading...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 12 }}>
          {snippets.map(s => (
            <SnippetCard key={s._id} snippet={s} onClick={() => { setViewSlug(s.slug); setPage("view"); }} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExplorePage({ setPage, setViewSlug, toast }) {
  const [snippets, setSnippets] = useState([]);
  const [page, setP] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback((p) => {
    setLoading(true);
    api(`/snippets?page=${p}&limit=20`)
      .then(d => { setSnippets(d.snippets); setTotal(d.total); })
      .catch(e => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page); }, [page]);

  const filtered = search
    ? snippets.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.language.toLowerCase().includes(search.toLowerCase()) ||
        s.author?.username.toLowerCase().includes(search.toLowerCase())
      )
    : snippets;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'JetBrains Mono', monospace", color: "#e6edf3", margin: 0, fontSize: 20 }}>
          # explore <span style={{ color: "#484f58", fontSize: 14 }}>({total})</span>
        </h2>
        <input
          placeholder="search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: "#0d1117", border: "1px solid #30363d", color: "#e6edf3",
            padding: "8px 14px", borderRadius: 8, width: 200,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, outline: "none"
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#484f58", fontFamily: "'JetBrains Mono', monospace" }}>loading...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(s => (
            <SnippetCard key={s._id} snippet={s} onClick={() => { setViewSlug(s.slug); setPage("view"); }} />
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 24 }}>
        {page > 1 && (
          <button onClick={() => setP(p => p - 1)} style={btnStyle}>← prev</button>
        )}
        {snippets.length === 20 && (
          <button onClick={() => setP(p => p + 1)} style={btnStyle}>next →</button>
        )}
      </div>
    </div>
  );
}

function ViewPage({ slug, user, setPage, toast }) {
  const [snippet, setSnippet] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api(`/snippets/${slug}`)
      .then(setSnippet)
      .catch(e => toast(e.message, "error"));
  }, [slug]);

  if (!snippet) return (
    <div style={{ textAlign: "center", padding: 80, color: "#484f58", fontFamily: "'JetBrains Mono', monospace" }}>
      loading...
    </div>
  );

  const copy = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rawUrl = `${API}/snippets/${slug}/raw`;
  const isOwner = user && user.id === snippet.author?._id;
  const lines = snippet.code.split("\n");

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
      <button onClick={() => setPage("explore")} style={{ ...btnStyle, marginBottom: 20, fontSize: 12 }}>
        ← back
      </button>

      <div style={{
        background: "#0d1117", border: "1px solid #1c2128",
        borderRadius: 12, overflow: "hidden"
      }}>
        {/* header */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #1c2128",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start"
        }}>
          <div>
            <h1 style={{
              fontFamily: "'JetBrains Mono', monospace", color: "#e6edf3",
              margin: "0 0 6px", fontSize: 20, fontWeight: 700
            }}>{snippet.title}</h1>
            {snippet.description && (
              <p style={{ color: "#8b949e", margin: "0 0 8px", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                {snippet.description}
              </p>
            )}
            <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#484f58", fontFamily: "'JetBrains Mono', monospace" }}>
              <span>@{snippet.author?.username}</span>
              <span>{snippet.language}</span>
              <span>{lines.length} lines</span>
              <span>{snippet.views} views</span>
              <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <a href={rawUrl} target="_blank" style={{ ...btnStyle, textDecoration: "none", fontSize: 12 }}>
              raw
            </a>
            <button onClick={copy} style={btnStyle}>
              {copied ? "✓ copied" : "copy"}
            </button>
            {isOwner && (
              <button onClick={async () => {
                if (!confirm("Delete this snippet?")) return;
                try {
                  await api(`/snippets/${slug}`, { method: "DELETE" });
                  toast("Deleted!", "ok");
                  setPage("home");
                } catch (e) { toast(e.message, "error"); }
              }} style={{ ...btnStyle, borderColor: "#e06c75", color: "#e06c75" }}>
                delete
              </button>
            )}
          </div>
        </div>

        {/* code */}
        <div style={{ display: "flex", overflowX: "auto" }}>
          {/* line numbers */}
          <div style={{
            background: "#080c10", padding: "20px 0",
            userSelect: "none", minWidth: 48, textAlign: "right"
          }}>
            {lines.map((_, i) => (
              <div key={i} style={{
                padding: "0 14px", color: "#3d444d", fontSize: 13, lineHeight: "22px",
                fontFamily: "'JetBrains Mono', monospace"
              }}>{i + 1}</div>
            ))}
          </div>

          {/* code body */}
          <pre style={{
            margin: 0, padding: "20px", flex: 1, overflowX: "auto",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
            lineHeight: "22px", color: "#abb2bf",
            background: "#0d1117"
          }}
            dangerouslySetInnerHTML={{ __html: highlight(snippet.code, snippet.language) }}
          />
        </div>
      </div>

      {/* permalink */}
      <div style={{
        marginTop: 16, padding: "10px 16px",
        background: "#0d1117", border: "1px solid #1c2128", borderRadius: 8,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#484f58"
      }}>
        permalink: <span style={{ color: "#58a6ff" }}>/snippets/{slug}</span>
        &nbsp;·&nbsp; raw: <span style={{ color: "#58a6ff" }}>/snippets/{slug}/raw</span>
      </div>
    </div>
  );
}

function NewPage({ setPage, setViewSlug, toast }) {
  const [form, setForm] = useState({ title: "", code: "", language: "javascript", description: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) return toast("Title required", "error");
    if (!form.code.trim()) return toast("Code required", "error");
    setLoading(true);
    try {
      const s = await api("/snippets", { method: "POST", body: JSON.stringify(form) });
      toast("Snippet created!", "ok");
      setViewSlug(s.slug);
      setPage("view");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
      <h2 style={{ fontFamily: "'JetBrains Mono', monospace", color: "#e6edf3", marginBottom: 24, fontSize: 20 }}>
        + new snippet
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12 }}>
          <input
            placeholder="title..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={inputStyle}
          />
          <select
            value={form.language}
            onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
            style={{ ...inputStyle, width: 160 }}
          >
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <input
          placeholder="description (optional)..."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          style={inputStyle}
        />

        <textarea
          placeholder="// paste your code here..."
          value={form.code}
          onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
          rows={24}
          spellCheck={false}
          style={{
            ...inputStyle, resize: "vertical", lineHeight: "22px",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
            tabSize: 2
          }}
          onKeyDown={e => {
            if (e.key === "Tab") {
              e.preventDefault();
              const s = e.target.selectionStart;
              const v = e.target.value;
              setForm(f => ({ ...f, code: v.substring(0, s) + "  " + v.substring(s) }));
              setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 2; }, 0);
            }
          }}
        />

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => setPage("home")} style={btnStyle}>cancel</button>
          <button onClick={submit} disabled={loading} style={{
            ...btnStyle, background: "#238636", borderColor: "#2ea043",
            color: "#fff", opacity: loading ? .6 : 1
          }}>
            {loading ? "saving..." : "create snippet"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ user, setPage, setViewSlug, toast }) {
  const [data, setData] = useState(null);
  const [bio, setBio] = useState("");
  const [editBio, setEditBio] = useState(false);

  useEffect(() => {
    if (!user) return;
    api(`/users/${user.username}`)
      .then(d => { setData(d); setBio(d.user.bio || ""); })
      .catch(e => toast(e.message, "error"));
  }, [user]);

  if (!user) return (
    <div style={{ textAlign: "center", padding: 80 }}>
      <p style={{ color: "#8b949e", fontFamily: "'JetBrains Mono', monospace" }}>
        you need to login first
      </p>
      <button onClick={() => setPage("login")} style={btnStyle}>login</button>
    </div>
  );

  if (!data) return (
    <div style={{ textAlign: "center", padding: 80, color: "#484f58", fontFamily: "'JetBrains Mono', monospace" }}>
      loading...
    </div>
  );

  const saveBio = async () => {
    try {
      await api("/users/me/bio", { method: "PUT", body: JSON.stringify({ bio }) });
      setData(d => ({ ...d, user: { ...d.user, bio } }));
      setEditBio(false);
      toast("Bio updated!", "ok");
    } catch (e) { toast(e.message, "error"); }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
      {/* profile header */}
      <div style={{
        background: "#0d1117", border: "1px solid #1c2128",
        borderRadius: 12, padding: "28px 28px", marginBottom: 24
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: `hsl(${(user.username.charCodeAt(0) * 37) % 360}, 50%, 35%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 22,
            color: "#e6edf3", fontWeight: 700
          }}>
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontFamily: "'JetBrains Mono', monospace", color: "#e6edf3", margin: "0 0 4px", fontSize: 22 }}>
              @{user.username}
            </h2>
            <p style={{ color: "#484f58", margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
              {data.snippets.length} snippets · joined {new Date(data.user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {editBio ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="bio..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={saveBio} style={{ ...btnStyle, background: "#238636", borderColor: "#2ea043", color: "#fff" }}>save</button>
            <button onClick={() => setEditBio(false)} style={btnStyle}>cancel</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <p style={{ color: "#8b949e", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, margin: 0, flex: 1 }}>
              {data.user.bio || "no bio yet"}
            </p>
            <button onClick={() => setEditBio(true)} style={{ ...btnStyle, fontSize: 11 }}>edit bio</button>
          </div>
        )}
      </div>

      {/* snippets */}
      <h3 style={{ fontFamily: "'JetBrains Mono', monospace", color: "#8b949e", fontSize: 14, marginBottom: 12 }}>
        snippets ({data.snippets.length})
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.snippets.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#484f58", fontFamily: "'JetBrains Mono', monospace" }}>
            no snippets yet · <span style={{ color: "#58a6ff", cursor: "pointer" }} onClick={() => setPage("new")}>create one?</span>
          </div>
        ) : (
          data.snippets.map(s => (
            <SnippetCard key={s._id} snippet={{ ...s, author: data.user }}
              onClick={() => { setViewSlug(s.slug); setPage("view"); }} />
          ))
        )}
      </div>
    </div>
  );
}

function LoginPage({ setUser, setPage, toast }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.username || !form.password) return toast("Fill all fields", "error");
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/auth/login" : "/auth/register";
      const data = await api(endpoint, { method: "POST", body: JSON.stringify(form) });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      toast(tab === "login" ? "Welcome back!" : "Account created!", "ok");
      setPage("home");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 380, margin: "80px auto", padding: "0 24px"
    }}>
      <div style={{
        background: "#0d1117", border: "1px solid #1c2128",
        borderRadius: 12, padding: 32
      }}>
        <div style={{ display: "flex", marginBottom: 28, background: "#080c10", borderRadius: 8, padding: 4 }}>
          {["login", "register"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "8px 0",
              background: tab === t ? "#1c2128" : "transparent",
              border: tab === t ? "1px solid #30363d" : "1px solid transparent",
              color: tab === t ? "#e6edf3" : "#484f58",
              borderRadius: 6, cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13, transition: "all .15s"
            }}>{t}</button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            placeholder="username"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            style={inputStyle}
            onKeyDown={e => e.key === "Enter" && submit()}
          />
          <input
            type="password"
            placeholder="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            style={inputStyle}
            onKeyDown={e => e.key === "Enter" && submit()}
          />
          <button onClick={submit} disabled={loading} style={{
            ...btnStyle, background: "#238636", borderColor: "#2ea043",
            color: "#fff", padding: "10px", justifyContent: "center",
            display: "flex", opacity: loading ? .6 : 1, marginTop: 4
          }}>
            {loading ? "..." : tab}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const inputStyle = {
  background: "#0d1117", border: "1px solid #30363d",
  color: "#e6edf3", padding: "10px 14px", borderRadius: 8,
  fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
  outline: "none", width: "100%", boxSizing: "border-box"
};

const btnStyle = {
  background: "#0d1117", border: "1px solid #30363d",
  color: "#8b949e", padding: "7px 14px", borderRadius: 6,
  cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13, transition: "all .15s", whiteSpace: "nowrap"
};

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [viewSlug, setViewSlug] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "ok" });

  const showToast = (msg, type = "ok") => setToast({ msg, type });

  useEffect(() => {
    // load font
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap";
    document.head.appendChild(link);

    document.body.style.background = "#080c10";
    document.body.style.margin = "0";
    document.body.style.minHeight = "100vh";

    // restore session
    const token = localStorage.getItem("token");
    if (token) {
      api("/auth/me")
        .then(u => setUser({ id: u._id, username: u.username }))
        .catch(() => localStorage.removeItem("token"));
    }

    // handle URL hash routing
    const onHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith("/snippets/")) {
        const slug = hash.replace("/snippets/", "");
        setViewSlug(slug);
        setPage("view");
      }
    };
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (page === "view" && viewSlug) {
      window.location.hash = `/snippets/${viewSlug}`;
    } else if (page !== "view") {
      window.location.hash = "";
    }
  }, [page, viewSlug]);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setPage("home");
    showToast("Logged out", "ok");
  };

  const pages = {
    home: <HomePage setPage={setPage} setViewSlug={setViewSlug} toast={showToast} />,
    explore: <ExplorePage setPage={setPage} setViewSlug={setViewSlug} toast={showToast} />,
    view: <ViewPage slug={viewSlug} user={user} setPage={setPage} toast={showToast} />,
    new: <NewPage setPage={setPage} setViewSlug={setViewSlug} toast={showToast} />,
    profile: <ProfilePage user={user} setPage={setPage} setViewSlug={setViewSlug} toast={showToast} />,
    login: <LoginPage setUser={setUser} setPage={setPage} toast={showToast} />,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c10" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #21262d; border-radius: 3px; }
        input::placeholder, textarea::placeholder { color: #484f58; }
        select option { background: #0d1117; color: #e6edf3; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: none; opacity: 1; } }
      `}</style>

      <Navbar user={user} page={page} setPage={setPage} onLogout={logout} />

      {pages[page] || pages.home}

      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "ok" })} />
    </div>
  );
}
