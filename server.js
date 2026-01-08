const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Simple configuration for Railway
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log(`🚀 Starting RecetasWorld server on port ${PORT}`);
console.log(`🌐 Environment: ${NODE_ENV}`);

const ROOT = path.resolve(__dirname);

// Use JSON file instead of SQLite for Railway compatibility
const DATA_DIR = path.join(ROOT, 'data');
const RECIPES_FILE = path.join(DATA_DIR, 'recipes.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files
function initializeData() {
    if (!fs.existsSync(RECIPES_FILE)) {
        fs.writeFileSync(RECIPES_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
}

initializeData();

// Helper functions
function loadRecipes() {
    try {
        const data = fs.readFileSync(RECIPES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error loading recipes:', err);
        return [];
    }
}

function saveRecipes(recipes) {
    try {
        fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2));
        return true;
    } catch (err) {
        console.error('Error saving recipes:', err);
        return false;
    }
}

function loadUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error loading users:', err);
        return [];
    }
}

function saveUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        return true;
    } catch (err) {
        console.error('Error saving users:', err);
        return false;
    }
}

function sendJSON(res, status, obj) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(obj));
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    const parsed = url.parse(req.url, true);
    const pathname = parsed.pathname;

    console.log(`${req.method} ${pathname}`);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    // Health check endpoints
    if (pathname === '/health' || pathname === '/api/health' || pathname === '/') {
        if (pathname === '/') {
            // Serve index.html for root path
            const indexPath = path.join(ROOT, 'index.html');
            if (fs.existsSync(indexPath)) {
                const content = fs.readFileSync(indexPath);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
                return;
            }
        }
        
        return sendJSON(res, 200, { 
            status: 'ok', 
            message: 'RecetasWorld server is running',
            timestamp: new Date().toISOString(),
            port: PORT,
            environment: NODE_ENV
        });
    }

    // API routes
    if (pathname && pathname.startsWith('/api/')) {
        try {
            // GET recipes
            if (req.method === 'GET' && pathname === '/api/recipes') {
                const recipes = loadRecipes();
                return sendJSON(res, 200, { recetas: recipes });
            }

            // POST create recipe
            if (req.method === 'POST' && pathname === '/api/recipes') {
                const body = await readRequestBody(req);
                let payload;
                
                try {
                    payload = JSON.parse(body || '{}');
                } catch (parseErr) {
                    return sendJSON(res, 400, { ok: false, error: 'Invalid JSON' });
                }

                if (!payload.nombre || payload.nombre.trim() === '') {
                    return sendJSON(res, 400, { ok: false, error: 'Recipe name required' });
                }

                // Handle image upload
                if (payload.imageBase64) {
                    try {
                        const matches = payload.imageBase64.match(/^data:(image\/(png|jpeg|jpg|gif|webp));base64,(.+)$/);
                        if (matches) {
                            const ext = matches[2] === 'jpeg' ? 'jpg' : matches[2];
                            const base64 = matches[3];
                            const uploadsDir = path.join(ROOT, 'img', 'uploads');
                            
                            if (!fs.existsSync(uploadsDir)) {
                                fs.mkdirSync(uploadsDir, { recursive: true });
                            }
                            
                            const filename = `recipe-${Date.now()}.${ext}`;
                            const filepath = path.join(uploadsDir, filename);
                            fs.writeFileSync(filepath, Buffer.from(base64, 'base64'));
                            payload.imagen = `img/uploads/${filename}`;
                        }
                    } catch (imgErr) {
                        console.error('Image processing error:', imgErr);
                    }
                }

                const recipes = loadRecipes();
                const newId = recipes.length > 0 ? Math.max(...recipes.map(r => r.id || 0)) + 1 : 1;
                
                const newRecipe = {
                    id: newId,
                    nombre: payload.nombre.trim(),
                    pais: (payload.pais || '').trim(),
                    tiempo: parseInt(payload.tiempo) || 0,
                    categorias: payload.categorias || [],
                    ingredientes: payload.ingredientes || [],
                    instrucciones: payload.instrucciones || [],
                    imagen: payload.imagen || '',
                    calificacion: 0,
                    resenas: 0
                };

                recipes.unshift(newRecipe);
                
                if (saveRecipes(recipes)) {
                    return sendJSON(res, 201, { ok: true, receta: newRecipe });
                } else {
                    return sendJSON(res, 500, { ok: false, error: 'Failed to save recipe' });
                }
            }

            // PUT update recipe
            if (req.method === 'PUT' && pathname === '/api/recipes') {
                const id = parseInt(parsed.query.id, 10);
                if (!id) return sendJSON(res, 400, { ok: false, error: 'ID required' });
                
                const body = await readRequestBody(req);
                let payload;
                
                try {
                    payload = JSON.parse(body || '{}');
                } catch (parseErr) {
                    return sendJSON(res, 400, { ok: false, error: 'Invalid JSON' });
                }

                // Handle image upload
                if (payload.imageBase64) {
                    try {
                        const matches = payload.imageBase64.match(/^data:(image\/(png|jpeg|jpg|gif|webp));base64,(.+)$/);
                        if (matches) {
                            const ext = matches[2] === 'jpeg' ? 'jpg' : matches[2];
                            const base64 = matches[3];
                            const uploadsDir = path.join(ROOT, 'img', 'uploads');
                            
                            if (!fs.existsSync(uploadsDir)) {
                                fs.mkdirSync(uploadsDir, { recursive: true });
                            }
                            
                            const filename = `recipe-${id}-${Date.now()}.${ext}`;
                            const filepath = path.join(uploadsDir, filename);
                            fs.writeFileSync(filepath, Buffer.from(base64, 'base64'));
                            payload.imagen = `img/uploads/${filename}`;
                        }
                    } catch (imgErr) {
                        console.error('Image processing error:', imgErr);
                    }
                }

                const recipes = loadRecipes();
                const recipeIndex = recipes.findIndex(r => r.id === id);
                
                if (recipeIndex === -1) {
                    return sendJSON(res, 404, { ok: false, error: 'Recipe not found' });
                }

                const currentRecipe = recipes[recipeIndex];
                const updatedRecipe = {
                    ...currentRecipe,
                    nombre: payload.nombre !== undefined ? payload.nombre.trim() : currentRecipe.nombre,
                    pais: payload.pais !== undefined ? payload.pais.trim() : currentRecipe.pais,
                    tiempo: payload.tiempo !== undefined ? parseInt(payload.tiempo) : currentRecipe.tiempo,
                    categorias: payload.categorias !== undefined ? payload.categorias : currentRecipe.categorias,
                    ingredientes: payload.ingredientes !== undefined ? payload.ingredientes : currentRecipe.ingredientes,
                    instrucciones: payload.instrucciones !== undefined ? payload.instrucciones : currentRecipe.instrucciones,
                    imagen: payload.imagen !== undefined ? payload.imagen : currentRecipe.imagen
                };

                recipes[recipeIndex] = updatedRecipe;
                
                if (saveRecipes(recipes)) {
                    return sendJSON(res, 200, { ok: true, receta: updatedRecipe });
                } else {
                    return sendJSON(res, 500, { ok: false, error: 'Failed to update recipe' });
                }
            }

            // DELETE recipe
            if (req.method === 'DELETE' && pathname === '/api/recipes') {
                const id = parseInt(parsed.query.id, 10);
                if (!id) return sendJSON(res, 400, { ok: false, error: 'ID required' });

                const recipes = loadRecipes();
                const recipeIndex = recipes.findIndex(r => r.id === id);
                
                if (recipeIndex === -1) {
                    return sendJSON(res, 404, { ok: false, error: 'Recipe not found' });
                }

                recipes.splice(recipeIndex, 1);
                
                if (saveRecipes(recipes)) {
                    return sendJSON(res, 200, { ok: true });
                } else {
                    return sendJSON(res, 500, { ok: false, error: 'Failed to delete recipe' });
                }
            }

            // GET users
            if (req.method === 'GET' && pathname === '/api/users') {
                const users = loadUsers();
                return sendJSON(res, 200, { users: users.map(u => ({ id: u.id, username: u.username, role: u.role })) });
            }

            // POST register
            if (req.method === 'POST' && pathname === '/api/register') {
                const body = await readRequestBody(req);
                const payload = JSON.parse(body || '{}');
                
                if (!payload.username || !payload.password) {
                    return sendJSON(res, 400, { ok: false, error: 'Username and password required' });
                }

                const users = loadUsers();
                const existingUser = users.find(u => u.username === payload.username);
                
                if (existingUser) {
                    return sendJSON(res, 409, { ok: false, error: 'User already exists' });
                }

                const newId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
                const newUser = {
                    id: newId,
                    username: payload.username,
                    password: payload.password,
                    role: payload.role === 'admin' ? 'admin' : 'user'
                };

                users.push(newUser);
                
                if (saveUsers(users)) {
                    return sendJSON(res, 201, { ok: true, user: { id: newUser.id, username: newUser.username, role: newUser.role } });
                } else {
                    return sendJSON(res, 500, { ok: false, error: 'Failed to create user' });
                }
            }

            // POST login
            if (req.method === 'POST' && pathname === '/api/login') {
                const body = await readRequestBody(req);
                const payload = JSON.parse(body || '{}');
                
                const users = loadUsers();
                const user = users.find(u => u.username === payload.username && u.password === payload.password);
                
                if (!user) {
                    return sendJSON(res, 401, { ok: false, error: 'Invalid credentials' });
                }
                
                return sendJSON(res, 200, { ok: true, user: { id: user.id, username: user.username, role: user.role } });
            }

            return sendJSON(res, 404, { ok: false, error: 'API route not found' });
        } catch (err) {
            console.error('API error:', err);
            return sendJSON(res, 500, { ok: false, error: 'Server error: ' + err.message });
        }
    }

    // Static file serving
    let filePath = path.join(ROOT, pathname === '/' ? '/index.html' : pathname);
    
    // Security check
    if (!filePath.startsWith(ROOT)) {
        filePath = path.join(ROOT, 'index.html');
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - File not found</h1><p>RecetasWorld Server is running</p>');
            return;
        }

        const extname = String(path.extname(filePath)).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.webp': 'image/webp',
            '.ico': 'image/x-icon'
        };
        
        const contentType = mimeTypes[extname] || 'application/octet-stream';
        
        fs.readFile(filePath, (error, content) => {
            if (error) {
                res.writeHead(500);
                res.end('Server error');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ RecetasWorld server is running on port ${PORT}`);
    console.log(`🌐 Environment: ${NODE_ENV}`);
    console.log(`📁 Data directory: ${DATA_DIR}`);
    console.log(`🔗 Health check available at /health`);
});