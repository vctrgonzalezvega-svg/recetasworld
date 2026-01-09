const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('Starting RecetasWorld server...');
console.log(`🌍 Environment: ${NODE_ENV}`);
console.log(`📁 Working directory: ${__dirname}`);

// Load complete recipe database from external file
let recipesDatabase = [];

// Function to load recipes from js/recipes-data.js
function loadRecipesDatabase() {
    try {
        // Try to load from recipes-data.json first
        if (fs.existsSync(path.join(__dirname, 'recipes-data.json'))) {
            const jsonData = fs.readFileSync(path.join(__dirname, 'recipes-data.json'), 'utf8');
            recipesDatabase = JSON.parse(jsonData);
            console.log(`📚 Loaded ${recipesDatabase.length} recipes from recipes-data.json`);
            return recipesDatabase;
        }
        
        // Fallback: try to load from js/recipes-data.js by reading and parsing
        if (fs.existsSync(path.join(__dirname, 'js/recipes-data.js'))) {
            const jsContent = fs.readFileSync(path.join(__dirname, 'js/recipes-data.js'), 'utf8');
            
            // Extract the recipesDatabase array from the JS file
            const match = jsContent.match(/const recipesDatabase = (\[[\s\S]*?\]);/);
            if (match) {
                // Use eval to parse the array (safe in this controlled environment)
                recipesDatabase = eval(match[1]);
                console.log(`📚 Loaded ${recipesDatabase.length} recipes from js/recipes-data.js`);
                return recipesDatabase;
            }
        }
        
        // If no external files found, use minimal fallback
        console.log('⚠️ No recipe database files found, using minimal fallback');
        recipesDatabase = [
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
                    { nombre: "Leche", cantidad: "240ml", icono: "🥛" },
                    { nombre: "Huevo", cantidad: "1", icono: "🥚" }
                ],
                instrucciones: [
                    "Mezcla los ingredientes secos",
                    "Añade los líquidos",
                    "Cocina en sartén caliente"
                ],
                calificacion: 4.8,
                resenas: 125
            }
        ];
        
    } catch (error) {
        console.error('❌ Error loading recipes database:', error);
        recipesDatabase = [];
    }
    
    return recipesDatabase;
}

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
        
        // Log for debugging in production
        if (NODE_ENV === 'production') {
            console.log(`📁 Static request: ${pathname} -> ${filePath}`);
        }
        
        // Security check
        if (!filePath.startsWith(__dirname)) {
            console.log(`❌ Security check failed: ${filePath}`);
            sendResponse(res, 403, { error: 'Forbidden' });
            return;
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath);
            const contentTypes = {
                '.html': 'text/html; charset=utf-8',
                '.js': 'application/javascript; charset=utf-8',
                '.css': 'text/css; charset=utf-8',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.ico': 'image/x-icon',
                '.woff': 'font/woff',
                '.woff2': 'font/woff2',
                '.ttf': 'font/ttf',
                '.eot': 'application/vnd.ms-fontobject'
            };
            
            const contentType = contentTypes[ext] || 'text/plain';
            
            try {
                const content = fs.readFileSync(filePath);
                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': NODE_ENV === 'production' ? 'public, max-age=86400' : 'no-cache'
                });
                res.end(content);
                
                if (NODE_ENV === 'production') {
                    console.log(`✅ Served: ${pathname} (${contentType})`);
                }
            } catch (err) {
                console.error('❌ Error reading file:', err);
                sendResponse(res, 500, { error: 'Internal server error' });
            }
        } else {
            console.log(`❌ File not found: ${filePath}`);
            console.log(`📁 Directory contents:`, fs.readdirSync(__dirname).slice(0, 10));
            sendResponse(res, 404, { error: 'File not found' });
        }
        return;
    }

    // API Routes
    if (pathname.startsWith('/api/')) {
        if (pathname === '/api/recipes' && method === 'GET') {
            console.log(`📊 API: Serving ${recipes.length} recipes`);
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
                    console.log(`📝 API: Created recipe "${recipe.nombre}" (ID: ${recipe.id})`);
                    sendResponse(res, 201, { ok: true, receta: recipe });
                } catch (err) {
                    console.error('❌ API Error creating recipe:', err);
                    sendResponse(res, 400, { ok: false, error: 'Invalid JSON' });
                }
            });
            return;
        }
        
        // Health check endpoint for Render
        if (pathname === '/api/health' && method === 'GET') {
            sendResponse(res, 200, { 
                status: 'ok', 
                recipes: recipes.length,
                environment: NODE_ENV,
                timestamp: new Date().toISOString()
            });
            return;
        }
    }

    // 404 for unmatched routes
    sendResponse(res, 404, { error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ RecetasWorld server running on port ${PORT}`);
    console.log(`🌐 Environment: ${NODE_ENV}`);
    
    if (NODE_ENV === 'production') {
        console.log(`🚀 Production server ready`);
        console.log(`📁 Serving static files from: ${__dirname}`);
    } else {
        console.log(`🔧 Development server ready`);
        console.log(`🌐 Frontend available at: http://localhost:${PORT}`);
        console.log(`�d API available at: http://localhost:${PORT}/api/`);
    }
    
    console.log(`📁 Working directory: ${__dirname}`);
    
    // Load existing data
    loadData();
    
    // Load complete recipe database
    console.log('📝 Loading complete recipe database...');
    const completeDatabase = loadRecipesDatabase();
    
    // If no data exists in persistent storage, use complete database
    if (recipes.length === 0 && completeDatabase.length > 0) {
        recipes = [...completeDatabase];
        
        // Update nextRecipeId
        if (recipes.length > 0) {
            nextRecipeId = Math.max(...recipes.map(r => r.id || 0)) + 1;
        }
        
        console.log(`✅ Loaded ${recipes.length} recipes from complete database`);
        
        // Save to file for persistence
        saveRecipes();
    } else if (recipes.length > 0) {
        console.log(`✅ Using ${recipes.length} existing recipes from persistent storage`);
    } else {
        console.log('⚠️ No recipes available - check recipe database files');
    }
    
    // List available files for debugging in production
    if (NODE_ENV === 'production') {
        console.log('📂 Available files:');
        try {
            const files = fs.readdirSync(__dirname);
            files.forEach(file => {
                const stat = fs.statSync(path.join(__dirname, file));
                console.log(`  ${stat.isDirectory() ? '📁' : '📄'} ${file}`);
            });
        } catch (err) {
            console.error('❌ Error listing files:', err);
        }
    }
});