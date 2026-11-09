const track = document.querySelector(".carousel-track");
const slides = document.querySelectorAll(".carousel-slide");
const dotsContainer = document.querySelector(".carousel-dots");

let currentIndex = 0;
let autoSlide;

slides.forEach((slide,index) => {
    const dot = document.createElement("button");

    dot.classList.add("carousel-dot");

    dot.setAttribute("aria-label", `Ir a imagen ${index + 1}`);

    dot.addEventListener("click", () => {
        currentIndex = index;
        updateCarousel();
        restartAutoSlide();
    });

    dotsContainer.appendChild(dot);
});

const dots = document.querySelectorAll(".carousel-dot");

function updateCarousel() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === currentIndex);
    });
}

function startAutoSlide() {
    autoSlide = setInterval(() => {
        currentIndex = (currentIndex +  1) % slides.length;
        updateCarousel();
    },4000);
}

function restartAutoSlide(){
    clearInterval(autoSlide);
    startAutoSlide();
}

if(slides.length > 0){
    updateCarousel();

    if(slides.length>1){
        startAutoSlide();
    }
}

