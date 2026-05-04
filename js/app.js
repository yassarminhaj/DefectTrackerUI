(function () {
  var current = window.location.pathname.split("/").pop() || "dashboard.html";
  var navTarget = current;

  if (current === "index.html") {
    navTarget = "dashboard.html";
  }

  if (current === "defect_detail.html") {
    navTarget = "defect_list.html";
  }

  var loaderMessages = {
    "dashboard.html": "Preparing dashboard...",
    "defect_list.html": "Loading defects...",
    "defect_create.html": "Reading source...",
    "defect_detail.html": "Loading defects...",
    "projects.html": "Reading source...",
    "users.html": "Reading source...",
    "environments.html": "Reading source...",
    "status_workflow.html": "Checking workflow...",
    "reports.html": "Preparing dashboard...",
    "login.html": "Reading source..."
  };
  var loaderMessageList = ["Reading source...", "Loading defects...", "Preparing dashboard...", "Checking workflow...", "Almost there..."];
  var loaderMessageIndex = 0;
  var loaderActiveCount = 0;
  var loaderStartedAt = 0;
  var loaderTimer = null;
  var loader = document.createElement("div");
  var loaderText = document.createElement("p");

  loader.className = "dt-loader";
  loader.setAttribute("role", "status");
  loader.setAttribute("aria-live", "polite");
  loader.innerHTML = '<div class="dt-loader-panel"><div class="dt-loader-mark">DT</div><p class="dt-loader-text"></p><div class="dt-loader-bar"></div></div>';
  loaderText = loader.querySelector(".dt-loader-text");
  document.body.appendChild(loader);

  function showLoader(message) {
    loaderActiveCount += 1;
    loaderStartedAt = loaderStartedAt || Date.now();
    loaderText.textContent = message || loaderMessages[current] || loaderMessageList[loaderMessageIndex % loaderMessageList.length];
    loader.classList.add("is-visible");
    window.clearInterval(loaderTimer);
    loaderTimer = window.setInterval(function () {
      loaderMessageIndex += 1;
      loaderText.textContent = loaderMessageList[loaderMessageIndex % loaderMessageList.length];
    }, 1100);
  }

  function hideLoader() {
    loaderActiveCount = Math.max(0, loaderActiveCount - 1);
    if (loaderActiveCount > 0) {
      return;
    }
    var elapsed = Date.now() - loaderStartedAt;
    window.setTimeout(function () {
      loader.classList.remove("is-visible");
      window.clearInterval(loaderTimer);
      loaderStartedAt = 0;
    }, Math.max(0, 520 - elapsed));
  }

  window.DefectTrackerLoader = {
    show: showLoader,
    hide: hideLoader,
    withLoading: function (task, message) {
      showLoader(message);
      return Promise.resolve()
        .then(task)
        .finally(hideLoader);
    }
  };

  if (window.fetch) {
    var nativeFetch = window.fetch.bind(window);
    window.fetch = function () {
      showLoader("Reading source...");
      return nativeFetch.apply(null, arguments).finally(hideLoader);
    };
  }

  showLoader(loaderMessages[current]);
  if (document.readyState === "complete") {
    hideLoader();
  } else {
    window.addEventListener("load", hideLoader, { once: true });
  }

  var appShell = document.querySelector(".app-shell");
  var sidebar = document.querySelector(".sidebar");
  var sidebarToggle = document.querySelector("[data-sidebar-toggle]");
  var sidebarToggleIcon = document.querySelector("[data-sidebar-toggle-icon]");
  var sidebarStorageKey = "defectTrackerSidebarCollapsed";
  var sidebarModeStorageKey = "defectTrackerSidebarMode";
  var sidebarRestoreTab = null;

  function getSidebarLabel(link) {
    var clone = link.cloneNode(true);
    var icon = clone.querySelector(".nav-icon");
    if (icon) icon.remove();
    return clone.textContent.trim();
  }

  function refreshAfterSidebarChange() {
    window.dispatchEvent(new Event("resize"));
    window.setTimeout(function () {
      window.dispatchEvent(new Event("resize"));
    }, 220);
  }

  function setSidebarMode(mode) {
    if (!appShell) return;
    var isCollapsed = mode === "collapsed";
    var isHidden = mode === "hidden";
    appShell.classList.toggle("sidebar-collapsed", isCollapsed);
    appShell.classList.toggle("sidebar-hidden", isHidden);
    if (sidebarToggle) {
      sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
      sidebarToggle.setAttribute("aria-label", isCollapsed ? "Expand sidebar" : "Collapse sidebar");
      sidebarToggle.title = isCollapsed ? "Expand sidebar" : "Collapse sidebar";
    }
    if (sidebarToggleIcon) {
      sidebarToggleIcon.innerHTML = isCollapsed ? "&rsaquo;" : "&lsaquo;";
    }
    if (sidebarRestoreTab) {
      sidebarRestoreTab.classList.toggle("is-visible", isHidden);
      sidebarRestoreTab.hidden = !isHidden;
    }
  }

  function saveSidebarMode(mode) {
    try {
      window.localStorage.setItem(sidebarModeStorageKey, mode);
      window.localStorage.setItem(sidebarStorageKey, String(mode === "collapsed"));
    } catch (error) {
      // Ignore storage errors in restricted browser modes.
    }
  }

  if (appShell && sidebar) {
    var sidebarHideAction = document.createElement("button");
    sidebarHideAction.type = "button";
    sidebarHideAction.className = "sidebar-hide-action";
    sidebarHideAction.textContent = "Hide Menu";
    sidebarHideAction.title = "Hide menu";
    sidebarHideAction.setAttribute("data-sidebar-hide", "");
    sidebar.appendChild(sidebarHideAction);

    sidebarRestoreTab = document.createElement("button");
    sidebarRestoreTab.type = "button";
    sidebarRestoreTab.className = "sidebar-restore-tab";
    sidebarRestoreTab.textContent = "Menu";
    sidebarRestoreTab.hidden = true;
    sidebarRestoreTab.setAttribute("data-sidebar-restore", "");
    document.body.appendChild(sidebarRestoreTab);

    var savedSidebarMode = "expanded";
    try {
      savedSidebarMode = window.localStorage.getItem(sidebarModeStorageKey) || (window.localStorage.getItem(sidebarStorageKey) === "true" ? "collapsed" : "expanded");
    } catch (error) {
      savedSidebarMode = "expanded";
    }
    if (["expanded", "collapsed", "hidden"].indexOf(savedSidebarMode) === -1) {
      savedSidebarMode = "expanded";
    }
    setSidebarMode(savedSidebarMode);

    sidebarHideAction.addEventListener("click", function () {
      setSidebarMode("hidden");
      saveSidebarMode("hidden");
      refreshAfterSidebarChange();
    });

    sidebarRestoreTab.addEventListener("click", function () {
      setSidebarMode("expanded");
      saveSidebarMode("expanded");
      refreshAfterSidebarChange();
    });

    if (sidebarToggle) sidebarToggle.addEventListener("click", function () {
      var nextCollapsed = !appShell.classList.contains("sidebar-collapsed");
      var nextMode = nextCollapsed ? "collapsed" : "expanded";
      setSidebarMode(nextMode);
      saveSidebarMode(nextMode);
      refreshAfterSidebarChange();
    });

    window.requestAnimationFrame(function () {
      appShell.classList.add("is-sidebar-ready");
    });
  }

  document.querySelectorAll("[data-nav]").forEach(function (link) {
    if (!link.getAttribute("title")) {
      link.setAttribute("title", getSidebarLabel(link));
    }
    var href = link.getAttribute("href");
    if (href === navTarget) {
      link.classList.add("active");
    }
  });

  document.querySelectorAll("[data-file-input]").forEach(function (input) {
    input.addEventListener("change", function () {
      var listId = input.getAttribute("data-file-input");
      var list = document.getElementById(listId);
      if (!list) return;

      list.innerHTML = "";
      var files = Array.prototype.slice.call(input.files || []);
      if (!files.length) {
        list.innerHTML = "<li>No files selected</li>";
        return;
      }

      files.slice(0, 10).forEach(function (file) {
        var item = document.createElement("li");
        var sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        item.textContent = file.name + " - " + sizeMb + " MB";
        list.appendChild(item);
      });
    });
  });

  var modal = document.getElementById("previewModal");
  if (modal) {
    document.querySelectorAll("[data-preview]").forEach(function (button) {
      button.addEventListener("click", function () {
        var fileName = button.getAttribute("data-preview");
        var label = modal.querySelector("[data-preview-label]");
        if (label) label.textContent = fileName;
        modal.classList.add("open");
      });
    });

    modal.querySelectorAll("[data-close-modal]").forEach(function (button) {
      button.addEventListener("click", function () {
        modal.classList.remove("open");
      });
    });

    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        modal.classList.remove("open");
      }
    });
  }

  document.querySelectorAll("[data-tabs]").forEach(function (tabs) {
    var buttons = Array.prototype.slice.call(tabs.querySelectorAll("[data-tab-target]"));
    var panels = Array.prototype.slice.call(tabs.querySelectorAll("[data-tab-panel]"));

    buttons.forEach(function (button) {
      button.setAttribute("aria-selected", button.classList.contains("active") ? "true" : "false");
      button.addEventListener("click", function () {
        var target = button.getAttribute("data-tab-target");

        buttons.forEach(function (item) {
          var isActive = item === button;
          item.classList.toggle("active", isActive);
          item.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        panels.forEach(function (panel) {
          var isActive = panel.getAttribute("data-tab-panel") === target;
          panel.classList.toggle("active", isActive);
          panel.hidden = !isActive;
        });
      });
    });
  });

  var dashboardTableBody = document.querySelector("[data-dashboard-table-body]");
  var chartGrid = document.querySelector("[data-chart-grid]");
  var chartModal = document.querySelector("[data-chart-modal]");

  if (dashboardTableBody && chartGrid && chartModal) {
    var defectRecords = [
      { id: "DF-1042", title: "Invoice total mismatch after tax recalculation", project: "Billing Core", environment: "UAT", severity: "High", priority: "P1", status: "In Progress", assignedTo: "Aisha Khan", releaseVersion: "2026.04", createdDate: "2026-04-21" },
      { id: "DF-1037", title: "Attachment preview fails for PNG screenshots", project: "Claims Portal", environment: "SIT", severity: "Medium", priority: "P2", status: "Assigned", assignedTo: "Omar Salem", releaseVersion: "2026.04", createdDate: "2026-04-18" },
      { id: "DF-1029", title: "UAT users are logged out before timeout policy", project: "Claims Portal", environment: "UAT", severity: "Critical", priority: "P1", status: "Reopened", assignedTo: "Leena Faris", releaseVersion: "2026.03", createdDate: "2026-04-10" },
      { id: "DF-1018", title: "Project filter does not persist after refresh", project: "Mobile QA", environment: "SIT", severity: "Low", priority: "P4", status: "Closed", assignedTo: "Fahad Noor", releaseVersion: "2026.02", createdDate: "2026-03-05" },
      { id: "DF-1051", title: "Retest evidence missing from closure package", project: "Claims Portal", environment: "Pre-Prod", severity: "Medium", priority: "P2", status: "Retest", assignedTo: "Omar Salem", releaseVersion: "2026.04", createdDate: "2026-04-23" },
      { id: "DF-1054", title: "Payment retry creates duplicate transaction note", project: "Billing Core", environment: "SIT", severity: "High", priority: "P1", status: "Fixed", assignedTo: "Aisha Khan", releaseVersion: "2026.04", createdDate: "2026-04-24" },
      { id: "DF-1057", title: "Mobile date picker allows invalid deployment date", project: "Mobile QA", environment: "DEV", severity: "Low", priority: "P3", status: "New", assignedTo: "Leena Faris", releaseVersion: "2026.03", createdDate: "2026-04-25" },
      { id: "DF-1062", title: "Production incident summary missing assignee", project: "Claims Portal", environment: "PROD", severity: "Critical", priority: "P1", status: "Developer Rejected", assignedTo: "Fahad Noor", releaseVersion: "2026.04", createdDate: "2026-04-26" },
      { id: "DF-1066", title: "Assigned again defects do not notify developers", project: "Billing Core", environment: "UAT", severity: "Medium", priority: "P2", status: "Assigned Again", assignedTo: "Aisha Khan", releaseVersion: "2026.04", createdDate: "2026-04-26" },
      { id: "DF-1070", title: "Configuration label is reported as a defect", project: "Mobile QA", environment: "UAT", severity: "Low", priority: "P4", status: "Not a Defect", assignedTo: "Omar Salem", releaseVersion: "2026.02", createdDate: "2026-04-27" }
    ];
    defectRecords.forEach(function (record) {
      record.createdBy = record.createdBy || "qa.user";
    });
    var tableFilters = Array.prototype.slice.call(document.querySelectorAll("[data-table-filter]"));
    var resultCount = document.querySelector("[data-dashboard-result-count]");
    var openChartButton = document.querySelector("[data-open-chart-modal]");
    var closeChartButtons = Array.prototype.slice.call(chartModal.querySelectorAll("[data-close-chart-modal]"));
    var saveChartButton = chartModal.querySelector("[data-save-chart]");
    var chartTitleInput = chartModal.querySelector("[data-chart-title]");
    var chartTypeInput = chartModal.querySelector("[data-chart-type]");
    var chartGroupInput = chartModal.querySelector("[data-chart-group]");
    var chartModalTitle = chartModal.querySelector("[data-chart-modal-title]");
    var clearTableFiltersButton = document.querySelector("[data-clear-dashboard-filters]");
    var activeChart = null;
    var labelMap = {
      status: "Status",
      severity: "Severity",
      project: "Project",
      environment: "Environment",
      assignedTo: "Assigned To",
      releaseVersion: "Release Version"
    };

    function getBadgeClass(value, field) {
      var key = String(value).toLowerCase().replace(/\s+/g, "-");
      if (field === "severity") return "badge-" + key;
      if (field === "status") {
        var statusClasses = {
          "new": "badge-new",
          "assigned": "badge-assigned",
          "in-progress": "badge-progress",
          "fixed": "badge-fixed",
          "retest": "badge-retest",
          "closed": "badge-closed",
          "reopened": "badge-reopened",
          "developer-rejected": "badge-danger",
          "not-a-defect": "badge-warning",
          "assigned-again": "badge-assigned"
        };
        return statusClasses[key] || "badge-neutral";
      }
      return "badge-neutral";
    }

    function createBadge(value, field) {
      var badge = document.createElement("span");
      badge.className = "badge " + getBadgeClass(value, field);
      badge.textContent = value;
      return badge;
    }

    function collectFilters(controls) {
      var filters = {};
      controls.forEach(function (control) {
        var field = control.getAttribute("data-table-filter") || control.getAttribute("data-chart-filter");
        if (control.value) filters[field] = control.value;
      });
      return filters;
    }

    function applyFilters(records, filters) {
      return records.filter(function (record) {
        return Object.keys(filters).every(function (field) {
          return record[field] === filters[field];
        });
      });
    }

    function groupRecords(records, field) {
      var counts = {};
      records.forEach(function (record) {
        var value = record[field] || "Not set";
        counts[value] = (counts[value] || 0) + 1;
      });
      return Object.keys(counts).sort().map(function (key) {
        return { label: key, value: counts[key] };
      });
    }

    function appendTextCell(row, text) {
      var cell = document.createElement("td");
      cell.textContent = text;
      row.appendChild(cell);
    }

    function renderDashboardTable() {
      var rows = applyFilters(defectRecords, collectFilters(tableFilters));
      dashboardTableBody.innerHTML = "";
      rows.forEach(function (record) {
        var row = document.createElement("tr");
        appendTextCell(row, record.id);
        appendTextCell(row, record.title);
        appendTextCell(row, record.project);
        appendTextCell(row, record.environment);
        var severityCell = document.createElement("td");
        severityCell.appendChild(createBadge(record.severity, "severity"));
        row.appendChild(severityCell);
        appendTextCell(row, record.priority);
        var statusCell = document.createElement("td");
        statusCell.appendChild(createBadge(record.status, "status"));
        row.appendChild(statusCell);
        appendTextCell(row, record.assignedTo);
        appendTextCell(row, record.releaseVersion);
        appendTextCell(row, record.createdBy);
        appendTextCell(row, record.createdDate);
        dashboardTableBody.appendChild(row);
      });
      if (resultCount) {
        resultCount.textContent = rows.length + " defects";
      }
    }

    function getChartMeta(filters) {
      var active = Object.keys(filters).map(function (field) {
        return (labelMap[field] || field) + ": " + filters[field];
      });
      return active.length ? active.join(", ") : "All defects";
    }

    function renderBarChart(container, data, type) {
      var max = Math.max.apply(null, data.map(function (row) { return row.value; }).concat([1]));
      var bars = document.createElement("div");
      bars.className = "chart-bars" + (type === "horizontal" ? " chart-horizontal" : "");
      data.forEach(function (row) {
        var item = document.createElement("div");
        var label = document.createElement("div");
        var track = document.createElement("div");
        var fill = document.createElement("div");
        var value = document.createElement("div");
        item.className = "chart-row";
        label.className = "chart-label";
        track.className = "chart-track";
        fill.className = "chart-fill";
        value.className = "chart-value";
        label.textContent = row.label;
        fill.style.width = Math.max(8, Math.round((row.value / max) * 100)) + "%";
        value.textContent = row.value;
        track.appendChild(fill);
        item.appendChild(label);
        item.appendChild(track);
        item.appendChild(value);
        bars.appendChild(item);
      });
      container.appendChild(bars);
    }

    function renderDonutChart(container, data) {
      var total = data.reduce(function (sum, row) { return sum + row.value; }, 0);
      var layout = document.createElement("div");
      var donut = document.createElement("div");
      layout.className = "donut-layout";
      donut.className = "donut-visual";
      donut.textContent = total;
      layout.appendChild(donut);
      layout.appendChild(createChartList(data));
      container.appendChild(layout);
    }

    function createChartList(data) {
      var list = document.createElement("ul");
      list.className = "tile-list";
      data.forEach(function (row) {
        var item = document.createElement("li");
        var label = document.createElement("span");
        var value = document.createElement("strong");
        label.textContent = row.label;
        value.textContent = row.value;
        item.appendChild(label);
        item.appendChild(value);
        list.appendChild(item);
      });
      return list;
    }

    function createChart(config, target) {
      var sharedFilters = collectFilters(tableFilters);
      var records = applyFilters(defectRecords, sharedFilters);
      var data = groupRecords(records, config.groupBy);
      var chart = target || document.createElement("article");
      chart.className = "chart-card";
      chart.dataset.chartConfig = JSON.stringify(config);
      chart.innerHTML = "";
      var titleRow = document.createElement("div");
      var titleWrap = document.createElement("div");
      var actions = document.createElement("div");
      var editButton = document.createElement("button");
      var deleteButton = document.createElement("button");
      var title = document.createElement("h3");
      var meta = document.createElement("div");
      titleRow.className = "chart-title-row";
      actions.className = "chart-actions";
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.setAttribute("data-edit-chart", "");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("data-delete-chart", "");
      title.textContent = config.title || "Defect Chart";
      meta.className = "chart-meta";
      meta.textContent = (labelMap[config.groupBy] || config.groupBy) + " | " + getChartMeta(sharedFilters);
      titleWrap.appendChild(title);
      titleWrap.appendChild(meta);
      actions.appendChild(editButton);
      actions.appendChild(deleteButton);
      titleRow.appendChild(titleWrap);
      titleRow.appendChild(actions);
      chart.appendChild(titleRow);

      if (!data.length) {
        var empty = document.createElement("div");
        empty.className = "chart-empty";
        empty.textContent = "No defects match this chart criteria.";
        chart.appendChild(empty);
      } else if (config.type === "donut") {
        renderDonutChart(chart, data);
      } else {
        renderBarChart(chart, data, config.type);
      }

      return chart;
    }

    function renderAllCharts() {
      chartGrid.querySelectorAll(".chart-card").forEach(function (chart) {
        if (!chart.dataset.chartConfig) return;
        createChart(JSON.parse(chart.dataset.chartConfig), chart);
      });
    }

    function resetChartForm() {
      chartTitleInput.value = "";
      chartTypeInput.value = "bar";
      chartGroupInput.value = "status";
    }

    function openChartModal(chart) {
      activeChart = chart || null;
      if (activeChart && activeChart.dataset.chartConfig) {
        var config = JSON.parse(activeChart.dataset.chartConfig);
        chartTitleInput.value = config.title;
        chartTypeInput.value = config.type;
        chartGroupInput.value = config.groupBy;
        chartModalTitle.textContent = "Edit Chart";
        saveChartButton.textContent = "Save Changes";
      } else {
        resetChartForm();
        chartModalTitle.textContent = "Add Chart";
        saveChartButton.textContent = "Add Chart";
      }
      chartModal.classList.add("open");
      chartModal.setAttribute("aria-hidden", "false");
      chartTitleInput.focus();
    }

    function closeChartModal() {
      chartModal.classList.remove("open");
      chartModal.setAttribute("aria-hidden", "true");
      activeChart = null;
    }

    function collectChartConfig() {
      var groupBy = chartGroupInput.value;
      return {
        title: chartTitleInput.value.trim() || "Defects by " + (labelMap[groupBy] || groupBy),
        type: chartTypeInput.value,
        groupBy: groupBy
      };
    }

    tableFilters.forEach(function (control) {
      control.addEventListener("change", function () {
        renderDashboardTable();
        renderAllCharts();
      });
    });

    if (clearTableFiltersButton) {
      clearTableFiltersButton.addEventListener("click", function () {
        tableFilters.forEach(function (control) {
          control.value = "";
        });
        renderDashboardTable();
        renderAllCharts();
      });
    }

    if (openChartButton) {
      openChartButton.addEventListener("click", function () {
        openChartModal(null);
      });
    }

    closeChartButtons.forEach(function (button) {
      button.addEventListener("click", closeChartModal);
    });

    chartModal.addEventListener("click", function (event) {
      if (event.target === chartModal) {
        closeChartModal();
      }
    });

    if (saveChartButton) {
      saveChartButton.addEventListener("click", function () {
        var chart = activeChart || document.createElement("article");
        createChart(collectChartConfig(), chart);
        if (!activeChart) {
          chartGrid.appendChild(chart);
        }
        closeChartModal();
      });
    }

    chartGrid.addEventListener("click", function (event) {
      var editButton = event.target.closest("[data-edit-chart]");
      var deleteButton = event.target.closest("[data-delete-chart]");

      if (editButton) {
        openChartModal(editButton.closest(".chart-card"));
      }

      if (deleteButton) {
        deleteButton.closest(".chart-card").remove();
      }
    });

    chartGrid.querySelectorAll("[data-default-chart]").forEach(function (chart) {
      var type = chart.getAttribute("data-default-chart");
      createChart({
        title: type === "status" ? "Defects by Status" : "Defects by Severity",
        type: type === "status" ? "bar" : "donut",
        groupBy: type,
        filters: {}
      }, chart);
    });

    renderDashboardTable();
  }

  var reportTableBody = document.querySelector("[data-report-table-body]");
  var reportChartGrid = document.querySelector("[data-report-chart-grid]");
  var reportChartModal = document.querySelector("[data-report-chart-modal]");

  if (reportTableBody && reportChartGrid && reportChartModal) {
    var reportToday = new Date("2026-04-30T00:00:00");
    var reportRecords = [
      { id: "DF-1042", title: "Invoice total mismatch after tax recalculation", project: "Billing Core", environment: "UAT", severity: "High", priority: "P1", status: "In Progress", assignedTo: "Aisha Khan", releaseVersion: "2026.04", createdDate: "2026-04-21" },
      { id: "DF-1037", title: "Attachment preview fails for PNG screenshots", project: "Claims Portal", environment: "SIT", severity: "Medium", priority: "P2", status: "Assigned", assignedTo: "Omar Salem", releaseVersion: "2026.04", createdDate: "2026-04-18" },
      { id: "DF-1029", title: "UAT users are logged out before timeout policy", project: "Claims Portal", environment: "UAT", severity: "Critical", priority: "P1", status: "Reopened", assignedTo: "Leena Faris", releaseVersion: "2026.03", createdDate: "2026-04-10" },
      { id: "DF-1018", title: "Project filter does not persist after refresh", project: "Mobile QA", environment: "SIT", severity: "Low", priority: "P4", status: "Closed", assignedTo: "Fahad Noor", releaseVersion: "2026.02", createdDate: "2026-03-05" },
      { id: "DF-1051", title: "Retest evidence missing from closure package", project: "Claims Portal", environment: "Pre-Prod", severity: "Medium", priority: "P2", status: "Retest", assignedTo: "Omar Salem", releaseVersion: "2026.04", createdDate: "2026-04-23" },
      { id: "DF-1054", title: "Payment retry creates duplicate transaction note", project: "Billing Core", environment: "SIT", severity: "High", priority: "P1", status: "Fixed", assignedTo: "Aisha Khan", releaseVersion: "2026.04", createdDate: "2026-04-24" },
      { id: "DF-1057", title: "Mobile date picker allows invalid deployment date", project: "Mobile QA", environment: "DEV", severity: "Low", priority: "P3", status: "New", assignedTo: "Leena Faris", releaseVersion: "2026.03", createdDate: "2026-04-25" },
      { id: "DF-1062", title: "Production incident summary missing assignee", project: "Claims Portal", environment: "PROD", severity: "Critical", priority: "P1", status: "Developer Rejected", assignedTo: "Fahad Noor", releaseVersion: "2026.04", createdDate: "2026-04-26" },
      { id: "DF-1066", title: "Assigned again defects do not notify developers", project: "Billing Core", environment: "UAT", severity: "Medium", priority: "P2", status: "Assigned Again", assignedTo: "Aisha Khan", releaseVersion: "2026.04", createdDate: "2026-04-26" },
      { id: "DF-1070", title: "Configuration label is reported as a defect", project: "Mobile QA", environment: "UAT", severity: "Low", priority: "P4", status: "Not a Defect", assignedTo: "Omar Salem", releaseVersion: "2026.02", createdDate: "2026-04-27" },
      { id: "DF-1074", title: "Supplier upload accepts duplicate email across companies", project: "Claims Portal", environment: "UAT", severity: "High", priority: "P1", status: "New", assignedTo: "Fahad Noor", releaseVersion: "2026.05", createdDate: "2026-04-28" },
      { id: "DF-1078", title: "Report export drops release deployment date", project: "Billing Core", environment: "UAT", severity: "Medium", priority: "P2", status: "Assigned", assignedTo: "Leena Faris", releaseVersion: "2026.05", createdDate: "2026-04-28" },
      { id: "DF-1081", title: "Closed defect appears in open aging view", project: "Mobile QA", environment: "Pre-Prod", severity: "Medium", priority: "P3", status: "Closed", assignedTo: "Aisha Khan", releaseVersion: "2026.03", createdDate: "2026-04-12" },
      { id: "DF-1086", title: "Search does not include actual result text", project: "Claims Portal", environment: "SIT", severity: "Low", priority: "P4", status: "Fixed", assignedTo: "Omar Salem", releaseVersion: "2026.05", createdDate: "2026-04-29" },
      { id: "DF-1090", title: "Critical production issue cannot be reassigned", project: "Billing Core", environment: "PROD", severity: "Critical", priority: "P1", status: "In Progress", assignedTo: "Leena Faris", releaseVersion: "2026.05", createdDate: "2026-04-30" },
      { id: "DF-1094", title: "Retest result saves without attachment evidence", project: "Mobile QA", environment: "UAT", severity: "High", priority: "P2", status: "Retest", assignedTo: "Fahad Noor", releaseVersion: "2026.05", createdDate: "2026-04-30" }
    ];
    reportRecords.forEach(function (record) {
      record.createdBy = record.createdBy || "qa.user";
    });
    var reportFilters = Array.prototype.slice.call(document.querySelectorAll("[data-report-filter]"));
    var reportResultCount = document.querySelector("[data-report-result-count]");
    var reportFilterPanel = document.querySelector(".dashboard-filter-panel");
    var reportFilterBody = document.querySelector("[data-dashboard-filter-body]");
    var toggleReportFiltersButton = document.querySelector("[data-toggle-dashboard-filters]");
    var resetReportButton = document.querySelector("[data-dashboard-reset]");
    var exportReportButton = document.querySelector("[data-dashboard-export]");
    var openReportChartModalButton = document.querySelector("[data-open-report-chart-modal]");
    var restoreReportChartSelect = document.querySelector("[data-restore-report-chart]");
    var closeReportChartModalButtons = Array.prototype.slice.call(reportChartModal.querySelectorAll("[data-close-report-chart-modal]"));
    var saveReportChartButton = reportChartModal.querySelector("[data-save-report-chart]");
    var reportChartTitleInput = reportChartModal.querySelector("[data-report-chart-title]");
    var reportChartTypeInput = reportChartModal.querySelector("[data-report-chart-type]");
    var reportChartGroupInput = reportChartModal.querySelector("[data-report-chart-group]");
    var reportChartInstances = {};
    var draggedReportChart = null;
    var reportChartDefinitions = {
      status: { title: "Defects by Status", type: "doughnut", groupBy: "status", span: 4, tall: false },
      severity: { title: "Defects by Severity", type: "bar", groupBy: "severity", span: 4, tall: false },
      environment: { title: "Defects by Environment", type: "doughnut", groupBy: "environment", span: 4, tall: false },
      releaseVersion: { title: "Defects by Release", type: "horizontal", groupBy: "releaseVersion", span: 4, tall: false },
      trend: { title: "Created Defect Trend", type: "line", groupBy: "createdMonth", span: 8, tall: false },
      aging: { title: "Open Aging Buckets", type: "bar", groupBy: "aging", span: 4, tall: false }
    };
    var reportSortKey = "createdDate";
    var reportSortAsc = false;
    var labelMap = {
      status: "Status",
      severity: "Severity",
      priority: "Priority",
      project: "Project",
      environment: "Environment",
      assignedTo: "Assigned To",
      releaseVersion: "Release Version",
      createdMonth: "Created Month"
    };
    var chartColors = {
      Critical: "#5c1c1c",
      High: "#b83737",
      Medium: "#c65f5f",
      Low: "#dc9b9b",
      New: "#b5ccbb",
      Assigned: "#7ea687",
      "In Progress": "#b5ccbb",
      Fixed: "#7ea687",
      Retest: "#dc9b9b",
      Closed: "#23402a",
      Reopened: "#5c1c1c",
      "Developer Rejected": "#b83737",
      "Not a Defect": "#c65f5f",
      "Assigned Again": "#7ea687",
      P1: "#5c1c1c",
      P2: "#b83737",
      P3: "#c65f5f",
      P4: "#dc9b9b"
    };
    var neutralPalette = ["#23402a", "#2a4d32", "#7ea687", "#b5ccbb", "#5c1c1c", "#b83737", "#c65f5f", "#dc9b9b", "#262828", "#303635"];

    if (window.Chart) {
      Chart.defaults.font.family = '"Book Antiqua", Palatino, serif';
      Chart.defaults.color = "#303635";
      Chart.defaults.borderColor = "rgba(48, 54, 53, .18)";
    }

    reportRecords.forEach(function (record) {
      var created = new Date(record.createdDate + "T00:00:00");
      record.age = Math.max(0, Math.round((reportToday - created) / 86400000));
      record.createdMonth = record.createdDate.slice(0, 7);
    });

    function uniqueValues(field) {
      return Array.from(new Set(reportRecords.map(function (record) {
        return record[field];
      }).filter(Boolean))).sort();
    }

    function fillReportSelect(field) {
      var select = document.querySelector('[data-report-filter="' + field + '"]');
      if (!select) return;
      uniqueValues(field).forEach(function (value) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
    }

    ["project", "environment", "status", "severity", "priority", "assignedTo", "releaseVersion"].forEach(fillReportSelect);

    function getReportFilters() {
      var filters = {};
      reportFilters.forEach(function (control) {
        filters[control.getAttribute("data-report-filter")] = control.value.trim();
      });
      return filters;
    }

    function getFilteredReportRecords() {
      var filters = getReportFilters();
      var search = (filters.search || "").toLowerCase();
      return reportRecords.filter(function (record) {
        if (filters.project && record.project !== filters.project) return false;
        if (filters.environment && record.environment !== filters.environment) return false;
        if (filters.status && record.status !== filters.status) return false;
        if (filters.severity && record.severity !== filters.severity) return false;
        if (filters.priority && record.priority !== filters.priority) return false;
        if (filters.assignedTo && record.assignedTo !== filters.assignedTo) return false;
        if (filters.releaseVersion && record.releaseVersion !== filters.releaseVersion) return false;
        if (filters.from && record.createdDate < filters.from) return false;
        if (filters.to && record.createdDate > filters.to) return false;
        if (search) {
          var searchable = [record.id, record.title, record.project, record.environment, record.status, record.severity, record.priority, record.assignedTo, record.createdBy, record.releaseVersion].join(" ").toLowerCase();
          if (searchable.indexOf(search) === -1) return false;
        }
        return true;
      });
    }

    function isOpenStatus(status) {
      return ["New", "Assigned", "In Progress", "Fixed", "Retest", "Reopened", "Developer Rejected", "Assigned Again"].indexOf(status) !== -1;
    }

    function renderReportKpis(rows) {
      var openRows = rows.filter(function (record) { return isOpenStatus(record.status); });
      var fixedRows = rows.filter(function (record) { return record.status === "Fixed"; });
      var closedRows = rows.filter(function (record) { return record.status === "Closed"; });
      var highOpenRows = rows.filter(function (record) {
        return isOpenStatus(record.status) && (record.priority === "P1" || record.priority === "P2");
      });
      var avgAge = openRows.length ? Math.round(openRows.reduce(function (sum, record) { return sum + record.age; }, 0) / openRows.length) : 0;
      setKpi("total", rows.length);
      setKpi("open", openRows.length);
      setKpi("fixed", fixedRows.length);
      setKpi("closed", closedRows.length);
      setKpi("highOpen", highOpenRows.length);
      setKpi("avgAge", avgAge + "d");
      setKpiNote("total", rows.length === reportRecords.length ? "All defects" : "Filtered view");
      setKpiNote("open", rows.length ? Math.round((openRows.length / rows.length) * 100) + "% of view" : "No defects");
      setKpiNote("closed", rows.length ? Math.round((closedRows.length / rows.length) * 100) + "% of view" : "No defects");
    }

    function setKpi(key, value) {
      var el = document.querySelector('[data-kpi-value="' + key + '"]');
      if (el) el.textContent = value;
    }

    function setKpiNote(key, value) {
      var el = document.querySelector('[data-kpi-note="' + key + '"]');
      if (el) el.textContent = value;
    }

    function countBy(rows, field) {
      var counts = {};
      rows.forEach(function (record) {
        var value = record[field] || "Not set";
        counts[value] = (counts[value] || 0) + 1;
      });
      return Object.keys(counts).sort().map(function (label) {
        return { label: label, value: counts[label] };
      });
    }

    function countAging(rows) {
      var buckets = { "0-7": 0, "8-14": 0, "15-30": 0, "31+": 0 };
      rows.filter(function (record) { return isOpenStatus(record.status); }).forEach(function (record) {
        if (record.age <= 7) buckets["0-7"] += 1;
        else if (record.age <= 14) buckets["8-14"] += 1;
        else if (record.age <= 30) buckets["15-30"] += 1;
        else buckets["31+"] += 1;
      });
      return Object.keys(buckets).map(function (label) {
        return { label: label, value: buckets[label] };
      });
    }

    function colorsFor(labels) {
      return labels.map(function (label, index) {
        return chartColors[label] || neutralPalette[index % neutralPalette.length];
      });
    }

    function chartMetaText(rows) {
      return rows.length + " defects in current view";
    }

    function normalizeChartType(type) {
      return type === "horizontal" ? "bar" : type;
    }

    function getReportChartConfig(card) {
      var id = card.getAttribute("data-chart-id");
      if (reportChartDefinitions[id]) {
        return reportChartDefinitions[id];
      }
      return JSON.parse(card.getAttribute("data-chart-config") || "{}");
    }

    function createReportChartCard(id, definition) {
      var card = document.createElement("article");
      card.className = "report-chart-card";
      if (definition.span >= 8) card.classList.add("wide-chart");
      card.setAttribute("data-chart-id", id);
      card.innerHTML = '<div class="chart-title-row"><div><h3></h3><p class="chart-meta" data-chart-meta>All defects</p></div></div><div class="canvas-wrap"><canvas></canvas></div>';
      card.querySelector("h3").textContent = definition.title;
      return card;
    }

    function updateRestoreChartOptions() {
      if (!restoreReportChartSelect) return;
      var activeIds = Array.prototype.slice.call(reportChartGrid.querySelectorAll(".report-chart-card")).map(function (card) {
        return card.getAttribute("data-chart-id");
      });
      var removedIds = Object.keys(reportChartDefinitions).filter(function (id) {
        return activeIds.indexOf(id) === -1;
      });
      restoreReportChartSelect.innerHTML = '<option value="">Restore removed chart</option>';
      removedIds.forEach(function (id) {
        var option = document.createElement("option");
        option.value = id;
        option.textContent = reportChartDefinitions[id].title;
        restoreReportChartSelect.appendChild(option);
      });
      restoreReportChartSelect.hidden = removedIds.length === 0;
    }

    function restoreReportChart(id) {
      var definition = reportChartDefinitions[id];
      if (!definition || reportChartGrid.querySelector('[data-chart-id="' + id + '"]')) return;
      var card = createReportChartCard(id, definition);
      reportChartGrid.appendChild(card);
      renderReportChart(card, definition, getFilteredReportRecords());
      updateRestoreChartOptions();
    }

    function prepareReportChartCard(card) {
      var titleRow = card.querySelector(".chart-title-row");
      var actions = card.querySelector(".chart-actions");
      var resizeHandle = card.querySelector("[data-resize-report-chart]");

      if (!titleRow) return;

      if (!actions) {
        actions = document.createElement("div");
        actions.className = "chart-actions";
        titleRow.appendChild(actions);
      }

      if (!card.querySelector("[data-chart-drag-handle]")) {
        var dragHandle = document.createElement("button");
        dragHandle.type = "button";
        dragHandle.className = "chart-drag-handle";
        dragHandle.setAttribute("data-chart-drag-handle", "");
        dragHandle.setAttribute("aria-label", "Move chart");
        dragHandle.title = "Move chart";
        dragHandle.textContent = "::";
        actions.insertBefore(dragHandle, actions.firstChild);
      }

      if (!card.querySelector("[data-remove-report-chart]")) {
        var removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "chart-remove-button";
        removeButton.setAttribute("data-remove-report-chart", "");
        removeButton.setAttribute("aria-label", "Remove chart");
        removeButton.title = "Remove chart";
        removeButton.textContent = "x";
        actions.appendChild(removeButton);
      } else {
        var existingRemove = card.querySelector("[data-remove-report-chart]");
        existingRemove.classList.add("chart-remove-button");
        existingRemove.setAttribute("aria-label", "Remove chart");
        existingRemove.title = "Remove chart";
      }

      if (!resizeHandle) {
        resizeHandle = document.createElement("button");
        resizeHandle.type = "button";
        resizeHandle.className = "chart-resize-handle";
        resizeHandle.setAttribute("data-resize-report-chart", "");
        resizeHandle.setAttribute("aria-label", "Resize chart");
        resizeHandle.title = "Resize chart";
        card.appendChild(resizeHandle);
      }

      card.draggable = false;
    }

    function resizeReportChartInstance(card) {
      var chartId = card.getAttribute("data-chart-instance-id");
      if (window.Chart && chartId && reportChartInstances[chartId]) {
        var canvasWrap = card.querySelector(".canvas-wrap");
        if (canvasWrap) {
          reportChartInstances[chartId].resize(canvasWrap.clientWidth, canvasWrap.clientHeight);
        } else {
          reportChartInstances[chartId].resize();
        }
      }
    }

    function renderReportChart(card, config, rows) {
      prepareReportChartCard(card);
      var canvas = card.querySelector("canvas");
      var meta = card.querySelector("[data-chart-meta]");
      var chartId = card.getAttribute("data-chart-instance-id") || card.getAttribute("data-chart-id") || ("chart-" + Date.now());
      var existingFallback = card.querySelector("[data-chart-fallback]");
      var dataRows = config.groupBy === "aging" ? countAging(rows) : countBy(rows, config.groupBy);
      var labels = dataRows.map(function (row) { return row.label; });
      var values = dataRows.map(function (row) { return row.value; });
      var type = normalizeChartType(config.type);
      var dataset = {
        label: "Defects",
        data: values,
        backgroundColor: type === "line" ? "rgba(126, 166, 135, .25)" : colorsFor(labels),
        borderColor: type === "line" ? "#23402a" : colorsFor(labels),
        borderWidth: type === "line" ? 2 : 1,
        fill: type === "line",
        tension: .35
      };

      card.setAttribute("data-chart-instance-id", chartId);
      if (meta) meta.textContent = chartMetaText(rows);

      if (existingFallback) {
        existingFallback.remove();
      }

      if (!window.Chart) {
        if (canvas) canvas.hidden = true;
        var fallback = document.createElement("div");
        fallback.className = "chart-empty";
        fallback.setAttribute("data-chart-fallback", "");
        fallback.textContent = "Chart preview is waiting for Chart.js to load.";
        card.appendChild(fallback);
        return;
      }

      if (canvas) canvas.hidden = false;

      if (reportChartInstances[chartId]) {
        reportChartInstances[chartId].destroy();
      }

      reportChartInstances[chartId] = new Chart(canvas.getContext("2d"), {
        type: type,
        data: { labels: labels, datasets: [dataset] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: config.type === "horizontal" ? "y" : "x",
          plugins: {
            legend: { display: type === "doughnut", position: "bottom", labels: { boxWidth: 10, padding: 10 } },
            tooltip: { displayColors: false }
          },
          scales: type === "doughnut" ? {} : {
            x: { grid: { display: false }, ticks: { color: "#303635" } },
            y: { beginAtZero: true, ticks: { precision: 0, color: "#303635" } }
          }
        }
      });
    }

    function renderAllReportCharts(rows) {
      reportChartGrid.querySelectorAll(".report-chart-card").forEach(function (card) {
        renderReportChart(card, getReportChartConfig(card), rows);
      });
      updateRestoreChartOptions();
    }

    function getReportBadgeClass(value, field) {
      var key = String(value).toLowerCase().replace(/\s+/g, "-");
      if (field === "severity") return "badge-" + key;
      if (field === "status") {
        var statusClasses = {
          "new": "badge-new",
          "assigned": "badge-assigned",
          "in-progress": "badge-progress",
          "fixed": "badge-fixed",
          "retest": "badge-retest",
          "closed": "badge-closed",
          "reopened": "badge-reopened",
          "developer-rejected": "badge-danger",
          "not-a-defect": "badge-warning",
          "assigned-again": "badge-assigned"
        };
        return statusClasses[key] || "badge-neutral";
      }
      return "badge-neutral";
    }

    function createReportBadge(value, field) {
      var badge = document.createElement("span");
      badge.className = "badge " + getReportBadgeClass(value, field);
      badge.textContent = value;
      return badge;
    }

    function appendReportCell(row, text, className) {
      var cell = document.createElement("td");
      cell.textContent = text;
      if (className) cell.className = className;
      row.appendChild(cell);
    }

    function sortedReportRows(rows) {
      return rows.slice().sort(function (a, b) {
        var left = a[reportSortKey] || "";
        var right = b[reportSortKey] || "";
        if (typeof left === "number" && typeof right === "number") {
          return reportSortAsc ? left - right : right - left;
        }
        return reportSortAsc ? String(left).localeCompare(String(right)) : String(right).localeCompare(String(left));
      });
    }

    function renderReportTable(rows) {
      reportTableBody.innerHTML = "";
      sortedReportRows(rows).forEach(function (record) {
        var row = document.createElement("tr");
        appendReportCell(row, record.id);
        appendReportCell(row, record.title, "report-title-cell");
        appendReportCell(row, record.project);
        appendReportCell(row, record.environment);
        var severityCell = document.createElement("td");
        severityCell.appendChild(createReportBadge(record.severity, "severity"));
        row.appendChild(severityCell);
        appendReportCell(row, record.priority);
        var statusCell = document.createElement("td");
        statusCell.appendChild(createReportBadge(record.status, "status"));
        row.appendChild(statusCell);
        appendReportCell(row, record.assignedTo);
        appendReportCell(row, record.releaseVersion);
        appendReportCell(row, record.createdBy);
        appendReportCell(row, record.createdDate);
        appendReportCell(row, record.age + "d");
        reportTableBody.appendChild(row);
      });

      if (!rows.length) {
        var emptyRow = document.createElement("tr");
        var emptyCell = document.createElement("td");
        emptyCell.colSpan = 12;
        emptyCell.className = "chart-empty";
        emptyCell.textContent = "No defects match the current dashboard filters.";
        emptyRow.appendChild(emptyCell);
        reportTableBody.appendChild(emptyRow);
      }

      if (reportResultCount) {
        reportResultCount.textContent = rows.length + " defects";
      }
    }

    function refreshReportDashboard() {
      var rows = getFilteredReportRecords();
      renderReportKpis(rows);
      renderAllReportCharts(rows);
      renderReportTable(rows);
    }

    function toggleReportFilters() {
      if (!reportFilterPanel || !reportFilterBody || !toggleReportFiltersButton) return;
      var isCollapsed = reportFilterPanel.classList.toggle("is-collapsed");
      var toggleLabel = toggleReportFiltersButton.querySelector("[data-filter-toggle-label]");
      reportFilterBody.hidden = isCollapsed;
      if (toggleLabel) toggleLabel.textContent = isCollapsed ? "Expand" : "Collapse";
      toggleReportFiltersButton.setAttribute("aria-expanded", String(!isCollapsed));
    }

    function resetReportFilters() {
      reportFilters.forEach(function (control) {
        control.value = "";
      });
      refreshReportDashboard();
    }

    function exportReportCsv() {
      var rows = getFilteredReportRecords();
      var columns = ["id", "title", "project", "environment", "severity", "priority", "status", "assignedTo", "releaseVersion", "createdBy", "createdDate", "age"];
      var escapeCell = function (value) {
        var text = String(value == null ? "" : value).replace(/"/g, '""');
        return /[",\n]/.test(text) ? '"' + text + '"' : text;
      };
      var csv = [columns.join(",")].concat(rows.map(function (record) {
        return columns.map(function (column) { return escapeCell(record[column]); }).join(",");
      })).join("\n");
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "defect_dashboard_filtered.csv";
      link.click();
      URL.revokeObjectURL(link.href);
    }

    function openReportChartModal() {
      reportChartTitleInput.value = "";
      reportChartTypeInput.value = "bar";
      reportChartGroupInput.value = "status";
      reportChartModal.classList.add("open");
      reportChartModal.setAttribute("aria-hidden", "false");
      reportChartTitleInput.focus();
    }

    function closeReportChartModal() {
      reportChartModal.classList.remove("open");
      reportChartModal.setAttribute("aria-hidden", "true");
    }

    function addReportChart() {
      var groupBy = reportChartGroupInput.value;
      var title = reportChartTitleInput.value.trim() || "Defects by " + (labelMap[groupBy] || groupBy);
      var chartId = "custom-" + Date.now();
      var card = document.createElement("article");
      card.className = "report-chart-card";
      card.setAttribute("data-chart-id", chartId);
      card.setAttribute("data-chart-config", JSON.stringify({ type: reportChartTypeInput.value, groupBy: groupBy }));
      card.innerHTML = '<div class="chart-title-row"><div><h3></h3><p class="chart-meta" data-chart-meta>All defects</p></div></div><div class="canvas-wrap"><canvas></canvas></div>';
      card.querySelector("h3").textContent = title;
      reportChartGrid.appendChild(card);
      renderReportChart(card, JSON.parse(card.getAttribute("data-chart-config")), getFilteredReportRecords());
      closeReportChartModal();
    }

    reportFilters.forEach(function (control) {
      control.addEventListener("input", refreshReportDashboard);
      control.addEventListener("change", refreshReportDashboard);
    });

    document.querySelectorAll("[data-sort-key]").forEach(function (header) {
      header.addEventListener("click", function () {
        var key = header.getAttribute("data-sort-key");
        if (reportSortKey === key) reportSortAsc = !reportSortAsc;
        else {
          reportSortKey = key;
          reportSortAsc = true;
        }
        document.querySelectorAll("[data-sort-key]").forEach(function (item) {
          item.classList.remove("sorted-asc", "sorted-desc");
        });
        header.classList.add(reportSortAsc ? "sorted-asc" : "sorted-desc");
        renderReportTable(getFilteredReportRecords());
      });
    });

    if (toggleReportFiltersButton) toggleReportFiltersButton.addEventListener("click", toggleReportFilters);
    if (resetReportButton) resetReportButton.addEventListener("click", resetReportFilters);
    if (exportReportButton) exportReportButton.addEventListener("click", exportReportCsv);
    if (openReportChartModalButton) openReportChartModalButton.addEventListener("click", openReportChartModal);
    if (restoreReportChartSelect) {
      restoreReportChartSelect.addEventListener("change", function () {
        if (!restoreReportChartSelect.value) return;
        restoreReportChart(restoreReportChartSelect.value);
        restoreReportChartSelect.value = "";
      });
    }
    if (saveReportChartButton) saveReportChartButton.addEventListener("click", addReportChart);
    closeReportChartModalButtons.forEach(function (button) {
      button.addEventListener("click", closeReportChartModal);
    });
    reportChartModal.addEventListener("click", function (event) {
      if (event.target === reportChartModal) closeReportChartModal();
    });
    reportChartGrid.addEventListener("click", function (event) {
      var removeButton = event.target.closest("[data-remove-report-chart]");
      if (!removeButton) return;
      var card = removeButton.closest(".report-chart-card");
      var chartId = card.getAttribute("data-chart-instance-id");
      if (chartId && reportChartInstances[chartId]) {
        reportChartInstances[chartId].destroy();
        delete reportChartInstances[chartId];
      }
      card.remove();
      updateRestoreChartOptions();
    });
    reportChartGrid.addEventListener("dragstart", function (event) {
      var handle = event.target.closest("[data-chart-drag-handle]");
      var card = event.target.closest(".report-chart-card");
      if (!handle || !card) {
        event.preventDefault();
        return;
      }
      draggedReportChart = card;
      card.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", card.getAttribute("data-chart-id") || "");
    });
    reportChartGrid.addEventListener("dragover", function (event) {
      var targetCard = event.target.closest(".report-chart-card");
      if (!draggedReportChart || !targetCard || targetCard === draggedReportChart) return;
      event.preventDefault();
      targetCard.classList.add("is-drop-target");
      event.dataTransfer.dropEffect = "move";
    });
    reportChartGrid.addEventListener("dragleave", function (event) {
      var targetCard = event.target.closest(".report-chart-card");
      if (targetCard) targetCard.classList.remove("is-drop-target");
    });
    reportChartGrid.addEventListener("drop", function (event) {
      var targetCard = event.target.closest(".report-chart-card");
      if (!draggedReportChart || !targetCard || targetCard === draggedReportChart) return;
      event.preventDefault();
      var targetBox = targetCard.getBoundingClientRect();
      var placeAfter = event.clientX > targetBox.left + targetBox.width / 2;
      targetCard.classList.remove("is-drop-target");
      reportChartGrid.insertBefore(draggedReportChart, placeAfter ? targetCard.nextSibling : targetCard);
      Object.keys(reportChartInstances).forEach(function (key) {
        reportChartInstances[key].resize();
      });
    });
    reportChartGrid.addEventListener("dragend", function () {
      reportChartGrid.querySelectorAll(".report-chart-card").forEach(function (card) {
        card.classList.remove("is-dragging", "is-drop-target");
      });
      draggedReportChart = null;
    });
    reportChartGrid.addEventListener("pointerdown", function (event) {
      var dragHandle = event.target.closest("[data-chart-drag-handle]");
      var resizeHandle = event.target.closest("[data-resize-report-chart]");

      if (dragHandle) {
        event.preventDefault();
        var movingCard = dragHandle.closest(".report-chart-card");
        var startX = event.clientX;
        var startY = event.clientY;
        var startRect = null;
        var placeholder = null;
        var pointerOffsetX = 0;
        var pointerOffsetY = 0;
        var hasStartedMove = false;

        function startMove(moveEvent) {
          startRect = movingCard.getBoundingClientRect();
          pointerOffsetX = startX - startRect.left;
          pointerOffsetY = startY - startRect.top;
          placeholder = document.createElement("article");
          placeholder.className = "chart-drop-placeholder";
          placeholder.style.gridColumn = movingCard.style.gridColumn || getComputedStyle(movingCard).gridColumnEnd.replace("span ", "span ");
          placeholder.style.height = startRect.height + "px";
          placeholder.setAttribute("data-chart-drop-placeholder", "");
          reportChartGrid.insertBefore(placeholder, movingCard);
          movingCard.classList.add("is-moving");
          movingCard.style.position = "fixed";
          movingCard.style.left = startRect.left + "px";
          movingCard.style.top = startRect.top + "px";
          movingCard.style.width = startRect.width + "px";
          movingCard.style.height = startRect.height + "px";
          movingCard.style.gridColumn = "";
          hasStartedMove = true;
          onMoveChart(moveEvent);
        }

        function onMoveChart(moveEvent) {
          if (!hasStartedMove) {
            var distanceX = moveEvent.clientX - startX;
            var distanceY = moveEvent.clientY - startY;
            if (Math.sqrt(distanceX * distanceX + distanceY * distanceY) < 8) {
              return;
            }
            startMove(moveEvent);
            return;
          }
          movingCard.style.left = (moveEvent.clientX - pointerOffsetX) + "px";
          movingCard.style.top = (moveEvent.clientY - pointerOffsetY) + "px";
          var target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
          var targetCard = target ? target.closest(".report-chart-card") : null;
          reportChartGrid.querySelectorAll(".report-chart-card").forEach(function (card) {
            if (card !== movingCard) card.classList.remove("is-drop-target");
          });
          if (targetCard && targetCard !== movingCard) {
            var targetBox = targetCard.getBoundingClientRect();
            var placeAfter = moveEvent.clientX > targetBox.left + targetBox.width / 2;
            targetCard.classList.add("is-drop-target");
            reportChartGrid.insertBefore(placeholder, placeAfter ? targetCard.nextSibling : targetCard);
          } else if (target === reportChartGrid || (target && target.closest("[data-report-chart-grid]"))) {
            var cards = Array.prototype.slice.call(reportChartGrid.querySelectorAll(".report-chart-card:not(.is-moving)"));
            var placed = false;
            cards.some(function (card) {
              var box = card.getBoundingClientRect();
              if (moveEvent.clientY < box.top + box.height / 2) {
                reportChartGrid.insertBefore(placeholder, card);
                placed = true;
                return true;
              }
              return false;
            });
            if (!placed) reportChartGrid.appendChild(placeholder);
          }
        }

        function onDropChart(upEvent) {
          if (!hasStartedMove) {
            document.removeEventListener("pointermove", onMoveChart);
            document.removeEventListener("pointerup", onDropChart);
            return;
          }
          reportChartGrid.insertBefore(movingCard, placeholder);
          placeholder.remove();
          movingCard.style.position = "";
          movingCard.style.left = "";
          movingCard.style.top = "";
          movingCard.style.width = "";
          movingCard.style.height = "";
          movingCard.style.gridColumn = movingCard.getAttribute("data-chart-span") ? "span " + movingCard.getAttribute("data-chart-span") : "";
          reportChartGrid.querySelectorAll(".report-chart-card").forEach(function (card) {
            card.classList.remove("is-dragging", "is-moving", "is-drop-target");
          });
          Object.keys(reportChartInstances).forEach(function (key) {
            reportChartInstances[key].resize();
          });
          document.removeEventListener("pointermove", onMoveChart);
          document.removeEventListener("pointerup", onDropChart);
        }

        document.addEventListener("pointermove", onMoveChart);
        document.addEventListener("pointerup", onDropChart);
        return;
      }

      if (!resizeHandle) return;
      event.preventDefault();
      var card = resizeHandle.closest(".report-chart-card");
      var canvasWrap = card.querySelector(".canvas-wrap");
      var startX = event.clientX;
      var startY = event.clientY;
      var initialSpan = Number(card.getAttribute("data-chart-span")) || (card.classList.contains("wide-chart") ? 8 : 4);
      var initialHeight = canvasWrap.offsetHeight;
      var spanOptions = [4, 6, 8, 12];

      function onPointerMove(moveEvent) {
        var spanStep = Math.round((moveEvent.clientX - startX) / 130);
        var spanIndex = Math.max(0, Math.min(spanOptions.length - 1, spanOptions.indexOf(initialSpan) + spanStep));
        var nextSpan = spanOptions[spanIndex];
        var nextHeight = Math.max(210, Math.min(520, initialHeight + moveEvent.clientY - startY));
        card.style.gridColumn = "span " + nextSpan;
        card.setAttribute("data-chart-span", String(nextSpan));
        canvasWrap.style.height = nextHeight + "px";
        card.classList.remove("wide-chart");
        resizeReportChartInstance(card);
      }

      function onPointerUp() {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        resizeReportChartInstance(card);
      }

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    });

    document.querySelector('[data-sort-key="createdDate"]').classList.add("sorted-desc");
    refreshReportDashboard();
  }

  var addProjectButton = document.querySelector("[data-add-row-trigger]");
  var addProjectRow = document.querySelector("[data-add-row]");
  var projectTableBody = document.querySelector("[data-project-table-body]");

  if (addProjectButton && addProjectRow && projectTableBody) {
    var projectNameInput = addProjectRow.querySelector("[data-project-name]");
    var projectDescriptionInput = addProjectRow.querySelector("[data-project-description]");
    var projectStatusInput = addProjectRow.querySelector("[data-project-status]");
    var saveProjectButton = addProjectRow.querySelector("[data-save-project]");
    var cancelProjectButton = addProjectRow.querySelector("[data-cancel-project]");

    function getProjectBadgeClass(status) {
      return status === "Active" ? "badge-active" : "badge-inactive";
    }

    function createProjectEditButton() {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = "Edit";
      button.setAttribute("data-edit-project", "");
      return button;
    }

    function getProjectRowData(row) {
      return {
        name: row.cells[0].textContent.trim(),
        description: row.cells[1].textContent.trim(),
        status: row.cells[2].textContent.trim() || "Active"
      };
    }

    function renderProjectRow(row, data) {
      var badge = document.createElement("span");
      row.classList.remove("inline-edit-row");
      row.dataset.originalProject = "";
      row.cells[0].classList.remove("table-edit-cell");
      row.cells[1].classList.remove("table-edit-cell");
      row.cells[0].textContent = data.name;
      row.cells[1].textContent = data.description || "No description added.";
      badge.className = "badge " + getProjectBadgeClass(data.status);
      badge.textContent = data.status;
      row.cells[2].replaceChildren(badge);
      row.cells[3].replaceChildren(createProjectEditButton());
    }

    function startProjectRowEdit(row) {
      if (row.classList.contains("inline-edit-row") || row === addProjectRow) {
        return;
      }

      var data = getProjectRowData(row);
      var nameInput = document.createElement("input");
      var descriptionInput = document.createElement("input");
      var statusToggle = document.createElement("div");
      var activeButton = document.createElement("button");
      var inactiveButton = document.createElement("button");
      var actions = document.createElement("div");
      var saveButton = document.createElement("button");
      var cancelButton = document.createElement("button");

      row.dataset.originalProject = JSON.stringify(data);
      row.classList.add("inline-edit-row");

      nameInput.type = "text";
      nameInput.className = "table-edit-input";
      nameInput.value = data.name;
      descriptionInput.type = "text";
      descriptionInput.className = "table-edit-input";
      descriptionInput.value = data.description === "No description added." ? "" : data.description;
      row.cells[0].classList.add("table-edit-cell");
      row.cells[1].classList.add("table-edit-cell");

      statusToggle.className = "table-status-toggle";
      statusToggle.setAttribute("data-project-edit-status", data.status);
      activeButton.type = "button";
      activeButton.textContent = "Active";
      activeButton.setAttribute("data-status-option", "Active");
      inactiveButton.type = "button";
      inactiveButton.textContent = "Inactive";
      inactiveButton.setAttribute("data-status-option", "Inactive");
      statusToggle.appendChild(activeButton);
      statusToggle.appendChild(inactiveButton);
      updateProjectStatusToggle(statusToggle, data.status);

      actions.className = "row-actions";
      saveButton.type = "button";
      saveButton.className = "button-primary";
      saveButton.textContent = "Save";
      saveButton.setAttribute("data-save-project-edit", "");
      cancelButton.type = "button";
      cancelButton.textContent = "Cancel";
      cancelButton.setAttribute("data-cancel-project-edit", "");
      actions.appendChild(saveButton);
      actions.appendChild(cancelButton);

      row.cells[0].replaceChildren(nameInput);
      row.cells[1].replaceChildren(descriptionInput);
      row.cells[2].replaceChildren(statusToggle);
      row.cells[3].replaceChildren(actions);
      nameInput.focus();
      nameInput.select();
    }

    function updateProjectStatusToggle(toggle, status) {
      toggle.setAttribute("data-project-edit-status", status);
      Array.prototype.slice.call(toggle.querySelectorAll("[data-status-option]")).forEach(function (button) {
        button.classList.toggle("active", button.getAttribute("data-status-option") === status);
      });
    }

    function saveProjectRowEdit(row) {
      var nameInput = row.cells[0].querySelector("input");
      var descriptionInput = row.cells[1].querySelector("input");
      var statusToggle = row.cells[2].querySelector("[data-project-edit-status]");
      var name = nameInput.value.trim();

      if (!name) {
        nameInput.focus();
        return;
      }

      renderProjectRow(row, {
        name: name,
        description: descriptionInput.value.trim(),
        status: statusToggle.getAttribute("data-project-edit-status") || "Active"
      });
    }

    function cancelProjectRowEdit(row) {
      var data = row.dataset.originalProject ? JSON.parse(row.dataset.originalProject) : getProjectRowData(row);
      renderProjectRow(row, data);
    }

    function resetProjectRow() {
      projectNameInput.value = "";
      projectDescriptionInput.value = "";
      projectStatusInput.value = "Active";
    }

    function setProjectRowVisible(isVisible) {
      addProjectRow.hidden = !isVisible;
      addProjectButton.innerHTML = isVisible ? "<span>-</span> Cancel" : "<span>+</span> Add Project";
      addProjectButton.setAttribute("aria-label", isVisible ? "Cancel new project" : "Add project");
      if (isVisible) {
        projectNameInput.focus();
      }
    }

    addProjectButton.addEventListener("click", function () {
      var shouldShow = addProjectRow.hidden;
      setProjectRowVisible(shouldShow);
      if (shouldShow) {
        resetProjectRow();
      }
    });

    cancelProjectButton.addEventListener("click", function () {
      resetProjectRow();
      setProjectRowVisible(false);
    });

    saveProjectButton.addEventListener("click", function () {
      var name = projectNameInput.value.trim();
      var description = projectDescriptionInput.value.trim();
      var status = projectStatusInput.value;

      if (!name) {
        projectNameInput.focus();
        return;
      }

      var row = document.createElement("tr");
      var nameCell = document.createElement("td");
      var descriptionCell = document.createElement("td");
      var statusCell = document.createElement("td");
      var actionsCell = document.createElement("td");
      var badge = document.createElement("span");

      nameCell.textContent = name;
      descriptionCell.textContent = description || "No description added.";
      badge.className = "badge " + getProjectBadgeClass(status);
      badge.textContent = status;

      statusCell.appendChild(badge);
      actionsCell.appendChild(createProjectEditButton());
      row.appendChild(nameCell);
      row.appendChild(descriptionCell);
      row.appendChild(statusCell);
      row.appendChild(actionsCell);

      projectTableBody.insertBefore(row, addProjectRow.nextSibling);
      resetProjectRow();
      setProjectRowVisible(false);
    });

    projectTableBody.addEventListener("click", function (event) {
      var editButton = event.target.closest("[data-edit-project]");
      var saveButton = event.target.closest("[data-save-project-edit]");
      var cancelButton = event.target.closest("[data-cancel-project-edit]");
      var statusOption = event.target.closest("[data-status-option]");
      var row = event.target.closest("tr");

      if (!row) {
        return;
      }

      if (editButton) {
        startProjectRowEdit(row);
      } else if (saveButton) {
        saveProjectRowEdit(row);
      } else if (cancelButton) {
        cancelProjectRowEdit(row);
      } else if (statusOption) {
        updateProjectStatusToggle(statusOption.closest("[data-project-edit-status]"), statusOption.getAttribute("data-status-option"));
      }
    });
  }

  function initSimpleInlineManager(config) {
    var addButton = document.querySelector(config.trigger);
    var addRow = document.querySelector(config.row);
    var tableBody = document.querySelector(config.body);

    if (!tableBody) {
      return;
    }

    var hasInlineAdd = !config.modalAdd && addButton && addRow;

    var inputs = config.inputs.map(function (item) {
      return {
        key: item.key,
        fallback: item.fallback,
        type: item.type,
        element: addRow ? addRow.querySelector(item.selector) : null
      };
    });
    var statusInput = addRow ? addRow.querySelector(config.statusSelector) : null;
    var saveButton = addRow ? addRow.querySelector(config.save) : null;
    var cancelButton = addRow ? addRow.querySelector(config.cancel) : null;
    var editSelector = "[" + config.editAttribute + "]";
    var originalDataKey = "original" + config.recordName.charAt(0).toUpperCase() + config.recordName.slice(1).replace(/\s+/g, "");

    function resetRow() {
      inputs.forEach(function (input) {
        if (input.element) input.element.value = "";
      });
      if (statusInput) statusInput.value = "Active";
    }

    function getBadgeClass(status) {
      return status === "Active" ? "badge-active" : "badge-inactive";
    }

    function createEditButton() {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = "Edit";
      button.setAttribute(config.editAttribute, "");
      return button;
    }

    function createPasswordButton() {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = "Password";
      button.setAttribute("data-reset-user-password", "");
      return button;
    }

    function appendRowActions(cell) {
      var actions = document.createElement("div");
      actions.className = "row-actions";
      actions.appendChild(createEditButton());
      if (config.passwordAction) {
        actions.appendChild(createPasswordButton());
      }
      cell.replaceChildren(actions);
    }

    function getRowData(row) {
      var data = {};
      inputs.forEach(function (input, index) {
        data[input.key] = row.cells[index].textContent.trim();
      });
      data.status = row.cells[inputs.length].textContent.trim() || "Active";
      return data;
    }

    function renderRow(row, data) {
      var badge = document.createElement("span");
      row.classList.remove("inline-edit-row");
      row.dataset[originalDataKey] = "";
      inputs.forEach(function (input, index) {
        row.cells[index].classList.remove("table-edit-cell");
        row.cells[index].textContent = data[input.key] || input.fallback;
      });
      badge.className = "badge " + getBadgeClass(data.status);
      badge.textContent = data.status;
      row.cells[inputs.length].replaceChildren(badge);
      appendRowActions(row.cells[inputs.length + 1]);
    }

    function updateStatusToggle(toggle, status) {
      toggle.setAttribute("data-edit-status", status);
      Array.prototype.slice.call(toggle.querySelectorAll("[data-status-option]")).forEach(function (button) {
        button.classList.toggle("active", button.getAttribute("data-status-option") === status);
      });
    }

    function createStatusToggle(status) {
      var statusToggle = document.createElement("div");
      var activeButton = document.createElement("button");
      var inactiveButton = document.createElement("button");

      statusToggle.className = "table-status-toggle";
      statusToggle.setAttribute("data-edit-status", status);
      activeButton.type = "button";
      activeButton.textContent = "Active";
      activeButton.setAttribute("data-status-option", "Active");
      inactiveButton.type = "button";
      inactiveButton.textContent = "Inactive";
      inactiveButton.setAttribute("data-status-option", "Inactive");
      statusToggle.appendChild(activeButton);
      statusToggle.appendChild(inactiveButton);
      updateStatusToggle(statusToggle, status);
      return statusToggle;
    }

    function startRowEdit(row) {
      if (row.classList.contains("inline-edit-row") || row === addRow) {
        return;
      }

      var data = getRowData(row);
      var statusToggle = createStatusToggle(data.status);
      var actions = document.createElement("div");
      var saveEditButton = document.createElement("button");
      var cancelEditButton = document.createElement("button");

      row.dataset[originalDataKey] = JSON.stringify(data);
      row.classList.add("inline-edit-row");

      inputs.forEach(function (input, index) {
        var editInput = document.createElement("input");
        editInput.type = input.type || "text";
        editInput.className = "table-edit-input";
        editInput.value = data[input.key] === input.fallback ? "" : data[input.key];
        row.cells[index].classList.add("table-edit-cell");
        row.cells[index].replaceChildren(editInput);
      });

      actions.className = "row-actions";
      saveEditButton.type = "button";
      saveEditButton.className = "button-primary";
      saveEditButton.textContent = "Save";
      saveEditButton.setAttribute("data-save-inline-edit", "");
      cancelEditButton.type = "button";
      cancelEditButton.textContent = "Cancel";
      cancelEditButton.setAttribute("data-cancel-inline-edit", "");
      actions.appendChild(saveEditButton);
      actions.appendChild(cancelEditButton);

      row.cells[inputs.length].replaceChildren(statusToggle);
      row.cells[inputs.length + 1].replaceChildren(actions);

      var firstInput = row.cells[0].querySelector("input");
      firstInput.focus();
      firstInput.select();
    }

    function saveRowEdit(row) {
      var data = {};
      var firstInput = row.cells[0].querySelector("input");
      var statusToggle = row.cells[inputs.length].querySelector("[data-edit-status]");

      inputs.forEach(function (input, index) {
        var editInput = row.cells[index].querySelector("input");
        data[input.key] = editInput.value.trim();
      });

      if (!data[inputs[0].key]) {
        firstInput.focus();
        return;
      }

      data.status = statusToggle.getAttribute("data-edit-status") || "Active";
      renderRow(row, data);
    }

    function cancelRowEdit(row) {
      var data = row.dataset[originalDataKey] ? JSON.parse(row.dataset[originalDataKey]) : getRowData(row);
      renderRow(row, data);
    }

    function setRowVisible(isVisible) {
      addRow.hidden = !isVisible;
      addButton.innerHTML = isVisible ? "<span>-</span> Cancel" : "<span>+</span> " + config.addLabel;
      addButton.setAttribute("aria-label", isVisible ? "Cancel new " + config.recordName : "Add " + config.recordName);
      if (isVisible && inputs[0]) {
        inputs[0].element.focus();
      }
    }

    function appendCell(row, value) {
      var cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    }

    if (hasInlineAdd) {
      addButton.addEventListener("click", function () {
        var shouldShow = addRow.hidden;
        setRowVisible(shouldShow);
        if (shouldShow) {
          resetRow();
        }
      });

      cancelButton.addEventListener("click", function () {
        resetRow();
        setRowVisible(false);
      });

      saveButton.addEventListener("click", function () {
        var values = inputs.map(function (input) {
          return {
            value: input.element.value.trim(),
            fallback: input.fallback,
            element: input.element
          };
        });

        if (!values[0].value) {
          values[0].element.focus();
          return;
        }

        var status = statusInput.value;
        var row = document.createElement("tr");
        var statusCell = document.createElement("td");
        var actionsCell = document.createElement("td");
        var badge = document.createElement("span");

        values.forEach(function (item) {
          appendCell(row, item.value || item.fallback);
        });

        badge.className = "badge " + getBadgeClass(status);
        badge.textContent = status;

        statusCell.appendChild(badge);
        row.appendChild(statusCell);
        row.appendChild(actionsCell);
        appendRowActions(actionsCell);

        tableBody.insertBefore(row, addRow.nextSibling);
        resetRow();
        setRowVisible(false);
      });
    }

    tableBody.addEventListener("click", function (event) {
      var row = event.target.closest("tr");
      var editButton = event.target.closest(editSelector);
      var saveEditButton = event.target.closest("[data-save-inline-edit]");
      var cancelEditButton = event.target.closest("[data-cancel-inline-edit]");
      var statusOption = event.target.closest("[data-status-option]");

      if (!row) {
        return;
      }

      if (editButton) {
        startRowEdit(row);
      } else if (saveEditButton) {
        saveRowEdit(row);
      } else if (cancelEditButton) {
        cancelRowEdit(row);
      } else if (statusOption) {
        updateStatusToggle(statusOption.closest("[data-edit-status]"), statusOption.getAttribute("data-status-option"));
      }
    });
  }

  initSimpleInlineManager({
    trigger: "[data-open-user-modal]",
    row: "[data-user-add-row]",
    body: "[data-user-table-body]",
    save: "[data-save-user]",
    cancel: "[data-cancel-user]",
    statusSelector: "[data-user-status]",
    editAttribute: "data-edit-user",
    passwordAction: true,
    modalAdd: true,
    addLabel: "Add User",
    recordName: "user",
    inputs: [
      { key: "name", selector: "[data-user-name]", fallback: "Unnamed User" },
      { key: "email", selector: "[data-user-email]", fallback: "No email added.", type: "email" },
      { key: "username", selector: "[data-user-username]", fallback: "No username added." }
    ]
  });

  initSimpleInlineManager({
    trigger: "[data-env-add-trigger]",
    row: "[data-env-add-row]",
    body: "[data-env-table-body]",
    save: "[data-save-env]",
    cancel: "[data-cancel-env]",
    statusSelector: "[data-env-status]",
    editAttribute: "data-edit-env",
    addLabel: "Add Environment",
    recordName: "environment",
    inputs: [
      { key: "name", selector: "[data-env-name]", fallback: "Unnamed Environment" },
      { key: "description", selector: "[data-env-description]", fallback: "No description added." }
    ]
  });

  var userModal = document.getElementById("userModal");
  if (userModal) {
    var openUserModalButton = document.querySelector("[data-open-user-modal]");
    var userTableBody = document.querySelector("[data-user-table-body]");
    var userNameInput = userModal.querySelector("[data-modal-user-name]");
    var userEmailInput = userModal.querySelector("[data-modal-user-email]");
    var userUsernameInput = userModal.querySelector("[data-modal-user-username]");
    var userStatusInput = userModal.querySelector("[data-modal-user-status]");
    var userPasswordInput = userModal.querySelector("[data-modal-user-password]");
    var userConfirmInput = userModal.querySelector("[data-modal-user-confirm]");
    var userMessage = userModal.querySelector("[data-user-message]");
    var saveModalUserButton = userModal.querySelector("[data-save-modal-user]");

    function setUserMessage(text, state) {
      userMessage.textContent = text || "";
      userMessage.classList.toggle("is-error", state === "error");
      userMessage.classList.toggle("is-success", state === "success");
    }

    function resetUserForm() {
      userNameInput.value = "";
      userEmailInput.value = "";
      userUsernameInput.value = "";
      userStatusInput.value = "Active";
      userPasswordInput.value = "";
      userConfirmInput.value = "";
      setUserMessage("", "");
    }

    function openUserModal() {
      resetUserForm();
      userModal.classList.add("open");
      userModal.setAttribute("aria-hidden", "false");
      userNameInput.focus();
    }

    function closeUserModal() {
      userModal.classList.remove("open");
      userModal.setAttribute("aria-hidden", "true");
      resetUserForm();
    }

    function createUserBadge(status) {
      var badge = document.createElement("span");
      badge.className = "badge " + (status === "Active" ? "badge-active" : "badge-inactive");
      badge.textContent = status;
      return badge;
    }

    function createUserActionCell() {
      var cell = document.createElement("td");
      var actions = document.createElement("div");
      var editButton = document.createElement("button");
      var passwordButton = document.createElement("button");

      actions.className = "row-actions";
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.setAttribute("data-edit-user", "");
      passwordButton.type = "button";
      passwordButton.textContent = "Password";
      passwordButton.setAttribute("data-reset-user-password", "");
      actions.appendChild(editButton);
      actions.appendChild(passwordButton);
      cell.appendChild(actions);
      return cell;
    }

    function appendUserCell(row, value) {
      var cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    }

    function saveModalUser() {
      var name = userNameInput.value.trim();
      var email = userEmailInput.value.trim();
      var username = userUsernameInput.value.trim();
      var status = userStatusInput.value;
      var password = userPasswordInput.value.trim();
      var confirmPassword = userConfirmInput.value.trim();
      var row = document.createElement("tr");
      var statusCell = document.createElement("td");

      if (!name) {
        setUserMessage("Name is required.", "error");
        userNameInput.focus();
        return;
      }

      if (!username) {
        setUserMessage("Username is required.", "error");
        userUsernameInput.focus();
        return;
      }

      if (!password || !confirmPassword) {
        setUserMessage("Password and confirmation are required.", "error");
        userPasswordInput.focus();
        return;
      }

      if (password !== confirmPassword) {
        setUserMessage("Password and confirmation must match.", "error");
        userConfirmInput.focus();
        return;
      }

      appendUserCell(row, name);
      appendUserCell(row, email || "No email added.");
      appendUserCell(row, username);
      statusCell.appendChild(createUserBadge(status));
      row.appendChild(statusCell);
      row.appendChild(createUserActionCell());
      userTableBody.insertBefore(row, userTableBody.firstElementChild);
      setUserMessage("User saved.", "success");
      window.setTimeout(closeUserModal, 500);
    }

    if (openUserModalButton) {
      openUserModalButton.addEventListener("click", openUserModal);
    }

    userModal.querySelectorAll("[data-close-user-modal]").forEach(function (button) {
      button.addEventListener("click", closeUserModal);
    });

    userModal.addEventListener("click", function (event) {
      if (event.target === userModal) {
        closeUserModal();
      }
    });

    userModal.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeUserModal();
      }
    });

    saveModalUserButton.addEventListener("click", saveModalUser);
  }

  var passwordModal = document.getElementById("passwordModal");
  if (passwordModal) {
    var passwordUserLabel = passwordModal.querySelector("[data-password-user-label]");
    var previousPasswordInput = passwordModal.querySelector("[data-password-previous]");
    var newPasswordInput = passwordModal.querySelector("[data-password-new]");
    var confirmPasswordInput = passwordModal.querySelector("[data-password-confirm]");
    var passwordMessage = passwordModal.querySelector("[data-password-message]");
    var commitPasswordButton = passwordModal.querySelector("[data-commit-password]");

    function setPasswordMessage(text, state) {
      passwordMessage.textContent = text || "";
      passwordMessage.classList.toggle("is-error", state === "error");
      passwordMessage.classList.toggle("is-success", state === "success");
    }

    function resetPasswordForm() {
      previousPasswordInput.value = "";
      newPasswordInput.value = "";
      confirmPasswordInput.value = "";
      setPasswordMessage("", "");
    }

    function openPasswordModal(row) {
      var name = row.cells[0].textContent.trim();
      var username = row.cells[2].textContent.trim();
      passwordModal.dataset.targetUser = username;
      passwordUserLabel.textContent = name + " | " + username;
      resetPasswordForm();
      passwordModal.classList.add("open");
      passwordModal.setAttribute("aria-hidden", "false");
      previousPasswordInput.focus();
    }

    function closePasswordModal() {
      passwordModal.classList.remove("open");
      passwordModal.setAttribute("aria-hidden", "true");
      resetPasswordForm();
    }

    document.addEventListener("click", function (event) {
      var resetButton = event.target.closest("[data-reset-user-password]");
      if (!resetButton) return;
      var row = resetButton.closest("tr");
      if (row) openPasswordModal(row);
    });

    passwordModal.querySelectorAll("[data-close-password-modal]").forEach(function (button) {
      button.addEventListener("click", closePasswordModal);
    });

    passwordModal.addEventListener("click", function (event) {
      if (event.target === passwordModal) {
        closePasswordModal();
      }
    });

    passwordModal.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closePasswordModal();
      }
    });

    commitPasswordButton.addEventListener("click", function () {
      var previousPassword = previousPasswordInput.value.trim();
      var newPassword = newPasswordInput.value.trim();
      var confirmPassword = confirmPasswordInput.value.trim();

      if (!previousPassword || !newPassword || !confirmPassword) {
        setPasswordMessage("Enter previous password, new password, and confirmation.", "error");
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordMessage("New password and confirmation must match.", "error");
        confirmPasswordInput.focus();
        return;
      }

      setPasswordMessage("Password reset committed for " + passwordModal.dataset.targetUser + ".", "success");
      window.setTimeout(closePasswordModal, 700);
    });
  }

  var defectFilterPanel = document.querySelector(".defect-filter-panel");
  var defectFilterBody = document.querySelector("[data-defect-filter-body]");
  var toggleDefectFiltersButton = document.querySelector("[data-toggle-defect-filters]");
  var applyDefectFiltersButton = document.querySelector("[data-apply-defect-filters]");
  var resetDefectFiltersButton = document.querySelector("[data-reset-defect-filters]");
  var defectFilterControls = Array.prototype.slice.call(document.querySelectorAll("[data-defect-filter]"));
  var defectResultCount = document.querySelector("[data-defect-result-count]");
  var defectRows = Array.prototype.slice.call(document.querySelectorAll(".defect-filter-panel + .dashboard-section tbody tr"));

  if (defectFilterPanel && defectFilterBody && toggleDefectFiltersButton) {
    toggleDefectFiltersButton.addEventListener("click", function () {
      var isCollapsed = defectFilterPanel.classList.toggle("is-collapsed");
      var label = toggleDefectFiltersButton.querySelector("[data-defect-filter-toggle-label]");
      defectFilterBody.hidden = isCollapsed;
      if (label) label.textContent = isCollapsed ? "Expand" : "Collapse";
      toggleDefectFiltersButton.setAttribute("aria-expanded", String(!isCollapsed));
    });
  }

  function getDefectFilterValue(name) {
    var control = document.querySelector('[data-defect-filter="' + name + '"]');
    if (!control) return "";
    var value = control.value.trim();
    if (/^(All|Anyone)/.test(value)) return "";
    return value.toLowerCase();
  }

  function applyDefectFilters() {
    if (!defectRows.length) return;

    var filters = {
      search: getDefectFilterValue("search"),
      project: getDefectFilterValue("project"),
      environment: getDefectFilterValue("environment"),
      status: getDefectFilterValue("status"),
      severity: getDefectFilterValue("severity"),
      priority: getDefectFilterValue("priority"),
      assignedTo: getDefectFilterValue("assignedTo"),
      releaseVersion: getDefectFilterValue("releaseVersion")
    };
    var visibleCount = 0;

    defectRows.forEach(function (row) {
      var cells = row.cells;
      var rowData = {
        search: row.innerText.toLowerCase(),
        project: cells[2].innerText.trim().toLowerCase(),
        environment: cells[3].innerText.trim().toLowerCase(),
        severity: cells[4].innerText.trim().toLowerCase(),
        priority: cells[5].innerText.trim().toLowerCase(),
        status: cells[6].innerText.trim().toLowerCase(),
        assignedTo: cells[7].innerText.trim().toLowerCase(),
        releaseVersion: cells[8].innerText.trim().toLowerCase()
      };
      var isVisible = true;

      Object.keys(filters).forEach(function (key) {
        if (!filters[key]) return;
        if (key === "search") {
          isVisible = isVisible && rowData.search.indexOf(filters[key]) > -1;
          return;
        }
        isVisible = isVisible && rowData[key] === filters[key];
      });

      row.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    if (defectResultCount) {
      defectResultCount.textContent = visibleCount + (visibleCount === 1 ? " matching record" : " matching records");
    }
  }

  if (applyDefectFiltersButton) {
    applyDefectFiltersButton.addEventListener("click", applyDefectFilters);
  }

  if (resetDefectFiltersButton) {
    resetDefectFiltersButton.addEventListener("click", function () {
      defectFilterControls.forEach(function (control) {
        control.selectedIndex = 0;
        control.value = control.tagName === "INPUT" ? "" : control.value;
      });
      applyDefectFilters();
    });
  }

  var fallbackStepsEditor = document.querySelector("[data-steps-editor]");
  var fallbackStepsHtml = document.querySelector("[data-steps-html]");

  if (fallbackStepsEditor && fallbackStepsHtml) {
    function updateFallbackStepsHtml() {
      if (!window.defectStepsEditor) {
        fallbackStepsHtml.value = fallbackStepsEditor.innerHTML;
      }
    }

    function insertFallbackImage(src) {
      var wrapper = document.createElement("div");
      var image = document.createElement("img");
      var handle = document.createElement("span");
      wrapper.className = "resizable-image-node is-selected";
      wrapper.contentEditable = "false";
      image.src = src;
      image.alt = "Pasted reproduction screenshot";
      image.style.width = "420px";
      handle.className = "image-resize-handle";
      wrapper.appendChild(image);
      wrapper.appendChild(handle);
      fallbackStepsEditor.appendChild(wrapper);
      fallbackStepsEditor.appendChild(document.createElement("p"));
      updateFallbackStepsHtml();
    }

    function handleStepsImagePaste(event) {
      var items = event.clipboardData && event.clipboardData.items ? Array.from(event.clipboardData.items) : [];
      var imageItem = items.find(function (item) { return item.type.indexOf("image/") === 0; });
      if (!imageItem) {
        window.setTimeout(updateFallbackStepsHtml, 0);
        return;
      }
      if (window.defectStepsEditor) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      var file = imageItem.getAsFile();
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        if (window.defectStepsEditor) {
          var editorWidth = fallbackStepsEditor.getBoundingClientRect().width - 32;
          window.defectStepsEditor
            .chain()
            .focus()
            .setImage({
              src: reader.result,
              alt: "Pasted reproduction screenshot",
              width: String(Math.max(120, Math.min(520, Math.round(editorWidth || 420))))
            })
            .createParagraphNear()
            .run();
          fallbackStepsHtml.value = window.defectStepsEditor.getHTML();
          return;
        }
        insertFallbackImage(reader.result);
      };
      reader.readAsDataURL(file);
    }

    fallbackStepsEditor.addEventListener("input", updateFallbackStepsHtml);
    fallbackStepsEditor.addEventListener("paste", handleStepsImagePaste, true);
    updateFallbackStepsHtml();
  }

  var workflowEditor = document.querySelector("[data-workflow-editor]");

  if (workflowEditor) {
    var workflowStorageKey = "defectTrackerWorkflowDiagramV4";
    var legacyWorkflowStorageKey = "defectTrackerWorkflowDiagram";
    var workflowCanvas = workflowEditor.querySelector("[data-workflow-canvas]");
    var workflowNodeLayer = workflowEditor.querySelector("[data-workflow-nodes]");
    var workflowEdgeLayer = workflowEditor.querySelector("[data-workflow-edges]");
    var workflowMessage = workflowEditor.querySelector("[data-workflow-message]");
    var workflowDerived = workflowEditor.querySelector("[data-workflow-derived]");
    var workflowSelectionBox = workflowEditor.querySelector("[data-workflow-selection-box]");
    var workflowState = null;
    var selectedWorkflowItem = null;
    var selectedWorkflowNodeIds = [];
    var nodeCounter = 20;
    var edgeCounter = 20;
    var suppressWorkflowCanvasClick = false;
    var suppressWorkflowNodeClick = false;
    var isWorkflowPanMode = false;
    var isWorkflowSpaceDown = false;
    var workflowViewport = { x: 0, y: 0 };
    var workflowZoom = 1;
    var workflowWorkspace = { width: 2600, height: 1600 };
    var workflowHandles = ["top", "right", "bottom", "left"];

    var defaultWorkflow = {
      nodes: [
        { id: "node_1", type: "process", label: "Assigned", position: { x: 265, y: 300 } },
        { id: "node_2", type: "process", label: "InProgress", position: { x: 515, y: 300 } },
        { id: "node_3", type: "process", label: "Fixed", position: { x: 765, y: 300 } },
        { id: "node_4", type: "process", label: "Test", position: { x: 1015, y: 300 } },
        { id: "node_5", type: "process", label: "Closed", position: { x: 1265, y: 300 } },
        { id: "node_6", type: "process", label: "Rejected", position: { x: 515, y: 92 } }
      ],
      edges: [
        { id: "edge_1", source: "node_1", sourceHandle: "right", target: "node_2", targetHandle: "left" },
        { id: "edge_2", source: "node_2", sourceHandle: "right", target: "node_3", targetHandle: "left" },
        { id: "edge_3", source: "node_3", sourceHandle: "right", target: "node_4", targetHandle: "left" },
        { id: "edge_4", source: "node_4", sourceHandle: "right", target: "node_5", targetHandle: "left" },
        { id: "edge_5", source: "node_2", sourceHandle: "top", target: "node_6", targetHandle: "bottom" },
        { id: "edge_6", source: "node_4", sourceHandle: "bottom", target: "node_2", targetHandle: "bottom" }
      ]
    };

    function cloneWorkflow(workflow) {
      return JSON.parse(JSON.stringify(workflow));
    }

    function setWorkflowMessage(text, type) {
      workflowMessage.textContent = text;
      workflowMessage.classList.toggle("is-error", type === "error");
      workflowMessage.classList.toggle("is-success", type === "success");
      workflowMessage.classList.toggle("is-hint", type === "hint");
    }

    function nextNodeId() {
      nodeCounter += 1;
      return "node_" + nodeCounter;
    }

    function nextEdgeId() {
      edgeCounter += 1;
      return "edge_" + edgeCounter;
    }

    function findWorkflowNode(id) {
      return workflowState.nodes.find(function (node) { return node.id === id; });
    }

    function selectWorkflowNodes(nodeIds) {
      selectedWorkflowItem = null;
      selectedWorkflowNodeIds = Array.from(new Set(nodeIds));
      refreshWorkflowSelection();
    }

    function clearWorkflowSelection() {
      selectedWorkflowItem = null;
      selectedWorkflowNodeIds = [];
      refreshWorkflowSelection();
    }

    function getWorkflowNodeBounds(node) {
      var size = getNodeSize(node);
      return {
        left: node.position.x,
        top: node.position.y,
        right: node.position.x + size.width,
        bottom: node.position.y + size.height
      };
    }

    function workflowBoundsIntersect(a, b) {
      return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
    }

    function refreshWorkflowSelection() {
      workflowNodeLayer.querySelectorAll(".workflow-node").forEach(function (element) {
        element.classList.toggle(
          "is-selected",
          selectedWorkflowNodeIds.indexOf(element.dataset.nodeId) > -1
        );
      });
      workflowEdgeLayer.querySelectorAll("path[data-edge-id]").forEach(function (path) {
        path.classList.toggle(
          "is-selected",
          selectedWorkflowItem && selectedWorkflowItem.type === "edge" && selectedWorkflowItem.id === path.dataset.edgeId
        );
      });
    }

    function getCanvasPoint(event) {
      var rect = workflowCanvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left - workflowViewport.x) / workflowZoom,
        y: (event.clientY - rect.top - workflowViewport.y) / workflowZoom
      };
    }

    function getNodeSize(node) {
      return { width: 150, height: 54 };
    }

    function getHandlePoint(nodeId, handleType) {
      var node = findWorkflowNode(nodeId);
      var size = getNodeSize(node);
      var handlePoints = {
        top: { x: node.position.x + size.width / 2, y: node.position.y },
        right: { x: node.position.x + size.width, y: node.position.y + size.height / 2 },
        bottom: { x: node.position.x + size.width / 2, y: node.position.y + size.height },
        left: { x: node.position.x, y: node.position.y + size.height / 2 }
      };
      return handlePoints[handleType] || handlePoints.right;
    }

    function getHandleVector(handleType) {
      var vectors = {
        top: { x: 0, y: -1 },
        right: { x: 1, y: 0 },
        bottom: { x: 0, y: 1 },
        left: { x: -1, y: 0 }
      };
      return vectors[handleType] || vectors.right;
    }

    function buildWorkflowPath(sourcePoint, targetPoint, sourceHandle, targetHandle) {
      var sourceVector = getHandleVector(sourceHandle);
      var targetVector = getHandleVector(targetHandle);
      var sourceInset = 7;
      var targetInset = 14;
      var visibleSourcePoint = {
        x: sourcePoint.x + sourceVector.x * sourceInset,
        y: sourcePoint.y + sourceVector.y * sourceInset
      };
      var visibleTargetPoint = {
        x: targetPoint.x + targetVector.x * targetInset,
        y: targetPoint.y + targetVector.y * targetInset
      };
      var distance = Math.max(52, Math.min(120, Math.hypot(targetPoint.x - sourcePoint.x, targetPoint.y - sourcePoint.y) * 0.25));
      return "M " + visibleSourcePoint.x + " " + visibleSourcePoint.y +
        " C " + (visibleSourcePoint.x + sourceVector.x * distance) + " " + (visibleSourcePoint.y + sourceVector.y * distance) +
        ", " + (visibleTargetPoint.x + targetVector.x * distance) + " " + (visibleTargetPoint.y + targetVector.y * distance) +
        ", " + visibleTargetPoint.x + " " + visibleTargetPoint.y;
    }

    function applyWorkflowViewport() {
      var transform = "translate(" + workflowViewport.x + "px, " + workflowViewport.y + "px) scale(" + workflowZoom + ")";
      workflowEdgeLayer.style.transform = transform;
      workflowNodeLayer.style.transform = transform;
      workflowCanvas.style.backgroundPosition = workflowViewport.x + "px " + workflowViewport.y + "px";
      workflowCanvas.style.backgroundSize = (28 * workflowZoom) + "px " + (28 * workflowZoom) + "px";
    }

    function renderWorkflowEdges(previewTarget) {
      workflowEdgeLayer.querySelectorAll(".workflow-edge-path, .workflow-edge-hit, .workflow-edge-preview").forEach(function (path) {
        path.remove();
      });

      workflowState.edges.forEach(function (edge) {
        if (!findWorkflowNode(edge.source) || !findWorkflowNode(edge.target)) {
          return;
        }

        var hitPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        edge.sourceHandle = edge.sourceHandle || "right";
        edge.targetHandle = edge.targetHandle || "left";
        var pathData = buildWorkflowPath(
          getHandlePoint(edge.source, edge.sourceHandle),
          getHandlePoint(edge.target, edge.targetHandle),
          edge.sourceHandle,
          edge.targetHandle
        );
        hitPath.setAttribute("d", pathData);
        hitPath.dataset.edgeId = edge.id;
        hitPath.classList.add("workflow-edge-hit");
        path.setAttribute("d", pathData);
        path.dataset.edgeId = edge.id;
        path.classList.add("workflow-edge-path");
        if (selectedWorkflowItem && selectedWorkflowItem.type === "edge" && selectedWorkflowItem.id === edge.id) {
          path.classList.add("is-selected");
          hitPath.classList.add("is-selected");
        }

        function selectEdge(event) {
          event.stopPropagation();
          selectedWorkflowItem = { type: "edge", id: edge.id };
          selectedWorkflowNodeIds = [];
          renderWorkflow();
        }

        hitPath.addEventListener("click", selectEdge);
        path.addEventListener("click", selectEdge);
        workflowEdgeLayer.appendChild(hitPath);
        workflowEdgeLayer.appendChild(path);
      });

      if (previewTarget && previewTarget.source) {
        var preview = document.createElementNS("http://www.w3.org/2000/svg", "path");
        preview.setAttribute("d", buildWorkflowPath(
          getHandlePoint(previewTarget.source, previewTarget.sourceHandle),
          previewTarget.target,
          previewTarget.sourceHandle,
          previewTarget.targetHandle || "left"
        ));
        preview.classList.add("workflow-edge-preview");
        workflowEdgeLayer.appendChild(preview);
      }
    }

    function renderWorkflowNodes() {
      workflowNodeLayer.innerHTML = "";

      workflowState.nodes.forEach(function (node) {
        var element = document.createElement("div");
        var label = document.createElement("div");

        element.className = "workflow-node is-" + node.type;
        element.dataset.nodeId = node.id;
        element.style.left = node.position.x + "px";
        element.style.top = node.position.y + "px";
        if (selectedWorkflowNodeIds.indexOf(node.id) > -1) {
          element.classList.add("is-selected");
        }

        var labelText = document.createElement("span");
        var labelType = document.createElement("span");

        label.className = "workflow-node-label";
        labelText.textContent = node.label;
        labelType.className = "workflow-node-type";
        labelType.textContent = node.type;
        label.appendChild(labelText);
        label.appendChild(labelType);
        label.addEventListener("dblclick", function (event) {
          event.stopPropagation();
          startWorkflowInlineEdit(node.id, label);
        });

        workflowHandles.forEach(function (handleName) {
          var handle = document.createElement("span");
          handle.className = "workflow-handle is-" + handleName;
          handle.dataset.handle = handleName;
          handle.title = "Connect from " + handleName;
          handle.addEventListener("pointerdown", function (event) {
            event.preventDefault();
            event.stopPropagation();
            startWorkflowConnection(event, node.id, handleName);
          });
          element.appendChild(handle);
        });

        element.appendChild(label);
        element.addEventListener("pointerdown", function (event) {
          if (event.target.closest(".workflow-handle")) {
            return;
          }
          if (event.target.closest(".workflow-label-input")) {
            return;
          }
          if (event.detail > 1) {
            event.preventDefault();
            event.stopPropagation();
            startWorkflowInlineEdit(node.id, label);
            return;
          }
          event.stopPropagation();
          startWorkflowNodeDrag(event, node.id);
        });
        element.addEventListener("click", function (event) {
          event.stopPropagation();
          if (suppressWorkflowNodeClick) {
            return;
          }
          selectWorkflowNodes([node.id]);
        });
        element.addEventListener("dblclick", function (event) {
          if (event.target.closest(".workflow-handle")) {
            return;
          }
          event.stopPropagation();
          startWorkflowInlineEdit(node.id, label);
        });
        workflowNodeLayer.appendChild(element);
      });
    }

    function renderWorkflow() {
      workflowEdgeLayer.setAttribute("width", workflowWorkspace.width);
      workflowEdgeLayer.setAttribute("height", workflowWorkspace.height);
      applyWorkflowViewport();
      renderWorkflowNodes();
      window.requestAnimationFrame(function () {
        renderWorkflowEdges();
        renderDerivedStatuses();
      });
    }

    function startWorkflowPan(event) {
      if (event.button !== 0 || event.target.closest(".workflow-node") || event.target.closest("[data-edge-id]") || event.target.closest(".workflow-zoom-controls")) {
        return;
      }

      var start = { x: event.clientX, y: event.clientY };
      var startViewport = { x: workflowViewport.x, y: workflowViewport.y };
      var moved = false;

      workflowCanvas.classList.add("is-panning");

      function onPointerMove(moveEvent) {
        moved = true;
        workflowViewport.x = startViewport.x + moveEvent.clientX - start.x;
        workflowViewport.y = startViewport.y + moveEvent.clientY - start.y;
        applyWorkflowViewport();
      }

      function onPointerUp() {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        workflowCanvas.classList.remove("is-panning");
        if (moved) {
          suppressWorkflowCanvasClick = true;
          window.setTimeout(function () {
            suppressWorkflowCanvasClick = false;
          }, 0);
        }
      }

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    }

    function updateWorkflowPanMode() {
      workflowCanvas.classList.toggle("is-pan-mode", isWorkflowPanMode || isWorkflowSpaceDown);
    }

    function drawWorkflowSelectionBox(start, current) {
      var left = Math.min(start.x, current.x);
      var top = Math.min(start.y, current.y);
      var width = Math.abs(current.x - start.x);
      var height = Math.abs(current.y - start.y);
      workflowSelectionBox.style.left = left + "px";
      workflowSelectionBox.style.top = top + "px";
      workflowSelectionBox.style.width = width + "px";
      workflowSelectionBox.style.height = height + "px";
    }

    function getCanvasScreenPoint(event) {
      var rect = workflowCanvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }

    function startWorkflowSelection(event) {
      if (event.button !== 0 || event.target.closest(".workflow-node") || event.target.closest("[data-edge-id]") || event.target.closest(".workflow-zoom-controls")) {
        return;
      }

      var startScreen = getCanvasScreenPoint(event);
      var startWorld = getCanvasPoint(event);
      var moved = false;

      selectedWorkflowItem = null;
      selectedWorkflowNodeIds = [];
      workflowCanvas.classList.add("is-selecting");
      workflowSelectionBox.classList.add("is-visible");
      drawWorkflowSelectionBox(startScreen, startScreen);
      refreshWorkflowSelection();

      function onPointerMove(moveEvent) {
        var currentScreen = getCanvasScreenPoint(moveEvent);
        var currentWorld = getCanvasPoint(moveEvent);
        var selectionDistance = Math.hypot(currentScreen.x - startScreen.x, currentScreen.y - startScreen.y);

        if (selectionDistance > 4) {
          moved = true;
        }

        drawWorkflowSelectionBox(startScreen, currentScreen);

        var selectionBounds = {
          left: Math.min(startWorld.x, currentWorld.x),
          top: Math.min(startWorld.y, currentWorld.y),
          right: Math.max(startWorld.x, currentWorld.x),
          bottom: Math.max(startWorld.y, currentWorld.y)
        };

        selectedWorkflowNodeIds = workflowState.nodes
          .filter(function (node) { return workflowBoundsIntersect(getWorkflowNodeBounds(node), selectionBounds); })
          .map(function (node) { return node.id; });
        refreshWorkflowSelection();
      }

      function onPointerUp() {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        workflowCanvas.classList.remove("is-selecting");
        workflowSelectionBox.classList.remove("is-visible");
        if (!moved) {
          selectedWorkflowNodeIds = [];
          refreshWorkflowSelection();
        }
        suppressWorkflowCanvasClick = true;
        window.setTimeout(function () {
          suppressWorkflowCanvasClick = false;
        }, 0);
      }

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    }

    function startWorkflowCanvasPointerDown(event) {
      if (isWorkflowPanMode || isWorkflowSpaceDown) {
        startWorkflowPan(event);
        return;
      }
      startWorkflowSelection(event);
    }

    function startWorkflowNodeDrag(event, nodeId) {
      var node = findWorkflowNode(nodeId);
      var startPoint = getCanvasPoint(event);
      var selectedNodes = selectedWorkflowNodeIds.indexOf(nodeId) > -1 ? selectedWorkflowNodeIds : [nodeId];
      var startPositions = {};
      var moved = false;

      selectedWorkflowItem = null;
      selectedWorkflowNodeIds = selectedNodes;
      selectedNodes.forEach(function (selectedNodeId) {
        var selectedNode = findWorkflowNode(selectedNodeId);
        if (selectedNode) {
          startPositions[selectedNodeId] = { x: selectedNode.position.x, y: selectedNode.position.y };
        }
      });
      refreshWorkflowSelection();

      function onPointerMove(moveEvent) {
        var point = getCanvasPoint(moveEvent);
        var dx = point.x - startPoint.x;
        var dy = point.y - startPoint.y;
        moved = true;

        selectedNodes.forEach(function (selectedNodeId) {
          var selectedNode = findWorkflowNode(selectedNodeId);
          var selectedStartPosition = startPositions[selectedNodeId];
          if (!selectedNode || !selectedStartPosition) {
            return;
          }
          var size = getNodeSize(selectedNode);
          selectedNode.position.x = Math.max(12, Math.min(workflowWorkspace.width - size.width - 12, selectedStartPosition.x + dx));
          selectedNode.position.y = Math.max(12, Math.min(workflowWorkspace.height - size.height - 12, selectedStartPosition.y + dy));
        });
        renderWorkflowNodes();
        renderWorkflowEdges();
      }

      function onPointerUp() {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        suppressWorkflowCanvasClick = true;
        suppressWorkflowNodeClick = moved;
        window.setTimeout(function () {
          suppressWorkflowCanvasClick = false;
          suppressWorkflowNodeClick = false;
        }, 0);
        if (moved) {
          renderWorkflow();
        }
      }

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    }

    function getNearestHandle(nodeId, point) {
      var sides = workflowHandles.map(function (handleName) {
        var handlePoint = getHandlePoint(nodeId, handleName);
        return {
          handle: handleName,
          distance: Math.hypot(handlePoint.x - point.x, handlePoint.y - point.y)
        };
      });
      sides.sort(function (a, b) { return a.distance - b.distance; });
      return sides[0].handle;
    }

    function startWorkflowConnection(event, sourceId, sourceHandle) {
      var preview = { source: sourceId, sourceHandle: sourceHandle, target: getCanvasPoint(event) };

      selectedWorkflowItem = null;
      selectedWorkflowNodeIds = [];
      renderWorkflowEdges(preview);

      function onPointerMove(moveEvent) {
        preview.target = getCanvasPoint(moveEvent);
        renderWorkflowEdges(preview);
      }

      function onPointerUp(upEvent) {
        var targetElement = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
        var targetHandleElement = targetElement ? targetElement.closest(".workflow-handle") : null;
        var targetNode = targetElement ? targetElement.closest(".workflow-node") : null;
        var targetId = targetNode ? targetNode.dataset.nodeId : "";
        var targetPoint = getCanvasPoint(upEvent);
        var targetHandle = targetHandleElement ? targetHandleElement.dataset.handle : (targetId ? getNearestHandle(targetId, targetPoint) : "");

        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);

        if (targetId && targetId !== sourceId) {
          var exists = workflowState.edges.some(function (edge) {
            return edge.source === sourceId && edge.target === targetId;
          });
          if (!exists) {
            workflowState.edges.push({
              id: nextEdgeId(),
              source: sourceId,
              sourceHandle: sourceHandle,
              target: targetId,
              targetHandle: targetHandle
            });
            setWorkflowMessage("Connection added. Save Workflow to keep it after refresh.", "");
          }
        }
        renderWorkflow();
      }

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    }

    function startWorkflowInlineEdit(nodeId, labelElement) {
      var node = findWorkflowNode(nodeId);
      var originalLabel = node.label;
      var input = document.createElement("input");
      var isCanceled = false;

      input.className = "workflow-label-input";
      input.type = "text";
      input.value = originalLabel;
      labelElement.innerHTML = "";
      labelElement.appendChild(input);
      input.focus();
      input.select();

      function finishEdit() {
        var nextLabel = input.value.trim();
        if (isCanceled) {
          node.label = originalLabel;
          renderWorkflow();
          return;
        }
        if (!nextLabel) {
          node.label = originalLabel;
          renderWorkflow();
          setWorkflowMessage("Node labels cannot be blank.", "error");
          return;
        }
        node.label = nextLabel;
        setWorkflowMessage("Node renamed. Save Workflow to keep the change.", "");
        renderWorkflow();
      }

      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          input.blur();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          isCanceled = true;
          input.blur();
        }
      });

      input.addEventListener("pointerdown", function (event) {
        event.stopPropagation();
      });

      input.addEventListener("blur", finishEdit, { once: true });
    }

    function renameWorkflowNode(nodeId) {
      var nodeElement = workflowNodeLayer.querySelector('[data-node-id="' + nodeId + '"]');
      var labelElement = nodeElement ? nodeElement.querySelector(".workflow-node-label") : null;
      if (!labelElement) {
        setWorkflowMessage("Node labels cannot be blank.", "error");
        return;
      }
      startWorkflowInlineEdit(nodeId, labelElement);
    }

    function deleteSelectedWorkflowItem() {
      if (!selectedWorkflowItem && !selectedWorkflowNodeIds.length) {
        setWorkflowMessage("Select a node or connection first.", "error");
        return;
      }

      if (selectedWorkflowNodeIds.length) {
        var selectedNodeLookup = {};
        selectedWorkflowNodeIds.forEach(function (nodeId) {
          selectedNodeLookup[nodeId] = true;
        });
        workflowState.nodes = workflowState.nodes.filter(function (node) {
          return !selectedNodeLookup[node.id];
        });
        workflowState.edges = workflowState.edges.filter(function (edge) {
          return !selectedNodeLookup[edge.source] && !selectedNodeLookup[edge.target];
        });
      }

      if (selectedWorkflowItem && selectedWorkflowItem.type === "edge") {
        workflowState.edges = workflowState.edges.filter(function (edge) {
          return edge.id !== selectedWorkflowItem.id;
        });
      }

      selectedWorkflowItem = null;
      selectedWorkflowNodeIds = [];
      setWorkflowMessage("Selected item deleted. Save Workflow to keep the change.", "");
      renderWorkflow();
    }

    function addWorkflowNode() {
      var count = workflowState.nodes.length;
      var node = {
        id: nextNodeId(),
        type: "process",
        label: "New Status",
        position: { x: 90 + (count % 4) * 210, y: 110 + Math.floor(count / 4) * 150 }
      };
      workflowState.nodes.push(node);
      selectedWorkflowItem = null;
      selectedWorkflowNodeIds = [node.id];
      setWorkflowMessage("Process node added.", "");
      renderWorkflow();
    }

    function getWorkflowWarnings() {
      var warnings = [];
      var processNodes = workflowState.nodes.filter(function (node) { return node.type === "process"; });
      var labels = {};

      if (!workflowState.nodes.length) {
        warnings.push("Workflow must not be empty.");
      }

      if (!processNodes.length) {
        warnings.push("At least one process node is required.");
      }

      processNodes.forEach(function (node) {
        var label = node.label.trim().toLowerCase();
        if (!label) {
          warnings.push("Process node labels cannot be blank.");
        }
        if (labels[label]) {
          warnings.push("Duplicate process status: " + node.label + ".");
        }
        labels[label] = true;
      });

      workflowState.edges.forEach(function (edge) {
        if (!findWorkflowNode(edge.source) || !findWorkflowNode(edge.target)) {
          warnings.push("A connection has a missing source or target.");
        }
      });

      return warnings;
    }

    function getBlockingWorkflowErrors(warnings) {
      return warnings.filter(function (warning) {
        return warning.indexOf("must not be empty") > -1 ||
          warning.indexOf("At least one process") > -1 ||
          warning.indexOf("cannot be blank") > -1 ||
          warning.indexOf("Duplicate process") > -1 ||
          warning.indexOf("missing source") > -1;
      });
    }

    function saveWorkflow() {
      var warnings = getWorkflowWarnings();
      var blockers = getBlockingWorkflowErrors(warnings);

      if (blockers.length) {
        setWorkflowMessage(blockers[0], "error");
        return;
      }

      window.localStorage.setItem(workflowStorageKey, JSON.stringify(workflowState));
      setWorkflowMessage(warnings.length ? "Saved with warning: " + warnings[0] : "Workflow saved.", "success");
      renderDerivedStatuses();
    }

    function clearWorkflow() {
      workflowState = { nodes: [], edges: [] };
      selectedWorkflowItem = null;
      selectedWorkflowNodeIds = [];
      window.localStorage.removeItem(workflowStorageKey);
      window.localStorage.removeItem(legacyWorkflowStorageKey);
      workflowViewport = { x: 0, y: 0 };
      workflowZoom = 1;
      setWorkflowMessage("Canvas cleared. Add process nodes to build a new workflow.", "");
      renderWorkflow();
    }

    function normalizeWorkflowState() {
      workflowState.nodes = Array.isArray(workflowState.nodes) ? workflowState.nodes.filter(function (node) {
        return node.type === "process";
      }) : [];
      workflowState.edges = Array.isArray(workflowState.edges) ? workflowState.edges : [];
      var allowedNodeIds = {};
      workflowState.nodes.forEach(function (node) {
        allowedNodeIds[node.id] = true;
      });
      workflowState.edges = workflowState.edges.filter(function (edge) {
        return allowedNodeIds[edge.source] && allowedNodeIds[edge.target];
      });
      workflowState.edges.forEach(function (edge) {
        edge.sourceHandle = edge.sourceHandle || "right";
        edge.targetHandle = edge.targetHandle || "left";
      });
      nodeCounter = workflowState.nodes.reduce(function (highest, node) {
        var number = parseInt(String(node.id).replace(/\D/g, ""), 10);
        return Number.isNaN(number) ? highest : Math.max(highest, number);
      }, 20);
      edgeCounter = workflowState.edges.reduce(function (highest, edge) {
        var number = parseInt(String(edge.id).replace(/\D/g, ""), 10);
        return Number.isNaN(number) ? highest : Math.max(highest, number);
      }, 20);
    }

    function loadWorkflow() {
      window.localStorage.removeItem(legacyWorkflowStorageKey);
      var savedWorkflow = window.localStorage.getItem(workflowStorageKey);

      if (savedWorkflow) {
        try {
          workflowState = JSON.parse(savedWorkflow);
          normalizeWorkflowState();
          setWorkflowMessage("Saved workflow restored.", "success");
          return;
        } catch (error) {
          window.localStorage.removeItem(workflowStorageKey);
        }
      }

      workflowState = cloneWorkflow(defaultWorkflow);
      normalizeWorkflowState();
      workflowViewport = { x: 0, y: 0 };
      workflowZoom = 1;
      setWorkflowMessage("Tip: double-click empty canvas to pan.", "hint");
    }

    function setWorkflowZoom(nextZoom) {
      workflowZoom = Math.max(0.65, Math.min(1.35, nextZoom));
      applyWorkflowViewport();
      renderWorkflowEdges();
    }

    function deriveWorkflowTransitions() {
      var nodesById = {};
      var outgoingByNode = {};
      var transitions = {};

      workflowState.nodes.forEach(function (node) {
        nodesById[node.id] = node;
        outgoingByNode[node.id] = [];
      });

      workflowState.edges.forEach(function (edge) {
        if (outgoingByNode[edge.source]) {
          outgoingByNode[edge.source].push(edge.target);
        }
      });

      workflowState.nodes.forEach(function (node) {
        if (node.type !== "process") {
          return;
        }

        var nextStatuses = [];

        outgoingByNode[node.id].forEach(function (targetId) {
          var targetNode = nodesById[targetId];
          if (!targetNode) {
            return;
          }

          if (targetNode.type === "process") {
            nextStatuses.push(targetNode.label);
          }

        });

        transitions[node.label] = Array.from(new Set(nextStatuses));
      });

      return transitions;
    }

    function renderDerivedStatuses() {
      var transitions = deriveWorkflowTransitions();
      workflowDerived.innerHTML = "";
      var label = document.createElement("span");
      label.className = "workflow-derived-label";
      label.textContent = "Allowed transitions";
      workflowDerived.appendChild(label);
      Object.keys(transitions).forEach(function (status) {
        if (!transitions[status].length) {
          var terminalPill = document.createElement("span");
          terminalPill.className = "workflow-derived-pill";
          terminalPill.textContent = status + " -> No next status";
          workflowDerived.appendChild(terminalPill);
          return;
        }
        transitions[status].forEach(function (nextStatus) {
          var pill = document.createElement("span");
          pill.className = "workflow-derived-pill";
          pill.textContent = status + " -> " + nextStatus;
          workflowDerived.appendChild(pill);
        });
      });
    }

    workflowEditor.querySelector("[data-workflow-add-process]").addEventListener("click", function () {
      addWorkflowNode();
    });

    workflowEditor.querySelector("[data-workflow-save]").addEventListener("click", saveWorkflow);
    workflowEditor.querySelector("[data-workflow-clear]").addEventListener("click", clearWorkflow);
    workflowEditor.querySelector("[data-workflow-delete]").addEventListener("click", deleteSelectedWorkflowItem);
    workflowEditor.querySelector("[data-workflow-zoom-in]").addEventListener("click", function (event) {
      event.stopPropagation();
      setWorkflowZoom(workflowZoom + 0.1);
    });
    workflowEditor.querySelector("[data-workflow-zoom-out]").addEventListener("click", function (event) {
      event.stopPropagation();
      setWorkflowZoom(workflowZoom - 0.1);
    });

    workflowCanvas.addEventListener("pointerdown", startWorkflowCanvasPointerDown);

    workflowCanvas.addEventListener("click", function (event) {
      if (suppressWorkflowCanvasClick) {
        return;
      }
      if (event.target === workflowCanvas || event.target === workflowEdgeLayer) {
        clearWorkflowSelection();
      }
    });

    workflowCanvas.addEventListener("dblclick", function (event) {
      if (event.target.closest(".workflow-node") || event.target.closest("[data-edge-id]") || event.target.closest(".workflow-zoom-controls")) {
        return;
      }
      event.preventDefault();
      isWorkflowPanMode = !isWorkflowPanMode;
      updateWorkflowPanMode();
      setWorkflowMessage(isWorkflowPanMode ? "Pan mode. Double-click to select." : "Tip: double-click empty canvas to pan.", isWorkflowPanMode ? "hint" : "hint");
    });

    workflowCanvas.addEventListener("keydown", function (event) {
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelectedWorkflowItem();
      }
    });

    document.addEventListener("keydown", function (event) {
      var activeElement = document.activeElement;
      var isTyping = activeElement && (
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.isContentEditable
      );
      if (event.code === "Space" && isTyping) {
        return;
      }
      if (event.code === "Space" && activeElement !== document.body && !workflowEditor.contains(activeElement)) {
        return;
      }
      if (event.code === "Space" && !event.repeat) {
        event.preventDefault();
        isWorkflowSpaceDown = true;
        updateWorkflowPanMode();
      }
    });

    document.addEventListener("keyup", function (event) {
      if (event.code === "Space") {
        isWorkflowSpaceDown = false;
        updateWorkflowPanMode();
      }
    });

    loadWorkflow();
    renderWorkflow();
  }

  document.querySelectorAll("[data-demo-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var message = form.querySelector("[data-form-message]");
      if (message) {
        message.textContent = "Defect saved for review";
      }
    });
  });
})();
