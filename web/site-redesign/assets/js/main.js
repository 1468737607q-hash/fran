(function () {
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');

  if (navToggle && header && nav) {
    navToggle.addEventListener('click', function () {
      const opened = header.classList.toggle('menu-open');
      navToggle.setAttribute('aria-expanded', String(opened));
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove('menu-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const routeMap = {
    'index.html': 'home',
    '': 'home',
    'products.html': 'products',
    'capabilities.html': 'capabilities',
    'about.html': 'about',
    'contact.html': 'contact'
  };

  const path = window.location.pathname.split('/').pop();
  const current = routeMap[path] || 'home';
  document.querySelectorAll('.site-nav a[data-nav]').forEach(function (link) {
    if (link.dataset.nav === current) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  const yearNode = document.querySelector('[data-current-year]');
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealItems.length > 0) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealItems.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealItems.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  const filterButtons = document.querySelectorAll('[data-filter-btn]');
  const productCards = document.querySelectorAll('[data-family]');

  if (filterButtons.length > 0 && productCards.length > 0) {
    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const selected = btn.getAttribute('data-filter-btn');

        filterButtons.forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');

        productCards.forEach(function (card) {
          const family = card.getAttribute('data-family');
          if (selected === 'all' || selected === family) {
            card.classList.remove('hide');
          } else {
            card.classList.add('hide');
          }
        });
      });
    });
  }

  const rfqForm = document.querySelector('[data-rfq-form]');
  const rfqNotice = document.querySelector('[data-rfq-notice]');

  if (rfqForm && rfqNotice) {
    rfqForm.addEventListener('submit', function (event) {
      event.preventDefault();
      rfqNotice.classList.add('show');
      rfqForm.reset();
      setTimeout(function () {
        rfqNotice.classList.remove('show');
      }, 7000);
    });
  }
})();
