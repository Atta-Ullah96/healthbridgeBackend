import { z } from "zod";

export const doctorRegistrationSchema = z.object({
  firstName: z.string().nonempty("First Name must be required").min(2, "First name should be 2 characters"),
  lastName: z.string().nonempty("Last Name must be required").min(2, "First name should be 2 characters"),
  medicalUniversity: z.string().nonempty("Medical University  must be required").min(1, "Medical university should be more than two characters"),
  specialization: z.string().nonempty("Specialization must be required").min(1, "Specialization is required"),
  phoneNumber: z.string().min(11, "Phone number must be at least  11  characters"),
  email: z.string().nonempty("Email should be required").email("Email is invalid"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  city: z.string().min(1, "City is required"),
  pmcNumber: z.string().min(1, "PMC number is required"),
  cnicNumber: z
    .string()
    .nonempty("CNIC number is required")
    .regex(/^\d{5}-\d{7}-\d{1}$/, "CNIC must be 00000-0000000-0 format")
    .transform(val => val.replace(/-/g, "")), // store clean CNIC,
  gender: z.string().min(1, "Gender is required"),
  pmcCertificate: z
  .any()
  .refine(file => !!file, { message: "PMC certificate is required" })
  .refine(
    file =>
      !file || // if file is null, skip this refine
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    { message: "PMC certificate must be a PDF or Word document" }
  )

});


export const doctorLogin = z.object({
  email: z.string().email("invalid Email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})



// Custom file validation for profile image
const fileSchema = z
  .object({
    originalname: z.string(),
    mimetype: z.string(),
    size: z.number(),
    filename: z.string(),
    path: z.string(),
  })
  .refine(
    (file) =>
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg",
    { message: "Profile image must be a JPG or PNG file" }
  )
  .refine((file) => file.size <= 2 * 1024 * 1024, {
    message: "Profile image must be less than 2MB",
  });

export const createGigSchema = z.object({
  serviceTitle: z
    .string()
    .min(3, "Service title must be at least 3 characters long"),


  description: z
    .string()
    .min(10, "Description must be at least 10 characters long"),

  consultationFee: z
    .string()
    .or(z.number())
    .transform((val) => Number(val))
    .refine((num) => num > 0, {
      message: "Consultation fee must be a positive number",
    }),

  duration: z
    .string()
    .regex(/^\d+$/, "Duration must be a number in minutes")
    .transform((val) => Number(val)),

  profileImage: fileSchema, // file input validation 💥
});


// for update gig schema 
export const updateGigSchema = createGigSchema.partial();



// availability for a doctors //

export const timeSlotSchema = z.object({
  startTime: z.string().nonempty("Start time is required"),
  endTime: z.string().nonempty("End time is required")
});

export const daySchema = z.object({
  day: z.enum([
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ]),
  isAvailable: z.boolean(),
  timeSlots: z.array(timeSlotSchema)
});

export const availabilitySchema = z.object({
  days: z.array(daySchema).nonempty("Days array cannot be empty")
});

// availability for a doctors //
