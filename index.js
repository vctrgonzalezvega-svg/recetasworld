const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

console.log('Starting RecetasWorld server...');

// Import complete recipe database
const recipesDatabase = require('./js/recipes-data.js');

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
                    
                    // Handle image upload
                    if (data.imageBase64) {
                        try {
                            const matches = data.imageBase64.match(/^data:(image\/(png|jpeg|jpg|gif|webp));base64,(.+)$/);
                            if (matches) {
                                const imageBuffer = Buffer.from(matches[3], 'base64');
                                const fileName = `recipe_${Date.now()}.${matches[2] === 'jpeg' ? 'jpg' : matches[2]}`;
                                const imagePath = path.join(__dirname, 'img', 'uploads', fileName);
                                
                                // Create uploads directory if it doesn't exist
                                const uploadsDir = path.join(__dirname, 'img', 'uploads');
                                if (!fs.existsSync(uploadsDir)) {
                                    fs.mkdirSync(uploadsDir, { recursive: true });
                                }
                                
                                fs.writeFileSync(imagePath, imageBuffer);
                                data.imagen = `img/uploads/${fileName}`;
                            }
                        } catch (imgErr) {
                            console.error('Error processing image:', imgErr);
                        }
                        delete data.imageBase64;
                    }
                    
                    const recipe = {
                        id: nextRecipeId++,
                        ...data,
                        calificacion: data.calificacion || 0,
                        resenas: data.resenas || 0
                    };
                    recipes.unshift(recipe);
                    saveRecipes(); // Save to file
                    sendResponse(res, 201, { ok: true, receta: recipe });
                } catch (err) {
                    console.error('Error creating recipe:', err);
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
                                const imageBuffer = Buffer.from(matches[3], 'base64');
                                const fileName = `recipe_${Date.now()}.${matches[2] === 'jpeg' ? 'jpg' : matches[2]}`;
                                const imagePath = path.join(__dirname, 'img', 'uploads', fileName);
                                
                                // Create uploads directory if it doesn't exist
                                const uploadsDir = path.join(__dirname, 'img', 'uploads');
                                if (!fs.existsSync(uploadsDir)) {
                                    fs.mkdirSync(uploadsDir, { recursive: true });
                                }
                                
                                fs.writeFileSync(imagePath, imageBuffer);
                                data.imagen = `img/uploads/${fileName}`;
                            }
                        } catch (imgErr) {
                            console.error('Error processing image:', imgErr);
                        }
                        delete data.imageBase64;
                    }

                    const updatedRecipe = { ...recipes[recipeIndex], ...data };
                    recipes[recipeIndex] = updatedRecipe;
                    saveRecipes(); // Save to file
                    sendResponse(res, 200, { ok: true, receta: updatedRecipe });
                } catch (err) {
                    console.error('Error updating recipe:', err);
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

        // User routes
        if (pathname === '/api/users' && method === 'GET') {
            sendResponse(res, 200, { usuarios: users });
            return;
        }

        if (pathname === '/api/users' && method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const user = {
                        id: nextUserId++,
                        ...data,
                        createdAt: new Date().toISOString()
                    };
                    users.push(user);
                    saveUsers();
                    sendResponse(res, 201, { ok: true, usuario: user });
                } catch (err) {
                    console.error('Error creating user:', err);
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
        
        // Use the complete recipe database from js/recipes-data.js
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