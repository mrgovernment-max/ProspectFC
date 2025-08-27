function pingBackend() {
  fetch("https://backendroutes-lcpt.onrender.com/ping").catch(() => {});
}
pingBackend(); // call on load
setInterval(pingBackend, 1 * 60 * 1000); // every 1 mins

function CheckPlayerDetails(...args) {
  const keys = [
    "Pname",
    "Pimg",
    "Pnumber",
    "Page",
    "Papps",
    "Pgoals",
    "Passists",
    "MOTM",
    "POTM",
  ];

  //store player details passed from DOM into keys array from the ...args
  keys.forEach((key, i) => {
    localStorage.setItem(key, JSON.stringify(args[i]));
  });

  window.location.href = "playerdetails.html";
}

//function to search player

function SearchPlayer() {
  const searchValue = document.getElementById("search-bar").value.toLowerCase();
  const playerList = document.getElementById("squad-cards");
  const Playernames = playerList.getElementsByClassName("card");

  for (let i = 0; i < Playernames.length; i++) {
    const RealName = Playernames[i].getAttribute("data-name").toLowerCase();
    if (RealName.includes(searchValue)) {
      Playernames[i].style.display = "";
    } else {
      Playernames[i].style.display = "none";
    }
  }
}

let Url = "https://backendroutes-lcpt.onrender.com/players";
// Async function to fetch and loop through players
async function fetchAndDisplayPlayers() {
  sortPlayers();
  //dispaly msg if deploy delays
  const container = document.getElementById("squad-cards");
  container.innerHTML = `<p style="font-size: 1.5rem; color: azure">Loading Players refresh page ....</p>`;
  try {
    const res = await fetch(`${Url}`);
    const players = await res.json();

    //reset
    container.innerHTML = "";

    players.forEach((player, index) => {
      // Create a card div
      const card = document.createElement("div");
      card.className = "card";
      card.setAttribute("data-aos", "fade-up");
      card.setAttribute("data-name", player.name);

      // Create img element
      const img = document.createElement("img");
      img.src = player.p_img;
      img.alt = `Prospect FC player squad  ${player.name} `;

      // Set onclick handler with player values
      img.setAttribute(
        "onclick",
        `CheckPlayerDetails('${player.name}', '${player.bg_img}', ${player.p_number}, ${player.age}, ${player.appearances}, ${player.goals}, ${player.assists},${player.MOTM},${player.POTM})`
      );

      // Create p tag for name
      const p = document.createElement("p");
      p.id = "player-name-" + index;
      p.textContent = player.name;

      // Append to card
      card.appendChild(img);
      card.appendChild(p);

      // Append card to container
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error fetching player data:", err);
  }
}

AOS.init({
  offset: 120, // distance in px before triggering animation
  delay: 200, // delay in ms
  duration: 1000, // animation duration in ms
  easing: "ease-in-out", // animation timing function
  once: false, // whether animation should happen only once
  mirror: false, // whether elements animate out while scrolling past them
});

//nav
const toggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

toggle.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

//sort players by filter selected

function sortPlayers() {
  const gallery = document.getElementById("select-gallery");
  gallery.addEventListener("change", function () {
    const galleryValue = this.value;
    switch (galleryValue) {
      case "Age":
        Url = "https://backendroutes-lcpt.onrender.com/playersage";
        fetchAndDisplayPlayers();
        break;
      case "Position":
        Url = "https://backendroutes-lcpt.onrender.com/playerspos";
        fetchAndDisplayPlayers();
        break;
      case "namme":
        Url = "https://backendroutes-lcpt.onrender.com/playersname";
        fetchAndDisplayPlayers();
        break;
      default:
        Url = "https://backendroutes-lcpt.onrender.com/players";
        fetchAndDisplayPlayers();
    }
  });
}

fetchAndDisplayPlayers();
