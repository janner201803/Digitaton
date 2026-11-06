# Digitaton — aplicación de formación

Aplicación web de formación construida con Angular. El código de la aplicación y su configuración de despliegue están en `appFormacion/`.

## Requisitos

- Node.js 20.19 o superior (o 22.12 o superior), requerido por Angular 21.
- npm 11 (la versión usada para generar el lockfile es npm 11.6.2).
- Una cuenta de Netlify para alojar el sitio.
- Un proyecto de Supabase configurado para la autenticación y los datos de la aplicación.

No hace falta instalar Angular CLI globalmente: está incluido como dependencia del proyecto y se ejecuta mediante los scripts de npm.

## Instalar y ejecutar localmente

Desde la raíz del repositorio:

```bash
cd appFormacion
npm ci
npm start
```

El servidor de desarrollo de Angular estará disponible en `http://localhost:4200/`.

## Dependencias principales

Las versiones exactas y transitivas están fijadas en `appFormacion/package-lock.json`. Para conservar instalaciones reproducibles, usa `npm ci`.

| Paquete | Uso |
| --- | --- |
| `@angular/*` 21 | Framework, enrutamiento, formularios y compilación |
| `@supabase/supabase-js` | Autenticación y conexión con Supabase |
| `rxjs` | Flujos reactivos usados por Angular |
| `jspdf` y `jspdf-autotable` | Generación de documentos PDF y tablas |
| `typescript` | Lenguaje y compilación de la aplicación |
| `@angular/cli`, `@angular/build` | Comandos de desarrollo y build |
| `vitest`, `jsdom` | Infraestructura de pruebas |
| `prettier` | Formateo de código |

## Generar el build de producción

Netlify debe ejecutar estos comandos desde la raíz del repositorio:

```bash
cd appFormacion && npm ci && npm run build
```

Configura el directorio de publicación de Netlify como:

```text
appFormacion/dist/browser
```

Angular usa el builder `@angular/build:application` y tiene `production` como configuración predeterminada del build. Por tanto, `npm run build` genera el bundle optimizado en esa ruta. Si ejecutas los comandos con `appFormacion` como directorio base de Netlify, usa `npm ci` como comando de instalación, `npm run build` como comando de build y `dist/browser` como directorio de publicación.

El archivo `appFormacion/public/_redirects` incluye la regla de fallback de Netlify para que las rutas de la aplicación Angular funcionen al abrirlas directamente.

## Despliegue en Netlify

1. Importa el repositorio en Netlify y selecciona la rama que quieras desplegar.
2. Define los comandos y la carpeta de publicación como se indica arriba. La opción más simple es dejar la raíz del repositorio como directorio base y usar `appFormacion/dist/browser` como publicación.
3. Inicia el despliegue. Netlify instalará las dependencias desde `package-lock.json`, ejecutará el build y publicará su contenido.
4. Para validar la salida localmente antes de desplegar, ejecuta `npm run build` desde `appFormacion` y comprueba que exista `appFormacion/dist/browser/index.html`.

## Supabase y configuración

La URL del proyecto y la clave publicable de Supabase se configuran en `appFormacion/src/enviroments/enviroment.ts`. La clave `sb_publishable_...` está destinada a uso desde el cliente; los permisos deben protegerse con políticas RLS en Supabase. Nunca incluyas una clave `service_role` o secretos del servidor en una aplicación frontend.

Si cambias el proyecto de Supabase, actualiza esos valores y vuelve a generar el build antes de desplegar. Angular compila estos valores en los archivos del navegador, así que no deben considerarse secretos.

## Scripts disponibles

Desde `appFormacion/`:

| Comando | Acción |
| --- | --- |
| `npm start` | Inicia el servidor local de desarrollo |
| `npm run build` | Genera el build de producción en `dist/browser` |
| `npm run watch` | Compila en modo desarrollo y observa cambios |
| `npm test` | Ejecuta las pruebas configuradas con Angular y Vitest |
