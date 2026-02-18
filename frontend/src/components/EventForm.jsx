function EventForm({ formData, handleChange, handleSubmit, errors = {}, submitLabel = 'Save Event', heading }) {
  const inputClasses = (fieldName) => `
    w-full px-4 py-2.5 border rounded-xl bg-white/90 shadow-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all outline-none
    ${errors[fieldName] ? "border-red-500 bg-red-50/90" : "border-slate-300/80 hover:border-cyan-400/60"}
  `;

  const labelClasses = "block text-xs font-semibold tracking-wide uppercase text-slate-600 mb-1.5";
  const errorClasses = "text-red-500 text-xs mt-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {heading && (
        <div className="mb-2">
          <h2 className="text-3xl font-bold gradient-text">{heading}</h2>
          <p className="text-sm text-slate-500 mt-1">Fill out the details below to publish your event.</p>
        </div>
      )}

      <section className="rounded-2xl gradient-border soft-gradient-panel p-4 md:p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className={labelClasses}>
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              placeholder="Enter event title"
              value={formData.title || ''}
              onChange={handleChange}
              className={inputClasses('title')}
            />
            {errors.title && <p className={errorClasses}>{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="category" className={labelClasses}>
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category || ''}
              onChange={handleChange}
              className={inputClasses('category')}
            >
              <option value="">Select a category</option>
              <option value="Technology">Technology</option>
              <option value="Sports">Sports</option>
              <option value="Music">Music</option>
              <option value="Art">Art</option>
              <option value="Business">Business</option>
            </select>
            {errors.category && <p className={errorClasses}>{errors.category}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl gradient-border soft-gradient-panel p-4 md:p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className={labelClasses}>
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="date"
              type="date"
              name="date"
              value={formData.date || ''}
              onChange={handleChange}
              className={inputClasses('date')}
            />
            {errors.date && <p className={errorClasses}>{errors.date}</p>}
          </div>

          <div>
            <label htmlFor="time" className={labelClasses}>
              Time <span className="text-red-500">*</span>
            </label>
            <input
              id="time"
              type="time"
              name="time"
              value={formData.time || ''}
              onChange={handleChange}
              className={inputClasses('time')}
            />
            {errors.time && <p className={errorClasses}>{errors.time}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl gradient-border soft-gradient-panel p-4 md:p-5 shadow-sm space-y-4">
        <div>
          <label htmlFor="location" className={labelClasses}>
            Location <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input
              id="location"
              name="location"
              placeholder="Enter event location"
              value={formData.location || ''}
              onChange={handleChange}
              className={`${inputClasses('location')} pl-10`}
            />
          </div>
          {errors.location && <p className={errorClasses}>{errors.location}</p>}
        </div>

        <div>
          <label htmlFor="maxAttendees" className={labelClasses}>
            Maximum Attendees <span className="text-red-500">*</span>
          </label>
          <input
            id="maxAttendees"
            type="number"
            name="maxAttendees"
            min="1"
            placeholder="Enter maximum number of attendees"
            value={formData.maxAttendees || ''}
            onChange={handleChange}
            className={inputClasses('maxAttendees')}
          />
          {errors.maxAttendees && <p className={errorClasses}>{errors.maxAttendees}</p>}
          <p className="text-slate-500 text-xs mt-1">Leave empty or set to 0 for unlimited attendees</p>
        </div>
      </section>

      <section className="rounded-2xl gradient-border soft-gradient-panel p-4 md:p-5 shadow-sm">
        <div>
          <label htmlFor="description" className={labelClasses}>
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="Enter event description"
            value={formData.description || ''}
            onChange={handleChange}
            rows="5"
            className={inputClasses('description')}
          />
          {errors.description && <p className={errorClasses}>{errors.description}</p>}
        </div>
      </section>

      <div className="pt-1">
        <button
          type="submit"
          className="w-full btn-gradient px-6 py-3.5 rounded-xl font-semibold tracking-wide transition-all shadow-md flex items-center justify-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>{submitLabel}</span>
        </button>
      </div>
    </form>
  );
}

export default EventForm;
