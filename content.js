// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "show-command-bar") {
    show_command_bar(request.tabs);
  }
});

function show_command_bar(tabs) {
  // Helper function to remove overlay and clean up styles
  function remove_overlay(overlay_element) {
    if (overlay_element) {
      overlay_element.remove();
    }
    // Also remove the scrollbar style
    const scrollbar_style = document.getElementById(
      "_x_extension_scrollbar_style_2024_unique_"
    );
    if (scrollbar_style) {
      scrollbar_style.remove();
    }
  }

  // Check if the overlay already exists
  let overlay = document.getElementById("_x_extension_overlay_2024_unique_");

  if (overlay) {
    // If it exists, just focus the input and return (don't toggle off)
    const existing_input = document.getElementById(
      "_x_extension_search_input_2024_unique_"
    );
    if (existing_input) {
      existing_input.focus();
      existing_input.select();
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
    const font_link = document.createElement("link");
    font_link.id = "_x_extension_font_2024_unique_";
    font_link.href =
      "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap";
    font_link.rel = "stylesheet";
    document.head.appendChild(font_link);

    // Add style to hide scrollbars for WebKit browsers
    const scrollbar_style = document.createElement("style");
    scrollbar_style.id = "_x_extension_scrollbar_style_2024_unique_";
    scrollbar_style.textContent = `
      #_x_extension_overlay_2024_unique_ *::-webkit-scrollbar {
        display: none !important;
      }
      #_x_extension_overlay_2024_unique_ * {
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
      }
    `;
    document.head.appendChild(scrollbar_style);

    // Create the search input with icon
    const search_input = document.createElement("input");
    search_input.id = "_x_extension_search_input_2024_unique_";
    search_input.autocomplete = "off";
    search_input.type = "text";
    search_input.placeholder = "Search or Enter URL...";
    search_input.style.cssText = `
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
    const search_icon = document.createElement("div");
    search_icon.id = "_x_extension_search_icon_2024_unique_";
    search_icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E3E4E8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="_x_extension_svg_2024_unique_"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>`;
    search_icon.style.cssText = `
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
    search_input.addEventListener("focus", function () {
      selected_index = -1;
      update_selection();
    });

    search_input.addEventListener("blur", function () {
      // Don't change selectedIndex here to allow keyboard navigation
    });

    // Add input event for search suggestions
    search_input.addEventListener("input", function () {
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
              update_search_suggestions(response.suggestions, query, tabs);
            }
          }
        );
      } else {
        // Clear suggestions and show tabs
        clear_search_suggestions();
      }
    });

    // Add click outside to close functionality
    // Use setTimeout to prevent the same click that triggered the popup from closing it
    const click_outside_handler = function (e) {
      if (!overlay.contains(e.target)) {
        remove_overlay(overlay);
        document.removeEventListener("click", click_outside_handler);
      }
    };
    setTimeout(() => {
      document.addEventListener("click", click_outside_handler);
    }, 0);

    // Add keyboard navigation
    let selected_index = -1; // -1 means input is focused, 0+ means suggestion is selected
    const suggestion_items = [];
    let current_suggestions = []; // Store current suggestions for keyboard navigation

    const keydown_handler = function (e) {
      if (e.key === "Escape" && overlay) {
        remove_overlay(overlay);
        document.removeEventListener("keydown", keydown_handler);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (selected_index === -1) {
          // Move from input to first suggestion
          selected_index = 0;
          search_input.blur();
        } else {
          // Move to next suggestion
          selected_index = (selected_index + 1) % suggestion_items.length;
        }
        update_selection();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (selected_index === 0) {
          // Move from first suggestion back to input
          selected_index = -1;
          search_input.focus();
        } else if (selected_index === -1) {
          // Move from input to last suggestion
          selected_index = suggestion_items.length - 1;
          search_input.blur();
        } else {
          // Move to previous suggestion
          selected_index = selected_index - 1;
        }
        update_selection();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const query = search_input.value.trim();

        if (selected_index >= 0 && suggestion_items[selected_index]) {
          // Get the selected suggestion
          const selected_suggestion = current_suggestions[selected_index];

          if (selected_suggestion) {
            if (selected_suggestion.type === "tab") {
              // Switch to existing tab
              chrome.runtime.sendMessage({
                action: "switch-to-tab",
                tabId: selected_suggestion.id,
              });
            } else {
              // Navigate to the suggested URL (history, top site, new tab, chatgpt, perplexity)
              console.log(
                "Opening URL from keyboard:",
                selected_suggestion.url
              );
              chrome.runtime.sendMessage({
                action: "createTab",
                url: selected_suggestion.url,
              });
            }
          }
          remove_overlay(overlay);
          document.removeEventListener("click", click_outside_handler);
          document.removeEventListener("keydown", keydown_handler);
        } else if (query) {
          // Handle search or URL navigation
          chrome.runtime.sendMessage({
            action: "searchOrNavigate",
            query: query,
          });
          remove_overlay(overlay);
          document.removeEventListener("click", click_outside_handler);
          document.removeEventListener("keydown", keydown_handler);
        }
      }
    };

    document.addEventListener("keydown", keydown_handler);

    function update_selection() {
      suggestion_items.forEach((item, index) => {
        if (index === selected_index) {
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

    function update_search_suggestions(suggestions, query, all_tabs) {
      // Clear existing suggestions
      suggestions_container.innerHTML = "";
      suggestion_items.length = 0;

      // Filter tabs that match the query
      const query_lower = query.toLowerCase();
      const matching_tabs = all_tabs.filter((tab) => {
        const title_lower = (tab.title || "").toLowerCase();
        const url_lower = tab.url.toLowerCase();
        return (
          title_lower.includes(query_lower) || url_lower.includes(query_lower)
        );
      });

      // Add New Tab suggestion as first item
      const new_tab_suggestion = {
        type: "newtab",
        title: "New Tab",
        url: "chrome://newtab/",
        favicon:
          "https://img.icons8.com/?size=100&id=ejub91zEY6Sl&format=png&color=000000",
      };

      // Add ChatGPT suggestion as second item
      const chat_gpt_suggestion = {
        type: "chatgpt",
        title: `Ask ChatGPT: "${query}"`,
        url: `https://chatgpt.com/?q=${encodeURIComponent(query)}`,
        favicon:
          "https://img.icons8.com/?size=100&id=fO5yVwARGUEB&format=png&color=ffffff",
      };

      // Add Perplexity suggestion as third item
      const perplexity_suggestion = {
        type: "perplexity",
        title: `Ask Perplexity: "${query}"`,
        url: `https://perplexity.ai/search?q=${encodeURIComponent(query)}`,
        favicon:
          "https://img.icons8.com/?size=100&id=kzJWN5jCDzpq&format=png&color=000000",
      };

      // Build suggestions list: matching tabs first, then New Tab, ChatGPT, Perplexity, then history/top sites
      const all_suggestions = [
        ...matching_tabs.map((tab) => ({ type: "tab", ...tab })),
        new_tab_suggestion,
        chat_gpt_suggestion,
        perplexity_suggestion,
        ...suggestions,
      ];
      current_suggestions = all_suggestions; // Store current suggestions including tabs

      // Add search suggestions
      all_suggestions.forEach((suggestion, index) => {
        const suggestion_item = document.createElement("div");
        suggestion_item.id = `_x_extension_suggestion_item_${index}_2024_unique_`;
        const is_last_item = index === all_suggestions.length - 1;
        suggestion_item.style.cssText = `
          all: unset !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 12px 16px !important;
          background: #1A1A1A !important;
          border-radius: 6px !important;
          margin-bottom: ${is_last_item ? "0" : "4px"} !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
          box-sizing: border-box !important;
          margin: 0 0 ${is_last_item ? "0" : "4px"} 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          color: inherit !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
        `;

        suggestion_items.push(suggestion_item);

        // Create left side with icon and title
        const left_side = document.createElement("div");
        left_side.style.cssText = `
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
          const search_icon_svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E3E4E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>`;
          const fallback_div = document.createElement("div");
          fallback_div.innerHTML = search_icon_svg;
          fallback_div.style.cssText = `
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
          favicon.parentNode.replaceChild(fallback_div, favicon);
        };

        // Create title with highlighted query
        const title = document.createElement("span");
        let highlighted_title;
        if (
          suggestion.type === "chatgpt" ||
          suggestion.type === "perplexity" ||
          suggestion.type === "newtab"
        ) {
          // For ChatGPT, Perplexity, and New Tab, don't highlight the query part
          highlighted_title = suggestion.title;
        } else {
          // For other suggestions (including tabs), highlight the query
          highlighted_title = (suggestion.title || "Untitled").replace(
            new RegExp(
              `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
              "gi"
            ),
            '<mark style="background: #4A90E2; color: white; padding: 2px; border-radius: 2px;">$1</mark>'
          );
        }
        title.innerHTML = highlighted_title;
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
        const action_button = document.createElement("button");
        action_button.textContent =
          suggestion.type === "tab" ? "Switch to Tab" : "Visit";
        action_button.style.cssText = `
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
        suggestion_item.addEventListener("mouseenter", function () {
          if (suggestion_items.indexOf(this) !== selected_index) {
            this.style.setProperty("background-color", "#232323", "important");
          }
        });

        suggestion_item.addEventListener("mouseleave", function () {
          if (suggestion_items.indexOf(this) !== selected_index) {
            this.style.setProperty("background-color", "#1A1A1A", "important");
          }
        });

        // Add click handler based on suggestion type
        action_button.addEventListener("click", function (e) {
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
          remove_overlay(overlay);
          document.removeEventListener("click", click_outside_handler);
          document.removeEventListener("keydown", keydown_handler);
        });

        // Add click handler to select item
        suggestion_item.addEventListener("click", function () {
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
          remove_overlay(overlay);
          document.removeEventListener("click", click_outside_handler);
          document.removeEventListener("keydown", keydown_handler);
        });

        left_side.appendChild(favicon);
        left_side.appendChild(title);
        suggestion_item.appendChild(left_side);
        suggestion_item.appendChild(action_button);
        suggestions_container.appendChild(suggestion_item);
      });

      // Update keyboard navigation
      selected_index = -1;
    }

    function clear_search_suggestions() {
      // Clear suggestions and show tabs again
      suggestions_container.innerHTML = "";
      suggestion_items.length = 0;
      current_suggestions = tabs.map((tab) => ({ type: "tab", ...tab })); // Store tabs as current suggestions

      // Re-add tab suggestions
      tabs.forEach((tab, index) => {
        const suggestion_item = document.createElement("div");
        suggestion_item.id = `_x_extension_suggestion_item_${index}_2024_unique_`;
        suggestion_item.style.cssText = `
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

        suggestion_items.push(suggestion_item);

        // Create left side with icon and title
        const left_side = document.createElement("div");
        left_side.style.cssText = `
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
        const switch_button = document.createElement("button");
        switch_button.textContent = "Switch to Tab";
        switch_button.style.cssText = `
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
        suggestion_item.addEventListener("mouseenter", function () {
          if (suggestion_items.indexOf(this) !== selected_index) {
            this.style.setProperty("background-color", "#313131", "important");
          }
        });

        suggestion_item.addEventListener("mouseleave", function () {
          if (suggestion_items.indexOf(this) !== selected_index) {
            this.style.setProperty("background-color", "#1A1A1A", "important");
          }
        });

        // Add click handler to switch to tab
        switch_button.addEventListener("click", function (e) {
          e.stopPropagation();
          chrome.runtime.sendMessage({
            action: "switch-to-tab",
            tabId: tab.id,
          });
          remove_overlay(overlay);
          document.removeEventListener("click", click_outside_handler);
          document.removeEventListener("keydown", keydown_handler);
        });

        // Add click handler to select item
        suggestion_item.addEventListener("click", function () {
          chrome.runtime.sendMessage({
            action: "switch-to-tab",
            tabId: tab.id,
          });
          remove_overlay(overlay);
          document.removeEventListener("click", click_outside_handler);
          document.removeEventListener("keydown", keydown_handler);
        });

        left_side.appendChild(favicon);
        left_side.appendChild(title);
        suggestion_item.appendChild(left_side);
        suggestion_item.appendChild(switch_button);
        suggestions_container.appendChild(suggestion_item);
      });

      selected_index = -1;
    }

    // Focus the input when created
    setTimeout(() => search_input.focus(), 100);

    // Create suggestions container
    const suggestions_container = document.createElement("div");
    suggestions_container.id =
      "_x_extension_suggestions_container_2024_unique_";
    suggestions_container.style.cssText = `
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
      const suggestion_item = document.createElement("div");
      suggestion_item.id = `_x_extension_suggestion_item_${index}_2024_unique_`;
      suggestion_item.style.cssText = `
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
      suggestion_items.push(suggestion_item);

      // Create left side with icon and title
      const left_side = document.createElement("div");
      left_side.id = `_x_extension_left_side_${index}_2024_unique_`;
      left_side.style.cssText = `
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
      const switch_button = document.createElement("button");
      switch_button.id = `_x_extension_switch_button_${index}_2024_unique_`;
      switch_button.textContent = "Switch to Tab";
      switch_button.style.cssText = `
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
      suggestion_item.addEventListener("mouseenter", function () {
        if (suggestion_items.indexOf(this) !== selected_index) {
          this.style.setProperty("background-color", "#232323", "important");
        }
      });

      suggestion_item.addEventListener("mouseleave", function () {
        if (suggestion_items.indexOf(this) !== selected_index) {
          this.style.setProperty("background-color", "#1A1A1A", "important");
        }
      });

      // Add click handler to switch to tab
      switch_button.addEventListener("click", function (e) {
        e.stopPropagation();
        chrome.runtime.sendMessage({
          action: "switch-to-tab",
          tabId: tab.id,
        });
        remove_overlay(overlay);
        document.removeEventListener("keydown", keydown_handler);
      });

      // Add click handler to select item
      suggestion_item.addEventListener("click", function () {
        chrome.runtime.sendMessage({
          action: "switch-to-tab",
          tabId: tab.id,
        });
        remove_overlay(overlay);
        document.removeEventListener("keydown", keydown_handler);
      });

      left_side.appendChild(favicon);
      left_side.appendChild(title);
      suggestion_item.appendChild(left_side);
      suggestion_item.appendChild(switch_button);
      suggestions_container.appendChild(suggestion_item);
    });

    // Initialize current suggestions with tabs
    current_suggestions = tabs.map((tab) => ({ type: "tab", ...tab }));

    // Position the icon relative to the input
    const input_container = document.createElement("div");
    input_container.id = "_x_extension_input_container_2024_unique_";
    input_container.style.cssText = `
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

    input_container.appendChild(search_icon);
    input_container.appendChild(search_input);
    overlay.appendChild(input_container);
    overlay.appendChild(suggestions_container);
    document.body.appendChild(overlay);
  }
}
