const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((section) => observer.observe(section));

// PDF 저장 — 브라우저 인쇄 창에서 '대상: PDF로 저장'을 선택하면 된다.
// 인쇄용 모양은 style.css 의 @media print 에서 밝은 배경으로 다시 정의한다.
const pdfButton = document.getElementById('pdf-button');
if (pdfButton) {
  pdfButton.addEventListener('click', () => {
    document.querySelectorAll('.reveal').forEach((section) => section.classList.add('visible'));
    window.print();
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) target.setAttribute('tabindex', '-1');
  });
});
