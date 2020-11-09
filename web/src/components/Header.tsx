import { Flex, Heading, Link } from '@chakra-ui/core';
import React from 'react'
import NextLink from 'next/link';

export const Header: React.FC<{}> = ({}) => {
        return (
            <Flex align="center">
				<Heading mb={4}>Creddit</Heading>
				<NextLink href="/create-post">
					<Link p={4} ml="auto">
						create post
					</Link>
				</NextLink>
			</Flex>
        );
}