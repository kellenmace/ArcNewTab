// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "show-command-bar") {
    showCommandBar(request.tabs);
  }
});

function showCommandBar(tabs) {
  // Helper function to remove overlay and clean up styles
  function removeOverlay(overlayElement) {
    if (overlayElement) {
      overlayElement.remove();
    }
    // Also remove the scrollbar style
    const scrollbarStyle = document.getElementById(
      "_x_extension_scrollbar_style_2024_unique_"
    );
    if (scrollbarStyle) {
      scrollbarStyle.remove();
    }
  }

  // Check if the overlay already exists
  let overlay = document.getElementById("_x_extension_overlay_2024_unique_");

  if (overlay) {
    // If it exists, just focus the input and return (don't toggle off)
    const existingInput = document.getElementById(
      "_x_extension_search_input_2024_unique_"
    );
    if (existingInput) {
      existingInput.focus();
      existingInput.select();
    }
    return;
  } else {
    // If it doesn't exist, create it (toggle on)
    overlay = document.createElement("div");
    overlay.id = "_x_extension_overlay_2024_unique_";
    overlay.style.cssText = `
      all: unset !important;
      position: fixed !important;
      top: 20vh !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      width: 50vw !important;
      max-width: 90vw !important;
      max-height: 75vh !important;
      background:rgba(41, 41, 41, 0.8) !important;
      backdrop-filter: blur(20px) saturate(180%) !important;
      -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
      border: 1px solid rgba(17, 17, 17, 1) !important;
      border-radius: 10px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      z-index: 2147483647 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 1px !important;
      line-height: 1 !important;
      text-decoration: none !important;
      list-style: none !important;
      outline: none !important;
      color: inherit !important;
      font-size: 100% !important;
      font: inherit !important;
      vertical-align: baseline !important;
    `;

    // Add Inter font with unique ID
    const fontLink = document.createElement("link");
    fontLink.id = "_x_extension_font_2024_unique_";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);

    // Add style to hide scrollbars for WebKit browsers
    const scrollbarStyle = document.createElement("style");
    scrollbarStyle.id = "_x_extension_scrollbar_style_2024_unique_";
    scrollbarStyle.textContent = `
      #_x_extension_overlay_2024_unique_ *::-webkit-scrollbar {
        display: none !important;
      }
      #_x_extension_overlay_2024_unique_ * {
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
      }
    `;
    document.head.appendChild(scrollbarStyle);

    // Create the search input with icon
    const searchInput = document.createElement("input");
    searchInput.id = "_x_extension_search_input_2024_unique_";
    searchInput.autocomplete = "off";
    searchInput.type = "text";
    searchInput.placeholder = "Search or Enter URL...";
    searchInput.style.cssText = `
      all: unset !important;
      width: 100% !important;
      padding: 20px 22px 20px 50px !important;
      background: #1A1A1A !important;
      border: none !important;
      border-bottom: 1px solid #313131 !important;
      color: #E3E4E8 !important;
      font-size: 16px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      font-weight: 500 !important;
      outline: none !important;
      border-radius: 8px 8px 0 0 !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      line-height: 1 !important;
      text-decoration: none !important;
      list-style: none !important;
      display: block !important;
      vertical-align: baseline !important;
      caret-color: #007AFF !important;
    `;

    // Create search icon
    const searchIcon = document.createElement("div");
    searchIcon.id = "_x_extension_search_icon_2024_unique_";
    searchIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E3E4E8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="_x_extension_svg_2024_unique_"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>`;
    searchIcon.style.cssText = `
      all: unset !important;
      position: absolute !important;
      left: 20px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      color: #9CA3AF !important;
      pointer-events: none !important;
      z-index: 1 !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
      line-height: 1 !important;
      text-decoration: none !important;
      list-style: none !important;
      outline: none !important;
      background: transparent !important;
      font-size: 100% !important;
      font: inherit !important;
      vertical-align: baseline !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    `;

    // Add focus styles
    searchInput.addEventListener("focus", function () {
      selectedIndex = -1;
      updateSelection();
    });

    searchInput.addEventListener("blur", function () {
      // Don't change selectedIndex here to allow keyboard navigation
    });

    // Add input event for search suggestions
    searchInput.addEventListener("input", function () {
      const query = this.value.trim();
      if (query.length > 0) {
        // Get search suggestions
        chrome.runtime.sendMessage(
          {
            action: "getSearchSuggestions",
            query: query,
          },
          function (response) {
            if (response && response.suggestions) {
              updateSearchSuggestions(response.suggestions, query, tabs);
            }
          }
        );
      } else {
        // Clear suggestions and show tabs
        clearSearchSuggestions();
      }
    });

    // Add click outside to close functionality
    // Use setTimeout to prevent the same click that triggered the popup from closing it
    const clickOutsideHandler = function (e) {
      if (!overlay.contains(e.target)) {
        removeOverlay(overlay);
        document.removeEventListener("click", clickOutsideHandler);
      }
    };
    setTimeout(() => {
      document.addEventListener("click", clickOutsideHandler);
    }, 0);

    // Add keyboard navigation
    let selectedIndex = -1; // -1 means input is focused, 0+ means suggestion is selected
    const suggestionItems = [];
    let currentSuggestions = []; // Store current suggestions for keyboard navigation

    const keydownHandler = function (e) {
      if (e.key === "Escape" && overlay) {
        removeOverlay(overlay);
        document.removeEventListener("keydown", keydownHandler);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (selectedIndex === -1) {
          // Move from input to first suggestion
          selectedIndex = 0;
          searchInput.blur();
        } else {
          // Move to next suggestion
          selectedIndex = (selectedIndex + 1) % suggestionItems.length;
        }
        updateSelection();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (selectedIndex === 0) {
          // Move from first suggestion back to input
          selectedIndex = -1;
          searchInput.focus();
        } else if (selectedIndex === -1) {
          // Move from input to last suggestion
          selectedIndex = suggestionItems.length - 1;
          searchInput.blur();
        } else {
          // Move to previous suggestion
          selectedIndex = selectedIndex - 1;
        }
        updateSelection();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const query = searchInput.value.trim();

        if (selectedIndex >= 0 && suggestionItems[selectedIndex]) {
          // Get the selected suggestion
          const selectedSuggestion = currentSuggestions[selectedIndex];

          if (selectedSuggestion) {
            if (selectedSuggestion.type === "tab") {
              // Switch to existing tab
              chrome.runtime.sendMessage({
                action: "switch-to-tab",
                tabId: selectedSuggestion.id,
              });
            } else {
              // Navigate to the suggested URL (history, top site, new tab, chatgpt, perplexity)
              console.log("Opening URL from keyboard:", selectedSuggestion.url);
              chrome.runtime.sendMessage({
                action: "createTab",
                url: selectedSuggestion.url,
              });
            }
          }
          removeOverlay(overlay);
          document.removeEventListener("click", clickOutsideHandler);
          document.removeEventListener("keydown", keydownHandler);
        } else if (query) {
          // Handle search or URL navigation
          chrome.runtime.sendMessage({
            action: "searchOrNavigate",
            query: query,
          });
          removeOverlay(overlay);
          document.removeEventListener("click", clickOutsideHandler);
          document.removeEventListener("keydown", keydownHandler);
        }
      }
    };

    document.addEventListener("keydown", keydownHandler);

    function updateSelection() {
      suggestionItems.forEach((item, index) => {
        if (index === selectedIndex) {
          // Add selected background
          item.style.setProperty("background-color", "#313131", "important");
          // Update button color
          const button = item.querySelector("button");
          if (button) {
            button.style.setProperty("color", "white", "important");
          }
        } else {
          // Reset to default background
          item.style.setProperty("background-color", "#1A1A1A", "important");
          // Reset button color
          const button = item.querySelector("button");
          if (button) {
            button.style.setProperty("color", "#656565", "important");
          }
        }
      });
    }

    function updateSearchSuggestions(suggestions, query, allTabs) {
      // Clear existing suggestions
      suggestionsContainer.innerHTML = "";
      suggestionItems.length = 0;

      // Filter tabs that match the query
      const queryLower = query.toLowerCase();
      const matchingTabs = allTabs.filter((tab) => {
        const titleLower = (tab.title || "").toLowerCase();
        const urlLower = tab.url.toLowerCase();
        return titleLower.includes(queryLower) || urlLower.includes(queryLower);
      });

      // Add New Tab suggestion as first item
      const newTabSuggestion = {
        type: "newtab",
        title: "New Tab",
        url: "chrome://newtab/",
        favicon:
          "https://img.icons8.com/?size=100&id=ejub91zEY6Sl&format=png&color=000000",
      };

      // Add ChatGPT suggestion as second item
      const chatGptSuggestion = {
        type: "chatgpt",
        title: `Ask ChatGPT: "${query}"`,
        url: `https://chatgpt.com/?q=${encodeURIComponent(query)}`,
        favicon:
          "https://img.icons8.com/?size=100&id=fO5yVwARGUEB&format=png&color=ffffff",
      };

      // Add Perplexity suggestion as third item
      const perplexitySuggestion = {
        type: "perplexity",
        title: `Ask Perplexity: "${query}"`,
        url: `https://perplexity.ai/search?q=${encodeURIComponent(query)}`,
        favicon:
          "https://img.icons8.com/?size=100&id=kzJWN5jCDzpq&format=png&color=000000",
      };

      // Build suggestions list: matching tabs first, then New Tab, ChatGPT, Perplexity, then history/top sites
      const allSuggestions = [
        ...matchingTabs.map((tab) => ({ type: "tab", ...tab })),
        newTabSuggestion,
        chatGptSuggestion,
        perplexitySuggestion,
        ...suggestions,
      ];
      currentSuggestions = allSuggestions; // Store current suggestions including tabs

      // Add search suggestions
      allSuggestions.forEach((suggestion, index) => {
        const suggestionItem = document.createElement("div");
        suggestionItem.id = `_x_extension_suggestion_item_${index}_2024_unique_`;
        const isLastItem = index === allSuggestions.length - 1;
        suggestionItem.style.cssText = `
          all: unset !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 12px 16px !important;
          background: #1A1A1A !important;
          border-radius: 6px !important;
          margin-bottom: ${isLastItem ? "0" : "4px"} !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
          box-sizing: border-box !important;
          margin: 0 0 ${isLastItem ? "0" : "4px"} 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          color: inherit !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
        `;

        suggestionItems.push(suggestionItem);

        // Create left side with icon and title
        const leftSide = document.createElement("div");
        leftSide.style.cssText = `
          all: unset !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          flex: 1 !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          background: transparent !important;
          color: inherit !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
        `;

        // Create icon for suggestions - always use img for all types
        const favicon = document.createElement("img");
        favicon.src = suggestion.favicon || suggestion.favIconUrl || "";
        favicon.style.cssText = `
          all: unset !important;
          width: 16px !important;
          height: 16px !important;
          border-radius: 2px !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          background: transparent !important;
          color: inherit !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
          display: block !important;
          object-fit: contain !important;
        `;

        // Fallback to search icon if favicon fails to load
        favicon.onerror = function () {
          // Replace with search icon SVG if favicon fails
          const searchIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E3E4E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>`;
          const fallbackDiv = document.createElement("div");
          fallbackDiv.innerHTML = searchIconSvg;
          fallbackDiv.style.cssText = `
            all: unset !important;
            width: 16px !important;
            height: 16px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1 !important;
            text-decoration: none !important;
            list-style: none !important;
            outline: none !important;
            background: transparent !important;
            color: inherit !important;
            font-size: 100% !important;
            font: inherit !important;
            vertical-align: baseline !important;
          `;
          favicon.parentNode.replaceChild(fallbackDiv, favicon);
        };

        // Create title with highlighted query
        const title = document.createElement("span");
        let highlightedTitle;
        if (
          suggestion.type === "chatgpt" ||
          suggestion.type === "perplexity" ||
          suggestion.type === "newtab"
        ) {
          // For ChatGPT, Perplexity, and New Tab, don't highlight the query part
          highlightedTitle = suggestion.title;
        } else {
          // For other suggestions (including tabs), highlight the query
          highlightedTitle = (suggestion.title || "Untitled").replace(
            new RegExp(
              `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
              "gi"
            ),
            '<mark style="background: #4A90E2; color: white; padding: 0 2px; border-radius: 2px;">$1</mark>'
          );
        }
        title.innerHTML = highlightedTitle;
        title.style.cssText = `
          all: unset !important;
          color: #E3E4E8 !important;
          font-size: 14px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          max-width: 300px !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          background: transparent !important;
          display: inline !important;
          vertical-align: baseline !important;
        `;

        // Create action button (Visit or Switch to Tab)
        const actionButton = document.createElement("button");
        actionButton.textContent =
          suggestion.type === "tab" ? "Switch to Tab" : "Visit";
        actionButton.style.cssText = `
          all: unset !important;
          background: transparent !important;
          color: #656565 !important;
          border: none !important;
          border-radius: 6px !important;
          font-size: 12px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
          padding: 6px 12px !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          display: inline-block !important;
          vertical-align: baseline !important;
        `;

        // Add hover effects
        suggestionItem.addEventListener("mouseenter", function () {
          if (suggestionItems.indexOf(this) !== selectedIndex) {
            this.style.setProperty("background-color", "#232323", "important");
          }
        });

        suggestionItem.addEventListener("mouseleave", function () {
          if (suggestionItems.indexOf(this) !== selectedIndex) {
            this.style.setProperty("background-color", "#1A1A1A", "important");
          }
        });

        // Add click handler based on suggestion type
        actionButton.addEventListener("click", function (e) {
          e.stopPropagation();
          if (suggestion.type === "tab") {
            // Switch to existing tab
            chrome.runtime.sendMessage({
              action: "switch-to-tab",
              tabId: suggestion.id,
            });
          } else {
            // Visit URL for history/top sites/new tab/chatgpt/perplexity
            console.log("Opening URL:", suggestion.url);
            chrome.runtime.sendMessage({
              action: "createTab",
              url: suggestion.url,
            });
          }
          removeOverlay(overlay);
          document.removeEventListener("click", clickOutsideHandler);
          document.removeEventListener("keydown", keydownHandler);
        });

        // Add click handler to select item
        suggestionItem.addEventListener("click", function () {
          if (suggestion.type === "tab") {
            // Switch to existing tab
            chrome.runtime.sendMessage({
              action: "switch-to-tab",
              tabId: suggestion.id,
            });
          } else {
            // Visit URL for history/top sites/new tab/chatgpt/perplexity
            console.log("Opening URL:", suggestion.url);
            chrome.runtime.sendMessage({
              action: "createTab",
              url: suggestion.url,
            });
          }
          removeOverlay(overlay);
          document.removeEventListener("click", clickOutsideHandler);
          document.removeEventListener("keydown", keydownHandler);
        });

        leftSide.appendChild(favicon);
        leftSide.appendChild(title);
        suggestionItem.appendChild(leftSide);
        suggestionItem.appendChild(actionButton);
        suggestionsContainer.appendChild(suggestionItem);
      });

      // Update keyboard navigation
      selectedIndex = -1;
    }

    function clearSearchSuggestions() {
      // Clear suggestions and show tabs again
      suggestionsContainer.innerHTML = "";
      suggestionItems.length = 0;
      currentSuggestions = tabs.map((tab) => ({ type: "tab", ...tab })); // Store tabs as current suggestions

      // Re-add tab suggestions
      tabs.forEach((tab, index) => {
        const suggestionItem = document.createElement("div");
        suggestionItem.id = `_x_extension_suggestion_item_${index}_2024_unique_`;
        suggestionItem.style.cssText = `
          all: unset !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 12px 16px !important;
          background: #1A1A1A !important;
          border-radius: 6px !important;
          margin-bottom: 4px !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
          box-sizing: border-box !important;
          margin: 0 0 4px 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          color: inherit !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
        `;

        suggestionItems.push(suggestionItem);

        // Create left side with icon and title
        const leftSide = document.createElement("div");
        leftSide.style.cssText = `
          all: unset !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          flex: 1 !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          background: transparent !important;
          color: inherit !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
        `;

        // Create favicon
        const favicon = document.createElement("img");
        favicon.src =
          tab.favIconUrl ||
          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23E3E4E8" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
        favicon.style.cssText = `
          all: unset !important;
          width: 16px !important;
          height: 16px !important;
          border-radius: 2px !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          background: transparent !important;
          color: inherit !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
          display: block !important;
        `;

        // Create title
        const title = document.createElement("span");
        title.textContent = tab.title || "Untitled";
        title.style.cssText = `
          all: unset !important;
          color: #E3E4E8 !important;
          font-size: 14px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          max-width: 300px !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          background: transparent !important;
          display: inline !important;
          vertical-align: baseline !important;
        `;

        // Create switch button
        const switchButton = document.createElement("button");
        switchButton.textContent = "Switch to Tab";
        switchButton.style.cssText = `
          all: unset !important;
          background: transparent !important;
          color: #656565 !important;
          border: none !important;
          border-radius: 6px !important;
          font-size: 12px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
          padding: 6px 12px !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          display: inline-block !important;
          vertical-align: baseline !important;
        `;

        // Add hover effects
        suggestionItem.addEventListener("mouseenter", function () {
          if (suggestionItems.indexOf(this) !== selectedIndex) {
            this.style.setProperty("background-color", "#313131", "important");
          }
        });

        suggestionItem.addEventListener("mouseleave", function () {
          if (suggestionItems.indexOf(this) !== selectedIndex) {
            this.style.setProperty("background-color", "#1A1A1A", "important");
          }
        });

        // Add click handler to switch to tab
        switchButton.addEventListener("click", function (e) {
          e.stopPropagation();
          chrome.runtime.sendMessage({
            action: "switch-to-tab",
            tabId: tab.id,
          });
          removeOverlay(overlay);
          document.removeEventListener("click", clickOutsideHandler);
          document.removeEventListener("keydown", keydownHandler);
        });

        // Add click handler to select item
        suggestionItem.addEventListener("click", function () {
          chrome.runtime.sendMessage({
            action: "switch-to-tab",
            tabId: tab.id,
          });
          removeOverlay(overlay);
          document.removeEventListener("click", clickOutsideHandler);
          document.removeEventListener("keydown", keydownHandler);
        });

        leftSide.appendChild(favicon);
        leftSide.appendChild(title);
        suggestionItem.appendChild(leftSide);
        suggestionItem.appendChild(switchButton);
        suggestionsContainer.appendChild(suggestionItem);
      });

      selectedIndex = -1;
    }

    // Focus the input when created
    setTimeout(() => searchInput.focus(), 100);

    // Create suggestions container
    const suggestionsContainer = document.createElement("div");
    suggestionsContainer.id = "_x_extension_suggestions_container_2024_unique_";
    suggestionsContainer.style.cssText = `
      all: unset !important;
      width: 100% !important;
      flex: 1 1 auto !important;
      min-height: 0 !important;
      max-height: 50vh !important;
      overflow-y: auto !important;
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
      background: #1A1A1A !important;
      border-radius: 0 0 12px 12px !important;
      padding: 8px !important;
      box-sizing: border-box !important;
      display: block !important;
      line-height: 1 !important;
      text-decoration: none !important;
      list-style: none !important;
      outline: none !important;
      color: inherit !important;
      font-size: 100% !important;
      font: inherit !important;
      vertical-align: baseline !important;
    `;

    // Add tab suggestions
    tabs.forEach((tab, index) => {
      const suggestionItem = document.createElement("div");
      suggestionItem.id = `_x_extension_suggestion_item_${index}_2024_unique_`;
      suggestionItem.style.cssText = `
        all: unset !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        padding: 12px 16px !important;
        background: #1A1A1A !important;
        border-radius: 6px !important;
        margin-bottom: 4px !important;
        cursor: pointer !important;
        transition: background-color 0.2s ease !important;
        box-sizing: border-box !important;
        margin: 0 0 4px 0 !important;
        line-height: 1 !important;
        text-decoration: none !important;
        list-style: none !important;
        outline: none !important;
        color: inherit !important;
        font-size: 100% !important;
        font: inherit !important;
        vertical-align: baseline !important;
      `;

      // Store reference to suggestion item
      suggestionItems.push(suggestionItem);

      // Create left side with icon and title
      const leftSide = document.createElement("div");
      leftSide.id = `_x_extension_left_side_${index}_2024_unique_`;
      leftSide.style.cssText = `
        all: unset !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        flex: 1 !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1 !important;
        text-decoration: none !important;
        list-style: none !important;
        outline: none !important;
        background: transparent !important;
        color: inherit !important;
        font-size: 100% !important;
        font: inherit !important;
        vertical-align: baseline !important;
      `;

      // Create favicon
      const favicon = document.createElement("img");
      favicon.id = `_x_extension_favicon_${index}_2024_unique_`;
      favicon.src =
        tab.favIconUrl ||
        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23E3E4E8" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
      favicon.style.cssText = `
        all: unset !important;
        width: 16px !important;
        height: 16px !important;
        border-radius: 2px !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1 !important;
        text-decoration: none !important;
        list-style: none !important;
        outline: none !important;
        background: transparent !important;
        color: inherit !important;
        font-size: 100% !important;
        font: inherit !important;
        vertical-align: baseline !important;
        display: block !important;
      `;

      // Create title
      const title = document.createElement("span");
      title.id = `_x_extension_title_${index}_2024_unique_`;
      title.textContent = tab.title || "Untitled";
      title.style.cssText = `
        all: unset !important;
        color: #E3E4E8 !important;
        font-size: 14px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        max-width: 300px !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1 !important;
        text-decoration: none !important;
        list-style: none !important;
        outline: none !important;
        background: transparent !important;
        display: inline !important;
        vertical-align: baseline !important;
      `;

      // Create switch button
      const switchButton = document.createElement("button");
      switchButton.id = `_x_extension_switch_button_${index}_2024_unique_`;
      switchButton.textContent = "Switch to Tab";
      switchButton.style.cssText = `
        all: unset !important;
        background: transparent !important;
        color: #656565 !important;
        border: none !important;
        border-radius: 6px !important;
        font-size: 12px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        cursor: pointer !important;
        transition: background-color 0.2s ease !important;
        padding: 6px 12px !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        line-height: 1 !important;
        text-decoration: none !important;
        list-style: none !important;
        outline: none !important;
        display: inline-block !important;
        vertical-align: baseline !important;
      `;

      // Add hover effects
      suggestionItem.addEventListener("mouseenter", function () {
        if (suggestionItems.indexOf(this) !== selectedIndex) {
          this.style.setProperty("background-color", "#232323", "important");
        }
      });

      suggestionItem.addEventListener("mouseleave", function () {
        if (suggestionItems.indexOf(this) !== selectedIndex) {
          this.style.setProperty("background-color", "#1A1A1A", "important");
        }
      });

      // Add click handler to switch to tab
      switchButton.addEventListener("click", function (e) {
        e.stopPropagation();
        chrome.runtime.sendMessage({
          action: "switch-to-tab",
          tabId: tab.id,
        });
        removeOverlay(overlay);
        document.removeEventListener("keydown", keydownHandler);
      });

      // Add click handler to select item
      suggestionItem.addEventListener("click", function () {
        chrome.runtime.sendMessage({
          action: "switch-to-tab",
          tabId: tab.id,
        });
        removeOverlay(overlay);
        document.removeEventListener("keydown", keydownHandler);
      });

      leftSide.appendChild(favicon);
      leftSide.appendChild(title);
      suggestionItem.appendChild(leftSide);
      suggestionItem.appendChild(switchButton);
      suggestionsContainer.appendChild(suggestionItem);
    });

    // Initialize current suggestions with tabs
    currentSuggestions = tabs.map((tab) => ({ type: "tab", ...tab }));

    // Position the icon relative to the input
    const inputContainer = document.createElement("div");
    inputContainer.id = "_x_extension_input_container_2024_unique_";
    inputContainer.style.cssText = `
      all: unset !important;
      position: relative !important;
      width: 100% !important;
      flex-shrink: 0 !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
      line-height: 1 !important;
      text-decoration: none !important;
      list-style: none !important;
      outline: none !important;
      color: inherit !important;
      font-size: 100% !important;
      font: inherit !important;
      vertical-align: baseline !important;
      display: block !important;
    `;

    inputContainer.appendChild(searchIcon);
    inputContainer.appendChild(searchInput);
    overlay.appendChild(inputContainer);
    overlay.appendChild(suggestionsContainer);
    document.body.appendChild(overlay);
  }
}
