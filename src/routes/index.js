import express from 'express';
import controller from '../controller/file.controller.js';

const router = express.Router();


let routes = (app) => {
  router.post("/upload", controller.uploadAndValidate, controller.fileDataEntriesProcessing);
  // ... other routes

  app.use(router);
};

export default routes;
