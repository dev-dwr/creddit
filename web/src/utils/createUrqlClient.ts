import { cacheExchange } from '@urql/exchange-graphcache';
import  Router  from 'next/router';
import { dedupExchange, Exchange, fetchExchange } from 'urql';
import { pipe, tap } from 'wonka';
import {
	CheckLoginUsersDocument, CheckLoginUsersQuery,
	LoginMutation, LogoutMutation,
	RegisterMutation
} from '../generated/graphql';
import { betterUpdateQuery } from './betterUpdateQueryFunction';



//global error handling
const errorExchange:Exchange = ({forward}) => ops$ => {
	return pipe(forward(ops$), tap(({error}) =>{
		if(error?.message.includes("not authenticated")){
			Router.replace("/login")
		}
	}))
}


//const y = () => ({}) // returns an object
export const createUrqlClient = (ssrExchange: any) => ({
	url: 'http://localhost:4000/graphql',
	fetchOptions: {
		credentials: 'include' as const  //send the cookie
	},
	exchanges: [
        dedupExchange,
		cacheExchange({
			updates: {
				// when login/register/logout mutation will run, it will update the cache
				Mutation: {
					logout: (_result, args, cache, info) => {
						betterUpdateQuery<LogoutMutation, CheckLoginUsersQuery>(
							cache,
							{ query: CheckLoginUsersDocument },
							_result,
							() => ({checkLoginUsers: null})
						);
					},
					login: (_result, args, cache, info) => {
						//specifically we are updating CheckLoginUsersQuery
						betterUpdateQuery<LoginMutation, CheckLoginUsersQuery>(
							cache,
							{ query: CheckLoginUsersDocument },
							_result,
							(result, query) => {
								if (result.login.errors) {
									return query;
								} else {
									return {
										checkLoginUsers: result.login.user
									};
								}
							}
						);
					},
					register: (_result, args, cache, info) => {
						betterUpdateQuery<RegisterMutation, CheckLoginUsersQuery>(
							cache,
							{ query: CheckLoginUsersDocument },
							_result,
							(result, query) => {
								if (result.register.errors) {
									return query;
								} else {
									return {
										checkLoginUsers: result.register.user
									};
								}
							}
						);
					}
				}
			}
		}),
		errorExchange,
		ssrExchange,
        fetchExchange,
	],
	
});
