import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EventForm from "../components/EventForm";
import { createEventInApi } from "../services/eventsApi";

function CreateEvent({
  currentUserId,
  userRole,
  refreshEvents,
  showToast,
}) {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    category: "",
    maxAttendees: "",
  });

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

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.time) newErrors.time = "Time is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.category.trim()) newErrors.category = "Category is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";

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

    if (!currentUserId) {
      showToast?.("Unable to identify current user for event creation", "error");
      return;
    }

    try {
      await createEventInApi({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        date: formData.date,
        time: formData.time,
        category: formData.category,
        maxAttendees: normalizedMaxAttendees,
        creatorId: currentUserId,
      });

      const synced = await refreshEvents?.();
      if (!synced) {
        showToast?.("Event created, but refresh failed. Reload Home to sync.", "warning");
      } else {
        showToast?.(
          `Event "${formData.title}" created on ${formData.date} at ${formData.time}`,
          "success"
        );
      }
      navigate("/home");
    } catch (error) {
      showToast?.(error.message || "Failed to create event", "error");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-5">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase gradient-chip text-indigo-700">
          {userRole === "admin" ? "Admin Panel" : "User Panel"}
        </span>
      </div>
      <div className="surface-card gradient-border rounded-2xl shadow-lg p-5 md:p-7">
        <EventForm
          heading="Create New Event"
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          errors={errors}
          submitLabel="Create Event"
        />
      </div>
    </div>
  );
}

export default CreateEvent;
