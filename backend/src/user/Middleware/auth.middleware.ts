import { Injectable, NestMiddleware } from "@nestjs/common";
import { verify } from "jsonwebtoken";
import { NextFunction } from "express";
import { jwtConstants } from '../constants';
import { UserService } from "../../user/user.service";
import { ExpressRequest } from "../Interfaces/expressRequest.interface";

interface JWTinterface {
    id: number;
    username: string;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {

    constructor(private userService: UserService) { };
    async use(req: ExpressRequest, res: Response, next: NextFunction) {
        if (!req.headers.authorization) {
            req.user = null;
            next();
            return;
        }
        const token = req.headers.authorization.split(" ")[1];

        try
        {
            const decode = verify(token, jwtConstants.secret) as JWTinterface;
            const user = await this.userService.findUserByid(decode.id);
            req.user = user;
            next();
        }
        catch(err)
        {
            req.user = null;
            next();
        }
    }
}