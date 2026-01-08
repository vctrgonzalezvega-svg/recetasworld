# 🚀 Configuración Netlify + Railway

## 🎯 Estrategia: Frontend en Netlify + Backend en Railway

### ✅ **Ventajas de esta configuración:**
- Frontend súper rápido en Netlify (CDN global)
- Backend con base de datos en Railway
- Ambos servicios gratuitos
- URLs separadas pero conectadas

## 🔧 Paso 1: Configurar Backend en Railway

### 1. Crear proyecto en Railway
1. Ve a [railway.app](https://railway.app)
2. Conecta tu repositorio GitHub
3. Railway detectará automáticamente Node.js
4. Deploy automático del backend

### 2. Obtener URL del backend
Railway te dará una URL como:
```
https://recetasworld-production-xxxx.up.railway.app
```

## 🔧 Paso 2: Configurar Frontend para usar Railway API

### 1. Actualizar js/app.js
```javascript
// En la función getApiBase()
getApiBase() {
    // Si estamos en Netlify, usar Railway para API
    if (window.location.hostname.includes('netlify.app')) {
        return 'https://recetasworld-production-xxxx.up.railway.app/api';
    }
    
    // Si estamos en desarrollo, usar localhost
    if (this.environment === 'development') {
        return 'http://localhost:8081/api';
    }
    
    // Fallback
    return `${window.location.protocol}//${window.location.host}/api`;
}
```

### 2. Configurar CORS en Railway
En `server.js`, agregar tu dominio de Netlify:
```javascript
const allowedOrigins = [
    'http://localhost:8081',
    'https://recetasworld.netlify.app',  // Tu dominio Netlify
    'https://recetasworld-production-xxxx.up.railway.app'
];
```

## 🔧 Paso 3: Actualizar y Redesplegar

### 1. Commit cambios
```bash
git add .
git commit -m "Configurar Netlify + Railway"
git push origin main
```

### 2. Netlify se actualiza automáticamente
### 3. Railway se actualiza automáticamente

## 🧪 Verificar Funcionamiento

### URLs a probar:
- **Frontend**: https://recetasworld.netlify.app
- **Backend**: https://tu-railway-url.up.railway.app/api/recipes
- **Test completo**: Crear/editar recetas desde Netlify

## 🌐 Resultado Final

```
┌─────────────────┐    API calls    ┌─────────────────┐
│   NETLIFY       │ ──────────────> │    RAILWAY      │
│   (Frontend)    │                 │   (Backend)     │
│                 │                 │                 │
│ • HTML/CSS/JS   │                 │ • Node.js       │
│ • CDN Global    │                 │ • SQLite DB     │
│ • Súper rápido  │                 │ • File uploads  │
└─────────────────┘                 └─────────────────┘
```

## 💡 Alternativa: Todo en Railway

Si prefieres simplicidad, puedes mover todo a Railway:
1. Railway sirve tanto frontend como backend
2. Una sola URL para todo
3. Más fácil de manejar

¿Cuál prefieres?