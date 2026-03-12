import mongoose from "mongoose";
import { CalendarEntry } from "./calendar.model.js";
import { AppError } from "../../lib/errors.js";

const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;

export const calendarService = {
  async listWeek(userId: string, startDate: Date, endDate: Date) {
    return CalendarEntry.find({
      userId: new mongoose.Types.ObjectId(userId),
      date: { $gte: startDate, $lte: endDate },
    })
      .populate("recipeId")
      .sort({ date: 1 })
      .lean();
  },

  async add(
    userId: string,
    recipeId: string,
    date: Date,
    mealType: (typeof mealTypes)[number]
  ) {
    return CalendarEntry.create({
      userId: new mongoose.Types.ObjectId(userId),
      recipeId: new mongoose.Types.ObjectId(recipeId),
      date,
      mealType,
    });
  },

  async remove(id: string, userId: string) {
    const entry = await CalendarEntry.findOne({ _id: id, userId: new mongoose.Types.ObjectId(userId) });
    if (!entry) throw new AppError("Calendar entry not found", 404, "NOT_FOUND");
    await CalendarEntry.deleteOne({ _id: id });
  },
};
