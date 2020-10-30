import { MyContext } from '../types';
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver, Query } from 'type-graphql';
import { User } from '../entities/User';
import argon2 from 'argon2';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants';
import { validateRegister } from '../utils/validateRegister';
import { sendEmail } from '../utils/sendEmail';
import { v4 } from 'uuid';

@InputType()
class UsernamePasswordInput {
	@Field() username: string;
	@Field() password: string;
	@Field() email: string;
}

@ObjectType()
class FieldError {
	@Field() field: string;
	@Field() message: string;
}

//we can return from our mutations
@ObjectType()
class UserResponse {
	@Field(() => [ FieldError ], { nullable: true })
	errors?: FieldError[];

	@Field(() => User, { nullable: true })
	user?: User;
}

@Resolver()
export class UserResolver {
	@Mutation(() => UserResponse)
	async changePassword(
		@Arg('token') token: string,
		@Arg('newPassword') newPassword: string,
		@Ctx() { redis, em, req }: MyContext
	): Promise<UserResponse> {
		if (newPassword.length <= 2) {
			return {
				errors: [
					{
						field: 'newPassword', //name of our field in frontend
						message: 'length must be greater than 2'
					}
				]
			};
		}
		const key = FORGET_PASSWORD_PREFIX + token
		const userId = await redis.get(key); 
		if (!userId) {
			return{
				errors:[
					{
						field: "token",
						message:"token expired"
					}
				]
			}
		}

		const user = await em.findOne(User, {id: parseInt(userId)});

		if(!user){
			return{
				errors:[
					{
						field: "token",
						message:"user no longer exists"
					}
				]
			}
		}	
		const checkPasswordSimilarity = await argon2.verify(user.password, newPassword)
		if(checkPasswordSimilarity){
			return{
				errors:[
					{
						field: "newPassword",
						message:"this is your current password, change it"
					}
				]
			}
		}

		user.password = await argon2.hash(newPassword);
		em.persistAndFlush(user);

		await redis.del(key) //removes token so it cannot be used twice
		//login user after change password, //setting up the session
		req.session.userId = user.id;

		return {user};
	}

	@Mutation(() => Boolean)
	async forgotPassword(@Arg('email') email: string, @Ctx() { em, redis }: MyContext) {
		const user = await em.findOne(User, { email });
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
	async checkLoginUsers(@Ctx() { req, em }: MyContext): Promise<User | null> {
		if (!req.session.userId) {
			return null; //you are not login
		}
		const user = await em.findOne(User, { id: req.session.userId });
		return user;
	}

	@Mutation(() => UserResponse) //getting access to Fields inside UserResponse object schema
	async register(
		@Arg('options') options: UsernamePasswordInput,
		@Ctx() { em, req }: MyContext
	): Promise<UserResponse> {
		const errors = validateRegister(options);

		if (errors) {
			return { errors };
		}

		const hashedPassword = await argon2.hash(options.username);
		const user = em.create(User, { username: options.username, password: hashedPassword, email: options.email });
		console.log(user);
		try {
			await em.persistAndFlush(user);
		} catch (err) {
			if (err.code === '23505' || err.detail.includes('already exists')) {
				return {
					errors: [
						{
							field: 'username',
							message: 'username already taken'
						}
					]
				};
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
		@Ctx() { em, req }: MyContext
	): Promise<UserResponse> {
		const user = await em.findOne(
			User,
			usernameOrEmail.includes('@') ? { email: usernameOrEmail } : { username: usernameOrEmail }
		);
		if (!user) {
			return {
				errors: [
					{
						field: 'usernameOrEmail',
						message: 'username is not exists'
					}
				]
			};
		}

		const validPassword = await argon2.verify(user.password, password);
		if (!validPassword) {
			return {
				errors: [
					{
						field: 'password',
						message: 'incorrect password'
					}
				]
			};
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
