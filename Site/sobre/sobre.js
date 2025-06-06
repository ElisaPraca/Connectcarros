let imgContainer = document.querySelector(".img-container");

setInterval(() => {
        let last = imgContainer.firstElementChild;
        last.remove();
        imgContainer.appendChild(last);
    }, 2500);



// Desabilitar o clique direito
document.addEventListener("contextmenu", function(event) {
    event.preventDefault();
});

document.addEventListener("keydown", function(event) {
if ((event.key === "F12") || (event.ctrlKey && event.shiftKey && event.key === "I")) {
    event.preventDefault();
}
});


  window.addEventListener('load', function() {
    setTimeout(() => {
      const section = document.getElementById('nossa-historia');
      section.scrollIntoView({ behavior: 'smooth' });
    }, 1200); // Espera 1.2 segundos antes de descer
  });

