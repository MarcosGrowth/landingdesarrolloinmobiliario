(function () {
  'use strict';

  const WA_NUMBER  = '5491125615082';
  const WA_MESSAGE = 'Hola! Quiero agendar mi diagnóstico gratuito para mi desarrollo inmobiliario.';
  const EMAIL      = 'equipomcmarketing@gmail.com';

  function buildMailtoURL(data) {
    const subject = encodeURIComponent('Diagnóstico Gratuito — ' + data.nombre + ' ' + data.apellido);
    const body    = encodeURIComponent(
      'Nombre: ' + data.nombre + ' ' + data.apellido + '\n' +
      'WhatsApp: ' + data.whatsapp + '\n' +
      'Email: ' + data.email + '\n' +
      'Desarrollo: ' + data.desarrollo + '\n' +
      'Unidades: ' + data.unidades
    );
    return 'mailto:' + EMAIL + '?subject=' + subject + '&body=' + body;
  }

  function buildWaURL(data) {
    const msg = encodeURIComponent(
      'Hola! Me llamo ' + data.nombre + ' ' + data.apellido +
      ' y quiero agendar mi diagnóstico gratuito para mi desarrollo "' + data.desarrollo + '".'
    );
    return 'https://wa.me/' + WA_NUMBER + '?text=' + msg;
  }

  const form = document.getElementById('diag-form');
  if (!form) return;

  const submitBtn = form.querySelector('.form-submit');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const data = {
      nombre:    form.querySelector('[name="nombre"]').value.trim(),
      apellido:  form.querySelector('[name="apellido"]').value.trim(),
      whatsapp:  form.querySelector('[name="whatsapp"]').value.trim(),
      email:     form.querySelector('[name="email"]').value.trim(),
      desarrollo:form.querySelector('[name="desarrollo"]').value.trim(),
      unidades:  form.querySelector('[name="unidades"]').value,
    };

    window.location.href = buildMailtoURL(data);

    if (submitBtn) {
      submitBtn.textContent = '✓ ¡Listo! Te contactamos pronto';
      submitBtn.classList.add('btn-success');
      submitBtn.disabled = true;
    }

    setTimeout(() => {
      window.open(buildWaURL(data), '_blank');
    }, 1500);
  });

  document.querySelectorAll('.wa-link').forEach(link => {
    link.addEventListener('click', function (e) {
      if (link.getAttribute('href') && link.getAttribute('href').startsWith('https://wa.me')) return;
      e.preventDefault();
      const msg = encodeURIComponent(WA_MESSAGE);
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + msg, '_blank');
    });
  });
})();
