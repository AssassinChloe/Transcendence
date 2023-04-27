import { Controller, Post, Get, UseGuards, Request, Req, Res, Body, HttpCode } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { FortyTwoAuthGuard } from "../user/42auth.guard";
  
  @Controller("auth")
  export class AuthController {
    constructor(private authService: AuthService) {}
  }
  