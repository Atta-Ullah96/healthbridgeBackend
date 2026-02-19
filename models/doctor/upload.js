import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema(
    {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "doctor",
        },



        fileName: {
            type: String,
            required: true,
        },

        s3Key: {
            type: String,
            required: true,
            unique: true,
        },

        contentType: {
            type: String,
            required: true,
        },

        size: {
            type: Number, // bytes
            required: true,
        },

        isUploading: {
            type: String,
        },
        purpose: {
            type: String,
            enum: ["profile_photo",
                "medical_license",
                "degree_certificate",
                "experience_certificate",]
        }
        ,
        isCompleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const UploadFile = mongoose.model("Upload", uploadSchema);
