import { InputType, Field } from "type-graphql";

@InputType()
class PostInput {
	@Field(() => String, { nullable: true })
	title: string;

	@Field(() => String, { nullable: true })
	text: string;
}

export default PostInput;