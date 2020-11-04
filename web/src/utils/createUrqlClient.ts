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
	  const isInTheCache = cache.resolveFieldByKey(entityKey, fieldKey)
	  //as a true urql will think that we do not gave all the data so it will fetch remain data from the server
	  //if its not in the case we will return partial
	  info.partial = !isInTheCache 
	 
	  //combining data 
	  const result: string[] = []
	  fieldInfos.forEach(fi =>{ //looping in all elements we have in the list
		const data = cache.resolveFieldByKey(entityKey, fi.fieldKey) as string[]; //casting the value
		result.push(...data) //combining two arrays
	})
	  return result
	}
	
	//   const visited = new Set();
	//   let result: NullArray<string> = [];
	//   let prevOffset: number | null = null;
  
	//   for (let i = 0; i < size; i++) {
	// 	const { fieldKey, arguments: args } = fieldInfos[i];
	// 	if (args === null || !compareArgs(fieldArgs, args)) {
	// 	  continue;
	// 	}
  
	// 	const links = cache.resolveFieldByKey(entityKey, fieldKey) as string[];
	// 	const currentOffset = args[offsetArgument];
  
	// 	if (
	// 	  links === null ||
	// 	  links.length === 0 ||
	// 	  typeof currentOffset !== 'number'
	// 	) {
	// 	  continue;
	// 	}
  
	// 	if (!prevOffset || currentOffset > prevOffset) {
	// 	  for (let j = 0; j < links.length; j++) {
	// 		const link = links[j];
	// 		if (visited.has(link)) continue;
	// 		result.push(link);
	// 		visited.add(link);
	// 	  }
	// 	} else {
	// 	  const tempResult: NullArray<string> = [];
	// 	  for (let j = 0; j < links.length; j++) {
	// 		const link = links[j];
	// 		if (visited.has(link)) continue;
	// 		tempResult.push(link);
	// 		visited.add(link);
	// 	  }
	// 	  result = [...tempResult, ...result];
	// 	}
  
	// 	prevOffset = currentOffset;
	//   }
  
	//   const hasCurrentPage = cache.resolve(entityKey, fieldName, fieldArgs);
	//   if (hasCurrentPage) {
	// 	return result;
	//   } else if (!(info as any).store.schema) {
	// 	return undefined;
	//   } else {
	// 	info.partial = true;
	// 	return result;
	//   }
	// };
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
			resolvers:{
				Query:{
					posts: cursorPagination() //posts name match name in web graphql posts
				}
			},
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

