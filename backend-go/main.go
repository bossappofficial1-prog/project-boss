package main

import (
	"backend_go/config"
	"backend_go/routes"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	config.ConnectDatabase()
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()
	r.TrustedPlatform = gin.PlatformGoogleAppEngine
	r.TrustedPlatform = gin.PlatformCloudflare
	r.TrustedPlatform = gin.PlatformFlyIO
	r.Use(corsMiddleware())

	routes.SetupRoutes(r)
	if err := r.SetTrustedProxies(parseTrustedProxies(os.Getenv("CLIENT_IP"))); err != nil {
		log.Printf("Warning: gagal set trusted proxies: %v", err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "1235"
	}

	log.Printf("Server berjalan di port :%s", port)

	err := r.Run(":" + port)
	if err != nil {
		log.Fatal(err)
	}
}

func parseTrustedProxies(raw string) []string {
	parts := strings.Fields(strings.ReplaceAll(raw, ",", " "))
	if len(parts) == 0 {
		return nil
	}
	return parts
}

func allowedOrigins() map[string]struct{} {
	origins := make(map[string]struct{})

	for _, key := range []string{"ALLOWED_ORIGINS", "CLIENT_URL", "FRONTEND_URL"} {
		for _, origin := range strings.Split(os.Getenv(key), ",") {
			origin = strings.TrimSpace(origin)
			if origin != "" {
				origins[origin] = struct{}{}
			}
		}
	}

	return origins
}

func corsMiddleware() gin.HandlerFunc {
	allowed := allowedOrigins()

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" {
			if _, ok := allowed[origin]; ok {
				requestHeaders := c.GetHeader("Access-Control-Request-Headers")
				if requestHeaders == "" {
					requestHeaders = "Origin, Content-Type, Accept, Authorization, ngrok-skip-browser-warning"
				}

				requestMethod := c.GetHeader("Access-Control-Request-Method")
				if requestMethod == "" {
					requestMethod = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
				}

				c.Header("Access-Control-Allow-Origin", origin)
				c.Header("Vary", "Origin")
				c.Header("Vary", "Access-Control-Request-Headers")
				c.Header("Vary", "Access-Control-Request-Method")
				c.Header("Access-Control-Allow-Credentials", "true")
				c.Header("Access-Control-Allow-Headers", requestHeaders)
				c.Header("Access-Control-Allow-Methods", requestMethod)
			}
		}

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
