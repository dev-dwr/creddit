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
	ObjectType,
	Info,
	Args
} from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';
import { Updoot } from '../entities/Updoot';

@InputType()
class PostInput {
	@Field(() => String, { nullable: true })
	title: string;

	@Field(()=>String, {nullable:true}) text: string;
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
			//the user has voted on the post before
			//and they are changing their vote
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
		cursor: string | null,
		@Ctx() { req }: MyContext
	): Promise<PaginatedPosts> {
		//cursor is giving us position which will be our reference
		const realLimit = Math.min(50, limit);
		//fetching x + 1 posts that client asked to
		const realLimitPlusOne = realLimit + 1;

		const replacements: any[] = [ realLimitPlusOne ];
		if (req.session.userId) {
			replacements.push(req.session.userId);
		}
		let cursorIndex = 3;
		if (cursor) {
			replacements.push(new Date(parseInt(cursor)));
			cursorIndex = replacements.length;
		}
		const posts = await getConnection().query(
			`
			select p.*,
			json_build_object(
				'id', u.id,
				'username', u.username,
				'email', u.email,
				'createdAt', u."createdAt",
				'updatedAt', u."updatedAt"
			) author,
			${req.session.userId
				? '(select value from updoot where "userId" = $2 and "postId" = p.id) as "voteStatus"'
				: 'null as "voteStatus"'}
			from post as p
			inner join public.user as u on u.id = p."authorId"
			${cursor ? `where p."createdAt" < $${cursorIndex}` : ''}
			order by p."createdAt" DESC
			limit $1
		`,
			replacements
		);

		console.log('posts: ', posts);

		// const queryBuilder = getConnection()
		// 	.getRepository(Post)
		// 	.createQueryBuilder('p') // p - alias for post
		// 	.innerJoinAndSelect("p.author", "author", 'author.id = p."authorId"')
		// 	.orderBy('p."createdAt"', 'DESC')
		// 	.take(realLimitPlusOne);
		// if (cursor) {
		// 	//paging through items with createdAt as a reference
		// 	queryBuilder.where('p."createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) });
		// }
		//const posts = await queryBuilder.getMany();

		return { posts: posts.slice(0, realLimit), hasMore: posts.length === realLimitPlusOne };
	}

	@Query(() => Post, { nullable: true })
	post(
		@Arg('id', () => Int)
		id: number
	): Promise<Post | undefined> {
		return Post.findOne(id, { relations: [ 'author' ] });
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
		@Arg('id', () => Int) id: number,
		@Arg('options') options: PostInput,
		@Ctx() { req }: MyContext
	): Promise<Post | null> {
		const result = await getConnection()
		.createQueryBuilder()
		.update(Post)
		.set({title: options.title, text: options.text})
		.where('id = :id and "authorId" = :authorId', {id, authorId: req.session.userId})
		.returning("*")
		.execute()

		return result.raw[0]
	}

	@Mutation(() => Boolean)
	@UseMiddleware(isAuth) //check if you are logged in
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
			// do not have permission to delete
			throw new Error('not authorized');
		}
		await Updoot.delete({ postId: id });
		await Post.delete({ id: id });
		return true;
	}
}
