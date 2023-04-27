import { IsEmail } from "class-validator";



export class UpdateUserDto {

    username:string;

    readonly email:string; 

    readonly bio: string;

    readonly avatar: string;

}