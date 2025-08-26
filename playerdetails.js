function pingBackend() {
  fetch("https://backendroutes-lcpt.onrender.com/ping").catch(() => {});
}
pingBackend(); // call on load
setInterval(pingBackend, 1 * 60 * 1000); // every 1 mins

// Get data from localStorage
const Pname = JSON.parse(localStorage.getItem("Pname"));
const Pimg1 = JSON.parse(localStorage.getItem("Pimg"));
const Pnumber = JSON.parse(localStorage.getItem("Pnumber"));
const Page = JSON.parse(localStorage.getItem("Page"));
const Papps = JSON.parse(localStorage.getItem("Papps"));
const Pgoals = JSON.parse(localStorage.getItem("Pgoals"));
const Passists = JSON.parse(localStorage.getItem("Passists"));
const MOTM = JSON.parse(localStorage.getItem("MOTM"));
const POTM = JSON.parse(localStorage.getItem("POTM"));

// Set data into HTML elements
document.getElementById("Pname").innerHTML = Pname;
document.getElementById("Pnumber").innerHTML = Pnumber;
document.getElementById("Page").innerHTML = Page;
document.getElementById("Papps").innerHTML = Papps;
document.getElementById("Pgoals").innerHTML = Pgoals;
document.getElementById("Passists").innerHTML = Passists;
document.getElementById("MOTM").innerHTML = MOTM;
document.getElementById("POTM").innerHTML = POTM;
document.getElementById("main").style.backgroundImage = `url(${Pimg1})`;

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
