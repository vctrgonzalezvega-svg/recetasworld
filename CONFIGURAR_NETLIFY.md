# 🚀 Configurar RecetasWorld en Netlify

## 🎯 Tu Situación Actual

- ✅ **Frontend funcionando**: https://recetasworld.netlify.app
- ❌ **Backend faltante**: Netlify solo sirve archivos estáticos
- ❌ **APIs no funcionan**: `/api/recipes` no existe
- ❌ **Base de datos faltante**: No se pueden guardar recetas

## 🔧 Solución: Agregar Backend en Railway

### Paso 1: Crear Backend en Railway

1. **Ve a Railway**:
   ```
   https://railway.app
   ```

2. **Conectar GitHub**:
   - Haz clic en "Start a New Project"
   - Selecciona "Deploy from GitHub repo"
   - Autoriza Railway
   - Selecciona tu repositorio `recetasworld`

3. **Deploy Automático**:
   - Railway detecta Node.js automáticamente
   - Usa `npm start` para ejecutar `server.js`
   - Crea la base de datos SQLite automáticamente

4. **Obtener URL**:
   - Railway te dará una URL como:
   ```
   https://recetasworld-production-a1b2c3d4.up.railway.app
   ```

### Paso 2: Configurar Frontend

1. **Actualizar js/app.js**:
   ```javascript
   // Línea ~45, en la función getApiBase()
   if (window.location.hostname.includes('netlify.app')) {
       // Cambiar por tu URL real de Railway
       return 'https://recetasworld-production-a1b2c3d4.up.railway.app/api';
   }
   ```

2. **Actualizar server.js** (para CORS):
   ```javascript
   // Línea ~15, agregar tu dominio Netlify
   const allowedOrigins = [
       'http://localhost:8081',
       'https://recetasworld.netlify.app',  // Tu Netlify
       'https://recetasworld-production-a1b2c3d4.up.railway.app'  // Tu Railway
   ];
   ```

### Paso 3: Redesplegar

1. **Commit cambios**:
   ```bash
   git add .
   git commit -m "Configurar backend Railway para Netlify"
   git push origin main
   ```

2. **Verificar**:
   - Netlify se actualiza automáticamente
   - Railway se actualiza automáticamente
   - Prueba https://recetasworld.netlify.app

## 🧪 Verificar Funcionamiento

### 1. Abrir Consola del Navegador
```javascript
// En https://recetasworld.netlify.app
checkBackend()
```

### 2. URLs a Probar
- **Frontend**: https://recetasworld.netlify.app
- **Backend**: https://tu-railway-url.up.railway.app/api/recipes
- **Test**: Crear una receta nueva

### 3. Funcionalidades que Deben Funcionar
- ✅ Ver recetas existentes
- ✅ Crear nuevas recetas
- ✅ Editar recetas existentes
- ✅ Subir imágenes
- ✅ Sistema de favoritos
- ✅ Búsqueda y filtros

## 🌐 Arquitectura Final

```
┌─────────────────────┐    API calls    ┌─────────────────────┐
│      NETLIFY        │ ──────────────> │      RAILWAY        │
│   (Solo Frontend)   │                 │  (Backend + DB)     │
│                     │                 │                     │
│ recetasworld.       │                 │ recetasworld-       │
│ netlify.app         │                 │ production.         │
│                     │                 │ railway.app         │
│                     │                 │                     │
│ • HTML/CSS/JS       │                 │ • Node.js server    │
│ • CDN Global        │                 │ • SQLite database   │
│ • Súper rápido      │                 │ • File uploads      │
│ • Gratis            │                 │ • APIs REST         │
└─────────────────────┘                 └─────────────────────┘
```

## 💡 Alternativa Más Simple

Si prefieres tener todo en un lugar:

1. **Mover todo a Railway**:
   - Railway sirve frontend + backend
   - Una sola URL para todo
   - Más fácil de manejar

2. **Cambiar DNS** (si tienes dominio propio):
   - Apuntar tu dominio a Railway
   - Mantener todo centralizado

## 🆘 Solución de Problemas

### Error: "Cannot connect to backend"
1. Verifica que Railway esté ejecutándose
2. Revisa los logs en Railway dashboard
3. Confirma que la URL en `js/app.js` sea correcta

### Error: CORS
1. Verifica que `recetasworld.netlify.app` esté en `allowedOrigins`
2. Redespliega Railway después de cambios

### Error: Base de datos
1. Railway crea la BD automáticamente
2. Verifica que la carpeta `data/` esté en Git
3. Revisa logs de Railway para errores de BD

## ✅ Checklist Final

- [ ] Backend desplegado en Railway
- [ ] URL de Railway copiada
- [ ] `js/app.js` actualizado con URL real
- [ ] `server.js` actualizado con CORS
- [ ] Cambios pusheados a Git
- [ ] Netlify actualizado automáticamente
- [ ] Railway actualizado automáticamente
- [ ] `checkBackend()` muestra éxito
- [ ] Crear receta funciona
- [ ] Editar imagen funciona

¡Una vez completado esto, tu aplicación funcionará perfectamente! 🎉