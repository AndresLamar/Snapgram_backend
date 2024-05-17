import { Router } from 'express'
import { LoginController } from '../controllers/login.js'

export const createLoginRouter = ({ loginModel }) => {
  const loginRouter = Router()

  const loginController = new LoginController({ loginModel })

  loginRouter.post('/', loginController.login)

  return loginRouter
}
