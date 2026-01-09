const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const sqlite3 = require('sqlite3').verbose();

const ROOT = path.resolve(__dirname);
const DB_PATH = path.join(ROOT, 'data', 'database.sqlite');

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

// Initialize DB and create tables if missing
const dbDir = path.join(ROOT, 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS recipes (
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
        )
    `);
});

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

    // API routes
    if (pathname && pathname.startsWith('/api/')) {
        if (req.method === 'OPTIONS') {
            res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            });
            res.end();
            return;
        }
        try {
            // GET categories
            if (req.method === 'GET' && pathname === '/api/categories') {
                db.all('SELECT DISTINCT categorias FROM recipes WHERE categorias IS NOT NULL AND categorias != ""', [], (err, rows) => {
                    if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                    
                    const allCategories = new Set();
                    rows.forEach(row => {
                        try {
                            const cats = JSON.parse(row.categorias || '[]');
                            cats.forEach(cat => allCategories.add(cat));
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    });
                    
                    return sendJSON(res, 200, { categories: Array.from(allCategories).sort() });
                });
                return;
            }

            // Health check endpoint for deployment
            if (req.method === 'GET' && pathname === '/api/health') {
                return sendJSON(res, 200, { ok: true, status: 'healthy', timestamp: new Date().toISOString() });
            }

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
                    console.error('Error parsing JSON:', parseErr);
                    return sendJSON(res, 400, { ok: false, error: 'JSON inválido' });
                }

                // Validar campos requeridos
                if (!payload.nombre || payload.nombre.trim() === '') {
                    return sendJSON(res, 400, { ok: false, error: 'El nombre de la receta es requerido' });
                }

                // handle base64 image
                if (payload.imageBase64) {
                    try {
                        // Expandir formatos soportados para mayor compatibilidad
                        const matches = payload.imageBase64.match(/^data:(image\/(png|jpeg|jpg|gif|webp|bmp|tiff|tif|svg\+xml|avif|heic|heif));base64,(.+)$/);
                        if (matches) {
                            let ext = matches[2];
                            // Normalizar extensiones
                            if (ext === 'jpeg') ext = 'jpg';
                            if (ext === 'svg+xml') ext = 'svg';
                            if (ext === 'tiff') ext = 'tif';
                            
                            const base64 = matches[3];
                            const uploadsDir = path.join(ROOT, 'img', 'uploads');
                            
                            // Asegurar que el directorio existe
                            if (!fs.existsSync(uploadsDir)) {
                                fs.mkdirSync(uploadsDir, { recursive: true });
                            }
                            
                            const filename = `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
                            const filepath = path.join(uploadsDir, filename);
                            
                            // Validar tamaño de imagen (máximo 10MB para mayor flexibilidad)
                            const imageSize = Buffer.byteLength(base64, 'base64');
                            if (imageSize > 10 * 1024 * 1024) {
                                return sendJSON(res, 400, { ok: false, error: 'La imagen es demasiado grande (máximo 10MB)' });
                            }
                            
                            // Guardar imagen original
                            fs.writeFileSync(filepath, Buffer.from(base64, 'base64'));
                            payload.imagen = path.join('img', 'uploads', filename).replace(/\\/g, '/');
                            console.log(`✅ Imagen guardada: ${payload.imagen} (${ext.toUpperCase()}, ${(imageSize/1024/1024).toFixed(2)}MB)`);
                            
                            // Si es un formato moderno/poco compatible, crear también una versión JPG de fallback
                            if (['avif', 'heic', 'heif', 'bmp', 'tif'].includes(ext)) {
                                console.log(`🔄 Formato ${ext.toUpperCase()} detectado, se recomienda conversión a JPG para mejor compatibilidad`);
                            }
                            
                        } else {
                            console.warn('⚠️ Formato de imagen base64 inválido');
                            return sendJSON(res, 400, { ok: false, error: 'Formato de imagen no soportado. Formatos válidos: PNG, JPG, GIF, WebP, BMP, TIFF, SVG, AVIF, HEIC' });
                        }
                    } catch (imgErr) {
                        console.error('❌ Error procesando imagen:', imgErr);
                        return sendJSON(res, 500, { ok: false, error: 'Error procesando la imagen' });
                    }
                }

                // Normalizar y validar datos
                const normalizedPayload = {
                    nombre: (payload.nombre || '').trim(),
                    pais: (payload.pais || '').trim(),
                    tiempo: parseInt(payload.tiempo) || 0,
                    categorias: Array.isArray(payload.categorias) ? payload.categorias : [],
                    ingredientes: Array.isArray(payload.ingredientes) ? payload.ingredientes : [],
                    instrucciones: Array.isArray(payload.instrucciones) ? payload.instrucciones : [],
                    imagen: payload.imagen || ''
                };

                const sql = `INSERT INTO recipes (nombre,pais,tiempo,categorias,ingredientes,instrucciones,imagen) VALUES (?,?,?,?,?,?,?)`;
                const params = [
                    normalizedPayload.nombre,
                    normalizedPayload.pais,
                    normalizedPayload.tiempo,
                    JSON.stringify(normalizedPayload.categorias),
                    JSON.stringify(normalizedPayload.ingredientes),
                    JSON.stringify(normalizedPayload.instrucciones),
                    normalizedPayload.imagen
                ];

                console.log('📝 Guardando receta:', {
                    nombre: normalizedPayload.nombre,
                    pais: normalizedPayload.pais,
                    tiempo: normalizedPayload.tiempo,
                    categorias: normalizedPayload.categorias.length,
                    ingredientes: normalizedPayload.ingredientes.length,
                    instrucciones: normalizedPayload.instrucciones.length,
                    tieneImagen: !!normalizedPayload.imagen
                });

                db.run(sql, params, function(err) {
                    if (err) {
                        console.error('❌ Error guardando en BD:', err);
                        return sendJSON(res, 500, { ok: false, error: 'Error guardando en base de datos: ' + err.message });
                    }
                    
                    const newId = this.lastID;
                    console.log(`✅ Receta guardada con ID: ${newId}`);
                    
                    db.get('SELECT * FROM recipes WHERE id = ?', [newId], (err, row) => {
                        if (err) {
                            console.error('❌ Error recuperando receta:', err);
                            return sendJSON(res, 500, { ok: false, error: err.message });
                        }
                        
                        const serializedRecipe = serializeRecipeRow(row);
                        console.log('✅ Receta serializada correctamente');
                        return sendJSON(res, 201, { ok: true, receta: serializedRecipe });
                    });
                });
                return;
            }

            // PUT update recipe
            if (req.method === 'PUT' && pathname === '/api/recipes') {
                const id = parseInt(parsed.query.id, 10);
                if (!id) return sendJSON(res, 400, { ok: false, error: 'id requerido' });
                
                const body = await readRequestBody(req);
                let payload;
                
                try {
                    payload = JSON.parse(body || '{}');
                } catch (parseErr) {
                    console.error('Error parsing JSON:', parseErr);
                    return sendJSON(res, 400, { ok: false, error: 'JSON inválido' });
                }

                // handle base64 image
                if (payload.imageBase64) {
                    try {
                        // Expandir formatos soportados para mayor compatibilidad
                        const matches = payload.imageBase64.match(/^data:(image\/(png|jpeg|jpg|gif|webp|bmp|tiff|tif|svg\+xml|avif|heic|heif));base64,(.+)$/);
                        if (matches) {
                            let ext = matches[2];
                            // Normalizar extensiones
                            if (ext === 'jpeg') ext = 'jpg';
                            if (ext === 'svg+xml') ext = 'svg';
                            if (ext === 'tiff') ext = 'tif';
                            
                            const base64 = matches[3];
                            const uploadsDir = path.join(ROOT, 'img', 'uploads');
                            
                            // Asegurar que el directorio existe
                            if (!fs.existsSync(uploadsDir)) {
                                fs.mkdirSync(uploadsDir, { recursive: true });
                            }
                            
                            // Validar tamaño de imagen (máximo 10MB para mayor flexibilidad)
                            const imageSize = Buffer.byteLength(base64, 'base64');
                            if (imageSize > 10 * 1024 * 1024) {
                                return sendJSON(res, 400, { ok: false, error: 'La imagen es demasiado grande (máximo 10MB)' });
                            }
                            
                            const filename = `recipe-${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
                            const filepath = path.join(uploadsDir, filename);
                            fs.writeFileSync(filepath, Buffer.from(base64, 'base64'));
                            payload.imagen = path.join('img', 'uploads', filename).replace(/\\/g, '/');
                            console.log(`✅ Imagen actualizada: ${payload.imagen} (${ext.toUpperCase()}, ${(imageSize/1024/1024).toFixed(2)}MB)`);
                            
                            // Si es un formato moderno/poco compatible, crear también una versión JPG de fallback
                            if (['avif', 'heic', 'heif', 'bmp', 'tif'].includes(ext)) {
                                console.log(`🔄 Formato ${ext.toUpperCase()} detectado, se recomienda conversión a JPG para mejor compatibilidad`);
                            }
                            
                        } else {
                            console.warn('⚠️ Formato de imagen base64 inválido');
                            return sendJSON(res, 400, { ok: false, error: 'Formato de imagen no soportado. Formatos válidos: PNG, JPG, GIF, WebP, BMP, TIFF, SVG, AVIF, HEIC' });
                        }
                    } catch (imgErr) {
                        console.error('❌ Error procesando imagen:', imgErr);
                        return sendJSON(res, 500, { ok: false, error: 'Error procesando la imagen' });
                    }
                }

                db.get('SELECT * FROM recipes WHERE id = ?', [id], (err, currentRow) => {
                    if (err) {
                        console.error('❌ Error consultando receta:', err);
                        return sendJSON(res, 500, { ok: false, error: err.message });
                    }
                    if (!currentRow) return sendJSON(res, 404, { ok: false, error: 'Receta no encontrada' });

                    // Eliminar imagen anterior si se está subiendo una nueva
                    if (payload.imagen && currentRow.imagen && currentRow.imagen.startsWith('img/uploads/')) {
                        const oldImagePath = path.join(ROOT, currentRow.imagen);
                        if (fs.existsSync(oldImagePath)) {
                            try {
                                fs.unlinkSync(oldImagePath);
                                console.log(`🗑️ Imagen anterior eliminada: ${currentRow.imagen}`);
                            } catch (e) {
                                console.warn('⚠️ No se pudo eliminar imagen anterior:', e.message);
                            }
                        }
                    }

                    const merged = {
                        nombre: (payload.nombre !== undefined ? payload.nombre : currentRow.nombre) || '',
                        pais: (payload.pais !== undefined ? payload.pais : currentRow.pais) || '',
                        tiempo: (payload.tiempo !== undefined ? parseInt(payload.tiempo) : currentRow.tiempo) || 0,
                        categorias: JSON.stringify(payload.categorias !== undefined ? payload.categorias : (currentRow.categorias ? JSON.parse(currentRow.categorias) : [])),
                        ingredientes: JSON.stringify(payload.ingredientes !== undefined ? payload.ingredientes : (currentRow.ingredientes ? JSON.parse(currentRow.ingredientes) : [])),
                        instrucciones: JSON.stringify(payload.instrucciones !== undefined ? payload.instrucciones : (currentRow.instrucciones ? JSON.parse(currentRow.instrucciones) : [])),
                        imagen: (payload.imagen !== undefined ? payload.imagen : currentRow.imagen) || ''
                    };

                    console.log('📝 Actualizando receta:', {
                        id: id,
                        nombre: merged.nombre,
                        tieneImagen: !!merged.imagen
                    });

                    const sql = `UPDATE recipes SET nombre=?,pais=?,tiempo=?,categorias=?,ingredientes=?,instrucciones=?,imagen=? WHERE id=?`;
                    const params = [merged.nombre, merged.pais, merged.tiempo, merged.categorias, merged.ingredientes, merged.instrucciones, merged.imagen, id];

                    db.run(sql, params, function(err) {
                        if (err) {
                            console.error('❌ Error actualizando receta:', err);
                            return sendJSON(res, 500, { ok: false, error: err.message });
                        }
                        if (this.changes === 0) return sendJSON(res, 404, { ok: false, error: 'Receta no encontrada' });
                        
                        console.log(`✅ Receta ${id} actualizada correctamente`);
                        
                        db.get('SELECT * FROM recipes WHERE id = ?', [id], (err, row) => {
                            if (err) {
                                console.error('❌ Error recuperando receta actualizada:', err);
                                return sendJSON(res, 500, { ok: false, error: err.message });
                            }
                            return sendJSON(res, 200, { ok: true, receta: serializeRecipeRow(row) });
                        });
                    });
                });
                return;
            }

            // DELETE recipe
            if (req.method === 'DELETE' && pathname === '/api/recipes') {
                const id = parseInt(parsed.query.id, 10);
                if (!id) return sendJSON(res, 400, { ok: false, error: 'id requerido' });

                db.get('SELECT * FROM recipes WHERE id = ?', [id], (err, row) => {
                    if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                    if (!row) return sendJSON(res, 404, { ok: false, error: 'no encontrado' });

                    db.run('DELETE FROM recipes WHERE id = ?', [id], function(err) {
                        if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                        
                        if (row.imagen && row.imagen.startsWith('img/')) {
                            const imgPath = path.join(ROOT, row.imagen);
                            if (fs.existsSync(imgPath)) {
                                try { fs.unlinkSync(imgPath); } catch(e) {}
                            }
                        }
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
                if (!payload.username || !payload.password) return sendJSON(res, 400, { ok: false, error: 'username y password requeridos' });

                db.get('SELECT * FROM users WHERE username = ?', [payload.username], (err, existing) => {
                    if (err) return sendJSON(res, 500, { ok: false, error: err.message });
                    if (existing) return sendJSON(res, 409, { ok: false, error: 'usuario existe' });

                    const requestedRole = payload.role === 'admin' ? 'admin' : 'user';
                    if (requestedRole === 'admin') {
                        let expectedAdminKey = process.env.ADMIN_KEY || null;
                        const adminKeyFile = path.join(ROOT, 'data', 'admin-key.txt');
                        try {
                            if (!expectedAdminKey && fs.existsSync(adminKeyFile)) {
                                expectedAdminKey = fs.readFileSync(adminKeyFile, 'utf8').trim();
                            }
                        } catch (e) { expectedAdminKey = null; }
                        
                        if (!expectedAdminKey) return sendJSON(res, 403, { ok: false, error: 'creación de admin deshabilitada (sin clave configurada)' });
                        const providedKey = (payload.adminKey || '').toString().trim();
                        if (!providedKey || providedKey !== expectedAdminKey) return sendJSON(res, 403, { ok: false, error: 'clave maestra inválida' });
                    }

                    db.run('INSERT INTO users (username,password,role) VALUES (?,?,?)', [payload.username, payload.password, requestedRole], function(err) {
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
                    if (!user) return sendJSON(res, 401, { ok: false, error: 'credenciales inválidas' });
                    return sendJSON(res, 200, { ok: true, user });
                });
                return;
            }

            // Unknown API route
            return sendJSON(res, 404, { ok: false, error: 'ruta API no encontrada' });
        } catch (err) {
            console.error('API error', err);
            return sendJSON(res, 500, { ok: false, error: 'error del servidor' });
        }
    }

    // Static file serving
    let filePath = path.join(ROOT, parsed.pathname === '/' ? '/index.html' : parsed.pathname);
    // Prevent directory traversal
    if (!filePath.startsWith(ROOT)) filePath = path.join(ROOT, 'index.html');

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Archivo no encontrado</h1>');
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
            '.bmp': 'image/bmp',
            '.tiff': 'image/tiff',
            '.tif': 'image/tiff',
            '.avif': 'image/avif',
            '.heic': 'image/heic',
            '.heif': 'image/heif',
            '.ico': 'image/x-icon'
        };
        const contentType = mimeTypes[extname] || 'application/octet-stream';
        fs.readFile(filePath, (error, content) => {
            if (error) {
                res.writeHead(500);
                res.end('Error del servidor');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
    });
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
    console.log('Presiona Ctrl+C para detener el servidor');
});
