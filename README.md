# Familia Hogar Betania — web

Web de la **Asociación Hogar Betania** (asociación civil sin ánimo de lucro, CIF G26803205, La Casa del Marqués s/n, 16410 Horcajo de Santiago, Cuenca).

Es una web estática hecha a mano con HTML, CSS y un poco de JavaScript. No necesita programas, compilación ni base de datos: cada página es un archivo `.html` que se puede abrir y editar con cualquier editor de texto (o directamente en GitHub con el lápiz ✏️).

## Páginas

| Archivo | Página |
|---|---|
| `index.html` | Inicio (presentación de la familia, carisma, vídeo de dron) |
| `asociacion.html` | La asociación (quiénes somos, qué hacemos, la casa, datos legales) |
| `donde-estamos.html` | Dónde estamos (foto aérea y enlace a Google Maps) |
| `participa.html` | Participa (voluntario, amigos, benefactores) |
| `dona.html` | Cómo hacer una donación |
| `contacto.html` | Contáctanos (correo, WhatsApp, Instagram y formulario) |
| `privacidad.html` | Política de privacidad |
| `aviso-legal.html` | Aviso legal |

## Cómo cambiar cosas

- **Textos**: abre el `.html` de la página y cambia el texto entre las etiquetas (`<p>…</p>`, `<h2>…</h2>`).
- **Fotos**: están en `img/`. Para cambiar una foto, sube otra con **el mismo nombre** (por ejemplo `img/familia.jpg`). Conviene que pese menos de 400 KB (unos 1600 px de ancho).
- **Vídeo de la portada**: `video/finca-portada.mp4` (fragmento estabilizado de los vídeos de dron; mientras carga se ve `img/portada-video.jpg`) (máximo 25 MB; mejor menos de 8 MB).
- **Colores y tipografías**: al principio de `css/estilos.css`, en `:root`.
- **Menú y pie de página**: se repiten en todas las páginas. Si añades o quitas una sección del menú, cámbiala en cada `.html`.
- **Teléfono, correo, Instagram**: busca y reemplaza `679257317`, `familiahogarbetania@gmail.com` o `instagram.com/familiahogarbetania` en todos los archivos.

Al guardar los cambios en GitHub (rama `main`), Cloudflare publica la web automáticamente en uno o dos minutos.

## Formulario de contacto

El formulario se envía a `/api/contacto`, una pequeña función de la propia web (`functions/api/contacto.js`, Cloudflare Pages Functions). Así el navegador del visitante no depende de ningún servidor externo: algunos operadores españoles bloquean a ratos servicios alojados en Cloudflare (por ejemplo durante los partidos de LaLiga), y eso hacía fallar el envío directo a FormSubmit.

La función:
1. Guarda una copia de cada mensaje en la base de datos D1 `familiahogarbetania-mensajes` (tabla `mensajes`). Se puede consultar en Cloudflare → Storage & databases → D1 → familiahogarbetania-mensajes → Console, con `SELECT * FROM mensajes ORDER BY id DESC;`.
2. Lo reenvía por correo a `familiahogarbetania@gmail.com` mediante [Resend](https://resend.com) (gratuito hasta 3.000 correos al mes). Necesita la variable secreta `RESEND_API_KEY` en Cloudflare → Workers & Pages → familiahogarbetania → Settings → Variables and Secrets (entorno Production). La cuenta de Resend debe estar creada con `familiahogarbetania@gmail.com`: sin dominio propio, Resend solo deja enviar al correo del titular de la cuenta. La columna `correo_enviado` indica si el reenvío funcionó y `error` el motivo si no. Los mensajes que no se pudieron enviar se reenvían solos con el siguiente envío correcto.
   - Cuando se compre `familiahogarbetania.com`, se puede verificar el dominio en Resend y añadir la variable `CORREO_REMITENTE` (por ejemplo `Web Hogar Betania <web@familiahogarbetania.com>`).
3. Muestra `gracias.html` al visitante.

La configuración de la base de datos está en `wrangler.toml`.

## Publicación

- Código: GitHub (cuenta de fincalacasadelmarques@gmail.com).
- Alojamiento: Cloudflare Pages (proyecto `familiahogarbetania`), conectado al repositorio. Sin comando de compilación; carpeta de salida: `/`.
- Dirección provisional: https://familiahogarbetania.pages.dev. Cuando se compre `familiahogarbetania.com`, añádelo en Cloudflare (Workers & Pages → familiahogarbetania → Custom domains) y cambia `familiahogarbetania.pages.dev` por `familiahogarbetania.com` en los `.html`, `robots.txt` y `sitemap.xml`.

## Licencia

El código se publica con licencia MIT (ver `LICENSE`). Los textos, fotografías, vídeos y el logotipo pertenecen a la Asociación Hogar Betania y no están incluidos en esa licencia.
