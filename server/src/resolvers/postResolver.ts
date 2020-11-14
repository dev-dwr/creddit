import { Post } from '../entities/Post';
import {
	Resolver,
	Query,
	Arg,
	Mutation,
	Ctx,
	UseMiddleware,
	Int,
	FieldResolver,
	Root
} from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';
import { Updoot } from '../entities/Updoot';
import { User } from '../entities/User';

import PaginatedPosts from './objectTypes/PaginatedPosts'
import PostInput from './inputTypes/PostInput';


@Resolver(Post)
export class PostResolver {

	@FieldResolver(() => String) 
	textSnippet(@Root() root: Post) {
		return root.text.slice(0, 100);
	}

	@FieldResolver(() => User)
	author(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
		return userLoader.load(post.authorId);
	}

	@FieldResolver(() => Int, { nullable: true })
	async voteStatus(@Root() post: Post, @Ctx() { updootLoader, req }: MyContext) {
		if(!req.session.userId){
			return null;
		}
		const updoot = await updootLoader.load({ postId: post.id, userId: req.session.userId });
		return updoot ? updoot.value : null;
	}

	
	@Mutation(() => Boolean)
	@UseMiddleware(isAuth)
	async vote(
		@Arg('postId', () => Int)
		postId: number,
		@Arg('value', () => Int)
		value: number,
		@Ctx() { req }: MyContext
	) {

		const isUpdoot = value !== -1;

		const realValue = isUpdoot ? 1 : -1;

		const { userId } = req.session;

		const updoot = await Updoot.findOne({ where: { postId, userId } });

		if (updoot && updoot.value !== realValue) {
			/*
			the user has voted on the post before
			and they are changing their vote
			*/
			await getConnection().query(`
				START TRANSACTION;
				
				update updoot 
				set value = ${realValue}
				where "postId" = ${postId} and "userId" = ${userId} ;
				
				update post
				set points = points + ${realValue * 2}
				where id = ${postId};

				COMMIT;	
			`);
		} else if (!updoot) {
			//has never vote before
			await getConnection().query(`
				START TRANSACTION;

				insert into updoot ("userId", "postId", value)
				values (${userId},${postId},${realValue});
				
				update post
				set points = points + ${realValue}
				where id = ${postId};

				COMMIT;
			`);
		}

		return true;
	}

	@Query(() => PaginatedPosts)
	async posts(
		@Arg('limit', () => Int)
		limit: number,
		@Arg('cursor', () => String, { nullable: true })
		cursor: string | null
	): Promise<PaginatedPosts> {
		
		const realLimit = Math.min(50, limit);

		const realLimitPlusOne = realLimit + 1;

		const replacements: any[] = [ realLimitPlusOne ];

		if (cursor) {
			replacements.push(new Date(parseInt(cursor)));
		}
		const posts = await getConnection().query(
			`
			select p.* from post as p
			${cursor ? `where p."createdAt" < $2` : ''}
			order by p."createdAt" DESC
			limit $1
		`,
			replacements
		);

		return { posts: posts.slice(0, realLimit), hasMore: posts.length === realLimitPlusOne };
	}

	@Query(() => Post, { nullable: true })
	post(
		@Arg('id', () => Int)
		id: number
	): Promise<Post | undefined> {
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
	@UseMiddleware(isAuth)
	async updatePost(
		@Arg('id', () => Int)
		id: number,
		@Arg('options') options: PostInput,
		@Ctx() { req }: MyContext
	): Promise<Post | null> {
		const result = await getConnection()
			.createQueryBuilder()
			.update(Post)
			.set({ title: options.title, text: options.text })
			.where('id = :id and "authorId" = :authorId', { id, authorId: req.session.userId })
			.returning('*')
			.execute();

		return result.raw[0];
	}

	@Mutation(() => Boolean)
	@UseMiddleware(isAuth) 
	async deletePost(
		@Arg('id', () => Int)
		id: number,
		@Ctx() { req }: MyContext
	): Promise<boolean> {
		
		//NOT CASCADE WAY
		const post = await Post.findOne({ where: { id: id } });
		
		if (!post) {
			return false;
		}
		
		if (post.authorId !== req.session.userId) {
			throw new Error('not authorized');
		}

		await Updoot.delete({ postId: id });
		await Post.delete({ id: id });
		return true;
	}
}
