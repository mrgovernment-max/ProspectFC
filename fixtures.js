// ---  DISPLAY FIXTURES FROM DB

async function FetchMatches() {
  let fixtures_container = document.querySelector(".fixtures-container");
  fixtures_container.innerHTML = `<p style="font-size: 1.5rem; color: azure;text-align:center;">Loading Fixtures  refresh page....</p>`;

  const res = await fetch("https://backendroutes-lcpt.onrender.com/fixtures");
  const data = await res.json();

  fixtures_container.innerHTML = " ";

  let fixtures = "";

  data.forEach((element) => {
    fixtures += `
      <div class="fixture-card" data-aos="fade-up">
        <div class="teams">
          <div class="team">
            <img src="${element.home_team_img}" alt="${element.home_team_name} logo" />
            <p>${element.home_team_name}</p>
            <div id="score">${element.home_score} </div>
          </div>
          <span class="vs">VS</span>
          <div class="team">
            <img src="${element.away_team_img}" alt="${element.away_team_name} logo" />
            <p>${element.away_team_name}</p>
            <div id="score"> ${element.away_score}</div>
          </div>
        </div>
        <div class="fixture-details">
         
          <p><strong>Date:</strong> ${element.match_date}</p>
          <p><strong>Time:</strong> ${element.match_time}</p>
          <p><strong>Location:</strong> ${element.location}</p>
          <button><a target="_blank" href=" https://youtube.com/@prospectfc?si=2Iwkjya99ywVvibE"> Highlights ↗ </a>  </button>
          <button> <a target="_blank" href=" https://www.instagram.com/prospect.fc?utm_source=ig_web_button_share_sheet&igsh=MXFkZzdrY2h3Mm5qcQ=="> Photos ↗ </a> </button>
        </div>
      </div>
    `;
  });

  fixtures_container.innerHTML += fixtures;
}

window.onload = FetchMatches;

function pingBackend() {
  fetch("https://backendroutes-lcpt.onrender.com/ping").catch(() => {});
}
pingBackend(); // call on load
setInterval(pingBackend, 1 * 60 * 1000); // every 1 mins

//Nav

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
