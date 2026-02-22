import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import EventCard from "../components/EventCard";
import { deleteEventInApi, upsertRsvpInApi } from "../services/eventsApi";

function Home({
  events,
  currentUser,
  currentUserId,
  userRole,
  refreshEvents,
  showToast,
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, eventId: null });

  const handleRSVP = async (id, status) => {
    if (userRole === "admin") {
      showToast?.("Admins cannot RSVP to events", "warning");
      return;
    }

    if (!currentUser || !currentUserId) {
      showToast?.("Please log in to RSVP", "error");
      return;
    }

    try {
      await upsertRsvpInApi({ userId: currentUserId, eventId: id, status });
      const synced = await refreshEvents?.();
      if (!synced) {
        showToast?.(`RSVP saved as "${status}", but refresh failed.`, "warning");
        return;
      }
      showToast?.(`Successfully marked as "${status}"!`, "success");
    } catch (error) {
      showToast?.(error.message || "Failed to update RSVP", "error");
    }
  };

  const handleDeleteClick = (id) => {
    const eventToDelete = events.find((event) => event.id === id);
    const canDelete = userRole === "admin" || eventToDelete?.createdBy === currentUser;

    if (!canDelete) {
      showToast?.("You don't have permission to delete this event", "error");
      return;
    }

    setDeleteModal({ isOpen: true, eventId: id });
  };

  const handleDeleteConfirm = async () => {
    const eventToDelete = events.find((event) => event.id === deleteModal.eventId);
    const canDelete = userRole === "admin" || eventToDelete?.createdBy === currentUser;

    if (!canDelete) {
      showToast?.("You don't have permission to delete this event", "error");
      setDeleteModal({ isOpen: false, eventId: null });
      return;
    }

    if (!currentUserId) {
      showToast?.("User context missing for delete action", "error");
      setDeleteModal({ isOpen: false, eventId: null });
      return;
    }

    try {
      await deleteEventInApi({
        id: deleteModal.eventId,
        creatorId: currentUserId,
        requesterRole: userRole || "user",
      });
      const synced = await refreshEvents?.();
      if (!synced) {
        showToast?.("Event deleted, but refresh failed.", "warning");
      } else {
        showToast?.("Event deleted successfully!", "success");
      }
    } catch (error) {
      showToast?.(error.message || "Failed to delete event", "error");
    } finally {
      setDeleteModal({ isOpen: false, eventId: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, eventId: null });
  };

  useEffect(() => {
    if (!events || events.length === 0) return;

    const today = new Date().toISOString().split("T")[0];
    const todayEvents = events.filter((event) => event.date === today);

    if (todayEvents.length > 0) {
      showToast?.(`You have ${todayEvents.length} event(s) today!`, "info");
    }
  }, [events, showToast]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold gradient-text">All Events</h2>

        <Link to="/create">
          <button className="btn-gradient px-6 py-2.5 rounded-lg font-medium transition-all shadow-md flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Event</span>
          </button>
        </Link>
      </div>

      <div className="surface-card gradient-border soft-gradient-panel rounded-2xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              placeholder="Search events by title..."
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border border-slate-300/80 bg-white text-black placeholder-gray-500 p-2.5 rounded-xl w-full focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all outline-none"
            />
          </div>

          <div className="md:w-48 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <select
              onChange={(e) => setCategory(e.target.value)}
              className="pl-10 border border-slate-300/80 bg-white text-black placeholder-gray-500 p-2.5 rounded-xl w-full focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all outline-none"
            >
              <option value="">All Categories</option>
              <option value="Technology">Technology</option>
              <option value="Sports">Sports</option>
              <option value="Music">Music</option>
              <option value="Art">Art</option>
              <option value="Business">Business</option>
            </select>
          </div>

          <div className="md:w-52 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 border border-slate-300/80 bg-white text-black placeholder-gray-500 p-2.5 rounded-xl w-full focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {!events || events.length === 0 ? (
        <div className="surface-card gradient-border rounded-2xl text-center py-12 px-6">
          <div className="gradient-chip rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No events yet</h3>
          <p className="text-slate-500 mb-4">Create your first event to get started!</p>
          <Link to="/create">
            <button className="btn-gradient px-6 py-2.5 rounded-lg font-medium transition-all">
              Create Event
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events
            .filter((event) => event && event.title)
            .filter(
              (event) =>
                event.title.toLowerCase().includes(search.toLowerCase()) &&
                (category ? event.category === category : true) &&
                (date ? event.date === date : true)
            )
            .map((event) => (
              <EventCard
                key={event.id}
                event={event}
                handleRSVP={handleRSVP}
                handleDeleteClick={handleDeleteClick}
                currentUser={currentUser}
                userRole={userRole}
              />
            ))}
        </div>
      )}

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default Home;
