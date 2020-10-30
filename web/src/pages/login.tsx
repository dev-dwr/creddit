import { Box, Button, Text, Link, Flex } from '@chakra-ui/core';
import { Formik, Form } from 'formik';
import React from 'react';
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { useLoginMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import {useRouter} from 'next/router'
import { withUrqlClient } from 'next-urql';
import {createUrqlClient} from '../utils/createUrqlClient'
import NextLink from 'next/link'




const Login: React.FC<{}> = ({}) => {
	const [ {}, login ] = useLoginMutation();
	const router = useRouter();
	return (
		<Wrapper variant="small">
            <Text mt={2} fontSize="2xl" fontWeight="semibold" lineHeight="short">
               Login
             </Text>
			<Formik
				initialValues={{ usernameOrEmail: '', password: '' }}
				onSubmit={async (values, {setErrors}) => {
                    const response = await login(values);
                    
					if(response.data?.login.errors){
						setErrors(toErrorMap(response.data.login.errors))
					}else if(response.data?.login.user){
						//worked
						router.push("/");
					}
					console.log(response)
				}}
			>
				{({ isSubmitting }) => (
					<Form>
						<Box mt={4}>
							<InputField name="usernameOrEmail" 
							placeholder="Username or Email" label="Username Or Email" />
						</Box>
						<Box>
							<InputField name="password" placeholder="password" label="Password" type="password" />
						</Box>	
						<Button isLoading={isSubmitting} mt={4} type="submit" variantColor="teal">
							Login
						</Button>
						<Flex>
							<NextLink href ="/forgot-password">
									<Link ml={"auto"} style={{color:"blue"}}>
										forgot password?
									</Link>
							</NextLink>
						</Flex>
					</Form>
				)}
			</Formik>
		</Wrapper>
	);
};

export default withUrqlClient(createUrqlClient) (Login);
