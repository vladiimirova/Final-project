import * as $ from 'jquery';

document.addEventListener('DOMContentLoaded', function () {
  const openMenu = document.querySelector('.open-menu');
  const closeMenu = document.querySelector('.close-menu');
  
  // Поиск обоих возможных заголовков
  const header = document.querySelector('.header') || document.querySelector('.header-about');
  
  if (header) {
      openMenu.addEventListener('click', function (event) {
          header.classList.add('show-menu');

          setTimeout(() => {
              header.classList.add('slide-menu');
          }, 200);
      });

      closeMenu.addEventListener('click', function (event) {
          header.classList.remove('slide-menu');
          setTimeout(() => {
              header.classList.remove('show-menu');
          }, 200);
      });
  }
});

// Отримуємо елементи з класом '.swiper'
const swiperElement1 = document.querySelectorAll('.swiper-team');

// Перевіряємо, чи існують елементи з класом '.swiper' на сторінці
if (swiperElement1.length > 0) {
  // Якщо є хоча б один елемент, створюємо екземпляр Swiper
  const swiperTeam = new Swiper('.swiper-team', {
    // Опціональні параметри
    loop: true,
    autoplay: {
      delay: 5000,
    },
    // Якщо потрібна пагінація
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
  });
}

// Отримуємо елемент з класом '.swiper-achievements'
const swiperElement2 = document.querySelector('.swiper-achievements');

// Перевіряємо, чи існує слайдер на сторінці
if (swiperElement2) {
  // Якщо елемент існує, створюємо екземпляр Swiper
  const swiperAchievements = new Swiper('.swiper-achievements', {
    loop: true,
    autoplay: {
      delay: 5000,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    breakpoints: {
      768: {
        slidesPerView: 4, 
        spaceBetween: 40, 
      },
    },
  });
}
