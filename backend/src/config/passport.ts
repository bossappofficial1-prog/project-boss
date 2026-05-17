import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { config } from '../config';
import { AuthService } from '../service/auth.service';

passport.use(
    new GoogleStrategy(
        {
            clientID: config.google.clientId,
            clientSecret: config.google.clientSecret,
            callbackURL: config.google.redirectUrl,
        },
        async (accessToken: string, refreshToken: string, profile: Profile, done: (error: any, user?: any) => void) => {
            try {
                const userProfile = {
                    googleId: profile.id,
                    email: profile.emails?.[0]?.value || '',
                    name: profile.displayName,
                    avatar: profile.photos?.[0]?.value,
                };

                const result = await AuthService.googleOAuth(userProfile);
                done(null, result);
            } catch (error) {
                done(error, null);
            }
        }
    )
);

passport.serializeUser((user: any, done: (error: any, id?: string) => void) => {
    done(null, user.user.id);
});

passport.deserializeUser(async (id: string, done: (error: any, user?: any) => void) => {
    try {
        // You might want to fetch user from database here
        done(null, { id });
    } catch (error) {
        done(error, null);
    }
});

export default passport;