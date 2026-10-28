    (() => {
      const printButton = document.getElementById("print-button");
      const printDialog = document.getElementById("print-dialog");
      const closePrint = document.getElementById("close-print");

      if (!printButton || !printDialog || !closePrint) return;

      printButton.setAttribute("aria-haspopup", "dialog");
      printButton.setAttribute("aria-controls", "print-dialog");
      printButton.setAttribute("aria-expanded", "false");

      printButton.addEventListener("click", () => {
        if (printDialog.open) return;

        printDialog.showModal();
        printDialog.scrollTop = 0;

        document.documentElement.classList.add("print-open");
        printButton.setAttribute("aria-expanded", "true");
      });

      closePrint.addEventListener("click", () => {
        printDialog.close();
      });

      printDialog.addEventListener("keydown", (event) => {
        event.stopPropagation();
      });

      printDialog.addEventListener("close", () => {
        document.documentElement.classList.remove("print-open");
        printButton.setAttribute("aria-expanded", "false");
        printButton.focus();
      });
    })();
