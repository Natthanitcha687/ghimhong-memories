// =============================
// สคริปต์หลักของเว็บไซต์ (script.js)
// =============================
// โค้ดนี้ใช้ควบคุมเมนูนำทางและฟีเจอร์หลักของเว็บ

// ฟังก์ชันหลัก: รอให้ DOM โหลดเสร็จแล้วค่อยผูก event
document.addEventListener('DOMContentLoaded', function() {
  // เลือกปุ่ม hamburger และลิงก์เมนู
  const navbarToggle = document.querySelector('.navbar-toggle');
  const navbarLinks = document.querySelector('.navbar__links');

  // ถ้ามีปุ่มและเมนู navbar ให้ผูก event
  if (navbarToggle && navbarLinks) {
    // ฟังก์ชันเปิด/ปิดเมนู hamburger บนมือถือ
    navbarToggle.addEventListener('click', function() {
      // สลับคลาส 'is-open' เพื่อเปิด/ปิดเมนู
      navbarLinks.classList.toggle('is-open');

      // เปลี่ยน aria-expanded เพื่อบอก Screen Reader
      const isOpen = navbarLinks.classList.contains('is-open');
      navbarToggle.setAttribute('aria-expanded', isOpen);
    });
  }
});
