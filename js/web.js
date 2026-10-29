/* Familia Hogar Betania — pequeño JavaScript de la web (sin dependencias) */

// Menú en móvil
(function () {
  var boton = document.querySelector('.abrir-menu');
  var menu = document.getElementById('menu');
  if (!boton || !menu) return;
  boton.addEventListener('click', function () {
    var abierto = menu.classList.toggle('abierto');
    boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  });
})();

// Vídeo de la portada: botón de pausa y respeto a "reducir movimiento"
(function () {
  var video = document.querySelector('.portada video');
  var boton = document.querySelector('.pausar-video');
  if (!video || !boton) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.removeAttribute('autoplay');
    video.pause();
    boton.textContent = 'Reproducir vídeo';
  }
  boton.addEventListener('click', function () {
    if (video.paused) { video.play(); boton.textContent = 'Pausar vídeo'; }
    else { video.pause(); boton.textContent = 'Reproducir vídeo'; }
  });
})();

// Año actual en el pie
document.querySelectorAll('[data-anio]').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

// Formulario de contacto (se envía con FormSubmit al correo de la asociación)
(function () {
  var form = document.querySelector('form.formulario');
  if (!form) return;

  // Preseleccionar el motivo si se llega desde "Participa" o "Dona" (?motivo=...)
  var motivo = new URLSearchParams(location.search).get('motivo');
  var select = form.querySelector('select[name="motivo"]');
  if (motivo && select) {
    Array.prototype.forEach.call(select.options, function (o) {
      if (o.value === motivo) select.value = motivo;
    });
  }

  // Mostrar aviso si el envío anterior falló (?error=1)
  if (new URLSearchParams(location.search).get('error')) {
    var aviso = document.getElementById('aviso-error');
    if (aviso) aviso.hidden = false;
  }

  // Envío normal del formulario a /api/contacto (que redirige a gracias.html)
  form.addEventListener('submit', function () {
    var boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;
    boton.textContent = 'Enviando…';
  });
  // Si se vuelve atrás con el navegador, reactivar el botón
  window.addEventListener('pageshow', function () {
    var boton = form.querySelector('button[type="submit"]');
    boton.disabled = false;
    boton.textContent = 'Enviar mensaje';
  });
})();
