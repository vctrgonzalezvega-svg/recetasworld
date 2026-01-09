# 🚀 Instrucciones de Despliegue en Render

## ❌ SOLUCIÓN PARA ERRORES 404

Si ves errores 404 como en la imagen, sigue estos pasos:

### 🎯 DIAGNÓSTICO RÁPIDO
1. **Visita**: `https://tu-app.onrender.com/render-test.html`
   - Esta página te permitirá probar todos los endpoints automáticamente
   - Haz clic en "🚀 Ejecutar Todas las Pruebas"

2. **O manualmente**:
   - `https://tu-app.onrender.com/api/debug` - Ver archivos disponibles
   - `https://tu-app.onrender.com/api/test-static` - Probar archivos estáticos específicos

### 🔧 PASOS DE CORRECCIÓN ESPECÍFICOS

**PASO 1: Verificar que el servidor funciona**
- ✅ `/api/health` debe mostrar: `{"status":"ok","recipes":60,...}`
- Si no funciona: problema con el despliegue básico

**PASO 2: Verificar archivos disponibles**
- Visita `/api/debug` 
- Debe mostrar `css`, `js` en `directories`
- Debe mostrar `index.html`, `package.json` en `files`

**PASO 3: Si faltan archivos CSS/JS**
```bash
# En tu repositorio local, verifica:
git add css/styles.css js/app.js js/recipes-data.js
git commit -m "Add missing static files"
git push origin main
```

**PASO 4: Si los archivos existen pero dan 404**
- El problema está en el servidor de archivos estáticos
- Revisa los logs de Render para ver errores específicos

### 🚨 SOLUCIÓN DE EMERGENCIA
Si nada funciona, crea un nuevo despliegue:
1. Verifica que TODOS los archivos estén en tu repositorio
2. En Render: "Manual Deploy" → "Deploy latest commit"
3. Espera 5-10 minutos para el despliegue completo

## ✅ Archivos Verificados
Todos los archivos necesarios están presentes y listos para el despliegue.

## 📋 Pasos para Desplegar en Render

### 1. Preparación
- ✅ Todos los archivos están verificados
- ✅ Base de datos con 60 recetas cargada
- ✅ Servidor optimizado para producción con debugging
- ✅ Configuración de Render lista

### 2. Configuración en Render
Asegúrate de que tu servicio en Render tenga esta configuración:

**Build Command:** `npm install`
**Start Command:** `npm start`
**Environment:** `Node.js`
**Plan:** `Free`

**Variables de Entorno:**
- `NODE_ENV=production`
- `PORT` (automático por Render)

### 3. Archivos Clave
- `render.yaml` - Configuración de despliegue
- `package.json` - Dependencias y scripts
- `index.js` - Servidor principal optimizado CON DEBUGGING
- `index.html` - Frontend principal
- `css/styles.css` - Estilos (175KB)
- `js/app.js` - Aplicación frontend (400KB)
- `js/recipes-data.js` - Base de datos de recetas (60 recetas)
- `recipes-data.json` - Respaldo JSON de recetas

### 4. Funcionalidades Incluidas
- ✅ Servidor HTTP completo con archivos estáticos
- ✅ API REST para recetas (`/api/recipes`)
- ✅ Base de datos de 60 recetas profesionales
- ✅ Sistema de persistencia con archivos JSON
- ✅ Optimizaciones para producción
- ✅ **DEBUGGING DETALLADO** para identificar problemas
- ✅ Manejo de errores robusto
- ✅ Endpoint de debug: `/api/debug`

### 5. URLs Esperadas en Producción
- `/` - Página principal
- `/css/styles.css` - Estilos CSS
- `/js/app.js` - Aplicación JavaScript
- `/js/recipes-data.js` - Base de datos de recetas
- `/api/recipes` - API de recetas (GET/POST)
- `/api/health` - Health check
- `/api/debug` - **NUEVO**: Info de archivos disponibles

### 6. Debugging en Producción
El servidor incluye logging MUY detallado:
- ✅ Lista completa de archivos al iniciar
- ✅ Prueba de archivos críticos
- ✅ Logs de cada petición de archivo estático
- ✅ Información de rutas exactas
- ✅ Contenido de directorios cuando hay errores

### 7. Solución de Problemas Comunes

**Si aparece "Cargando recetas personalizadas...":**
- Visita `/api/recipes` directamente para verificar
- Revisa los logs del servidor en Render

**Si faltan estilos CSS (ERROR 404):**
- Visita `/api/debug` para ver archivos disponibles
- Verifica que `css/styles.css` esté en la lista
- Si no está, sube el archivo a tu repositorio

**Si no cargan las recetas:**
- El servidor carga automáticamente desde `recipes-data.json`
- Si no existe, carga desde `js/recipes-data.js`
- Fallback a 1 receta mínima si fallan ambos

**Errores 404 específicos:**
- El servidor ahora muestra la ruta exacta que busca
- Compara con los archivos disponibles en `/api/debug`
- Revisa que la estructura de carpetas sea correcta

## 🎯 Resultado Esperado
Una vez desplegado correctamente, deberías ver:
- ✅ Página principal con diseño completo
- ✅ 60 recetas cargadas automáticamente
- ✅ Funcionalidad completa de búsqueda y filtros
- ✅ Panel de administración funcional
- ✅ Sistema de favoritos y calificaciones

## 📞 Si Hay Problemas
1. **PRIMERO**: Visita `/api/debug` en tu URL de Render
2. Revisa los logs en el dashboard de Render (ahora MUY detallados)
3. Verifica que todos los archivos se hayan subido correctamente
4. Confirma que las variables de entorno estén configuradas
5. Usa `node test-render.js` para probar todos los endpoints

## 🆘 Comandos de Emergencia
Si nada funciona:
1. `node verify-files.js` - Verificar archivos localmente
2. `node test-render.js` - Probar el servidor desplegado
3. Visitar `/api/debug` - Ver archivos en el servidor