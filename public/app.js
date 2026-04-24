const forms = Array.from(document.querySelectorAll("[data-waitlist-form]"));
const emailInputs = Array.from(document.querySelectorAll(".email-input"));
const statusMessages = Array.from(document.querySelectorAll("[data-status]"));

function setStatus(message, type) {
  for (const statusMessage of statusMessages) {
    statusMessage.textContent = message;
    statusMessage.classList.remove("is-error", "is-success");

    if (type) {
      statusMessage.classList.add(type);
    }
  }
}

function setDisabled(disabled) {
  for (const form of forms) {
    const input = form.querySelector(".email-input");
    const button = form.querySelector(".join-button");

    if (input) {
      input.disabled = disabled;
    }

    if (button) {
      button.disabled = disabled;
    }
  }
}

function syncInputs(sourceValue) {
  for (const emailInput of emailInputs) {
    if (emailInput.value !== sourceValue) {
      emailInput.value = sourceValue;
    }
  }
}

for (const emailInput of emailInputs) {
  emailInput.addEventListener("input", (event) => {
    syncInputs(event.currentTarget.value);
  });
}

for (const form of forms) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();

    if (!email) {
      setStatus("Enter your email first.", "is-error");
      return;
    }

    setDisabled(true);
    setStatus("Joining...", "");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Unable to join right now.");
      }

      syncInputs("");
      setStatus(payload.message || "You are on the list.", "is-success");
    } catch (error) {
      setStatus(error.message || "Unable to join right now.", "is-error");
    } finally {
      setDisabled(false);
    }
  });
}
