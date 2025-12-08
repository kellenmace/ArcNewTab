chrome.commands.onCommand.addListener(function (command) {
  if (command === "show-command-bar") {
    show_command_bar();
  }
});

function show_command_bar() {
  // Get all tabs in the current window
  chrome.tabs.query({ currentWindow: true }, function (tabs) {
    // Sanitize tabs to remove local network favicons that trigger permission warnings
    const sanitized_tabs = tabs.map((tab) => {
      if (tab.favIconUrl && is_local_network_url(tab.favIconUrl)) {
        // Return a copy of the tab with the favicon removed
        return { ...tab, favIconUrl: "" };
      }
      return tab;
    });

    // Get the current active tab and send message to content script
    chrome.tabs.query(
      { active: true, currentWindow: true },
      function (active_tabs) {
        const active_tab = active_tabs[0];
        if (active_tab) {
          // Send message to content script with tabs data
          chrome.tabs.sendMessage(
            active_tab.id,
            {
              action: "show-command-bar",
              tabs: sanitized_tabs,
            },
            () => {
              // Catch error if content script is not loaded (e.g. after extension reload)
              if (chrome.runtime.lastError) {
                console.error(
                  "Could not connect to content script:",
                  chrome.runtime.lastError.message
                );
              }
            }
          );
        }
      }
    );
  });
}

function is_local_network_url(url) {
  try {
    const hostname = new URL(url).hostname;
    return (
      hostname === "localhost" ||
      hostname.endsWith(".local") ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      (hostname.startsWith("172.") &&
        parseInt(hostname.split(".")[1], 10) >= 16 &&
        parseInt(hostname.split(".")[1], 10) <= 31)
    );
  } catch (e) {
    return false;
  }
}

// Listen for messages from content script to switch tabs
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "switch-to-tab") {
    chrome.tabs.update(request.tabId, { active: true });
  } else if (request.action === "searchOrNavigate") {
    const query = request.query;
    const is_url = query.includes(".") && !query.includes(" ");

    if (is_url) {
      // It's a URL - navigate directly
      let url = query;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      chrome.tabs.create({ url: url });
    } else {
      // It's a search query - search Google
      const search_url = `https://www.google.com/search?q=${encodeURIComponent(
        query
      )}`;
      chrome.tabs.create({ url: search_url });
    }
  } else if (request.action === "getSearchSuggestions") {
    const query = request.query;
    get_search_suggestions(query).then((suggestions) => {
      sendResponse({ suggestions: suggestions });
    });
    return true; // Keep the message channel open for async response
  } else if (request.action === "createTab") {
    chrome.tabs.create({ url: request.url });
  }
});

// Function to get search suggestions from history and top sites
async function get_search_suggestions(query) {
  try {
    const suggestions = [];

    const history_items = await new Promise((resolve) => {
      chrome.history.search(
        {
          text: query,
          maxResults: 50,
          startTime: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
        },
        resolve
      );
    });

    const top_sites = await new Promise((resolve) => {
      chrome.topSites.get(resolve);
    });

    // Process history items with scoring
    const processed_urls = new Set();
    history_items.forEach((item) => {
      if (item.title && !processed_urls.has(item.url)) {
        const score = calculate_relevance_score(item, query);
        if (score > 0) {
          const favicon_url = get_favicon_url(item.url);

          suggestions.push({
            type: "history",
            title: item.title,
            url: item.url,
            favicon: favicon_url,
            score: score,
          });
          processed_urls.add(item.url);
        }
      }
    });

    // Process top sites with scoring
    top_sites.forEach((site) => {
      if (site.title && !processed_urls.has(site.url)) {
        const score = calculate_relevance_score(site, query);
        if (score > 0) {
          const favicon_url = get_favicon_url(site.url);

          suggestions.push({
            type: "topSite",
            title: site.title,
            url: site.url,
            favicon: favicon_url,
            score: score,
          });
          processed_urls.add(site.url);
        }
      }
    });

    // Sort by relevance score (highest first)
    suggestions.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Remove duplicates and limit results
    const unique_suggestions = suggestions
      .filter(
        (suggestion, index, self) =>
          index === self.findIndex((s) => s.url === suggestion.url)
      )
      .slice(0, 12); // Increased limit before title deduplication

    // Also remove duplicates by title to avoid similar entries
    const final_suggestions = unique_suggestions
      .filter(
        (suggestion, index, self) =>
          index ===
          self.findIndex(
            (s) => s.title.toLowerCase() === suggestion.title.toLowerCase()
          )
      )
      .slice(0, 8);
    return final_suggestions;
  } catch (error) {
    console.error("Error getting search suggestions:", error);
    return [];
  }
}

// Helper function to calculate relevance score
function calculate_relevance_score(item, query) {
  const query_lower = query.toLowerCase();
  const title_lower = item.title ? item.title.toLowerCase() : "";
  const url_lower = item.url.toLowerCase();

  let score = 0;

  // Exact title match (highest priority)
  if (title_lower === query_lower) score += 100;

  // Title starts with query
  if (title_lower.startsWith(query_lower)) score += 50;

  // Query words in title
  const query_words = query_lower.split(" ").filter((word) => word.length > 0);
  query_words.forEach((word) => {
    if (title_lower.includes(word)) score += 20;
  });

  // Partial title match
  if (title_lower.includes(query_lower)) score += 15;

  // URL domain match
  try {
    const domain = new URL(item.url).hostname.toLowerCase();
    if (domain.includes(query_lower)) score += 10;
    if (domain.startsWith(query_lower)) score += 20;
  } catch (e) {
    // Invalid URL, skip domain scoring
  }

  // URL path match
  if (url_lower.includes(query_lower)) score += 5;

  // Recency bonus (for history items)
  if (item.lastVisitTime) {
    const days_since_visit =
      (Date.now() - item.lastVisitTime) / (1000 * 60 * 60 * 24);
    if (days_since_visit < 1) score += 10;
    else if (days_since_visit < 7) score += 5;
    else if (days_since_visit < 30) score += 2;
  }

  return score;
}

function get_favicon_url(page_url) {
  try {
    const url_obj = new URL(page_url);
    // Get favicon URL using Google's favicon service (more reliable)
    return `https://www.google.com/s2/favicons?domain=${url_obj.hostname}&sz=16`;
  } catch {
    // Fallback to direct favicon URL
    return page_url + "/favicon.ico";
  }
}
