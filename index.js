require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------------- CONFIG ---------------- */
const MONGO_URI = process.env.MONGO_URI;

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors({
  origin: 'https://your-frontend.vercel.app', // replace with your frontend URL
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

/* ---------------- DB CONNECT ---------------- */
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

/* ---------------- SCHEMA ---------------- */
const dishSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  description: String,
  image: { type: String, default: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c" }
}, { timestamps: true });

const Dish = mongoose.model("Dish", dishSchema);

/* ---------------- ROUTES ---------------- */

// ADMIN LOGIN (Mock)
app.post('/api/admin-login', (req, res) => {
  const { email, password } = req.body;

  if (email === 'admin@foodiefinds.com' && password === 'admin123') {
    // set HttpOnly cookie for authentication
    res.cookie('auth', 'true', {
      httpOnly: true,
      maxAge: 24*60*60*1000, // 1 day
      sameSite: 'lax'
    });
    return res.json({ message: 'Login successful' });
  }

  res.status(401).json({ message: 'Invalid email or password' });
});

// GET all dishes
app.get("/api/dishes", async (req, res) => {
  try {
    const dishes = await Dish.find();
    res.json(dishes);
  } catch {
    res.status(500).json({ message: "Failed to fetch dishes" });
  }
});

// POST single or bulk dishes
app.post("/api/dishes", async (req, res) => {
  try {
    const data = req.body;

    if (Array.isArray(data)) {
      const cleanedData = data.filter(item => item.name && item.price);
      if (!cleanedData.length) return res.status(400).json({ message: "No valid dishes found" });

      const result = await Dish.insertMany(cleanedData);
      return res.status(201).json(result);
    }

    const { name, price, description, image } = data;
    if (!name || !price) return res.status(400).json({ message: "Name and Price are required" });

    const dish = await Dish.create({ name, price, description, image });
    res.status(201).json(dish);

  } catch (error) {
    res.status(500).json({ message: "Failed to save dish" });
  }
});

/* ---------------- SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
