const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const sqlite3 = require('sqlite3').verbose();

// Configuración simple para Railway
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log(`🚀 Starting server on port ${PORT}`);
console.log(`🌐 Environment: ${NODE_ENV}`);

const ROOT = path.resolve(__dirname);
const DB_PATH = path.join(ROOT, 'data', 'database.sqlite');

// Ensure data directory exists
const dataDir = path.join(ROOT, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        pais TEXT,
        tiempo INTEGER,
        categorias TEXT,
        ingredientes TEXT,
        instrucciones TEXT,
        imagen TEXT,
        calificacion REAL DEFAULT 0,
        resenas INTEGER DEFAULT 0
    )`);
});

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

function serializeRecipeRow(r) {
    return {
        id: r.id,
        nombre: r.nombre,
        pais: r.pais,
        tiempo: r.tiempo,
        categorias: r.categorias ? JSON.parse(r.categorias) : [],
        ingredientes: r.ingredientes ? JSON.parse(r.ingredientes) : [],
        instrucciones: r.instrucciones ? JSON.parse(r.instrucciones) : [],
        imagen: r.imagen || '',
        calificacion: r.calificacion || 0,
        resenas: r.resenas || 0
    };
}

const server = http.createServer(async (req, res) => {
    const parsed = url.parse(req.url, true);
    const pathname = parsed.pathname;

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

    // Health check for Railway
    if (pathname === '/health' || pathname === '/api/health') {
        return sendJSON(res, 200, { 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            port: PORT 
        });
    }

    // API routes
    if (pathname && pathname.startsWith('/api/')) {
        try {
            // GET recipes
            if (req.method === 'GET' && pathname === '/api/recipes') {
                db.all('SELECT * FROM recipes ORDER BY id DESC', [], (err, rows) => {
                    if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                    const recetas = rows.map(serializeRecipeRow);
                    return sendJSON(res, 200, { recetas });
                });
                return;
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

                const sql = `INSERT INTO recipes (nombre,pais,tiempo,categorias,ingredientes,instrucciones,imagen) VALUES (?,?,?,?,?,?,?)`;
                const params = [
                    payload.nombre.trim(),
                    (payload.pais || '').trim(),
                    parseInt(payload.tiempo) || 0,
                    JSON.stringify(payload.categorias || []),
                    JSON.stringify(payload.ingredientes || []),
                    JSON.stringify(payload.instrucciones || []),
                    payload.imagen || ''
                ];

                db.run(sql, params, function(err) {
                    if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                    
                    db.get('SELECT * FROM recipes WHERE id = ?', [this.lastID], (err, row) => {
                        if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                        return sendJSON(res, 201, { ok: true, receta: serializeRecipeRow(row) });
                    });
                });
                return;
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

                db.get('SELECT * FROM recipes WHERE id = ?', [id], (err, currentRow) => {
                    if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                    if (!currentRow) return sendJSON(res, 404, { ok: false, error: 'Recipe not found' });

                    const merged = {
                        nombre: (payload.nombre !== undefined ? payload.nombre : currentRow.nombre) || '',
                        pais: (payload.pais !== undefined ? payload.pais : currentRow.pais) || '',
                        tiempo: (payload.tiempo !== undefined ? parseInt(payload.tiempo) : currentRow.tiempo) || 0,
                        categorias: JSON.stringify(payload.categorias !== undefined ? payload.categorias : (currentRow.categorias ? JSON.parse(currentRow.categorias) : [])),
                        ingredientes: JSON.stringify(payload.ingredientes !== undefined ? payload.ingredientes : (currentRow.ingredientes ? JSON.parse(currentRow.ingredientes) : [])),
                        instrucciones: JSON.stringify(payload.instrucciones !== undefined ? payload.instrucciones : (currentRow.instrucciones ? JSON.parse(currentRow.instrucciones) : [])),
                        imagen: (payload.imagen !== undefined ? payload.imagen : currentRow.imagen) || ''
                    };

                    const sql = `UPDATE recipes SET nombre=?,pais=?,tiempo=?,categorias=?,ingredientes=?,instrucciones=?,imagen=? WHERE id=?`;
                    const params = [merged.nombre, merged.pais, merged.tiempo, merged.categorias, merged.ingredientes, merged.instrucciones, merged.imagen, id];

                    db.run(sql, params, function(err) {
                        if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                        if (this.changes === 0) return sendJSON(res, 404, { ok: false, error: 'Recipe not found' });
                        
                        db.get('SELECT * FROM recipes WHERE id = ?', [id], (err, row) => {
                            if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                            return sendJSON(res, 200, { ok: true, receta: serializeRecipeRow(row) });
                        });
                    });
                });
                return;
            }

            // DELETE recipe
            if (req.method === 'DELETE' && pathname === '/api/recipes') {
                const id = parseInt(parsed.query.id, 10);
                if (!id) return sendJSON(res, 400, { ok: false, error: 'ID required' });

                db.get('SELECT * FROM recipes WHERE id = ?', [id], (err, row) => {
                    if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                    if (!row) return sendJSON(res, 404, { ok: false, error: 'Not found' });

                    db.run('DELETE FROM recipes WHERE id = ?', [id], function(err) {
                        if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                        return sendJSON(res, 200, { ok: true });
                    });
                });
                return;
            }

            // GET users
            if (req.method === 'GET' && pathname === '/api/users') {
                db.all('SELECT id,username,role FROM users ORDER BY id DESC', [], (err, rows) => {
                    if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                    return sendJSON(res, 200, { users: rows });
                });
                return;
            }

            // POST register
            if (req.method === 'POST' && pathname === '/api/register') {
                const body = await readRequestBody(req);
                const payload = JSON.parse(body || '{}');
                if (!payload.username || !payload.password) {
                    return sendJSON(res, 400, { ok: false, error: 'Username and password required' });
                }

                db.get('SELECT * FROM users WHERE username = ?', [payload.username], (err, existing) => {
                    if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                    if (existing) return sendJSON(res, 409, { ok: false, error: 'User exists' });

                    const role = payload.role === 'admin' ? 'admin' : 'user';
                    db.run('INSERT INTO users (username,password,role) VALUES (?,?,?)', [payload.username, payload.password, role], function(err) {
                        if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                        const newId = this.lastID;
                        db.get('SELECT id,username,role FROM users WHERE id = ?', [newId], (err, user) => {
                            if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                            return sendJSON(res, 201, { ok: true, user });
                        });
                    });
                });
                return;
            }

            // POST login
            if (req.method === 'POST' && pathname === '/api/login') {
                const body = await readRequestBody(req);
                const payload = JSON.parse(body || '{}');
                
                db.get('SELECT id,username,role FROM users WHERE username = ? AND password = ?', [payload.username, payload.password], (err, user) => {
                    if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                    if (!user) return sendJSON(res, 401, { ok: false, error: 'Invalid credentials' });
                    return sendJSON(res, 200, { ok: true, user });
                });
                return;
            }

            return sendJSON(res, 404, { ok: false, error: 'API route not found' });
        } catch (err) {
            console.error('API error:', err);
            return sendJSON(res, 500, { ok: false, error: 'Server error' });
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
            res.end('<h1>404 - File not found</h1>');
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
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${NODE_ENV}`);
});