import { Post } from '../entities/Post';
import {
	Resolver,
	Query,
	Arg,
	Mutation,
	InputType,
	Field,
	Ctx,
	UseMiddleware,
	Int,
	FieldResolver,
	Root,
	ObjectType
} from 'type-graphql';
import { MyContext } from 'src/types';
import { isAuth } from '../middleware/isAuth';
import { type } from 'os';
import { getConnection } from 'typeorm';
import { User } from 'src/entities/User';

@InputType()
class PostInput {
	@Field(() => String, { nullable: true })
	title: string;

	@Field() text: string;
}
@ObjectType()
class PaginatedPosts {
	@Field(() => [ Post ])
	posts: Post[];

	@Field() hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
	@FieldResolver(() => String) //provided from graphql
	textSnippet(
		//everytime we get Post obj textSnippet will call
		@Root() root: Post
	) {
		return root.text.slice(0, 100);
	}

	@Query(() => PaginatedPosts)
	async posts(
		@Arg('limit', () => Int)
		limit: number,
		@Arg('cursor', () => String, { nullable: true })
		cursor: string | null
	): Promise<PaginatedPosts> {
		//cursor is giving us position which will be our reference
		const realLimit = Math.min(50, limit);
		const realLimitPlusOne = realLimit + 1;
		//fetching x + 1 posts that client asked to
		const queryBuilder = getConnection()
			.getRepository(Post)
			.createQueryBuilder('p')
			.orderBy('"createdAt"', 'DESC')
			.take(realLimitPlusOne);
		if (cursor) {
			//paging through items with createdAt as a reference
			queryBuilder.where('"createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) });
		}
		const posts = await queryBuilder.getMany();

		return { posts: posts.slice(0, realLimit), hasMore: posts.length === realLimitPlusOne };
	}

	@Query(() => Post, { nullable: true })
	post(@Arg('id') id: number): Promise<Post | undefined> {
		return Post.findOne(id);
	}

	@Mutation(() => Post)
	@UseMiddleware(isAuth)
	async createPost(@Arg('options') options: PostInput, @Ctx() { req }: MyContext): Promise<Post> {
		const post = Post.create({
			...options,
			authorId: req.session.userId
		}).save();

		return post;
	}

	@Mutation(() => Post, { nullable: true })
	async updatePost(@Arg('id') id: number, @Arg('options') options: PostInput): Promise<Post | null> {
		const post = await Post.findOne({ where: { id } });
		if (!post) {
			return null;
		}
		if (typeof options.title !== undefined) {
			await Post.update(
				{ id },
				{
					title: options.title,
					text: options.text
				}
			);
		}
		return post;
	}

	@Mutation(() => Boolean)
	async deletePost(@Arg('id') id: number): Promise<boolean> {
		await Post.delete(id);
		return true;
	}
}
