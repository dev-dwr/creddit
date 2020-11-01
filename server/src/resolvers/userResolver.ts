import argon2 from 'argon2';
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { getConnection } from 'typeorm';
import { v4 } from 'uuid';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants';
import { User } from '../entities/User';
import { MyContext } from '../types';
import { sendEmail } from '../utils/sendEmail';
import { throwAnError } from '../utils/throwAnError';
import { validateRegister } from '../utils/validateRegister';
import UsernamePasswordInput from './inputTypes/UsernamePasswordInput';
import UserResponse from './objectTypes/UserResponseTypes';


@Resolver()
export class UserResolver {
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

		await redis.del(key); //removes token so it cannot be used twice
		//login user after change password, //setting up the session
		req.session.userId = user.id;

		return { user };
	}

	@Mutation(() => Boolean)
	async forgotPassword(@Arg('email') email: string, @Ctx() { redis }: MyContext) {
		const user = await User.findOne({ where: { email } }); //because email is not primary key
		if (!user) {
			//the email is not in db
			return true;
		}
		const token = v4();
		redis.set(FORGET_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 24 * 3); // 3 days
		console.log(token);
		await sendEmail(email, `<a href="http://localhost:3000/change-password/${token}">reset password</a>`);
		return true;
	}

	@Query(() => User, { nullable: true })
	checkLoginUsers(@Ctx() { req }: MyContext) {
		if (!req.session.userId) {
			return null; //you are not login
		}
		return User.findOne({ where: { id: req.session.userId } });
	}

	@Mutation(() => UserResponse) //getting access to Fields inside UserResponse object schema
	async register(@Arg('options') options: UsernamePasswordInput, @Ctx() { req }: MyContext): Promise<UserResponse> {
		const errors = validateRegister(options);
		if (errors) {
			return { errors };
		}

		const hashedPassword = await argon2.hash(options.password);
		// const user = await User.create({username:options.username,
		// 	password: hashedPassword,
		// 	email:options.email})
		let user;
		try {
			//await user.save()
			const result = await getConnection()
				.createQueryBuilder()
				.insert()
				.into(User)
				.values({
					username: options.username,
					password: hashedPassword,
					email: options.email
				})
				.returning('*')
				.execute();
			user = result.raw[0];
		} catch (err) {
			if (err.code === '23505' || err.detail.includes('already exists')) {
				return throwAnError('username', 'username already taken');
			}
		}
		//store user id session
		//this will set a cookie on the user
		//keep them logged in
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
			return throwAnError('usernameOrEmail', 'username is not exists');
		}

		const validPassword = await argon2.verify(user.password, password);
		if (!validPassword) {
			return throwAnError('password', 'incorrect password');
		}

		//storing user id in Redis (default type of session has '?' means that it could be undefined)
		// store user id session
		// this will set a cookie on the user
		// keep them logged in
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
					console.log(err);
					resolve(false);
				}
				resolve(true);
			})
		);
	}
}
