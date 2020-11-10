import { cacheExchange, Resolver } from '@urql/exchange-graphcache';
import  Router  from 'next/router';
import { dedupExchange, Exchange, fetchExchange, stringifyVariables } from 'urql';
import { pipe, tap } from 'wonka';
import {
	CheckLoginUsersDocument, CheckLoginUsersQuery,
	LoginMutation, LogoutMutation,
	RegisterMutation
} from '../generated/graphql';
import { betterUpdateQuery } from './betterUpdateQueryFunction';
import gql from 'graphql-tag';


//global error handling
const errorExchange:Exchange = ({forward}) => ops$ => {
	return pipe(forward(ops$), tap(({error}) =>{
		if(error?.message.includes("not authenticated")){
			Router.replace("/login")
		}
	}))
}

export const cursorPagination = (): Resolver => {
  
	return (_parent, fieldArgs, cache, info) => {
	  const { parentKey: entityKey, fieldName } = info;
  
	  const allFields = cache.inspectFields(entityKey);
	  const fieldInfos = allFields.filter(info => info.fieldName === fieldName);
	  const size = fieldInfos.length;
	  if (size === 0) {
		return undefined;
	  }

	  const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`
	  const isInTheCache = cache.resolve(cache.resolveFieldByKey(entityKey, fieldKey) as string, "posts")
	  //as a true urql will think that we do not gave all the data so it will fetch remain data from the server
	  //if its not in the case we will return partial
	  info.partial = !isInTheCache 
	  
	  let hasMore = true; 
	  //combining data 
	  const result: string[] = []
	  fieldInfos.forEach(fi =>{ //looping in all elements we have in the list
		const key = cache.resolveFieldByKey(entityKey, fi.fieldKey) as string;
		
		const _hasMore = cache.resolve(key, "hasMore")
		if(!_hasMore){
			hasMore = _hasMore as boolean;
		}
		const data = cache.resolve(key, "posts") as string[] //dealing with nested objects
		result.push(...data) //combining two arrays
	})
	  return {
		  __typename: 'PaginatedPosts',
		  posts:result,
		  hasMore: hasMore
	  }
	}
	
  };


//const y = () => ({}) // returns an object
export const createUrqlClient = (ssrExchange: any) => ({
	url: 'http://localhost:4000/graphql',
	fetchOptions: {
		credentials: 'include' as const  //send the cookie
	},
	exchanges: [
		dedupExchange,
		cacheExchange({
			keys:{
				PaginatedPosts: () => null
			},
			resolvers:{
				Query:{
					posts: cursorPagination() //posts name match name in web graphql posts
				}
			},
			updates: {
				// when login/register/logout mutation will run, it will update the cache
				Mutation: {
					vote: (_result, args, cache, info)=>{
						const data = cache.readFragment(gql`
						fragment _ on Post{
							id
							points
							voteStatus
						}
						`, {id: args.postId} as any)
						if(data){
							if(data.voteStatus === args.value){
								return;
							}
							const updatedPoints = (data.points as number)
							 + 
							 (!data.voteStatus ? 1 : 2) * (args.value as number)
							cache.writeFragment(
								gql`
									fragment __ on Post{
										points
										voteStatus
									}
								`,
								{id:args.postId, points: updatedPoints, voteStatus: args.value} as any
							)
						}
					},
					createPost: (_result, args, cache, info) =>{
						//logic: creating Post is sending posts to the database, on the client side
						//we are removing item from the cache thus this will re-fetch data from the cache 
						const allFields = cache.inspectFields("Query")
						const fieldInfos = allFields.filter(
							info => info.fieldName === "posts"
						)
						fieldInfos.forEach(fi =>{
							cache.invalidate("Query", "posts", fi.arguments || {});
						})
					},
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

