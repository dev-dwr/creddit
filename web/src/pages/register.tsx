import { Box, Button, FormControl, FormLabel, Input } from '@chakra-ui/core';
import { Formik, Form } from 'formik';
import React from 'react';
import { useMutation } from 'urql';
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';

interface registerProps {}

const REGISTER_MUTATION = `
mutation Register($username:String!, $password:String!){
    register(options:{username:$username, password: $password}){
      user{
        id
        username
      }
      errors{
        field
        message
      }
    }
  }
`;

const Register: React.FC<registerProps> = ({}) => {
	const [ {}, register ] = useMutation(REGISTER_MUTATION);
	return (
		<Wrapper variant="small">
			<Formik
				initialValues={{ username: '', password: '' }}
				onSubmit={(values) => {
					return register(values);
				}}
			>
				{({ isSubmitting }) => (
					<Form>
						<Box mt={4}>
							<InputField name="username" placeholder="username" label="Username" />
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

export default Register;
