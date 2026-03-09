document.addEventListener('DOMContentLoaded', function() {
  const navbarToggle = document.querySelector('.navbar-toggle');
  const navbarLinks = document.querySelector('.navbar__links');

  if (navbarToggle && navbarLinks) {
    navbarToggle.addEventListener('click', function() {
      // สลับคลาส 'is-open' เพื่อเปิด/ปิดเมนู
      navbarLinks.classList.toggle('is-open');

      // เปลี่ยน aria-expanded เพื่อบอก Screen Reader
      const isOpen = navbarLinks.classList.contains('is-open');
      navbarToggle.setAttribute('aria-expanded', isOpen);
    });
  }
});
