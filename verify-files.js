// Script para verificar que todos los archivos necesarios estén presentes
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando archivos necesarios para Render...');

const requiredFiles = [
    'index.html',
    'index.js',
    'package.json',
    'css/styles.css',
    'js/app.js',
    'js/recipes-data.js',
    'recipes-data.json',
    'render.yaml'
];

const requiredDirs = [
    'css',
    'js',
    'img'
];

let allGood = true;

// Verificar archivos
console.log('\n📄 Verificando archivos:');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
    } else {
        console.log(`❌ ${file} - FALTANTE`);
        allGood = false;
    }
});

// Verificar directorios
console.log('\n📁 Verificando directorios:');
requiredDirs.forEach(dir => {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        const files = fs.readdirSync(dir);
        console.log(`✅ ${dir}/ (${files.length} archivos)`);
    } else {
        console.log(`❌ ${dir}/ - FALTANTE`);
        allGood = false;
    }
});

// Verificar contenido de recipes-data.js
console.log('\n🍽️ Verificando base de datos de recetas:');
try {
    const recipesContent = fs.readFileSync('js/recipes-data.js', 'utf8');
    const match = recipesContent.match(/const recipesDatabase = (\[[\s\S]*?\]);/);
    if (match) {
        const recipes = eval(match[1]);
        console.log(`✅ recipes-data.js contiene ${recipes.length} recetas`);
    } else {
        console.log(`❌ recipes-data.js - formato incorrecto`);
        allGood = false;
    }
} catch (err) {
    console.log(`❌ Error leyendo recipes-data.js:`, err.message);
    allGood = false;
}

// Verificar recipes-data.json
try {
    const jsonContent = fs.readFileSync('recipes-data.json', 'utf8');
    const recipes = JSON.parse(jsonContent);
    console.log(`✅ recipes-data.json contiene ${recipes.length} recetas`);
} catch (err) {
    console.log(`❌ Error leyendo recipes-data.json:`, err.message);
    allGood = false;
}

console.log('\n' + '='.repeat(50));
if (allGood) {
    console.log('🎉 ¡Todos los archivos están listos para Render!');
    console.log('📤 Puedes subir los archivos a Render con confianza.');
} else {
    console.log('⚠️ Hay archivos faltantes. Revisa los errores arriba.');
}
console.log('='.repeat(50));