(function () {
  const demo = window.SchoolCircleDemo;
  const storageKey = "school-circle-demo-v3";
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let state = loadState();
  let selectedLeadId = "";
  let activeChatId = "";
  let historyFilter = "all";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function initialState() {
    return {
      currentUserId: "",
      customParents: [],
      profileOverrides: {},
      availability: {},
      requests: clone(demo.demoRequests)
    };
  }

  function loadState() {
    try {
      return { ...initialState(), ...JSON.parse(localStorage.getItem(storageKey) || "{}") };
    } catch (error) {
      return initialState();
    }
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function dateValue(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function readableDate(value) {
    return parseDate(value).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  function schoolById(id) {
    return demo.schools.find((school) => school.id === id);
  }

  function allParents() {
    return [...demo.parents, ...state.customParents].map((parent) => {
      const override = state.profileOverrides[parent.id] || {};
      const availability = state.availability[parent.id] || override.availability || parent.availability;
      return { ...parent, ...override, availability };
    });
  }

  function parentById(id) {
    return allParents().find((parent) => parent.id === id);
  }

  function currentUser() {
    return parentById(state.currentUserId);
  }

  function ensureUser() {
    if (!currentUser()) {
      window.location.href = "./index.html";
      return false;
    }
    return true;
  }

  function schoolOptions(selectedId) {
    return demo.schools
      .map((school) => `<option value="${school.id}" ${school.id === selectedId ? "selected" : ""}>${school.name}</option>`)
      .join("");
  }

  function initials(name) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function renderHeader(activePage) {
    const header = document.querySelector("#app-header");
    const user = currentUser();

    if (!header || !user) {
      return;
    }

    const nav = [
      ["profile", "Profile", "./profile.html"],
      ["availability", "Availability", "./availability.html"],
      ["search", "Search Leads", "./search.html"],
      ["requests", "Requests", "./requests.html"]
    ];

    header.className = "app-header";
    header.innerHTML = `
      <div class="header-inner">
        <a class="brand" href="./profile.html" aria-label="School Circle profile">
          <span class="brand-mark" aria-hidden="true"></span>
          <span><strong>School Circle</strong><small>${escapeHtml(schoolById(user.schoolId).name)}</small></span>
        </a>
        <nav class="main-nav" aria-label="App pages">
          ${nav.map(([page, label, href]) => `<a class="${page === activePage ? "active" : ""}" href="${href}">${label}</a>`).join("")}
        </nav>
        <div class="user-chip">
          <span class="avatar">${escapeHtml(user.initials || initials(user.name))}</span>
          <strong>${escapeHtml(user.name)}</strong>
          <button class="text-button" type="button" id="logout-button">Log out</button>
        </div>
      </div>
    `;
    document.querySelector("#logout-button").addEventListener("click", () => {
      state.currentUserId = "";
      saveState();
      window.location.href = "./index.html";
    });
  }

  function distanceKm(first, second) {
    const radius = 6371;
    const lat = ((second.lat - first.lat) * Math.PI) / 180;
    const lng = ((second.lng - first.lng) * Math.PI) / 180;
    const a =
      Math.sin(lat / 2) ** 2 +
      Math.cos((first.lat * Math.PI) / 180) * Math.cos((second.lat * Math.PI) / 180) * Math.sin(lng / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function windowsOverlap(firstFrom, firstUntil, secondFrom, secondUntil) {
    return firstFrom <= secondUntil && secondFrom <= firstUntil;
  }

  function statusBadge(status) {
    return `<span class="status status-${status}">${status}</span>`;
  }

  function timeStamp() {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  function renderChat(container, requestId) {
    const request = state.requests.find((item) => item.id === requestId);
    const user = currentUser();

    if (!container) {
      return;
    }

    if (!request) {
      container.innerHTML = `<div class="empty-state compact"><h3>Chat opens with a request.</h3><p>Book a Lead or open an incoming request.</p></div>`;
      return;
    }

    const otherId = request.requesterId === user.id ? request.leadId : request.requesterId;
    const other = parentById(otherId);
    container.innerHTML = `
      <div class="section-head chat-head">
        <div>
          <p class="eyebrow">Chat</p>
          <h3>${escapeHtml(other.name)}</h3>
        </div>
        ${statusBadge(request.status)}
      </div>
      <div class="message-list">
        ${request.chat
          .map((message) => {
            const mine = message.senderId === user.id;
            return `<article class="message ${mine ? "mine" : ""}"><p>${escapeHtml(message.text)}</p><span>${mine ? "You" : escapeHtml(parentById(message.senderId).name)} · ${escapeHtml(message.at)}</span></article>`;
          })
          .join("")}
      </div>
      <form class="chat-form" data-chat-form="${request.id}">
        <input required name="message" placeholder="Write a message" aria-label="Chat message" />
        <button class="secondary-button" type="submit">Send</button>
      </form>
    `;
  }

  function listenForChat(container, rerender) {
    container.addEventListener("submit", (event) => {
      const form = event.target.closest("[data-chat-form]");
      if (!form) {
        return;
      }
      event.preventDefault();
      const input = form.elements.message;
      const request = state.requests.find((item) => item.id === form.dataset.chatForm);
      request.chat.push({ senderId: currentUser().id, text: input.value.trim(), at: timeStamp() });
      saveState();
      rerender();
    });
  }

  function initSignup() {
    document.querySelector("#signup-school").innerHTML = schoolOptions("riverside");
    document.querySelector("#credential-list").innerHTML = demo.credentials
      .map((item) => {
        const school = schoolById(item.schoolId);
        return `
          <article class="credential-row">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(school.name)}</span>
            <code>${escapeHtml(item.email)}</code>
            <code>${escapeHtml(item.password)}</code>
            <button class="secondary-button" type="button" data-demo-login="${escapeHtml(item.email)}">Use demo</button>
          </article>
        `;
      })
      .join("");

    document.querySelector("#credential-list").addEventListener("click", (event) => {
      const button = event.target.closest("[data-demo-login]");
      if (!button) {
        return;
      }
      const user = allParents().find((parent) => parent.email === button.dataset.demoLogin);
      state.currentUserId = user.id;
      saveState();
      window.location.href = "./profile.html";
    });

    document.querySelector("#signup-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const school = schoolById(document.querySelector("#signup-school").value);
      const customParent = {
        id: `custom-${Date.now()}`,
        name: document.querySelector("#signup-name").value.trim(),
        initials: initials(document.querySelector("#signup-name").value.trim()),
        schoolId: school.id,
        address: document.querySelector("#signup-location").value.trim(),
        contact: document.querySelector("#signup-contact").value.trim(),
        email: document.querySelector("#signup-email").value.trim().toLowerCase(),
        password: document.querySelector("#signup-password").value,
        lat: school.lat + 0.001,
        lng: school.lng - 0.001,
        cluster: "nearby",
        availability: { days: [1, 3, 5], from: "07:45", until: "08:30" }
      };
      state.customParents.push(customParent);
      state.currentUserId = customParent.id;
      saveState();
      window.location.href = "./profile.html";
    });

    document.querySelector("#login-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const email = document.querySelector("#login-email").value.trim().toLowerCase();
      const password = document.querySelector("#login-password").value;
      const user = allParents().find((parent) => parent.email.toLowerCase() === email && parent.password === password);
      const error = document.querySelector("#login-error");
      if (!user) {
        error.textContent = "Demo credentials do not match.";
        return;
      }
      error.textContent = "";
      state.currentUserId = user.id;
      saveState();
      window.location.href = "./profile.html";
    });
  }

  function initProfile() {
    if (!ensureUser()) return;
    renderHeader("profile");
    const user = currentUser();
    const fields = {
      name: document.querySelector("#profile-name"),
      school: document.querySelector("#profile-school"),
      address: document.querySelector("#profile-location"),
      contact: document.querySelector("#profile-contact"),
      email: document.querySelector("#profile-email")
    };
    fields.school.innerHTML = schoolOptions(user.schoolId);
    fields.name.value = user.name;
    fields.address.value = user.address;
    fields.contact.value = user.contact;
    fields.email.value = user.email;

    const nearbyCount = allParents().filter((parent) => parent.id !== user.id && parent.schoolId === user.schoolId && distanceKm(user, parent) <= 1).length;
    const leadSlots = user.availability.days.length;
    document.querySelector("#profile-facts").innerHTML = `
      <div><dt>School</dt><dd>${escapeHtml(schoolById(user.schoolId).name)}</dd></div>
      <div><dt>Nearby parents</dt><dd>${nearbyCount} within 1 km</dd></div>
      <div><dt>Lead days</dt><dd>${leadSlots} published</dd></div>
      <div><dt>Contact</dt><dd>${escapeHtml(user.contact)}</dd></div>
    `;

    document.querySelector("#profile-form").addEventListener("submit", (event) => {
      event.preventDefault();
      state.profileOverrides[user.id] = {
        ...(state.profileOverrides[user.id] || {}),
        name: fields.name.value.trim(),
        initials: initials(fields.name.value.trim()),
        schoolId: fields.school.value,
        address: fields.address.value.trim(),
        contact: fields.contact.value.trim(),
        email: fields.email.value.trim()
      };
      saveState();
      document.querySelector("#profile-saved").textContent = "Profile saved for this demo browser.";
      renderHeader("profile");
    });
  }

  function dayCheckboxes(selectedDays) {
    return [1, 2, 3, 4, 5, 6, 0]
      .map((day) => `<label><input type="checkbox" value="${day}" ${selectedDays.includes(day) ? "checked" : ""} /> ${dayLabels[day]}</label>`)
      .join("");
  }

  function incomingRequests() {
    return state.requests
      .filter((request) => request.leadId === currentUser().id)
      .sort((first, second) => second.date.localeCompare(first.date));
  }

  function requestCard(request, mode) {
    const other = parentById(mode === "incoming" ? request.requesterId : request.leadId);
    const school = schoolById(request.schoolId);
    return `
      <article class="request-card">
        <div class="request-meta">
          <span class="avatar">${escapeHtml(other.initials || initials(other.name))}</span>
          <div>
            <h3>${escapeHtml(other.name)}</h3>
            <p>${escapeHtml(school.name)} · ${readableDate(request.date)} · ${request.from}-${request.until}</p>
          </div>
          ${statusBadge(request.status)}
        </div>
        ${request.rejectionReason ? `<p class="reason">Reason: ${escapeHtml(request.rejectionReason)}</p>` : ""}
        ${
          mode === "incoming" && request.status === "pending"
            ? `
              <div class="action-row">
                <button class="primary-button" type="button" data-accept="${request.id}">Accept</button>
                <form class="reject-form" data-reject="${request.id}">
                  <input required name="reason" placeholder="Reason for rejection" aria-label="Reason for rejection" />
                  <button class="secondary-button" type="submit">Reject</button>
                </form>
              </div>
            `
            : ""
        }
        <button class="text-link" type="button" data-open-chat="${request.id}">Open chat</button>
      </article>
    `;
  }

  function initAvailability() {
    if (!ensureUser()) return;
    renderHeader("availability");
    const user = currentUser();
    document.querySelector("#availability-days").innerHTML = dayCheckboxes(user.availability.days);
    document.querySelector("#availability-from").value = user.availability.from;
    document.querySelector("#availability-until").value = user.availability.until;

    function renderInbox() {
      const items = incomingRequests();
      document.querySelector("#incoming-count").textContent = `${items.length} requests`;
      document.querySelector("#incoming-requests").innerHTML = items.length
        ? items.map((request) => requestCard(request, "incoming")).join("")
        : `<div class="empty-state compact"><h3>No requests yet.</h3><p>Nearby parents will appear here after booking your slots.</p></div>`;
      renderChat(document.querySelector("#availability-chat"), activeChatId);
    }

    document.querySelector("#availability-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const days = [...document.querySelectorAll("#availability-days input:checked")].map((input) => Number(input.value));
      state.availability[user.id] = {
        days,
        from: document.querySelector("#availability-from").value,
        until: document.querySelector("#availability-until").value
      };
      saveState();
      document.querySelector("#availability-saved").textContent = "Availability saved for Route Lead search.";
    });

    document.querySelector("#incoming-requests").addEventListener("click", (event) => {
      const accept = event.target.closest("[data-accept]");
      const chat = event.target.closest("[data-open-chat]");
      if (accept) {
        const request = state.requests.find((item) => item.id === accept.dataset.accept);
        request.status = "accepted";
        request.rejectionReason = "";
        saveState();
        activeChatId = request.id;
        renderInbox();
      }
      if (chat) {
        activeChatId = chat.dataset.openChat;
        renderInbox();
      }
    });

    document.querySelector("#incoming-requests").addEventListener("submit", (event) => {
      const reject = event.target.closest("[data-reject]");
      if (!reject) return;
      event.preventDefault();
      const request = state.requests.find((item) => item.id === reject.dataset.reject);
      request.status = "rejected";
      request.rejectionReason = reject.elements.reason.value.trim();
      saveState();
      activeChatId = request.id;
      renderInbox();
    });
    listenForChat(document.querySelector("#availability-chat"), renderInbox);
    activeChatId = incomingRequests()[0]?.id || "";
    renderInbox();
  }

  function weekDates() {
    const today = new Date();
    const monday = new Date(today);
    const dayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay();
    monday.setDate(today.getDate() + dayOffset);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  }

  function matchingLeads(filters) {
    const user = currentUser();
    const targetDate = parseDate(filters.date);
    return allParents()
      .filter((lead) => {
        const distance = distanceKm(user, lead);
        return (
          lead.id !== user.id &&
          lead.schoolId === filters.schoolId &&
          distance <= filters.radius &&
          lead.availability.days.includes(targetDate.getDay()) &&
          windowsOverlap(filters.from, filters.until, lead.availability.from, lead.availability.until)
        );
      })
      .map((lead) => ({ lead, distance: distanceKm(user, lead) }))
      .sort((first, second) => first.distance - second.distance);
  }

  function initSearch() {
    if (!ensureUser()) return;
    renderHeader("search");
    const user = currentUser();
    document.querySelector("#search-school").innerHTML = schoolOptions(user.schoolId);
    const dates = weekDates();
    const today = dateValue(new Date());
    document.querySelector("#search-date").innerHTML = dates
      .map((date) => `<option value="${dateValue(date)}" ${dateValue(date) === today ? "selected" : ""}>${readableDate(dateValue(date))}</option>`)
      .join("");

    function filters() {
      return {
        schoolId: document.querySelector("#search-school").value,
        date: document.querySelector("#search-date").value,
        from: document.querySelector("#search-from").value,
        until: document.querySelector("#search-until").value,
        radius: Number(document.querySelector("#search-radius").value)
      };
    }

    function renderSearch() {
      const activeFilters = filters();
      const results = activeFilters.from <= activeFilters.until ? matchingLeads(activeFilters) : [];
      document.querySelector("#search-radius-output").textContent = `${activeFilters.radius} km`;
      document.querySelector("#search-summary").textContent =
        activeFilters.from <= activeFilters.until
          ? `${results.length} Route Lead${results.length === 1 ? "" : "s"} for ${readableDate(activeFilters.date)}`
          : "Fix the timeframe";

      if (selectedLeadId && !results.some((item) => item.lead.id === selectedLeadId)) {
        selectedLeadId = "";
        document.querySelector("#book-lead").disabled = true;
      }

      document.querySelector("#lead-selection").textContent = selectedLeadId
        ? `${parentById(selectedLeadId).name} selected`
        : "Select a Route Lead";
      document.querySelector("#booking-copy").textContent = selectedLeadId
        ? `Book ${parentById(selectedLeadId).name} for ${schoolById(activeFilters.schoolId).name}. The request starts as pending.`
        : "Select a Route Lead to create a pending request and open chat.";
      document.querySelector("#search-results").innerHTML = results.length
        ? results
            .map(({ lead, distance }) => `
              <article class="lead-card ${selectedLeadId === lead.id ? "selected" : ""}">
                <div class="request-meta">
                  <span class="avatar">${escapeHtml(lead.initials)}</span>
                  <div>
                    <h3>${escapeHtml(lead.name)}</h3>
                    <p>${distance.toFixed(2)} km from your home · ${escapeHtml(lead.contact)}</p>
                  </div>
                </div>
                <dl class="detail-list">
                  <div><dt>School</dt><dd>${escapeHtml(schoolById(lead.schoolId).name)}</dd></div>
                  <div><dt>Lead days</dt><dd>${lead.availability.days.map((day) => dayLabels[day]).join(", ")}</dd></div>
                  <div><dt>Timeframe</dt><dd>${lead.availability.from}-${lead.availability.until}</dd></div>
                  <div><dt>Completed routes</dt><dd>${lead.completedRoutes}</dd></div>
                </dl>
                <button class="secondary-button" type="button" data-select-lead="${lead.id}">${selectedLeadId === lead.id ? "Selected" : "Select Lead"}</button>
              </article>
            `)
            .join("")
        : `<div class="empty-state"><h3>No Leads in this filter.</h3><p>Try a wider radius, another weekday, or a broader timeframe.</p></div>`;
      renderChat(document.querySelector("#search-chat"), activeChatId);
    }

    document.querySelector("#search-form").addEventListener("submit", (event) => {
      event.preventDefault();
      renderSearch();
    });
    ["#search-school", "#search-date", "#search-from", "#search-until", "#search-radius"].forEach((selector) => {
      document.querySelector(selector).addEventListener("input", renderSearch);
    });
    document.querySelector("#search-results").addEventListener("click", (event) => {
      const button = event.target.closest("[data-select-lead]");
      if (!button) return;
      selectedLeadId = button.dataset.selectLead;
      document.querySelector("#book-lead").disabled = false;
      renderSearch();
    });
    document.querySelector("#book-lead").addEventListener("click", () => {
      if (!selectedLeadId) return;
      const activeFilters = filters();
      const request = {
        id: `req-booked-${Date.now()}`,
        requesterId: user.id,
        leadId: selectedLeadId,
        schoolId: activeFilters.schoolId,
        date: activeFilters.date,
        from: activeFilters.from,
        until: activeFilters.until,
        status: "pending",
        rejectionReason: "",
        createdAt: dateValue(new Date()),
        chat: [{ senderId: user.id, text: "Hi, I would like to book this Route Lead slot.", at: timeStamp() }]
      };
      state.requests.unshift(request);
      saveState();
      activeChatId = request.id;
      document.querySelector("#booking-copy").textContent = "Booking request sent. Use chat while the Route Lead reviews it.";
      renderSearch();
    });
    listenForChat(document.querySelector("#search-chat"), renderSearch);
    renderSearch();
  }

  function requestHistory() {
    const user = currentUser();
    return state.requests
      .filter((request) => request.requesterId === user.id || request.leadId === user.id)
      .filter((request) => historyFilter === "all" || request.status === historyFilter)
      .sort((first, second) => second.date.localeCompare(first.date));
  }

  function initRequests() {
    if (!ensureUser()) return;
    renderHeader("requests");

    function renderHistory() {
      const rows = requestHistory();
      document.querySelector("#request-history").innerHTML = rows.length
        ? rows
            .map((request) => {
              const userIsLead = request.leadId === currentUser().id;
              const other = parentById(userIsLead ? request.requesterId : request.leadId);
              return `
                <article class="history-row">
                  <div>
                    <p class="eyebrow">${userIsLead ? "As Route Lead" : "As Requesting Parent"}</p>
                    <h3>${escapeHtml(other.name)}</h3>
                  </div>
                  <div><dt>Date</dt><dd>${readableDate(request.date)}</dd></div>
                  <div><dt>School</dt><dd>${escapeHtml(schoolById(request.schoolId).name)}</dd></div>
                  <div><dt>Time</dt><dd>${request.from}-${request.until}</dd></div>
                  <div>${statusBadge(request.status)}${request.rejectionReason ? `<p>${escapeHtml(request.rejectionReason)}</p>` : ""}</div>
                </article>
              `;
            })
            .join("")
        : `<div class="empty-state"><h3>No matching requests.</h3><p>Change the status filter or book a Route Lead from Search.</p></div>`;
    }

    document.querySelector(".history-tabs").addEventListener("click", (event) => {
      const button = event.target.closest("[data-history]");
      if (!button) return;
      historyFilter = button.dataset.history;
      document.querySelectorAll("[data-history]").forEach((item) => item.classList.toggle("active", item === button));
      renderHistory();
    });
    renderHistory();
  }

  const page = document.body.dataset.page;
  if (page === "signup") initSignup();
  if (page === "profile") initProfile();
  if (page === "availability") initAvailability();
  if (page === "search") initSearch();
  if (page === "requests") initRequests();
})();
