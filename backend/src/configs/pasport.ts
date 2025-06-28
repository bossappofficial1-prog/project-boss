import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import { db } from "./database";
import { config } from "./config";
dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: config.GOOGLE_CLIENT_ID!,
            clientSecret: config.GOOGLE_CLIENT_SECRET!,
            callbackURL: `${config.BASE_URL}/api/v1/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) return done(new Error("Email tidak ditemukan di akun Google"));

                // Cari atau buat user
                let user = await db.user.findUnique({ where: { email } });

                if (!user) {
                    user = await db.user.create({
                        data: {
                            name: profile.displayName,
                            email: email,
                            role: "CUSTOMER",
                            avatar: profile.photos?.[0]?.value,
                            isVerified: true,
                            password: "google_auth"
                        },
                    });
                }

                return done(null, user);
            } catch (error) {
                done(error);
            }
        }
    )
);
