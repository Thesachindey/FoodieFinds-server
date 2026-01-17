require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------------- 1. CONFIG ---------------- */
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

/* ---------------- 2. MIDDLEWARE ---------------- */
app.use(cors({
  origin: [
    'http://localhost:3000',                  // local frontend
    'https://foodiefinds-blush.vercel.app'   // deployed frontend
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

/* ---------------- 3. DB CONNECT ---------------- */
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
  });

/* ---------------- 4. SCHEMA ---------------- */
const dishSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: { type: String, required: true, trim: true },
  price: { type: String, required: true },
  description: { type: String, default: '' },
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
      secure: process.env.NODE_ENV === 'production' // HTTPS only on prod
    });
    return res.json({ message: 'Login successful' });
  }

  res.status(401).json({ message: 'Invalid email or password' });
});

// GET ALL DISHES
app.get("/api/dishes", async (req, res) => {
  try {
    const dishes = await Dish.find().sort({ id: 1 });
    res.json(dishes);
  } catch (error) {
    console.error("Fetch Dishes Error:", error);
    res.status(500).json({ message: "Failed to fetch dishes" });
  }
});

// GET SINGLE DISH BY ID
// GET SINGLE DISH (Handles both "1" and "696bbcf...")
app.get("/api/dishes/:id", async (req, res) => {
  const param = req.params.id;

  try {
    let query;

    // 1. If it looks like a MongoDB ID (24 hex characters), search by _id
    if (mongoose.Types.ObjectId.isValid(param)) {
      query = { _id: param };
    } 
    // 2. Otherwise, assume it's a Number (Custom ID)
    else {
      query = { id: parseInt(param) };
    }

    const dish = await Dish.findOne(query);

    if (!dish) {
      return res.status(404).json({ message: "Dish not found" });
    }
    
    res.json(dish);

  } catch (error) {
    console.error("Fetch Dish Error:", error);
    res.status(500).json({ message: "Error fetching dish" });
  }
});

// POST SINGLE OR BULK DISHES
app.post("/api/dishes", async (req, res) => {
  try {
    const data = req.body;

    // BULK INSERT
    if (Array.isArray(data)) {
      const lastDish = await Dish.findOne().sort({ id: -1 });
      let nextId = lastDish ? lastDish.id + 1 : 1;

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

    // SINGLE INSERT
    const { name, price, description, image } = data;
    if (!name || !price) return res.status(400).json({ message: "Name and Price are required" });

    const lastDish = await Dish.findOne().sort({ id: -1 });
    const nextId = lastDish ? lastDish.id + 1 : 1;

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
