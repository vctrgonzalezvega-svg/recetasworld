const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

console.log('Starting RecetasWorld server...');

// Complete recipe database integrated directly
const recipesDatabase = [
    {
        id: 1,
        nombre: "Pancakes americanos",
        pais: "Estados Unidos",
        imagen: "🥞",
        tiempo: 30,
        categorias: ["desayunos", "rapidas", "baratas"],
        ingredientes: [
            { nombre: "Harina de trigo", cantidad: "200g", icono: "🌾" },
            { nombre: "Azúcar", cantidad: "30g", icono: "🍬" },
            { nombre: "Polvo para hornear", cantidad: "10g", icono: "⚪" },
            { nombre: "Sal", cantidad: "2g", icono: "🧂" },
            { nombre: "Leche", cantidad: "240ml", icono: "🥛" },
            { nombre: "Huevo", cantidad: "1", icono: "🥚" },
            { nombre: "Aceite vegetal", cantidad: "30ml", icono: "🛢️" },
            { nombre: "Vainilla", cantidad: "5ml", icono: "🌸" },
            { nombre: "Mantequilla", cantidad: "10g", icono: "🧈" }
        ],
        instrucciones: [
            "Mezcla los ingredientes secos: harina, azúcar, polvo para hornear y sal",
            "En otro recipiente, bate los ingredientes líquidos: leche, huevo, aceite y vainilla",
            "Vierte la mezcla líquida en los secos y mezcla suavemente",
            "Deja reposar 5 minutos",
            "Calienta una sartén a fuego medio con mantequilla",
            "Vierte 1/4 de taza de mezcla por pancake",
            "Cocina 2-3 minutos hasta que aparezcan burbujas, luego voltea",
            "Cocina 1-2 minutos más del otro lado",
            "Sirve con miel de maple, mantequilla y fruta fresca"
        ],
        calificacion: 4.8,
        resenas: 125
    },
    {
        id: 2,
        nombre: "Tacos al Pastor",
        pais: "México",
        imagen: "🌮",
        tiempo: 35,
        categorias: ["comidas", "rapidas", "baratas"],
        ingredientes: [
            { nombre: "Carne de cerdo", cantidad: "600g", icono: "🥩" },
            { nombre: "Piña", cantidad: "½ pieza", icono: "🍍" },
            { nombre: "Cebolla", cantidad: "3 piezas", icono: "🧅" },
            { nombre: "Cilantro", cantidad: "al gusto", icono: "🌿" },
            { nombre: "Limón", cantidad: "2", icono: "🍋" },
            { nombre: "Tortillas de maíz", cantidad: "12", icono: "🌮" },
            { nombre: "Achiote", cantidad: "3 cucharadas", icono: "🌶️" }
        ],
        instrucciones: [
            "Marina la carne en achiote, vinagre, sal y especias",
            "Cocina la carne marinada en una sartén caliente",
            "Coloca piña en los últimos minutos de cocción",
            "Calienta las tortillas",
            "Coloca la carne en las tortillas",
            "Decora con cebolla picada, cilantro y limón"
        ],
        calificacion: 4.8,
        resenas: 289
    },
    {
        id: 3,
        nombre: "Spaghetti Carbonara",
        pais: "Italia",
        imagen: "🍝",
        tiempo: 20,
        categorias: ["comidas", "rapidas"],
        ingredientes: [
            { nombre: "Espagueti", cantidad: "400g", icono: "🍝" },
            { nombre: "Guanciale o Panceta", cantidad: "150g", icono: "🥓" },
            { nombre: "Huevo", cantidad: "4", icono: "🥚" },
            { nombre: "Queso Pecorino", cantidad: "100g", icono: "🧀" },
            { nombre: "Pimienta negra", cantidad: "al gusto", icono: "⚫" },
            { nombre: "Sal", cantidad: "al gusto", icono: "🧂" }
        ],
        instrucciones: [
            "Cocina el espagueti según las instrucciones",
            "Fríe el guanciale hasta que esté crujiente",
            "Bate los huevos con queso y pimienta",
            "Escurre la pasta dejando agua de cocción",
            "Mezcla pasta caliente con el guanciale",
            "Retira del fuego y agrega la mezcla de huevo",
            "Revuelve constantemente para crear salsa cremosa"
        ],
        calificacion: 4.7,
        resenas: 234
    }
];

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

    // Serve static files
    if (method === 'GET' && !pathname.startsWith('/api/')) {
        let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
        
        // Security check
        if (!filePath.startsWith(__dirname)) {
            sendResponse(res, 403, { error: 'Forbidden' });
            return;
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath);
            const contentTypes = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml'
            };
            
            const contentType = contentTypes[ext] || 'text/plain';
            const content = fs.readFileSync(filePath);
            sendResponse(res, 200, content, contentType);
        } else {
            sendResponse(res, 404, { error: 'File not found' });
        }
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
                    const recipe = {
                        id: nextRecipeId++,
                        ...data,
                        calificacion: data.calificacion || 0,
                        resenas: data.resenas || 0
                    };
                    recipes.unshift(recipe);
                    saveRecipes();
                    sendResponse(res, 201, { ok: true, receta: recipe });
                } catch (err) {
                    console.error('Error creating recipe:', err);
                    sendResponse(res, 400, { ok: false, error: 'Invalid JSON' });
                }
            });
            return;
        }
    }

    // 404 for unmatched routes
    sendResponse(res, 404, { error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ RecetasWorld server running on port ${PORT}`);
    console.log(`🌐 Frontend available at: http://localhost:${PORT}`);
    console.log(`🔗 API available at: http://localhost:${PORT}/api/`);
    console.log(`📁 Working directory: ${__dirname}`);
    
    // Load existing data
    loadData();
    
    // If no data exists, add complete recipe database
    if (recipes.length === 0) {
        console.log('📝 Loading complete recipe database...');
        
        // Use the complete recipe database integrated above
        recipes = [...recipesDatabase];
        
        // Update nextRecipeId
        if (recipes.length > 0) {
            nextRecipeId = Math.max(...recipes.map(r => r.id || 0)) + 1;
        }
        
        console.log(`✅ Loaded ${recipes.length} recipes from complete database`);
        
        // Save to file for persistence
        saveRecipes();
    }
});