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
  const tools = await fetchTools();
  if (tools.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'no-tools';
    msg.textContent = 'No tools available yet. Check back soon!';
    container.appendChild(msg);
    return;
  }
  tools.forEach((tool) => {
    const card = document.createElement('div');
    card.className = 'tool-card';
    card.innerHTML = `
      <h2>${tool.name}</h2>
      <p>${tool.tagline || ''}</p>
      <p class="price">${tool.price ? '€' + Number(tool.price).toFixed(2) : 'Free'}</p>
      <a href="tool.html?slug=${encodeURIComponent(tool.slug)}" class="details-link">View Details</a>
    `;
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
  if (tool.videoUrl) {
    videoSection = `<div class="video-wrapper"><iframe src="${tool.videoUrl}" allowfullscreen></iframe></div>`;
  } else {
    videoSection = '<p><em>Video coming soon.</em></p>';
  }
  const featuresList = (tool.features && tool.features.length)
    ? '<ul>' + tool.features.map((f) => `<li>${f}</li>`).join('') + '</ul>'
    : '<p>No features listed.</p>';
  const priceLine = tool.price
    ? `<p class="price">Price: €${Number(tool.price).toFixed(2)}</p>`
    : '<p class="price">Free</p>';
  const purchaseButton = tool.purchaseUrl
    ? `<a href="${tool.purchaseUrl}" class="buy-button">Buy Now</a>`
    : '<p><em>Purchase link coming soon.</em></p>';
  const repoLink = tool.repoUrl
    ? `<a href="${tool.repoUrl}" class="repo-link" target="_blank">Source &amp; Releases on GitHub</a>`
    : '';
  main.innerHTML = `
    <h1>${tool.name}</h1>
    <p>${tool.description || ''}</p>
    ${videoSection}
    <h2>Features</h2>
    ${featuresList}
    ${priceLine}
    <div class="actions">
      ${purchaseButton}
      ${repoLink}
    </div>
  `;
}

// Initialise pages when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadTools();
  loadToolDetail();
});