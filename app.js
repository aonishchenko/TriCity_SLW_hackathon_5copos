const schools = {
  riverside: "Riverside Primary",
  jardim: "Jardim Central School",
  tagus: "Tagus Learning House",
  clube: "Clube Norte Sports School"
};

const routeLeads = [
  {
    id: "ines",
    initials: "IC",
    name: "Ines Costa",
    school: "riverside",
    distance: 0.4,
    availableDays: [1, 2, 4, 5],
    window: ["07:45", "08:25"],
    children: "Leads her own child and 1 guest child",
    start: "Two streets from your start"
  },
  {
    id: "joao",
    initials: "JP",
    name: "Joao Pereira",
    school: "riverside",
    distance: 0.9,
    availableDays: [2, 3, 4],
    window: ["08:00", "08:35"],
    children: "Comfortable with a 3-child group",
    start: "Near the garden crossing"
  },
  {
    id: "ana",
    initials: "AM",
    name: "Ana Martins",
    school: "riverside",
    distance: 1.35,
    availableDays: [1, 5],
    window: ["07:40", "08:15"],
    children: "Route Lead on her commute",
    start: "Across the tram line"
  },
  {
    id: "rui",
    initials: "RF",
    name: "Rui Ferreira",
    school: "jardim",
    distance: 0.7,
    availableDays: [1, 2, 3, 4, 5],
    window: ["07:50", "08:30"],
    children: "Morning walk before work",
    start: "Same neighborhood block"
  },
  {
    id: "clara",
    initials: "CS",
    name: "Clara Santos",
    school: "clube",
    distance: 0.6,
    availableDays: [2, 4, 6],
    window: ["08:15", "09:00"],
    children: "Sports school drop-off",
    start: "By the sports hall path"
  }
];

const profileForm = document.querySelector("#profile-form");
const walkRequestForm = document.querySelector("#walk-request-form");
const homeLocation = document.querySelector("#home-location");
const startingPoint = document.querySelector("#starting-point");
const profileSchool = document.querySelector("#profile-school");
const requestSchool = document.querySelector("#request-school");
const tripDate = document.querySelector("#trip-date");
const radius = document.querySelector("#radius");
const radiusOutput = document.querySelector("#radius-output");
const leadList = document.querySelector("#lead-list");
const matchTitle = document.querySelector("#match-title");
const matchCopy = document.querySelector("#match-copy");
const selectedLead = document.querySelector("#selected-lead strong");
const profileStatus = document.querySelector("#profile-status");
const timeFrom = document.querySelector("#time-from");
const timeUntil = document.querySelector("#time-until");

let selectedLeadId = null;

function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseInputDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getDayName(date) {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function windowsOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  return firstStart <= secondEnd && secondStart <= firstEnd;
}

function checkedAvailability() {
  return [...document.querySelectorAll("#availability-days input:checked")].map((input) => Number(input.value));
}

function formatDays(days) {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days.map((day) => labels[day]).join(", ");
}

function syncDateBounds() {
  const today = new Date();
  const lastDay = new Date(today);
  lastDay.setDate(today.getDate() + 7);
  tripDate.min = formatDateForInput(today);
  tripDate.max = formatDateForInput(lastDay);

  if (!tripDate.value) {
    tripDate.value = formatDateForInput(today);
  }
}

function syncHomeLocation() {
  const value = homeLocation.value.trim();
  profileStatus.textContent = value ? "Profile ready" : "Home required";
  profileStatus.classList.toggle("ready", Boolean(value));

  if (value && startingPoint.value.startsWith("Home:")) {
    startingPoint.value = `Home: ${value}`;
  }
}

function renderMatches() {
  const selectedDate = parseInputDate(tripDate.value);
  const selectedDay = selectedDate.getDay();
  const radiusValue = Number(radius.value);
  const sameSchool = requestSchool.value;
  const validTimeWindow = timeFrom.value <= timeUntil.value;

  const matches = routeLeads.filter((lead) => {
    return (
      lead.school === sameSchool &&
      lead.distance <= radiusValue &&
      lead.availableDays.includes(selectedDay) &&
      validTimeWindow &&
      windowsOverlap(timeFrom.value, timeUntil.value, lead.window[0], lead.window[1])
    );
  });

  if (selectedLeadId && !matches.some((lead) => lead.id === selectedLeadId)) {
    selectedLeadId = null;
    selectedLead.textContent = "None yet";
  }

  matchTitle.textContent = matches.length ? `${matches.length} Route Lead${matches.length === 1 ? "" : "s"} available` : "No Route Leads in this filter";
  matchCopy.textContent = validTimeWindow
    ? `${schools[sameSchool]} on ${getDayName(selectedDate)}, ${timeFrom.value}-${timeUntil.value}, within ${radiusValue} km of the starting point.`
    : "The departure window must end after it starts.";

  leadList.innerHTML = matches.length
    ? matches
        .map(
          (lead) => `
            <article class="lead-card ${selectedLeadId === lead.id ? "selected" : ""}">
              <div class="lead-row">
                <span class="avatar">${lead.initials}</span>
                <div>
                  <h3>${lead.name}</h3>
                  <p>${lead.start}</p>
                </div>
                <strong>${lead.distance} km</strong>
              </div>
              <dl>
                <div><dt>School</dt><dd>${schools[lead.school]}</dd></div>
                <div><dt>Available</dt><dd>${formatDays(lead.availableDays)}</dd></div>
                <div><dt>Time</dt><dd>${lead.window[0]}-${lead.window[1]}</dd></div>
              </dl>
              <p class="capacity">${lead.children}</p>
              <button class="select-button" type="button" data-lead="${lead.id}">
                ${selectedLeadId === lead.id ? "Selected" : "Select Route Lead"}
              </button>
            </article>
          `
        )
        .join("")
    : `
        <article class="empty-state">
          <h3>Try a wider search.</h3>
          <p>Increase the distance, choose another date or time window, or confirm parents are available for this school.</p>
        </article>
      `;
}

function syncRadius() {
  radiusOutput.textContent = `${Number(radius.value)} km`;
}

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  syncHomeLocation();
});

walkRequestForm.addEventListener("submit", (event) => {
  event.preventDefault();
  selectedLeadId = null;
  selectedLead.textContent = "None yet";
  renderMatches();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-lead]");

  if (!button) {
    return;
  }

  selectedLeadId = button.dataset.lead;
  const lead = routeLeads.find((item) => item.id === selectedLeadId);
  selectedLead.textContent = `${lead.name} for ${schools[lead.school]}`;
  renderMatches();
});

homeLocation.addEventListener("input", syncHomeLocation);
profileSchool.addEventListener("input", () => {
  requestSchool.value = profileSchool.value;
  renderMatches();
});

[requestSchool, tripDate, timeFrom, timeUntil].forEach((field) => {
  field.addEventListener("input", renderMatches);
});

radius.addEventListener("input", () => {
  syncRadius();
  renderMatches();
});

document.querySelector("#availability-days").addEventListener("input", () => {
  const days = checkedAvailability();
  profileStatus.title = days.length ? `Route Lead availability: ${formatDays(days)}` : "No Route Lead days selected";
});

syncDateBounds();
syncHomeLocation();
syncRadius();
renderMatches();
