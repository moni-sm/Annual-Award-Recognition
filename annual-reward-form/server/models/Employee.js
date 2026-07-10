import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  division: String, // ✅ Required
  name: String,
  empId: { type: String, unique: true },
  id: String,
  email: String,
  department: String,
  designation: String,
  role : String,
  doj: Date,
});
employeeSchema.pre("save", function (next) {
  if (!this.id && this.empId) {
    this.id = this.empId;
  }
  next();
});

export default mongoose.model("Employee", employeeSchema);
