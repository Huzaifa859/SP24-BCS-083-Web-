require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const flash = require('connect-flash');
const jwt = require('jsonwebtoken');
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');

const app = express();
const PORT = 3000;

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static Files
app.use(express.static(path.join(__dirname, '..'), { index: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection URI
const dbURI = 'mongodb://127.0.0.1:27017/assignment3_store';

// Session Middleware
app.use(session({
    secret: 'my_super_secret_ecom_key_123',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: dbURI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Flash Messages
app.use(flash());

// Global Variables Middleware (Available in all EJS templates)
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// --- Custom Authentication & Authorization Middlewares ---
const isLoggedIn = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.redirect('/login');
};

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    req.flash('error_msg', 'Access Denied: Admins Only');
    res.redirect('/login');
};

// Connect to MongoDB
mongoose.connect(dbURI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

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


// --- Authentication Routes ---

// Register Page
app.get('/register', (req, res) => {
    res.render('register');
});

// Register Handle
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    let errors = [];

    if (!name || !email || !password) errors.push({ msg: 'Please enter all fields' });
    if (password.length < 6) errors.push({ msg: 'Password must be at least 6 characters' });

    if (errors.length > 0) {
        res.render('register', { errors, name, email });
    } else {
        try {
            const userExists = await User.findOne({ email });
            if (userExists) {
                errors.push({ msg: 'Email already exists' });
                res.render('register', { errors, name, email });
            } else {
                const newUser = new User({ name, email, password });
                await newUser.save();
                req.flash('success_msg', 'You are now registered and can log in');
                res.redirect('/login');
            }
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    }
});

// Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

// Login Handle
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error_msg', 'That email is not registered');
            return res.redirect('/login');
        }

        const isMatch = await user.comparePassword(password);
        if (isMatch) {
            req.session.user = {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            };
            req.flash('success_msg', 'Welcome back, ' + user.name + '!');
            if (user.role === 'admin') {
                return res.redirect('/admin');
            } else {
                return res.redirect('/');
            }
        } else {
            req.flash('error_msg', 'Password incorrect');
            res.redirect('/login');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Logout Handle
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) console.error('Session destruction error:', err);
        res.redirect('/login');
    });
});


// --- User Routes ---
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/products', async (req, res) => {
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


// --- Admin Routes ---

// All admin routes are protected by isAdmin middleware
app.use('/admin', isAdmin);

app.get('/admin', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.render('admin/dashboard', { products });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.get('/admin/create', (req, res) => {
    res.render('admin/create');
});

app.post('/admin/create', upload.single('image'), async (req, res) => {
    try {
        const { name, price, category, stock, rating } = req.body;
        let imagePath = '/img/logo.png';

        if (req.file) {
            imagePath = '/uploads/' + req.file.filename;
        }

        const newProduct = new Product({ name, price, category, stock, rating: rating || 0, image: imagePath });
        await newProduct.save();
        req.flash('success_msg', 'Product added successfully');
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error creating product.');
        res.redirect('/admin/create');
    }
});

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

app.post('/admin/edit/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, price, category, stock, rating } = req.body;
        const updateData = { name, price, category, stock, rating };

        if (req.file) {
            updateData.image = '/uploads/' + req.file.filename;
        }

        await Product.findByIdAndUpdate(req.params.id, updateData);
        req.flash('success_msg', 'Product updated successfully');
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error updating product.');
        res.redirect(`/admin/edit/${req.params.id}`);
    }
});

app.post('/admin/delete/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Product deleted successfully');
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error deleting product.');
        res.redirect('/admin');
    }
});

// --- RESTful API Routes (v1) ---

// API Middleware: Verify JWT
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Access denied. No token provided.' });

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) return res.status(401).json({ error: 'Access denied. Malformed token.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, role, ... }
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid or expired token.' });
    }
};

// GET /api/v1/products - Public
app.get('/api/v1/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = {};
        if (req.query.category && req.query.category !== 'All') query.category = req.query.category;
        
        const products = await Product.find(query).skip(skip).limit(limit);
        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            data: products,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// GET /api/v1/products/:id - Public
app.get('/api/v1/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// POST /api/v1/auth/login - Public (Returns JWT)
app.post('/api/v1/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const payload = { id: user._id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// POST /api/v1/orders - Protected
app.post('/api/v1/orders', verifyToken, async (req, res) => {
    try {
        const { products, totalAmount } = req.body;
        
        if (!products || products.length === 0) {
            return res.status(400).json({ error: 'Order must contain products' });
        }

        const newOrder = new Order({
            user_id: req.user.id,
            products,
            totalAmount
        });

        await newOrder.save();
        res.status(201).json({ success: true, data: newOrder });
    } catch (err) {
        res.status(500).json({ error: 'Server Error', details: err.message });
    }
});

// GET /api/v1/user/profile - Protected
app.get('/api/v1/user/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
