import { PassportStrategy, } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-42";
import { Injectable } from "@nestjs/common";


@Injectable()
export class FortyTwoStrategy extends PassportStrategy(Strategy, '42') {
  constructor() {

    super(
    {
      clientID: process.env.FORTY_TWO_CLIENT_ID,
      clientSecret: process.env.FORTY_TWO_SECRET,
      callbackURL: 'http://' + process.env.ADDRESS + ':7001/user/42/callback',
    }, function validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
      )
      {
        const {id, emails, username, _json } = profile
        const user = {
        sub: id,
        email: emails[0].value,
              username: username,
        picture: _json.image.link,
        accessToken,
        refreshToken,
          }
      done(null, user);
      }
    )
  }

} export default FortyTwoStrategy;