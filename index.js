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
        console.log('📝 No existing recipes found, adding comprehensive recipe database...');
        
        const megaRecipeDatabase = [
            // ========== DESAYUNOS (25 recetas) ==========
            {
                id: nextRecipeId++, nombre: 'Pancakes Americanos', pais: 'Estados Unidos', tiempo: 20,
                categorias: ['Americana', 'Desayuno'], ingredientes: ['Harina', 'Huevos', 'Leche', 'Azúcar', 'Polvo de hornear', 'Mantequilla'],
                instrucciones: ['Mezclar ingredientes secos', 'Batir huevos con leche', 'Combinar todo', 'Cocinar en sartén caliente'],
                imagen: 'img/pancakes-americanos.svg', calificacion: 4.2, resenas: 8
            },
            {
                id: nextRecipeId++, nombre: 'Huevos Rancheros', pais: 'México', tiempo: 15,
                categorias: ['Mexicana', 'Desayuno'], ingredientes: ['Huevos', 'Tortillas', 'Salsa roja', 'Frijoles refritos', 'Queso fresco', 'Aguacate'],
                instrucciones: ['Calentar tortillas', 'Freír huevos', 'Calentar salsa', 'Montar el plato con todos los ingredientes'],
                imagen: 'img/huevos-rancheros.svg', calificacion: 4.4, resenas: 18
            },
            {
                id: nextRecipeId++, nombre: 'Croissants Franceses', pais: 'Francia', tiempo: 180,
                categorias: ['Francesa', 'Desayuno'], ingredientes: ['Harina', 'Mantequilla fría', 'Levadura', 'Leche tibia', 'Sal', 'Azúcar'],
                instrucciones: ['Preparar masa base', 'Laminar con mantequilla', 'Plegar varias veces', 'Formar y hornear'],
                imagen: 'img/croissants-franceses.svg', calificacion: 4.6, resenas: 20
            },
            {
                id: nextRecipeId++, nombre: 'Waffles Belgas', pais: 'Bélgica', tiempo: 25,
                categorias: ['Europea', 'Desayuno'], ingredientes: ['Harina', 'Huevos', 'Leche', 'Mantequilla derretida', 'Azúcar', 'Levadura', 'Vainilla'],
                instrucciones: ['Separar claras y yemas', 'Mezclar ingredientes secos', 'Combinar con líquidos', 'Cocinar en waflera'],
                imagen: 'img/waffles-belgas.svg', calificacion: 4.5, resenas: 14
            },
            {
                id: nextRecipeId++, nombre: 'Arepas Venezolanas', pais: 'Venezuela', tiempo: 30,
                categorias: ['Venezolana', 'Desayuno'], ingredientes: ['Harina de maíz precocida', 'Agua tibia', 'Sal', 'Relleno variado'],
                instrucciones: ['Mezclar harina con agua y sal', 'Formar bolas y aplastar', 'Cocinar en budare', 'Rellenar al gusto'],
                imagen: 'img/arepas-venezolanas.svg', calificacion: 4.3, resenas: 16
            },
            {
                id: nextRecipeId++, nombre: 'Desayuno Japonés', pais: 'Japón', tiempo: 45,
                categorias: ['Japonesa', 'Desayuno'], ingredientes: ['Arroz', 'Miso', 'Huevo', 'Nori', 'Salmón', 'Verduras encurtidas'],
                instrucciones: ['Cocinar arroz', 'Preparar sopa miso', 'Cocinar huevo', 'Servir todo junto tradicionalmente'],
                imagen: 'img/desayuno-japones.svg', calificacion: 4.1, resenas: 9
            },
            {
                id: nextRecipeId++, nombre: 'Muffins de Arándanos', pais: 'Estados Unidos', tiempo: 35,
                categorias: ['Americana', 'Desayuno'], ingredientes: ['Harina', 'Arándanos', 'Huevos', 'Leche', 'Mantequilla', 'Azúcar', 'Polvo de hornear'],
                instrucciones: ['Mezclar ingredientes secos', 'Combinar líquidos', 'Agregar arándanos', 'Hornear en moldes'],
                imagen: 'img/muffins-arandanos.svg', calificacion: 4.2, resenas: 11
            },
            {
                id: nextRecipeId++, nombre: 'Tostadas de Aguacate', pais: 'Australia', tiempo: 10,
                categorias: ['Saludable', 'Desayuno'], ingredientes: ['Pan integral', 'Aguacate maduro', 'Limón', 'Sal', 'Pimienta', 'Tomate cherry'],
                instrucciones: ['Tostar el pan', 'Machacar aguacate', 'Sazonar con limón y sal', 'Servir con tomates'],
                imagen: 'img/tostadas-aguacate.svg', calificacion: 4.0, resenas: 13
            },
            {
                id: nextRecipeId++, nombre: 'Yogurt con Granola', pais: 'Grecia', tiempo: 5,
                categorias: ['Saludable', 'Desayuno'], ingredientes: ['Yogurt griego', 'Granola', 'Miel', 'Frutas del bosque', 'Nueces'],
                instrucciones: ['Servir yogurt en bowl', 'Agregar granola', 'Decorar con frutas', 'Endulzar con miel'],
                imagen: 'img/yogurt-con-granola.svg', calificacion: 4.1, resenas: 7
            },
            {
                id: nextRecipeId++, nombre: 'Molletes Mexicanos', pais: 'México', tiempo: 15,
                categorias: ['Mexicana', 'Desayuno'], ingredientes: ['Bolillos', 'Frijoles refritos', 'Queso Oaxaca', 'Pico de gallo', 'Aguacate'],
                instrucciones: ['Partir bolillos por la mitad', 'Untar frijoles', 'Agregar queso', 'Gratinar y servir'],
                imagen: 'img/molletes-mexicanos.svg', calificacion: 4.3, resenas: 19
            },
            {
                id: nextRecipeId++, nombre: 'Pan Francés', pais: 'Francia', tiempo: 20,
                categorias: ['Francesa', 'Desayuno'], ingredientes: ['Pan del día anterior', 'Huevos', 'Leche', 'Canela', 'Vainilla', 'Mantequilla'],
                instrucciones: ['Batir huevos con leche y especias', 'Remojar pan', 'Freír en mantequilla', 'Servir caliente'],
                imagen: 'img/pan-frances.svg', calificacion: 4.4, resenas: 12
            },
            {
                id: nextRecipeId++, nombre: 'Smoothie Bowl', pais: 'Brasil', tiempo: 10,
                categorias: ['Saludable', 'Desayuno'], ingredientes: ['Açaí congelado', 'Plátano', 'Granola', 'Fresas', 'Miel', 'Coco rallado'],
                instrucciones: ['Licuar açaí con plátano', 'Servir en bowl', 'Decorar con granola y frutas', 'Agregar miel al gusto'],
                imagen: 'img/smoothie-bowl.svg', calificacion: 4.3, resenas: 12
            },
            {
                id: nextRecipeId++, nombre: 'Chilaquiles Rojos', pais: 'México', tiempo: 20,
                categorias: ['Mexicana', 'Desayuno'], ingredientes: ['Tortillas', 'Salsa roja', 'Queso fresco', 'Crema', 'Cebolla'],
                instrucciones: ['Freír tortillas cortadas', 'Calentar salsa', 'Mezclar tortillas con salsa', 'Servir con queso y crema'],
                imagen: 'img/chilaquiles-rojos.svg', calificacion: 4.5, resenas: 22
            },
            {
                id: nextRecipeId++, nombre: 'Gallo Pinto', pais: 'Costa Rica', tiempo: 15,
                categorias: ['Centroamericana', 'Desayuno'], ingredientes: ['Arroz cocido', 'Frijoles negros', 'Cebolla', 'Pimiento', 'Cilantro', 'Salsa inglesa'],
                instrucciones: ['Sofreír cebolla y pimiento', 'Agregar arroz y frijoles', 'Sazonar con salsa inglesa', 'Decorar con cilantro'],
                imagen: 'img/gallo-pinto.svg', calificacion: 4.2, resenas: 15
            },
            {
                id: nextRecipeId++, nombre: 'Huevos Benedictinos', pais: 'Estados Unidos', tiempo: 25,
                categorias: ['Americana', 'Desayuno'], ingredientes: ['Huevos', 'Muffin inglés', 'Jamón canadiense', 'Salsa holandesa', 'Mantequilla'],
                instrucciones: ['Tostar muffins', 'Escalfar huevos', 'Preparar salsa holandesa', 'Montar: muffin, jamón, huevo, salsa'],
                imagen: 'img/huevos-benedictinos.svg', calificacion: 4.6, resenas: 18
            },
            {
                id: nextRecipeId++, nombre: 'Enchiladas de Desayuno', pais: 'México', tiempo: 30,
                categorias: ['Mexicana', 'Desayuno'], ingredientes: ['Tortillas', 'Huevos revueltos', 'Salsa verde', 'Queso', 'Crema', 'Cebolla'],
                instrucciones: ['Preparar huevos revueltos', 'Rellenar tortillas', 'Bañar con salsa', 'Gratinar con queso'],
                imagen: 'img/enchiladas-desayuno.svg', calificacion: 4.4, resenas: 20
            },
            {
                id: nextRecipeId++, nombre: 'Pupusas Salvadoreñas', pais: 'El Salvador', tiempo: 40,
                categorias: ['Centroamericana', 'Desayuno'], ingredientes: ['Masa de maíz', 'Queso', 'Frijoles refritos', 'Chicharrón', 'Curtido'],
                instrucciones: ['Preparar masa', 'Rellenar con queso y frijoles', 'Formar pupusas', 'Cocinar en comal'],
                imagen: 'img/pupusas-salvadorenas.svg', calificacion: 4.3, resenas: 16
            },
            {
                id: nextRecipeId++, nombre: 'Empanadas Colombianas', pais: 'Colombia', tiempo: 45,
                categorias: ['Colombiana', 'Desayuno'], ingredientes: ['Harina de maíz', 'Carne molida', 'Papa', 'Cebolla', 'Comino', 'Aceite'],
                instrucciones: ['Preparar relleno de carne', 'Hacer masa', 'Rellenar y cerrar empanadas', 'Freír hasta dorar'],
                imagen: 'img/empanadas-colombianas.svg', calificacion: 4.2, resenas: 14
            },
            {
                id: nextRecipeId++, nombre: 'Banana Bread', pais: 'Estados Unidos', tiempo: 75,
                categorias: ['Americana', 'Desayuno'], ingredientes: ['Plátanos maduros', 'Harina', 'Azúcar', 'Huevos', 'Mantequilla', 'Bicarbonato'],
                instrucciones: ['Machacar plátanos', 'Mezclar ingredientes secos', 'Combinar todo', 'Hornear por 1 hora'],
                imagen: 'img/banana-bread.svg', calificacion: 4.5, resenas: 22
            },
            {
                id: nextRecipeId++, nombre: 'Café con Leche', pais: 'España', tiempo: 5,
                categorias: ['Española', 'Bebida', 'Desayuno'], ingredientes: ['Café espresso', 'Leche', 'Azúcar'],
                instrucciones: ['Preparar café espresso', 'Calentar leche', 'Mezclar en partes iguales', 'Endulzar al gusto'],
                imagen: 'img/cafe-con-leche.svg', calificacion: 4.1, resenas: 25
            },
            {
                id: nextRecipeId++, nombre: 'Avena con Frutas', pais: 'Escocia', tiempo: 10,
                categorias: ['Saludable', 'Desayuno'], ingredientes: ['Avena', 'Leche', 'Plátano', 'Fresas', 'Miel', 'Canela'],
                instrucciones: ['Cocinar avena con leche', 'Agregar frutas cortadas', 'Endulzar con miel', 'Espolvorear canela'],
                imagen: 'img/avena-frutas.svg', calificacion: 4.0, resenas: 18
            },
            {
                id: nextRecipeId++, nombre: 'Tortilla Española', pais: 'España', tiempo: 30,
                categorias: ['Española', 'Desayuno'], ingredientes: ['Huevos', 'Papas', 'Cebolla', 'Aceite de oliva', 'Sal'],
                instrucciones: ['Freír papas y cebolla', 'Batir huevos', 'Mezclar todo', 'Cocinar tortilla por ambos lados'],
                imagen: 'img/tortilla-espanola.svg', calificacion: 4.4, resenas: 21
            },
            {
                id: nextRecipeId++, nombre: 'Bagel con Salmón', pais: 'Estados Unidos', tiempo: 10,
                categorias: ['Americana', 'Desayuno'], ingredientes: ['Bagel', 'Queso crema', 'Salmón ahumado', 'Cebolla morada', 'Alcaparras'],
                instrucciones: ['Tostar bagel', 'Untar queso crema', 'Agregar salmón', 'Decorar con cebolla y alcaparras'],
                imagen: 'img/bagel-salmon.svg', calificacion: 4.3, resenas: 17
            },
            {
                id: nextRecipeId++, nombre: 'Crepes Francesas', pais: 'Francia', tiempo: 20,
                categorias: ['Francesa', 'Desayuno'], ingredientes: ['Harina', 'Huevos', 'Leche', 'Mantequilla', 'Azúcar', 'Vainilla'],
                instrucciones: ['Preparar masa líquida', 'Dejar reposar', 'Cocinar crepes finas', 'Rellenar al gusto'],
                imagen: 'img/crepes-francesas.svg', calificacion: 4.2, resenas: 19
            },
            {
                id: nextRecipeId++, nombre: 'Granola Casera', pais: 'Estados Unidos', tiempo: 45,
                categorias: ['Saludable', 'Desayuno'], ingredientes: ['Avena', 'Nueces', 'Miel', 'Aceite de coco', 'Pasas', 'Canela'],
                instrucciones: ['Mezclar ingredientes secos', 'Agregar miel y aceite', 'Hornear removiendo ocasionalmente', 'Enfriar completamente'],
                imagen: 'img/granola-casera.svg', calificacion: 4.1, resenas: 13
            }
        ];
        
        recipes.push(...megaRecipeDatabase);
        saveRecipes();
        console.log(`✅ Added ${megaRecipeDatabase.length} recipes to database`);
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