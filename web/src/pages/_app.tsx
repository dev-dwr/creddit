import { ThemeProvider, CSSReset } from '@chakra-ui/core';
import { Provider, createClient, dedupExchange, fetchExchange } from 'urql';
import { cacheExchange, Cache, QueryInput, query } from '@urql/exchange-graphcache';
import { Query } from '../generated/graphql';
import { RegisterMutation, LoginMutation, CheckLoginUsersDocument, CheckLoginUsersQuery } from '../generated/graphql';

//Properly casting the types
function betterUpdateQuery<Result, Query>(
	cache: Cache,
	queryInput: QueryInput,
	result: any,
	fn: (r: Result, q: Query) => Query
) {
	// data as any casting data type to be any
	return cache.updateQuery(queryInput, (data) => fn(result, data as any) as any);
}

const client = createClient({
	url: 'http://localhost:4000/graphql',
	exchanges: [
		dedupExchange,
		cacheExchange({
			updates: { // when login/register mutation will run, it will update the cache
				Mutation: {
					login: (_result, args, cache, info) => {
						betterUpdateQuery<LoginMutation, CheckLoginUsersQuery>( //specifically we are updating CheckLoginUsersQuery
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
		fetchExchange
	],
	fetchOptions: {
		credentials: 'include' //send the cookie
	}
});

const MyApp = ({ Component, pageProps }: any) => {
	return (
		<Provider value={client}>
			<ThemeProvider>
				<CSSReset />
				<Component {...pageProps} />
			</ThemeProvider>
		</Provider>
	);
};

export default MyApp;
