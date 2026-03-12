import mongoose from "mongoose";

const calendarEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true },
  date: { type: Date, required: true },
  mealType: { type: String, enum: ["breakfast", "lunch", "dinner", "snack"], required: true },
});

calendarEntrySchema.index({ userId: 1, date: 1 });

export const CalendarEntry = mongoose.model("CalendarEntry", calendarEntrySchema);
