import express from "express";
import fs from "fs";

const cartRouter = express.Router();

cartRouter.post("/", async (req, res) => {
    try {
        const rawData = fs.readFileSync("./carrito.json");
        const carritos = JSON.parse(rawData);
        
        // Genera un nuevo ID autoincrementable
        const newCartId = Math.max(...carritos.map(cart => cart.id), 0) + 1;
        
        // Estructura del nuevo carrito con el array de productos vacío
        const newCart = {
            id: newCartId,
            products: [] 
        };
        
        // Agrega el nuevo carrito al array de carritos
        carritos.push(newCart);
        
        // Guarda el array actualizado de carritos en el archivo JSON
        fs.writeFileSync("../../carrito.json", JSON.stringify(carritos, null, 2));

        res.status(201).json({ message: "Carrito creado exitosamente", cart: newCart });
    } catch (error) {
        console.error("Error al crear el carrito:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

cartRouter.get("/getCarts", async (req, res) => {
    try {
        const rawData = fs.readFileSync("../../carrito.json");
        const carritos = JSON.parse(rawData);

        let result = carritos;
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
})

cartRouter.get("/:cid", async (req, res) => {
    try {
        const cid = parseInt(req.params.cid);

        const rawData = fs.readFileSync("../../carrito.json");
        const carritos = JSON.parse(rawData);

        const cart = carritos.find(cart => cart.id === cid);

        if (!cart) {
            res.status(404).json({ error: "Carrito no encontrado" });
        } else {
            res.json(cart);
        }
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

cartRouter.post("/:cid/product/:pid", async (req, res) => {
    try {
        const cid = parseInt(req.params.cid);
        const pid = parseInt(req.params.pid);
        const { quantity } = req.body;

        if (!quantity || isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({ error: "Cantidad invalida" });
        }

        const rawData = fs.readFileSync("../../carrito.json");
        let carritos = JSON.parse(rawData);

        const cartIndex = carritos.findIndex(cart => cart.id === cid);

        if (cartIndex === -1) {
            return res.status(404).json({ error: "Carrito no encontrado" });
        }

        const productToAdd = {
            product: pid,
            quantity: parseInt(quantity)
        };

        const existingProductIndex = carritos[cartIndex].products.findIndex(item => item.product === pid);

        if (existingProductIndex !== -1) {
            // Si el producto ya existe en el carrito, se actualiza la cantidad
            carritos[cartIndex].products[existingProductIndex].quantity += parseInt(quantity);
        } else {
            // Si el producto no existe en el carrito, se agrega al arreglo de productos
            carritos[cartIndex].products.push(productToAdd);
        }

        fs.writeFileSync("../../carrito.json", JSON.stringify(carritos, null, 2));

        res.json({ message: "Producto agregado al carrito exitosamente", cart: carritos[cartIndex] });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default cartRouter;