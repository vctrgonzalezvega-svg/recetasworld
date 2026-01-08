// Script para verificar si el backend está configurado correctamente
class BackendChecker {
    constructor() {
        this.frontendUrl = 'https://recetasworld.netlify.app';
        this.possibleBackends = [
            'https://recetasworld.railway.app',
            'https://recetasworld.onrender.com',
            'https://recetasworld.herokuapp.com'
        ];
        this.init();
    }

    init() {
        console.log('🔍 Verificando configuración de backend...');
        this.checkCurrentSetup();
    }

    async checkCurrentSetup() {
        // Verificar si estamos en Netlify
        if (window.location.hostname.includes('netlify.app')) {
            console.log('✅ Frontend detectado en Netlify');
            await this.checkBackendConnection();
        } else if (window.location.hostname === 'localhost') {
            console.log('✅ Desarrollo local detectado');
            await this.checkLocalBackend();
        } else {
            console.log('✅ Servidor completo detectado');
            await this.checkSameOriginBackend();
        }
    }

    async checkBackendConnection() {
        console.log('🔍 Verificando conexión con backend...');
        
        // Obtener la URL del backend configurada
        const app = new RecipesApp();
        const backendUrl = app.getApiBase();
        
        console.log(`🔗 Backend configurado: ${backendUrl}`);
        
        if (backendUrl.includes('tu-backend')) {
            console.error('❌ BACKEND NO CONFIGURADO');
            this.showBackendSetupInstructions();
            return;
        }

        try {
            const response = await fetch(`${backendUrl.replace('/api', '')}/api/recipes`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Backend conectado correctamente');
                console.log(`📊 Recetas disponibles: ${data.recetas?.length || 0}`);
                this.showSuccessMessage();
            } else {
                console.error('❌ Backend responde pero con error:', response.status);
                this.showBackendErrorInstructions(response.status);
            }
        } catch (error) {
            console.error('❌ No se puede conectar al backend:', error);
            this.showBackendSetupInstructions();
        }
    }

    async checkLocalBackend() {
        try {
            const response = await fetch('http://localhost:8081/api/recipes');
            if (response.ok) {
                console.log('✅ Servidor local funcionando correctamente');
            } else {
                console.error('❌ Servidor local con problemas');
            }
        } catch (error) {
            console.error('❌ Servidor local no disponible. Ejecuta: npm start');
        }
    }

    async checkSameOriginBackend() {
        try {
            const response = await fetch('/api/recipes');
            if (response.ok) {
                console.log('✅ Backend en el mismo servidor funcionando');
            } else {
                console.error('❌ Backend en el mismo servidor con problemas');
            }
        } catch (error) {
            console.error('❌ Backend no disponible en el mismo servidor');
        }
    }

    showBackendSetupInstructions() {
        const instructions = `
🚨 BACKEND NO CONFIGURADO

Tu frontend está en Netlify pero necesitas un backend separado.

📋 PASOS PARA CONFIGURAR:

1. 🚀 Crear backend en Railway:
   • Ve a https://railway.app
   • Conecta tu repositorio GitHub
   • Deploy automático

2. 🔧 Actualizar configuración:
   • Copia la URL de Railway
   • Actualiza js/app.js línea ~45
   • Cambia 'tu-backend.railway.app' por tu URL real

3. 🔄 Redesplegar:
   • git add .
   • git commit -m "Configurar backend"
   • git push origin main

4. ✅ Verificar:
   • Netlify se actualiza automáticamente
   • Prueba crear/editar recetas

💡 ALTERNATIVA FÁCIL:
Mover todo a Railway para tener frontend + backend juntos.
        `;
        
        console.log(instructions);
        
        // Mostrar en la página también
        this.showInPageMessage('error', instructions);
    }

    showBackendErrorInstructions(status) {
        const message = `
⚠️ BACKEND CONECTADO PERO CON ERRORES

Status: ${status}

🔧 POSIBLES SOLUCIONES:
• Verificar que el servidor esté ejecutándose
• Revisar logs en Railway/Render
• Verificar configuración CORS
• Verificar base de datos

🔍 DEBUGGING:
• Abre las herramientas de desarrollador
• Ve a la pestaña Network
• Intenta crear una receta
• Revisa los errores de API
        `;
        
        console.log(message);
        this.showInPageMessage('warning', message);
    }

    showSuccessMessage() {
        const message = `
✅ CONFIGURACIÓN CORRECTA

• Frontend: Netlify
• Backend: Conectado y funcionando
• Base de datos: Operativa
• APIs: Respondiendo correctamente

🎉 Tu aplicación está lista para usar!
        `;
        
        console.log(message);
        this.showInPageMessage('success', message);
    }

    showInPageMessage(type, message) {
        // Crear elemento de notificación en la página
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 400px;
            padding: 20px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            white-space: pre-line;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            ${type === 'error' ? 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' : ''}
            ${type === 'warning' ? 'background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;' : ''}
            ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : ''}
        `;
        
        notification.innerHTML = `
            <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 16px; cursor: pointer;">&times;</button>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove después de 30 segundos para mensajes de éxito
        if (type === 'success') {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 30000);
        }
    }
}

// Ejecutar verificación cuando la página cargue
window.addEventListener('DOMContentLoaded', () => {
    // Esperar un poco para que RecipesApp se inicialice
    setTimeout(() => {
        new BackendChecker();
    }, 2000);
});

// Comando manual para verificar
window.checkBackend = () => {
    new BackendChecker();
};