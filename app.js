import express, { json } from "express"; // require -> commonJS
import { createUserRouter } from "./routes/users.js";
import { createLoginRouter } from "./routes/login.js";
import { createPostRouter } from "./routes/posts.js";
import { createUploadRouter } from "./routes/upload.js";
// import { corsMiddleware } from './middlewares/cors.js'
import cors from "cors";
import fileUpload from "express-fileupload";
import dotenv from "dotenv";

const PORT = process.env.PORT ?? 1234;

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

dotenv.config();
export const createApp = ({
  userModel,
  loginModel,
  postModel,
  uploadModel,
}) => {
  const app = express();
  app.use(json());
  app.use(cors());

  app.disable("x-powered-by");
  app.use(
    fileUpload({
      useTempFiles: true,
      tempFileDir: "./uploads",
      limits: { fileSize: 10 * 1024 * 1024 },
    })
  );

  app.use("/api/users", createUserRouter({ userModel }));
  app.use("/api/login", createLoginRouter({ loginModel }));
  app.use("/api/posts", createPostRouter({ postModel }));
  app.use("/api/upload", createUploadRouter({ uploadModel }));

  app.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
  });
};
