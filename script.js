document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();

  // Hero entrance animation
  document.querySelectorAll("#cv-root [data-hero]").forEach((el, i) => {
    el.style.transform = "translateY(30px)";
    el.style.transition = "opacity .8s ease, transform .9s cubic-bezier(.2,.7,.2,1)";
    setTimeout(() => {
      el.style.opacity = "1";
      el.style.transform = "none";
    }, 120 + i * 130);
  });

  // Reveal sections as they enter the viewport
  const revealEls = [...document.querySelectorAll("#cv-root [data-reveal]")];
  revealEls.forEach((el) => {
    el.style.transform = "translateY(28px)";
    el.style.transition = "opacity .75s ease, transform .75s cubic-bezier(.2,.7,.2,1)";
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "none";
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }

  // Scroll progress bar
  const bar = document.getElementById("sc-progress");
  const updateProgress = () => {
    if (!bar) return;
    const root = document.documentElement;
    const max = root.scrollHeight - root.clientHeight;
    bar.style.transform = `scaleX(${max > 0 ? root.scrollTop / max : 0})`;
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();
});
