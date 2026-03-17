package handler

import (
	"backend_go/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetHomeData(c *gin.Context) {
	homeData, err := service.GetHomeData(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    homeData,
		"success": true,
		"message": "OK",
	})
}
