    (() => {
      const gallery = document.querySelector(".gallery");
      const makeButton = document.getElementById("make-own");
      const cancelButton = document.getElementById("cancel-selection");
      const countLabel = document.getElementById("selection-count");

      if (!gallery || !makeButton || !cancelButton || !countLabel) return;

      const originalImages = Array.from(gallery.querySelectorAll("img"));
      const selected = new Set();
      const repeatBatchSize = 48;
      let nextRepeatIndex = 0;

      // Observe only after masonry has assigned every image a real position.
      const imageObserver = "IntersectionObserver" in window
        ? new IntersectionObserver((entries) => {
            entries
              .filter((entry) => entry.isIntersecting)
              .sort((a, b) =>
                a.boundingClientRect.top - b.boundingClientRect.top ||
                a.boundingClientRect.left - b.boundingClientRect.left
              )
              .forEach(({ target }) => loadImage(target));
          }, { rootMargin: `${window.innerHeight}px 0px` })
        : null;

      let frame;
      let isAppending = false;
      let selecting = false;
      let downloading = false;
      let tooltipId = 0;

      let activeTooltip = null;
      let activeImage = null;

      const categoryDescriptions = {
        "risky business": {
          title: "Risky Business",
          description:
            "Takes the idea of public toilets literally, presenting bathrooms with glass partitions, missing dividers, or doors too short to provide privacy. Spaces intended for privacy become unexpectedly exposed, undermining the reassurance offered by conventional bathroom design."
        },

        "financial anxiety": {
          title: "Financial Anxiety",
          description:
            "Brings together ATMs installed at impractical heights, forcing users to stretch, crouch, or bend to reach them. An ordinary transaction becomes a physical challenge, adding another layer of discomfort to the experience of accessing money."
        },

        "final destination": {
          title: "Final Destination",
          description:
            "Final Destination borrows the film’s title to frame domestic arrangements that seem to anticipate disaster. Washing machines balanced above toilets, sockets inside showers, and electrical panels beside water sources turn careless installation into an ominous suggestion of what might happen next."
        },

        "urban dyslaxia": {
          title: "Urban Dyslaxia",
          description:
            "Deliberately misspells dyslexia to introduce a collection of careless lettering and unexpected spelling errors in public spaces. STOP becomes STOB, and familiar instructions become confusing messages, undermining the clarity and authority they are supposed to convey."
        },

        "municipal patchwork": {
          title: "Municipal Patchwork",
          description:
            "Describes the layered, clashing attempts at public infrastructure repair, mismatched bricks on a sidewalk or different types of asphalt patches on a single street, where new materials are stitched onto old ones without concern for seamlessness."
        },

        "skinny legends": {
          title: "Skinny Legends",
          description:
            "Borrows an affectionate expression from internet fan culture to describe unusually thin, narrow, or undersized objects. Radiators, doors, and fences appear reduced to barely functional proportions, turning their exaggerated slenderness into a visual joke about usefulness and inadequacy."
        },

        "keep out": {
          title: "Keep Out",
          description:
            "Exposes the absurdity of barriers that fail to keep anyone out. Isolated gates, unsupported doors, and fences with open routes around them retain the appearance of security while offering little resistance, turning the promise of restricted access into an empty gesture."
        },

        "funny games": {
          title: "Funny Games",
          description:
            "Borrows the title of Michael Haneke’s film to frame playgrounds where the promise of fun conceals potential danger. Awkward swings, misplaced slides, and poorly assembled equipment transform spaces intended for play into unsettling encounters with careless design."
        },

        "evil kintsugi": {
          title: "Evil Kintsugi",
          description:
            "Plays on the Japanese art of kintsugi, where broken pottery is mended with gold to highlight the beauty of damage. In its evil version, the breaks are clumsily repaired, instead of gold, tape is applied, as a result cracks are highlighted rather than concealed. "
        },

        "auto slop": {
          title: "Auto Slop",
          description:
            "Combines automotive customisation with the language of low-quality internet content. Plastic chairs replace car seats, and boat wheels replace steering wheels, producing modifications whose apparent ingenuity is undermined by impracticality, incongruity, or questionable functionality."
        },

        "landlord special": {
          title: "The Landlord Special",
          description:
            "Refers to the aesthetic of quick, cheap, and visibly careless repairs without regard for quality, longevity, or coherence. Like painted-over light switches, doorknobs and even cockroaches, a gesture that values function over beauty."
        },

        "fossilized modernity": {
          title: "Fossilized Modernity",
          description:
            "Presents everyday objects embedded in concrete or asphalt, turning phones, televisions, and construction tools into accidental contemporary fossils. Objects associated with use and movement become fixed within the built environment, preserved through the very carelessness that rendered them useless."
        },

        "backrooms core": {
          title: "Backrooms Core",
          description:
            "Draws on the unsettling spatial logic of the internet’s Backrooms, presenting familiar architectural elements assembled in unfamiliar ways. Half-doors, stairs leading nowhere, and inaccessible entrances make ordinary environments appear incorrectly reconstructed, somewhere between an unfinished building and a faulty copy."
        },

        "home disimprovement": {
          title: "Home Disimprovement",
          description:
            "Flips the language of home improvement to suggest interventions that make a space worse, uglier, less functional, more confusing like a stairway leading to nowhere or weirdly constructed doors."
        },

        "cursed diy": {
          title: "Cursed DIY",
          description:
            "Captures the humor of failed homemade projects: improvised BBQ’s or comically unsafe construction gear, it celebrates the chaotic outcomes of trying to make it work leads to unpredictable, janky, and absurd results."
        }
      };

      // Selection

      function imageSource(img) {
        return img.getAttribute("data-src") || img.getAttribute("src");
      }

      function loadImage(img) {
        if (!img.hasAttribute("data-src")) return;

        // The observer has already applied our preload distance.
        img.loading = "eager";
        img.src = img.getAttribute("data-src");
        img.removeAttribute("data-src");
        if (imageObserver) imageObserver.unobserve(img);
      }

      function observeImage(img) {
        if (img.complete && img.naturalWidth) {
          img.classList.add("is-loaded");
        }

        if (!img.hasAttribute("data-src")) return;
        if (imageObserver) {
          imageObserver.observe(img);
        } else {
          // Older browsers still get a working gallery.
          loadImage(img);
        }
      }

      function imageKey(img) {
        return new URL(imageSource(img), document.baseURI).href;
      }

      function syncImage(img) {
        const checked = selecting && selected.has(imageKey(img));

        img.classList.toggle("is-selected", checked);
        img.tabIndex = 0;
        img.draggable = !selecting;

        if (selecting) {
          img.setAttribute("role", "checkbox");
          img.setAttribute("aria-checked", String(checked));
          img.removeAttribute("aria-describedby");
        } else {
          img.removeAttribute("role");
          img.removeAttribute("aria-checked");

          if (img._categoryTooltip) {
            img.setAttribute(
              "aria-describedby",
              img._categoryTooltip.id
            );
          }
        }
      }

      function syncImages() {
        gallery.querySelectorAll("img").forEach(syncImage);
      }

      function updateControls() {
        gallery.classList.toggle("is-selecting", selecting);

        makeButton.textContent = downloading
          ? "preparing..."
          : selecting
            ? "download!"
            : "make my own!";

        makeButton.disabled =
          downloading || (selecting && selected.size === 0);

        cancelButton.hidden = !selecting;
        cancelButton.disabled = downloading;

        countLabel.textContent = selecting
          ? `${selected.size} selected`
          : "";
      }

      function enterSelection() {
        selecting = true;

        hideTooltip(activeTooltip);
        syncImages();
        updateControls();
      }

      function exitSelection() {
        if (downloading) return;

        selecting = false;
        selected.clear();

        syncImages();
        updateControls();

        makeButton.focus();
      }

      function toggleImage(img) {
        if (!selecting || downloading) return;

        const key = imageKey(img);

        if (selected.has(key)) {
          selected.delete(key);
        } else {
          selected.add(key);
        }

        // Keep repeated copies in sync.
        syncImages();
        updateControls();
      }

      async function downloadSelection() {
        if (downloading || selected.size === 0) return;

        if (typeof window.JSZip === "undefined") {
          alert(
            "The download library couldn't load. Please reload and try again."
          );
          return;
        }

        const sources = Array.from(selected);

        downloading = true;
        updateControls();

        try {
          const zip = new JSZip();

          for (let index = 0; index < sources.length; index++) {
            const source = sources[index];

            countLabel.textContent =
              `loading ${index + 1}/${sources.length}`;

            const response = await fetch(source);

            if (!response.ok) {
              throw new Error(
                `Image request failed (${response.status}): ${source}`
              );
            }

            const blob = await response.blob();
            const parts = new URL(source).pathname.split("/");

            let filename = parts.pop() || "image.jpg";
            let category = parts.pop() || "image";

            try {
              filename = decodeURIComponent(filename);
              category = decodeURIComponent(category);
            } catch {
              // Keep the encoded names if decoding fails.
            }

            filename = filename.replace(/[\\/:*?"<>|]/g, "-");
            category = category.replace(/[\\/:*?"<>|]/g, "-");

            const number = String(index + 1).padStart(3, "0");

            zip.file(`${number}-${category}-${filename}`, blob);
          }

          countLabel.textContent = "creating zip...";

          const archive = await zip.generateAsync({
            type: "blob"
          });

          const objectURL = URL.createObjectURL(archive);
          const link = document.createElement("a");

          link.href = objectURL;
          link.download = "my-visual-lexicon.zip";

          document.body.appendChild(link);
          link.click();
          link.remove();

          setTimeout(() => {
            URL.revokeObjectURL(objectURL);
          }, 60000);
        } catch (error) {
          console.error("Gallery download failed:", error);

          alert(
            "Couldn't create the download. Make sure the page is running " +
            "on a web server and the selected image files are available, " +
            "then try again."
          );
        } finally {
          downloading = false;
          updateControls();
        }
      }

      makeButton.addEventListener("click", () => {
        if (selecting) {
          downloadSelection();
        } else {
          enterSelection();
        }
      });

      cancelButton.addEventListener("click", exitSelection);

      gallery.addEventListener("click", (event) => {
        const img = event.target.closest("img");

        if (!selecting || !img || !gallery.contains(img)) return;

        event.preventDefault();
        toggleImage(img);
      });

      gallery.addEventListener("keydown", (event) => {
        const img = event.target.closest("img");

        if (!selecting || !img) return;

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleImage(img);
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        if (selecting && !downloading) {
          exitSelection();
        } else {
          hideTooltip(activeTooltip);
        }
      });

      // Category tooltips

      function positionTooltip(tooltip, event) {
        const galleryRect = gallery.getBoundingClientRect();

        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;

        const margin = 12;
        const offset = 16;

        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight;

        let viewportLeft = event.clientX + offset;

        if (viewportLeft + tooltipWidth > viewportWidth - margin) {
          viewportLeft = event.clientX - offset - tooltipWidth;
        }

        viewportLeft = Math.max(
          margin,
          Math.min(
            viewportLeft,
            viewportWidth - tooltipWidth - margin
          )
        );

        let viewportTop = event.clientY + 12;

        if (viewportTop + tooltipHeight > viewportHeight - margin) {
          viewportTop = event.clientY - tooltipHeight - 12;
        }

        viewportTop = Math.max(
          margin,
          Math.min(
            viewportTop,
            viewportHeight - tooltipHeight - margin
          )
        );

        tooltip.style.left =
          `${viewportLeft - galleryRect.left + gallery.scrollLeft}px`;

        tooltip.style.top =
          `${viewportTop - galleryRect.top + gallery.scrollTop}px`;
      }

      function hideTooltip(tooltip) {
        if (!tooltip) return;

        tooltip.classList.remove("is-visible");

        if (activeTooltip === tooltip) {
          activeTooltip = null;
          activeImage = null;
        }
      }

      function showTooltip(img, tooltip, event) {
        if (selecting) return;

        if (activeTooltip && activeTooltip !== tooltip) {
          hideTooltip(activeTooltip);
        }

        activeTooltip = tooltip;
        activeImage = img;

        tooltip.classList.add("is-visible");

        if (event && typeof event.clientX === "number") {
          positionTooltip(tooltip, event);
        } else {
          const rect = img.getBoundingClientRect();

          positionTooltip(tooltip, {
            clientX: rect.right,
            clientY: rect.top
          });
        }
      }

      function attachTooltip(img) {
        if (img._categoryTooltip) return;

        const src = imageSource(img) || "";
        const folder = src.split("/").slice(-2)[0];

        let categoryKey = folder;

        try {
          categoryKey = decodeURIComponent(folder);
        } catch {
          // Keep the original folder name.
        }

        categoryKey = categoryKey.toLowerCase().trim();

        const category = categoryDescriptions[categoryKey];

        if (!category) return;

        const tooltip = document.createElement("div");

        tooltip.className = "category-tooltip";
        tooltip.id = `category-tooltip-${++tooltipId}`;
        tooltip.setAttribute("role", "tooltip");

        const title = document.createElement("div");
        title.className = "tooltip-title";
        title.textContent = category.title;

        const description = document.createElement("div");
        description.className = "tooltip-description";
        description.textContent = category.description;

        tooltip.append(title, description);
        gallery.appendChild(tooltip);

        img._categoryTooltip = tooltip;
        img.tabIndex = 0;
        img.setAttribute("aria-describedby", tooltip.id);

        img.addEventListener("mouseenter", (event) => {
          showTooltip(img, tooltip, event);
        });

        img.addEventListener("mousemove", (event) => {
          if (!selecting && activeTooltip === tooltip) {
            positionTooltip(tooltip, event);
          }
        });

        img.addEventListener("mouseleave", () => {
          hideTooltip(tooltip);
        });

        img.addEventListener("focus", () => {
          loadImage(img);
          showTooltip(img, tooltip, null);
        });

        img.addEventListener("blur", () => {
          hideTooltip(tooltip);
        });
      }

      originalImages.forEach((img) => {
        attachTooltip(img);
        syncImage(img);
      });

      // Tooltip for "make my own!"
const makeTooltip = document.createElement("div");
makeTooltip.className = "category-tooltip";
makeTooltip.id = "make-own-tooltip";
makeTooltip.setAttribute("role", "tooltip");

const makeTooltipText = document.createElement("div");
makeTooltipText.className = "tooltip-description";
makeTooltipText.textContent =
  "Pick your images. Make your own lexicon.";

makeTooltip.append(makeTooltipText);
gallery.appendChild(makeTooltip);

makeButton.setAttribute("aria-describedby", makeTooltip.id);

makeButton.addEventListener("mouseenter", (event) => {
  if (selecting || downloading) return;

  makeTooltip.classList.add("is-visible");
  positionTooltip(makeTooltip, event);
});

makeButton.addEventListener("mousemove", (event) => {
  if (makeTooltip.classList.contains("is-visible")) {
    positionTooltip(makeTooltip, event);
  }
});

makeButton.addEventListener("mouseleave", () => {
  makeTooltip.classList.remove("is-visible");
});

makeButton.addEventListener("click", () => {
  makeTooltip.classList.remove("is-visible");
});

makeButton.addEventListener("focus", () => {
  if (selecting || downloading) return;

  const rect = makeButton.getBoundingClientRect();

  makeTooltip.classList.add("is-visible");
  positionTooltip(makeTooltip, {
    clientX: rect.left,
    clientY: rect.top
  });
});

makeButton.addEventListener("blur", () => {
  makeTooltip.classList.remove("is-visible");
});

      // Masonry layout

      function layoutMasonry() {
        const styles = getComputedStyle(gallery);

        const columns =
          parseInt(styles.getPropertyValue("--columns"), 10) || 4;

        const gap =
          parseFloat(styles.getPropertyValue("--gap")) || 16;

        const paddingLeft = parseFloat(styles.paddingLeft) || 0;
        const paddingRight = parseFloat(styles.paddingRight) || 0;
        const paddingTop = parseFloat(styles.paddingTop) || 0;
        const paddingBottom = parseFloat(styles.paddingBottom) || 0;

        const contentWidth =
          gallery.clientWidth - paddingLeft - paddingRight;

        const columnWidth = Math.max(
          1,
          (contentWidth - gap * (columns - 1)) / columns
        );

        const columnHeights = Array(columns).fill(0);
        const images = Array.from(gallery.querySelectorAll("img"));

        images.forEach((img) => {
          const column = columnHeights.indexOf(
            Math.min(...columnHeights)
          );

          const imageWidth = img.classList.contains("small")
            ? columnWidth * 0.88
            : columnWidth;
          const intrinsicWidth = Number(img.getAttribute("width")) || img.naturalWidth;
          const intrinsicHeight = Number(img.getAttribute("height")) || img.naturalHeight;
          const ratio = intrinsicWidth && intrinsicHeight
            ? intrinsicHeight / intrinsicWidth
            : 1;
          const imageHeight = imageWidth * ratio;

          const left =
            paddingLeft +
            column * (columnWidth + gap) +
            (columnWidth - imageWidth) / 2;

          const top = paddingTop + columnHeights[column];

          img.style.width = `${imageWidth}px`;
          img.style.height = `${imageHeight}px`;
          img.style.left = `${left}px`;
          img.style.top = `${top}px`;

          columnHeights[column] += imageHeight + gap;
        });

        const tallestColumn = Math.max(0, ...columnHeights);

        gallery.style.height =
          `${paddingTop + tallestColumn -
            (images.length ? gap : 0) + paddingBottom}px`;

        gallery.classList.add("is-ready");
        images.forEach(observeImage);
        isAppending = false;

        if (
          activeTooltip &&
          activeImage &&
          !activeImage.matches(":hover")
        ) {
          const rect = activeImage.getBoundingClientRect();

          positionTooltip(activeTooltip, {
            clientX: rect.right,
            clientY: rect.top
          });
        }

        checkScroll();
      }

      function scheduleLayout() {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(layoutMasonry);
      }

      // Infinite scrolling

      function appendNextBatch() {
        if (isAppending || originalImages.length === 0) return;

        isAppending = true;

        try {
          const fragment = document.createDocumentFragment();

          for (let index = 0; index < repeatBatchSize; index++) {
            const original = originalImages[nextRepeatIndex];
            nextRepeatIndex = (nextRepeatIndex + 1) % originalImages.length;
            const clone = original.cloneNode(false);

            clone.setAttribute("data-src", imageSource(original));
            clone.removeAttribute("src");
            clone.removeAttribute("fetchpriority");
            clone.loading = "lazy";
            clone.removeAttribute("style");

            clone.removeAttribute("aria-describedby");
            clone.removeAttribute("aria-checked");
            clone.removeAttribute("role");
            clone.classList.remove("is-selected", "is-loaded");

            attachTooltip(clone);
            syncImage(clone);

            fragment.appendChild(clone);
          }

          gallery.appendChild(fragment);
          scheduleLayout();
        } catch (error) {
          isAppending = false;
          throw error;
        }
      }

      function checkScroll() {
        const remaining =
          document.documentElement.scrollHeight -
          (window.scrollY + window.innerHeight);

        if (remaining < window.innerHeight * 2) {
          appendNextBatch();
        }
      }

      gallery.addEventListener("load", (event) => {
        const img = event.target;
        if (img.tagName !== "IMG") return;
        img.classList.add("is-loaded");

        // Metadata covers the committed images; keep new images usable too.
        if (!img.hasAttribute("width") || !img.hasAttribute("height")) {
          scheduleLayout();
        }
      }, true);

      window.addEventListener("resize", scheduleLayout);

      window.addEventListener("scroll", () => {
        if (activeTooltip && activeImage) {
          const rect = activeImage.getBoundingClientRect();

          if (
            rect.bottom < 0 ||
            rect.top > window.innerHeight ||
            rect.right < 0 ||
            rect.left > window.innerWidth
          ) {
            hideTooltip(activeTooltip);
          } else if (!activeImage.matches(":hover")) {
            positionTooltip(activeTooltip, {
              clientX: rect.right,
              clientY: rect.top
            });
          }
        }

        checkScroll();
      }, { passive: true });

      if ("ResizeObserver" in window) {
        let previousWidth = gallery.clientWidth;

        const observer = new ResizeObserver(() => {
          const currentWidth = gallery.clientWidth;

          // Only respond to width changes, not our own height updates.
          if (currentWidth !== previousWidth) {
            previousWidth = currentWidth;
            scheduleLayout();
          }
        });

        observer.observe(gallery);
      }

      updateControls();
      scheduleLayout();
    })();
