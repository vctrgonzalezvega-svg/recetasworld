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
            categorias: ['Cena'],
            ingredientes: [
                { nombre: '1 kg de carne de cerdo (pierna o lomo)', icono: '🥩' },
                { nombre: '3 chiles guajillo desvenados', icono: '🌶️' },
                { nombre: '2 chiles chipotle adobados', icono: '🌶️' },
                { nombre: '1/4 de taza de jugo de naranja', icono: '🍊' },
                { nombre: '2 cucharadas de vinagre blanco', icono: '🥄' },
                { nombre: '3 dientes de ajo', icono: '🧄' },
                { nombre: '1 cucharadita de comino', icono: '🥄' },
                { nombre: '1 cucharadita de orégano', icono: '🌿' },
                { nombre: '1/2 cucharadita de pimienta negra', icono: '🥄' },
                { nombre: 'Sal al gusto', icono: '🧂' },
                { nombre: '16 tortillas de maíz', icono: '🌮' },
                { nombre: '1 piña mediana en rebanadas', icono: '🍍' },
                { nombre: '1 cebolla blanca finamente picada', icono: '🧅' },
                { nombre: '1/2 taza de cilantro picado', icono: '🌿' },
                { nombre: '2 limones en cuartos', icono: '🍋' }
            ],
            instrucciones: [
                'Remojar los chiles guajillo en agua caliente por 15 minutos hasta que se ablanden',
                'Licuar los chiles con chipotle, jugo de naranja, vinagre, ajo, comino, orégano, pimienta y sal hasta obtener una salsa homogénea',
                'Cortar la carne en tiras delgadas y marinar con la salsa por al menos 2 horas o toda la noche',
                'Calentar una plancha o sartén grande a fuego medio-alto',
                'Cocinar la carne marinada por 8-10 minutos, volteando ocasionalmente hasta que esté bien cocida',
                'En la misma plancha, asar las rebanadas de piña hasta que estén doradas por ambos lados',
                'Picar la piña asada en cubos pequeños',
                'Calentar las tortillas en un comal o sartén seco',
                'Servir la carne en las tortillas calientes, agregar piña, cebolla y cilantro',
                'Acompañar con limón y salsa al gusto'
            ],
            imagen: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.5,
            resenas: 10
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Pancakes Americanos',
            pais: 'Estados Unidos',
            tiempo: 20,
            categorias: ['Desayuno'],
            ingredientes: [
                { nombre: '2 tazas de harina para todo uso', icono: '🌾' },
                { nombre: '2 cucharadas de azúcar', icono: '🍯' },
                { nombre: '2 cucharaditas de polvo de hornear', icono: '🥄' },
                { nombre: '1 cucharadita de sal', icono: '🧂' },
                { nombre: '2 huevos grandes', icono: '🥚' },
                { nombre: '1 3/4 tazas de leche entera', icono: '🥛' },
                { nombre: '1/4 taza de mantequilla derretida', icono: '🧈' },
                { nombre: '1 cucharadita de extracto de vainilla', icono: '🌿' },
                { nombre: 'Mantequilla para la sartén', icono: '🧈' },
                { nombre: 'Miel de maple para servir', icono: '🍯' },
                { nombre: 'Mantequilla para acompañar', icono: '🧈' }
            ],
            instrucciones: [
                'En un bowl grande, mezclar harina, azúcar, polvo de hornear y sal',
                'En otro bowl, batir los huevos hasta que estén espumosos',
                'Agregar la leche, mantequilla derretida y vainilla a los huevos, mezclar bien',
                'Verter los ingredientes líquidos sobre los secos y mezclar suavemente hasta apenas combinar (la masa debe quedar con algunos grumos)',
                'Dejar reposar la masa por 5 minutos',
                'Calentar una sartén antiadherente a fuego medio y untar con mantequilla',
                'Verter 1/4 taza de masa por cada pancake en la sartén caliente',
                'Cocinar hasta que aparezcan burbujas en la superficie y los bordes se vean secos (2-3 minutos)',
                'Voltear con cuidado y cocinar 1-2 minutos más hasta que estén dorados',
                'Servir inmediatamente con mantequilla y miel de maple caliente'
            ],
            imagen: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.2,
            resenas: 8
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Spaghetti Carbonara',
            pais: 'Italia',
            tiempo: 25,
            categorias: ['Cena'],
            ingredientes: [
                { nombre: '400g de spaghetti', icono: '🍝' },
                { nombre: '200g de panceta o guanciale en cubos', icono: '🥓' },
                { nombre: '4 huevos enteros grandes', icono: '🥚' },
                { nombre: '100g de queso parmesano recién rallado', icono: '🧀' },
                { nombre: '50g de queso pecorino romano rallado', icono: '🧀' },
                { nombre: '2 cucharadas de aceite de oliva extra virgen', icono: '🫒' },
                { nombre: 'Pimienta negra recién molida al gusto', icono: '🌶️' },
                { nombre: 'Sal gruesa para el agua de la pasta', icono: '🧂' },
                { nombre: '2 cucharadas de perejil fresco picado (opcional)', icono: '🌿' }
            ],
            instrucciones: [
                'Poner a hervir abundante agua con sal gruesa en una olla grande',
                'Mientras tanto, calentar el aceite en una sartén grande a fuego medio',
                'Agregar la panceta y cocinar por 8-10 minutos hasta que esté crujiente y dorada',
                'En un bowl grande, batir los huevos enteros con los quesos rallados y abundante pimienta negra',
                'Cuando el agua hierva, cocinar los spaghetti según las instrucciones del paquete hasta que estén al dente',
                'Reservar 1 taza del agua de cocción de la pasta antes de escurrirla',
                'Escurrir la pasta y agregarla inmediatamente a la sartén con la panceta',
                'Retirar del fuego y agregar la mezcla de huevos y queso, revolviendo rápidamente',
                'Agregar agua de pasta poco a poco hasta obtener una salsa cremosa (no debe cuajar el huevo)',
                'Servir inmediatamente con más queso parmesano y pimienta negra al gusto'
            ],
            imagen: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.7,
            resenas: 15
        });
        
        // Agregar más recetas variadas
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Huevos Rancheros',
            pais: 'México',
            tiempo: 15,
            categorias: ['Desayuno'],
            ingredientes: [
                { nombre: '4 huevos frescos', icono: '🥚' },
                { nombre: '4 tortillas de maíz', icono: '🌮' },
                { nombre: '1 taza de frijoles refritos', icono: '🫘' },
                { nombre: '200g de queso fresco desmoronado', icono: '🧀' },
                { nombre: '1/2 taza de crema mexicana', icono: '🥛' },
                { nombre: '1 aguacate maduro en rebanadas', icono: '🥑' },
                { nombre: 'Para la salsa roja:', icono: '🍅' },
                { nombre: '4 tomates rojos', icono: '🍅' },
                { nombre: '1/4 de cebolla blanca', icono: '🧅' },
                { nombre: '2 dientes de ajo', icono: '🧄' },
                { nombre: '1 chile serrano', icono: '🌶️' },
                { nombre: 'Sal y pimienta al gusto', icono: '🧂' },
                { nombre: '2 cucharadas de aceite', icono: '🫒' }
            ],
            instrucciones: [
                'Para la salsa: asar los tomates, cebolla, ajo y chile en un comal hasta que estén tostados',
                'Licuar los vegetales asados con sal y pimienta, agregar un poco de agua si es necesario',
                'Calentar aceite en una sartén y freír la salsa por 10 minutos hasta que espese',
                'Calentar los frijoles refritos en una sartén pequeña',
                'Calentar las tortillas en un comal seco hasta que estén flexibles',
                'En una sartén con aceite, freír los huevos estrellados manteniendo las yemas líquidas',
                'Para servir: colocar una tortilla en cada plato, untar con frijoles',
                'Poner un huevo frito sobre cada tortilla',
                'Bañar con la salsa roja caliente',
                'Decorar con queso desmoronado, crema y rebanadas de aguacate'
            ],
            imagen: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.4,
            resenas: 18
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Waffles Belgas',
            pais: 'Bélgica',
            tiempo: 25,
            categorias: ['Desayuno'],
            ingredientes: [
                { nombre: '2 tazas de harina para todo uso', icono: '🌾' },
                { nombre: '2 cucharadas de azúcar', icono: '🍯' },
                { nombre: '1 cucharada de polvo de hornear', icono: '🥄' },
                { nombre: '1/2 cucharadita de sal', icono: '🧂' },
                { nombre: '3 huevos grandes (separados)', icono: '🥚' },
                { nombre: '1 3/4 tazas de leche tibia', icono: '🥛' },
                { nombre: '1/2 taza de mantequilla derretida', icono: '🧈' },
                { nombre: '1 cucharadita de extracto de vainilla', icono: '🌿' },
                { nombre: 'Aceite en spray para la waflera', icono: '🫒' },
                { nombre: 'Fresas frescas para decorar', icono: '🍓' },
                { nombre: 'Azúcar glass para espolvorear', icono: '🍯' },
                { nombre: 'Miel de maple', icono: '🍯' }
            ],
            instrucciones: [
                'Precalentar la waflera según las instrucciones del fabricante',
                'En un bowl grande, mezclar harina, azúcar, polvo de hornear y sal',
                'Separar las claras de las yemas de huevo',
                'Batir las claras a punto de nieve firme, reservar',
                'En otro bowl, mezclar las yemas con leche tibia, mantequilla derretida y vainilla',
                'Verter la mezcla líquida sobre los ingredientes secos y mezclar suavemente',
                'Incorporar las claras batidas con movimientos envolventes suaves',
                'Rociar la waflera con aceite en spray',
                'Verter la masa en la waflera (llenar 3/4 partes)',
                'Cocinar según las instrucciones hasta que estén dorados y crujientes',
                'Servir inmediatamente con fresas, azúcar glass y miel de maple'
            ],
            imagen: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.5,
            resenas: 14
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Smoothie Bowl',
            pais: 'Brasil',
            tiempo: 10,
            categorias: ['Desayuno', 'Saludable'],
            ingredientes: [
                { nombre: '200g de açaí congelado', icono: '🫐' },
                { nombre: '1 plátano maduro congelado', icono: '🍌' },
                { nombre: '1/2 taza de granola casera', icono: '🥣' },
                { nombre: '1/2 taza de fresas frescas cortadas', icono: '🍓' },
                { nombre: '2 cucharadas de miel de abeja', icono: '🍯' },
                { nombre: '2 cucharadas de coco rallado', icono: '🥥' },
                { nombre: '1/4 taza de arándanos frescos', icono: '🫐' },
                { nombre: '2 cucharadas de semillas de chía', icono: '🌱' },
                { nombre: '1/4 taza de leche de almendras', icono: '🥛' }
            ],
            instrucciones: [
                'Sacar el açaí del congelador 5 minutos antes para que se ablande ligeramente',
                'En una licuadora potente, procesar el açaí congelado con el plátano',
                'Agregar la leche de almendras poco a poco hasta obtener consistencia cremosa',
                'La mezcla debe quedar espesa, como helado suave',
                'Servir inmediatamente en un bowl frío',
                'Decorar una mitad con granola y la otra con fresas',
                'Espolvorear coco rallado y semillas de chía por encima',
                'Agregar arándanos frescos como toque final',
                'Rociar con miel al gusto',
                'Servir inmediatamente con cuchara'
            ],
            imagen: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.3,
            resenas: 12
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Pollo al Curry',
            pais: 'India',
            tiempo: 45,
            categorias: ['Comida'],
            ingredientes: [
                { nombre: '1 kg de muslos de pollo sin hueso, en trozos', icono: '🍗' },
                { nombre: '2 cebollas medianas finamente picadas', icono: '🧅' },
                { nombre: '4 dientes de ajo picados', icono: '🧄' },
                { nombre: '1 trozo de jengibre fresco de 3cm, rallado', icono: '🫚' },
                { nombre: '2 cucharadas de curry en polvo', icono: '🌶️' },
                { nombre: '1 cucharadita de cúrcuma', icono: '🌶️' },
                { nombre: '1 cucharadita de comino molido', icono: '🌶️' },
                { nombre: '1 cucharadita de cilantro molido', icono: '🌿' },
                { nombre: '1/2 cucharadita de canela molida', icono: '🌶️' },
                { nombre: '1/4 cucharadita de cayena (opcional)', icono: '🌶️' },
                { nombre: '400ml de leche de coco', icono: '🥥' },
                { nombre: '400g de tomates en lata triturados', icono: '🍅' },
                { nombre: '2 cucharadas de aceite de coco o vegetal', icono: '🫒' },
                { nombre: 'Sal y pimienta al gusto', icono: '🧂' },
                { nombre: '1/4 taza de cilantro fresco picado', icono: '🌿' },
                { nombre: 'Arroz basmati para acompañar', icono: '🍚' }
            ],
            instrucciones: [
                'Sazonar los trozos de pollo con sal y pimienta',
                'Calentar el aceite en una olla grande a fuego medio-alto',
                'Dorar el pollo por todos lados (5-6 minutos), retirar y reservar',
                'En la misma olla, sofreír la cebolla hasta que esté transparente (5 minutos)',
                'Agregar ajo y jengibre, cocinar 1 minuto hasta que aromático',
                'Añadir todas las especias y cocinar 30 segundos removiendo constantemente',
                'Incorporar los tomates triturados y cocinar 5 minutos',
                'Verter la leche de coco y mezclar bien',
                'Regresar el pollo a la olla y llevar a ebullición',
                'Reducir fuego, tapar y cocinar a fuego lento 25-30 minutos',
                'Ajustar sazón con sal y pimienta',
                'Servir sobre arroz basmati y decorar with cilantro fresco'
            ],
            imagen: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.4,
            resenas: 18
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Pizza Margherita',
            pais: 'Italia',
            tiempo: 30,
            categorias: ['Cena'],
            ingredientes: [
                { nombre: '1 masa de pizza casera o comprada', icono: '🍕' },
                { nombre: '1/2 taza de salsa de tomate para pizza', icono: '🍅' },
                { nombre: '200g de mozzarella fresca en rebanadas', icono: '🧀' },
                { nombre: '2 cucharadas de aceite de oliva extra virgen', icono: '🫒' },
                { nombre: '10-12 hojas de albahaca fresca', icono: '🌿' },
                { nombre: '1/4 cucharadita de sal marina', icono: '🧂' },
                { nombre: 'Pimienta negra recién molida', icono: '🌶️' },
                { nombre: 'Harina para espolvorear', icono: '🌾' }
            ],
            instrucciones: [
                'Precalentar el horno a la temperatura más alta (250°C o más)',
                'Si tienes piedra para pizza, colocarla en el horno mientras precalienta',
                'Espolvorear harina en la superficie de trabajo',
                'Extender la masa de pizza formando un círculo de 30cm aproximadamente',
                'Transferir la masa a una bandeja para horno o pala de pizza',
                'Extender la salsa de tomate dejando 2cm de borde libre',
                'Distribuir las rebanadas de mozzarella uniformemente',
                'Rociar con aceite de oliva y sazonar con sal y pimienta',
                'Hornear por 10-12 minutos hasta que los bordes estén dorados',
                'Retirar del horno y agregar hojas de albahaca fresca',
                'Dejar reposar 2 minutos antes de cortar y servir'
            ],
            imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.4,
            resenas: 22
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Salmón a la Plancha',
            pais: 'Noruega',
            tiempo: 20,
            categorias: ['Comida', 'Saludable'],
            ingredientes: [
                { nombre: '4 filetes de salmón de 150g cada uno', icono: '🐟' },
                { nombre: '2 limones (jugo y ralladura)', icono: '🍋' },
                { nombre: '3 cucharadas de aceite de oliva', icono: '🫒' },
                { nombre: '2 dientes de ajo picados finamente', icono: '🧄' },
                { nombre: '1 cucharada de eneldo fresco picado', icono: '🌿' },
                { nombre: '1 cucharadita de sal marina', icono: '🧂' },
                { nombre: '1/2 cucharadita de pimienta negra', icono: '🌶️' },
                { nombre: '200g de espárragos', icono: '🥬' },
                { nombre: '1 cucharada de mantequilla', icono: '🧈' }
            ],
            instrucciones: [
                'Sacar el salmón del refrigerador 15 minutos antes de cocinar',
                'Secar los filetes con papel absorbente y sazonar con sal y pimienta',
                'Mezclar aceite de oliva, ajo, eneldo y ralladura de limón',
                'Marinar el salmón con esta mezcla por 10 minutos',
                'Calentar una plancha o sartén antiadherente a fuego medio-alto',
                'Limpiar los espárragos y cortarles las puntas duras',
                'Cocinar el salmón con la piel hacia abajo por 4 minutos sin mover',
                'Voltear cuidadosamente y cocinar 3-4 minutos más',
                'En otra sartén, saltear los espárragos con mantequilla por 5 minutos',
                'Servir el salmón con espárragos y rociar con jugo de limón fresco'
            ],
            imagen: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.3,
            resenas: 20
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Mojito',
            pais: 'Cuba',
            tiempo: 5,
            categorias: ['Bebida'],
            ingredientes: [
                { nombre: '60ml de ron blanco cubano', icono: '🥃' },
                { nombre: '10-12 hojas de menta fresca', icono: '🌿' },
                { nombre: '2 cucharadas de jugo de limón fresco', icono: '🍋' },
                { nombre: '2 cucharaditas de azúcar blanca', icono: '🍯' },
                { nombre: '1 taza de hielo picado', icono: '🧊' },
                { nombre: '1/2 taza de agua con gas fría', icono: '💧' },
                { nombre: '1 ramita de menta para decorar', icono: '🌿' },
                { nombre: '1 rodaja de limón', icono: '🍋' }
            ],
            instrucciones: [
                'En un vaso alto (highball), colocar las hojas de menta y el azúcar',
                'Con un muddler o cuchara de madera, machacar suavemente la menta',
                'No triturar demasiado para evitar amargor',
                'Agregar el jugo de limón fresco y mezclar',
                'Llenar el vaso con hielo picado hasta 3/4 partes',
                'Verter el ron blanco sobre el hielo',
                'Completar con agua con gas fría',
                'Revolver suavemente de abajo hacia arriba',
                'Decorar con una ramita de menta fresca y rodaja de limón',
                'Servir inmediatamente con pajita'
            ],
            imagen: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.3,
            resenas: 16
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Guacamole',
            pais: 'México',
            tiempo: 10,
            categorias: ['Botana'],
            ingredientes: [
                { nombre: '4 aguacates maduros', icono: '🥑' },
                { nombre: '2 limones (jugo fresco)', icono: '🍋' },
                { nombre: '1/2 cebolla blanca finamente picada', icono: '🧅' },
                { nombre: '2 tomates roma sin semillas, en cubitos', icono: '🍅' },
                { nombre: '2 chiles serranos finamente picados', icono: '🌶️' },
                { nombre: '3 cucharadas de cilantro fresco picado', icono: '🌿' },
                { nombre: '2 dientes de ajo finamente picados', icono: '🧄' },
                { nombre: '1 cucharadita de sal de mar', icono: '🧂' },
                { nombre: '1/4 cucharadita de pimienta negra', icono: '🌶️' },
                { nombre: 'Totopos para acompañar', icono: '🌮' }
            ],
            instrucciones: [
                'Cortar los aguacates por la mitad, retirar el hueso y extraer la pulpa',
                'En un molcajete o bowl grande, machacar los aguacates hasta obtener textura cremosa pero con trozos',
                'Agregar inmediatamente el jugo de limón para evitar oxidación',
                'Incorporar la cebolla picada y mezclar suavemente',
                'Añadir los tomates en cubitos, escurridos de su jugo',
                'Agregar los chiles serranos al gusto (empezar con poco)',
                'Incorporar el cilantro y ajo picados',
                'Sazonar con sal y pimienta, mezclar cuidadosamente',
                'Probar y ajustar sazón con más limón, sal o chile',
                'Servir inmediatamente con totopos o refrigerar máximo 2 horas'
            ],
            imagen: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.5,
            resenas: 35
        });
        
        // ========== MÁS DESAYUNOS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Croissants Franceses',
            pais: 'Francia',
            tiempo: 180,
            categorias: ['Desayuno'],
            ingredientes: [
                { nombre: '500g de harina de fuerza', icono: '🌾' },
                { nombre: '250g de mantequilla fría sin sal', icono: '🧈' },
                { nombre: '10g de levadura fresca', icono: '🍞' },
                { nombre: '250ml de leche tibia', icono: '🥛' },
                { nombre: '50g de azúcar', icono: '🍯' },
                { nombre: '10g de sal', icono: '🧂' },
                { nombre: '1 huevo para barnizar', icono: '🥚' },
                { nombre: '2 cucharadas de leche para barnizar', icono: '🥛' }
            ],
            instrucciones: [
                'Disolver la levadura en leche tibia con una pizca de azúcar, dejar 10 minutos',
                'Mezclar harina, azúcar y sal en un bowl grande',
                'Agregar la mezcla de levadura y amasar hasta formar masa lisa',
                'Envolver en film y refrigerar 1 hora',
                'Aplanar la mantequilla entre papel encerado formando rectángulo de 15x20cm',
                'Estirar la masa en rectángulo de 30x20cm',
                'Colocar mantequilla en el centro, doblar masa sobre ella',
                'Estirar y doblar en tres partes (primer pliegue), refrigerar 30 minutos',
                'Repetir el proceso de estirado y doblado dos veces más',
                'Estirar masa final, cortar triángulos y enrollar desde la base',
                'Dejar leudar 2 horas, barnizar con huevo batido y hornear a 200°C por 15-20 minutos'
            ],
            imagen: 'https://images.unsplash.com/photo-1555507036-ab794f4afe5e?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.6,
            resenas: 20
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Chilaquiles Rojos',
            pais: 'México',
            tiempo: 20,
            categorias: ['Desayuno'],
            ingredientes: [
                { nombre: '8 tortillas de maíz del día anterior', icono: '🌮' },
                { nombre: '4 tomates rojos medianos', icono: '🍅' },
                { nombre: '2 chiles guajillo desvenados', icono: '🌶️' },
                { nombre: '1 chile ancho desvenado', icono: '🌶️' },
                { nombre: '1/4 de cebolla blanca', icono: '🧅' },
                { nombre: '2 dientes de ajo', icono: '🧄' },
                { nombre: '1 taza de aceite para freír', icono: '🫒' },
                { nombre: '200g de queso fresco desmoronado', icono: '🧀' },
                { nombre: '1/2 taza de crema mexicana', icono: '🥛' },
                { nombre: '1/4 de cebolla blanca en rebanadas', icono: '🧅' },
                { nombre: 'Sal al gusto', icono: '🧂' },
                { nombre: '2 huevos estrellados (opcional)', icono: '🥚' }
            ],
            instrucciones: [
                'Cortar las tortillas en triángulos y dejar secar al aire 30 minutos',
                'Tostar los chiles en un comal seco por 2 minutos sin quemar',
                'Remojar los chiles en agua caliente por 15 minutos',
                'Asar los tomates, cebolla y ajo en el comal hasta que estén tostados',
                'Licuar tomates, chiles remojados, cebolla y ajo con poca agua',
                'Colar la salsa para obtener textura lisa',
                'Freír los triángulos de tortilla en aceite caliente hasta que estén dorados',
                'Escurrir en papel absorbente',
                'En una sartén grande, calentar la salsa y sazonar con sal',
                'Agregar los totopos fritos y mezclar suavemente',
                'Servir inmediatamente con queso, crema, cebolla y huevo si se desea'
            ],
            imagen: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.5,
            resenas: 22
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Muffins de Arándanos',
            pais: 'Estados Unidos',
            tiempo: 35,
            categorias: ['Desayuno', 'Postre'],
            ingredientes: [
                { nombre: '2 tazas de harina para todo uso', icono: '🌾' },
                { nombre: '3/4 taza de azúcar', icono: '🍯' },
                { nombre: '2 cucharaditas de polvo de hornear', icono: '🥄' },
                { nombre: '1/2 cucharadita de sal', icono: '🧂' },
                { nombre: '1/3 taza de mantequilla derretida', icono: '🧈' },
                { nombre: '1 huevo grande', icono: '🥚' },
                { nombre: '1 taza de leche entera', icono: '🥛' },
                { nombre: '1 cucharadita de extracto de vainilla', icono: '🌿' },
                { nombre: '1 taza de arándanos frescos', icono: '🫐' },
                { nombre: '1 cucharada de harina extra para arándanos', icono: '🌾' },
                { nombre: 'Azúcar para espolvorear', icono: '🍯' }
            ],
            instrucciones: [
                'Precalentar horno a 200°C y engrasar moldes para muffins',
                'En un bowl grande, mezclar harina, azúcar, polvo de hornear y sal',
                'En otro bowl, batir mantequilla derretida, huevo, leche y vainilla',
                'Enharinar los arándanos con la cucharada de harina extra',
                'Verter ingredientes líquidos sobre los secos y mezclar suavemente',
                'No mezclar demasiado, la masa debe quedar con grumos',
                'Incorporar los arándanos enharinados con movimientos suaves',
                'Llenar moldes 2/3 partes y espolvorear con azúcar',
                'Hornear 20-25 minutos hasta que estén dorados',
                'Dejar enfriar 5 minutos antes de desmoldar',
                'Servir tibios o a temperatura ambiente'
            ],
            imagen: 'https://images.unsplash.com/photo-1426869981800-95ebf51ce900?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.2,
            resenas: 11
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Tostadas de Aguacate',
            pais: 'Australia',
            tiempo: 10,
            categorias: ['Desayuno', 'Saludable'],
            ingredientes: [
                { nombre: '4 rebanadas de pan integral artesanal', icono: '🍞' },
                { nombre: '2 aguacates maduros', icono: '🥑' },
                { nombre: '1 limón (jugo fresco)', icono: '🍋' },
                { nombre: '1 tomate cherry cortado en mitades', icono: '🍅' },
                { nombre: '2 cucharadas de aceite de oliva extra virgen', icono: '🫒' },
                { nombre: '1/4 cucharadita de sal marina en escamas', icono: '🧂' },
                { nombre: '1/4 cucharadita de pimienta negra recién molida', icono: '🌶️' },
                { nombre: '2 cucharadas de semillas de girasol', icono: '🌻' },
                { nombre: '1 cucharada de cilantro fresco picado', icono: '🌿' },
                { nombre: 'Hojuelas de chile rojo (opcional)', icono: '🌶️' }
            ],
            instrucciones: [
                'Tostar las rebanadas de pan hasta que estén doradas y crujientes',
                'Mientras tanto, cortar los aguacates por la mitad y extraer la pulpa',
                'En un bowl, machacar los aguacates con un tenedor dejando algunos trozos',
                'Agregar jugo de limón inmediatamente para evitar oxidación',
                'Sazonar con sal y pimienta, mezclar suavemente',
                'Untar generosamente la mezcla de aguacate sobre cada tostada',
                'Decorar con tomates cherry cortados por encima',
                'Rociar con aceite de oliva extra virgen',
                'Espolvorear semillas de girasol y cilantro fresco',
                'Servir inmediatamente con hojuelas de chile al gusto'
            ],
            imagen: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.0,
            resenas: 13
        });
        
        // ========== MÁS COMIDAS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Lasaña de Carne',
            pais: 'Italia',
            tiempo: 90,
            categorias: ['Comida'],
            ingredientes: [
                { nombre: '12 láminas de pasta para lasaña', icono: '🍝' },
                { nombre: '500g de carne molida de res', icono: '🥩' },
                { nombre: '400g de tomates triturados en lata', icono: '🍅' },
                { nombre: '1 cebolla grande picada', icono: '🧅' },
                { nombre: '3 dientes de ajo picados', icono: '🧄' },
                { nombre: '2 cucharadas de aceite de oliva', icono: '🫒' },
                { nombre: '400g de queso ricotta', icono: '🧀' },
                { nombre: '300g de mozzarella rallada', icono: '🧀' },
                { nombre: '100g de queso parmesano rallado', icono: '🧀' },
                { nombre: '2 cucharadas de pasta de tomate', icono: '🍅' },
                { nombre: '1 cucharadita de orégano seco', icono: '🌿' },
                { nombre: '1 cucharadita de albahaca seca', icono: '🌿' },
                { nombre: 'Sal y pimienta al gusto', icono: '🧂' },
                { nombre: '2 cucharadas de perejil fresco', icono: '🌿' }
            ],
            instrucciones: [
                'Precalentar horno a 180°C y engrasar una fuente para lasaña',
                'Cocinar las láminas de pasta según instrucciones del paquete, escurrir',
                'En una sartén grande, calentar aceite y sofreír cebolla hasta transparente',
                'Agregar ajo y cocinar 1 minuto más',
                'Añadir carne molida y cocinar hasta dorar completamente',
                'Incorporar tomates, pasta de tomate, orégano y albahaca',
                'Sazonar con sal y pimienta, cocinar 15 minutos a fuego lento',
                'En la fuente, alternar capas: salsa de carne, pasta, ricotta, mozzarella',
                'Repetir hasta terminar ingredientes, finalizar con mozzarella y parmesano',
                'Cubrir con papel aluminio y hornear 45 minutos',
                'Retirar papel y hornear 15 minutos más hasta dorar',
                'Dejar reposar 10 minutos antes de cortar y servir con perejil'
            ],
            imagen: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.6,
            resenas: 25
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Paella Valenciana',
            pais: 'España',
            tiempo: 60,
            categorias: ['Comida'],
            ingredientes: [
                { nombre: '400g de arroz bomba o calasparra', icono: '🍚' },
                { nombre: '1 pollo de 1.5kg cortado en trozos', icono: '🍗' },
                { nombre: '500g de conejo cortado en trozos', icono: '🐰' },
                { nombre: '200g de judías verdes', icono: '🫛' },
                { nombre: '200g de garrofón (judías lima)', icono: '🫘' },
                { nombre: '2 tomates rallados', icono: '🍅' },
                { nombre: '1 pimiento rojo en tiras', icono: '🫑' },
                { nombre: '100ml de aceite de oliva', icono: '🫒' },
                { nombre: '1.2 litros de caldo de pollo', icono: '🍲' },
                { nombre: '1g de azafrán en hebras', icono: '🌿' },
                { nombre: '4 dientes de ajo picados', icono: '🧄' },
                { nombre: '1 cucharada de pimentón dulce', icono: '🌶️' },
                { nombre: 'Sal al gusto', icono: '🧂' },
                { nombre: '1 limón en cuartos', icono: '🍋' }
            ],
            instrucciones: [
                'Calentar aceite en paellera a fuego medio-alto',
                'Sazonar y dorar los trozos de pollo y conejo por todos lados',
                'Agregar judías verdes y garrofón, sofreír 5 minutos',
                'Añadir tomate rallado y ajo, cocinar hasta que se evapore el líquido',
                'Incorporar pimentón y azafrán, mezclar rápidamente',
                'Verter el caldo caliente y llevar a ebullición',
                'Distribuir el arroz uniformemente sin remover más',
                'Cocinar 10 minutos a fuego fuerte, luego 10 minutos a fuego medio',
                'Añadir pimiento rojo en los últimos 5 minutos',
                'Dejar reposar 5 minutos tapado con paño limpio',
                'Servir con cuartos de limón'
            ],
            imagen: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.7,
            resenas: 28
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Pad Thai',
            pais: 'Tailandia',
            tiempo: 25,
            categorias: ['Comida'],
            ingredientes: [
                { nombre: '200g de fideos de arroz anchos', icono: '🍜' },
                { nombre: '300g de camarones medianos pelados', icono: '🦐' },
                { nombre: '2 huevos batidos', icono: '🥚' },
                { nombre: '100g de brotes de soja', icono: '🌱' },
                { nombre: '3 cebolletas cortadas en trozos', icono: '🧅' },
                { nombre: '2 cucharadas de cacahuetes tostados picados', icono: '🥜' },
                { nombre: '2 cucharadas de aceite vegetal', icono: '🫒' },
                { nombre: '2 dientes de ajo picados', icono: '🧄' },
                { nombre: 'Para la salsa:', icono: '🥄' },
                { nombre: '3 cucharadas de salsa de pescado', icono: '🐟' },
                { nombre: '2 cucharadas de azúcar de palma', icono: '🍯' },
                { nombre: '2 cucharadas de pasta de tamarindo', icono: '🌿' },
                { nombre: '1 cucharada de salsa de soja', icono: '🥄' },
                { nombre: '1 lima en cuartos', icono: '🍋' }
            ],
            instrucciones: [
                'Remojar los fideos en agua tibia hasta que estén suaves, escurrir',
                'Mezclar todos los ingredientes de la salsa en un bowl pequeño',
                'Calentar aceite en wok o sartén grande a fuego alto',
                'Agregar ajo y sofreír 30 segundos hasta aromático',
                'Añadir camarones y cocinar hasta que cambien de color',
                'Empujar ingredientes a un lado, agregar huevos batidos',
                'Revolver huevos hasta que cuajen, luego mezclar con camarones',
                'Agregar fideos escurridos y la salsa, mezclar constantemente',
                'Incorporar brotes de soja y cebolletas, saltear 2 minutos',
                'Servir inmediatamente decorado con cacahuetes y cuartos de lima'
            ],
            imagen: 'https://images.unsplash.com/photo-1559314809-0f31657def5e?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.4,
            resenas: 19
        });
        
        // ========== MÁS CENAS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Hamburguesa Clásica',
            pais: 'Estados Unidos',
            tiempo: 20,
            categorias: ['Cena'],
            ingredientes: [
                { nombre: '600g de carne molida de res (80/20)', icono: '🥩' },
                { nombre: '4 panes para hamburguesa con semillas', icono: '🍔' },
                { nombre: '4 rebanadas de queso cheddar', icono: '🧀' },
                { nombre: '1 tomate grande en rebanadas', icono: '🍅' },
                { nombre: '4 hojas de lechuga iceberg', icono: '🥬' },
                { nombre: '1 cebolla roja en aros', icono: '🧅' },
                { nombre: '4 pepinillos en rebanadas', icono: '🥒' },
                { nombre: '4 cucharadas de mayonesa', icono: '🥄' },
                { nombre: '2 cucharadas de ketchup', icono: '🍅' },
                { nombre: '1 cucharada de mostaza', icono: '🌭' },
                { nombre: '2 cucharadas de aceite vegetal', icono: '🫒' },
                { nombre: 'Sal y pimienta al gusto', icono: '🧂' }
            ],
            instrucciones: [
                'Dividir la carne en 4 porciones y formar hamburguesas de 1.5cm de grosor',
                'Hacer una pequeña depresión en el centro de cada hamburguesa',
                'Sazonar ambos lados con sal y pimienta generosamente',
                'Calentar aceite en plancha o sartén a fuego medio-alto',
                'Cocinar hamburguesas 4 minutos sin presionar ni mover',
                'Voltear y cocinar 3-4 minutos más para término medio',
                'En el último minuto, agregar queso sobre cada hamburguesa',
                'Tostar los panes cortados en la misma plancha',
                'Untar mayonesa en la base, agregar lechuga y tomate',
                'Colocar hamburguesa con queso, cebolla y pepinillos',
                'Agregar ketchup y mostaza en la tapa, cerrar y servir'
            ],
            imagen: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.2,
            resenas: 30
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Ramen Japonés',
            pais: 'Japón',
            tiempo: 40,
            categorias: ['Cena'],
            ingredientes: [
                { nombre: '4 porciones de fideos ramen frescos', icono: '🍜' },
                { nombre: '1.5 litros de caldo de huesos de cerdo', icono: '🍲' },
                { nombre: '4 huevos para ramen (cocidos 6 minutos)', icono: '🥚' },
                { nombre: '200g de chashu (panceta de cerdo cocida)', icono: '🥓' },
                { nombre: '4 hojas de nori (alga marina)', icono: '🌿' },
                { nombre: '2 cebolletas finamente picadas', icono: '🧅' },
                { nombre: '100g de brotes de bambú', icono: '🎋' },
                { nombre: '2 cucharadas de miso rojo', icono: '🥄' },
                { nombre: '1 cucharada de aceite de sésamo', icono: '🫒' },
                { nombre: '2 dientes de ajo picados', icono: '🧄' },
                { nombre: '1 trozo de jengibre rallado', icono: '🫚' },
                { nombre: 'Sal y pimienta blanca al gusto', icono: '🧂' }
            ],
            instrucciones: [
                'Calentar el caldo de huesos en una olla grande',
                'Disolver el miso en un poco de caldo caliente',
                'Agregar miso disuelto, ajo, jengibre y aceite de sésamo al caldo',
                'Cocinar los fideos ramen según instrucciones del paquete',
                'Escurrir fideos y dividir entre 4 bowls hondos',
                'Verter el caldo caliente sobre los fideos',
                'Cortar los huevos por la mitad y el chashu en rebanadas',
                'Decorar cada bowl con huevo, chashu, brotes de bambú',
                'Agregar hoja de nori y cebolletas picadas',
                'Servir inmediatamente muy caliente'
            ],
            imagen: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.5,
            resenas: 19
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Fish and Chips',
            pais: 'Reino Unido',
            tiempo: 30,
            categorias: ['Cena'],
            ingredientes: [
                { nombre: '800g de filetes de bacalao o merluza', icono: '🐟' },
                { nombre: '1 kg de papas para freír', icono: '🥔' },
                { nombre: '200g de harina para todo uso', icono: '🌾' },
                { nombre: '250ml de cerveza fría', icono: '🍺' },
                { nombre: '1 cucharadita de polvo de hornear', icono: '🥄' },
                { nombre: '1 cucharadita de sal', icono: '🧂' },
                { nombre: '1/2 cucharadita de pimienta blanca', icono: '🌶️' },
                { nombre: '2 litros de aceite vegetal para freír', icono: '🫒' },
                { nombre: 'Harina extra para enharinar', icono: '🌾' },
                { nombre: 'Sal marina gruesa', icono: '🧂' },
                { nombre: 'Vinagre de malta para servir', icono: '🥄' },
                { nombre: 'Guisantes machacados (opcional)', icono: '🟢' }
            ],
            instrucciones: [
                'Cortar papas en bastones gruesos y remojar en agua fría 30 minutos',
                'Calentar aceite a 160°C en freidora o olla profunda',
                'Secar papas y freír 5 minutos (primera cocción), escurrir',
                'Para la masa: mezclar harina, polvo de hornear, sal y pimienta',
                'Agregar cerveza gradualmente hasta formar masa lisa',
                'Secar filetes de pescado y enharinar ligeramente',
                'Sumergir pescado en la masa y freír en aceite a 180°C por 4-5 minutos',
                'Escurrir pescado en papel absorbente',
                'Freír papas nuevamente a 190°C por 2-3 minutos hasta dorar',
                'Servir inmediatamente con sal marina, vinagre y guisantes'
            ],
            imagen: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.1,
            resenas: 16
        });
        
        // ========== POSTRES ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Tiramisú',
            pais: 'Italia',
            tiempo: 240,
            categorias: ['Postre'],
            ingredientes: [
                { nombre: '500g de queso mascarpone a temperatura ambiente', icono: '🧀' },
                { nombre: '6 huevos grandes (separados)', icono: '🥚' },
                { nombre: '150g de azúcar', icono: '🍯' },
                { nombre: '300 bizcochos de soletilla', icono: '🍪' },
                { nombre: '500ml de café espresso fuerte y frío', icono: '☕' },
                { nombre: '3 cucharadas de licor de café (opcional)', icono: '🥃' },
                { nombre: '3 cucharadas de cacao en polvo sin azúcar', icono: '🍫' },
                { nombre: '1 cucharadita de extracto de vainilla', icono: '🌿' },
                { nombre: 'Una pizca de sal', icono: '🧂' }
            ],
            instrucciones: [
                'Batir yemas con azúcar hasta que estén pálidas y cremosas (5 minutos)',
                'Agregar mascarpone y vainilla, batir hasta integrar completamente',
                'Batir claras con sal a punto de nieve firme',
                'Incorporar claras a la mezcla de mascarpone con movimientos envolventes',
                'Mezclar café frío con licor en un plato hondo',
                'Sumergir rápidamente cada bizcocho en el café',
                'Colocar una capa de bizcochos en el fondo de una fuente',
                'Cubrir con la mitad de la crema de mascarpone',
                'Repetir con otra capa de bizcochos y el resto de crema',
                'Refrigerar mínimo 4 horas o toda la noche',
                'Antes de servir, espolvorear generosamente con cacao en polvo'
            ],
            imagen: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.7,
            resenas: 28
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Cheesecake',
            pais: 'Estados Unidos',
            tiempo: 300,
            categorias: ['Postre'],
            ingredientes: [
                { nombre: '200g de galletas digestivas trituradas', icono: '🍪' },
                { nombre: '80g de mantequilla derretida', icono: '🧈' },
                { nombre: '800g de queso crema a temperatura ambiente', icono: '🧀' },
                { nombre: '200g de azúcar', icono: '🍯' },
                { nombre: '4 huevos grandes', icono: '🥚' },
                { nombre: '200ml de crema para batir', icono: '🥛' },
                { nombre: '2 cucharaditas de extracto de vainilla', icono: '🌿' },
                { nombre: '2 cucharadas de harina', icono: '🌾' },
                { nombre: '1/4 cucharadita de sal', icono: '🧂' },
                { nombre: 'Fresas frescas para decorar', icono: '🍓' }
            ],
            instrucciones: [
                'Precalentar horno a 160°C y engrasar molde desmontable de 23cm',
                'Mezclar galletas trituradas con mantequilla derretida',
                'Presionar mezcla en el fondo del molde, hornear 10 minutos',
                'Batir queso crema hasta que esté suave y sin grumos',
                'Agregar azúcar gradualmente, batir hasta integrar',
                'Incorporar huevos de uno en uno, batiendo bien cada adición',
                'Añadir crema, vainilla, harina y sal, mezclar hasta homogeneizar',
                'Verter sobre la base de galletas',
                'Hornear en baño maría por 60-70 minutos hasta que el centro esté firme',
                'Enfriar completamente, luego refrigerar mínimo 4 horas',
                'Decorar con fresas antes de servir'
            ],
            imagen: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.6,
            resenas: 24
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Flan Napolitano',
            pais: 'México',
            tiempo: 180,
            categorias: ['Postre'],
            ingredientes: [
                { nombre: '1 lata de leche condensada (397g)', icono: '🥛' },
                { nombre: '1 lata de leche evaporada (354ml)', icono: '🥛' },
                { nombre: '5 huevos grandes', icono: '🥚' },
                { nombre: '1 cucharadita de extracto de vainilla', icono: '🌿' },
                { nombre: 'Para el caramelo:', icono: '🍯' },
                { nombre: '200g de azúcar granulada', icono: '🍯' },
                { nombre: '60ml de agua', icono: '💧' }
            ],
            instrucciones: [
                'Precalentar horno a 180°C',
                'Para el caramelo: en una sartén, calentar azúcar con agua a fuego medio',
                'Cocinar sin revolver hasta obtener caramelo dorado (15-20 minutos)',
                'Verter caramelo inmediatamente en molde flanero, cubrir fondo y lados',
                'Dejar enfriar hasta que el caramelo se endurezca',
                'En licuadora, mezclar leche condensada, evaporada, huevos y vainilla',
                'Licuar por 1 minuto hasta obtener mezcla homogénea',
                'Colar la mezcla para eliminar burbujas',
                'Verter cuidadosamente sobre el caramelo endurecido',
                'Cubrir con papel aluminio y hornear en baño maría 60-70 minutos',
                'Probar con palillo: debe salir limpio',
                'Enfriar completamente, refrigerar mínimo 4 horas antes de desmoldar'
            ],
            imagen: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.4,
            resenas: 21
        });
        
        // ========== MÁS BEBIDAS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Margarita',
            pais: 'México',
            tiempo: 3,
            categorias: ['Bebida'],
            ingredientes: [
                { nombre: '60ml de tequila blanco 100% agave', icono: '🥃' },
                { nombre: '30ml de triple sec o Cointreau', icono: '🍊' },
                { nombre: '30ml de jugo de lima fresco', icono: '🍋' },
                { nombre: '1 cucharadita de azúcar (opcional)', icono: '🍯' },
                { nombre: '1 taza de hielo', icono: '🧊' },
                { nombre: 'Sal gruesa para escarchar', icono: '🧂' },
                { nombre: '1 rodaja de lima para decorar', icono: '🍋' }
            ],
            instrucciones: [
                'Frotar el borde de la copa margarita con una rodaja de lima',
                'Sumergir el borde húmedo en sal gruesa para escarcharlo',
                'En una coctelera, agregar tequila, triple sec y jugo de lima',
                'Si se desea más dulce, agregar azúcar',
                'Llenar la coctelera con hielo',
                'Agitar vigorosamente por 15 segundos',
                'Colar y servir en la copa escarchada con hielo fresco',
                'Decorar con rodaja de lima en el borde',
                'Servir inmediatamente'
            ],
            imagen: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.4,
            resenas: 21
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Agua de Jamaica',
            pais: 'México',
            tiempo: 15,
            categorias: ['Bebida'],
            ingredientes: [
                { nombre: '1 taza de flor de jamaica seca', icono: '🌺' },
                { nombre: '2 litros de agua', icono: '💧' },
                { nombre: '1/2 taza de azúcar (al gusto)', icono: '🍯' },
                { nombre: '2 limones (jugo fresco)', icono: '🍋' },
                { nombre: '2 tazas de hielo', icono: '🧊' },
                { nombre: 'Rodajas de limón para decorar', icono: '🍋' }
            ],
            instrucciones: [
                'Enjuagar la flor de jamaica en agua fría para limpiarla',
                'Hervir 1 litro de agua en una olla mediana',
                'Cuando hierva, agregar la flor de jamaica',
                'Retirar del fuego y dejar reposar 10 minutos',
                'Colar el líquido presionando las flores para extraer todo el sabor',
                'Agregar el litro restante de agua fría',
                'Endulzar con azúcar al gusto mientras esté tibia',
                'Agregar jugo de limón fresco',
                'Refrigerar hasta que esté bien fría',
                'Servir con hielo y decorar con rodajas de limón'
            ],
            imagen: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.1,
            resenas: 14
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Smoothie de Frutas',
            pais: 'Tropical',
            tiempo: 8,
            categorias: ['Bebida', 'Saludable'],
            ingredientes: [
                { nombre: '1 mango maduro pelado y cortado', icono: '🥭' },
                { nombre: '1 taza de piña fresca en trozos', icono: '🍍' },
                { nombre: '1 plátano maduro', icono: '🍌' },
                { nombre: '1/2 taza de yogurt griego natural', icono: '🥛' },
                { nombre: '2 cucharadas de miel de abeja', icono: '🍯' },
                { nombre: '1/2 taza de leche de coco', icono: '🥥' },
                { nombre: '1 taza de hielo', icono: '🧊' },
                { nombre: '1 cucharada de jugo de lima', icono: '🍋' },
                { nombre: 'Hojas de menta para decorar', icono: '🌿' }
            ],
            instrucciones: [
                'Pelar y cortar todas las frutas en trozos medianos',
                'Colocar mango, piña y plátano en la licuadora',
                'Agregar yogurt griego y miel',
                'Verter leche de coco y jugo de lima',
                'Añadir hielo para obtener consistencia fría',
                'Licuar a velocidad alta por 60-90 segundos',
                'Probar y ajustar dulzor con más miel si es necesario',
                'Si está muy espeso, agregar más leche de coco',
                'Servir inmediatamente en vasos altos',
                'Decorar con hojas de menta fresca'
            ],
            imagen: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.2,
            resenas: 15
        });
        
        // ========== BOTANAS Y ENTRADAS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Hummus',
            pais: 'Líbano',
            tiempo: 15,
            categorias: ['Botana'],
            ingredientes: [
                { nombre: '400g de garbanzos cocidos (1 lata escurrida)', icono: '🫘' },
                { nombre: '3 cucharadas de tahini (pasta de sésamo)', icono: '🥄' },
                { nombre: '2 dientes de ajo', icono: '🧄' },
                { nombre: '3 cucharadas de jugo de limón fresco', icono: '🍋' },
                { nombre: '3 cucharadas de aceite de oliva extra virgen', icono: '🫒' },
                { nombre: '1/2 cucharadita de comino molido', icono: '🌶️' },
                { nombre: '1/2 cucharadita de sal', icono: '🧂' },
                { nombre: '2-3 cucharadas de agua fría', icono: '💧' },
                { nombre: 'Pimentón dulce para decorar', icono: '🌶️' },
                { nombre: 'Pan pita o vegetales para acompañar', icono: '🥖' }
            ],
            instrucciones: [
                'Si usas garbanzos de lata, enjuagarlos y escurrirlos bien',
                'Reservar algunas cucharadas de garbanzos para decorar',
                'En procesador de alimentos, procesar ajo hasta picarlo finamente',
                'Agregar garbanzos y procesar hasta obtener pasta gruesa',
                'Añadir tahini, jugo de limón, comino y sal',
                'Procesar mientras agregas aceite de oliva en hilo',
                'Agregar agua fría poco a poco hasta obtener consistencia cremosa',
                'Probar y ajustar sazón con más limón o sal',
                'Servir en plato extendido, hacer surcos con cuchara',
                'Decorar con garbanzos reservados, pimentón y aceite de oliva'
            ],
            imagen: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.2,
            resenas: 18
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Nachos con Queso',
            pais: 'México',
            tiempo: 15,
            categorias: ['Botana'],
            ingredientes: [
                { nombre: '300g de totopos de maíz', icono: '🌮' },
                { nombre: '200g de queso cheddar rallado', icono: '🧀' },
                { nombre: '100g de queso monterey jack rallado', icono: '🧀' },
                { nombre: '1/2 taza de jalapeños en rodajas', icono: '🌶️' },
                { nombre: '1/2 taza de crema mexicana', icono: '🥛' },
                { nombre: '1/2 taza de guacamole', icono: '🥑' },
                { nombre: '1/4 taza de salsa pico de gallo', icono: '🍅' },
                { nombre: '2 cebolletas finamente picadas', icono: '🧅' },
                { nombre: '1/4 taza de cilantro fresco picado', icono: '🌿' },
                { nombre: '1 lima cortada en cuartos', icono: '🍋' }
            ],
            instrucciones: [
                'Precalentar horno a 200°C',
                'Extender los totopos en una bandeja para horno grande',
                'Mezclar ambos quesos rallados en un bowl',
                'Distribuir el queso uniformemente sobre los totopos',
                'Esparcir jalapeños sobre el queso',
                'Hornear 8-10 minutos hasta que el queso se derrita completamente',
                'Retirar del horno cuando el queso esté burbujeante',
                'Agregar dollops de crema mexicana y guacamole',
                'Esparcir pico de gallo, cebolletas y cilantro',
                'Servir inmediatamente con cuartos de lima'
            ],
            imagen: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.3,
            resenas: 26
        });
        
        // ========== RÁPIDAS Y ECONÓMICAS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Quesadillas',
            pais: 'México',
            tiempo: 10,
            categorias: ['Rápida', 'Económica'],
            ingredientes: [
                { nombre: '8 tortillas de harina medianas', icono: '🌮' },
                { nombre: '300g de queso oaxaca o monterey jack rallado', icono: '🧀' },
                { nombre: '200g de jamón en rebanadas delgadas', icono: '🥓' },
                { nombre: '2 cucharadas de mantequilla', icono: '🧈' },
                { nombre: '1/2 taza de crema mexicana', icono: '🥛' },
                { nombre: '1/2 taza de salsa verde', icono: '🌶️' },
                { nombre: '1 aguacate en rebanadas', icono: '🥑' }
            ],
            instrucciones: [
                'Colocar queso rallado en la mitad de cada tortilla',
                'Agregar jamón sobre el queso si se desea',
                'Doblar tortilla por la mitad presionando suavemente',
                'Calentar mantequilla en sartén grande a fuego medio',
                'Cocinar quesadillas 2-3 minutos por lado hasta dorar',
                'El queso debe estar completamente derretido',
                'Cortar en triángulos con cortador de pizza',
                'Servir calientes con crema, salsa y aguacate'
            ],
            imagen: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.1,
            resenas: 32
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Pasta con Mantequilla',
            pais: 'Italia',
            tiempo: 12,
            categorias: ['Rápida', 'Económica'],
            ingredientes: [
                { nombre: '400g de pasta (spaghetti o fettuccine)', icono: '🍝' },
                { nombre: '100g de mantequilla sin sal', icono: '🧈' },
                { nombre: '100g de queso parmesano recién rallado', icono: '🧀' },
                { nombre: '2 dientes de ajo finamente picados', icono: '🧄' },
                { nombre: '1/4 taza de perejil fresco picado', icono: '🌿' },
                { nombre: 'Sal gruesa para el agua', icono: '🧂' },
                { nombre: 'Pimienta negra recién molida', icono: '🌶️' }
            ],
            instrucciones: [
                'Hervir abundante agua con sal en olla grande',
                'Cocinar pasta según instrucciones del paquete hasta al dente',
                'Mientras tanto, derretir mantequilla en sartén grande a fuego bajo',
                'Agregar ajo a la mantequilla y cocinar 1 minuto sin dorar',
                'Reservar 1 taza del agua de cocción antes de escurrir',
                'Escurrir pasta y agregar inmediatamente a la sartén',
                'Mezclar pasta con mantequilla, agregar agua de cocción si necesario',
                'Retirar del fuego, agregar queso parmesano y mezclar',
                'Sazonar con pimienta negra y perejil fresco',
                'Servir inmediatamente con más queso parmesano'
            ],
            imagen: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 3.9,
            resenas: 24
        });
        
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Huevos Revueltos',
            pais: 'Universal',
            tiempo: 5,
            categorias: ['Rápida', 'Económica', 'Desayuno'],
            ingredientes: [
                { nombre: '6 huevos frescos grandes', icono: '🥚' },
                { nombre: '2 cucharadas de mantequilla', icono: '🧈' },
                { nombre: '3 cucharadas de leche entera', icono: '🥛' },
                { nombre: '1/2 cucharadita de sal', icono: '🧂' },
                { nombre: '1/4 cucharadita de pimienta negra', icono: '🌶️' },
                { nombre: '2 cucharadas de cebollín picado (opcional)', icono: '🧅' }
            ],
            instrucciones: [
                'Batir huevos con leche, sal y pimienta en un bowl',
                'Calentar mantequilla en sartén antiadherente a fuego medio-bajo',
                'Cuando la mantequilla espume, verter los huevos batidos',
                'Dejar cuajar 20 segundos sin mover',
                'Con espátula de silicón, empujar huevos del borde al centro',
                'Inclinar sartén para que huevo líquido llegue al fondo',
                'Repetir proceso hasta que huevos estén casi cuajados',
                'Retirar del fuego mientras aún están cremosos',
                'Servir inmediatamente espolvoreados con cebollín'
            ],
            imagen: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 3.8,
            resenas: 45
        });
        
        // ========== MÁS DESAYUNOS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Huevos Benedictinos',
            pais: 'Estados Unidos',
            tiempo: 25,
            categorias: ['Desayuno'],
            ingredientes: [
                { nombre: '4 huevos frescos', icono: '🥚' },
                { nombre: '2 muffins ingleses cortados por la mitad', icono: '🍞' },
                { nombre: '4 rebanadas de jamón canadiense', icono: '🥓' },
                { nombre: '2 cucharadas de vinagre blanco', icono: '🥄' },
                { nombre: 'Para la salsa holandesa:', icono: '🥄' },
                { nombre: '3 yemas de huevo', icono: '🥚' },
                { nombre: '100g de mantequilla sin sal', icono: '🧈' },
                { nombre: '2 cucharadas de jugo de limón', icono: '🍋' },
                { nombre: '1/4 cucharadita de sal', icono: '🧂' },
                { nombre: 'Una pizca de cayena', icono: '🌶️' },
                { nombre: 'Perejil fresco para decorar', icono: '🌿' }
            ],
            instrucciones: [
                'Para la salsa holandesa: derretir mantequilla en baño maría',
                'Batir yemas con limón, sal y cayena en otro bowl',
                'Agregar mantequilla derretida en hilo fino mientras bates',
                'Mantener tibia en baño maría',
                'Hervir agua con vinagre en olla honda',
                'Crear remolino y agregar huevos uno por uno para pochar',
                'Cocinar 3-4 minutos hasta que claras estén firmes',
                'Tostar muffins ingleses hasta dorar',
                'Calentar jamón en sartén por 1 minuto cada lado',
                'Montar: muffin, jamón, huevo pochado, salsa holandesa',
                'Decorar con perejil y servir inmediatamente'
            ],
            imagen: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.6,
            resenas: 18
        });

        recipes.push({
            id: nextRecipeId++,
            nombre: 'Yogurt con Granola',
            pais: 'Grecia',
            tiempo: 10,
            categorias: ['Desayuno', 'Saludable'],
            ingredientes: [
                { nombre: '2 tazas de yogurt griego natural', icono: '🥛' },
                { nombre: '1 taza de granola casera', icono: '🥣' },
                { nombre: '1/2 taza de fresas frescas cortadas', icono: '🍓' },
                { nombre: '1/2 taza de arándanos frescos', icono: '🫐' },
                { nombre: '2 cucharadas de miel de abeja', icono: '🍯' },
                { nombre: '2 cucharadas de nueces picadas', icono: '🥜' },
                { nombre: '1 cucharada de semillas de chía', icono: '🌱' },
                { nombre: '1 kiwi pelado y cortado', icono: '🥝' }
            ],
            instrucciones: [
                'Lavar y cortar todas las frutas frescas',
                'En vasos o bowls, colocar una capa de yogurt griego',
                'Agregar una capa de granola sobre el yogurt',
                'Añadir frutas mezcladas uniformemente',
                'Repetir capas hasta llenar el recipiente',
                'Rociar miel sobre la capa superior',
                'Espolvorear nueces picadas y semillas de chía',
                'Servir inmediatamente o refrigerar máximo 2 horas'
            ],
            imagen: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.3,
            resenas: 22
        });

        recipes.push({
            id: nextRecipeId++,
            nombre: 'Pan Francés',
            pais: 'Francia',
            tiempo: 15,
            categorias: ['Francesa', 'Desayuno'],
            ingredientes: [
                { nombre: '8 rebanadas de pan brioche del día anterior', icono: '🍞' },
                { nombre: '4 huevos grandes', icono: '🥚' },
                { nombre: '1/2 taza de leche entera', icono: '🥛' },
                { nombre: '2 cucharadas de azúcar', icono: '🍯' },
                { nombre: '1 cucharadita de extracto de vainilla', icono: '🌿' },
                { nombre: '1/2 cucharadita de canela molida', icono: '🌶️' },
                { nombre: '1/4 cucharadita de sal', icono: '🧂' },
                { nombre: '3 cucharadas de mantequilla', icono: '🧈' },
                { nombre: 'Azúcar glass para espolvorear', icono: '🍯' },
                { nombre: 'Miel de maple', icono: '🍯' }
            ],
            instrucciones: [
                'Batir huevos, leche, azúcar, vainilla, canela y sal en bowl hondo',
                'Sumergir cada rebanada de pan en la mezcla por ambos lados',
                'Dejar que absorba bien la mezcla por 30 segundos',
                'Calentar mantequilla en sartén grande a fuego medio',
                'Cocinar rebanadas 3-4 minutos por lado hasta dorar',
                'Mantener calientes en horno a 100°C',
                'Espolvorear con azúcar glass antes de servir',
                'Acompañar con miel de maple tibia'
            ],
            imagen: 'img/pan-frances.svg',
            calificacion: 4.4,
            resenas: 16
        });

        recipes.push({
            id: nextRecipeId++,
            nombre: 'Desayuno Japonés',
            pais: 'Japón',
            tiempo: 20,
            categorias: ['Japonesa', 'Desayuno'],
            ingredientes: [
                { nombre: '2 tazas de arroz japonés cocido', icono: '🍚' },
                { nombre: '4 huevos frescos', icono: '🥚' },
                { nombre: '4 cucharadas de salsa de soja', icono: '🥄' },
                { nombre: '2 cucharadas de miso blanco', icono: '🥄' },
                { nombre: '1 taza de caldo dashi', icono: '🍲' },
                { nombre: '100g de tofu sedoso', icono: '🧀' },
                { nombre: '2 cebolletas picadas', icono: '🧅' },
                { nombre: '1 hoja de nori cortada en tiras', icono: '🌿' },
                { nombre: '1 cucharada de semillas de sésamo', icono: '🌱' },
                { nombre: '100g de salmón salado', icono: '🐟' }
            ],
            instrucciones: [
                'Calentar arroz cocido en microondas o vapor',
                'Preparar sopa miso: disolver miso en caldo dashi caliente',
                'Agregar tofu en cubitos a la sopa miso',
                'Cocinar huevos: hervir 6 minutos para yema cremosa',
                'Pelar huevos cuidadosamente bajo agua fría',
                'Servir arroz en bowls individuales',
                'Colocar huevo sobre arroz, rociar con salsa de soja',
                'Acompañar con sopa miso, salmón y nori',
                'Espolvorear semillas de sésamo y cebolletas'
            ],
            imagen: 'img/desayuno-japones.svg',
            calificacion: 4.2,
            resenas: 12
        });

        // ========== MÁS COMIDAS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Arepas Venezolanas',
            pais: 'Venezuela',
            tiempo: 30,
            categorias: ['Comida'],
            ingredientes: [
                { nombre: '2 tazas de harina de maíz precocida', icono: '🌽' },
                { nombre: '2 1/2 tazas de agua tibia', icono: '💧' },
                { nombre: '1 cucharadita de sal', icono: '🧂' },
                { nombre: '1 cucharada de aceite vegetal', icono: '🫒' },
                { nombre: 'Para el relleno:', icono: '🥩' },
                { nombre: '300g de pollo desmenuzado', icono: '🍗' },
                { nombre: '200g de queso blanco rallado', icono: '🧀' },
                { nombre: '1 aguacate en rebanadas', icono: '🥑' },
                { nombre: '2 tomates en rodajas', icono: '🍅' },
                { nombre: 'Mayonesa al gusto', icono: '🥄' }
            ],
            instrucciones: [
                'Mezclar agua tibia con sal hasta disolver',
                'Agregar harina de maíz gradualmente mientras mezclas',
                'Amasar hasta obtener masa suave y sin grumos',
                'Dejar reposar 5 minutos para hidratar',
                'Formar bolas del tamaño de una pelota de tenis',
                'Aplanar formando discos de 1cm de grosor',
                'Cocinar en plancha o sartén sin aceite 7 minutos por lado',
                'Deben sonar huecas al golpear',
                'Abrir cuidadosamente por un lado formando bolsillo',
                'Rellenar con pollo, queso, aguacate y tomate',
                'Servir calientes inmediatamente'
            ],
            imagen: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.5,
            resenas: 28
        });

        recipes.push({
            id: nextRecipeId++,
            nombre: 'Empanadas Colombianas',
            pais: 'Colombia',
            tiempo: 45,
            categorias: ['Colombiana', 'Comida'],
            ingredientes: [
                { nombre: '2 tazas de harina de maíz amarilla', icono: '🌽' },
                { nombre: '2 tazas de agua', icono: '💧' },
                { nombre: '1 cucharadita de sal', icono: '🧂' },
                { nombre: '2 cucharadas de aceite', icono: '🫒' },
                { nombre: 'Para el relleno:', icono: '🥩' },
                { nombre: '300g de carne molida', icono: '🥩' },
                { nombre: '2 papas medianas en cubitos', icono: '🥔' },
                { nombre: '1 cebolla picada', icono: '🧅' },
                { nombre: '2 dientes de ajo', icono: '🧄' },
                { nombre: '1 cucharadita de comino', icono: '🌶️' },
                { nombre: '1 cucharadita de color (achiote)', icono: '🌶️' },
                { nombre: 'Aceite para freír', icono: '🫒' }
            ],
            instrucciones: [
                'Hervir agua con sal y aceite',
                'Agregar harina de maíz gradualmente revolviendo',
                'Cocinar 5 minutos hasta formar masa homogénea',
                'Dejar enfriar y amasar hasta suave',
                'Para relleno: sofreír cebolla y ajo',
                'Agregar carne, comino y color, cocinar 10 minutos',
                'Añadir papas cocidas, sazonar y enfriar',
                'Formar círculos con la masa, rellenar',
                'Doblar y sellar bordes con tenedor',
                'Freír en aceite caliente hasta dorar',
                'Escurrir y servir calientes'
            ],
            imagen: 'img/empanadas-colombianas.svg',
            calificacion: 4.6,
            resenas: 32
        });

        recipes.push({
            id: nextRecipeId++,
            nombre: 'Gallo Pinto',
            pais: 'Costa Rica',
            tiempo: 20,
            categorias: ['Costarricense', 'Comida'],
            ingredientes: [
                { nombre: '2 tazas de arroz cocido del día anterior', icono: '🍚' },
                { nombre: '1 taza de frijoles negros cocidos', icono: '🫘' },
                { nombre: '1/2 taza de caldo de frijoles', icono: '🍲' },
                { nombre: '1 cebolla mediana picada', icono: '🧅' },
                { nombre: '1 pimiento rojo picado', icono: '🫑' },
                { nombre: '3 dientes de ajo picados', icono: '🧄' },
                { nombre: '2 cucharadas de aceite vegetal', icono: '🫒' },
                { nombre: '2 cucharadas de salsa inglesa', icono: '🥄' },
                { nombre: '1 cucharadita de comino', icono: '🌶️' },
                { nombre: 'Sal y pimienta al gusto', icono: '🧂' },
                { nombre: 'Cilantro fresco picado', icono: '🌿' }
            ],
            instrucciones: [
                'Calentar aceite en sartén grande a fuego medio',
                'Sofreír cebolla hasta transparente',
                'Agregar pimiento y ajo, cocinar 3 minutos',
                'Añadir frijoles con su caldo',
                'Incorporar salsa inglesa y comino',
                'Agregar arroz desmenuzando grumos',
                'Mezclar todo cuidadosamente',
                'Cocinar 5-7 minutos revolviendo ocasionalmente',
                'Sazonar con sal y pimienta',
                'Servir decorado con cilantro fresco'
            ],
            imagen: 'img/gallo-pinto.svg',
            calificacion: 4.3,
            resenas: 19
        });

        recipes.push({
            id: nextRecipeId++,
            nombre: 'Pupusas Salvadoreñas',
            pais: 'El Salvador',
            tiempo: 40,
            categorias: ['Salvadoreña', 'Comida'],
            ingredientes: [
                { nombre: '2 tazas de masa harina para pupusas', icono: '🌽' },
                { nombre: '1 1/4 tazas de agua tibia', icono: '💧' },
                { nombre: '1 cucharadita de sal', icono: '🧂' },
                { nombre: 'Para el relleno:', icono: '🧀' },
                { nombre: '200g de queso mozzarella rallado', icono: '🧀' },
                { nombre: '200g de chicharrón prensado', icono: '🥓' },
                { nombre: '1 taza de frijoles refritos', icono: '🫘' },
                { nombre: 'Para la curtida:', icono: '🥬' },
                { nombre: '1/2 repollo finamente cortado', icono: '🥬' },
                { nombre: '1 zanahoria rallada', icono: '🥕' },
                { nombre: '1/2 taza de vinagre blanco', icono: '🥄' },
                { nombre: '1 cucharadita de orégano', icono: '🌿' }
            ],
            instrucciones: [
                'Mezclar masa harina con agua y sal hasta formar masa suave',
                'Dejar reposar 10 minutos',
                'Para curtida: mezclar vegetales con vinagre y orégano',
                'Formar bolas de masa del tamaño de una pelota de tenis',
                'Hacer hoyo en el centro, rellenar con queso y chicharrón',
                'Cerrar y aplanar cuidadosamente',
                'Cocinar en comal sin aceite 3-4 minutos por lado',
                'Deben inflarse ligeramente',
                'Servir calientes con curtida y salsa'
            ],
            imagen: 'img/pupusas-salvadorenas.svg',
            calificacion: 4.4,
            resenas: 25
        });

        // ========== MÁS CENAS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Enchiladas de Desayuno',
            pais: 'México',
            tiempo: 35,
            categorias: ['Mexicana', 'Cena'],
            ingredientes: [
                { nombre: '8 tortillas de maíz', icono: '🌮' },
                { nombre: '8 huevos revueltos', icono: '🥚' },
                { nombre: '2 tazas de salsa roja', icono: '🍅' },
                { nombre: '200g de queso fresco desmoronado', icono: '🧀' },
                { nombre: '1/2 taza de crema mexicana', icono: '🥛' },
                { nombre: '1/4 cebolla blanca en rebanadas', icono: '🧅' },
                { nombre: '200g de chorizo mexicano', icono: '🌭' },
                { nombre: '1/2 taza de aceite para freír', icono: '🫒' },
                { nombre: 'Cilantro fresco para decorar', icono: '🌿' }
            ],
            instrucciones: [
                'Cocinar chorizo en sartén hasta dorar, reservar',
                'Preparar huevos revueltos cremosos, mezclar con chorizo',
                'Calentar salsa roja en olla pequeña',
                'Freír tortillas ligeramente en aceite caliente',
                'Sumergir cada tortilla en salsa caliente',
                'Rellenar con mezcla de huevo y chorizo',
                'Enrollar y colocar en plato',
                'Bañar con más salsa caliente',
                'Decorar con queso, crema, cebolla y cilantro',
                'Servir inmediatamente muy calientes'
            ],
            imagen: 'img/enchiladas-desayuno.svg',
            calificacion: 4.5,
            resenas: 21
        });

        recipes.push({
            id: nextRecipeId++,
            nombre: 'Molletes Mexicanos',
            pais: 'México',
            tiempo: 15,
            categorias: ['Mexicana', 'Cena'],
            ingredientes: [
                { nombre: '4 bolillos o pan francés', icono: '🥖' },
                { nombre: '2 tazas de frijoles refritos', icono: '🫘' },
                { nombre: '300g de queso oaxaca o monterey jack rallado', icono: '🧀' },
                { nombre: '2 tomates en cubitos', icono: '🍅' },
                { nombre: '1/2 cebolla blanca picada', icono: '🧅' },
                { nombre: '2 chiles serranos picados', icono: '🌶️' },
                { nombre: '1/4 taza de cilantro picado', icono: '🌿' },
                { nombre: '2 aguacates en rebanadas', icono: '🥑' },
                { nombre: 'Salsa verde al gusto', icono: '🌶️' }
            ],
            instrucciones: [
                'Precalentar horno a 200°C',
                'Cortar bolillos por la mitad a lo largo',
                'Tostar ligeramente en el horno 5 minutos',
                'Untar frijoles refritos generosamente',
                'Cubrir con queso rallado abundante',
                'Hornear 8-10 minutos hasta que el queso se derrita',
                'Mientras tanto, mezclar tomate, cebolla, chile y cilantro',
                'Sacar del horno cuando el queso burbujee',
                'Agregar pico de gallo y aguacate',
                'Servir con salsa verde al lado'
            ],
            imagen: 'img/molletes-mexicanos.svg',
            calificacion: 4.2,
            resenas: 18
        });

        // ========== MÁS POSTRES ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Banana Bread',
            pais: 'Estados Unidos',
            tiempo: 75,
            categorias: ['Postre'],
            ingredientes: [
                { nombre: '3 plátanos muy maduros machacados', icono: '🍌' },
                { nombre: '1/3 taza de mantequilla derretida', icono: '🧈' },
                { nombre: '3/4 taza de azúcar', icono: '🍯' },
                { nombre: '1 huevo batido', icono: '🥚' },
                { nombre: '1 cucharadita de extracto de vainilla', icono: '🌿' },
                { nombre: '1 cucharadita de bicarbonato de sodio', icono: '🥄' },
                { nombre: '1/4 cucharadita de sal', icono: '🧂' },
                { nombre: '1 1/2 tazas de harina para todo uso', icono: '🌾' },
                { nombre: '1/2 taza de nueces picadas (opcional)', icono: '🥜' }
            ],
            instrucciones: [
                'Precalentar horno a 175°C y engrasar molde para pan',
                'Machacar plátanos hasta obtener puré con algunos trozos',
                'Mezclar mantequilla derretida con plátanos',
                'Agregar azúcar, huevo batido y vainilla',
                'Incorporar bicarbonato y sal',
                'Añadir harina gradualmente hasta apenas integrar',
                'Si se usan, agregar nueces picadas',
                'Verter en molde preparado',
                'Hornear 60-65 minutos hasta que palillo salga limpio',
                'Enfriar 10 minutos antes de desmoldar',
                'Servir tibio o a temperatura ambiente'
            ],
            imagen: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.4,
            resenas: 27
        });

        // ========== MÁS BEBIDAS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Café con Leche',
            pais: 'España',
            tiempo: 5,
            categorias: ['Bebida'],
            ingredientes: [
                { nombre: '1/2 taza de café espresso fuerte', icono: '☕' },
                { nombre: '1/2 taza de leche entera', icono: '🥛' },
                { nombre: '2 cucharaditas de azúcar (opcional)', icono: '🍯' },
                { nombre: 'Canela en polvo para espolvorear', icono: '🌶️' }
            ],
            instrucciones: [
                'Preparar café espresso fuerte y caliente',
                'Calentar leche en cazo sin que hierva',
                'Espumar leche con batidor o vaporizador',
                'Servir café en taza grande',
                'Agregar leche caliente espumada',
                'Endulzar con azúcar si se desea',
                'Espolvorear canela por encima',
                'Servir inmediatamente muy caliente'
            ],
            imagen: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop&crop=center&bg=white',
            calificacion: 4.1,
            resenas: 15
        });

        // ========== MÁS COMIDAS INTERNACIONALES ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Curry de Pollo Tailandés',
            pais: 'Tailandia',
            tiempo: 35,
            categorias: ['Tailandesa', 'Comida'],
            ingredientes: [
                { nombre: '600g de muslos de pollo sin hueso, en trozos', icono: '🍗' },
                { nombre: '400ml de leche de coco', icono: '🥥' },
                { nombre: '3 cucharadas de pasta de curry rojo', icono: '🌶️' },
                { nombre: '2 cucharadas de salsa de pescado', icono: '🐟' },
                { nombre: '2 cucharadas de azúcar de palma', icono: '🍯' },
                { nombre: '1 berenjena asiática en cubos', icono: '🍆' },
                { nombre: '100g de ejotes cortados', icono: '🫛' },
                { nombre: '4 hojas de albahaca tailandesa', icono: '🌿' },
                { nombre: '2 chiles rojos en rodajas', icono: '🌶️' },
                { nombre: '2 cucharadas de aceite vegetal', icono: '🫒' },
                { nombre: 'Arroz jasmín para acompañar', icono: '🍚' }
            ],
            instrucciones: [
                'Calentar aceite en wok o sartén grande a fuego medio-alto',
                'Freír pasta de curry 2 minutos hasta aromática',
                'Agregar 1/2 taza de leche de coco, mezclar bien',
                'Añadir pollo y cocinar hasta que cambie de color',
                'Incorporar resto de leche de coco, salsa de pescado y azúcar',
                'Llevar a ebullición, reducir fuego y cocinar 15 minutos',
                'Agregar berenjena y ejotes, cocinar 8 minutos más',
                'Añadir albahaca y chiles en los últimos 2 minutos',
                'Ajustar sazón con más salsa de pescado o azúcar',
                'Servir sobre arroz jasmín caliente'
            ],
            imagen: 'img/curry-pollo-tailandes.svg',
            calificacion: 4.6,
            resenas: 24
        });

        recipes.push({
            id: nextRecipeId++,
            nombre: 'Risotto de Hongos',
            pais: 'Italia',
            tiempo: 40,
            categorias: ['Italiana', 'Comida'],
            ingredientes: [
                { nombre: '300g de arroz arborio', icono: '🍚' },
                { nombre: '1 litro de caldo de pollo caliente', icono: '🍲' },
                { nombre: '300g de hongos mixtos (portobello, shiitake)', icono: '🍄' },
                { nombre: '1 cebolla mediana finamente picada', icono: '🧅' },
                { nombre: '3 dientes de ajo picados', icono: '🧄' },
                { nombre: '1/2 taza de vino blanco seco', icono: '🍷' },
                { nombre: '100g de queso parmesano rallado', icono: '🧀' },
                { nombre: '3 cucharadas de mantequilla', icono: '🧈' },
                { nombre: '2 cucharadas de aceite de oliva', icono: '🫒' },
                { nombre: '2 cucharadas de perejil fresco picado', icono: '🌿' },
                { nombre: 'Sal y pimienta negra al gusto', icono: '🧂' }
            ],
            instrucciones: [
                'Limpiar y cortar hongos en láminas gruesas',
                'Saltear hongos en aceite hasta dorar, reservar',
                'En la misma sartén, sofreír cebolla hasta transparente',
                'Agregar ajo y cocinar 1 minuto más',
                'Añadir arroz, tostar 2 minutos revolviendo',
                'Verter vino blanco, cocinar hasta evaporar',
                'Agregar caldo caliente de a poco, revolviendo constantemente',
                'Cocinar 18-20 minutos hasta que arroz esté cremoso',
                'Incorporar hongos, mantequilla y parmesano',
                'Sazonar y decorar con perejil antes de servir'
            ],
            imagen: 'img/risotto-hongos.svg',
            calificacion: 4.5,
            resenas: 19
        });

        recipes.push({
            id: nextRecipeId++,
            nombre: 'Ceviche Peruano',
            pais: 'Perú',
            tiempo: 25,
            categorias: ['Peruana', 'Comida'],
            ingredientes: [
                { nombre: '500g de pescado blanco fresco (corvina o lenguado)', icono: '🐟' },
                { nombre: '1 taza de jugo de limón fresco', icono: '🍋' },
                { nombre: '1 cebolla roja mediana en juliana fina', icono: '🧅' },
                { nombre: '2 ajíes amarillos sin venas, picados', icono: '🌶️' },
                { nombre: '2 dientes de ajo picados finamente', icono: '🧄' },
                { nombre: '1 trozo de jengibre de 2cm, rallado', icono: '🫚' },
                { nombre: '1 camote cocido en rodajas', icono: '🍠' },
                { nombre: '1 taza de maíz cancha tostado', icono: '🌽' },
                { nombre: '1/4 taza de cilantro picado', icono: '🌿' },
                { nombre: 'Sal y pimienta al gusto', icono: '🧂' },
                { nombre: 'Hojas de lechuga para servir', icono: '🥬' }
            ],
            instrucciones: [
                'Cortar pescado en cubos de 2cm, verificar que no tenga espinas',
                'Colocar pescado en bowl de vidrio o cerámica',
                'Agregar jugo de limón hasta cubrir completamente',
                'Añadir ají amarillo, ajo, jengibre y sal',
                'Mezclar suavemente y refrigerar 15 minutos',
                'El pescado debe verse opaco (cocido por el ácido)',
                'Agregar cebolla roja y mezclar delicadamente',
                'Ajustar sazón con sal y pimienta',
                'Servir inmediatamente sobre hojas de lechuga',
                'Acompañar con camote y maíz cancha, decorar con cilantro'
            ],
            imagen: 'img/ceviche-peruano.svg',
            calificacion: 4.7,
            resenas: 31
        });

        recipes.push({
            id: nextRecipeId++,
            nombre: 'Bibimbap Coreano',
            pais: 'Corea del Sur',
            tiempo: 45,
            categorias: ['Coreana', 'Comida'],
            ingredientes: [
                { nombre: '2 tazas de arroz blanco cocido', icono: '🍚' },
                { nombre: '200g de carne de res en tiras finas', icono: '🥩' },
                { nombre: '4 huevos', icono: '🥚' },
                { nombre: '100g de espinacas frescas', icono: '🥬' },
                { nombre: '1 zanahoria en juliana', icono: '🥕' },
                { nombre: '100g de brotes de soja', icono: '🌱' },
                { nombre: '100g de hongos shiitake', icono: '🍄' },
                { nombre: '3 cucharadas de aceite de sésamo', icono: '🫒' },
                { nombre: '3 cucharadas de salsa de soja', icono: '🥄' },
                { nombre: '2 cucharadas de pasta gochujang', icono: '🌶️' },
                { nombre: '2 dientes de ajo picados', icono: '🧄' },
                { nombre: '1 cucharada de semillas de sésamo', icono: '🌱' }
            ],
            instrucciones: [
                'Marinar carne con salsa de soja, ajo y aceite de sésamo',
                'Blanquear espinacas 1 minuto, escurrir y sazonar',
                'Saltear zanahoria, brotes de soja y hongos por separado',
                'Cocinar carne marinada hasta dorar',
                'Freír huevos estrellados con yemas líquidas',
                'Calentar arroz y dividir en 4 bowls',
                'Acomodar vegetales y carne sobre arroz en secciones',
                'Colocar huevo frito en el centro',
                'Servir con gochujang al lado',
                'Mezclar todo antes de comer, espolvorear sésamo'
            ],
            imagen: 'img/bibimbap-coreano.svg',
            calificacion: 4.4,
            resenas: 17
        });

        // ========== MÁS CENAS INTERNACIONALES ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Moussaka Griega',
            pais: 'Grecia',
            tiempo: 90,
            categorias: ['Griega', 'Cena'],
            ingredientes: [
                { nombre: '2 berenjenas grandes en rodajas de 1cm', icono: '🍆' },
                { nombre: '500g de carne molida de cordero', icono: '🥩' },
                { nombre: '1 cebolla grande picada', icono: '🧅' },
                { nombre: '3 dientes de ajo picados', icono: '🧄' },
                { nombre: '400g de tomates triturados', icono: '🍅' },
                { nombre: '1/2 taza de vino tinto', icono: '🍷' },
                { nombre: '1 cucharadita de canela molida', icono: '🌶️' },
                { nombre: '1/2 taza de aceite de oliva', icono: '🫒' },
                { nombre: 'Para la bechamel:', icono: '🥛' },
                { nombre: '4 cucharadas de mantequilla', icono: '🧈' },
                { nombre: '4 cucharadas de harina', icono: '🌾' },
                { nombre: '2 tazas de leche caliente', icono: '🥛' },
                { nombre: '100g de queso kefalotyri rallado', icono: '🧀' }
            ],
            instrucciones: [
                'Salar berenjenas y dejar escurrir 30 minutos',
                'Secar y freír berenjenas en aceite hasta dorar',
                'Sofreír cebolla y ajo hasta transparentes',
                'Agregar carne y cocinar hasta dorar',
                'Añadir tomates, vino y canela, cocinar 20 minutos',
                'Para bechamel: derretir mantequilla, agregar harina',
                'Incorporar leche gradualmente batiendo',
                'Cocinar hasta espesar, agregar queso',
                'En fuente, alternar capas: berenjena, carne, bechamel',
                'Hornear a 180°C por 45 minutos hasta dorar',
                'Dejar reposar 15 minutos antes de cortar'
            ],
            imagen: 'img/moussaka-griega.svg',
            calificacion: 4.6,
            resenas: 22
        });

        recipes.push({
            id: nextRecipeId++,
            nombre: 'Coq au Vin Francés',
            pais: 'Francia',
            tiempo: 120,
            categorias: ['Francesa', 'Cena'],
            ingredientes: [
                { nombre: '1 pollo entero cortado en presas', icono: '🍗' },
                { nombre: '750ml de vino tinto Burgundy', icono: '🍷' },
                { nombre: '200g de tocino en cubitos', icono: '🥓' },
                { nombre: '12 cebollitas perla', icono: '🧅' },
                { nombre: '250g de hongos botón', icono: '🍄' },
                { nombre: '3 dientes de ajo picados', icono: '🧄' },
                { nombre: '2 cucharadas de harina', icono: '🌾' },
                { nombre: '2 cucharadas de mantequilla', icono: '🧈' },
                { nombre: '2 hojas de laurel', icono: '🌿' },
                { nombre: '3 ramitas de tomillo fresco', icono: '🌿' },
                { nombre: '2 cucharadas de perejil picado', icono: '🌿' },
                { nombre: 'Sal y pimienta al gusto', icono: '🧂' }
            ],
            instrucciones: [
                'Marinar pollo en vino tinto 2 horas o toda la noche',
                'Escurrir pollo, reservar vino de marinado',
                'Freír tocino hasta crujiente, reservar grasa',
                'Dorar presas de pollo en grasa de tocino',
                'Retirar pollo, sofreír cebollitas y hongos',
                'Agregar ajo y harina, cocinar 2 minutos',
                'Verter vino de marinado gradualmente',
                'Regresar pollo, agregar hierbas',
                'Cocinar tapado 1 hora a fuego lento',
                'Incorporar tocino en últimos 10 minutos',
                'Servir decorado with perejil fresco'
            ],
            imagen: 'img/coq-au-vin.svg',
            calificacion: 4.7,
            resenas: 18
        });

        // ========== MÁS POSTRES INTERNACIONALES ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Crème Brûlée',
            pais: 'Francia',
            tiempo: 240,
            categorias: ['Francesa', 'Postre'],
            ingredientes: [
                { nombre: '2 tazas de crema para batir', icono: '🥛' },
                { nombre: '6 yemas de huevo grandes', icono: '🥚' },
                { nombre: '1/3 taza de azúcar granulada', icono: '🍯' },
                { nombre: '1 cucharadita de extracto de vainilla', icono: '🌿' },
                { nombre: '6 cucharadas de azúcar para caramelizar', icono: '🍯' },
                { nombre: 'Una pizca de sal', icono: '🧂' }
            ],
            instrucciones: [
                'Precalentar horno a 160°C',
                'Calentar crema en cazo hasta que humee (no hervir)',
                'Batir yemas con azúcar hasta que estén pálidas',
                'Agregar vainilla y sal a las yemas',
                'Verter crema caliente lentamente sobre yemas batiendo',
                'Colar mezcla para eliminar grumos',
                'Dividir en 6 ramekins',
                'Hornear en baño maría 35-40 minutos hasta cuajar',
                'Refrigerar mínimo 3 horas',
                'Antes de servir, espolvorear azúcar y caramelizar con soplete',
                'Servir inmediatamente después de caramelizar'
            ],
            imagen: 'img/creme-brulee.svg',
            calificacion: 4.8,
            resenas: 26
        });

        recipes.push({
            id: nextRecipeId++,
            nombre: 'Tres Leches',
            pais: 'Nicaragua',
            tiempo: 180,
            categorias: ['Nicaragüense', 'Postre'],
            ingredientes: [
                { nombre: '1 taza de harina para todo uso', icono: '🌾' },
                { nombre: '1 1/2 cucharaditas de polvo de hornear', icono: '🥄' },
                { nombre: '5 huevos separados', icono: '🥚' },
                { nombre: '1 taza de azúcar', icono: '🍯' },
                { nombre: '1/3 taza de leche entera', icono: '🥛' },
                { nombre: '1 cucharadita de extracto de vainilla', icono: '🌿' },
                { nombre: 'Para la mezcla de leches:', icono: '🥛' },
                { nombre: '1 lata de leche evaporada', icono: '🥛' },
                { nombre: '1 lata de leche condensada', icono: '🥛' },
                { nombre: '1/2 taza de crema para batir', icono: '🥛' },
                { nombre: 'Para el merengue:', icono: '🥚' },
                { nombre: '3 claras de huevo', icono: '🥚' },
                { nombre: '3 cucharadas de azúcar', icono: '🍯' }
            ],
            instrucciones: [
                'Precalentar horno a 180°C, engrasar molde rectangular',
                'Mezclar harina y polvo de hornear',
                'Batir yemas con 3/4 taza de azúcar hasta cremosas',
                'Agregar leche y vainilla a las yemas',
                'Incorporar harina gradualmente',
                'Batir claras a punto de nieve, agregar azúcar restante',
                'Incorporar claras a la mezcla con movimientos envolventes',
                'Hornear 25-30 minutos hasta dorar',
                'Mezclar las tres leches, verter sobre pastel tibio',
                'Refrigerar 3 horas para que absorba',
                'Cubrir con merengue antes de servir'
            ],
            imagen: 'img/tres-leches.svg',
            calificacion: 4.6,
            resenas: 29
        });

        recipes.push({
            id: nextRecipeId++,
            nombre: 'Baklava Turca',
            pais: 'Turquía',
            tiempo: 90,
            categorias: ['Turca', 'Postre'],
            ingredientes: [
                { nombre: '1 paquete de masa filo (450g)', icono: '🥟' },
                { nombre: '200g de mantequilla derretida', icono: '🧈' },
                { nombre: '300g de nueces picadas', icono: '🥜' },
                { nombre: '100g de pistachos picados', icono: '🥜' },
                { nombre: '2 cucharaditas de canela molida', icono: '🌶️' },
                { nombre: 'Para el almíbar:', icono: '🍯' },
                { nombre: '1 taza de azúcar', icono: '🍯' },
                { nombre: '1 taza de agua', icono: '💧' },
                { nombre: '1/2 taza de miel', icono: '🍯' },
                { nombre: '1 cucharada de jugo de limón', icono: '🍋' },
                { nombre: '1 rama de canela', icono: '🌶️' }
            ],
            instrucciones: [
                'Precalentar horno a 180°C, engrasar molde rectangular',
                'Mezclar nueces, pistachos y canela molida',
                'Colocar 8 hojas de filo, pincelando cada una con mantequilla',
                'Esparcir 1/3 de la mezcla de nueces',
                'Repetir capas: 4 hojas filo, nueces, hasta terminar',
                'Finalizar con 8 hojas de filo encima',
                'Cortar en rombos antes de hornear',
                'Hornear 45-50 minutos hasta dorar',
                'Para almíbar: hervir todos los ingredientes 10 minutos',
                'Verter almíbar caliente sobre baklava caliente',
                'Dejar enfriar completamente antes de servir'
            ],
            imagen: 'img/baklava-turca.svg',
            calificacion: 4.5,
            resenas: 21
        });

        // ========== MÁS BEBIDAS INTERNACIONALES ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Sangría Española',
            pais: 'España',
            tiempo: 15,
            categorias: ['Española', 'Bebida'],
            ingredientes: [
                { nombre: '1 botella de vino tinto español (750ml)', icono: '🍷' },
                { nombre: '1/4 taza de brandy español', icono: '🥃' },
                { nombre: '2 cucharadas de azúcar', icono: '🍯' },
                { nombre: '1 naranja en rodajas', icono: '🍊' },
                { nombre: '1 limón en rodajas', icono: '🍋' },
                { nombre: '1 manzana en cubitos', icono: '🍎' },
                { nombre: '1 taza de agua con gas', icono: '💧' },
                { nombre: '2 tazas de hielo', icono: '🧊' },
                { nombre: 'Hojas de menta para decorar', icono: '🌿' }
            ],
            instrucciones: [
                'En jarra grande, mezclar vino tinto con brandy',
                'Agregar azúcar y revolver hasta disolver',
                'Añadir todas las frutas cortadas',
                'Refrigerar mínimo 2 horas para que se maceren',
                'Al servir, agregar agua con gas',
                'Llenar copas con hielo',
                'Servir sangría asegurándose de incluir frutas',
                'Decorar con hojas de menta fresca'
            ],
            imagen: 'img/sangria-espanola.svg',
            calificacion: 4.3,
            resenas: 25
        });

        recipes.push({
            id: nextRecipeId++,
            nombre: 'Lassi de Mango',
            pais: 'India',
            tiempo: 10,
            categorias: ['India', 'Bebida'],
            ingredientes: [
                { nombre: '2 mangos maduros pelados y cortados', icono: '🥭' },
                { nombre: '1 taza de yogurt natural', icono: '🥛' },
                { nombre: '1/2 taza de leche fría', icono: '🥛' },
                { nombre: '3 cucharadas de azúcar', icono: '🍯' },
                { nombre: '1/4 cucharadita de cardamomo molido', icono: '🌶️' },
                { nombre: '1 taza de hielo picado', icono: '🧊' },
                { nombre: 'Pistachos picados para decorar', icono: '🥜' }
            ],
            instrucciones: [
                'Colocar mango cortado en licuadora',
                'Agregar yogurt, leche y azúcar',
                'Añadir cardamomo molido',
                'Licuar hasta obtener mezcla suave',
                'Agregar hielo y licuar nuevamente',
                'Probar y ajustar dulzor si es necesario',
                'Servir en vasos altos',
                'Decorar con pistachos picados'
            ],
            imagen: 'img/lassi-mango.svg',
            calificacion: 4.4,
            resenas: 16
        });

        // ========== MÁS BOTANAS Y ENTRADAS ==========
        recipes.push({
            id: nextRecipeId++,
            nombre: 'Bruschetta Italiana',
            pais: 'Italia',
            tiempo: 20,
            categorias: ['Italiana', 'Botana'],
            ingredientes: [
                { nombre: '1 baguette cortada en rebanadas de 2cm', icono: '🥖' },
                { nombre: '4 tomates roma maduros, sin semillas', icono: '🍅' },
                { nombre: '3 dientes de ajo', icono: '🧄' },
                { nombre: '1/4 taza de albahaca fresca picada', icono: '🌿' },
                { nombre: '3 cucharadas de aceite de oliva extra virgen', icono: '🫒' },
                { nombre: '2 cucharadas de vinagre balsámico', icono: '🥄' },
                { nombre: '100g de queso mozzarella fresco', icono: '🧀' },
                { nombre: 'Sal marina y pimienta negra', icono: '🧂' }
            ],
            instrucciones: [
                'Precalentar horno a 200°C',
                'Tostar rebanadas de pan hasta dorar ligeramente',
                'Frotar cada rebanada con 1 diente de ajo',
                'Cortar tomates en cubitos pequeños',
                'Picar finamente los 2 dientes de ajo restantes',
                'Mezclar tomates, ajo, albahaca, aceite y vinagre',
                'Sazonar con sal y pimienta, dejar reposar 10 minutos',
                'Colocar mezcla de tomate sobre cada tostada',
                'Agregar trozos de mozzarella fresca',
                'Servir inmediatamente'
            ],
            imagen: 'img/bruschetta-italiana.svg',
            calificacion: 4.3,
            resenas: 20
        });

        recipes.push({
            id: nextRecipeId++,
            nombre: 'Samosas Indias',
            pais: 'India',
            tiempo: 60,
            categorias: ['India', 'Botana'],
            ingredientes: [
                { nombre: '2 tazas de harina para todo uso', icono: '🌾' },
                { nombre: '4 cucharadas de aceite vegetal', icono: '🫒' },
                { nombre: '1/2 cucharadita de sal', icono: '🧂' },
                { nombre: 'Agua según necesidad', icono: '💧' },
                { nombre: 'Para el relleno:', icono: '🥔' },
                { nombre: '3 papas medianas cocidas y en cubitos', icono: '🥔' },
                { nombre: '1 taza de chícharos cocidos', icono: '🟢' },
                { nombre: '1 cebolla picada finamente', icono: '🧅' },
                { nombre: '2 cucharaditas de semillas de comino', icono: '🌶️' },
                { nombre: '1 cucharadita de cúrcuma', icono: '🌶️' },
                { nombre: '1 cucharadita de garam masala', icono: '🌶️' },
                { nombre: 'Aceite para freír', icono: '🫒' }
            ],
            instrucciones: [
                'Mezclar harina, aceite y sal, agregar agua para formar masa',
                'Amasar hasta suave, dejar reposar 30 minutos',
                'Para relleno: sofreír cebolla hasta dorar',
                'Agregar especias y cocinar 1 minuto',
                'Incorporar papas y chícharos, sazonar',
                'Dividir masa en porciones, estirar en círculos',
                'Cortar círculos por la mitad',
                'Formar conos, rellenar y sellar bordes',
                'Freír en aceite caliente hasta dorar',
                'Servir calientes con chutney'
            ],
            imagen: 'img/samosas-indias.svg',
            calificacion: 4.4,
            resenas: 18
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