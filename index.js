const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

console.log('Starting server...');

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
    if (pathname === '/' || pathname === '/health') {
        sendResponse(res, 200, { 
            status: 'ok', 
            message: 'RecetasWorld is running',
            timestamp: new Date().toISOString()
        });
        return;
    }

    // API Routes
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

    // Static files
    const filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };
        
        const contentType = mimeTypes[ext] || 'text/plain';
        const content = fs.readFileSync(filePath);
        sendResponse(res, 200, content, contentType);
        return;
    }

    // 404
    sendResponse(res, 404, { error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
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

console.log('Sample data loaded');