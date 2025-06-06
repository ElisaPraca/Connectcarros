const toggleBtn = document.querySelector('.toggle_btn')
const toggleBtnIcon = document.querySelector ('.toggle_btn i')
const dropDownMenu = document.querySelector ('.dropdown_menu')

toggleBtn.onclick = function (){
        dropDownMenu.classList.toggle('open')
        const isOpen = dropDownMenu.classList.contains('open')

        toggleBtnIcon.classList = isOpen
        ? 'fa-solid fa-xmark'
        : 'fa-solid fa-bars'
}

window.addEventListener("scroll", function(){
    let header = document.querySelector('#header')
    header.classList.toggle('rolagem', window.scrollY > 0)
})


var radio = document.querySelector('.manual-btn')
var cont = 1

document.getElementById('radio1').checked = true

setInterval(() => {
    proximaImg()
}, 5000)

function proximaImg(){
cont++
if(cont > 3 ){
    cont = 1
}

document.getElementById('radio'+cont).checked = true
}




const track = document.querySelector('.carousel-track1');
const images = document.querySelectorAll('.carousel-track1 img');
const totalImages = images.length;
let currentIndex = 0;
const imagesPerSlide = 10;

const prevButton = document.getElementById('prev-btn1');
const nextButton = document.getElementById('next-btn1');

// Clonar as imagens para o efeito circular
function cloneImages() {
  const clonedImages = [...images].map(image => image.cloneNode(true));
  clonedImages.forEach(img => track.appendChild(img));
  track.style.width = `${(images.length * 2) * (images[0].width + 10)}px`;
}

// Função para mover para o próximo conjunto de imagens
function moveToNext() {
  if (currentIndex + imagesPerSlide >= totalImages) {
    currentIndex = 0;
    track.style.transition = 'none';
    track.style.transform = `translateX(0)`;
    setTimeout(() => {
      track.style.transition = 'transform 0.3s ease-out';
      track.style.transform = `translateX(-${currentIndex * (images[0].width + 10)}px)`;
    }, 50);
  } else {
    currentIndex++;
    track.style.transition = 'transform 0.3s ease-out'; 
    track.style.transform = `translateX(-${currentIndex * (images[0].width + 10)}px)`;
  }
}


function moveToPrev() {
  if (currentIndex === 0) {
    currentIndex = totalImages - imagesPerSlide; 
  } else {
    currentIndex--;
  }
  track.style.transition = 'transform 0.3s ease-out';
  track.style.transform = `translateX(-${currentIndex * (images[0].width + 10)}px)`;
}


let carouselInterval = setInterval(moveToNext, 3000);


nextButton.addEventListener('click', () => {
  moveToNext();
  resetInterval();
});

prevButton.addEventListener('click', () => {
  moveToPrev();
  resetInterval();
});


function resetInterval() {
  clearInterval(carouselInterval);
  carouselInterval = setInterval(moveToNext, 3000);
}


cloneImages();




  window.onload = function() {
    var balloon = document.getElementById('balloon');

    
    setTimeout(function() {
      balloon.style.display = 'block';

      
      setTimeout(function() {
        balloon.style.display = 'none';
      }, 4000);

    }, 10000); 
  };










  function toggleAnswer(element) {
    var answer = element.nextElementSibling;
    var arrow = element.querySelector('span:last-child');
    
    if (answer.style.display === 'block') {
        answer.style.display = 'none';
        arrow.innerHTML = '&#x25B6;';
    } else {
        var allAnswers = document.querySelectorAll('.faq-answer');
        var allQuestions = document.querySelectorAll('.faq-question span:last-child');
        
        allAnswers.forEach(ans => ans.style.display = 'none');
        allQuestions.forEach(arr => arr.innerHTML = '&#x25B6;');
        
        answer.style.display = 'block';
        arrow.innerHTML = '&#x25BC;';
    }
}



// Desabilitar o clique direito
document.addEventListener("contextmenu", function(event) {
    event.preventDefault();
});

document.addEventListener("keydown", function(event) {
  if ((event.key === "F12") || (event.ctrlKey && event.shiftKey && event.key === "I")) {
      event.preventDefault();
  }
});





// efeito sessao cameras

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.card-animado');

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
      
      } else {
        entry.target.classList.remove('show'); 
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => observer.observe(card));
});


// efeito sky

document.addEventListener('DOMContentLoaded', () => {
  const skytvSection = document.querySelector('.skytv');

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        
      } else {
        entry.target.classList.remove('show'); 
      }
    });
  }, { threshold: 0.1 });

  if (skytvSection) observer.observe(skytvSection);
});





























