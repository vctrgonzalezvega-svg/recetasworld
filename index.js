const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

console.log('Starting RecetasWorld server...');

// Simple in-memory storage
let recipes = [];
let users = [];
let nextRecipeId = 1;
let nextUserId = 1;

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
        filePath = path.join(__dirname, pathname);
    }
    
    // Security check - prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
        sendResponse(res, 403, { error: 'Forbidden' });
        return;
    }

    // Check if file exists
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        sendResponse(res, 404, { error: 'File not found' });
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
});

// Add some sample data
recipes.push({
    id: 1,
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

console.log('✅ Sample data loaded');
console.log('🚀 RecetasWorld is ready!');