import { UserEntity } from './Entities/user.entity';

export type UserType = Omit<UserEntity,  'hashPassword'>;
