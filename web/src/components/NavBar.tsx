import { Box, Button, Flex, Link, Text } from '@chakra-ui/core';
import React from 'react';
import NextLink from 'next/link'
import { useCheckLoginUsersQuery } from '../generated/graphql';

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
    const [{data, fetching}] = useCheckLoginUsersQuery();

    let body = null;
    if(fetching){ // data is loading
        body = null;
    }else if(!data?.checkLoginUsers){ //user not logged in
        body = (
            <>
                <NextLink href ="/login">
                        <Link color ="white" mr={4}>Login</Link>
                </NextLink>
        
                <NextLink href ="/register">
                        <Link color ="white" mr={4}>Register</Link>
                </NextLink>
            </>
        )
    }else{ // user is logged in
        body = (
            <Flex>
                <Text mt={1} fontSize="xl" color ="white" fontWeight="semibold" lineHeight="short" >
                    {data.checkLoginUsers.username}
                </Text>

                <Button ml={5} variantColor="green">Logout</Button>
            </Flex>
        )
    }
    
	return (
		<Flex bg="tomato" p={4}>
			<Box ml = {"auto"}>
                {body}
			</Box>
		</Flex>
	);
};
