import { Box, Button, Text } from '@chakra-ui/core';
import { Formik, Form } from 'formik';
import React from 'react';
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { useRegisterMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import {useRouter} from 'next/router'
import { withUrqlClient } from 'next-urql';
import {createUrqlClient} from '../utils/createUrqlClient'




const Register: React.FC<{}> = () => {

	const [ {}, register ] = useRegisterMutation();
	const router = useRouter();

	return (
		<Wrapper variant="small">
			 <Text mt={4} fontSize="2xl" fontWeight="semibold" lineHeight="short">
               Register 
             </Text>
			<Formik
				initialValues={{email:'', username: '', password: '' }}
				onSubmit={async (values, {setErrors}) => {

					const response = await register({options: values});

					if(response.data?.register.errors){
						setErrors(toErrorMap(response.data.register.errors))
					}else if(response.data?.register.user){
						//worked
						router.push("/");
					}
				}}>
					
				{({ isSubmitting }) => (
					<Form>
						<Box mt={4}>
							<InputField name="username" placeholder="username" label="Username" />
						</Box>
						<Box>
							<InputField name="email" placeholder="email" label="Email" />
						</Box>
						<InputField name="password" placeholder="password" label="Password" type="password" />
						<Button isLoading={isSubmitting} mt={4} type="submit" variantColor="teal">
							Register
						</Button>
					</Form>
				)}
			</Formik>
		</Wrapper>
	);
};

export default withUrqlClient(createUrqlClient) (Register);
