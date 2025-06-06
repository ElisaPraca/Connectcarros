
let swiperCards = new Swiper(".card__content", {
  loop: true,
  spaceBetween: 32,
  grabCursor: true,

  pagination: {
    el: ".swiper-pagination",
    clickable: true,
    dynamicBullets: true,
  },

  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  breakpoints:{
    600: {
      slidesPerView: 2,
    },
    968: {
      slidesPerView: 3,
    },
  },
});


document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.container');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        container.classList.add('show');
    
      } else {
        container.classList.remove('show');
      }
    });
  }, { threshold: 0.1 });

  observer.observe(container);
});

// Desabilitar o clique direito
document.addEventListener("contextmenu", function(event) {
    event.preventDefault();
});

document.addEventListener("keydown", function(event) {
  if ((event.key === "F12") || (event.ctrlKey && event.shiftKey && event.key === "I")) {
      event.preventDefault();
  }
});