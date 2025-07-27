document.addEventListener("DOMContentLoaded", () => {
  const swiper = new Swiper(".announcement-swiper", {
    loop: true,
    autoplay: {
      delay: {{ section.settings.autoplay_speed | json }},
      disableOnInteraction: false,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
  });

  // Countdown logic same as earlier
  const countdownEls = document.querySelectorAll(".countdown");
  countdownEls.forEach(el => {
    const expiry = new Date(el.dataset.expiry).getTime();
    if (!expiry) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiry - now;
      if (distance <= 0) {
        el.textContent = "Expired";
        clearInterval(timer);
        return;
      }
      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      el.textContent = `${d}d ${h}h ${m}m ${s}s`;
    }, 1000);
  });
});
