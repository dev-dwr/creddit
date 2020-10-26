import 'reflect-metadata';
import microConfig from './mikro-orm.config';
import express from 'express';
import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { PostResolver } from './resolvers/postResolver';
import { UserResolver } from './resolvers/userResolver';
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from 'cors'
import { MyContext } from './types';

const main = async () => {
	const orm = await MikroORM.init(microConfig);
	await orm.getMigrator().up(); //runs migrations

	const app = express();

	const RedisStore = connectRedis(session);
	const redisClient = redis.createClient();

	app.use(cors({
		origin: "http://localhost:3000",
		credentials: true
	}))

	app.use(
		session({
			name: 'qid',
			store: new RedisStore({
				client: redisClient,
				disableTouch: true //Disables re-saving and resetting the TTL when using touch
			}),
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
				httpOnly: true, //security reason in frontend you cannot access the cookie
				secure: !__prod__, //cookie will only works in https
				sameSite: 'lax' //protecting csrf
			},
			saveUninitialized: false, // it will create session by default even if we do not store any data in it.
			secret: 'qwwtgrssghawrsgsdsghshgf',
			resave: false
		})
	);

	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [ PostResolver, UserResolver ],
			validate: false
		}),
		//req will access session
		//context is an obj which is accessible by all resolvers
		context: ({ req, res }): MyContext => <MyContext>{ em: orm.em, req, res }
	});

	apolloServer.applyMiddleware({ app, cors: false});

	app.listen(4000, () => {
		console.log('server started on localhost:4000');
	});
};

main().catch((err) => {
	console.error(err);
});
