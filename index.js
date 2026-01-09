const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

console.log('Starting RecetasWorld server...');

// Simple persistent storage using JSON files
let recipes = [];
let users = [];
let nextRecipeId = 1;
let nextUserId = 1;

// File paths for persistent storage
const RECIPES_FILE = path.join(__dirname, 'recipes-data.json');
const USERS_FILE = path.join(__dirname, 'users-data.json');

// Load data from files
function loadData() {
    // Load recipes
    if (fs.existsSync(RECIPES_FILE)) {
        try {
            const recipesData = fs.readFileSync(RECIPES_FILE, 'utf8');
            recipes = JSON.parse(recipesData);
            if (recipes.length > 0) {
                nextRecipeId = Math.max(...recipes.map(r => r.id || 0)) + 1;
            }
            console.log(`📚 Loaded ${recipes.length} recipes from file`);
        } catch (err) {
            console.error('❌ Error loading recipes:', err);
            recipes = [];
        }
    }
    
    // Load users
    if (fs.existsSync(USERS_FILE)) {
        try {
            const usersData = fs.readFileSync(USERS_FILE, 'utf8');
            users = JSON.parse(usersData);
            if (users.length > 0) {
                nextUserId = Math.max(...users.map(u => u.id || 0)) + 1;
            }
            console.log(`👥 Loaded ${users.length} users from file`);
        } catch (err) {
            console.error('❌ Error loading users:', err);
            users = [];
        }
    }
}

// Save data to files
function saveRecipes() {
    try {
        fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2));
        console.log(`💾 Saved ${recipes.length} recipes to file`);
        return true;
    } catch (err) {
        console.error('❌ Error saving recipes:', err);
        return false;
    }
}

function saveUsers() {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        console.log(`💾 Saved ${users.length} users to file`);
        return true;
    } catch (err) {
        console.error('❌ Error saving users:', err);
        return false;
    }
}

