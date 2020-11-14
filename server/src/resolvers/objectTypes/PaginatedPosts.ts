import { Post } from "../../entities/Post";
import { ObjectType, Field } from "type-graphql";

@ObjectType()
class PaginatedPosts {
	@Field(() => [ Post ])
	posts: Post[];

	@Field() 
	hasMore: boolean;
}

export default PaginatedPosts;