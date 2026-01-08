import { z } from "zod";

// Safe input to prevent SQL/NoSQL injection
const safeString = z
  .string()
  .min(1, "Field is required")
  .max(100)
  .regex(/^[^$<>]*$/, "Invalid characters detected") // Blocks < > $ {}
  .transform((val) => val.trim());

const genderEnum = z.enum(["Male", "Female", "Other"]);

export const patientRegisterSchema = z.object({
  fullName: safeString,

  email: z.string().email("Invalid email format"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(40)
    .regex(/^[^$<>]*$/, "Invalid characters in password"),

  gender: genderEnum,

  age: z
    .number({
      required_error: "Age is required",
      invalid_type_error: "Age must be a number",
    })
    .int()
    .min(1, "Age must be at least 1")
    .max(110, "Age too high"),

  phone: z
    .string()
    .regex(/^\+?\d{10,15}$/, "Invalid phone number"),

  address: safeString,
});


  // register schema of paitent end here //


  export const patientloginSchema = z.object({
      email: z.string().email("Invalid email format"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(40)
    .regex(/^[^$<>]*$/, "Invalid characters in password")
  })