import swaggerUi from 'swagger-ui-express'
import { Express } from "express"
import swaggerDocument from "../../docs/swagger.json"

const setupSwagger = (app: Express) => {
    app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};

export default setupSwagger;