// Redirige www.familiahogarbetania.com y familiahogarbetania.pages.dev al dominio principal,
// para que Google vea una sola dirección de la web.
const PRINCIPAL = "familiahogarbetania.com";

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname === "www." + PRINCIPAL || url.hostname === "familiahogarbetania.pages.dev") {
    url.hostname = PRINCIPAL;
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
