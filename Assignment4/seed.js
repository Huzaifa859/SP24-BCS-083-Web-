const mongoose = require('mongoose');
const Product = require('./models/Product');

// Sample products dataset using images referenced in index.html where possible
const products = [
    { name: 'Air Jordan 1 Retro High', price: 180, category: 'Shoes', rating: 4.8, stock: 45, image: '/img/imgi_8_image.png' },
    { name: 'Nike Air Max 270', price: 150, category: 'Shoes', rating: 4.5, stock: 120, image: '/img/imgi_9_image.png' },
    { name: 'Nike Sportswear Graphic Tee', price: 35, category: 'Clothing', rating: 4.2, stock: 200, image: '/img/imgi_10_image.png' },
    { name: 'Nike Dunk Low', price: 110, category: 'Shoes', rating: 4.7, stock: 60, image: '/img/imgi_11_image.png' },
    { name: 'Nike Air Force 1 07', price: 115, category: 'Shoes', rating: 4.9, stock: 300, image: '/img/imgi_12_image.png' },
    { name: 'Nike 24.7 Collection Hoodie', price: 85, category: 'Clothing', rating: 4.6, stock: 80, image: '/img/imgi_13_image.png' },
    { name: 'Nike Zoom Vomero 5', price: 160, category: 'Shoes', rating: 4.4, stock: 55, image: '/img/imgi_14_image.png' },
    { name: 'Nike Ava Rover Training Shoes', price: 130, category: 'Shoes', rating: 4.1, stock: 75, image: '/img/imgi_15_image.png' },
    { name: 'Nike ACG Mountain Fly', price: 200, category: 'Shoes', rating: 4.8, stock: 30, image: '/img/imgi_16_image.png' },
    { name: 'Nike Track & Field Shorts', price: 45, category: 'Clothing', rating: 4.3, stock: 150, image: '/img/imgi_17_image.png' },
    { name: 'Nike Structure Plus 25', price: 140, category: 'Shoes', rating: 4.5, stock: 90, image: '/img/imgi_18_image.png' },
    { name: 'Nike Metcon 9', price: 150, category: 'Shoes', rating: 4.7, stock: 110, image: '/img/imgi_19_image.png' },
    { name: 'Nike NBA Fan Gear Jersey', price: 120, category: 'Clothing', rating: 4.9, stock: 250, image: '/img/imgi_20_image.png' },
    { name: 'Air Jordan 4 Retro', price: 210, category: 'Shoes', rating: 5.0, stock: 20, image: '/img/imgi_21_image.png' },
    { name: 'Sabrina 3 Basketball Shoes', price: 130, category: 'Shoes', rating: 4.6, stock: 65, image: '/img/imgi_22_image.png' },
    { name: 'Tatum 4 Signature Shoes', price: 125, category: 'Shoes', rating: 4.4, stock: 85, image: '/img/imgi_23_image.png' },
    { name: 'Nike Dri-FIT Adv Run Top', price: 65, category: 'Clothing', rating: 4.2, stock: 180, image: '/img/imgi_10_image.png' },
    { name: 'Nike Pro Training Tights', price: 55, category: 'Clothing', rating: 4.5, stock: 140, image: '/img/imgi_17_image.png' },
    { name: 'Nike Elite Basketball Socks', price: 18, category: 'Accessories', rating: 4.8, stock: 500, image: '/img/imgi_11_image.png' },
    { name: 'Nike Heritage Waistpack', price: 25, category: 'Accessories', rating: 4.3, stock: 220, image: '/img/imgi_16_image.png' },
    { name: 'Nike Brasilia Training Duffel Bag', price: 40, category: 'Accessories', rating: 4.6, stock: 130, image: '/img/imgi_20_image.png' },
    { name: 'Nike Sportswear Tech Fleece Joggers', price: 120, category: 'Clothing', rating: 4.7, stock: 95, image: '/img/imgi_13_image.png' },
    { name: 'Nike Air Zoom Pegasus 40', price: 130, category: 'Shoes', rating: 4.5, stock: 160, image: '/img/imgi_18_image.png' },
    { name: 'Nike Dri-FIT Basketball Shorts', price: 35, category: 'Clothing', rating: 4.4, stock: 210, image: '/img/imgi_17_image.png' },
    { name: 'Nike Headband', price: 15, category: 'Accessories', rating: 4.1, stock: 350, image: '/img/imgi_10_image.png' }
];

const seedDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/assignment3_store');
        console.log('MongoDB connected for seeding...');

        // Clear existing products
        await Product.deleteMany({});
        console.log('Existing products cleared.');

        // Insert seed products
        await Product.insertMany(products);
        console.log(`Successfully seeded ${products.length} products.`);

        mongoose.connection.close();
        console.log('Database connection closed.');
    } catch (err) {
        console.error('Error seeding database:', err);
        mongoose.connection.close();
    }
};

seedDB();
