import NextAuth from "next-auth/next"
import RedditProvider from "next-auth/providers/reddit"

export default NextAuth({
    // configure one or more authentification providers
    providers: [
        RedditProvider({
            clientId: process.env.REDDIT_CLIENT_ID,
            clientSecret: process.env.REDDIT_CLIENT_SECRET
        })
        // add More Providers
    ],
})