import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common"
import { fromNodeHeaders } from "better-auth/node"
import type { Request } from "express"
import { auth } from "./auth"

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })

    if (!session || !session.user) {
      throw new UnauthorizedException()
    }

    req.session = session
    return true
  }
}
