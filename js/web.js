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

// Galería ampliable: al pulsar una foto se ve en grande; flechas, teclado y deslizar para pasar
(function () {
  var grupos = [document.querySelectorAll('.galeria img'), document.querySelectorAll('.foto-aerea img')];
  grupos = grupos.filter(function (g) { return g.length; });
  if (!grupos.length) return;

  var visor = document.createElement('div');
  visor.className = 'visor';
  visor.setAttribute('role', 'dialog');
  visor.setAttribute('aria-modal', 'true');
  visor.setAttribute('aria-label', 'Foto ampliada');
  visor.innerHTML = '<img alt=""><p></p>' +
    '<button class="cerrar" type="button" aria-label="Cerrar">&times;</button>' +
    '<button class="anterior" type="button" aria-label="Foto anterior">&#8249;</button>' +
    '<button class="siguiente" type="button" aria-label="Foto siguiente">&#8250;</button>';
  document.body.appendChild(visor);
  var foto = visor.querySelector('img'), pie = visor.querySelector('p');
  var actual = [], i = 0, origen = null;

  function mostrar() {
    var img = actual[i];
    foto.src = img.currentSrc || img.src;
    foto.alt = img.alt;
    pie.textContent = img.alt + (actual.length > 1 ? '  (' + (i + 1) + ' de ' + actual.length + ')' : '');
    visor.querySelector('.anterior').hidden = visor.querySelector('.siguiente').hidden = actual.length < 2;
  }
  function abrir(lista, n) {
    actual = lista; i = n; origen = document.activeElement;
    mostrar(); visor.classList.add('abierto'); document.body.classList.add('sin-scroll');
    visor.querySelector('.cerrar').focus();
  }
  function cerrar() {
    visor.classList.remove('abierto'); document.body.classList.remove('sin-scroll');
    if (origen) origen.focus();
  }
  function mover(d) { i = (i + d + actual.length) % actual.length; mostrar(); }

  grupos.forEach(function (g) {
    var lista = Array.prototype.slice.call(g);
    lista.forEach(function (img, n) {
      img.classList.add('ampliable');
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Ampliar foto: ' + img.alt);
      img.addEventListener('click', function () { abrir(lista, n); });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(lista, n); }
      });
    });
  });

  visor.querySelector('.cerrar').addEventListener('click', cerrar);
  visor.querySelector('.anterior').addEventListener('click', function () { mover(-1); });
  visor.querySelector('.siguiente').addEventListener('click', function () { mover(1); });
  visor.addEventListener('click', function (e) { if (e.target === visor) cerrar(); });
  document.addEventListener('keydown', function (e) {
    if (!visor.classList.contains('abierto')) return;
    if (e.key === 'Escape') cerrar();
    else if (e.key === 'ArrowLeft') mover(-1);
    else if (e.key === 'ArrowRight') mover(1);
    else if (e.key === 'Tab') {
      var b = Array.prototype.filter.call(visor.querySelectorAll('button'), function (x) { return !x.hidden; });
      var k = b.indexOf(document.activeElement);
      e.preventDefault();
      b[(k + (e.shiftKey ? -1 : 1) + b.length) % b.length].focus();
    }
  });
  var x0 = null;
  visor.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  visor.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50 && actual.length > 1) mover(dx < 0 ? 1 : -1);
    x0 = null;
  });
})();
