const API = "/api";
let totalExpiredCleaned = 0;

const showToast = (message) => {
  const toast = $(`<div class="toast">${message}</div>`);
  $("body").append(toast);
  setTimeout(() => {
    toast.fadeOut(250, () => toast.remove());
  }, 1800);
};

const showSuccessModal = () => {
  $("#bookingSuccessModal").removeClass("hidden");
};

const animateToTimeline = () => {
  $("html, body").stop().animate({ scrollTop: $("#timelineSection").offset().top - 10 }, 700);
  $("#timelineSection").addClass("timeline-highlight");
  setTimeout(() => $("#timelineSection").removeClass("timeline-highlight"), 1300);
};

const toLocalInputDate = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const renderSlots = (slots) => {
  const available = slots.filter((s) => s.status === "available").length;
  const reserved = slots.filter((s) => s.status === "reserved").length;
  const occupied = slots.filter((s) => s.status === "occupied").length;

  $("#stats").html(`
    <span class="stat">Total: ${slots.length}</span>
    <span class="stat">Available: ${available}</span>
    <span class="stat">Reserved: ${reserved}</span>
    <span class="stat">Occupied: ${occupied}</span>
  `);

  $("#slotGrid").html(
    slots
      .map(
        (slot) => `
      <div class="slot ${slot.status}">
        <div><strong>${slot.slotNumber}</strong> (${slot.zone})</div>
        <div class="muted">Lvl ${slot.level} - Rs.${slot.hourlyRate}/hr</div>
        <div>Status: ${slot.status}</div>
      </div>
    `
      )
      .join("")
  );

  const options = slots
    .filter((s) => s.status === "available")
    .map((s) => `<option value="${s._id}">${s.slotNumber} | ${s.zone} | Rs.${s.hourlyRate}/hr</option>`)
    .join("");
  $("#slotSelect").html(options || "<option value=''>No available slots</option>");
};

const renderBookings = (bookings) => {
  const visibleBookings = bookings.filter((b) => b.status !== "completed");
  if (!visibleBookings.length) {
    $("#bookingList").html("<div class='item muted'>No bookings yet.</div>");
    return;
  }

  $("#bookingList").html(
    visibleBookings
      .map(
        (b) => `
      <div class="item">
        <div><strong>${b.customerName}</strong> - ${b.vehicleType.toUpperCase()} (${b.vehicleNumber})</div>
        <div class="muted">Slot: ${b.slot?.slotNumber || "N/A"} | ${new Date(b.startTime).toLocaleString()} to ${new Date(
          b.endTime
        ).toLocaleString()}</div>
        <div>Amount: Rs.${b.amount} | Status: ${b.status}</div>
        ${
          b.status === "active"
            ? `
              <button class="btn complete-btn" data-id="${b._id}" style="margin-top:8px;">Complete Booking</button>
              <button class="btn btn-danger cancel-btn" data-id="${b._id}" style="margin-top:8px;">Cancel Booking</button>
            `
            : ""
        }
      </div>
    `
      )
      .join("")
  );
};

const updateOwnerMetrics = async () => {
  const stats = await $.get(`${API}/bookings/stats`);
  $("#ownerRevenue").text(`Owner Revenue: Rs.${stats.totalRevenue}`);
};

const loadAll = async () => {
  const cleanup = await $.ajax({ url: `${API}/bookings/cleanup-expired`, method: "PATCH" });
  totalExpiredCleaned += cleanup.updated || 0;
  $("#cleanupBadge").text(`Expired Cleaned: ${totalExpiredCleaned}`);

  const [slots, bookings] = await Promise.all([$.get(`${API}/slots`), $.get(`${API}/bookings`)]);
  renderSlots(slots);
  renderBookings(bookings);
  await updateOwnerMetrics();
};

$(document).ready(async () => {
  const now = new Date();
  const after2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  $("#startTime").val(toLocalInputDate(now));
  $("#endTime").val(toLocalInputDate(after2Hours));

  try {
    await loadAll();
  } catch (err) {
    alert("Could not load data. Ensure MongoDB is running.");
  }

  setInterval(async () => {
    try {
      await loadAll();
    } catch (err) {
      // silent refresh failure
    }
  }, 30000);

  $("#seedBtn").on("click", async () => {
    try {
      await $.post(`${API}/slots/seed`);
      await loadAll();
      alert("Slots initialized.");
    } catch (err) {
      alert(err.responseJSON?.message || "Seed failed.");
    }
  });

  $("#bookingForm").on("submit", async (e) => {
    e.preventDefault();

    const payload = {
      customerName: $("#customerName").val().trim(),
      vehicleNumber: $("#vehicleNumber").val().trim(),
      vehicleType: $("#vehicleType").val(),
      slotId: $("#slotSelect").val(),
      startTime: $("#startTime").val(),
      endTime: $("#endTime").val()
    };

    try {
      await $.ajax({
        url: `${API}/bookings`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload)
      });
      $("#bookingForm")[0].reset();
      $("#startTime").val(toLocalInputDate(now));
      $("#endTime").val(toLocalInputDate(after2Hours));
      await loadAll();
      showToast("Booking created successfully.");
      animateToTimeline();
      setTimeout(showSuccessModal, 900);
    } catch (err) {
      alert(err.responseJSON?.message || "Booking failed.");
    }
  });

  $("#slotForm").on("submit", async (e) => {
    e.preventDefault();

    const amenities = [];
    if ($("#slotCovered").is(":checked")) amenities.push("covered");
    if ($("#slotCharging").is(":checked")) amenities.push("charging");

    const payload = {
      slotNumber: $("#slotNumber").val().trim().toUpperCase(),
      zone: $("#slotZone").val(),
      level: Number($("#slotLevel").val()),
      hourlyRate: Number($("#slotRate").val()),
      amenities
    };

    try {
      await $.ajax({
        url: `${API}/slots`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload)
      });
      $("#slotForm")[0].reset();
      await loadAll();
      showToast("New slot added.");
    } catch (err) {
      alert(err.responseJSON?.message || "Could not add slot.");
    }
  });

  $("#bookingList").on("click", ".complete-btn", async function handleCompleteClick() {
    const id = $(this).data("id");
    try {
      await $.ajax({ url: `${API}/bookings/${id}/complete`, method: "PATCH" });
      await loadAll();
      showToast("Booking completed.");
    } catch (err) {
      alert("Could not complete booking.");
    }
  });

  $("#bookingList").on("click", ".cancel-btn", async function handleCancelClick() {
    const id = $(this).data("id");
    try {
      await $.ajax({ url: `${API}/bookings/${id}/cancel`, method: "PATCH" });
      await loadAll();
      showToast("Booking cancelled.");
    } catch (err) {
      alert(err.responseJSON?.message || "Could not cancel booking.");
    }
  });

  $("#closeSuccessModal").on("click", () => {
    $("#bookingSuccessModal").addClass("hidden");
  });

  $("#bookingSuccessModal").on("click", (e) => {
    if (e.target.id === "bookingSuccessModal") {
      $("#bookingSuccessModal").addClass("hidden");
    }
  });

  $("#aiForm").on("submit", async (e) => {
    e.preventDefault();
    const payload = {
      vehicleType: $("#aiVehicleType").val(),
      budgetPerHour: Number($("#aiBudget").val()),
      wantsCovered: $("#aiCovered").is(":checked")
    };

    try {
      const results = await $.ajax({
        url: `${API}/slots/ai-recommendations`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload)
      });

      $("#aiResults").html(
        results
          .map(
            (r) => `
          <div class="item">
            <div><strong>${r.slotNumber}</strong> | Score: ${r.aiScore}</div>
            <div class="muted">${r.recommendationReason}</div>
            <div>Zone ${r.zone}, Level ${r.level}, Rs.${r.hourlyRate}/hr</div>
          </div>
        `
          )
          .join("")
      );
    } catch (err) {
      alert("AI recommendations failed.");
    }
  });
});
