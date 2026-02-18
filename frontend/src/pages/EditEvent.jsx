import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import EventForm from "../components/EventForm";

function EditEvent({ events, setEvents, currentUser, userRole, showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  const eventToEdit = events.find(e => e.id === Number(id));

  const [formData, setFormData] = useState(eventToEdit || {
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    category: "",
    attendees: [],
    maxAttendees: ""
  });


  useEffect(() => {
    const canEdit = userRole === "admin" || eventToEdit?.createdBy === currentUser;
    if (eventToEdit && !canEdit) {
      // prevent editing by users who do not own the event
      showToast?.("You don't have permission to edit this event", "error");
      navigate("/");
    }
  }, [eventToEdit, currentUser, userRole, navigate, showToast]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ""
      });
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
    if (!formData.maxAttendees || formData.maxAttendees < 1) newErrors.maxAttendees = "Maximum attendees is required";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const updated = events.map(event =>
      event.id === Number(id) ? formData : event
    );

    setEvents(updated);
    showToast?.("Event updated successfully!", "success");
    navigate("/");
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
