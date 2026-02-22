import { API_BASE_URL } from "./backendCompatibility";

function toDateString(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function toTimeString(value) {
  if (!value) return "";
  const raw = String(value);
  const match = raw.match(/(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

async function parseApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (typeof body === "object" && body?.error) ||
      (typeof body === "object" && body?.message) ||
      (typeof body === "string" && body) ||
      `Request failed with status ${response.status}`;
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return body;
}

export function normalizeEventFromApi(event) {
  return {
    id: event.id,
    title: event.title || "",
    description: event.description || "",
    location: event.location || "",
    date: toDateString(event.eventDate),
    time: toTimeString(event.eventTime),
    category: event.category?.name || "General",
    maxAttendees: event.maxAttendees ?? "",
    attendees: Array.isArray(event.registrations)
      ? event.registrations.map((registration) => ({
          name: registration?.user?.name || "Unknown User",
          status: registration?.status || "going",
        }))
      : [],
    createdBy: event.creator?.name || "",
    createdByRole: event.creator?.role || "user",
    creatorId: event.creatorId || event.creator?.id || null,
  };
}

export async function fetchEventsFromApi() {
  const payload = await parseApiResponse(
    await fetch(`${API_BASE_URL}/events`, {
      method: "GET",
      headers: { Accept: "application/json, text/plain" },
    })
  );

  const events = Array.isArray(payload?.data) ? payload.data : [];
  return events.map(normalizeEventFromApi);
}

export async function createEventInApi({
  title,
  description,
  location,
  date,
  time,
  category,
  maxAttendees,
  creatorId,
}) {
  const body = {
    title: String(title || "").trim(),
    description: String(description || "").trim(),
    location: String(location || "").trim(),
    eventDate: date,
    eventTime: time,
    category: String(category || "").trim(),
    creatorId,
    maxAttendees: maxAttendees === "" ? null : Number(maxAttendees),
  };

  return parseApiResponse(
    await fetch(`${API_BASE_URL}/events/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

export async function updateEventInApi({
  id,
  creatorId,
  requesterRole,
  title,
  description,
  location,
  date,
  time,
  category,
  maxAttendees,
}) {
  const body = {
    id,
    creatorId,
    requesterRole,
    title: String(title || "").trim(),
    description: String(description || "").trim(),
    location: String(location || "").trim(),
    eventDate: date,
    eventTime: time,
    category: String(category || "").trim(),
    maxAttendees: maxAttendees === "" ? null : Number(maxAttendees),
  };

  return parseApiResponse(
    await fetch(`${API_BASE_URL}/events/editEvent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

export async function deleteEventInApi({ id, creatorId, requesterRole }) {
  return parseApiResponse(
    await fetch(`${API_BASE_URL}/events/deleteEvent`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, creatorId, requesterRole }),
    })
  );
}

export async function upsertRsvpInApi({ userId, eventId, status }) {
  return parseApiResponse(
    await fetch(`${API_BASE_URL}/registrations/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, eventId, status }),
    })
  );
}
