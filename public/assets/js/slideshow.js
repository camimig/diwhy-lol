  (() => {
    const printDialog = document.getElementById("print-dialog");
    const holder = printDialog
      ? printDialog.querySelector(".print-photos")
      : null;

    if (!holder) return;

    const photos = Array.from(holder.querySelectorAll("img"));

    if (photos.length === 0) return;

    let current = 0;

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "print-arrow print-arrow-prev";
    prev.setAttribute("aria-label", "previous image");
    prev.textContent = "<";

    const next = document.createElement("button");
    next.type = "button";
    next.className = "print-arrow print-arrow-next";
    next.setAttribute("aria-label", "next image");
    next.textContent = ">";

    const counter = document.createElement("div");
    counter.className = "print-counter";
    counter.setAttribute("role", "status");
    counter.setAttribute("aria-live", "polite");

    holder.append(prev, next, counter);

    function pad(number) {
      return String(number).padStart(2, "0");
    }

    function show(index) {
      current = (index + photos.length) % photos.length;

      photos.forEach((img, n) => {
        img.classList.toggle("is-current", n === current);
      });

      if (printDialog.open) {
        // Fetch the current photo first, then the two adjacent slides.
        [current, (current + 1) % photos.length,
          (current + photos.length - 1) % photos.length].forEach((n) => {
          const img = photos[n];
          img.fetchPriority = n === current ? "high" : "low";
          if (!img.hasAttribute("data-src")) return;
          img.src = img.getAttribute("data-src");
          img.removeAttribute("data-src");
        });
      }

      counter.textContent =
        `${pad(current + 1)}/${pad(photos.length)}`;
    }

    prev.addEventListener("click", () => show(current - 1));
    next.addEventListener("click", () => show(current + 1));

    const printButton = document.getElementById("print-button");
    if (printButton) {
      printButton.addEventListener("click", () => show(current));
    }

    printDialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        show(current - 1);
      } else if (event.key === "ArrowRight") {
        show(current + 1);
      }
    });

    // Quando fechas o "print", volta à primeira foto
    printDialog.addEventListener("close", () => show(0));

    show(0);
  })();
