// models/Settings.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document {
  allowedDomains: string[];
  exceptionEmails: string[];
}

const SettingsSchema: Schema<ISettings> = new Schema({
  allowedDomains: {
    type: [String],
    required: true,
    default: ["mawaridhi.com"], // You can add initial allowed domain here
  },
  exceptionEmails: {
    type: [String],
    required: true,
    default: ["m.abdullahx21@gmail.com"], 
  },
});

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);

export default Settings;
