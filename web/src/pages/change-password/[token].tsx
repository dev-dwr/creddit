import { NextPage } from 'next';
import { Box, Button, Flex, Link, Text } from '@chakra-ui/core';
import { Formik, Form } from 'formik';
import React from 'react';
import { InputField } from '../../components/InputField';
import { Wrapper } from '../../components/Wrapper';
import { useChangePasswordMutation } from '../../generated/graphql';
import { toErrorMap } from '../../utils/toErrorMap';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { createUrqlClient } from '../../utils/createUrqlClient';
import { withUrqlClient } from 'next-urql';
import NextLink from 'next/link'



const ChangePassword: NextPage = () => {
    const [{}, changePassword] = useChangePasswordMutation();
    const router = useRouter();
    const [tokenErr, setTokenErr] = useState("");

    return (
        <Wrapper variant="small">
            <Text mt={2} fontSize="2xl" fontWeight="semibold" lineHeight="short">
                Change Password
             </Text>
			<Formik
				initialValues={{newPassword: ""}}
				onSubmit={async (values, {setErrors}) => {
                    const response = await changePassword({
                        newPassword: values.newPassword,
                        token: typeof router.query.token === 'string' ? router.query.token : ''
                    });
                    if(response.data?.changePassword.errors){
                        const errorMap = toErrorMap(response.data.changePassword.errors)
                        console.log(errorMap)
                        if('token' in errorMap){
                            setTokenErr(errorMap.token)
                        }
                        setErrors(errorMap)
                    }else if(response.data?.changePassword.user){
                        router.push("/")
                    }
				}}
			>
				{({ isSubmitting }) => (
					<Form>
						<Box mt={4}>
							<InputField name="newPassword" 
							placeholder="new password" label="New Password" 
                            type="password"
                            />

                        {tokenErr ? (
                        <Flex>
                            <Box mr={4} style={{color: "red"}}>{tokenErr}</Box>
                            <NextLink href ="/forgot-password">
                                <Link style={{color:"blue"}}>
                                    click here to get new password
                                </Link>
                            </NextLink>
                        </Flex>
                        ) 
                            : null
                        }
						</Box>
						<Button isLoading={isSubmitting} mt={4} type="submit" variantColor="teal">
							Change Password
						</Button>
					</Form>
				)}
			</Formik>
		</Wrapper>
    );
}

//allows us to get any query parameter and pass it to Function Component
// ChangePassword.getInitialProps = ({query}) => {
//     return{
//         token: query.token as string //casting this parameter
//     }
// }

export default withUrqlClient(createUrqlClient) (ChangePassword);