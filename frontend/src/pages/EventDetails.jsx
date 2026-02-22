import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

function EventDetails({ events, currentUser, userRole }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = events.find((e) => e.id === parseInt(id));
  const [attendeeFilter, setAttendeeFilter] = useState("all");

  // Helper to normalize attendee data (backward compatibility)
  const normalizeAttendee = (attendee) => {
    if (typeof attendee === "string") {
      return { name: attendee, status: "going" };
    }
    return {
      name: attendee?.name || "Unknown User",
      status: attendee?.status || "going",
    };
  };

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="surface-card gradient-border rounded-xl shadow-md p-8 text-center">
          <div className="bg-red-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Event Not Found</h2>
          <p className="text-gray-500 mb-6">The event you're looking for doesn't exist or has been deleted.</p>
          <Link to="/">
            <button className="btn-gradient px-6 py-2.5 rounded-lg font-medium transition-all">
              Back to Events
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const creatorRole = event.createdByRole || (String(event.createdBy || "").toLowerCase() === "admin" ? "admin" : "user");
  const isAdminCreatedEvent = creatorRole === "admin";
  const canViewAttendeeList = userRole === "admin" || !isAdminCreatedEvent;
  const canEdit = userRole === "admin" || event.createdBy === currentUser;

  const allAttendees = (event.attendees || []).map(normalizeAttendee);
  const visibleAttendees =
    userRole === "admin" ? allAttendees : allAttendees.filter((a) => a.status !== "notgoing");
  const filteredAttendees = (
    attendeeFilter === "all"
      ? visibleAttendees
      : visibleAttendees.filter((a) => a.status === attendeeFilter)
  ).sort((a, b) => a.name.localeCompare(b.name));

  const userStatus = visibleAttendees.find((a) => a.name === currentUser)?.status || null;

  // Capacity should exclude users marked "notgoing".
  const attendeeCount = allAttendees.filter((a) => a.status !== "notgoing").length;
  const notGoingCount = allAttendees.filter((a) => a.status === "notgoing").length;
  const maxAttendees = event.maxAttendees;
  const hasCapacityLimit = maxAttendees && maxAttendees > 0;
  const spotsLeft = hasCapacityLimit ? maxAttendees - attendeeCount : null;
  const isFull = hasCapacityLimit && spotsLeft <= 0;

  const getCategoryColor = (cat) => {
    const colors = {
      Technology: "bg-blue-100 text-blue-800",
      Sports: "bg-green-100 text-green-800",
      Music: "bg-purple-100 text-purple-800",
      Art: "bg-pink-100 text-pink-800",
      Business: "bg-yellow-100 text-yellow-800",
      Default: "bg-gray-100 text-gray-800"
    };
    return colors[cat] || colors.Default;
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="surface-card gradient-border rounded-xl shadow-md overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-500 via-cyan-500 to-pink-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getCategoryColor(event.category)}`}>
                {event.category || "General"}
              </span>
              <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${creatorRole === "admin" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                {creatorRole === "admin" ? "Admin Event (A)" : "User Event (U)"}
              </span>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <Link to={`/edit/${event.id}`}>
                  <button className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-all flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                </Link>
              )}
              <button
                onClick={() => navigate("/home")}
                className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-all flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back</span>
              </button>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mt-4">{event.title}</h1>
          {event.createdBy && (
            <p className="text-white/90 text-sm mt-1">Created by: {event.createdBy}</p>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Event Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Date Card */}
            <div className="soft-gradient-panel rounded-xl p-4 flex items-center space-x-3 border border-white/70">
              <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-semibold text-gray-800">{event.date || "Not specified"}</p>
              </div>
            </div>

            {/* Time Card */}
            <div className="soft-gradient-panel rounded-xl p-4 flex items-center space-x-3 border border-white/70">
              <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-semibold text-gray-800">{event.time || "Not specified"}</p>
              </div>
            </div>

            {/* Location Card */}
            <div className="soft-gradient-panel rounded-xl p-4 flex items-center space-x-3 border border-white/70">
              <div className="bg-green-100 p-3 rounded-lg text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-semibold text-gray-800">{event.location || "Not specified"}</p>
              </div>
            </div>
          </div>

          {/* Capacity Info Card */}
          {hasCapacityLimit && (
            <div className={`rounded-xl p-4 mb-6 ${isFull ? "bg-red-50 border border-red-200" : "soft-gradient-panel border border-white/70"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${isFull ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Capacity</p>
                    <p className={`font-semibold ${isFull ? "text-red-800" : "text-gray-800"}`}>
                      {attendeeCount} / {maxAttendees} attendees
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {isFull ? (
                    <span className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                      Event Full
                    </span>
                  ) : spotsLeft <= 5 ? (
                    <span className="px-3 py-1 bg-yellow-500 text-white text-sm font-medium rounded-full">
                      {spotsLeft} spots left
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      {spotsLeft} spots available
                    </span>
                  )}
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${isFull ? "bg-red-500" : "bg-blue-500"}`}
                  style={{ width: `${Math.min((attendeeCount / maxAttendees) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Description Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span>About this Event</span>
            </h2>
            <div className="bg-white/70 border border-slate-200/70 rounded-xl p-4">
              <p className="text-gray-600 leading-relaxed">
                {event.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* Attendees Section */}
          <div>
            {canViewAttendeeList ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <h2 className="text-xl font-bold gradient-text flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Attendees</span>
                    <span className="text-sm font-normal text-gray-500">({attendeeCount})</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {userRole === "admin" && notGoingCount > 0 && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                        Not Going: {notGoingCount}
                      </span>
                    )}
                    {userStatus && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        userStatus === "going"
                          ? "bg-green-100 text-green-800"
                          : userStatus === "maybe"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}>
                        You are: {userStatus === "going" ? "Going" : userStatus === "maybe" ? "Maybe" : "Not Going"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setAttendeeFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-w-[88px] ${
                      attendeeFilter === "all"
                        ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setAttendeeFilter("going")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 min-w-[88px] ${
                      attendeeFilter === "going"
                        ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Going</span>
                  </button>
                  <button
                    onClick={() => setAttendeeFilter("maybe")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 min-w-[88px] ${
                      attendeeFilter === "maybe"
                        ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Maybe</span>
                  </button>
                  {userRole === "admin" && (
                    <button
                      onClick={() => setAttendeeFilter("notgoing")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 min-w-[110px] ${
                        attendeeFilter === "notgoing"
                          ? "bg-gradient-to-r from-rose-500 to-red-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Not Going</span>
                    </button>
                  )}
                </div>

                <div className="bg-white/70 border border-slate-200/70 rounded-xl p-4">
                  {filteredAttendees.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {filteredAttendees.map((attendee, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1.5 rounded-full text-sm flex items-center space-x-2 ${
                            attendee.status === "going"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : attendee.status === "maybe"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{attendee.name}</span>
                          {attendee.status === "going" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : attendee.status === "maybe" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      {attendeeFilter === "all"
                        ? "No attendees yet. Be the first to RSVP!"
                        : attendeeFilter === "notgoing"
                          ? "No users marked Not Going."
                          : `No ${attendeeFilter} attendees yet.`}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
                Attendee list for admin-created events is visible to admins only.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;

