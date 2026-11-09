const track = document.querySelector(".carousel-track");
const slides = document.querySelectorAll(".carousel-slide");
const prevButton = document.querySelector(".carousel-button.prev");
const nextButton = document.querySelector(".carousel-button.next");
const dotsContainer = document.querySelector(".carousel-dots");

let currentIndex = 0;

slides.forEach((slide,index) => {
    const dot = document.createElement("button");

    dot.classList.add("carousel-dot");

    dot.setAttribute("aria-label", `Ir a imagen ${index + 1}`);

    dot.addEventListener("click", () => {
        currentIndex = index;
        updateCarousel();
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

nextButton.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % slides.length

    updateCarousel();
})

prevButton.addEventListener("click", ()=> {
    currentIndex = (currentIndex -1 + slides.length) % slides.length;

    updateCarousel();
});

updateCarousel();