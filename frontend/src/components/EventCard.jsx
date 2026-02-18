import { Link } from "react-router-dom";

function EventCard({ event, handleRSVP, handleDeleteClick, currentUser, userRole }) {

  // Helper to normalize attendee data (backward compatibility)
  const normalizeAttendee = (attendee) => {
    if (typeof attendee === 'string') {
      return { name: attendee, status: 'going' };
    }
    return attendee;
  };

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

  // Calculate capacity info - exclude "notgoing" from count
  const goingAttendees = event.attendees?.filter(a => {
    const normalized = normalizeAttendee(a);
    return normalized.status !== 'notgoing';
  }) || [];
  const attendeeCount = goingAttendees.length;
  const maxAttendees = event.maxAttendees;
  const hasCapacityLimit = maxAttendees && maxAttendees > 0;
  const spotsLeft = hasCapacityLimit ? maxAttendees - attendeeCount : null;
  const isFull = hasCapacityLimit && spotsLeft <= 0;
  const creatorRole = event.createdByRole || (String(event.createdBy || "").toLowerCase() === "admin" ? "admin" : "user");
  const isAdmin = userRole === "admin";
  const isOwner = event.createdBy === currentUser;
  const canEdit = isAdmin || isOwner;
  const canDelete = isAdmin || isOwner;
  const cardToneClasses = creatorRole === "admin"
    ? "bg-gradient-to-br from-rose-50/90 via-white to-amber-50/80 border-rose-200/80 hover:border-rose-300 shadow-[0_14px_34px_-26px_rgba(244,63,94,0.55)]"
    : "bg-gradient-to-br from-sky-50/90 via-white to-cyan-50/80 border-cyan-200/80 hover:border-cyan-300 shadow-[0_14px_34px_-26px_rgba(14,165,233,0.5)]";
  const topBarClasses = creatorRole === "admin"
    ? "h-1 w-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400"
    : "h-1 w-full bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500";
  const currentUserStatus = (event.attendees || [])
    .map(normalizeAttendee)
    .find((a) => a.name === currentUser)?.status;

  const rsvpButtonClasses = (status) => {
    const base = "w-full rounded-md px-2 py-1.5 text-xs sm:text-sm font-semibold transition-all border";
    const isActive = currentUserStatus === status;

    const styles = {
      going: isActive
        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
        : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700",
      maybe: isActive
        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
        : "bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-700",
      notgoing: isActive
        ? "bg-rose-500 text-white border-rose-500 shadow-sm"
        : "bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-700",
    };

    return `${base} ${styles[status] || "bg-white text-gray-700 border-slate-200 hover:bg-slate-50"}`;
  };

  return (
    <div key={event.id} className={`rounded-2xl border transition-all duration-300 hover:shadow-[0_20px_38px_-26px_rgba(15,23,42,0.45)] overflow-hidden ${cardToneClasses}`}>
      <div className={topBarClasses}></div>
      <div className="p-5 sm:p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
              {event.category || "General"}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${creatorRole === "admin" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
              {creatorRole === "admin" ? "Admin Event (A)" : "User Event (U)"}
            </span>
          </div>
          {canDelete && (
            <button 
              onClick={() => handleDeleteClick(event.id)} 
              className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
              title="Delete event"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          
        </div>
        
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 leading-tight mb-1">{event.title}</h3>
        {event.createdBy && (
          <p className="text-xs text-slate-500 mb-3">Created by: {event.createdBy}</p>
        )}
        
        <div className="space-y-2.5 mb-4 text-sm">
          <div className="flex items-center text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{event.date} {event.time && `at ${event.time}`}</span>
          </div>
          <div className="flex items-center text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{event.location}</span>
          </div>
          <div className="flex items-center text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {hasCapacityLimit ? (
              <span className={isFull ? "text-red-500 font-medium" : ""}>
                {attendeeCount}/{maxAttendees} attendees
                {isFull ? " (Full)" : spotsLeft <= 5 && ` (${spotsLeft} spots left)`}
              </span>
            ) : (
              <span>{attendeeCount} attendee{attendeeCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {event.description && (
          <p className="text-slate-600 text-sm mb-4 line-clamp-2">{event.description}</p>
        )}
        
<div className="pt-3 mt-2 border-t border-slate-200/80 space-y-2">
          <div className={`grid gap-2 ${canEdit ? "grid-cols-2" : "grid-cols-1"}`}>
            <Link to={`/event/${event.id}`} className="w-full">
              <button className="w-full h-9 bg-white text-slate-700 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition-colors text-sm flex items-center justify-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                <span>View</span>
              </button>
            </Link>

            {canEdit && (
              <Link to={`/edit/${event.id}`} className="w-full">
                <button className="w-full h-9 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-lg font-semibold hover:bg-cyan-100 transition-colors text-sm flex items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  <span>Edit</span>
                </button>
              </Link>
            )}
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-white/75 p-1 grid grid-cols-3 gap-1">
            <button
              onClick={() => handleRSVP(event.id, 'going')}
              className={rsvpButtonClasses('going')}
            >
              <span>Going</span>
            </button>
            <button
              onClick={() => handleRSVP(event.id, 'maybe')}
              className={rsvpButtonClasses('maybe')}
            >
              <span>Maybe</span>
            </button>
            <button
              onClick={() => handleRSVP(event.id, 'notgoing')}
              className={rsvpButtonClasses('notgoing')}
            >
              <span>Not going</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventCard;


