import "reflect-metadata";
import microConfig from './mikro-orm.config';
import express from 'express';
import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import {ApolloServer} from 'apollo-server-express';
import {buildSchema} from 'type-graphql';
import { PostResolver } from './resolvers/postResolver';
import { UserResolver } from "./resolvers/userResolver";

const main = async () => {
    const app = express();
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up(); //runs migrations
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers:[PostResolver, UserResolver],
            validate: false 
        }),
        context: () => ({em: orm.em})  //context is an obj which is accessible by all resolvers
    });

    apolloServer.applyMiddleware({app});

    app.listen(4000, ()=>{
        console.log('server started on localhost:4000')
    })
    
  
};

main().catch((err) => {
	console.error(err);
});
