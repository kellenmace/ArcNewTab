chrome.commands.onCommand.addListener(function (command) {
  if (command === "show-command-bar") {
    showCommandBar();
  }
});

function showCommandBar() {
  // Get all tabs in the current window
  chrome.tabs.query({ currentWindow: true }, function (tabs) {
    // Sanitize tabs to remove local network favicons that trigger permission warnings
    const sanitizedTabs = tabs.map((tab) => {
      if (tab.favIconUrl && isLocalNetworkUrl(tab.favIconUrl)) {
        // Return a copy of the tab with the favicon removed
        return { ...tab, favIconUrl: "" };
      }
      return tab;
    });

    // Get the current active tab and send message to content script
    chrome.tabs.query(
      { active: true, currentWindow: true },
      function (activeTabs) {
        const activeTab = activeTabs[0];
        if (activeTab) {
          // Send message to content script with tabs data
          chrome.tabs.sendMessage(
            activeTab.id,
            {
              action: "show-command-bar",
              tabs: sanitizedTabs,
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

function isLocalNetworkUrl(url) {
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
    const isUrl = query.includes(".") && !query.includes(" ");

    if (isUrl) {
      // It's a URL - navigate directly
      let url = query;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      chrome.tabs.create({ url: url });
    } else {
      // It's a search query - search Google
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
        query
      )}`;
      chrome.tabs.create({ url: searchUrl });
    }
  } else if (request.action === "getSearchSuggestions") {
    const query = request.query;
    getSearchSuggestions(query).then((suggestions) => {
      sendResponse({ suggestions: suggestions });
    });
    return true; // Keep the message channel open for async response
  } else if (request.action === "createTab") {
    chrome.tabs.create({ url: request.url });
  }
});

// Function to get search suggestions from history and top sites
async function getSearchSuggestions(query) {
  try {
    const suggestions = [];

    const historyItems = await new Promise((resolve) => {
      chrome.history.search(
        {
          text: query,
          maxResults: 50,
          startTime: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
        },
        resolve
      );
    });

    const topSites = await new Promise((resolve) => {
      chrome.topSites.get(resolve);
    });

    // Process history items with scoring
    const processedUrls = new Set();
    historyItems.forEach((item) => {
      if (item.title && !processedUrls.has(item.url)) {
        const score = calculateRelevanceScore(item, query);
        if (score > 0) {
          const faviconUrl = getFaviconUrl(item.url);

          suggestions.push({
            type: "history",
            title: item.title,
            url: item.url,
            favicon: faviconUrl,
            score: score,
          });
          processedUrls.add(item.url);
        }
      }
    });

    // Process top sites with scoring
    topSites.forEach((site) => {
      if (site.title && !processedUrls.has(site.url)) {
        const score = calculateRelevanceScore(site, query);
        if (score > 0) {
          const faviconUrl = getFaviconUrl(site.url);

          suggestions.push({
            type: "topSite",
            title: site.title,
            url: site.url,
            favicon: faviconUrl,
            score: score,
          });
          processedUrls.add(site.url);
        }
      }
    });

    // Sort by relevance score (highest first)
    suggestions.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter(
        (suggestion, index, self) =>
          index === self.findIndex((s) => s.url === suggestion.url)
      )
      .slice(0, 12); // Increased limit before title deduplication

    // Also remove duplicates by title to avoid similar entries
    const finalSuggestions = uniqueSuggestions
      .filter(
        (suggestion, index, self) =>
          index ===
          self.findIndex(
            (s) => s.title.toLowerCase() === suggestion.title.toLowerCase()
          )
      )
      .slice(0, 8);
    return finalSuggestions;
  } catch (error) {
    console.error("Error getting search suggestions:", error);
    return [];
  }
}

// Helper function to calculate relevance score
function calculateRelevanceScore(item, query) {
  const queryLower = query.toLowerCase();
  const titleLower = item.title ? item.title.toLowerCase() : "";
  const urlLower = item.url.toLowerCase();

  let score = 0;

  // Exact title match (highest priority)
  if (titleLower === queryLower) score += 100;

  // Title starts with query
  if (titleLower.startsWith(queryLower)) score += 50;

  // Query words in title
  const queryWords = queryLower.split(" ").filter((word) => word.length > 0);
  queryWords.forEach((word) => {
    if (titleLower.includes(word)) score += 20;
  });

  // Partial title match
  if (titleLower.includes(queryLower)) score += 15;

  // URL domain match
  try {
    const domain = new URL(item.url).hostname.toLowerCase();
    if (domain.includes(queryLower)) score += 10;
    if (domain.startsWith(queryLower)) score += 20;
  } catch (e) {
    // Invalid URL, skip domain scoring
  }

  // URL path match
  if (urlLower.includes(queryLower)) score += 5;

  // Recency bonus (for history items)
  if (item.lastVisitTime) {
    const daysSinceVisit =
      (Date.now() - item.lastVisitTime) / (1000 * 60 * 60 * 24);
    if (daysSinceVisit < 1) score += 10;
    else if (daysSinceVisit < 7) score += 5;
    else if (daysSinceVisit < 30) score += 2;
  }

  return score;
}

function getFaviconUrl(pageUrl) {
  try {
    const urlObj = new URL(pageUrl);
    // Get favicon URL using Google's favicon service (more reliable)
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=16`;
  } catch {
    // Fallback to direct favicon URL
    return pageUrl + "/favicon.ico";
  }
}
