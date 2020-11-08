import { Link, Stack, Box, Heading, Text, Flex, Button } from '@chakra-ui/core';
import { withUrqlClient } from 'next-urql';
import React, {useState} from 'react';
import { Layout } from '../components/Layout';
import { usePostsQuery } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';
import NextLink from 'next/link';

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
			<Flex align="center">
				<Heading mb={4}>Creddit</Heading>
				<NextLink href="/create-post">
					<Link p={4} ml="auto">
						create post
					</Link>
				</NextLink>
			</Flex>

			{!data && fetching ? (
				<div>loading...</div>
			) : (
				<Stack mb={4} spacing={8}>
					{data!.posts.posts.map((p) => ( // by exclamation mark we are saying that {data} would never be undefined 
						<Box key={p.id} p={5} shadow="md" borderWidth="1px">
							<Heading fontSize="xl">{p.title}</Heading>
							<Text>posted by {p.author.username}</Text>
							<Text mt={4}>{p.textSnippet}</Text>
						</Box>
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
