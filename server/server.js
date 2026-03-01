const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const { nanoid } = require("nanoid");

const app = express();
app.use(express.json());
app.use(cors());

// Serve static HTML UI
app.use(express.static(path.join(__dirname, "public")));

const JWT_SECRET = process.env.JWT_SECRET || "codeshare_secret_key_2024";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/codeshare";

mongoose.connect(MONGO_URI).then(() => console.log("MongoDB connected"));

// ─── SCHEMAS ───────────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, trim: true },
  password: { type: String, required: true },
  bio: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const SnippetSchema = new mongoose.Schema({
  slug: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  code: { type: String, required: true },
  language: { type: String, default: "plaintext" },
  description: { type: String, default: "" },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);
const Snippet = mongoose.model("Snippet", SnippetSchema);

// ─── MIDDLEWARE ─────────────────────────────────────────────────────────────────

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch {}
  }
  next();
};

// ─── AUTH ROUTES ────────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    if (username.length < 3) return res.status(400).json({ error: "Username must be at least 3 characters" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ error: "Username already taken" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed });
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/me
app.get("/api/auth/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

// ─── SNIPPET ROUTES ─────────────────────────────────────────────────────────────

// POST /api/snippets — create
app.post("/api/snippets", auth, async (req, res) => {
  try {
    const { title, code, language, description } = req.body;
    if (!title || !code) return res.status(400).json({ error: "Title and code required" });

    const slug = nanoid(8);
    const snippet = await Snippet.create({
      slug,
      title,
      code,
      language: language || "plaintext",
      description: description || "",
      author: req.user.id,
    });

    await snippet.populate("author", "username");
    res.json(snippet);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/snippets — list all (paginated)
app.get("/api/snippets", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const snippets = await Snippet.find()
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Snippet.countDocuments();
    res.json({ snippets, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/snippets/:slug — get single snippet
app.get("/api/snippets/:slug", optionalAuth, async (req, res) => {
  try {
    const snippet = await Snippet.findOne({ slug: req.params.slug }).populate("author", "username");
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });

    snippet.views += 1;
    await snippet.save();

    res.json(snippet);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/snippets/:slug/raw — raw code
app.get("/api/snippets/:slug/raw", async (req, res) => {
  try {
    const snippet = await Snippet.findOne({ slug: req.params.slug });
    if (!snippet) return res.status(404).send("Not found");
    res.setHeader("Content-Type", "text/plain");
    res.send(snippet.code);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// PUT /api/snippets/:slug — update (owner only)
app.put("/api/snippets/:slug", auth, async (req, res) => {
  try {
    const snippet = await Snippet.findOne({ slug: req.params.slug });
    if (!snippet) return res.status(404).json({ error: "Not found" });
    if (snippet.author.toString() !== req.user.id)
      return res.status(403).json({ error: "Not your snippet" });

    const { title, code, language, description } = req.body;
    if (title) snippet.title = title;
    if (code) snippet.code = code;
    if (language) snippet.language = language;
    if (description !== undefined) snippet.description = description;
    snippet.updatedAt = new Date();

    await snippet.save();
    await snippet.populate("author", "username");
    res.json(snippet);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/snippets/:slug
app.delete("/api/snippets/:slug", auth, async (req, res) => {
  try {
    const snippet = await Snippet.findOne({ slug: req.params.slug });
    if (!snippet) return res.status(404).json({ error: "Not found" });
    if (snippet.author.toString() !== req.user.id)
      return res.status(403).json({ error: "Not your snippet" });

    await snippet.deleteOne();
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── USER ROUTES ─────────────────────────────────────────────────────────────────

// GET /api/users/:username — profile
app.get("/api/users/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    const snippets = await Snippet.find({ author: user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ user, snippets });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/users/me/bio
app.put("/api/users/me/bio", auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bio: req.body.bio || "" },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── START ───────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════╗
  ║     CodeShare API Running        ║
  ║     http://localhost:${PORT}       ║
  ╚══════════════════════════════════╝

  Endpoints:
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/me

  POST   /api/snippets
  GET    /api/snippets
  GET    /api/snippets/:slug
  GET    /api/snippets/:slug/raw
  PUT    /api/snippets/:slug
  DELETE /api/snippets/:slug

  GET    /api/users/:username
  PUT    /api/users/me/bio
  `);
});
