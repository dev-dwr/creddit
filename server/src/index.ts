import 'reflect-metadata';
import express from 'express';
import { COOKIE_NAME, __prod__ } from './constants';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { PostResolver } from './resolvers/postResolver';
import { UserResolver } from './resolvers/userResolver';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from 'cors'
import { MyContext } from './types';
import {createConnection} from "typeorm"
import { Post } from './entities/Post';
import { User } from './entities/User';
import path from 'path'

const main = async () => {
	const connection = await createConnection({
		type:'postgres',
		database: 'creddit2',
		username:"postgres",
		password: "admin",
		migrations:[path.join(__dirname, "./migrations/*")], //current path + migration folder with everything in it
		logging: true, //sql sentences will showup in terminal
		synchronize: true, //create  tables without running migrations 
		entities: [Post, User]
	});
	await connection.runMigrations()

	//await orm.em.nativeDelete(User, {}) delete user from db
	//await orm.getMigrator().up(); //runs migrations

	const app = express();

	const RedisStore = connectRedis(session);
	const redis = new Redis();

	app.use(cors({
		origin: "http://localhost:3000",
		credentials: true
	}))

	app.use(
		session({
			name: COOKIE_NAME,
			store: new RedisStore({
				client: redis,
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
		context: ({ req, res }): MyContext => <MyContext>{req, res, redis }
	});

	apolloServer.applyMiddleware({ app, cors: false});

	app.listen(4000, () => {
		console.log('server started on localhost:4000');
	});
};

main().catch((err) => {
	console.error(err);
});
