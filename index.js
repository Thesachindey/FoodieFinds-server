require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------------- 1. CONFIG ---------------- */
const MONGO_URI = process.env.MONGO_URI;

/* ---------------- 2. MIDDLEWARE ---------------- */
app.use(cors({
  origin: [
    'http://localhost:3000', // local frontend
    'https://foodiefinds-blush.vercel.app' // deployed frontend
  ],
  credentials: true // allow cookies to be sent
}));
app.use(express.json());
app.use(cookieParser());

/* ---------------- 3. DB CONNECT ---------------- */
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

/* ---------------- 4. SCHEMA ---------------- */
const dishSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: { type: String, required: true, trim: true },
  price: { type: String, required: true },
  description: String,
  image: { type: String, default: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c" }
}, { timestamps: true });

const Dish = mongoose.model("Dish", dishSchema);

/* ---------------- 5. ROUTES ---------------- */

// ADMIN LOGIN
app.post('/api/admin-login', (req, res) => {
  const { email, password } = req.body;

  if (email === 'admin@foodiefinds.com' && password === 'admin123') {
    res.cookie('auth', 'true', {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    return res.json({ message: 'Login successful' });
  }

  res.status(401).json({ message: 'Invalid email or password' });
});

// GET all dishes
app.get("/api/dishes", async (req, res) => {
  try {
    const dishes = await Dish.find().sort({ id: 1 });
    res.json(dishes);
  } catch (error) {
    console.error("Fetch Dishes Error:", error);
    res.status(500).json({ message: "Failed to fetch dishes" });
  }
});

// GET single dish by ID
app.get('/api/dishes/:id', async (req, res) => {
  try {
    const dish = await Dish.findOne({ id: parseInt(req.params.id) });
    if (dish) return res.json(dish);
    return res.status(404).json({ message: "Dish not found" });
  } catch (error) {
    console.error("Fetch Dish Error:", error);
    res.status(500).json({ message: "Error fetching dish" });
  }
});

// POST single or bulk dishes
app.post("/api/dishes", async (req, res) => {
  try {
    const data = req.body;

    // Bulk insert
    if (Array.isArray(data)) {
      const lastDish = await Dish.findOne().sort({ id: -1 });
      let nextId = lastDish && lastDish.id ? lastDish.id + 1 : 1;

      const dishesWithIds = data.map(d => ({
        id: nextId++,
        name: d.name,
        price: d.price,
        description: d.description || '',
        image: d.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
      }));

      const result = await Dish.insertMany(dishesWithIds);
      return res.status(201).json(result);
    }

    // Single insert
    const { name, price, description, image } = data;
    if (!name || !price) return res.status(400).json({ message: "Name and Price are required" });

    const lastDish = await Dish.findOne().sort({ id: -1 });
    const nextId = lastDish && lastDish.id ? lastDish.id + 1 : 1;

    const dish = await Dish.create({
      id: nextId,
      name,
      price,
      description: description || '',
      image: image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
    });

    console.log(`Saved: ${dish.name} (ID: ${dish.id})`);
    res.status(201).json(dish);

  } catch (error) {
    console.error("Save Dish Error:", error);
    res.status(500).json({ message: "Failed to save dish" });
  }
});

/* ---------------- 6. SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
