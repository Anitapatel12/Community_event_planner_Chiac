import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EventForm from "../components/EventForm";
import { updateEventInApi } from "../services/eventsApi";

function EditEvent({
  events,
  setEvents,
  currentUser,
  currentUserId,
  userRole,
  apiConnected,
  refreshEvents,
  showToast,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  const eventToEdit = events.find((event) => event.id === Number(id));
  const [formData, setFormData] = useState(
    eventToEdit || {
      title: "",
      date: "",
      time: "",
      location: "",
      description: "",
      category: "",
      attendees: [],
      maxAttendees: "",
    }
  );

  useEffect(() => {
    if (!eventToEdit) {
      showToast?.("Event not found", "error");
      navigate("/home");
      return;
    }

    const canEdit = userRole === "admin" || eventToEdit.createdBy === currentUser;
    if (!canEdit) {
      showToast?.("You don't have permission to edit this event", "error");
      navigate("/home");
    }
  }, [eventToEdit, currentUser, userRole, navigate, showToast]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (errors[e.target.name]) {
      setErrors((prev) => ({
        ...prev,
        [e.target.name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title?.trim()) newErrors.title = "Title is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.time) newErrors.time = "Time is required";
    if (!formData.location?.trim()) newErrors.location = "Location is required";
    if (!formData.category?.trim()) newErrors.category = "Category is required";
    if (!formData.description?.trim()) newErrors.description = "Description is required";
    if (formData.maxAttendees !== "") {
      const parsedCapacity = Number(formData.maxAttendees);
      if (Number.isNaN(parsedCapacity) || parsedCapacity < 0) {
        newErrors.maxAttendees = "Maximum attendees cannot be negative";
      }
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const normalizedMaxAttendees =
      formData.maxAttendees === "" ? "" : Number(formData.maxAttendees);

    if (apiConnected) {
      if (!currentUserId) {
        showToast?.("Unable to identify current user for event update", "error");
        return;
      }

      try {
        await updateEventInApi({
          id: Number(id),
          creatorId: currentUserId,
          requesterRole: userRole || "user",
          title: formData.title,
          description: formData.description,
          location: formData.location,
          date: formData.date,
          time: formData.time,
          category: formData.category,
          maxAttendees: normalizedMaxAttendees,
        });

        const synced = await refreshEvents?.();
        if (!synced) {
          setEvents((prevEvents) =>
            prevEvents.map((event) =>
              event.id === Number(id)
                ? { ...formData, id: Number(id), maxAttendees: normalizedMaxAttendees }
                : event
            )
          );
        }

        showToast?.("Event updated successfully!", "success");
        navigate("/home");
        return;
      } catch (error) {
        showToast?.(error.message || "Failed to update event", "error");
        return;
      }
    }

    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === Number(id)
          ? { ...formData, id: Number(id), maxAttendees: normalizedMaxAttendees }
          : event
      )
    );

    showToast?.("Event updated successfully!", "success");
    navigate("/home");
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-5">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase gradient-chip text-indigo-700">
          Edit Mode
        </span>
      </div>
      <div className="surface-card gradient-border rounded-2xl shadow-lg p-5 md:p-7">
        <EventForm
          heading="Edit Event"
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          errors={errors}
          submitLabel="Update Event"
        />
      </div>
    </div>
  );
}

export default EditEvent;
