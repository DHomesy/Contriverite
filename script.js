const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector("#mobile-nav");
const form = document.querySelector("#project-form");
const formStatus = document.querySelector("#form-status");
const copyButton = document.querySelector("#copy-brief");
const serviceSelect = document.querySelector("#service");
const emailAddress = "support@contriverite.com";
let projectBrief = "";

function closeMenu({ restoreFocus = false } = {}) {
  const wasOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  mobileNav.hidden = true;
  if (wasOpen && restoreFocus) menuToggle.focus();
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  mobileNav.hidden = isOpen;
});

mobileNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu({ restoreFocus: true });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-header")) closeMenu();
});

window.matchMedia("(min-width: 601px)").addEventListener("change", (event) => {
  if (event.matches) closeMenu();
});

document.querySelectorAll("[data-service]").forEach((link) => {
  link.addEventListener("click", () => {
    serviceSelect.value = link.dataset.service;
    serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));
  });
});

function showStatus(message) {
  formStatus.textContent = message;
  formStatus.hidden = false;
}

function clearDraft() {
  projectBrief = "";
  copyButton.hidden = true;
  formStatus.hidden = true;
  document.querySelector("#brief-fallback")?.closest(".field").remove();
}

form.addEventListener("input", clearDraft);
form.addEventListener("change", clearDraft);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const nameInput = form.elements.namedItem("name");
  const messageInput = form.elements.namedItem("message");
  nameInput.setCustomValidity(nameInput.value.trim() ? "" : "Please enter your name.");
  messageInput.setCustomValidity(messageInput.value.trim() ? "" : "Please tell us a little about your project.");
  if (!form.reportValidity()) return;

  const name = nameInput.value.trim();
  const email = form.elements.namedItem("email").value.trim();
  const service = serviceSelect.selectedOptions[0].textContent;
  const message = messageInput.value.trim();
  const subject = `Project inquiry: ${service}`;
  const body = `Hi Contriverite,\n\nI'm ${name}, and I'd like to talk about ${service.toLowerCase()}.\n\n${message}\n\nName: ${name}\nEmail: ${email}\n\nLooking forward to connecting!`;
  projectBrief = `To: ${emailAddress}\nSubject: ${subject}\n\n${body}`;
  copyButton.hidden = false;
  showStatus("Your email app should open with a draft. Nothing has been sent yet. If it doesn't open, copy your project brief below and email it to support@contriverite.com.");
  window.location.href = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

for (const input of [form.elements.namedItem("name"), form.elements.namedItem("message")]) {
  input.addEventListener("input", () => input.setCustomValidity(""));
}

copyButton.addEventListener("click", async () => {
  if (!projectBrief) {
    showStatus("Your project details have changed. Create a new email draft before copying your brief.");
    return;
  }
  if (!navigator.clipboard?.writeText) {
    showStatus("Clipboard access isn't available in this browser. You can select and copy the brief shown below, then email it to support@contriverite.com.");
    showCopyFallback();
    return;
  }
  const briefToCopy = projectBrief;
  try {
    await navigator.clipboard.writeText(briefToCopy);
    if (projectBrief === briefToCopy) {
      showStatus("Project brief copied. Paste it into an email to support@contriverite.com, review it, and press Send.");
    }
  } catch (error) {
    console.error("Could not copy the project brief:", error);
    if (projectBrief !== briefToCopy) return;
    showStatus("Your browser blocked clipboard access. Select and copy the brief shown below, then email it to support@contriverite.com.");
    showCopyFallback();
  }
});

function showCopyFallback() {
  let fallback = document.querySelector("#brief-fallback");
  if (!fallback) {
    const field = document.createElement("div");
    field.className = "field";
    const label = document.createElement("label");
    label.htmlFor = "brief-fallback";
    label.textContent = "Your project brief — select and copy";
    fallback = document.createElement("textarea");
    fallback.id = "brief-fallback";
    fallback.readOnly = true;
    fallback.rows = 7;
    field.append(label, fallback);
    form.append(field);
  }
  fallback.value = projectBrief;
  fallback.focus();
  fallback.select();
}

const showcase = document.querySelector(".showcase-stage");
const replayButton = document.querySelector(".preview-replay");
replayButton.addEventListener("click", () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (const animation of showcase.getAnimations({ subtree: true })) {
    animation.currentTime = 0;
    animation.play();
  }
});
replayButton.hidden = false;

document.querySelector("#year").textContent = String(new Date().getFullYear());
form.hidden = false;
menuToggle.hidden = false;
document.querySelector("#contact-fallback").hidden = true;
