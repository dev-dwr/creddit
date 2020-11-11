import { Box, Button, Flex, Heading, Link } from '@chakra-ui/core';
import React from 'react';
import NextLink from 'next/link'
import { useCheckLoginUsersQuery, useLogoutMutation } from '../generated/graphql';
import { isServer } from '../utils/isServerSide';

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
    const [{fetching: logoutFetchingType}, logout] = useLogoutMutation();
    const [{data, fetching}] = useCheckLoginUsersQuery({
        pause: isServer()
    }); 

    let body = null;

    if(fetching){ 
      // data is loading
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
            <Flex align= "center">
               <Box color = "white" mt ={2}>{data.checkLoginUsers.username}</Box>
               <NextLink href="/create-post">
					<Button variantColor="teal" as={Link} ml={4}>
						create post
					</Button>
				</NextLink>
                <Button ml={5} 
                onClick = {()=> logout()}
                isLoading = {logoutFetchingType} 
                variantColor="green">Logout</Button>
            </Flex>
        )
    }
    
	return (
		<Flex zIndex={999} position="sticky" top={0} bg="tomato" p={4} align="center">
            <NextLink href ="/">
                <Link>
                    <Heading color="white">Creddit</Heading>
                </Link>
            </NextLink>
			<Box ml = {"auto"}>{body}</Box>
		</Flex>
	);
};
