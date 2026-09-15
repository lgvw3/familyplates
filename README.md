# Family Plates!

This is a place to share and remember insights and ideas from family members about the Gospel of Jesus Christ. The current goal is to make it so that annotations can really easily be added to Book of Mormon verses.

Here are some of the ideas for that, thank you Kayla!

## Ideas for easy Annotation creation:

1. Search for chapter and verse to add it to on the home page
2. Search by text and have that pull in the chapter and verse to make an annotation
3. Super simple and intuitive adding when reading the Book of Mormon
4. Adding annotations not tied directly to a scripture

## Other objectives

1. Search annotations by fuzzy match in the text
2. Search by family member
3. Search by scripture

## Infrastructure objectives

1. Real time collaboration
2. Real time updates

## Update as of Jan 21, 2025

Real time updating happens on the feed and when reading thanks to the websocket that is powered with code in [this repo](https://github.com/lgvw3/familyPlatesWebSocketServer) have some things to fix but making progress!

## Couple days later

We also have real time likes and comments now!

## Authentication setup

Family Plates uses Better Auth with Google OAuth and the existing MongoDB database. Google identities are matched by normalized email address to the `familyMembers` collection. Each member keeps the same numeric `userId`, so existing annotations, comments, likes, bookmarks, profiles, and push subscriptions continue to belong to the right person.

1. Copy the authentication values from `.env.example` into `.env.local` and the corresponding production environment.
2. Generate separate long random values for `BETTER_AUTH_SECRET` and `REALTIME_AUTH_SECRET`. Put the same `REALTIME_AUTH_SECRET` in the websocket server environment.
3. Set `FAMILY_MEMBER_EMAILS_JSON` to a JSON object whose keys are the IDs in `lib/auth/accounts.ts`. A value can be one email or an array of accepted aliases.
4. Run `npm run seed:family-members`. This creates or updates the MongoDB member records and unique indexes. The app also upserts a configured email on first sign-in, but running the seed first makes access predictable.
5. In a personal Google Cloud project, configure the OAuth consent screen and create a **Web application** OAuth client. Add these authorized redirect URIs exactly:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-PRODUCTION-DOMAIN/api/auth/callback/google`
6. Store the resulting values as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Set `BETTER_AUTH_URL` to the matching origin only, with no trailing path (for example `https://YOUR-PRODUCTION-DOMAIN`).

The websocket server must be deployed before the updated client, because the client now sends a short-lived signed `ticket` instead of trusting a plain `userId` query parameter.
