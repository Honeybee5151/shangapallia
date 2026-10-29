/**
 * Shangapallia — Interactive Idea Fragments Reader & Archive
 */
(function () {
  "use strict";

  const fragments = Array.isArray(window.IDEA_FRAGMENTS) ? window.IDEA_FRAGMENTS : [];

  // Enrich fragments with plain text & reading time metadata
  const enrichedFragments = fragments.map((frag, index) => {
    const plainBody = frag.blocks
      .map((b) => (b.text ? b.text : (b.html || "").replace(/<[^>]+>/g, "")))
      .join(" ");
    const wordCount = plainBody.trim().split(/\s+/).filter(Boolean).length;
    const readMinutes = Math.max(1, Math.round(wordCount / 210));
    const firstBlockText =
      frag.blocks[0]?.text || (frag.blocks[0]?.html || "").replace(/<[^>]+>/g, "");

    return {
      ...frag,
      index,
      plainBody,
      excerpt: firstBlockText,
      wordCount,
      readMinutes,
      isLongForm: wordCount > 350
    };
  });

  // State
  let activePart = "all";
  let activeCategory = "all";
  let searchQuery = "";
  let currentReaderId = null;
  let fontSizeRem = parseFloat(localStorage.getItem("shangapallia_fontsize") || "1.2");
  if (Number.isNaN(fontSizeRem) || fontSizeRem < 0.95 || fontSizeRem > 1.6) {
    fontSizeRem = 1.2;
  }
  let readerSurface = localStorage.getItem("shangapallia_surface") || "midnight";

  // DOM Elements
  const fragmentsContainer = document.getElementById("fragmentsContainer");
  const partTabs = document.getElementById("partTabs");
  const topicPills = document.getElementById("topicPills");
  const searchInput = document.getElementById("searchInput");
  const searchKbd = document.getElementById("searchKbd");
  const startReadingBtn = document.getElementById("startReadingBtn");
  const openOriginBtn = document.getElementById("openOriginBtn");
  const randomFragmentBtn = document.getElementById("randomFragmentBtn");

  // Reader Modal Elements
  const readerOverlay = document.getElementById("readerOverlay");
  const readerBackdrop = document.getElementById("readerBackdrop");
  const readerShell = document.getElementById("readerShell");
  const readerProgressBar = document.getElementById("readerProgressBar");
  const readerCrumb = document.getElementById("readerCrumb");
  const readerToc = document.getElementById("readerToc");
  const tocToggleBtn = document.getElementById("tocToggleBtn");
  const tocList = document.getElementById("tocList");
  const readerScroll = document.getElementById("readerScroll");
  const readerArticle = document.getElementById("readerArticle");
  const readerPagination = document.getElementById("readerPagination");
  const fontSmallerBtn = document.getElementById("fontSmallerBtn");
  const fontLargerBtn = document.getElementById("fontLargerBtn");
  const readerSurfaceBtn = document.getElementById("readerSurfaceBtn");
  const readerSurfaceLabel = document.getElementById("readerSurfaceLabel");
  const copyLinkBtn = document.getElementById("copyLinkBtn");
  const closeReaderBtn = document.getElementById("closeReaderBtn");
  const toast = document.getElementById("toast");

  let toastTimer = null;

  // Helpers
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlightMatches(text, query) {
    const safe = escapeHtml(text);
    const trimmed = query.trim();
    if (!trimmed) return safe;
    const re = new RegExp(`(${escapeRegExp(escapeHtml(trimmed))})`, "gi");
    return safe.replace(re, '<mark class="search-hit">$1</mark>');
  }

  // Build Topic Filter Pills
  function renderTopicPills() {
    const categories = ["all", ...new Set(enrichedFragments.map((f) => f.category))];
    topicPills.innerHTML = categories
      .map((cat) => {
        const label = cat === "all" ? "All Themes" : cat;
        const isActive = cat === activeCategory;
        return `<button type="button" class="topic-pill${isActive ? " active" : ""}" data-category="${escapeHtml(cat)}">${escapeHtml(label)}</button>`;
      })
      .join("");
  }

  // Filter Fragments
  function getFilteredFragments() {
    const q = searchQuery.trim().toLowerCase();
    return enrichedFragments.filter((frag) => {
      if (activePart !== "all" && frag.part !== activePart) return false;
      if (activeCategory !== "all" && frag.category !== activeCategory) return false;
      if (q) {
        const haystack = [
          frag.numberLabel,
          frag.part,
          frag.category,
          frag.title,
          frag.lead || "",
          frag.plainBody
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      }
      return true;
    });
  }

  // Render Single Card HTML
  function renderCard(frag) {
    const featuredClass = frag.isLongForm && activePart === "all" && !searchQuery.trim()
      ? " fragment-card--featured"
      : "";

    // Build excerpt around search query if searching
    let excerptText = frag.excerpt;
    const q = searchQuery.trim().toLowerCase();
    if (q && !excerptText.toLowerCase().includes(q)) {
      const idx = frag.plainBody.toLowerCase().indexOf(q);
      if (idx !== -1) {
        const start = Math.max(0, idx - 70);
        const end = Math.min(frag.plainBody.length, idx + 190);
        excerptText =
          (start > 0 ? "…" : "") +
          frag.plainBody.slice(start, end).trim() +
          (end < frag.plainBody.length ? "…" : "");
      }
    }

    const titleHtml = highlightMatches(frag.title, searchQuery);
    const leadHtml = frag.lead ? `<p class="card-lead">${highlightMatches(frag.lead, searchQuery)}</p>` : "";
    const excerptHtml = highlightMatches(excerptText, searchQuery);

    return `
      <article
        class="fragment-card${featuredClass}"
        tabindex="0"
        role="button"
        data-fragment-id="${escapeHtml(frag.id)}"
        aria-label="Read Fragment ${escapeHtml(frag.id)}: ${escapeHtml(frag.title)}"
      >
        <div>
          <div class="card-meta">
            <div class="card-meta-left">
              <span class="card-num">${escapeHtml(frag.numberLabel)}</span>
              <span class="card-part">${escapeHtml(frag.part)}</span>
            </div>
            <span class="card-category">${escapeHtml(frag.category)}</span>
          </div>
          <h3 class="card-title">${titleHtml}</h3>
          ${leadHtml}
          <p class="card-excerpt">${excerptHtml}</p>
        </div>

        <div class="card-footer">
          <span class="card-readtime">${frag.readMinutes} min read &middot; ${frag.wordCount} words</span>
          <span class="card-cta">Read fragment &rarr;</span>
        </div>
      </article>
    `;
  }

  // Render Archive Grid (grouped by Del 1, Del 2, Del 3, Who am i? when showing all)
  function renderArchive() {
    const filtered = getFilteredFragments();

    if (filtered.length === 0) {
      fragmentsContainer.innerHTML = `
        <div class="empty-state">
          <h3>No matching fragments</h3>
          <p>Try clearing your search or switching sections to explore all 16 entries.</p>
          <button type="button" class="btn btn-secondary btn-sm" id="resetFiltersBtn">Reset Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById("resetFiltersBtn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          activePart = "all";
          activeCategory = "all";
          searchQuery = "";
          searchInput.value = "";
          syncPartTabs();
          renderTopicPills();
          renderArchive();
        });
      }
      return;
    }

    const shouldGroupByPart =
      activePart === "all" && activeCategory === "all" && !searchQuery.trim();

    if (shouldGroupByPart) {
      const partsOrder = ["Del 1", "Del 2", "Del 3", "Who am i?"];
      fragmentsContainer.innerHTML = partsOrder
        .map((partName) => {
          const items = filtered.filter((f) => f.part === partName);
          if (!items.length) return "";
          const countLabel = items.length === 1 ? "1 entry" : `${items.length} entries`;
          return `
            <div class="part-group" data-part-section="${escapeHtml(partName)}">
              <div class="part-divider">
                <h3 class="part-divider-title">${escapeHtml(partName)}</h3>
                <div class="part-divider-line" aria-hidden="true"></div>
                <span class="part-divider-count">${countLabel}</span>
              </div>
              <div class="fragments-grid">
                ${items.map(renderCard).join("")}
              </div>
            </div>
          `;
        })
        .join("");
    } else {
      fragmentsContainer.innerHTML = `
        <div class="fragments-grid">
          ${filtered.map(renderCard).join("")}
        </div>
      `;
    }
  }

  function syncPartTabs() {
    partTabs.querySelectorAll(".part-tab").forEach((btn) => {
      const isMatch = btn.dataset.part === activePart;
      btn.classList.toggle("active", isMatch);
      btn.setAttribute("aria-selected", String(isMatch));
    });
  }

  // Build Reader Table of Contents
  function renderToc() {
    const partsOrder = ["Del 1", "Del 2", "Del 3", "Who am i?"];
    tocList.innerHTML = partsOrder
      .map((partName) => {
        const items = enrichedFragments.filter((f) => f.part === partName);
        if (!items.length) return "";
        return `
          <div class="toc-part-heading">${escapeHtml(partName)}</div>
          ${items
            .map(
              (f) => `
              <button
                type="button"
                class="toc-item${f.id === currentReaderId ? " active" : ""}"
                data-toc-id="${escapeHtml(f.id)}"
              >
                <span class="toc-item-num">${escapeHtml(f.numberLabel)}</span>
                <span>${escapeHtml(f.title)}</span>
              </button>
            `
            )
            .join("")}
        `;
      })
      .join("");
  }

  // Apply Reader Preferences
  function applyReaderPreferences() {
    document.documentElement.style.setProperty("--reader-font-size", `${fontSizeRem.toFixed(2)}rem`);
    if (readerSurface === "paper") {
      readerShell.setAttribute("data-surface", "paper");
      readerSurfaceLabel.textContent = "Midnight";
    } else {
      readerShell.removeAttribute("data-surface");
      readerSurfaceLabel.textContent = "Paper";
    }
  }

  // Open Reader for a specific Fragment ID
  function openReader(fragmentId, updateHash = true) {
    const frag = enrichedFragments.find((f) => f.id === String(fragmentId));
    if (!frag) return;

    currentReaderId = frag.id;
    readerCrumb.textContent = `${frag.part} · Fragment ${frag.numberLabel.replace(/[:.]$/, "")}`;

    const blocksHtml = frag.blocks
      .map((block) => {
        if (block.type === "h3") {
          return `<h3>${escapeHtml(block.text)}</h3>`;
        }
        if (block.type === "signoff") {
          return `<p class="reader-signoff">${escapeHtml(block.text)}</p>`;
        }
        if (block.type === "note") {
          return `<div class="reader-note">${escapeHtml(block.text)}</div>`;
        }
        if (block.html) {
          return `<p>${block.html}</p>`;
        }
        return `<p>${escapeHtml(block.text)}</p>`;
      })
      .join("");

    readerArticle.innerHTML = `
      <div class="reader-meta-top">
        <span class="reader-num-badge">${escapeHtml(frag.numberLabel)}</span>
        <span class="reader-category-tag">${escapeHtml(frag.part)}</span>
        <span class="reader-category-tag">${escapeHtml(frag.category)}</span>
        <span class="reader-category-tag">${frag.readMinutes} min read</span>
      </div>
      <h2 class="reader-title" id="readerArticleTitle">${escapeHtml(frag.title)}</h2>
      ${frag.lead ? `<p class="reader-lead">${escapeHtml(frag.lead)}</p>` : ""}
      <div class="reader-prose">
        ${blocksHtml}
      </div>
    `;

    // Prev / Next Pagination
    const prevFrag = enrichedFragments[frag.index - 1] || null;
    const nextFrag = enrichedFragments[frag.index + 1] || null;

    readerPagination.innerHTML = `
      <div>
        ${
          prevFrag
            ? `<button type="button" class="page-nav-btn" data-nav-id="${escapeHtml(prevFrag.id)}">
                <span class="page-nav-dir">&larr; Previous (${escapeHtml(prevFrag.numberLabel)})</span>
                <span class="page-nav-title">${escapeHtml(prevFrag.title)}</span>
              </button>`
            : ""
        }
      </div>
      <div>
        ${
          nextFrag
            ? `<button type="button" class="page-nav-btn page-nav-btn--next" data-nav-id="${escapeHtml(nextFrag.id)}">
                <span class="page-nav-dir">Next (${escapeHtml(nextFrag.numberLabel)}) &rarr;</span>
                <span class="page-nav-title">${escapeHtml(nextFrag.title)}</span>
              </button>`
            : ""
        }
      </div>
    `;

    renderToc();

    // Auto-collapse TOC on narrow viewports so article text takes full screen
    if (window.innerWidth <= 900) {
      readerToc.classList.add("collapsed");
      tocToggleBtn.setAttribute("aria-expanded", "false");
    }

    const wasHidden = readerOverlay.hidden;
    readerOverlay.hidden = false;
    document.body.classList.add("reader-open");

    readerScroll.scrollTop = 0;
    updateReadingProgress();

    if (wasHidden) {
      readerScroll.focus();
    }

    if (updateHash) {
      history.replaceState(null, "", `#fragment-${frag.id}`);
    }
  }

  function closeReader(clearHash = true) {
    if (readerOverlay.hidden) return;
    readerOverlay.hidden = true;
    document.body.classList.remove("reader-open");
    currentReaderId = null;
    if (clearHash && window.location.hash.startsWith("#fragment-")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  function updateReadingProgress() {
    const maxScroll = readerScroll.scrollHeight - readerScroll.clientHeight;
    if (maxScroll <= 0) {
      readerProgressBar.style.width = "100%";
      return;
    }
    const pct = Math.min(100, Math.max(0, (readerScroll.scrollTop / maxScroll) * 100));
    readerProgressBar.style.width = `${pct.toFixed(1)}%`;
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 2200);
  }

  // Event Listeners
  partTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".part-tab");
    if (!btn) return;
    activePart = btn.dataset.part;
    syncPartTabs();
    renderArchive();
  });

  topicPills.addEventListener("click", (e) => {
    const pill = e.target.closest(".topic-pill");
    if (!pill) return;
    activeCategory = pill.dataset.category;
    renderTopicPills();
    renderArchive();
  });

  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value;
    searchKbd.style.display = searchQuery ? "none" : "";
    renderArchive();
  });

  // Hero Part Jump Cards
  document.querySelectorAll(".part-jump-card").forEach((card) => {
    card.addEventListener("click", () => {
      const targetPart = card.dataset.jumpPart;
      if (targetPart === "Who am i?") {
        openReader("0");
        return;
      }
      activePart = targetPart;
      activeCategory = "all";
      searchQuery = "";
      searchInput.value = "";
      syncPartTabs();
      renderTopicPills();
      renderArchive();
      document.getElementById("fragments").scrollIntoView({ behavior: "smooth" });
    });
  });

  // Card clicks & keyboard activation
  fragmentsContainer.addEventListener("click", (e) => {
    const card = e.target.closest(".fragment-card");
    if (!card) return;
    openReader(card.dataset.fragmentId);
  });

  fragmentsContainer.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const card = e.target.closest(".fragment-card");
      if (!card) return;
      e.preventDefault();
      openReader(card.dataset.fragmentId);
    }
  });

  // Buttons
  startReadingBtn.addEventListener("click", () => openReader("1"));
  openOriginBtn.addEventListener("click", () => openReader("0"));

  randomFragmentBtn.addEventListener("click", () => {
    const pool = enrichedFragments.filter((f) => f.id !== currentReaderId);
    const chosen = pool[Math.floor(Math.random() * pool.length)] || enrichedFragments[0];
    if (chosen) openReader(chosen.id);
  });

  // Reader Controls
  closeReaderBtn.addEventListener("click", () => closeReader());
  readerBackdrop.addEventListener("click", () => closeReader());

  tocToggleBtn.addEventListener("click", () => {
    const isCollapsed = readerToc.classList.toggle("collapsed");
    tocToggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
  });

  tocList.addEventListener("click", (e) => {
    const btn = e.target.closest(".toc-item");
    if (!btn) return;
    openReader(btn.dataset.tocId);
  });

  readerPagination.addEventListener("click", (e) => {
    const btn = e.target.closest(".page-nav-btn");
    if (!btn) return;
    openReader(btn.dataset.navId);
  });

  readerScroll.addEventListener("scroll", updateReadingProgress, { passive: true });

  fontSmallerBtn.addEventListener("click", () => {
    fontSizeRem = Math.max(0.95, fontSizeRem - 0.08);
    localStorage.setItem("shangapallia_fontsize", fontSizeRem.toFixed(2));
    applyReaderPreferences();
    updateReadingProgress();
  });

  fontLargerBtn.addEventListener("click", () => {
    fontSizeRem = Math.min(1.55, fontSizeRem + 0.08);
    localStorage.setItem("shangapallia_fontsize", fontSizeRem.toFixed(2));
    applyReaderPreferences();
    updateReadingProgress();
  });

  readerSurfaceBtn.addEventListener("click", () => {
    readerSurface = readerSurface === "paper" ? "midnight" : "paper";
    localStorage.setItem("shangapallia_surface", readerSurface);
    applyReaderPreferences();
  });

  copyLinkBtn.addEventListener("click", async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Direct link copied to clipboard");
    } catch {
      showToast("Link: " + url);
    }
  });

  // Global Keyboard Shortcuts
  document.addEventListener("keydown", (e) => {
    // Slash focuses search when reader is closed
    if (
      e.key === "/" &&
      readerOverlay.hidden &&
      document.activeElement !== searchInput &&
      !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
    ) {
      e.preventDefault();
      searchInput.focus();
      return;
    }

    if (!readerOverlay.hidden) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeReader();
      } else if (e.key === "ArrowLeft" && !e.altKey && !e.metaKey && !e.ctrlKey) {
        const curr = enrichedFragments.find((f) => f.id === currentReaderId);
        if (curr && curr.index > 0) {
          openReader(enrichedFragments[curr.index - 1].id);
        }
      } else if (e.key === "ArrowRight" && !e.altKey && !e.metaKey && !e.ctrlKey) {
        const curr = enrichedFragments.find((f) => f.id === currentReaderId);
        if (curr && curr.index < enrichedFragments.length - 1) {
          openReader(enrichedFragments[curr.index + 1].id);
        }
      }
    }
  });

  // Deep-link hash routing (#fragment-8, #fragment-0, etc.)
  function checkUrlHash() {
    const match = window.location.hash.match(/^#fragment-(.+)$/);
    if (match) {
      openReader(decodeURIComponent(match[1]), false);
    }
  }

  window.addEventListener("hashchange", checkUrlHash);

  // Initialize
  applyReaderPreferences();
  renderTopicPills();
  renderArchive();
  checkUrlHash();
})();
