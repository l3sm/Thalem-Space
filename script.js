/*
 * Shared JavaScript for Thalem Space
 *
 * This script powers the tools listing and individual tool pages by
 * fetching a JSON catalogue. It is deliberately simple so it can run
 * entirely in the browser without any build step or backend. When you
 * add new tools, update `data/tools.json` and the pages will
 * automatically reflect the changes.
 */

/**
 * Fetch the tools catalogue from the JSON file.
 *
 * @returns {Promise<Array>} A promise that resolves to an array of tools.
 */
async function fetchTools() {
  try {
    const response = await fetch('data/tools.json');
    if (!response.ok) {
      throw new Error(`Failed to load tools: ${response.status}`);
    }
    const tools = await response.json();
    return Array.isArray(tools) ? tools : [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

/**
 * Populate the tools grid on the browsing page.
 */
async function loadTools() {
  const container = document.getElementById('tools-container');
  if (!container) return;
  container.innerHTML = '';
  const tools = await fetchTools();
  if (tools.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'no-tools';
    msg.textContent = 'No tools available yet. Check back soon!';
    container.appendChild(msg);
    return;
  }
  tools.forEach((tool) => {
    const card = document.createElement('a');
    card.className = 'tool-card';
    card.href = `tool.html?slug=${encodeURIComponent(tool.slug)}`;

    const media = getMediaElement(tool);
    if (media) {
      card.appendChild(media);
    }

    const content = document.createElement('div');
    content.className = 'tool-card-content';
    const title = document.createElement('h2');
    title.textContent = tool.name;
    const tagline = document.createElement('p');
    tagline.className = 'tool-tagline';
    tagline.textContent = tool.tagline || '';
    const priceEl = document.createElement('p');
    priceEl.className = 'tool-price';
    priceEl.textContent = getPriceLabel(tool);
    priceEl.setAttribute('aria-hidden', 'true');
    content.append(title, tagline, priceEl);
    card.appendChild(content);
    container.appendChild(card);
  });
}

/**
 * Populate the tool detail page based on the slug parameter.
 */
async function loadToolDetail() {
  const main = document.getElementById('tool-main');
  if (!main) return;
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) {
    main.innerHTML = '<p>Tool not specified.</p>';
    return;
  }
  const tools = await fetchTools();
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) {
    main.innerHTML = '<p>Tool not found.</p>';
    return;
  }
  // Build the tool detail markup
  let videoSection = '';
  const videoUrl = tool.video_url || tool.videoUrl;
  if (videoUrl) {
    videoSection = `<div class="video-wrapper"><iframe src="${getVideoEmbedUrl(videoUrl)}" allowfullscreen></iframe></div>`;
  } else {
    videoSection = '<p><em>Video coming soon.</em></p>';
  }
  const featuresList = (tool.features && tool.features.length)
    ? '<ul>' + tool.features.map((f) => `<li>${f}</li>`).join('') + '</ul>'
    : '<p>No features listed.</p>';
  const priceValue = Number(tool.price_eur ?? tool.price ?? 0);
  const priceLine = priceValue
    ? `<p class="price">Price: €${formatPrice(priceValue)}</p>`
    : '<p class="price">Free</p>';
  const buyLabel = priceValue ? `Buy (€${formatPrice(priceValue)})` : 'Buy';
  const repoUrl = tool.repo_url || tool.repoUrl;
  const releaseUrl = tool.release_url || tool.releaseUrl;
  const watchUrl = videoUrl || '';
  const forWhoList = renderList(tool.for_who || tool.forWho, 'No audience listed.');
  const notForList = renderList(tool.not_for || tool.notFor, 'No exclusions listed.');
  main.innerHTML = `
    <h1>${tool.name}</h1>
    <p class="tagline">${tool.tagline || ''}</p>
    <p>${tool.description || ''}</p>
    ${videoSection}
    <h2>Features</h2>
    ${featuresList}
    <h2>Who it's for</h2>
    ${forWhoList}
    <h2>Not for</h2>
    ${notForList}
    ${priceLine}
    <div class="actions">
      <button type="button" class="buy-button" data-buy="placeholder">${buyLabel}</button>
      <div class="action-links">
        ${watchUrl ? `<a href="${watchUrl}" target="_blank">Watch the demo</a>` : ''}
        ${releaseUrl ? `<a href="${releaseUrl}" target="_blank">View releases</a>` : ''}
        ${repoUrl ? `<a href="${repoUrl}" target="_blank">View source</a>` : ''}
      </div>
      <p class="buy-notice" hidden>Payments are not enabled yet. This will be available when thalem.space launches.</p>
    </div>
  `;
  const buyButton = main.querySelector('[data-buy="placeholder"]');
  const buyNotice = main.querySelector('.buy-notice');
  if (buyButton && buyNotice) {
    buyButton.addEventListener('click', () => {
      buyNotice.hidden = false;
    });
  }
}

function formatPrice(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function getPriceLabel(tool) {
  const value = Number(tool.price_eur ?? tool.price ?? 0);
  if (!value) return 'Free';
  return `${formatPrice(value)} EUR`;
}

function getMediaElement(tool) {
  if (!tool.image) return null;
  const media = document.createElement('div');
  media.className = 'tool-media';
  const img = document.createElement('img');
  img.className = 'tool-media-image';
  img.src = `assets/${tool.image}`;
  img.alt = tool.name ? `${tool.name} screenshot` : 'tool screenshot';
  img.loading = 'lazy';
  media.appendChild(img);
  return media;
}

function getVideoEmbedUrl(url) {
  if (url.includes('youtube.com/embed/')) return url;
  const match = url.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
}

function renderList(value, fallback) {
  if (Array.isArray(value) && value.length) {
    return '<ul>' + value.map((item) => `<li>${item}</li>`).join('') + '</ul>';
  }
  if (typeof value === 'string' && value.trim()) {
    return `<p>${value}</p>`;
  }
  return `<p>${fallback}</p>`;
}

// Initialise pages when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadTools();
  loadToolDetail();
});
