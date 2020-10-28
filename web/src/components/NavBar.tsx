import { Box, Button, Flex, Link } from '@chakra-ui/core';
import React from 'react';
import NextLink from 'next/link'
import { useCheckLoginUsersQuery, useLogoutMutation } from '../generated/graphql';
import { isServer } from '../utils/isServerSide';

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
    const [{fetching: logoutFetchingType}, logout] = useLogoutMutation();
    const [{data, fetching}] = useCheckLoginUsersQuery({
        pause: isServer()
    }); //{pause: isServer()}

    let body = null;

    if(fetching){ // data is loading
        //body = null;
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
               <Box color = "white" mt ={2}>{data.checkLoginUsers.username}</Box>
                <Button ml={5} 
                onClick = {()=> logout()}
                isLoading = {logoutFetchingType} 
                variantColor="green">Logout</Button>
            </Flex>
        )
    }
    
	return (
		<Flex bg="tomato" p={4}>
			<Box ml = {"auto"}>{body}</Box>
		</Flex>
	);
};
