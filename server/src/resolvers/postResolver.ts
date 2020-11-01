import { Post } from '../entities/Post';
import { Resolver, Query, Arg, Mutation, InputType, Field, Ctx, UseMiddleware } from 'type-graphql';
import { MyContext } from 'src/types';
import { isAuth } from '../middleware/isAuth';
import { type } from 'os';

@InputType()
class PostInput{
	
	@Field(()=> String, {nullable:true})
	title:string

	@Field()
	text:string
}

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
	@UseMiddleware(isAuth)
	async createPost(@Arg('options') options: PostInput,
		@Ctx() {req}: MyContext
	): Promise<Post> {
		const post = Post.create({
			...options,
			authorId: req.session.userId
		}).save();

		return post;
	}


	@Mutation(() => Post, { nullable: true })
	async updatePost(
		@Arg('id') id: number,
		@Arg('options') options: PostInput,
	): Promise<Post | null> {
		const post = await Post.findOne({where: {id}});
		if (!post) {
			return null;
		}
		if (typeof options.title !== undefined) {
			await Post.update({id}, {
				title: options.title,
				text: options.text
			});
		}
		return post;
	}


	@Mutation(() => Boolean)
	async deletePost(@Arg('id') id: number): Promise<boolean> {
		await Post.delete(id)
		return true;
	}
}