function sendResponse(res, statusCode, data, contentType = 'application/json') {
    res.writeHead(statusCode, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    
    if (contentType === 'application/json') {
        res.end(JSON.stringify(data));
    } else {
        res.end(data);
    }
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;
    const method = req.method;

    console.log(`${method} ${pathname}`);

    // CORS preflight
    if (method === 'OPTIONS') {
        sendResponse(res, 200, {});
        return;
    }

    // Health check
    if (pathname === '/health') {
        sendResponse(res, 200, { 
            status: 'ok', 
            message: 'RecetasWorld is running',
            timestamp: new Date().toISOString()
        });
        return;
    }

    // API Routes
    if (pathname.startsWith('/api/')) {
        if (pathname === '/api/recipes' && method === 'GET') {
            sendResponse(res, 200, { recetas: recipes });
            return;
        }

        if (pathname === '/api/recipes' && method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    
                    // Handle image upload
                    if (data.imageBase64) {
                        try {
                            const matches = data.imageBase64.match(/^data:(image\/(png|jpeg|jpg|gif|webp));base64,(.+)$/);
                            if (matches) {
                                const ext = matches[2] === 'jpeg' ? 'jpg' : matches[2];
                                const base64 = matches[3];
                                const uploadsDir = path.join(__dirname, 'img', 'uploads');
                                
                                if (!fs.existsSync(uploadsDir)) {
                                    fs.mkdirSync(uploadsDir, { recursive: true });
                                }
                                
                                const filename = `recipe-${Date.now()}.${ext}`;
                                const filepath = path.join(uploadsDir, filename);
                                fs.writeFileSync(filepath, Buffer.from(base64, 'base64'));
                                data.imagen = `img/uploads/${filename}`;
                            }
                        } catch (imgErr) {
                            console.error('Image processing error:', imgErr);
                        }
                    }
                    
                    const recipe = {
                        id: nextRecipeId++,
                        nombre: data.nombre || 'Nueva Receta',
                        pais: data.pais || '',
                        tiempo: data.tiempo || 0,
                        categorias: data.categorias || [],
                        ingredientes: data.ingredientes || [],
                        instrucciones: data.instrucciones || [],
                        imagen: data.imagen || '',
                        calificacion: 0,
                        resenas: 0
                    };
                    recipes.unshift(recipe);
                    saveRecipes(); // Save to file
                    sendResponse(res, 201, { ok: true, receta: recipe });
                } catch (err) {
                    sendResponse(res, 400, { ok: false, error: 'Invalid JSON' });
                }
            });
            return;
        }

        if (pathname === '/api/recipes' && method === 'PUT') {
            const id = parseInt(url.searchParams.get('id'), 10);
            if (!id) {
                sendResponse(res, 400, { ok: false, error: 'ID required' });
                return;
            }
            
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const recipeIndex = recipes.findIndex(r => r.id === id);
                    
                    if (recipeIndex === -1) {
                        sendResponse(res, 404, { ok: false, error: 'Recipe not found' });
                        return;
                    }

                    // Handle image upload
                    if (data.imageBase64) {
                        try {
                            const matches = data.imageBase64.match(/^data:(image\/(png|jpeg|jpg|gif|webp));base64,(.+)$/);
                            if (matches) {
                                const ext = matches[2] === 'jpeg' ? 'jpg' : matches[2];
                                const base64 = matches[3];
                                const uploadsDir = path.join(__dirname, 'img', 'uploads');
                                
                                if (!fs.existsSync(uploadsDir)) {
                                    fs.mkdirSync(uploadsDir, { recursive: true });
                                }
                                
                                const filename = `recipe-${id}-${Date.now()}.${ext}`;
                                const filepath = path.join(uploadsDir, filename);
                                fs.writeFileSync(filepath, Buffer.from(base64, 'base64'));
                                data.imagen = `img/uploads/${filename}`;
                            }
                        } catch (imgErr) {
                            console.error('Image processing error:', imgErr);
                        }
                    }

                    const currentRecipe = recipes[recipeIndex];
                    const updatedRecipe = {
                        ...currentRecipe,
                        nombre: data.nombre !== undefined ? data.nombre : currentRecipe.nombre,
                        pais: data.pais !== undefined ? data.pais : currentRecipe.pais,
                        tiempo: data.tiempo !== undefined ? parseInt(data.tiempo) : currentRecipe.tiempo,
                        categorias: data.categorias !== undefined ? data.categorias : currentRecipe.categorias,
                        ingredientes: data.ingredientes !== undefined ? data.ingredientes : currentRecipe.ingredientes,
                        instrucciones: data.instrucciones !== undefined ? data.instrucciones : currentRecipe.instrucciones,
                        imagen: data.imagen !== undefined ? data.imagen : currentRecipe.imagen
                    };

                    recipes[recipeIndex] = updatedRecipe;
                    saveRecipes(); // Save to file
                    sendResponse(res, 200, { ok: true, receta: updatedRecipe });
                } catch (err) {
                    sendResponse(res, 400, { ok: false, error: 'Invalid JSON' });
                }
            });
            return;
        }

        if (pathname === '/api/recipes' && method === 'DELETE') {
            const id = parseInt(url.searchParams.get('id'), 10);
            if (!id) {
                sendResponse(res, 400, { ok: false, error: 'ID required' });
                return;
            }

            const recipeIndex = recipes.findIndex(r => r.id === id);
            if (recipeIndex === -1) {
                sendResponse(res, 404, { ok: false, error: 'Recipe not found' });
                return;
            }

            recipes.splice(recipeIndex, 1);
            saveRecipes(); // Save to file
            sendResponse(res, 200, { ok: true });
            return;
        }

        if (pathname === '/api/users' && method === 'GET') {
            sendResponse(res, 200, { users: users.map(u => ({ id: u.id, username: u.username, role: u.role })) });
            return;
        }

        if (pathname === '/api/register' && method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (!data.username || !data.password) {
                        sendResponse(res, 400, { ok: false, error: 'Username and password required' });
                        return;
                    }
                    
                    const existingUser = users.find(u => u.username === data.username);
                    if (existingUser) {
                        sendResponse(res, 409, { ok: false, error: 'User already exists' });
                        return;
                    }
                    
                    const user = {
                        id: nextUserId++,
                        username: data.username,
                        password: data.password,
                        role: data.role || 'user'
                    };
                    users.push(user);
                    saveUsers(); // Save to file
                    sendResponse(res, 201, { ok: true, user: { id: user.id, username: user.username, role: user.role } });
                } catch (err) {
                    sendResponse(res, 400, { ok: false, error: 'Invalid JSON' });
                }
            });
            return;
        }

        if (pathname === '/api/login' && method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const user = users.find(u => u.username === data.username && u.password === data.password);
                    if (user) {
                        sendResponse(res, 200, { ok: true, user: { id: user.id, username: user.username, role: user.role } });
                    } else {
                        sendResponse(res, 401, { ok: false, error: 'Invalid credentials' });
                    }
                } catch (err) {
                    sendResponse(res, 400, { ok: false, error: 'Invalid JSON' });
                }
            });
            return;
        }

        // Unknown API route
        sendResponse(res, 404, { ok: false, error: 'API route not found' });
        return;
    }

    // Static files
    let filePath;
    if (pathname === '/') {
        filePath = path.join(__dirname, 'index.html');
    } else {
        // Remove leading slash and join with __dirname
        const cleanPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
        filePath = path.join(__dirname, cleanPath);
    }
    
    // Security check - prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(__dirname)) {
        sendResponse(res, 403, { error: 'Forbidden' });
        return;
    }

    // Check if file exists and log for debugging
    console.log(`📁 Looking for file: ${filePath}`);
    console.log(`📂 Directory exists: ${fs.existsSync(path.dirname(filePath))}`);
    console.log(`📄 File exists: ${fs.existsSync(filePath)}`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        sendResponse(res, 404, { error: 'File not found' });
        return;
    }
    
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
        console.log(`❌ Not a file: ${filePath}`);
        sendResponse(res, 404, { error: 'Not a file' });
        return;
    }

    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject'
    };
    
    const contentType = mimeTypes[ext] || 'text/plain';
    
    try {
        const content = fs.readFileSync(filePath);
        sendResponse(res, 200, content, contentType);
    } catch (error) {
        console.error('Error reading file:', error);
        sendResponse(res, 500, { error: 'Internal server error' });
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ RecetasWorld server running on port ${PORT}`);
    console.log(`🌐 Frontend available at: http://localhost:${PORT}`);
    console.log(`🔗 API available at: http://localhost:${PORT}/api/`);
    console.log(`📁 Working directory: ${__dirname}`);
    
    // Load existing data
    loadData();
    
    // If no data exists, add sample data
    if (recipes.length === 0) {
        console.log('📝 Adding comprehensive recipe database...');
        
        // Simple test recipes
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Tacos al Pastor',
            pais: 'México',
            tiempo: 30,
            categorias: ['Mexicana', 'Cena'],
            ingredientes: ['Carne de cerdo', 'Tortillas', 'Piña', 'Cebolla'],
            instrucciones: ['Marinar la carne', 'Cocinar en trompo', 'Servir en tortillas'],
            imagen: 'img/tacos-al-pastor.svg',
            calificacion: 4.5,
            resenas: 10
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Pancakes Americanos',
            pais: 'Estados Unidos',
            tiempo: 20,
            categorias: ['Americana', 'Desayuno'],
            ingredientes: ['Harina', 'Huevos', 'Leche', 'Azúcar'],
            instrucciones: ['Mezclar ingredientes', 'Cocinar en sartén'],
            imagen: 'img/pancakes-americanos.svg',
            calificacion: 4.2,
            resenas: 8
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Spaghetti Carbonara',
            pais: 'Italia',
            tiempo: 25,
            categorias: ['Italiana', 'Cena'],
            ingredientes: ['Spaghetti', 'Huevos', 'Queso', 'Panceta'],
            instrucciones: ['Cocinar pasta', 'Mezclar con huevos', 'Agregar panceta'],
            imagen: 'img/spaghetti-carbonara.svg',
            calificacion: 4.7,
            resenas: 15
        });
        
        // Agregar más recetas variadas
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Huevos Rancheros',
            pais: 'México',
            tiempo: 15,
            categorias: ['Mexicana', 'Desayuno'],
            ingredientes: ['Huevos', 'Tortillas', 'Salsa roja', 'Frijoles', 'Queso'],
            instrucciones: ['Calentar tortillas', 'Freír huevos', 'Calentar salsa', 'Montar plato'],
            imagen: 'img/huevos-rancheros.svg',
            calificacion: 4.4,
            resenas: 18
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Waffles Belgas',
            pais: 'Bélgica',
            tiempo: 25,
            categorias: ['Europea', 'Desayuno'],
            ingredientes: ['Harina', 'Huevos', 'Leche', 'Mantequilla', 'Azúcar'],
            instrucciones: ['Separar claras', 'Mezclar ingredientes', 'Cocinar en waflera'],
            imagen: 'img/waffles-belgas.svg',
            calificacion: 4.5,
            resenas: 14
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Smoothie Bowl',
            pais: 'Brasil',
            tiempo: 10,
            categorias: ['Saludable', 'Desayuno'],
            ingredientes: ['Açaí', 'Plátano', 'Granola', 'Fresas', 'Miel'],
            instrucciones: ['Licuar açaí', 'Servir en bowl', 'Decorar con frutas'],
            imagen: 'img/smoothie-bowl.svg',
            calificacion: 4.3,
            resenas: 12
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Pollo al Curry',
            pais: 'India',
            tiempo: 45,
            categorias: ['India', 'Comida'],
            ingredientes: ['Pollo', 'Leche de coco', 'Curry', 'Cebolla', 'Ajo'],
            instrucciones: ['Sofreír especias', 'Agregar pollo', 'Cocinar con leche de coco'],
            imagen: 'img/pollo-curry.svg',
            calificacion: 4.4,
            resenas: 18
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Pizza Margherita',
            pais: 'Italia',
            tiempo: 30,
            categorias: ['Italiana', 'Cena'],
            ingredientes: ['Masa de pizza', 'Salsa tomate', 'Mozzarella', 'Albahaca'],
            instrucciones: ['Extender masa', 'Agregar salsa', 'Poner queso', 'Hornear'],
            imagen: 'img/pizza-margherita.svg',
            calificacion: 4.4,
            resenas: 22
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Salmón a la Plancha',
            pais: 'Noruega',
            tiempo: 20,
            categorias: ['Saludable', 'Comida'],
            ingredientes: ['Salmón', 'Limón', 'Aceite oliva', 'Sal', 'Pimienta'],
            instrucciones: ['Sazonar salmón', 'Calentar plancha', 'Cocinar 4 min por lado'],
            imagen: 'img/salmon-plancha.svg',
            calificacion: 4.3,
            resenas: 20
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Mojito',
            pais: 'Cuba',
            tiempo: 5,
            categorias: ['Cubana', 'Bebida'],
            ingredientes: ['Ron blanco', 'Menta', 'Limón', 'Azúcar', 'Soda'],
            instrucciones: ['Machacar menta', 'Agregar limón', 'Añadir ron', 'Completar con soda'],
            imagen: 'img/mojito.svg',
            calificacion: 4.3,
            resenas: 16
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Guacamole',
            pais: 'México',
            tiempo: 10,
            categorias: ['Mexicana', 'Botana'],
            ingredientes: ['Aguacate', 'Limón', 'Cebolla', 'Tomate', 'Chile'],
            instrucciones: ['Machacar aguacate', 'Agregar vegetales', 'Sazonar'],
            imagen: 'img/guacamole.svg',
            calificacion: 4.5,
            resenas: 35
        });
        
        // ========== MÁS DESAYUNOS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Croissants Franceses',
            pais: 'Francia',
            tiempo: 180,
            categorias: ['Francesa', 'Desayuno'],
            ingredientes: ['Harina', 'Mantequilla', 'Levadura', 'Leche', 'Sal'],
            instrucciones: ['Preparar masa', 'Laminar mantequilla', 'Plegar', 'Hornear'],
            imagen: 'img/croissants-franceses.svg',
            calificacion: 4.6,
            resenas: 20
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Chilaquiles Rojos',
            pais: 'México',
            tiempo: 20,
            categorias: ['Mexicana', 'Desayuno'],
            ingredientes: ['Tortillas', 'Salsa roja', 'Queso', 'Crema', 'Cebolla'],
            instrucciones: ['Freír tortillas', 'Calentar salsa', 'Mezclar', 'Servir con queso'],
            imagen: 'img/chilaquiles-rojos.svg',
            calificacion: 4.5,
            resenas: 22
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Muffins de Arándanos',
            pais: 'Estados Unidos',
            tiempo: 35,
            categorias: ['Americana', 'Desayuno'],
            ingredientes: ['Harina', 'Arándanos', 'Huevos', 'Leche', 'Azúcar'],
            instrucciones: ['Mezclar secos', 'Combinar líquidos', 'Agregar arándanos', 'Hornear'],
            imagen: 'img/muffins-arandanos.svg',
            calificacion: 4.2,
            resenas: 11
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Tostadas de Aguacate',
            pais: 'Australia',
            tiempo: 10,
            categorias: ['Saludable', 'Desayuno'],
            ingredientes: ['Pan integral', 'Aguacate', 'Limón', 'Sal', 'Tomate'],
            instrucciones: ['Tostar pan', 'Machacar aguacate', 'Sazonar', 'Servir'],
            imagen: 'img/tostadas-aguacate.svg',
            calificacion: 4.0,
            resenas: 13
        });
        
        // ========== MÁS COMIDAS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Lasaña de Carne',
            pais: 'Italia',
            tiempo: 90,
            categorias: ['Italiana', 'Comida'],
            ingredientes: ['Pasta lasaña', 'Carne molida', 'Salsa tomate', 'Queso', 'Bechamel'],
            instrucciones: ['Preparar boloñesa', 'Hacer bechamel', 'Armar capas', 'Hornear'],
            imagen: 'img/lasana-carne.svg',
            calificacion: 4.6,
            resenas: 25
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Paella Valenciana',
            pais: 'España',
            tiempo: 60,
            categorias: ['Española', 'Comida'],
            ingredientes: ['Arroz', 'Pollo', 'Conejo', 'Judías', 'Azafrán'],
            instrucciones: ['Sofreír carnes', 'Agregar arroz', 'Añadir caldo', 'Cocinar sin remover'],
            imagen: 'img/paella-valenciana.svg',
            calificacion: 4.7,
            resenas: 28
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Pad Thai',
            pais: 'Tailandia',
            tiempo: 25,
            categorias: ['Tailandesa', 'Comida'],
            ingredientes: ['Fideos de arroz', 'Camarones', 'Huevo', 'Brotes soja', 'Salsa tamarindo'],
            instrucciones: ['Remojar fideos', 'Saltear ingredientes', 'Mezclar con salsa', 'Servir'],
            imagen: 'img/pad-thai.svg',
            calificacion: 4.4,
            resenas: 19
        });
        
        // ========== MÁS CENAS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Hamburguesa Clásica',
            pais: 'Estados Unidos',
            tiempo: 20,
            categorias: ['Americana', 'Cena'],
            ingredientes: ['Carne molida', 'Pan hamburguesa', 'Lechuga', 'Tomate', 'Queso'],
            instrucciones: ['Formar hamburguesas', 'Cocinar plancha', 'Tostar pan', 'Armar'],
            imagen: 'img/hamburguesa-clasica.svg',
            calificacion: 4.2,
            resenas: 30
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Ramen Japonés',
            pais: 'Japón',
            tiempo: 40,
            categorias: ['Japonesa', 'Cena'],
            ingredientes: ['Fideos ramen', 'Caldo hueso', 'Huevo', 'Chashu', 'Nori'],
            instrucciones: ['Preparar caldo', 'Cocinar fideos', 'Preparar toppings', 'Montar bowl'],
            imagen: 'img/ramen-japones.svg',
            calificacion: 4.5,
            resenas: 19
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Fish and Chips',
            pais: 'Reino Unido',
            tiempo: 30,
            categorias: ['Británica', 'Cena'],
            ingredientes: ['Pescado blanco', 'Papas', 'Harina', 'Cerveza', 'Aceite'],
            instrucciones: ['Preparar masa cerveza', 'Cortar papas', 'Freír pescado', 'Servir'],
            imagen: 'img/fish-chips.svg',
            calificacion: 4.1,
            resenas: 16
        });
        
        // ========== POSTRES ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Tiramisú',
            pais: 'Italia',
            tiempo: 240,
            categorias: ['Italiana', 'Postre'],
            ingredientes: ['Mascarpone', 'Café', 'Bizcochos', 'Huevos', 'Cacao'],
            instrucciones: ['Preparar crema', 'Remojar bizcochos', 'Armar capas', 'Refrigerar'],
            imagen: 'img/tiramisu.svg',
            calificacion: 4.7,
            resenas: 28
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Cheesecake',
            pais: 'Estados Unidos',
            tiempo: 300,
            categorias: ['Americana', 'Postre'],
            ingredientes: ['Queso crema', 'Galletas', 'Azúcar', 'Huevos', 'Vainilla'],
            instrucciones: ['Hacer base', 'Preparar mezcla', 'Hornear baño maría', 'Enfriar'],
            imagen: 'img/cheesecake.svg',
            calificacion: 4.6,
            resenas: 24
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Flan Napolitano',
            pais: 'México',
            tiempo: 180,
            categorias: ['Mexicana', 'Postre'],
            ingredientes: ['Leche condensada', 'Leche evaporada', 'Huevos', 'Azúcar', 'Vainilla'],
            instrucciones: ['Hacer caramelo', 'Mezclar ingredientes', 'Hornear baño maría', 'Enfriar'],
            imagen: 'img/flan-napolitano.svg',
            calificacion: 4.4,
            resenas: 21
        });
        
        // ========== MÁS BEBIDAS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Margarita',
            pais: 'México',
            tiempo: 3,
            categorias: ['Mexicana', 'Bebida'],
            ingredientes: ['Tequila', 'Triple sec', 'Jugo limón', 'Sal', 'Hielo'],
            instrucciones: ['Escarchar copa', 'Mezclar ingredientes', 'Servir con hielo'],
            imagen: 'img/margarita.svg',
            calificacion: 4.4,
            resenas: 21
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Agua de Jamaica',
            pais: 'México',
            tiempo: 15,
            categorias: ['Mexicana', 'Bebida'],
            ingredientes: ['Flor jamaica', 'Agua', 'Azúcar', 'Limón'],
            instrucciones: ['Hervir agua', 'Agregar jamaica', 'Endulzar', 'Servir fría'],
            imagen: 'img/agua-jamaica.svg',
            calificacion: 4.1,
            resenas: 14
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Smoothie de Frutas',
            pais: 'Tropical',
            tiempo: 8,
            categorias: ['Saludable', 'Bebida'],
            ingredientes: ['Mango', 'Piña', 'Plátano', 'Yogurt', 'Miel'],
            instrucciones: ['Pelar frutas', 'Licuar todo', 'Ajustar consistencia', 'Servir'],
            imagen: 'img/smoothie-frutas.svg',
            calificacion: 4.2,
            resenas: 15
        });
        
        // ========== BOTANAS Y ENTRADAS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Hummus',
            pais: 'Líbano',
            tiempo: 15,
            categorias: ['Árabe', 'Botana'],
            ingredientes: ['Garbanzos', 'Tahini', 'Limón', 'Ajo', 'Aceite oliva'],
            instrucciones: ['Procesar garbanzos', 'Agregar tahini', 'Sazonar', 'Servir'],
            imagen: 'img/hummus.svg',
            calificacion: 4.2,
            resenas: 18
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Nachos con Queso',
            pais: 'México',
            tiempo: 15,
            categorias: ['Mexicana', 'Botana'],
            ingredientes: ['Totopos', 'Queso cheddar', 'Jalapeños', 'Crema', 'Guacamole'],
            instrucciones: ['Calentar totopos', 'Derretir queso', 'Agregar jalapeños', 'Servir'],
            imagen: 'img/nachos-queso.svg',
            calificacion: 4.3,
            resenas: 26
        });
        
        // ========== RÁPIDAS Y ECONÓMICAS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Quesadillas',
            pais: 'México',
            tiempo: 10,
            categorias: ['Mexicana', 'Rápida', 'Económica'],
            ingredientes: ['Tortillas', 'Queso', 'Jamón', 'Mantequilla'],
            instrucciones: ['Rellenar tortillas', 'Cocinar en sartén', 'Voltear', 'Servir caliente'],
            imagen: 'img/quesadillas.svg',
            calificacion: 4.1,
            resenas: 32
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Pasta con Mantequilla',
            pais: 'Italia',
            tiempo: 12,
            categorias: ['Italiana', 'Rápida', 'Económica'],
            ingredientes: ['Pasta', 'Mantequilla', 'Queso parmesano', 'Sal', 'Pimienta'],
            instrucciones: ['Cocinar pasta', 'Derretir mantequilla', 'Mezclar', 'Agregar queso'],
            imagen: 'img/pasta-mantequilla.svg',
            calificacion: 3.9,
            resenas: 24
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Huevos Revueltos',
            pais: 'Universal',
            tiempo: 5,
            categorias: ['Universal', 'Rápida', 'Económica'],
            ingredientes: ['Huevos', 'Mantequilla', 'Sal', 'Pimienta'],
            instrucciones: ['Batir huevos', 'Calentar sartén', 'Cocinar revolviendo', 'Servir'],
            imagen: 'img/huevos-revueltos.svg',
            calificacion: 3.8,
            resenas: 45
        });
        
        saveRecipes();
        console.log(`✅ Added ${recipes.length} comprehensive recipes to database`);
    }
    
    // List directory contents for debugging
    console.log('\n📂 Directory structure:');
    try {
        const files = fs.readdirSync(__dirname);
        files.forEach(file => {
            const filePath = path.join(__dirname, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                console.log(`  📁 ${file}/`);
                try {
                    const subFiles = fs.readdirSync(filePath);
                    subFiles.forEach(subFile => {
                        console.log(`    📄 ${file}/${subFile}`);
                    });
                } catch (e) {
                    console.log(`    ❌ Cannot read directory: ${e.message}`);
                }
            } else {
                console.log(`  📄 ${file}`);
            }
        });
    } catch (e) {
        console.log(`❌ Cannot read root directory: ${e.message}`);
    }
});