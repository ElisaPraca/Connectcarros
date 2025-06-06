// Quando a página carregar, mostrar apenas os posts da categoria "news"
const defaultFilter = "news";
$(".post-box").hide(); 
$(".post-box." + defaultFilter).fadeIn(500); 

$(document).ready(function () {
    $(".filter-item").click(function () {
        const value = $(this).attr("data-filter");

        if (value == "all") {
            $(".post-box").fadeIn(500);
        } else {
            $(".post-box")
                .not("." + value)
                .fadeOut(300);
            $(".post-box")
                .filter("." + value)
                .delay(300)
                .fadeIn(500); 
        }
    });

    // Mudar o botão ativo
    $(".filter-item").click(function () {
        $(this).addClass("active-filter").siblings().removeClass("active-filter");
    });
});

document.querySelectorAll(".read-more").forEach(button => {
    button.addEventListener("click", function() {
        const postBox = this.closest(".post-box");
        const description = postBox.querySelector(".post-description");

        description.classList.toggle("expanded");


        this.textContent = description.classList.contains("expanded") ? "Ver menos..." : "Ver mais...";
    });
});


// Centraliza o card do meio no mobile ao carregar a página
window.addEventListener("load", function () {
    if (window.innerWidth <= 768) {
        const postContainer = document.querySelector(".post");
        const posts = postContainer.querySelectorAll(".post-box");

        if (posts.length > 0) {
            const middleIndex = Math.floor(posts.length / 2);
            const middlePost = posts[middleIndex];

            const offsetLeft = middlePost.offsetLeft - (postContainer.offsetWidth / 2) + (middlePost.offsetWidth / 2);

            postContainer.scrollTo({
                left: offsetLeft,
                behavior: "smooth"
            });
        }
    }
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


  //efeito de entrada

document.addEventListener('DOMContentLoaded', () => {
const postContainer = document.querySelector('.post.container22');

if (!postContainer) return;

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
    if (entry.isIntersecting) {
        entry.target.classList.add('show');
    

    } else {
        entry.target.classList.remove('show');
    }
    });
}, {
    threshold: 0.1 
});

observer.observe(postContainer);
});
