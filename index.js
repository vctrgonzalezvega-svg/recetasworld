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
        nombre: "Smoothie bowl",
        pais: "Estados Unidos",
        imagen: "🍓",
        tiempo: 15,
        categorias: ["desayunos", "rapidas", "baratas"],
        ingredientes: [
            { nombre: "Plátanos congelados", cantidad: "240g", icono: "🍌" },
            { nombre: "Fresas congeladas", cantidad: "150g", icono: "🍓" },
            { nombre: "Leche", cantidad: "120ml", icono: "🥛" },
            { nombre: "Miel", cantidad: "15ml", icono: "🍯" },
            { nombre: "Granola", cantidad: "30g", icono: "🌾" },
            { nombre: "Chía", cantidad: "15g", icono: "⚫" },
            { nombre: "Coco rallado", cantidad: "20g", icono: "🥥" }
        ],
        instrucciones: [
            "Coloca los plátanos y fresas congelados en la licuadora",
            "Añade la leche y la miel",
            "Licúa a velocidad alta durante 2-3 minutos hasta obtener textura espesa",
            "Vierte en bowls",
            "Alisa la superficie con una espátula",
            "Decora con granola, chía, rodajas de plátano fresco y coco rallado"
        ],
        calificacion: 4.7,
        resenas: 98
    },
    {
        id: 3,
        nombre: "Yogurt con granola",
        pais: "Estados Unidos",
        imagen: "🥣",
        tiempo: 8,
        categorias: ["desayunos", "rapidas", "baratas"],
        ingredientes: [
            { nombre: "Yogurt natural", cantidad: "500g", icono: "🥛" },
            { nombre: "Granola", cantidad: "60g", icono: "🌾" },
            { nombre: "Miel", cantidad: "30ml", icono: "🍯" },
            { nombre: "Plátano", cantidad: "1", icono: "🍌" },
            { nombre: "Fresas", cantidad: "100g", icono: "🍓" },
            { nombre: "Almendras", cantidad: "30g", icono: "🌰" },
            { nombre: "Chía", cantidad: "15g", icono: "⚫" }
        ],
        instrucciones: [
            "Corta las fresas en rebanadas finas",
            "Pela y rebana el plátano",
            "Coloca 250g de yogurt en cada tazón",
            "Añade granola encima",
            "Decora con rodajas de fruta",
            "Baña con miel y espolvorea con chía y almendras"
        ],
        calificacion: 4.6,
        resenas: 87
    },
    {
        id: 4,
        nombre: "Arepas venezolanas",
        pais: "Venezuela",
        imagen: "🥞",
        tiempo: 30,
        categorias: ["desayunos", "comidas", "rapidas", "baratas"],
        ingredientes: [
            { nombre: "Harina de maíz precocida", cantidad: "300g", icono: "🌾" },
            { nombre: "Agua tibia", cantidad: "600ml", icono: "💧" },
            { nombre: "Sal", cantidad: "5g", icono: "🧂" },
            { nombre: "Aceite", cantidad: "15ml", icono: "🛢️" },
            { nombre: "Queso rallado", cantidad: "150g", icono: "🧀" },
            { nombre: "Jamón", cantidad: "100g", icono: "🍖" },
            { nombre: "Aguacate", cantidad: "1", icono: "🥑" }
        ],
        instrucciones: [
            "Calienta el agua y agrega la sal",
            "Añade poco a poco la harina de maíz mientras mezclas con las manos",
            "Amasa durante 5-7 minutos hasta obtener una masa suave",
            "Deja reposar 5 minutos",
            "Divide en 6 bolas y aplánalas en discos de 1cm de espesor",
            "Calienta aceite en una sartén a fuego medio-alto",
            "Fríe las arepas 3-4 minutos por lado hasta que se doren",
            "Abre por la mitad y rellena con queso, jamón y aguacate"
        ],
        calificacion: 4.7,
        resenas: 142
    },
    {
        id: 5,
        nombre: "Huevos rancheros",
        pais: "México",
        imagen: "🍳",
        tiempo: 20,
        categorias: ["desayunos", "comidas", "rapidas", "baratas"],
        ingredientes: [
            { nombre: "Huevos", cantidad: "2", icono: "🥚" },
            { nombre: "Tortillas de maíz", cantidad: "2", icono: "🌮" },
            { nombre: "Salsa roja", cantidad: "200ml", icono: "🌶️" },
            { nombre: "Cebolla", cantidad: "½", icono: "🧅" },
            { nombre: "Cilantro", cantidad: "10g", icono: "🌿" },
            { nombre: "Queso fresco", cantidad: "50g", icono: "🧀" },
            { nombre: "Aceite", cantidad: "30ml", icono: "🛢️" },
            { nombre: "Frijoles refritos", cantidad: "150g", icono: "🫘" }
        ],
        instrucciones: [
            "Calienta una sartén con aceite",
            "Calienta las tortillas en la sartén unos segundos de cada lado",
            "Coloca las tortillas en un plato",
            "En la misma sartén, calienta la salsa roja",
            "Vierte la salsa sobre las tortillas",
            "Fríe los huevos al gusto en la sartén",
            "Coloca un huevo sobre cada tortilla",
            "Decora con cebolla, cilantro y queso fresco",
            "Sirve con frijoles refritos al lado"
        ],
        calificacion: 4.8,
        resenas: 156
    },
    {
        id: 6,
        nombre: "Chilaquiles rojos",
        pais: "México",
        imagen: "🌶️",
        tiempo: 25,
        categorias: ["desayunos", "comidas", "baratas"],
        ingredientes: [
            { nombre: "Tortillas de maíz", cantidad: "6", icono: "🌮" },
            { nombre: "Salsa roja", cantidad: "300ml", icono: "🌶️" },
            { nombre: "Huevos", cantidad: "2", icono: "🥚" },
            { nombre: "Queso fresco", cantidad: "100g", icono: "🧀" },
            { nombre: "Cebolla", cantidad: "½", icono: "🧅" },
            { nombre: "Cilantro", cantidad: "15g", icono: "🌿" },
            { nombre: "Crema", cantidad: "100ml", icono: "🥛" },
            { nombre: "Aceite", cantidad: "40ml", icono: "🛢️" }
        ],
        instrucciones: [
            "Corta las tortillas en triángulos",
            "Calienta aceite en una sartén",
            "Fríe los triángulos de tortilla hasta que estén crujientes",
            "Retira y coloca en un plato",
            "En la misma sartén, calienta la salsa roja",
            "Vuelve a agregar las tortillas fritas a la salsa",
            "Mezcla bien para que se empajen",
            "Fríe 2 huevos y coloca encima",
            "Decora con queso, cebolla, cilantro y crema"
        ],
        calificacion: 4.7,
        resenas: 134
    },
    {
        id: 7,
        nombre: "Tacos al pastor",
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
        id: 8,
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
    },
    {
        id: 9,
        nombre: "Pizza Margherita",
        pais: "Italia",
        imagen: "🍕",
        tiempo: 45,
        categorias: ["cenas", "comidas"],
        ingredientes: [
            { nombre: "Masa para pizza", cantidad: "1", icono: "🍞" },
            { nombre: "Salsa de tomate", cantidad: "200ml", icono: "🍅" },
            { nombre: "Mozzarella fresca", cantidad: "200g", icono: "🧀" },
            { nombre: "Albahaca fresca", cantidad: "10 hojas", icono: "🌿" },
            { nombre: "Aceite de oliva", cantidad: "30ml", icono: "🫒" },
            { nombre: "Sal", cantidad: "al gusto", icono: "🧂" },
            { nombre: "Pimienta", cantidad: "al gusto", icono: "⚫" }
        ],
        instrucciones: [
            "Precalienta el horno a 250°C",
            "Extiende la masa en una bandeja",
            "Unta la salsa de tomate uniformemente",
            "Distribuye la mozzarella en trozos",
            "Hornea 12-15 minutos hasta que esté dorada",
            "Agrega albahaca fresca al salir del horno",
            "Rocía con aceite de oliva y sirve caliente"
        ],
        calificacion: 4.9,
        resenas: 312
    },
    {
        id: 10,
        nombre: "Paella Valenciana",
        pais: "España",
        imagen: "🥘",
        tiempo: 60,
        categorias: ["comidas"],
        ingredientes: [
            { nombre: "Arroz bomba", cantidad: "400g", icono: "🍚" },
            { nombre: "Pollo", cantidad: "500g", icono: "🍗" },
            { nombre: "Conejo", cantidad: "300g", icono: "🐰" },
            { nombre: "Judías verdes", cantidad: "200g", icono: "🫛" },
            { nombre: "Garrofón", cantidad: "100g", icono: "🫘" },
            { nombre: "Tomate rallado", cantidad: "2", icono: "🍅" },
            { nombre: "Azafrán", cantidad: "1g", icono: "🌼" },
            { nombre: "Aceite de oliva", cantidad: "100ml", icono: "🫒" }
        ],
        instrucciones: [
            "Calienta aceite en paellera",
            "Sofríe pollo y conejo hasta dorar",
            "Agrega judías verdes y garrofón",
            "Añade tomate rallado y sofríe",
            "Incorpora el arroz y mezcla",
            "Vierte caldo caliente con azafrán",
            "Cocina 20 minutos sin remover",
            "Deja reposar 5 minutos antes de servir"
        ],
        calificacion: 4.8,
        resenas: 198
    },
    {
        id: 11,
        nombre: "Ramen Japonés",
        pais: "Japón",
        imagen: "🍜",
        tiempo: 40,
        categorias: ["cenas", "comidas"],
        ingredientes: [
            { nombre: "Fideos ramen", cantidad: "200g", icono: "🍜" },
            { nombre: "Caldo de pollo", cantidad: "1L", icono: "🍲" },
            { nombre: "Huevo", cantidad: "2", icono: "🥚" },
            { nombre: "Chashu (cerdo)", cantidad: "150g", icono: "🥩" },
            { nombre: "Cebolletas", cantidad: "2", icono: "🌿" },
            { nombre: "Nori", cantidad: "2 hojas", icono: "🟢" },
            { nombre: "Miso", cantidad: "2 cucharadas", icono: "🥄" }
        ],
        instrucciones: [
            "Hierve los huevos 6 minutos para que queden cremosos",
            "Calienta el caldo y disuelve el miso",
            "Cocina los fideos según instrucciones",
            "Coloca fideos en tazones",
            "Vierte el caldo caliente",
            "Agrega chashu, huevo partido por la mitad",
            "Decora con cebolletas y nori"
        ],
        calificacion: 4.7,
        resenas: 156
    },
    {
        id: 12,
        nombre: "Ceviche Peruano",
        pais: "Perú",
        imagen: "🐟",
        tiempo: 30,
        categorias: ["comidas", "entradas"],
        ingredientes: [
            { nombre: "Pescado blanco", cantidad: "500g", icono: "🐟" },
            { nombre: "Limón", cantidad: "8 piezas", icono: "🍋" },
            { nombre: "Cebolla roja", cantidad: "1", icono: "🧅" },
            { nombre: "Ají amarillo", cantidad: "2", icono: "🌶️" },
            { nombre: "Cilantro", cantidad: "20g", icono: "🌿" },
            { nombre: "Camote", cantidad: "2", icono: "🍠" },
            { nombre: "Choclo", cantidad: "1", icono: "🌽" }
        ],
        instrucciones: [
            "Corta el pescado en cubos pequeños",
            "Exprime los limones y marina el pescado 15 minutos",
            "Corta la cebolla en juliana fina",
            "Pica el ají amarillo finamente",
            "Mezcla pescado con cebolla y ají",
            "Agrega cilantro picado",
            "Sirve con camote y choclo hervidos"
        ],
        calificacion: 4.9,
        resenas: 234
    },
    {
        id: 13,
        nombre: "Tiramisú",
        pais: "Italia",
        imagen: "🍰",
        tiempo: 30,
        categorias: ["postres"],
        ingredientes: [
            { nombre: "Queso mascarpone", cantidad: "500g", icono: "🧀" },
            { nombre: "Huevo", cantidad: "4", icono: "🥚" },
            { nombre: "Azúcar", cantidad: "150g", icono: "🍯" },
            { nombre: "Café espresso", cantidad: "300ml", icono: "☕" },
            { nombre: "Cacao en polvo", cantidad: "50g", icono: "🌰" },
            { nombre: "Galletas savoiardi", cantidad: "400g", icono: "🍪" }
        ],
        instrucciones: [
            "Bate yemas con azúcar hasta obtener mezcla pálida",
            "Agrega mascarpone y bate suavemente",
            "Incorpora claras a punto de nieve",
            "Sumerge galletas en café",
            "Alterna capas de galletas y crema",
            "Refrigera 4 horas",
            "Espolvorea cacao antes de servir"
        ],
        calificacion: 4.8,
        resenas: 267
    },
    {
        id: 14,
        nombre: "Margarita",
        pais: "México",
        imagen: "🍹",
        tiempo: 5,
        categorias: ["bebidas", "rapidas"],
        ingredientes: [
            { nombre: "Tequila blanco", cantidad: "60ml", icono: "🥃" },
            { nombre: "Licor de naranja", cantidad: "30ml", icono: "🍊" },
            { nombre: "Jugo de limón", cantidad: "30ml", icono: "🍋" },
            { nombre: "Hielo", cantidad: "abundante", icono: "🧊" },
            { nombre: "Sal", cantidad: "para el borde", icono: "🧂" }
        ],
        instrucciones: [
            "Pasa limón por el borde de la copa",
            "Presiona el borde en sal",
            "Llena de hielo",
            "Vierte tequila, licor y jugo de limón",
            "Agita vigorosamente",
            "Vierte en la copa",
            "Decora con rodaja de limón"
        ],
        calificacion: 4.7,
        resenas: 178
    },
    {
        id: 15,
        nombre: "Brownies de Chocolate",
        pais: "Estados Unidos",
        imagen: "🍫",
        tiempo: 40,
        categorias: ["postres", "baratas"],
        ingredientes: [
            { nombre: "Chocolate oscuro", cantidad: "200g", icono: "🍫" },
            { nombre: "Mantequilla", cantidad: "150g", icono: "🧈" },
            { nombre: "Huevo", cantidad: "3", icono: "🥚" },
            { nombre: "Azúcar morena", cantidad: "200g", icono: "🍯" },
            { nombre: "Harina", cantidad: "100g", icono: "🌾" },
            { nombre: "Cacao en polvo", cantidad: "50g", icono: "🌰" },
            { nombre: "Polvo de hornear", cantidad: "1 cucharadita", icono: "🥨" }
        ],
        instrucciones: [
            "Precalienta horno a 180°C",
            "Funde chocolate con mantequilla",
            "Bate huevos con azúcar",
            "Combina mezclas",
            "Agrega ingredientes secos",
            "Hornea 25-30 minutos",
            "Deja enfriar antes de cortar"
        ],
        calificacion: 4.9,
        resenas: 312
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