# GLC – Guadalajara Lancer Club (versión React / Next.js para Vercel)

Stack: **Next.js 16 (React 19)** · **Postgres (Neon)** · **Vercel Blob** (fotos y videos) · **Nodemailer** (Gmail SMTP).
Reemplaza la versión PHP + SQLite, que no funciona en Vercel porque Vercel no guarda archivos entre peticiones.

## Estructura
| Ruta | Función |
|---|---|
| `app/actions.js` | Todas las acciones (login, registro, subir, borrar, admin…). Equivale al bloque POST de `index.php` |
| `app/*/page.js` | Una página por sección: inicio, directiva, eventos, miembros, multimedia, ventas, admin, cuenta |
| `app/layout.js` + `app/globals.css` | Cabecera, tema personalizable, avisos y pie con redes |
| `app/api/upload/route.js` | Autoriza las subidas directas del navegador a Vercel Blob |
| `lib/` | Núcleo: BD, sesión, permisos, correo, 2FA, archivos (equivale a `core.php`) |
| `components/` | Lightbox, animaciones, formulario de subida con progreso, paginación |
| `scripts/` | Generar hash del super admin, crear tablas, probar correo |

## Publicar en Vercel
1. Sube esta carpeta a un repositorio de GitHub (el `.gitignore` ya excluye `.env.local` y `node_modules`).
2. En vercel.com → **Add New → Project** → importa el repositorio. Vercel detecta Next.js solo.
3. En el proyecto → **Storage**:
   - **Create Database → Neon (Postgres)** y conéctala al proyecto. Crea `DATABASE_URL`.
   - **Create → Blob** y conéctalo al proyecto. Crea `BLOB_READ_WRITE_TOKEN`.
4. En **Settings → Environment Variables** agrega:

| Variable | Valor |
|---|---|
| `SESSION_SECRET` | 32+ caracteres aleatorios (`openssl rand -base64 48`) |
| `SUPER_EMAIL` | correo del super admin, en minúsculas (ej. `super@glc.local`) |
| `SUPER_HASH_B64` | sale de `npm run hash -- 'TuContrasenaSegura123'` |
| `SMTP_USER` | tu Gmail completo |
| `SMTP_PASS` | **contraseña de aplicación** de Google (16 letras), nunca tu contraseña normal |
| `SMTP_NAME` | `Guadalajara Lancer Club` |
| `SITE_URL` | `https://tu-proyecto.vercel.app` (sin `/` final) |
| `DEBUG_MAIL` | `false` |

5. **Deployments → Redeploy** para que tome las variables. Las tablas se crean solas en la primera visita.
6. Entra en `/login` con `SUPER_EMAIL` y tu contraseña, y asigna roles en ⚙ Admin.

## Probar en local
```bash
npm install
cp .env.example .env.local      # y llena los valores
npm run dev                      # http://localhost:3000
```
Necesitas una base Postgres (puedes usar la misma de Neon, o una local) y el `BLOB_READ_WRITE_TOKEN` de Vercel para subir archivos.
Con `DEBUG_MAIL=true` los códigos de verificación aparecen en pantalla y en la consola, sin necesidad de correo.

## Scripts
- `npm run hash -- 'Contrasena'` → genera `SUPER_HASH_B64`.
- `npm run db:setup` → crea las tablas manualmente (opcional).
- `npm run mail:test -- tucorreo@gmail.com` → prueba la configuración SMTP.

## Correo (Gmail)
Activa la verificación en 2 pasos en tu cuenta de Google, crea una contraseña de aplicación en
https://myaccount.google.com/apppasswords y ponla en `SMTP_PASS`. Si `SMTP_USER`/`SMTP_PASS` faltan, los correos no se envían (se registra un aviso en los logs de Vercel).

## Super administrador
No se registra, no aparece en Miembros, Directiva ni en el panel, y nadie puede borrarlo ni degradarlo desde la web.
Para cambiar su contraseña genera un hash nuevo, actualiza `SUPER_HASH_B64` en Vercel y vuelve a desplegar.
Si dejas `SUPER_EMAIL` vacío, el primer usuario que verifique su correo se vuelve Administrador y Líder.

## Permisos
| Acción | Miembro | Admin | Super admin |
|---|---|---|---|
| Subir fotos/videos, comentar, vender | ✔ | ✔ | ✔ |
| Aceptar/rechazar solicitudes, eliminar miembros (no admins) y productos | | ✔ | ✔ |
| Crear y eliminar eventos | | ✔ | ✔ |
| Personalizar página de miembro | solo la suya | cualquiera | cualquiera |
| Eliminar administradores, fotos/videos de otros | | | ✔ |
| Roles, textos, colores, fondo, imágenes del sitio | | | ✔ |

## Límites y costos
Fotos hasta 8 MB, videos MP4/WebM hasta 100 MB (`lib/limits.js`). Los archivos suben directo del navegador a Blob,
así que no aplica el límite de 4.5 MB de las funciones de Vercel. Revisa las cuotas del plan gratuito de Vercel Blob y Neon
si el club sube muchos videos.

## Seguridad implementada
Contraseñas con bcrypt · códigos de verificación hasheados (10 min, 5 intentos) · límite de intentos de login, 2FA y recuperación ·
sesión en cookie firmada HttpOnly/SameSite/Secure que se invalida al cambiar la contraseña · protección CSRF de Server Actions ·
consultas parametrizadas · salida escapada por React · CSP y cabeceras de seguridad · subidas limitadas por tipo, tamaño y carpeta
del usuario · permisos validados en el servidor · mensajes genéricos (no revelan si un correo existe) · credenciales solo en variables de entorno.

## Animaciones
| Dónde | Qué hace | Archivo |
|---|---|---|
| Miembros y Multimedia | La foto del Lancer y el avatar "vuelan" de la tarjeta a la página de detalle (y de regreso) | `components/Page.js` (`Morph`) |
| Entre páginas | Deslizamiento hacia adelante al entrar a un detalle, hacia atrás al volver, fundido entre secciones del menú; la cabecera queda fija | `components/Page.js`, `app/globals.css` |
| Menú | Pastilla que se desliza a la sección activa; en celular botón ☰ con panel animado | `components/SiteHeader.js` |
| Tarjetas | Inclinación 3D con brillo que sigue al cursor (solo con mouse) | `components/CardFx.js` |
| Lightbox | La foto crece desde su miniatura, se desliza entre imágenes, deslizar con el dedo en celular | `components/Lightbox.js` |
| Paneles y avisos | "+ Crear evento", "+ Subir"... se despliegan suave; los avisos de éxito muestran barra de tiempo | `app/globals.css` |

Todo respeta la opción "reducir movimiento" del sistema. Las transiciones entre páginas usan la View Transitions API:
en Chrome, Edge y Safari recientes se ven completas; en navegadores sin soporte el sitio funciona igual, sin animar.
Para que una tarjeta nueva no se incline, pon la clase `no-tilt` en su `.grid`.

## Cambios respecto a la versión PHP
- Corregido: cambiar roles no funcionaba (la línea que leía `id` y `role` estaba comentada por error).
- Las sesiones abiertas se cierran al cambiar la contraseña.
- Las fechas de eventos usan la hora de Guadalajara.
- Barra de progreso al subir archivos.
