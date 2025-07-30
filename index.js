function CheckPlayerDetails(
  Pname,
  Pimg1,
  Pnumber,
  Page,
  Papps,
  Pgoals,
  Passists
) {
  localStorage.setItem("Pname", JSON.stringify(Pname));
  localStorage.setItem("Pimg", JSON.stringify(Pimg1));
  localStorage.setItem("Pnumber", JSON.stringify(Pnumber));
  localStorage.setItem("Page", JSON.stringify(Page));
  localStorage.setItem("Papps", JSON.stringify(Papps));
  localStorage.setItem("Pgoals", JSON.stringify(Pgoals));
  localStorage.setItem("Passists", JSON.stringify(Passists));
  window.location.href = "playerdetails.html";
}

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
