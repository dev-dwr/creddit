import { User } from "../../entities/User";
import { ObjectType, Field } from "type-graphql";

@ObjectType()
class FieldError {
	@Field() field: string;
	@Field() message: string;
}
@ObjectType()
class UserResponse {
	@Field(() => [ FieldError ], { nullable: true })
	errors?: FieldError[];

	@Field(() => User, { nullable: true })
	user?: User;
}

export default UserResponse;