import { Request } from 'express';
import { UserType } from '../user.type';

export interface ExpressRequest extends Request {
    user?: UserType;
}