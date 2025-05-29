// frontend/src/app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

// Basic auth function (replace with your actual auth logic)
const auth = (req: Request) => ({ id: "fakeUserId" });

export const ourFileRouter = {
  avatarUploader: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const user = await auth(req); // Simulate getting a user
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id }; // Pass metadata to onUploadComplete
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Avatar uploaded by:", metadata.userId);
      console.log("File URL:", file.url);
      // This is returned to the client on successful upload
      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),

  postImageUploader: f({ image: { maxFileSize: "1MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Post image uploaded by:", metadata.userId);
      console.log("File URL:", file.url);
      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
} satisfies FileRouter; // `satisfies FileRouter` ensures your router adheres to the FileRouter type

export type OurFileRouter = typeof ourFileRouter; // Export the type of your router