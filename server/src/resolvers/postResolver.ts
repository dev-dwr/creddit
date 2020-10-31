import { Post } from '../entities/Post';
import { MyContext } from '../types';
import { Resolver, Query, Ctx, Arg, Mutation } from 'type-graphql';



@Resolver()
export class PostResolver {
	@Query(() => [ Post ])
	posts(): Promise<Post[]> {
		return Post.find();
	}

	@Query(() => Post, { nullable: true })
	post(@Arg('id') id: number): Promise<Post | undefined> {
		return Post.findOne(id);
	}

	@Mutation(() => Post)
	async createPost(@Arg('title') title: string): Promise<Post> {
		const post = Post.create({title: title}).save();
		return post;
	}

	@Mutation(() => Post, { nullable: true })
	async updatePost(
		@Arg('id') id: number,
		@Arg('title', () => String, { nullable: true })
		title: string,
	): Promise<Post | null> {
		const post = await Post.findOne({where: {id}});
		if (!post) {
			return null;
		}
		if (typeof title !== undefined) {
			await Post.update({id}, {title});
		}
		return post;
	}

	@Mutation(() => Boolean)
	async deletePost(@Arg('id') id: number): Promise<boolean> {
		await Post.delete(id)
		return true;
	}
}
