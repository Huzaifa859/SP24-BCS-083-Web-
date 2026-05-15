const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const Product = require('./models/Product');

const app = express();
const PORT = 3000;

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(express.json());

// Serve static files from the parent directory for existing styles/images
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(path.join(__dirname, 'public'))); // For Assignment 3/4 specific styles/uploads

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public', 'uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/assignment3_store')
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));


// --- User Routes ---
app.get('/products', async (req, res) => {
    // (Existing logic kept intact)
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;

        let query = {};
        if (req.query.search) query.name = { $regex: req.query.search, $options: 'i' };
        if (req.query.category && req.query.category !== 'All') query.category = req.query.category;
        if (req.query.minPrice || req.query.maxPrice) {
            query.price = {};
            if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
        }

        let sortQuery = {};
        if (req.query.sort) {
            switch(req.query.sort) {
                case 'price_asc': sortQuery.price = 1; break;
                case 'price_desc': sortQuery.price = -1; break;
                case 'rating_desc': sortQuery.rating = -1; break;
                case 'name_asc': sortQuery.name = 1; break;
                default: sortQuery.createdAt = -1;
            }
        } else {
            sortQuery.createdAt = -1;
        }

        const products = await Product.find(query).sort(sortQuery).skip(skip).limit(limit);
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('products', {
            products, currentPage: page, totalPages,
            search: req.query.search || '', category: req.query.category || 'All',
            minPrice: req.query.minPrice || '', maxPrice: req.query.maxPrice || '', sort: req.query.sort || 'newest'
        });

    } catch (err) {
        console.error('Error fetching products:', err);
        res.render('products', { products: [], currentPage: 1, totalPages: 0, search: '', category: 'All', minPrice: '', maxPrice: '', sort: 'newest', error: "Could not connect to the database." });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});


// --- Admin Routes ---

// Admin Dashboard
app.get('/admin', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.render('admin/dashboard', { products });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Render Create Form
app.get('/admin/create', (req, res) => {
    res.render('admin/create');
});

// Handle Create Product
app.post('/admin/create', upload.single('image'), async (req, res) => {
    try {
        const { name, price, category, stock, rating } = req.body;
        let imagePath = '/img/logo.png'; // Default fallback

        if (req.file) {
            // Save relative path to serve from public
            imagePath = '/uploads/' + req.file.filename;
        }

        const newProduct = new Product({
            name,
            price,
            category,
            stock,
            rating: rating || 0,
            image: imagePath
        });

        await newProduct.save();
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating product. Please try again.');
    }
});

// Render Edit Form
app.get('/admin/edit/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Product not found');
        res.render('admin/edit', { product });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Handle Edit Product
app.post('/admin/edit/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, price, category, stock, rating } = req.body;
        const updateData = { name, price, category, stock, rating };

        if (req.file) {
            updateData.image = '/uploads/' + req.file.filename;
        }

        await Product.findByIdAndUpdate(req.params.id, updateData);
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating product.');
    }
});

// Handle Delete Product
app.post('/admin/delete/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting product.');
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
