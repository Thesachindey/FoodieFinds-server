require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");


const app = express();
const PORT = process.env.PORT || 5000;

/* ---------------- CONFIG ---------------- */
const MONGO_URI = process.env.MONGO_URI;

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors());
app.use(express.json());

/* ---------------- DB CONNECT ---------------- */
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

/* ---------------- SCHEMA ---------------- */
const dishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true
    },
    description: String,
    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
    }
  },
  { timestamps: true }
);

const Dish = mongoose.model("Dish", dishSchema);

/* ---------------- ROUTES ---------------- */

// GET all dishes
app.get("/api/dishes", async (req, res) => {
  try {
    const dishes = await Dish.find();
    res.json(dishes);
  } catch {
    res.status(500).json({ message: "Failed to fetch dishes" });
  }
});

// GET single dish by MongoDB _id
app.get("/api/dishes/:id", async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({ message: "Dish not found" });
    }
    res.json(dish);
  } catch {
    res.status(400).json({ message: "Invalid ID" });
  }
});

// POST single OR bulk dishes
app.post("/api/dishes", async (req, res) => {
  try {
    const data = req.body;

    // BULK INSERT
    if (Array.isArray(data)) {
      const cleanedData = data.filter(
        (item) => item.name && item.price
      );

      if (!cleanedData.length) {
        return res
          .status(400)
          .json({ message: "No valid dishes found" });
      }

      const result = await Dish.insertMany(cleanedData);
      return res.status(201).json(result);
    }

    // SINGLE INSERT
    const { name, price, description, image } = data;

    if (!name || !price) {
      return res
        .status(400)
        .json({ message: "Name and Price are required" });
    }

    const dish = await Dish.create({
      name,
      price,
      description,
      image
    });

    res.status(201).json(dish);
  } catch (error) {
    res.status(500).json({ message: "Failed to save dish" });
  }
});

/* ---------------- SERVER ---------------- */
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
