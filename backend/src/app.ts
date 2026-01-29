import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import { config } from "./config";
import { generalLimiter } from "./middleware/rate-limit.middleware";
import compression from "compression";
import { errorHandler, notFound } from "./middleware/error.middleware";
import { App } from "./constants/app";
import apiRouter from "./routes/index.routes";
import morgan from "morgan";
import path from "path";
import passport from "./config/passport";

// Import rute promo

// Import rute internal
import internalApiRouter from "./routes/internal-api.route";

const app = express();

// Helmet untuk mengatur berbagai header HTTP guna melindungi aplikasi dari kerentanan web yang umum.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
      },
    },
    // We are embedding cross-origin images from the dashboard domain, so allow resource policy to be cross-origin
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }),
);

// Konfigurasi CORS - Menangani Berbagi Sumber Daya Lintas-Origin
app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Metode HTTP yang diizinkan
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "ngrok-skip-browser-warning",
    ],
  }),
);

//Rate limiting untuk melindungi dari serangan brute-force dan penyalahgunaan
app.use(generalLimiter);

// Middleware pengurai body - Mengurai payload JSON dan URL-encoded
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Middleware untuk mengurai cookie
app.use(cookieParser());

// Session middleware for Passport
app.use(
  session({
    secret: config.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: !!config.COOKIES_DOMAIN,
      sameSite: !!config.COOKIES_DOMAIN ? "none" : "lax",
      domain: config.COOKIES_DOMAIN,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/",
    },
  }),
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(compression());

// Middleware logging permintaan (Morgan)
if (config.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Serve static files (uploaded images) with CORP header explicitly set
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(process.cwd(), "uploads")),
);
app.use("/", express.static(path.join(process.cwd(), "public")));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "success",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use(App.API_PREFIX, apiRouter);

app.use(`${App.API_PREFIX}/internal`, internalApiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
