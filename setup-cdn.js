#!/usr/bin/env node

// Script de configuración automática del CDN para RecetasWorld
// Uso: node setup-cdn.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🌐 Configurador CDN para RecetasWorld');
console.log('=====================================\n');

async function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setupCDN() {
    try {
        console.log('Este script te ayudará a configurar el CDN para tu aplicación.\n');

        // Detectar entorno
        const isGitRepo = fs.existsSync('.git');
        console.log(`📁 Repositorio Git: ${isGitRepo ? '✅ Detectado' : '❌ No encontrado'}`);

        // Preguntar por configuración básica
        const useStaticCDN = await question('¿Quieres habilitar CDN para imágenes estáticas? (s/n): ');
        const useUploadsCDN = await question('¿Quieres habilitar CDN para imágenes subidas por usuarios? (s/n): ');

        let staticConfig = {
            enabled: false,
            baseUrl: '',
            fallback: true
        };

        let uploadsConfig = {
            enabled: false,
            baseUrl: '',
            transformations: {
                thumbnail: 'w_300,h_200,c_fill,q_auto,f_auto',
                medium: 'w_600,h_400,c_fill,q_auto,f_auto',
                large: 'w_1200,h_800,c_fill,q_auto,f_auto'
            }
        };

        // Configurar CDN estático
        if (useStaticCDN.toLowerCase().startsWith('s')) {
            console.log('\n📦 Configurando CDN estático...');
            
            const cdnOption = await question(`
Opciones disponibles:
1. jsDelivr + GitHub (Gratis, fácil)
2. GitHub Pages (Gratis, requiere configuración)
3. Netlify/Vercel (Gratis, automático)
4. URL personalizada

Elige una opción (1-4): `);

            switch (cdnOption) {
                case '1':
                    if (isGitRepo) {
                        const repoUrl = await question('URL de tu repositorio GitHub (ej: usuario/repo): ');
                        const branch = await question('Rama principal (main/master) [main]: ') || 'main';
                        staticConfig.enabled = true;
                        staticConfig.baseUrl = `https://cdn.jsdelivr.net/gh/${repoUrl}@${branch}/`;
                        console.log('✅ jsDelivr configurado');
                    } else {
                        console.log('❌ Necesitas un repositorio Git para usar jsDelivr');
                    }
                    break;
                
                case '2':
                    const ghPagesUrl = await question('URL de GitHub Pages (ej: https://usuario.github.io/repo/): ');
                    staticConfig.enabled = true;
                    staticConfig.baseUrl = ghPagesUrl.endsWith('/') ? ghPagesUrl : ghPagesUrl + '/';
                    console.log('✅ GitHub Pages configurado');
                    break;
                
                case '3':
                    const deployUrl = await question('URL de tu deploy (ej: https://app.netlify.app/): ');
                    staticConfig.enabled = true;
                    staticConfig.baseUrl = deployUrl.endsWith('/') ? deployUrl : deployUrl + '/';
                    console.log('✅ Deploy URL configurada');
                    break;
                
                case '4':
                    const customUrl = await question('URL personalizada: ');
                    staticConfig.enabled = true;
                    staticConfig.baseUrl = customUrl.endsWith('/') ? customUrl : customUrl + '/';
                    console.log('✅ URL personalizada configurada');
                    break;
                
                default:
                    console.log('❌ Opción no válida, CDN estático deshabilitado');
            }
        }

        // Configurar CDN de uploads
        if (useUploadsCDN.toLowerCase().startsWith('s')) {
            console.log('\n📤 Configurando CDN para uploads...');
            
            const uploadOption = await question(`
Opciones disponibles:
1. Cloudinary (Gratis hasta 25GB, recomendado)
2. ImageKit (Gratis hasta 20GB)
3. URL personalizada
4. Mantener local (sin CDN)

Elige una opción (1-4): `);

            switch (uploadOption) {
                case '1':
                    const cloudName = await question('Tu Cloud Name de Cloudinary: ');
                    uploadsConfig.enabled = true;
                    uploadsConfig.baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload/`;
                    console.log('✅ Cloudinary configurado');
                    console.log('💡 Recuerda configurar tu upload preset en Cloudinary');
                    break;
                
                case '2':
                    const imagekitUrl = await question('Tu URL endpoint de ImageKit: ');
                    uploadsConfig.enabled = true;
                    uploadsConfig.baseUrl = imagekitUrl.endsWith('/') ? imagekitUrl : imagekitUrl + '/';
                    console.log('✅ ImageKit configurado');
                    break;
                
                case '3':
                    const customUploadUrl = await question('URL personalizada para uploads: ');
                    uploadsConfig.enabled = true;
                    uploadsConfig.baseUrl = customUploadUrl.endsWith('/') ? customUploadUrl : customUploadUrl + '/';
                    console.log('✅ URL personalizada configurada');
                    break;
                
                default:
                    console.log('📁 Uploads se mantendrán locales');
            }
        }

        // Configuraciones adicionales
        console.log('\n⚙️ Configuraciones adicionales...');
        const enableLazyLoading = await question('¿Habilitar lazy loading? (s/n) [s]: ') || 's';
        const enableWebP = await question('¿Habilitar soporte WebP? (s/n) [s]: ') || 's';
        const enableResponsive = await question('¿Habilitar imágenes responsive? (s/n) [s]: ') || 's';

        // Generar configuración
        const config = {
            staticCDN: staticConfig,
            uploadsCDN: uploadsConfig,
            lazyLoading: {
                enabled: enableLazyLoading.toLowerCase().startsWith('s'),
                threshold: '200px',
                placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhcmdhbmRvLi4uPC90ZXh0Pjwvc3ZnPg=='
            },
            webpSupport: {
                enabled: enableWebP.toLowerCase().startsWith('s'),
                fallback: true
            },
            responsiveImages: {
                enabled: enableResponsive.toLowerCase().startsWith('s'),
                breakpoints: {
                    mobile: 480,
                    tablet: 768,
                    desktop: 1200
                }
            },
            caching: {
                enabled: true,
                maxAge: 86400,
                staleWhileRevalidate: 3600
            },
            preload: {
                enabled: true,
                criticalImages: [
                    'img/default-recipe.svg',
                    'img/placeholder.svg'
                ]
            },
            fallbacks: {
                defaultImage: 'img/default-recipe.svg',
                errorImage: 'img/error-recipe.svg',
                loadingEmoji: '🍽️',
                retryAttempts: 3,
                retryDelay: 1000
            }
        };

        // Escribir archivo de configuración
        const configContent = `// Configuración CDN para RecetasWorld - Generado automáticamente
// Fecha: ${new Date().toLocaleString()}

const CDN_CONFIG = ${JSON.stringify(config, null, 4)};

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CDN_CONFIG;
} else {
    window.CDN_CONFIG = CDN_CONFIG;
}`;

        fs.writeFileSync('cdn-config.js', configContent);
        console.log('\n✅ Configuración guardada en cdn-config.js');

        // Crear backup de la configuración anterior si existe
        if (fs.existsSync('cdn-config.js.backup')) {
            console.log('📄 Backup anterior encontrado, se mantuvo');
        }

        // Mostrar resumen
        console.log('\n📊 Resumen de configuración:');
        console.log(`CDN Estático: ${staticConfig.enabled ? '✅ Habilitado' : '❌ Deshabilitado'}`);
        if (staticConfig.enabled) {
            console.log(`  URL: ${staticConfig.baseUrl}`);
        }
        console.log(`CDN Uploads: ${uploadsConfig.enabled ? '✅ Habilitado' : '❌ Deshabilitado'}`);
        if (uploadsConfig.enabled) {
            console.log(`  URL: ${uploadsConfig.baseUrl}`);
        }
        console.log(`Lazy Loading: ${config.lazyLoading.enabled ? '✅' : '❌'}`);
        console.log(`WebP Support: ${config.webpSupport.enabled ? '✅' : '❌'}`);
        console.log(`Responsive: ${config.responsiveImages.enabled ? '✅' : '❌'}`);

        // Próximos pasos
        console.log('\n🚀 Próximos pasos:');
        console.log('1. Reinicia tu servidor: node server.js');
        console.log('2. Abre http://localhost:8081/test-cdn.html para probar');
        console.log('3. Revisa CDN_SETUP.md para más información');
        
        if (staticConfig.enabled && staticConfig.baseUrl.includes('jsdelivr')) {
            console.log('4. Haz push a GitHub para que jsDelivr pueda servir tus archivos');
        }
        
        if (uploadsConfig.enabled && uploadsConfig.baseUrl.includes('cloudinary')) {
            console.log('4. Configura tu upload preset en Cloudinary dashboard');
        }

        console.log('\n🎉 ¡CDN configurado exitosamente!');

    } catch (error) {
        console.error('❌ Error durante la configuración:', error.message);
    } finally {
        rl.close();
    }
}

// Ejecutar configuración
setupCDN();