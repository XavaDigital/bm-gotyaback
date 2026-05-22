import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, required: true },
    action: { type: String, required: true },
    level: { type: String, required: true },
    userId: { type: String },
    userEmail: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    resourceType: { type: String },
    resourceId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    success: { type: Boolean, required: true },
    errorMessage: { type: String },
  },
  { timestamps: true },
);

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ level: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
