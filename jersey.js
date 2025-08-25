async function PayForJersey() {
  const size = document.getElementById("size").value;
  const kit = document.getElementById("jersey-type").innerHTML;
  const loc = document.getElementById("loc-select").value;
  const number = parseInt(document.getElementById("quantity").value, 10);
  const mail = document.getElementById("mail").value;
  const contact = document.getElementById("contact").value;
  const customize = document.getElementById("customize").value.trim();
  const houseNumber = document.getElementById("house_number").value;
  const street = document.getElementById("street").value;
  const locality = document.getElementById("locality").value;
  const town = document.getElementById("town").value;
  const county = document.getElementById("county").value;
  const postcode = document.getElementById("postcode").value;

  if (
    mail === "" ||
    contact === "" ||
    postcode === "" ||
    houseNumber === "" ||
    street === "" ||
    town === "" ||
    postcode === ""
  ) {
    alert("Fill All  * Forms");
  } else {
    const img =
      kit === "Official Home Kit 2025"
        ? "https://res.cloudinary.com/dazhskqcc/image/upload/v1754065745/homejersy_am4o5k.jpg"
        : "https://res.cloudinary.com/dazhskqcc/image/upload/v1754061296/mobile_hero_dufkug.jpg";
    const order = [
      {
        size,
        kit,
        img,
        discountVal,
        quantity: number,
        customize: customize === "" ? "no customize" : customize,
        mail,
        postcode,
        loc,
        contact,
        houseNumber,
        street,
        county,
        locality,
        town,
      },
    ];

    try {
      const response = await fetch(
        "https://prospectfcstripe.onrender.com/Fcprospect",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const stripe = Stripe(
          "pk_live_51RsWFzHjxy5ReYxncOSUJdyiadFDIlO003yDSo9eMBvPD1HgnOpPdqEdvB3cKZqcuyt98a2V6WA2x4XEkIVfAWcs004VKJKWrk"
        );
        // Redirect to Stripe Checkout
        await stripe.redirectToCheckout({ sessionId: data.id });
      } else {
        alert(data.error || "Failed to create Stripe session.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong, check console.");
    }
  }
}

let discountVal = 0;

async function Discounts() {
  const disCode = document.getElementById("disCode").value.trim();
  const disMsg = document.getElementById("discount-msg");

  if (!disCode) {
    disMsg.innerHTML = `<span style="color: red">Enter a discount code</span>`;
    return;
  }

  try {
    const res = await fetch(
      "https://prospect-form-backend.onrender.com/discount_codes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ disCode }),
      }
    );

    const data = await res.json();

    if (res.ok) {
      discountVal = +data.discountPercent;
      const discount = 25 * (data.discountPercent / 100);
      // const newPrice = 25 - discount;
      disMsg.innerHTML = `<span style="color: green">${data.message} <br>  ${data.discountPercent}% was Discounted <br> You will now pay the price MINUS £${discount} </span> <br> <span  style="color: red"> DO NOT REFRESH OR LEAVE PAGE </span>`; // Code is valid and applied
    } else {
      disMsg.innerHTML = `<span style="color: red">${data.message}</span>`;
    }
  } catch (err) {
    console.error("Error applying discount:", err);
    disMsg.innerHTML = `<span style="color: red">Something went wrong.. try again</span>`;
  }
}

function insertPassedData() {
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

  let jerseyPassed = {};

  keys.forEach((key, index) => {
    jerseyPassed[index] = JSON.parse(localStorage.getItem(key));
  });

  document.getElementsByTagName("img")[1].src = jerseyPassed[0];
  document.getElementsByTagName("img")[2].src = jerseyPassed[1];
  document.getElementsByTagName("img")[3].src = jerseyPassed[2];
  document.getElementsByTagName("img")[4].src = jerseyPassed[3];
  document.getElementsByTagName("img")[5].src = jerseyPassed[4];
  document.getElementsByTagName("img")[6].src = jerseyPassed[5];
  document.getElementsByTagName("img")[7].src = jerseyPassed[6];
  document.getElementById("jersey-type").innerHTML = jerseyPassed[7];
}

window.onload = insertPassedData;

new Swiper(".jersey-swiper", {
  loop: true,
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
});

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
