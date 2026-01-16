const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors()); // Allows Next.js (port 3000) to talk to Express (port 5000)
app.use(bodyParser.json());

// Mock Database (In-Memory Array)
let dishes = [
    {
        id: 1,
        name: "Spicy Basil Chicken",
        price: "14.99",
        description: "Fresh basil leaves stir-fried with chicken, chili, and garlic.",
        image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 2,
        name: "Classic Cheeseburger",
        price: "11.50",
        description: "Juicy beef patty topped with cheddar, lettuce, tomato, and house sauce.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 3,
        name: "Vegan Buddha Bowl",
        price: "13.00",
        description: "Quinoa, avocado, roasted chickpeas, kale, and tahini dressing.",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 4,
        name: "Seafood Paella",
        price: "22.00",
        description: "Traditional Spanish rice dish with shrimp, mussels, and saffron.",
        image: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 5,
        name: "Tiramisu",
        price: "8.50",
        description: "Classic Italian dessert with layers of coffee-soaked ladyfingers and mascarpone.",
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80"
    }
];

// Routes

// 1. Get All Dishes
app.get('/api/dishes', (req, res) => {
    res.json(dishes);
});

// 2. Get Single Dish by ID
app.get('/api/dishes/:id', (req, res) => {
    const dishId = parseInt(req.params.id);
    const dish = dishes.find(d => d.id === dishId);
    
    if (dish) {
        res.json(dish);
    } else {
        res.status(404).json({ message: "Dish not found" });
    }
});

// 3. Add New Dish
app.post('/api/dishes', (req, res) => {
    const newDish = req.body;
    
    // Simple validation
    if (!newDish.name || !newDish.price) {
        return res.status(400).json({ message: "Name and Price are required" });
    }

    // Auto-generate ID
    newDish.id = dishes.length + 1;
    
    // Add to database
    dishes.push(newDish);
    
    res.status(201).json({ message: "Dish added successfully", dish: newDish });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});