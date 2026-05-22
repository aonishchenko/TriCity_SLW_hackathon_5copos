(function () {
  const schools = [
    { id: "riverside", name: "Riverside Primary", area: "Alcantara", lat: 38.7035, lng: -9.1782 },
    { id: "jardim", name: "Jardim Central School", area: "Campo Verde", lat: 38.7158, lng: -9.1514 },
    { id: "tagus", name: "Tagus Sports and Arts School", area: "Belem", lat: 38.6974, lng: -9.2056 }
  ];

  const firstNames = [
    "Ines", "Joao", "Ana", "Rui", "Clara", "Marta", "Tiago", "Sofia", "Miguel", "Lara",
    "Paulo", "Leonor", "Andre", "Beatriz", "Nuno", "Diana", "Vasco", "Teresa", "Hugo", "Carla",
    "Pedro", "Rita", "Luis", "Noemi", "Bruno", "Filipa", "Goncalo", "Eva", "Mario", "Sara"
  ];
  const lastNames = ["Costa", "Pereira", "Martins", "Ferreira", "Santos", "Almeida", "Rocha", "Silva", "Melo", "Faria"];
  const closeOffsets = [
    [0.0012, 0.0005], [-0.0014, 0.001], [0.002, -0.0013], [-0.0021, -0.0006], [0.0028, 0.0012],
    [-0.0027, 0.0017], [0.0031, -0.001], [-0.0032, -0.0011], [0.001, -0.0035], [-0.0007, 0.0036]
  ];
  const farOffsets = [
    [0.011, 0.003], [-0.012, 0.005], [0.009, -0.012], [-0.01, -0.011], [0.015, 0.001]
  ];
  const daysByIndex = [[1, 3, 5], [2, 4], [1, 2, 4, 5], [3, 5], [1, 4], [2, 3, 5]];
  const timeWindows = [["07:35", "08:15"], ["07:45", "08:30"], ["08:00", "08:45"], ["07:50", "08:25"]];

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function parentsForSchool(school, schoolIndex) {
    return firstNames.map((firstName, index) => {
      const offset = index < 10 ? closeOffsets[index] : farOffsets[(index - 10) % farOffsets.length].map((value, axis) => value + (index - 10) * (axis ? 0.0005 : 0.0007));
      const initials = `${firstName[0]}${lastNames[(index + schoolIndex) % lastNames.length][0]}`;
      const id = `${school.id}-parent-${pad(index + 1)}`;
      return {
        id,
        name: `${firstName} ${lastNames[(index + schoolIndex) % lastNames.length]}`,
        initials,
        schoolId: school.id,
        address: `${12 + index} ${school.area} School Lane`,
        contact: `+351 91${schoolIndex}${pad(index)} ${pad(130 + index)} ${pad(40 + schoolIndex)}`,
        email: `${firstName.toLowerCase()}.${school.id}${pad(index + 1)}@schoolcircle.test`,
        password: "demo123",
        lat: school.lat + offset[0],
        lng: school.lng + offset[1],
        cluster: index < 10 ? "nearby" : "wider-area",
        completedRoutes: 6 + ((index * 7 + schoolIndex * 11) % 38),
        availability: {
          days: daysByIndex[index % daysByIndex.length],
          from: timeWindows[index % timeWindows.length][0],
          until: timeWindows[index % timeWindows.length][1]
        }
      };
    });
  }

  const parents = schools.flatMap(parentsForSchool);
  const credentials = [
    parents.find((parent) => parent.id === "riverside-parent-01"),
    parents.find((parent) => parent.id === "jardim-parent-02"),
    parents.find((parent) => parent.id === "tagus-parent-03")
  ].map((parent) => ({ name: parent.name, email: parent.email, password: parent.password, schoolId: parent.schoolId }));

  function dateDaysAgo(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function nextWeekday(day) {
    const date = new Date();
    const distance = (day - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + distance);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function request(id, requesterId, leadId, date, status, reason) {
    const lead = parents.find((parent) => parent.id === leadId);
    return {
      id,
      requesterId,
      leadId,
      schoolId: lead.schoolId,
      date,
      from: "07:50",
      until: "08:25",
      status,
      rejectionReason: reason || "",
      createdAt: date,
      chat: [
        { senderId: requesterId, text: "Can you take one child on this walk?", at: "07:12" },
        { senderId: leadId, text: status === "rejected" ? "I need to check the timing." : "I saw the request. Let us confirm details here.", at: "07:18" }
      ]
    };
  }

  const demoRequests = [
    request("req-incoming-1", "riverside-parent-02", "riverside-parent-01", nextWeekday(1), "pending"),
    request("req-incoming-2", "riverside-parent-04", "riverside-parent-01", nextWeekday(2), "pending"),
    request("req-incoming-3", "riverside-parent-05", "riverside-parent-01", nextWeekday(4), "accepted"),
    request("req-out-1", "riverside-parent-01", "riverside-parent-03", nextWeekday(4), "pending"),
    request("req-out-2", "riverside-parent-01", "riverside-parent-06", dateDaysAgo(5), "accepted"),
    request("req-out-3", "riverside-parent-01", "riverside-parent-07", dateDaysAgo(12), "rejected", "Family appointment that morning."),
    request("req-jardim-1", "jardim-parent-02", "jardim-parent-03", dateDaysAgo(3), "accepted"),
    request("req-jardim-2", "jardim-parent-04", "jardim-parent-02", nextWeekday(2), "pending"),
    request("req-tagus-1", "tagus-parent-03", "tagus-parent-01", dateDaysAgo(9), "accepted"),
    request("req-tagus-2", "tagus-parent-05", "tagus-parent-03", nextWeekday(1), "pending")
  ];

  window.SchoolCircleDemo = { schools, parents, credentials, demoRequests };
})();
