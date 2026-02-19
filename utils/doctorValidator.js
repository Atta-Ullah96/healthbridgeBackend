import { z } from "zod";

export const doctorRegisterSchema = z.object({
  name: z.string().min(3, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
