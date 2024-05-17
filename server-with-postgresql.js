import { createApp } from './app.js'

import { LoginModel } from './models/postgresql/login.js'
import { PostModel } from './models/postgresql/post.js'
import { UserModel } from './models/postgresql/user.js'
import { UploadModel } from './models/upload.js'

createApp({ userModel: UserModel, loginModel: LoginModel, postModel: PostModel, uploadModel: UploadModel })
  