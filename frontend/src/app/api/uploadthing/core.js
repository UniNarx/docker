import { createUploadthing } from 'uploadthing/server';
const f = createUploadthing();

export const ourFileRouter = {
  avatarUploader: f({ image:{ maxFileSize:'2MB', maxFileCount:1 }})
    .middleware(() => ({ userId: 'demo-user' }))
    .onUploadComplete(({ file, metadata }) => {
      console.log('Avatar uploaded:', file.url);
    }),

  postImageUploader: f({ image:{ maxFileSize:'5MB', maxFileCount:1 }})
    .middleware(() => ({ userId: 'demo-user' }))
    .onUploadComplete(({ file }) => {
      console.log('Post image uploaded:', file.url);
    }),
};
