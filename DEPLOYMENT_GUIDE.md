# 🚀 Guía de Deployment - RecetasWorld

## 🌐 Opciones de Hosting Gratuito

### 1. **Railway (Recomendado) - Gratis con BD**
- ✅ **Gratis**: 500 horas/mes
- ✅ **Base de datos**: SQLite incluida
- ✅ **Dominio**: Automático (tu-app.railway.app)
- ✅ **HTTPS**: Automático

#### Pasos para Railway:
1. Ve a [railway.app](https://railway.app)
2. Conecta tu repositorio GitHub
3. Railway detecta automáticamente Node.js
4. Deploy automático

### 2. **Render - Gratis con limitaciones**
- ✅ **Gratis**: Con hibernación después de 15 min
- ✅ **Base de datos**: SQLite incluida
- ✅ **Dominio**: Automático (tu-app.onrender.com)
- ✅ **HTTPS**: Automático

#### Pasos para Render:
1. Ve a [render.com](https://render.com)
2. Conecta GitHub
3. Selecciona "Web Service"
4. Configura build command: `npm install`
5. Start command: `npm start`

### 3. **Heroku - Gratis limitado**
- ⚠️ **Gratis**: Solo 550 horas/mes
- ✅ **Base de datos**: Requiere addon
- ✅ **Dominio**: Automático (tu-app.herokuapp.com)
- ✅ **HTTPS**: Automático

### 4. **Vercel - Solo frontend**
- ✅ **Gratis**: Ilimitado para frontend
- ❌ **Backend**: Requiere funciones serverless
- ✅ **Dominio**: Automático (tu-app.vercel.app)

### 5. **Netlify - Solo frontend**
- ✅ **Gratis**: Ilimitado para frontend
- ❌ **Backend**: Requiere funciones serverless
- ✅ **Dominio**: Automático (tu-app.netlify.app)

## 🔧 Configuración para Deployment

### 1. **Preparar el Código**

#### A. Configurar Variables de Entorno
```javascript
// En server.js - Detectar entorno
const PORT = process.env.PORT || 8081;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`Servidor ejecutándose en http://${HOST}:${PORT}`);
});
```

#### B. Configurar package.json
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

### 2. **Configurar Base de Datos**

#### Para SQLite (Funciona en la mayoría de servicios):
```javascript
// En server.js - Ruta de BD dinámica
const DB_PATH = process.env.DATABASE_URL || path.join(__dirname, 'data', 'database.sqlite');
```

### 3. **Configurar CORS para Producción**
```javascript
// En server.js - Headers CORS dinámicos
const allowedOrigins = [
    'http://localhost:8081',
    'https://tu-app.railway.app',
    'https://tu-app.onrender.com',
    'https://tu-dominio.com'
];

const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
}
```

## 🚀 Deployment Paso a Paso (Railway)

### 1. **Preparar Repositorio**
```bash
# Asegurar que todo esté en Git
git add .
git commit -m "Preparar para deployment"
git push origin main
```

### 2. **Configurar Railway**
1. Ve a [railway.app](https://railway.app)
2. Haz clic en "Start a New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza Railway a acceder a tu GitHub
5. Selecciona tu repositorio RecetasWorld
6. Railway detecta automáticamente que es Node.js
7. Haz clic en "Deploy Now"

### 3. **Configurar Variables de Entorno (Opcional)**
```bash
# En Railway dashboard
PORT=8081
NODE_ENV=production
```

### 4. **Obtener URL**
- Railway te dará una URL como: `https://recetasworld-production-xxxx.up.railway.app`
- Esta URL será tu nuevo dominio público

## 🔧 Configurar Frontend para Producción

### 1. **Detectar Entorno Automáticamente**
```javascript
// En js/app.js - Detectar URL base automáticamente
class RecipesApp {
    constructor() {
        // Detectar si estamos en desarrollo o producción
        this.apiBase = this.getApiBase();
    }
    
    getApiBase() {
        // Si estamos en localhost, usar localhost
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8081/api';
        }
        
        // Si estamos en producción, usar la misma URL
        return `${window.location.protocol}//${window.location.host}/api`;
    }
}
```

### 2. **Configurar CDN para Producción**
```javascript
// En cdn-config.js - URLs dinámicas
const CDN_CONFIG = {
    staticCDN: {
        enabled: window.location.hostname !== 'localhost',
        baseUrl: window.location.hostname === 'localhost' 
            ? '' 
            : `${window.location.protocol}//${window.location.host}/`,
        fallback: true
    }
};
```

## 🌍 Dominio Personalizado (Opcional)

### 1. **Comprar Dominio**
- Namecheap, GoDaddy, Google Domains
- Ejemplo: `recetasworld.com`

### 2. **Configurar DNS**
```
Tipo: CNAME
Nombre: www
Valor: tu-app.railway.app
```

### 3. **Configurar en Railway**
1. Ve a tu proyecto en Railway
2. Settings → Domains
3. Agrega tu dominio personalizado
4. Railway te dará instrucciones específicas

## 📱 Configuración para Móviles

### 1. **HTTPS Obligatorio**
- Todos los servicios mencionados incluyen HTTPS automático
- Necesario para funciones como cámara y geolocalización

### 2. **PWA (Progressive Web App)**
```json
// Crear manifest.json
{
  "name": "RecetasWorld",
  "short_name": "RecetasWorld",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007bff",
  "icons": [
    {
      "src": "img/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 🔍 Verificar Deployment

### 1. **Checklist Post-Deployment**
- [ ] ✅ Página principal carga
- [ ] ✅ API responde correctamente
- [ ] ✅ Base de datos funciona
- [ ] ✅ Subida de imágenes funciona
- [ ] ✅ CDN funciona
- [ ] ✅ Responsive en móviles
- [ ] ✅ HTTPS activo

### 2. **URLs de Prueba**
```
https://tu-app.railway.app/
https://tu-app.railway.app/api/recipes
https://tu-app.railway.app/test-cdn.html
https://tu-app.railway.app/test-image-formats.html
```

## 🚨 Solución de Problemas

### Error: "Cannot GET /"
```javascript
// En server.js - Asegurar servido de archivos estáticos
app.use(express.static('.'));
```

### Error: CORS
```javascript
// Agregar dominio de producción a CORS
'Access-Control-Allow-Origin': 'https://tu-app.railway.app'
```

### Error: Base de datos
```bash
# Verificar que la carpeta data/ esté en Git
git add data/
git commit -m "Add database folder"
```

## 💡 Recomendación Final

**Para RecetasWorld recomiendo Railway porque:**
- ✅ Gratis y fácil de usar
- ✅ Soporta SQLite sin configuración extra
- ✅ Deploy automático desde Git
- ✅ HTTPS incluido
- ✅ Dominio personalizado gratis
- ✅ Perfecto para Node.js + SQLite

¿Quieres que te ayude con el deployment específico en Railway?