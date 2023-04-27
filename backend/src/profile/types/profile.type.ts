import { UserType } from "../../user/user.type";

export type ProfileType = UserType & {following: boolean};