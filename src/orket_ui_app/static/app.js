async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`${url} -> ${response.status}`);
  }
  return response.json();
}

function renderMeta(meta) {
  const summary = document.querySelector("#meta-summary");
  summary.innerHTML = "";

  const rows = [
    ["Extension ID", meta.extension_id],
    ["Host Base URL", meta.host_base_url],
    ["Observed Path", meta.observed_path],
    ["Observed Result", meta.observed_result],
  ];

  for (const [label, value] of rows) {
    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    detail.textContent = value;
    summary.append(term, detail);
  }

  const blockedList = document.querySelector("#blocked-actions");
  blockedList.innerHTML = "";
  for (const action of meta.write_actions_blocked) {
    const item = document.createElement("li");
    item.textContent = action;
    blockedList.appendChild(item);
  }

  const designTabs = document.querySelector("#design-tabs");
  designTabs.innerHTML = "";
  for (const tab of meta.design_tabs) {
    const article = document.createElement("article");
    article.className = "tab-card";
    article.innerHTML = `
      <p class="eyebrow">${tab.tab_id}</p>
      <h4>${tab.tab_id.replace(/-/g, " ")}</h4>
      <ul>
        <li>screen.png: ${tab.has_screen_png ? "present" : "missing"}</li>
        <li>code.html: ${tab.has_code_html ? "present" : "missing"}</li>
        <li>DESIGN.md: ${tab.has_design_md ? "present" : "missing"}</li>
      </ul>
    `;
    designTabs.appendChild(article);
  }
}

function renderHostHealth(payload) {
  const target = document.querySelector("#host-health");
  target.textContent = JSON.stringify(payload, null, 2);
}

async function main() {
  try {
    const meta = await fetchJson("/api/meta");
    renderMeta(meta);
  } catch (error) {
    renderHostHealth({ ok: false, source: "meta", detail: String(error) });
    return;
  }

  try {
    const hostHealth = await fetchJson("/api/host/health");
    renderHostHealth(hostHealth);
  } catch (error) {
    renderHostHealth({ ok: false, source: "host-health", detail: String(error) });
  }
}

main();
