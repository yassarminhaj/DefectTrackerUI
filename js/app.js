(function () {
  var current = window.location.pathname.split("/").pop() || "dashboard.html";
  var navTarget = current;

  if (current === "index.html") {
    navTarget = "dashboard.html";
  }

  if (current === "defect_detail.html") {
    navTarget = "defect_list.html";
  }

  document.querySelectorAll("[data-nav]").forEach(function (link) {
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

  if (reportTableBody && reportChartGrid && reportChartModal && window.Chart) {
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
    var reportFilters = Array.prototype.slice.call(document.querySelectorAll("[data-report-filter]"));
    var reportResultCount = document.querySelector("[data-report-result-count]");
    var resetReportButton = document.querySelector("[data-dashboard-reset]");
    var exportReportButton = document.querySelector("[data-dashboard-export]");
    var openReportChartModalButton = document.querySelector("[data-open-report-chart-modal]");
    var closeReportChartModalButtons = Array.prototype.slice.call(reportChartModal.querySelectorAll("[data-close-report-chart-modal]"));
    var saveReportChartButton = reportChartModal.querySelector("[data-save-report-chart]");
    var reportChartTitleInput = reportChartModal.querySelector("[data-report-chart-title]");
    var reportChartTypeInput = reportChartModal.querySelector("[data-report-chart-type]");
    var reportChartGroupInput = reportChartModal.querySelector("[data-report-chart-group]");
    var reportChartInstances = {};
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

    Chart.defaults.font.family = '"Book Antiqua", Palatino, serif';
    Chart.defaults.color = "#303635";
    Chart.defaults.borderColor = "rgba(48, 54, 53, .18)";

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
          var searchable = [record.id, record.title, record.project, record.environment, record.status, record.severity, record.priority, record.assignedTo, record.releaseVersion].join(" ").toLowerCase();
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
      setKpiNote("total", rows.length === reportRecords.length ? "All sample defects" : "Filtered view");
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

    function renderReportChart(card, config, rows) {
      var canvas = card.querySelector("canvas");
      var meta = card.querySelector("[data-chart-meta]");
      var chartId = card.getAttribute("data-chart-instance-id") || card.getAttribute("data-chart-id") || ("chart-" + Date.now());
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
        var id = card.getAttribute("data-chart-id");
        var config = id === "trend" ? { type: "line", groupBy: "createdMonth" } :
          id === "aging" ? { type: "bar", groupBy: "aging" } :
          id === "releaseVersion" ? { type: "horizontal", groupBy: "releaseVersion" } :
          id === "environment" ? { type: "doughnut", groupBy: "environment" } :
          id === "severity" ? { type: "bar", groupBy: "severity" } :
          id === "status" ? { type: "doughnut", groupBy: "status" } :
          JSON.parse(card.getAttribute("data-chart-config") || "{}");
        renderReportChart(card, config, rows);
      });
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
        appendReportCell(row, record.createdDate);
        appendReportCell(row, record.age + "d");
        reportTableBody.appendChild(row);
      });

      if (!rows.length) {
        var emptyRow = document.createElement("tr");
        var emptyCell = document.createElement("td");
        emptyCell.colSpan = 11;
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

    function resetReportFilters() {
      reportFilters.forEach(function (control) {
        control.value = "";
      });
      refreshReportDashboard();
    }

    function exportReportCsv() {
      var rows = getFilteredReportRecords();
      var columns = ["id", "title", "project", "environment", "severity", "priority", "status", "assignedTo", "releaseVersion", "createdDate", "age"];
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
      card.innerHTML = '<div class="chart-title-row"><div><h3></h3><p class="chart-meta" data-chart-meta>All defects</p></div><div class="chart-actions"><button type="button" data-remove-report-chart>Remove</button></div></div><div class="canvas-wrap"><canvas></canvas></div>';
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

    if (resetReportButton) resetReportButton.addEventListener("click", resetReportFilters);
    if (exportReportButton) exportReportButton.addEventListener("click", exportReportCsv);
    if (openReportChartModalButton) openReportChartModalButton.addEventListener("click", openReportChartModal);
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

      var badgeClass = status === "Active" ? "badge-active" : "badge-inactive";
      var row = document.createElement("tr");
      var nameCell = document.createElement("td");
      var descriptionCell = document.createElement("td");
      var statusCell = document.createElement("td");
      var actionsCell = document.createElement("td");
      var badge = document.createElement("span");
      var editButton = document.createElement("button");

      nameCell.textContent = name;
      descriptionCell.textContent = description || "No description added.";
      badge.className = "badge " + badgeClass;
      badge.textContent = status;
      editButton.type = "button";
      editButton.textContent = "Edit";

      statusCell.appendChild(badge);
      actionsCell.appendChild(editButton);
      row.appendChild(nameCell);
      row.appendChild(descriptionCell);
      row.appendChild(statusCell);
      row.appendChild(actionsCell);

      projectTableBody.insertBefore(row, addProjectRow.nextSibling);
      resetProjectRow();
      setProjectRowVisible(false);
    });
  }

  document.querySelectorAll("[data-demo-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var message = form.querySelector("[data-form-message]");
      if (message) {
        message.textContent = "Sample UI only - no data was submitted.";
      }
    });
  });
})();
