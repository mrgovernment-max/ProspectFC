function pingBackend() {
  fetch("https://backendroutes-lcpt.onrender.com/ping").catch(() => {});
}
pingBackend(); // call on load
setInterval(pingBackend, 1 * 60 * 1000); // every 1 mins

//send img urls to jersey page

function jerseyData(...args) {
  const keys = [
    "img1",
    "img2",
    "img3",
    "img4",
    "img5",
    "img6",
    "img7",
    "kitType",
  ];

  //store img urls into keys array --- imgs are passed through the ...args
  keys.forEach((key, index) => {
    localStorage.setItem(key, JSON.stringify(args[index]));
  });
  window.location.href = "jersey.html";
}

//nav

const toggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

toggle.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});
AOS.init({
  offset: 120, // distance in px before triggering animation
  delay: 200, // delay in ms
  duration: 1000, // animation duration in ms
  easing: "ease-in-out", // animation timing function
  once: false, // whether animation should happen only once
  mirror: false, // whether elements animate out while scrolling past them
});
