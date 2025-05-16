import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

import Header from '../components/Header'

import TanStackQueryLayout from '../integrations/tanstack-query/layout.tsx'

import type { QueryClient } from '@tanstack/react-query'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <Header />

          <Outlet />
          <TanStackRouterDevtools />

          <TanStackQueryLayout />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </>
  ),
})
