    (() => {
      const aboutButton = document.getElementById("about-button");
      const aboutDialog = document.getElementById("about-dialog");
      const closeButton = document.getElementById("close-about");

      if (!aboutButton || !aboutDialog || !closeButton) return;

      aboutButton.setAttribute("aria-haspopup", "dialog");
      aboutButton.setAttribute("aria-controls", "about-dialog");
      aboutButton.setAttribute("aria-expanded", "false");

      aboutButton.addEventListener("click", () => {
        if (aboutDialog.open) return;

        aboutDialog.showModal();
        aboutDialog.scrollTop = 0;

        document.documentElement.classList.add("about-open");
        aboutButton.setAttribute("aria-expanded", "true");
      });

      closeButton.addEventListener("click", () => {
        aboutDialog.close();
      });

      // Keep Escape inside the dialog so it doesn't also
      // cancel an image selection in the gallery.
      aboutDialog.addEventListener("keydown", (event) => {
        event.stopPropagation();
      });

      // Escape also closes the native dialog.
      aboutDialog.addEventListener("close", () => {
        document.documentElement.classList.remove("about-open");
        aboutButton.setAttribute("aria-expanded", "false");
        aboutButton.focus();
      });
    })();
