import argon2 from 'argon2';
import { Arg, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql';
import { v4 } from 'uuid';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants';
import { User } from '../entities/User';
import { MyContext } from '../types';
import { sendEmail } from '../utils/sendEmail';
import { throwAnError } from '../utils/throwAnError';
import { validateRegister } from '../utils/validateRegister';
import UsernamePasswordInput from './inputTypes/UsernamePasswordInput';
import UserResponse from './objectTypes/UserResponseTypes';

@Resolver(User)
export class UserResolver {
	@FieldResolver(() => String)
	email(@Root() root: User, @Ctx() ctx: MyContext) {
		//verify user
		if (ctx.req.session.userId === root.id) {
			return root.email;
		}
		return '';
	}

	@Mutation(() => UserResponse)
	async changePassword(
		@Arg('token') token: string,
		@Arg('newPassword') newPassword: string,
		@Ctx() { redis, req }: MyContext
	): Promise<UserResponse> {
		if (newPassword.length <= 2) {
			return throwAnError('newPassword', 'length must be greater than 2');
		}

		const key = FORGET_PASSWORD_PREFIX + token;

		const userId = await redis.get(key);

		if (!userId) {
			return throwAnError('token', 'token expired');
		}

		const id = parseInt(userId);
		const user = await User.findOne(id);

		if (!user) {
			return throwAnError('token', 'user no longer exists');
		}

		const checkPasswordSimilarity = await argon2.verify(user.password, newPassword);

		if (checkPasswordSimilarity) {
			return throwAnError('newPassword', 'this is your current password, change it');
		}

		await User.update({ id: id }, { password: await argon2.hash(newPassword) }); //updated based on id

		//token cannot be used twice
		await redis.del(key);

		/* 
		login user after change password &&
		setting up the session
		*/
		req.session.userId = user.id;

		return { user };
	}

	@Mutation(() => Boolean)
	async forgotPassword(@Arg('email') email: string, @Ctx() { redis }: MyContext) {
		const user = await User.findOne({ where: { email } });

		if (!user) {
			//the email is not in db
			return true;
		}

		const token = v4();
		redis.set(FORGET_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 24 * 3); // 3 days

		await sendEmail(email, `<a href="http://localhost:3000/change-password/${token}">reset password</a>`);

		return true;
	}

	@Query(() => User, { nullable: true })
	checkLoginUsers(@Ctx() { req }: MyContext) {
		//you are not login
		if (!req.session.userId) {
			return null;
		}

		return User.findOne({ where: { id: req.session.userId } });
	}

	@Mutation(() => UserResponse)
	async register(@Arg('options') options: UsernamePasswordInput, @Ctx() { req }: MyContext): Promise<UserResponse> {
		
		const errors = validateRegister(options);

		if (errors) {
			return { errors };
		}

		const hashedPassword = await argon2.hash(options.password);

		const user = await User.create({
			username: options.username,
			password: hashedPassword,
			email: options.email
		});

		try {
			await user.save();
		} catch (err) {
			if (err.code === '23505' || err.detail.includes('already exists')) {
				return throwAnError('username', 'this username is already taken');
			}
		};

		/* 
		store user id session,
		this will set a cookie 
		keep them logged in
		*/

		req.session.userId = user.id;
		return { user };
	}

	@Mutation(() => UserResponse)
	async login(
		@Arg('usernameOrEmail') usernameOrEmail: string,
		@Arg('password') password: string,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {

		const user = await User.findOne(
			usernameOrEmail.includes('@')
				? { where: { email: usernameOrEmail } }
				: { where: { username: usernameOrEmail } }
		);

		if (!user) {
			return throwAnError('usernameOrEmail', 'username does not exist');
		}

		const validPassword = await argon2.verify(user.password, password);

		if (!validPassword) {
			return throwAnError('password', 'incorrect password');
		}

		// storing user id in Redis (default type of session has '?' means that it could be undefined)
		req.session.userId = user.id;

		return {
			user
		};
	}
	@Mutation(() => Boolean)
	logout(@Ctx() { req, res }: MyContext) {
		return new Promise((resolve) =>
			req.session.destroy((err) => {
				res.clearCookie(COOKIE_NAME);
				if (err) {
					resolve(false);
				}
				resolve(true);
			})
		);
	}
}
