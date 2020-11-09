import { Button, Flex, Stack } from '@chakra-ui/core';
import { withUrqlClient } from 'next-urql';
import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Layout } from '../components/Layout';
import { Post } from '../components/Post';
import { usePostsQuery } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';
const Index = () => {
	//casting type of cursor means that it can be possibly a null type or string type
	const [variables, setVariables] = useState({limit:15, cursor:null as null | string})
	const [ { data, fetching } ] = usePostsQuery({
		variables
	});
	if(!fetching && !data){
		return <div>Query failed for some reason</div>
	}
	return (
		<Layout>
			<Header/>

			{!data && fetching ? (
				<div>loading...</div>
			) : (
				<Stack mb={4} spacing={8}>
					{data!.posts.posts.map((p) => ( // by exclamation mark we are saying that {data} would never be undefined 
						<Post post = {p} key={p.id}/>
					))}
				</Stack>
			)}

			{data && data.posts.hasMore ? (
				<Flex>
					<Button onClick={() =>{
						setVariables({
							limit: variables.limit,
							cursor: data.posts.posts[data.posts.posts.length -1].createdAt //last element in the list
						})
					}} isLoading ={fetching} m="auto" my={4}>
						load more
					</Button>
				</Flex>
			) : null}
		</Layout>
	);
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
