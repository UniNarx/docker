// frontend/src/app/api/uploadthing/route.ts
import { createRouteHandler } from 'uploadthing/next'; // Or createNextRouteHandler if using Next.js App Router primarily
import { ourFileRouter } from "./core"; // Imports from the new core.ts

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});