package routes

import (
	"backend_go/handler"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	v1 := r.Group("/api/v1")
	{
		v1.GET("/home", handler.GetHomeData)
	}
}
