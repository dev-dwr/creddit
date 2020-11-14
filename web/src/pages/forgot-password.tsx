import { withUrqlClient } from 'next-urql';
import {createUrqlClient} from '../utils/createUrqlClient'
import { Box, Button,Text } from '@chakra-ui/core';
import { Formik, Form } from 'formik';
import React, { useState } from 'react'
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { useForgotPasswordMutation } from '../generated/graphql';




const forgotPassword: React.FC<{}> = () => {

    const [{}, forgotPassword] = useForgotPasswordMutation();
	const [complete, setComplete] = useState(false);
	
        return (
            <Wrapper variant="small">
			<Formik
				initialValues={{email: ''}}
				onSubmit={async (values) => {
                    await forgotPassword(values)
                    setComplete(true)
				}}
			>
				{({ isSubmitting }) => complete ? 
					<Box> if account with that email exists, we sent you an email</Box> 
					: (
                    <>
                    <Text mt={2} fontSize="2xl" fontWeight="semibold" lineHeight="short">
                                Forgot Password
                    </Text>
					<Form>
						<Box mt={4}>
							<InputField name="email" 
							placeholder="Email" label="Email" type="email"/>
						</Box>	
						<Button isLoading={isSubmitting} mt={4} type="submit" variantColor="teal">
							forgot password
						</Button>
					</Form>
                    </>
				)}
			</Formik>
		</Wrapper>
        );
}

export default withUrqlClient(createUrqlClient) (forgotPassword);