document.addEventListener("DOMContentLoaded", () => {
  const bar = document.querySelector("#announcement-bar");
  const slider = bar?.querySelector(".slider");
  const slides = bar?.querySelectorAll(".slide");
  const autoplay = {{ section.settings.autoplay | json }};
  const speed = {{ section.settings.autoplay_speed | json }};

  let index = 0;
  if (slides?.length > 1 && autoplay) {
    setInterval(() => {
      index = (index + 1) % slides.length;
      slider.style.transform = `translateX(-${index * 100}%)`;
    }, speed);
  }

  // Countdown timers
  const countdownEls = bar?.querySelectorAll(".countdown");
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

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      el.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
  });
});
