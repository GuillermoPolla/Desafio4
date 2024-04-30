const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const exphbs = require('express-handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const ProductManager = require('./ProductManager');
const handlebars = require('handlebars');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Configurar Handlebars
const hbs = exphbs.create({
    handlebars: allowInsecurePrototypeAccess(handlebars),
    defaultLayout: 'main'
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');

// Configurar archivos estáticos
app.use(express.static('public'));

// Crear instancia de ProductManager
const productManager = new ProductManager('./data/productos.json');

// Ruta para la vista home
app.get('/', (req, res) => {
    const products = productManager.getProduct();
    res.render('home', { products });
});

// Ruta para la vista realTimeProducts
app.get('/realtimeproducts', (req, res) => {
    const products = productManager.getProduct();
    res.render('realTimeProducts', { products });
});

// Iniciar servidor WebSocket
io.on('connection', (socket) => {
    console.log('Usuario conectado');

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });

    // Escuchar evento para agregar un producto
    socket.on('addProduct', async (product) => {
        await productManager.addProduct(product);
        io.emit('productListUpdated', await productManager.getProduct());
    });

    // Escuchar evento para eliminar un producto
    socket.on('deleteProduct', async (id) => {
        await productManager.deleteProduct(id);
        io.emit('productListUpdated', await productManager.getProduct());
    });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});
