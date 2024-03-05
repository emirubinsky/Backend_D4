import fs from "fs";
import express from "express";
import { getProductsFilePath, configureMulter } from "../util.js";
import { io } from "../app.js";

const viewRouter = express.Router();
const productoFilePath = getProductsFilePath();
const imgUpload = configureMulter();

viewRouter.get("/", (req, res) => {
    res.render("home");
});

// Ruta para renderizar la vista de productos en tiempo real
viewRouter.get("/realtimeproducts", (req, res) => {
    try {
        // Lee los datos del archivo 'productos.json'
        const rawData = fs.readFileSync(productoFilePath);
        const productos = JSON.parse(rawData);

        // Renderiza la vista 'realtimeproducts' y pasa los productos como contexto
        res.render("realTimeProducts", { productos });
    } catch (error) {
        console.error("Error al leer el archivo productos.json:", error);
        res.status(500).send("Error interno del servidor");
    }
});

// Manejar la solicitud de agregar un producto en tiempo real
viewRouter.post("/realtimeproducts/addProduct", imgUpload.single("image"), (req, res) => {
    try {
        console.log("Solicitud de agregar un nuevo producto recibida");
        
        // Leer los datos del archivo 'productos.json'
        const rawData = fs.readFileSync(productoFilePath);
        let productos = JSON.parse(rawData);

        // Obtener los datos del producto del cuerpo de la solicitud
        const { title, description, price, stock, category } = req.body;
        
        console.log("Datos del producto recibidos:", title, description, price, stock, category);
        console.log("Archivo de imagen recibido:", req.file);

        const imageName = req.file ? req.file.filename : null;

        if (!imageName) {
            return res.status(400).json({ error: 'No se proporcionó una imagen válida' });
        }

        // Agregar el nuevo producto al arreglo de productos
        const newProduct = {
            id: productos.length + 1,
            title,
            description,
            price,
            stock,
            category,
            image: imageName
        };
        productos.push(newProduct);

        // Escribir los productos actualizados en el archivo 'productos.json'
        fs.writeFileSync(productoFilePath, JSON.stringify(productos, null, 2));

        // Emitir el evento 'newProduct' a todos los clientes conectados
        io.emit('newProduct', newProduct);
        
        console.log("Producto agregado:", newProduct);

        // Redirigir al usuario de nuevo a la página de realtimeproducts
        res.redirect("/realtimeproducts");
    } catch (error) {
        console.error("Error al agregar un producto:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Manejar la solicitud de eliminación de un producto en tiempo real
viewRouter.delete('/realtimeproducts/deleteProduct/:id', (req, res) => {
    try {
        const productId = parseInt(req.params.id);

        // Leer los datos del archivo 'productos.json'
        const rawData = fs.readFileSync(productoFilePath);
        let productos = JSON.parse(rawData);

        // Encuentra el índice del producto a eliminar
        const index = productos.findIndex(producto => producto.id === productId);

        if (index === -1) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Elimina el producto del arreglo de productos
        productos.splice(index, 1);

        // Escribe los productos actualizados en el archivo 'productos.json'
        fs.writeFileSync(productoFilePath, JSON.stringify(productos, null, 2));

        // Emitir un evento de eliminación a todos los clientes conectados
        io.emit('deleteProduct', productId);

        // Enviar una respuesta exitosa
        res.status(200).json({ message: 'Producto eliminado exitosamente', productId });
    } catch (error) {
        console.error('Error al eliminar un producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default viewRouter;