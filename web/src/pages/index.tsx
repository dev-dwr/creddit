import { Link, Stack, Box, Heading, Text, Flex, Button } from '@chakra-ui/core';
import { withUrqlClient } from 'next-urql';
import React from 'react';
import { Layout } from '../components/Layout';
import { usePostsQuery } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';
import NextLink from 'next/link';

const Index = () => {
	const [ { data, fetching } ] = usePostsQuery({
		variables: {
			limit: 10
		}
	});
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
					{data!.posts.map((p) => ( // by exclamation mark we are saying that {data} would never be undefined 
						<Box key={p.id} p={5} shadow="md" borderWidth="1px">
							<Heading fontSize="xl">{p.title}</Heading>
							<Text mt={4}>{p.textSnippet}</Text>
						</Box>
					))}
				</Stack>
			)}

			{data ? (
				<Flex>
					<Button isLoading ={fetching} m="auto" my={4}>
						load more
					</Button>
				</Flex>
			) : null}
		</Layout>
	);
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
