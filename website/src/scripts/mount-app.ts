const root = document.getElementById('imgo-root');

if (root) {
  let mountPromise: Promise<void> | null = null;

  const mount = () => {
    mountPromise ??= Promise.all([
      import('react'),
      import('react-dom/client'),
      import('@imgo/app/embed'),
    ])
      .then(([{ createElement }, { createRoot }, { default: AppEmbed }]) => {
        createRoot(root).render(
          createElement(AppEmbed, {
            embedded: true,
            locale: root.dataset.locale,
          }),
        );
        root.setAttribute('aria-busy', 'false');
      })
      .catch((error: unknown) => {
        console.error(error);
        root.setAttribute('aria-busy', 'false');
        root.textContent = error instanceof Error ? error.message : String(error);
      });

    return mountPromise;
  };

  if (root.dataset.lazy === 'true') {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        window.setTimeout(() => void mount(), 0);
      },
      { rootMargin: '200px' },
    );

    observer.observe(root);
    document.querySelectorAll<HTMLAnchorElement>('a[href="#web-app"]').forEach((link) => {
      link.addEventListener('click', () => void mount(), { once: true });
    });

    if (window.location.hash === '#web-app') {
      void mount();
    }
  } else {
    void mount();
  }
}
