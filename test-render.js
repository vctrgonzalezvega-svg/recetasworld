// Script de prueba para verificar el funcionamiento en Render
const http = require('http');

const RENDER_URL = 'https://recetasworld.onrender.com'; // Cambia por tu URL de Render

async function testEndpoint(path, description) {
    return new Promise((resolve) => {
        const url = `${RENDER_URL}${path}`;
        console.log(`\n🔍 Testing: ${description}`);
        console.log(`📡 URL: ${url}`);
        
        const startTime = Date.now();
        
        const req = http.get(url, (res) => {
            const duration = Date.now() - startTime;
            console.log(`📊 Status: ${res.statusCode} (${duration}ms)`);
            console.log(`📋 Headers:`, res.headers);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`✅ SUCCESS: ${description}`);
                    if (res.headers['content-type']?.includes('application/json')) {
                        try {
                            const json = JSON.parse(data);
                            console.log(`📄 Response:`, json);
                        } catch (e) {
                            console.log(`📄 Response length: ${data.length} chars`);
                        }
                    } else {
                        console.log(`📄 Response length: ${data.length} chars`);
                    }
                } else {
                    console.log(`❌ FAILED: ${description}`);
                    console.log(`📄 Error:`, data.substring(0, 200));
                }
                resolve();
            });
        });
        
        req.on('error', (err) => {
            console.log(`❌ ERROR: ${description}`);
            console.log(`📄 Error:`, err.message);
            resolve();
        });
        
        req.setTimeout(10000, () => {
            console.log(`⏰ TIMEOUT: ${description}`);
            req.destroy();
            resolve();
        });
    });
}

async function runTests() {
    console.log('🚀 Iniciando pruebas de Render...');
    console.log('=' .repeat(50));
    
    const tests = [
        ['/', 'Página principal (HTML)'],
        ['/api/health', 'Health check'],
        ['/api/debug', 'Debug info'],
        ['/api/recipes', 'API de recetas'],
        ['/css/styles.css', 'Archivo CSS'],
        ['/js/app.js', 'JavaScript principal'],
        ['/js/recipes-data.js', 'Base de datos de recetas']
    ];
    
    for (const [path, description] of tests) {
        await testEndpoint(path, description);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa entre pruebas
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🏁 Pruebas completadas');
    console.log('💡 Si hay errores 404, revisa los logs del servidor en Render');
    console.log('💡 Usa /api/debug para ver la estructura de archivos');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };