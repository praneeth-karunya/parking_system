const buildSlotScore = (slot, preference) => {
  let score = 50;

  if (slot.zone === "VIP") score += 25;
  if (preference.vehicleType === "ev" && slot.amenities.includes("charging")) score += 20;
  if (preference.wantsCovered && slot.amenities.includes("covered")) score += 15;
  if (preference.budgetPerHour >= slot.hourlyRate) score += 10;
  score += Math.max(0, 10 - slot.level);

  return score;
};

const recommendSlots = (slots, preference) => {
  return slots
    .map((slot) => ({
      ...slot.toObject(),
      aiScore: buildSlotScore(slot, preference),
      recommendationReason:
        preference.vehicleType === "ev" && slot.amenities.includes("charging")
          ? "Best for EV with charging support"
          : slot.zone === "VIP"
            ? "Premium slot with better access"
            : "Balanced cost and accessibility"
    }))
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 5);
};

module.exports = { recommendSlots };
