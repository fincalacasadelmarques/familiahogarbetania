/*
 * Formulario de contacto de Familia Hogar Betania.
 *
 * El formulario se envía a esta función, que vive en la misma web
 * (/api/contacto). Así el navegador del visitante nunca se conecta a un
 * servidor de terceros (algunos operadores españoles bloquean a ratos
 * servicios externos como formsubmit.co).
 *
 * La función:
 *   1. Guarda una copia del mensaje en la base de datos D1 (tabla "mensajes").
 *   2. Lo reenvía por correo a la asociación con Resend (resend.com), usando
 *      la clave guardada en Cloudflare como variable secreta RESEND_API_KEY.
 *      Si la clave no está configurada, el mensaje queda guardado en D1 y se
 *      reenvía automáticamente en cuanto el correo vuelva a funcionar.
 *   3. Redirige al visitante a /gracias.html.
 */

const DESTINO = "familiahogarbetania@gmail.com";

const limpiar = (v, max) => String(v || "").trim().slice(0, max);

export async function onRequestPost({ request, env }) {
  let datos;
  try {
    datos = await request.formData();
  } catch {
    return redirigir(request, "/contacto.html?error=1");
  }

  // Trampa para robots: este campo está oculto y las personas lo dejan vacío
  if (limpiar(datos.get("_honey"), 100)) return redirigir(request, "/gracias.html");

  const m = {
    nombre: limpiar(datos.get("nombre"), 120),
    email: limpiar(datos.get("email"), 160),
    telefono: limpiar(datos.get("telefono"), 40),
    motivo: limpiar(datos.get("motivo"), 60),
    mensaje: limpiar(datos.get("mensaje"), 5000),
  };
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email);
  if (!m.nombre || !emailValido || !m.mensaje || !datos.get("acepta_privacidad")) {
    return redirigir(request, "/contacto.html?error=1");
  }

  // 1. Guardar copia
  let id = null;
  if (env.DB) {
    try {
      const r = await env.DB.prepare(
        "INSERT INTO mensajes (nombre, email, telefono, motivo, mensaje) VALUES (?, ?, ?, ?, ?)"
      ).bind(m.nombre, m.email, m.telefono, m.motivo, m.mensaje).run();
      id = r.meta && r.meta.last_row_id;
    } catch (e) {
      console.log("Error guardando en D1", e);
    }
  }

  // 2. Reenviar por correo
  const { enviado, error } = await enviarCorreo(m, env);
  await marcar(env, id, enviado, error);

  // Si el correo funciona, reenviar también los mensajes anteriores que se quedaron sin enviar
  if (enviado === "sí" && env.DB) {
    try {
      const { results } = await env.DB.prepare(
        "SELECT * FROM mensajes WHERE correo_enviado = 'no' AND id != ? ORDER BY id LIMIT 5"
      ).bind(id || 0).all();
      for (const p of results || []) {
        const r = await enviarCorreo(p, env, p.fecha);
        await marcar(env, p.id, r.enviado, r.error);
      }
    } catch (e) {
      console.log("Error reenviando pendientes", e);
    }
  }

  // Si no se pudo guardar ni enviar, avisar al visitante para que use otra vía
  if (!id && enviado !== "sí") return redirigir(request, "/contacto.html?error=1");
  return redirigir(request, "/gracias.html");
}

function redirigir(request, ruta) {
  return Response.redirect(new URL(ruta, request.url).toString(), 303);
}

async function marcar(env, id, enviado, error) {
  if (!env.DB || !id) return;
  try {
    await env.DB.prepare("UPDATE mensajes SET correo_enviado = ?, error = ? WHERE id = ?")
      .bind(enviado, error, id).run();
  } catch {}
}

const esc = (t) => String(t || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function enviarCorreo(m, env, fecha) {
  if (!env.RESEND_API_KEY) return { enviado: "no", error: "Falta la variable RESEND_API_KEY en Cloudflare" };

  const filas = [
    ["Nombre", m.nombre], ["Correo", m.email], ["Teléfono", m.telefono || "-"],
    ["Motivo", m.motivo || "-"], ["Mensaje", m.mensaje],
  ];
  if (fecha) filas.push(["Recibido (UTC)", fecha]);
  const html = `<p>Nuevo mensaje desde el formulario de la web de Hogar Betania:</p>
<table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif">${filas.map(([k, v]) =>
    `<tr><th align="left" valign="top" style="background:#E4E9E1">${k}</th><td style="white-space:pre-wrap">${esc(v)}</td></tr>`).join("")}</table>
<p>Para contestar, pulsa «Responder»: la respuesta irá a ${esc(m.email)}.</p>`;
  const texto = filas.map(([k, v]) => `${k}: ${v}`).join("\n");

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.CORREO_REMITENTE || "Web Hogar Betania <onboarding@resend.dev>",
        to: [env.CORREO_DESTINO || DESTINO],
        reply_to: m.email,
        subject: `Web Hogar Betania: ${m.motivo || "mensaje"} de ${m.nombre}`,
        html, text: texto,
      }),
    });
    if (r.ok) return { enviado: "sí", error: null };
    return { enviado: "no", error: `${r.status} ${(await r.text()).slice(0, 300)}` };
  } catch (e) {
    return { enviado: "no", error: String(e).slice(0, 300) };
  }
}

// Comprobación rápida: abrir /api/contacto en el navegador dice si el correo está configurado
export async function onRequestGet({ env }) {
  const ok = Boolean(env.RESEND_API_KEY);
  const db = Boolean(env.DB);
  const texto = ok
    ? "Correo configurado correctamente (la clave RESEND_API_KEY está disponible)."
    : "Falta la clave RESEND_API_KEY: revisa Cloudflare → Workers & Pages → familiahogarbetania → Settings → Variables and Secrets (entorno Production) y vuelve a desplegar.";
  return new Response(`${texto}\nBase de datos: ${db ? "conectada" : "NO conectada"}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
