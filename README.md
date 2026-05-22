# SchoolParentCircle

SchoolParentCircle is a prototype for a trusted parent network that helps children get to school with nearby adults already heading to the same destination.

It was created for the **Tri-City SLW Hackathon - Crafting Future Cities** by team **5copos**.

## Challenge

The school run creates pressure for families and for the street around the school at the same time.

For parents:

- Bringing minors to and from school takes time every day.
- The trip often competes with work starts, household routines, and care for other children.
- Parents may know other families nearby, but coordinating safe recurring help is fragmented.

For citizens:

- School gates can become concentrated traffic hotspots at fixed times.
- Many individual drop-off trips increase congestion, noise, and stressful street conditions.
- The daily peak repeats around places that should feel safe and calm for children.

## Solution

SchoolParentCircle turns the repeated school commute into a coordinated, trusted circle of parents.

Parents can act in two roles:

- **Requesting Parent**: searches for and books a Route Lead for a child.
- **Route Lead**: publishes availability to bring children to school.

The prototype matches Route Leads by practical trust and route constraints:

- the same associated school,
- proximity to the requesting parent's home,
- the selected day of the current week,
- overlapping availability timeframe.

Once a Route Lead is selected, the Requesting Parent can send a booking request, open chat, and follow the request status.

## Prototype Features

- Sign-up and demo login
- Parent profile with name, school, home location, contact number, and email
- Route Lead availability by day and timeframe
- Search by school, weekday, radius, and departure window
- Route Lead cards with completed route counts
- Booking CTA after Route Lead selection
- Chat threads around requests
- Incoming request inbox for Route Leads
- Accept and reject actions, including a required rejection reason
- Request history with pending, accepted, and rejected statuses

## Demo Data

The app ships with generated browser-side demo data:

- 3 schools
- 30 parents per school
- 10 nearby parents per school inside the demo 1 km cluster
- seeded route requests and chat messages

Demo state is stored in browser `localStorage`.

## Try It

Open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 4173
```

Then visit:

```text
http://127.0.0.1:4173/
```

## Demo Credentials

```text
ines.riverside01@schoolcircle.test
demo123
```

```text
joao.jardim02@schoolcircle.test
demo123
```

```text
ana.tagus03@schoolcircle.test
demo123
```

The sign-in page also includes one-click demo account shortcuts.

## Pages

- `index.html` - sign-up and demo login
- `profile.html` - saved parent profile
- `availability.html` - Route Lead availability, incoming requests, and chat
- `search.html` - Route Lead search and booking
- `requests.html` - active and recent request history

## Current Scope

This is a frontend prototype. It uses generated demo parents and browser-local state instead of a production backend, school verification flow, identity checks, notifications, or real geocoding.
