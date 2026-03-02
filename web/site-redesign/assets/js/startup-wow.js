(function () {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function animateCounter(node) {
    if (node.dataset.counted === '1') return;
    node.dataset.counted = '1';

    var raw = node.dataset.count || '0';
    var target = Number(raw);
    var prefix = node.dataset.prefix || '';
    var suffix = node.dataset.suffix || '';
    var decimals = raw.indexOf('.') >= 0 ? raw.split('.')[1].length : 0;

    if (!Number.isFinite(target)) {
      node.textContent = prefix + raw + suffix;
      return;
    }

    if (reducedMotion) {
      node.textContent = prefix + target.toFixed(decimals) + suffix;
      return;
    }

    var start = performance.now();
    var duration = Number(node.dataset.duration) || 1200;

    function tick(now) {
      var progress = clamp((now - start) / duration, 0, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = target * eased;
      node.textContent = prefix + current.toFixed(decimals) + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  function initCounters() {
    var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
    if (counters.length === 0) return;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.35, rootMargin: '0px 0px -8% 0px' }
      );

      counters.forEach(function (counter) {
        observer.observe(counter);
      });
      return;
    }

    counters.forEach(function (counter) {
      animateCounter(counter);
    });
  }

  initCounters();
})();
