async function unsubscribeUser(event) {
  event.preventDefault();

  const email = document.getElementById("unsubscribe-email").value.trim();
  const statusEl = document.getElementById("unsubscribe-status");

  if (!email) {
    statusEl.textContent = "Please enter your email.";
    statusEl.style.color = "var(--accent)";
    return;
  }

  try {
    const res = await fetch(
      "https://backendroutes-lcpt.onrender.com/newsletter_unsubscribe",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );

    const data = await res.json();
    if (data.success) {
      statusEl.textContent = "You have been unsubscribed successfully.";
      statusEl.style.color = "var(--secondary)";
    } else {
      statusEl.textContent = data.message || "Could not unsubscribe.";
      statusEl.style.color = "var(--accent)";
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Something went wrong. Try again later.";
    statusEl.style.color = "var(--accent)";
  }
}
