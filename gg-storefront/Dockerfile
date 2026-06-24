# syntax=docker/dockerfile:1
#
# Generic image for the Next.js apps in this pnpm Turborepo. Pick the app with the
# APP build arg (a workspace name): `storefront` or `admin`. Turbo builds the app's
# workspace deps (@gg/ui, @gg/auth, …) as part of the app build.
#
# Build context must be the gg-storefront root (so the whole workspace is available).
FROM node:22-alpine

RUN corepack enable
WORKDIR /app

ARG APP=storefront
# NEXT_PUBLIC_* values are inlined into the client bundle at BUILD time, so the Stripe
# publishable key (storefront checkout) must be present during `pnpm build`. Optional.
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
ENV NEXT_TELEMETRY_DISABLED=1

# Install against the committed lockfile (devDeps included — needed for the build),
# then build just this app. NODE_ENV stays unset here so devDeps install.
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter ${APP} build

ENV APP=${APP}
ENV NODE_ENV=production
# Each app's own `start` script sets its port (storefront 3000, admin 3002).
# next start binds 0.0.0.0 by default, so it's reachable across the compose network.
CMD pnpm --filter ${APP} start
