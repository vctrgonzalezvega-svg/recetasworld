const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🚀 Starting RecetasWorld server...');
console.log(`🌍 Environment: ${NODE_ENV}`);
console.log(`📁 Working directory: ${__dirname}`);

// Simple recipe database
let recipes = [];

// Load recipes from JSON file
function loadRecipes() {
    try {
        const recipesPath = path.join(__dirname, 'recipes-data.json');
        if (fs.existsSync(recipesPath)) {
            const data = fs.readFileSync(recipesPath, 'utf8');
            recipes = JSON.parse(data);
            console.log(`✅ Loaded ${recipes.length} recipes from JSON`);
        } else {
            // Fallback recipes
            recipes = [
                {
                    id: 1,
                    nombre: "Pancakes americanos",
                    pais: "Estados Unidos",
                    imagen: "🥞",
                    tiempo: 30,
                    categorias: ["desayunos", "rapidas", "baratas"],
                    ingredientes: [
                        { nombre: "Harina", cantidad: "200g", icono: "🌾" },
                        { nombre: "Leche", cantidad: "240ml", icono: "🥛" },
                        { nombre: "Huevo", cantidad: "1", icono: "🥚" }
                    ],
                    instrucciones: [
                        "Mezcla los ingredientes",
                        "Cocina en sartén caliente",
                        "Sirve con miel"
                    ],
                    calificacion: 4.8,
                    resenas: 125
                }
            ];
            console.log(`⚠️ Using fallback recipes: ${recipes.length}`);
        }
    } catch (err) {
        console.error('❌ Error loading recipes:', err.message);
        recipes = [];
    }
}

// Simple response helper
function sendResponse(res, statusCode, data, contentType = 'application/json') {
    res.writeHead(statusCode, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    
    if (contentType === 'application/json') {
        res.end(JSON.stringify(data));
    } else {
        res.end(data);
    }
}

// Create server
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

    // API Routes
    if (pathname.startsWith('/api/')) {
        if (pathname === '/api/recipes' && method === 'GET') {
            sendResponse(res, 200, { recetas: recipes });
            return;
        }
        
        if (pathname === '/api/health' && method === 'GET') {
            sendResponse(res, 200, { 
                status: 'ok', 
                recipes: recipes.length,
                environment: NODE_ENV,
                timestamp: new Date().toISOString()
            });
            return;
        }
        
        if (pathname === '/api/debug' && method === 'GET') {
            try {
                const debugInfo = {
                    workingDirectory: __dirname,
                    environment: NODE_ENV,
                    recipes: recipes.length,
                    files: fs.readdirSync(__dirname),
                    cssExists: fs.existsSync(path.join(__dirname, 'css', 'styles.css')),
                    jsExists: fs.existsSync(path.join(__dirname, 'js', 'app.js'))
                };
                sendResponse(res, 200, debugInfo);
            } catch (err) {
                sendResponse(res, 500, { error: err.message });
            }
            return;
        }
        
        sendResponse(res, 404, { error: 'API endpoint not found' });
        return;
    }

    // Static files
    if (method === 'GET') {
        let filePath;
        
        if (pathname === '/') {
            filePath = path.join(__dirname, 'index.html');
        } else {
            // Remove leading slash
            const relativePath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
            filePath = path.join(__dirname, relativePath);
        }
        
        // Security check
        if (!filePath.startsWith(__dirname)) {
            sendResponse(res, 403, { error: 'Forbidden' });
            return;
        }

        // Serve file if it exists
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            try {
                const ext = path.extname(filePath).toLowerCase();
                const contentTypes = {
                    '.html': 'text/html; charset=utf-8',
                    '.css': 'text/css; charset=utf-8',
                    '.js': 'application/javascript; charset=utf-8',
                    '.json': 'application/json',
                    '.svg': 'image/svg+xml',
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg'
                };
                
                const contentType = contentTypes[ext] || 'text/plain';
                const content = fs.readFileSync(filePath);
                
                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=3600'
                });
                res.end(content);
                
                console.log(`✅ Served: ${pathname} (${contentType})`);
                return;
            } catch (err) {
                console.error('❌ Error serving file:', err.message);
                sendResponse(res, 500, { error: 'Internal server error' });
                return;
            }
        }
        
        console.log(`❌ File not found: ${pathname}`);
        sendResponse(res, 404, { error: 'File not found' });
        return;
    }

    // Default 404
    sendResponse(res, 404, { error: 'Not found' });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${NODE_ENV}`);
    
    // Load recipes
    loadRecipes();
    
    // List files in production
    if (NODE_ENV === 'production') {
        console.log('📂 Available files:');
        try {
            const files = fs.readdirSync(__dirname);
            files.forEach(file => {
                const stat = fs.statSync(path.join(__dirname, file));
                console.log(`  ${stat.isDirectory() ? '📁' : '📄'} ${file}`);
            });
        } catch (err) {
            console.error('❌ Error listing files:', err.message);
        }
    }
});

// Handle errors
server.on('error', (err) => {
    console.error('❌ Server error:', err);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});