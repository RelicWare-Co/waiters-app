export default {
    providers: [
      {
        // @ts-ignore
        domain: process.env.VITE_CLERK_FRONTEND_API_URL,
        applicationID: "convex",
      },
    ]
  };