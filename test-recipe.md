# Prueba del Sistema de Recetas

## Instrucciones para probar el sistema

### 1. Iniciar el servidor
```bash
npm start
```

### 2. Abrir el navegador
Ir a: http://localhost:8081

### 3. Iniciar sesión como administrador
- Usuario: admin
- Contraseña: admin123
- Rol: Administrador
- Clave maestra: (revisar archivo data/admin-key.txt)

### 4. Probar agregar una receta

#### Datos de prueba:
- **Nombre**: Tacos de Pollo al Chipotle
- **País**: México
- **Tiempo**: 25 minutos
- **Categorías**: Seleccionar "Comidas" y "Rápidas"
- **Ingredientes** (uno por línea):
```
Pechuga de pollo
Tortillas de maíz
Chiles chipotle
Cebolla morada
Cilantro fresco
Limón
Sal y pimienta
```

- **Instrucciones** (una por línea):
```
Cortar el pollo en tiras pequeñas
Sazonar con sal y pimienta
Cocinar el pollo en sartén caliente
Agregar chiles chipotle picados
Calentar las tortillas
Servir el pollo en las tortillas
Decorar con cebolla y cilantro
Acompañar con limón
```

- **Imagen**: Subir cualquier imagen JPG o PNG (máximo 5MB)

### 5. Verificar que se guardó correctamente

#### En la interfaz:
- La receta debe aparecer en la lista de recetas del admin
- Debe mostrarse en la página principal
- La imagen debe visualizarse correctamente

#### En la base de datos:
- Verificar que se creó el archivo de imagen en `img/uploads/`
- Los datos deben estar guardados en la base de datos SQLite

### 6. Probar edición de receta
- Hacer clic en "Editar" en la receta creada
- Modificar algún campo
- Verificar que los cambios se guarden

### 7. Verificar manejo de errores
- Intentar subir una imagen muy grande (>5MB)
- Intentar subir un archivo que no sea imagen
- Dejar campos requeridos vacíos

## Problemas solucionados

✅ **Validación de imágenes**: Se valida tipo y tamaño antes de procesar
✅ **Manejo de errores**: Mensajes claros para el usuario
✅ **Preview de imagen**: Se muestra vista previa al seleccionar archivo
✅ **Guardado en BD**: Datos e imágenes se guardan correctamente
✅ **Logs del servidor**: Se muestran mensajes informativos en consola
✅ **Fallback local**: Si falla la API, se guarda localmente
✅ **Limpieza de formulario**: Se resetea después de guardar
✅ **Validación de campos**: Se requieren campos obligatorios

## Archivos modificados

1. **server.js**: Mejorado manejo de imágenes y validaciones
2. **js/app.js**: Mejorada función adminAddRecipe con validaciones
3. **js/app.js**: Agregados event listeners para preview de imágenes

## Notas técnicas

- Las imágenes se convierten a base64 en el frontend
- Se guardan como archivos físicos en `img/uploads/`
- La ruta se almacena en la base de datos
- Se valida tipo MIME y tamaño de archivo
- Se generan nombres únicos para evitar conflictos