const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Product = require('./models/Product');

const app = express();
const PORT = 3000;

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the parent directory for existing styles/images
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(path.join(__dirname, 'public'))); // For Assignment 3 specific styles

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/assignment3_store')
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Fallback to memory array if DB is not connected (useful if DB is down but we want to see the UI)
// This is just a safety measure, normally you'd just show a 500 error.

// Products Route
app.get('/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;

        // Build query object for filtering
        let query = {};

        if (req.query.search) {
            query.name = { $regex: req.query.search, $options: 'i' };
        }

        if (req.query.category && req.query.category !== 'All') {
            query.category = req.query.category;
        }

        if (req.query.minPrice || req.query.maxPrice) {
            query.price = {};
            if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
        }

        // Build sort object
        let sortQuery = {};
        if (req.query.sort) {
            switch(req.query.sort) {
                case 'price_asc': sortQuery.price = 1; break;
                case 'price_desc': sortQuery.price = -1; break;
                case 'rating_desc': sortQuery.rating = -1; break;
                case 'name_asc': sortQuery.name = 1; break;
                default: sortQuery.createdAt = -1; // Newest first
            }
        } else {
            sortQuery.createdAt = -1;
        }

        // Fetch products and total count
        const products = await Product.find(query)
            .sort(sortQuery)
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('products', {
            products,
            currentPage: page,
            totalPages,
            search: req.query.search || '',
            category: req.query.category || 'All',
            minPrice: req.query.minPrice || '',
            maxPrice: req.query.maxPrice || '',
            sort: req.query.sort || 'newest'
        });

    } catch (err) {
        console.error('Error fetching products:', err);
        // If DB fails (e.g. not running), render page with empty products to at least show the UI
        res.render('products', {
            products: [],
            currentPage: 1,
            totalPages: 0,
            search: req.query.search || '',
            category: req.query.category || 'All',
            minPrice: req.query.minPrice || '',
            maxPrice: req.query.maxPrice || '',
            sort: req.query.sort || 'newest',
            error: "Could not connect to the database. Please ensure MongoDB is running."
        });
    }
});

// Redirect root to products page for this assignment
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
